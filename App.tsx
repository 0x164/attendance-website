
import React, { useState, useEffect, useRef } from 'react';
import { ACADEMIC_WEEKS } from './constants';
import { AcademicWeek, AttendanceStore } from './types';
import WeekSelector from './components/WeekSelector';
import AttendanceTracker from './components/AttendanceTracker';

const App: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState<AcademicWeek | null>(null);
  const [attendance, setAttendance] = useState<AttendanceStore>({});
  const [isLoading, setIsLoading] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('uni_theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial data from server on mount
  useEffect(() => {
    fetch('/api/attendance')
      .then(res => res.ok ? res.json() : {})
      .then(data => {
        setAttendance(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch from server:', err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('uni_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('uni_theme', 'light');
    }
  }, [isDarkMode]);

  // Helper to sync state to server
  const syncToServer = async (newAttendance: AttendanceStore) => {
    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAttendance)
      });
    } catch (err) {
      console.error('Failed to sync with server:', err);
    }
  };

  const handleUpdateCode = (weekId: string, sessionId: string, code: string) => {
    const updatedCode = code.toUpperCase().slice(0, 5);
    setAttendance(prev => {
      const currentWeekData = prev[weekId] || {};
      const next = {
        ...prev,
        [weekId]: {
          ...currentWeekData,
          [sessionId]: updatedCode
        }
      };
      syncToServer(next);
      return next;
    });
  };

  const handleClearWeek = (weekId: string) => {
    setAttendance(prev => {
      const next = { ...prev };
      next[weekId] = {};
      syncToServer(next);
      return { ...next };
    });
  };

  const exportToJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(attendance, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `uni_attendance_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const importFromJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = event => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (typeof json === 'object' && json !== null) {
            setAttendance(json);
            syncToServer(json);
            alert("Success! Your attendance codes have been imported and synced.");
          } else {
            throw new Error("Invalid format");
          }
        } catch (err) {
          alert("Error: The selected file is not a valid UniAttend JSON backup.");
        }
        e.target.value = "";
      };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center py-8 px-4 transition-colors duration-300">
      <header className="w-full max-w-2xl mb-8 flex items-center justify-between">
        <div className="flex-1"></div>
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-indigo-700 dark:text-indigo-400 tracking-tight mb-2">
            UniAttend
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            University Attendance Tracker
          </p>
        </div>
        <div className="flex-1 flex justify-end">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4-9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="w-full max-w-2xl pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-indigo-500 animate-pulse">
            <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="font-bold tracking-widest text-xs uppercase">Loading Shared Data...</p>
          </div>
        ) : !selectedWeek ? (
          <>
            <WeekSelector 
              weeks={ACADEMIC_WEEKS} 
              onSelect={setSelectedWeek} 
            />
            
            <div className="mt-12 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-widest">Global Backup</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Download a JSON copy of all shared attendance codes.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={exportToJson}
                  className="flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-xl transition-all text-sm font-bold active:scale-95"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export JSON
                </button>
                <button
                  onClick={handleImportClick}
                  className="flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 rounded-xl transition-all text-sm font-bold active:scale-95"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import JSON
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={importFromJson} 
                  accept=".json" 
                  className="hidden" 
                />
              </div>
            </div>
          </>
        ) : (
          <AttendanceTracker 
            week={selectedWeek} 
            attendance={attendance[selectedWeek.id] || {}}
            onUpdateCode={(sessionId, code) => handleUpdateCode(selectedWeek.id, sessionId, code)}
            onBack={() => setSelectedWeek(null)}
            onClear={() => handleClearWeek(selectedWeek.id)}
          />
        )}
      </main>

      <footer className="mt-auto pt-8 pb-4 text-slate-400 dark:text-slate-600 text-xs text-center font-medium">
        &copy; 2025 UniAttend • Live Server Sync
      </footer>
    </div>
  );
};

export default App;
