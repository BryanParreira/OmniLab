import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLumina } from '../context/LuminaContext';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; 
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ArrowUp, User, StopCircle, Download, Check, Info, Code2, Eye, Sparkles, Wifi, WifiOff, FlaskConical, PenTool, BrainCircuit, GraduationCap, ShieldAlert, Zap, BookOpen, Layers, GitBranch, Brain, Image as ImageIcon, File as FileIcon, X, Paperclip } from 'lucide-react';
import clsx from 'clsx'; 
import { LabBench } from './LabBench';

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

// --- NEW COMPONENT: Thinking Indicator ---
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

// --- NEW: Attachment Preview Component ---
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
          <button
            onClick={onRemove}
            className="ml-2 p-0.5 hover:bg-white/10 rounded"
          >
            <X size={12} className="text-gray-400" />
          </button>
        </div>
      )}
    </div>
  );
};

const CodeBlock = ({ language, children }) => {
  const { openLabBench, theme } = useLumina();
  const [isSaved, setIsSaved] = useState(false);
  
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
            onClick={() => openLabBench(String(children).replace(/\n$/, ''), language)}
            className={`flex items-center gap-1.5 ${theme.accentText} hover:bg-white/5 px-2 py-1 rounded transition-colors`}
          >
            <FlaskConical size={12} /> Open in Lab
          </button>
          <button onClick={handleSave} className="flex items-center gap-1.5 hover:text-white transition-colors hover:bg-white/5 px-2 py-1 rounded">
            {isSaved ? <Check size={12} className="text-emerald-500" /> : <Download size={12} />} 
          </button>
        </div>
      </div>
      <SyntaxHighlighter children={String(children).replace(/\n$/, '')} style={vscDarkPlus} language={language} PreTag="div" customStyle={{ margin: 0, background: 'transparent', fontSize: '13px', padding: '1.5rem', lineHeight: '1.6' }} />
    </div>
  );
};

const Callout = ({ children, theme }) => (
  <div className={`my-6 border-l-2 ${theme.primaryBorder} ${theme.softBg} p-5 rounded-r-2xl text-gray-300 text-sm flex gap-4 shadow-sm`}>
    <Info size={20} className={`${theme.accentText} shrink-0 mt-0.5`} />
    <div className="prose prose-invert prose-sm max-w-none leading-relaxed">{children}</div>
  </div>
);

