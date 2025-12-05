import React, { useMemo } from 'react';
import { useLumina } from '../context/LuminaContext';
import { 
  Calendar, Clock, Folder, MessageSquare, Layout, 
  Zap, ArrowRight, Target, Brain, AlertCircle,
  TrendingUp, Activity, Sparkles, ChevronRight,
  Plus, FileText, Grid
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- HELPER: TIME AGO ---
const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// --- STAT CARD (Minimal Dark Style) ---
const StatCard = ({ icon: Icon, label, value, trend, onClick, theme }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    onClick={onClick}
    className="p-5 rounded-xl bg-[#0A0A0A] border border-white/10 hover:border-white/20 cursor-pointer transition-all group relative overflow-hidden"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-2.5 rounded-lg ${theme.softBg} backdrop-blur-sm`}>
        <Icon size={20} className={theme.accentText} />
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
          <TrendingUp size={10} />
          <span>{trend}</span>
        </div>
      )}
    </div>
    <div className="space-y-1">
      <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</div>
    </div>
    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
  </motion.div>
);

// --- INTEGRATION ACTION CARD ---
const IntegrationCard = ({ icon: Icon, title, description, onClick, theme }) => (
  <motion.button
    whileHover={{ scale: 1.01, x: 2 }}
    whileTap={{ scale: 0.99 }}
    onClick={onClick}
    className="flex items-center gap-4 p-4 rounded-xl bg-[#0A0A0A] border border-white/10 hover:border-white/20 transition-all text-left group"
  >
    <div className={`p-3 rounded-lg ${theme.softBg} shrink-0`}>
      <Icon size={20} className={theme.accentText} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-bold text-white mb-0.5">{title}</div>
      <div className="text-xs text-gray-500 leading-relaxed">{description}</div>
    </div>
    <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors shrink-0" />
  </motion.button>
);

// --- TODAY'S EVENT ITEM ---
const EventItem = ({ event, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
  >
    <div className={`w-1 h-12 rounded-full ${
      event.priority === 'high' ? 'bg-red-500' : 
      event.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
    }`}></div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold text-white truncate">{event.title}</span>
        {event.priority === 'high' && <AlertCircle size={12} className="text-red-400 shrink-0" />}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {event.time && (
          <>
            <Clock size={10} />
            <span className="font-mono">{event.time}</span>
            <span className="text-gray-700">•</span>
          </>
        )}
        <span className="px-1.5 py-0.5 rounded bg-black/40 uppercase tracking-wider font-bold text-[9px]">
          {event.type}
        </span>
      </div>
    </div>
  </motion.div>
);

// --- ACTIVITY ITEM ---
const ActivityItem = ({ activity, index }) => {
  const Icon = activity.icon;
  const timeAgo = getTimeAgo(activity.time);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors"
    >
      <Icon size={14} className={activity.color} />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate">{activity.title}</div>
        <div className="text-xs text-gray-600 font-mono">{timeAgo}</div>
      </div>
    </motion.div>
  );
};

// --- MAIN DASHBOARD ---
export const DailyDashboard = () => {
  const { 
    sessions, 
    projects, 
    calendarEvents, 
    canvasNodes,
    setCurrentView,
    theme,
    addEvent,
    addCanvasNode,
    createProject,
    settings
  } = useLumina();

  // --- COMPUTE TODAY'S EVENTS ---
  const todaysEvents = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return calendarEvents
      .filter(e => e.date === todayStr)
      .sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'));
  }, [calendarEvents]);

  // --- COMPUTE STATS ---
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    return {
      todayEvents: todaysEvents.length,
      activeProjects: projects.filter(p => p.files?.length > 0).length,
      totalProjects: projects.length,
      recentChats: sessions.filter(s => new Date(s.date) >= weekAgo).length,
      canvasNodes: canvasNodes.length,
      upcomingDeadlines: calendarEvents.filter(e => 
        e.type === 'deadline' && new Date(e.date) >= now
      ).length
    };
  }, [todaysEvents, projects, sessions, canvasNodes, calendarEvents]);

  // --- RECENT ACTIVITY ---
  const activities = useMemo(() => {
    const items = [];
    
    sessions.slice(0, 3).forEach(session => {
      items.push({
        type: 'chat',
        icon: MessageSquare,
        title: session.title,
        time: new Date(session.date),
        color: 'text-blue-400'
      });
    });

    projects.slice(0, 2).forEach(project => {
      items.push({
        type: 'project',
        icon: Folder,
        title: project.name,
        time: new Date(project.createdAt || Date.now()),
        color: 'text-purple-400'
      });
    });

    return items.sort((a, b) => b.time - a.time).slice(0, 5);
  }, [sessions, projects]);

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-[#030304] relative">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-30"></div>

      <div className="max-w-[1600px] mx-auto p-8 relative z-10 space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 pb-6 border-b border-white/5"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-gray-600">
            <Clock size={12} />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 bg-gradient-to-br ${theme.gradient} rounded-lg flex items-center justify-center shadow-lg ${theme.glow}`}>
              <Brain size={18} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Command Center</h1>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Calendar}
            label="Today's Events"
            value={stats.todayEvents}
            trend={stats.upcomingDeadlines > 0 ? `${stats.upcomingDeadlines} upcoming` : null}
            onClick={() => setCurrentView('chronos')}
            theme={theme}
          />
          <StatCard
            icon={Folder}
            label="Active Projects"
            value={stats.activeProjects}
            trend={`${stats.totalProjects} total`}
            onClick={() => setCurrentView('dashboard')}
            theme={theme}
          />
          <StatCard
            icon={MessageSquare}
            label="Recent Chats"
            value={stats.recentChats}
            trend="This week"
            onClick={() => setCurrentView('chat')}
            theme={theme}
          />
          <StatCard
            icon={Layout}
            label="Canvas Nodes"
            value={stats.canvasNodes}
            onClick={() => setCurrentView('canvas')}
            theme={theme}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Today's Schedule - 2 columns */}
          <div className="lg:col-span-2 rounded-2xl glass-panel border border-white/5 overflow-hidden bg-[#0A0A0A]/80 backdrop-blur-xl">
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-black/20">
              <div className="flex items-center gap-3">
                <Calendar size={16} className={theme.accentText} />
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest">Today's Schedule</h2>
                  <p className="text-[10px] text-gray-600 font-mono">{todaysEvents.length} events scheduled</p>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('chronos')}
                className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1 font-mono"
              >
                VIEW ALL <ArrowRight size={12} />
              </button>
            </div>
            
            <div className="p-5 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {todaysEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                  <Calendar size={32} className="mb-3 opacity-20" />
                  <p className="text-sm font-medium">No events today</p>
                  <p className="text-xs text-gray-700 mt-1">Your schedule is clear</p>
                </div>
              ) : (
                todaysEvents.map((event, i) => (
                  <EventItem key={event.id} event={event} index={i} />
                ))
              )}
            </div>
          </div>

          {/* Recent Activity - 1 column */}
          <div className="rounded-2xl glass-panel border border-white/5 overflow-hidden bg-[#0A0A0A]/80 backdrop-blur-xl">
            <div className="flex items-center gap-3 p-5 border-b border-white/5 bg-black/20">
              <Activity size={16} className={theme.accentText} />
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Recent Activity</h2>
                <p className="text-[10px] text-gray-600 font-mono">Latest updates</p>
              </div>
            </div>
            
            <div className="p-5 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                  <Activity size={32} className="mb-3 opacity-20" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                activities.map((activity, i) => (
                  <ActivityItem key={i} activity={activity} index={i} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Cross-Feature Integration Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Zap size={18} className={theme.accentText} />
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Cross-Feature Integration</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Chronos → Canvas */}
            <IntegrationCard
              icon={Target}
              title="Chronos → Canvas"
              description="Export deadlines as visual milestone nodes"
              theme={theme}
              onClick={() => {
                const deadlines = calendarEvents.filter(e => e.priority === 'high' || e.type === 'deadline');
                deadlines.forEach((event, i) => {
                  addCanvasNode('note', 100 + (i * 350), 100, {
                    title: event.title,
                    content: `📅 ${event.date}\n⏰ ${event.time || 'All day'}\n\n${event.notes || ''}`
                  });
                });
                setCurrentView('canvas');
              }}
            />

            {/* Canvas → Chronos */}
            <IntegrationCard
              icon={Calendar}
              title="Canvas → Chronos"
              description="Generate timeline from architecture flow"
              theme={theme}
              onClick={() => {
                const today = new Date();
                canvasNodes.forEach((node, i) => {
                  const futureDate = new Date(today);
                  futureDate.setDate(today.getDate() + (i * 2));
                  const dateStr = futureDate.toISOString().split('T')[0];
                  
                  addEvent(
                    node.data.title || 'Canvas Milestone',
                    dateStr,
                    settings.developerMode ? 'task' : 'study',
                    'medium',
                    node.data.content || 'Imported from Canvas',
                    '10:00'
                  );
                });
                setCurrentView('chronos');
              }}
            />

            {/* Quick Actions */}
            <IntegrationCard
              icon={Plus}
              title="Quick Create"
              description="New project, event, or document"
              theme={theme}
              onClick={() => {
                const choice = prompt('Create: 1=Project, 2=Event, 3=Document');
                if (choice === '1') {
                  const name = prompt('Project name:');
                  if (name) {
                    createProject(name);
                    setCurrentView('dashboard');
                  }
                } else if (choice === '2') {
                  setCurrentView('chronos');
                } else if (choice === '3') {
                  setCurrentView('zenith');
                }
              }}
            />
          </div>
        </div>

        {/* Integration Tip Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-xl border ${theme.primaryBorder} ${theme.softBg} relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>
          <div className="flex items-start gap-4 relative z-10">
            <div className={`p-3 rounded-xl ${theme.primaryBg}`}>
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Brain size={14} className={theme.accentText} />
                Pro Tip: Cross-Feature Workflows
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                Try the <strong className={theme.accentText}>Chronos → Canvas</strong> integration to visualize your high-priority deadlines as an architecture diagram. 
                Or use <strong className={theme.accentText}>Canvas → Chronos</strong> to generate a development timeline from your system design.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView('canvas')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${theme.primaryBg} text-white text-xs font-bold hover:brightness-110 transition-all`}
                >
                  <Layout size={12} />
                  Open Canvas
                </button>
                <button
                  onClick={() => setCurrentView('chronos')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-all"
                >
                  <Calendar size={12} />
                  Open Chronos
                </button>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};