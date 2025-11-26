import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const LuminaContext = createContext();

export const LuminaProvider = ({ children }) => {
  const [settings, setSettings] = useState({ ollamaUrl: "http://127.0.0.1:11434", defaultModel: "", contextLength: 8192, temperature: 0.7, systemPrompt: "" });
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOllamaRunning, setIsOllamaRunning] = useState(false);
  const [currentModel, setCurrentModel] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [gitStatus, setGitStatus] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // PAGE STATE
  // 'chat', 'project-dashboard', 'cerebro'
  const [currentView, setCurrentView] = useState('chat'); 

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
        if (models.length > 0) setCurrentModel(models.includes(savedSettings.defaultModel) ? savedSettings.defaultModel : models[0]);
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
       const models = await window.lumina.getModels(merged.ollamaUrl);
       setAvailableModels(models);
    }
  };

  const refreshModels = async () => { const models = await window.lumina.getModels(settings.ollamaUrl); setAvailableModels(models); };

  const openGlobalSettings = () => setIsSettingsOpen(true);
  const closeGlobalSettings = () => setIsSettingsOpen(false);

  const createProject = async (name) => { const newProj = await window.lumina.createProject({ id: uuidv4(), name }); setProjects(prev => [...prev, newProj]); setActiveProject(newProj); setCurrentView('project-dashboard'); };
  const updateProjectSettings = async (systemPrompt) => { if (!activeProject) return; const updatedProj = await window.lumina.updateProjectSettings(activeProject.id, systemPrompt); if (updatedProj) { setActiveProject(updatedProj); setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProj : p)); } };
  
  const addFiles = async () => { if (!activeProject) return; const newFiles = await window.lumina.addFilesToProject(activeProject.id); if (newFiles) updateProjectFiles(newFiles); };
  const addFolder = async () => { if (!activeProject) return; const newFiles = await window.lumina.addFolderToProject(activeProject.id); if (newFiles) updateProjectFiles(newFiles); };
  const addUrl = async (url) => { if (!activeProject) return; const newFiles = await window.lumina.addUrlToProject(activeProject.id, url); if (newFiles) updateProjectFiles(newFiles); };
  const updateProjectFiles = (newFiles) => { setActiveProject(prev => ({ ...prev, files: newFiles })); setProjects(prev => prev.map(p => p.id === activeProject.id ? { ...p, files: newFiles } : p)); };
  const deleteProject = async (e, id) => { e.stopPropagation(); await window.lumina.deleteProject(id); setProjects(prev => prev.filter(p => p.id !== id)); if (activeProject?.id === id) { setActiveProject(null); setCurrentView('chat'); } };

  const refreshGit = async () => { if (activeProject) { const status = await window.lumina.getGitStatus(activeProject.id); setGitStatus(status); } else { setGitStatus(null); } };
  useEffect(() => { refreshGit(); }, [activeProject]);

  const runDeepResearch = async (url) => {
    if (!activeProject) return;
    setIsLoading(true);
    setCurrentView('chat'); // Switch to chat to see result
    setMessages(prev => [...prev, { role: 'user', content: `Deep Research: ${url}` }]);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    try {
      const rawContent = await window.lumina.runDeepResearch(activeProject.id, url);
      updateProjectFiles((await window.lumina.getProjects()).find(p => p.id === activeProject.id).files);
      const prompt = `Analyze this scraped content and generate a structured Research Report using Markdown.\n\nCONTENT:\n${rawContent}`;
      window.lumina.sendPrompt(prompt, currentModel, [], activeProject.systemPrompt, settings);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
      setIsLoading(false);
    }
  };

  const sendMessage = useCallback((text) => {
    if (!text.trim() || isLoading) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]); 
    setIsLoading(true);
    const contextFiles = activeProject ? activeProject.files : [];
    window.lumina.sendPrompt(text, currentModel, contextFiles, activeProject?.systemPrompt, settings);
  }, [isLoading, currentModel, activeProject, settings]);

  useEffect(() => {
    if (!window.lumina) return;
    const cleanup = window.lumina.onResponseChunk((chunk) => {
      if (chunk === '[DONE]') { setIsLoading(false); return; }
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') { return [...prev.slice(0, -1), { ...lastMsg, content: lastMsg.content + chunk }]; } 
        else { return [...prev, { role: 'assistant', content: chunk }]; }
      });
    });
    return () => cleanup(); 
  }, []);

  const renameChat = async (id, newTitle) => { await window.lumina.renameSession(id, newTitle); setSessions(await window.lumina.getSessions()); };
  const startNewChat = async () => {
    if (messages.length > 0) { await window.lumina.saveSession({ id: sessionId, title: messages.find(m => m.role === 'user')?.content.slice(0,30) || "New Chat", messages, date: new Date().toISOString() }); setSessions(await window.lumina.getSessions()); }
    setMessages([]); setSessionId(uuidv4()); setIsLoading(false); setCurrentView('chat');
  };
  const loadSession = async (id) => { const data = await window.lumina.loadSession(id); setMessages(data.messages || []); setSessionId(data.id); setCurrentView('chat'); };
  const deleteSession = async (e, id) => { e.stopPropagation(); await window.lumina.deleteSession(id); if (id === sessionId) startNewChat(); setSessions(await window.lumina.getSessions()); };

  return (
    <LuminaContext.Provider value={{
      messages, sendMessage, isLoading, isOllamaRunning, currentModel, setCurrentModel, availableModels, refreshModels,
      settings, updateSettings, sessions, sessionId, startNewChat, loadSession, deleteSession, renameChat,
      projects, activeProject, setActiveProject, createProject, updateProjectSettings, addFiles, addFolder, addUrl, deleteProject,
      currentView, setCurrentView, runDeepResearch, gitStatus, refreshGit,
      isSettingsOpen, openGlobalSettings, closeGlobalSettings
    }}>
      {children}
    </LuminaContext.Provider>
  );
};
export const useLumina = () => useContext(LuminaContext);