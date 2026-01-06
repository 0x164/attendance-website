
import React, { useState } from 'react';
import { AcademicWeek } from '../types';

interface AttendanceTrackerProps {
  week: AcademicWeek;
  attendance: { [sessionId: string]: string };
  onUpdateCode: (sessionId: string, code: string) => void;
  onBack: () => void;
  onClear: () => void;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ 
  week, 
  attendance, 
  onUpdateCode, 
  onBack,
  onClear
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
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
    } catch (err) {
      console.error('Failed to copy full schedule!', err);
    }
  };

  const handleClear = () => {
    onClear();
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors py-2 px-1"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Weeks
        </button>
        <div className="flex gap-2">
          <button 
            onClick={handleClear}
            className="px-4 py-2 text-xs font-bold text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-xl transition-all border border-rose-200 dark:border-rose-900 shadow-sm active:scale-95"
          >
            Clear Codes
          </button>
          <button 
            onClick={copyFullSchedule}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center active:scale-95"
          >
            {copiedId === 'full_schedule' ? (
              <>
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy All
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="bg-slate-50/50 dark:bg-slate-800/30 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{week.label}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
            Tap code to copy • Type in attendance codes
          </p>
        </div>

        <div className="p-6 space-y-10">
          {week.schedule.map((day) => (
            <section key={day.date} className="relative">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 mb-5 border-b border-slate-50 dark:border-slate-800/50 pb-2 uppercase tracking-tighter">
                {day.day} • {day.date}
              </h3>
              
              <div className="space-y-4">
                {day.sessions.map((session) => (
                  <div 
                    key={session.id} 
                    className="group flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    <div 
                      className="cursor-pointer select-none mb-3 sm:mb-0"
                      onClick={() => copyToClipboard(`${session.courseCode} ${session.sessionType}`, session.id)}
                    >
                      <div className="flex items-center">
                        <span className="text-slate-700 dark:text-slate-100 font-bold font-mono text-base bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-sm group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:border-indigo-200 dark:group-hover:border-indigo-800 transition-all">
                          {session.courseCode} {session.sessionType}
                        </span>
                        {copiedId === session.id && (
                          <span className="ml-3 text-xs font-black text-indigo-500 dark:text-indigo-400 animate-pulse">
                            COPIED
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="hidden sm:inline text-xs font-bold text-slate-200 dark:text-slate-800">——</span>
                      <input
                        type="text"
                        value={attendance[session.id] || ''}
                        onChange={(e) => onUpdateCode(session.id, e.target.value)}
                        placeholder="XXXXX"
                        maxLength={5}
                        className="w-28 px-4 py-3 text-center font-mono font-black text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 focus:border-indigo-500 bg-white dark:bg-slate-950 shadow-inner transition-all uppercase placeholder:text-slate-200 dark:placeholder:text-slate-800 text-lg"
                      />
                    </div>
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

export default AttendanceTracker;
