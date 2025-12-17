const { app, BrowserWindow, ipcMain, shell, dialog, net, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { createTray } = require('./tray.cjs'); 
const { autoUpdater } = require("electron-updater");
const log = require('electron-log');

// --- 1. CONFIGURATION ---
log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.allowPrerelease = false; 
autoUpdater.fullChangelog = false;

// --- 2. LAZY LOAD DEPENDENCIES ---
const loadPdf = () => require('pdf-parse');
const loadCheerio = () => require('cheerio');
const loadGit = () => require('simple-git');

// Global References
let mainWindow;
let tray = null;
let aiRequestQueue = [];
let isProcessingAI = false;

// --- 3. FILE SYSTEM PATHS ---
const getUserDataPath = () => app.getPath('userData');
const getSessionsPath = () => path.join(getUserDataPath(), 'sessions');
const getProjectsPath = () => path.join(getUserDataPath(), 'projects');
const getCachePath = () => path.join(getProjectsPath(), 'cache');
const getGeneratedFilesPath = () => path.join(getUserDataPath(), 'generated-files');
const getSettingsPath = () => path.join(getUserDataPath(), 'settings.json');
const getCalendarPath = () => path.join(getUserDataPath(), 'calendar.json');

// Ensure directories exist
[getSessionsPath(), getProjectsPath(), getCachePath(), getGeneratedFilesPath()].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Default Settings
const DEFAULT_SETTINGS = {
  ollamaUrl: "http://127.0.0.1:11434",
  defaultModel: "", 
  contextLength: 8192,
  temperature: 0.3,
  systemPrompt: "",
  developerMode: false,
  fontSize: 14,
  chatDensity: 'comfortable'
};

// --- 4. WINDOW MANAGEMENT ---
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#030304',
    show: false,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'ultra-dark',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL("http://localhost:5173/");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { 
    shell.openExternal(url); 
    return { action: 'deny' }; 
  });
  
  return mainWindow;
}

// --- 5. UPDATER LOGIC ---
function setupUpdater() {
  ipcMain.on('check-for-updates', () => {
    if (!app.isPackaged) {
      mainWindow?.webContents.send('update-message', { 
        status: 'not-available', 
        text: 'Updater disabled in Developer Mode' 
      });
      return;
    }
    autoUpdater.checkForUpdates();
  });

  ipcMain.on('download-update', async () => {
    try {
      log.info("User requested download...");
      await autoUpdater.downloadUpdate();
    } catch (err) {
      log.error("Download Error:", err);
      mainWindow?.webContents.send('update-message', { 
        status: 'error', 
        text: 'Download failed. Check internet.' 
      });
    }
  });

  ipcMain.on('quit-and-install', () => { 
    autoUpdater.quitAndInstall(true, true); 
  });

  autoUpdater.on('checking-for-update', () => 
    mainWindow?.webContents.send('update-message', { 
      status: 'checking', 
      text: 'Checking for updates...' 
    })
  );
  
  autoUpdater.on('update-available', (info) => {
    log.info("Update available:", info);
    mainWindow?.webContents.send('update-message', { 
      status: 'available', 
      text: `Version ${info.version} is available!`, 
      version: info.version 
    });
  });

  autoUpdater.on('update-not-available', () => 
    mainWindow?.webContents.send('update-message', { 
      status: 'not-available', 
      text: 'You are on the latest version.' 
    })
  );
  
  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents.send('update-message', { 
      status: 'downloading', 
      text: `Downloading... ${Math.round(progressObj.percent)}%`, 
      progress: progressObj.percent 
    });
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-message', { 
      status: 'downloaded', 
      text: 'Update ready. Click to restart.' 
    });
  });
  
  autoUpdater.on('error', (err) => {
    log.error("Updater Error:", err);
    
    if (!app.isPackaged) {
      mainWindow?.webContents.send('update-message', { 
        status: 'not-available', 
        text: 'Dev Mode: Updater Disabled' 
      });
    } else {
      mainWindow?.webContents.send('update-message', { 
        status: 'error', 
        text: `Update Error: ${err.message || "Unknown error"}` 
      });
    }
  });
}

