
import React from 'react';
import { AcademicWeek } from '../types';

interface WeekSelectorProps {
  weeks: AcademicWeek[];
  onSelect: (week: AcademicWeek) => void;
}

const WeekSelector: React.FC<WeekSelectorProps> = ({ weeks, onSelect }) => {
  const now = new Date();
  
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-1">Select Academic Week</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Choose the week you want to log attendance for</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {weeks.map((week, index) => {
          const isCurrentWeek = now >= week.startDate && now <= new Date(week.endDate.getTime() + 86400000 * 2); // including weekend loosely
          
          return (
            <button
              key={week.id}
              onClick={() => onSelect(week)}
              className={`group relative flex flex-col items-start p-5 bg-white dark:bg-slate-900 border rounded-xl transition-all text-left ${
                isCurrentWeek 
                ? 'border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-900/40' 
                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:ring-2 hover:ring-indigo-50 dark:hover:ring-indigo-900/20'
              }`}
            >
              <div className="flex justify-between w-full mb-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${isCurrentWeek ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  Week {index + 1}
                </span>
                {isCurrentWeek && (
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold uppercase">
                    Current
                  </span>
                )}
              </div>
              <span className="text-base font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                {week.label}
              </span>
              <div className="mt-2 w-full h-1 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                 <div className={`h-full transition-all w-full ${isCurrentWeek ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700 group-hover:bg-indigo-300 dark:group-hover:bg-indigo-600'}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WeekSelector;
