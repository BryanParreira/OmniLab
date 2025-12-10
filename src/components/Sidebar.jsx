import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useLumina } from '../context/LuminaContext.jsx';
import { 
  Plus, MessageSquare, Trash2, Folder, Settings as SettingsIcon, 
  Sliders, Edit2, Check, Calendar, X, Brain, Layout, PenTool,
  Clock, AlertCircle, Home, ChevronDown, Pin, Search, FileText,
  MoreVertical
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

// --- SKELETON LOADER ---
const SkeletonLoader = () => (
  <div className="space-y-2 animate-pulse">
    {[1, 2, 3].map(i => (
      <div key={i} className="h-10 bg-white/5 rounded-lg" />
    ))}
  </div>
);

export const Sidebar = () => {
  const { 
    sessions, sessionId, loadSession, startNewChat, deleteSession, renameChat, openGlobalSettings,
    projects, activeProject, setActiveProject, createProject, deleteProject, updateProjectSettings,
    setCurrentView, currentView, theme, settings,
    calendarEvents,
    pinSession, unpinSession
  } = useLumina();

  const [activeTab, setActiveTab] = useState('home');
  
  // State for Lists
  const [isCreatingProj, setIsCreatingProj] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [editingProject, setEditingProject] = useState(null);
  const [tempSystemPrompt, setTempSystemPrompt] = useState("");
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Search/Filter state
  const [searchQuery, setSearchQuery] = useState("");
  
  // Zenith Files State
  const [zenithFiles, setZenithFiles] = useState([]);
  const [loadingZenithFiles, setLoadingZenithFiles] = useState(false);
  const [activeZenithFile, setActiveZenithFile] = useState(null);

  // Collapsible sections
  const [collapsedSections, setCollapsedSections] = useState(new Set());

  // --- LOAD ZENITH FILES ---
  const loadZenithFiles = useCallback(async () => {
    console.log('📁 Loading Zenith files...');
    setLoadingZenithFiles(true);
    try {
      const files = await window.lumina.listFiles();
      console.log('📦 Files received:', files);
      
      // Filter for markdown files (files is an array of objects with 'name' property)
      const mdFiles = files.filter(f => f.name && f.name.endsWith('.md'));
      console.log('📝 Markdown files found:', mdFiles.length);
      
      const fileData = [];
      
      for (const fileObj of mdFiles) {
        const filename = fileObj.name;
        console.log(`🔍 Processing file: ${filename}`);
        
        try {
          // Try to load metadata
          const metaFilename = `${filename}.meta.json`;
          let metadata = null;
          
          try {
            const metaContent = await window.lumina.readFile(metaFilename);
            metadata = JSON.parse(metaContent);
            console.log(`✅ Metadata loaded for ${filename}`);
          } catch (metaErr) {
            console.log(`⚠️ No metadata for ${filename}, creating default`);
            // If no metadata, create basic info
            metadata = {
              title: filename.replace('.md', '').replace(/_/g, ' '),
              filename: filename,
              lastModified: fileObj.modified || new Date().toISOString(),
              wordCount: 0
            };
          }
          
          fileData.push(metadata);
        } catch (err) {
          console.error(`❌ Error loading ${filename}:`, err);
        }
      }
      
      // Sort by last modified (newest first)
      fileData.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
      
      console.log(`✅ Loaded ${fileData.length} Zenith files`);
      setZenithFiles(fileData);
    } catch (error) {
      console.error('❌ Error loading Zenith files:', error);
      setZenithFiles([]); // Set empty array on error
    } finally {
      setLoadingZenithFiles(false);
    }
  }, []);

  // Load files on component mount and keep them loaded
  useEffect(() => {
    loadZenithFiles();
  }, [loadZenithFiles]);

  // Load files when Zenith tab becomes active (refresh view)
  useEffect(() => {
    if (activeTab === 'zenith') {
      loadZenithFiles();
    }
  }, [activeTab, loadZenithFiles]);

  // Listen for file save events and always refresh
  useEffect(() => {
    const handleFileSaved = (e) => {
      console.log('📡 zenith-file-saved event received:', e.detail);
      const { filename } = e.detail || {};
      if (filename) {
        console.log('📝 Setting active file:', filename);
        setActiveZenithFile(filename); // Set the saved file as active
      }
      console.log('🔄 Refreshing file list...');
      loadZenithFiles(); // Always refresh, regardless of active tab
    };

    console.log('👂 Listening for zenith-file-saved events');
    window.addEventListener('zenith-file-saved', handleFileSaved);
    return () => {
      console.log('🔇 Removing zenith-file-saved listener');
      window.removeEventListener('zenith-file-saved', handleFileSaved);
    };
  }, [loadZenithFiles]);

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

  // --- GROUP SESSIONS BY DATE ---
  const groupedSessions = useMemo(() => {
    const groups = { 
      pinned: [], 
      today: [], 
      yesterday: [], 
      older: [] 
    };
    const now = new Date();
    
    sessions.forEach(session => {
      if (session.pinned) {
        groups.pinned.push(session);
        return;
      }
      
      const sessionDate = new Date(session.date);
      const daysDiff = Math.floor((now - sessionDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) groups.today.push(session);
      else if (daysDiff === 1) groups.yesterday.push(session);
      else groups.older.push(session);
    });
    
    return groups;
  }, [sessions]);

  // --- FILTER SESSIONS ---
  const filteredGroupedSessions = useMemo(() => {
    if (!searchQuery.trim()) return groupedSessions;
    
    const query = searchQuery.toLowerCase();
    const filtered = {};
    
    Object.entries(groupedSessions).forEach(([group, items]) => {
      filtered[group] = items.filter(session => 
        (session.title || 'Untitled').toLowerCase().includes(query)
      );
    });
    
    return filtered;
  }, [groupedSessions, searchQuery]);

  // --- FILTER PROJECTS ---
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    
    const query = searchQuery.toLowerCase();
    return projects.filter(proj => 
      proj.name.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  // --- FILTER ZENITH FILES ---
  const filteredZenithFiles = useMemo(() => {
    if (!searchQuery.trim()) return zenithFiles;
    
    const query = searchQuery.toLowerCase();
    return zenithFiles.filter(file => 
      file.title.toLowerCase().includes(query) ||
      file.filename.toLowerCase().includes(query)
    );
  }, [zenithFiles, searchQuery]);

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
      totalProjects: projects.length,
      zenithDocs: zenithFiles.length
    };
  }, [projects, sessions, todaysEvents, zenithFiles]);

  // --- TAB SWITCHER LOGIC ---
  const switchTab = useCallback((tab) => {
    setActiveTab(tab);
    setSearchQuery(""); // Clear search when switching tabs
    
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
    } else if (tab === 'chats') {
      setCurrentView('chat');
    }
  }, [setCurrentView]);

  // --- ACTIONS ---
  const handleCreateProject = useCallback(async () => {
    if (!newProjName.trim()) return;
    try { 
      setIsLoading(true); 
      await createProject(newProjName); 
      setNewProjName(""); 
      setIsCreatingProj(false); 
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsLoading(false); 
    }
  }, [newProjName, createProject]);

  const saveProjectSettings = useCallback(async () => {
    if (!editingProject) return;
    try { 
      setIsLoading(true); 
      await updateProjectSettings(tempSystemPrompt); 
      setEditingProject(null); 
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsLoading(false); 
    }
  }, [tempSystemPrompt, updateProjectSettings, editingProject]);

  const submitRename = useCallback(async (e) => {
    e.stopPropagation();
    if (!renameValue.trim()) return;
    try { 
      setIsLoading(true); 
      await renameChat(editingSessionId, renameValue); 
      setEditingSessionId(null); 
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsLoading(false); 
    }
  }, [renameValue, editingSessionId, renameChat]);

  const handleProjectClick = useCallback((proj) => {
    setActiveProject(proj);
    setCurrentView('dashboard');
  }, [setActiveProject, setCurrentView]);

  const handleChatClick = useCallback((id) => { 
    loadSession(id); 
    setCurrentView('chat'); 
  }, [loadSession, setCurrentView]);
  
  const handleNewChat = useCallback(() => { 
    startNewChat(); 
    setCurrentView('chat'); 
  }, [startNewChat, setCurrentView]);

  const toggleSection = useCallback((section) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      newSet.has(section) ? newSet.delete(section) : newSet.add(section);
      return newSet;
    });
  }, []);

  const handlePinToggle = useCallback((e, sessionId, isPinned) => {
    e.stopPropagation();
    if (isPinned) {
      unpinSession?.(sessionId);
    } else {
      pinSession?.(sessionId);
    }
  }, [pinSession, unpinSession]);

  // --- ZENITH FILE ACTIONS ---
  const handleLoadZenithFile = useCallback((filename) => {
    console.log('📂 Loading Zenith file:', filename);
    setCurrentView('zenith');
    setActiveZenithFile(filename); // Track which file is active
    // Dispatch event to load file in Zenith
    window.dispatchEvent(new CustomEvent('zenith-load-file', { 
      detail: { filename } 
    }));
    console.log('✅ Load event dispatched');
  }, [setCurrentView]);

  const handleNewZenithFile = useCallback(() => {
    console.log('➕ Creating new Zenith file');
    setCurrentView('zenith');
    setActiveZenithFile(null); // Clear active file for new document
    window.dispatchEvent(new CustomEvent('zenith-new-file'));
    console.log('✅ New file event dispatched');
  }, [setCurrentView]);

  const handleDeleteZenithFile = useCallback(async (e, filename) => {
    e.stopPropagation();
    
    console.log('🗑️ Attempting to delete:', filename);
    
    if (!window.confirm(`Delete "${filename}"?`)) {
      console.log('❌ Delete cancelled by user');
      return;
    }
    
    try {
      const result = await window.lumina.deleteFile(filename);
      console.log('🗑️ Delete result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Delete failed');
      }
      
      console.log('✅ File deleted successfully');
      
      // Clear active file if we deleted it
      if (activeZenithFile === filename) {
        console.log('🔄 Deleted file was active, creating new document');
        setActiveZenithFile(null);
        // Optionally create a new empty document
        handleNewZenithFile();
      }
      
      // Reload file list
      console.log('🔄 Reloading file list...');
      loadZenithFiles();
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      alert(`Failed to delete file: ${error.message}`);
    }
  }, [loadZenithFiles, activeZenithFile, handleNewZenithFile]);

  // Format date for display
  const formatDate = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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
          <span className="font-bold text-xs tracking-widest text-white/90 uppercase">Brainless</span>
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

            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <div className="text-[9px] text-gray-500 uppercase tracking-wider">Documents</div>
                <div className="text-xl font-bold text-white">{stats.zenithDocs}</div>
              </div>
              <div className="text-[8px] text-gray-600">Zenith essays & notes</div>
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
              className={`group flex w-full items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all mb-3`}
            >
              <div className="flex items-center gap-2">
                <Plus size={10} className={theme.accentText} />
                New Session
              </div>
              <kbd className="text-[8px] text-gray-700 font-mono">⌘N</kbd>
            </button>

            {/* Search Filter */}
            <div className="mb-3 relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter chats..."
                className="w-full bg-black/30 border border-white/5 rounded-lg pl-8 pr-8 py-1.5 text-[10px] text-white placeholder-gray-600 focus:border-white/20 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                >
                  <X size={10} />
                </button>
              )}
            </div>

            {/* Loading State */}
            {isLoading && <SkeletonLoader />}

            {/* Empty State */}
            {!isLoading && sessions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <MessageSquare size={24} className="text-gray-700 mb-3" />
                <p className="text-[10px] text-gray-500 mb-3 text-center">
                  No conversations yet
                </p>
                <button 
                  onClick={handleNewChat}
                  className="text-[9px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <Plus size={10} /> Start your first chat
                </button>
              </div>
            )}

            {/* Sessions List with Groups */}
            {!isLoading && sessions.length > 0 && (
              <div className="space-y-3">
                {Object.entries(filteredGroupedSessions).map(([group, items]) => 
                  items.length > 0 && (
                    <div key={group}>
                      <div className="flex items-center gap-2 text-[8px] text-gray-700 uppercase tracking-widest px-2 py-1.5 mb-1">
                        {group === 'pinned' && <Pin size={8} />}
                        <span>{group}</span>
                        <span className="text-gray-800">({items.length})</span>
                      </div>
                      <div className="space-y-1">
                        {items.map(session => (
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
                                    autoFocus 
                                    value={renameValue} 
                                    onChange={(e) => setRenameValue(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && submitRename(e)} 
                                    onClick={(e) => e.stopPropagation()} 
                                    className={`w-full bg-black/50 border rounded px-1 text-[11px] text-white focus:outline-none ${theme.primaryBorder}`}
                                  />
                                  <button 
                                    onClick={submitRename} 
                                    className="text-green-500 hover:text-green-400"
                                  >
                                    <Check size={12}/>
                                  </button>
                                </div>
                              ) : (
                                <span className="truncate text-[12px] font-medium">
                                  {session.title || "Untitled"}
                                </span>
                              )}
                            </div>
                            {editingSessionId !== session.id && (
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => handlePinToggle(e, session.id, session.pinned)} 
                                  className={`hover:text-white p-1 ${session.pinned ? 'text-indigo-400' : ''}`}
                                  title={session.pinned ? "Unpin" : "Pin"}
                                >
                                  <Pin size={10} />
                                </button>
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setEditingSessionId(session.id); 
                                    setRenameValue(session.title); 
                                  }} 
                                  className="hover:text-white p-1"
                                >
                                  <Edit2 size={10} />
                                </button>
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    deleteSession(e, session.id); 
                                  }} 
                                  className="hover:text-red-400 p-1"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {group !== 'older' && <div className="h-px bg-white/5 my-2" />}
                    </div>
                  )
                )}
              </div>
            )}
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
                  autoFocus 
                  value={newProjName} 
                  onChange={(e) => setNewProjName(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()} 
                  placeholder="Context Name..." 
                  className="w-full bg-transparent text-white text-[11px] outline-none mb-2"
                />
                <div className="flex gap-2 justify-end">
                  <button 
                    onClick={() => setIsCreatingProj(false)} 
                    className="text-[9px] text-gray-500 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateProject} 
                    className={`text-[9px] px-2 py-0.5 rounded text-white ${theme.primaryBg}`}
                  >
                    Create
                  </button>
                </div>
              </div>
            )}

            {/* Search Filter */}
            <div className="mb-3 relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter contexts..."
                className="w-full bg-black/30 border border-white/5 rounded-lg pl-8 pr-8 py-1.5 text-[10px] text-white placeholder-gray-600 focus:border-white/20 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                >
                  <X size={10} />
                </button>
              )}
            </div>

            {/* Loading State */}
            {isLoading && <SkeletonLoader />}

            {/* Empty State */}
            {!isLoading && projects.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Folder size={24} className="text-gray-700 mb-3" />
                <p className="text-[10px] text-gray-500 mb-3 text-center">
                  No contexts created yet
                </p>
                <button 
                  onClick={() => setIsCreatingProj(true)}
                  className="text-[9px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <Plus size={10} /> Create your first context
                </button>
              </div>
            )}

            {/* Projects List */}
            {!isLoading && filteredProjects.length > 0 && (
              <div className="space-y-2">
                {filteredProjects.map(proj => (
                  <div 
                    key={proj.id} 
                    onClick={() => handleProjectClick(proj)} 
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
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            e.preventDefault(); 
                            setEditingProject(proj); 
                            setTempSystemPrompt(proj.systemPrompt || ""); 
                          }} 
                          className="text-gray-500 hover:text-white p-1"
                        >
                          <Sliders size={10} />
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            e.preventDefault(); 
                            deleteProject(e, proj.id); 
                          }} 
                          className="text-gray-500 hover:text-red-400 p-1"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[9px] text-gray-600 font-mono">
                        {proj.files?.length || 0} files
                      </div>
                      {proj.files?.length > 0 && (
                        <div className="w-1 h-1 bg-green-500/50 rounded-full animate-pulse" />
                      )}
                      {proj.systemPrompt && (
                        <div className="text-[8px] text-purple-500/60 border border-purple-500/20 px-1 rounded">
                          AI
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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

        {/* CANVAS PLACEHOLDER */}
        {activeTab === 'canvas' && (
            <div className="flex flex-col items-center justify-center h-40 text-center opacity-50 px-4">
                <Layout size={32} className="mb-2 text-gray-500"/>
                <p className="text-[10px] text-gray-400 font-medium">Canvas Active</p>
                <p className="text-[9px] text-gray-600 mt-1">Tools are open in the main view.</p>
            </div>
        )}

        {/* ZENITH FILES LIST */}
        {activeTab === 'zenith' && (
          <>
            <button 
              onClick={handleNewZenithFile} 
              className={`group flex w-full items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all mb-3`}
            >
              <div className="flex items-center gap-2">
                <Plus size={10} className={theme.accentText} />
                New Document
              </div>
              <kbd className="text-[8px] text-gray-700 font-mono">⌘N</kbd>
            </button>

            {/* Search Filter */}
            <div className="mb-3 relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter documents..."
                className="w-full bg-black/30 border border-white/5 rounded-lg pl-8 pr-8 py-1.5 text-[10px] text-white placeholder-gray-600 focus:border-white/20 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                >
                  <X size={10} />
                </button>
              )}
            </div>

            {/* Loading State */}
            {loadingZenithFiles && <SkeletonLoader />}

            {/* Empty State */}
            {!loadingZenithFiles && zenithFiles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <FileText size={24} className="text-gray-700 mb-3" />
                <p className="text-[10px] text-gray-500 mb-3 text-center">
                  No documents yet
                </p>
                <button 
                  onClick={handleNewZenithFile}
                  className="text-[9px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <Plus size={10} /> Create your first document
                </button>
              </div>
            )}

            {/* Files List */}
            {!loadingZenithFiles && filteredZenithFiles.length > 0 && (
              <div className="space-y-2">
                {filteredZenithFiles.map((file, index) => (
                  <div
                    key={file.filename + index}
                    onClick={() => handleLoadZenithFile(file.filename)}
                    className={`group cursor-pointer rounded-lg border p-3 transition-all ${
                      activeZenithFile === file.filename
                        ? `${theme.softBg} text-white border-white/5 shadow-md`
                        : 'border-white/5 hover:bg-white/5 hover:border-white/10 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-start gap-2 flex-1">
                        <FileText 
                          size={12} 
                          className={`${activeZenithFile === file.filename ? theme.accentText : 'text-gray-500'} mt-0.5 flex-shrink-0`} 
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-[11px] font-bold truncate mb-0.5 ${
                            activeZenithFile === file.filename ? 'text-white' : 'text-gray-300'
                          }`}>
                            {file.title}
                          </h4>
                          <div className={`flex items-center gap-2 text-[9px] ${
                            activeZenithFile === file.filename ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            <span>{file.wordCount || 0} words</span>
                            {file.writingMode && (
                              <>
                                <span>•</span>
                                <span className="capitalize">{file.writingMode}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteZenithFile(e, file.filename)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                    <div className={`text-[8px] font-mono ${
                      activeZenithFile === file.filename ? 'text-gray-600' : 'text-gray-700'
                    }`}>
                      {formatDate(file.lastModified)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
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
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => setEditingProject(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.95 }}
              className="bg-[#0F0F0F] border border-white/10 rounded-xl w-full max-w-md p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Sliders size={12} className={theme.accentText}/> Project Persona
                </h3>
                <button 
                  onClick={() => setEditingProject(null)} 
                  className="text-gray-500 hover:text-white"
                >
                  <X size={14} />
                </button>
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