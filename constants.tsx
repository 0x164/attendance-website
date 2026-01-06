
import { AcademicWeek, DailySchedule, Session } from './types';

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

const getMonthName = (date: Date) => {
  return date.toLocaleString('default', { month: 'long' });
};

const formatDate = (date: Date): string => {
  return `${date.getDate()} ${getMonthName(date)} ${date.getFullYear()}`;
};

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
      return {
        ...template,
        date: formatDate(dayDate)
      };
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

/**
 * Calculation:
 * Jan 6th 2026 (Tue) is Week 10.
 * The Monday of that week is Jan 5th 2026.
 * Week 1 Start = Jan 5th 2026 - (9 weeks * 7 days) = Jan 5th 2026 - 63 days.
 * Jan 5 -> Jan 1 (4 days)
 * Dec 31 -> Dec 1 (31 days)
 * Nov 30 -> Nov 3 (28 days)
 * Total: 4 + 31 + 28 = 63 days.
 * Thus, Week 1 starts on Monday, Nov 3rd, 2025.
 */
export const ACADEMIC_WEEKS = generateWeeks(15, new Date(2025, 10, 3));