// --- 6. PRODUCTION-READY FILE READING (MEMORY SAFE) ---
async function readProjectFiles(projectFiles) {
  const MAX_CONTEXT_CHARS = 100000;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  let currentChars = 0;
  
  let context = "--- PROJECT FILES ---\n";
  projectFiles.slice(0, 50).forEach(f => { 
    context += `- ${f.name}\n`; 
  });
  context += "\n--- CONTENT ---\n";
  currentChars += context.length;

  // Process files in priority order
  const sortedFiles = [...projectFiles].sort((a, b) => {
    const priority = { js: 3, jsx: 3, ts: 3, tsx: 3, py: 3, md: 2, txt: 1 };
    return (priority[b.type] || 0) - (priority[a.type] || 0);
  });

  for (const file of sortedFiles.slice(0, 30)) {
    if (currentChars >= MAX_CONTEXT_CHARS) {
      context += `\n[Note: ${sortedFiles.length - sortedFiles.indexOf(file)} files omitted]\n`;
      break;
    }

    try {
      // Skip web URLs
      if (file.type === 'url') {
        const filePath = path.join(getCachePath(), file.cacheFile);
        if (fs.existsSync(filePath)) {
          const stats = await fs.promises.stat(filePath);
          if (stats.size > MAX_FILE_SIZE) continue;
          
          let content = await fs.promises.readFile(filePath, 'utf-8');
          if (content.length > 3000) {
            content = content.slice(0, 3000) + "\n...[Truncated]...";
          }
          const entry = `\n>>> ${file.name}\n${content}\n`;
          if (currentChars + entry.length < MAX_CONTEXT_CHARS) {
            context += entry;
            currentChars += entry.length;
          }
        }
        continue;
      }

      if (!fs.existsSync(file.path)) continue;
      
      const stats = await fs.promises.stat(file.path);
      if (stats.size > MAX_FILE_SIZE) {
        console.warn(`Skipping large file: ${file.name}`);
        continue;
      }
      
      let fileContent = "";
      
      // Handle PDFs
      if (file.path.toLowerCase().endsWith('.pdf')) {
        try {
          const pdf = loadPdf();
          const dataBuffer = await fs.promises.readFile(file.path);
          const data = await pdf(dataBuffer);
          fileContent = data.text;
        } catch (pdfErr) {
          console.warn(`PDF parse error: ${file.name}`);
          continue;
        }
      } 
      // Handle text files
      else if (!['png','jpg','jpeg','gif','exe','bin','zip','iso','dll','dmg','mp4','mp3'].includes(
        file.type.toLowerCase()
      )) {
        fileContent = await fs.promises.readFile(file.path, 'utf-8');
        
        // Check for binary
        if (fileContent.indexOf('\0') !== -1) continue;
      }

      if (fileContent && fileContent.trim()) {
        // Smart truncation
        if (fileContent.length > 8000) {
          const head = fileContent.slice(0, 4000);
          const tail = fileContent.slice(-2000);
          fileContent = `${head}\n... [truncated] ...\n${tail}`;
        }
        
        const entry = `\n>>> ${file.name}\n${fileContent}\n`;
        if (currentChars + entry.length < MAX_CONTEXT_CHARS) {
          context += entry;
          currentChars += entry.length;
        } else {
          break;
        }
      }
    } catch (e) { 
      console.warn(`Read error: ${file.name}`, e.message); 
    }
  }

  console.log(`📄 Context: ${currentChars} chars, ${projectFiles.length} files`);
  return context;
}

// --- 7. HELPER: RECURSIVE SCAN ---
async function scanDirectory(dirPath, fileList = []) {
  try {
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build', '.next', '.vscode', '__pycache__'].includes(file.name)) {
          await scanDirectory(fullPath, fileList);
        }
      } else {
        if (!['.DS_Store', 'package-lock.json', '.gitignore'].includes(file.name)) {
          fileList.push({ 
            path: fullPath, 
            name: file.name, 
            type: path.extname(file.name).substring(1) 
          });
        }
      }
    }
  } catch (e) {
    console.warn('Scan error:', e.message);
  }
  return fileList;
}

// --- 8. HELPER: GIT HANDLER ---
const gitHandler = {
  async getStatus(rootPath) { 
    try { 
      if (!rootPath || !fs.existsSync(path.join(rootPath, '.git'))) return null; 
      const git = loadGit()(rootPath); 
      const status = await git.status(); 
      return { 
        current: status.current, 
        modified: status.modified, 
        staged: status.staged, 
        clean: status.isClean() 
      }; 
    } catch (e) { 
      return null; 
    } 
  },
  async getDiff(rootPath) { 
    try { 
      if (!rootPath) return ""; 
      const git = loadGit()(rootPath); 
      let diff = await git.diff(['--staged']); 
      if (!diff) diff = await git.diff(); 
      return diff.slice(0, 10000);
    } catch (e) { 
      return ""; 
    } 
  }
};

