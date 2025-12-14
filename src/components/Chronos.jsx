import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useLumina } from '../context/LuminaContext';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Tag, 
  AlertCircle, 
  Download, 
  Layout, 
  Grid, 
  Target, 
  CheckCircle2, 
  Trash2, 
  Edit3,
  X,
  AlignLeft,
  ArrowLeft,
  GripHorizontal,
  Mic,
  MicOff,
  Volume2,
  Upload,
  Filter,
  Search,
  Zap,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- NATURAL LANGUAGE PARSER ---
const parseNaturalLanguage = (input) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    let targetDate = new Date(now);
    let title = input;
    let time = "";
    
    const lower = input.toLowerCase();

    const timeRegex = /(\d{1,2})(:(\d{2}))?\s*(am|pm)|(\d{1,2}):(\d{2})/i;
    const timeMatch = input.match(timeRegex);

    if (timeMatch) {
        let [fullMatch, h1, _, m1, amp, h2, m2] = timeMatch;
        let hours = parseInt(h1 || h2);
        let minutes = parseInt(m1 || m2 || 0);
        
        if (amp) {
            const isPM = amp.toLowerCase() === 'pm';
            if (isPM && hours < 12) hours += 12;
            if (!isPM && hours === 12) hours = 0;
        }
        
        time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        title = title.replace(fullMatch, '');
    }

    if (lower.includes('tomorrow')) {
        targetDate.setDate(now.getDate() + 1);
        title = title.replace(/tomorrow/gi, '');
    } else if (lower.includes('today')) {
        title = title.replace(/today/gi, '');
    } else if (lower.match(/in \d+ days/)) {
        const days = parseInt(lower.match(/in (\d+) days/)[1]);
        targetDate.setDate(now.getDate() + days);
        title = title.replace(/in \d+ days/gi, '');
    }

    const daysMap = {
        sunday: 0, sun: 0,
        monday: 1, mon: 1,
        tuesday: 2, tue: 2,
        wednesday: 3, wed: 3,
        thursday: 4, thu: 4,
        friday: 5, fri: 5,
        saturday: 6, sat: 6
    };
    
    const dayRegex = new RegExp(`\\b(${Object.keys(daysMap).join('|')})\\b`, 'i');
    const dayMatch = lower.match(dayRegex);

    if (dayMatch) {
        const targetDay = daysMap[dayMatch[1]];
        const currentDay = now.getDay();
        let daysToAdd = targetDay - currentDay;
        
        if (daysToAdd <= 0) daysToAdd += 7;
        
        targetDate.setDate(now.getDate() + daysToAdd);
        title = title.replace(new RegExp(`\\b(on |next |this )?${dayMatch[1]}\\b`, 'gi'), '');
    }

    const slashDateMatch = lower.match(/\b(\d{1,2})\/(\d{1,2})\b/);
    if (slashDateMatch) {
        const month = parseInt(slashDateMatch[1]) - 1;
        const day = parseInt(slashDateMatch[2]);
        targetDate.setMonth(month);
        targetDate.setDate(day);
        
        if (targetDate < now) targetDate.setFullYear(now.getFullYear() + 1);
        
        title = title.replace(slashDateMatch[0], '');
    }

    title = title
        .replace(/\b(at|on|due|by)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    return { 
        title: title || "New Event", 
        date: formatDate(targetDate),
        time: time 
    };
};

const createLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const formatFriendlyDate = (dateStr) => {
  if (!dateStr) return '';
  const date = createLocalDate(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getEventColor = (type, isDev) => {
  if (isDev) {
    if (type === 'release') return 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:border-rose-500/50';
    if (type === 'task') return 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:border-orange-500/50';
    if (type === 'deadline') return 'bg-red-500/10 text-red-400 border-red-500/30 hover:border-red-500/50';
    return 'bg-gray-800 text-gray-400 border-gray-700';
  }
  if (type === 'exam') return 'bg-red-500/10 text-red-400 border-red-500/30 hover:border-red-500/50';
  if (type === 'study') return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:border-indigo-500/50';
  if (type === 'assignment') return 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:border-blue-500/50';
  return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50';
};

const generateICS = (events) => {
  let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Brainless//Horizon//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";
  
  events.forEach(event => {
    const start = event.date.replace(/-/g, '');
    const uid = `${event.id || Math.random().toString(36).substr(2, 9)}@Brainless.app`;
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    icsContent += `BEGIN:VEVENT\n`;
    icsContent += `UID:${uid}\n`;
    icsContent += `DTSTAMP:${timestamp}\n`;
    icsContent += `DTSTART;VALUE=DATE:${start}\n`;
    icsContent += `SUMMARY:${event.title}\n`;
    
    if (event.notes) {
      icsContent += `DESCRIPTION:${event.notes.replace(/\n/g, '\\n')}\n`;
    }
    
    if (event.type) {
      icsContent += `CATEGORIES:${event.type}\n`;
    }
    
    if (event.priority) {
      const priorityMap = { high: 1, medium: 5, low: 9 };
      icsContent += `PRIORITY:${priorityMap[event.priority] || 5}\n`;
    }
    
    icsContent += `END:VEVENT\n`;
  });
  
  icsContent += "END:VCALENDAR";
  
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Brainless-calendar-${new Date().toISOString().split('T')[0]}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

const parseICS = (icsContent) => {
  const events = [];
  console.log('🔍 Starting ICS parsing...');
  
  const cleanContent = icsContent.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  const eventBlocks = cleanContent.split('BEGIN:VEVENT');
  console.log(`Found ${eventBlocks.length - 1} event blocks`);
  
  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i];
    
    try {
      const summaryMatch = block.match(/SUMMARY:(.+?)(?:\n|$)/);
      const dateMatch = block.match(/DTSTART[^:]*:(\d{8})/);
      const descMatch = block.match(/DESCRIPTION:(.+?)(?:\n(?![^\n])|$)/s);
      const categoryMatch = block.match(/CATEGORIES:(.+?)(?:\n|$)/);
      const priorityMatch = block.match(/PRIORITY:(\d)/);
      
      console.log(`Event ${i} matches:`, {
        summary: summaryMatch?.[1],
        date: dateMatch?.[1],
        category: categoryMatch?.[1],
        priority: priorityMatch?.[1]
      });
      
      if (summaryMatch && dateMatch) {
        const dateStr = dateMatch[1];
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        
        let priority = 'medium';
        if (priorityMatch) {
          const p = parseInt(priorityMatch[1]);
          if (p <= 3) priority = 'high';
          else if (p >= 7) priority = 'low';
        }
        
        let type = 'general';
        if (categoryMatch) {
          const cat = categoryMatch[1].trim().toLowerCase();
          if (['study', 'assignment', 'exam', 'task', 'deadline', 'release'].includes(cat)) {
            type = cat;
          }
        }
        
        let notes = '';
        if (descMatch) {
          notes = descMatch[1]
            .trim()
            .replace(/\\n/g, '\n')
            .replace(/\\,/g, ',')
            .replace(/\\;/g, ';');
        }
        
        const event = {
          title: summaryMatch[1].trim().replace(/\\n/g, '\n'),
          date: `${year}-${month}-${day}`,
          type: type,
          priority: priority,
          notes: notes,
          time: ''
        };
        
        console.log(`✅ Parsed event ${i}:`, event);
        events.push(event);
      } else {
        console.warn(`⚠️ Event ${i} missing required fields (summary or date)`);
      }
    } catch (error) {
      console.error(`❌ Error parsing event block ${i}:`, error);
      continue;
    }
  }
  
  console.log(`🎉 Successfully parsed ${events.length} events`);
  return events;
};

const useVoiceRecognition = (onResult) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (onResult) onResult(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = () => {
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [onResult]);

  const startListening = useCallback(() => {
    if (recognition) {
      setIsListening(true);
      recognition.start();
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition]);

  return { isListening, startListening, stopListening, isSupported: !!recognition };
};

const speakText = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  }
};

// --- DRAGGABLE EVENT COMPONENT ---
const DraggableEvent = ({ event, onClick, theme }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            draggable
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", event.id);
                e.dataTransfer.effectAllowed = "move";
            }}
            onClick={(e) => { 
                e.stopPropagation(); 
                onClick(event); 
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`text-[10px] px-2.5 py-1.5 rounded-lg truncate font-medium cursor-grab active:cursor-grabbing transition-all flex items-center gap-1.5 group border ${getEventColor(event.type, theme.isDev)} ${
                isHovered ? 'shadow-lg scale-105 z-10 brightness-110' : ''
            }`}
            title={`${event.title}${event.time ? ` at ${event.time}` : ''}\nClick to view details`}
        >
            <GripHorizontal size={10} className="opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
            {event.time && (
                <span className="opacity-70 font-mono text-[9px] bg-black/30 px-1.5 py-0.5 rounded">{event.time}</span>
            )}
            <span className="truncate font-bold">{event.title}</span>
            {event.priority === 'high' && (
                <AlertCircle size={10} className="flex-shrink-0 opacity-70" />
            )}
        </motion.div>
    );
};

