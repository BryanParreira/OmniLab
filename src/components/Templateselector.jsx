import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Code, BarChart3, BookOpen, X, Check, 
  Calendar, Layout, Folder, Sparkles, ArrowRight 
} from 'lucide-react';
import { listTemplates, applyTemplate } from '../utils/templates';

const TemplateCard = ({ template, isSelected, onClick }) => {
  const icons = {
    'research-paper': FileText,
    'web-app': Code,
    'data-analysis': BarChart3,
    'study-plan': BookOpen
  };

  const colors = {
    'research-paper': 'from-blue-500 to-cyan-500',
    'web-app': 'from-purple-500 to-pink-500',
    'data-analysis': 'from-green-500 to-emerald-500',
    'study-plan': 'from-amber-500 to-orange-500'
  };

  const Icon = icons[template.key] || FileText;
  const gradient = colors[template.key] || 'from-gray-500 to-gray-600';

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative p-6 rounded-xl border-2 transition-all text-left group overflow-hidden ${
        isSelected 
          ? 'border-white bg-white/10' 
          : 'border-white/10 hover:border-white/20 bg-[#0A0A0A]'
      }`}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
      
      {/* Selected Indicator */}
      {isSelected && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
        >
          <Check size={14} className="text-white" />
        </motion.div>
      )}

      <div className="relative z-10">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
          <Icon size={24} className="text-white" />
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-white mb-2">{template.name}</h3>
        <p className="text-sm text-gray-400 mb-4 leading-relaxed">{template.description}</p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Folder size={12} />
            <span>{template.fileCount} files</span>
          </div>
          <div className="flex items-center gap-1">
            <Layout size={12} />
            <span>{template.nodeCount} nodes</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{template.eventCount} events</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
};

export const TemplateSelector = ({ isOpen, onClose, onSelect }) => {
  const [selected, setSelected] = useState(null);
  const templates = listTemplates();

  const handleApply = () => {
    if (selected) {
      onSelect(selected);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#111]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Choose a Template</h2>
                <p className="text-sm text-gray-400">Quick-start your project with pre-built workflows</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Template Grid */}
          <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <TemplateCard
                  key={template.key}
                  template={template}
                  isSelected={selected === template.key}
                  onClick={() => setSelected(template.key)}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-white/10 bg-[#111]">
            <div className="text-sm text-gray-500">
              {selected ? (
                <span className="flex items-center gap-2 text-white">
                  <Check size={14} className="text-green-400" />
                  Template selected: <strong>{templates.find(t => t.key === selected)?.name}</strong>
                </span>
              ) : (
                'Select a template to continue'
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!selected}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  selected
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:brightness-110'
                    : 'bg-white/10 text-gray-600 cursor-not-allowed'
                }`}
              >
                Apply Template
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};