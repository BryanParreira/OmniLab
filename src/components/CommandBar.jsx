import React, { useState, useRef, useEffect } from 'react';
import { useLumina } from '../context/LuminaContext';
import { Command, FolderOpen, ChevronDown, Check, Upload, Globe, Plus, GitBranch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dropdown = ({ label, icon: Icon, value, options, onSelect, activeId }) => {
  const [isOpen, setIsOpen] = useState(false); const ref = useRef(null);
  useEffect(() => { const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);
  
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setIsOpen(!isOpen)} className="group flex items-center gap-2 rounded-lg hover:bg-white/5 px-2 py-1.5 text-xs text-gray-400 hover:text-white transition-all">
        {Icon && <Icon size={12} className="text-gray-500 group-hover:text-indigo-400 transition-colors" />}
        <span className="font-medium max-w-[120px] truncate">{value}</span>
        <ChevronDown size={10} className={`opacity-50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="absolute top-full left-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl p-1 shadow-2xl z-50 ring-1 ring-black/50">
            <div className="text-[9px] uppercase text-gray-500 font-bold px-2 py-2 tracking-widest">{label}</div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5">
              {options.map((opt) => (
                <button key={opt.id} onClick={() => { onSelect(opt); setIsOpen(false); }} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors group">
                  <span className="truncate">{opt.name}</span>
                  {activeId === opt.id && <Check size={12} className="text-indigo-400" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const CommandBar = () => {
  const { isOllamaRunning, currentModel, setCurrentModel, availableModels, projects, activeProject, setActiveProject, addFiles, addFolder, addUrl, gitStatus } = useLumina();
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState("");
  const modelOptions = availableModels.map(m => ({ id: m, name: m }));
  const projectOptions = [{ id: 'none', name: 'General Chat' }, ...projects.map(p => ({ id: p.id, name: p.name }))];
  const handleUrlSubmit = () => { if(url.trim()) { addUrl(url); setUrl(""); setShowUrlInput(false); } };

  return (
    <div className="h-14 rounded-2xl glass-panel flex items-center justify-between px-4 z-20 mb-1 shrink-0">
      <div className="flex items-center gap-2">
        <Dropdown label="AI Model" icon={Command} value={currentModel} activeId={currentModel} options={modelOptions.length > 0 ? modelOptions : [{id:'loading',name:'Loading...'}]} onSelect={(opt) => setCurrentModel(opt.id)} />
        <div className="h-4 w-px bg-white/5 mx-1"></div>
        <Dropdown label="Context" icon={FolderOpen} value={activeProject ? activeProject.name : "General Chat"} activeId={activeProject?.id || 'none'} options={projectOptions} onSelect={(opt) => setActiveProject(opt.id === 'none' ? null : projects.find(p => p.id === opt.id))} />
        
        {activeProject && (
          <div className="flex items-center gap-1 ml-2 animate-fade-in">
             <button onClick={addFiles} className="glass-button text-[10px] font-medium text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-all"><Upload size={10} className="inline mr-1.5" /> Files</button>
             <div className="relative">
                <button onClick={() => setShowUrlInput(!showUrlInput)} className="glass-button text-[10px] font-medium text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-all"><Globe size={10} className="inline mr-1.5" /> Link</button>
                {showUrlInput && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-[#0F0F0F] border border-white/10 rounded-xl p-2 shadow-2xl z-50 flex gap-2 animate-fade-in">
                    <input autoFocus value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none" />
                    <button onClick={handleUrlSubmit} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 text-xs font-bold transition-colors"><Plus size={14} /></button>
                  </div>
                )}
             </div>
          </div>
        )}

        {gitStatus && (
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 ml-2 animate-fade-in">
              <GitBranch size={12} className="text-orange-400" />
              <span className="text-[10px] font-mono text-orange-100">{gitStatus.current}</span>
           </div>
        )}
      </div>
      
      <div className="flex items-center">
        {isOllamaRunning ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[9px] font-bold text-emerald-500 tracking-wider">ONLINE</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/5 border border-red-500/10">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <span className="text-[9px] font-bold text-red-500 tracking-wider">OFFLINE</span>
          </div>
        )}
      </div>
    </div>
  );
};