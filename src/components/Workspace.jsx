import React, { useEffect, useRef, useState } from 'react';
import { useLumina } from '../context/LuminaContext';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; 
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ArrowUp, Bot, User, StopCircle, Download, Check, Info, Code2, Eye, Sparkles, ChevronDown, ChevronRight, Layout, Globe } from 'lucide-react';
import mermaid from 'mermaid'; 
import clsx from 'clsx'; 

mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose', fontFamily: 'Inter' });

const ThinkingStream = ({ content, isStreaming }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  useEffect(() => { if (isStreaming) setIsExpanded(true); }, [isStreaming]);
  if (!content) return null;
  return (
    <div className="my-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 overflow-hidden animate-fade-in">
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-medium text-indigo-300 transition-colors"><Sparkles size={12} className={clsx("transition-transform", isExpanded && "rotate-180")} /><span>{isStreaming ? "Lumina is thinking..." : "Thought Process"}</span><div className="h-px flex-1 bg-indigo-500/20 ml-2" />{isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</button>
      {isExpanded && <div className="p-4 text-xs font-mono text-indigo-200/80 leading-relaxed whitespace-pre-wrap border-t border-indigo-500/10 bg-[#0A0A0A]/50">{content}{isStreaming && <span className="inline-block w-1.5 h-3 bg-indigo-400 ml-1 animate-pulse"/>}</div>}
    </div>
  );
};

const LivePreview = ({ code }) => (
  <div className="w-full h-80 bg-white rounded-b-lg overflow-hidden border-t border-white/10 relative group"><div className="absolute top-2 right-2 bg-black/10 text-black text-[10px] px-2 py-1 rounded backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Interactive Preview</div><iframe srcDoc={code} className="w-full h-full" sandbox="allow-scripts allow-modals" title="Live Preview" /></div>
);

const CodeBlock = ({ language, children }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [mode, setMode] = useState('code'); 
  const canPreview = language === 'html' || language === 'svg';
  const handleSave = async () => { if (window.lumina) { const ext = language === 'javascript' ? 'js' : language === 'python' ? 'py' : 'txt'; const success = await window.lumina.saveGeneratedFile(children, `code.${ext}`); if (success) { setIsSaved(true); setTimeout(() => setIsSaved(false), 2000); } } };
  if (language === 'mermaid') {
     const ref = useRef(null); const [svg, setSvg] = useState('');
     useEffect(() => { if (children && ref.current) { const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`; try { mermaid.render(id, children).then(({ svg }) => setSvg(svg)).catch(e => console.error(e)); } catch(e) {} } }, [children]);
     return <div ref={ref} className="my-4 p-4 bg-[#0A0A0A] border border-white/5 rounded-lg flex justify-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} />;
  }
  return (
    <div className="rounded-lg overflow-hidden border border-white/10 my-4 bg-[#0A0A0A] shadow-lg transition-all hover:border-white/20">
      <div className="bg-[#111] px-3 py-2 text-[10px] text-gray-400 font-mono border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2"><span className="uppercase tracking-wider font-bold text-gray-500">{language}</span>{canPreview && (<div className="flex bg-black rounded p-0.5 border border-white/10"><button onClick={()=>setMode('code')} className={clsx("p-1 rounded transition-colors", mode==='code' ? 'bg-white/10 text-white' : 'hover:text-white')} title="Code View"><Code2 size={12}/></button><button onClick={()=>setMode('preview')} className={clsx("p-1 rounded transition-colors", mode==='preview' ? 'bg-indigo-600 text-white' : 'hover:text-white')} title="Live Preview"><Eye size={12}/></button></div>)}</div>
        <button onClick={handleSave} className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/5 px-2 py-0.5 rounded hover:bg-white/10">{isSaved ? <Check size={10} className="text-emerald-500" /> : <Download size={10} />} {isSaved ? "Saved" : "Save"}</button>
      </div>
      {mode === 'code' ? <SyntaxHighlighter children={String(children).replace(/\n$/, '')} style={vscDarkPlus} language={language} PreTag="div" customStyle={{ margin: 0, background: 'transparent', fontSize: '13px', padding: '1.25rem' }} /> : <LivePreview code={children} />}
    </div>
  );
};

const Callout = ({ children }) => (<div className="my-4 border-l-2 border-indigo-500 bg-indigo-500/5 p-4 rounded-r-lg text-gray-300 text-sm flex gap-4 shadow-sm"><Info size={20} className="text-indigo-400 shrink-0" /><div className="prose prose-invert prose-sm max-w-none leading-relaxed">{children}</div></div>);

const MessageBubble = ({ msg, isStreaming }) => {
  let thoughtContent = null;
  let mainContent = msg.content;

  // --- THE NUCLEAR FIX ---
  const openTag = "<thinking>";
  const closeTag = "</thinking>";
  
  // Find the last closing tag to handle cases where the stream is partial
  const closeIndex = msg.content.lastIndexOf(closeTag);

  if (closeIndex !== -1) {
    // We found a closing tag. Everything before it is thought.
    // We strip any text that appeared BEFORE the <thinking> tag as well (e.g. "Sure!")
    const rawThought = msg.content.substring(0, closeIndex);
    const startOfThought = rawThought.indexOf(openTag);
    if (startOfThought !== -1) {
       thoughtContent = rawThought.substring(startOfThought + openTag.length);
    } else {
       thoughtContent = rawThought; // Fallback
    }
    mainContent = msg.content.substring(closeIndex + closeTag.length);
  } else if (msg.content.includes(openTag)) {
    // Streaming... show as thought, hide main content
    const startOfThought = msg.content.indexOf(openTag);
    thoughtContent = msg.content.substring(startOfThought + openTag.length);
    mainContent = ""; 
  }

  // Artifact Cleanup
  if (mainContent) {
    mainContent = mainContent
      .replace(/<mermaid>/g, '\n```mermaid\n')
      .replace(/<\/mermaid>/g, '\n```\n')
      .replace(/<search>/g, '\n> **Searching:** ')
      .replace(/<\/search>/g, '\n')
      .trim();
  }

  return (
    <div className="flex gap-6 group animate-fade-in">
      <div className="w-8 shrink-0 pt-1">{msg.role === 'user' ? <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-lg"><User size={16} className="text-black" /></div> : <div className="h-8 w-8 rounded-lg border border-white/10 bg-[#111] flex items-center justify-center shadow-lg shadow-indigo-900/10"><Bot size={16} className="text-indigo-400" /></div>}</div>
      <div className="flex-1 overflow-hidden min-w-0">
         <div className="flex items-center gap-2 mb-2"><span className="text-sm font-semibold text-white">{msg.role === 'user' ? 'You' : 'Lumina'}</span>{msg.role === 'assistant' && <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 uppercase tracking-wider font-medium">AI</span>}</div>
         {thoughtContent && <ThinkingStream content={thoughtContent} isStreaming={isStreaming && closeIndex === -1} />}
         {mainContent && <div className="text-[15px] text-gray-300 leading-7 font-light"><Markdown remarkPlugins={[remarkGfm]} components={{ code({node, inline, className, children, ...props}) { const match = /language-(\w+)/.exec(className || ''); return !inline && match ? <CodeBlock language={match[1]} children={children} /> : <code {...props} className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-[13px] border border-white/5">{children}</code> }, blockquote: ({children}) => <Callout>{children}</Callout>, table: ({children}) => <div className="overflow-x-auto my-4 border border-white/10 rounded-lg"><table className="w-full text-left text-sm">{children}</table></div>, th: ({children}) => <th className="bg-[#111] p-3 font-semibold border-b border-white/10 text-gray-200">{children}</th>, td: ({children}) => <td className="p-3 border-b border-white/5 text-gray-400">{children}</td>, a: ({href, children}) => <a href={href} target="_blank" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-400/30">{children}</a>, p: ({children}) => <p className="mb-4 last:mb-0">{children}</p> }}>{mainContent}</Markdown></div>}
      </div>
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

  const handleSend = () => { if (!input.trim()) return; sendMessage(input); setInput(""); };

  if (!isOllamaRunning) return <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-black bg-grid-pattern"><div className="p-4 rounded-full bg-white/5 mb-4 animate-glow"><Bot size={32} className="opacity-80 text-white" /></div><p className="font-mono text-xs tracking-widest uppercase">System Offline • Run Ollama</p></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#030304] bg-grid-pattern relative">
      <div className="flex-1 overflow-y-auto px-4 pb-40 custom-scrollbar scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-10 pt-10">
          {messages.length === 0 && (
            <div className="mt-20 text-center space-y-8 animate-slide-up">
              <div className="inline-block p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4 shadow-[0_0_50px_-12px_rgba(99,102,241,0.3)] animate-glow"><Sparkles size={40} className="text-indigo-400" /></div>
              <h1 className="text-4xl font-bold text-white tracking-tight">Lumina 2.0</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
                 <div className="p-5 border border-white/5 rounded-xl bg-[#0A0A0A]/50 backdrop-blur hover:bg-[#111] transition-all hover:border-indigo-500/30 group cursor-default"><Layout className="text-indigo-400 mb-3 group-hover:scale-110 transition-transform" size={24} /><div className="font-semibold text-white text-sm mb-1">Visual Thought</div><div className="text-xs text-gray-500 leading-relaxed">Mermaid diagrams & Logic streams.</div></div>
                 <div className="p-5 border border-white/5 rounded-xl bg-[#0A0A0A]/50 backdrop-blur hover:bg-[#111] transition-all hover:border-emerald-500/30 group cursor-default"><Code2 className="text-emerald-400 mb-3 group-hover:scale-110 transition-transform" size={24} /><div className="font-semibold text-white text-sm mb-1">Live Artifacts</div><div className="text-xs text-gray-500 leading-relaxed">Preview HTML/JS code instantly.</div></div>
                 <div className="p-5 border border-white/5 rounded-xl bg-[#0A0A0A]/50 backdrop-blur hover:bg-[#111] transition-all hover:border-blue-500/30 group cursor-default"><Globe className="text-blue-400 mb-3 group-hover:scale-110 transition-transform" size={24} /><div className="font-semibold text-white text-sm mb-1">Deep Research</div><div className="text-xs text-gray-500 leading-relaxed">Scrapes web & reads local files.</div></div>
              </div>
            </div>
          )}
          {messages.map((msg, idx) => <MessageBubble key={idx} msg={msg} isStreaming={isLoading && idx === messages.length - 1} />)}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#030304] via-[#030304]/95 to-transparent pt-32 pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
           <div className="relative flex items-end gap-3 bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all">
              <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="Ask anything..." className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 text-sm resize-none max-h-48 min-h-[24px] py-3 px-2 custom-scrollbar" rows={1} />
              <button onClick={handleSend} disabled={isLoading || !input.trim()} className="mb-1 p-2.5 rounded-xl bg-white text-black hover:bg-indigo-50 disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-500 transition-all shadow-lg shadow-indigo-500/20">{isLoading ? <StopCircle size={18} /> : <ArrowUp size={18} />}</button>
           </div>
        </div>
      </div>
    </div>
  );
};