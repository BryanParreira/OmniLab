// --- POLYFILLS ---
if (typeof DOMMatrix === 'undefined') { global.DOMMatrix = class DOMMatrix {}; }
if (typeof ImageData === 'undefined') { global.ImageData = class ImageData {}; }
if (typeof Path2D === 'undefined') { global.Path2D = class Path2D {}; }

const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { createTray } = require('./tray.cjs');

// --- LAZY LOAD MODULES (Prevents Startup Crashes) ---
const loadPdf = () => require('pdf-parse');
const loadCheerio = () => require('cheerio');

let mainWindow;

const getUserDataPath = () => app.getPath('userData');
const getSessionsPath = () => path.join(getUserDataPath(), 'sessions');
const getProjectsPath = () => path.join(getUserDataPath(), 'projects');
const getCachePath = () => path.join(getProjectsPath(), 'cache');
const getSettingsPath = () => path.join(getUserDataPath(), 'settings.json');

[getSessionsPath(), getProjectsPath(), getCachePath()].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const DEFAULT_SETTINGS = {
  ollamaUrl: "http://127.0.0.1:11434",
  defaultModel: "llama3",
  contextLength: 8192,
  temperature: 0.7,
  systemPrompt: "" 
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

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return mainWindow;
}

async function readProjectFiles(projectFiles) {
  let context = "";
  for (const file of projectFiles) {
    try {
      if (file.type === 'url') {
        const filePath = path.join(getCachePath(), file.cacheFile);
        if (fs.existsSync(filePath)) {
           const content = await fs.promises.readFile(filePath, 'utf-8');
           context += `\n--- WEB: ${file.name} ---\n${content.slice(0, 15000)}\n--- END WEB ---\n`;
        }
        continue;
      }
      const stats = await fs.promises.stat(file.path);
      if (stats.size > 10 * 1024 * 1024) continue; 
      
      if (file.path.toLowerCase().endsWith('.pdf')) {
        const pdf = loadPdf();
        const dataBuffer = await fs.promises.readFile(file.path);
        const data = await pdf(dataBuffer);
        context += `\n--- PDF: ${file.name} ---\n${data.text.slice(0, 15000)}\n--- END PDF ---\n`;
      } 
      else if (!['png','jpg','exe','bin','zip','iso'].includes(file.type.toLowerCase())) {
        const content = await fs.promises.readFile(file.path, 'utf-8');
        if (content.indexOf('\0') === -1) context += `\n--- FILE: ${file.name} ---\n${content}\n--- END FILE ---\n`;
      }
    } catch (e) { console.error(`Read error: ${file.name}`); }
  }
  return context;
}

