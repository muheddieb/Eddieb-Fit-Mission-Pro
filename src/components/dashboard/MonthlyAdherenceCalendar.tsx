import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Sparkles,
  Play,
  RotateCcw,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  HeartHandshake
} from 'lucide-react';
import { UserProfile, WorkoutSession, WorkoutExercise } from '../../types';
import { WeeklyScheduleService, WeeklyDayPlan } from '../../services/weeklyScheduleService';

interface MonthlyAdherenceCalendarProps {
  profile: UserProfile;
  history: WorkoutSession[];
  onStartSpecificWorkout?: (session: WorkoutSession) => void;
  onNavigateToSection?: (section: any) => void;
}

// Color schemes per session type
const SESSION_THEMES: Record<string, {
  labelEn: string;
  labelAr: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cellBg: string;
  dotBg: string;
}> = {
  push: {
    labelEn: 'Push (Chest/Delts)',
    labelAr: 'دفع (صدر/أكتاف/تراي)',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/40',
    cellBg: 'bg-rose-500/10 hover:bg-rose-500/15',
    dotBg: 'bg-rose-500',
  },
  pull: {
    labelEn: 'Pull (Back/Biceps)',
    labelAr: 'سحب (ظهر/بايسبس)',
    badgeBg: 'bg-sky-500/20',
    badgeText: 'text-sky-400',
    badgeBorder: 'border-sky-500/40',
    cellBg: 'bg-sky-500/10 hover:bg-sky-500/15',
    dotBg: 'bg-sky-500',
  },
  legs: {
    labelEn: 'Legs (Quads/Hams)',
    labelAr: 'أرجل (فخذ/خلفيات)',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/40',
    cellBg: 'bg-emerald-500/10 hover:bg-emerald-500/15',
    dotBg: 'bg-emerald-500',
  },
  rest_active: {
    labelEn: 'Active Recovery',
    labelAr: 'استشفاء ومرونة',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-400',
    badgeBorder: 'border-purple-500/40',
    cellBg: 'bg-purple-500/10 hover:bg-purple-500/15',
    dotBg: 'bg-purple-500',
  },
  shoulders_arms: {
    labelEn: 'Arms & Delts',
    labelAr: 'ذراعين وأكتاف',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/40',
    cellBg: 'bg-amber-500/10 hover:bg-amber-500/15',
    dotBg: 'bg-amber-500',
  },
  full_body: {
    labelEn: 'Full Body',
    labelAr: 'جسم كامل',
    badgeBg: 'bg-teal-500/20',
    badgeText: 'text-teal-400',
    badgeBorder: 'border-teal-500/40',
    cellBg: 'bg-teal-500/10 hover:bg-teal-500/15',
    dotBg: 'bg-teal-500',
  },
  rest: {
    labelEn: 'Rest & Repair',
    labelAr: 'راحة واستشفاء',
    badgeBg: 'bg-secondary/40',
    badgeText: 'text-muted-foreground',
    badgeBorder: 'border-border/60',
    cellBg: 'bg-secondary/20 hover:bg-secondary/30',
    dotBg: 'bg-muted-foreground/40',
  },
  other: {
    labelEn: 'Cardio / Other',
    labelAr: 'كارديو / أخرى',
    badgeBg: 'bg-primary/20',
    badgeText: 'text-primary',
    badgeBorder: 'border-primary/40',
    cellBg: 'bg-primary/10 hover:bg-primary/15',
    dotBg: 'bg-primary',
  },
};

