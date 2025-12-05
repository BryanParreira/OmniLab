import React, { useState, useEffect, useRef } from 'react';
import { useLumina } from '../context/LuminaContext';
import { 
  PenTool, Sparkles, Maximize, Minimize, Save, 
  AlignLeft, Clock, AlertTriangle, Brain,
  Wand2, Scissors, CheckCircle2, FolderPlus, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Zenith = () => {
  const { theme, settings, updateSettings, activeProject, addCanvasNode } = useLumina();
  
  // --- STATE MANAGEMENT ---
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  // Track the active file so we save to the right place
  const [activeFilename, setActiveFilename] = useState(null); 

  // Stats
  const [stats, setStats] = useState({ words: 0, readTime: 0, complexity: 'Neutral' });
  
  // AI State
  const [ghostText, setGhostText] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  // Selection / Lens State
  const [selection, setSelection] = useState({ start: 0, end: 0, text: "" });
  const [showLens, setShowLens] = useState(false);
  
  // Save state
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved'

  const textareaRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // --- LISTENER FOR SIDEBAR EVENTS ---
  useEffect(() => {
    // 1. Load File Event (triggered by Sidebar)
    const handleLoadFile = async (e) => {
        const { filename } = e.detail;
        try {
            const fileContent = await window.lumina.readFile(filename);
            if (isMounted.current) {
                setContent(fileContent);
                setActiveFilename(filename);
                // Simple title extraction
                setTitle(filename.replace(/\.(md|txt)$/, '').replace(/_/g, ' '));
                setGhostText("");
                setSaveStatus('saved');
            }
        } catch (err) {
            console.error("Failed to read file:", err);
        }
    };

    // 2. New File Event (triggered by Sidebar)
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
  }, [content]);

  // --- STATS ENGINE & AUTO-RESIZE ---
  useEffect(() => {
    const text = content.trim();
    const words = text === '' ? 0 : text.split(/\s+/).length;
    const readTime = Math.ceil(words / 200);
    
    // Cognitive Load Analysis
    const sentences = text.split(/[.!?]+/).length;
    const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;
    
    let complexity = 'Neutral';
    if (avgWordsPerSentence > 20) complexity = 'Academic';
    if (avgWordsPerSentence < 8 && words > 10) complexity = 'Simple';

    setStats({ words, readTime, complexity });
    
    // Auto-resize textarea
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; 
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  // --- ACTIONS ---

  // 1. REAL GHOST WRITER
  const triggerGhostWriter = async () => {
    if (isAiThinking || !content) return;
    setIsAiThinking(true);
    
    const context = content.slice(-1000);

    try {
        const prompt = `[INST] You are a text completion engine. Continue the following text naturally. Do NOT repeat the input. Do NOT output any conversational filler. [/INST]
        
        ${context}`;

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

            setGhostText(cleanText);
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

  // 2. Lumina Lens
  const handleLensAction = async (action) => {
      setIsAiThinking(true);
      setShowLens(false);
      try {
          const prompt = `
            Task: ${action}
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
      if (e.key === 'Escape') { 
          setGhostText(""); 
          setShowLens(false); 
          setIsFocusMode(false); 
      }
  };

  // 3. NATIVE FILE SAVE
  const handleSave = async () => {
    if (!content.trim()) return;
    setSaveStatus('saving');

    let filenameToSave = activeFilename;

    // If no active file, generate a new filename based on title or content
    if (!filenameToSave) {
        let baseFilename = "zenith-draft";
        if (title && title.trim().length > 0) {
            baseFilename = title.trim();
        } else {
            baseFilename = content.split('\n')[0].slice(0, 20);
        }
        const safeFilename = baseFilename
            .replace(/[^a-z0-9\-_ ]/gi, '')
            .trim()
            .replace(/\s+/g, '_') || "zenith-draft";
        
        filenameToSave = `${safeFilename}.md`;
    }

    try {
        await window.lumina.saveGeneratedFile(content, filenameToSave);
        setActiveFilename(filenameToSave);
        setSaveStatus('saved');
        // Dispatch event to tell Sidebar to refresh the file list
        window.dispatchEvent(new CustomEvent('zenith-file-saved'));
    } catch (e) {
        console.error("Save failed", e);
        setSaveStatus('unsaved');
    }
  };

  // 4. NEW: SAVE TO PROJECT
  const saveToProject = async () => {
    if (!activeProject) {
      alert('⚠️ Please select a project first from the sidebar');
      return;
    }
    
    if (!content.trim()) {
      alert('⚠️ Document is empty');
      return;
    }

    setSaveStatus('saving');

    try {
      // Generate filename
      let baseFilename = title || content.split('\n')[0].slice(0, 20) || "document";
      const safeFilename = baseFilename
        .replace(/[^a-z0-9\-_ ]/gi, '')
        .trim()
        .replace(/\s+/g, '_') + '.md';

      // Save to file system first
      await window.lumina.saveGeneratedFile(content, safeFilename);
      
      // Add to project files if method exists
      if (window.lumina.addFileToProject) {
        try {
          await window.lumina.addFileToProject(activeProject.id, safeFilename);
          
          // Refresh project files
          window.dispatchEvent(new CustomEvent('project-files-updated'));
          
          alert(`✅ Document saved to project: ${activeProject.name}`);
        } catch (err) {
          console.warn('Could not add to project files:', err);
          alert(`⚠️ File saved but not added to project.\nAdd this method to your backend:\nwindow.lumina.addFileToProject`);
        }
      } else {
        alert(`⚠️ File saved but backend method missing.\n\nTo complete this feature, add:\nwindow.lumina.addFileToProject(projectId, filename)\n\nSee COMPLETE_GUIDE.md for details.`);
      }
      
      // Optional: Create a Canvas node if addCanvasNode exists
      if (addCanvasNode && window.confirm('📊 Also create a Canvas node for this document?')) {
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
      alert(`❌ Failed to save: ${e.message}`);
    }
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
          className="z-10 flex flex-col items-center text-center max-w-md p-8 rounded-3xl bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/5 shadow-2xl relative"
        >
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Protocol Restriction</h2>
          <p className="text-sm text-gray-400 mb-8">Zenith Creative Suite is disabled in <strong className="text-red-400">Forge Mode</strong>.</p>
          <button 
              onClick={() => updateSettings({ developerMode: false })}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Brain size={14} /> Switch to Nexus Mode
            </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex-1 h-full flex flex-col transition-colors duration-700 relative z-10 ${isFocusMode ? 'bg-[#000000]' : 'bg-transparent'}`}>
      
      {/* HEADER - Hides in Focus Mode */}
      <motion.div 
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: isFocusMode ? 0 : 1, y: isFocusMode ? -20 : 0 }}
        className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0A0A0A]/80 backdrop-blur-xl shrink-0 z-20"
      >
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${theme.softBg} ${theme.accentText} transition-colors`}>
                <PenTool size={16} />
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-bold text-white uppercase tracking-widest">Zenith</span>
                <span className="text-[10px] text-gray-500">
                  {activeProject ? `Project: ${activeProject.name}` : 'Nexus Mode'}
                </span>
            </div>
        </div>

        <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500">
                <span className="flex items-center gap-1.5"><AlignLeft size={12}/> {stats.words} words</span>
                <span className="w-px h-3 bg-white/10"></span>
                <span className={`flex items-center gap-1.5 ${
                    stats.complexity === 'Academic' ? 'text-purple-400' : 
                    stats.complexity === 'Simple' ? 'text-green-400' : 'text-blue-400'
                }`}>
                    <Brain size={12}/> {stats.complexity}
                </span>
            </div>

            {/* Save Status Indicator */}
            <div className="flex items-center gap-2 text-[10px] font-mono">
              {saveStatus === 'saving' ? (
                <><Sparkles size={12} className="animate-spin text-blue-400" /> <span className="text-gray-400">Saving...</span></>
              ) : saveStatus === 'saved' ? (
                <><CheckCircle2 size={12} className="text-green-400" /> <span className="text-gray-600">Saved</span></>
              ) : (
                <span className="text-amber-400">Unsaved</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button 
                  onClick={handleSave}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${theme.primaryBg} text-white hover:brightness-110`}
              >
                  <Save size={12} /> Save
              </button>

              {/* NEW: Save to Project Button */}
              {activeProject && (
                <button 
                    onClick={saveToProject}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-white transition-all flex items-center gap-1.5"
                >
                    <FolderPlus size={12} /> To Project
                </button>
              )}

              <button 
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Toggle Focus Mode"
              >
                  {isFocusMode ? <Minimize size={14} /> : <Maximize size={14} />}
              </button>
            </div>
        </div>
      </motion.div>

      {/* EDITOR AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative flex justify-center z-10" onClick={() => textareaRef.current?.focus()}>
         <div className={`w-full max-w-3xl transition-all duration-700 ease-in-out ${isFocusMode ? 'py-40' : 'py-16'} px-12`}>
             
             {/* Title Input */}
             <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled Masterpiece"
                className="w-full bg-transparent text-5xl font-bold text-white placeholder-gray-800 outline-none mb-8 tracking-tight"
             />

             <div className="relative font-serif text-xl leading-loose text-gray-300">
                {/* Main Textarea */}
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => { setContent(e.target.value); setGhostText(""); }}
                    onKeyDown={handleKeyDown}
                    onSelect={handleSelect}
                    placeholder="Start writing... (Press Cmd+J for AI)"
                    className="w-full min-h-[60vh] bg-transparent outline-none resize-none placeholder-gray-800 focus:placeholder-gray-700 caret-blue-500 overflow-hidden"
                    spellCheck={false}
                />
             </div>
         </div>
      </div>

      {/* --- AI OVERLAYS --- */}
      <AnimatePresence>
          {/* 1. GHOST WRITER BUBBLE */}
          {(ghostText || isAiThinking) && !showLens && (
              <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 p-4 rounded-2xl bg-[#0F0F0F]/90 border border-white/10 shadow-2xl backdrop-blur-xl z-50"
              >
                  {isAiThinking ? (
                      <div className="flex items-center gap-3">
                          <Sparkles size={16} className="text-blue-400 animate-spin" />
                          <span className="text-xs font-bold text-white">Lumina is crafting...</span>
                      </div>
                  ) : (
                      <>
                          <div className="flex flex-col max-w-md">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Ghost Writer</span>
                              <span className="text-sm text-white italic font-serif">"...{ghostText}"</span>
                          </div>
                          <div className="h-6 w-px bg-white/10 mx-2"></div>
                          <div className="flex gap-2 text-[9px] font-mono text-gray-500">
                              <span className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300">TAB</span> to accept
                          </div>
                      </>
                  )}
              </motion.div>
          )}

          {/* 2. LUMINA LENS (Actions) */}
          {showLens && (
              <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed bottom-24 left-1/2 -translate-x-1/2 flex flex-col p-1 rounded-xl bg-[#1A1A1A] border border-white/20 shadow-2xl z-50 w-72"
              >
                  <div className="px-3 py-2 border-b border-white/5 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1"><Sparkles size={10}/> Lumina Lens</span>
                      <span className="text-[9px] text-gray-500">{selection.text.length} chars</span>
                  </div>
                  <div className="p-1 flex flex-col gap-0.5">
                    <button onClick={() => handleLensAction('Expand this concept into a paragraph')} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white text-xs transition-colors text-left group">
                        <Wand2 size={14} className="text-purple-400 group-hover:scale-110 transition-transform"/> Expand Concept
                    </button>
                    <button onClick={() => handleLensAction('Simplify this text to be more concise')} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white text-xs transition-colors text-left group">
                        <Scissors size={14} className="text-amber-400 group-hover:scale-110 transition-transform"/> Simplify Text
                    </button>
                    <button onClick={() => handleLensAction('Fix any grammar errors')} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white text-xs transition-colors text-left group">
                        <CheckCircle2 size={14} className="text-green-400 group-hover:scale-110 transition-transform"/> Fix Grammar
                    </button>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

    </div>
  );
};