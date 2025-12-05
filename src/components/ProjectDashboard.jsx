import React, { useMemo, useState } from 'react';
import { useLumina } from '../context/LuminaContext';
import { 
  Folder, File, Globe, GitBranch, FolderPlus, Hash, 
  Layout, MoreVertical, Trash, FileCode, Copy, ArrowRight,
  GitCommit, CheckCircle2, Sparkles, BrainCircuit, Tag, ExternalLink
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// --- SUB-COMPONENT: FILE ITEM (With Functional Context Menu) ---
const FileItem = React.memo(({ file, index, theme, onOpen, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  // Close menu when clicking outside
  React.useEffect(() => {
    const close = () => setShowMenu(false);
    if(showMenu) window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [showMenu]);

  const handleAction = (e, action) => {
    e.stopPropagation();
    setShowMenu(false); // Close menu immediately

    switch(action) {
        case 'open':
            if (onOpen) onOpen(file);
            break;
        case 'copy':
            navigator.clipboard.writeText(file.path);
            break;
        case 'delete':
            // Simple confirmation before deleting
            if (window.confirm(`Are you sure you want to remove "${file.name}" from this project?`)) {
                if (onDelete) onDelete(file.path);
            }
            break;
        default:
            break;
    }
  };

  return (
    <div className="relative group">
      <div
        className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/5 cursor-pointer"
        onClick={() => onOpen && onOpen(file)} // Clicking the row opens the file
        onContextMenu={(e) => { e.preventDefault(); setShowMenu(true); }}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              file.type === 'url'
                ? 'bg-blue-500/10 text-blue-400'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            {file.type === 'url' ? <Globe size={14} /> : <File size={14} />}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm text-gray-200 truncate font-medium group-hover:text-white" title={file.name}>
              {file.name}
            </span>
            <span className="text-[10px] text-gray-600 truncate font-mono" title={file.path}>
              {file.path}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <span className="text-[10px] text-gray-600 font-mono bg-black px-2 py-1 rounded border border-white/5 uppercase shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {file.type || "FILE"}
           </span>
           <button 
             onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
             className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
           >
              <MoreVertical size={14} />
           </button>
        </div>
      </div>

      {/* Context Menu Dropdown */}
      <AnimatePresence>
        {showMenu && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-2 top-10 z-50 w-40 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()} 
            >
                <div className="p-1">
                    <button onClick={(e) => handleAction(e, 'open')} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/10 rounded-lg transition-colors">
                        {file.type === 'url' ? <ExternalLink size={12} /> : <FileCode size={12} />} 
                        {file.type === 'url' ? 'Open in Browser' : 'Open File'}
                    </button>
                    <button onClick={(e) => handleAction(e, 'copy')} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/10 rounded-lg transition-colors">
                        <Copy size={12} /> Copy Path
                    </button>
                    <div className="h-px bg-white/10 my-1"></div>
                    <button onClick={(e) => handleAction(e, 'delete')} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash size={12} /> Delete
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

FileItem.displayName = 'FileItem';

// --- SUB-COMPONENT: INTERACTIVE GIT STATUS ---
const GitStatusCard = React.memo(({ gitStatus, theme }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [commitMsg, setCommitMsg] = useState("");
    const [isCommitting, setIsCommitting] = useState(false);

    const handleCommit = () => {
        setIsCommitting(true);
        // Simulate Git commit process
        setTimeout(() => {
            setIsCommitting(false);
            setCommitMsg("");
            setIsExpanded(false);
            alert("Changes committed locally (mock).");
        }, 1000);
    };

    return (
        <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-full h-1 opacity-50`} style={{
            background: 'linear-gradient(to right, transparent, rgb(251, 146, 60), transparent)'
            }}></div>
            
            <div className="flex justify-between items-start mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <GitBranch size={14} className={theme.accentText} /> Repository
                </h3>
                {gitStatus && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 ${theme.accentText} font-mono`}>
                    {gitStatus.current}
                    </span>
                )}
            </div>

            {gitStatus ? (
            <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-[#111] rounded-lg border border-white/5">
                    <span className="text-xs text-gray-400">Modified</span>
                    <span className="text-xs font-mono text-orange-400 font-bold">
                        {gitStatus.modified?.length || 0}
                    </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-[#111] rounded-lg border border-white/5">
                    <span className="text-xs text-gray-400">Staged</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                        {gitStatus.staged?.length || 0}
                    </span>
                </div>
                
                <div className="pt-2">
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${gitStatus.clean ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`} aria-hidden="true"></div>
                            {gitStatus.clean ? "Working tree clean" : "Uncommitted changes"}
                        </div>
                        {!gitStatus.clean && (
                            <button 
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-blue-400 hover:underline cursor-pointer"
                            >
                                {isExpanded ? "Cancel" : "Review"}
                            </button>
                        )}
                    </div>
                </div>

                {/* EXPANDABLE COMMIT INTERFACE */}
                <AnimatePresence>
                    {isExpanded && !gitStatus.clean && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pt-2 border-t border-white/5"
                        >
                            <input 
                                value={commitMsg}
                                onChange={(e) => setCommitMsg(e.target.value)}
                                placeholder="Commit message..."
                                className="w-full bg-[#151515] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-blue-500/50 mb-2"
                            />
                            <button 
                                onClick={handleCommit}
                                disabled={!commitMsg || isCommitting}
                                className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                    commitMsg ? 'bg-blue-500 text-white hover:bg-blue-400' : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {isCommitting ? (
                                    <>Committing...</>
                                ) : (
                                    <><GitCommit size={12}/> Commit Changes</>
                                )}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            ) : (
            <div className="text-center py-8 text-gray-600 text-xs border-2 border-dashed border-white/5 rounded-xl">
                No Git repository detected.
            </div>
            )}
        </div>
    );
});

GitStatusCard.displayName = 'GitStatusCard';

const ContextStatsCard = React.memo(({ activeProject, theme }) => (
  <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 shadow-xl">
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
      <Hash size={14} /> Context Stats
    </h3>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <div className="text-2xl font-bold text-white">{activeProject?.files?.length || 0}</div>
        <div className="text-[10px] text-gray-500 uppercase tracking-wide">Total Files</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-white">
          {activeProject?.files?.filter(f => f.type === 'url')?.length || 0}
        </div>
        <div className="text-[10px] text-gray-500 uppercase tracking-wide">Web Links</div>
      </div>
    </div>
  </div>
));

ContextStatsCard.displayName = 'ContextStatsCard';

const EmptyState = React.memo(({ addFolder, theme }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-white/5 rounded-xl py-16">
    <FolderPlus size={32} className="mb-3 opacity-20" />
    <p className="text-xs font-medium mb-2">Project is empty</p>
    <button
      onClick={addFolder}
      className={`text-xs ${theme.accentText} hover:underline font-medium`}
      aria-label="Add folder to start"
    >
      Add folder to start
    </button>
  </div>
));

EmptyState.displayName = 'EmptyState';

// --- NEW DOSSIER COMPONENT ---
const DossierCard = ({ dossier, onGenerate, isLoading, theme }) => {
  // 1. CTA STATE (No dossier exists yet)
  if (!dossier) {
    return (
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 flex items-center justify-between shadow-lg mb-6 backdrop-blur-sm">
        <div className="flex items-center gap-4">
           <div className={`p-3 rounded-xl bg-white/10 ${theme.accentText}`}><Sparkles size={20}/></div>
           <div>
              <h3 className="text-sm font-bold text-white">Generate Intelligence Dossier</h3>
              <p className="text-xs text-gray-400">Analyze project files to auto-generate summary, tags, and insights.</p>
           </div>
        </div>
        <button 
          onClick={onGenerate} 
          disabled={isLoading}
          className={`px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg`}
        >
          {isLoading ? <Sparkles size={14} className="animate-spin"/> : <BrainCircuit size={14}/>}
          {isLoading ? 'Analyzing...' : 'Generate Dossier'}
        </button>
      </div>
    );
  }

  // 2. DOSSIER CONTENT STATE (Vertical Gradient Bar Removed)
  return (
    <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/10 shadow-2xl relative overflow-hidden group mb-6">
       
       <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
             <BrainCircuit size={14} className={theme.accentText}/> Intelligence Dossier
          </div>
          {/* Tags */}
          <div className="flex gap-2">
             {dossier.tags?.map((tag, i) => (
               <span key={i} className="text-[10px] bg-white/5 px-2 py-1 rounded-full text-gray-300 border border-white/5 flex items-center gap-1">
                 <Tag size={8}/> {tag}
               </span>
             ))}
          </div>
       </div>

       <p className="text-sm text-gray-200 leading-relaxed font-serif italic border-l-2 border-white/10 pl-4 mb-6">
          "{dossier.summary}"
       </p>

       <div className="grid grid-cols-2 gap-3">
          {dossier.questions?.map((q, i) => (
             <button key={i} className="text-left text-[11px] p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                <span className={`font-bold ${theme.accentText}`}>?</span> {q}
             </button>
          ))}
       </div>
    </div>
  );
};

// --- MAIN DASHBOARD ---
export const ProjectDashboard = React.memo(() => {
  // 1. EXTRACT ALL REQUIRED PROPS INCLUDING DOSSIER LOGIC
  const { 
    activeProject, 
    gitStatus, 
    addFolder, 
    theme, 
    settings,
    openFile,     
    deleteFile,
    generateDossier, // <--- New Context Function
    isLoading        // <--- For loading state
  } = useLumina();

  // Memoize file list rendering
  const fileList = useMemo(
    () => activeProject?.files || [],
    [activeProject?.files]
  );

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 font-mono text-xs tracking-widest uppercase">
        Select a project context
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-8 bg-[#030304] relative">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between border-b border-white/5 pb-6">
          <div className="space-y-2">
            <div
              className={`inline-flex items-center gap-2 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest ${theme.accentText}`}
            >
              <Layout size={10} /> Project Overview
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              {activeProject.name}
            </h1>
            <p className="text-sm text-gray-500 font-mono flex items-center gap-2">
              <Folder size={12} />
              {activeProject.rootPath || "Virtual Context Container"}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={addFolder}
              className={`flex items-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 rounded-xl text-xs font-medium ${theme.accentText} transition-all group`}
              aria-label="Add folder to project"
            >
              <FolderPlus size={14} />
              Add Folder
            </button>
          </div>
        </div>

        {/* --- INTELLIGENCE DOSSIER (Inserted Here) --- */}
        <DossierCard 
           dossier={activeProject.dossier} 
           onGenerate={generateDossier} 
           isLoading={isLoading} 
           theme={theme} 
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar: Git Status & Stats */}
          {settings.developerMode && (
            <div className="col-span-1 space-y-4">
              <GitStatusCard gitStatus={gitStatus} theme={theme} />
              <ContextStatsCard activeProject={activeProject} theme={theme} />
            </div>
          )}

          {/* Main: Knowledge Index */}
          <div
            className={clsx(
              "p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 shadow-2xl flex flex-col",
              settings.developerMode ? "col-span-2 h-[500px]" : "col-span-3 h-[500px]"
            )}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <File size={14} className="text-blue-400" /> Knowledge Index
              </h3>
              <span className="text-[10px] text-gray-600 bg-[#151515] px-2 py-1 rounded flex items-center gap-1">
                <CheckCircle2 size={10} /> Synced
              </span>
            </div>

            {fileList.length === 0 ? (
              <EmptyState addFolder={addFolder} theme={theme} />
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                {fileList.map((file, index) => (
                  <FileItem 
                    key={`${file.path}-${index}`} 
                    file={file} 
                    index={index} 
                    theme={theme}
                    // 2. PASS FUNCTIONS DOWN
                    onOpen={openFile}
                    onDelete={deleteFile}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ProjectDashboard.displayName = 'ProjectDashboard';