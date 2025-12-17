import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, X, ArrowUp, User, StopCircle, Download, Check, Info, Code2, Eye, Sparkles,
  FlaskConical, PenTool, BrainCircuit, GraduationCap, ShieldAlert, Zap, BookOpen, Layers,
  Image as ImageIcon, File as FileIcon, Paperclip, WifiOff, History, TrendingUp
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; 
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import clsx from 'clsx'; 
import { useLumina } from '../context/LuminaContext';
import { LabBench } from './LabBench';
import { ContextBreadcrumbs } from './ContextBreadcrumbs';

const COMMAND_REGISTRY = {
  '/explain_simple': "Explain this simply for a beginner.",
  '/quiz': "Create a short, interactive quiz.",
  '/study': "Create a comprehensive study guide.",
  '/outline': "Create a detailed essay outline.",
  '/review': "Perform a Senior Code Review.",
  '/audit': "Perform a Security Audit.",
  '/test': "Generate a Unit Test suite.",
  '/refactor': "Refactor this code to be cleaner."
};

const useSmoothStream = (content, isStreaming) => {
  const [displayContent, setDisplayContent] = useState(content);
  const lastUpdateRef = useRef(Date.now());

  useEffect(() => {
    if (!isStreaming) {
      setDisplayContent(content);
      return;
    }

    const now = Date.now();
    if (now - lastUpdateRef.current > 30) {
      setDisplayContent(content);
      lastUpdateRef.current = now;
    } else {
      const handler = setTimeout(() => {
        setDisplayContent(content);
        lastUpdateRef.current = Date.now();
      }, 30);
      return () => clearTimeout(handler);
    }
  }, [content, isStreaming]);

  return displayContent;
};

const ThinkingIndicator = ({ theme }) => (
  <div className="flex items-center gap-3 py-1 pl-1 animate-in fade-in duration-300">
    <div className={`p-1.5 rounded-lg ${theme.softBg} border ${theme.primaryBorder} flex items-center justify-center`}>
      <Sparkles size={14} className={`${theme.accentText} animate-pulse`} /> 
    </div>
    <div className="flex flex-col justify-center h-full gap-1">
      <span className={`text-[10px] font-bold tracking-wider uppercase ${theme.accentText} opacity-70`}>
        Processing
      </span>
      <div className="flex gap-1">
        <div className={`w-1 h-1 rounded-full ${theme.primaryBg} animate-bounce [animation-delay:-0.3s]`} />
        <div className={`w-1 h-1 rounded-full ${theme.primaryBg} animate-bounce [animation-delay:-0.15s]`} />
        <div className={`w-1 h-1 rounded-full ${theme.primaryBg} animate-bounce`} />
      </div>
    </div>
  </div>
);

const AttachmentPreview = ({ file, onRemove }) => {
  const isImage = file.type.startsWith('image/');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (isImage && file instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  }, [file, isImage]);

  return (
    <div className="relative inline-block mr-2 mb-2 group">
      {isImage && preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt={file.name} 
            className="w-20 h-20 object-cover rounded-lg border border-white/20"
          />
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={12} className="text-white" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1 py-0.5 truncate rounded-b-lg">
            {file.name}
          </div>
        </div>
      ) : (
        <div className="relative flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/20 rounded-lg">
          <FileIcon size={16} className="text-gray-400" />
          <span className="text-xs text-gray-300 max-w-[100px] truncate">{file.name}</span>
          <button onClick={onRemove} className="ml-2 p-0.5 hover:bg-white/10 rounded">
            <X size={12} className="text-gray-400" />
          </button>
        </div>
      )}
    </div>
  );
};

const CodeBlock = React.memo(({ language, children }) => {
  const { openLabBench, theme } = useLumina();
  const [isSaved, setIsSaved] = useState(false);
  
  const rawCode = String(children).replace(/\n$/, '');
  
  const handleSave = useCallback(async () => { 
    if (window.lumina) { 
      const ext = language === 'javascript' ? 'js' : language === 'python' ? 'py' : 'txt'; 
      const success = await window.lumina.saveGeneratedFile(children, `code.${ext}`); 
      if (success) { 
        setIsSaved(true); 
        setTimeout(() => setIsSaved(false), 2000); 
      } 
    } 
  }, [children, language]);

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 my-6 bg-[#080808] shadow-2xl ring-1 ring-white/5 group">
      <div className="bg-[#111] px-4 py-2 text-[10px] text-gray-400 font-mono border-b border-white/5 flex justify-between items-center">
        <span className="uppercase tracking-wider font-bold text-gray-500">{language}</span>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => openLabBench(rawCode, language)}
            className={`flex items-center gap-1.5 ${theme.accentText} hover:bg-white/5 px-2 py-1 rounded transition-colors`}
          >
            <FlaskConical size={12} /> Open in Lab
          </button>
          <button onClick={handleSave} className="flex items-center gap-1.5 hover:text-white transition-colors hover:bg-white/5 px-2 py-1 rounded">
            {isSaved ? <Check size={12} className="text-emerald-500" /> : <Download size={12} />} 
          </button>
        </div>
      </div>
      <SyntaxHighlighter children={rawCode} style={vscDarkPlus} language={language} PreTag="div" customStyle={{ margin: 0, background: 'transparent', fontSize: '13px', padding: '1.5rem', lineHeight: '1.6' }} />
    </div>
  );
});

