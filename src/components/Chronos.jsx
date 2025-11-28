import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useLumina } from '../context/LuminaContext';
import { Calendar, Plus, Sparkles, ChevronLeft, ChevronRight, Clock, Tag, AlertCircle, Download, Layout, Grid, Target, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Utility Functions ---
const getEventColor = (type, isDev) => {
  if (isDev) {
    if (type === 'release') return 'bg-rose-500/20 text-rose-200 border-rose-500/30 border-l-2 border-l-rose-500';
    if (type === 'task') return 'bg-orange-500/20 text-orange-200 border-orange-500/30 border-l-2 border-l-orange-500';
    if (type === 'deadline') return 'bg-red-500/20 text-red-200 border-red-500/30 border-l-2 border-l-red-500';
    return 'bg-gray-800 text-gray-400 border-gray-700 border';
  }
  if (type === 'exam') return 'bg-red-500/20 text-red-200 border-red-500/30 border-l-2 border-l-red-500';
  if (type === 'study') return 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30 border-l-2 border-l-indigo-500';
  if (type === 'assignment') return 'bg-blue-500/20 text-blue-200 border-blue-500/30 border-l-2 border-l-blue-500';
  return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30 border-l-2 border-l-emerald-500';
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateICS = (events) => {
  let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//OmniLab//Horizon//EN\n";
  events.forEach(event => {
    const start = event.date.replace(/-/g, '');
    icsContent += `BEGIN:VEVENT\nSUMMARY:${event.title}\nDTSTART;VALUE=DATE:${start}\nDESCRIPTION:${event.notes || ''}\nEND:VEVENT\n`;
  });
  icsContent += "END:VCALENDAR";
  const blob = new Blob([icsContent], { type: 'text/calendar' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'omnilab-schedule.ics';
  a.click();
  window.URL.revokeObjectURL(url);
};

// --- Components ---

const CalendarDay = React.memo(({ day, dateStr, dayEvents, isToday, theme, onDayClick }) => {
  if (!day) return <div className="bg-[#050505]/50 border border-white/[0.02]" />;

  return (
    <motion.div
      onClick={onDayClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative border border-white/5 p-2 flex flex-col transition-colors group hover:bg-white/[0.02] cursor-pointer ${
        isToday ? `bg-white/[0.03] ${theme.primaryBorder}` : 'bg-[#0A0A0A]'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? `${theme.primaryBg} text-white` : 'text-gray-400'}`}>
          {day}
        </span>
        {dayEvents.length > 0 && (
          <span className="text-[9px] bg-white/10 px-1.5 rounded text-gray-400 font-mono">
            {dayEvents.length}
          </span>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
        {dayEvents.map((event, idx) => (
          <div
            key={event.id || idx}
            className={`text-[9px] px-2 py-1 rounded truncate font-medium ${getEventColor(event.type, theme.isDev)}`}
            title={`${event.title}${event.time ? ` at ${event.time}` : ''}`}
          >
            {event.time && <span className="opacity-70 mr-1 font-mono">{event.time}</span>}
            {event.title}
          </div>
        ))}
      </div>
    </motion.div>
  );
});

const WeekView = React.memo(({ currentDate, eventsByDate, theme }) => {
  const weekDates = useMemo(() => {
    const days = [];
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay(); 
    for (let i = 0; i < 7; i++) {
      const next = new Date(new Date(curr).setDate(first + i));
      days.push(next);
    }
    return days;
  }, [currentDate]);

  const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 10 PM

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-8 border-b border-white/5 bg-[#111]">
        <div className="p-3 border-r border-white/5 bg-[#080808]"></div>
        {weekDates.map((date, i) => {
          const isToday = formatDate(date) === formatDate(new Date());
          return (
            <div key={i} className={`p-2 text-center border-r border-white/5 last:border-r-0 ${isToday ? 'bg-white/5' : ''}`}>
              <div className="text-[10px] text-gray-500 uppercase font-bold">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className={`text-sm font-bold mt-0.5 ${isToday ? theme.accentText : 'text-white'}`}>
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="grid grid-cols-8">
           <div className="border-r border-white/5 bg-[#080808]">
              {hours.map(hour => (
                <div key={hour} className="h-16 border-b border-white/5 text-[9px] text-gray-500 p-2 text-right font-mono">
                  {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </div>
              ))}
           </div>
           
           {weekDates.map((date, i) => {
             const dStr = formatDate(date);
             const dayEvents = eventsByDate[dStr] || [];
             
             return (
              <div key={i} className="border-r border-white/5 last:border-r-0 relative group hover:bg-white/[0.01]">
                {hours.map(h => <div key={h} className="h-16 border-b border-white/[0.02]"></div>)}
                
                {dayEvents.map((ev, idx) => {
                  let top = 0;
                  if (ev.time) {
                    const [h, m] = ev.time.split(':').map(Number);
                    if (h >= 7 && h <= 21) {
                       const minutesFrom7 = (h - 7) * 60 + m;
                       top = (minutesFrom7 / (15 * 60)) * 100;
                    }
                  }
                  
                  return (
                    <div 
                      key={idx}
                      className={`absolute left-1 right-1 p-1.5 rounded text-[9px] border leading-tight overflow-hidden ${getEventColor(ev.type, theme.isDev)}`}
                      style={{ top: `${top}%`, height: '36px' }} 
                    >
                      <div className="font-bold truncate">{ev.title}</div>
                    </div>
                  );
                })}
              </div>
             );
           })}
        </div>
      </div>
    </div>
  );
});

const EventModal = React.memo(({ isOpen, isPlanning, onClose, onAdd, onGenerate, settings, theme, isLoading, ...props }) => {
    if (!isOpen) return null;

    const eventTypes = settings.developerMode 
      ? [ { value: 'task', label: 'Task' }, { value: 'deadline', label: 'Deadline' }, { value: 'release', label: 'Release' } ]
      : [ { value: 'study', label: 'Study Session' }, { value: 'assignment', label: 'Assignment' }, { value: 'exam', label: 'Exam' } ];

    return (
      <AnimatePresence>
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0F0F0F] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#151515] rounded-t-2xl">
               <h3 className="text-base font-bold text-white flex items-center gap-2">
                {isPlanning ? (
                    <><div className={`p-1.5 rounded-lg ${theme.softBg} ${theme.accentText}`}><Sparkles size={16} /></div> {settings.developerMode ? "AI Sprint Planner" : "AI Study Plan"}</>
                ) : (
                    <><div className="p-1.5 rounded-lg bg-white/10 text-white"><Plus size={16} /></div> New Event</>
                )}
                </h3>
                <button onClick={onClose} className="text-gray-500 hover:text-white"><span className="sr-only">Close</span>✕</button>
            </div>
            
            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
              {isPlanning ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2"><Tag size={12}/> Topic</label>
                    <input autoFocus value={props.planTopic} onChange={(e) => props.setPlanTopic(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30" placeholder={settings.developerMode ? "e.g., Auth System" : "e.g., Calculus Midterm"} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2"><Target size={12}/> Target Date</label>
                        <input type="date" value={props.planDate} onChange={(e) => props.setPlanDate(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2"><Clock size={12}/> {settings.developerMode ? "Hours/Week" : "Hours/Day"}</label>
                        <input type="number" value={props.planDuration} onChange={(e) => props.setPlanDuration(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30" placeholder="e.g., 4" />
                      </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2"><AlertCircle size={12}/> Goals / Notes</label>
                    <textarea value={props.planGoals} onChange={(e) => props.setPlanGoals(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30 resize-none h-24" placeholder="Specific focus areas..." />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 mb-2">Type</label>
                      <select value={props.newEventType} onChange={(e) => props.setNewEventType(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30">
                        {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 mb-2">Priority</label>
                      <select value={props.newEventPriority} onChange={(e) => props.setNewEventPriority(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-2">Title</label>
                    <input value={props.newEventTitle} onChange={(e) => props.setNewEventTitle(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30" placeholder="Task name..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 mb-2">Date</label>
                      <input type="date" value={props.newEventDate} onChange={(e) => props.setNewEventDate(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 mb-2">Time</label>
                      <input type="time" value={props.newEventTime} onChange={(e) => props.setNewEventTime(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-white/10 bg-[#151515] rounded-b-2xl flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors" disabled={isLoading}>Cancel</button>
              <button onClick={isPlanning ? onGenerate : onAdd} disabled={isLoading || (isPlanning ? !props.planTopic : !props.newEventTitle)} className={`px-6 py-2 rounded-xl text-sm font-bold text-white transition-all flex items-center gap-2 ${isPlanning ? `${theme.primaryBg} hover:opacity-90` : 'bg-white text-black hover:bg-gray-200'}`}>
                {isLoading ? <Sparkles size={14} className="animate-spin" /> : isPlanning ? <Sparkles size={14}/> : <CheckCircle2 size={14}/>}
                {isPlanning ? (isLoading ? 'Generating...' : 'Generate Plan') : 'Save Event'}
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
});

// --- Main Page ---

export const Chronos = React.memo(() => {
  const { calendarEvents, addEvent, generateSchedule, theme, settings, isLoading } = useLumina();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  
  // Form State
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventType, setNewEventType] = useState(settings.developerMode ? 'task' : 'study');
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventPriority, setNewEventPriority] = useState("medium");
  const [planTopic, setPlanTopic] = useState("");
  const [planDate, setPlanDate] = useState("");
  const [planDuration, setPlanDuration] = useState("");
  const [planGoals, setPlanGoals] = useState("");

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const changeDate = useCallback((delta) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      viewMode === 'month' ? d.setMonth(d.getMonth() + delta) : d.setDate(d.getDate() + (delta * 7));
      return d;
    });
  }, [viewMode]);

  const handleAdd = () => {
    if (newEventTitle && newEventDate) {
      addEvent(newEventTitle, newEventDate, newEventType, newEventPriority, "", newEventTime);
      closeModal();
    }
  };

  const handleGenerate = () => {
    if (planTopic && planDate) {
      generateSchedule(planTopic, planDate, planDuration, planGoals, "");
      closeModal();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false); setIsPlanning(false);
    setNewEventTitle(""); setNewEventDate(""); setNewEventTime(""); setPlanTopic(""); setPlanDate("");
  };

  const eventsByDate = useMemo(() => {
    return calendarEvents.reduce((acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    }, {});
  }, [calendarEvents]);

  const todayStr = formatDate(new Date());

  // Prepare Grid
  const calendarDays = useMemo(() => {
    const days = Array(firstDayOfMonth).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [daysInMonth, firstDayOfMonth]);

  return (
    <div className="flex-1 h-full flex flex-col p-6 bg-[#030304] overflow-hidden">
      <div className="max-w-[1600px] w-full mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 flex-shrink-0 mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h1>
            <div className="flex bg-[#111] rounded-lg border border-white/10 p-0.5">
              <button onClick={() => changeDate(-1)} className="p-1 hover:text-white text-gray-500 rounded hover:bg-white/5"><ChevronLeft size={16}/></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-2 text-xs font-bold text-gray-400 hover:text-white">Today</button>
              <button onClick={() => changeDate(1)} className="p-1 hover:text-white text-gray-500 rounded hover:bg-white/5"><ChevronRight size={16}/></button>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex bg-[#111] rounded-lg border border-white/10 p-0.5 mr-2">
                <button onClick={() => setViewMode('month')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${viewMode === 'month' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><Grid size={12}/> Month</button>
                <button onClick={() => setViewMode('week')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${viewMode === 'week' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><Layout size={12}/> Week</button>
            </div>
            <button onClick={() => generateICS(calendarEvents)} className="p-2 bg-[#111] border border-white/10 rounded-lg text-gray-400 hover:text-white"><Download size={14}/></button>
            <button onClick={() => { setIsPlanning(true); setIsModalOpen(true); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white ${theme.primaryBg} hover:opacity-90 shadow-lg`} disabled={isLoading}>
                <Sparkles size={12}/> {settings.developerMode ? "Sprint Plan" : "Study Plan"}
            </button>
            <button onClick={() => { setIsPlanning(false); setIsModalOpen(true); setNewEventDate(formatDate(new Date())); }} className="flex items-center gap-2 px-3 py-1.5 bg-white text-black hover:bg-gray-200 rounded-lg text-xs font-bold">
                <Plus size={12}/> Add
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 relative">
          {viewMode === 'month' ? (
            <div className="h-full flex flex-col">
                <div className="grid grid-cols-7 gap-px mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">{d}</div>
                  ))}
                </div>
                {/* Responsive Grid that fills available space */}
                <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-1">
                  {calendarDays.map((day, i) => {
                    const dateStr = day ? formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)) : `empty-${i}`;
                    const events = eventsByDate[dateStr] || [];
                    return (
                        <CalendarDay 
                            key={i} 
                            day={day} 
                            dateStr={dateStr} 
                            dayEvents={events} 
                            isToday={todayStr === dateStr} 
                            theme={{...theme, isDev: settings.developerMode}} 
                            onDayClick={() => { if(day) { setNewEventDate(dateStr); setIsPlanning(false); setIsModalOpen(true); }}}
                        />
                    );
                  })}
                </div>
            </div>
          ) : (
             <WeekView currentDate={currentDate} eventsByDate={eventsByDate} theme={{...theme, isDev: settings.developerMode}} />
          )}
        </div>
      </div>

      <EventModal
        isOpen={isModalOpen}
        isPlanning={isPlanning}
        onClose={closeModal}
        onAdd={handleAdd}
        onGenerate={handleGenerate}
        settings={settings}
        theme={theme}
        isLoading={isLoading}
        newEventTitle={newEventTitle} setNewEventTitle={setNewEventTitle}
        newEventDate={newEventDate} setNewEventDate={setNewEventDate}
        newEventType={newEventType} setNewEventType={setNewEventType}
        newEventTime={newEventTime} setNewEventTime={setNewEventTime}
        newEventPriority={newEventPriority} setNewEventPriority={setNewEventPriority}
        planTopic={planTopic} setPlanTopic={setPlanTopic}
        planDate={planDate} setPlanDate={setPlanDate}
        planDuration={planDuration} setPlanDuration={setPlanDuration}
        planGoals={planGoals} setPlanGoals={setPlanGoals}
      />
    </div>
  );
});