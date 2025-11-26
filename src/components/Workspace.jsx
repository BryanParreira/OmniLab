import React, { useEffect, useRef, useState } from 'react';
import { useLumina } from '../context/LuminaContext';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; 
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ArrowUp, Bot, User, StopCircle, Download, Check, Info, Code2, Eye, Sparkles, Layout, Globe, Bug, Zap, BookOpen, Terminal } from 'lucide-react';
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
     return <div ref={ref} className="my-6 p-6 bg-[#050505] border border-white/5 rounded-xl flex justify-center overflow-x-auto shadow-inner" dangerouslySetInnerHTML={{ __html: svg }} />;
  }
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 my-6 bg-[#080808] shadow-2xl ring-1 ring-white/5">
      <div className="bg-[#111] px-4 py-2.5 text-[10px] text-gray-400 font-mono border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-3"><span className="uppercase tracking-wider font-bold text-gray-500">{language}</span>{canPreview && (<div className="flex bg-black/50 rounded-lg p-0.5 border border-white/5"><button onClick={()=>setMode('code')} className={clsx("p-1.5 rounded-md transition-all", mode==='code' ? 'bg-white/10 text-white' : 'hover:text-white')} title="Code"><Code2 size={12}/></button><button onClick={()=>setMode('preview')} className={clsx("p-1.5 rounded-md transition-all", mode==='preview' ? 'bg-indigo-500/20 text-indigo-300' : 'hover:text-white')} title="Preview"><Eye size={12}/></button></div>)}</div>
        <button onClick={handleSave} className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/5 px-3 py-1 rounded-lg hover:bg-white/10 font-medium">{isSaved ? <Check size={12} className="text-emerald-500" /> : <Download size={12} />} {isSaved ? "Saved" : "Save"}</button>
      </div>
      {mode === 'code' ? <SyntaxHighlighter children={String(children).replace(/\n$/, '')} style={vscDarkPlus} language={language} PreTag="div" customStyle={{ margin: 0, background: 'transparent', fontSize: '13px', padding: '1.5rem', lineHeight: '1.6' }} /> : <LivePreview code={children} />}
    </div>
  );
};

const Callout = ({ children }) => (<div className="my-6 border-l-2 border-indigo-500 bg-indigo-500/5 p-5 rounded-r-2xl text-gray-300 text-sm flex gap-4 shadow-sm"><Info size={20} className="text-indigo-400 shrink-0 mt-0.5" /><div className="prose prose-invert prose-sm max-w-none leading-relaxed">{children}</div></div>);

