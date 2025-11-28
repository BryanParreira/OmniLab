import React, { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, Download, Code, Eye, RefreshCw, FlaskConical, ChevronLeft, ChevronRight, BrainCircuit } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from 'framer-motion';

// --- SUB-COMPONENT: FLASHCARDS (Flashpoint) ---
const FlashcardDeck = ({ data, theme }) => {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const nextCard = () => { setIsFlipped(false); setTimeout(() => setIndex((i) => (i + 1) % data.length), 200); };
  const prevCard = () => { setIsFlipped(false); setTimeout(() => setIndex((i) => (i - 1 + data.length) % data.length), 200); };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Enter') setIsFlipped(!isFlipped);
      if (e.key === 'ArrowRight') nextCard();
      if (e.key === 'ArrowLeft') prevCard();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, data.length]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-[#050505]">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-white mb-1">Flashpoint Active Recall</h3>
        <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Card {index + 1} of {data.length}</p>
      </div>

      <div className="relative w-full max-w-lg aspect-[3/2] perspective-1000 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div 
          className="w-full h-full relative preserve-3d transition-all duration-500"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
        >
          {/* FRONT */}
          <div className={`absolute inset-0 backface-hidden rounded-2xl p-8 flex flex-col items-center justify-center text-center border ${theme.primaryBorder} bg-[#0A0A0A] shadow-2xl`}>
             <div className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Question</div>
             <div className="text-xl font-medium text-gray-100">{data[index].front}</div>
             <div className="absolute bottom-4 text-[10px] text-gray-600">Click or Space to Flip</div>
          </div>
          
          {/* BACK */}
          <div className={`absolute inset-0 backface-hidden rounded-2xl p-8 flex flex-col items-center justify-center text-center border ${theme.primaryBorder} ${theme.softBg} shadow-2xl rotate-y-180`}>
             <div className={`text-xs font-bold mb-4 uppercase tracking-wider ${theme.accentText}`}>Answer</div>
             <div className="text-lg text-white leading-relaxed">{data[index].back}</div>
          </div>
        </motion.div>
      </div>

      <div className="flex gap-4 mt-8">
        <button onClick={prevCard} className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all"><ChevronLeft size={20}/></button>
        <button onClick={() => setIsFlipped(!isFlipped)} className={`px-6 py-2 rounded-full font-bold text-sm ${theme.softBg} ${theme.accentText} border ${theme.primaryBorder}`}>
          {isFlipped ? 'Show Question' : 'Reveal Answer'}
        </button>
        <button onClick={nextCard} className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all"><ChevronRight size={20}/></button>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: SYNTHESIS TABLE (The Synthesizer) ---
const SynthesisTable = ({ data, theme }) => (
  <div className="h-full overflow-y-auto p-8 custom-scrollbar bg-[#050505]">
    <div className="max-w-4xl mx-auto">
      <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
        <BrainCircuit className={theme.accentText} /> Knowledge Synthesis
      </h3>
      <p className="text-sm text-gray-400 mb-8">Comparative analysis between sources.</p>

      <div className="space-y-8">
        {data.sections.map((section, idx) => (
          <div key={idx} className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
            <div className="px-6 py-3 bg-white/5 border-b border-white/5 font-bold text-gray-200">
              {section.title}
            </div>
            <div className="grid grid-cols-2 divide-x divide-white/5">
              <div className="p-4">
                <div className="text-xs font-bold text-gray-500 mb-2 uppercase">{data.sourceA}</div>
                <p className="text-sm text-gray-300 leading-relaxed">{section.contentA}</p>
              </div>
              <div className="p-4">
                <div className="text-xs font-bold text-gray-500 mb-2 uppercase">{data.sourceB}</div>
                <p className="text-sm text-gray-300 leading-relaxed">{section.contentB}</p>
              </div>
            </div>
            <div className={`px-6 py-3 border-t border-white/5 text-sm ${theme.softBg} text-gray-300 italic`}>
              <span className={`font-bold not-italic ${theme.accentText} mr-2`}>Synthesis:</span>
              {section.synthesis}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// --- MAIN LAB BENCH ---
export const LabBench = ({ artifact, onClose, theme }) => {
  const [view, setView] = useState('preview');
  const [isExpanded, setIsExpanded] = useState(false);
  const [key, setKey] = useState(0);

  // Determine artifact type
  const isWeb = ['html', 'svg'].includes(artifact.language);
  const isFlashcards = artifact.type === 'flashcards';
  const isSynthesis = artifact.type === 'synthesis';
  
  const handleDownload = () => {
    const content = isFlashcards || isSynthesis ? JSON.stringify(artifact.content, null, 2) : artifact.content;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artifact.${isFlashcards ? 'json' : artifact.language}`;
    a.click();
  };

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className={`border-l border-white/5 bg-[#050505] flex flex-col shadow-2xl relative transition-all duration-300 ${
        isExpanded ? 'fixed inset-0 z-50' : 'w-[45%] h-full'
      }`}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 bg-[#0A0A0A]">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${theme.softBg} ${theme.accentText}`}>
            <FlaskConical size={14} />
          </div>
          <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">
            Lab Bench <span className="text-gray-600">/</span> {isFlashcards ? 'Flashpoint' : isSynthesis ? 'Synthesizer' : artifact.language}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {isWeb && (
            <div className="flex bg-black/50 rounded-lg p-0.5 border border-white/5 mr-2">
              <button onClick={() => setView('code')} className={`p-1.5 rounded-md ${view === 'code' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><Code size={12}/></button>
              <button onClick={() => setView('preview')} className={`p-1.5 rounded-md ${view === 'preview' ? `${theme.softBg} ${theme.accentText}` : 'text-gray-500'}`}><Eye size={12}/></button>
            </div>
          )}
          <button onClick={() => setKey(k=>k+1)} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white"><RefreshCw size={14}/></button>
          <button onClick={handleDownload} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white"><Download size={14}/></button>
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white">
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <div className="h-4 w-px bg-white/10 mx-1"></div>
          <button onClick={onClose} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400"><X size={14}/></button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative bg-[#030304]">
        {isFlashcards ? (
          <FlashcardDeck data={artifact.content} theme={theme} />
        ) : isSynthesis ? (
          <SynthesisTable data={artifact.content} theme={theme} />
        ) : view === 'preview' && isWeb ? (
          <iframe key={key} srcDoc={artifact.content} className="w-full h-full border-none bg-white" sandbox="allow-scripts allow-modals"/>
        ) : (
          <div className="h-full overflow-y-auto custom-scrollbar p-0">
             <SyntaxHighlighter children={artifact.content} style={vscDarkPlus} language={artifact.language} PreTag="div" showLineNumbers={true} customStyle={{ margin:0, minHeight:'100%', background:'transparent', fontSize:'12px' }} />
          </div>
        )}
      </div>
    </motion.div>
  );
};