const MessageBubble = React.memo(({ msg, theme, fontSize, isStreaming }) => {
  // Remove <thinking> tags from content
  const mainContent = useMemo(() => {
    let content = msg.content.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
    content = content.replace(/<thinking>[\s\S]*$/gi, '');
    return content;
  }, [msg.content]);
  
  const isUser = msg.role === 'user';
  
  // Logic: If content is empty AND we are streaming (and it's the assistant), show ThinkingIndicator.
  const isEmpty = !mainContent || mainContent.trim() === '';
  const showThinking = !isUser && isStreaming && isEmpty;

  // If empty and NOT thinking, don't render anything (prevents empty bubbles)
  if (isEmpty && !showThinking) return null;

  return (
    <div className={clsx("flex gap-6 group animate-fade-in mb-8", isUser ? "flex-row-reverse" : "")}>
      
      {/* Avatar */}
      <div className={clsx(
        "w-9 h-9 shrink-0 rounded-xl flex items-center justify-center shadow-lg border overflow-hidden", 
        isUser ? "bg-white text-black border-white" : `bg-gradient-to-br ${theme.gradient} text-white border-white/10`
      )}>
        {isUser ? <User size={18} /> : <Brain size={18} className="text-white/90" />}
      </div>

      <div className={clsx("flex-1 min-w-0 max-w-3xl", isUser ? "flex flex-col items-end" : "")}>
        <div className={clsx("flex items-center gap-2 mb-2", isUser ? "justify-end" : "")}>
          <span className="text-xs font-semibold text-white/80">{isUser ? 'You' : 'OmniLab'}</span>
          {!isUser && <span className={`text-[9px] ${theme.softBg} ${theme.accentText} px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-wider font-bold`}>AI</span>}
        </div>
        
        {/* CRITICAL FIX: Only show attachments in the message history, NOT sent to AI again */}
        {isUser && msg.attachments && msg.attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2 justify-end">
            {msg.attachments.map((att, idx) => (
              att.type === 'image' ? (
                <img 
                  key={idx}
                  src={att.data} 
                  alt={att.name}
                  className="max-w-xs max-h-64 rounded-xl border-2 border-white/20 shadow-xl object-cover"
                />
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
            
            {/* RENDER LOGIC: Show Thinking OR Markdown */}
            {showThinking ? (
              <ThinkingIndicator theme={theme} />
            ) : (
              <Markdown remarkPlugins={[remarkGfm]} components={{ 
                  code({node, inline, className, children, ...props}) { 
                    const match = /language-(\w+)/.exec(className || ''); 
                    return !inline && match ? <CodeBlock language={match[1]} children={children} /> : <code {...props} className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-[0.9em] border border-white/5 mx-1">{children}</code>;
                  },
                  blockquote: ({children}) => <Callout theme={theme}>{children}</Callout>,
                  table: ({children}) => <div className="overflow-x-auto my-6 border border-white/10 rounded-2xl"><table className="w-full text-left text-sm">{children}</table></div>,
                  th: ({children}) => <th className="bg-[#111] p-4 font-semibold border-b border-white/10 text-gray-200">{children}</th>,
                  td: ({children}) => <td className="p-4 border-b border-white/5 text-gray-400">{children}</td>,
                  a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className={`${theme.accentText} hover:underline underline-offset-4`}>{children}</a>
                }}>
                {mainContent}
              </Markdown>
            )}

        </div>
      </div>
    </div>
  );
});

// ENHANCED QuickActions with better handler system
const QuickActions = ({ onAction, settings, theme, runFlashpoint, runBlueprint, messages, input }) => {
  const hasContext = messages.length > 0;
  const hasInput = input && input.trim().length > 0;
  
  // Context-aware action handler
  const handleAction = useCallback((action) => {
    // If action has custom handler, use it
    if (action.action) {
      action.action();
      return;
    }
    
    // If action needs context and we don't have any, show helpful message
    if (action.needsContext && !hasContext && !hasInput) {
      onAction(`${action.cmd}\n\n(Please provide some context first - share code, text, or ask a question)`);
      return;
    }
    
    // Build contextual prompt
    let finalPrompt = action.cmd;
    
    // If we have input, append it to the command
    if (hasInput && action.appendInput) {
      finalPrompt = `${action.cmd}\n\nRegarding: ${input}`;
    }
    
    // If action has a prefix for context, add it
    if (hasContext && action.contextPrefix) {
      finalPrompt = `${action.contextPrefix} ${action.cmd}`;
    }
    
    onAction(finalPrompt);
  }, [hasContext, hasInput, input, onAction]);

  const studentActions = [
    { 
      label: 'Flashpoint', 
      icon: BrainCircuit, 
      action: runFlashpoint,
      tooltip: 'Quick knowledge synthesis'
    }, 
    { 
      label: 'Explain Simple', 
      icon: BookOpen, 
      cmd: 'Explain this in simple terms that a beginner can understand, using clear examples and avoiding jargon.',
      needsContext: true,
      appendInput: true,
      tooltip: 'Break down complex topics'
    }, 
    { 
      label: 'Study Guide', 
      icon: GraduationCap, 
      cmd: 'Create a comprehensive study guide with key concepts, definitions, and practice questions.',
      needsContext: true,
      appendInput: true,
      tooltip: 'Generate study materials'
    }, 
    { 
      label: 'Essay', 
      icon: PenTool, 
      cmd: 'Create a detailed essay outline with introduction, body paragraphs, and conclusion structure.',
      needsContext: false,
      appendInput: true,
      tooltip: 'Outline your essay'
    }
  ];

  const devActions = [
    { 
      label: 'Blueprint', 
      icon: Layers, 
      action: () => runBlueprint("Basic Node.js API"),
      tooltip: 'Generate project architecture'
    }, 
    { 
      label: 'Code Review', 
      icon: Eye, 
      cmd: 'Perform a thorough code review focusing on: best practices, potential bugs, performance issues, security concerns, and code quality.',
      needsContext: true,
      contextPrefix: 'Based on our previous discussion:',
      appendInput: true,
      tooltip: 'Comprehensive code analysis'
    }, 
    { 
      label: 'Refactor', 
      icon: Zap, 
      cmd: 'Refactor this code to improve: readability, performance, maintainability, and follow modern best practices.',
      needsContext: true,
      appendInput: true,
      tooltip: 'Optimize and clean code'
    }, 
    { 
      label: 'Debug', 
      icon: ShieldAlert, 
      cmd: 'Help me debug this issue. Analyze the code, identify potential problems, and suggest solutions with explanations.',
      needsContext: true,
      appendInput: true,
      tooltip: 'Find and fix issues'
    }
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
          <action.icon 
            size={14} 
            className={`${theme.accentText} opacity-70 group-hover:opacity-100 transition-all group-hover:rotate-12`} 
          />
          <span className="font-medium tracking-wide">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export const Workspace = () => {
  const { messages, sendMessage, isLoading, isOllamaRunning, settings, theme, activeArtifact, closeLabBench, runFlashpoint, runBlueprint } = useLumina();
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); 
  }, [messages, isLoading]);
  
  useEffect(() => { 
    if (textareaRef.current) { 
      textareaRef.current.style.height = 'auto'; 
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'; 
    } 
  }, [input]);

  // Handle file selection
  const handleFileSelect = useCallback((files) => {
    const newAttachments = Array.from(files).map(file => ({
      file,
      name: file.name,
      type: file.type,
      size: file.size
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === dropZoneRef.current) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const removeAttachment = useCallback((index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // CRITICAL FIX: Process attachments properly and clear them after sending
  const handleSend = useCallback(async () => { 
    if (!input.trim() && attachments.length === 0) {
      console.log('⚠️ Empty message, not sending');
      return;
    }
    
    console.log('🚀 Workspace handleSend - attachments:', attachments.length);
    
    const finalPrompt = COMMAND_REGISTRY[input.trim()] || input;
    
    // Process attachments - ONLY for THIS message
    let processedAttachments = [];
    
    if (attachments.length > 0) {
      console.log('📎 Processing attachments...');
      processedAttachments = await Promise.all(
        attachments.map(async (att) => {
          if (att.file.type.startsWith('image/')) {
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                console.log('✅ Image processed:', att.name);
                resolve({
                  type: 'image',
                  name: att.name,
                  data: reader.result
                });
              };
              reader.readAsDataURL(att.file);
            });
          } else {
            // For non-image files, could extract text here
            console.log('📄 File attached:', att.name);
            return {
              type: 'file',
              name: att.name,
              data: att.file
            };
          }
        })
      );
      
      console.log('✅ Processed attachments:', processedAttachments.length);
    }
    
    // CRITICAL: Send message with attachments ONLY for this turn
    // The context should NOT include images from previous messages
    console.log('📤 Calling sendMessage with:', { 
      promptLength: finalPrompt.length, 
      attachments: processedAttachments.length 
    });
    
    sendMessage(finalPrompt, processedAttachments); 
    
    // CRITICAL: Clear input and attachments IMMEDIATELY after sending
    setInput(""); 
    setAttachments([]);
    
    console.log('✅ Cleared input and attachments');
  }, [input, attachments, sendMessage]);

  const handleKeyDown = useCallback((e) => { 
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      handleSend(); 
    } 
  }, [handleSend]);

  // Enhanced action handler that sets input
  const handleQuickAction = useCallback((prompt) => {
    setInput(prompt);
    // Focus textarea after setting input
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }, []);

  if (!isOllamaRunning) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
        <div className="p-8 rounded-full bg-white/5 mb-6 animate-pulse-slow border border-white/5"><WifiOff size={48} className="opacity-40 text-red-400" /></div>
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-gray-600">System Offline • Run Ollama</p>
      </div>
    );
  }

  return (
    <div 
      ref={dropZoneRef}
      className="flex h-full overflow-hidden bg-[#020202]/40 backdrop-blur-sm relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
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
                <h1 className="text-5xl font-bold text-white tracking-tighter">OmniLab <span className={theme.accentText}>{settings.developerMode ? 'Forge' : 'Nexus'}</span></h1>
                <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed font-light">{settings.developerMode ? 'Advanced Architecture & Engineering Environment.' : 'Universal Research & Knowledge Synthesis Engine.'}</p>
                <div className="mt-8">
                  <QuickActions 
                    onAction={handleQuickAction} 
                    settings={settings} 
                    theme={theme} 
                    runFlashpoint={runFlashpoint} 
                    runBlueprint={runBlueprint}
                    messages={messages}
                    input={input}
                  />
                </div>
              </div>
            )}
            {messages.map((msg, idx) => <MessageBubble key={idx} msg={msg} theme={theme} fontSize={settings.fontSize} isStreaming={isLoading && idx === messages.length - 1} />)}
            <div ref={bottomRef} />
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#000000] via-[#000000] to-transparent pt-20 pb-4">
          <div className="max-w-3xl mx-auto pointer-events-auto flex flex-col gap-3 px-6">
            {!isLoading && messages.length > 0 && (
              <QuickActions 
                onAction={handleQuickAction} 
                settings={settings} 
                theme={theme} 
                runFlashpoint={runFlashpoint} 
                runBlueprint={runBlueprint}
                messages={messages}
                input={input}
              />
            )}
            
            {/* Attachments preview */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 py-2 bg-[#0A0A0A]/95 backdrop-blur-2xl border border-white/10 rounded-2xl">
                {attachments.map((att, idx) => (
                  <AttachmentPreview 
                    key={idx} 
                    file={att.file} 
                    onRemove={() => removeAttachment(idx)} 
                  />
                ))}
              </div>
            )}

            <div className={`relative flex items-end gap-3 bg-[#0A0A0A]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-2 shadow-2xl ring-1 ring-white/5 transition-all ${isLoading ? 'ring-emerald-500/30 border-emerald-500/30' : 'focus-within:ring-indigo-500/30 focus-within:border-indigo-500/30'}`}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mb-1 ml-1 p-2.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                title="Attach files"
              >
                <Paperclip size={16} />
              </button>
              <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Message ${settings.developerMode ? 'Forge' : 'Nexus'}...`} className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 text-sm resize-none max-h-32 min-h-[24px] py-3 px-4 custom-scrollbar font-medium outline-none" rows={1} />
              <button onClick={handleSend} disabled={isLoading || (!input.trim() && attachments.length === 0)} className={`mb-1 mr-1 p-2.5 rounded-full bg-white text-black ${theme.hoverBg} disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-600 transition-all shadow-lg shadow-white/5`}>{isLoading ? <StopCircle size={16} /> : <ArrowUp size={16} />}</button>
            </div>
            <div className="text-center flex items-center justify-center gap-2 opacity-30 hover:opacity-100 transition-opacity duration-500"><div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}/><span className="text-[9px] text-gray-600 uppercase tracking-[0.2em] font-medium">OmniLab {settings.developerMode ? 'Forge' : 'Nexus'} OS</span></div>
          </div>
        </div>
      </div>
      {activeArtifact && <LabBench artifact={activeArtifact} onClose={closeLabBench} theme={theme} />}
    </div>
  );
};