import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLumina } from '../context/LuminaContext';

export const ProgressVisualization = () => {
  const { sessions, projects, calendarEvents, canvasNodes, theme } = useLumina();
  const [timeframe, setTimeframe] = useState('week'); // 'week' or 'month'
  const [currentWeek, setCurrentWeek] = useState(0); // 0 = current week, -1 = last week, etc.

  const chartData = useMemo(() => {
    const now = new Date();
    let days = [];
    let labels = [];

    if (timeframe === 'week') {
      // Get start of week (Sunday)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + (currentWeek * 7));
      startOfWeek.setHours(0, 0, 0, 0);

      // Generate 7 days
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        days.push(day);
        labels.push(day.toLocaleDateString('en-US', { weekday: 'short' }));
      }
    } else {
      // Get start of month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth() + currentWeek, 1);
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + currentWeek + 1, 0).getDate();

      // Generate all days in month
      for (let i = 0; i < daysInMonth; i++) {
        const day = new Date(startOfMonth);
        day.setDate(i + 1);
        days.push(day);
        labels.push((i + 1).toString());
      }
    }

    // Count activities per day
    const data = days.map(day => {
      const dayStr = day.toISOString().split('T')[0];
      
      const chats = sessions?.filter(s => {
        if (!s?.date) return false;
        const sessionDate = new Date(s.date).toISOString().split('T')[0];
        return sessionDate === dayStr;
      }).length || 0;

      const events = calendarEvents?.filter(e => e?.date === dayStr).length || 0;

      const projectUpdates = projects?.filter(p => {
        if (!p?.updatedAt) return false;
        const updateDate = new Date(p.updatedAt).toISOString().split('T')[0];
        return updateDate === dayStr;
      }).length || 0;

      return {
        chats,
        events,
        projects: projectUpdates,
        total: chats + events + projectUpdates,
      };
    });

    const maxValue = Math.max(...data.map(d => d.total), 1);

    return { days, labels, data, maxValue };
  }, [sessions, projects, calendarEvents, timeframe, currentWeek]);

  const stats = useMemo(() => {
    const totalChats = chartData.data.reduce((sum, d) => sum + d.chats, 0);
    const totalEvents = chartData.data.reduce((sum, d) => sum + d.events, 0);
    const totalProjects = chartData.data.reduce((sum, d) => sum + d.projects, 0);
    const avgPerDay = (totalChats + totalEvents + totalProjects) / chartData.days.length;

    // Calculate trend (comparing to previous period)
    const currentTotal = totalChats + totalEvents + totalProjects;
    const trend = currentWeek === 0 ? 'current' : currentTotal > 0 ? 'up' : 'down';

    return {
      totalChats,
      totalEvents,
      totalProjects,
      avgPerDay: avgPerDay.toFixed(1),
      trend,
    };
  }, [chartData, currentWeek]);

  const getPeriodLabel = () => {
    if (timeframe === 'week') {
      if (currentWeek === 0) return 'This Week';
      if (currentWeek === -1) return 'Last Week';
      return `${Math.abs(currentWeek)} Weeks Ago`;
    } else {
      const date = new Date();
      date.setMonth(date.getMonth() + currentWeek);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 overflow-hidden bg-gradient-to-br from-[#0A0A0A] to-[#0C0C0C] backdrop-blur-xl shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <BarChart3 size={18} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Progress Tracker</h2>
            <p className="text-[10px] text-gray-600 font-mono mt-0.5">{getPeriodLabel()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe Toggle */}
          <div className="flex bg-black/50 rounded-lg p-0.5 border border-white/5">
            <button
              onClick={() => { setTimeframe('week'); setCurrentWeek(0); }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                timeframe === 'week'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => { setTimeframe('month'); setCurrentWeek(0); }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                timeframe === 'month'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              Month
            </button>
          </div>

          {/* Navigation */}
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentWeek(w => w - 1)}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all"
              title="Previous period"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setCurrentWeek(w => Math.min(w + 1, 0))}
              disabled={currentWeek === 0}
              className={`p-2 rounded-lg transition-all ${
                currentWeek === 0
                  ? 'text-gray-700 cursor-not-allowed'
                  : 'hover:bg-white/5 text-gray-500 hover:text-white'
              }`}
              title="Next period"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4 p-6 border-b border-white/5">
        <StatItem icon={Activity} label="Chats" value={stats.totalChats} color="text-blue-400" />
        <StatItem icon={Calendar} label="Events" value={stats.totalEvents} color="text-purple-400" />
        <StatItem icon={TrendingUp} label="Projects" value={stats.totalProjects} color="text-green-400" />
        <StatItem 
          icon={BarChart3} 
          label="Avg/Day" 
          value={stats.avgPerDay} 
          color="text-amber-400"
          trend={stats.trend}
        />
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="space-y-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${timeframe}-${currentWeek}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              {chartData.labels.map((label, index) => (
                <BarRow
                  key={index}
                  label={label}
                  data={chartData.data[index]}
                  maxValue={chartData.maxValue}
                  index={index}
                  theme={theme}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

const StatItem = ({ icon: Icon, label, value, color, trend }) => (
  <div className="flex flex-col">
    <div className="flex items-center gap-2 mb-1">
      <Icon size={12} className={color} />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className={`text-xl font-bold ${color}`}>{value}</span>
      {trend === 'up' && (
        <div className="text-green-400 text-xs">↑</div>
      )}
      {trend === 'down' && (
        <div className="text-red-400 text-xs">↓</div>
      )}
    </div>
  </div>
);

const BarRow = ({ label, data, maxValue, index, theme }) => {
  const percentage = maxValue > 0 ? (data.total / maxValue) * 100 : 0;
  const isToday = index === new Date().getDay() && label === new Date().toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-3 p-2 rounded-lg ${isToday ? 'bg-white/5 border border-white/10' : 'hover:bg-white/5'} transition-all group`}
    >
      <div className={`w-12 text-xs font-mono font-bold ${isToday ? 'text-white' : 'text-gray-500'}`}>
        {label}
      </div>
      <div className="flex-1">
        <div className="h-8 bg-black/30 rounded-lg overflow-hidden relative">
          {/* Stacked bars */}
          <div className="absolute inset-0 flex">
            {data.chats > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(data.chats / maxValue) * 100}%` }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                className="bg-gradient-to-r from-blue-500 to-blue-400 relative group"
                title={`${data.chats} chats`}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all" />
              </motion.div>
            )}
            {data.events > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(data.events / maxValue) * 100}%` }}
                transition={{ delay: index * 0.05 + 0.1, duration: 0.5 }}
                className="bg-gradient-to-r from-purple-500 to-purple-400"
                title={`${data.events} events`}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all" />
              </motion.div>
            )}
            {data.projects > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(data.projects / maxValue) * 100}%` }}
                transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                className="bg-gradient-to-r from-green-500 to-green-400"
                title={`${data.projects} project updates`}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all" />
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <div className="w-12 text-xs font-bold text-right text-gray-500 group-hover:text-white transition-colors">
        {data.total}
      </div>
    </motion.div>
  );
};