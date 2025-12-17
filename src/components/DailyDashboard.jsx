import React, { useMemo } from 'react';
import { useLumina } from '../context/LuminaContext';
import { 
  Calendar, Clock, Folder, MessageSquare, Layout, 
  Zap, ArrowRight, Target, Brain, AlertCircle,
  TrendingUp, Activity, Sparkles, ChevronRight,
  Plus, FileText, Grid, BarChart3, Flame, Wind,
  CheckCircle2, Star, Code2, PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- HELPER: TIME AGO ---
const getTimeAgo = (date) => {
  if (!date) return 'Unknown';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Unknown';
    
    const seconds = Math.floor((new Date() - dateObj) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  } catch (error) {
    console.error('Error calculating time ago:', error);
    return 'Unknown';
  }
};

// --- STAT CARD (Enhanced) ---
const StatCard = ({ icon: Icon, label, value, trend, trendUp, onClick, theme, gradient }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.03, y: -4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`p-6 rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#0C0C0C] border border-white/10 hover:border-white/20 cursor-pointer transition-all group relative overflow-hidden shadow-xl`}
  >
    {/* Gradient Glow */}
    <div className={`absolute top-0 right-0 w-32 h-32 ${gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
    
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${theme?.softBg || 'bg-white/10'} backdrop-blur-sm group-hover:scale-110 transition-transform shadow-lg`}>
          <Icon size={22} className={theme?.accentText || 'text-blue-400'} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
            trendUp ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
          }`}>
            <TrendingUp size={10} />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-3xl font-bold text-white tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
          {value}
        </div>
        <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">{label}</div>
      </div>
    </div>
    
    {/* Bottom Accent */}
    <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
  </motion.div>
);

// --- TODAY'S EVENT ITEM (Enhanced) ---
const EventItem = ({ event, index }) => {
  if (!event) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, x: 4 }}
      className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-white/5 to-transparent hover:from-white/10 hover:to-white/5 transition-all border border-white/5 hover:border-white/10 group cursor-pointer"
    >
      <div className={`w-1.5 h-14 rounded-full ${
        event.priority === 'high' ? 'bg-gradient-to-b from-red-500 to-red-600' : 
        event.priority === 'medium' ? 'bg-gradient-to-b from-amber-500 to-orange-600' : 
        'bg-gradient-to-b from-blue-500 to-purple-600'
      } shadow-lg`}></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-bold text-white truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
            {event.title || 'Untitled Event'}
          </span>
          {event.priority === 'high' && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle size={10} className="text-red-400" />
              <span className="text-[9px] font-bold text-red-400 uppercase">Urgent</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {event.time && (
            <>
              <Clock size={10} />
              <span className="font-mono font-bold">{event.time}</span>
              <span className="text-gray-700">•</span>
            </>
          )}
          <span className="px-2 py-0.5 rounded-lg bg-black/40 border border-white/5 uppercase tracking-wider font-bold text-[9px]">
            {event.type || 'event'}
          </span>
        </div>
      </div>
      <ChevronRight size={14} className="text-gray-700 group-hover:text-gray-400 transition-colors" />
    </motion.div>
  );
};

// --- ACTIVITY ITEM (Enhanced) ---
const ActivityItem = ({ activity, index }) => {
  if (!activity) return null;
  
  const Icon = activity.icon || Activity;
  const timeAgo = getTimeAgo(activity.time);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ x: 4 }}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer group"
    >
      <div className={`p-2 rounded-lg bg-gradient-to-br from-white/10 to-white/5 border border-white/10 group-hover:scale-110 transition-transform`}>
        <Icon size={14} className={activity.color || 'text-gray-400'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate font-medium group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
          {activity.title || 'Untitled Activity'}
        </div>
        <div className="text-xs text-gray-600 font-mono font-bold">{timeAgo}</div>
      </div>
      <ChevronRight size={12} className="text-gray-700 group-hover:text-gray-500 transition-colors" />
    </motion.div>
  );
};

// --- QUICK ACTION CARD ---
const QuickActionCard = ({ title, description, icon: Icon, stats, gradient, onClick }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.03, y: -4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`relative p-6 rounded-2xl bg-gradient-to-br ${gradient} border-2 border-white/10 hover:border-white/20 transition-all text-left group overflow-hidden shadow-xl`}
  >
    {/* Animated Glow */}
    <div className={`absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700`}></div>
    
    <div className="relative z-10 space-y-4">
      <div className="flex items-start justify-between">
        <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
          <Icon size={24} className="text-white" />
        </div>
        <ArrowRight size={16} className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>
      
      <div>
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-white/70 mb-3">{description}</p>
        
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
            <span className="text-xs font-bold text-white">{stats}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Shine Effect */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
    </div>
  </motion.button>
);

// --- MAIN DASHBOARD ---
export const DailyDashboard = () => {
  const { 
    sessions, 
    projects, 
    calendarEvents, 
    canvasNodes,
    setCurrentView,
    theme,
    settings
  } = useLumina();

  // --- COMPUTE TODAY'S EVENTS ---
  const todaysEvents = useMemo(() => {
    if (!Array.isArray(calendarEvents)) return [];
    
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      return calendarEvents
        .filter(e => e && e.date === todayStr)
        .sort((a, b) => {
          const timeA = a.time || '23:59';
          const timeB = b.time || '23:59';
          return timeA.localeCompare(timeB);
        });
    } catch (error) {
      console.error('Error computing today\'s events:', error);
      return [];
    }
  }, [calendarEvents]);

  // --- COMPUTE STATS ---
  const stats = useMemo(() => {
    try {
      const now = new Date();
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

      const activeProjects = Array.isArray(projects) 
        ? projects.filter(p => p && Array.isArray(p.files) && p.files.length > 0).length 
        : 0;

      const recentChats = Array.isArray(sessions)
        ? sessions.filter(s => {
            if (!s || !s.date) return false;
            try {
              const sessionDate = new Date(s.date);
              return !isNaN(sessionDate.getTime()) && sessionDate >= weekAgo;
            } catch {
              return false;
            }
          }).length
        : 0;

      const upcomingDeadlines = Array.isArray(calendarEvents)
        ? calendarEvents.filter(e => {
            if (!e || !e.date) return false;
            try {
              return e.type === 'deadline' && new Date(e.date) >= now;
            } catch {
              return false;
            }
          }).length
        : 0;

      return {
        todayEvents: todaysEvents.length,
        activeProjects,
        totalProjects: Array.isArray(projects) ? projects.length : 0,
        recentChats,
        canvasNodes: Array.isArray(canvasNodes) ? canvasNodes.length : 0,
        upcomingDeadlines
      };
    } catch (error) {
      console.error('Error computing stats:', error);
      return {
        todayEvents: 0,
        activeProjects: 0,
        totalProjects: 0,
        recentChats: 0,
        canvasNodes: 0,
        upcomingDeadlines: 0
      };
    }
  }, [todaysEvents, projects, sessions, canvasNodes, calendarEvents]);

  // --- RECENT ACTIVITY (FIXED) ---
  const activities = useMemo(() => {
    try {
      const items = [];
      const now = new Date();

      // Add sessions with proper date handling
      if (Array.isArray(sessions)) {
        sessions.slice(0, 5).forEach(session => {
          if (!session) return;
          
          let sessionTime = now;
          if (session.date) {
            try {
              const parsedDate = new Date(session.date);
              if (!isNaN(parsedDate.getTime())) {
                sessionTime = parsedDate;
              }
            } catch (e) {
              console.warn('Invalid session date:', session.date);
            }
          } else if (session.timestamp) {
            try {
              const parsedDate = new Date(session.timestamp);
              if (!isNaN(parsedDate.getTime())) {
                sessionTime = parsedDate;
              }
            } catch (e) {
              console.warn('Invalid session timestamp:', session.timestamp);
            }
          }

          items.push({
            type: 'chat',
            icon: MessageSquare,
            title: session.title || 'Untitled Chat',
            time: sessionTime,
            color: 'text-blue-400',
            id: session.id || `session-${Math.random()}`
          });
        });
      }

      // Add projects with proper date handling
      if (Array.isArray(projects)) {
        projects.slice(0, 3).forEach(project => {
          if (!project) return;
          
          let projectTime = now;
          if (project.createdAt) {
            try {
              const parsedDate = new Date(project.createdAt);
              if (!isNaN(parsedDate.getTime())) {
                projectTime = parsedDate;
              }
            } catch (e) {
              console.warn('Invalid project createdAt:', project.createdAt);
            }
          } else if (project.updatedAt) {
            try {
              const parsedDate = new Date(project.updatedAt);
              if (!isNaN(parsedDate.getTime())) {
                projectTime = parsedDate;
              }
            } catch (e) {
              console.warn('Invalid project updatedAt:', project.updatedAt);
            }
          }

          items.push({
            type: 'project',
            icon: Folder,
            title: project.name || 'Untitled Project',
            time: projectTime,
            color: 'text-purple-400',
            id: project.id || `project-${Math.random()}`
          });
        });
      }

      // Add recent calendar events
      if (Array.isArray(calendarEvents)) {
        const recentEvents = calendarEvents
          .filter(e => {
            if (!e || !e.date) return false;
            try {
              const eventDate = new Date(e.date);
              if (isNaN(eventDate.getTime())) return false;
              const daysDiff = (now - eventDate) / (1000 * 60 * 60 * 24);
              return daysDiff >= 0 && daysDiff <= 7;
            } catch {
              return false;
            }
          })
          .slice(0, 2);

        recentEvents.forEach(event => {
          let eventTime = now;
          try {
            const parsedDate = new Date(event.date);
            if (!isNaN(parsedDate.getTime())) {
              eventTime = parsedDate;
            }
          } catch (e) {
            console.warn('Invalid event date:', event.date);
          }

          items.push({
            type: 'event',
            icon: Calendar,
            title: event.title || 'Untitled Event',
            time: eventTime,
            color: 'text-green-400',
            id: event.id || `event-${Math.random()}`
          });
        });
      }

      // Sort by time (most recent first) and take top 8
      return items
        .sort((a, b) => {
          const timeA = a.time instanceof Date ? a.time.getTime() : 0;
          const timeB = b.time instanceof Date ? b.time.getTime() : 0;
          return timeB - timeA;
        })
        .slice(0, 8);
    } catch (error) {
      console.error('Error computing recent activities:', error);
      return [];
    }
  }, [sessions, projects, calendarEvents]);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-[#030304] relative">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-30"></div>

      {/* Radial Gradient Overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-radial from-blue-500/5 via-purple-500/5 to-transparent blur-3xl pointer-events-none"></div>

      <div className="max-w-[1600px] mx-auto p-8 relative z-10 space-y-8">
        
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pb-6 border-b border-white/10"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-gray-600">
                <Clock size={12} />
                <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 bg-gradient-to-br ${theme?.gradient || 'from-blue-500 to-purple-600'} rounded-2xl flex items-center justify-center shadow-2xl ${theme?.glow || ''}`}>
                  <Brain size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white tracking-tight">{greeting}</h1>
                  <p className="text-sm text-gray-500 mt-1">Welcome back to your command center</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            icon={Calendar}
            label="Today's Events"
            value={stats.todayEvents}
            trendUp={false}
            onClick={() => setCurrentView && setCurrentView('chronos')}
            theme={theme || {}}
            gradient="from-purple-500/20 to-pink-500/20"
          />
          <StatCard
            icon={Folder}
            label="Active Projects"
            value={stats.activeProjects}
            trendUp={true}
            onClick={() => setCurrentView && setCurrentView('dashboard')}
            theme={theme || {}}
            gradient="from-blue-500/20 to-cyan-500/20"
          />
          <StatCard
            icon={MessageSquare}
            label="Recent Chats"
            value={stats.recentChats}
            trendUp={true}
            onClick={() => setCurrentView && setCurrentView('chat')}
            theme={theme || {}}
            gradient="from-green-500/20 to-emerald-500/20"
          />
          <StatCard
            icon={Layout}
            label="Canvas Nodes"
            value={stats.canvasNodes}
            trendUp={false}
            onClick={() => setCurrentView && setCurrentView('canvas')}
            theme={theme || {}}
            gradient="from-amber-500/20 to-orange-500/20"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Today's Schedule - 2 columns */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 rounded-2xl border border-white/10 overflow-hidden bg-gradient-to-br from-[#0A0A0A] to-[#0C0C0C] backdrop-blur-xl shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <Calendar size={18} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest">Today's Schedule</h2>
                  <p className="text-[10px] text-gray-600 font-mono mt-0.5">
                    {todaysEvents.length} event{todaysEvents.length !== 1 ? 's' : ''} scheduled
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCurrentView && setCurrentView('chronos')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-white/10"
              >
                VIEW ALL <ArrowRight size={12} />
              </button>
            </div>
            
            <div className="p-6 space-y-3 max-h-[450px] overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {todaysEvents.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-gray-600"
                  >
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
                      <Calendar size={48} className="opacity-30" />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">No events today</p>
                    <p className="text-xs text-gray-600">Your schedule is clear</p>
                    <button
                      onClick={() => setCurrentView && setCurrentView('chronos')}
                      className="mt-4 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-400 hover:text-white transition-all flex items-center gap-2"
                    >
                      <Plus size={12} /> Add Event
                    </button>
                  </motion.div>
                ) : (
                  todaysEvents.map((event, i) => (
                    <EventItem key={event.id || i} event={event} index={i} />
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Recent Activity - 1 column */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-white/10 overflow-hidden bg-gradient-to-br from-[#0A0A0A] to-[#0C0C0C] backdrop-blur-xl shadow-2xl"
          >
            <div className="flex items-center gap-3 p-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Activity size={18} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Recent Activity</h2>
                <p className="text-[10px] text-gray-600 font-mono mt-0.5">Latest updates</p>
              </div>
            </div>
            
            <div className="p-6 space-y-2 max-h-[450px] overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {activities.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-gray-600"
                  >
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
                      <Activity size={48} className="opacity-30" />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">No recent activity</p>
                    <p className="text-xs text-gray-600">Start creating to see updates</p>
                  </motion.div>
                ) : (
                  activities.map((activity, i) => (
                    <ActivityItem key={activity.id || i} activity={activity} index={i} />
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Quick Launch Pad */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-5"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
              <Zap size={18} className="text-yellow-400" />
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Quick Launch Pad</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <QuickActionCard
              title="Canvas"
              description="Visual thinking space"
              icon={Layout}
              stats={`${stats.canvasNodes} nodes`}
              gradient="from-blue-600 via-blue-500 to-purple-600"
              onClick={() => setCurrentView && setCurrentView('canvas')}
            />
            
            <QuickActionCard
              title="Zenith"
              description="Creative writing suite"
              icon={PenTool}
              stats="Ready to write"
              gradient="from-amber-600 via-orange-500 to-red-600"
              onClick={() => setCurrentView && setCurrentView('zenith')}
            />
            
            <QuickActionCard
              title="Chronos"
              description="Calendar & events"
              icon={Calendar}
              stats={`${stats.todayEvents} today`}
              gradient="from-purple-600 via-pink-500 to-rose-600"
              onClick={() => setCurrentView && setCurrentView('chronos')}
            />
            
            <QuickActionCard
              title="Chat"
              description="AI conversations"
              icon={MessageSquare}
              stats={`${stats.recentChats} this week`}
              gradient="from-green-600 via-emerald-500 to-teal-600"
              onClick={() => setCurrentView && setCurrentView('chat')}
            />
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 text-xs text-gray-700 font-mono pt-4"
        >
          <Sparkles size={12} className="text-gray-600" />
          <span>Powered by Brainless Intelligence</span>
        </motion.div>

      </div>
    </div>
  );
};