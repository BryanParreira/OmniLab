const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lumina', {
  checkOllamaStatus: (url) => ipcRenderer.invoke('ollama:status', url),
  getModels: (url) => ipcRenderer.invoke('ollama:models', url),
  sendPrompt: (prompt, model, contextFiles, systemPrompt, settings) => 
    ipcRenderer.send('ollama:stream-prompt', { prompt, model, contextFiles, systemPrompt, settings }),
  onResponseChunk: (cb) => {
    const sub = (_e, data) => cb(data);
    ipcRenderer.on('ollama:chunk', sub);
    return () => ipcRenderer.removeListener('ollama:chunk', sub);
  },
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  saveGeneratedFile: (content, filename) => ipcRenderer.invoke('system:save-file', { content, filename }),
  getProjects: () => ipcRenderer.invoke('project:list'),
  createProject: (data) => ipcRenderer.invoke('project:create', data),
  addFilesToProject: (id) => ipcRenderer.invoke('project:add-files', id),
  addFolderToProject: (id) => ipcRenderer.invoke('project:add-folder', id),
  addUrlToProject: (id, url) => ipcRenderer.invoke('project:add-url', { projectId: id, url }),
  updateProjectSettings: (id, systemPrompt) => ipcRenderer.invoke('project:update-settings', { id, systemPrompt }),
  deleteProject: (id) => ipcRenderer.invoke('project:delete', id),
  saveSession: (data) => ipcRenderer.invoke('session:save', data),
  getSessions: () => ipcRenderer.invoke('session:list'),
  loadSession: (id) => ipcRenderer.invoke('session:load', id),
  deleteSession: (id) => ipcRenderer.invoke('session:delete', id),
  renameSession: (id, title) => ipcRenderer.invoke('session:rename', { id, title }),
  generateGraph: (id) => ipcRenderer.invoke('project:generate-graph', id),
  runDeepResearch: (id, url) => ipcRenderer.invoke('agent:deep-research', { projectId: id, url }),
  getGitStatus: (id) => ipcRenderer.invoke('git:status', id),
  getGitDiff: (id) => ipcRenderer.invoke('git:diff', id),
});