app.whenReady().then(() => {
  const win = createWindow();
  createTray(win);

  // --- SETTINGS ---
  ipcMain.handle('settings:load', async () => {
    try {
      if (fs.existsSync(getSettingsPath())) {
        const data = JSON.parse(await fs.promises.readFile(getSettingsPath(), 'utf-8'));
        return { ...DEFAULT_SETTINGS, ...data };
      }
    } catch (e) { }
    return DEFAULT_SETTINGS;
  });

  ipcMain.handle('settings:save', async (e, settings) => {
    await fs.promises.writeFile(getSettingsPath(), JSON.stringify(settings, null, 2));
    return true;
  });

  // --- OLLAMA STREAM ---
  ipcMain.on('ollama:stream-prompt', async (event, { prompt, model, contextFiles, systemPrompt, settings }) => {
    if (!win) return;
    try {
      const config = settings || DEFAULT_SETTINGS;
      const baseUrl = config.ollamaUrl || "http://127.0.0.1:11434";
      
      let finalPrompt = "";
      
      const baseSystem = `
      You are Lumina 2.0.
      PROTOCOL:
      1. FIRST, output your thought process inside <thinking>...</thinking> tags.
      2. SECOND, provide the final answer after the closing tag.
      3. NEVER put thoughts inside code blocks.
      4. Use <mermaid>...</mermaid> for diagrams.
      `;

      const userSystem = systemPrompt || config.systemPrompt || "";
      finalPrompt += `SYSTEM: ${baseSystem}\n${userSystem}\n\n`;

      if (contextFiles && contextFiles.length > 0) {
        win.webContents.send('ollama:chunk', '<thinking>Reading project files...</thinking>'); 
        const fileContext = await readProjectFiles(contextFiles);
        finalPrompt += `CONTEXT FILES:\n${fileContext.slice(0, 80000)}\n\n`;
      }

      finalPrompt += `USER QUERY: ${prompt}`;

      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: model || config.defaultModel, 
          prompt: finalPrompt, 
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
        for (const line of lines) {
           try {
             const json = JSON.parse(line);
             if (json.response) win.webContents.send('ollama:chunk', json.response);
             if (json.done) win.webContents.send('ollama:chunk', '[DONE]');
           } catch (e) { }
        }
      }
    } catch (error) { win.webContents.send('ollama:error', `Connection Error: ${error.message}`); }
  });

  ipcMain.handle('ollama:status', async (e, url) => {
    try { const r = await fetch(`${url || 'http://127.0.0.1:11434'}/api/tags`); if(r.ok) return true; } catch(e){} return false;
  });
  
  ipcMain.handle('ollama:models', async (e, url) => { 
    try { 
      const r = await fetch(`${url || 'http://127.0.0.1:11434'}/api/tags`);
      const data = await r.json();
      return data.models.map(m => m.name);
    } catch(e) { return []; }
  });

  // --- PROJECT & FILES ---
  ipcMain.handle('project:add-url', async (e, { projectId, url }) => {
    try {
      const cheerio = loadCheerio();
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);
      $('script, style, nav, footer, iframe').remove();
      const text = $('body').text().replace(/\s\s+/g, ' ').trim();
      const filename = `web-${Date.now()}.txt`;
      await fs.promises.writeFile(path.join(getCachePath(), filename), text, 'utf-8');
      const projectPath = path.join(getProjectsPath(), `${projectId}.json`);
      const projectData = JSON.parse(await fs.promises.readFile(projectPath, 'utf-8'));
      projectData.files.push({ path: url, name: $('title').text() || url, type: 'url', cacheFile: filename });
      await fs.promises.writeFile(projectPath, JSON.stringify(projectData, null, 2));
      return projectData.files;
    } catch (e) { throw new Error("Scrape Failed"); }
  });

  ipcMain.handle('system:save-file', async (e, { content, filename }) => {
    const { filePath } = await dialog.showSaveDialog(win, { defaultPath: filename || 'untitled.txt', });
    if (filePath) { await fs.promises.writeFile(filePath, content, 'utf-8'); return true; }
    return false;
  });

  // CRUD
  ipcMain.handle('project:update-settings', async (e, { id, systemPrompt }) => {
    const p = path.join(getProjectsPath(), `${id}.json`);
    if (fs.existsSync(p)) { const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); d.systemPrompt = systemPrompt; await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); return d; } return null;
  });
  ipcMain.handle('project:list', async () => {
    const d = getProjectsPath(); const f = await fs.promises.readdir(d); const p = []; for (const x of f) { if(x.endsWith('.json')) p.push(JSON.parse(await fs.promises.readFile(path.join(d, x), 'utf-8'))); } return p;
  });
  ipcMain.handle('project:create', async (e, { id, name }) => {
    const p = path.join(getProjectsPath(), `${id}.json`); const n = { id, name, files: [], systemPrompt: "", createdAt: new Date() }; await fs.promises.writeFile(p, JSON.stringify(n, null, 2)); return n;
  });
  ipcMain.handle('project:add-files', async (e, projectId) => {
    const r = await dialog.showOpenDialog(win, { properties: ['openFile', 'multiSelections'] }); if (!r.canceled) { const p = path.join(getProjectsPath(), `${projectId}.json`); const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); const n = r.filePaths.map(x => ({ path: x, name: path.basename(x), type: path.extname(x).substring(1) })); d.files.push(...n.filter(f => !d.files.some(ex => ex.path === f.path))); await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); return d.files; } return null;
  });
  ipcMain.handle('project:delete', async (e, id) => { await fs.promises.unlink(path.join(getProjectsPath(), `${id}.json`)); return true; });
  ipcMain.handle('session:save', async (e, { id, title, messages, date }) => {
    const p = path.join(getSessionsPath(), `${id}.json`); let t = title; if(fs.existsSync(p)){ const ex = JSON.parse(await fs.promises.readFile(p,'utf-8')); if(ex.title && ex.title!=="New Chat" && (!title||title==="New Chat")) t = ex.title; } await fs.promises.writeFile(p, JSON.stringify({ id, title:t||"New Chat", messages, date }, null, 2)); return true;
  });
  ipcMain.handle('session:rename', async (e, { id, title }) => {
    const p = path.join(getSessionsPath(), `${id}.json`); if(fs.existsSync(p)){ const c = JSON.parse(await fs.promises.readFile(p,'utf-8')); c.title = title; await fs.promises.writeFile(p, JSON.stringify(c,null,2)); return true; } return false;
  });
  ipcMain.handle('session:list', async () => {
    const d = getSessionsPath(); const f = await fs.promises.readdir(d); const s = []; for(const x of f){ if(x.endsWith('.json')){ try{ const j=JSON.parse(await fs.promises.readFile(path.join(d,x),'utf-8')); s.push({id:j.id, title:j.title, date:j.date}); }catch(e){} } } return s.sort((a,b)=>new Date(b.date)-new Date(a.date));
  });
  ipcMain.handle('session:load', async (e, id) => JSON.parse(await fs.promises.readFile(path.join(getSessionsPath(), `${id}.json`), 'utf-8')));
  ipcMain.handle('session:delete', async (e, id) => { await fs.promises.unlink(path.join(getSessionsPath(), `${id}.json`)); return true; });

  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });