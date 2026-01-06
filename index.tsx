import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// --- INTERFACES ---
interface Session {
  id: string;
  courseCode: string;
  sessionType: string;
}

interface DailySchedule {
  day: string;
  date: string;
  sessions: Session[];
}

interface AcademicWeek {
  id: string;
  weekNumber: number;
  label: string;
  startDate: Date;
  endDate: Date;
  schedule: DailySchedule[];
  monthLabel: string;
}

interface AttendanceStore {
  [weekId: string]: {
    [sessionId: string]: string;
  };
}

// --- UTILS ---
const copyToClipboard = async (text: string) => {
  if (typeof window !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Clipboard API failed, trying fallback', err);
    }
  }
  
  // Fallback for environments where navigator.clipboard is unavailable
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback copy failed', err);
    document.body.removeChild(textArea);
    return false;
  }
};

// --- DATA GENERATION & CONSTANTS ---
const DEFAULT_SCHEDULE: Omit<DailySchedule, 'date'>[] = [
  { day: 'Monday', sessions: [{ id: 'mon_1', courseCode: 'FIT1047', sessionType: 'W02' }] },
  { day: 'Tuesday', sessions: [
    { id: 'tue_1', courseCode: 'FIT1058', sessionType: 'W02-P1' },
    { id: 'tue_2', courseCode: 'FIT1058', sessionType: 'W02-P2' },
    { id: 'tue_3', courseCode: 'FIT1051', sessionType: 'W01' }
  ]},
  { day: 'Wednesday', sessions: [
    { id: 'wed_1', courseCode: 'FIT1045', sessionType: 'W02' },
    { id: 'wed_2', courseCode: 'FIT1058', sessionType: 'A01' }
  ]},
  { day: 'Thursday', sessions: [{ id: 'thu_1', courseCode: 'FIT1047', sessionType: 'A01' }] },
  { day: 'Friday', sessions: [
    { id: 'fri_1', courseCode: 'FIT1051', sessionType: 'A08' },
    { id: 'fri_2', courseCode: 'FIT1045', sessionType: 'A08' }
  ]}
];

const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const generateWeeks = (count: number, startDate: Date): AcademicWeek[] => {
  const weeks: AcademicWeek[] = [];
  let current = new Date(startDate);
  for (let i = 0; i < count; i++) {
    const monday = new Date(current);
    const friday = new Date(current); 
    friday.setDate(monday.getDate() + 4);
    
    const schedule = DEFAULT_SCHEDULE.map((t, idx) => {
      const d = new Date(monday); 
      d.setDate(monday.getDate() + idx);
      return { 
        ...t, 
        date: `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}` 
      };
    });

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthLabel = `${monthNames[monday.getMonth()]} ${monday.getFullYear()}`;
    const label = `Mon ${getOrdinal(monday.getDate())} - Fri ${getOrdinal(friday.getDate())}`;
    
    weeks.push({ 
      id: `w${i+1}`, 
      weekNumber: i + 1,
      label, 
      startDate: new Date(monday), 
      endDate: new Date(friday), 
      schedule,
      monthLabel
    });
    current.setDate(current.getDate() + 7);
  }
  return weeks;
};

/**
 * CALCULATION:
 * Jan 6, 2026 (Tuesday) is Week 10.
 * Week 10 Monday is Jan 5, 2026.
 * Week 1 Monday = Jan 5, 2026 - (9 * 7 days) = Nov 3, 2025.
 */
const ACADEMIC_WEEKS = generateWeeks(20, new Date(2025, 10, 3)); 

// --- COMPONENTS ---

