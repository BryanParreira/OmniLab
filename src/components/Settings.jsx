import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLumina } from '../context/LuminaContext';
import { 
  X, Save, Server, Cpu, Brain, Sliders, Monitor, Type, Database, 
  Terminal, BookOpen, Shield, Zap, Check, ChevronDown, RefreshCw, 
  Sparkles, Info, Github, Bug, FileText, ExternalLink, Download, CheckCircle, Loader2,
  Trash2, MessageSquare, HardDrive, AlertTriangle, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURATION ---
const REPO_URL = "https://github.com/BryanParreira/OmniLab";

const getTheme = (isDev) => ({
  accent: isDev ? 'text-rose-400' : 'text-indigo-400',
  bg: isDev ? 'bg-rose-600' : 'bg-indigo-600',
  bgHover: isDev ? 'hover:bg-rose-700' : 'hover:bg-indigo-700',
  border: isDev ? 'focus:border-rose-500/50 focus:ring-rose-500/20' : 'focus:border-indigo-500/50 focus:ring-indigo-500/20',
  glow: isDev ? 'shadow-rose-500/20' : 'shadow-indigo-500/20',
  gradient: isDev ? 'from-rose-600 to-orange-600' : 'from-indigo-600 to-violet-600',
});

const NavButton = React.memo(({ active, onClick, icon: Icon, label, desc, theme }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
      active 
        ? `bg-gradient-to-r ${theme.gradient} text-white shadow-lg ${theme.glow}` 
        : 'hover:bg-white/5 text-gray-400'
    }`}
  >
    <div className={`transition-transform ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
      <Icon size={18} />
    </div>
    <div className="flex-1">
      <div className={`text-xs font-bold transition-colors ${active ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
        {label}
      </div>
      <div className={`text-[10px] transition-colors ${active ? 'text-white/70' : 'text-gray-600 group-hover:text-gray-500'}`}>
        {desc}
      </div>
    </div>
  </button>
));
NavButton.displayName = 'NavButton';

const ModeCard = React.memo(({ active, onClick, icon: Icon, title, desc, theme }) => (
  <button
    onClick={onClick}
    className={`relative p-6 rounded-2xl border text-left transition-all duration-300 group ${
      active
        ? `bg-gradient-to-br ${theme.gradient} border-transparent ring-2 ring-white/20 shadow-2xl ${theme.glow}`
        : 'bg-[#0A0A0A] border-white/10 hover:border-white/20 hover:bg-white/5'
    }`}
  >
    {active && (
      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} className="absolute top-4 right-4 bg-white text-indigo-600 rounded-full p-1">
        <Check size={14} strokeWidth={3} />
      </motion.div>
    )}
    <div className={`p-3 rounded-xl w-fit mb-4 transition-all ${active ? 'bg-white/20 text-white' : 'bg-[#151515] text-gray-500 group-hover:bg-white/10 group-hover:text-gray-300'}`}>
      <Icon size={22} />
    </div>
    <h4 className={`text-sm font-bold mb-2 ${active ? 'text-white' : 'text-gray-200'}`}>{title}</h4>
    <p className={`text-xs leading-relaxed ${active ? 'text-white/80' : 'text-gray-500'}`}>{desc}</p>
  </button>
));
ModeCard.displayName = 'ModeCard';

const Section = React.memo(({ title, icon: Icon, children, theme }) => (
  <div className="mb-8">
    <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest mb-6">
      <div className={`p-1.5 rounded-md bg-white/5 ${theme.accent}`}><Icon size={14} /></div>
      {title}
    </div>
    <div className="space-y-5">{children}</div>
  </div>
));
Section.displayName = 'Section';

const InputGroup = React.memo(({ label, desc, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-300 mb-2.5">{label}</label>
    {children}
    {desc && <p className="text-[10px] text-gray-500 mt-2.5 ml-1 leading-relaxed">{desc}</p>}
  </div>
));
InputGroup.displayName = 'InputGroup';

// --- NEW: CONFIRMATION MODAL FOR DELETIONS ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, keyword, theme }) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (inputValue.toUpperCase() === keyword.toUpperCase()) {
      onConfirm();
      onClose();
    } else {
      setError(`Please type "${keyword}" to confirm`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0F0F0F] border-2 border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl p-6"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-400">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-400 mb-2">
            Type <span className="text-red-400 font-mono">{keyword}</span> to confirm
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setError(''); }}
            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500/50"
            placeholder={keyword}
            autoFocus
          />
          {error && (
            <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
              <AlertTriangle size={12} /> {error}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-colors"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const Settings = ({ isOpen, onClose }) => {
  const { settings, updateSettings, availableModels, refreshModels, factoryReset } = useLumina();
  const [form, setForm] = useState(settings);
  const [activeTab, setActiveTab] = useState('capabilities');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // --- CONFIRMATION MODAL STATE ---
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', keyword: '', message: '' });
  
  // [NEW] OLLAMA CONNECTION STATE
  const [connectionStatus, setConnectionStatus] = useState('idle'); 

  // UPDATE STATE
  const [updateStatus, setUpdateStatus] = useState('idle'); 
  const [updateMessage, setUpdateMessage] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);

  const localTheme = useMemo(() => getTheme(form.developerMode), [form.developerMode]);

  useEffect(() => { setForm(settings); setHasChanges(false); }, [settings]);

  // Setup Update Listener (must run before component return)
  useEffect(() => {
    if (window.lumina && window.lumina.onUpdateMessage) {
      const cleanup = window.lumina.onUpdateMessage((data) => {
        if(data.status) setUpdateStatus(data.status);
        if(data.text) setUpdateMessage(data.text);
        if (data.progress) setDownloadProgress(Math.floor(data.progress));
      });
      return cleanup;
    }
  }, []);

  // [NEW] Function to check Ollama health
  const checkOllamaHealth = useCallback(async (url) => {
    setConnectionStatus('checking');
    try {
        const isLive = await window.lumina.checkOllamaStatus(url);
        setConnectionStatus(isLive ? 'connected' : 'error');
    } catch (e) {
        setConnectionStatus('error');
    }
  }, []);

  // Auto-check connection status when endpoint changes or component loads
  useEffect(() => {
      checkOllamaHealth(form.ollamaUrl);
  }, [form.ollamaUrl, checkOllamaHealth]);

  const handleFormChange = useCallback((updates) => {
    setForm(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    await updateSettings(form);
    setHasChanges(false);
  }, [form, updateSettings]);

  const handleClose = useCallback(() => {
    if (hasChanges && window.confirm('You have unsaved changes. Discard them?')) {
        setForm(settings);
        setHasChanges(false);
        onClose();
    } else if (!hasChanges) {
        onClose();
    }
  }, [hasChanges, settings, onClose]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshModels();
    setTimeout(() => setIsRefreshing(false), 800);
  }, [refreshModels]);

  // --- NEW: SPECIFIC RESET ACTIONS WITH CONFIRMATION ---
  const handleReset = useCallback(async (type) => {
    let keyword = '';
    let message = '';
    let title = '';

    if (type === 'chats') {
      keyword = 'DELETE CHATS';
      title = 'Delete All Chat Sessions';
      message = 'This will permanently delete all your chat history. This action cannot be undone.';
    } else if (type === 'cache') {
      keyword = 'DELETE CACHE';
      title = 'Delete Research Cache';
      message = 'This will remove all cached web research data. You can always re-fetch the content later.';
    } else if (type === 'calendar') {
      keyword = 'DELETE CALENDAR';
      title = 'Delete All Calendar Events';
      message = 'This will permanently delete all your calendar events and schedules. This action cannot be undone.';
    } else if (type === 'factory') {
      keyword = 'FACTORY RESET';
      title = 'Factory Reset';
      message = 'This will delete ALL data including chats, projects, calendar, and settings. This action is irreversible.';
    }

    setConfirmModal({
      isOpen: true,
      type,
      keyword,
      message,
      title
    });
  }, []);

  const executeReset = useCallback(async () => {
    const type = confirmModal.type;
    
    try {
      if (type === 'chats') {
        await window.lumina.deleteChats();
      } else if (type === 'cache') {
        await window.lumina.deleteCache();
      } else if (type === 'calendar') {
        await window.lumina.deleteCalendar();
      } else if (type === 'factory') {
        await factoryReset();
        onClose();
      }
    } catch (error) {
      console.error('Reset error:', error);
    }
  }, [confirmModal.type, factoryReset, onClose]);

  // --- UPDATE LOGIC (UI FORCE UPDATE) ---
  const checkForUpdates = () => {
    if (window.lumina && window.lumina.checkForUpdates) {
      setUpdateStatus('checking');
      setUpdateMessage('Checking for updates...');
      window.lumina.checkForUpdates();
    } else {
      setUpdateStatus('error');
      setUpdateMessage('Update API unavailable.');
    }
  };

  const startDownload = () => {
     if (window.lumina && window.lumina.downloadUpdate) {
        // FORCE UI UPDATE to "Downloading" immediately
        setUpdateStatus('downloading');
        setUpdateMessage('Starting download...');
        setDownloadProgress(0);
        window.lumina.downloadUpdate();
     }
  };

  const installUpdate = () => {
    if (window.lumina && window.lumina.quitAndInstall) {
      window.lumina.quitAndInstall(); // Triggers IPC call to restart app
    }
  };

  const openLink = (url) => { window.open(url, '_blank'); };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 sm:p-8 animate-fade-in">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#030304] w-full max-w-5xl h-[750px] max-h-[90vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none"></div>
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${localTheme.gradient} opacity-60`}></div>
        <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${localTheme.gradient} opacity-5 blur-3xl pointer-events-none`}></div>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-[#050505]/80 backdrop-blur-sm relative z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${localTheme.gradient} shadow-lg ${localTheme.glow}`}><Sliders size={18} className="text-white" /></div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">System Configuration</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">OmniLab {form.developerMode ? 'Forge' : 'Nexus'} OS</p>
                {form.developerMode && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                    <Sparkles size={10} className="text-rose-400" />
                    <span className="text-[9px] font-bold text-rose-400">FORGE MODE</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button onClick={handleClose} className="p-2.5 rounded-xl hover:bg-white/10 text-gray-500 hover:text-white transition-all"><X size={20} /></button>
        </div>

        <div className="flex flex-1 overflow-hidden relative z-10">
          {/* Sidebar */}
          <div className="w-64 border-r border-white/5 bg-[#020202]/50 backdrop-blur-sm p-4 flex flex-col gap-2">
            <NavButton active={activeTab === 'capabilities'} onClick={() => setActiveTab('capabilities')} icon={Terminal} label="Capabilities" desc="Modes & Personas" theme={localTheme} />
            <NavButton active={activeTab === 'neural'} onClick={() => setActiveTab('neural')} icon={Brain} label="Neural Engine" desc="LLM & Connection" theme={localTheme} />
            <NavButton active={activeTab === 'interface'} onClick={() => setActiveTab('interface')} icon={Monitor} label="Interface" desc="Visuals & Layout" theme={localTheme} />
            <NavButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={Database} label="Data Management" desc="Storage & Reset" theme={localTheme} />
            <div className="flex-1"></div>
            <NavButton active={activeTab === 'about'} onClick={() => setActiveTab('about')} icon={Info} label="About OmniLab" desc="Docs & Updates" theme={localTheme} />
          </div>

          <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-[#050505]/50 backdrop-blur-sm">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }} className="max-w-2xl">
                
                {activeTab === 'capabilities' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">Operating State</h3>
                      <p className="text-sm text-gray-400 mb-6">Select the primary cognitive architecture.</p>
                      <div className="grid grid-cols-2 gap-4">
                        <ModeCard active={!form.developerMode} onClick={() => handleFormChange({ developerMode: false })} icon={BookOpen} title="Nexus State" desc="Optimized for deep research, synthesis, and knowledge connection." theme={localTheme} />
                        <ModeCard active={form.developerMode} onClick={() => handleFormChange({ developerMode: true })} icon={Zap} title="Forge State" desc="Unlocks full engineering capabilities and git integration." theme={localTheme} />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'neural' && (
                  <div className="space-y-8">
                    <Section title="Ollama Connection" icon={Server} theme={localTheme}>
                      <InputGroup label="API Endpoint" desc="Address of your local or remote Ollama instance.">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            {/* Input with Connection Status Dot */}
                            <input 
                              value={form.ollamaUrl} 
                              onChange={(e) => handleFormChange({ ollamaUrl: e.target.value })} 
                              className={`w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 transition-all ${localTheme.border} pl-10`} 
                              type="url" 
                              placeholder="http://127.0.0.1:11434" 
                            />
                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                                connectionStatus === 'connected' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 
                                connectionStatus === 'error' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 
                                'bg-gray-600'
                            }`}></div>
                          </div>
                          
                          <button 
                            onClick={async () => {
                                setIsRefreshing(true);
                                await checkOllamaHealth(form.ollamaUrl);
                                setIsRefreshing(false);
                            }} 
                            className={`px-4 rounded-xl border border-white/10 hover:bg-white/5 transition-all font-bold text-xs ${connectionStatus === 'connected' ? 'text-green-400 border-green-500/30' : 'text-gray-400'}`}
                            disabled={isRefreshing}
                          >
                            {isRefreshing ? <Loader2 size={14} className="animate-spin"/> : (connectionStatus === 'connected' ? 'Connected' : 'Test Ping')}
                          </button>
                        </div>
                        {connectionStatus === 'error' && <p className="text-[10px] text-red-500 mt-2.5 ml-1 leading-relaxed flex items-center gap-1"><AlertTriangle size={10}/> Could not connect. Ensure Ollama is running and the URL is correct.</p>}

                      </InputGroup>
                    </Section>

                    <Section title="Model Parameters" icon={Cpu} theme={localTheme}>
                      <InputGroup label="Active Model" desc="Select the Large Language Model for inference.">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <select value={form.defaultModel} onChange={(e) => handleFormChange({ defaultModel: e.target.value })} className={`w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 pr-10 text-white text-sm appearance-none focus:outline-none focus:ring-2 transition-all ${localTheme.border}`}>
                              {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-3.5 text-gray-500 pointer-events-none" />
                          </div>
                          <button onClick={handleRefresh} disabled={isRefreshing} className={`bg-white/5 border border-white/10 rounded-xl px-4 transition-all text-gray-400 hover:text-white`}>
                            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                          </button>
                        </div>
                      </InputGroup>
                      <InputGroup label={`Temperature: ${form.temperature.toFixed(1)}`} desc="Creativity vs Precision balance.">
                          <input type="range" min="0" max="1" step="0.1" value={form.temperature} onChange={(e) => handleFormChange({ temperature: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider-thumb" />
                      </InputGroup>
                    </Section>
                  </div>
                )}

                {activeTab === 'interface' && (
                  <div className="space-y-8">
                    <Section title="Appearance" icon={Type} theme={localTheme}>
                      <InputGroup label={`Font Size: ${form.fontSize || 14}px`} desc="Adjust text size for better readability.">
                        <div className="flex items-center gap-6 pt-2">
                          <span className="text-xs text-gray-500 font-bold">Aa</span>
                          <input type="range" min="12" max="20" step="1" value={form.fontSize || 14} onChange={(e) => handleFormChange({ fontSize: parseInt(e.target.value) })} className="flex-1 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider-thumb" />
                          <span className="text-lg text-white font-bold">Aa</span>
                        </div>
                      </InputGroup>
                    </Section>
                  </div>
                )}

                {activeTab === 'data' && (
                  <div className="space-y-8">
                    <Section title="Storage Management" icon={HardDrive} theme={localTheme}>
                      <InputGroup label="Delete Specific Data" desc="Perform non-destructive cleanup actions.">
                        <div className="grid grid-cols-3 gap-3">
                           <button onClick={() => handleReset('chats')} className="flex flex-col items-center justify-center p-4 bg-[#0A0A0A] border border-white/10 rounded-xl text-xs text-red-400 hover:bg-white/5 transition-all">
                              <MessageSquare size={20} /> <span className="mt-1">Chats</span>
                           </button>
                           <button onClick={() => handleReset('cache')} className="flex flex-col items-center justify-center p-4 bg-[#0A0A0A] border border-white/10 rounded-xl text-xs text-red-400 hover:bg-white/5 transition-all">
                              <HardDrive size={20} /> <span className="mt-1">Research Cache</span>
                           </button>
                           <button onClick={() => handleReset('calendar')} className="flex flex-col items-center justify-center p-4 bg-[#0A0A0A] border border-white/10 rounded-xl text-xs text-red-400 hover:bg-white/5 transition-all">
                              <Calendar size={20} /> <span className="mt-1">Calendar</span>
                           </button>
                        </div>
                      </InputGroup>
                    </Section>
                    
                    <Section title="Danger Zone" icon={Shield} theme={localTheme}>
                      <div className="p-6 border-2 border-red-500/30 bg-red-500/5 rounded-2xl">
                         <h4 className="text-red-400 font-bold text-sm mb-1.5">Factory Reset</h4>
                         <p className="text-red-400/70 text-xs leading-relaxed mb-4">Permanently delete all data (Chats, Projects, Cache, Settings).</p>
                         <button onClick={() => handleReset('factory')} className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border-2 border-red-500/30 rounded-xl text-xs font-bold transition-all">Reset System</button>
                      </div>
                    </Section>
                  </div>
                )}

                {activeTab === 'about' && (
                  <div className="space-y-8">
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-white/5 rounded-2xl border border-white/5 mb-8">
                       <div className={`p-4 rounded-2xl bg-gradient-to-br ${localTheme.gradient} shadow-2xl mb-4`}>
                          <Brain size={40} className="text-white" />
                       </div>
                       <h3 className="text-2xl font-bold text-white tracking-tight">OmniLab</h3>
                       <p className="text-sm text-gray-500 font-mono mt-1">v1.0.0 • {form.developerMode ? 'Forge' : 'Nexus'} Build</p>
                    </div>

                    <Section title="Software Update" icon={RefreshCw} theme={localTheme}>
                       <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/10 relative overflow-hidden">
                          
                          {/* Progress Bar Background */}
                          {updateStatus === 'downloading' && (
                            <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${localTheme.gradient} transition-all duration-300`} style={{ width: `${downloadProgress}%` }}></div>
                          )}

                          <div className="flex items-center justify-between mb-4">
                             <div>
                               <div className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                                 Update Status
                                 {updateStatus === 'downloading' && <span className="text-[10px] text-blue-400">({downloadProgress}%)</span>}
                               </div>
                               <div className="text-xs text-gray-500">
                                 {updateMessage || "Check for the latest version."}
                               </div>
                             </div>
                             
                             {updateStatus === 'available' && <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30 font-bold animate-pulse">New Version</span>}
                          </div>

                          <div className="flex gap-3">
                             {/* Check Button */}
                             {updateStatus !== 'downloading' && updateStatus !== 'downloaded' && (
                               <button 
                                 onClick={checkForUpdates}
                                 disabled={updateStatus === 'checking'}
                                 className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${updateStatus === 'checking' ? 'bg-white/5 text-gray-500' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                               >
                                 {updateStatus === 'checking' && <Loader2 size={12} className="animate-spin" />}
                                 {updateStatus === 'checking' ? 'Checking...' : 'Check for Updates'}
                               </button>
                             )}

                             {/* Download Button */}
                             {updateStatus === 'available' && (
                               <button 
                                 onClick={startDownload}
                                 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r ${localTheme.gradient} shadow-lg hover:brightness-110 active:scale-95 transition-all`}
                               >
                                 <Download size={14} /> Download Update
                               </button>
                             )}

                             {/* Downloading State */}
                             {updateStatus === 'downloading' && (
                               <button disabled className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-gray-400 bg-white/5 border border-white/5 cursor-not-allowed">
                                 <Loader2 size={14} className="animate-spin text-blue-400" /> Downloading...
                               </button>
                             )}

                             {/* Restart Button */}
                             {updateStatus === 'downloaded' && (
                               <button 
                                 onClick={installUpdate}
                                 className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-green-600 hover:bg-green-500 shadow-lg animate-pulse"
                               >
                                 <CheckCircle size={14} /> Restart & Install
                               </button>
                             )}
                          </div>
                       </div>
                    </Section>

                    <Section title="Community & Support" icon={Github} theme={localTheme}>
                       <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => openLink(`${REPO_URL}#readme`)} className="flex items-center gap-3 p-4 rounded-xl bg-[#0A0A0A] border border-white/10 hover:bg-white/5 transition-all text-left group">
                             <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><FileText size={20}/></div>
                             <div>
                                <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">Documentation <ExternalLink size={10} /></div>
                                <div className="text-[10px] text-gray-500">Read the manual</div>
                             </div>
                          </button>

                          <button onClick={() => openLink(`${REPO_URL}/issues`)} className="flex items-center gap-3 p-4 rounded-xl bg-[#0A0A0A] border border-white/10 hover:bg-white/5 transition-all text-left group">
                             <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400"><Bug size={20}/></div>
                             <div>
                                <div className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors flex items-center gap-2">Report Issue <ExternalLink size={10} /></div>
                                <div className="text-[10px] text-gray-500">Found a bug?</div>
                             </div>
                          </button>
                       </div>
                    </Section>

                    <div className="text-center pt-8 border-t border-white/5">
                        <p className="text-xs text-gray-600">Designed & Engineered by <span className={`${localTheme.accent} font-bold`}>Bryan Bernardo Parreira</span></p>
                        <p className="text-[10px] text-gray-700 mt-1">Powered by Ollama • Local & Private</p>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-[#020202]/80 backdrop-blur-sm flex justify-between items-center">
           <div className="text-[10px] text-gray-600 font-mono">v1.0.0-OmniLab</div>
           <div className="flex gap-3">
             <button onClick={handleClose} className="px-6 py-2.5 text-gray-400 hover:text-white text-xs font-medium transition-colors rounded-xl hover:bg-white/5">{hasChanges ? 'Discard' : 'Close'}</button>
             <button onClick={handleSave} disabled={!hasChanges} className={`px-8 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-2 ${hasChanges ? `bg-gradient-to-r ${localTheme.gradient}` : 'bg-gray-700 opacity-50 cursor-not-allowed'}`}><Save size={14} /> Save Changes</button>
           </div>
        </div>
      </motion.div>
    </div>

    {/* Confirmation Modal */}
    <ConfirmationModal
      isOpen={confirmModal.isOpen}
      onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      onConfirm={executeReset}
      title={confirmModal.title}
      message={confirmModal.message}
      keyword={confirmModal.keyword}
      theme={localTheme}
    />
    </>
  );
};