export const MonthlyAdherenceCalendar: React.FC<MonthlyAdherenceCalendarProps> = ({
  profile,
  history,
  onStartSpecificWorkout,
  onNavigateToSection,
}) => {
  const isAr = profile.language === 'ar';

  // Today reference
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const todayDateString = now.toISOString().split('T')[0];

  // Active viewing month
  const [viewDate, setViewDate] = useState<Date>(new Date(currentYear, currentMonth, 1));
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Selected date for day inspector (defaults to today)
  const [selectedDateString, setSelectedDateString] = useState<string>(todayDateString);

  // Weekly schedule to project future sessions
  const weeklySchedule = useMemo(() => {
    return WeeklyScheduleService.getWeeklySchedule(profile);
  }, [profile]);

  // Map of completed history by date (YYYY-MM-DD)
  const historyByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    history.forEach((session) => {
      if (session.completed) {
        const d = session.date || (session.completedAt ? new Date(session.completedAt).toISOString().split('T')[0] : '');
        if (d) {
          const list = map.get(d) || [];
          list.push(session);
          map.set(d, list);
        }
      }
    });
    return map;
  }, [history]);

  // Navigate months
  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleJumpToToday = () => {
    setViewDate(new Date(currentYear, currentMonth, 1));
    setSelectedDateString(todayDateString);
  };

  // Helper to map a Date to its WeeklyDayPlan in the weekly microcycle
  // jsDay: 0 is Sun, 1 is Mon, ..., 6 is Sat.
  // WeeklySchedule index 0 = Saturday, 1 = Sunday, ..., 6 = Friday.
  const getScheduledPlanForDate = (date: Date): WeeklyDayPlan => {
    const jsDay = date.getDay();
    const map = [1, 2, 3, 4, 5, 6, 0];
    const planIndex = map[jsDay];
    return weeklySchedule[planIndex] || weeklySchedule[0];
  };

  // Build calendar days matrix for the active viewing month
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Days before the 1st of month: in a Saturday-first calendar (common in Arab sports apps):
    // Let's determine start offset: Saturday is 0, Sunday is 1, ..., Friday is 6
    const jsDayOfFirst = firstDayOfMonth.getDay();
    const saturdayBasedOffset = (jsDayOfFirst + 1) % 7; // Saturday(6) -> 0, Sunday(0) -> 1, Mon(1) -> 2, etc.

    const cells = [];

    // Empty cells before first day
    for (let i = 0; i < saturdayBasedOffset; i++) {
      cells.push({ isPadding: true, key: `pad-pre-${i}` });
    }

    // Actual month days
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const cellDate = new Date(viewYear, viewMonth, dayNum);
      const yyyy = cellDate.getFullYear();
      const mm = String(cellDate.getMonth() + 1).padStart(2, '0');
      const dd = String(dayNum).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;

      const isToday = dateString === todayDateString;
      const isPast = dateString < todayDateString;
      const isFuture = dateString > todayDateString;

      const completedWorkouts = historyByDate.get(dateString) || [];
      const hasCompleted = completedWorkouts.length > 0;
      const scheduledPlan = getScheduledPlanForDate(cellDate);

      // Determine main session type
      let sessionType: string = 'rest';
      if (hasCompleted) {
        sessionType = completedWorkouts[0].type || 'other';
      } else if (!isPast) {
        sessionType = scheduledPlan.isRestDay ? 'rest' : scheduledPlan.splitId;
      }

      // Theme info
      const theme = SESSION_THEMES[sessionType] || SESSION_THEMES.other;

      cells.push({
        isPadding: false,
        key: dateString,
        date: cellDate,
        dateString,
        dayNum,
        isToday,
        isPast,
        isFuture,
        hasCompleted,
        completedWorkouts,
        scheduledPlan,
        sessionType,
        theme,
      });
    }

    // Optional padding at the end to make complete rows of 7
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let i = 0; i < remaining; i++) {
        cells.push({ isPadding: true, key: `pad-post-${i}` });
      }
    }

    return cells;
  }, [viewYear, viewMonth, todayDateString, historyByDate, weeklySchedule]);

  // Compute month adherence statistics
  const monthlyStats = useMemo(() => {
    let completedCount = 0;
    let scheduledWorkoutsCount = 0;
    let totalVolumeKg = 0;

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(viewYear, viewMonth, d);
      const yyyy = cellDate.getFullYear();
      const mm = String(cellDate.getMonth() + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dStr = `${yyyy}-${mm}-${dd}`;

      const workouts = historyByDate.get(dStr) || [];
      if (workouts.length > 0) {
        completedCount += workouts.length;
        workouts.forEach((w) => {
          totalVolumeKg += w.totalVolumeKg || 0;
        });
      }

      const plan = getScheduledPlanForDate(cellDate);
      if (!plan.isRestDay) {
        scheduledWorkoutsCount++;
      }
    }

    // Adherence percentage based on total scheduled days in this month
    const adherenceRate = scheduledWorkoutsCount > 0
      ? Math.min(100, Math.round((completedCount / scheduledWorkoutsCount) * 100))
      : 100;

    // Current active streak
    let streak = 0;
    let checkDate = new Date();
    for (let i = 0; i < 30; i++) {
      const dStr = checkDate.toISOString().split('T')[0];
      const hasWorkout = historyByDate.has(dStr);
      if (hasWorkout) {
        streak++;
      } else if (i > 0) {
        // Break if missed
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return {
      completedCount,
      scheduledWorkoutsCount,
      adherenceRate,
      totalVolumeKg,
      streak,
    };
  }, [viewYear, viewMonth, historyByDate, weeklySchedule]);

  // Selected Day Details
  const selectedDayInfo = useMemo(() => {
    const [y, m, d] = selectedDateString.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const isToday = selectedDateString === todayDateString;
    const isPast = selectedDateString < todayDateString;
    const isFuture = selectedDateString > todayDateString;

    const completed = historyByDate.get(selectedDateString) || [];
    const hasCompleted = completed.length > 0;
    const scheduledPlan = getScheduledPlanForDate(dateObj);

    // Build potential workout session if future/today
    const prospectiveSession = WeeklyScheduleService.buildWorkoutForDay(scheduledPlan, profile, history);

    return {
      dateObj,
      dateString: selectedDateString,
      isToday,
      isPast,
      isFuture,
      completed,
      hasCompleted,
      scheduledPlan,
      prospectiveSession,
    };
  }, [selectedDateString, todayDateString, historyByDate, weeklySchedule, profile, history]);

  // Month Title Formatter
  const monthName = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', {
      month: 'long',
      year: 'numeric',
    });
    return formatter.format(viewDate);
  }, [viewDate, isAr]);

  // Weekday Headers (Saturday first)
  const weekDayHeaders = isAr
    ? ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
    : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-lg space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/30 shadow-sm">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-foreground">
                  {isAr ? 'تقويم الالتزام الشهري والجدول التدريبي' : 'Monthly Adherence & Training Calendar'}
                </h3>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-black uppercase text-primary border border-primary/25">
                  {isAr ? 'استمرارية طويلة المدى' : 'Long-Term Adherence'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isAr
                  ? 'رؤية بصرية شاملة لأيام التمارين المكتملة بالألوان، والجلسات المستقبلية المجدولة للحفاظ على الانضباط الرياضي.'
                  : 'Color-coded visualization of historical completed sessions and future scheduled workouts for sustained discipline.'}
              </p>
            </div>
          </div>
        </div>

        {/* Month Selector & Today button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleJumpToToday}
            className="rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary hover:text-primary transition-all shadow-sm"
          >
            {isAr ? 'اليوم' : 'Today'}
          </button>

          <div className="flex items-center rounded-xl border border-border bg-secondary/30 p-1">
            <button
              onClick={isAr ? handleNextMonth : handlePrevMonth}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title={isAr ? 'الشهر السابق' : 'Previous Month'}
            >
              {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            <span className="px-3 text-xs sm:text-sm font-black text-foreground min-w-[120px] text-center capitalize">
              {monthName}
            </span>

            <button
              onClick={isAr ? handlePrevMonth : handleNextMonth}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title={isAr ? 'الشهر التالي' : 'Next Month'}
            >
              {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Monthly High-Impact Adherence Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Adherence Rate */}
        <div className="rounded-2xl border border-border bg-secondary/20 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase">{isAr ? 'نسبة الالتزام' : 'Adherence Rate'}</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
              {monthlyStats.adherenceRate}%
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({monthlyStats.completedCount}/{monthlyStats.scheduledWorkoutsCount})
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                monthlyStats.adherenceRate >= 80 ? 'bg-emerald-400' : monthlyStats.adherenceRate >= 60 ? 'bg-amber-400' : 'bg-rose-400'
              }`}
              style={{ width: `${monthlyStats.adherenceRate}%` }}
            />
          </div>
        </div>

        {/* Completed Workouts */}
        <div className="rounded-2xl border border-border bg-secondary/20 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase">{isAr ? 'جلسات مكتملة' : 'Workouts Done'}</span>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
              {monthlyStats.completedCount}
            </span>
            <span className="text-xs text-muted-foreground">{isAr ? 'تمرين' : 'sessions'}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {isAr ? 'في هذا الشهر' : 'In current month'}
          </p>
        </div>

        {/* Monthly Tonnage Lifted */}
        <div className="rounded-2xl border border-border bg-secondary/20 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase">{isAr ? 'الحجم الشهري' : 'Monthly Tonnage'}</span>
            <Dumbbell className="h-4 w-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
              {Math.round(monthlyStats.totalVolumeKg / 1000).toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">{isAr ? 'طن أوزان' : 'tons'}</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">
            {monthlyStats.totalVolumeKg.toLocaleString()} kg
          </p>
        </div>

        {/* Current Active Streak */}
        <div className="rounded-2xl border border-border bg-secondary/20 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase">{isAr ? 'سلسلة التدريب' : 'Active Streak'}</span>
            <Flame className="h-4 w-4 text-amber-400 fill-current" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
              {monthlyStats.streak}
            </span>
            <span className="text-xs text-muted-foreground">{isAr ? 'أيام متتالية' : 'days streak'}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {monthlyStats.streak > 0 
              ? (isAr ? 'استمرارية ممتازة!' : 'Great consistency!') 
              : (isAr ? 'ابدأ تمرينك اليوم' : 'Train today!')}
          </p>
        </div>
      </div>

      {/* 3. Color Legend for Session Types */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-secondary/30 border border-border/70 text-xs">
        <span className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider shrink-0">
          {isAr ? 'دليل الألوان:' : 'Legend:'}
        </span>
        {Object.entries(SESSION_THEMES).map(([key, theme]) => {
          return (
            <div
              key={key}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-0.5 border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
            >
              <span className={`h-2 w-2 rounded-full ${theme.dotBg}`} />
              <span className="text-[10px] sm:text-xs font-bold">
                {isAr ? theme.labelAr : theme.labelEn}
              </span>
            </div>
          );
        })}
      </div>

      {/* 4. The Monthly Calendar Grid */}
      <div className="space-y-2">
        {/* Day Name Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
          {weekDayHeaders.map((dayName, idx) => (
            <div
              key={idx}
              className="py-1 text-[11px] sm:text-xs font-black uppercase tracking-wider text-muted-foreground"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarCells.map((cell) => {
            if (cell.isPadding || !cell.dateString) {
              return (
                <div
                  key={cell.key}
                  className="min-h-[64px] sm:min-h-[82px] rounded-2xl border border-transparent bg-secondary/5 opacity-40 pointer-events-none"
                />
              );
            }

            const isSelected = cell.dateString === selectedDateString;
            const hasCompleted = cell.hasCompleted;
            const isToday = cell.isToday;
            const isFuture = cell.isFuture;
            const theme = cell.theme;

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedDateString(cell.dateString)}
                className={`group relative flex flex-col justify-between p-1.5 sm:p-2.5 min-h-[66px] sm:min-h-[84px] rounded-2xl border text-start transition-all duration-200 outline-none ${
                  isSelected
                    ? 'ring-2 ring-primary border-primary bg-primary/15 shadow-md scale-[1.02] z-10'
                    : isToday
                    ? 'border-primary/60 bg-card ring-1 ring-primary/30 hover:border-primary'
                    : hasCompleted
                    ? `${theme.badgeBorder} ${theme.cellBg}`
                    : isFuture && !cell.scheduledPlan?.isRestDay
                    ? 'border-border/80 border-dashed bg-card/60 hover:border-primary/50 hover:bg-card'
                    : 'border-border/60 bg-card/40 hover:border-border hover:bg-card'
                }`}
              >
                {/* Top Row: Date Number & Today badge */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs sm:text-sm font-black ${
                      isToday
                        ? 'flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono'
                        : isSelected
                        ? 'text-primary font-mono'
                        : 'text-foreground font-mono'
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  {/* Status Indicator Icon / Dot */}
                  {hasCompleted ? (
                    <span className="flex items-center gap-0.5 text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500/20" />
                    </span>
                  ) : isToday ? (
                    <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                  ) : isFuture && !cell.scheduledPlan?.isRestDay ? (
                    <span className={`h-1.5 w-1.5 rounded-full ${theme.dotBg} opacity-70`} />
                  ) : null}
                </div>

                {/* Center / Bottom Info Badge */}
                <div className="mt-1 w-full space-y-0.5">
                  {hasCompleted ? (
                    <div className="space-y-0.5">
                      <div className={`rounded-md px-1 py-0.5 text-[9px] sm:text-[10px] font-black truncate border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}>
                        {isAr ? theme.labelAr.split('(')[0] : theme.labelEn.split('(')[0]}
                      </div>
                      <div className="hidden sm:flex items-center justify-between text-[8px] text-muted-foreground font-mono">
                        <span>{cell.completedWorkouts[0]?.durationMinutes || 45}m</span>
                        {cell.completedWorkouts[0]?.totalVolumeKg ? (
                          <span>{Math.round(cell.completedWorkouts[0].totalVolumeKg / 1000)}t</span>
                        ) : null}
                      </div>
                    </div>
                  ) : isFuture ? (
                    cell.scheduledPlan?.isRestDay ? (
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground/60 truncate font-medium">
                        {isAr ? 'استراحة' : 'Rest'}
                      </div>
                    ) : (
                      <div className={`rounded-md px-1 py-0.5 text-[9px] sm:text-[10px] font-bold truncate opacity-80 border border-dashed ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}>
                        {isAr ? cell.scheduledPlan.dayNameAr : cell.scheduledPlan.dayName}: {isAr ? cell.scheduledPlan.splitId : cell.scheduledPlan.splitId}
                      </div>
                    )
                  ) : cell.scheduledPlan?.isRestDay ? (
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground/50 truncate font-medium">
                      {isAr ? 'راحة' : 'Rest'}
                    </div>
                  ) : (
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground/40 italic truncate">
                      {isAr ? 'غير مسجل' : 'No log'}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Selected Day Inspector & Instant Action Hub */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDateString}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="rounded-2xl border border-border bg-secondary/30 p-4 sm:p-5 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-foreground">
                  {selectedDayInfo.dateObj.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>

                {selectedDayInfo.isToday && (
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-black uppercase text-primary border border-primary/30">
                    {isAr ? 'اليوم الحالي' : 'Today'}
                  </span>
                )}

                {selectedDayInfo.hasCompleted ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3" />
                    {isAr ? 'تمرين مكتمل' : 'Completed'}
                  </span>
                ) : selectedDayInfo.isFuture ? (
                  <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-sky-400 border border-sky-500/30">
                    {isAr ? 'مجدول مستقبلاً' : 'Scheduled Future'}
                  </span>
                ) : (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground border border-border">
                    {selectedDayInfo.scheduledPlan.isRestDay ? (isAr ? 'يوم راحة' : 'Rest Day') : (isAr ? 'جلسة غير مسجلة' : 'Unlogged Day')}
                  </span>
                )}
              </div>
            </div>

            {/* If future/today workout, provide start button */}
            {(!selectedDayInfo.hasCompleted && !selectedDayInfo.scheduledPlan.isRestDay && onStartSpecificWorkout) && (
              <button
                onClick={() => onStartSpecificWorkout(selectedDayInfo.prospectiveSession)}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground shadow-md hover:bg-primary/90 transition-all active:scale-95 shrink-0"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>
                  {selectedDayInfo.isToday 
                    ? (isAr ? 'بدء تمرين اليوم الآن' : "Start Today's Workout") 
                    : (isAr ? 'بدء هذا التمرين مبكراً' : 'Start This Routine Now')}
                </span>
              </button>
            )}
          </div>

          {/* Details Content */}
          {selectedDayInfo.hasCompleted ? (
            // Completed Session Inspection
            <div className="space-y-3">
              {selectedDayInfo.completed.map((sess, idx) => (
                <div key={sess.id || idx} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-black text-foreground">
                        {isAr ? sess.nameAr || sess.name : sess.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {sess.exercises?.length || 0} {isAr ? 'تمارين تم أداؤها' : 'exercises completed'} • {sess.durationMinutes} {isAr ? 'دقيقة' : 'minutes'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="rounded-lg bg-secondary px-2.5 py-1 text-foreground border border-border font-mono">
                        {sess.totalVolumeKg ? `${sess.totalVolumeKg.toLocaleString()} kg` : 'Recorded'}
                      </span>
                    </div>
                  </div>

                  {/* Exercises Pill Preview */}
                  {sess.exercises && sess.exercises.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase">
                        {isAr ? 'عينة من التمارين المنفذة:' : 'Completed Exercises:'}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {sess.exercises.map((ex, exI) => (
                          <div
                            key={ex.exerciseId || exI}
                            className="flex items-center justify-between rounded-lg border border-border/80 bg-secondary/40 px-2.5 py-1.5 text-xs"
                          >
                            <span className="font-semibold text-foreground truncate max-w-[150px]">
                              {isAr ? ex.exerciseNameAr || ex.exerciseName : ex.exerciseName}
                            </span>
                            <span className="text-[10px] font-mono text-primary font-bold shrink-0">
                              {ex.sets?.length || 3} sets
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : selectedDayInfo.scheduledPlan.isRestDay ? (
            // Rest Day Context
            <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/60 p-4">
              <HeartHandshake className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-foreground">
                  {isAr ? 'يوم استشفاء ونمو عضلي (Rest & Recovery Day)' : 'Scheduled Rest & Muscle Recovery Day'}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isAr
                    ? 'الاستشفاء هو الوقت الفعلي الذي تنمو فيه العضلات وتتعافى الألياف والجهاز العصبي المركزي. احرص على تلبية احتياجك من البروتين، والترطيب بالماء، والنوم العميق.'
                    : 'Rest days are when muscular adaptation and nervous system recovery occur. Prioritize adequate protein synthesis, hydration, and restorative sleep.'}
                </p>
              </div>
            </div>
          ) : (
            // Future Scheduled Routine Preview
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-foreground">
                    {isAr ? selectedDayInfo.scheduledPlan.titleAr : selectedDayInfo.scheduledPlan.title}
                  </h4>
                  <span className="text-xs text-muted-foreground font-semibold">
                    ~{selectedDayInfo.scheduledPlan.estimatedMinutes} {isAr ? 'دقيقة مقدرة' : 'est. mins'}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  {isAr ? selectedDayInfo.scheduledPlan.subtitleAr : selectedDayInfo.scheduledPlan.subtitle}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-muted-foreground font-semibold">
                    {isAr ? 'العضلات المستهدفة:' : 'Muscles:'}
                  </span>
                  {(isAr ? selectedDayInfo.scheduledPlan.targetMusclesAr : selectedDayInfo.scheduledPlan.targetMuscles).map((m, i) => (
                    <span key={i} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-bold text-foreground">
                      {m}
                    </span>
                  ))}
                </div>

                {/* Exercises Preview List */}
                <div className="pt-2 border-t border-border/60">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">
                    {isAr ? 'التمارين المقترحة في هذه الجلسة:' : 'Planned Exercises in this Routine:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                    {(isAr ? selectedDayInfo.scheduledPlan.exerciseNamesAr : selectedDayInfo.scheduledPlan.exerciseNames).map((exName, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-lg border border-border/80 bg-secondary/30 p-2 text-xs">
                        <span className="flex h-4 w-4 items-center justify-center rounded bg-primary/20 text-[9px] font-mono font-bold text-primary">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-foreground truncate">{exName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
