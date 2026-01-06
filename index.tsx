import React, { useState, useEffect } from 'react';
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
    const friday = new Date(current); friday.setDate(monday.getDate() + 4);
    const schedule = DEFAULT_SCHEDULE.map((t, idx) => {
      const d = new Date(monday); d.setDate(monday.getDate() + idx);
      return { ...t, date: `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}` };
    });
    const label = `Mon ${getOrdinal(monday.getDate())} - Fri ${getOrdinal(friday.getDate())}`;
    weeks.push({ id: `w${i+1}`, label, startDate: new Date(monday), endDate: new Date(friday), schedule });
    current.setDate(current.getDate() + 7);
  }
  return weeks;
};

const ACADEMIC_WEEKS = generateWeeks(15, new Date(2025, 11, 15)); // Starting Dec 15th 2025

// --- COMPONENTS ---

const WeekSelector = ({ onSelect }: { onSelect: (w: AcademicWeek) => void }) => (
  <div className="w-full max-w-2xl space-y-4 animate-in fade-in duration-500">
    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Select Your Week</h2>
      <p className="text-slate-500 dark:text-slate-400">Track and share university attendance codes</p>
    </div>
    <div className="grid grid-cols-1 gap-3">
      {ACADEMIC_WEEKS.map((w, idx) => (
        <button key={w.id} onClick={() => onSelect(w)} className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-500 transition-all text-left group">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Week {idx+1}</span>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">{w.label}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">→</div>
        </button>
      ))}
    </div>
  </div>
);

const AttendanceTracker = ({ week, attendance, onUpdate, onBack }: any) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const copyAll = async () => {
    let out = `In the order of lessons in the week:\n\n`;
    week.schedule.forEach((d: any) => {
      out += `${d.day}, ${d.date}\n`;
      d.sessions.forEach((s: any) => out += `${s.courseCode} ${s.sessionType} - ${attendance[s.id] || 'XXXXX'}\n`);
      out += `\n`;
    });
    copy(out.trim(), 'all');
  };

  return (
    <div className="w-full max-w-2xl animate-in slide-in-from-right-8 duration-500">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-slate-500 font-bold hover:text-indigo-600 flex items-center">← Back</button>
        <button onClick={copyAll} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all">
          {copiedId === 'all' ? 'Copied!' : 'Copy All Text'}
        </button>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{week.label}</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Order of lessons (Click code to copy)</p>
        </div>
        <div className="p-8 space-y-12">
          {week.schedule.map((day: any) => (
            <div key={day.date}>
              <h3 className="text-sm font-black text-slate-400 uppercase border-b border-slate-50 dark:border-slate-800 pb-2 mb-4">{day.day}, {day.date}</h3>
              <div className="space-y-4">
                {day.sessions.map((s: any) => (
                  <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                    <button onClick={() => copy(`${s.courseCode} ${s.sessionType}`, s.id)} className="text-left font-mono font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 flex items-center">
                      {s.courseCode} {s.sessionType} — 
                      {copiedId === s.id && <span className="ml-2 text-[10px] text-indigo-500 animate-pulse">COPIED</span>}
                    </button>
                    <input 
                      type="text" 
                      maxLength={5} 
                      placeholder="XXXXX"
                      value={attendance[s.id] || ''}
                      onChange={(e) => onUpdate(s.id, e.target.value)}
                      className="w-full sm:w-28 text-center font-mono font-black py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-indigo-600 uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                ))}
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
  const [isDarkMode, setIsDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    fetch('/api/attendance').then(r => r.json()).then(setAttendance).catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const update = (sid: string, val: string) => {
    const next = { ...attendance, [selectedWeek!.id]: { ...(attendance[selectedWeek!.id] || {}), [sid]: val.toUpperCase().slice(0, 5) } };
    setAttendance(next);
    fetch('/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-2xl flex justify-end mb-8">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">{isDarkMode ? '☀️' : '🌙'}</button>
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
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);