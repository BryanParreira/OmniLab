import React, { useState, useRef, useEffect } from 'react';
import { useLumina } from '../context/LuminaContext';
import { Command, FolderOpen, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dropdown = ({ label, icon: Icon, value, options, onSelect, activeId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => { 
    const handleClickOutside = (event) => { 
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false); 
    }; 
    document.addEventListener("mousedown", handleClickOutside); 
    return () => document.removeEventListener("mousedown", handleClickOutside); 
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-all border border-white/5 hover:border-white/10"
      >
        {Icon && <Icon size={12} className="text-gray-400" />}
        <span className="font-medium max-w-[150px] truncate">{value}</span>
        <ChevronDown size={10} className={`opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }} 
            className="absolute top-full left-0 mt-2 w-56 overflow-hidden rounded-lg border border-white/10 bg-[#111] p-1 shadow-2xl z-50 backdrop-blur-xl"
          >
            <div className="text-[10px] uppercase text-gray-500 font-semibold px-2 py-1.5">{label}</div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {options.map((opt) => (
                <button 
                  key={opt.id} 
                  onClick={() => { onSelect(opt); setIsOpen(false); }} 
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs text-gray-300 hover:bg-indigo-600 hover:text-white transition-colors group"
                >
                  <span className="truncate">{opt.name}</span>
                  {activeId === opt.id && <Check size={12} className="text-indigo-400 group-hover:text-white" />}
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
  const { isOllamaRunning, currentModel, setCurrentModel, availableModels, projects, activeProject, setActiveProject } = useLumina();

  const modelOptions = availableModels.map(m => ({ id: m, name: m }));
  const projectOptions = [{ id: 'none', name: 'General Chat (No Context)' }, ...projects.map(p => ({ id: p.id, name: p.name }))];

  return (
    <div className="h-14 border-b border-white/5 bg-[#030304]/80 backdrop-blur-md flex items-center justify-between px-6 z-20 sticky top-0">
      
      {/* Context Controls */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold tracking-tight text-white mr-2">Lumina</span>
        
        <div className="h-4 w-[1px] bg-white/10 rotate-12"></div>
        
        <Dropdown 
          label="AI Model" 
          icon={Command} 
          value={currentModel} 
          activeId={currentModel} 
          options={modelOptions.length > 0 ? modelOptions : [{id:'loading',name:'Loading...'}]} 
          onSelect={(opt) => setCurrentModel(opt.id)} 
        />
        
        <div className="h-4 w-[1px] bg-white/10 rotate-12"></div>
        
        <Dropdown 
          label="Context" 
          icon={FolderOpen} 
          value={activeProject ? activeProject.name : "General Chat"} 
          activeId={activeProject?.id || 'none'} 
          options={projectOptions} 
          onSelect={(opt) => setActiveProject(opt.id === 'none' ? null : projects.find(p => p.id === opt.id))} 
        />
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-3">
        {isOllamaRunning ? (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-500">ONLINE</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <span className="text-[10px] font-medium text-red-500">OFFLINE</span>
          </div>
        )}
      </div>
    </div>
  );
};