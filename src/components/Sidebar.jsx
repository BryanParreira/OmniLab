import React, { useState } from 'react';
import { useLumina } from '../context/LuminaContext';
import { Plus, MessageSquare, Trash2, Box, Folder, Settings as SettingsIcon, Sliders, Edit2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Sidebar = () => {
  const { 
    sessions, sessionId, loadSession, startNewChat, deleteSession, renameChat, openGlobalSettings,
    projects, activeProject, setActiveProject, createProject, deleteProject, updateProjectSettings,
    setCurrentView // Used to switch pages
  } = useLumina();

  const [activeTab, setActiveTab] = useState('chats');
  const [isCreatingProj, setIsCreatingProj] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [editingProject, setEditingProject] = useState(null);
  const [tempSystemPrompt, setTempSystemPrompt] = useState("");
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const handleCreateProject = () => { if(!newProjName.trim()) return; createProject(newProjName); setNewProjName(""); setIsCreatingProj(false); };
  const openSettings = (e, project) => { e.stopPropagation(); setEditingProject(project); setTempSystemPrompt(project.systemPrompt || ""); };
  const saveSettings = async () => { await updateProjectSettings(tempSystemPrompt); setEditingProject(null); };
  const startRenaming = (e, session) => { e.stopPropagation(); setEditingSessionId(session.id); setRenameValue(session.title || ""); };
  const submitRename = async (e) => { e.stopPropagation(); if (renameValue.trim()) await renameChat(editingSessionId, renameValue); setEditingSessionId(null); };

  // NAVIGATION HANDLERS
  const handleProjectClick = (proj) => {
    setActiveProject(proj);
    setCurrentView('project-dashboard'); // Switch to Dashboard
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'projects') setCurrentView('project-dashboard');
    if (tab === 'chats') setCurrentView('chat');
  };

  return (
    <div className="flex flex-col h-full rounded-2xl glass-panel overflow-hidden">
      <div className="p-4 pb-2">
        <div className="flex items-center gap-3 mb-5 px-2 pt-2">
          <div className="h-6 w-6 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-md flex items-center justify-center shadow-lg"><Box size={14} className="text-white" /></div>
          <span className="font-semibold text-sm tracking-wide text-white/90">Lumina</span>
        </div>

        <div className="flex p-1 bg-black/40 rounded-lg border border-white/5 mb-4">
          <button onClick={() => switchTab('chats')} className={`flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all ${activeTab === 'chats' ? 'bg-[#1a1a1a] text-white shadow-sm border border-white/10' : 'text-gray-500 hover:text-gray-300'}`}>Chats</button>
          <button onClick={() => switchTab('projects')} className={`flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all ${activeTab === 'projects' ? 'bg-[#1a1a1a] text-white shadow-sm border border-white/10' : 'text-gray-500 hover:text-gray-300'}`}>Projects</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-2">
        {activeTab === 'chats' ? (
          <>
            <button onClick={startNewChat} className="flex w-full items-center gap-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-3 py-2 text-xs font-medium transition-all mb-3"><Plus size={12} /> <span className="text-[10px]">New Chat</span></button>
            <div className="space-y-0.5">
              {sessions.map(session => (
                <div key={session.id} onClick={() => loadSession(session.id)} className={`group relative flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-all border border-transparent ${sessionId === session.id ? 'bg-white/10 text-white border-white/5' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}>
                  <div className="flex items-center gap-2 truncate flex-1"><MessageSquare size={12} className={sessionId === session.id ? 'text-indigo-400' : 'text-gray-600'} />
                    {editingSessionId === session.id ? ( <div className="flex items-center gap-1 flex-1"><input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitRename(e)} onClick={(e) => e.stopPropagation()} className="w-full bg-black/50 border border-indigo-500 rounded px-1 text-[10px] text-white focus:outline-none" /><button onClick={submitRename} className="text-green-500 hover:text-green-400"><Check size={10}/></button></div> ) : <span className="truncate w-32 text-[11px]">{session.title || "Untitled"}</span>}
                  </div>
                  {editingSessionId !== session.id && (<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={(e) => startRenaming(e, session)} className="hover:text-white p-1"><Edit2 size={10} /></button><button onClick={(e) => deleteSession(e, session.id)} className="hover:text-red-400 p-1"><Trash2 size={10} /></button></div>)}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {!isCreatingProj ? (
              <button onClick={() => setIsCreatingProj(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 text-gray-500 px-3 py-2 text-[10px] hover:border-white/20 hover:text-white transition-all mb-3"><Plus size={12} /> Add Project</button>
            ) : (
              <div className="mb-3 p-2 bg-[#111] rounded-lg border border-white/10">
                <input autoFocus value={newProjName} onChange={(e) => setNewProjName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()} placeholder="Project Name..." className="w-full bg-transparent text-white text-[11px] outline-none mb-2" />
                <div className="flex gap-2 justify-end"><button onClick={() => setIsCreatingProj(false)} className="text-[9px] text-gray-500 hover:text-white">Cancel</button><button onClick={handleCreateProject} className="text-[9px] bg-indigo-600 px-2 py-0.5 rounded text-white">Create</button></div>
              </div>
            )}
            <div className="space-y-2">
              {projects.map(proj => (
                <div key={proj.id} onClick={() => handleProjectClick(proj)} className={`group rounded-lg border p-2.5 cursor-pointer transition-all ${activeProject?.id === proj.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                  <div className="flex justify-between items-center mb-1"><div className="flex items-center gap-2 text-white font-medium"><Folder size={12} className={activeProject?.id === proj.id ? "text-indigo-400" : "text-gray-500"} /><span className="text-[11px]">{proj.name}</span></div><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={(e) => openSettings(e, proj)} className="text-gray-500 hover:text-white"><Sliders size={10} /></button><button onClick={(e) => deleteProject(e, proj.id)} className="text-gray-500 hover:text-red-400"><Trash2 size={10} /></button></div></div>
                  <div className="flex items-center gap-1.5"><div className="text-[9px] text-gray-600 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">{proj.files.length} files</div></div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-3 border-t border-white/5 bg-black/20"><button onClick={openGlobalSettings} className="flex w-full items-center gap-2 text-gray-500 hover:text-white transition-colors text-[11px] font-medium px-2 py-1.5 rounded-lg hover:bg-white/5"><SettingsIcon size={12} /> Settings</button></div>
      <AnimatePresence>
          {editingProject && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#0F0F0F] border border-white/10 rounded-xl w-full p-4 shadow-2xl">
                <div className="flex justify-between items-center mb-4"><h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2"><Sliders size={12} className="text-indigo-500"/> Persona</h3><button onClick={() => setEditingProject(null)} className="text-gray-500 hover:text-white"><X size={14} /></button></div>
                <textarea value={tempSystemPrompt} onChange={(e) => setTempSystemPrompt(e.target.value)} className="w-full h-40 bg-black border border-white/10 rounded-lg p-3 text-xs text-white resize-none mb-4 focus:border-indigo-500 outline-none" placeholder="System instructions..." />
                <button onClick={saveSettings} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-xs font-bold">Save</button>
              </div>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};