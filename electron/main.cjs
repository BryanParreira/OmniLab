if (typeof DOMMatrix === 'undefined') { global.DOMMatrix = class DOMMatrix {}; }
if (typeof ImageData === 'undefined') { global.ImageData = class ImageData {}; }
if (typeof Path2D === 'undefined') { global.Path2D = class Path2D {}; }

const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { createTray } = require('./tray.cjs');

const loadPdf = () => require('pdf-parse');
const loadCheerio = () => require('cheerio');
const loadGit = () => require('simple-git');

let mainWindow;

const getUserDataPath = () => app.getPath('userData');
const getSessionsPath = () => path.join(getUserDataPath(), 'sessions');
const getProjectsPath = () => path.join(getUserDataPath(), 'projects');
const getCachePath = () => path.join(getProjectsPath(), 'cache');
const getSettingsPath = () => path.join(getUserDataPath(), 'settings.json');
const getCalendarPath = () => path.join(getUserDataPath(), 'calendar.json');

[getSessionsPath(), getProjectsPath(), getCachePath()].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const DEFAULT_SETTINGS = {
  ollamaUrl: "http://127.0.0.1:11434",
  defaultModel: "llama3",
  contextLength: 8192,
  temperature: 0.7,
  systemPrompt: "",
  developerMode: false,
  fontSize: 14,
  chatDensity: 'comfortable'
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 950,
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
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  return mainWindow;
}

// --- BRAIN UPGRADE: SMART PERSONAS ---
const getPersona = (isDev) => {
  if (isDev) {
    return `
    ROLE: You are Lumina Prime, a Senior Staff Software Engineer.
    CONTEXT: The user may or may not have provided project files.
    
    PROTOCOL:
    1. IF FILES PROVIDED: Analyze them deeply. Reference filenames. Fix bugs aggressively.
    2. IF NO FILES: Act as a General Coding Architect. Write code from scratch using best practices.
    3. STYLE: Technical, terse, no fluff. Start immediately with the solution.
    4. FORMAT: Use Markdown. Use <mermaid> for diagrams.
    5. FORBIDDEN: Do not use <thinking> tags.
    `;
  } else {
    return `
    ROLE: You are Lumina Academy, a World-Class Tutor and Research Assistant.
    CONTEXT: The user is likely a student or researcher.
    
    PROTOCOL:
    1. IF FILES PROVIDED: Use them as the absolute truth for your answers.
    2. IF NO FILES: Act as a knowledgeable Professor. Explain concepts clearly using analogies.
    3. STYLE: Educational, encouraging, structured. Use bullet points and headers.
    4. FORMAT: Use Markdown.
    5. FORBIDDEN: Do not use <thinking> tags.
    `;
  }
};

// ... (Keep readProjectFiles, scanDirectory, gitHandler as they were) ...
const gitHandler = {
  async getStatus(rootPath) { try { if (!rootPath || !fs.existsSync(path.join(rootPath, '.git'))) return null; const git = loadGit()(rootPath); const status = await git.status(); return { current: status.current, modified: status.modified, staged: status.staged, clean: status.isClean() }; } catch (e) { return null; } },
  async getDiff(rootPath) { try { if (!rootPath) return ""; const git = loadGit()(rootPath); let diff = await git.diff(['--staged']); if (!diff) diff = await git.diff(); return diff; } catch (e) { return ""; } }
};

async function readProjectFiles(projectFiles) {
  let context = "";
  for (const file of projectFiles) {
    try {
      if (file.type === 'url') {
        const filePath = path.join(getCachePath(), file.cacheFile);
        if (fs.existsSync(filePath)) { const content = await fs.promises.readFile(filePath, 'utf-8'); context += `\n--- WEB: ${file.name} ---\n${content.slice(0, 15000)}\n`; }
        continue;
      }
      const stats = await fs.promises.stat(file.path);
      if (stats.size > 10 * 1024 * 1024) continue; 
      if (file.path.toLowerCase().endsWith('.pdf')) { const pdf = loadPdf(); const dataBuffer = await fs.promises.readFile(file.path); const data = await pdf(dataBuffer); context += `\n--- PDF: ${file.name} ---\n${data.text.slice(0, 15000)}\n`; }
      else if (!['png','jpg','exe','bin','zip'].includes(file.type.toLowerCase())) { const content = await fs.promises.readFile(file.path, 'utf-8'); if (content.indexOf('\0') === -1) context += `\n--- FILE: ${file.name} ---\n${content}\n`; }
    } catch (e) {}
  }
  return context;
}

async function scanDirectory(dirPath, fileList = []) {
  const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    if (file.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(file.name)) await scanDirectory(fullPath, fileList);
    } else {
      if (!['.DS_Store'].includes(file.name)) fileList.push({ path: fullPath, name: file.name, type: path.extname(file.name).substring(1) });
    }
  }
  return fileList;
}