// --- 9. AI REQUEST QUEUE ---
async function processAIQueue() {
  if (isProcessingAI || aiRequestQueue.length === 0) return;
  
  isProcessingAI = true;
  const request = aiRequestQueue.shift();
  
  try {
    await handleAIRequest(request);
  } catch (error) {
    console.error('AI error:', error);
    mainWindow?.webContents.send('ollama:error', error.message);
  }
  
  isProcessingAI = false;
  
  if (aiRequestQueue.length > 0) {
    setTimeout(() => processAIQueue(), 100);
  }
}

async function handleAIRequest(request) {
  const { event, params } = request;
  const { prompt, model, contextFiles, systemPrompt, settings, images } = params;
  
  const config = settings || DEFAULT_SETTINGS;
  let baseUrl = (config.ollamaUrl || "http://127.0.0.1:11434")
    .replace(/\/$/, '')
    .replace('localhost', '127.0.0.1');
  let selectedModel = model || config.defaultModel;
  
  if (!selectedModel) { 
    try { 
      const r = await fetch(`${baseUrl}/api/tags`); 
      const d = await r.json(); 
      if (d.models?.length) selectedModel = d.models[0].name; 
    } catch (e) { 
      throw new Error("No AI models found."); 
    } 
  }
  
  // Build context
  const contextStr = contextFiles?.length > 0 
    ? await readProjectFiles(contextFiles) 
    : "";
  
  let fullPrompt = prompt;
  if (contextStr) {
    fullPrompt = `${contextStr}\n\n${fullPrompt}`;
  }
  
  const finalSystem = `${config.developerMode ? "You are Brainless Forge, an expert engineer." : "You are Brainless Nexus, a research assistant."}\n${systemPrompt || ""}`; 
  
  const req = net.request({ 
    method: 'POST', 
    url: `${baseUrl}/api/generate`,
    timeout: 300000
  }); 
  
  req.setHeader('Content-Type', 'application/json'); 
  
  req.on('response', (res) => { 
    res.on('data', (chunk) => { 
      const lines = chunk.toString().split('\n'); 
      for (const line of lines) { 
        if (!line.trim()) continue; 
        try { 
          const json = JSON.parse(line); 
          if (json.response) {
            mainWindow?.webContents.send('ollama:chunk', json.response);
          }
          if (json.done) {
            mainWindow?.webContents.send('ollama:chunk', '[DONE]');
          }
        } catch (e) {} 
      } 
    }); 
    
    res.on('error', (e) => {
      mainWindow?.webContents.send('ollama:error', e.message);
    }); 
  }); 
  
  req.on('error', (e) => {
    mainWindow?.webContents.send('ollama:error', "AI Connection Failed");
  }); 
  
  const requestBody = { 
    model: selectedModel, 
    prompt: `[SYSTEM] ${finalSystem}\n\n[USER] ${fullPrompt}`, 
    stream: true, 
    options: { 
      num_ctx: Math.min(config.contextLength || 8192, 32768),
      temperature: config.temperature || 0.3
    } 
  };
  
  if (images && images.length > 0) {
    requestBody.images = images;
  }
  
  req.write(JSON.stringify(requestBody)); 
  req.end();
}

