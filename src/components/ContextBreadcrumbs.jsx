import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, FileText, MessageSquare, Calendar, Layers, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { useLumina } from '../context/LuminaContext';

const SOURCE_ICONS = {
  zenith: FileText,
  canvas: Layers,
  chat: MessageSquare,
  chronos: Calendar
};

const SOURCE_COLORS = {
  zenith: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  canvas: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  chat: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  chronos: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
};

export const ContextBreadcrumbs = ({ contexts = [] }) => {
  const { theme } = useLumina();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!contexts || contexts.length === 0) return null;

  const displayedContexts = isExpanded ? contexts : contexts.slice(0, 3);
  const hasMore = contexts.length > 3;
  
  // Calculate average relevance
  const avgRelevance = Math.round(
    contexts.reduce((acc, ctx) => acc + (ctx.relevance || 0), 0) / contexts.length
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="flex flex-col items-center gap-2 max-w-2xl mx-auto"
    >
      {/* Main Context Bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-[#0A0A0A]/95 via-[#0F0F0F]/95 to-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ring-1 ring-white/5">
        {/* Brain Icon with Pulse */}
        <div className={`relative p-2 rounded-xl ${theme.softBg} border ${theme.primaryBorder}`}>
          <Brain size={14} className={theme.accentText} />
          <div className={`absolute inset-0 rounded-xl ${theme.primaryBg} opacity-20 animate-ping`} />
        </div>
        
        {/* Label with Stats */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Active Context
          </span>
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded">
            <TrendingUp size={8} className="text-green-400" />
            <span className="text-[8px] font-bold text-green-400">{avgRelevance}%</span>
          </div>
        </div>

        {/* Context Chips */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
          <AnimatePresence mode="popLayout">
            {displayedContexts.map((ctx, index) => {
              const Icon = SOURCE_ICONS[ctx.source] || FileText;
              const colorClass = SOURCE_COLORS[ctx.source] || 'text-gray-400 bg-gray-500/10 border-gray-500/20';
              
              return (
                <motion.div
                  key={`${ctx.source}-${ctx.id || index}`}
                  initial={{ scale: 0, opacity: 0, x: -20 }}
                  animate={{ scale: 1, opacity: 1, x: 0 }}
                  exit={{ scale: 0, opacity: 0, x: 20 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 30,
                    delay: index * 0.05 
                  }}
                  className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 ${colorClass} rounded-lg border backdrop-blur-sm transition-all hover:scale-105 cursor-default`}
                >
                  <Icon size={11} className="flex-shrink-0" />
                  <span className="text-[9px] font-medium max-w-[100px] truncate">
                    {ctx.metadata?.filename || ctx.metadata?.title || ctx.source}
                  </span>
                  
                  {/* Hover Tooltip */}
                  {ctx.explanation && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      <p className="text-[9px] text-gray-300 max-w-[200px]">
                        {ctx.explanation}
                      </p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* More Button */}
          {hasMore && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-[9px] font-medium text-gray-400 hover:text-white transition-all hover:scale-105`}
            >
              <span>{isExpanded ? 'Less' : `+${contexts.length - 3}`}</span>
              {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </motion.button>
          )}
        </div>
      </div>

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && contexts.length > 3 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 px-4 py-3 bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 rounded-xl">
              {contexts.slice(3).map((ctx, index) => {
                const Icon = SOURCE_ICONS[ctx.source] || FileText;
                const colorClass = SOURCE_COLORS[ctx.source] || 'text-gray-400 bg-gray-500/10 border-gray-500/20';
                
                return (
                  <motion.div
                    key={`${ctx.source}-expanded-${ctx.id || index}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 ${colorClass} rounded-lg border`}
                  >
                    <Icon size={10} />
                    <span className="text-[9px] font-medium max-w-[120px] truncate">
                      {ctx.metadata?.filename || ctx.metadata?.title || ctx.source}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Hint Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-[8px] text-gray-600 uppercase tracking-wider"
      >
        AI is using this context to help answer
      </motion.p>
    </motion.div>
  );
};