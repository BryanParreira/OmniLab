const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lumina', {
  // ==========================================
  // SETTINGS
  // ==========================================
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  
  // ==========================================
  // SYSTEM
  // ==========================================
  resetSystem: () => ipcRenderer.invoke('system:factory-reset'),
  deleteChats: () => ipcRenderer.invoke('system:delete-chats'),
  deleteCache: () => ipcRenderer.invoke('system:delete-cache'),
  deleteCalendar: () => ipcRenderer.invoke('system:delete-calendar'),
  
  // ==========================================
  // FILE OPERATIONS
  // ==========================================
  saveFile: (content, filename) => ipcRenderer.invoke('system:save-file', { content, filename }),
  saveGeneratedFile: (content, filename) => ipcRenderer.invoke('system:save-generated-file', { content, filename }),
  readFile: (filename) => ipcRenderer.invoke('system:read-file', filename),
  listFiles: (directory) => ipcRenderer.invoke('system:list-files', directory),
  deleteFile: (filename) => ipcRenderer.invoke('system:delete-file', filename),
  openFile: (filePath) => ipcRenderer.invoke('system:open-file', filePath),
  
  // ==========================================
  // PROJECTS
  // ==========================================
  getProjects: () => ipcRenderer.invoke('project:list'),
  createProject: (data) => ipcRenderer.invoke('project:create', data),
  deleteProject: (id) => ipcRenderer.invoke('project:delete', id),
  updateProjectSettings: (id, systemPrompt) => ipcRenderer.invoke('project:update-settings', { id, systemPrompt }),
  deleteFileFromProject: (projectId, filePath) => ipcRenderer.invoke('project:delete-file', { projectId, filePath }),
  addFileToProject: (projectId, filename) => ipcRenderer.invoke('project:add-file-to-project', { projectId, filename }),
  addFilesToProject: (projectId) => ipcRenderer.invoke('project:add-files', projectId),
  addFolderToProject: (projectId) => ipcRenderer.invoke('project:add-folder', projectId),
  addUrlToProject: (projectId, url) => ipcRenderer.invoke('project:add-url', { projectId, url }),
  scaffoldProject: (projectId, structure) => ipcRenderer.invoke('project:scaffold', { projectId, structure }),
  saveProjectDossier: (id, dossier) => ipcRenderer.invoke('project:save-dossier', { id, dossier }),
  generateProjectGraph: (projectId) => ipcRenderer.invoke('project:generate-graph', projectId),
  
  // ==========================================
  // SESSIONS
  // ==========================================
  saveSession: (data) => ipcRenderer.invoke('session:save', data),
  getSessions: () => ipcRenderer.invoke('session:list'),
  loadSession: (id) => ipcRenderer.invoke('session:load', id),
  deleteSession: (id) => ipcRenderer.invoke('session:delete', id),
  renameSession: (id, title) => ipcRenderer.invoke('session:rename', { id, title }),
  
  // ==========================================
  // CALENDAR
  // ==========================================
  loadCalendar: () => ipcRenderer.invoke('calendar:load'),
  saveCalendar: (events) => ipcRenderer.invoke('calendar:save', events),
  
  // ==========================================
  // GIT
  // ==========================================
  getGitStatus: (projectId) => ipcRenderer.invoke('git:status', projectId),
  getGitDiff: (projectId) => ipcRenderer.invoke('git:diff', projectId),
  
  // ==========================================
  // AI AGENTS
  // ==========================================
  runDeepResearch: (projectId, url) => ipcRenderer.invoke('agent:deep-research', { projectId, url }),
  
  // ==========================================
  // OLLAMA AI
  // ==========================================
  sendPrompt: (prompt, model, contextFiles, systemPrompt, settings, projectId, images, documentContext) => {
    ipcRenderer.send('ollama:stream-prompt', {
      prompt,
      model,
      contextFiles,
      systemPrompt,
      settings,
      projectId,
      images,
      documentContext
    });
  },
  
  generateJson: (prompt, model, settings, projectId) => 
    ipcRenderer.invoke('ollama:generate-json', { prompt, model, settings, projectId }),
  
  completion: (prompt, model, settings) => 
    ipcRenderer.invoke('ollama:completion', { prompt, model, settings }),
  
  checkOllamaStatus: (url) => ipcRenderer.invoke('ollama:status', url),
  getModels: (url) => ipcRenderer.invoke('ollama:models', url),
  
  // Ollama Event Listeners
  onResponseChunk: (callback) => {
    ipcRenderer.on('ollama:chunk', (_, chunk) => callback(chunk));
    return () => ipcRenderer.removeAllListeners('ollama:chunk');
  },
  
  onAIError: (callback) => {
    ipcRenderer.on('ollama:error', (_, message) => callback(message));
    return () => ipcRenderer.removeAllListeners('ollama:error');
  },
  
  // ==========================================
  // UPDATER
  // ==========================================
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  downloadUpdate: () => ipcRenderer.send('download-update'),
  quitAndInstall: () => ipcRenderer.send('quit-and-install'),
  
  onUpdateMessage: (callback) => {
    ipcRenderer.on('update-message', (_, message) => callback(message));
    return () => ipcRenderer.removeAllListeners('update-message');
  }
});
