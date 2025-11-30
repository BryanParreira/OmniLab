if (typeof DOMMatrix === 'undefined') { global.DOMMatrix = class DOMMatrix {}; }
if (typeof ImageData === 'undefined') { global.ImageData = class ImageData {}; }
if (typeof Path2D === 'undefined') { global.Path2D = class Path2D {}; }

const { app, BrowserWindow, ipcMain, shell, dialog, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { createTray } = require('./tray.cjs');

const loadPdf = () => require('pdf-parse');
const loadCheerio = () => require('cheerio');
const loadGit = () => require('simple-git');

// --- GLOBAL VARIABLES ---
// Important: These must be global to prevent Garbage Collection
let mainWindow;
let tray = null; 

// --- PATHS ---
const getUserDataPath = () => app.getPath('userData');
const getSessionsPath = () => path.join(getUserDataPath(), 'sessions');
const getProjectsPath = () => path.join(getUserDataPath(), 'projects');
const getCachePath = () => path.join(getProjectsPath(), 'cache');
const getSettingsPath = () => path.join(getUserDataPath(), 'settings.json');
const getCalendarPath = () => path.join(getUserDataPath(), 'calendar.json');

[getSessionsPath(), getProjectsPath(), getCachePath()].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// --- SETTINGS ---
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
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

// --- SMART FILE ENGINE ---
async function readProjectFiles(projectFiles) {
  const MAX_CONTEXT_CHARS = 32000; 
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

      if (!fs.existsSync(file.path)) continue;
      const stats = await fs.promises.stat(file.path);
      if (stats.size > 5 * 1024 * 1024) continue; 
      
      let fileContent = "";
      if (file.path.toLowerCase().endsWith('.pdf')) {
        const pdf = loadPdf();
        const dataBuffer = await fs.promises.readFile(file.path);
        const data = await pdf(dataBuffer);
        fileContent = data.text;
      } 
      else if (!['png','jpg','jpeg','gif','exe','bin','zip','iso','dll','dmg'].includes(file.type.toLowerCase())) {
        fileContent = await fs.promises.readFile(file.path, 'utf-8');
        if (fileContent.indexOf('\0') !== -1) fileContent = "";
      }

      if (fileContent) {
        if (fileContent.length > 5000) {
          fileContent = fileContent.slice(0, 5000) + `\n... [File ${file.name} Truncated] ...`;
        }
        const entry = `\n>>> FILE: ${file.name}\n${fileContent}\n`;
        if (currentChars + entry.length < MAX_CONTEXT_CHARS) {
          context += entry;
          currentChars += entry.length;
        }
      }
    } catch (e) { console.warn(`Could not read file ${file.name}:`, e); }
  }
  return context;
}

async function scanDirectory(dirPath, fileList = []) {
  try {
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build', '.next', '.vscode', '.idea', 'target', 'vendor', 'bin', 'obj', 'coverage'].includes(file.name)) {
          await scanDirectory(fullPath, fileList);
        }
      } else {
        if (!['.DS_Store', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'].includes(file.name)) {
          fileList.push({ path: fullPath, name: file.name, type: path.extname(file.name).substring(1) });
        }
      }
    }
  } catch (e) {}
  return fileList;
}

const gitHandler = {
  async getStatus(rootPath) { try { if (!rootPath || !fs.existsSync(path.join(rootPath, '.git'))) return null; const git = loadGit()(rootPath); const status = await git.status(); return { current: status.current, modified: status.modified, staged: status.staged, clean: status.isClean() }; } catch (e) { return null; } },
  async getDiff(rootPath) { try { if (!rootPath) return ""; const git = loadGit()(rootPath); let diff = await git.diff(['--staged']); if (!diff) diff = await git.diff(); return diff; } catch (e) { return ""; } }
};

