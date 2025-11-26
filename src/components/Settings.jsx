import React, { useState, useEffect } from 'react';
import { useLumina } from '../context/LuminaContext';
import { X, Save, Server, Cpu, Brain, Sliders, Monitor, Type, Database, Trash2, Download, RefreshCw } from 'lucide-react';

export const Settings = ({ isOpen, onClose }) => {
  const { settings, updateSettings, availableModels, refreshModels } = useLumina();
  const [form, setForm] = useState(settings);
  const [activeTab, setActiveTab] = useState('ai');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);

  const handleSave = () => {
    updateSettings(form);
    onClose();
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshModels();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (!isOpen) return null;

  return (
    // FIX: Changed 'absolute' to 'fixed' and added 'z-[100]' to float above everything
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-8 animate-fade-in">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-4xl h-[650px] shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#0F0F0F]">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Command Center</h2>
            <p className="text-xs text-gray-500 mt-1">System Configuration & Preferences</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar */}
          <div className="w-64 border-r border-white/5 bg-[#050505] p-4 space-y-1">
             <NavButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={Brain} label="Neural Engine" desc="Models, Context, URL" />
             <NavButton active={activeTab === 'interface'} onClick={() => setActiveTab('interface')} icon={Monitor} label="Interface" desc="Font, Density, Theme" />
             <NavButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={Database} label="Data & Privacy" desc="Clear Cache, Reset" />
          </div>

          {/* Content */}
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[#030303]">
            
            {activeTab === 'ai' && (
              <div className="space-y-8">
                <Section title="Ollama Connection" icon={Server}>
                  <InputGroup label="API Endpoint" desc="Address of the Ollama instance. Use 127.0.0.1 for local.">
                    <input 
                      value={form.ollamaUrl} 
                      onChange={e => setForm({...form, ollamaUrl: e.target.value})} 
                      className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" 
                    />
                  </InputGroup>
                </Section>

                <Section title="Model Parameters" icon={Cpu}>
                  <InputGroup label="Preferred Model" desc="Select the default LLM for new chats.">
                    <div className="flex gap-2">
                        <select 
                            value={form.defaultModel} 
                            onChange={e => setForm({...form, defaultModel: e.target.value})} 
                            className="flex-1 bg-[#111] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-indigo-500 outline-none appearance-none"
                        >
                            {availableModels.length > 0 ? availableModels.map(m => <option key={m} value={m}>{m}</option>) : <option>No models detected</option>}
                        </select>
                        <button onClick={handleRefresh} className="bg-white/5 border border-white/10 rounded-lg px-3 hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Refresh Models">
                            <RefreshCw size={16} className={isRefreshing ? "animate-spin text-indigo-500" : ""} />
                        </button>
                    </div>
                  </InputGroup>

                  <InputGroup label="Context Window" desc="Larger context uses more RAM but remembers more files.">
                    <div className="grid grid-cols-4 gap-2">
                        {[4096, 8192, 16384, 32768].map(size => (
                            <button 
                                key={size}
                                onClick={() => setForm({...form, contextLength: size})}
                                className={`py-2 rounded-lg text-xs font-medium border ${form.contextLength === size ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#111] border-white/10 text-gray-400 hover:bg-white/5'}`}
                            >
                                {size / 1024}k
                            </button>
                        ))}
                    </div>
                  </InputGroup>

                  <InputGroup label={`Creativity (Temperature): ${form.temperature}`} desc="Lower values are more precise for coding. Higher values are more creative.">
                    <input 
                        type="range" min="0" max="1" step="0.1" 
                        value={form.temperature} 
                        onChange={e => setForm({...form, temperature: parseFloat(e.target.value)})} 
                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                        <span>Precise (0.0)</span>
                        <span>Balanced (0.5)</span>
                        <span>Creative (1.0)</span>
                    </div>
                  </InputGroup>
                </Section>

                <Section title="System Persona" icon={Sliders}>
                   <InputGroup label="Global Instructions" desc="These rules apply to ALL chats (unless overridden by a Project).">
                      <textarea 
                        value={form.systemPrompt} 
                        onChange={e => setForm({...form, systemPrompt: e.target.value})} 
                        className="w-full h-32 bg-[#111] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-indigo-500 outline-none resize-none leading-relaxed" 
                        placeholder="e.g. You are a helpful assistant. Always answer in Spanish..." 
                      />
                   </InputGroup>
                </Section>
              </div>
            )}

            {activeTab === 'interface' && (
              <div className="space-y-8">
                <Section title="Typography" icon={Type}>
                   <InputGroup label={`Chat Font Size: ${form.fontSize || 14}px`} desc="Adjust the reading size of the chat interface.">
                      <input 
                        type="range" min="12" max="20" step="1" 
                        value={form.fontSize || 14} 
                        onChange={e => setForm({...form, fontSize: parseInt(e.target.value)})} 
                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                    />
                   </InputGroup>
                </Section>
                <Section title="Layout" icon={Monitor}>
                   <InputGroup label="Chat Density" desc="Choose how compact the message bubbles appear.">
                        <div className="flex gap-2">
                            {['Comfortable', 'Compact'].map(mode => (
                                <button 
                                    key={mode}
                                    onClick={() => setForm({...form, chatDensity: mode.toLowerCase()})}
                                    className={`flex-1 py-3 rounded-lg text-xs font-medium border ${form.chatDensity === mode.toLowerCase() ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-[#111] border-white/10 text-gray-400 hover:bg-white/5'}`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                   </InputGroup>
                </Section>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-8">
                <Section title="Storage & Privacy" icon={Database}>
                   <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-lg flex items-center justify-between">
                      <div>
                          <h4 className="text-red-400 font-bold text-sm">Factory Reset</h4>
                          <p className="text-red-400/60 text-xs">Deletes all chats, projects, and settings. Cannot be undone.</p>
                      </div>
                      <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold transition-colors">
                          Reset Lumina
                      </button>
                   </div>
                </Section>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 bg-[#0F0F0F] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-xs font-medium transition-colors">Cancel</button>
          <button onClick={handleSave} className="bg-white text-black px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-lg shadow-white/5">
            <Save size={16} /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---
const NavButton = ({ active, onClick, icon: Icon, label, desc }) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
    >
        <div className={`p-2 rounded-md ${active ? 'bg-indigo-500' : 'bg-black/20'}`}><Icon size={18} /></div>
        <div>
            <div className="text-xs font-bold">{label}</div>
            <div className={`text-[10px] ${active ? 'text-indigo-200' : 'text-gray-600'}`}>{desc}</div>
        </div>
    </button>
);

const Section = ({ title, icon: Icon, children }) => (
    <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-white/5">
            <Icon size={16} className="text-indigo-500"/> {title}
        </div>
        <div className="space-y-5">{children}</div>
    </div>
);

const InputGroup = ({ label, desc, children }) => (
    <div>
        <div className="flex justify-between items-baseline mb-2">
            <label className="block text-xs font-semibold text-gray-300">{label}</label>
        </div>
        {children}
        {desc && <p className="text-[10px] text-gray-600 mt-2 leading-relaxed">{desc}</p>}
    </div>
);