import React from 'react';
import { useLumina } from '../context/LuminaContext';
import { Folder, File, Globe, GitBranch, Plus, Trash2, Upload } from 'lucide-react';

export const ProjectDashboard = () => {
  const { activeProject, gitStatus, addFiles, addFolder, addUrl, deleteProject } = useLumina();

  if (!activeProject) return <div className="flex items-center justify-center h-full text-gray-500">Select a project</div>;

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-8 bg-[#030304]">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
             <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
               <Folder className="text-indigo-500" /> {activeProject.name}
             </h1>
             <p className="text-sm text-gray-500 mt-1 font-mono">{activeProject.rootPath || "Virtual Project"}</p>
          </div>
          <div className="flex gap-3">
             <button onClick={addFiles} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium transition-colors"><Upload size={14}/> Add File</button>
             <button onClick={addFolder} className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-xs font-medium transition-colors"><Folder size={14}/> Add Folder</button>
             <button onClick={addUrl} className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg text-xs font-medium transition-colors"><Globe size={14}/> Add URL</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
           {/* GIT STATUS */}
           <div className="col-span-1 p-6 rounded-2xl bg-[#0A0A0A] border border-white/10">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><GitBranch size={14}/> Git Repository</h3>
              {gitStatus ? (
                 <div className="space-y-4">
                    <div className="flex justify-between items-center"><span className="text-sm text-gray-400">Branch</span><span className="text-sm text-white font-mono">{gitStatus.current}</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm text-gray-400">Modified</span><span className="text-sm text-orange-400">{gitStatus.modified.length}</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm text-gray-400">Staged</span><span className="text-sm text-green-400">{gitStatus.staged.length}</span></div>
                    <div className="w-full h-px bg-white/5 my-2"></div>
                    <div className="text-xs text-gray-600">{gitStatus.clean ? "Working tree clean" : "Uncommitted changes"}</div>
                 </div>
              ) : (
                 <div className="text-center py-8 text-gray-600 text-xs">No Git repository detected in root path.</div>
              )}
           </div>

           {/* FILE MANAGER */}
           <div className="col-span-2 p-6 rounded-2xl bg-[#0A0A0A] border border-white/10">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Context Index ({activeProject.files.length})</h3>
              <div className="h-64 overflow-y-auto custom-scrollbar space-y-1">
                 {activeProject.files.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg group">
                       <div className="flex items-center gap-3 overflow-hidden">
                          {file.type === 'url' ? <Globe size={14} className="text-blue-500" /> : <File size={14} className="text-gray-500" />}
                          <span className="text-sm text-gray-300 truncate">{file.name}</span>
                       </div>
                       <span className="text-[10px] text-gray-600 font-mono px-2">{file.type}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};