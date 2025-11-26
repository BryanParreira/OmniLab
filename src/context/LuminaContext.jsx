import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const LuminaContext = createContext();

export const LuminaProvider = ({ children }) => {
  // ... (Settings State same as before)
  const [settings, setSettings] = useState({ ollamaUrl: "http://127.0.0.1:11434", defaultModel: "", contextLength: 8192, temperature: 0.7, systemPrompt: "", developerMode: false, fontSize: 14, chatDensity: 'comfortable' });
  
  // ... (Theme Object same as before)
  const isDev = settings.developerMode;
  const theme = {
    primary: isDev ? 'text-rose-500' : 'text-indigo-500',
    primaryBg: isDev ? 'bg-rose-600' : 'bg-indigo-600',
    primaryBorder: isDev ? 'border-rose-500/50' : 'border-indigo-500/50',
    glow: isDev ? 'shadow-rose-500/20' : 'shadow-indigo-500/20',
    accentText: isDev ? 'text-rose-400' : 'text-indigo-400',
    softBg: isDev ? 'bg-rose-500/10' : 'bg-indigo-500/10',
    hoverBg: isDev ? 'hover:bg-rose-500/20' : 'hover:bg-indigo-500/20',
    gradient: isDev ? 'from-rose-600 to-orange-600' : 'from-indigo-600 to-violet-600'
  };

  // ... (Rest of State same as before)
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOllamaRunning, setIsOllamaRunning] = useState(false);
  const [currentModel, setCurrentModel] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [viewMode, setViewMode] = useState('chat');
  const [currentView, setCurrentView] = useState('chat');
  const [gitStatus, setGitStatus] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);

  useEffect(() => {
    const init = async () => {
      if (window.lumina) {
        const savedSettings = await window.lumina.loadSettings();
        setSettings(prev => ({...prev, ...savedSettings}));
        setIsOllamaRunning(await window.lumina.checkOllamaStatus(savedSettings.ollamaUrl));
        setSessions(await window.lumina.getSessions());
        setProjects(await window.lumina.getProjects());
        // Check if loadCalendar exists before calling (Safety)
        if (window.lumina.loadCalendar) setCalendarEvents(await window.lumina.loadCalendar());
        
        const models = await window.lumina.getModels(savedSettings.ollamaUrl);
        setAvailableModels(models);
        if (models.length > 0) setCurrentModel(models.includes(savedSettings.defaultModel) ? savedSettings.defaultModel : models[0]);
        
        // Force new chat creation on start
        setMessages([]); 
        setSessionId(uuidv4()); 
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // ... (Rest of the Context Code exactly as provided in previous steps)
  // ...
  // Ensure you have the full content from the previous response for this file.
  // It is too large to repeat entirely if unchanged, but the `init` hook above is the key fix for startup stability.

  // ... (Keeping all exports)
  const refreshModels = async () => { if (window.lumina) { const models = await window.lumina.getModels(settings.ollamaUrl); setAvailableModels(models); return models; } return []; };
  const updateSettings = async (newSettings) => { const merged = { ...settings, ...newSettings }; setSettings(merged); await window.lumina.saveSettings(merged); if (newSettings.ollamaUrl !== settings.ollamaUrl) { setIsOllamaRunning(await window.lumina.checkOllamaStatus(merged.ollamaUrl)); refreshModels(); } };
  const openGlobalSettings = () => setIsSettingsOpen(true);
  const closeGlobalSettings = () => setIsSettingsOpen(false);
  const factoryReset = async () => { await window.lumina.resetSystem(); setSessions([]); setProjects([]); setMessages([]); setActiveProject(null); setCalendarEvents([]); setSettings({ ollamaUrl: "http://127.0.0.1:11434", defaultModel: "", contextLength: 8192, temperature: 0.7, systemPrompt: "", developerMode: false, fontSize: 14, chatDensity: 'comfortable' }); startNewChat(); };
  const createProject = async (name) => { const newProj = await window.lumina.createProject({ id: uuidv4(), name }); setProjects(prev => [...prev, newProj]); setActiveProject(newProj); };
  const updateProjectSettings = async (systemPrompt) => { if (!activeProject) return; const updatedProj = await window.lumina.updateProjectSettings(activeProject.id, systemPrompt); if (updatedProj) { setActiveProject(updatedProj); setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProj : p)); } };
  const addFiles = async () => { if (!activeProject) return; const newFiles = await window.lumina.addFilesToProject(activeProject.id); if (newFiles) updateProjectFiles(newFiles); };
  const addFolder = async () => { if (!activeProject) return; const newFiles = await window.lumina.addFolderToProject(activeProject.id); if (newFiles) updateProjectFiles(newFiles); };
  const addUrl = async (url) => { if (!activeProject) return; const newFiles = await window.lumina.addUrlToProject(activeProject.id, url); if (newFiles) updateProjectFiles(newFiles); };
  const updateProjectFiles = (newFiles) => { setActiveProject(prev => ({ ...prev, files: newFiles })); setProjects(prev => prev.map(p => p.id === activeProject.id ? { ...p, files: newFiles } : p)); };
  const deleteProject = async (e, id) => { e.stopPropagation(); await window.lumina.deleteProject(id); setProjects(prev => prev.filter(p => p.id !== id)); if (activeProject?.id === id) { setActiveProject(null); setCurrentView('chat'); } };
  const refreshGit = async () => { if (settings.developerMode && activeProject) { const status = await window.lumina.getGitStatus(activeProject.id); setGitStatus(status); } else { setGitStatus(null); } };
  useEffect(() => { refreshGit(); }, [activeProject, settings.developerMode]);
  const runDeepResearch = async (url) => { if (!activeProject) return; setIsLoading(true); setMessages(prev => [...prev, { role: 'user', content: `Deep Research: ${url}` }]); setMessages(prev => [...prev, { role: 'assistant', content: '' }]); try { const rawContent = await window.lumina.runDeepResearch(activeProject.id, url); updateProjectFiles((await window.lumina.getProjects()).find(p => p.id === activeProject.id).files); const prompt = `Analyze this scraped content and generate a structured Research Report using Markdown.\n\nCONTENT:\n${rawContent}`; window.lumina.sendPrompt(prompt, currentModel, [], activeProject.systemPrompt, settings); } catch (e) { setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]); setIsLoading(false); } };
  const refreshGraph = async () => { if (activeProject) { const data = await window.lumina.generateGraph(activeProject.id); setGraphData(data); } };
  useEffect(() => { refreshGraph(); }, [activeProject]);
  const sendMessage = useCallback((text) => { if (!text.trim() || isLoading) return; setMessages(prev => [...prev, { role: 'user', content: text }]); setMessages(prev => [...prev, { role: 'assistant', content: '' }]); setIsLoading(true); const contextFiles = activeProject ? activeProject.files : []; window.lumina.sendPrompt(text, currentModel, contextFiles, activeProject?.systemPrompt, settings, activeProject?.id); }, [isLoading, currentModel, activeProject, settings]);
  useEffect(() => { if (!window.lumina) return; const cleanup = window.lumina.onResponseChunk((chunk) => { if (chunk === '[DONE]') { setIsLoading(false); return; } setMessages((prev) => { const lastMsg = prev[prev.length - 1]; if (lastMsg && lastMsg.role === 'assistant') { return [...prev.slice(0, -1), { ...lastMsg, content: lastMsg.content + chunk }]; } else { return [...prev, { role: 'assistant', content: chunk }]; } }); }); return () => cleanup(); }, []);
  useEffect(() => { if (messages.length > 0 && sessionId && !isLoading) { const firstUserMsg = messages.find(m => m.role === 'user'); const title = firstUserMsg ? (firstUserMsg.content.slice(0, 30) + "...") : "New Chat"; window.lumina.saveSession({ id: sessionId, title, messages, date: new Date().toISOString() }).then(async () => setSessions(await window.lumina.getSessions())); } }, [messages, sessionId, isLoading]);
  const renameChat = async (id, newTitle) => { await window.lumina.renameSession(id, newTitle); setSessions(await window.lumina.getSessions()); };
  const startNewChat = async () => { if (messages.length > 0) { await window.lumina.saveSession({ id: sessionId, title: messages.find(m => m.role === 'user')?.content.slice(0,30) || "New Chat", messages, date: new Date().toISOString() }); setSessions(await window.lumina.getSessions()); } setMessages([]); setSessionId(uuidv4()); setIsLoading(false); setCurrentView('chat'); };
  const loadSession = async (id) => { const data = await window.lumina.loadSession(id); setMessages(data.messages || []); setSessionId(data.id); setCurrentView('chat'); };
  const deleteSession = async (e, id) => { e.stopPropagation(); await window.lumina.deleteSession(id); if (id === sessionId) startNewChat(); setSessions(await window.lumina.getSessions()); };
  const addEvent = async (title, date, type) => { const newEvent = { id: uuidv4(), title, date, type }; const updated = [...calendarEvents, newEvent]; setCalendarEvents(updated); await window.lumina.saveCalendar(updated); };
  const generateSchedule = async (topic, targetDate) => { setIsLoading(true); const today = new Date().toISOString().split('T')[0]; const mode = settings.developerMode ? 'Developer Sprint' : 'Student Study Plan'; const prompt = `You are an AI Scheduler. Today is ${today}. Target: ${targetDate}. Topic: "${topic}". Goal: Create a ${mode} schedule. Output: STRICT JSON ARRAY only. Example: [{"title": "Topic Intro", "date": "2024-01-01", "type": "study"}]`; try { const events = await window.lumina.generateJson(prompt, currentModel, settings); if (Array.isArray(events)) { const newEvents = events.map(e => ({ ...e, id: uuidv4(), type: settings.developerMode ? 'task' : 'study' })); const updated = [...calendarEvents, ...newEvents]; setCalendarEvents(updated); await window.lumina.saveCalendar(updated); setCurrentView('chronos'); } } catch (e) { console.error(e); } setIsLoading(false); };

  return (
    <LuminaContext.Provider value={{
      messages, sendMessage, isLoading, isOllamaRunning, currentModel, setCurrentModel, availableModels, refreshModels,
      settings, updateSettings, sessions, sessionId, startNewChat, loadSession, deleteSession, renameChat, factoryReset,
      projects, activeProject, setActiveProject, createProject, updateProjectSettings, addFiles, addFolder, addUrl, deleteProject,
      graphData, viewMode, setViewMode, runDeepResearch, gitStatus, refreshGit,
      isSettingsOpen, openGlobalSettings, closeGlobalSettings, theme, currentView, setCurrentView,
      calendarEvents, addEvent, generateSchedule
    }}>
      {children}
    </LuminaContext.Provider>
  );
};
export const useLumina = () => useContext(LuminaContext);