
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// --- TYPES ---
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
  label: string;
  startDate: Date;
  endDate: Date;
  schedule: DailySchedule[];
}

interface AttendanceStore {
  [weekId: string]: {
    [sessionId: string]: string;
  };
}

// --- CONSTANTS & DATA GENERATION ---
const DEFAULT_SCHEDULE_TEMPLATE: Omit<DailySchedule, 'date'>[] = [
  {
    day: 'Monday',
    sessions: [
      { id: 'mon_1', courseCode: 'FIT1047', sessionType: 'W02' }
    ]
  },
  {
    day: 'Tuesday',
    sessions: [
      { id: 'tue_1', courseCode: 'FIT1058', sessionType: 'W02-P1' },
      { id: 'tue_2', courseCode: 'FIT1058', sessionType: 'W02-P2' },
      { id: 'tue_3', courseCode: 'FIT1051', sessionType: 'W01' }
    ]
  },
  {
    day: 'Wednesday',
    sessions: [
      { id: 'wed_1', courseCode: 'FIT1045', sessionType: 'W02' },
      { id: 'wed_2', courseCode: 'FIT1058', sessionType: 'A01' }
    ]
  },
  {
    day: 'Thursday',
    sessions: [
      { id: 'thu_1', courseCode: 'FIT1047', sessionType: 'A01' }
    ]
  },
  {
    day: 'Friday',
    sessions: [
      { id: 'fri_1', courseCode: 'FIT1051', sessionType: 'A08' },
      { id: 'fri_2', courseCode: 'FIT1045', sessionType: 'A08' }
    ]
  }
];

const getMonthName = (date: Date) => date.toLocaleString('default', { month: 'long' });
const formatDate = (date: Date): string => `${date.getDate()} ${getMonthName(date)} ${date.getFullYear()}`;
const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const generateWeeks = (count: number, startDate: Date): AcademicWeek[] => {
  const weeks: AcademicWeek[] = [];
  let currentStart = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const monday = new Date(currentStart);
    const friday = new Date(currentStart);
    friday.setDate(monday.getDate() + 4);

    const weekSchedule: DailySchedule[] = DEFAULT_SCHEDULE_TEMPLATE.map((template, dayIndex) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + dayIndex);
      return { ...template, date: formatDate(dayDate) };
    });

    const startLabel = `Mon ${getOrdinal(monday.getDate())} ${getMonthName(monday)}`;
    const endLabel = `Fri ${getOrdinal(friday.getDate())} ${getMonthName(friday)}`;

    weeks.push({
      id: `week_${i + 1}`,
      label: `${startLabel} - ${endLabel}`,
      startDate: new Date(monday),
      endDate: new Date(friday),
      schedule: weekSchedule
    });

    currentStart.setDate(currentStart.getDate() + 7);
  }
  return weeks;
};

const ACADEMIC_WEEKS = generateWeeks(15, new Date(2025, 10, 3));

// --- COMPONENTS ---