// --- 10. APP INITIALIZATION ---
app.whenReady().then(() => {
  createWindow();
  tray = createTray(mainWindow);
  
  setupUpdater();
  
  console.log('✅ Brainless initialized - Pure live context mode');
  
  // GLOBAL SHORTCUT
  try {
    globalShortcut.register('Alt+Space', () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('cmd-bar:toggle');
      }
    });
  } catch (e) { 
    console.warn("Could not register Alt+Space"); 
  }
  
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  // ==========================================
  // SETTINGS
  // ==========================================
  
  ipcMain.handle('settings:load', async () => { 
    try { 
      if (fs.existsSync(getSettingsPath())) {
        const data = await fs.promises.readFile(getSettingsPath(), 'utf-8');
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) }; 
      }
    } catch (e) {
      console.error('Settings load error:', e);
    } 
    return DEFAULT_SETTINGS; 
  });

  ipcMain.handle('settings:save', async (e, settings) => { 
    try {
      await fs.promises.writeFile(
        getSettingsPath(), 
        JSON.stringify(settings, null, 2)
      ); 
      return true;
    } catch (error) {
      console.error('Settings save error:', error);
      return false;
    }
  });

  // ==========================================
  // SYSTEM
  // ==========================================
  
  ipcMain.handle('system:factory-reset', async () => { 
    try { 
      const del = async (d) => { 
        if (fs.existsSync(d)) { 
          const files = await fs.promises.readdir(d);
          for (const f of files) { 
            const c = path.join(d, f); 
            const stats = await fs.promises.lstat(c);
            if (stats.isDirectory()) {
              await fs.promises.rm(c, { recursive: true, force: true }); 
            } else {
              await fs.promises.unlink(c); 
            }
          } 
        } 
      }; 
      
      await del(getSessionsPath()); 
      await del(getProjectsPath()); 
      await fs.promises.writeFile(
        getSettingsPath(), 
        JSON.stringify(DEFAULT_SETTINGS, null, 2)
      ); 
      
      return true; 
    } catch (e) { 
      console.error('Factory reset error:', e);
      return false; 
    } 
  });
  
  ipcMain.handle('system:delete-chats', async () => { 
    try { 
      const sessionsPath = getSessionsPath(); 
      if (fs.existsSync(sessionsPath)) { 
        const files = await fs.promises.readdir(sessionsPath); 
        for (const f of files) { 
          if (f.endsWith('.json')) {
            await fs.promises.unlink(path.join(sessionsPath, f)); 
          }
        } 
      } 
      return true; 
    } catch (e) { 
      console.error('Delete chats error:', e); 
      return false; 
    } 
  });

  ipcMain.handle('system:delete-cache', async () => { 
    try { 
      const cachePath = getCachePath(); 
      if (fs.existsSync(cachePath)) { 
        const files = await fs.promises.readdir(cachePath); 
        for (const f of files) { 
          await fs.promises.unlink(path.join(cachePath, f)); 
        } 
      } 
      return true; 
    } catch (e) { 
      console.error('Delete cache error:', e); 
      return false; 
    } 
  });

  ipcMain.handle('system:delete-calendar', async () => { 
    try { 
      const calendarPath = getCalendarPath(); 
      if (fs.existsSync(calendarPath)) { 
        await fs.promises.unlink(calendarPath); 
      } 
      return true; 
    } catch (e) { 
      console.error('Delete calendar error:', e); 
      return false; 
    } 
  });
  
  // ==========================================
  // FILE OPERATIONS
  // ==========================================
  
  ipcMain.handle('system:save-file', async (e, { content, filename }) => { 
    try {
      const { filePath } = await dialog.showSaveDialog(mainWindow, { 
        defaultPath: filename || 'zenith-draft.md', 
        filters: [ 
          { name: 'Markdown', extensions: ['md'] }, 
          { name: 'Text', extensions: ['txt'] }, 
          { name: 'All Files', extensions: ['*'] } 
        ] 
      }); 
      
      if (filePath) { 
        await fs.promises.writeFile(filePath, content, 'utf-8'); 
        return true; 
      } 
      return false;
    } catch (error) {
      console.error('Save file error:', error);
      return false;
    }
  });

  ipcMain.handle('system:save-generated-file', async (e, { content, filename }) => {
    try {
      const filePath = path.join(getGeneratedFilesPath(), filename);
      await fs.promises.writeFile(filePath, content, 'utf-8');
      return true;
    } catch (error) {
      console.error('Save generated file error:', error);
      throw error;
    }
  });

  ipcMain.handle('system:read-file', async (e, filename) => {
    try {
      const filePath = path.join(getGeneratedFilesPath(), filename);
      
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }
      
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error('Read file error:', error);
      throw error;
    }
  });

  ipcMain.handle('system:list-files', async (e, directory) => {
    try {
      const targetDir = directory || getGeneratedFilesPath();
      if (!fs.existsSync(targetDir)) {
        return [];
      }
      
      const files = await fs.promises.readdir(targetDir);
      const fileList = [];
      
      for (const filename of files) {
        if (filename.endsWith('.meta.json')) continue;
        
        const filePath = path.join(targetDir, filename);
        const stats = await fs.promises.stat(filePath);
        
        fileList.push({
          name: filename,
          path: filePath,
          size: stats.size,
          modified: stats.mtime,
          created: stats.birthtime
        });
      }
      
      return fileList;
    } catch (error) {
      console.error('List files error:', error);
      return [];
    }
  });

  ipcMain.handle('system:delete-file', async (e, filename) => {
    try {
      const filePath = path.join(getGeneratedFilesPath(), filename);
      
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' };
      }
      
      await fs.promises.unlink(filePath);
      
      const metaPath = `${filePath}.meta.json`;
      if (fs.existsSync(metaPath)) {
        await fs.promises.unlink(metaPath);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Delete file error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('system:open-file', async (e, filePath) => { 
    try { 
      if (!fs.existsSync(filePath)) { 
        return { success: false, error: 'File not found' }; 
      } 
      await shell.openPath(filePath); 
      return { success: true }; 
    } catch (error) { 
      console.error('Error opening file:', error); 
      return { success: false, error: error.message }; 
    } 
  });

  // ==========================================
  // PROJECT MANAGEMENT
  // ==========================================
  
  ipcMain.handle('project:list', async () => { 
    try {
      const d = getProjectsPath(); 
      const f = await fs.promises.readdir(d); 
      const p = []; 
      
      for (const x of f) { 
        if (x.endsWith('.json')) {
          try {
            const data = await fs.promises.readFile(path.join(d, x), 'utf-8');
            p.push(JSON.parse(data)); 
          } catch (e) {
            console.warn(`Corrupt project file: ${x}`);
          }
        }
      } 
      return p;
    } catch (error) {
      console.error('List projects error:', error);
      return [];
    }
  });

  ipcMain.handle('project:create', async (e, { id, name }) => { 
    try {
      const limitedName = name.substring(0, 100); 
      const p = path.join(getProjectsPath(), `${id}.json`); 
      const n = { 
        id, 
        name: limitedName, 
        files: [], 
        systemPrompt: "", 
        createdAt: new Date().toISOString() 
      }; 
      await fs.promises.writeFile(p, JSON.stringify(n, null, 2)); 
      return n;
    } catch (error) {
      console.error('Create project error:', error);
      throw error;
    }
  });

  ipcMain.handle('project:delete', async (e, id) => { 
    try {
      await fs.promises.unlink(path.join(getProjectsPath(), `${id}.json`)); 
      return true;
    } catch (error) {
      console.error('Delete project error:', error);
      return false;
    }
  });

  ipcMain.handle('project:update-settings', async (e, { id, systemPrompt }) => { 
    try {
      const p = path.join(getProjectsPath(), `${id}.json`); 
      if (fs.existsSync(p)) { 
        const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); 
        d.systemPrompt = systemPrompt; 
        await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); 
        return d; 
      } 
      return null;
    } catch (error) {
      console.error('Update project settings error:', error);
      return null;
    }
  });

  ipcMain.handle('project:delete-file', async (e, { projectId, filePath }) => { 
    try { 
      const p = path.join(getProjectsPath(), `${projectId}.json`); 
      if (fs.existsSync(p)) { 
        const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); 
        d.files = d.files.filter(f => f.path !== filePath); 
        await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); 
        return { success: true, files: d.files }; 
      } 
      return { success: false, error: 'Project not found' }; 
    } catch (error) { 
      console.error('Error deleting file from project:', error); 
      return { success: false, error: error.message }; 
    } 
  });

  ipcMain.handle('project:add-file-to-project', async (e, { projectId, filename }) => { 
    try { 
      const projectPath = path.join(getProjectsPath(), `${projectId}.json`); 
      if (!fs.existsSync(projectPath)) { 
        return { success: false, error: 'Project not found' }; 
      } 
      
      const project = JSON.parse(await fs.promises.readFile(projectPath, 'utf-8')); 
      const filePath = path.join(getGeneratedFilesPath(), filename); 
      
      if (!fs.existsSync(filePath)) { 
        return { success: false, error: 'File not found' }; 
      } 
      
      const exists = project.files.some(f => f.name === filename || f.path === filePath); 
      if (!exists) { 
        project.files.push({ 
          name: filename, 
          path: filePath, 
          type: 'md', 
          addedAt: new Date().toISOString(), 
          source: 'zenith' 
        }); 
        await fs.promises.writeFile(projectPath, JSON.stringify(project, null, 2)); 
      } 
      return { success: true, files: project.files }; 
    } catch (error) { 
      console.error('Add file to project error:', error); 
      return { success: false, error: error.message }; 
    } 
  });
  
  ipcMain.handle('project:add-files', async (e, projectId) => { 
    try {
      const r = await dialog.showOpenDialog(mainWindow, { 
        properties: ['openFile', 'multiSelections'] 
      }); 
      
      if (!r.canceled) { 
        const p = path.join(getProjectsPath(), `${projectId}.json`); 
        const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); 
        const n = r.filePaths.map(x => ({ 
          path: x, 
          name: path.basename(x), 
          type: path.extname(x).substring(1) 
        })); 
        
        d.files.push(...n.filter(f => !d.files.some(ex => ex.path === f.path))); 
        await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); 
        
        return d.files; 
      } 
      return null;
    } catch (error) {
      console.error('Add files error:', error);
      return null;
    }
  });

  ipcMain.handle('project:add-folder', async (e, projectId) => { 
    try {
      const r = await dialog.showOpenDialog(mainWindow, { 
        properties: ['openDirectory'] 
      }); 
      
      if (!r.canceled && r.filePaths.length > 0) { 
        const folderPath = r.filePaths[0]; 
        const allFiles = await scanDirectory(folderPath); 
        const p = path.join(getProjectsPath(), `${projectId}.json`); 
        const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); 
        const newFiles = allFiles.filter(f => !d.files.some(existing => existing.path === f.path)); 
        d.files.push(...newFiles); 
        d.rootPath = folderPath; 
        await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); 
        return d.files; 
      } 
      return null;
    } catch (error) {
      console.error('Add folder error:', error);
      return null;
    }
  });

  ipcMain.handle('project:add-url', async (e, { projectId, url }) => { 
    try { 
      const cheerio = loadCheerio(); 
      const response = await fetch(url, { 
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }); 
      const html = await response.text(); 
      const $ = cheerio.load(html); 
      $('script, style, nav, footer, iframe').remove(); 
      const content = $('body').text().replace(/\s\s+/g, ' ').trim().slice(0, 20000); 
      const filename = `web-${Date.now()}.txt`; 
      await fs.promises.writeFile(path.join(getCachePath(), filename), content, 'utf-8'); 
      const p = path.join(getProjectsPath(), `${projectId}.json`); 
      const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); 
      d.files.push({ 
        path: url, 
        name: $('title').text() || url, 
        type: 'url', 
        cacheFile: filename 
      }); 
      await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); 
      
      return d.files; 
    } catch (e) { 
      console.error('Add URL error:', e);
      throw new Error("Scrape Failed"); 
    } 
  });

  ipcMain.handle('agent:deep-research', async (e, { projectId, url }) => { 
    try { 
      const cheerio = loadCheerio(); 
      const response = await fetch(url, {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }); 
      const html = await response.text(); 
      const $ = cheerio.load(html); 
      $('script, style, nav, footer, iframe').remove(); 
      const content = $('body').text().replace(/\s\s+/g, ' ').trim().slice(0, 15000); 
      return content; 
    } catch (e) { 
      console.error('Deep research error:', e);
      throw new Error("Research Failed"); 
    } 
  });

  ipcMain.handle('project:scaffold', async (e, { projectId, structure }) => { 
    try {
      const p = path.join(getProjectsPath(), `${projectId}.json`); 
      if (!fs.existsSync(p)) throw new Error("Project not found"); 
      
      const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); 
      if (!d.rootPath) throw new Error("NO_ROOT_PATH"); 
      
      const root = d.rootPath; 
      const results = []; 
      
      for (const item of structure) { 
        try { 
          const fullPath = path.join(root, item.path); 
          if (!fullPath.startsWith(root)) continue;
          
          if (item.type === 'folder') { 
            await fs.promises.mkdir(fullPath, { recursive: true }); 
          } else { 
            await fs.promises.mkdir(path.dirname(fullPath), { recursive: true }); 
            await fs.promises.writeFile(fullPath, item.content || '', 'utf-8'); 
          } 
          results.push({ success: true, path: item.path }); 
        } catch (err) { 
          results.push({ success: false, path: item.path, error: err.message }); 
        } 
      } 
      return results;
    } catch (error) {
      console.error('Scaffold error:', error);
      throw error;
    }
  });

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================
  
  ipcMain.handle('session:save', async (e, { id, title, messages, date }) => { 
    try {
      const p = path.join(getSessionsPath(), `${id}.json`); 
      let t = title; 
      
      if (fs.existsSync(p)) { 
        const ex = JSON.parse(await fs.promises.readFile(p, 'utf-8')); 
        if (ex.title && ex.title !== "New Chat" && (!title || title === "New Chat")) {
          t = ex.title; 
        }
      } 
      
      await fs.promises.writeFile(p, JSON.stringify({ 
        id, 
        title: t || "New Chat", 
        messages, 
        date 
      }, null, 2)); 
      
      return true;
    } catch (error) {
      console.error('Save session error:', error);
      return false;
    }
  });

  ipcMain.handle('session:list', async () => { 
    try {
      const d = getSessionsPath(); 
      const f = await fs.promises.readdir(d); 
      const s = []; 
      
      for (const x of f) { 
        if (x.endsWith('.json')) { 
          try { 
            const j = JSON.parse(await fs.promises.readFile(path.join(d, x), 'utf-8')); 
            s.push({ id: j.id, title: j.title, date: j.date }); 
          } catch (e) {
            console.warn(`Corrupt session file: ${x}`);
          } 
        } 
      } 
      return s.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error('List sessions error:', error);
      return [];
    }
  });

  ipcMain.handle('session:load', async (e, id) => {
    try {
      const data = await fs.promises.readFile(
        path.join(getSessionsPath(), `${id}.json`), 
        'utf-8'
      );
      return JSON.parse(data);
    } catch (error) {
      console.error('Load session error:', error);
      throw error;
    }
  });

  ipcMain.handle('session:delete', async (e, id) => { 
    try {
      await fs.promises.unlink(path.join(getSessionsPath(), `${id}.json`)); 
      return true;
    } catch (error) {
      console.error('Delete session error:', error);
      return false;
    }
  });

  ipcMain.handle('session:rename', async (e, { id, title }) => { 
    try {
      const p = path.join(getSessionsPath(), `${id}.json`); 
      if (fs.existsSync(p)) { 
        const c = JSON.parse(await fs.promises.readFile(p, 'utf-8')); 
        c.title = title; 
        await fs.promises.writeFile(p, JSON.stringify(c, null, 2)); 
        return true; 
      } 
      return false;
    } catch (error) {
      console.error('Rename session error:', error);
      return false;
    }
  });

  // ==========================================
  // CALENDAR
  // ==========================================
  
  ipcMain.handle('calendar:load', async () => { 
    try { 
      if (fs.existsSync(getCalendarPath())) {
        const data = await fs.promises.readFile(getCalendarPath(), 'utf-8');
        return JSON.parse(data); 
      }
      return []; 
    } catch (e) { 
      console.error('Load calendar error:', e);
      return []; 
    } 
  });

  ipcMain.handle('calendar:save', async (e, events) => { 
    try { 
      await fs.promises.writeFile(getCalendarPath(), JSON.stringify(events, null, 2)); 
      return true; 
    } catch (e) { 
      console.error('Save calendar error:', e);
      return false; 
    } 
  });

  // ==========================================
  // PROJECT EXTRAS
  // ==========================================
  
  ipcMain.handle('project:save-dossier', async (e, { id, dossier }) => { 
    try {
      const p = path.join(getProjectsPath(), `${id}.json`); 
      if (fs.existsSync(p)) { 
        const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); 
        d.dossier = dossier; 
        await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); 
        return d; 
      } 
      return null;
    } catch (error) {
      console.error('Save dossier error:', error);
      return null;
    }
  });

  ipcMain.handle('project:generate-graph', async (e, projectId) => { 
    try {
      const p = path.join(getProjectsPath(), `${projectId}.json`); 
      if (!fs.existsSync(p)) return { nodes: [], links: [] }; 
      const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); 
      const nodes = []; 
      d.files.forEach((file) => nodes.push({ 
        id: file.name, 
        group: file.type, 
        path: file.path 
      })); 
      return { nodes, links: [] };
    } catch (error) {
      console.error('Generate graph error:', error);
      return { nodes: [], links: [] };
    }
  });

  // ==========================================
  // GIT INTEGRATION
  // ==========================================
  
  ipcMain.handle('git:status', async (e, projectId) => { 
    try {
      const p = path.join(getProjectsPath(), `${projectId}.json`); 
      if (!fs.existsSync(p)) return null; 
      const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); 
      return d.rootPath ? await gitHandler.getStatus(d.rootPath) : null;
    } catch (error) {
      console.error('Git status error:', error);
      return null;
    }
  });

  ipcMain.handle('git:diff', async (e, projectId) => { 
    try {
      const p = path.join(getProjectsPath(), `${projectId}.json`); 
      const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); 
      return d.rootPath ? await gitHandler.getDiff(d.rootPath) : "";
    } catch (error) {
      console.error('Git diff error:', error);
      return "";
    }
  });

  // ==========================================
  // OLLAMA AI INTEGRATION
  // ==========================================
  
  ipcMain.on('ollama:stream-prompt', async (event, params) => {
    aiRequestQueue.push({ event, params });
    processAIQueue();
  });

  ipcMain.handle('ollama:generate-json', async (e, { prompt, model, settings, projectId }) => { 
    try {
      const config = settings || DEFAULT_SETTINGS; 
      let baseUrl = (config.ollamaUrl || "http://127.0.0.1:11434")
        .replace(/\/$/, '')
        .replace('localhost', '127.0.0.1'); 
      let selectedModel = model || config.defaultModel; 
      
      if (!selectedModel) { 
        try { 
          const r = await fetch(`${baseUrl}/api/tags`); 
          const d = await r.json(); 
          if (d.models?.length) selectedModel = d.models[0].name; 
        } catch (e) {
          return { error: "No models found" };
        } 
      } 
      
      let contextStr = ""; 
      if (projectId) { 
        const p = path.join(getProjectsPath(), `${projectId}.json`); 
        if (fs.existsSync(p)) { 
          const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); 
          contextStr = await readProjectFiles(d.files || []); 
        } 
      } 
      
      const fullPrompt = contextStr 
        ? `CONTEXT:\n${contextStr}\n\nTASK: ${prompt}` 
        : prompt; 
      
      const r = await fetch(`${baseUrl}/api/generate`, { 
        method: 'POST', 
        body: JSON.stringify({ 
          model: selectedModel, 
          prompt: fullPrompt + "\n\nRETURN ONLY RAW JSON.", 
          format: 'json', 
          stream: false,
          options: { temperature: 0.2 }
        }) 
      }); 
      
      const j = await r.json(); 
      let raw = j.response.trim(); 
      
      if (raw.startsWith('```json')) {
        raw = raw.replace(/^```json\s*/, '').replace(/\s*```$/, ''); 
      } else if (raw.startsWith('```')) {
        raw = raw.replace(/^```\s*/, '').replace(/\s*```$/, ''); 
      }
      
      return JSON.parse(raw); 
    } catch (err) { 
      console.error('Generate JSON error:', err);
      return { error: "Failed to parse JSON" }; 
    } 
  });

  ipcMain.handle('ollama:completion', async (e, { prompt, model, settings }) => { 
    try {
      const config = settings || DEFAULT_SETTINGS; 
      let baseUrl = (config.ollamaUrl || "http://127.0.0.1:11434")
        .replace(/\/$/, '')
        .replace('localhost', '127.0.0.1'); 
      let selectedModel = model || config.defaultModel; 
      let availableModels = []; 
      
      try { 
        const tagReq = await fetch(`${baseUrl}/api/tags`); 
        if (tagReq.ok) { 
          const tagData = await tagReq.json(); 
          availableModels = tagData.models?.map(m => m.name) || []; 
        } 
      } catch (connErr) { 
        return "Error: Could not connect to Ollama."; 
      } 
      
      if (availableModels.length > 0) { 
        const exactMatch = availableModels.find(m => m === selectedModel); 
        if (!exactMatch) { 
          const fallback = availableModels.find(m => !m.includes('embed')) || availableModels[0]; 
          selectedModel = fallback; 
        } 
      } else { 
        return "Error: No models found in Ollama."; 
      } 
      
      const r = await fetch(`${baseUrl}/api/generate`, { 
        method: 'POST', 
        body: JSON.stringify({ 
          model: selectedModel, 
          prompt: prompt, 
          stream: false, 
          options: { 
            temperature: 0.3 
          } 
        }) 
      }); 
      
      if (!r.ok) { 
        const errText = await r.text(); 
        throw new Error(`Ollama API Error (${r.status}): ${errText}`); 
      } 
      
      const j = await r.json(); 
      return j.response; 
    } catch (err) { 
      console.error("Completion error:", err); 
      return `Error: ${err.message}`; 
    } 
  });

  ipcMain.handle('ollama:status', async (e, url) => { 
    try { 
      const r = await fetch(`${url}/api/tags`, { timeout: 3000 }); 
      return r.status === 200; 
    } catch (e) { 
      return false; 
    } 
  });

  ipcMain.handle('ollama:models', async (e, url) => { 
    try { 
      const r = await fetch(`${url}/api/tags`, { timeout: 3000 }); 
      const d = await r.json(); 
      return d.models.map(m => m.name); 
    } catch (e) { 
      return []; 
    } 
  });

  app.on("activate", () => { 
    if (BrowserWindow.getAllWindows().length === 0) createWindow(); 
  });
  
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
});

app.on("window-all-closed", () => { 
  if (process.platform !== "darwin") app.quit(); 
});
