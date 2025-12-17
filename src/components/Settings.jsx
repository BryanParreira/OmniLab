import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLumina } from '../context/LuminaContext';
import { 
  X, Save, Server, Cpu, Brain, Sliders, Monitor, Type, Database, 
  Terminal, BookOpen, Shield, Zap, Check, ChevronDown, RefreshCw, 
  Sparkles, Info, Github, Bug, FileText, ExternalLink, Download, CheckCircle, Loader2,
  Trash2, MessageSquare, HardDrive, AlertTriangle, Calendar, Activity, 
  Wifi, WifiOff, CheckCheck, Clock, Eye, TrendingUp, BarChart3, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURATION ---
const REPO_URL = "https://github.com/BryanParreira/Brainless";

const getTheme = (isDev) => ({
  accent: isDev ? 'text-rose-400' : 'text-indigo-400',
  bg: isDev ? 'bg-rose-600' : 'bg-indigo-600',
  bgHover: isDev ? 'hover:bg-rose-700' : 'hover:bg-indigo-700',
  border: isDev ? 'focus:border-rose-500/50 focus:ring-rose-500/20' : 'focus:border-indigo-500/50 focus:ring-indigo-500/20',
  glow: isDev ? 'shadow-rose-500/20' : 'shadow-indigo-500/20',
  gradient: isDev ? 'from-rose-600 to-orange-600' : 'from-indigo-600 to-violet-600',
  softBg: isDev ? 'bg-rose-500/5' : 'bg-indigo-500/5',
  softBorder: isDev ? 'border-rose-500/20' : 'border-indigo-500/20',
});

const NavButton = React.memo(({ active, onClick, icon: Icon, label, desc, theme, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group relative ${
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
    {badge && (
      <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
    )}
  </button>
));
NavButton.displayName = 'NavButton';

const ModeCard = React.memo(({ active, onClick, icon: Icon, title, desc, theme, features }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    className={`relative p-6 rounded-2xl border text-left transition-all duration-300 group ${
      active
        ? `bg-gradient-to-br ${theme.gradient} border-transparent ring-2 ring-white/20 shadow-2xl ${theme.glow}`
        : 'bg-[#0A0A0A] border-white/10 hover:border-white/20 hover:bg-white/5'
    }`}
  >
    {active && (
      <motion.div 
        initial={{ scale: 0, rotate: -180 }} 
        animate={{ scale: 1, rotate: 0 }} 
        className="absolute top-4 right-4 bg-white text-indigo-600 rounded-full p-1 shadow-lg"
      >
        <Check size={14} strokeWidth={3} />
      </motion.div>
    )}
    <div className={`p-3 rounded-xl w-fit mb-4 transition-all ${active ? 'bg-white/20 text-white' : 'bg-[#151515] text-gray-500 group-hover:bg-white/10 group-hover:text-gray-300'}`}>
      <Icon size={24} />
    </div>
    <h4 className={`text-sm font-bold mb-2 ${active ? 'text-white' : 'text-gray-200'}`}>{title}</h4>
    <p className={`text-xs leading-relaxed mb-3 ${active ? 'text-white/80' : 'text-gray-500'}`}>{desc}</p>
    
    {features && features.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/10">
        {features.map((feature, i) => (
          <div key={i} className={`text-[9px] px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
            active ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-600'
          }`}>
            {feature}
          </div>
        ))}
      </div>
    )}
  </motion.button>
));
ModeCard.displayName = 'ModeCard';

const Section = React.memo(({ title, icon: Icon, children, theme, description }) => (
  <div className="mb-8">
    <div className="mb-6">
      <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">
        <div className={`p-1.5 rounded-md bg-white/5 ${theme.accent}`}><Icon size={14} /></div>
        {title}
      </div>
      {description && (
        <p className="text-xs text-gray-500 ml-8">{description}</p>
      )}
    </div>
    <div className="space-y-5">{children}</div>
  </div>
));
Section.displayName = 'Section';

const InputGroup = React.memo(({ label, desc, children, icon: Icon, theme }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-300 mb-2.5 flex items-center gap-2">
      {Icon && <Icon size={12} className={theme?.accent || 'text-gray-500'} />}
      {label}
    </label>
    {children}
    {desc && <p className="text-[10px] text-gray-500 mt-2.5 ml-1 leading-relaxed flex items-center gap-1.5">
      <Info size={10} className="flex-shrink-0" />
      {desc}
    </p>}
  </div>
));
InputGroup.displayName = 'InputGroup';

const StatusIndicator = ({ status }) => {
  const configs = {
    connected: { color: 'bg-green-500', label: 'Connected', pulse: true },
    checking: { color: 'bg-yellow-500', label: 'Checking...', pulse: true },
    error: { color: 'bg-red-500', label: 'Disconnected', pulse: false },
    idle: { color: 'bg-gray-600', label: 'Unknown', pulse: false },
  };
  
  const config = configs[status] || configs.idle;
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''} shadow-[0_0_10px_currentColor]`}></div>
      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">{config.label}</span>
    </div>
  );
};

// --- TOGGLE SWITCH COMPONENT ---
const ToggleSwitch = React.memo(({ enabled, onChange, label, desc, theme }) => (
  <div className="flex items-center justify-between p-4 bg-[#0A0A0A] border border-white/10 rounded-xl hover:bg-white/5 transition-all">
    <div className="flex-1">
      <div className="text-xs font-semibold text-gray-300 mb-1">{label}</div>
      {desc && <div className="text-[10px] text-gray-500">{desc}</div>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
        enabled ? `bg-gradient-to-r ${theme.gradient}` : 'bg-gray-700'
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 26 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
      />
    </button>
  </div>
));
ToggleSwitch.displayName = 'ToggleSwitch';

// --- SYNAPSE STATS CARD ---
const SynapseStatsCard = ({ stats, theme }) => {
  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 bg-gradient-to-br from-white/5 to-transparent rounded-xl border border-white/10"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${theme.softBg}`}>
          <BarChart3 size={16} className={theme.accent} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white">Context Intelligence Stats</h4>
          <p className="text-[10px] text-gray-500">Current index metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-black/30 rounded-lg border border-white/5">
          <div className="text-[10px] text-gray-500 mb-1">Total Chunks</div>
          <div className="text-lg font-bold text-white">{stats.totalChunks || 0}</div>
        </div>
        <div className="p-3 bg-black/30 rounded-lg border border-white/5">
          <div className="text-[10px] text-gray-500 mb-1">Sources</div>
          <div className="text-lg font-bold text-white">{stats.totalSources || 0}</div>
        </div>
        <div className="p-3 bg-black/30 rounded-lg border border-white/5">
          <div className="text-[10px] text-gray-500 mb-1">Avg Size</div>
          <div className="text-lg font-bold text-white">{Math.round(stats.avgChunkSize || 0)}</div>
        </div>
      </div>

      {stats.sourceBreakdown && Object.keys(stats.sourceBreakdown).length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="text-[10px] text-gray-500 mb-2">Source Breakdown</div>
          <div className="space-y-2">
            {Object.entries(stats.sourceBreakdown).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between text-xs">
                <span className="text-gray-400 capitalize">{source}</span>
                <span className="text-white font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// --- CONFIRMATION MODAL ---
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
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0F0F0F] border-2 border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-500/10 to-transparent blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
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
              Type <span className="text-red-400 font-mono px-2 py-0.5 bg-red-500/10 rounded">{keyword}</span> to confirm
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
              placeholder={keyword}
              autoFocus
            />
            <AnimatePresence>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-red-400 mt-2 flex items-center gap-1.5"
                >
                  <AlertTriangle size={12} /> {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!inputValue}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${
                inputValue 
                  ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/20' 
                  : 'bg-gray-700 opacity-50 cursor-not-allowed'
              }`}
            >
              Delete
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const Settings = ({ isOpen, onClose }) => {
  const { settings, updateSettings, availableModels, refreshModels, factoryReset, synapseStats, synapseReady, refreshSynapseStats } = useLumina();
  const [form, setForm] = useState(settings);
  const [activeTab, setActiveTab] = useState('capabilities');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', keyword: '', message: '' });
  const [connectionStatus, setConnectionStatus] = useState('idle'); 
  const [updateStatus, setUpdateStatus] = useState('idle'); 
  const [updateMessage, setUpdateMessage] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);

  const localTheme = useMemo(() => getTheme(form.developerMode), [form.developerMode]);

  useEffect(() => { setForm(settings); setHasChanges(false); }, [settings]);

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

  const checkOllamaHealth = useCallback(async (url) => {
    setConnectionStatus('checking');
    try {
        const isLive = await window.lumina.checkOllamaStatus(url);
        setConnectionStatus(isLive ? 'connected' : 'error');
    } catch (e) {
        setConnectionStatus('error');
    }
  }, []);

  useEffect(() => {
      checkOllamaHealth(form.ollamaUrl);
  }, [form.ollamaUrl, checkOllamaHealth]);

  const handleFormChange = useCallback((updates) => {
    setForm(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
    setSaveStatus('idle');
  }, []);

  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    await updateSettings(form);
    setSaveStatus('saved');
    setHasChanges(false);
    
    setTimeout(() => setSaveStatus('idle'), 2000);
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
    } else if (type === 'synapse') {
      keyword = 'DELETE SYNAPSE';
      title = 'Delete Context Index';
      message = 'This will delete the entire context intelligence index. It will rebuild automatically as you work.';
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
      } else if (type === 'synapse') {
        await window.lumina.synapse?.clearIndex?.();
        await refreshSynapseStats();
      } else if (type === 'factory') {
        await factoryReset();
        onClose();
      }
    } catch (error) {
      console.error('Reset error:', error);
    }
  }, [confirmModal.type, factoryReset, onClose, refreshSynapseStats]);

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
        setUpdateStatus('downloading');
        setUpdateMessage('Starting download...');
        setDownloadProgress(0);
        window.lumina.downloadUpdate();
     }
  };

  const installUpdate = () => {
    if (window.lumina && window.lumina.quitAndInstall) {
      window.lumina.quitAndInstall();
    }
  };

  const openLink = (url) => { window.open(url, '_blank'); };

  if (!isOpen) return null;

  return (
    <>
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 sm:p-8"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-[#030304] w-full max-w-6xl h-[800px] max-h-[90vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none"></div>
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${localTheme.gradient}`}></div>
          <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${localTheme.gradient} opacity-5 blur-3xl pointer-events-none`}></div>

          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-[#050505]/80 backdrop-blur-sm relative z-10">
            <div className="flex items-center gap-4">
              <motion.div 
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                className={`p-2.5 rounded-xl bg-gradient-to-br ${localTheme.gradient} shadow-lg ${localTheme.glow}`}
              >
                <Sliders size={18} className="text-white" />
              </motion.div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">System Configuration</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">Brainless {form.developerMode ? 'Forge' : 'Nexus'} OS</p>
                  {form.developerMode && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20"
                    >
                      <Sparkles size={10} className="text-rose-400" />
                      <span className="text-[9px] font-bold text-rose-400">FORGE MODE</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={handleClose} 
              className="p-2.5 rounded-xl hover:bg-white/10 text-gray-500 hover:text-white transition-all hover:rotate-90 duration-300"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden relative z-10">
            {/* Sidebar */}
            <div className="w-72 border-r border-white/5 bg-[#020202]/50 backdrop-blur-sm p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
              <NavButton 
                active={activeTab === 'capabilities'} 
                onClick={() => setActiveTab('capabilities')} 
                icon={Terminal} 
                label="Capabilities" 
                desc="Modes & Personas" 
                theme={localTheme} 
              />
              <NavButton 
                active={activeTab === 'neural'} 
                onClick={() => setActiveTab('neural')} 
                icon={Brain} 
                label="Neural Engine" 
                desc="LLM & Connection" 
                theme={localTheme}
                badge={connectionStatus === 'error'}
              />
              <NavButton 
                active={activeTab === 'synapse'} 
                onClick={() => setActiveTab('synapse')} 
                icon={Layers} 
                label="Context Intelligence" 
                desc="Synapse System" 
                theme={localTheme}
                badge={!synapseReady}
              />
              <NavButton 
                active={activeTab === 'interface'} 
                onClick={() => setActiveTab('interface')} 
                icon={Monitor} 
                label="Interface" 
                desc="Visuals & Layout" 
                theme={localTheme} 
              />
              <NavButton 
                active={activeTab === 'data'} 
                onClick={() => setActiveTab('data')} 
                icon={Database} 
                label="Data Management" 
                desc="Storage & Reset" 
                theme={localTheme} 
              />
              <div className="flex-1"></div>
              <div className="h-px bg-white/5 my-2"></div>
              <NavButton 
                active={activeTab === 'about'} 
                onClick={() => setActiveTab('about')} 
                icon={Info} 
                label="About Brainless" 
                desc="Docs & Updates" 
                theme={localTheme} 
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-[#050505]/50 backdrop-blur-sm">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeTab} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -20 }} 
                  transition={{ duration: 0.2 }} 
                  className="max-w-3xl mx-auto"
                >
                  
                  {activeTab === 'capabilities' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Operating State</h3>
                        <p className="text-sm text-gray-400 mb-8">Select the primary cognitive architecture for your workflow.</p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                          <ModeCard 
                            active={!form.developerMode} 
                            onClick={() => handleFormChange({ developerMode: false })} 
                            icon={BookOpen} 
                            title="Nexus State" 
                            desc="Optimized for deep research, synthesis, and knowledge connection."
                            features={['Research', 'Synthesis', 'Analysis']}
                            theme={localTheme} 
                          />
                          <ModeCard 
                            active={form.developerMode} 
                            onClick={() => handleFormChange({ developerMode: true })} 
                            icon={Zap} 
                            title="Forge State" 
                            desc="Unlocks full engineering capabilities and git integration."
                            features={['Coding', 'Git', 'Debugging']}
                            theme={localTheme} 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'neural' && (
                    <div className="space-y-8">
                      <Section 
                        title="Ollama Connection" 
                        icon={Server} 
                        theme={localTheme}
                        description="Configure your local LLM server endpoint"
                      >
                        <InputGroup 
                          label="API Endpoint" 
                          desc="Address of your local or remote Ollama instance."
                          icon={Wifi}
                          theme={localTheme}
                        >
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <input 
                                  value={form.ollamaUrl} 
                                  onChange={(e) => handleFormChange({ ollamaUrl: e.target.value })} 
                                  className={`w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 transition-all ${localTheme.border} pl-10`} 
                                  type="url" 
                                  placeholder="http://127.0.0.1:11434" 
                                />
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-all ${
                                    connectionStatus === 'connected' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 
                                    connectionStatus === 'error' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 
                                    connectionStatus === 'checking' ? 'bg-yellow-500 animate-pulse' :
                                    'bg-gray-600'
                                }`}></div>
                              </div>
                              
                              <button 
                                onClick={async () => {
                                    setIsRefreshing(true);
                                    await checkOllamaHealth(form.ollamaUrl);
                                    setIsRefreshing(false);
                                }} 
                                className={`px-4 rounded-xl border transition-all font-bold text-xs flex items-center gap-2 ${
                                  connectionStatus === 'connected' 
                                    ? 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20' 
                                    : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                                disabled={isRefreshing}
                              >
                                {isRefreshing ? (
                                  <Loader2 size={14} className="animate-spin"/>
                                ) : connectionStatus === 'connected' ? (
                                  <>
                                    <Wifi size={14}/>
                                    Connected
                                  </>
                                ) : (
                                  <>
                                    <WifiOff size={14}/>
                                    Test
                                  </>
                                )}
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-between px-4 py-2.5 bg-black/30 rounded-lg border border-white/5">
                              <StatusIndicator status={connectionStatus} />
                              {connectionStatus === 'connected' && (
                                <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-mono">
                                  <Activity size={10} />
                                  <span>LIVE</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {connectionStatus === 'error' && (
                            <motion.p 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-[10px] text-red-400 mt-2.5 ml-1 leading-relaxed flex items-center gap-1.5 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20"
                            >
                              <AlertTriangle size={12}/>
                              Could not connect. Ensure Ollama is running and the URL is correct.
                            </motion.p>
                          )}
                        </InputGroup>
                      </Section>

                      <Section 
                        title="Model Parameters" 
                        icon={Cpu} 
                        theme={localTheme}
                        description="Fine-tune your AI model's behavior and performance"
                      >
                        <InputGroup 
                          label="Active Model" 
                          desc="Select the Large Language Model for inference."
                          icon={Brain}
                          theme={localTheme}
                        >
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <select 
                                value={form.defaultModel} 
                                onChange={(e) => handleFormChange({ defaultModel: e.target.value })} 
                                className={`w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 pr-10 text-white text-sm appearance-none focus:outline-none focus:ring-2 transition-all ${localTheme.border}`}
                              >
                                {availableModels.length === 0 ? (
                                  <option>No models found</option>
                                ) : (
                                  availableModels.map(m => <option key={m} value={m}>{m}</option>)
                                )}
                              </select>
                              <ChevronDown size={16} className="absolute right-4 top-3.5 text-gray-500 pointer-events-none" />
                            </div>
                            <motion.button 
                              onClick={handleRefresh} 
                              disabled={isRefreshing} 
                              whileHover={{ rotate: 180 }}
                              transition={{ duration: 0.3 }}
                              className={`bg-white/5 border border-white/10 rounded-xl px-4 transition-all ${
                                isRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 text-gray-400 hover:text-white'
                              }`}
                            >
                              <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                            </motion.button>
                          </div>
                        </InputGroup>

                        <InputGroup 
                          label={`Temperature: ${form.temperature.toFixed(1)}`} 
                          desc="Creativity vs Precision balance. Lower = more focused, Higher = more creative."
                          icon={Sliders}
                          theme={localTheme}
                        >
                          <div className="space-y-3">
                            <input 
                              type="range" 
                              min="0" 
                              max="1" 
                              step="0.1" 
                              value={form.temperature} 
                              onChange={(e) => handleFormChange({ temperature: parseFloat(e.target.value) })} 
                              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider-thumb" 
                            />
                            <div className="flex justify-between text-[10px] text-gray-600 font-mono">
                              <span>PRECISE</span>
                              <span>BALANCED</span>
                              <span>CREATIVE</span>
                            </div>
                          </div>
                        </InputGroup>

                        <InputGroup 
                          label={`Context Length: ${form.contextLength.toLocaleString()}`} 
                          desc="Maximum tokens for model context window. Higher values require more memory."
                          icon={Database}
                          theme={localTheme}
                        >
                          <div className="flex items-center gap-6 pt-2">
                            <span className="text-xs text-gray-500 font-mono">2K</span>
                            <input 
                              type="range" 
                              min="2048" 
                              max="131072" 
                              step="2048" 
                              value={form.contextLength} 
                              onChange={(e) => handleFormChange({ contextLength: parseInt(e.target.value) })} 
                              className="flex-1 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider-thumb" 
                            />
                            <span className="text-xs text-white font-mono">128K</span>
                          </div>
                        </InputGroup>
                      </Section>
                    </div>
                  )}

                  {activeTab === 'synapse' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Context Intelligence System</h3>
                        <p className="text-sm text-gray-400 mb-6">
                          Synapse intelligently indexes and retrieves relevant context from your workspace to enhance AI responses.
                        </p>
                      </div>

                      <Section 
                        title="System Control" 
                        icon={Brain} 
                        theme={localTheme}
                        description="Enable or disable the context intelligence system"
                      >
                        <ToggleSwitch
                          enabled={form.synapseEnabled}
                          onChange={(value) => handleFormChange({ synapseEnabled: value })}
                          label="Enable Context Intelligence"
                          desc="When enabled, Synapse automatically indexes meaningful content and provides relevant context to AI responses."
                          theme={localTheme}
                        />

                        {form.synapseEnabled && !synapseReady && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl"
                          >
                            <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0" />
                            <div>
                              <div className="text-xs font-bold text-yellow-400 mb-1">Synapse Not Ready</div>
                              <div className="text-[10px] text-yellow-400/70">
                                The context system is enabled but not initialized. Check your backend connection.
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {form.synapseEnabled && synapseReady && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
                          >
                            <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-xs font-bold text-green-400 mb-1">Synapse Active</div>
                              <div className="text-[10px] text-green-400/70">
                                Context intelligence is running and indexing your workspace.
                              </div>
                            </div>
                            <button
                              onClick={refreshSynapseStats}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-green-400 transition-all flex items-center gap-1.5"
                            >
                              <RefreshCw size={12} />
                              Refresh
                            </button>
                          </motion.div>
                        )}
                      </Section>

                      {synapseReady && synapseStats && (
                        <Section 
                          title="Intelligence Metrics" 
                          icon={TrendingUp} 
                          theme={localTheme}
                          description="Current context index statistics and performance"
                        >
                          <SynapseStatsCard stats={synapseStats} theme={localTheme} />
                        </Section>
                      )}

                      <Section 
                        title="Smart Indexing Rules" 
                        icon={Sparkles} 
                        theme={localTheme}
                        description="Synapse uses intelligent filtering to index only meaningful content"
                      >
                        <div className="p-5 bg-[#0A0A0A] border border-white/10 rounded-xl space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10 text-green-400 flex-shrink-0">
                              <Check size={16} />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white mb-1">What Gets Indexed</div>
                              <ul className="text-[10px] text-gray-400 space-y-1 leading-relaxed">
                                <li>• Content longer than 50 characters</li>
                                <li>• Canvas notes and diagrams</li>
                                <li>• Project files and documentation</li>
                                <li>• Calendar events with descriptions</li>
                                <li>• Zenith documents and writing</li>
                              </ul>
                            </div>
                          </div>

                          <div className="h-px bg-white/5"></div>

                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-gray-500/10 text-gray-400 flex-shrink-0">
                              <X size={16} />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white mb-1">What Gets Skipped</div>
                              <ul className="text-[10px] text-gray-400 space-y-1 leading-relaxed">
                                <li>• Simple questions ("what is...", "how do I...")</li>
                                <li>• Short messages under 50 characters</li>
                                <li>• Greetings and acknowledgments</li>
                                <li>• Commands and quick queries</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </Section>
                    </div>
                  )}

                  {activeTab === 'interface' && (
                    <div className="space-y-8">
                      <Section 
                        title="Typography" 
                        icon={Type} 
                        theme={localTheme}
                        description="Customize text appearance across the application"
                      >
                        <InputGroup 
                          label={`Font Size: ${form.fontSize || 14}px`} 
                          desc="Adjust text size for better readability across all modules."
                          icon={Eye}
                          theme={localTheme}
                        >
                          <div className="space-y-4">
                            <div className="flex items-center gap-6 pt-2">
                              <span className="text-xs text-gray-500 font-bold">Aa</span>
                              <input 
                                type="range" 
                                min="12" 
                                max="20" 
                                step="1" 
                                value={form.fontSize || 14} 
                                onChange={(e) => handleFormChange({ fontSize: parseInt(e.target.value) })} 
                                className="flex-1 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider-thumb" 
                              />
                              <span className="text-lg text-white font-bold">Aa</span>
                            </div>
                            <div className="p-4 bg-black/30 rounded-lg border border-white/10">
                              <p className="text-gray-400" style={{ fontSize: `${form.fontSize || 14}px` }}>
                                This is a preview of how your text will appear at {form.fontSize || 14}px.
                              </p>
                            </div>
                          </div>
                        </InputGroup>
                      </Section>

                      <Section 
                        title="Chat Display" 
                        icon={MessageSquare} 
                        theme={localTheme}
                        description="Control the appearance and spacing of chat messages"
                      >
                        <InputGroup 
                          label="Message Density" 
                          desc="Control spacing between chat messages for optimal reading comfort."
                          icon={Sliders}
                          theme={localTheme}
                        >
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { value: 'compact', label: 'Compact', desc: 'Dense view' },
                              { value: 'comfortable', label: 'Comfortable', desc: 'Balanced' },
                              { value: 'spacious', label: 'Spacious', desc: 'Airy view' }
                            ].map(({ value, label, desc }) => (
                              <button
                                key={value}
                                onClick={() => handleFormChange({ chatDensity: value })}
                                className={`p-4 rounded-xl border text-center transition-all ${
                                  form.chatDensity === value
                                    ? `${localTheme.softBg} ${localTheme.softBorder} ${localTheme.accent} border-2 shadow-lg`
                                    : 'bg-[#0A0A0A] border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/5'
                                }`}
                              >
                                <div className="text-xs font-bold mb-1">{label}</div>
                                <div className="text-[10px] text-gray-600">{desc}</div>
                              </button>
                            ))}
                          </div>
                        </InputGroup>
                      </Section>
                    </div>
                  )}

                  {activeTab === 'data' && (
                    <div className="space-y-8">
                      <Section 
                        title="Storage Management" 
                        icon={HardDrive} 
                        theme={localTheme}
                        description="Perform targeted cleanup without affecting other data"
                      >
                        <InputGroup 
                          label="Delete Specific Data" 
                          desc="Remove individual data types while preserving others."
                        >
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                              { type: 'chats', icon: MessageSquare, label: 'Chats', desc: 'Sessions only' },
                              { type: 'cache', icon: HardDrive, label: 'Cache', desc: 'Web research' },
                              { type: 'calendar', icon: Calendar, label: 'Calendar', desc: 'Events only' },
                              { type: 'synapse', icon: Brain, label: 'Context Index', desc: 'Synapse data' }
                            ].map(({ type, icon: Icon, label, desc }) => (
                              <motion.button 
                                key={type}
                                onClick={() => handleReset(type)}
                                whileHover={{ scale: 1.03, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex flex-col items-center justify-center gap-2 p-6 bg-[#0A0A0A] border border-white/10 rounded-xl text-xs text-gray-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all group"
                              >
                                <Icon size={24} className="group-hover:scale-110 transition-transform" />
                                <span className="font-bold">{label}</span>
                                <span className="text-[10px] text-gray-600">{desc}</span>
                              </motion.button>
                            ))}
                          </div>
                        </InputGroup>
                      </Section>
                      
                      <Section 
                        title="Danger Zone" 
                        icon={Shield} 
                        theme={localTheme}
                        description="Irreversible actions that will permanently delete data"
                      >
                        <div className="p-6 border-2 border-red-500/30 bg-red-500/5 rounded-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/20 to-transparent blur-2xl"></div>
                          <div className="relative z-10">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="p-3 rounded-xl bg-red-500/10 text-red-400">
                                <AlertTriangle size={24} />
                              </div>
                              <div>
                                <h4 className="text-red-400 font-bold text-sm mb-1.5">Factory Reset</h4>
                                <p className="text-red-400/70 text-xs leading-relaxed">Permanently delete all data including chats, projects, cache, calendar, context index, and settings. This action is irreversible.</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleReset('factory')} 
                              className="w-full px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border-2 border-red-500/30 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                              <Trash2 size={16} />
                              Reset System
                            </button>
                          </div>
                        </div>
                      </Section>
                    </div>
                  )}

                  {activeTab === 'about' && (
                    <div className="space-y-8">
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/5 mb-8 relative overflow-hidden"
                      >
                        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${localTheme.gradient} opacity-10 blur-3xl`}></div>
                        <motion.div 
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                          className={`p-4 rounded-2xl bg-gradient-to-br ${localTheme.gradient} shadow-2xl ${localTheme.glow} mb-4 relative z-10`}
                        >
                          <Brain size={40} className="text-white" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">Brainless</h3>
                        <p className="text-sm text-gray-500 font-mono mt-1">{form.developerMode ? 'Forge' : 'Nexus'} Build</p>
                        <p className="text-xs text-gray-600 mt-3 max-w-md leading-relaxed">
                          A powerful AI-native workspace combining research, development, and productivity tools in one unified experience.
                        </p>
                      </motion.div>

                      <Section 
                        title="Software Update" 
                        icon={RefreshCw} 
                        theme={localTheme}
                        description="Keep Brainless up to date with the latest features and improvements"
                      >
                        <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/10 relative overflow-hidden">
                          {updateStatus === 'downloading' && (
                            <div 
                              className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${localTheme.gradient} transition-all duration-300`} 
                              style={{ width: `${downloadProgress}%` }}
                            ></div>
                          )}

                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <div className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                                Update Status
                                {updateStatus === 'downloading' && (
                                  <span className="text-[10px] text-blue-400 font-mono">({downloadProgress}%)</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {updateMessage || "Check for the latest version."}
                              </div>
                            </div>
                            
                            {updateStatus === 'available' && (
                              <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30 font-bold animate-pulse"
                              >
                                New Version
                              </motion.span>
                            )}
                          </div>

                          <div className="flex gap-3">
                            {updateStatus !== 'downloading' && updateStatus !== 'downloaded' && (
                              <button 
                                onClick={checkForUpdates}
                                disabled={updateStatus === 'checking'}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                  updateStatus === 'checking' 
                                    ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                                }`}
                              >
                                {updateStatus === 'checking' ? (
                                  <>
                                    <Loader2 size={12} className="animate-spin" />
                                    Checking...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw size={12} />
                                    Check for Updates
                                  </>
                                )}
                              </button>
                            )}

                            {updateStatus === 'available' && (
                              <button 
                                onClick={startDownload}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r ${localTheme.gradient} shadow-lg hover:brightness-110 active:scale-95 transition-all`}
                              >
                                <Download size={14} /> Download Update
                              </button>
                            )}

                            {updateStatus === 'downloading' && (
                              <button 
                                disabled 
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 bg-white/5 border border-white/5 cursor-not-allowed"
                              >
                                <Loader2 size={14} className="animate-spin text-blue-400" /> Downloading...
                              </button>
                            )}

                            {updateStatus === 'downloaded' && (
                              <button 
                                onClick={installUpdate}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-green-600 hover:bg-green-500 shadow-lg animate-pulse"
                              >
                                <CheckCircle size={14} /> Restart & Install
                              </button>
                            )}
                          </div>
                        </div>
                      </Section>

                      <Section 
                        title="Community & Support" 
                        icon={Github} 
                        theme={localTheme}
                        description="Get help, report issues, and explore documentation"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { 
                              url: `${REPO_URL}#readme`, 
                              icon: FileText, 
                              label: 'Documentation', 
                              desc: 'Read the manual',
                              color: 'indigo'
                            },
                            { 
                              url: `${REPO_URL}/issues`, 
                              icon: Bug, 
                              label: 'Report Issue', 
                              desc: 'Found a bug?',
                              color: 'orange'
                            }
                          ].map(({ url, icon: Icon, label, desc, color }) => (
                            <motion.button 
                              key={label}
                              onClick={() => openLink(url)}
                              whileHover={{ scale: 1.03, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex items-center gap-3 p-4 rounded-xl bg-[#0A0A0A] border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all text-left group"
                            >
                              <div className={`p-2.5 rounded-lg bg-${color}-500/10 text-${color}-400`}>
                                <Icon size={20}/>
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                  {label}
                                  <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="text-[10px] text-gray-500">{desc}</div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </Section>

                      <div className="text-center pt-8 border-t border-white/5">
                        <p className="text-xs text-gray-600">
                          Designed & Engineered by <span className={`${localTheme.accent} font-bold`}>Bryan Bernardo Parreira</span>
                        </p>
                        <p className="text-[10px] text-gray-700 mt-1">Powered by Ollama • Local & Private</p>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 bg-[#020202]/80 backdrop-blur-sm flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="text-[10px] text-gray-600 font-mono">Brainless v3.0</div>
              {hasChanges && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                >
                  <Clock size={10} className="text-yellow-400" />
                  <span className="text-[9px] font-bold text-yellow-400 uppercase">Unsaved Changes</span>
                </motion.div>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleClose} 
                className="px-6 py-2.5 text-gray-400 hover:text-white text-xs font-medium transition-colors rounded-xl hover:bg-white/5"
              >
                {hasChanges ? 'Discard' : 'Close'}
              </button>
              <motion.button 
                onClick={handleSave} 
                disabled={!hasChanges || saveStatus === 'saving'}
                whileHover={hasChanges ? { scale: 1.02 } : {}}
                whileTap={hasChanges ? { scale: 0.98 } : {}}
                className={`px-8 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
                  hasChanges && saveStatus !== 'saving'
                    ? `bg-gradient-to-r ${localTheme.gradient} hover:brightness-110` 
                    : 'bg-gray-700 opacity-50 cursor-not-allowed'
                }`}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <CheckCheck size={14} />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save Changes
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>

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