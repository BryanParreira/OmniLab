const { app, BrowserWindow, ipcMain, shell, dialog, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { createTray } = require('./tray.cjs'); 
const { autoUpdater } = require("electron-updater");
const log = require('electron-log');

// --- 1. CONFIGURATION (FIXED) ---
log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.autoDownload = false; // Manual trigger
autoUpdater.autoInstallOnAppQuit = true;
// ADDED: These prevent common download errors regarding draft/prerelease versions
autoUpdater.allowPrerelease = false; 
autoUpdater.fullChangelog = false;

// --- 2. LAZY LOAD HEAVY DEPENDENCIES (Performance Optimization) ---
// We load these only when needed to keep app startup fast, but they are fully preserved.
const loadPdf = () => require('pdf-parse');
const loadCheerio = () => require('cheerio');
const loadGit = () => require('simple-git');

// Global References
let mainWindow;
let tray = null; 

// --- 3. FILE SYSTEM PATHS ---
const getUserDataPath = () => app.getPath('userData');
const getSessionsPath = () => path.join(getUserDataPath(), 'sessions');
const getProjectsPath = () => path.join(getUserDataPath(), 'projects');
const getCachePath = () => path.join(getProjectsPath(), 'cache');
const getSettingsPath = () => path.join(getUserDataPath(), 'settings.json');
const getCalendarPath = () => path.join(getUserDataPath(), 'calendar.json');

// Ensure directories exist
[getSessionsPath(), getProjectsPath(), getCachePath()].forEach(dir => {
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
    vibrancy: 'ultra-dark', // MacOS only
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
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  return mainWindow;
}

// --- 5. UPDATER LOGIC (FIXED) ---
function setupUpdater() {
  ipcMain.on('check-for-updates', () => {
    if (!app.isPackaged) {
      mainWindow?.webContents.send('update-message', { status: 'error', text: 'Updates disabled in Dev Mode' });
      return;
    }
    autoUpdater.checkForUpdates();
  });

  // FIXED: Converted to async to catch startup errors
  ipcMain.on('download-update', async () => {
    try {
      log.info("User requested download...");
      // This initiates the download. The events below handle the rest.
      await autoUpdater.downloadUpdate();
    } catch (err) {
      log.error("Download Error:", err);
      mainWindow?.webContents.send('update-message', { status: 'error', text: 'Download failed. Check logs.' });
    }
  });

  // FORCE RESTART
  ipcMain.on('quit-and-install', () => { 
      // true, true = Silent Install, Run App After
      autoUpdater.quitAndInstall(true, true); 
  });

  autoUpdater.on('checking-for-update', () => mainWindow?.webContents.send('update-message', { status: 'checking', text: 'Checking...' }));
  
  autoUpdater.on('update-available', (info) => {
    log.info("Update available:", info);
    mainWindow?.webContents.send('update-message', { 
        status: 'available', 
        text: `Version ${info.version} available!`, 
        version: info.version 
    });
  });

  autoUpdater.on('update-not-available', () => mainWindow?.webContents.send('update-message', { status: 'not-available', text: 'You are on the latest version.' }));
  
  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents.send('update-message', { 
      status: 'downloading', 
      text: 'Downloading update...', 
      progress: progressObj.percent 
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info("Update downloaded");
    mainWindow?.webContents.send('update-message', { status: 'downloaded', text: 'Ready to install.' });
  });
  
  autoUpdater.on('error', (err) => {
    log.error(err);
    // Don't show error to UI if it's just a background check failing (internet issues)
    // Only send if user actively clicked something or during download
    mainWindow?.webContents.send('update-message', { status: 'error', text: 'Update failed.' });
  });
}

// --- 6. HEAVY CONTEXT ENGINE (FILES & PDFS) ---
// This reads your project files. It is critical for Chat, Dossier, and Deep Research.
async function readProjectFiles(projectFiles) {
  const MAX_CONTEXT_CHARS = 128000; 
  let currentChars = 0;
  
  let context = "--- PROJECT FILE STRUCTURE (Index) ---\n";
  projectFiles.forEach(f => { context += `- ${f.name}\n`; });
  context += "\n--- BEGIN FILE CONTENTS ---\n";
  currentChars += context.length;

  for (const file of projectFiles) {
    if (currentChars >= MAX_CONTEXT_CHARS) {
      context += `\n[SYSTEM NOTE: Remaining files omitted to fit context window]\n`;
      break;
    }

    try {
      // A. Handle Web URLs (Cached from Deep Research)
      if (file.type === 'url') {
        const filePath = path.join(getCachePath(), file.cacheFile);
        if (fs.existsSync(filePath)) {
           let content = await fs.promises.readFile(filePath, 'utf-8');
           if (content.length > 5000) content = content.slice(0, 5000) + "\n...[Web Page Truncated]...";
           const entry = `\n>>> SOURCE: ${file.name} (Web)\n${content}\n`;
           if (currentChars + entry.length < MAX_CONTEXT_CHARS) {
             context += entry;
             currentChars += entry.length;
           }
        }
        continue;
      }

      // B. Validation
      if (!fs.existsSync(file.path)) continue;
      const stats = await fs.promises.stat(file.path);
      if (stats.size > 20 * 1024 * 1024) continue; // Skip huge files (>20MB)
      
      let fileContent = "";
      
      // C. PDF PARSING (Heavy Logic)
      if (file.path.toLowerCase().endsWith('.pdf')) {
        try {
          const pdf = loadPdf(); // Loaded on demand
          const dataBuffer = await fs.promises.readFile(file.path);
          const data = await pdf(dataBuffer);
          fileContent = data.text;
        } catch (pdfErr) {
          console.error(`Failed to parse PDF ${file.name}:`, pdfErr);
          fileContent = "[ERROR: Could not parse PDF text.]";
        }
      } 
      // D. STANDARD TEXT (Code, MD, TXT)
      else if (!['png','jpg','jpeg','gif','exe','bin','zip','iso','dll','dmg'].includes(file.type.toLowerCase())) {
        fileContent = await fs.promises.readFile(file.path, 'utf-8');
        // Simple binary check (prevents reading executables as text)
        if (fileContent.indexOf('\0') !== -1) fileContent = ""; 
      }

      if (fileContent) {
        if (fileContent.length > 15000) {
          fileContent = fileContent.slice(0, 15000) + `\n... [File ${file.name} Truncated] ...`;
        }
        const entry = `\n>>> FILE: ${file.name}\n${fileContent}\n`;
        if (currentChars + entry.length < MAX_CONTEXT_CHARS) {
          context += entry;
          currentChars += entry.length;
        }
      }
    } catch (e) { 
      console.warn(`Could not read file ${file.name}:`, e); 
    }
  }
  return context;
}

// --- 7. HELPER: RECURSIVE SCAN ---
async function scanDirectory(dirPath, fileList = []) {
  try {
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build', '.next', '.vscode'].includes(file.name)) {
          await scanDirectory(fullPath, fileList);
        }
      } else {
        if (!['.DS_Store', 'package-lock.json'].includes(file.name)) {
          fileList.push({ path: fullPath, name: file.name, type: path.extname(file.name).substring(1) });
        }
      }
    }
  } catch (e) {}
  return fileList;
}

