import React, { useState } from 'react';
import { useLumina } from '../context/LuminaContext';
import { Calendar, Plus, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const Chronos = () => {
  const { calendarEvents, addEvent, generateSchedule, theme, settings } = useLumina();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAdding, setIsAdding] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [isPlanning, setIsPlanning] = useState(false);
  const [planTopic, setPlanTopic] = useState("");
  const [planDate, setPlanDate] = useState("");

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const changeMonth = (delta) => { const newDate = new Date(currentDate); newDate.setMonth(newDate.getMonth() + delta); setCurrentDate(newDate); };
  const handleAdd = () => { if (newEventTitle && newEventDate) { addEvent(newEventTitle, newEventDate, settings.developerMode ? 'deadline' : 'assignment'); setIsAdding(false); setNewEventTitle(""); setNewEventDate(""); } };
  const handleGenerate = () => { if (planTopic && planDate) { generateSchedule(planTopic, planDate); setIsPlanning(false); } };

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-8 bg-[#030304] relative">
       <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between border-b border-white/5 pb-6 mb-8">
             <div>
                <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest ${theme.accentText}`}>
                   <Calendar size={10} /> {settings.developerMode ? "Sprint Roadmap" : "Study Planner"}
                </div>
                <h1 className="text-4xl font-bold text-white tracking-tight mt-2">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h1>
             </div>
             <div className="flex gap-2">
                <button onClick={() => setIsPlanning(true)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all ${theme.primaryBg} hover:opacity-90 shadow-lg`}><Sparkles size={14}/> {settings.developerMode ? "AI Sprint Plan" : "AI Study Plan"}</button>
                <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 rounded-xl text-xs font-medium text-gray-300 hover:text-white transition-all"><Plus size={14} /> Add Event</button>
                <div className="flex bg-[#111] rounded-xl border border-white/10 ml-2"><button onClick={() => changeMonth(-1)} className="px-3 py-2 hover:bg-white/5 text-gray-400 hover:text-white"><ChevronLeft size={16}/></button><div className="w-px bg-white/5"></div><button onClick={() => changeMonth(1)} className="px-3 py-2 hover:bg-white/5 text-gray-400 hover:text-white"><ChevronRight size={16}/></button></div>
             </div>
          </div>

          <div className="grid grid-cols-7 gap-4 mb-4 text-center">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-xs font-bold text-gray-500 uppercase tracking-wider">{d}</div>)}</div>
          <div className="grid grid-cols-7 gap-4 auto-rows-[120px]">
             {Array(getFirstDayOfMonth(currentDate)).fill(null).map((_, i) => <div key={`empty-${i}`} className="bg-transparent" />)}
             {Array(getDaysInMonth(currentDate)).fill(null).map((_, i) => {
                const day = i + 1;
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvents = calendarEvents.filter(e => e.date === dateStr);
                const isToday = new Date().toISOString().split('T')[0] === dateStr;
                return (
                   <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={day} className={`rounded-2xl p-3 border transition-all ${isToday ? `bg-white/5 ${theme.primaryBorder}` : 'bg-[#0A0A0A] border-white/5 hover:border-white/10'}`}>
                      <div className={`text-sm font-bold mb-2 ${isToday ? theme.accentText : 'text-gray-500'}`}>{day}</div>
                      <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">{dayEvents.map(event => (<div key={event.id} className={`text-[10px] px-2 py-1 rounded border truncate ${getEventColor(event.type, settings.developerMode)}`}>{event.title}</div>))}</div>
                   </motion.div>
                );
             })}
          </div>
       </div>
       {(isAdding || isPlanning) && (
         <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
               <h3 className="text-lg font-bold text-white mb-4">{isPlanning ? (settings.developerMode ? "Plan Sprint" : "Generate Study Plan") : "Add Event"}</h3>
               {isPlanning ? (
                  <><div className="space-y-4 mb-6"><div><label className="text-xs text-gray-500 block mb-1">{settings.developerMode ? "Feature / Milestone" : "Subject / Exam Topic"}</label><input value={planTopic} onChange={e => setPlanTopic(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500" autoFocus /></div><div><label className="text-xs text-gray-500 block mb-1">{settings.developerMode ? "Deadline" : "Exam Date"}</label><input type="date" value={planDate} onChange={e => setPlanDate(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500" /></div></div><div className="flex justify-end gap-2"><button onClick={() => setIsPlanning(false)} className="px-4 py-2 text-xs text-gray-400 hover:text-white">Cancel</button><button onClick={handleGenerate} className={`px-4 py-2 rounded-lg text-xs font-bold text-white ${theme.primaryBg}`}>Generate</button></div></>
               ) : (
                  <><div className="space-y-4 mb-6"><div><label className="text-xs text-gray-500 block mb-1">Title</label><input value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500" autoFocus /></div><div><label className="text-xs text-gray-500 block mb-1">Date</label><input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500" /></div></div><div className="flex justify-end gap-2"><button onClick={() => setIsAdding(false)} className="px-4 py-2 text-xs text-gray-400 hover:text-white">Cancel</button><button onClick={handleAdd} className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-gray-200">Add</button></div></>
               )}
            </div>
         </div>
       )}
    </div>
  );
};

function getEventColor(type, isDev) {
    if (isDev) { if (type === 'release') return 'bg-rose-500/20 text-rose-300 border-rose-500/30 border'; if (type === 'task') return 'bg-orange-500/20 text-orange-300 border-orange-500/30 border'; return 'bg-gray-800 text-gray-400'; } 
    else { if (type === 'exam') return 'bg-red-500/20 text-red-300 border-red-500/30 border'; if (type === 'study') return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 border'; return 'bg-blue-500/20 text-blue-300 border-blue-500/30 border'; }
}