// --- CALENDAR DAY COMPONENT ---
const CalendarDay = React.memo(({ day, dateStr, dayEvents, isToday, theme, onDayClick, onEventClick, onDropEvent }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!day) return <div className="bg-[#050505] border border-white/[0.03] rounded-lg" />;

  const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      
      const eventId = e.dataTransfer.getData("text/plain");
      
      if (eventId && onDropEvent) {
          onDropEvent(eventId, dateStr);
      }
  };

  return (
    <motion.div
      onClick={() => { if(day) onDayClick(); }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      onDragOver={(e) => { 
          e.preventDefault(); 
          e.stopPropagation();
          setIsDragOver(true); 
      }}
      onDragLeave={(e) => {
          e.stopPropagation();
          setIsDragOver(false);
      }}
      onDrop={handleDrop}
      className={`relative border p-3 flex flex-col transition-all cursor-pointer min-h-[110px] group rounded-xl ${
        isDragOver ? 'border-blue-500/60 bg-blue-500/10 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/20' : 'border-white/[0.08]'
      } ${isToday 
        ? 'bg-gradient-to-br from-blue-500/[0.08] to-purple-500/[0.08] border-blue-500/30 shadow-inner' 
        : 'bg-gradient-to-br from-[#0A0A0A] to-[#0C0C0C] hover:from-[#0D0D0D] hover:to-[#0F0F0F]'
      } ${
        isHovered && !isDragOver ? 'shadow-lg shadow-black/50 border-white/20' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-xl transition-all ${
          isToday 
            ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30' 
            : 'text-gray-500 group-hover:text-white group-hover:bg-white/10'
        }`}>
          {day}
        </div>
        {dayEvents.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded-lg text-gray-400 font-mono font-bold backdrop-blur-sm">
              {dayEvents.length}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5">
        <AnimatePresence>
          {dayEvents.length === 0 && isHovered && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full text-gray-600 text-[10px] font-medium"
            >
              <Plus size={12} className="mr-1" />
              Add event
            </motion.div>
          )}
          {dayEvents.slice(0, 3).map((event, idx) => (
              <DraggableEvent 
                  key={event.id || idx} 
                  event={event} 
                  onClick={onEventClick} 
                  theme={theme}
              />
          ))}
        </AnimatePresence>
        {dayEvents.length > 3 && (
          <button
            onClick={(e) => { e.stopPropagation(); onDayClick(); }}
            className="w-full text-[10px] text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg py-1.5 transition-all font-bold border border-white/5"
          >
            +{dayEvents.length - 3} more
          </button>
        )}
      </div>
      
      <AnimatePresence>
        {isDragOver && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none bg-blue-500/10 rounded-xl border-2 border-blue-500/50 border-dashed backdrop-blur-sm"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-2xl">
              Drop here
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// --- WEEK VIEW COMPONENT ---
const WeekView = React.memo(({ currentDate, eventsByDate, theme, onEventClick }) => {
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

  const hours = Array.from({ length: 15 }, (_, i) => i + 7);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#0A0A0A] to-[#0C0C0C] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
      <div className="grid grid-cols-8 border-b border-white/10 bg-gradient-to-r from-[#111] to-[#0F0F0F]">
        <div className="p-3 border-r border-white/10 bg-[#080808]"></div>
        {weekDates.map((date, i) => {
          const isToday = formatDate(date) === formatDate(new Date());
          return (
            <div key={i} className={`p-3 text-center border-r border-white/10 last:border-r-0 transition-colors ${isToday ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10' : 'hover:bg-white/[0.02]'}`}>
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className={`text-sm font-bold mt-1 ${isToday ? theme.accentText : 'text-white'}`}>
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="grid grid-cols-8">
           <div className="border-r border-white/10 bg-[#080808]">
              {hours.map(hour => (
                <div key={hour} className="h-16 border-b border-white/[0.05] text-[9px] text-gray-600 p-2 text-right font-mono font-bold">
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                </div>
              ))}
           </div>
           
           {weekDates.map((date, i) => {
             const dStr = formatDate(date);
             const dayEvents = eventsByDate[dStr] || [];
             
             return (
              <div key={i} className="border-r border-white/[0.05] last:border-r-0 relative group hover:bg-white/[0.02] transition-colors">
                {hours.map(h => <div key={h} className="h-16 border-b border-white/[0.03]"></div>)}
                
                <AnimatePresence>
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
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                        className={`absolute left-1 right-1 p-2 rounded-lg text-[9px] border leading-tight overflow-hidden cursor-pointer hover:brightness-125 hover:scale-105 z-10 transition-all ${getEventColor(ev.type, theme.isDev)} backdrop-blur-sm shadow-lg`}
                        style={{ top: `${top}%`, height: '40px' }} 
                      >
                        <div className="font-bold truncate">{ev.title}</div>
                        {ev.time && <div className="text-[8px] opacity-70 font-mono">{ev.time}</div>}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
             );
           })}
        </div>
      </div>
    </div>
  );
});

// --- EVENT MODAL COMPONENT ---
const EventModal = React.memo(({ isOpen, isPlanning, isEditing, onClose, onAdd, onUpdate, onDelete, onGenerate, settings, theme, isLoading, voiceHandler, ...props }) => {
    const [isEditingState, setIsEditingState] = useState(false);
    const dateInputRef = useRef(null);
    const timeInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            if (isPlanning || !isEditing) setIsEditingState(true);
            else setIsEditingState(false);
        }
    }, [isOpen, isPlanning, isEditing]);

    if (!isOpen) return null;

    const eventTypes = settings.developerMode 
      ? [ { value: 'task', label: 'Task' }, { value: 'deadline', label: 'Deadline' }, { value: 'release', label: 'Release' }, { value: 'general', label: 'General' } ]
      : [ { value: 'study', label: 'Study Session' }, { value: 'assignment', label: 'Assignment' }, { value: 'exam', label: 'Exam' }, { value: 'general', label: 'General' } ];

    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" 
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-[#0F0F0F] to-[#0A0A0A] border border-white/20 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            
            {!isEditingState && !isPlanning ? (
                <>
                    <div className={`p-8 relative overflow-hidden bg-gradient-to-br ${theme.softBg} border-b border-white/10`}>
                        <div className="absolute top-4 right-4 flex gap-2">
                             <button 
                               onClick={() => speakText(`${props.newEventTitle}. ${formatFriendlyDate(props.newEventDate)}${props.newEventTime ? ` at ${props.newEventTime}` : ''}. ${props.newEventNotes || 'No additional notes'}`)} 
                               className="p-2 bg-black/30 hover:bg-black/50 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105" 
                               title="Read aloud"
                             >
                               <Volume2 size={16} />
                             </button>
                             <button 
                               onClick={() => setIsEditingState(true)} 
                               className="p-2 bg-black/30 hover:bg-black/50 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105" 
                               title="Edit"
                             >
                               <Edit3 size={16} />
                             </button>
                             <button 
                               onClick={onClose} 
                               className="p-2 bg-black/30 hover:bg-black/50 text-white rounded-lg backdrop-blur-sm transition-all hover:scale-105" 
                               title="Close"
                             >
                               <X size={16} />
                             </button>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm ${theme.primaryBorder} ${theme.primaryText}`}>{props.newEventType}</span>
                            {props.newEventPriority === 'high' && (
                              <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-red-500/30 text-red-400 bg-red-500/10 flex items-center gap-1">
                                <AlertCircle size={10} /> High Priority
                              </span>
                            )}
                        </div>
                        
                        <h2 className="text-3xl font-bold text-white leading-tight mb-3">{props.newEventTitle}</h2>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-300 font-medium">
                            <div className="flex items-center gap-2">
                              <CalendarIcon size={14} className={theme.primaryText} />
                              {formatFriendlyDate(props.newEventDate)}
                            </div>
                            {props.newEventTime && (
                              <div className="flex items-center gap-2">
                                <Clock size={14} className={theme.primaryText} />
                                {props.newEventTime}
                              </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-[#0F0F0F] to-[#0A0A0A] flex-1 overflow-y-auto custom-scrollbar">
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <AlignLeft size={12} /> Notes & Details
                            </h4>
                            <div className="p-4 rounded-xl bg-[#151515] border border-white/10 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {props.newEventNotes || "No additional notes provided for this event."}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-6 border-t border-white/10">
                             <button 
                               onClick={onDelete} 
                               className="text-red-400 hover:text-red-300 text-sm font-bold flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-all"
                             >
                               <Trash2 size={16} /> Delete Event
                             </button>
                             <button 
                               onClick={onClose} 
                               className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
                             >
                               Close
                             </button>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-[#151515] to-[#111]">
                        <div className="flex items-center gap-3">
                            {isEditing && !isPlanning && (
                              <button 
                                onClick={() => setIsEditingState(false)} 
                                className="text-gray-500 hover:text-white transition-all hover:scale-110"
                              >
                                <ArrowLeft size={18} />
                              </button>
                            )}
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                {isPlanning ? (
                                    <>
                                      <div className={`p-1.5 rounded-lg ${theme.softBg} ${theme.accentText}`}>
                                        <Sparkles size={16} />
                                      </div> 
                                      {settings.developerMode ? "Sprint Planner" : "Study Plan"}
                                    </>
                                ) : (
                                    <>
                                      <div className="p-1.5 rounded-lg bg-white/10 text-white">
                                        <Edit3 size={16} />
                                      </div> 
                                      {isEditing ? "Edit Details" : "New Event"}
                                    </>
                                )}
                            </h3>
                        </div>
                        <button 
                          onClick={onClose} 
                          className="text-gray-500 hover:text-white transition-all hover:scale-110"
                        >
                          <X size={18} />
                        </button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                    {isPlanning ? (
                        <>
                        <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-200">
                            <strong className="block mb-1 flex items-center gap-2 font-bold">
                              <Sparkles size={12}/> AI Generator
                            </strong>
                            Tell Chronos what to plan, and it will build a schedule for you.
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2">
                              <Tag size={12}/> Topic
                            </label>
                            <input 
                              autoFocus 
                              value={props.planTopic} 
                              onChange={(e) => props.setPlanTopic(e.target.value)} 
                              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors" 
                              placeholder="e.g. Calculus Final" 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2">
                                  <Target size={12}/> Deadline
                                </label>
                                <input 
                                  type="date" 
                                  value={props.planDate} 
                                  onChange={(e) => props.setPlanDate(e.target.value)} 
                                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/50 cursor-pointer [color-scheme:dark] transition-colors" 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2">
                                  <Clock size={12}/> Duration
                                </label>
                                <input 
                                  type="number" 
                                  value={props.planDuration} 
                                  onChange={(e) => props.setPlanDuration(e.target.value)} 
                                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors" 
                                  placeholder="Hours" 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2">
                              <AlertCircle size={12}/> Goals
                            </label>
                            <textarea 
                              value={props.planGoals} 
                              onChange={(e) => props.setPlanGoals(e.target.value)} 
                              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/50 resize-none h-24 transition-colors" 
                              placeholder="Specific areas to cover..." 
                            />
                        </div>
                        </>
                    ) : (
                        <>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                            <label className="text-xs font-bold text-gray-400 mb-2">Type</label>
                            <select 
                              value={props.newEventType} 
                              onChange={(e) => props.setNewEventType(e.target.value)} 
                              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/50 cursor-pointer [color-scheme:dark] transition-colors"
                            >
                                {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            </div>
                            <div>
                            <label className="text-xs font-bold text-gray-400 mb-2">Priority</label>
                            <select 
                              value={props.newEventPriority} 
                              onChange={(e) => props.setNewEventPriority(e.target.value)} 
                              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/50 cursor-pointer [color-scheme:dark] transition-colors"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 flex items-center justify-between">
                              <span>Title</span>
                              {voiceHandler?.isSupported && (
                                <button
                                  type="button"
                                  onClick={voiceHandler.isListening ? voiceHandler.stopListening : voiceHandler.startListening}
                                  className={`p-1.5 rounded-lg transition-all ${voiceHandler.isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                  title={voiceHandler.isListening ? "Stop listening" : "Voice input"}
                                >
                                  {voiceHandler.isListening ? <MicOff size={12} /> : <Mic size={12} />}
                                </button>
                              )}
                            </label>
                            <input 
                              value={props.newEventTitle} 
                              onChange={(e) => props.setNewEventTitle(e.target.value)} 
                              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors" 
                              placeholder="Event name..." 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2">
                              <CalendarIcon size={12}/> Date
                            </label>
                            <div 
                              onClick={() => dateInputRef.current?.showPicker?.()} 
                              className="relative cursor-pointer"
                            >
                              <input 
                                ref={dateInputRef}
                                type="date" 
                                value={props.newEventDate} 
                                onChange={(e) => props.setNewEventDate(e.target.value)} 
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/50 cursor-pointer [color-scheme:dark] hover:border-white/30 transition-colors" 
                              />
                            </div>
                            </div>
                            <div>
                            <label className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2">
                              <Clock size={12}/> Time
                            </label>
                            <div 
                              onClick={() => timeInputRef.current?.showPicker?.()} 
                              className="relative cursor-pointer"
                            >
                              <input 
                                ref={timeInputRef}
                                type="time" 
                                value={props.newEventTime} 
                                onChange={(e) => props.setNewEventTime(e.target.value)} 
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/50 cursor-pointer [color-scheme:dark] hover:border-white/30 transition-colors" 
                              />
                            </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-2">Notes</label>
                            <textarea 
                              value={props.newEventNotes} 
                              onChange={(e) => props.setNewEventNotes(e.target.value)} 
                              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/50 resize-none h-20 transition-colors" 
                              placeholder="Add details..." 
                            />
                        </div>
                        </>
                    )}
                    </div>

                    <div className="p-5 border-t border-white/10 bg-gradient-to-r from-[#151515] to-[#111] rounded-b-2xl flex justify-end gap-3">
                    <button 
                      onClick={() => isEditing && !isPlanning ? setIsEditingState(false) : onClose()} 
                      className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-all font-medium" 
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button 
                        onClick={isPlanning ? onGenerate : (isEditing ? onUpdate : onAdd)} 
                        disabled={isLoading || (isPlanning ? !props.planTopic : !props.newEventTitle)} 
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isPlanning 
                                ? `${theme.primaryBg} text-white hover:brightness-110` 
                                : 'bg-gradient-to-r from-white to-gray-100 text-black hover:from-gray-100 hover:to-white' 
                        }`}
                    >
                        {isLoading ? (
                          <Sparkles size={14} className="animate-spin" />
                        ) : isPlanning ? (
                          <Sparkles size={14}/>
                        ) : (
                          <CheckCircle2 size={14}/>
                        )}
                        {isPlanning ? (isLoading ? 'Creating Plan...' : 'Generate Plan') : (isEditing ? 'Save Changes' : 'Save Event')}
                    </button>
                    </div>
                </>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
});

// --- MAIN CHRONOS COMPONENT ---
export const Chronos = React.memo(() => {
  const { calendarEvents, addEvent, updateEvent, deleteEvent, generateSchedule, theme, settings, isLoading } = useLumina();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [naturalInput, setNaturalInput] = useState("");
  const [notification, setNotification] = useState(null);
  
  // Form State
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventType, setNewEventType] = useState(settings.developerMode ? 'task' : 'study');
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventPriority, setNewEventPriority] = useState("medium");
  const [newEventNotes, setNewEventNotes] = useState(""); 
  
  // Planning State
  const [planTopic, setPlanTopic] = useState("");
  const [planDate, setPlanDate] = useState("");
  const [planDuration, setPlanDuration] = useState("");
  const [planGoals, setPlanGoals] = useState("");

  const handleVoiceResult = useCallback((transcript) => {
    const parsed = parseNaturalLanguage(transcript);
    setNewEventTitle(parsed.title);
    setNewEventDate(parsed.date);
    if (parsed.time) setNewEventTime(parsed.time);
  }, []);

  const voiceHandler = useVoiceRecognition(handleVoiceResult);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const changeDate = useCallback((delta) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      viewMode === 'month' ? d.setMonth(d.getMonth() + delta) : d.setDate(d.getDate() + (delta * 7));
      return d;
    });
  }, [viewMode]);

  const showNotification = (message) => {
      setNotification(message);
      setTimeout(() => setNotification(null), 3000);
  };

  const handleNaturalSubmit = (e) => {
      if (e.key === 'Enter' && naturalInput) {
          const lower = naturalInput.toLowerCase();
          
          if (lower.includes('plan') || lower.includes('schedule') || lower.includes('generate')) {
             const topic = naturalInput.replace(/plan|schedule|generate|sprint|for/gi, '').trim();
             if (topic) {
                 const deadline = new Date();
                 deadline.setDate(deadline.getDate() + 7);
                 const deadlineStr = formatDate(deadline);
                 
                 generateSchedule(topic, deadlineStr, 10, "Generated via Chronos Command Bar", "");
                 showNotification(`Generating plan for "${topic}"...`);
                 setNaturalInput("");
                 return;
             }
          }

          const parsed = parseNaturalLanguage(naturalInput);
          if (parsed.title) {
            addEvent(
                parsed.title, 
                parsed.date, 
                'task', 
                'medium', 
                `Created via command: "${naturalInput}"`, 
                parsed.time
            );
            showNotification(`Scheduled "${parsed.title}" for ${formatFriendlyDate(parsed.date)}`);
            setNaturalInput("");
          }
      }
  };

  const handleDropEvent = useCallback((eventId, targetDate) => {
      const event = calendarEvents.find(e => e.id === eventId);
      
      if (event && updateEvent) {
          updateEvent(eventId, { ...event, date: targetDate });
          showNotification(`"${event.title}" moved to ${formatFriendlyDate(targetDate)}`);
      }
  }, [calendarEvents, updateEvent]);

  const openNewEvent = (dateStr) => {
      setEditingEvent(null);
      setIsPlanning(false);
      setNewEventTitle("");
      setNewEventDate(dateStr || formatDate(new Date()));
      setNewEventTime("");
      setNewEventNotes("");
      setIsModalOpen(true);
  };

  const openEditEvent = (event) => {
      setEditingEvent(event);
      setIsPlanning(false);
      setNewEventTitle(event.title);
      setNewEventDate(event.date);
      setNewEventType(event.type);
      setNewEventTime(event.time || "");
      setNewEventPriority(event.priority || "medium");
      setNewEventNotes(event.notes || "");
      setIsModalOpen(true);
  };

  const handleAdd = () => {
    if (newEventTitle && newEventDate) {
      addEvent(newEventTitle, newEventDate, newEventType, newEventPriority, newEventNotes, newEventTime);
      closeModal();
      showNotification(`Event "${newEventTitle}" created successfully`);
    }
  };

  const handleUpdate = () => {
    if (editingEvent && updateEvent) {
        updateEvent(editingEvent.id, {
            title: newEventTitle,
            date: newEventDate,
            type: newEventType,
            time: newEventTime,
            priority: newEventPriority,
            notes: newEventNotes
        });
        closeModal();
        showNotification(`Event "${newEventTitle}" updated`);
    } else {
        if(deleteEvent) deleteEvent(editingEvent.id);
        addEvent(newEventTitle, newEventDate, newEventType, newEventPriority, newEventNotes, newEventTime);
        closeModal();
    }
  };

  const handleDelete = () => {
    if (editingEvent && deleteEvent) {
        const title = editingEvent.title;
        deleteEvent(editingEvent.id);
        closeModal();
        showNotification(`Event "${title}" deleted`);
    } else {
        console.error("Delete function missing");
        closeModal();
    }
  };

  const handleGenerate = () => {
    if (planTopic && planDate) {
      generateSchedule(planTopic, planDate, planDuration, planGoals, "");
      closeModal();
      showNotification(`Generating plan for "${planTopic}"...`);
    }
  };

  const handleImportICS = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ics,.ical';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        console.log('📁 File selected:', file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const icsContent = event.target.result;
            console.log('📄 File content loaded, length:', icsContent.length);
            
            const importedEvents = parseICS(icsContent);
            console.log('🔍 Parsed events:', importedEvents);
            
            if (importedEvents.length === 0) {
              showNotification("❌ No events found in calendar file");
              return;
            }
            
            let successCount = 0;
            let failCount = 0;
            
            importedEvents.forEach((evt, index) => {
              try {
                console.log(`Adding event ${index + 1}/${importedEvents.length}:`, evt);
                
                if (typeof addEvent === 'function') {
                  addEvent(evt.title, evt.date, evt.type, evt.priority, evt.notes, evt.time);
                  successCount++;
                  console.log(`✅ Successfully added: ${evt.title}`);
                } else {
                  console.error('❌ addEvent function not available');
                  failCount++;
                }
              } catch (error) {
                console.error('❌ Error adding event:', evt.title, error);
                failCount++;
              }
            });
            
            console.log(`Import complete: ${successCount} success, ${failCount} failed`);
            
            if (successCount > 0) {
              showNotification(`✅ Successfully imported ${successCount} event(s)${failCount > 0 ? ` (${failCount} failed)` : ''}`);
            } else {
              showNotification("❌ Failed to import events");
            }
          } catch (error) {
            console.error('❌ Error parsing calendar file:', error);
            showNotification("❌ Error importing calendar file");
          }
        };
        reader.onerror = (error) => {
          console.error('❌ Error reading file:', error);
          showNotification("❌ Error reading calendar file");
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [addEvent, showNotification]);

  const closeModal = () => {
    setIsModalOpen(false); setIsPlanning(false); setEditingEvent(null);
    setNewEventTitle(""); setNewEventDate(""); setNewEventTime(""); setPlanTopic(""); setPlanDate(""); setNewEventNotes("");
  };

  const eventsByDate = useMemo(() => {
    return calendarEvents.reduce((acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    }, {});
  }, [calendarEvents]);

  const todayStr = formatDate(new Date());

  const calendarDays = useMemo(() => {
    const days = Array(firstDayOfMonth).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [daysInMonth, firstDayOfMonth]);

  return (
    <div className="flex-1 h-full flex flex-col p-6 bg-[#030304] overflow-hidden relative">
      <div className="max-w-[1600px] w-full mx-auto h-full flex flex-col">
        
        {/* Notification */}
        <AnimatePresence>
            {notification && (
                <motion.div 
                    initial={{ y: 50, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 50, opacity: 0, scale: 0.9 }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] bg-gradient-to-r from-[#151515] to-[#111] border border-green-500/30 text-green-400 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold backdrop-blur-xl"
                >
                    <CheckCircle2 size={18} className="flex-shrink-0" /> 
                    {notification}
                </motion.div>
            )}
        </AnimatePresence>

        {/* Command Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 relative group z-20"
        >
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
                <Sparkles size={18} className={naturalInput ? "animate-pulse text-blue-400" : ""} />
            </div>
            <input 
                type="text" 
                value={naturalInput}
                onChange={(e) => setNaturalInput(e.target.value)}
                onKeyDown={handleNaturalSubmit}
                placeholder="Ask Chronos: 'Plan sprint for Physics', 'Meeting on Friday', or 'Call Mom at 5pm'..."
                className="w-full bg-gradient-to-r from-[#0A0A0A] to-[#0C0C0C] border border-white/10 rounded-2xl py-4 pl-12 pr-28 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-lg placeholder-gray-600"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {voiceHandler.isSupported && (
                <button
                  onClick={voiceHandler.isListening ? voiceHandler.stopListening : voiceHandler.startListening}
                  className={`p-2 rounded-lg transition-all ${
                    voiceHandler.isListening 
                      ? 'bg-red-500/20 text-red-400 animate-pulse' 
                      : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                  }`}
                  title={voiceHandler.isListening ? "Stop listening" : "Voice input"}
                >
                  {voiceHandler.isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              )}
              <div className="text-[10px] text-gray-600 border border-white/10 px-2 py-1 rounded-lg opacity-50 group-focus-within:opacity-100 transition-opacity font-mono font-bold">
                ENTER
              </div>
            </div>
        </motion.div>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between pb-5 border-b border-white/10 flex-shrink-0 mb-5 z-10"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${theme.softBg} ${theme.accentText} shadow-lg`}>
                <CalendarIcon size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h1>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {calendarEvents.length} event{calendarEvents.length !== 1 ? 's' : ''} scheduled
                </p>
              </div>
            </div>
            <div className="flex bg-gradient-to-r from-[#111] to-[#0F0F0F] rounded-xl border border-white/10 p-1 shadow-lg">
              <button 
                onClick={() => changeDate(-1)} 
                className="p-2 hover:text-white text-gray-500 rounded-lg hover:bg-white/10 transition-all"
              >
                <ChevronLeft size={16}/>
              </button>
              <button 
                onClick={() => setCurrentDate(new Date())} 
                className="px-3 text-xs font-bold text-gray-400 hover:text-white transition-colors"
              >
                Today
              </button>
              <button 
                onClick={() => changeDate(1)} 
                className="p-2 hover:text-white text-gray-500 rounded-lg hover:bg-white/10 transition-all"
              >
                <ChevronRight size={16}/>
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex bg-gradient-to-r from-[#111] to-[#0F0F0F] rounded-xl border border-white/10 p-1 mr-2 shadow-lg">
                <button 
                  onClick={() => setViewMode('month')} 
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    viewMode === 'month' ? 'bg-white/10 text-white shadow-inner' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <Grid size={14}/> Month
                </button>
                <button 
                  onClick={() => setViewMode('week')} 
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    viewMode === 'week' ? 'bg-white/10 text-white shadow-inner' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <Layout size={14}/> Week
                </button>
            </div>
            
            <button 
              onClick={handleImportICS} 
              className="p-2.5 bg-gradient-to-r from-[#111] to-[#0F0F0F] border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all hover:scale-105 shadow-lg" 
              title="Import Calendar (.ics)"
            >
              <Upload size={16}/>
            </button>
            <button 
              onClick={() => generateICS(calendarEvents)} 
              className="p-2.5 bg-gradient-to-r from-[#111] to-[#0F0F0F] border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all hover:scale-105 shadow-lg" 
              title="Export ICS"
            >
              <Download size={16}/>
            </button>
            
            <button 
              onClick={() => openNewEvent(formatDate(new Date()))} 
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-white to-gray-100 text-black hover:from-gray-100 hover:to-white rounded-xl text-xs font-bold transition-all hover:scale-105 shadow-lg"
            >
                <Plus size={14}/> Add Event
            </button>
          </div>
        </motion.div>

        {/* Calendar View */}
        <div className="flex-1 min-h-0 relative z-0">
          {viewMode === 'month' ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col"
            >
                <div className="grid grid-cols-7 gap-px mb-3">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest py-2">
                      {d.slice(0, 3)}
                    </div>
                  ))}
                </div>
                <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-3">
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
                            onDayClick={() => { if(day) openNewEvent(dateStr); }}
                            onEventClick={openEditEvent}
                            onDropEvent={handleDropEvent}
                        />
                    );
                  })}
                </div>
            </motion.div>
          ) : (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
             >
               <WeekView 
                  currentDate={currentDate} 
                  eventsByDate={eventsByDate} 
                  theme={{...theme, isDev: settings.developerMode}} 
                  onEventClick={openEditEvent}
               />
             </motion.div>
          )}
        </div>
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={isModalOpen}
        isPlanning={isPlanning}
        isEditing={!!editingEvent}
        onClose={closeModal}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onGenerate={handleGenerate}
        settings={settings}
        theme={theme}
        isLoading={isLoading}
        voiceHandler={voiceHandler}
        newEventTitle={newEventTitle} setNewEventTitle={setNewEventTitle}
        newEventDate={newEventDate} setNewEventDate={setNewEventDate}
        newEventType={newEventType} setNewEventType={setNewEventType}
        newEventTime={newEventTime} setNewEventTime={setNewEventTime}
        newEventPriority={newEventPriority} setNewEventPriority={setNewEventPriority}
        newEventNotes={newEventNotes} setNewEventNotes={setNewEventNotes}
        planTopic={planTopic} setPlanTopic={setPlanTopic}
        planDate={planDate} setPlanDate={setPlanDate}
        planDuration={planDuration} setPlanDuration={setPlanDuration}
        planGoals={planGoals} setPlanGoals={setPlanGoals}
      />
    </div>
  );
});