// --- 8. HELPER: GIT HANDLER (Heavy Logic) ---
const gitHandler = {
  async getStatus(rootPath) { try { if (!rootPath || !fs.existsSync(path.join(rootPath, '.git'))) return null; const git = loadGit()(rootPath); const status = await git.status(); return { current: status.current, modified: status.modified, staged: status.staged, clean: status.isClean() }; } catch (e) { return null; } },
  async getDiff(rootPath) { try { if (!rootPath) return ""; const git = loadGit()(rootPath); let diff = await git.diff(['--staged']); if (!diff) diff = await git.diff(); return diff; } catch (e) { return ""; } }
};

// --- 9. APP INITIALIZATION ---
app.whenReady().then(() => {
  createWindow();
  tray = createTray(mainWindow); 
  setupUpdater();
  
  if (app.isPackaged) autoUpdater.checkForUpdatesAndNotify();

  // ==========================================
  // IPC HANDLERS API
  // ==========================================

  // --- SYSTEM ---
  ipcMain.handle('settings:load', async () => { try { if (fs.existsSync(getSettingsPath())) return { ...DEFAULT_SETTINGS, ...JSON.parse(await fs.promises.readFile(getSettingsPath(), 'utf-8')) }; } catch (e) { } return DEFAULT_SETTINGS; });
  ipcMain.handle('settings:save', async (e, settings) => { await fs.promises.writeFile(getSettingsPath(), JSON.stringify(settings, null, 2)); return true; });
  ipcMain.handle('system:factory-reset', async () => { try { const del = async (d) => { if(fs.existsSync(d)){ for(const f of await fs.promises.readdir(d)){ const c=path.join(d,f); if((await fs.promises.lstat(c)).isDirectory()) await fs.promises.rm(c,{recursive:true}); else await fs.promises.unlink(c); } } }; await del(getSessionsPath()); await del(getProjectsPath()); await fs.promises.writeFile(getSettingsPath(), JSON.stringify(DEFAULT_SETTINGS)); return true; } catch(e){ return false; } });
  
  // --- ZENITH SAVE (Native Dialog) ---
  ipcMain.handle('system:save-file', async (e, { content, filename }) => {
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
  });

  // --- PROJECT MANAGEMENT ---
  ipcMain.handle('project:list', async () => { const d = getProjectsPath(); const f = await fs.promises.readdir(d); const p = []; for (const x of f) { if(x.endsWith('.json')) p.push(JSON.parse(await fs.promises.readFile(path.join(d, x), 'utf-8'))); } return p; });
  ipcMain.handle('project:create', async (e, { id, name }) => { const p = path.join(getProjectsPath(), `${id}.json`); const n = { id, name, files: [], systemPrompt: "", createdAt: new Date() }; await fs.promises.writeFile(p, JSON.stringify(n, null, 2)); return n; });
  ipcMain.handle('project:delete', async (e, id) => { await fs.promises.unlink(path.join(getProjectsPath(), `${id}.json`)); return true; });
  ipcMain.handle('project:update-settings', async (e, { id, systemPrompt }) => { const p = path.join(getProjectsPath(), `${id}.json`); if (fs.existsSync(p)) { const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); d.systemPrompt = systemPrompt; await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); return d; } return null; });
  
  ipcMain.handle('project:add-files', async (e, projectId) => { const r = await dialog.showOpenDialog(mainWindow, { properties: ['openFile', 'multiSelections'] }); if (!r.canceled) { const p = path.join(getProjectsPath(), `${projectId}.json`); const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); const n = r.filePaths.map(x => ({ path: x, name: path.basename(x), type: path.extname(x).substring(1) })); d.files.push(...n.filter(f => !d.files.some(ex => ex.path === f.path))); await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); return d.files; } return null; });
  ipcMain.handle('project:add-folder', async (e, projectId) => { const r = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] }); if (!r.canceled && r.filePaths.length > 0) { const folderPath = r.filePaths[0]; const allFiles = await scanDirectory(folderPath); const p = path.join(getProjectsPath(), `${projectId}.json`); const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); const newFiles = allFiles.filter(f => !d.files.some(existing => existing.path === f.path)); d.files.push(...newFiles); d.rootPath = folderPath; await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); return d.files; } return null; });

  // --- DEEP RESEARCH (Web Scraping using Cheerio) ---
  ipcMain.handle('project:add-url', async (e, { projectId, url }) => { 
      try { 
          const cheerio = loadCheerio(); 
          const response = await fetch(url); 
          const html = await response.text(); 
          const $ = cheerio.load(html); 
          $('script, style, nav, footer, iframe').remove(); 
          const content = $('body').text().replace(/\s\s+/g, ' ').trim(); 
          const filename = `web-${Date.now()}.txt`; 
          await fs.promises.writeFile(path.join(getCachePath(), filename), content, 'utf-8'); 
          const p = path.join(getProjectsPath(), `${projectId}.json`); 
          const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); 
          d.files.push({ path: url, name: $('title').text() || url, type: 'url', cacheFile: filename }); 
          await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); 
          return d.files; 
      } catch (e) { throw new Error("Scrape Failed"); } 
  });

  ipcMain.handle('agent:deep-research', async (e, { projectId, url }) => { 
      try { 
          const cheerio = loadCheerio(); 
          const response = await fetch(url); 
          const html = await response.text(); 
          const $ = cheerio.load(html); 
          $('script, style, nav, footer, iframe').remove(); 
          const content = $('body').text().replace(/\s\s+/g, ' ').trim().slice(0, 15000); 
          return content; 
      } catch (e) { throw new Error("Research Failed"); } 
  });

  // --- SCAFFOLDING (Blueprints) ---
  ipcMain.handle('project:scaffold', async (e, { projectId, structure }) => {
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
        if (item.type === 'folder') { await fs.promises.mkdir(fullPath, { recursive: true }); } 
        else { await fs.promises.mkdir(path.dirname(fullPath), { recursive: true }); await fs.promises.writeFile(fullPath, item.content || '', 'utf-8'); }
        results.push({ success: true, path: item.path });
      } catch (err) { results.push({ success: false, path: item.path, error: err.message }); }
    }
    return results;
  });

  // --- SESSION & CALENDAR ---
  ipcMain.handle('session:save', async (e, { id, title, messages, date }) => { const p = path.join(getSessionsPath(), `${id}.json`); let t = title; if(fs.existsSync(p)){ const ex = JSON.parse(await fs.promises.readFile(p,'utf-8')); if(ex.title && ex.title!=="New Chat" && (!title||title==="New Chat")) t = ex.title; } await fs.promises.writeFile(p, JSON.stringify({ id, title:t||"New Chat", messages, date }, null, 2)); return true; });
  ipcMain.handle('session:list', async () => { const d = getSessionsPath(); const f = await fs.promises.readdir(d); const s = []; for(const x of f){ if(x.endsWith('.json')){ try{ const j=JSON.parse(await fs.promises.readFile(path.join(d,x),'utf-8')); s.push({id:j.id, title:j.title, date:j.date}); }catch(e){} } } return s.sort((a,b)=>new Date(b.date)-new Date(a.date)); });
  ipcMain.handle('session:load', async (e, id) => JSON.parse(await fs.promises.readFile(path.join(getSessionsPath(), `${id}.json`), 'utf-8')));
  ipcMain.handle('session:delete', async (e, id) => { await fs.promises.unlink(path.join(getSessionsPath(), `${id}.json`)); return true; });
  ipcMain.handle('session:rename', async (e, { id, title }) => { const p = path.join(getSessionsPath(), `${id}.json`); if(fs.existsSync(p)){ const c = JSON.parse(await fs.promises.readFile(p,'utf-8')); c.title = title; await fs.promises.writeFile(p, JSON.stringify(c,null,2)); return true; } return false; });
  ipcMain.handle('calendar:load', async () => { try { if (fs.existsSync(getCalendarPath())) return JSON.parse(await fs.promises.readFile(getCalendarPath(), 'utf-8')); return []; } catch (e) { return []; } });
  ipcMain.handle('calendar:save', async (e, events) => { try { await fs.promises.writeFile(getCalendarPath(), JSON.stringify(events, null, 2)); return true; } catch (e) { return false; } });

  // --- DOSSIER SAVE (New Feature) ---
  ipcMain.handle('project:save-dossier', async (e, { id, dossier }) => {
    const p = path.join(getProjectsPath(), `${id}.json`);
    if (fs.existsSync(p)) {
      const d = JSON.parse(await fs.promises.readFile(p, 'utf-8'));
      d.dossier = dossier;
      await fs.promises.writeFile(p, JSON.stringify(d, null, 2));
      return d;
    }
    return null;
  });

  // --- GRAPH & GIT ---
  ipcMain.handle('project:generate-graph', async (e, projectId) => { const p = path.join(getProjectsPath(), `${projectId}.json`); if (!fs.existsSync(p)) return { nodes: [], links: [] }; const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); const nodes = []; d.files.forEach((file) => nodes.push({ id: file.name, group: file.type, path: file.path })); return { nodes, links: [] }; });
  ipcMain.handle('git:status', async (e, projectId) => { const p = path.join(getProjectsPath(), `${projectId}.json`); if (!fs.existsSync(p)) return null; const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); return d.rootPath ? await gitHandler.getStatus(d.rootPath) : null; });
  ipcMain.handle('git:diff', async (e, projectId) => { const p = path.join(getProjectsPath(), `${projectId}.json`); const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); return d.rootPath ? await gitHandler.getDiff(d.rootPath) : ""; });

  // --- OLLAMA STREAMING ---
  ipcMain.on('ollama:stream-prompt', async (event, { prompt, model, contextFiles, systemPrompt, settings }) => {
    const config = settings || DEFAULT_SETTINGS;
    let baseUrl = (config.ollamaUrl || "http://127.0.0.1:11434").replace(/\/$/, '').replace('localhost', '127.0.0.1');
    let selectedModel = model || config.defaultModel;

    if(!selectedModel) {
        try {
            const r = await fetch(`${baseUrl}/api/tags`);
            const d = await r.json();
            if(d.models?.length) selectedModel = d.models[0].name;
        } catch(e) { mainWindow.webContents.send('ollama:error', "No AI models found."); return; }
    }

    const contextStr = await readProjectFiles(contextFiles || []);
    const fullPrompt = contextStr ? `[CONTEXT START]\n${contextStr}\n[CONTEXT END]\n\nQUESTION: ${prompt}` : prompt;
    const finalSystem = `${config.developerMode ? "You are OmniLab Forge, an expert engineer." : "You are OmniLab Nexus, a research assistant."}\n${systemPrompt || ""}`;

    const req = net.request({ method: 'POST', url: `${baseUrl}/api/generate` });
    req.setHeader('Content-Type', 'application/json');
    req.on('response', (res) => {
        res.on('data', (chunk) => {
            const lines = chunk.toString().split('\n');
            for(const line of lines) {
                if(!line.trim()) continue;
                try {
                    const json = JSON.parse(line);
                    if(json.response) mainWindow.webContents.send('ollama:chunk', json.response);
                    if(json.done) mainWindow.webContents.send('ollama:chunk', '[DONE]');
                } catch(e){}
            }
        });
        res.on('error', (e) => mainWindow.webContents.send('ollama:error', e.message));
    });
    req.on('error', (e) => mainWindow.webContents.send('ollama:error', "Connection Failed"));
    req.write(JSON.stringify({ 
        model: selectedModel, 
        prompt: `[SYSTEM] ${finalSystem}\n\n[USER] ${fullPrompt}`, 
        stream: true,
        options: { num_ctx: config.contextLength || 8192, temperature: 0.4 } 
    }));
    req.end();
  });

  // --- OLLAMA JSON GENERATION (FIXED + ENHANCED FOR FLASHCARDS & DOSSIER) ---
  ipcMain.handle('ollama:generate-json', async (e, { prompt, model, settings, projectId }) => { 
    const config = settings || DEFAULT_SETTINGS; 
    let baseUrl = (config.ollamaUrl || "http://127.0.0.1:11434").replace(/\/$/, '').replace('localhost', '127.0.0.1');
    let selectedModel = model || config.defaultModel;
    if(!selectedModel) { try { const r = await fetch(`${baseUrl}/api/tags`); const d = await r.json(); if(d.models?.length) selectedModel = d.models[0].name; } catch(e){} }
    
    // READ FILES IF PROJECT ID PROVIDED (For Dossier)
    let contextStr = "";
    if (projectId) {
        const p = path.join(getProjectsPath(), `${projectId}.json`);
        if (fs.existsSync(p)) {
            const d = JSON.parse(await fs.promises.readFile(p, 'utf-8'));
            contextStr = await readProjectFiles(d.files || []);
        }
    }

    const fullPrompt = contextStr ? `CONTEXT:\n${contextStr}\n\nTASK: ${prompt}` : prompt;

    try {
        const r = await fetch(`${baseUrl}/api/generate`, { 
            method:'POST', 
            body:JSON.stringify({ model:selectedModel, prompt: fullPrompt + "\n\nRETURN ONLY RAW JSON.", format:'json', stream:false }) 
        });
        const j = await r.json();
        
        // CLEANUP MARKDOWN WRAPPERS (Fixes "Flashcard Error")
        let raw = j.response.trim();
        if (raw.startsWith('```json')) raw = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        else if (raw.startsWith('```')) raw = raw.replace(/^```\s*/, '').replace(/\s*```$/, '');
        
        return JSON.parse(raw);
    } catch(err) {
        console.error("JSON Error", err);
        return { error: "Failed to parse JSON" };
    }
  });

  // Utils
  ipcMain.handle('ollama:status', async (e, url) => { try { const r = await fetch(`${url}/api/tags`); return r.status === 200; } catch(e){ return false; } });
  ipcMain.handle('ollama:models', async (e, url) => { try { const r = await fetch(`${url}/api/tags`); const d = await r.json(); return d.models.map(m=>m.name); } catch(e){ return []; } });

  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });