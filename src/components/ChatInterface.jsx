import React, { useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'; // VS Code Dark theme
import { Send, Bot, User, Loader2, Terminal } from 'lucide-react';
import { useOllama } from '../hooks/useOllama';

const ChatInterface = () => {
  const { messages, sendMessage, isLoading, isOllamaRunning } = useOllama();
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = inputRef.current.value;
    sendMessage(text);
    inputRef.current.value = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOllamaRunning) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-900 text-white">
        <Terminal className="mb-4 h-16 w-16 text-red-500" />
        <h1 className="text-2xl font-bold">Ollama is not reachable</h1>
        <p className="text-gray-400">Please ensure Ollama is running in the background.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#0d1117] text-gray-100">
      {/* Header */}
      <header className="flex items-center border-b border-gray-800 bg-[#161b22] p-4">
        <Bot className="mr-2 h-6 w-6 text-blue-400" />
        <h1 className="font-bold tracking-tight">Lumina Studio</h1>
        <span className="ml-auto text-xs text-green-500 flex items-center gap-1">
          <span className="block h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          Online
        </span>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`h-8 w-8 shrink-0 rounded flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`max-w-[80%] rounded-lg p-4 text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#161b22] border border-gray-800'}`}>
              {/* Markdown Rendering Engine */}
              <Markdown
                components={{
                  code(props) {
                    const {children, className, node, ...rest} = props
                    const match = /language-(\w+)/.exec(className || '')
                    return match ? (
                      <SyntaxHighlighter
                        {...rest}
                        PreTag="div"
                        children={String(children).replace(/\n$/, '')}
                        language={match[1]}
                        style={vscDarkPlus}
                        customStyle={{ margin: '1rem 0', borderRadius: '0.5rem', fontSize: '0.85rem' }}
                      />
                    ) : (
                      <code {...rest} className={`${className} bg-gray-800 px-1 py-0.5 rounded text-orange-300 font-mono`}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {msg.content}
              </Markdown>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800 bg-[#161b22] p-4">
        <div className="relative mx-auto max-w-4xl">
          <textarea
            ref={inputRef}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="w-full resize-none rounded-xl border border-gray-700 bg-[#0d1117] p-4 pr-12 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows="1"
            style={{ minHeight: '56px' }}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="absolute bottom-3 right-3 rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;