import React, { useEffect, useRef, useState } from 'react';
import { useLumina } from '../context/LuminaContext';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; 
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ArrowUp, Bot, User, StopCircle, Download, Check, Info, Code2, Eye, Sparkles, Layout, Globe, Bug, Zap, BookOpen, Terminal, GraduationCap, BrainCircuit, FileText, ShieldAlert, PenTool, Copy } from 'lucide-react';
import mermaid from 'mermaid'; 
import clsx from 'clsx'; 

mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose', fontFamily: 'Inter' });

const LivePreview = ({ code }) => (
  <div className="w-full h-96 bg-white rounded-b-xl overflow-hidden border-t border-white/10 relative group"><div className="absolute top-3 right-3 bg-black/80 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-medium">Live Preview</div><iframe srcDoc={code} className="w-full h-full border-none" sandbox="allow-scripts allow-modals" title="Live Preview" /></div>
);

const CodeBlock = ({ language, children }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [mode, setMode] = useState('code'); 
  const canPreview = language === 'html' || language === 'svg';
  const handleSave = async () => { if (window.lumina) { const ext = language === 'javascript' ? 'js' : language === 'python' ? 'py' : 'txt'; const success = await window.lumina.saveGeneratedFile(children, `code.${ext}`); if (success) { setIsSaved(true); setTimeout(() => setIsSaved(false), 2000); } } };
  if (language === 'mermaid') {
     const ref = useRef(null); const [svg, setSvg] = useState('');
     useEffect(() => { if (children && ref.current) { const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`; try { mermaid.render(id, children).then(({ svg }) => setSvg(svg)).catch(e => console.error(e)); } catch(e) {} } }, [children]);
     return <div ref={ref} className="my-6 p-6 bg-[#050505] border border-white/5 rounded-2xl flex justify-center overflow-x-auto shadow-inner" dangerouslySetInnerHTML={{ __html: svg }} />;
  }
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 my-6 bg-[#080808] shadow-2xl ring-1 ring-white/5">
      <div className="bg-[#111] px-4 py-2.5 text-[10px] text-gray-400 font-mono border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-3"><span className="uppercase tracking-wider font-bold text-gray-500">{language}</span>{canPreview && (<div className="flex bg-black/50 rounded-lg p-0.5 border border-white/5"><button onClick={()=>setMode('code')} className={clsx("p-1.5 rounded-md transition-all", mode==='code' ? 'bg-white/10 text-white' : 'hover:text-white')} title="Code"><Code2 size={12}/></button><button onClick={()=>setMode('preview')} className={clsx("p-1.5 rounded-md transition-all", mode==='preview' ? 'bg-indigo-500/20 text-indigo-300' : 'hover:text-white')} title="Preview"><Eye size={12}/></button></div>)}</div>
        <div className="flex gap-2">
          <button onClick={() => navigator.clipboard.writeText(children)} className="hover:text-white transition-colors"><Copy size={12}/></button>
          <button onClick={handleSave} className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/5 px-3 py-1 rounded-lg hover:bg-white/10 font-medium">{isSaved ? <Check size={12} className="text-emerald-500" /> : <Download size={12} />} {isSaved ? "Saved" : "Save"}</button>
        </div>
      </div>
      {mode === 'code' ? <SyntaxHighlighter children={String(children).replace(/\n$/, '')} style={vscDarkPlus} language={language} PreTag="div" customStyle={{ margin: 0, background: 'transparent', fontSize: '13px', padding: '1.5rem', lineHeight: '1.6' }} /> : <LivePreview code={children} />}
    </div>
  );
};

const Callout = ({ children, theme }) => (<div className={`my-6 border-l-2 ${theme.primaryBorder} ${theme.softBg} p-5 rounded-r-2xl text-gray-300 text-sm flex gap-4 shadow-sm`}><Info size={20} className={`${theme.accentText} shrink-0 mt-0.5`} /><div className="prose prose-invert prose-sm max-w-none leading-relaxed">{children}</div></div>);

const MessageBubble = ({ msg, theme, fontSize, isStreaming }) => {
  // 1. Clean "Thinking" Tags and content
  let mainContent = msg.content.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
  // 2. Clean stream artifacts
  mainContent = mainContent.replace(/<thinking>[\s\S]*$/gi, ''); 
  // 3. Normalize Mermaid tags
  mainContent = mainContent.replace(/<mermaid>/g, '\n```mermaid\n').replace(/<\/mermaid>/g, '\n```\n');
  
  const isUser = msg.role === 'user';
  if (!mainContent && !isStreaming) return null; // Don't show empty bubbles

  return (
    <div className={clsx("flex gap-6 group animate-fade-in mb-8", isUser ? "flex-row-reverse" : "")}>
      <div className={clsx("w-9 h-9 shrink-0 rounded-xl flex items-center justify-center shadow-lg border", isUser ? "bg-white text-black border-white" : `bg-gradient-to-br ${theme.gradient} text-white border-white/10`)}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      <div className={clsx("flex-1 min-w-0 max-w-3xl", isUser ? "text-right" : "")}>
         <div className={clsx("flex items-center gap-2 mb-2", isUser ? "justify-end" : "")}>
           <span className="text-xs font-semibold text-white/80">{isUser ? 'You' : 'Lumina'}</span>
           {!isUser && <span className={`text-[9px] ${theme.softBg} ${theme.accentText} px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-wider font-bold`}>AI</span>}
         </div>
         <div 
            className={clsx("leading-7 font-light tracking-wide", isUser ? "bg-[#1A1A1A] inline-block p-4 rounded-3xl rounded-tr-sm text-white/90 border border-white/10 shadow-md" : "text-gray-300")}
            style={{ fontSize: `${fontSize}px` }} 
         >
            <Markdown remarkPlugins={[remarkGfm]} components={{ 
                code({node, inline, className, children, ...props}) { const match = /language-(\w+)/.exec(className || ''); return !inline && match ? <CodeBlock language={match[1]} children={children} /> : <code {...props} className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-[0.9em] border border-white/5 mx-1">{children}</code> },
                blockquote: ({children}) => <Callout theme={theme}>{children}</Callout>,
                table: ({children}) => <div className="overflow-x-auto my-6 border border-white/10 rounded-2xl"><table className="w-full text-left text-sm">{children}</table></div>,
                th: ({children}) => <th className="bg-[#111] p-4 font-semibold border-b border-white/10 text-gray-200">{children}</th>,
                td: ({children}) => <td className="p-4 border-b border-white/5 text-gray-400">{children}</td>,
                a: ({href, children}) => <a href={href} target="_blank" className={`${theme.accentText} hover:underline underline-offset-4`}>{children}</a>,
                p: ({children}) => <p className="mb-4 last:mb-0">{children}</p>,
                ul: ({children}) => <ul className="list-disc pl-4 mb-4 space-y-1 marker:text-gray-600">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal pl-4 mb-4 space-y-1 marker:text-gray-600">{children}</ol>
            }}>{mainContent}</Markdown>
         </div>
      </div>
    </div>
  );
};

const QuickActions = ({ onAction, settings, theme }) => {
  const studentActions = [
    { label: 'Explain Simple', icon: BookOpen, cmd: '/explain_simple' },
    { label: 'Quiz Me', icon: BrainCircuit, cmd: '/quiz' },
    { label: 'Study Guide', icon: GraduationCap, cmd: '/study' },
    { label: 'Essay', icon: PenTool, cmd: '/outline' },
  ];

  const devActions = [
    { label: 'Code Review', icon: Eye, cmd: '/review' },
    { label: 'Security Audit', icon: ShieldAlert, cmd: '/audit' },
    { label: 'Unit Tests', icon: Code2, cmd: '/test' },
    { label: 'Refactor', icon: Zap, cmd: '/refactor' }
  ];

  const actions = settings.developerMode ? devActions : studentActions;

  return (
    <div className="flex gap-2 px-4 pb-3 justify-center animate-fade-in">
      {actions.map((action) => (
        <button 
          key={action.label} 
          onClick={() => onAction(action.cmd)} 
          className={`group flex items-center gap-2 px-3 py-1.5 bg-[#151515] border border-white/10 rounded-full text-[11px] text-gray-400 hover:text-white ${theme.hoverBg} transition-all whitespace-nowrap group shadow-sm`}
        >
          <action.icon size={14} className={`${theme.accentText} opacity-70 group-hover:opacity-100 transition-colors`} />
          <span className="font-medium tracking-wide">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export const Workspace = () => {
  const { messages, sendMessage, isLoading, isOllamaRunning, settings, theme } = useLumina();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  useEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'; } }, [input]);

  const handleSend = () => { 
    if (!input.trim()) return; 
    let finalPrompt = input;
    if (input.startsWith('/explain_simple')) finalPrompt = "Explain the current context/code to me as if I am a beginner student. Use analogies, simple language, and bullet points.";
    else if (input.startsWith('/quiz')) finalPrompt = "Create a short, interactive quiz based on the uploaded files. Ask me 3 multiple-choice questions.";
    else if (input.startsWith('/study')) finalPrompt = "Create a comprehensive Study Guide based on the context. Include Key Concepts, Definitions, and Summaries.";
    else if (input.startsWith('/outline')) finalPrompt = "Create a structured essay/paper outline based on this topic.";
    else if (input.startsWith('/review')) finalPrompt = "Perform a Senior Code Review on this file. Look for logic errors, performance bottlenecks, and style inconsistencies.";
    else if (input.startsWith('/audit')) finalPrompt = "Perform a Security Audit on this code. Look for XSS, SQL Injection, and sensitive data exposure.";
    else if (input.startsWith('/test')) finalPrompt = "Generate a complete Unit Test suite for this code.";
    else if (input.startsWith('/refactor')) finalPrompt = "Refactor this code to be cleaner, DRY, and more efficient.";
    sendMessage(finalPrompt); setInput(""); 
  };

  const handleQuickAction = (cmd) => { setInput(cmd + " "); if (textareaRef.current) textareaRef.current.focus(); };

  if (!isOllamaRunning) return <div className="flex-1 flex flex-col items-center justify-center text-gray-500"><div className="p-8 rounded-full bg-white/5 mb-6 animate-pulse-slow border border-white/5"><Bot size={48} className="opacity-40 text-white" /></div><p className="font-mono text-xs tracking-[0.2em] uppercase text-gray-600">System Offline • Run Ollama</p></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 relative h-full bg-[#020202]/40 backdrop-blur-sm">
      
      <div className="flex-1 overflow-y-auto px-6 pb-40 custom-scrollbar scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-10 pt-12">
          
          {messages.length === 0 && (
            <div className="mt-32 text-center space-y-8 animate-enter">
              <div className={`inline-block p-6 rounded-[2rem] ${theme.softBg} border ${theme.primaryBorder} mb-4 shadow-[0_0_80px_-20px_rgba(99,102,241,0.25)]`}><Sparkles size={56} className={theme.accentText} /></div>
              <h1 className="text-5xl font-bold text-white tracking-tighter">Lumina {settings.developerMode ? 'Prime' : 'Academy'}</h1>
              <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed font-light">{settings.developerMode ? 'Advanced Neural Engineering Environment.' : 'Your personal AI research and study companion.'}</p>
            </div>
          )}

          {messages.map((msg, idx) => <MessageBubble key={idx} msg={msg} theme={theme} fontSize={settings.fontSize} isStreaming={isLoading && idx === messages.length - 1} />)}
          
          {isLoading && (
             <div className="flex items-center gap-4 px-4 py-4 ml-[60px] animate-fade-in">
                <div className="flex space-x-1.5">
                  <div className={`w-1.5 h-1.5 ${theme.primaryBg} rounded-full animate-bounce [animation-delay:-0.3s]`}></div>
                  <div className={`w-1.5 h-1.5 ${theme.primaryBg} rounded-full animate-bounce [animation-delay:-0.15s]`}></div>
                  <div className={`w-1.5 h-1.5 ${theme.primaryBg} rounded-full animate-bounce`}></div>
                </div>
                <span className={`text-[10px] ${theme.accentText} font-mono animate-pulse tracking-[0.2em] uppercase`}>{settings.developerMode ? 'COMPUTING...' : 'THINKING...'}</span>
             </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#000000] via-[#000000] to-transparent pt-20 pb-4 pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto flex flex-col gap-3 px-6">
           {!isLoading && messages.length > 0 && <QuickActions onAction={handleQuickAction} settings={settings} theme={theme} />}
           
           {/* INPUT BAR - NO BORDERS OR FOCUS RINGS */}
           <div className={`relative flex items-end gap-3 bg-[#0A0A0A]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-2 shadow-2xl ring-1 ring-white/5 transition-all`}>
              <textarea 
                ref={textareaRef} 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
                placeholder={`Message ${settings.developerMode ? 'Prime' : 'Lumina'}...`} 
                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 text-sm resize-none max-h-32 min-h-[24px] py-3 px-4 custom-scrollbar font-medium outline-none" 
                rows={1} 
              />
              <button 
                onClick={handleSend} 
                disabled={isLoading || !input.trim()} 
                className={`mb-1 mr-1 p-2.5 rounded-full bg-white text-black ${theme.hoverBg} disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-600 transition-all shadow-lg shadow-white/5`}
              >
                {isLoading ? <StopCircle size={16} /> : <ArrowUp size={16} />}
              </button>
           </div>

           <div className="text-center flex items-center justify-center gap-2 opacity-30 hover:opacity-100 transition-opacity duration-500">
             <Terminal size={10} className={theme.accentText}/>
             <span className="text-[9px] text-gray-600 uppercase tracking-[0.2em] font-medium">Lumina {settings.developerMode ? 'Prime' : 'Core'} OS</span>
           </div>
        </div>
      </div>
    </div>
  );
};