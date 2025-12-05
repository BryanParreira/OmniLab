import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLumina } from '../context/LuminaContext';
import { 
  Search, Calendar, MessageSquare, FolderOpen, FileText, 
  Sparkles, Clock, Hash, Globe, ChevronRight, Command,
  Plus, Trash2, Edit3, Play, Grid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- SEARCH ENGINE ---
const searchAll = (query, { sessions, projects, calendarEvents, canvasNodes, zenithDocs }) => {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results = [];
  const now = Date.now();

  // 1. SESSIONS (CHATS)
  sessions.forEach(session => {
    const score = (session.title?.toLowerCase().includes(q) ? 10 : 0);
    if (score > 0) {
      results.push({
        type: 'chat',
        id: session.id,
        title: session.title,
        subtitle: new Date(session.date).toLocaleDateString(),
        icon: MessageSquare,
        action: 'open',
        data: session,
        score,
        timestamp: new Date(session.date).getTime()
      });
    }
  });

  // 2. PROJECTS
  projects.forEach(project => {
    const score = (project.name?.toLowerCase().includes(q) ? 10 : 0);
    if (score > 0) {
      results.push({
        type: 'project',
        id: project.id,
        title: project.name,
        subtitle: `${project.files?.length || 0} files`,
        icon: FolderOpen,
        action: 'open',
        data: project,
        score,
        timestamp: new Date(project.createdAt).getTime()
      });
    }
  });

  // 3. CALENDAR EVENTS
  calendarEvents.forEach(event => {
    const score = (
      (event.title?.toLowerCase().includes(q) ? 10 : 0) +
      (event.notes?.toLowerCase().includes(q) ? 5 : 0)
    );
    if (score > 0) {
      results.push({
        type: 'event',
        id: event.id,
        title: event.title,
        subtitle: `${event.date}${event.time ? ` at ${event.time}` : ''}`,
        icon: Calendar,
        action: 'open',
        data: event,
        score,
        timestamp: new Date(event.date).getTime()
      });
    }
  });

  // 4. CANVAS NODES
  canvasNodes.forEach(node => {
    const score = (
      (node.data?.title?.toLowerCase().includes(q) ? 10 : 0) +
      (node.data?.content?.toLowerCase().includes(q) ? 5 : 0)
    );
    if (score > 0) {
      results.push({
        type: 'canvas',
        id: node.id,
        title: node.data?.title || 'Untitled Node',
        subtitle: node.type.toUpperCase(),
        icon: Grid,
        action: 'open',
        data: node,
        score,
        timestamp: now
      });
    }
  });

  // 5. ZENITH DOCS
  zenithDocs.forEach(doc => {
    const score = (
      (doc.title?.toLowerCase().includes(q) ? 10 : 0) +
      (doc.content?.toLowerCase().includes(q) ? 3 : 0)
    );
    if (score > 0) {
      results.push({
        type: 'zenith',
        id: doc.filename,
        title: doc.title || 'Untitled Document',
        subtitle: `${doc.words || 0} words`,
        icon: FileText,
        action: 'open',
        data: doc,
        score,
        timestamp: doc.lastModified || now
      });
    }
  });

  // Sort by score (desc) then recency
  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.timestamp - a.timestamp;
  }).slice(0, 8);
};

// --- QUICK ACTIONS ---
const getQuickActions = (query) => {
  const q = query.toLowerCase();
  const actions = [];

  // CREATE ACTIONS
  if (q.includes('create') || q.includes('new')) {
    if (q.includes('meeting') || q.includes('event')) {
      actions.push({ 
        type: 'action', 
        id: 'create-event', 
        title: 'Create Calendar Event', 
        subtitle: 'Open Chronos with quick add',
        icon: Plus,
        action: 'create-event'
      });
    }
    if (q.includes('project')) {
      actions.push({ 
        type: 'action', 
        id: 'create-project', 
        title: 'Create New Project', 
        subtitle: 'Start a new project context',
        icon: Plus,
        action: 'create-project'
      });
    }
    if (q.includes('note') || q.includes('doc')) {
      actions.push({ 
        type: 'action', 
        id: 'create-zenith', 
        title: 'New Zenith Document', 
        subtitle: 'Start writing',
        icon: Plus,
        action: 'create-zenith'
      });
    }
  }

  // OPEN ACTIONS
  if (q.includes('open')) {
    actions.push({ 
      type: 'action', 
      id: 'open-calendar', 
      title: 'Open Calendar', 
      subtitle: 'View Chronos',
      icon: Calendar,
      action: 'open-chronos'
    });
    actions.push({ 
      type: 'action', 
      id: 'open-canvas', 
      title: 'Open Canvas', 
      subtitle: 'Visual architecture',
      icon: Grid,
      action: 'open-canvas'
    });
  }

  return actions;
};

// --- RESULT ITEM COMPONENT ---
const ResultItem = ({ result, isSelected, onClick }) => {
  const Icon = result.icon;
  
  const typeColors = {
    chat: 'text-blue-400 bg-blue-500/10',
    project: 'text-purple-400 bg-purple-500/10',
    event: 'text-green-400 bg-green-500/10',
    canvas: 'text-amber-400 bg-amber-500/10',
    zenith: 'text-rose-400 bg-rose-500/10',
    action: 'text-indigo-400 bg-indigo-500/10'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all rounded-xl ${
        isSelected 
          ? 'bg-white/10 shadow-lg' 
          : 'hover:bg-white/5'
      }`}
    >
      <div className={`p-2 rounded-lg ${typeColors[result.type] || 'text-gray-400 bg-gray-500/10'}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{result.title}</div>
        <div className="text-xs text-gray-500 truncate">{result.subtitle}</div>
      </div>
      <ChevronRight size={14} className="text-gray-600" />
    </motion.div>
  );
};

// --- MAIN COMPONENT ---
export const CommandPalette = ({ isOpen, onClose }) => {
  const { 
    sessions, 
    projects, 
    calendarEvents, 
    canvasNodes,
    setCurrentView,
    loadSession,
    setActiveProject,
    addEvent,
    createProject
  } = useLumina();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Mock Zenith docs (you'd integrate this with actual Zenith state)
  const zenithDocs = [];

  const results = useMemo(() => {
    if (!query) {
      // Show recent items when no query
      const recent = [
        ...sessions.slice(0, 3).map(s => ({ type: 'chat', ...s, icon: MessageSquare })),
        ...projects.slice(0, 3).map(p => ({ type: 'project', ...p, icon: FolderOpen })),
      ];
      return recent.slice(0, 6);
    }

    const searchResults = searchAll(query, { 
      sessions, 
      projects, 
      calendarEvents, 
      canvasNodes, 
      zenithDocs 
    });

    const actions = getQuickActions(query);
    
    return [...actions, ...searchResults];
  }, [query, sessions, projects, calendarEvents, canvasNodes]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelect = (result) => {
    // ACTIONS
    if (result.action === 'create-event') {
      setCurrentView('chronos');
      onClose();
      // Trigger event creation modal
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-event-modal'));
      }, 300);
    } else if (result.action === 'create-project') {
      const name = prompt('Project name:');
      if (name) {
        createProject(name);
        setCurrentView('dashboard');
      }
      onClose();
    } else if (result.action === 'create-zenith') {
      setCurrentView('zenith');
      onClose();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('zenith-new-file'));
      }, 300);
    } else if (result.action === 'open-chronos') {
      setCurrentView('chronos');
      onClose();
    } else if (result.action === 'open-canvas') {
      setCurrentView('canvas');
      onClose();
    }
    // OPEN ITEMS
    else if (result.type === 'chat') {
      loadSession(result.id);
      setCurrentView('chat');
      onClose();
    } else if (result.type === 'project') {
      setActiveProject(result.data);
      setCurrentView('dashboard');
      onClose();
    } else if (result.type === 'event') {
      setCurrentView('chronos');
      onClose();
      // Focus on the event's date
    } else if (result.type === 'canvas') {
      setCurrentView('canvas');
      onClose();
    } else if (result.type === 'zenith') {
      setCurrentView('zenith');
      onClose();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('zenith-load-file', { 
          detail: { filename: result.id } 
        }));
      }, 300);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-start justify-center pt-32 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* SEARCH INPUT */}
        <div className="flex items-center gap-3 p-4 border-b border-white/5">
          <Search size={20} className="text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search chats, projects, events, canvas, docs... or type a command"
            className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm"
          />
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <kbd className="px-2 py-1 bg-white/5 rounded border border-white/10">ESC</kbd>
          </div>
        </div>

        {/* RESULTS */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-600">
              <Search size={32} className="mb-3 opacity-20" />
              <p className="text-sm">No results found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((result, index) => (
                <ResultItem
                  key={result.id || index}
                  result={result}
                  isSelected={index === selectedIndex}
                  onClick={() => handleSelect(result)}
                />
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between p-3 border-t border-white/5 bg-white/[0.02] text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Command size={12} /> + K to open
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {results.length} results
            </span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white/5 rounded">↑↓</kbd>
            <span>navigate</span>
            <kbd className="px-2 py-1 bg-white/5 rounded ml-2">↵</kbd>
            <span>select</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};