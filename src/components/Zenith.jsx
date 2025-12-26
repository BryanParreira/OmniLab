import React, { useState, useEffect, useRef } from 'react';
import { useLumina } from '../context/LuminaContext';
import { 
  PenTool, Sparkles, Maximize, Minimize, Save, 
  AlignLeft, AlertTriangle, Brain,
  Wand2, Scissors, CheckCircle2, FolderPlus, ArrowRight,
  FileText, Download, Copy, ChevronDown,
  Zap, ListOrdered, BookOpen, Hash, Code2, Palette, Settings,
  Minus, Plus, RotateCcw, Layers,
  Clock, Target, TrendingUp, Activity, Flame, Wind, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- WRITING MODES ---
const WRITING_MODES = {
  freewrite: { 
    name: 'Freewrite', 
    icon: <Wind size={14}/>, 
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    description: 'Free-flowing creative writing',
    systemPrompt: 'Continue this text naturally and creatively with flowing prose.'
  },
  structured: { 
    name: 'Structured', 
    icon: <Layers size={14}/>, 
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    description: 'Organized with clear sections',
    systemPrompt: 'Continue this text following a logical, organized structure with clear sections.'
  },
  research: { 
    name: 'Research', 
    icon: <BookOpen size={14}/>, 
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    description: 'Academic & formal writing',
    systemPrompt: 'Continue this academic text with formal language, citations, and analytical depth.'
  },
  creative: { 
    name: 'Creative', 
    icon: <Flame size={14}/>, 
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    description: 'Vivid storytelling & narrative',
    systemPrompt: 'Continue this creative narrative with vivid descriptions, engaging dialogue, and compelling storytelling.'
  },
};

// --- EXPORT FORMATS ---
const EXPORT_FORMATS = [
  { id: 'md', name: 'Markdown', ext: '.md', icon: <Hash size={14}/>, color: 'text-blue-400' },
  { id: 'txt', name: 'Plain Text', ext: '.txt', icon: <FileText size={14}/>, color: 'text-gray-400' },
  { id: 'html', name: 'HTML', ext: '.html', icon: <Code2 size={14}/>, color: 'text-orange-400' },
];

// --- LENS ACTIONS ---
const LENS_ACTIONS = [
  { 
    id: 'expand', 
    label: 'Expand', 
    icon: <Wand2 size={16}/>, 
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    prompt: 'Expand this concept into a detailed, comprehensive paragraph with supporting details.'
  },
  { 
    id: 'simplify', 
    label: 'Simplify', 
    icon: <Scissors size={16}/>, 
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    prompt: 'Simplify this text to be more concise, clear, and easy to understand.'
  },
  { 
    id: 'fix', 
    label: 'Fix Grammar', 
    icon: <CheckCircle2 size={16}/>, 
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    prompt: 'Fix any grammar, spelling, punctuation, or syntax errors while preserving meaning.'
  },
  { 
    id: 'rephrase', 
    label: 'Rephrase', 
    icon: <Zap size={16}/>, 
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    prompt: 'Rephrase this in a more professional and polished tone.'
  },
];

export const Zenith = () => {
  const { theme, settings, updateSettings, activeProject, addCanvasNode } = useLumina();
  
  // --- STATE MANAGEMENT ---
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [writingMode, setWritingMode] = useState('freewrite');
  
  const [activeFilename, setActiveFilename] = useState(null); 

  // Stats
  const [stats, setStats] = useState({ 
    words: 0, 
    chars: 0,
    sentences: 0,
    paragraphs: 0,
    readTime: 0, 
    complexity: 'Neutral',
    avgWordsPerSentence: 0
  });
  
  // AI State
  const [ghostText, setGhostText] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  // Selection / Lens State
  const [selection, setSelection] = useState({ start: 0, end: 0, text: "" });
  const [showLens, setShowLens] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  
  const [saveStatus, setSaveStatus] = useState('saved');

  // UI State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [showStatsPanel, setShowStatsPanel] = useState(false);

  const textareaRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // --- LISTENER FOR SIDEBAR EVENTS ---
  useEffect(() => {
    const handleLoadFile = async (e) => {
        const { filename } = e.detail;
        try {
            const fileContent = await window.lumina.readFile(filename);
            if (isMounted.current) {
                setContent(fileContent);
                setActiveFilename(filename);
                setTitle(filename.replace(/\.(md|txt|html)$/, '').replace(/_/g, ' '));
                setGhostText("");
                setSaveStatus('saved');
            }
        } catch (err) {
            console.error("Failed to read file:", err);
        }
    };

    const handleNewFile = () => {
        if (isMounted.current) {
            setContent("");
            setTitle("");
            setActiveFilename(null);
            setGhostText("");
            setSaveStatus('saved');
            textareaRef.current?.focus();
        }
    };

    window.addEventListener('zenith-load-file', handleLoadFile);
    window.addEventListener('zenith-new-file', handleNewFile);

    return () => {
        window.removeEventListener('zenith-load-file', handleLoadFile);
        window.removeEventListener('zenith-new-file', handleNewFile);
    };
  }, []);

  // --- AUTO-SAVE INDICATOR ---
  useEffect(() => {
    if (content && saveStatus === 'saved') {
      setSaveStatus('unsaved');
    }
  }, [content, title]);

  // --- ENHANCED STATS ENGINE ---
  useEffect(() => {
    const text = content.trim();
    const words = text === '' ? 0 : text.split(/\s+/).length;
    const chars = content.length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
    const readTime = Math.max(1, Math.ceil(words / 200));
    
    const avgWordsPerSentence = sentences > 0 ? Math.round(words / sentences) : 0;
    
    let complexity = 'Neutral';
    if (avgWordsPerSentence > 25) complexity = 'Complex';
    else if (avgWordsPerSentence > 18) complexity = 'Academic';
    else if (avgWordsPerSentence < 10 && words > 20) complexity = 'Simple';
    else if (avgWordsPerSentence < 15) complexity = 'Clear';

    setStats({ words, chars, sentences, paragraphs, readTime, complexity, avgWordsPerSentence });
    
    // Auto-resize textarea
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; 
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  // --- ENHANCED GHOST WRITER WITH MODE-AWARE PROMPTING ---
  const triggerGhostWriter = async () => {
    if (isAiThinking || !content) return;
    setIsAiThinking(true);
    
    const context = content.slice(-1500);

    try {
        const systemPrompt = WRITING_MODES[writingMode].systemPrompt;
        const prompt = `[INST] ${systemPrompt} Do NOT repeat the input. [/INST]\n\n${context}`;

        const completion = await window.lumina.generateCompletion(
            prompt, 
            settings.defaultModel, 
            settings
        );

        if (!isMounted.current) return;

        if (completion) {
            let cleanText = completion;
            const lastChunk = context.slice(-50); 
            if (cleanText.startsWith(lastChunk)) {
                cleanText = cleanText.replace(lastChunk, "");
            }
            const contextEndsInPunctuation = /[.!?]$/.test(context);
            const completionStartsWithChar = /^\w/.test(cleanText);
            
            if (contextEndsInPunctuation && completionStartsWithChar) {
                 cleanText = " " + cleanText.trimStart();
            }

            setGhostText(cleanText.slice(0, 200));
        } else {
            setGhostText(" (No suggestion)");
        }
    } catch (error) {
        console.error("AI Error", error);
        if (isMounted.current) setGhostText(" (Connection Error)");
    } finally {
        if (isMounted.current) {
            setIsAiThinking(false);
            if (textareaRef.current) textareaRef.current.focus();
        }
    }
  };

  // --- ENHANCED LUMINA LENS ---
  const handleLensAction = async (action) => {
      setIsAiThinking(true);
      setShowLens(false);
      try {
          const prompt = `
            Task: ${action.prompt}
            Writing Mode: ${WRITING_MODES[writingMode].name}
            Input Text: "${selection.text}"
            Return JSON format: { "text": "The modified text here" }
          `;
          
          const result = await window.lumina.generateJson(prompt, settings.defaultModel, settings);
          
          if (isMounted.current && result && result.text) {
             const before = content.substring(0, selection.start);
             const after = content.substring(selection.end);
             setContent(before + result.text + after);
          }
      } catch (e) {
          console.error("Lens Error", e);
      } finally {
          if (isMounted.current) {
              setIsAiThinking(false);
              setSelection({ start: 0, end: 0, text: "" });
          }
      }
  };

  const handleSelect = (e) => {
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      if (start !== end) {
          setSelection({ start, end, text: content.substring(start, end) });
          
          // Calculate position for lens popup
          const rect = e.target.getBoundingClientRect();
          const scrollTop = e.target.scrollTop;
          const textBeforeSelection = content.substring(0, start);
          const lines = textBeforeSelection.split('\n').length;
          
          setLensPosition({
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY + (lines * 24) - scrollTop
          });
          
          setShowLens(true);
      } else {
          setShowLens(false);
      }
  };

  const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') { 
          e.preventDefault(); 
          triggerGhostWriter(); 
      }
      if (e.key === 'Tab' && ghostText) { 
          e.preventDefault(); 
          setContent(prev => prev + ghostText); 
          setGhostText(""); 
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
          e.preventDefault();
          handleSave();
      }
      if (e.key === 'Escape') { 
          setGhostText(""); 
          setShowLens(false); 
          setShowExportMenu(false);
          setShowModeSelector(false);
          setShowSettings(false);
          setShowStatsPanel(false);
          if (isFocusMode) setIsFocusMode(false);
      }
  };

  // --- FILE OPERATIONS ---
  const handleSave = async () => {
    if (!content.trim()) {
      showNotification('⚠️ Cannot save empty document', 'warning');
      return;
    }
    
    setSaveStatus('saving');

    let filenameToSave = activeFilename;

    if (!filenameToSave) {
        let baseFilename = "zenith-draft";
        if (title && title.trim().length > 0) {
            baseFilename = title.trim();
        } else {
            const firstLine = content.split('\n')[0].slice(0, 30);
            baseFilename = firstLine || "zenith-draft";
        }
        const safeFilename = baseFilename
            .replace(/[^a-z0-9\-_ ]/gi, '')
            .trim()
            .replace(/\s+/g, '_') || "zenith-draft";
        
        filenameToSave = `${safeFilename}.md`;
    }

    try {
        // Save the file
        await window.lumina.saveGeneratedFile(content, filenameToSave);
        
        // Store metadata
        const metadata = {
          title: title || filenameToSave.replace('.md', ''),
          filename: filenameToSave,
          wordCount: stats.words,
          lastModified: new Date().toISOString(),
          writingMode: writingMode
        };
        
        // Save metadata to a separate file
        await window.lumina.saveGeneratedFile(
          JSON.stringify(metadata, null, 2), 
          `${filenameToSave}.meta.json`
        );
        
        setActiveFilename(filenameToSave);
        setSaveStatus('saved');
        
        // Notify the sidebar to refresh
        window.dispatchEvent(new CustomEvent('zenith-file-saved', { 
          detail: { filename: filenameToSave, metadata } 
        }));
        
        showNotification(`✓ Saved as ${filenameToSave}`, 'success');
    } catch (e) {
        console.error("Save failed", e);
        setSaveStatus('unsaved');
        showNotification('❌ Failed to save', 'error');
    }
  };

  const saveToProject = async () => {
    if (!activeProject) {
      showNotification('⚠️ Please select a project first', 'warning');
      return;
    }
    
    if (!content.trim()) {
      showNotification('⚠️ Document is empty', 'warning');
      return;
    }

    setSaveStatus('saving');

    try {
      let baseFilename = title || content.split('\n')[0].slice(0, 20) || "document";
      const safeFilename = baseFilename
        .replace(/[^a-z0-9\-_ ]/gi, '')
        .trim()
        .replace(/\s+/g, '_') + '.md';

      await window.lumina.saveGeneratedFile(content, safeFilename);
      
      if (window.lumina.addFileToProject) {
        try {
          await window.lumina.addFileToProject(activeProject.id, safeFilename);
          window.dispatchEvent(new CustomEvent('project-files-updated'));
          showNotification(`✓ Saved to ${activeProject.name}`, 'success');
        } catch (err) {
          console.warn('Could not add to project files:', err);
        }
      }
      
      if (addCanvasNode && window.confirm('📊 Also create a Canvas node?')) {
        addCanvasNode('note', 500, 500, {
          title: title || 'Zenith Document',
          content: content.slice(0, 200) + (content.length > 200 ? '...' : '')
        });
      }

      setSaveStatus('saved');
      setActiveFilename(safeFilename);
    } catch (e) {
      console.error("Save to project failed:", e);
      setSaveStatus('unsaved');
      showNotification(`❌ Failed to save: ${e.message}`, 'error');
    }
  };

  // --- NOTIFICATION HELPER ---
  const showNotification = (message, type = 'info') => {
    const colors = {
      success: 'bg-green-500/10 border-green-500/30 text-green-400',
      error: 'bg-red-500/10 border-red-500/30 text-red-400',
      warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    };
    
    const notification = document.createElement('div');
    notification.className = `fixed top-6 right-6 ${colors[type]} px-4 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-2 backdrop-blur-xl border`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  // --- EXPORT HANDLER ---
  const handleExport = async (format) => {
    setShowExportMenu(false);
    
    let exportContent = content;
    let filename = (title || 'zenith-export').replace(/[^a-z0-9\-_ ]/gi, '').trim().replace(/\s+/g, '_');

    if (format.id === 'html') {
      exportContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title || 'Document'}</title>
  <style>
    body { 
      font-family: 'Georgia', serif; 
      max-width: 800px; 
      margin: 60px auto; 
      padding: 40px; 
      line-height: 1.8; 
      color: #333; 
      background: #fafafa;
    }
    h1 { 
      font-size: 2.5em; 
      margin-bottom: 0.5em; 
      color: #111;
      border-bottom: 3px solid #333;
      padding-bottom: 0.3em;
    }
    p { 
      margin: 1.5em 0; 
      text-align: justify;
    }
  </style>
</head>
<body>
  <h1>${title || 'Untitled'}</h1>
  ${content.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('\n')}
</body>
</html>`;
    }

    try {
      await window.lumina.saveGeneratedFile(exportContent, filename + format.ext);
      showNotification(`✓ Exported as ${format.name}`, 'success');
    } catch (e) {
      console.error("Export failed", e);
      showNotification('❌ Export failed', 'error');
    }
  };

  // --- COPY TO CLIPBOARD ---
  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    showNotification('📋 Copied to clipboard', 'info');
  };

  // --- SAFEGUARDS ---
  if (!settings || !theme) return null;

  if (settings.developerMode) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden bg-[#030304]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 flex flex-col items-center text-center max-w-md p-8 rounded-3xl bg-gradient-to-br from-[#0A0A0A] to-[#111] backdrop-blur-xl border border-white/10 shadow-2xl relative"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center mb-6">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Protocol Restriction</h2>
          <p className="text-sm text-gray-400 mb-8 leading-relaxed">Zenith Creative Suite is disabled in <strong className="text-red-400">Forge Mode</strong>.</p>
          <button 
              onClick={() => updateSettings({ developerMode: false })}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg"
            >
              <Brain size={14} /> Switch to Nexus Mode
            </button>
        </motion.div>
      </div>
    );
  }

  const currentMode = WRITING_MODES[writingMode];

  return (
    <div className={`flex-1 h-full flex flex-col transition-all duration-700 relative z-10 ${isFocusMode ? 'bg-[#000000]' : 'bg-[#030304]'}`}>
      
      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: isFocusMode ? 0 : 1, y: isFocusMode ? -20 : 0, pointerEvents: isFocusMode ? 'none' : 'auto' }}
        className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A] to-transparent backdrop-blur-xl shrink-0 z-20"
      >
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${theme.softBg} ${theme.accentText} transition-all hover:scale-105 shadow-lg`}>
                    <PenTool size={18} />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">Zenith Creative Suite</span>
                    <span className="text-[10px] text-gray-500">
                      {activeFilename ? activeFilename : activeProject ? activeProject.name : 'Independent Writing Space'}
                    </span>
                </div>
            </div>

            {/* Writing Mode Selector */}
            <div className="relative">
              <button
                onClick={() => setShowModeSelector(!showModeSelector)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl ${currentMode.bg} border ${currentMode.border} transition-all hover:brightness-110 shadow-lg`}
              >
                <span className={currentMode.color}>{currentMode.icon}</span>
                <span className="text-xs font-bold text-white">{currentMode.name}</span>
                <ChevronDown size={12} className={`text-gray-500 transition-transform ${showModeSelector ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showModeSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-14 left-0 w-72 bg-[#0a0a0a] border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
                  >
                    <div className="p-3 bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Writing Modes</h3>
                    </div>
                    <div className="p-2">
                      {Object.entries(WRITING_MODES).map(([key, mode]) => (
                        <button
                          key={key}
                          onClick={() => { setWritingMode(key); setShowModeSelector(false); }}
                          className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl transition-all group ${
                            writingMode === key 
                              ? `${mode.bg} border ${mode.border}` 
                              : 'hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${mode.bg} group-hover:scale-110 transition-transform`}>
                            <span className={mode.color}>{mode.icon}</span>
                          </div>
                          <div className="flex-1 text-left">
                            <div className="text-sm font-bold text-white">{mode.name}</div>
                            <div className="text-xs text-gray-500 leading-relaxed">{mode.description}</div>
                          </div>
                          {writingMode === key && <CheckCircle2 size={16} className={mode.color} />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


        </div>

        <div className="flex items-center gap-3">
            {/* Save Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111] border border-white/10 text-[10px] font-mono">
              {saveStatus === 'saving' ? (
                <>
                  <Sparkles size={10} className="animate-spin text-blue-400" /> 
                  <span className="text-gray-400">Saving...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircle2 size={10} className="text-green-400" /> 
                  <span className="text-gray-600">Saved</span>
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
                  <span className="text-amber-400">Unsaved</span>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              {/* Settings */}
              <div className="relative">
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                    title="Editor Settings"
                >
                    <Settings size={14} />
                </button>

                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-12 right-0 w-64 bg-[#0a0a0a] border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
                    >
                      <div className="p-3 bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Editor Settings</h3>
                      </div>
                      <div className="p-3 space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400">Font Size</span>
                            <span className="text-xs text-white font-mono">{fontSize}px</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
                            >
                              <Minus size={12}/>
                            </button>
                            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${((fontSize - 14) / (32 - 14)) * 100}%` }}
                              ></div>
                            </div>
                            <button 
                              onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
                            >
                              <Plus size={12}/>
                            </button>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400">Line Height</span>
                            <span className="text-xs text-white font-mono">{lineHeight.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setLineHeight(Math.max(1.2, lineHeight - 0.2))}
                              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
                            >
                              <Minus size={12}/>
                            </button>
                            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500 transition-all"
                                style={{ width: `${((lineHeight - 1.2) / (2.4 - 1.2)) * 100}%` }}
                              ></div>
                            </div>
                            <button 
                              onClick={() => setLineHeight(Math.min(2.4, lineHeight + 0.2))}
                              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
                            >
                              <Plus size={12}/>
                            </button>
                          </div>
                        </div>
                        <button 
                          onClick={() => { setFontSize(20); setLineHeight(1.8); }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all"
                        >
                          <RotateCcw size={12}/> Reset to Default
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Stats Button */}
              <button 
                  onClick={() => setShowStatsPanel(!showStatsPanel)}
                  className={`p-2 rounded-lg transition-all ${
                    showStatsPanel ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-gray-400 hover:text-white'
                  }`}
                  title="View Statistics"
              >
                  <Activity size={14} />
              </button>

              {/* Export Menu */}
              <div className="relative">
                <button 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                    title="Export"
                >
                    <Download size={14} />
                </button>

                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-12 right-0 w-48 bg-[#0a0a0a] border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
                    >
                      <div className="p-3 bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Export As</h3>
                      </div>
                      <div className="p-2">
                        {EXPORT_FORMATS.map(format => (
                          <button
                            key={format.id}
                            onClick={() => handleExport(format)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white text-xs transition-all group"
                          >
                            <span className={format.color}>{format.icon}</span>
                            <span className="flex-1 text-left font-medium">{format.name}</span>
                            <span className="text-gray-600 text-[10px] font-mono">{format.ext}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                  title="Copy to Clipboard"
              >
                  <Copy size={14} />
              </button>

              <div className="w-px h-6 bg-white/10"></div>

              <button 
                  onClick={handleSave}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${theme.primaryBg} text-white hover:brightness-110`}
              >
                  <Save size={12} /> Save
              </button>

              {activeProject && (
                <button 
                    onClick={saveToProject}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-white transition-all flex items-center gap-2 hover:scale-105"
                >
                    <FolderPlus size={12} /> To Project
                </button>
              )}

              <button 
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className={`p-2 rounded-lg transition-all ${
                    isFocusMode ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-gray-400 hover:text-white'
                  }`}
                  title={isFocusMode ? "Exit Focus Mode (ESC)" : "Enter Focus Mode"}
              >
                  {isFocusMode ? <Minimize size={14} /> : <Maximize size={14} />}
              </button>
            </div>
        </div>
      </motion.div>

      {/* FLOATING STATS PANEL */}
      <AnimatePresence>
        {showStatsPanel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="fixed top-20 right-8 w-72 bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
          >
            <div className="p-4 bg-gradient-to-r from-white/5 to-transparent border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Document Statistics</h3>
              </div>
              <button 
                onClick={() => setShowStatsPanel(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
              >
                <X size={12}/>
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <AlignLeft size={12}/> Words
                </div>
                <div className="text-xl font-bold text-white">{stats.words}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Activity size={12}/> Sentences
                </div>
                <div className="text-xl font-bold text-white">{stats.sentences}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Layers size={12}/> Paragraphs
                </div>
                <div className="text-xl font-bold text-white">{stats.paragraphs}</div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock size={12}/> Reading Time
                </div>
                <div className="text-sm font-mono text-gray-400">{stats.readTime} min</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Brain size={12}/> Complexity
                </div>
                <div className={`text-sm font-bold px-2 py-1 rounded-lg ${
                  stats.complexity === 'Complex' ? 'bg-red-500/10 text-red-400' :
                  stats.complexity === 'Academic' ? 'bg-purple-500/10 text-purple-400' : 
                  stats.complexity === 'Clear' ? 'bg-green-500/10 text-green-400' :
                  stats.complexity === 'Simple' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'
                }`}>
                  {stats.complexity}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDITOR AREA */}
      <div className="flex-1 overflow-hidden relative flex z-10">
        <div className="w-full overflow-y-auto custom-scrollbar relative flex justify-center">
          <div className={`w-full max-w-4xl transition-all duration-700 ease-in-out ${
            isFocusMode ? 'py-32 px-16' : 'py-16 px-12'
          }`}>
            
            {/* Title Input */}
            <motion.input
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Untitled Masterpiece"
              style={{ fontSize: `${fontSize * 2}px` }}
              className="w-full bg-transparent font-bold text-white placeholder-gray-800 outline-none mb-8 tracking-tight leading-tight transition-all"
              autoComplete="off"
            />

            {/* Content Editor */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative font-serif text-gray-300 transition-all"
              onClick={() => textareaRef.current?.focus()}
              style={{ 
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight
              }}
            >
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => { setContent(e.target.value); setGhostText(""); }}
                onKeyDown={handleKeyDown}
                onSelect={handleSelect}
                placeholder="Start writing... (Press ⌘J for AI suggestions)"
                className="w-full min-h-[60vh] bg-transparent outline-none resize-none placeholder-gray-800 focus:placeholder-gray-700 caret-blue-500 overflow-hidden selection:bg-blue-500/20"
                spellCheck={false}
                autoComplete="off"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* --- AI OVERLAYS --- */}
      <AnimatePresence>
          {/* GHOST WRITER BUBBLE */}
          {(ghostText || isAiThinking) && !showLens && (
              <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 10 }}
                  className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/20 shadow-2xl backdrop-blur-xl z-50 max-w-3xl"
              >
                  {isAiThinking ? (
                      <div className="flex items-center gap-3">
                          <Sparkles size={20} className="text-blue-400 animate-spin" />
                          <span className="text-sm font-medium text-white">AI is crafting suggestions...</span>
                      </div>
                  ) : (
                      <>
                          <div className="flex flex-col flex-1 max-w-2xl">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={14} className="text-blue-400" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ghost Writer</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full ${currentMode.bg} ${currentMode.color} border ${currentMode.border}`}>
                                  {currentMode.name}
                                </span>
                              </div>
                              <span className="text-sm text-white italic font-serif leading-relaxed">"{ghostText.trim()}"</span>
                          </div>
                          <div className="h-12 w-px bg-white/10"></div>
                          <div className="flex flex-col gap-2 text-[10px] font-mono text-gray-500">
                              <div className="flex items-center gap-2">
                                <kbd className="bg-white/10 px-2 py-1 rounded text-gray-300 font-bold">TAB</kbd> 
                                <span>Accept</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <kbd className="bg-white/10 px-2 py-1 rounded text-gray-300 font-bold">ESC</kbd> 
                                <span>Dismiss</span>
                              </div>
                          </div>
                      </>
                  )}
              </motion.div>
          )}

          {/* ENHANCED LUMINA LENS */}
          {showLens && (
              <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed bottom-24 left-1/2 -translate-x-1/2 flex flex-col rounded-2xl bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/20 shadow-2xl z-50 w-[420px] overflow-hidden backdrop-blur-xl"
              >
                  <div className="px-5 py-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-b border-white/10 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-blue-400"/>
                        <span className="text-sm font-bold text-white">Lumina Lens</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-mono bg-black/30 px-2 py-1 rounded-lg">
                          {selection.text.split(' ').length} words
                        </span>
                        <button 
                          onClick={() => setShowLens(false)}
                          className="p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                        >
                          <X size={12}/>
                        </button>
                      </div>
                  </div>
                  <div className="p-3 flex flex-col gap-2">
                    {LENS_ACTIONS.map((action) => (
                      <button 
                        key={action.id}
                        onClick={() => handleLensAction(action)} 
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:${action.bg} text-gray-300 hover:text-white text-sm transition-all group border border-transparent hover:${action.border}`}
                      >
                          <div className={`p-2 rounded-lg ${action.bg} group-hover:scale-110 transition-transform`}>
                            <span className={action.color}>{action.icon}</span>
                          </div>
                          <span className="flex-1 text-left font-medium">{action.label}</span>
                          <ArrowRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${action.color}`}/>
                      </button>
                    ))}
                  </div>
                  <div className="px-5 py-3 bg-gradient-to-r from-white/5 to-transparent border-t border-white/10">
                    <p className="text-[10px] text-gray-600 italic">Select text to apply AI transformations</p>
                  </div>
              </motion.div>
          )}

          {/* AI THINKING OVERLAY */}
          {isAiThinking && showLens && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-[#0a0a0a] border border-white/20 shadow-2xl">
                <Sparkles size={32} className="text-blue-400 animate-spin" />
                <span className="text-sm font-medium text-white">Processing your request...</span>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* GHOST WRITER TRIGGER BUTTON (Focus Mode) */}
      {isFocusMode && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={triggerGhostWriter}
          disabled={isAiThinking}
          className={`fixed bottom-10 right-10 p-4 rounded-full ${theme.primaryBg} text-white shadow-2xl hover:scale-110 transition-all z-50 disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Trigger Ghost Writer (⌘J)"
        >
          <Sparkles size={20} className={isAiThinking ? 'animate-spin' : ''} />
        </motion.button>
      )}
    </div>
  );
};

Zenith.displayName = 'Zenith';