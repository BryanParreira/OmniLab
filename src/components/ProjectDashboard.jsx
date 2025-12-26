import React, { useState, useEffect, useMemo } from 'react';
import { useLumina } from '../context/LuminaContext';
import { 
  Folder, GitBranch, Activity, TrendingUp, Clock, 
  Calendar, Users, Target, Zap, Code2, FileText,
  CheckCircle2, AlertCircle, Sparkles, BarChart3,
  PieChart, Archive, Star, Flame, Award, BookOpen,
  Brain, Lightbulb, Rocket, ShieldCheck, RefreshCw,
  GitCommit, GitPullRequest, GitMerge, Tag, Eye,
  MessageSquare, Hash, ExternalLink, Download, Upload,
  Plus, ChevronRight, ChevronDown, Search, Filter,
  X, Edit2, Trash2, Check, Copy, FileCode, Database,
  Image, Link2, ListChecks, Layers, FolderOpen,
  MoreHorizontal, Settings, Lock, Unlock, UserPlus,
  Share2, Bell, Pin, Bookmark, Flag, Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- UTILITY FUNCTIONS ---
const formatDate = (date) => {
  if (!date) return 'Never';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// --- DOSSIER CARD COMPONENT ---
const DossierCard = ({ dossier, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(dossier.content);

  const handleSave = () => {
    onUpdate(dossier.id, { content: editedContent });
    setIsEditing(false);
  };

  const priorityColors = {
    low: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
    medium: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    high: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' }
  };

  const typeIcons = {
    note: <FileText size={12} />,
    task: <CheckCircle2 size={12} />,
    idea: <Lightbulb size={12} />,
    issue: <AlertCircle size={12} />,
    goal: <Target size={12} />
  };

  const color = priorityColors[dossier.priority || 'medium'];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`p-4 rounded-xl border ${color.border} ${color.bg} transition-all hover:shadow-lg group`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          <div className={`p-1.5 rounded-lg ${color.bg} ${color.text}`}>
            {typeIcons[dossier.type]}
          </div>
          {isEditing ? (
            <input
              value={editedContent.split('\n')[0]}
              onChange={(e) => {
                const lines = editedContent.split('\n');
                lines[0] = e.target.value;
                setEditedContent(lines.join('\n'));
              }}
              className="flex-1 bg-white/5 px-2 py-1 rounded text-sm font-medium text-white outline-none focus:bg-white/10"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-1 text-left text-sm font-medium text-white hover:text-blue-400 transition-colors"
            >
              {dossier.title}
            </button>
          )}
          <ChevronDown 
            size={14} 
            className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1 rounded hover:bg-green-500/20 text-green-400 transition-colors"
                title="Save"
              >
                <Check size={12} />
              </button>
              <button
                onClick={() => { setEditedContent(dossier.content); setIsEditing(false); }}
                className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                title="Cancel"
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Edit"
              >
                <Edit2 size={12} />
              </button>
              <button
                onClick={() => onDelete(dossier.id)}
                className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full bg-white/5 px-3 py-2 rounded-lg text-xs text-gray-300 outline-none focus:bg-white/10 resize-none font-mono"
                rows={4}
              />
            ) : (
              <div className="pt-2 border-t border-white/10 mt-2">
                <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {dossier.content}
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-1 rounded-full ${color.bg} ${color.text} border ${color.border} font-bold uppercase tracking-wider`}>
                  {dossier.priority}
                </span>
                {dossier.tags && dossier.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-gray-500">
                    #{tag}
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-gray-600 font-mono">
                {formatDate(dossier.createdAt)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- ACTIVITY TIMELINE COMPONENT ---
const ActivityTimeline = ({ activities }) => {
  const getActivityIcon = (type) => {
    const icons = {
      commit: <GitCommit size={12} />,
      file_added: <Plus size={12} />,
      file_edited: <Edit2 size={12} />,
      note_created: <FileText size={12} />,
      milestone_reached: <Flag size={12} />,
      collaboration: <Users size={12} />
    };
    return icons[type] || <Activity size={12} />;
  };

  const getActivityColor = (type) => {
    const colors = {
      commit: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      file_added: 'bg-green-500/10 text-green-400 border-green-500/30',
      file_edited: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      note_created: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      milestone_reached: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
      collaboration: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
    };
    return colors[type] || 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-start gap-3 group"
        >
          <div className={`p-2 rounded-lg border ${getActivityColor(activity.type)} shrink-0`}>
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white">{activity.message}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">{activity.user}</span>
              <span className="text-xs text-gray-600">•</span>
              <span className="text-xs text-gray-600">{formatDate(activity.timestamp)}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// --- MAIN COMPONENT ---
export const ProjectDashboard = () => {
  const { theme, activeProject, updateProject } = useLumina();
  
  const [selectedTab, setSelectedTab] = useState('overview');
  const [gitStats, setGitStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [showNewDossier, setShowNewDossier] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load data when project changes
  useEffect(() => {
    if (activeProject) {
      // Use actual git stats from project if available
      setGitStats(activeProject.gitStats || null);
      
      // Use actual activities from project if available
      setActivities(activeProject.activities || []);
      
      // Load dossiers from project metadata
      setDossiers(activeProject.dossiers || []);
    }
  }, [activeProject]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!activeProject) return null;
    
    const totalFiles = (activeProject.files || []).length;
    const filesByType = {
      code: (activeProject.files || []).filter(f => /\.(js|jsx|ts|tsx|py|java|c|cpp|go|rs)$/i.test(f)).length,
      docs: (activeProject.files || []).filter(f => /\.(md|txt|pdf|doc|docx)$/i.test(f)).length,
      data: (activeProject.files || []).filter(f => /\.(json|csv|xml|yaml|yml)$/i.test(f)).length,
      other: 0
    };
    filesByType.other = totalFiles - filesByType.code - filesByType.docs - filesByType.data;

    const velocity = gitStats?.recentCommits ? Math.round(gitStats.recentCommits / 7) : 0;
    
    return {
      totalFiles,
      filesByType,
      velocity,
      dossierCount: dossiers.length,
      activeTasks: dossiers.filter(d => d.type === 'task' && !d.completed).length,
      completionRate: activeProject.progress || 0
    };
  }, [activeProject, gitStats, dossiers]);

  // Dossier Management
  const handleCreateDossier = (data) => {
    const newDossier = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString()
    };
    
    const updatedDossiers = [...dossiers, newDossier];
    setDossiers(updatedDossiers);
    
    if (updateProject && activeProject) {
      updateProject(activeProject.id, { dossiers: updatedDossiers });
    }
    
    setShowNewDossier(false);
  };

  const handleUpdateDossier = (id, updates) => {
    const updatedDossiers = dossiers.map(d => 
      d.id === id ? { ...d, ...updates } : d
    );
    setDossiers(updatedDossiers);
    
    if (updateProject && activeProject) {
      updateProject(activeProject.id, { dossiers: updatedDossiers });
    }
  };

  const handleDeleteDossier = (id) => {
    if (!window.confirm('Delete this dossier?')) return;
    
    const updatedDossiers = dossiers.filter(d => d.id !== id);
    setDossiers(updatedDossiers);
    
    if (updateProject && activeProject) {
      updateProject(activeProject.id, { dossiers: updatedDossiers });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Reload actual data from project
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (activeProject) {
      setGitStats(activeProject.gitStats || null);
      setActivities(activeProject.activities || []);
    }
    
    setIsRefreshing(false);
  };

  // Filter dossiers
  const filteredDossiers = useMemo(() => {
    return dossiers.filter(d => {
      const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === 'all' || d.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [dossiers, searchQuery, filterType]);

  if (!activeProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#030304]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-500/20 to-gray-600/20 border border-gray-500/30 flex items-center justify-center">
            <FolderOpen size={32} className="text-gray-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Project Selected</h2>
          <p className="text-sm text-gray-500">Select a project from the sidebar to view its dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-[#030304] overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A] to-transparent backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${theme.softBg} ${theme.accentText} transition-all hover:scale-105 shadow-lg`}>
            <BarChart3 size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">{activeProject.name}</span>
            <span className="text-[10px] text-gray-500">Project Dashboard & Analytics</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title="Refresh Data"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-white/5 px-8 pt-4 bg-[#0A0A0A]/50">
        <div className="flex gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: <BarChart3 size={14} /> },
            { id: 'git', label: 'Git Stats', icon: <GitBranch size={14} /> },
            { id: 'dossiers', label: 'Dossiers', icon: <BookOpen size={14} /> },
            { id: 'activity', label: 'Activity', icon: <Activity size={14} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-xs font-bold transition-all ${
                selectedTab === tab.id
                  ? 'bg-[#030304] text-white border-t-2 border-x border-white/10'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-8 space-y-6">
          {/* OVERVIEW TAB */}
          {selectedTab === 'overview' && stats && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 hover:border-blue-500/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Folder size={16} className="text-blue-400" />
                    </div>
                    <TrendingUp size={14} className="text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stats.totalFiles}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Total Files</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 hover:border-purple-500/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <GitCommit size={16} className="text-purple-400" />
                    </div>
                    <Zap size={14} className="text-purple-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stats.velocity}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Commits/Day</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 hover:border-amber-500/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-amber-500/20">
                      <CheckCircle2 size={16} className="text-amber-400" />
                    </div>
                    <Target size={14} className="text-amber-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stats.activeTasks}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Active Tasks</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 hover:border-green-500/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Award size={16} className="text-green-400" />
                    </div>
                    <Sparkles size={14} className="text-green-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stats.completionRate}%</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Progress</div>
                </motion.div>
              </div>

              {/* File Breakdown Chart */}
              <div className="max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-6 rounded-xl bg-gradient-to-br from-[#0A0A0A] to-[#111] border border-white/10"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-white">File Distribution</h3>
                    <PieChart size={14} className="text-blue-400" />
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(stats.filesByType).map(([type, count], index) => {
                      const colors = {
                        code: { bg: 'bg-blue-500', text: 'text-blue-400' },
                        docs: { bg: 'bg-green-500', text: 'text-green-400' },
                        data: { bg: 'bg-purple-500', text: 'text-purple-400' },
                        other: { bg: 'bg-gray-500', text: 'text-gray-400' }
                      };
                      const color = colors[type];
                      const percentage = stats.totalFiles > 0 ? Math.round((count / stats.totalFiles) * 100) : 0;
                      
                      return (
                        <div key={type}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-400 capitalize">{type}</span>
                            <span className={`text-xs font-bold ${color.text}`}>{count} ({percentage}%)</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                              className={`h-full ${color.bg} rounded-full`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            </>
          )}

          {/* GIT TAB */}
          {selectedTab === 'git' && gitStats && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-xl bg-gradient-to-br from-[#0A0A0A] to-[#111] border border-white/10"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <GitCommit size={16} className="text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{gitStats.commits}</div>
                      <div className="text-xs text-gray-500">Total Commits</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Last commit: {formatDate(gitStats.lastCommit)}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-6 rounded-xl bg-gradient-to-br from-[#0A0A0A] to-[#111] border border-white/10"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <GitBranch size={16} className="text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{gitStats.branches}</div>
                      <div className="text-xs text-gray-500">Active Branches</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Main: {gitStats.mainBranch}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 rounded-xl bg-gradient-to-br from-[#0A0A0A] to-[#111] border border-white/10"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Users size={16} className="text-green-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{gitStats.contributors}</div>
                      <div className="text-xs text-gray-500">Contributors</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {gitStats.recentCommits} commits this week
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-xl bg-gradient-to-br from-[#0A0A0A] to-[#111] border border-white/10"
              >
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <GitBranch size={14} className="text-purple-400" />
                  Active Branches
                </h3>
                <div className="space-y-2">
                  {gitStats.activeBranches.map((branch, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                        <span className="text-sm font-mono text-white">{branch}</span>
                        {index === 0 && (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            DEFAULT
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}

          {/* DOSSIERS TAB */}
          {selectedTab === 'dossiers' && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search dossiers..."
                      className="w-64 pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 outline-none focus:bg-white/10 focus:border-white/20 transition-all"
                    />
                  </div>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:bg-white/10 focus:border-white/20 transition-all"
                  >
                    <option value="all">All Types</option>
                    <option value="note">Notes</option>
                    <option value="task">Tasks</option>
                    <option value="idea">Ideas</option>
                    <option value="issue">Issues</option>
                    <option value="goal">Goals</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowNewDossier(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl ${theme.primaryBg} text-white text-sm font-bold hover:brightness-110 transition-all shadow-lg`}
                >
                  <Plus size={14} />
                  New Dossier
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <AnimatePresence>
                  {filteredDossiers.map(dossier => (
                    <DossierCard
                      key={dossier.id}
                      dossier={dossier}
                      onUpdate={handleUpdateDossier}
                      onDelete={handleDeleteDossier}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {filteredDossiers.length === 0 && (
                <div className="text-center py-16">
                  <BookOpen size={48} className="mx-auto text-gray-700 mb-4" />
                  <p className="text-sm text-gray-500">
                    {searchQuery || filterType !== 'all' 
                      ? 'No dossiers match your filters' 
                      : 'No dossiers yet. Create one to get started!'}
                  </p>
                </div>
              )}

              {/* New Dossier Modal */}
              <AnimatePresence>
                {showNewDossier && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center"
                    onClick={() => setShowNewDossier(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-[#0A0A0A] border border-white/20 rounded-2xl w-full max-w-md overflow-hidden"
                    >
                      <div className="p-6 border-b border-white/10">
                        <h3 className="text-lg font-bold text-white">Create New Dossier</h3>
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target);
                          handleCreateDossier({
                            title: formData.get('title'),
                            content: formData.get('content'),
                            type: formData.get('type'),
                            priority: formData.get('priority'),
                            tags: formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()) : []
                          });
                        }}
                        className="p-6 space-y-4"
                      >
                        <div>
                          <label className="text-xs text-gray-500 mb-2 block">Title</label>
                          <input
                            name="title"
                            required
                            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:bg-white/10 focus:border-white/20"
                            placeholder="Dossier title..."
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-500 mb-2 block">Content</label>
                          <textarea
                            name="content"
                            required
                            rows={4}
                            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:bg-white/10 focus:border-white/20 resize-none"
                            placeholder="Description..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-500 mb-2 block">Type</label>
                            <select
                              name="type"
                              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:bg-white/10 focus:border-white/20"
                            >
                              <option value="note">Note</option>
                              <option value="task">Task</option>
                              <option value="idea">Idea</option>
                              <option value="issue">Issue</option>
                              <option value="goal">Goal</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-gray-500 mb-2 block">Priority</label>
                            <select
                              name="priority"
                              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:bg-white/10 focus:border-white/20"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-gray-500 mb-2 block">Tags (comma-separated)</label>
                          <input
                            name="tags"
                            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:bg-white/10 focus:border-white/20"
                            placeholder="backend, urgent, review"
                          />
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => setShowNewDossier(false)}
                            className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className={`flex-1 px-4 py-2 rounded-xl ${theme.primaryBg} text-white text-sm font-bold hover:brightness-110 transition-all shadow-lg`}
                          >
                            Create
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* ACTIVITY TAB */}
          {selectedTab === 'activity' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl bg-gradient-to-br from-[#0A0A0A] to-[#111] border border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity size={14} className="text-blue-400" />
                  Recent Activity
                </h3>
                <span className="text-xs text-gray-500">Last 24 hours</span>
              </div>
              
              <ActivityTimeline activities={activities} />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

ProjectDashboard.displayName = 'ProjectDashboard';