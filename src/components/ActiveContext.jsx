import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  X, 
  ChevronRight, 
  FileText, 
  MessageSquare, 
  Calendar,
  Layers,
  Zap,
  TrendingUp,
  Sparkles,
  Clock,
  Info,
  History,
  Lightbulb,
  Link2,
  AlertCircle
} from 'lucide-react';
import { useLumina } from '../context/LuminaContext';

/**
 * ENHANCED ACTIVE CONTEXT SIDEBAR v4.0 (OPTIMIZED)
 * Production-ready intelligent context with:
 * - Non-blocking context fetching
 * - Request cancellation
 * - Error boundaries
 * - Graceful degradation
 * - Background processing
 */

const SOURCE_ICONS = {
  zenith: FileText,
  canvas: Layers,
  chat: MessageSquare,
  chronos: Calendar
};

const SOURCE_COLORS = {
  zenith: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
  canvas: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
  chat: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-400',
  chronos: 'from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-400'
};

const ContextCard = ({ item, onClick, theme, onInteraction }) => {
  const Icon = SOURCE_ICONS[item.source] || FileText;
  const colorClass = SOURCE_COLORS[item.source] || 'from-gray-500/20 to-gray-600/20 border-gray-500/30 text-gray-400';
  const [bgClass, borderClass, textClass] = colorClass.split(' ');
  
  const handleClick = () => {
    onClick();
    if (onInteraction && window.lumina?.synapse) {
      try {
        window.lumina.synapse.recordInteraction(item.id);
      } catch (e) {
        // Silent fail - interaction tracking is optional
      }
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={handleClick}
      className={`relative p-4 rounded-xl border bg-gradient-to-br ${bgClass} ${borderClass} cursor-pointer hover:scale-[1.02] transition-all group`}
    >
      {/* Relevance bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 rounded-t-xl overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${item.relevance || 0}%` }}
          className={`h-full bg-gradient-to-r ${bgClass.replace('/20', '/60')}`}
        />
      </div>

      {/* Source badge */}
      <div className="flex items-center justify-between mb-3 mt-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${theme.softBg}`}>
            <Icon size={14} className={textClass} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {item.source}
          </span>
        </div>
        {item.relevance && (
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <TrendingUp size={10} />
            <span>{Math.round(item.relevance)}%</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
        {item.metadata?.filename || item.metadata?.title || 'Untitled'}
      </h4>

      {/* Preview */}
      <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed mb-3">
        {item.content}
      </p>

      {/* Explanation badge */}
      {item.explanation && (
        <div className="flex items-start gap-1.5 mb-3 p-2 bg-black/30 rounded-lg">
          <Info size={10} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <span className="text-[9px] text-gray-500 leading-relaxed">
            {item.explanation}
          </span>
        </div>
      )}

      {/* Keywords */}
      {item.keywords && item.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.keywords.slice(0, 3).map((keyword, idx) => (
            <span
              key={idx}
              className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-gray-600 font-mono uppercase"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      {/* Metadata footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2 text-[9px] text-gray-600">
          <Clock size={10} />
          <span>
            {item.metadata?.timestamp ? new Date(item.metadata.timestamp).toLocaleDateString() : ''}
          </span>
        </div>
        <ChevronRight size={12} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
      </div>
    </motion.div>
  );
};

const SmartSuggestion = ({ suggestion, onClick, theme }) => {
  const Icon = SOURCE_ICONS[suggestion.source] || Lightbulb;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="p-3 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl cursor-pointer hover:scale-[1.02] transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-yellow-500/10 rounded-lg">
          <Lightbulb size={16} className="text-yellow-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-yellow-400 uppercase">
              {suggestion.reason || 'Suggested'}
            </span>
            {suggestion.timesUsed && (
              <span className="text-[9px] text-gray-600">
                • {suggestion.timesUsed}x accessed
              </span>
            )}
          </div>
          <p className="text-xs text-white font-medium line-clamp-2 mb-2">
            {suggestion.preview || 'Suggested content'}
          </p>
          {suggestion.commonTerms && suggestion.commonTerms.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {suggestion.commonTerms.map((term, idx) => (
                <span
                  key={idx}
                  className="text-[8px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-mono"
                >
                  {term}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ContextHistory = ({ history, onRestore, theme }) => {
  if (!history || history.length === 0) return null;
  
  return (
    <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <History size={14} className={theme.accentText} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Recent Context
        </span>
      </div>
      <div className="space-y-2">
        {history.slice(0, 3).map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-[10px] text-gray-500 hover:text-white transition-colors cursor-pointer p-2 hover:bg-white/5 rounded"
            onClick={() => onRestore && onRestore(item)}
          >
            <span className="flex-1 truncate">{item.preview || item.content?.slice(0, 50) || 'Item'}</span>
            {item.relevance && (
              <span className="text-[9px] text-gray-600">{Math.round(item.relevance)}%</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ErrorState = ({ theme, message, onRetry }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center py-12 text-center px-4"
  >
    <AlertCircle size={32} className="text-red-400 mb-3" />
    <p className="text-xs text-red-400 mb-2">Context Error</p>
    <p className="text-[10px] text-gray-600 mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className={`text-xs px-3 py-1 rounded-lg ${theme.softBg} ${theme.accentText} hover:opacity-80 transition-opacity`}
      >
        Retry
      </button>
    )}
  </motion.div>
);

export const ActiveContext = ({ currentView, currentInput, isOpen, onClose, onNavigate }) => {
  const { theme, synapseReady } = useLumina();
  const [contextItems, setContextItems] = useState([]);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [contextHistory, setContextHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState(null);
  
  const debounceTimer = useRef(null);
  const abortControllerRef = useRef(null);
  const lastQueryRef = useRef('');

  // Fetch context based on current activity (NON-BLOCKING)
  const fetchContext = useCallback(async (query) => {
    // Don't fetch if:
    // 1. Query too short
    // 2. Same as last query
    // 3. Synapse not ready
    if (!query || query.trim().length < 10) {
      setContextItems([]);
      setSmartSuggestions([]);
      return;
    }

    if (query === lastQueryRef.current) {
      return;
    }

    if (!synapseReady || !window.lumina?.synapse) {
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    lastQueryRef.current = query;
    
    setIsLoading(true);
    setError(null);

    try {
      // Non-blocking Promise with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Context fetch timeout')), 3000);
      });

      const fetchPromise = window.lumina.synapse.getContext(query, currentView);

      const results = await Promise.race([fetchPromise, timeoutPromise]);
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setContextItems(results || []);
      
      // Get smart suggestions (also non-blocking)
      try {
        const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        const suggestions = await window.lumina.synapse.getSmartSuggestions(currentView, queryTerms);
        
        if (!abortControllerRef.current?.signal.aborted) {
          setSmartSuggestions(suggestions || []);
        }
      } catch (suggestionError) {
        // Suggestions are optional - fail silently
        console.debug('Suggestions unavailable:', suggestionError.message);
      }

    } catch (error) {
      // Only set error if not aborted and not timeout
      if (!abortControllerRef.current?.signal.aborted) {
        console.warn('Context fetch error:', error.message);
        
        // Don't show error for timeouts - just clear results
        if (error.message === 'Context fetch timeout') {
          setContextItems([]);
          setSmartSuggestions([]);
        } else {
          setError(error.message);
        }
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [currentView, synapseReady]);

  // Debounced input tracking (OPTIMIZED)
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (currentInput && currentInput.trim()) {
        fetchContext(currentInput);
      } else {
        setContextItems([]);
        setSmartSuggestions([]);
      }
    }, 800); // Increased debounce time for smoother performance

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [currentInput, fetchContext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleCardClick = useCallback((item) => {
    // Add to history
    setContextHistory(prev => {
      const newHistory = [item, ...prev.filter(h => h.id !== item.id)].slice(0, 10);
      
      // Persist to localStorage
      try {
        localStorage.setItem('contextHistory', JSON.stringify(newHistory));
      } catch (e) {
        console.warn('Could not save context history');
      }
      
      return newHistory;
    });
    
    // Navigate to the source
    if (onNavigate) {
      onNavigate(item.source, item.metadata);
    }
  }, [onNavigate]);

  const handleSuggestionClick = useCallback((suggestion) => {
    if (onNavigate) {
      onNavigate(suggestion.source, suggestion.metadata);
    }
  }, [onNavigate]);

  const handleRetry = useCallback(() => {
    if (currentInput && currentInput.trim()) {
      lastQueryRef.current = ''; // Force refresh
      fetchContext(currentInput);
    }
  }, [currentInput, fetchContext]);

  // Load context history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('contextHistory');
      if (stored) {
        setContextHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not load context history');
    }
  }, []);

  if (!isOpen) return null;

  // Don't render if Synapse not available (graceful degradation)
  if (!synapseReady) {
    return (
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        className="fixed right-0 top-0 h-full w-[380px] bg-[#0A0A0A]/95 backdrop-blur-xl border-l border-white/10 z-40 flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${theme.softBg} border ${theme.primaryBorder}`}>
              <Brain size={18} className={theme.accentText} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Active Context</h3>
              <p className="text-[10px] text-gray-500">Initializing...</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <Brain size={32} className="text-gray-700 mb-3 mx-auto animate-pulse" />
            <p className="text-xs text-gray-600">Synapse not available</p>
            <p className="text-[10px] text-gray-700 mt-1">
              Enable in settings or check backend connection
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed right-0 top-0 h-full w-[380px] bg-[#0A0A0A]/95 backdrop-blur-xl border-l border-white/10 z-40 flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${theme.softBg} border ${theme.primaryBorder}`}>
            <Brain size={18} className={theme.accentText} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Active Context</h3>
            <p className="text-[10px] text-gray-500">
              {isLoading ? 'Analyzing...' : 'AI-powered workspace awareness'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 hover:bg-white/5 rounded-lg transition-colors ${
              showHistory ? 'text-white' : 'text-gray-400'
            }`}
            title="Context History"
          >
            <History size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* Context History */}
        {showHistory && (
          <ContextHistory
            history={contextHistory}
            onRestore={handleCardClick}
            theme={theme}
          />
        )}

        {/* Smart Suggestions */}
        {!isLoading && !error && smartSuggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={14} className="text-yellow-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Smart Suggestions
              </span>
            </div>
            <div className="space-y-2">
              {smartSuggestions.map((suggestion, idx) => (
                <SmartSuggestion
                  key={idx}
                  suggestion={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main Context Items */}
        <AnimatePresence mode="popLayout">
          {/* Error State */}
          {error && (
            <ErrorState 
              theme={theme} 
              message={error}
              onRetry={handleRetry}
            />
          )}

          {/* Loading State */}
          {isLoading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <Sparkles size={32} className={`${theme.accentText} animate-pulse mb-3`} />
              <p className="text-xs text-gray-500">Analyzing workspace...</p>
            </motion.div>
          )}

          {/* No Results State */}
          {!isLoading && !error && contextItems.length === 0 && currentInput && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <Brain size={32} className="text-gray-700 mb-3" />
              <p className="text-xs text-gray-600">No related content found</p>
              <p className="text-[10px] text-gray-700 mt-1">Keep typing to discover connections</p>
            </motion.div>
          )}

          {/* Empty State */}
          {!isLoading && !error && contextItems.length === 0 && !currentInput && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <Zap size={32} className="text-gray-700 mb-3" />
              <p className="text-xs text-gray-600">Start working...</p>
              <p className="text-[10px] text-gray-700 mt-1 max-w-[200px]">
                I'll automatically show related content from your workspace
              </p>
            </motion.div>
          )}

          {/* Results */}
          {!isLoading && !error && contextItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Link2 size={14} className={theme.accentText} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Related Content
                </span>
              </div>
              <div className="space-y-3">
                {contextItems.map((item, index) => (
                  <ContextCard 
                    key={`${item.id}-${index}`}
                    item={item}
                    onClick={() => handleCardClick(item)}
                    onInteraction={() => {}}
                    theme={theme}
                  />
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer stats */}
      {contextItems.length > 0 && (
        <div className="p-4 border-t border-white/10 bg-gradient-to-r from-[#0F0F0F] to-[#0A0A0A]">
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2">
              <TrendingUp size={12} className={theme.accentText} />
              <span className="text-gray-400">
                {contextItems.length} relevant {contextItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="flex gap-1">
              {['zenith', 'canvas', 'chat', 'chronos'].map(source => {
                const count = contextItems.filter(i => i.source === source).length;
                if (count === 0) return null;
                const Icon = SOURCE_ICONS[source];
                return (
                  <div key={source} className="flex items-center gap-1 px-2 py-1 rounded bg-white/5">
                    <Icon size={10} className="text-gray-500" />
                    <span className="text-gray-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};