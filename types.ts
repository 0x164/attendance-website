
export interface Session {
  id: string;
  courseCode: string;
  sessionType: string;
}

export interface DailySchedule {
  day: string;
  date: string;
  sessions: Session[];
}

export interface AcademicWeek {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  schedule: DailySchedule[];
}

export interface AttendanceStore {
  [weekId: string]: {
    [sessionId: string]: string;
  };
}
