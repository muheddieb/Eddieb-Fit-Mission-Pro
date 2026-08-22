/**
 * Centralized Date & Adaptive Program Timeline Utilities
 * Single Source of Truth for Date-Based Program Progress Calculation
 */

export interface ProgramProgressTimeline {
  currentWeek: number;
  currentDay: number; // 1 - 7 (Day within current week)
  totalElapsedDays: number; // 0 for day 1, 1 for day 2, etc.
  totalProgramDay: number; // 1-indexed total day (day 1, day 2, day 68, etc.)
  cycleNumber: number; // 4-week mesocycle cycle count (1, 2, 3...)
  weekInCycle: number; // 1 - 4 within current mesocycle
  startDateString: string;
  formattedProgress: string; // "Week X — Day Y"
  formattedProgressAr: string; // "الأسبوع X — اليوم Y"
}

/**
 * Normalizes a date string or Date object to local midnight for consistent day delta math.
 */
export function parseDateAtMidnight(dateInput?: string | Date | null): Date {
  if (!dateInput) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }

  if (dateInput instanceof Date) {
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate(), 0, 0, 0, 0);
  }

  const cleaned = String(dateInput).split('T')[0];
  const parts = cleaned.split(/[-/]/);
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day, 0, 0, 0, 0);
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }

  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * Calculates dynamic program timeline metrics from programStartDate and current date.
 * 
 * Rules:
 * - Day 1-7  -> Week 1
 * - Day 8-14 -> Week 2
 * - Formula: currentWeek = Math.floor(totalElapsedDays / 7) + 1
 * - currentDay = (totalElapsedDays % 7) + 1 (1 through 7)
 * - totalProgramDay = totalElapsedDays + 1
 * 
 * Handles historical start dates, same-day starts, and daylight saving shifts reliably.
 */
export function calculateProgramProgress(
  programStartDate?: string | Date | null,
  referenceDate?: string | Date | null
): ProgramProgressTimeline {
  const startDate = parseDateAtMidnight(programStartDate);
  const currentDate = parseDateAtMidnight(referenceDate);

  const diffMs = currentDate.getTime() - startDate.getTime();
  const diffDays = Math.round(diffMs / 86400000);
  const totalElapsedDays = Math.max(0, diffDays);

  const currentWeek = Math.floor(totalElapsedDays / 7) + 1;
  const currentDay = (totalElapsedDays % 7) + 1;
  const totalProgramDay = totalElapsedDays + 1;

  const cycleNumber = Math.floor((currentWeek - 1) / 4) + 1;
  const weekInCycle = ((currentWeek - 1) % 4) + 1;

  const formattedProgress = `Week ${currentWeek} — Day ${currentDay}`;
  const formattedProgressAr = `الأسبوع ${currentWeek} — اليوم ${currentDay}`;

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const startDateString = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`;

  return {
    currentWeek,
    currentDay,
    totalElapsedDays,
    totalProgramDay,
    cycleNumber,
    weekInCycle,
    startDateString,
    formattedProgress,
    formattedProgressAr,
  };
}
