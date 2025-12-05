import React, { useState, useCallback, useMemo } from 'react';
import { useLumina } from '../context/LuminaContext.jsx';
import { 
  Plus, MessageSquare, Trash2, Folder, Settings as SettingsIcon, 
  Sliders, Edit2, Check, Calendar, X, Brain, Layout, PenTool,
  Clock, AlertCircle, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- HORIZONTAL TAB BUTTON ---
const TabButton = ({ icon: Icon, active, onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    className={`relative flex-1 flex items-center justify-center py-2 rounded-lg transition-all duration-300 group ${
      active 
        ? 'text-white bg-white/10 shadow-inner' 
        : 'text-gray-500 hover:text-white hover:bg-white/5'
    }`}
  >
    <Icon size={16} strokeWidth={active ? 2.5 : 2} />
    {/* Active Dot indicator at bottom */}
    {active && (
      <motion.div 
        layoutId="active-tab-dot"
        className="absolute bottom-1 w-1 h-1 bg-white rounded-full"
      />
    )}
  </button>
);

export const Sidebar = () => {
  const { 
    sessions, sessionId, loadSession, startNewChat, deleteSession, renameChat, openGlobalSettings,
    projects, activeProject, setActiveProject, createProject, deleteProject, updateProjectSettings,
    setCurrentView, currentView, theme, settings,
    calendarEvents
  } = useLumina();

  const [activeTab, setActiveTab] = useState('home'); // Changed default to 'home'
  
  // State for Lists
  const [isCreatingProj, setIsCreatingProj] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [editingProject, setEditingProject] = useState(null);
  const [tempSystemPrompt, setTempSystemPrompt] = useState("");
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- GET TODAY'S EVENTS ---
  const todaysEvents = useMemo(() => {
    if (!calendarEvents) return [];
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    return calendarEvents
      .filter(e => e.date === todayStr)
      .sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'));
  }, [calendarEvents]);

  // --- STATS FOR HOME TAB ---
  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.files?.length > 0).length;
    const recentChats = sessions.filter(s => {
      const sessionDate = new Date(s.date);
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      return sessionDate >= threeDaysAgo;
    }).length;

    return {
      todayEvents: todaysEvents.length,
      activeProjects,
      recentChats,
      totalProjects: projects.length
    };
  }, [projects, sessions, todaysEvents]);

  // --- TAB SWITCHER LOGIC ---
  const switchTab = useCallback((tab) => {
    setActiveTab(tab);
    
    if (tab === 'home') {
      setCurrentView('home');
    } else if (tab === 'calendar') {
      setCurrentView('chronos');
    } else if (tab === 'canvas') {
      setCurrentView('canvas');
    } else if (tab === 'zenith') {
      setCurrentView('zenith');
    } else if (tab === 'projects') {
      // When clicking projects tab, just show the projects list in sidebar
      // User can click on a project to open dashboard
    } else if (tab === 'chats') {
      setCurrentView('chat');
    }
  }, [setCurrentView]);

  // --- ACTIONS ---
  const handleCreateProject = useCallback(async () => {
    if (!newProjName.trim()) return;
    try { setIsLoading(true); await createProject(newProjName); setNewProjName(""); setIsCreatingProj(false); } 
    catch (error) { console.error(error); } finally { setIsLoading(false); }
  }, [newProjName, createProject]);

  const saveProjectSettings = useCallback(async () => {
    if (!editingProject) return;
    try { setIsLoading(true); await updateProjectSettings(tempSystemPrompt); setEditingProject(null); } 
    catch (error) { console.error(error); } finally { setIsLoading(false); }
  }, [tempSystemPrompt, updateProjectSettings, editingProject]);

  const submitRename = useCallback(async (e) => {
    e.stopPropagation();
    if (!renameValue.trim()) return;
    try { setIsLoading(true); await renameChat(editingSessionId, renameValue); setEditingSessionId(null); } 
    catch (error) { console.error(error); } finally { setIsLoading(false); }
  }, [renameValue, editingSessionId, renameChat]);

  const handleProjectClick = useCallback((proj) => {
    setActiveProject(proj);
    setCurrentView('dashboard'); // Always go to dashboard for both modes
  }, [setActiveProject, setCurrentView]);

  const handleChatClick = useCallback((id) => { loadSession(id); setCurrentView('chat'); }, [loadSession, setCurrentView]);
  const handleNewChat = useCallback(() => { startNewChat(); setCurrentView('chat'); }, [startNewChat, setCurrentView]);

  return (
    <div className="flex flex-col h-full rounded-2xl glass-panel overflow-hidden transition-colors duration-500 bg-[#050505]/80 backdrop-blur-xl border border-white/5">
      <div className="p-4 pb-2">
        {/* App Title */}
        <div 
          className="flex items-center gap-3 mb-4 px-2 pt-1 cursor-move"
          style={{ WebkitAppRegion: 'drag' }}
        >
          <div className={`h-6 w-6 bg-gradient-to-br ${theme.gradient} rounded-md flex items-center justify-center shadow-lg shadow-indigo-500/20`}>
            <Brain size={14} className="text-white" />
          </div>
          <span className="font-bold text-xs tracking-widest text-white/90 uppercase">OmniLab</span>
        </div>
        
        {/* --- HORIZONTAL CONTROL DECK WITH HOME --- */}
        <div className="flex items-center p-1 bg-black/40 rounded-xl border border-white/5 mb-4 gap-1">
          <TabButton icon={Home} active={activeTab === 'home'} onClick={() => switchTab('home')} title="Dashboard" />
          <div className="w-px h-4 bg-white/10 mx-1"></div>
          <TabButton icon={MessageSquare} active={activeTab === 'chats'} onClick={() => switchTab('chats')} title="Chats" />
          <TabButton icon={Folder} active={activeTab === 'projects'} onClick={() => switchTab('projects')} title="Contexts" />
          <div className="w-px h-4 bg-white/10 mx-1"></div>
          <TabButton icon={Calendar} active={activeTab === 'calendar'} onClick={() => switchTab('calendar')} title="Chronos" />
          <TabButton icon={Layout} active={activeTab === 'canvas'} onClick={() => switchTab('canvas')} title="Canvas" />
          <TabButton icon={PenTool} active={activeTab === 'zenith'} onClick={() => switchTab('zenith')} title="Zenith" />
        </div>
      </div>

      {/* --- LIST CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-2">
        
        {/* HOME/DASHBOARD - MINIMAL VIEW */}
        {activeTab === 'home' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-white mb-1">{stats.todayEvents}</div>
                <div className="text-[9px] text-gray-500 uppercase tracking-wider">Today</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-white mb-1">{stats.activeProjects}</div>
                <div className="text-[9px] text-gray-500 uppercase tracking-wider">Projects</div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-8 text-center opacity-60">
              <Brain size={32} className="text-gray-600 mb-3" />
              <p className="text-[10px] text-gray-500 font-medium mb-2">Command Center Active</p>
              <p className="text-[9px] text-gray-700">View full dashboard in main area</p>
            </div>

            <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-center">
              <div className="text-[9px] text-gray-400 mb-1">Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-indigo-300 text-[8px] font-mono">⌘K</kbd> to search</div>
            </div>
          </div>
        )}

        {/* CHATS LIST */}
        {activeTab === 'chats' && (
          <>
            <button 
              onClick={handleNewChat} 
              className={`group flex w-full items-center justify-center gap-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all mb-3`}
            >
              <Plus size={10} className={theme.accentText} />
              New Session
            </button>
            <div className="space-y-1">
              {sessions.map(session => (
                <div 
                  key={session.id} 
                  onClick={() => handleChatClick(session.id)} 
                  className={`group relative flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-all duration-200 border border-transparent ${
                    sessionId === session.id 
                      ? `${theme.softBg} text-white border-white/5 shadow-md` 
                      : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1">
                    {editingSessionId === session.id ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input 
                          autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} 
                          onKeyDown={(e) => e.key === 'Enter' && submitRename(e)} onClick={(e) => e.stopPropagation()} 
                          className={`w-full bg-black/50 border rounded px-1 text-[11px] text-white focus:outline-none ${theme.primaryBorder}`}
                        />
                        <button onClick={submitRename} className="text-green-500 hover:text-green-400"><Check size={12}/></button>
                      </div>
                    ) : (
                      <span className="truncate text-[12px] font-medium">{session.title || "Untitled"}</span>
                    )}
                  </div>
                  {editingSessionId !== session.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setEditingSessionId(session.id); setRenameValue(session.title); }} className="hover:text-white p-1"><Edit2 size={10} /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteSession(e, session.id); }} className="hover:text-red-400 p-1"><Trash2 size={10} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* PROJECTS LIST */}
        {activeTab === 'projects' && (
          <>
            {!isCreatingProj ? (
              <button 
                onClick={() => setIsCreatingProj(true)} 
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 text-gray-500 px-3 py-2 text-[10px] uppercase font-bold tracking-wider hover:border-white/20 hover:text-white transition-all mb-3"
              >
                <Plus size={10} /> New Context
              </button>
            ) : (
              <div className="mb-3 p-2 bg-[#111] rounded-lg border border-white/10 animate-in fade-in slide-in-from-top-2">
                <input 
                  autoFocus value={newProjName} onChange={(e) => setNewProjName(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()} 
                  placeholder="Context Name..." className="w-full bg-transparent text-white text-[11px] outline-none mb-2"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setIsCreatingProj(false)} className="text-[9px] text-gray-500 hover:text-white">Cancel</button>
                  <button onClick={handleCreateProject} className={`text-[9px] px-2 py-0.5 rounded text-white ${theme.primaryBg}`}>Create</button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {projects.map(proj => (
                <div 
                  key={proj.id} onClick={() => handleProjectClick(proj)} 
                  className={`group rounded-lg border p-3 cursor-pointer transition-all ${
                    activeProject?.id === proj.id 
                      ? `${theme.softBg} ${theme.primaryBorder}` 
                      : 'bg-black/20 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <Folder size={12} className={activeProject?.id === proj.id ? theme.accentText : "text-gray-500"} />
                      <span className="text-[11px]">{proj.name}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setEditingProject(proj); setTempSystemPrompt(proj.systemPrompt || ""); }} className="text-gray-500 hover:text-white p-1"><Sliders size={10} /></button>
                      <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); deleteProject(e, proj.id); }} className="text-gray-500 hover:text-red-400 p-1"><Trash2 size={10} /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="text-[9px] text-gray-600 font-mono">{proj.files?.length || 0} files</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* --- CALENDAR: TODAY'S EVENTS LIST --- */}
        {activeTab === 'calendar' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
             <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Today's Plan</h3>
                <span className="text-[9px] text-gray-600 font-mono bg-white/5 px-1.5 py-0.5 rounded">{todaysEvents.length}</span>
             </div>

             <div className="space-y-2">
                {todaysEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-600 border-2 border-dashed border-white/5 rounded-xl">
                        <Calendar size={20} className="mb-2 opacity-50"/>
                        <span className="text-[10px]">No events today</span>
                    </div>
                ) : (
                    todaysEvents.map(event => (
                        <div key={event.id} className="bg-[#111] border border-white/10 rounded-lg p-3 hover:border-white/20 transition-colors group">
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[11px] font-bold ${event.priority === 'high' ? 'text-red-400' : 'text-gray-200'}`}>
                                    {event.title}
                                </span>
                                {event.time && (
                                    <div className="flex items-center gap-1 text-[9px] text-gray-500 font-mono bg-black/40 px-1.5 py-0.5 rounded">
                                        <Clock size={8}/> {event.time}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                                    event.type === 'task' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                    event.type === 'deadline' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                } uppercase tracking-wider`}>
                                    {event.type}
                                </span>
                                {event.priority === 'high' && <AlertCircle size={10} className="text-red-500"/>}
                            </div>
                        </div>
                    ))
                )}
             </div>
          </div>
        )}

        {/* CANVAS/ZENITH PLACEHOLDERS (Optional info) */}
        {['canvas', 'zenith'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center h-40 text-center opacity-50 px-4">
                {activeTab === 'canvas' && <Layout size={32} className="mb-2 text-gray-500"/>}
                {activeTab === 'zenith' && <PenTool size={32} className="mb-2 text-gray-500"/>}
                <p className="text-[10px] text-gray-400 font-medium">
                    {activeTab === 'canvas' ? 'Canvas Active' : 'Focus Mode Active'}
                </p>
                <p className="text-[9px] text-gray-600 mt-1">Tools are open in the main view.</p>
            </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-3 border-t border-white/5 bg-black/20">
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openGlobalSettings(); }}
          className="flex w-full items-center gap-2 text-gray-400 hover:text-white transition-colors text-[11px] font-medium px-2 py-1.5 rounded-lg hover:bg-white/5 group"
        >
          <SettingsIcon size={12} className="group-hover:rotate-90 transition-transform duration-500"/>
          Settings
        </button>
      </div>

      {/* --- SETTINGS MODAL --- */}
      <AnimatePresence>
        {editingProject && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => setEditingProject(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#0F0F0F] border border-white/10 rounded-xl w-full max-w-md p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Sliders size={12} className={theme.accentText}/> Project Persona
                </h3>
                <button onClick={() => setEditingProject(null)} className="text-gray-500 hover:text-white"><X size={14} /></button>
              </div>
              <textarea 
                value={tempSystemPrompt} 
                onChange={(e) => setTempSystemPrompt(e.target.value)} 
                className={`w-full h-40 bg-black border border-white/10 rounded-lg p-3 text-xs text-white resize-none mb-4 focus:border-opacity-100 outline-none ${theme.primaryBorder}`}
                placeholder="Define the AI's behavior for this project context..." 
              />
              <button 
                onClick={saveProjectSettings} 
                className={`w-full text-white rounded-lg py-2 text-xs font-bold ${theme.primaryBg} disabled:opacity-50`}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Persona'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};