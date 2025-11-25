import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const LuminaContext = createContext();

export const LuminaProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    ollamaUrl: "http://127.0.0.1:11434",
    defaultModel: "llama3",
    contextLength: 8192,
    temperature: 0.7,
    systemPrompt: ""
  });

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOllamaRunning, setIsOllamaRunning] = useState(false);
  const [currentModel, setCurrentModel] = useState("llama3");
  const [availableModels, setAvailableModels] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (window.lumina) {
        const savedSettings = await window.lumina.loadSettings();
        setSettings(savedSettings);
        setIsOllamaRunning(await window.lumina.checkOllamaStatus(savedSettings.ollamaUrl));
        setSessions(await window.lumina.getSessions());
        setProjects(await window.lumina.getProjects());
        const models = await window.lumina.getModels(savedSettings.ollamaUrl);
        setAvailableModels(models);
        if (models.length > 0) setCurrentModel(savedSettings.defaultModel || models[0]);
        startNewChat();
      }
    };
    init();
  }, []);

  const updateSettings = async (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    await window.lumina.saveSettings(merged);
    if (newSettings.ollamaUrl !== settings.ollamaUrl) {
       setIsOllamaRunning(await window.lumina.checkOllamaStatus(merged.ollamaUrl));
       setAvailableModels(await window.lumina.getModels(merged.ollamaUrl));
    }
  };

  const createProject = async (name) => { const newProj = await window.lumina.createProject({ id: uuidv4(), name }); setProjects(prev => [...prev, newProj]); setActiveProject(newProj); };
  const updateProjectSettings = async (systemPrompt) => { if (!activeProject) return; const updatedProj = await window.lumina.updateProjectSettings(activeProject.id, systemPrompt); if (updatedProj) { setActiveProject(updatedProj); setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProj : p)); } };
  const addFiles = async () => { if (!activeProject) return; const newFiles = await window.lumina.addFilesToProject(activeProject.id); if (newFiles) updateProjectFiles(newFiles); };
  const addUrl = async (url) => { if (!activeProject) return; const newFiles = await window.lumina.addUrlToProject(activeProject.id, url); if (newFiles) updateProjectFiles(newFiles); };
  const updateProjectFiles = (newFiles) => { setActiveProject(prev => ({ ...prev, files: newFiles })); setProjects(prev => prev.map(p => p.id === activeProject.id ? { ...p, files: newFiles } : p)); };
  const deleteProject = async (e, id) => { e.stopPropagation(); await window.lumina.deleteProject(id); setProjects(prev => prev.filter(p => p.id !== id)); if (activeProject?.id === id) setActiveProject(null); };

  const sendMessage = useCallback((text) => {
    if (!text.trim() || isLoading) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]); 
    setIsLoading(true);
    const contextFiles = activeProject ? activeProject.files : [];
    const systemPrompt = activeProject ? activeProject.systemPrompt : "";
    window.lumina.sendPrompt(text, currentModel, contextFiles, systemPrompt, settings);
  }, [isLoading, currentModel, activeProject, settings]);

  useEffect(() => {
    if (!window.lumina) return;
    const cleanup = window.lumina.onResponseChunk((chunk) => {
      if (chunk === '[DONE]') { setIsLoading(false); return; }
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          return [...prev.slice(0, -1), { ...lastMsg, content: lastMsg.content + chunk }];
        } else { return [...prev, { role: 'assistant', content: chunk }]; }
      });
    });
    return () => cleanup(); 
  }, []);

  useEffect(() => {
    if (messages.length > 0 && sessionId && !isLoading) {
      const firstUserMsg = messages.find(m => m.role === 'user');
      const title = firstUserMsg ? (firstUserMsg.content.slice(0, 30) + "...") : "New Chat";
      window.lumina.saveSession({ id: sessionId, title, messages, date: new Date().toISOString() })
        .then(async () => setSessions(await window.lumina.getSessions()));
    }
  }, [messages, sessionId, isLoading]);

  const renameChat = async (id, newTitle) => {
    await window.lumina.renameSession(id, newTitle);
    setSessions(await window.lumina.getSessions());
  };

  const startNewChat = async () => {
    if (messages.length > 0) {
        const firstUserMsg = messages.find(m => m.role === 'user');
        const title = firstUserMsg ? (firstUserMsg.content.slice(0, 30) + "...") : "New Chat";
        await window.lumina.saveSession({ id: sessionId, title, messages, date: new Date().toISOString() });
        setSessions(await window.lumina.getSessions());
    }
    setMessages([]); 
    setSessionId(uuidv4()); 
    setIsLoading(false); 
  };
  
  const loadSession = async (id) => { const data = await window.lumina.loadSession(id); setMessages(data.messages || []); setSessionId(data.id); };
  const deleteSession = async (e, id) => { e.stopPropagation(); await window.lumina.deleteSession(id); if (id === sessionId) startNewChat(); setSessions(await window.lumina.getSessions()); };

  return (
    <LuminaContext.Provider value={{
      messages, sendMessage, isLoading, isOllamaRunning,
      currentModel, setCurrentModel, availableModels, settings, updateSettings,
      sessions, sessionId, startNewChat, loadSession, deleteSession, renameChat,
      projects, activeProject, setActiveProject, createProject, updateProjectSettings, addFiles, addUrl, deleteProject
    }}>
      {children}
    </LuminaContext.Provider>
  );
};
export const useLumina = () => useContext(LuminaContext);