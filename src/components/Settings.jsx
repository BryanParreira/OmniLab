import React, { useState } from 'react';
import { useLumina } from '../context/LuminaContext';
import { X, Save, Server, Cpu, Database, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Settings = ({ isOpen, onClose }) => {
  const { settings, updateSettings, availableModels } = useLumina();
  const [form, setForm] = useState(settings);
  const [activeTab, setActiveTab] = useState('ai'); // ai | general

  // Sync form when settings load
  React.useEffect(() => { setForm(settings); }, [settings]);

  const handleSave = () => {
    updateSettings(form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-8 animate-fade-in">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl w-full max-w-2xl h-[600px] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white tracking-tight">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-white/10 bg-[#050505] p-4 space-y-2">
             <button onClick={() => setActiveTab('ai')} className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-all ${activeTab === 'ai' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
               <Brain size={16} /> AI Engine
             </button>
             <button onClick={() => setActiveTab('general')} className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-all ${activeTab === 'general' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
               <Server size={16} /> General
             </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            
            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Ollama Connection URL</label>
                  <div className="flex gap-2">
                    <input 
                      value={form.ollamaUrl} 
                      onChange={e => setForm({...form, ollamaUrl: e.target.value})}
                      className="flex-1 bg-black border border-white/10 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none" 
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Default: http://127.0.0.1:11434. Change this if using a remote server.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Context Window (Tokens)</label>
                  <select 
                    value={form.contextLength} 
                    onChange={e => setForm({...form, contextLength: parseInt(e.target.value)})}
                    className="w-full bg-black border border-white/10 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none"
                  >
                    <option value="2048">2,048 (Fastest)</option>
                    <option value="4096">4,096 (Default)</option>
                    <option value="8192">8,192 (Large)</option>
                    <option value="16384">16,384 (Huge)</option>
                    <option value="32768">32,768 (Maximum)</option>
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1">Higher context allows larger file analysis but uses more RAM.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Creativity (Temperature): {form.temperature}</label>
                  <input 
                    type="range" min="0" max="1" step="0.1"
                    value={form.temperature} 
                    onChange={e => setForm({...form, temperature: parseFloat(e.target.value)})}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>Precise (0.0)</span>
                    <span>Creative (1.0)</span>
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Preferred Model</label>
                   <select 
                    value={form.defaultModel} 
                    onChange={e => setForm({...form, defaultModel: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none"
                  >
                    {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2">System Persona (Global Default)</label>
                  <textarea 
                    value={form.systemPrompt} 
                    onChange={e => setForm({...form, systemPrompt: e.target.value})}
                    className="w-full h-32 bg-black border border-white/10 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none resize-none"
                    placeholder="e.g. You are a helpful assistant..."
                  />
                  <p className="text-[10px] text-gray-500 mt-1">This instruction is applied to all new chats unless a Project overrides it.</p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#050505] flex justify-end">
          <button onClick={handleSave} className="bg-white text-black px-6 py-2 rounded text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2">
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};