const WeekSelector: React.FC<{ weeks: AcademicWeek[], onSelect: (w: AcademicWeek) => void }> = ({ weeks, onSelect }) => {
  const now = new Date();
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-1">Select Academic Week</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Choose the week you want to log attendance for</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {weeks.map((week, index) => {
          const isCurrentWeek = now >= week.startDate && now <= new Date(week.endDate.getTime() + 86400000 * 2);
          return (
            <button
              key={week.id}
              onClick={() => onSelect(week)}
              className={`group relative flex flex-col items-start p-5 bg-white dark:bg-slate-900 border rounded-xl transition-all text-left ${
                isCurrentWeek 
                ? 'border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-900/40' 
                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-50 hover:ring-2 hover:ring-indigo-50 dark:hover:ring-indigo-900/20'
              }`}
            >
              <div className="flex justify-between w-full mb-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${isCurrentWeek ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  Week {index + 1}
                </span>
                {isCurrentWeek && (
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold uppercase">Current</span>
                )}
              </div>
              <span className="text-base font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                {week.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const AttendanceTracker: React.FC<{ 
  week: AcademicWeek, 
  attendance: { [sessionId: string]: string }, 
  onUpdateCode: (sid: string, c: string) => void, 
  onBack: () => void, 
  onClear: () => void 
}> = ({ week, attendance, onUpdateCode, onBack, onClear }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {}
  };

  const copyFullSchedule = async () => {
    let text = `Attendance for Week: ${week.label}\n\n`;
    text += "In the order of lessons in the week:\n\n";
    week.schedule.forEach(day => {
      text += `${day.day}, ${day.date}\n`;
      day.sessions.forEach(session => {
        const code = attendance[session.id] || "";
        text += `${session.courseCode} ${session.sessionType} - ${code}\n`;
      });
      text += "\n";
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId('full_schedule');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {}
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors py-2 px-1">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Weeks
        </button>
        <div className="flex gap-2">
          <button onClick={onClear} className="px-4 py-2 text-xs font-bold text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-xl transition-all border border-rose-200 dark:border-rose-900 active:scale-95">Clear Codes</button>
          <button onClick={copyFullSchedule} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center active:scale-95">
            {copiedId === 'full_schedule' ? 'Copied!' : 'Copy All'}
          </button>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="bg-slate-50/50 dark:bg-slate-800/30 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{week.label}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Tap code to copy • Type in attendance codes</p>
        </div>
        <div className="p-6 space-y-10">
          {week.schedule.map((day) => (
            <section key={day.date}>
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 mb-5 border-b border-slate-50 dark:border-slate-800/50 pb-2 uppercase tracking-tighter">
                {day.day} • {day.date}
              </h3>
              <div className="space-y-4">
                {day.sessions.map((session) => (
                  <div key={session.id} className="group flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <div className="cursor-pointer mb-3 sm:mb-0" onClick={() => copyToClipboard(`${session.courseCode} ${session.sessionType}`, session.id)}>
                      <div className="flex items-center">
                        <span className="text-slate-700 dark:text-slate-100 font-bold font-mono text-base bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-sm group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-all">
                          {session.courseCode} {session.sessionType}
                        </span>
                        {copiedId === session.id && <span className="ml-3 text-xs font-black text-indigo-500 animate-pulse">COPIED</span>}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={attendance[session.id] || ''}
                      onChange={(e) => onUpdateCode(session.id, e.target.value)}
                      placeholder="XXXXX"
                      maxLength={5}
                      className="w-28 px-4 py-3 text-center font-mono font-black text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-950 uppercase text-lg"
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState<AcademicWeek | null>(null);
  const [attendance, setAttendance] = useState<AttendanceStore>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('uni_theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    fetch('/api/attendance')
      .then(res => res.ok ? res.json() : {})
      .then(data => { setAttendance(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) { root.classList.add('dark'); localStorage.setItem('uni_theme', 'dark'); }
    else { root.classList.remove('dark'); localStorage.setItem('uni_theme', 'light'); }
  }, [isDarkMode]);

  const syncToServer = async (newAtt: AttendanceStore) => {
    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAtt)
      });
    } catch (err) {}
  };

  const handleUpdateCode = (weekId: string, sessionId: string, code: string) => {
    const updated = code.toUpperCase().slice(0, 5);
    setAttendance(prev => {
      const next = { ...prev, [weekId]: { ...(prev[weekId] || {}), [sessionId]: updated } };
      syncToServer(next);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center py-8 px-4 transition-colors duration-300">
      <header className="w-full max-w-2xl mb-8 flex items-center justify-between">
        <div className="flex-1"></div>
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-indigo-700 dark:text-indigo-400 tracking-tight">UniAttend</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Shared University Tracker</p>
        </div>
        <div className="flex-1 flex justify-end">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-sm active:scale-95">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>
      <main className="w-full max-w-2xl pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center py-20 text-indigo-500 animate-pulse">
            <p className="font-bold tracking-widest text-xs uppercase">Connecting to Server...</p>
          </div>
        ) : !selectedWeek ? (
          <WeekSelector weeks={ACADEMIC_WEEKS} onSelect={setSelectedWeek} />
        ) : (
          <AttendanceTracker 
            week={selectedWeek} 
            attendance={attendance[selectedWeek.id] || {}}
            onUpdateCode={(sid, c) => handleUpdateCode(selectedWeek.id, sid, c)}
            onBack={() => setSelectedWeek(null)}
            onClear={() => {
              const next = { ...attendance, [selectedWeek.id]: {} };
              setAttendance(next);
              syncToServer(next);
            }}
          />
        )}
      </main>
      <footer className="mt-auto pt-8 pb-4 text-slate-400 text-xs font-medium">© 2025 UniAttend Shared</footer>
    </div>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App />);
}
