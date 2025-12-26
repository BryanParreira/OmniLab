import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Calendar, MessageSquare, Layout, X, ChevronRight, Loader2 } from 'lucide-react';
import { useLumina } from '../context/LuminaContext';

export const SmartSuggestion = () => {
  const {
    sessions,
    projects,
    calendarEvents,
    canvasNodes,
    setCurrentView,
    loadSession,
    setActiveProject,
    theme,
    settings,
  } = useLumina();

  const [suggestions, setSuggestions] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const generatedSuggestions = generateSuggestions();
      setSuggestions(generatedSuggestions);
      setIsGenerating(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [sessions, projects, calendarEvents, canvasNodes, settings]);

  const generateSuggestions = () => {
    const suggestions = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Check for upcoming deadlines (within 3 days)
    const upcomingDeadlines = calendarEvents?.filter(event => {
      if (!event?.date || event.type !== 'deadline') return false;
      const eventDate = new Date(event.date);
      const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 3;
    }) || [];

    if (upcomingDeadlines.length > 0) {
      const deadline = upcomingDeadlines[0];
      const daysUntil = Math.ceil((new Date(deadline.date) - now) / (1000 * 60 * 60 * 24));
      suggestions.push({
        id: 'deadline-reminder',
        type: 'urgent',
        icon: Calendar,
        title: `Deadline approaching: ${deadline.title}`,
        description: `Due ${daysUntil === 0 ? 'today' : `in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`}`,
        action: () => setCurrentView('chronos'),
        actionLabel: 'View in Chronos',
        gradient: 'from-red-500 to-orange-500',
      });
    }

    // Check for inactive projects that need attention
    const activeProjects = projects?.filter(p => p?.files?.length > 0) || [];
    const staleProjects = projects?.filter(p => {
      if (!p?.updatedAt) return false;
      const lastUpdate = new Date(p.updatedAt);
      const daysSinceUpdate = Math.ceil((now - lastUpdate) / (1000 * 60 * 60 * 24));
      return daysSinceUpdate > 7 && p.files?.length > 0;
    }) || [];

    if (staleProjects.length > 0 && activeProjects.length > 0) {
      const project = staleProjects[0];
      suggestions.push({
        id: 'stale-project',
        type: 'info',
        icon: TrendingUp,
        title: `Continue working on "${project.name}"`,
        description: 'No activity in the past week',
        action: () => {
          setActiveProject(project);
          setCurrentView('dashboard');
        },
        actionLabel: 'Open Project',
        gradient: 'from-blue-500 to-cyan-500',
      });
    }

    // Check today's events
    const todaysEvents = calendarEvents?.filter(e => e?.date === today) || [];
    const nextEvent = todaysEvents.find(e => {
      if (!e.time) return false;
      const [hours, minutes] = e.time.split(':').map(Number);
      const eventTime = new Date(now);
      eventTime.setHours(hours, minutes, 0);
      return eventTime > now;
    });

    if (nextEvent) {
      suggestions.push({
        id: 'next-event',
        type: 'info',
        icon: Calendar,
        title: `Upcoming: ${nextEvent.title}`,
        description: `Scheduled at ${nextEvent.time}`,
        action: () => setCurrentView('chronos'),
        actionLabel: 'View Schedule',
        gradient: 'from-purple-500 to-pink-500',
      });
    }

    // Suggest creating a new project if user has none
    if (!projects || projects.length === 0) {
      suggestions.push({
        id: 'create-first-project',
        type: 'tip',
        icon: Layout,
        title: 'Create your first project',
        description: 'Organize your work with project contexts',
        action: () => {
          const name = prompt('Project name:');
          if (name) {
            window.dispatchEvent(new CustomEvent('create-project', { detail: { name } }));
          }
        },
        actionLabel: 'Create Project',
        gradient: 'from-green-500 to-emerald-500',
      });
    }

    // Suggest using Canvas if user has projects but no canvas nodes
    if (activeProjects.length > 0 && (!canvasNodes || canvasNodes.length === 0)) {
      suggestions.push({
        id: 'try-canvas',
        type: 'tip',
        icon: Layout,
        title: 'Visualize your projects',
        description: 'Try the Canvas to map out your ideas',
        action: () => setCurrentView('canvas'),
        actionLabel: 'Open Canvas',
        gradient: 'from-amber-500 to-yellow-500',
      });
    }

    // Suggest catching up on recent chats
    const recentSessions = sessions?.filter(s => {
      if (!s?.date) return false;
      const sessionDate = new Date(s.date);
      const daysSince = Math.ceil((now - sessionDate) / (1000 * 60 * 60 * 24));
      return daysSince <= 7;
    }) || [];

    if (recentSessions.length > 5) {
      suggestions.push({
        id: 'review-chats',
        type: 'tip',
        icon: MessageSquare,
        title: 'You\'ve been busy!',
        description: `${recentSessions.length} conversations this week`,
        action: () => setCurrentView('chat'),
        actionLabel: 'Review Chats',
        gradient: 'from-indigo-500 to-purple-500',
      });
    }

    // Developer mode specific suggestions
    if (settings.developerMode) {
      const hasGitProjects = projects?.some(p => p.isGitRepo) || false;
      if (!hasGitProjects && activeProjects.length > 0) {
        suggestions.push({
          id: 'git-init',
          type: 'tip',
          icon: TrendingUp,
          title: 'Initialize Git for version control',
          description: 'Track changes and collaborate better',
          action: () => setCurrentView('dashboard'),
          actionLabel: 'Learn More',
          gradient: 'from-orange-500 to-red-500',
        });
      }
    }

    // General productivity tip if no other suggestions
    if (suggestions.length === 0) {
      const tips = [
        {
          title: 'Try the Command Palette',
          description: 'Press ⌘K for quick actions anywhere',
          action: () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true })),
          actionLabel: 'Try It',
        },
        {
          title: 'Explore Zenith',
          description: 'Distraction-free writing with AI assistance',
          action: () => setCurrentView('zenith'),
          actionLabel: 'Open Zenith',
        },
        {
          title: 'Plan your week',
          description: 'Use Chronos to schedule your tasks',
          action: () => setCurrentView('chronos'),
          actionLabel: 'Open Chronos',
        },
      ];

      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      suggestions.push({
        id: 'productivity-tip',
        type: 'tip',
        icon: Sparkles,
        ...randomTip,
        gradient: 'from-cyan-500 to-blue-500',
      });
    }

    return suggestions.slice(0, 3);
  };

  if (!isVisible || suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
              <Sparkles size={14} className="text-indigo-400" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {isGenerating ? 'Analyzing...' : 'Suggested Next Actions'}
            </h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all"
            title="Dismiss suggestions"
          >
            <X size={14} />
          </button>
        </div>

        {isGenerating ? (
          <div className="p-6 rounded-xl bg-gradient-to-br from-[#0A0A0A] to-[#111] border border-white/10 flex items-center justify-center">
            <Loader2 size={20} className="text-indigo-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                index={index}
                theme={theme}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

const SuggestionCard = ({ suggestion, index, theme }) => {
  const Icon = suggestion.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      onClick={suggestion.action}
      className="p-4 rounded-xl bg-gradient-to-br from-[#0A0A0A] to-[#111] border border-white/10 hover:border-white/20 cursor-pointer transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-lg bg-gradient-to-br ${suggestion.gradient} bg-opacity-10 border border-white/10 group-hover:scale-110 transition-transform`}>
          <Icon size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
              {suggestion.title}
            </h4>
          </div>
          <p className="text-xs text-gray-500 mb-2">{suggestion.description}</p>
          <div className="flex items-center gap-2 text-xs text-gray-400 group-hover:text-white transition-colors">
            <span className="font-medium">{suggestion.actionLabel}</span>
            <ChevronRight size={12} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};