const Callout = ({ children, theme }) => (
  <div className={`my-6 border-l-2 ${theme.primaryBorder} ${theme.softBg} p-5 rounded-r-2xl text-gray-300 text-sm flex gap-4 shadow-sm`}>
    <Info size={20} className={`${theme.accentText} shrink-0 mt-0.5`} />
    <div className="prose prose-invert prose-sm max-w-none leading-relaxed">{children}</div>
  </div>
);

const ContextHistoryViewer = ({ contexts, isOpen, onClose, theme }) => {
  if (!isOpen || !contexts || contexts.length === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div className="bg-[#0A0A0A] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${theme.softBg}`}>
                <History size={20} className={theme.accentText} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Context Used in Last Response</h3>
                <p className="text-xs text-gray-500 mt-1">{contexts.length} sources • Showing what the AI referenced</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3 custom-scrollbar">
          {contexts.map((ctx, idx) => (
            <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${theme.softBg} ${theme.accentText} font-bold uppercase`}>
                    {ctx.source}
                  </span>
                  <span className="text-xs text-gray-600">
                    {ctx.metadata?.filename || ctx.metadata?.title || 'Untitled'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp size={12} className="text-green-400" />
                  <span className="text-green-400 font-bold">{Math.round(ctx.relevance || 0)}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-3 leading-relaxed">{ctx.content}</p>
              {ctx.explanation && (
                <div className="flex items-start gap-2 p-2 bg-black/30 rounded-lg">
                  <Info size={12} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-[10px] text-gray-500">{ctx.explanation}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const MessageBubble = React.memo(({ msg, theme, fontSize, isStreaming, contextUsed, onShowContext }) => {
  const smoothContent = useSmoothStream(msg.content, isStreaming);

  const mainContent = React.useMemo(() => {
    let content = smoothContent.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
    content = content.replace(/<thinking>[\s\S]*$/gi, '');
    return content;
  }, [smoothContent]);
  
  const isUser = msg.role === 'user';
  const rawIsEmpty = !msg.content || msg.content.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim() === '';
  const showThinking = !isUser && isStreaming && rawIsEmpty;

  if (rawIsEmpty && !showThinking) return null;

  const markdownComponents = React.useMemo(() => ({
    code({node, inline, className, children, ...props}) { 
      const match = /language-(\w+)/.exec(className || ''); 
      return !inline && match ? <CodeBlock language={match[1]} children={children} /> : <code {...props} className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-[0.9em] border border-white/5 mx-1">{children}</code>;
    },
    blockquote: ({children}) => <Callout theme={theme}>{children}</Callout>,
    table: ({children}) => <div className="overflow-x-auto my-6 border border-white/10 rounded-2xl"><table className="w-full text-left text-sm">{children}</table></div>,
    th: ({children}) => <th className="bg-[#111] p-4 font-semibold border-b border-white/10 text-gray-200">{children}</th>,
    td: ({children}) => <td className="p-4 border-b border-white/5 text-gray-400">{children}</td>,
    a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className={`${theme.accentText} hover:underline underline-offset-4`}>{children}</a>
  }), [theme]);

  return (
    <div className={clsx("flex gap-6 group animate-fade-in mb-8", isUser ? "flex-row-reverse" : "")}>
      <div className={clsx("w-9 h-9 shrink-0 rounded-xl flex items-center justify-center shadow-lg border overflow-hidden", isUser ? "bg-white text-black border-white" : `bg-gradient-to-br ${theme.gradient} text-white border-white/10`)}>
        {isUser ? <User size={18} /> : <Brain size={18} className="text-white/90" />}
      </div>

      <div className={clsx("flex-1 min-w-0 max-w-3xl", isUser ? "flex flex-col items-end" : "")}>
        <div className={clsx("flex items-center gap-2 mb-2", isUser ? "justify-end" : "")}>
          <span className="text-xs font-semibold text-white/80">{isUser ? 'You' : 'Brainless'}</span>
          {!isUser && <span className={`text-[9px] ${theme.softBg} ${theme.accentText} px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-wider font-bold`}>AI</span>}
          
          {!isUser && contextUsed && contextUsed.length > 0 && (
            <button onClick={onShowContext} className="flex items-center gap-1 text-[9px] px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-gray-400 hover:text-white transition-colors">
              <History size={10} />
              <span>{contextUsed.length} sources</span>
            </button>
          )}
        </div>
        
        {isUser && msg.attachments && msg.attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2 justify-end">
            {msg.attachments.map((att, idx) => (
              att.type === 'image' ? (
                <img key={idx} src={att.data} alt={att.name} className="max-w-xs max-h-64 rounded-xl border-2 border-white/20 shadow-xl object-cover" />
              ) : (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] border border-white/20 rounded-lg shadow-md">
                  <FileIcon size={16} className="text-gray-400" />
                  <span className="text-xs text-gray-300 font-medium">{att.name}</span>
                </div>
              )
            ))}
          </div>
        )}

        <div className={clsx("leading-7 font-light tracking-wide", isUser ? "bg-[#1A1A1A] inline-block p-4 rounded-3xl rounded-tr-sm text-white/90 border border-white/10 shadow-md" : "text-gray-300")} style={{ fontSize: `${fontSize}px` }}>
          {showThinking ? <ThinkingIndicator theme={theme} /> : <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{mainContent}</Markdown>}
        </div>
      </div>
    </div>
  );
});

const QuickActions = ({ onAction, settings, theme, runFlashpoint, runBlueprint, messages, input }) => {
  const hasContext = messages.length > 0;
  const hasInput = input && input.trim().length > 0;
  
  const handleAction = useCallback((action) => {
    if (action.action) {
      action.action();
      return;
    }
    
    if (action.needsContext && !hasContext && !hasInput) {
      onAction(`${action.cmd}\n\n(Please provide some context first)`);
      return;
    }
    
    let finalPrompt = action.cmd;
    if (hasInput && action.appendInput) finalPrompt = `${action.cmd}\n\nRegarding: ${input}`;
    if (hasContext && action.contextPrefix) finalPrompt = `${action.contextPrefix} ${action.cmd}`;
    onAction(finalPrompt);
  }, [hasContext, hasInput, input, onAction]);

  const studentActions = [
    { label: 'Flashpoint', icon: BrainCircuit, action: runFlashpoint, tooltip: 'Quick knowledge synthesis' }, 
    { label: 'Explain Simple', icon: BookOpen, cmd: 'Explain this in simple terms.', needsContext: true, appendInput: true, tooltip: 'Break down complex topics' }, 
    { label: 'Study Guide', icon: GraduationCap, cmd: 'Create a comprehensive study guide.', needsContext: true, appendInput: true, tooltip: 'Generate study materials' }, 
    { label: 'Essay', icon: PenTool, cmd: 'Create a detailed essay outline.', needsContext: false, appendInput: true, tooltip: 'Outline your essay' }
  ];

  const devActions = [
    { label: 'Blueprint', icon: Layers, action: () => runBlueprint("Basic Node.js API"), tooltip: 'Generate project architecture' }, 
    { label: 'Code Review', icon: Eye, cmd: 'Perform a thorough code review.', needsContext: true, contextPrefix: 'Based on our previous discussion:', appendInput: true, tooltip: 'Comprehensive analysis' }, 
    { label: 'Refactor', icon: Zap, cmd: 'Refactor this code to improve readability and performance.', needsContext: true, appendInput: true, tooltip: 'Optimize code' }, 
    { label: 'Debug', icon: ShieldAlert, cmd: 'Help me debug this issue.', needsContext: true, appendInput: true, tooltip: 'Find and fix issues' }
  ];

  const actions = settings.developerMode ? devActions : studentActions;

  return (
    <div className="flex gap-2 px-4 pb-3 justify-center animate-fade-in flex-wrap">
      {actions.map((action) => (
        <button 
          key={action.label} 
          onClick={() => handleAction(action)}
          title={action.tooltip}
          className={`group flex items-center gap-2 px-3 py-1.5 bg-[#151515] border border-white/10 rounded-full text-[11px] text-gray-400 hover:text-white ${theme.hoverBg} transition-all whitespace-nowrap shadow-sm hover:shadow-md hover:scale-105 active:scale-95`}
        >
          <action.icon size={14} className={`${theme.accentText} opacity-70 group-hover:opacity-100 transition-all group-hover:rotate-12`} />
          <span className="font-medium tracking-wide">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export const Workspace = () => {
  const { 
    messages, sendMessage, isLoading, isOllamaRunning, settings, theme, activeArtifact, 
    closeLabBench, runFlashpoint, runBlueprint, setCurrentInput, synapseReady
  } = useLumina();
  
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeContexts, setActiveContexts] = useState([]);
  const [showContextHistory, setShowContextHistory] = useState(false);
  const [messageContextMap, setMessageContextMap] = useState(new Map());
  
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const contextFetchTimeoutRef = useRef(null);

  useEffect(() => {
    if (contextFetchTimeoutRef.current) clearTimeout(contextFetchTimeoutRef.current);
    contextFetchTimeoutRef.current = setTimeout(() => setCurrentInput(input), 300);
    return () => {
      if (contextFetchTimeoutRef.current) clearTimeout(contextFetchTimeoutRef.current);
    };
  }, [input, setCurrentInput]);

  useEffect(() => { 
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: isLoading ? 'auto' : 'smooth', block: 'nearest' }); 
    }
  }, [messages, isLoading]);
  
  useEffect(() => { 
    if (textareaRef.current) { 
      textareaRef.current.style.height = 'auto'; 
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'; 
    } 
  }, [input]);

  const handleFileSelect = useCallback((files) => {
    const newAttachments = Array.from(files).map(file => ({
      file, name: file.name, type: file.type, size: file.size
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); if (e.target === dropZoneRef.current) setIsDragging(false); }, []);
  const handleDrop = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); const files = e.dataTransfer.files; if (files.length > 0) handleFileSelect(files); }, [handleFileSelect]);
  const removeAttachment = useCallback((index) => { setAttachments(prev => prev.filter((_, i) => i !== index)); }, []);

  const handleSend = useCallback(async () => { 
    if (!input.trim() && attachments.length === 0) return;
    
    // 🧠 SMART CONTEXT FETCH
    // We fetch synapse context for historical accuracy, 
    // but the LIVE context (what's on screen) is now injected directly by sendMessage in LuminaContext.
    let contexts = [];
    if (synapseReady && settings.synapseEnabled && window.lumina?.synapse && input.trim().length > 50) {
      try {
        const contextPromise = window.lumina.synapse.getContext(input, 'chat');
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000));
        contexts = await Promise.race([contextPromise, timeoutPromise]);
        
        if (contexts && contexts.length > 0) {
          setActiveContexts(contexts);
          const messageIndex = messages.length;
          setMessageContextMap(prev => new Map(prev).set(messageIndex + 1, contexts));
          setTimeout(() => setActiveContexts([]), 5000);
        }
      } catch (err) {
        console.debug('🧠 Synapse Context skipped (using live context instead):', err.message);
      }
    }
    
    const finalPrompt = COMMAND_REGISTRY[input.trim()] || input;
    
    let processedAttachments = [];
    if (attachments.length > 0) {
      processedAttachments = await Promise.all(
        attachments.map(async (att) => {
          if (att.file.type.startsWith('image/')) {
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve({ type: 'image', name: att.name, data: reader.result });
              reader.readAsDataURL(att.file);
            });
          } else {
            return { type: 'file', name: att.name, data: att.file };
          }
        })
      );
    }
    
    sendMessage(finalPrompt, processedAttachments); 
    setInput(""); 
    setAttachments([]);
  }, [input, attachments, sendMessage, messages, synapseReady, settings.synapseEnabled]);

  const handleKeyDown = useCallback((e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }, [handleSend]);
  const handleQuickAction = useCallback((prompt) => { setInput(prompt); setTimeout(() => textareaRef.current?.focus(), 0); }, []);

  if (!isOllamaRunning) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
        <div className="p-8 rounded-full bg-white/5 mb-6 animate-pulse-slow border border-white/5"><WifiOff size={48} className="opacity-40 text-red-400" /></div>
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-gray-600">System Offline • Run Ollama</p>
      </div>
    );
  }

  return (
    <div ref={dropZoneRef} className="flex h-full overflow-hidden bg-[#020202]/40 backdrop-blur-sm relative" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-dashed border-blue-500/50">
          <div className="text-center">
            <ImageIcon size={64} className="text-blue-400 mx-auto mb-4 animate-bounce" />
            <p className="text-xl font-bold text-white">Drop files here</p>
            <p className="text-sm text-gray-400 mt-2">Images and documents supported</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        <div className="flex-1 overflow-y-auto px-6 pb-40 custom-scrollbar scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-10 pt-12">
            {messages.length === 0 && (
              <div className="mt-32 text-center space-y-8 animate-enter">
                <div className={`inline-block p-6 rounded-[2rem] ${theme.softBg} border ${theme.primaryBorder} mb-4 shadow-[0_0_80px_-20px_rgba(99,102,241,0.25)]`}>
                  <Sparkles size={56} className={theme.accentText} />
                </div>
                <h1 className="text-5xl font-bold text-white tracking-tighter">Brainless <span className={theme.accentText}>{settings.developerMode ? 'Forge' : 'Nexus'}</span></h1>
                <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed font-light">{settings.developerMode ? 'Advanced Architecture & Engineering Environment.' : 'Universal Research & Knowledge Synthesis Engine.'}</p>
                <div className="mt-8">
                  <QuickActions onAction={handleQuickAction} settings={settings} theme={theme} runFlashpoint={runFlashpoint} runBlueprint={runBlueprint} messages={messages} input={input} />
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <MessageBubble 
                key={idx} msg={msg} theme={theme} fontSize={settings.fontSize} 
                isStreaming={isLoading && idx === messages.length - 1}
                contextUsed={messageContextMap.get(idx)}
                onShowContext={() => {
                  const contexts = messageContextMap.get(idx);
                  if (contexts && contexts.length > 0) {
                    setActiveContexts(contexts);
                    setShowContextHistory(true);
                  }
                }}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#000000] via-[#000000] to-transparent pt-20 pb-4">
          <div className="max-w-3xl mx-auto pointer-events-auto flex flex-col gap-3 px-6">
            {/* 🎯 CENTER BOTTOM CONTEXT DISPLAY */}
            <AnimatePresence>
              {activeContexts.length > 0 && (
                <div className="flex justify-center">
                  <ContextBreadcrumbs contexts={activeContexts} />
                </div>
              )}
            </AnimatePresence>

            {!isLoading && messages.length > 0 && (
              <QuickActions onAction={handleQuickAction} settings={settings} theme={theme} runFlashpoint={runFlashpoint} runBlueprint={runBlueprint} messages={messages} input={input} />
            )}
            
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 py-2 bg-[#0A0A0A]/95 backdrop-blur-2xl border border-white/10 rounded-2xl">
                {attachments.map((att, idx) => (<AttachmentPreview key={idx} file={att.file} onRemove={() => removeAttachment(idx)} />))}
              </div>
            )}

            <div className={`relative flex items-end gap-3 bg-[#0A0A0A]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-2 shadow-2xl ring-1 ring-white/5 transition-all ${isLoading ? 'ring-emerald-500/30 border-emerald-500/30' : 'focus-within:ring-indigo-500/30 focus-within:border-indigo-500/30'}`}>
              <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={(e) => handleFileSelect(e.target.files)} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="mb-1 ml-1 p-2.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all" title="Attach files">
                <Paperclip size={16} />
              </button>
              <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Message ${settings.developerMode ? 'Forge' : 'Nexus'}...`} className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 text-sm resize-none max-h-32 min-h-[24px] py-3 px-4 custom-scrollbar font-medium outline-none" rows={1} />
              <button onClick={handleSend} disabled={isLoading || (!input.trim() && attachments.length === 0)} className={`mb-1 mr-1 p-2.5 rounded-full bg-white text-black ${theme.hoverBg} disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-600 transition-all shadow-lg shadow-white/5`}>{isLoading ? <StopCircle size={16} /> : <ArrowUp size={16} />}</button>
            </div>
            <div className="text-center flex items-center justify-center gap-2 opacity-30 hover:opacity-100 transition-opacity duration-500">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}/>
              <span className="text-[9px] text-gray-600 uppercase tracking-[0.2em] font-medium">
                Brainless {settings.developerMode ? 'Forge' : 'Nexus'} • Enhanced Synapse v3.0
                {synapseReady && <span className="text-green-500 ml-2">●</span>}
              </span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showContextHistory && (
          <ContextHistoryViewer contexts={activeContexts} isOpen={showContextHistory} onClose={() => setShowContextHistory(false)} theme={theme} />
        )}
      </AnimatePresence>

      {activeArtifact && <LabBench artifacts={[activeArtifact]} onClose={closeLabBench} theme={theme} />}
    </div>
  );
};