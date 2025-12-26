import React, { createContext, useContext, useState, useEffect, useCallback, useReducer, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

const LuminaContext = createContext();

const messagesReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_USER_MESSAGE':
      return [...state, { 
        role: 'user', 
        content: action.payload.text,
        attachments: action.payload.attachments || [],
        attachmentsProcessed: true
      }];
    case 'ADD_ASSISTANT_MESSAGE':
      return [...state, { role: 'assistant', content: '' }];
    case 'APPEND_TO_LAST':
      if (state.length === 0) return state;
      return [
        ...state.slice(0, -1),
        { ...state[state.length - 1], content: state[state.length - 1].content + action.payload }
      ];
    case 'SET_MESSAGES':
      return action.payload.map(msg => ({
        ...msg,
        attachmentsProcessed: true
      }));
    case 'CLEAR_MESSAGES':
      return [];
    default:
      return state;
  }
};

export const LuminaProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    ollamaUrl: "http://127.0.0.1:11434",
    defaultModel: "",
    contextLength: 8192,
    temperature: 0.3,
    systemPrompt: "",
    developerMode: false,
    fontSize: 14,
    chatDensity: 'comfortable'
  });

  // --- THEME ENGINE: STRICT MODE SEPARATION ---
  const theme = useMemo(() => {
    const isDev = settings.developerMode;
    return {
      mode: isDev ? 'FORGE' : 'NEXUS',
      primary: isDev ? 'text-rose-500' : 'text-indigo-500',
      primaryBg: isDev ? 'bg-rose-600' : 'bg-indigo-600',
      primaryBorder: isDev ? 'border-rose-500/50' : 'border-indigo-500/50',
      primaryText: isDev ? 'text-rose-500' : 'text-indigo-500',
      glow: isDev ? 'shadow-rose-500/20' : 'shadow-indigo-500/20',
      accentText: isDev ? 'text-rose-400' : 'text-indigo-400',
      softBg: isDev ? 'bg-rose-500/10' : 'bg-indigo-500/10',
      softBorder: isDev ? 'border-rose-500/30' : 'border-indigo-500/30',
      hoverBg: isDev ? 'hover:bg-rose-500/20' : 'hover:bg-indigo-500/20',
      gradient: isDev ? 'from-rose-600 to-orange-600' : 'from-indigo-600 to-violet-600'
    };
  }, [settings.developerMode]);

  const [messages, messagesDispatch] = useReducer(messagesReducer, []);
  const [isLoading, setIsLoading] = useState(false);
  const [isOllamaRunning, setIsOllamaRunning] = useState(false);
  const [currentModel, setCurrentModel] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [gitStatus, setGitStatus] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [artifacts, setArtifacts] = useState([]);
  const [activeArtifactId, setActiveArtifactId] = useState(null);

  const activeArtifact = useMemo(() => 
    artifacts.find(a => a.id === activeArtifactId) || null
  , [artifacts, activeArtifactId]);

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [undoHistory, setUndoHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [canvasNodes, setCanvasNodes] = useState([]);
  const [canvasConnections, setCanvasConnections] = useState([]);
  const [zenithFiles, setZenithFiles] = useState([]);

  // --- UNDO/REDO SYSTEM ---
  const addToUndoHistory = useCallback((action) => {
    setUndoHistory(prev => [...prev.slice(-19), { ...action, timestamp: Date.now() }]);
    setRedoHistory([]);
  }, []);

  const performUndo = useCallback(() => {
    if (undoHistory.length === 0) return;
    const lastAction = undoHistory[undoHistory.length - 1];
    if (lastAction.undo) lastAction.undo();
    setUndoHistory(prev => prev.slice(0, -1));
    setRedoHistory(prev => [...prev, lastAction]);
  }, [undoHistory]);

  const performRedo = useCallback(() => {
    if (redoHistory.length === 0) return;
    const lastRedo = redoHistory[redoHistory.length - 1];
    
    // Simple redo logic for specific types
    if (lastRedo.type === 'add-canvas-node') {
      setCanvasNodes(prev => [...prev, lastRedo.data.node]);
    } else if (lastRedo.type === 'update-canvas-node') {
      setCanvasNodes(prev => prev.map(n => 
        n.id === lastRedo.data.id ? { ...n, ...lastRedo.data.updates } : n
      ));
    } else if (lastRedo.type === 'delete-canvas-node') {
      setCanvasNodes(prev => prev.filter(n => n.id !== lastRedo.data.node.id));
      setCanvasConnections(prev => prev.filter(c => 
        c.from !== lastRedo.data.node.id && c.to !== lastRedo.data.node.id
      ));
    } else if (lastRedo.type === 'add-event') {
      setCalendarEvents(prev => [...prev, lastRedo.data.event]);
    } else if (lastRedo.type === 'delete-event') {
      setCalendarEvents(prev => prev.filter(e => e.id !== lastRedo.data.event.id));
    }
    
    setRedoHistory(prev => prev.slice(0, -1));
    setUndoHistory(prev => [...prev, lastRedo]);
  }, [redoHistory]);

  const handleContextNavigation = useCallback((source, metadata) => {
    switch (source) {
      case 'zenith':
        if (metadata.filename) setCurrentView('zenith');
        break;
      case 'canvas':
        setCurrentView('canvas');
        break;
      case 'chat':
        if (metadata.sessionId) {
          loadSession(metadata.sessionId);
          setCurrentView('chat');
        }
        break;
      case 'chronos':
        setCurrentView('chronos');
        break;
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        performUndo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        performRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performUndo, performRedo]);
  
  const addCanvasNode = useCallback((type, x, y, data = {}) => {
    const newNode = { id: uuidv4(), type, x, y, data: { title: 'New Item', content: '', ...data } };
    setCanvasNodes(prev => [...prev, newNode]);
    
    addToUndoHistory({
      type: 'add-canvas-node',
      data: { node: newNode },
      undo: () => setCanvasNodes(prev => prev.filter(n => n.id !== newNode.id))
    });
    return newNode.id;
  }, [addToUndoHistory]);

  const updateCanvasNode = useCallback((id, updates) => {
    const oldNode = canvasNodes.find(n => n.id === id);
    if (!oldNode) return;
    setCanvasNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    
    addToUndoHistory({
      type: 'update-canvas-node',
      data: { id, oldNode, updates },
      undo: () => setCanvasNodes(prev => prev.map(n => n.id === id ? oldNode : n))
    });
  }, [canvasNodes, addToUndoHistory]);

  const deleteCanvasNode = useCallback((id) => {
    const deletedNode = canvasNodes.find(n => n.id === id);
    const deletedConnections = canvasConnections.filter(c => c.from === id || c.to === id);
    setCanvasNodes(prev => prev.filter(n => n.id !== id));
    setCanvasConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
    addToUndoHistory({
      type: 'delete-canvas-node',
      data: { node: deletedNode, connections: deletedConnections },
      undo: () => {
        setCanvasNodes(prev => [...prev, deletedNode]);
        setCanvasConnections(prev => [...prev, ...deletedConnections]);
      }
    });
  }, [canvasNodes, canvasConnections, addToUndoHistory]);

  // Load Zenith files on init
  const loadZenithFiles = useCallback(async () => {
    try {
      if (window.lumina && window.lumina.listFiles) {
        const files = await window.lumina.listFiles();
        setZenithFiles(files || []);
      }
    } catch (e) {
      console.warn('Could not load Zenith files:', e);
      setZenithFiles([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        if (!window.lumina) { setIsInitialized(true); return; }
        const s = await window.lumina.loadSettings();
        setSettings(prev => ({ ...prev, ...s }));
        
        const [r, m, se, p] = await Promise.all([
          window.lumina.checkOllamaStatus(s.ollamaUrl),
          window.lumina.getModels(s.ollamaUrl).catch(() => []),
          window.lumina.getSessions().catch(() => []),
          window.lumina.getProjects().catch(() => [])
        ]);
        
        setIsOllamaRunning(r);
        setAvailableModels(m);
        setSessions(se);
        setProjects(p);
        
        try {
          const events = await window.lumina.loadCalendar();
          setCalendarEvents(events || []);
        } catch (e) {}
        
        await loadZenithFiles();
        
        if (m.length > 0) setCurrentModel(m.includes(s.defaultModel) ? s.defaultModel : m[0]);
        setSessionId(uuidv4());
        setIsInitialized(true);
        
        console.log(`✅ Brainless initialized - Mode: ${s.developerMode ? 'FORGE' : 'NEXUS'}`);
      } catch (error) {
        console.error('Init error:', error);
        setIsInitialized(true);
      }
    };
    init();
  }, [loadZenithFiles]);

  useEffect(() => {
    if (!window.lumina || !isInitialized) return;
    const cleanupChunk = window.lumina.onResponseChunk((chunk) => {
      if (chunk === '[DONE]') {
        setIsLoading(false);
        return;
      }
      messagesDispatch({ type: 'APPEND_TO_LAST', payload: chunk });
    });
    const cleanupError = window.lumina.onAIError && window.lumina.onAIError((msg) => {
      setIsLoading(false);
      messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
      messagesDispatch({ type: 'APPEND_TO_LAST', payload: `\n\n**Error:** ${msg}` });
    });
    return () => {
      cleanupChunk?.();
      cleanupError?.();
    };
  }, [isInitialized]);

  const updateSettings = useCallback(async (newSettings) => {
    try {
      const merged = { ...settings, ...newSettings };
      setSettings(merged);
      if (window.lumina) await window.lumina.saveSettings(merged);
    } catch (e) {
      console.error('Settings update failed:', e);
    }
  }, [settings]);

  const refreshModels = useCallback(async () => {
    try {
      const models = await window.lumina.getModels(settings.ollamaUrl);
      setAvailableModels(models);
      return models;
    } catch (e) {
      console.error('Refresh models failed:', e);
      return [];
    }
  }, [settings.ollamaUrl]);

  const factoryReset = useCallback(async () => {
    try {
      await window.lumina.resetSystem();
      messagesDispatch({ type: 'CLEAR_MESSAGES' });
      setSessions([]);
      setProjects([]);
      setActiveProject(null);
      setCalendarEvents([]);
      setCanvasNodes([]);
      setCanvasConnections([]);
      setUndoHistory([]);
      setRedoHistory([]);
      setSessionId(uuidv4());
      setZenithFiles([]);
    } catch (e) {
      console.error('Factory reset failed:', e);
    }
  }, []);

  // =========================================================================
  // 🚀 FIXED: DUAL-MODE CONTEXT ENGINE WITH CALENDAR FIX
  // =========================================================================
  const sendMessage = useCallback(async (text, attachments) => {
    const normalizedAttachments = Array.isArray(attachments) ? attachments : [];
    
    if (!text || !text.trim()) {
      if (normalizedAttachments.length === 0) return;
    }
    
    if (isLoading) return;
    if (!currentModel) {
      alert('Please select an AI model first');
      return;
    }

    let images = [];
    let documentContext = "";

    // Process attachments
    if (normalizedAttachments.length > 0) {
      for (const att of normalizedAttachments) {
        if (att.type === 'image' && att.data) {
          const base64Data = att.data.split(',')[1];
          if (base64Data) images.push(base64Data);
        } else if (att.type === 'file') {
          documentContext += `\n--- UPLOADED FILE: ${att.name} ---\n`;
        }
      }
    }

    messagesDispatch({ 
      type: 'ADD_USER_MESSAGE', 
      payload: { text: text || '', attachments: normalizedAttachments } 
    });

    messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
    setIsLoading(true);

    // ====================================================================
    // FIXED: DUAL-MODE CONTEXT ENGINE - NO LOOPS, NO HALLUCINATION
    // ====================================================================
    
    const isForge = settings.developerMode;
    let contextFiles = [];
    let systemPrompt = settings.systemPrompt;
    let pid = null;
    let enrichedPrompt = text || '';
    let workspaceContext = "";

    const lowerText = (text || '').toLowerCase();

    // ----------------------------------------------------------------
    // MODE 1: THE FORGE (Developer Mode)
    // ----------------------------------------------------------------
    if (isForge) {
      // 1. Prioritize Active Project
      if (activeProject) {
        pid = activeProject.id;
        const liveProject = projects.find(p => p.id === activeProject.id);
        
        if (liveProject) {
          contextFiles = (liveProject.files || []).filter(f => 
            !f.name.endsWith('.meta.json') && !f.name.startsWith('.')
          );
          systemPrompt = liveProject.systemPrompt || settings.systemPrompt;
          
          workspaceContext += `[ACTIVE PROJECT: "${liveProject.name}" | ${contextFiles.length} files loaded]\n`;
          
          // Git Status
          if (window.lumina.getGitStatus) {
            try {
              const status = await window.lumina.getGitStatus(activeProject.id);
              if (status) {
                workspaceContext += `[Git: ${status.current} | Modified: ${status.modified.length}]\n`;
              }
            } catch (e) {}
          }
        }
      }

      // 2. Canvas Context
      if (canvasNodes.length > 0) {
        workspaceContext += `\n[Canvas Architecture: ${canvasNodes.length} nodes]\n`;
        canvasNodes.slice(0, 10).forEach(node => {
          workspaceContext += `• ${node.data.title} (${node.type})\n`;
        });
      }
      
      // 3. Artifacts
      if (artifacts.length > 0) {
        workspaceContext += `\n[Open Artifacts]\n`;
        artifacts.forEach(a => workspaceContext += `• ${a.title} (${a.language})\n`);
      }
    } 
    // ----------------------------------------------------------------
    // MODE 2: THE NEXUS (Student/Research Mode) - FIXED
    // ----------------------------------------------------------------
    else {
      // 1. Zenith Documents - Only if explicitly requested
      if (lowerText.includes('document') || lowerText.includes('file') || lowerText.includes('zenith')) {
        if (zenithFiles.length > 0) {
          const recentFiles = zenithFiles
            .sort((a, b) => new Date(b.modified) - new Date(a.modified))
            .slice(0, 5);
          
          workspaceContext += `[Available Documents (${zenithFiles.length} total)]\n`;
          
          for (const file of recentFiles) {
            try {
              const content = await window.lumina.readFile(file.name);
              const preview = content.slice(0, 500);
              workspaceContext += `\n--- ${file.name} ---\n${preview}...\n`;
            } catch (e) {
              workspaceContext += `• ${file.name}\n`;
            }
          }
        }
      }

      // 2. Calendar - FIXED: Direct access when asked
      if (calendarEvents.length > 0) {
        const isCalendarQuery = lowerText.includes('calendar') || 
                               lowerText.includes('event') || 
                               lowerText.includes('schedule') ||
                               lowerText.includes('deadline') ||
                               lowerText.includes('appointment') ||
                               lowerText.includes('when') ||
                               lowerText.includes('what') && (lowerText.includes('today') || lowerText.includes('tomorrow') || lowerText.includes('week'));
        
        if (isCalendarQuery) {
          // User is EXPLICITLY asking about calendar - provide full access
          workspaceContext += `\n[YOUR CALENDAR EVENTS]\n`;
          
          const now = new Date();
          const sorted = [...calendarEvents].sort((a, b) => 
            new Date(a.date) - new Date(b.date)
          );
          
          // Separate past and future
          const upcoming = sorted.filter(e => new Date(e.date) >= now);
          const past = sorted.filter(e => new Date(e.date) < now);
          
          if (upcoming.length > 0) {
            workspaceContext += `\nUpcoming Events (${upcoming.length}):\n`;
            upcoming.forEach(e => {
              workspaceContext += `• ${e.date} at ${e.time || 'all day'}: ${e.title} [${e.priority} priority] (${e.type})\n`;
              if (e.notes) workspaceContext += `  Notes: ${e.notes}\n`;
            });
          }
          
          if (past.length > 0 && lowerText.includes('past')) {
            workspaceContext += `\nPast Events (${past.length}):\n`;
            past.slice(-5).forEach(e => {
              workspaceContext += `• ${e.date}: ${e.title}\n`;
            });
          }
          
          if (upcoming.length === 0) {
            workspaceContext += `\nYou have no upcoming events scheduled.\n`;
          }
        } else {
          // User is NOT asking about calendar, but keep subtle context
          const now = new Date();
          const urgent = calendarEvents
            .filter(e => {
              const eventDate = new Date(e.date);
              const daysUntil = (eventDate - now) / (1000 * 60 * 60 * 24);
              return daysUntil >= 0 && daysUntil <= 7 && e.priority === 'high';
            })
            .slice(0, 3);
          
          if (urgent.length > 0) {
            workspaceContext += `\n[Note: You have ${urgent.length} urgent deadline(s) this week]\n`;
          }
        }
      }

      // 3. Code Projects - IGNORE unless explicitly requested
      if (activeProject && (lowerText.includes('code') || lowerText.includes('project'))) {
        workspaceContext += `\n[Note: Project "${activeProject.name}" available on request]\n`;
      }
    }

    // === CONVERSATION MEMORY ===
    if (messages.length > 0) {
      const recentHistory = messages.slice(-6).map(msg => 
        `${msg.role === 'user' ? 'USER' : 'ASSISTANT'}: ${msg.content.slice(0, 400)}`
      ).join('\n\n');
      enrichedPrompt = `[CONVERSATION HISTORY]\n${recentHistory}\n\n[CURRENT QUERY]\n${enrichedPrompt}`;
    }

    // === WORKSPACE CONTEXT ===
    if (workspaceContext) {
      enrichedPrompt = workspaceContext + '\n' + enrichedPrompt;
    }

    // === PERSONALITY & GUARDRAILS - FIXED ===
    const isDev = settings.developerMode;
    const tonePrompt = isDev 
        ? `You are FORGE: A precise, technical senior engineer. Answer directly and accurately.` 
        : `You are NEXUS: A warm, helpful research assistant. Answer questions directly using available data.`;

    const systemInstructions = `
${tonePrompt}

CRITICAL INSTRUCTIONS:
1. Answer questions DIRECTLY using the provided context
2. If calendar data is shown, USE IT to answer calendar questions
3. If documents are shown, USE THEM to answer document questions
4. DO NOT say "I don't have access" if the data is clearly in the context
5. Be concise and accurate
6. Only say you don't have information if it's genuinely not provided

Context data above is YOUR WORKING MEMORY - use it naturally.
`;

    enrichedPrompt = systemInstructions + "\n\n" + enrichedPrompt;
    
    // === SEND TO AI ===
    try {
      window.lumina.sendPrompt(
        enrichedPrompt, 
        currentModel, 
        contextFiles,
        systemPrompt, 
        settings, 
        pid, 
        images, 
        documentContext
      );
    } catch (error) {
      setIsLoading(false);
      messagesDispatch({ type: 'APPEND_TO_LAST', payload: `\n\n**Error:** ${error.message}` });
    }
  }, [isLoading, currentModel, activeProject, projects, settings, messages, canvasNodes, calendarEvents, zenithFiles, artifacts]);

  const startNewChat = useCallback(async () => {
    if (messages.length > 0) {
      const title = messages.find(m => m.role === 'user')?.content.slice(0, 30) || "Chat";
      await window.lumina.saveSession({ id: sessionId, title, messages, date: new Date().toISOString() });
      setSessions(await window.lumina.getSessions());
    }
    
    messagesDispatch({ type: 'CLEAR_MESSAGES' });
    setSessionId(uuidv4());
    setIsLoading(false);
    setCurrentView('chat');
  }, [messages, sessionId]);

  const loadSession = useCallback(async (id) => {
    const data = await window.lumina.loadSession(id);
    messagesDispatch({ type: 'SET_MESSAGES', payload: data.messages || [] });
    setSessionId(data.id);
    setCurrentView('chat');
  }, []);

  const deleteSession = useCallback(async (e, id) => {
    e.stopPropagation();
    await window.lumina.deleteSession(id);
    if (id === sessionId) await startNewChat();
    setSessions(await window.lumina.getSessions());
  }, [sessionId, startNewChat]);

  const renameChat = useCallback(async (id, title) => {
    await window.lumina.renameSession(id, title);
    setSessions(await window.lumina.getSessions());
  }, []);

  const createProject = useCallback(async (name) => {
    const newProj = await window.lumina.createProject({ id: uuidv4(), name });
    setProjects(p => [...p, newProj]);
    setActiveProject(newProj);
    addToUndoHistory({
      type: 'create-project',
      data: { project: newProj },
      undo: async () => {
        await window.lumina.deleteProject(newProj.id);
        setProjects(p => p.filter(x => x.id !== newProj.id));
        if (activeProject?.id === newProj.id) setActiveProject(null);
      }
    });
  }, [activeProject, addToUndoHistory]);

  const deleteProject = useCallback(async (e, id) => {
    e.stopPropagation();
    const deletedProject = projects.find(p => p.id === id);
    await window.lumina.deleteProject(id);
    setProjects(p => p.filter(x => x.id !== id));
    if (activeProject?.id === id) setActiveProject(null);
    if (deletedProject) {
      addToUndoHistory({
        type: 'delete-project',
        data: { project: deletedProject },
        undo: async () => {
          const restored = await window.lumina.createProject({ id: deletedProject.id, name: deletedProject.name });
          setProjects(p => [...p, restored]);
        }
      });
    }
  }, [activeProject, projects, addToUndoHistory]);

  const loadProjects = useCallback(async () => {
    try {
      const updatedProjects = await window.lumina.getProjects();
      setProjects(updatedProjects);
    } catch (e) {
      console.error('Load projects failed:', e);
    }
  }, []);

  const updateProjectSettings = useCallback(async (sysPrompt) => {
    if (!activeProject) return;
    const updated = await window.lumina.updateProjectSettings(activeProject.id, sysPrompt);
    if (updated) {
      setActiveProject(updated);
      setProjects(p => p.map(x => x.id === updated.id ? updated : x));
    }
  }, [activeProject]);

  const addFiles = useCallback(async () => {
    if (!activeProject) return;
    try {
      await window.lumina.addFilesToProject(activeProject.id);
      const updatedProjects = await window.lumina.getProjects();
      setProjects(updatedProjects);
      const updatedActive = updatedProjects.find(p => p.id === activeProject.id);
      if (updatedActive) setActiveProject(updatedActive);
    } catch (e) {
      console.error('Add files failed:', e);
    }
  }, [activeProject]);

  const addFolder = useCallback(async () => {
    if (!activeProject) return;
    try {
      await window.lumina.addFolderToProject(activeProject.id);
      const updatedProjects = await window.lumina.getProjects();
      setProjects(updatedProjects);
      const updatedActive = updatedProjects.find(p => p.id === activeProject.id);
      if (updatedActive) setActiveProject(updatedActive);
    } catch (e) {
      console.error('Add folder failed:', e);
    }
  }, [activeProject]);

  const addUrl = useCallback(async (url) => {
    if (!activeProject) return;
    try {
      await window.lumina.addUrlToProject(activeProject.id, url);
      const updatedProjects = await window.lumina.getProjects();
      setProjects(updatedProjects);
      const updatedActive = updatedProjects.find(p => p.id === activeProject.id);
      if (updatedActive) setActiveProject(updatedActive);
    } catch (e) {
      console.error('Add URL failed:', e);
    }
  }, [activeProject]);

  const openFile = useCallback(async (file) => {
    if (file.type === 'url') {
      window.open(file.path, '_blank');
    } else {
      try {
        await window.lumina.openFile(file.path);
      } catch (e) {
        console.error('Failed to open file:', e);
        alert('Could not open file');
      }
    }
  }, []);

  const deleteFile = useCallback(async (filePath) => {
    if (!activeProject) return;
    try {
      const result = await window.lumina.deleteFileFromProject(activeProject.id, filePath);
      if (result.success) {
        const updatedProjects = await window.lumina.getProjects();
        setProjects(updatedProjects);
        const updatedActive = updatedProjects.find(p => p.id === activeProject.id);
        if (updatedActive) setActiveProject(updatedActive);
      }
    } catch (e) {
      console.error('Delete file failed:', e);
    }
  }, [activeProject]);

  const addEvent = useCallback(async (title, date, type, priority, notes, time) => {
    const ev = { id: uuidv4(), title, date, type, priority, notes, time };
    const updated = [...calendarEvents, ev];
    setCalendarEvents(updated);
    await window.lumina.saveCalendar(updated);
    addToUndoHistory({
      type: 'add-event',
      data: { event: ev },
      undo: async () => {
        const reverted = calendarEvents.filter(e => e.id !== ev.id);
        setCalendarEvents(reverted);
        await window.lumina.saveCalendar(reverted);
      }
    });
  }, [calendarEvents, addToUndoHistory]);

  const deleteEvent = useCallback(async (id) => {
    const deletedEvent = calendarEvents.find(e => e.id === id);
    const updated = calendarEvents.filter(e => e.id !== id);
    setCalendarEvents(updated);
    await window.lumina.saveCalendar(updated);
    if (deletedEvent) {
      addToUndoHistory({
        type: 'delete-event',
        data: { event: deletedEvent },
        undo: async () => {
          const restored = [...calendarEvents, deletedEvent];
          setCalendarEvents(restored);
          await window.lumina.saveCalendar(restored);
        }
      });
    }
  }, [calendarEvents, addToUndoHistory]);

  const updateEvent = useCallback(async (id, data) => {
    const oldEvent = calendarEvents.find(e => e.id === id);
    const updated = calendarEvents.map(e => e.id === id ? { ...e, ...data } : e);
    setCalendarEvents(updated);
    await window.lumina.saveCalendar(updated);
    if (oldEvent) {
      addToUndoHistory({
        type: 'update-event',
        data: { id, oldEvent, newData: data },
        undo: async () => {
          const reverted = calendarEvents.map(e => e.id === id ? oldEvent : e);
          setCalendarEvents(reverted);
          await window.lumina.saveCalendar(reverted);
        }
      });
    }
  }, [calendarEvents, addToUndoHistory]);

  const generateSchedule = useCallback(async (topic, targetDate, duration, goals) => {
    if (!topic || !targetDate) {
      alert('Please provide a topic and target date');
      return;
    }
    const start = new Date();
    const end = new Date(targetDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Mode-specific scheduling
    const isDev = settings.developerMode;
    const steps = isDev ? [
        { t: "Requirement Analysis", p: "high" },
        { t: "Architecture Design", p: "high" },
        { t: "Core Implementation", p: "high" },
        { t: "Testing & Debugging", p: "medium" },
        { t: "Refactoring", p: "medium" },
        { t: "Deployment Prep", p: "low" }
    ] : [
        { t: "Research & Outline", p: "medium" },
        { t: "Core Work / Study", p: "high" },
        { t: "Deep Dive / Draft", p: "high" },
        { t: "Review & Refine", p: "medium" },
        { t: "Final Polish", p: "low" }
    ];

    const newEvents = [];
    const stepCount = Math.min(diffDays, steps.length);
    const interval = Math.max(1, Math.floor(diffDays / stepCount));

    for (let i = 0; i < stepCount; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + 1 + (i * interval));
      const dateStr = d.toISOString().split('T')[0];
      if (d > end) break;
      newEvents.push({
        id: uuidv4(),
        title: `${steps[i].t}: ${topic}`,
        date: dateStr,
        type: settings.developerMode ? 'task' : 'study',
        priority: steps[i].p,
        notes: `Goals: ${goals || 'Complete section'}`,
        time: '10:00'
      });
    }
    newEvents.push({
      id: uuidv4(),
      title: `DEADLINE: ${topic}`,
      date: targetDate,
      type: 'deadline',
      priority: 'high',
      notes: 'Final Submission / Release',
      time: '23:59'
    });
    const updated = [...calendarEvents, ...newEvents];
    setCalendarEvents(updated);
    if (window.lumina) await window.lumina.saveCalendar(updated);
    setCurrentView('chronos');
  }, [calendarEvents, settings]);

  const runFlashpoint = useCallback(async () => {
    if (!currentModel) {
      alert("Please select an AI model first.");
      return;
    }
    // Strict Nexus feature
    if (settings.developerMode) {
        alert("Switch to Nexus mode for Flashcards.");
        return;
    }

    const context = messages.slice(-6).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n').slice(0, 4000) || "General Knowledge";
    setIsLoading(true);
    messagesDispatch({ type: 'ADD_USER_MESSAGE', payload: { text: 'Generate a flashcard deck from our current study session.', attachments: [] } });
    try {
      const prompt = `CONTEXT:\n${context}\nTASK: Generate 8-10 concise study flashcards. Return ONLY valid JSON: { "cards": [{ "front": "Question", "back": "Answer" }] }`;
      const response = await window.lumina.generateJson(prompt, currentModel, settings);
      let deck = [];
      if (Array.isArray(response)) deck = response;
      else if (response && Array.isArray(response.cards)) deck = response.cards;
      if (deck.length > 0) {
        const deckId = uuidv4();
        const newDeck = { id: deckId, type: 'flashcards', language: 'json', content: deck, title: 'Flashcards', timestamp: Date.now() };
        setArtifacts(prev => [...prev, newDeck]);
        setActiveArtifactId(deckId);
        messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
        messagesDispatch({ type: 'APPEND_TO_LAST', payload: 'Flashcards generated successfully.' });
      } else throw new Error('Invalid JSON');
    } catch (e) {
      messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
      messagesDispatch({ type: 'APPEND_TO_LAST', payload: 'Error: ' + e.message });
    } finally {
      setIsLoading(false);
    }
  }, [currentModel, settings, messages]);

  const runBlueprint = useCallback(async (description) => {
    // Strict Forge feature
    if (!settings.developerMode) {
        alert("Switch to Forge mode for Scaffolding.");
        return;
    }
    if (!activeProject || !currentModel) return;
    setIsLoading(true);
    messagesDispatch({ type: 'ADD_USER_MESSAGE', payload: { text: `Blueprint: ${description}`, attachments: [] } });
    try {
      const prompt = `Output JSON with "files" key for: ${description}.`;
      const response = await window.lumina.generateJson(prompt, currentModel, settings);
      let structure = [];
      if (Array.isArray(response)) structure = response;
      else if (response && Array.isArray(response.files)) structure = response.files;
      if (structure.length > 0) {
        messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
        messagesDispatch({ type: 'APPEND_TO_LAST', payload: `Building ${structure.length} files...` });
        await window.lumina.scaffoldProject(activeProject.id, structure);
        messagesDispatch({ type: 'APPEND_TO_LAST', payload: `\n\n✅ Done.` });
        const updatedProjects = await window.lumina.getProjects();
        setProjects(updatedProjects);
        const updated = updatedProjects.find(p => p.id === activeProject.id);
        if (updated) setActiveProject(updated);
      } else throw new Error('Invalid structure');
    } catch (e) {
      messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
      messagesDispatch({ type: 'APPEND_TO_LAST', payload: 'Error: ' + e.message });
    } finally {
      setIsLoading(false);
    }
  }, [activeProject, currentModel, settings]);

  const runDiffDoctor = useCallback(async () => {
    // Strict Forge feature
    if (!settings.developerMode) return;
    if (!activeProject) return;
    
    setIsLoading(true);
    messagesDispatch({ type: 'ADD_USER_MESSAGE', payload: { text: 'Run Diff Doctor.', attachments: [] } });
    try {
      const diff = await window.lumina.getGitDiff(activeProject.id);
      if (!diff) throw new Error("No diff");
      const prompt = `Analyze git diff. Write commit message and check bugs.\n\n${diff.slice(0, 5000)}`;
      window.lumina.sendPrompt(prompt, currentModel, [], activeProject.systemPrompt, settings, null, [], "");
    } catch (e) {
      setIsLoading(false);
      messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
      messagesDispatch({ type: 'APPEND_TO_LAST', payload: "No git changes found." });
    }
  }, [activeProject, currentModel, settings]);

  const runDeepResearch = useCallback(async (url) => {
    // Available in both modes, but behaves differently via System Prompt in sendMessage
    if (!activeProject) return;
    setIsLoading(true);
    try {
      messagesDispatch({ type: 'ADD_USER_MESSAGE', payload: { text: `Deep Research: ${url}`, attachments: [] } });
      messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
      const rawContent = await window.lumina.runDeepResearch(activeProject.id, url);
      const updatedProjects = await window.lumina.getProjects();
      setProjects(updatedProjects);
      const updatedProject = updatedProjects.find(p => p.id === activeProject.id);
      if (updatedProject) setActiveProject(updatedProject);
      const prompt = `Analyze this content and report.\n\nCONTENT:\n${rawContent}`;
      window.lumina.sendPrompt(prompt, currentModel, [], activeProject.systemPrompt, settings, null, [], "");
    } catch (e) {
      messagesDispatch({ type: 'APPEND_TO_LAST', payload: `\n\n**Error:** ${e.message}` });
      setIsLoading(false);
    }
  }, [activeProject, currentModel, settings]);

  const generateDossier = useCallback(async () => {
    if (!activeProject || !currentModel) return;
    setIsLoading(true);
    try {
      const prompt = `Analyze these project files. Return a JSON object with: { "summary": "...", "tags": [...], "questions": [...] }`;
      const dossier = await window.lumina.generateJson(prompt, currentModel, settings, activeProject.id);
      if (dossier && !dossier.error) {
        await window.lumina.saveProjectDossier(activeProject.id, dossier);
        setActiveProject(prev => ({ ...prev, dossier }));
        setProjects(prev => prev.map(p => p.id === activeProject.id ? { ...p, dossier } : p));
      }
    } catch (e) {
      console.error("Dossier failed", e);
    } finally {
      setIsLoading(false);
    }
  }, [activeProject, currentModel, settings]);

  const openLabBench = useCallback((content, language) => {
    const existing = artifacts.find(a => a.content === content && a.language === language);
    if (existing) {
        setActiveArtifactId(existing.id);
        return;
    }
    const newId = uuidv4();
    const newArtifact = { id: newId, content, language, type: 'code', title: `${language || 'text'} snippet`, timestamp: Date.now() };
    setArtifacts(prev => [...prev, newArtifact]);
    setActiveArtifactId(newId);
  }, [artifacts]);

  const closeArtifact = useCallback((id) => {
    setArtifacts(prev => {
        const newArr = prev.filter(a => a.id !== id);
        if (id === activeArtifactId) {
             if (newArr.length > 0) {
                 setActiveArtifactId(newArr[newArr.length - 1].id);
             } else {
                 setActiveArtifactId(null);
             }
        }
        return newArr;
    });
  }, [activeArtifactId]);

  const closeLabBench = useCallback(() => {
    setArtifacts([]);
    setActiveArtifactId(null);
  }, []);

  const contextValue = useMemo(() => ({
    messages, sendMessage, isLoading, isOllamaRunning, currentModel, setCurrentModel, availableModels, settings, updateSettings, refreshModels, factoryReset, theme, isInitialized,
    sessions, sessionId, startNewChat, loadSession, deleteSession, renameChat,
    projects, activeProject, setActiveProject, createProject, deleteProject, updateProjectSettings, addFiles, addFolder, addUrl, openFile, deleteFile, generateDossier, loadProjects,
    canvasNodes, addCanvasNode, updateCanvasNode, deleteCanvasNode, canvasConnections, setCanvasConnections,
    calendarEvents, addEvent, updateEvent, deleteEvent, generateSchedule,
    currentView, setCurrentView, gitStatus,
    activeArtifact, activeArtifactId, setActiveArtifactId, artifacts, openLabBench, closeLabBench, closeArtifact,
    runFlashpoint, runBlueprint, runDiffDoctor, runDeepResearch,
    openGlobalSettings: () => setIsSettingsOpen(true), closeGlobalSettings: () => setIsSettingsOpen(false), isSettingsOpen,
    commandPaletteOpen, setCommandPaletteOpen, undoHistory, redoHistory, performUndo, performRedo, addToUndoHistory,
    currentInput, setCurrentInput, handleContextNavigation,
    zenithFiles, loadZenithFiles,
    togglePodcast: () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else if (messages.length > 0) {
        const u = new SpeechSynthesisUtterance(messages[messages.length - 1].content);
        u.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(u);
        setIsSpeaking(true);
      }
    }
  }), [messages, sendMessage, isLoading, isOllamaRunning, currentModel, availableModels, settings, updateSettings, refreshModels, factoryReset, theme, isInitialized, sessions, sessionId, startNewChat, loadSession, deleteSession, renameChat, projects, activeProject, createProject, deleteProject, updateProjectSettings, addFiles, addFolder, addUrl, openFile, deleteFile, generateDossier, loadProjects, canvasNodes, addCanvasNode, updateCanvasNode, deleteCanvasNode, canvasConnections, calendarEvents, addEvent, updateEvent, deleteEvent, generateSchedule, currentView, gitStatus, activeArtifact, activeArtifactId, artifacts, openLabBench, closeLabBench, closeArtifact, runFlashpoint, runBlueprint, runDiffDoctor, runDeepResearch, isSettingsOpen, commandPaletteOpen, undoHistory, redoHistory, performUndo, performRedo, addToUndoHistory, currentInput, handleContextNavigation, zenithFiles, loadZenithFiles, isSpeaking]);

  return <LuminaContext.Provider value={contextValue}>{children}</LuminaContext.Provider>;
};

export const useLumina = () => useContext(LuminaContext);