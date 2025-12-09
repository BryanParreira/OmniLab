import React, { useMemo, useState } from 'react';
import { useLumina } from '../context/LuminaContext';
import { 
  Folder, File, Globe, GitBranch, FolderPlus, Hash, 
  Layout, MoreVertical, Trash, FileCode, Copy, ArrowRight,
  GitCommit, CheckCircle2, Sparkles, BrainCircuit, Tag, ExternalLink,
  Search, X, Clock, RefreshCw, Calendar, HardDrive, Code2, Filter,
  TrendingUp, Zap, Edit3, Check, Star, Archive, Download, Eye,
  AlertCircle, Package, Activity, FolderOpen, Link
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// --- UTILITY FUNCTIONS ---
const formatFileSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getFileIcon = (file) => {
  if (file.type === 'url') return Globe;
  const ext = file.name?.split('.').pop()?.toLowerCase();
  const iconMap = {
    'js': Code2, 'jsx': Code2, 'ts': Code2, 'tsx': Code2,
    'py': Code2, 'java': Code2, 'cpp': Code2,
    'md': FileCode, 'txt': FileCode,
    'json': Package, 'xml': Package,
  };
  return iconMap[ext] || File;
};

const getFileColor = (file) => {
  if (file.type === 'url') return 'text-blue-400 bg-blue-500/10';
  const ext = file.name?.split('.').pop()?.toLowerCase();
  const colorMap = {
    'js': 'text-yellow-400 bg-yellow-500/10',
    'ts': 'text-blue-400 bg-blue-500/10',
    'py': 'text-green-400 bg-green-500/10',
    'json': 'text-purple-400 bg-purple-500/10',
  };
  return colorMap[ext] || 'text-gray-400 bg-gray-800';
};

// --- SUB-COMPONENT: ENHANCED FILE ITEM ---
const FileItem = React.memo(({ file, index, theme, onOpen, onDelete, isRecent, isFavorite, onToggleFavorite }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const IconComponent = getFileIcon(file);

  React.useEffect(() => {
    const close = () => setShowMenu(false);
    if(showMenu) window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [showMenu]);

  const handleAction = (e, action) => {
    e.stopPropagation();
    setShowMenu(false);

    switch(action) {
        case 'open':
            if (onOpen) onOpen(file);
            break;
        case 'copy':
            navigator.clipboard.writeText(file.path);
            break;
        case 'favorite':
            if (onToggleFavorite) onToggleFavorite(file.path);
            break;
        case 'delete':
            if (window.confirm(`Remove "${file.name}" from this project?`)) {
                if (onDelete) onDelete(file.path);
            }
            break;
        default:
            break;
    }
  };

  return (
    <motion.div 
      className="relative group"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={clsx(
          "flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer relative overflow-hidden",
          "border border-transparent hover:border-white/10",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent",
          "before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
          isHovered ? "bg-white/5" : "bg-transparent"
        )}
        onClick={() => onOpen && onOpen(file)}
        onContextMenu={(e) => { e.preventDefault(); setShowMenu(true); }}
      >
        <div className="flex items-center gap-4 overflow-hidden flex-1 relative z-10">
          <div className={`p-2.5 rounded-xl shrink-0 transition-all ${getFileColor(file)} ${isHovered ? 'scale-110' : ''}`}>
            <IconComponent size={16} />
          </div>
          
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={clsx(
                "text-sm truncate font-medium transition-colors",
                isHovered ? "text-white" : "text-gray-200"
              )} title={file.name}>
                {file.name}
              </span>
              
              <div className="flex items-center gap-1">
                {isFavorite && (
                  <Star size={10} className="text-yellow-400 fill-yellow-400" />
                )}
                {isRecent && (
                  <span className="text-[9px] bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <Zap size={8}/> Recent
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-gray-600 truncate font-mono" title={file.path}>
                {file.path}
              </span>
              {file.lastModified && (
                <span className="text-[9px] text-gray-700 flex items-center gap-1 shrink-0">
                  <Clock size={8}/> {formatDate(file.lastModified)}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 relative z-10">
           {file.size && (
             <span className="text-[10px] text-gray-600 font-mono px-2 py-1 rounded-lg bg-black/30 border border-white/5">
               {formatFileSize(file.size)}
             </span>
           )}
           
           <div className={clsx(
             "flex items-center gap-1 transition-all duration-200",
             isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
           )}>
             <button 
               onClick={(e) => { e.stopPropagation(); handleAction(e, 'favorite'); }}
               className={clsx(
                 "p-1.5 rounded-lg transition-all",
                 isFavorite 
                   ? "text-yellow-400 bg-yellow-500/10" 
                   : "text-gray-500 hover:text-yellow-400 hover:bg-white/10"
               )}
               title={isFavorite ? "Remove from favorites" : "Add to favorites"}
             >
                <Star size={12} className={isFavorite ? "fill-yellow-400" : ""} />
             </button>
             
             <button 
               onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
               className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
             >
                <MoreVertical size={12} />
             </button>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {showMenu && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-2 top-12 z-50 w-44 bg-[#0a0a0a] border border-white/20 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
                onClick={e => e.stopPropagation()} 
            >
                <div className="p-1.5">
                    <button onClick={(e) => handleAction(e, 'open')} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/10 rounded-lg transition-colors">
                        {file.type === 'url' ? <ExternalLink size={12} /> : <Eye size={12} />} 
                        {file.type === 'url' ? 'Open URL' : 'Open File'}
                    </button>
                    <button onClick={(e) => handleAction(e, 'favorite')} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/10 rounded-lg transition-colors">
                        <Star size={12} /> {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                    </button>
                    <button onClick={(e) => handleAction(e, 'copy')} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/10 rounded-lg transition-colors">
                        <Copy size={12} /> Copy Path
                    </button>
                    <div className="h-px bg-white/10 my-1"></div>
                    <button onClick={(e) => handleAction(e, 'delete')} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash size={12} /> Remove
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
        setTimeout(() => {
            setIsCommitting(false);
            setCommitMsg("");
            setIsExpanded(false);
        }, 1000);
    };

    return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#111] border border-white/10 shadow-2xl relative overflow-hidden group"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
            
            <div className="flex justify-between items-start mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <GitBranch size={14} className={theme.accentText} /> Version Control
                </h3>
                {gitStatus && (
                    <span className={`text-[10px] px-2.5 py-1 rounded-full bg-gradient-to-r from-white/5 to-white/10 border border-white/10 ${theme.accentText} font-mono font-bold`}>
                      {gitStatus.current}
                    </span>
                )}
            </div>

            {gitStatus ? (
            <div className="space-y-3">
                {gitStatus.lastCommit && (
                  <div className="p-4 bg-gradient-to-br from-[#151515] to-[#0a0a0a] rounded-xl border border-white/5 space-y-2 group/commit hover:border-white/10 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <GitCommit size={10}/> Latest Commit
                      </div>
                      <div className="text-[9px] text-gray-600">{formatDate(gitStatus.lastCommit.date)}</div>
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">{gitStatus.lastCommit.message}</p>
                    <div className="text-[9px] text-gray-600 flex items-center gap-1">
                      by <span className="text-gray-500 font-medium">{gitStatus.lastCommit.author}</span>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-br from-orange-500/5 to-transparent rounded-xl border border-orange-500/10">
                      <span className="text-xs text-gray-400 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                        Modified
                      </span>
                      <span className="text-lg font-mono text-orange-400 font-bold">
                          {gitStatus.modified?.length || 0}
                      </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-xl border border-emerald-500/10">
                      <span className="text-xs text-gray-400 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        Staged
                      </span>
                      <span className="text-lg font-mono text-emerald-400 font-bold">
                          {gitStatus.staged?.length || 0}
                      </span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${gitStatus.clean ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`}></div>
                            <span className="font-medium">{gitStatus.clean ? "Tree is clean" : "Uncommitted changes"}</span>
                        </div>
                        {!gitStatus.clean && (
                            <button 
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-blue-400 hover:text-blue-300 font-medium transition-colors flex items-center gap-1"
                            >
                                {isExpanded ? "Cancel" : "Commit"}
                                <ArrowRight size={10} className={isExpanded ? "rotate-90" : ""}/>
                            </button>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && !gitStatus.clean && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pt-3 border-t border-white/5 space-y-2"
                        >
                            <input 
                                value={commitMsg}
                                onChange={(e) => setCommitMsg(e.target.value)}
                                placeholder="Commit message..."
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500/50 transition-all"
                            />
                            <button 
                                onClick={handleCommit}
                                disabled={!commitMsg || isCommitting}
                                className={clsx(
                                  "w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all",
                                  commitMsg 
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500 shadow-lg shadow-blue-500/20' 
                                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                                )}
                            >
                                {isCommitting ? (
                                    <>
                                      <RefreshCw size={12} className="animate-spin"/> 
                                      Committing...
                                    </>
                                ) : (
                                    <>
                                      <GitCommit size={12}/> 
                                      Commit Changes
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            ) : (
            <div className="text-center py-12 text-gray-600 text-xs border-2 border-dashed border-white/5 rounded-xl bg-[#0a0a0a]/50">
                <GitBranch size={24} className="mx-auto mb-2 opacity-20"/>
                <p>No repository detected</p>
            </div>
            )}
        </motion.div>
    );
});

GitStatusCard.displayName = 'GitStatusCard';

// --- ENHANCED CONTEXT STATS ---
const ContextStatsCard = React.memo(({ activeProject, theme }) => {
  const stats = useMemo(() => {
    const files = activeProject?.files || [];
    const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
    const urlCount = files.filter(f => f.type === 'url').length;
    const codeFiles = files.filter(f => f.name?.match(/\.(js|ts|py|java|cpp|css|html)$/i)).length;
    const recentFiles = files.filter(f => {
      if (!f.lastModified) return false;
      const diff = new Date() - new Date(f.lastModified);
      return diff < 7 * 24 * 60 * 60 * 1000; // Last 7 days
    }).length;
    
    return {
      totalFiles: files.length,
      urlCount,
      codeFiles,
      totalSize,
      recentFiles
    };
  }, [activeProject?.files]);

  const statItems = [
    { icon: File, label: 'Total Files', value: stats.totalFiles, color: 'text-gray-400', gradient: 'from-gray-500/10 to-transparent' },
    { icon: Globe, label: 'Web Links', value: stats.urlCount, color: 'text-blue-400', gradient: 'from-blue-500/10 to-transparent' },
    { icon: Code2, label: 'Code Files', value: stats.codeFiles, color: 'text-emerald-400', gradient: 'from-emerald-500/10 to-transparent' },
    { icon: Activity, label: 'Recent', value: stats.recentFiles, color: 'text-orange-400', gradient: 'from-orange-500/10 to-transparent' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#111] border border-white/10 shadow-xl"
    >
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
        <Hash size={14} className={theme.accentText} /> Project Metrics
      </h3>
      
      <div className="space-y-3">
        {statItems.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} border border-white/5 hover:border-white/10 transition-all group cursor-pointer`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <stat.icon size={14} className={stat.color}/>
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
              <div className={`text-xl font-bold ${stat.color} group-hover:scale-110 transition-transform`}>
                {stat.value}
              </div>
            </div>
          </motion.div>
        ))}
        
        <div className="pt-3 mt-3 border-t border-white/5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <HardDrive size={12}/>
              Total Size
            </div>
            <div className="text-sm font-mono text-gray-400 font-bold">
              {formatFileSize(stats.totalSize)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

ContextStatsCard.displayName = 'ContextStatsCard';

// --- EMPTY STATE ---
const EmptyState = React.memo(({ addFolder, theme }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex-1 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-white/5 rounded-xl py-16 hover:border-white/10 transition-all bg-gradient-to-br from-white/[0.02] to-transparent"
  >
    <div className="relative">
      <FolderOpen size={48} className="mb-4 opacity-10" />
      <div className="absolute inset-0 blur-xl bg-blue-500/20"></div>
    </div>
    <p className="text-sm font-medium mb-1">No files in this project</p>
    <p className="text-xs text-gray-700 mb-4">Add folders or files to get started</p>
    <button
      onClick={addFolder}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl ${theme.primaryBg} text-white text-xs font-bold hover:brightness-110 transition-all shadow-lg`}
    >
      <FolderPlus size={14}/>
      Add Folder
    </button>
  </motion.div>
));

EmptyState.displayName = 'EmptyState';

// --- ENHANCED DOSSIER COMPONENT ---
const DossierCard = ({ dossier, onGenerate, onRegenerate, isLoading, theme }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState(dossier?.summary || '');

  React.useEffect(() => {
    if (dossier?.summary) {
      setEditedSummary(dossier.summary);
    }
  }, [dossier?.summary]);

  const handleSave = () => {
    setIsEditing(false);
  };

  if (!dossier) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-white/20 flex items-center justify-between shadow-xl mb-6 backdrop-blur-sm relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        
        <div className="flex items-center gap-4 relative z-10">
           <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
             <Sparkles size={24} className={theme.accentText}/>
           </div>
           <div>
              <h3 className="text-sm font-bold text-white mb-1">AI Project Intelligence</h3>
              <p className="text-xs text-gray-400">Generate automated insights, summaries, and contextual analysis</p>
           </div>
        </div>
        <button 
          onClick={onGenerate} 
          disabled={isLoading}
          className="relative z-10 px-5 py-2.5 rounded-xl bg-gradient-to-r from-white to-gray-100 text-black text-xs font-bold hover:scale-105 transition-all flex items-center gap-2 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
            <>
              <RefreshCw size={14} className="animate-spin"/> 
              Analyzing...
            </>
          ) : (
            <>
              <BrainCircuit size={14}/>
              Generate Dossier
            </>
          )}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#111] border border-white/10 shadow-2xl relative overflow-hidden group mb-6"
    >
       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
       
       <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
               <BrainCircuit size={14} className={theme.accentText}/> 
               <span>Intelligence Dossier</span>
            </div>
            {dossier.generatedAt && (
              <div className="flex items-center gap-1 text-[10px] text-gray-600 bg-black/30 px-2 py-1 rounded-full border border-white/5">
                <Calendar size={9}/> {formatDate(dossier.generatedAt)}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {dossier.tags?.map((tag, i) => (
              <motion.span 
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="text-[10px] bg-gradient-to-r from-white/5 to-white/10 px-2.5 py-1 rounded-full text-gray-300 border border-white/10 flex items-center gap-1 hover:border-white/20 transition-all"
              >
                <Tag size={8}/> {tag}
              </motion.span>
            ))}
            <button 
              onClick={onRegenerate}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
              title="Regenerate dossier"
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''}/>
            </button>
          </div>
       </div>

       <div className="relative">
         {isEditing ? (
           <div className="space-y-2">
             <textarea 
               value={editedSummary}
               onChange={(e) => setEditedSummary(e.target.value)}
               className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-4 text-sm text-gray-200 leading-relaxed font-serif outline-none focus:border-blue-500/50 min-h-[120px] resize-none"
               placeholder="Enter project summary..."
             />
             <div className="flex gap-2">
               <button 
                 onClick={handleSave}
                 className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-xl hover:from-blue-400 hover:to-blue-500 flex items-center gap-1.5 font-medium shadow-lg"
               >
                 <Check size={12}/> Save Changes
               </button>
               <button 
                 onClick={() => {
                   setIsEditing(false);
                   setEditedSummary(dossier.summary);
                 }}
                 className="px-4 py-2 bg-white/5 text-gray-400 text-xs rounded-xl hover:bg-white/10 font-medium"
               >
                 Cancel
               </button>
             </div>
           </div>
         ) : (
           <div className="relative group/summary">
             <div className="p-4 bg-gradient-to-br from-[#0a0a0a] to-transparent rounded-xl border border-white/5">
               <p className="text-sm text-gray-200 leading-relaxed font-serif">
                 {editedSummary}
               </p>
             </div>
             <button 
               onClick={() => setIsEditing(true)}
               className="absolute top-2 right-2 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 opacity-0 group-hover/summary:opacity-100 transition-all"
             >
               <Edit3 size={12}/>
             </button>
           </div>
         )}
       </div>
    </motion.div>
  );
};

// --- QUICK ACTIONS BAR ---
const QuickActionsBar = React.memo(({ onAddFolder, onExport, onArchive, theme }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-2 bg-[#0a0a0a] border border-white/10 rounded-xl p-2"
  >
    <button 
      onClick={onAddFolder}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-gray-400 hover:text-white transition-all font-medium"
    >
      <FolderPlus size={14}/> Add Content
    </button>
    <div className="w-px h-4 bg-white/10"></div>
    <button 
      onClick={onExport}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-gray-400 hover:text-white transition-all font-medium"
    >
      <Download size={14}/> Export
    </button>
    <button 
      onClick={onArchive}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-gray-400 hover:text-white transition-all font-medium"
    >
      <Archive size={14}/> Archive
    </button>
  </motion.div>
));

QuickActionsBar.displayName = 'QuickActionsBar';

// --- MAIN DASHBOARD ---
export const ProjectDashboard = React.memo(() => {
  const { 
    activeProject, 
    gitStatus, 
    addFolder, 
    theme, 
    settings,
    openFile,     
    deleteFile,
    generateDossier,
    isLoading        
  } = useLumina();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [favorites, setFavorites] = useState(new Set());
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  const filteredFiles = useMemo(() => {
    let files = activeProject?.files || [];
    
    // Filter by type
    if (filterType === 'url') {
      files = files.filter(f => f.type === 'url');
    } else if (filterType === 'file') {
      files = files.filter(f => f.type !== 'url');
    } else if (filterType === 'favorites') {
      files = files.filter(f => favorites.has(f.path));
    }
    
    // Filter by search
    if (searchQuery) {
      files = files.filter(f => 
        f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.path?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return files;
  }, [activeProject?.files, searchQuery, filterType, favorites]);

  const recentFiles = useMemo(() => {
    return filteredFiles.slice(0, 3).map(f => f.path);
  }, [filteredFiles]);

  const toggleFavorite = (path) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleExport = () => {
    alert('Export functionality coming soon!');
  };

  const handleArchive = () => {
    alert('Archive functionality coming soon!');
  };

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <Folder size={48} className="mx-auto text-gray-700 opacity-50"/>
          <p className="text-sm text-gray-500 font-medium">No project selected</p>
          <p className="text-xs text-gray-700">Select or create a project to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-[#030304]">
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between pb-6 border-b border-white/5"
        >
          <div className="space-y-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r ${theme.primaryBg} bg-opacity-10 border border-white/10 text-[10px] font-bold uppercase tracking-widest ${theme.accentText}`}>
              <Layout size={10} /> Project Dashboard
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              {activeProject.name}
              {activeProject.isPinned && (
                <Star size={24} className="text-yellow-400 fill-yellow-400"/>
              )}
            </h1>
            <p className="text-sm text-gray-500 font-mono flex items-center gap-2">
              <Folder size={12} />
              {activeProject.rootPath || "Virtual Context Container"}
            </p>
          </div>

          <QuickActionsBar 
            onAddFolder={addFolder}
            onExport={handleExport}
            onArchive={handleArchive}
            theme={theme}
          />
        </motion.div>

        {/* Dossier Section */}
        <DossierCard 
           dossier={activeProject.dossier} 
           onGenerate={generateDossier}
           onRegenerate={generateDossier}
           isLoading={isLoading} 
           theme={theme} 
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Git Status & Stats */}
          {settings.developerMode && (
            <div className="col-span-1 space-y-6">
              <GitStatusCard gitStatus={gitStatus} theme={theme} />
              <ContextStatsCard activeProject={activeProject} theme={theme} />
            </div>
          )}

          {/* Main Content - File List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={clsx(
              "rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#111] border border-white/10 shadow-2xl flex flex-col overflow-hidden",
              settings.developerMode ? "col-span-2" : "col-span-3"
            )}
            style={{ height: '600px' }}
          >
            {/* File List Header */}
            <div className="p-6 border-b border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Package size={14} className="text-blue-400" /> Knowledge Repository
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-600 bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1 border border-emerald-500/20">
                    <CheckCircle2 size={10} className="text-emerald-400"/> 
                    <span className="text-emerald-400 font-medium">Synced</span>
                  </span>
                  <span className="text-[10px] text-gray-600 bg-black/30 px-2 py-1 rounded-full border border-white/5 font-mono">
                    {filteredFiles.length} items
                  </span>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search files and URLs..."
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white outline-none focus:border-blue-500/50 transition-all placeholder-gray-600"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      <X size={14}/>
                    </button>
                  )}
                </div>
                
                <div className="flex gap-1 bg-[#0a0a0a] border border-white/10 rounded-xl p-1">
                  <button 
                    onClick={() => setFilterType('all')}
                    className={clsx(
                      "px-3 py-1.5 text-xs rounded-lg transition-all font-medium",
                      filterType === 'all' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
                    )}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setFilterType('file')}
                    className={clsx(
                      "px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 font-medium",
                      filterType === 'file' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <File size={10}/> Files
                  </button>
                  <button 
                    onClick={() => setFilterType('url')}
                    className={clsx(
                      "px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 font-medium",
                      filterType === 'url' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Globe size={10}/> URLs
                  </button>
                  <button 
                    onClick={() => setFilterType('favorites')}
                    className={clsx(
                      "px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 font-medium",
                      filterType === 'favorites' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Star size={10}/> Starred
                  </button>
                </div>
              </div>
            </div>

            {/* File List Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {filteredFiles.length === 0 ? (
                searchQuery || filterType !== 'all' ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600">
                    <Search size={40} className="mb-3 opacity-10" />
                    <p className="text-sm font-medium mb-1">No results found</p>
                    <p className="text-xs text-gray-700">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <EmptyState addFolder={addFolder} theme={theme} />
                )
              ) : (
                <div className="space-y-1">
                  <AnimatePresence mode="popLayout">
                    {filteredFiles.map((file, index) => (
                      <FileItem 
                        key={`${file.path}-${index}`} 
                        file={file} 
                        index={index} 
                        theme={theme}
                        onOpen={openFile}
                        onDelete={deleteFile}
                        isRecent={recentFiles.includes(file.path)}
                        isFavorite={favorites.has(file.path)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
});

ProjectDashboard.displayName = 'ProjectDashboard';