app.whenReady().then(() => {
  const win = createWindow();
  createTray(win);

  ipcMain.handle('settings:load', async () => {
    try { if (fs.existsSync(getSettingsPath())) { const data = JSON.parse(await fs.promises.readFile(getSettingsPath(), 'utf-8')); return { ...DEFAULT_SETTINGS, ...data }; } } catch (e) { } return DEFAULT_SETTINGS;
  });
  ipcMain.handle('settings:save', async (e, settings) => { await fs.promises.writeFile(getSettingsPath(), JSON.stringify(settings, null, 2)); return true; });

  // --- OLLAMA STREAM (UPDATED) ---
  ipcMain.on('ollama:stream-prompt', async (event, { prompt, model, contextFiles, systemPrompt, settings }) => {
    if (!win) return;
    try {
      const config = settings || DEFAULT_SETTINGS;
      const baseUrl = config.ollamaUrl || "http://127.0.0.1:11434";
      
      // Get Dynamic Persona
      const baseSystem = getPersona(config.developerMode);
      const userSystem = systemPrompt || config.systemPrompt || "";
      const finalPrompt = `SYSTEM: ${baseSystem}\n${userSystem}\n\nUSER QUERY: ${prompt}`;

      if (contextFiles && contextFiles.length > 0) {
        win.webContents.send('ollama:chunk', ''); // Start stream UI
        const fileContext = await readProjectFiles(contextFiles);
        // Append context if using a large context model, or let user query handle it
      }

      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: model || config.defaultModel, 
          prompt: contextFiles && contextFiles.length > 0 ? `CONTEXT:\n${await readProjectFiles(contextFiles)}\n\n${finalPrompt}` : finalPrompt, 
          stream: true,
          options: { num_ctx: parseInt(config.contextLength) || 8192, temperature: parseFloat(config.temperature) || 0.7 }
        })
      });
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) { try { const json = JSON.parse(line); if (json.response) win.webContents.send('ollama:chunk', json.response); if (json.done) win.webContents.send('ollama:chunk', '[DONE]'); } catch (e) { } }
      }
    } catch (error) { win.webContents.send('ollama:error', `Connection Error: ${error.message}`); }
  });

  // ... (Rest of handlers: Git, Calendar, Files, etc. - UNCHANGED) ...
  // (Copy them from the previous response if needed, they are fine)
  ipcMain.handle('ollama:generate-json', async (e, { prompt, model, settings }) => { const config = settings || DEFAULT_SETTINGS; const baseUrl = config.ollamaUrl || "http://127.0.0.1:11434"; try { const response = await fetch(`${baseUrl}/api/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: model || config.defaultModel, prompt: prompt, format: 'json', stream: false, options: { temperature: 0.2 } }) }); const data = await response.json(); try { return JSON.parse(data.response); } catch { return data.response; } } catch (e) { return []; } });
  ipcMain.handle('calendar:load', async () => { try { if (fs.existsSync(getCalendarPath())) return JSON.parse(await fs.promises.readFile(getCalendarPath(), 'utf-8')); return []; } catch (e) { return []; } });
  ipcMain.handle('calendar:save', async (e, events) => { try { await fs.promises.writeFile(getCalendarPath(), JSON.stringify(events, null, 2)); return true; } catch (e) { return false; } });
  ipcMain.handle('git:status', async (e, projectId) => { const p = path.join(getProjectsPath(), `${projectId}.json`); if (!fs.existsSync(p)) return null; const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); return d.rootPath ? await gitHandler.getStatus(d.rootPath) : null; });
  ipcMain.handle('git:diff', async (e, projectId) => { const p = path.join(getProjectsPath(), `${projectId}.json`); const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); return d.rootPath ? await gitHandler.getDiff(d.rootPath) : ""; });
  ipcMain.handle('ollama:status', async (e, url) => { try { const r = await fetch(`${url || 'http://127.0.0.1:11434'}/api/tags`); if(r.ok) return true; } catch(e){} return false; });
  ipcMain.handle('ollama:models', async (e, url) => { try { const r = await fetch(`${url || 'http://127.0.0.1:11434'}/api/tags`); const data = await r.json(); return data.models.map(m => m.name); } catch(e) { return []; } });
  ipcMain.handle('project:add-url', async (e, { projectId, url }) => { try { const cheerio = loadCheerio(); const response = await fetch(url); const html = await response.text(); const $ = cheerio.load(html); $('script, style, nav, footer, iframe').remove(); const content = $('body').text().replace(/\s\s+/g, ' ').trim().slice(0, 15000); const filename = `web-${Date.now()}.txt`; await fs.promises.writeFile(path.join(getCachePath(), filename), content, 'utf-8'); const projectPath = path.join(getProjectsPath(), `${projectId}.json`); const projectData = JSON.parse(await fs.promises.readFile(projectPath, 'utf-8')); projectData.files.push({ path: url, name: `[Research] ${$('title').text()}`, type: 'url', cacheFile: filename }); await fs.promises.writeFile(projectPath, JSON.stringify(projectData, null, 2)); return content; } catch (e) { throw new Error("Research Failed"); } });
  ipcMain.handle('system:save-file', async (e, { content, filename }) => { const { filePath } = await dialog.showSaveDialog(win, { defaultPath: filename || 'untitled.txt', }); if (filePath) { await fs.promises.writeFile(filePath, content, 'utf-8'); return true; } return false; });
  ipcMain.handle('system:factory-reset', async () => { try { const del = async (d) => { if(fs.existsSync(d)){ for(const f of await fs.promises.readdir(d)){ const c=path.join(d,f); if((await fs.promises.lstat(c)).isDirectory()) await fs.promises.rm(c,{recursive:true}); else await fs.promises.unlink(c); } } }; await del(getSessionsPath()); await del(getProjectsPath()); await fs.promises.writeFile(getSettingsPath(), JSON.stringify(DEFAULT_SETTINGS)); return true; } catch(e){ return false; } });
  ipcMain.handle('project:update-settings', async (e, { id, systemPrompt }) => { const p = path.join(getProjectsPath(), `${id}.json`); if (fs.existsSync(p)) { const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); d.systemPrompt = systemPrompt; await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); return d; } return null; });
  ipcMain.handle('project:list', async () => { const d = getProjectsPath(); const f = await fs.promises.readdir(d); const p = []; for (const x of f) { if(x.endsWith('.json')) p.push(JSON.parse(await fs.promises.readFile(path.join(d, x), 'utf-8'))); } return p; });
  ipcMain.handle('project:create', async (e, { id, name }) => { const p = path.join(getProjectsPath(), `${id}.json`); const n = { id, name, files: [], systemPrompt: "", createdAt: new Date() }; await fs.promises.writeFile(p, JSON.stringify(n, null, 2)); return n; });
  ipcMain.handle('project:add-files', async (e, projectId) => { const r = await dialog.showOpenDialog(win, { properties: ['openFile', 'multiSelections'] }); if (!r.canceled) { const p = path.join(getProjectsPath(), `${projectId}.json`); const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); const n = r.filePaths.map(x => ({ path: x, name: path.basename(x), type: path.extname(x).substring(1) })); d.files.push(...n.filter(f => !d.files.some(ex => ex.path === f.path))); await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); return d.files; } return null; });
  ipcMain.handle('project:add-folder', async (e, projectId) => { const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] }); if (!r.canceled && r.filePaths.length > 0) { const folderPath = r.filePaths[0]; const allFiles = await scanDirectory(folderPath); const p = path.join(getProjectsPath(), `${projectId}.json`); const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); const newFiles = allFiles.filter(f => !d.files.some(existing => existing.path === f.path)); d.files.push(...newFiles); d.rootPath = folderPath; await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); return d.files; } return null; });
  ipcMain.handle('project:delete', async (e, id) => { await fs.promises.unlink(path.join(getProjectsPath(), `${id}.json`)); return true; });
  ipcMain.handle('session:save', async (e, { id, title, messages, date }) => { const p = path.join(getSessionsPath(), `${id}.json`); let t = title; if(fs.existsSync(p)){ const ex = JSON.parse(await fs.promises.readFile(p,'utf-8')); if(ex.title && ex.title!=="New Chat" && (!title||title==="New Chat")) t = ex.title; } await fs.promises.writeFile(p, JSON.stringify({ id, title:t||"New Chat", messages, date }, null, 2)); return true; });
  ipcMain.handle('session:rename', async (e, { id, title }) => { const p = path.join(getSessionsPath(), `${id}.json`); if(fs.existsSync(p)){ const c = JSON.parse(await fs.promises.readFile(p,'utf-8')); c.title = title; await fs.promises.writeFile(p, JSON.stringify(c,null,2)); return true; } return false; });
  ipcMain.handle('session:list', async () => { const d = getSessionsPath(); const f = await fs.promises.readdir(d); const s = []; for(const x of f){ if(x.endsWith('.json')){ try{ const j=JSON.parse(await fs.promises.readFile(path.join(d,x),'utf-8')); s.push({id:j.id, title:j.title, date:j.date}); }catch(e){} } } return s.sort((a,b)=>new Date(b.date)-new Date(a.date)); });
  ipcMain.handle('session:load', async (e, id) => JSON.parse(await fs.promises.readFile(path.join(getSessionsPath(), `${id}.json`), 'utf-8')));
  ipcMain.handle('session:delete', async (e, id) => { await fs.promises.unlink(path.join(getSessionsPath(), `${id}.json`)); return true; });
  ipcMain.handle('project:generate-graph', async (e, projectId) => { const p = path.join(getProjectsPath(), `${projectId}.json`); if (!fs.existsSync(p)) return { nodes: [], links: [] }; const projectData = JSON.parse(await fs.promises.readFile(p, 'utf-8')); const nodes = []; const links = []; projectData.files.forEach((file) => nodes.push({ id: file.name, group: file.type, path: file.path })); return { nodes, links }; });

  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });