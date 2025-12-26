import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  X, Maximize2, Minimize2, Download, Code, Eye, RefreshCw, FlaskConical, 
  ChevronLeft, ChevronRight, BrainCircuit, Check, Copy, Activity, 
  RotateCcw, Repeat, Plus, History, GitBranch, Search,
  Sparkles, BookOpen, Edit3, BarChart3, Target, Zap, 
  Share2, Grid, List, Volume2, VolumeX,
  ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, ThumbsUp,
  Save, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';

// --- KEYBOARD SHORTCUTS OVERLAY ---
const KeyboardShortcuts = ({ isOpen, onClose, theme }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space / Enter', action: 'Flip card (Flashcards)' },
    { key: '1-4', action: 'Grade card difficulty' },
    { key: '⌘ + S', action: 'Save/Download' },
    { key: '⌘ + F', action: 'Search in code' },
    { key: '⌘ + /', action: 'Toggle shortcuts' },
    { key: 'Esc', action: 'Close panels' },
    { key: '←/→', action: 'Navigate cards/tabs' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0A0A0A] border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap size={18} className={theme.accentText} />
          Keyboard Shortcuts
        </h3>
        <div className="space-y-2">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-sm text-gray-400">{shortcut.action}</span>
              <kbd className="px-2 py-1 bg-black/50 border border-white/10 rounded text-xs font-mono text-white">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- VERSION HISTORY PANEL ---
const VersionHistory = ({ versions, currentVersion, onRestore, onClose, theme }) => {
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="absolute right-0 top-14 bottom-0 w-80 bg-[#0A0A0A] border-l border-white/10 shadow-2xl z-30"
    >
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <History size={14} className={theme.accentText} />
          <span className="text-xs font-bold text-white">Version History</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all">
          <X size={14} />
        </button>
      </div>
      
      <div className="overflow-y-auto custom-scrollbar h-[calc(100%-56px)] p-4 space-y-2">
        {versions.length === 0 ? (
          <div className="text-center text-gray-500 mt-10 text-sm">No history yet.</div>
        ) : (
          versions.map((version, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                i === currentVersion
                  ? `${theme.softBg} ${theme.softBorder} border-2`
                  : 'bg-black/30 border-white/5 hover:border-white/20'
              }`}
              onClick={() => onRestore(i)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <GitBranch size={12} className={i === currentVersion ? theme.accentText : 'text-gray-500'} />
                  <span className="text-xs font-bold text-white">Version {versions.length - i}</span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">{version.timestamp}</span>
              </div>
              <p className="text-xs text-gray-400 line-clamp-2">{version.description}</p>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

// --- ENHANCED FLASHCARDS WITH SRS ---
const FlashcardDeck = ({ data, theme, onUpdate }) => {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0, total: data.length });
  const [streak, setStreak] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [cardStats, setCardStats] = useState(data.map(() => ({ reviews: 0, correct: 0, lastReview: null })));
  const [isEditing, setIsEditing] = useState(false);
  const [editedCard, setEditedCard] = useState(null);
  const [shuffled, setShuffled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const currentCard = data[index];

  const handleGrade = useCallback((difficulty) => {
    const isCorrect = difficulty !== 'again';
    
    setSessionStats(prev => ({
      ...prev,
      reviewed: prev.reviewed + 1,
      correct: isCorrect ? prev.correct + 1 : prev.correct
    }));

    setCardStats(prev => {
      const newStats = [...prev];
      newStats[index] = {
        reviews: newStats[index].reviews + 1,
        correct: newStats[index].correct + (isCorrect ? 1 : 0),
        lastReview: new Date().toISOString()
      };
      return newStats;
    });

    setStreak(isCorrect ? streak + 1 : 0);
    setIsFlipped(false);

    setTimeout(() => {
      setIndex((i) => (i + 1) % data.length);
    }, 200);
  }, [index, streak, data.length]);

  const handleShuffle = useCallback(() => {
    setShuffled(!shuffled);
    setIndex(0);
  }, [shuffled]);

  const handleEdit = useCallback(() => {
    setEditedCard({ ...currentCard });
    setIsEditing(true);
  }, [currentCard]);

  const handleSaveEdit = useCallback(() => {
    if (editedCard && onUpdate) {
      onUpdate(index, editedCard);
    }
    setIsEditing(false);
  }, [editedCard, onUpdate, index]);

  const speakText = useCallback((text) => {
    if (!audioEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }, [audioEnabled]);

  useEffect(() => {
    if (audioEnabled && isFlipped) {
      speakText(currentCard.back);
    }
  }, [isFlipped, audioEnabled, currentCard.back, speakText]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isEditing) return;
      
      if (!isFlipped && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        setIsFlipped(true);
      } else if (isFlipped) {
        if (e.key === '1') handleGrade('again');
        if (e.key === '2') handleGrade('hard');
        if (e.key === '3') handleGrade('good');
        if (e.key === '4') handleGrade('easy');
      }
      
      if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        setIndex(index - 1);
        setIsFlipped(false);
      }
      if (e.key === 'ArrowRight' && index < data.length - 1) {
        e.preventDefault();
        setIndex(index + 1);
        setIsFlipped(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, index, isEditing, data.length, handleGrade]);

  const progress = ((index + 1) / data.length) * 100;
  const accuracy = sessionStats.reviewed > 0 ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100) : 0;

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-[#050505] relative overflow-hidden">
      
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#111]">
        <motion.div 
          className={`h-full ${theme.primaryBg} transition-all duration-300`} 
          style={{ width: `${progress}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      {/* Enhanced Stats Header */}
      <div className="mb-6 text-center space-y-3 z-10 w-full max-w-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity size={18} className={theme.accentText} /> 
            Active Recall
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-2 rounded-lg transition-all ${audioEnabled ? `${theme.softBg} ${theme.accentText}` : 'bg-black/30 text-gray-500 hover:text-white'}`}
              title="Text-to-speech"
            >
              {audioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            <button
              onClick={handleShuffle}
              className={`p-2 rounded-lg transition-all ${shuffled ? `${theme.softBg} ${theme.accentText}` : 'bg-black/30 text-gray-500 hover:text-white'}`}
              title="Shuffle"
            >
              <Repeat size={14} />
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-2 rounded-lg bg-black/30 text-gray-500 hover:text-white transition-all"
              title="Statistics"
            >
              <BarChart3 size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="bg-black/30 border border-white/5 rounded-lg p-3">
            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Progress</div>
            <div className="text-lg font-bold text-white">{index + 1}/{data.length}</div>
          </div>
          <div className="bg-black/30 border border-white/5 rounded-lg p-3">
            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Reviewed</div>
            <div className="text-lg font-bold text-white">{sessionStats.reviewed}</div>
          </div>
          <div className="bg-black/30 border border-white/5 rounded-lg p-3">
            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Accuracy</div>
            <div className={`text-lg font-bold ${accuracy >= 80 ? 'text-green-400' : accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
              {accuracy}%
            </div>
          </div>
          <div className="bg-black/30 border border-white/5 rounded-lg p-3">
            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Streak</div>
            <div className={`text-lg font-bold ${streak > 0 ? 'text-orange-400' : 'text-gray-600'}`}>
              {streak > 0 ? `🔥 ${streak}` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Card Area */}
      {isEditing ? (
        <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 space-y-4 z-10">
          <div>
            <label className="text-xs font-bold text-gray-400 mb-2 block">Question</label>
            <textarea
              value={editedCard?.front || ''}
              onChange={(e) => setEditedCard({ ...editedCard, front: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-white/30 transition-all"
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 mb-2 block">Answer</label>
            <textarea
              value={editedCard?.back || ''}
              onChange={(e) => setEditedCard({ ...editedCard, back: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-white/30 transition-all"
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm text-white ${theme.primaryBg} hover:brightness-110 transition-all`}
            >
              Save Changes
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 px-4 py-2 rounded-lg font-bold text-sm bg-white/5 text-gray-400 hover:text-white transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="relative w-full max-w-lg aspect-[3/2] perspective-1000 cursor-pointer group z-10" onClick={() => !isFlipped && setIsFlipped(true)}>
          <motion.div 
            className="relative w-full h-full duration-500 transform-style-3d transition-transform"
            style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            
            {/* FRONT */}
            <div className={`absolute inset-0 backface-hidden rounded-2xl p-8 flex flex-col items-center justify-center text-center border ${theme.primaryBorder} bg-[#0A0A0A] shadow-2xl group-hover:border-white/20 transition-colors`}>
              <div className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Question</div>
              <div className="w-full overflow-y-auto custom-scrollbar px-2 max-h-[70%]">
                <div className="text-xl font-medium text-gray-100">{currentCard.front}</div>
              </div>
              <div className="absolute bottom-4 text-[10px] text-gray-600 animate-pulse">Press SPACE to reveal</div>
              
              {/* Edit Button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
              >
                <Edit3 size={14} />
              </button>
            </div>
            
            {/* BACK */}
            <div 
              className={`absolute inset-0 backface-hidden rounded-2xl p-8 flex flex-col items-center justify-center text-center border ${theme.primaryBorder} ${theme.softBg} shadow-2xl rotate-y-180`}
              style={{ transform: 'rotateY(180deg)' }}
            >
              <div className={`text-xs font-bold mb-4 uppercase tracking-wider ${theme.accentText}`}>Answer</div>
              <div className="w-full overflow-y-auto custom-scrollbar px-2 max-h-[80%]">
                <div className="text-lg text-white leading-relaxed whitespace-pre-wrap">{currentCard.back}</div>
              </div>
              
              {/* Card Stats */}
              {cardStats[index].reviews > 0 && (
                <div className="absolute bottom-4 flex items-center gap-3 text-[10px] text-gray-500">
                  <span>{cardStats[index].reviews} reviews</span>
                  <span>•</span>
                  <span>{Math.round((cardStats[index].correct / cardStats[index].reviews) * 100)}% accuracy</span>
                </div>
              )}
            </div>

          </motion.div>

          {/* Navigation Arrows */}
          <div className="absolute inset-y-0 -left-12 flex items-center">
            <button
              onClick={(e) => { e.stopPropagation(); index > 0 && setIndex(index - 1); setIsFlipped(false); }}
              disabled={index === 0}
              className="p-2 rounded-lg bg-black/50 hover:bg-black/70 text-gray-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              <ArrowLeft size={18} />
            </button>
          </div>
          <div className="absolute inset-y-0 -right-12 flex items-center">
            <button
              onClick={(e) => { e.stopPropagation(); index < data.length - 1 && setIndex(index + 1); setIsFlipped(false); }}
              disabled={index === data.length - 1}
              className="p-2 rounded-lg bg-black/50 hover:bg-black/70 text-gray-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Controls */}
      <div className="mt-8 w-full max-w-lg z-10">
        {!isFlipped && !isEditing ? (
          <button 
            onClick={() => setIsFlipped(true)} 
            className="w-full py-3 rounded-xl font-bold text-sm bg-white text-black hover:bg-gray-200 transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <Eye size={16} />
            Show Answer 
            <span className="text-[10px] opacity-50 ml-2">(SPACE)</span>
          </button>
        ) : !isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-4 gap-3 w-full"
          >
            <button 
              onClick={() => handleGrade('again')} 
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all active:scale-95"
            >
              <RotateCcw size={14}/>
              <span className="text-xs font-bold">Again</span>
              <span className="text-[9px] opacity-60">1m</span>
            </button>
            <button 
              onClick={() => handleGrade('hard')} 
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-all active:scale-95"
            >
              <AlertCircle size={14}/>
              <span className="text-xs font-bold">Hard</span>
              <span className="text-[9px] opacity-60">10m</span>
            </button>
            <button 
              onClick={() => handleGrade('good')} 
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all active:scale-95"
            >
              <Check size={14}/>
              <span className="text-xs font-bold">Good</span>
              <span className="text-[9px] opacity-60">1d</span>
            </button>
            <button 
              onClick={() => handleGrade('easy')} 
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-95"
            >
              <ThumbsUp size={14}/>
              <span className="text-xs font-bold">Easy</span>
              <span className="text-[9px] opacity-60">4d</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Statistics Modal */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowStats(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0A0A0A] border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 size={18} className={theme.accentText} />
                Session Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <span className="text-sm text-gray-400">Total Cards</span>
                  <span className="text-lg font-bold text-white">{data.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <span className="text-sm text-gray-400">Cards Reviewed</span>
                  <span className="text-lg font-bold text-white">{sessionStats.reviewed}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <span className="text-sm text-gray-400">Correct Answers</span>
                  <span className="text-lg font-bold text-green-400">{sessionStats.correct}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <span className="text-sm text-gray-400">Accuracy Rate</span>
                  <span className={`text-lg font-bold ${accuracy >= 80 ? 'text-green-400' : accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {accuracy}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <span className="text-sm text-gray-400">Current Streak</span>
                  <span className="text-lg font-bold text-orange-400">{streak > 0 ? `🔥 ${streak}` : '0'}</span>
                </div>
              </div>
              <button
                onClick={() => setShowStats(false)}
                className="w-full mt-4 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,#050505_100%)] opacity-80 z-0"></div>
    </div>
  );
};

// --- ENHANCED SYNTHESIS TABLE ---
const SynthesisTable = ({ data, theme }) => {
  const [copiedId, setCopiedId] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');

  const handleCopy = useCallback((text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleExport = useCallback(() => {
    const markdown = data.sections.map(section => 
      `## ${section.title}\n\n**${data.sourceA}:** ${section.contentA}\n\n**${data.sourceB}:** ${section.contentB}\n\n**Synthesis:** ${section.synthesis}\n\n---\n`
    ).join('\n');
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'synthesis.md';
    a.click();
    window.URL.revokeObjectURL(url);
  }, [data]);

  const filteredSections = useMemo(() => {
    return data.sections.filter(section =>
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.synthesis.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data.sections, searchQuery]);

  return (
    <div className="h-full overflow-y-auto p-8 custom-scrollbar bg-[#050505]">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
                <BrainCircuit className={theme.accentText} /> 
                Knowledge Synthesis
              </h3>
              <p className="text-sm text-gray-400">Comparative analysis between sources.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <Download size={14} />
                Export
              </button>
              <div className="flex bg-black/50 rounded-lg p-0.5 border border-white/5">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'table' ? `${theme.softBg} ${theme.accentText}` : 'text-gray-500 hover:text-white'}`}
                >
                  <Grid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'cards' ? `${theme.softBg} ${theme.accentText}` : 'text-gray-500 hover:text-white'}`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sections..."
                className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
            >
              <option value="default">Default Order</option>
              <option value="alpha">Alphabetical</option>
              <option value="length">By Length</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'table' ? (
          <div className="space-y-6">
            {filteredSections.map((section, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden group hover:border-white/20 transition-all"
              >
                <div className="px-6 py-3 bg-white/5 border-b border-white/5 font-bold text-gray-200 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} className={theme.accentText} />
                    {section.title}
                  </div>
                  <button 
                    onClick={() => handleCopy(section.synthesis, idx)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                    title="Copy Synthesis"
                  >
                    {copiedId === idx ? <Check size={14} className="text-green-400"/> : <Copy size={14}/>}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 divide-x divide-white/5">
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-3 uppercase">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      {data.sourceA}
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{section.contentA}</p>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-3 uppercase">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      {data.sourceB}
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{section.contentB}</p>
                  </div>
                </div>
                
                <div className={`px-6 py-4 border-t border-white/5 ${theme.softBg} relative overflow-hidden`}>
                  <div className={`absolute top-0 left-0 w-1 h-full ${theme.primaryBg}`}></div>
                  <div className="pl-3">
                    <div className={`flex items-center gap-2 text-xs font-bold mb-2 ${theme.accentText}`}>
                      <Sparkles size={12} />
                      SYNTHESIS
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed italic">{section.synthesis}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredSections.map((section, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all"
              >
                <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                  <Target size={14} className={theme.accentText} />
                  {section.title}
                </h4>
                <div className={`p-3 rounded-lg ${theme.softBg} border ${theme.softBorder} mb-3`}>
                  <p className="text-xs text-gray-300 leading-relaxed italic">{section.synthesis}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(section.synthesis, idx)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all"
                  >
                    {copiedId === idx ? <Check size={12} className="inline text-green-400"/> : <Copy size={12} className="inline"/>}
                    {copiedId === idx ? ' Copied' : ' Copy'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {filteredSections.length === 0 && (
          <div className="text-center py-16">
            <Search size={48} className="mx-auto text-gray-700 mb-4" />
            <p className="text-gray-500">No sections found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN LAB BENCH WITH TABS ---
export const LabBench = ({ artifacts: initialArtifacts = [], onClose, theme }) => {
  // State management
  const [artifacts, setArtifacts] = useState(initialArtifacts.length > 0 ? initialArtifacts : []);
  const [activeTab, setActiveTab] = useState(0);
  const [view, setView] = useState('preview');
  const [isExpanded, setIsExpanded] = useState(false);
  const [key, setKey] = useState(0);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [versions, setVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [searchInCode, setSearchInCode] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [saveIndicator, setSaveIndicator] = useState(false);

  const autoSaveTimerRef = useRef(null);
  const editorRef = useRef(null);

  // IMPROVED: Better sync with prop changes
  useEffect(() => {
    if (initialArtifacts.length > 0) {
      const incoming = initialArtifacts[0];
      if (!incoming) return;

      setArtifacts(prev => {
        // Check if already exists
        const existingIndex = prev.findIndex(item => 
          item.content === incoming.content && item.language === incoming.language
        );

        if (existingIndex !== -1) {
          // Already exists, just switch to it
          setActiveTab(existingIndex);
          return prev;
        }

        // It's new, append it
        const newList = [...prev, incoming];
        setActiveTab(newList.length - 1);
        return newList;
      });
    }
  }, [initialArtifacts]);

  const artifact = artifacts[activeTab] || artifacts[0];
  
  // Supported languages
  const SUPPORTED_LANGUAGES = useMemo(() => [
    'javascript', 'typescript', 'html', 'css', 'json', 'python', 'java', 
    'c', 'cpp', 'csharp', 'go', 'rust', 'php', 'sql', 'markdown', 'xml', 'yaml', 'shell'
  ], []);

  // Determine artifact type
  const isWeb = artifact?.language && ['html', 'svg'].includes(artifact.language);
  const isFlashcards = artifact?.type === 'flashcards';
  const isSynthesis = artifact?.type === 'synthesis';
  const isCode = !isFlashcards && !isSynthesis;

  // IMPROVED: Auto-save with debounce
  useEffect(() => {
    if (!artifact || !autoSaveEnabled) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveVersion('Auto-save');
      setSaveIndicator(true);
      setTimeout(() => setSaveIndicator(false), 1000);
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [artifact?.content, autoSaveEnabled]);

  // Initialize version history
  useEffect(() => {
    if (artifact && versions.length === 0) {
      setVersions([{
        content: artifact.content,
        timestamp: new Date().toLocaleTimeString(),
        description: 'Initial version'
      }]);
    }
  }, [artifact, versions.length]);

  const saveVersion = useCallback((description = 'Manual save') => {
    if (!artifact) return;
    setVersions(prev => [...prev, {
      content: artifact.content,
      timestamp: new Date().toLocaleTimeString(),
      description
    }]);
    setCurrentVersion(prev => prev + 1);
  }, [artifact]);

  const restoreVersion = useCallback((index) => {
    const updatedArtifacts = [...artifacts];
    updatedArtifacts[activeTab] = {
      ...artifact,
      content: versions[index].content
    };
    setArtifacts(updatedArtifacts);
    setCurrentVersion(index);
    setShowHistory(false);
  }, [artifacts, activeTab, artifact, versions]);

  const handleDownload = useCallback(() => {
    const content = isFlashcards || isSynthesis ? JSON.stringify(artifact.content, null, 2) : artifact.content;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artifact-${Date.now()}.${isFlashcards || isSynthesis ? 'json' : artifact.language || 'txt'}`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [artifact, isFlashcards, isSynthesis]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(artifact.content);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }, [artifact]);

  const handleShare = useCallback(() => {
    const shareUrl = `${window.location.origin}/share/${btoa(artifact.content).slice(0, 20)}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  }, [artifact]);

  const addNewTab = useCallback(() => {
    setArtifacts(prev => [...prev, {
      content: '// Select language above\n',
      language: 'javascript',
      type: 'code',
      title: 'New Tab'
    }]);
    setActiveTab(artifacts.length);
    setView('code');
  }, [artifacts.length]);

  const closeTab = useCallback((index) => {
    if (artifacts.length === 1) {
      onClose();
      return;
    }
    const newArtifacts = artifacts.filter((_, i) => i !== index);
    setArtifacts(newArtifacts);
    if (activeTab >= index && activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  }, [artifacts, activeTab, onClose]);

  const handleLanguageChange = useCallback((newLang) => {
    const updatedArtifacts = [...artifacts];
    updatedArtifacts[activeTab] = { ...artifact, language: newLang };
    setArtifacts(updatedArtifacts);
  }, [artifacts, activeTab, artifact]);

  // IMPROVED: Better combined preview with error handling
  const getCombinedPreview = useCallback(() => {
    if (!artifact || artifact.language !== 'html') return artifact?.content || '';

    try {
      let htmlContent = artifact.content;

      // Inject CSS
      const cssTabs = artifacts.filter(a => a.language === 'css');
      if (cssTabs.length > 0) {
        const combinedCss = cssTabs.map(a => a.content).join('\n');
        const styleTag = `<style>\n${combinedCss}\n</style>`;
        
        if (htmlContent.includes('</head>')) {
          htmlContent = htmlContent.replace('</head>', `${styleTag}\n</head>`);
        } else {
          htmlContent = `${styleTag}\n${htmlContent}`;
        }
      }

      // Inject JS
      const jsTabs = artifacts.filter(a => a !== artifact && ['javascript', 'typescript'].includes(a.language));
      if (jsTabs.length > 0) {
        const combinedJs = jsTabs.map(a => a.content).join('\n');
        const scriptTag = `<script>\n${combinedJs}\n</script>`;
        
        if (htmlContent.includes('</body>')) {
          htmlContent = htmlContent.replace('</body>', `${scriptTag}\n</body>`);
        } else {
          htmlContent = `${htmlContent}\n${scriptTag}`;
        }
      }

      return htmlContent;
    } catch (error) {
      console.error('Error combining preview:', error);
      return artifact.content;
    }
  }, [artifact, artifacts]);

  // IMPROVED: Better keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleDownload();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f' && isCode) {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        setShowHistory(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowHistory(false);
        setShowShortcuts(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts, showSearch, showHistory, isCode, handleDownload]);

  if (!artifact) return null;

  return (
    <>
      <motion.div 
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`border-l border-white/5 bg-[#050505] flex flex-col shadow-2xl relative transition-all duration-300 ${
          isExpanded ? 'fixed inset-0 z-50' : 'w-[50%] h-full'
        }`}
      >
        {/* Header with Tabs */}
        <div className="border-b border-white/5 bg-[#0A0A0A]">
          {/* Tabs Row */}
          <div className="flex items-center gap-1 px-2 pt-2 overflow-x-auto custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {artifacts.map((art, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setActiveTab(i)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-t-lg cursor-pointer transition-all min-w-[120px] max-w-[200px] ${
                    activeTab === i
                      ? `${theme.softBg} ${theme.accentText} border-t border-x ${theme.softBorder}`
                      : 'bg-black/20 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <FlaskConical size={12} />
                  <span className="text-xs font-bold truncate flex-1">
                    {art.type === 'flashcards' ? 'Flashcards' : art.type === 'synthesis' ? 'Synthesis' : art.language || 'Code'}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); closeTab(i); }}
                    className="p-0.5 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-all"
                  >
                    <X size={10} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            <button
              onClick={addNewTab}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all"
              title="New tab (⌘N)"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Controls Row */}
          <div className="h-12 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${theme.softBg} ${theme.accentText}`}>
                <FlaskConical size={14} />
              </div>
              <span className="text-xs font-bold text-gray-200 uppercase tracking-wider hidden sm:inline">
                Lab Bench <span className="text-gray-600">/</span>
              </span>
              
              {/* Language Selector */}
              {isCode && (
                <select
                  value={artifact.language || 'javascript'}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-white/30 cursor-pointer transition-all"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              )}
              {(!isCode) && (
                <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                  {isFlashcards ? 'Flashpoint' : 'Synthesizer'}
                </span>
              )}

              {/* Save Indicator */}
              <AnimatePresence>
                {saveIndicator && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1 text-xs text-green-400"
                  >
                    <CheckCircle2 size={12} />
                    Saved
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex items-center gap-1">
              {isWeb && (
                <div className="flex bg-black/50 rounded-lg p-0.5 border border-white/5 mr-2">
                  <button 
                    onClick={() => setView('code')} 
                    className={`p-1.5 rounded-md transition-all ${view === 'code' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`} 
                    title="Code"
                  >
                    <Code size={12}/>
                  </button>
                  <button 
                    onClick={() => setView('preview')} 
                    className={`p-1.5 rounded-md transition-all ${view === 'preview' ? `${theme.softBg} ${theme.accentText}` : 'text-gray-500 hover:text-white'}`} 
                    title="Preview"
                  >
                    <Eye size={12}/>
                  </button>
                </div>
              )}
              
              {isCode && (
                <button 
                  onClick={() => setShowSearch(!showSearch)} 
                  className={`p-2 rounded-lg transition-all ${showSearch ? `${theme.softBg} ${theme.accentText}` : 'hover:bg-white/5 text-gray-500 hover:text-white'}`}
                  title="Search (⌘F)"
                >
                  <Search size={14}/>
                </button>
              )}
              
              <button 
                onClick={() => setShowHistory(!showHistory)} 
                className={`p-2 rounded-lg transition-all ${showHistory ? `${theme.softBg} ${theme.accentText}` : 'hover:bg-white/5 text-gray-500 hover:text-white'}`}
                title="Version history (⌘H)"
              >
                <History size={14}/>
              </button>
              
              <button 
                onClick={() => setKey(k=>k+1)} 
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all" 
                title="Refresh preview"
              >
                <RefreshCw size={14}/>
              </button>
              
              <button 
                onClick={handleShare} 
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
                title="Share"
              >
                <Share2 size={14}/>
              </button>
              
              <button 
                onClick={handleDownload} 
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
                title="Download (⌘S)"
              >
                <Download size={14}/>
              </button>
              
              <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
                title="Toggle fullscreen"
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              
              <div className="h-4 w-px bg-white/10 mx-1"></div>
              
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-all"
                title="Close"
              >
                <X size={14}/>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <AnimatePresence>
            {showSearch && isCode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-3 border-t border-white/5"
              >
                <div className="flex gap-2 pt-3">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={searchInCode}
                      onChange={(e) => setSearchInCode(e.target.value)}
                      placeholder="Search in code..."
                      className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={() => setShowSearch(false)}
                    className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-[#030304]">
          {isFlashcards ? (
            <FlashcardDeck 
              data={artifact.content} 
              theme={theme}
              onUpdate={(index, updatedCard) => {
                const newContent = [...artifact.content];
                newContent[index] = updatedCard;
                const updatedArtifacts = [...artifacts];
                updatedArtifacts[activeTab] = { ...artifact, content: newContent };
                setArtifacts(updatedArtifacts);
              }}
            />
          ) : isSynthesis ? (
            <SynthesisTable data={artifact.content} theme={theme} />
          ) : view === 'preview' && isWeb ? (
            <div className="w-full h-full bg-white relative">
              <iframe 
                key={key} 
                srcDoc={getCombinedPreview()}
                className="w-full h-full border-none" 
                sandbox="allow-scripts allow-modals allow-forms"
                title="Preview"
              />
            </div>
          ) : (
            <div className="h-full overflow-hidden relative group">
              {/* Monaco Editor */}
              <Editor
                height="100%"
                language={artifact.language || 'javascript'}
                value={artifact.content}
                theme="vs-dark"
                options={{
                  minimap: { enabled: true },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  find: {
                    seedSearchStringFromSelection: 'selection',
                    autoFindInSelection: 'multiline'
                  },
                  quickSuggestions: true,
                  suggestOnTriggerCharacters: true,
                  acceptSuggestionOnEnter: 'on',
                  formatOnPaste: true,
                  formatOnType: true
                }}
                onChange={(value) => {
                  const updatedArtifacts = [...artifacts];
                  updatedArtifacts[activeTab] = { ...artifact, content: value };
                  setArtifacts(updatedArtifacts);
                }}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
              />

              {/* Floating Copy Button */}
              <button 
                onClick={handleCopyCode}
                className="absolute top-4 right-4 z-10 p-2 bg-[#1a1a1a]/90 backdrop-blur-md border border-white/10 rounded-lg text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                title="Copy code"
              >
                {codeCopied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>

        {/* Version History Panel */}
        <AnimatePresence>
          {showHistory && (
            <VersionHistory
              versions={versions}
              currentVersion={currentVersion}
              onRestore={restoreVersion}
              onClose={() => setShowHistory(false)}
              theme={theme}
            />
          )}
        </AnimatePresence>

        {/* Styles */}
        <style jsx>{`
          .perspective-1000 { perspective: 1000px; }
          .transform-style-3d { transform-style: preserve-3d; }
          .backface-hidden { backface-visibility: hidden; }
          .rotate-y-180 { transform: rotateY(180deg); }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
        `}</style>
      </motion.div>

      {/* Keyboard Shortcuts Overlay */}
      <AnimatePresence>
        {showShortcuts && (
          <KeyboardShortcuts
            isOpen={showShortcuts}
            onClose={() => setShowShortcuts(false)}
            theme={theme}
          />
        )}
      </AnimatePresence>
    </>
  );
};