const WeekSelector = ({ onSelect }: { onSelect: (w: AcademicWeek) => void }) => {
  const now = new Date();
  
  const groupedWeeks = ACADEMIC_WEEKS.reduce((acc, week) => {
    if (!acc[week.monthLabel]) acc[week.monthLabel] = [];
    acc[week.monthLabel].push(week);
    return acc;
  }, {} as Record<string, AcademicWeek[]>);

  return (
    <div className="w-full max-w-5xl space-y-12 animate-in fade-in duration-500 px-4">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Select Academic Week</h2>
        <p className="text-slate-500 dark:text-slate-400">Track and share university attendance codes</p>
      </div>

      {Object.entries(groupedWeeks).map(([month, weeks]) => (
        <div key={month} className="space-y-6">
          <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest pl-2 flex items-center gap-4">
            {month}
            <div className="h-px bg-indigo-100 dark:bg-indigo-900/50 flex-grow"></div>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weeks.map((w) => {
              const isCurrent = now >= w.startDate && now < new Date(w.startDate.getTime() + 7 * 86400000);
              return (
                <button 
                  key={w.id} 
                  onClick={() => onSelect(w)} 
                  className={`flex items-center justify-between p-6 bg-white dark:bg-slate-900 border rounded-2xl transition-all text-left group relative ${
                    isCurrent 
                    ? 'border-indigo-500 ring-4 ring-indigo-500/10 dark:ring-indigo-500/5' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase tracking-widest ${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                        Week {w.weekNumber}
                      </span>
                      {isCurrent && (
                        <span className="bg-indigo-600 text-[10px] text-white font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Current</span>
                      )}
                    </div>
                    <h3 className={`text-lg font-semibold ${isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'} group-hover:text-indigo-600 transition-colors`}>
                      {w.label}
                    </h3>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCurrent ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                    →
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const AttendanceTracker = ({ week, attendance, onUpdate, onBack }: any) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const copy = async (text: string, id: string) => {
    if (!text || text === 'XXXXX') return;
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setTimeout(() => {
      inputRefs.current[id]?.focus();
    }, 50);
  };

  return (
    <div className="w-full max-w-2xl animate-in slide-in-from-right-8 duration-500 px-4 pb-20">
      <div className="flex items-center justify-start mb-8">
        <button onClick={onBack} className="text-slate-500 font-bold hover:text-indigo-600 flex items-center transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          All Weeks
        </button>
      </div>
      
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-10 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Week {week.weekNumber}</span>
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white">{week.label}</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" /></svg>
            Click code to copy
          </p>
        </div>
        
        <div className="p-10 space-y-14">
          {week.schedule.map((day: any) => (
            <div key={day.date}>
              <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800 pb-3 mb-6 flex justify-between">
                <span>{day.day}</span>
                <span className="font-mono">{day.date}</span>
              </h3>
              <div className="space-y-5">
                {day.sessions.map((s: any) => {
                  const val = attendance[s.id] || '';
                  const isFull = val.length === 5;
                  const isLocked = isFull && editingId !== s.id;
                  
                  return (
                    <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900 hover:shadow-sm transition-all group/row">
                      <button 
                        onClick={() => copy(`${s.courseCode} ${s.sessionType}`, s.id)} 
                        className="text-left font-mono font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 flex items-center group/btn"
                      >
                        <span className="border-b-2 border-dotted border-slate-300 dark:border-slate-700 group-hover/btn:border-indigo-600 transition-colors">
                          {s.courseCode} {s.sessionType}
                        </span>
                        {copiedId === s.id && <span className="ml-3 text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full animate-bounce">COPIED</span>}
                      </button>

                      <div className="flex items-center gap-2">
                        {isLocked ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => copy(val, `val_${s.id}`)}
                              className="w-36 text-center font-mono font-black py-2.5 rounded-xl bg-white dark:bg-slate-950 border-2 border-indigo-500/20 text-indigo-600 dark:text-indigo-400 uppercase hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-500 transition-all group/val shadow-sm flex items-center justify-center gap-2"
                            >
                              {copiedId === `val_${s.id}` ? (
                                <span className="flex items-center justify-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                  DONE
                                </span>
                              ) : (
                                <>
                                  {val}
                                  <svg className="w-3 h-3 opacity-40 group-hover/val:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                                </>
                              )}
                            </button>
                            <button 
                              onClick={() => handleEdit(s.id)}
                              className="p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-xl transition-all opacity-0 group-hover/row:opacity-100"
                              title="Edit code"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                          </div>
                        ) : (
                          <input 
                            ref={(el) => { if (el) inputRefs.current[s.id] = el; }}
                            type="text" 
                            maxLength={5} 
                            placeholder="XXXXX"
                            value={val}
                            onChange={(e) => onUpdate(s.id, e.target.value)}
                            onBlur={() => isFull && setEditingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && isFull && setEditingId(null)}
                            className="w-32 text-center font-mono font-black py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 uppercase focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none shadow-inner transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [selectedWeek, setSelectedWeek] = useState<AcademicWeek | null>(null);
  const [attendance, setAttendance] = useState<AttendanceStore>({});
  const [isDarkMode, setIsDarkMode] = useState(typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false);

  useEffect(() => {
    fetch('/api/attendance').then(r => r.json()).then(setAttendance).catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const update = (sid: string, val: string) => {
    const next = { 
      ...attendance, 
      [selectedWeek!.id]: { 
        ...(attendance[selectedWeek!.id] || {}), 
        [sid]: val.toUpperCase().slice(0, 5) 
      } 
    };
    setAttendance(next);
    fetch('/api/attendance', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(next) 
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-2 flex flex-col items-center transition-colors duration-500">
      <div className="w-full max-w-5xl flex justify-between items-center mb-12 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">UniAttend</h1>
        </div>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)} 
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:scale-110 active:scale-95 text-xl"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>
      
      {!selectedWeek ? (
        <WeekSelector onSelect={setSelectedWeek} />
      ) : (
        <AttendanceTracker 
          week={selectedWeek} 
          attendance={attendance[selectedWeek.id] || {}} 
          onUpdate={update} 
          onBack={() => setSelectedWeek(null)} 
        />
      )}
      
      <footer className="mt-auto pt-16 pb-8 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] flex flex-col items-center gap-2">
        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mb-2"></div>
        University Attendance Tracker v2.6
        <span className="opacity-50 font-medium tracking-normal text-[8px]">Current Time: {new Date().toLocaleDateString()}</span>
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
