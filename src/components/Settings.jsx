import React, { useState, useEffect } from 'react';
import { useLumina } from '../context/LuminaContext';
import { X, Save, Server, Brain } from 'lucide-react';

export const Settings = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useLumina();
  const [form, setForm] = useState(settings);
  const [activeTab, setActiveTab] = useState('ai');

  useEffect(() => { setForm(settings); }, [settings]);
  const handleSave = () => { updateSettings(form); onClose(); };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-8 animate-fade-in">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-xl w-full max-w-2xl h-[600px] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5"><h2 className="text-xl font-bold text-white tracking-tight">Settings</h2><button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button></div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-48 border-r border-white/10 bg-[#050505] p-4 space-y-2">
             <button onClick={() => setActiveTab('ai')} className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-all ${activeTab === 'ai' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}><Brain size={16} /> AI Engine</button>
             <button onClick={() => setActiveTab('general')} className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-all ${activeTab === 'general' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}><Server size={16} /> General</button>
          </div>
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div><label className="block text-xs font-bold uppercase text-gray-500 mb-2">Ollama URL</label><input value={form.ollamaUrl} onChange={e => setForm({...form, ollamaUrl: e.target.value})} className="w-full bg-black border border-white/10 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none" /></div>
                <div><label className="block text-xs font-bold uppercase text-gray-500 mb-2">Context Window</label><select value={form.contextLength} onChange={e => setForm({...form, contextLength: parseInt(e.target.value)})} className="w-full bg-black border border-white/10 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none"><option value="4096">4,096</option><option value="8192">8,192</option><option value="16384">16,384</option><option value="32768">32,768</option></select></div>
                <div><label className="block text-xs font-bold uppercase text-gray-500 mb-2">Temperature: {form.temperature}</label><input type="range" min="0" max="1" step="0.1" value={form.temperature} onChange={e => setForm({...form, temperature: parseFloat(e.target.value)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" /></div>
              </div>
            )}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div><label className="block text-xs font-bold uppercase text-gray-500 mb-2">Global Persona</label><textarea value={form.systemPrompt} onChange={e => setForm({...form, systemPrompt: e.target.value})} className="w-full h-32 bg-black border border-white/10 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none resize-none" placeholder="System instructions..." /></div>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-white/10 bg-[#050505] flex justify-end"><button onClick={handleSave} className="bg-white text-black px-6 py-2 rounded text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"><Save size={16} /> Save Changes</button></div>
      </div>
    </div>
  );
};