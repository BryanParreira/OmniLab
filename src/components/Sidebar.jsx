import React, { useState } from 'react';
import { useLumina } from '../context/LuminaContext';
import { Plus, MessageSquare, Trash2, Box, Folder, Settings as SettingsIcon, X, Save, Sliders, Edit2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from './Settings';

export const Sidebar = () => {
  const { 
    sessions, sessionId, loadSession, startNewChat, deleteSession, renameChat,
    projects, activeProject, setActiveProject, createProject, deleteProject, updateProjectSettings
  } = useLumina();

  const [activeTab, setActiveTab] = useState('chats');
  const [isCreatingProj, setIsCreatingProj] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [editingProject, setEditingProject] = useState(null);
  const [tempSystemPrompt, setTempSystemPrompt] = useState("");
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const handleCreateProject = () => { if(!newProjName.trim()) return; createProject(newProjName); setNewProjName(""); setIsCreatingProj(false); };
  const openSettings = (e, project) => { e.stopPropagation(); setEditingProject(project); setTempSystemPrompt(project.systemPrompt || ""); };
  const saveSettings = async () => { await updateProjectSettings(tempSystemPrompt); setEditingProject(null); };
  const startRenaming = (e, session) => { e.stopPropagation(); setEditingSessionId(session.id); setRenameValue(session.title || ""); };
  const submitRename = async (e) => { e.stopPropagation(); if (renameValue.trim()) await renameChat(editingSessionId, renameValue); setEditingSessionId(null); };

  return (
    <>
      <div className="flex h-full w-[280px] shrink-0 flex-col border-r border-white/5 bg-[#050505] text-sm relative z-20">
        <div className="flex items-center gap-3 p-6 text-white"><div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg"><Box size={18} className="text-white" /></div><span className="font-bold text-lg tracking-tight">Lumina</span></div>
        <div className="px-4 mb-6"><div className="flex p-1 bg-white/5 rounded-lg border border-white/5"><button onClick={() => setActiveTab('chats')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'chats' ? 'bg-[#1a1a1a] text-white' : 'text-gray-500'}`}>Chats</button><button onClick={() => setActiveTab('projects')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'projects' ? 'bg-[#1a1a1a] text-white' : 'text-gray-500'}`}>Projects</button></div></div>

        {activeTab === 'chats' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 mb-2"><button onClick={startNewChat} className="flex w-full items-center gap-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 text-sm font-medium transition-all active:scale-95"><Plus size={16} /> New Chat</button></div>
            <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar space-y-0.5">
              {sessions.map(session => (
                <div key={session.id} onClick={() => loadSession(session.id)} className={`group flex cursor-pointer items-center justify-between rounded-md px-3 py-2.5 text-gray-400 hover:bg-white/5 transition-all ${sessionId === session.id ? 'bg-white/10 text-white' : ''}`}>
                  <div className="flex items-center gap-3 truncate flex-1">
                    <MessageSquare size={14} className={sessionId === session.id ? 'text-indigo-400' : 'text-gray-600'} />
                    {editingSessionId === session.id ? (
                      <div className="flex items-center gap-1 flex-1"><input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitRename(e)} onClick={(e) => e.stopPropagation()} className="w-full bg-black border border-indigo-500 rounded px-1 text-xs text-white focus:outline-none" /><button onClick={submitRename} className="text-green-500 hover:text-green-400"><Check size={12}/></button></div>
                    ) : <span className="truncate w-32 text-xs">{session.title || "Untitled Chat"}</span>}
                  </div>
                  {editingSessionId !== session.id && (<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={(e) => startRenaming(e, session)} className="hover:text-white p-1"><Edit2 size={12} /></button><button onClick={(e) => deleteSession(e, session.id)} className="hover:text-red-400 p-1"><Trash2 size={12} /></button></div>)}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="flex-1 flex flex-col min-h-0 px-4">
            {!isCreatingProj ? (
              <button onClick={() => setIsCreatingProj(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 bg-transparent text-gray-500 px-4 py-2.5 text-xs font-medium hover:border-white/20 hover:text-gray-300 mb-4"><Plus size={14} /> Create Context</button>
            ) : (
              <div className="mb-4 space-y-2 animate-fade-in bg-white/5 p-3 rounded-lg border border-white/10">
                <input autoFocus value={newProjName} onChange={(e) => setNewProjName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()} placeholder="Name..." className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:border-indigo-500 outline-none" />
                <div className="flex gap-2"><button onClick={handleCreateProject} className="flex-1 bg-indigo-600 text-white rounded py-1 text-xs">Create</button><button onClick={() => setIsCreatingProj(false)} className="flex-1 bg-white/5 text-gray-400 hover:text-white rounded py-1 text-xs">Cancel</button></div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {projects.map(proj => (
                <div key={proj.id} onClick={() => setActiveProject(proj)} className={`group relative rounded-lg border p-3 cursor-pointer transition-all ${activeProject?.id === proj.id ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-[#0f0f0f] border-white/5 hover:border-white/10'}`}>
                  <div className="flex justify-between items-start mb-2"><div className="flex items-center gap-2 text-white font-medium"><Folder size={14} className={activeProject?.id === proj.id ? "text-indigo-400" : "text-gray-500"} /><span className="text-xs">{proj.name}</span></div><div className="flex gap-1"><button onClick={(e) => openSettings(e, proj)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity"><Sliders size={12} /></button><button onClick={(e) => deleteProject(e, proj.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity"><Trash2 size={12} /></button></div></div>
                  <div className="flex items-center gap-1.5 mt-2"><div className="text-[10px] text-gray-500 bg-black px-1.5 py-0.5 rounded border border-white/5">{proj.files.length} files</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-white/5 bg-[#050505]"><button onClick={() => setShowGlobalSettings(true)} className="flex w-full items-center gap-3 text-gray-500 hover:text-white transition-colors text-xs font-medium px-2 py-2 rounded-lg hover:bg-white/5"><SettingsIcon size={16} /> Settings</button></div>
        <AnimatePresence>
          {editingProject && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-[#111] border border-white/10 rounded-xl w-full p-4 shadow-2xl">
                <div className="flex justify-between items-center mb-4"><h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2"><Sliders size={12} className="text-indigo-500"/> Project Persona</h3><button onClick={() => setEditingProject(null)} className="text-gray-500 hover:text-white"><X size={14} /></button></div>
                <textarea value={tempSystemPrompt} onChange={(e) => setTempSystemPrompt(e.target.value)} className="w-full h-40 bg-black border border-white/10 rounded-lg p-3 text-xs text-white resize-none mb-4 focus:border-indigo-500 outline-none leading-relaxed" placeholder="e.g. You are a Senior React Developer..." />
                <button onClick={saveSettings} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 text-xs font-bold flex items-center justify-center gap-2 transition-all"><Save size={14} /> Save Persona</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Settings isOpen={showGlobalSettings} onClose={() => setShowGlobalSettings(false)} />
    </>
  );
};