const MessageBubble = ({ msg }) => {
  let mainContent = msg.content.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
  mainContent = mainContent.replace(/<mermaid>/g, '\n```mermaid\n').replace(/<\/mermaid>/g, '\n```\n');
  const isUser = msg.role === 'user';

  return (
    <div className={clsx("flex gap-6 group animate-fade-in mb-8", isUser ? "flex-row-reverse" : "")}>
      <div className={clsx("w-9 h-9 shrink-0 rounded-xl flex items-center justify-center shadow-lg border", isUser ? "bg-white text-black border-white" : "bg-gradient-to-br from-indigo-600 to-violet-600 text-white border-white/10")}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      <div className={clsx("flex-1 min-w-0 max-w-3xl", isUser ? "text-right" : "")}>
         <div className={clsx("flex items-center gap-2 mb-2", isUser ? "justify-end" : "")}>
           <span className="text-xs font-semibold text-white/80">{isUser ? 'You' : 'Lumina'}</span>
         </div>
         <div className={clsx("text-[15px] leading-7 font-light tracking-wide", isUser ? "bg-[#1A1A1A] inline-block p-4 rounded-3xl rounded-tr-sm text-white/90 border border-white/10 shadow-md" : "text-gray-300")}>
            <Markdown remarkPlugins={[remarkGfm]} components={{ 
                code({node, inline, className, children, ...props}) { const match = /language-(\w+)/.exec(className || ''); return !inline && match ? <CodeBlock language={match[1]} children={children} /> : <code {...props} className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-[12px] border border-white/5 mx-1">{children}</code> },
                blockquote: ({children}) => <Callout>{children}</Callout>,
                table: ({children}) => <div className="overflow-x-auto my-6 border border-white/10 rounded-2xl"><table className="w-full text-left text-sm">{children}</table></div>,
                th: ({children}) => <th className="bg-[#111] p-4 font-semibold border-b border-white/10 text-gray-200">{children}</th>,
                td: ({children}) => <td className="p-4 border-b border-white/5 text-gray-400">{children}</td>,
                a: ({href, children}) => <a href={href} target="_blank" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-400/30">{children}</a>,
                p: ({children}) => <p className="mb-4 last:mb-0">{children}</p>,
                ul: ({children}) => <ul className="list-disc pl-4 mb-4 space-y-1 marker:text-gray-600">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal pl-4 mb-4 space-y-1 marker:text-gray-600">{children}</ol>
            }}>{mainContent}</Markdown>
         </div>
      </div>
    </div>
  );
};

const QuickActions = ({ onAction }) => {
  const actions = [{ label: 'Explain', icon: BookOpen, cmd: '/explain' }, { label: 'Fix Bugs', icon: Bug, cmd: '/fix' }, { label: 'Unit Tests', icon: Code2, cmd: '/test' }, { label: 'Refactor', icon: Zap, cmd: '/refactor' }];
  return (
    <div className="flex gap-2 px-4 pb-3 justify-center">
      {actions.map((action) => (
        <button key={action.label} onClick={() => onAction(action.cmd)} className="flex items-center gap-2 px-3 py-1.5 bg-[#151515] border border-white/10 rounded-full text-[11px] text-gray-400 hover:text-white hover:border-indigo-500/50 hover:bg-white/5 transition-all whitespace-nowrap group shadow-sm">
          <action.icon size={14} className="text-indigo-500/70 group-hover:text-indigo-400 transition-colors" /><span className="font-medium tracking-wide">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export const Workspace = () => {
  const { messages, sendMessage, isLoading, isOllamaRunning } = useLumina();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  useEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'; } }, [input]);

  const handleSend = () => { 
    if (!input.trim()) return; 
    let finalPrompt = input;
    if (input.startsWith('/explain')) finalPrompt = "Analyze this code/context and explain it step-by-step.";
    else if (input.startsWith('/fix')) finalPrompt = "Analyze this code for bugs and security issues. Provide a fixed version.";
    else if (input.startsWith('/test')) finalPrompt = "Generate unit tests for this code.";
    else if (input.startsWith('/refactor')) finalPrompt = "Refactor this code to be cleaner and more efficient.";
    sendMessage(finalPrompt); setInput(""); 
  };

  const handleQuickAction = (cmd) => { setInput(cmd + " "); if (textareaRef.current) textareaRef.current.focus(); };

  if (!isOllamaRunning) return <div className="flex-1 flex flex-col items-center justify-center text-gray-500"><div className="p-8 rounded-full bg-white/5 mb-6 animate-pulse-slow border border-white/5"><Bot size={48} className="opacity-40 text-white" /></div><p className="font-mono text-xs tracking-[0.2em] uppercase text-gray-600">System Offline • Run Ollama</p></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 relative h-full bg-[#020202]/40 backdrop-blur-sm">
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 pb-40 custom-scrollbar scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-10 pt-12">
          {messages.length === 0 && (
            <div className="mt-32 text-center space-y-8 animate-enter">
              <div className="inline-block p-6 rounded-[2rem] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 mb-4 shadow-[0_0_80px_-20px_rgba(99,102,241,0.25)]"><Sparkles size={56} className="text-indigo-400" /></div>
              <h1 className="text-5xl font-bold text-white tracking-tighter">Lumina Obsidian</h1>
              <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed font-light">Your neural workspace for deep engineering.</p>
            </div>
          )}
          {messages.map((msg, idx) => <MessageBubble key={idx} msg={msg} />)}
          {isLoading && (
             <div className="flex items-center gap-4 px-4 py-4 ml-[60px] animate-fade-in">
                <div className="flex space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                </div>
                <span className="text-[10px] text-indigo-400 font-mono animate-pulse tracking-[0.2em] uppercase">Processing...</span>
             </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Floating Input Console */}
      <div className="absolute bottom-6 left-0 right-0 px-8 z-30">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
           {!isLoading && messages.length > 0 && <QuickActions onAction={handleQuickAction} />}
           
           <div className="relative flex items-end gap-3 bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-2 shadow-2xl ring-1 ring-white/5 transition-all focus-within:ring-indigo-500/30 focus-within:border-indigo-500/30">
              <textarea 
                ref={textareaRef} 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
                placeholder="Ask anything..." 
                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 text-sm resize-none max-h-40 min-h-[24px] py-4 px-5 custom-scrollbar font-medium" 
                rows={1} 
              />
              <button 
                onClick={handleSend} 
                disabled={isLoading || !input.trim()} 
                className="mb-1 mr-1 p-3 rounded-full bg-white text-black hover:bg-indigo-50 disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-600 transition-all shadow-lg shadow-white/5"
              >
                {isLoading ? <StopCircle size={18} /> : <ArrowUp size={18} />}
              </button>
           </div>
           <div className="text-center flex items-center justify-center gap-2 opacity-30 hover:opacity-100 transition-opacity duration-500">
             <Terminal size={10} className="text-indigo-500"/>
             <span className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-medium">Lumina Obsidian OS</span>
           </div>
        </div>
      </div>
    </div>
  );
};