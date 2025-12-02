const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lumina', {
  // --- AI CORE ---
  checkOllamaStatus: (url) => ipcRenderer.invoke('ollama:status', url),
  getModels: (url) => ipcRenderer.invoke('ollama:models', url),
  
  sendPrompt: (prompt, model, contextFiles, systemPrompt, settings, projectId) => 
    ipcRenderer.send('ollama:stream-prompt', { prompt, model, contextFiles, systemPrompt, settings, projectId }),
  
  generateJson: (prompt, model, settings) => ipcRenderer.invoke('ollama:generate-json', { prompt, model, settings }),
  
  // --- LISTENERS ---
  onResponseChunk: (cb) => {
    const sub = (_e, data) => cb(data);
    ipcRenderer.on('ollama:chunk', sub);
    return () => ipcRenderer.removeListener('ollama:chunk', sub);
  },
  onAIError: (cb) => {
    const sub = (_e, message) => cb(message);
    ipcRenderer.on('ollama:error', sub);
    return () => ipcRenderer.removeListener('ollama:error', sub);
  },
  
  // --- AUTO UPDATER API (NEW) ---
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  downloadUpdate: () => ipcRenderer.send('download-update'),
  quitAndInstall: () => ipcRenderer.send('quit-and-install'),
  onUpdateMessage: (callback) => {
    const sub = (_e, value) => callback(value);
    ipcRenderer.on('update-message', sub);
    return () => ipcRenderer.removeListener('update-message', sub);
  },

  // --- SYSTEM ---
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  saveGeneratedFile: (content, filename) => ipcRenderer.invoke('system:save-file', { content, filename }),
  resetSystem: () => ipcRenderer.invoke('system:factory-reset'),

  // --- PROJECTS & FILES ---
  getProjects: () => ipcRenderer.invoke('project:list'),
  createProject: (data) => ipcRenderer.invoke('project:create', data),
  addFilesToProject: (id) => ipcRenderer.invoke('project:add-files', id),
  addFolderToProject: (id) => ipcRenderer.invoke('project:add-folder', id),
  addUrlToProject: (id, url) => ipcRenderer.invoke('project:add-url', { projectId: id, url }),
  updateProjectSettings: (id, systemPrompt) => ipcRenderer.invoke('project:update-settings', { id, systemPrompt }),
  deleteProject: (id) => ipcRenderer.invoke('project:delete', id),
  scaffoldProject: (projectId, structure) => ipcRenderer.invoke('project:scaffold', { projectId, structure }),

  // --- ADVANCED FEATURES ---
  generateGraph: (id) => ipcRenderer.invoke('project:generate-graph', id),
  runDeepResearch: (id, url) => ipcRenderer.invoke('agent:deep-research', { projectId: id, url }),
  getGitStatus: (id) => ipcRenderer.invoke('git:status', id),
  getGitDiff: (id) => ipcRenderer.invoke('git:diff', id),

  // --- SESSIONS & CALENDAR ---
  saveSession: (data) => ipcRenderer.invoke('session:save', data),
  getSessions: () => ipcRenderer.invoke('session:list'),
  loadSession: (id) => ipcRenderer.invoke('session:load', id),
  deleteSession: (id) => ipcRenderer.invoke('session:delete', id),
  renameSession: (id, title) => ipcRenderer.invoke('session:rename', { id, title }),
  loadCalendar: () => ipcRenderer.invoke('calendar:load'),
  saveCalendar: (events) => ipcRenderer.invoke('calendar:save', events),
});