app.whenReady().then(() => {
  const win = createWindow();
  
  // --- CRITICAL FIX: Assign tray to global variable ---
  tray = createTray(win); 

  ipcMain.handle('settings:load', async () => {
    try { if (fs.existsSync(getSettingsPath())) { const data = JSON.parse(await fs.promises.readFile(getSettingsPath(), 'utf-8')); return { ...DEFAULT_SETTINGS, ...data }; } } catch (e) { } return DEFAULT_SETTINGS;
  });
  ipcMain.handle('settings:save', async (e, settings) => { await fs.promises.writeFile(getSettingsPath(), JSON.stringify(settings, null, 2)); return true; });

  ipcMain.handle('project:scaffold', async (e, { projectId, structure }) => {
    const p = path.join(getProjectsPath(), `${projectId}.json`);
    if (!fs.existsSync(p)) throw new Error("Project not found");
    const projectData = JSON.parse(await fs.promises.readFile(p, 'utf-8'));
    if (!projectData.rootPath) throw new Error("NO_ROOT_PATH");
    const root = projectData.rootPath;
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

  // --- OLLAMA STREAM ---
  ipcMain.on('ollama:stream-prompt', async (event, { prompt, model, contextFiles, systemPrompt, settings }) => {
    if (!win) return;
    
    const config = settings || DEFAULT_SETTINGS;
    let baseUrl = config.ollamaUrl || "http://127.0.0.1:11434";
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    baseUrl = baseUrl.replace('localhost', '127.0.0.1');

    // 1. AUTO-DETECT MODEL
    let selectedModel = model || config.defaultModel;
    if (!selectedModel) {
      try {
        const tagsReq = net.request(`${baseUrl}/api/tags`);
        const tagsData = await new Promise((resolve, reject) => {
          tagsReq.on('response', (res) => {
            let d = "";
            res.on('data', c => d += c);
            res.on('end', () => resolve(d));
          });
          tagsReq.on('error', reject);
          tagsReq.end();
        });
        const json = JSON.parse(tagsData);
        if (json.models && json.models.length > 0) selectedModel = json.models[0].name;
      } catch (e) {
        win.webContents.send('ollama:error', "No AI models found.");
        return;
      }
    }

    if (!selectedModel) {
       win.webContents.send('ollama:error', "No model selected.");
       return;
    }

    // 2. SYSTEM PROMPT
    const groundingRules = `
STRICT RULES:
1. If [SOURCE_MATERIAL] is provided, base answers on it.
2. If the answer is not in the context, say "I don't know."
3. FORMATTING:
   - Use plain text for normal conversation.
   - Do NOT wrap normal sentences in markdown code blocks.
   - ONLY use markdown code blocks (\`\`\`) for actual code snippets.
`;

    const baseSystem = config.developerMode 
      ? `You are OmniLab Forge, a Senior Engineer.\n${groundingRules}\nBe concise. If asked for code, output it immediately.` 
      : `You are OmniLab Nexus, a Research Assistant.\n${groundingRules}\nBe helpful and clear.`;
      
    const systemPromptFinal = `${baseSystem}\n${systemPrompt || config.systemPrompt || ""}`;

    // 3. Load Files
    let contextStr = "";
    if (contextFiles && contextFiles.length > 0) {
      contextStr = await readProjectFiles(contextFiles);
      win.webContents.send('ollama:chunk', ''); 
    }

    const fullPrompt = contextStr 
      ? `[SOURCE_MATERIAL_START]\n${contextStr}\n[SOURCE_MATERIAL_END]\n\nQUESTION: ${prompt}` 
      : prompt;

    // 4. Send Request
    const requestBody = JSON.stringify({ 
      model: selectedModel, 
      prompt: `[SYSTEM]${systemPromptFinal}\n\n[USER]${fullPrompt}`,
      stream: true,
      options: { 
        num_ctx: parseInt(config.contextLength) || 8192, 
        temperature: contextStr ? 0.1 : 0.4, 
        num_threads: 8,
        repeat_penalty: 1.1 
      }
    });

    try {
      const request = net.request({
        method: 'POST',
        url: `${baseUrl}/api/generate`,
      });
      request.setHeader('Content-Type', 'application/json');

      request.on('response', (response) => {
        if (response.statusCode !== 200) {
          win.webContents.send('ollama:error', `Ollama Error: ${response.statusCode}`);
          return;
        }
        let buffer = "";
        response.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop(); 
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const json = JSON.parse(line);
              if (json.response) win.webContents.send('ollama:chunk', json.response);
              if (json.done) win.webContents.send('ollama:chunk', '[DONE]');
            } catch (e) {}
          }
        });
        response.on('end', () => {
          if (buffer.trim()) {
            try {
              const json = JSON.parse(buffer);
              if (json.response) win.webContents.send('ollama:chunk', json.response);
              if (json.done) win.webContents.send('ollama:chunk', '[DONE]');
            } catch(e) {}
          }
        });
        response.on('error', (err) => {
          win.webContents.send('ollama:error', `Stream Error: ${err.message}`);
        });
      });

      request.on('error', (err) => {
        win.webContents.send('ollama:error', "Could not connect to AI engine.");
      });

      request.write(requestBody);
      request.end();
    } catch (error) {
      win.webContents.send('ollama:error', `Critical Error: ${error.message}`);
    }
  });

  ipcMain.handle('ollama:generate-json', async (e, { prompt, model, settings }) => { 
    const config = settings || DEFAULT_SETTINGS; 
    let baseUrl = config.ollamaUrl || "http://127.0.0.1:11434";
    baseUrl = baseUrl.replace('localhost', '127.0.0.1');

    let selectedModel = model || config.defaultModel;
    if(!selectedModel) {
        try {
            const r = await net.fetch(`${baseUrl}/api/tags`);
            const d = await r.json();
            if(d.models && d.models.length>0) selectedModel = d.models[0].name;
        } catch(e){}
    }

    return new Promise((resolve) => {
      const request = net.request({ method: 'POST', url: `${baseUrl}/api/generate` });
      request.setHeader('Content-Type', 'application/json');
      let fullData = "";
      request.on('response', (response) => {
        response.on('data', (chunk) => { fullData += chunk.toString(); });
        response.on('end', () => {
           try {
             const jsonResp = JSON.parse(fullData);
             let rawText = jsonResp.response.trim();
             if (rawText.startsWith('```json')) rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
             else if (rawText.startsWith('```')) rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '');
             resolve(JSON.parse(rawText));
           } catch (err) { resolve([]); }
        });
      });
      request.on('error', () => resolve([]));
      request.write(JSON.stringify({ model: selectedModel, prompt: prompt, format: 'json', stream: false, options: { temperature: 0.1 } }));
      request.end();
    });
  });

  ipcMain.handle('ollama:status', async (e, url) => { 
    try {
      let target = url || 'http://127.0.0.1:11434';
      if (target.endsWith('/')) target = target.slice(0, -1);
      target = target.replace('localhost', '127.0.0.1');
      const request = net.request(`${target}/api/tags`);
      return new Promise((resolve) => {
        request.on('response', (response) => resolve(response.statusCode === 200));
        request.on('error', () => resolve(false));
        request.end();
      });
    } catch(e){ return false; } 
  });

  ipcMain.handle('ollama:models', async (e, url) => { 
    try {
      let target = url || 'http://127.0.0.1:11434';
      if (target.endsWith('/')) target = target.slice(0, -1);
      target = target.replace('localhost', '127.0.0.1');
      const request = net.request(`${target}/api/tags`);
      let data = "";
      return new Promise((resolve) => {
        request.on('response', (r) => {
           r.on('data', chunk => data += chunk);
           r.on('end', () => { try { resolve(JSON.parse(data).models.map(m => m.name)); } catch { resolve([]); } });
        });
        request.on('error', () => resolve([]));
        request.end();
      });
    } catch(e) { return []; } 
  });

  // --- AI CALENDAR PLANNER ---
  ipcMain.handle('agent:calendar-plan', async (e, { topic, endDate, hoursPerDay, goals }) => {
    try {
      // 1. Get Config & Model
      let config = DEFAULT_SETTINGS;
      if (fs.existsSync(getSettingsPath())) {
         try { config = { ...DEFAULT_SETTINGS, ...JSON.parse(await fs.promises.readFile(getSettingsPath(), 'utf-8')) }; } catch(e){}
      }
      
      let baseUrl = config.ollamaUrl || "http://127.0.0.1:11434";
      if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
      baseUrl = baseUrl.replace('localhost', '127.0.0.1');

      // Auto-detect model if missing
      let selectedModel = config.defaultModel;
      if(!selectedModel) {
          try {
              const r = await net.fetch(`${baseUrl}/api/tags`);
              const d = await r.json();
              if(d.models && d.models.length > 0) selectedModel = d.models[0].name;
          } catch(e){}
      }
      if(!selectedModel) return []; // Fail gracefully if no model

      // 2. Strict JSON Prompt
      const prompt = `
        ACT AS: A Project Manager.
        TASK: Create a detailed schedule for "${topic}" ending on ${endDate}.
        CONSTRAINTS: ${hoursPerDay} hours/day. Focus: ${goals}.
        OUTPUT: STRICT JSON Array ONLY. No markdown. No text.
        FORMAT: [{"title": "Step Name", "date": "YYYY-MM-DD", "type": "task", "notes": "Details", "priority": "medium", "time": "09:00"}]
        Create 5-10 actionable steps.
      `;

      // 3. Call AI
      const response = await net.fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        body: JSON.stringify({
          model: selectedModel,
          prompt: prompt,
          format: "json",
          stream: false,
          options: { temperature: 0.2 }
        })
      });

      const data = await response.json();
      
      // 4. Clean JSON
      let cleanJson = data.response.trim();
      if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      else if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      
      const events = JSON.parse(cleanJson);
      return Array.isArray(events) ? events : [];

    } catch (e) {
      console.error("AI Planner Failed:", e);
      return [];
    }
  });

  // --- CRUD HANDLERS ---
  ipcMain.handle('project:add-url', async (e, { projectId, url }) => { try { const cheerio = loadCheerio(); const response = await fetch(url); const html = await response.text(); const $ = cheerio.load(html); $('script, style, nav, footer, iframe').remove(); const content = $('body').text().replace(/\s\s+/g, ' ').trim(); const filename = `web-${Date.now()}.txt`; await fs.promises.writeFile(path.join(getCachePath(), filename), content, 'utf-8'); const projectPath = path.join(getProjectsPath(), `${projectId}.json`); const projectData = JSON.parse(await fs.promises.readFile(projectPath, 'utf-8')); projectData.files.push({ path: url, name: $('title').text() || url, type: 'url', cacheFile: filename }); await fs.promises.writeFile(projectPath, JSON.stringify(projectData, null, 2)); return projectData.files; } catch (e) { throw new Error("Scrape Failed"); } });
  ipcMain.handle('system:save-file', async (e, { content, filename }) => { const { filePath } = await dialog.showSaveDialog(win, { defaultPath: filename || 'untitled.txt', }); if (filePath) { await fs.promises.writeFile(filePath, content, 'utf-8'); return true; } return false; });
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
  ipcMain.handle('agent:deep-research', async (e, { projectId, url }) => { try { const cheerio = loadCheerio(); const response = await fetch(url); const html = await response.text(); const $ = cheerio.load(html); $('script, style, nav, footer, iframe').remove(); const content = $('body').text().replace(/\s\s+/g, ' ').trim().slice(0, 15000); const filename = `research-${Date.now()}.txt`; await fs.promises.writeFile(path.join(getCachePath(), filename), content, 'utf-8'); const projectPath = path.join(getProjectsPath(), `${projectId}.json`); const projectData = JSON.parse(await fs.promises.readFile(projectPath, 'utf-8')); projectData.files.push({ path: url, name: `[Research] ${$('title').text()}`, type: 'url', cacheFile: filename }); await fs.promises.writeFile(projectPath, JSON.stringify(projectData, null, 2)); return content; } catch (e) { throw new Error("Research Failed"); } });
  ipcMain.handle('system:factory-reset', async () => { try { const del = async (d) => { if(fs.existsSync(d)){ for(const f of await fs.promises.readdir(d)){ const c=path.join(d,f); if((await fs.promises.lstat(c)).isDirectory()) await fs.promises.rm(c,{recursive:true}); else await fs.promises.unlink(c); } } }; await del(getSessionsPath()); await del(getProjectsPath()); await fs.promises.writeFile(getSettingsPath(), JSON.stringify(DEFAULT_SETTINGS)); return true; } catch(e){ return false; } });
  ipcMain.handle('git:status', async (e, projectId) => { const p = path.join(getProjectsPath(), `${projectId}.json`); if (!fs.existsSync(p)) return null; const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); return d.rootPath ? await gitHandler.getStatus(d.rootPath) : null; });
  ipcMain.handle('git:diff', async (e, projectId) => { const p = path.join(getProjectsPath(), `${projectId}.json`); const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); return d.rootPath ? await gitHandler.getDiff(d.rootPath) : ""; });
  ipcMain.handle('calendar:load', async () => { try { if (fs.existsSync(getCalendarPath())) return JSON.parse(await fs.promises.readFile(getCalendarPath(), 'utf-8')); return []; } catch (e) { return []; } });
  ipcMain.handle('calendar:save', async (e, events) => { try { await fs.promises.writeFile(getCalendarPath(), JSON.stringify(events, null, 2)); return true; } catch (e) { return false; } });

  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });