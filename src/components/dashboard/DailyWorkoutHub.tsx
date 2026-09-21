import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  ArrowLeftRight, 
  Play, 
  RotateCcw, 
  Flame, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Info,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  SlidersHorizontal,
  Zap,
  Feather,
  Dumbbell,
  Trophy
} from 'lucide-react';
import { UserProfile, WorkoutSession, WorkoutExercise, WorkoutDifficultyLevel } from '../../types';
import { WeeklyScheduleService, WeeklyDayPlan } from '../../services/weeklyScheduleService';

export interface DifficultyOption {
  id: WorkoutDifficultyLevel;
  nameEn: string;
  nameAr: string;
  badgeEn: string;
  badgeAr: string;
  descEn: string;
  descAr: string;
  durationMins: number;
  rpeEn: string;
  rpeAr: string;
  setsDescEn: string;
  setsDescAr: string;
  colorBorder: string;
  colorBg: string;
  colorText: string;
  colorActiveBg: string;
  colorActiveBorder: string;
  colorActiveRing: string;
  icon: React.ElementType;
}

export const DIFFICULTY_LEVELS: DifficultyOption[] = [
  {
    id: 'easy',
    nameEn: 'Easy',
    nameAr: 'سهل (خفيف)',
    badgeEn: 'Level 1 • Low Fatigue',
    badgeAr: 'المستوى 1 • إجهاد منخفض',
    descEn: 'Reduced volume (2 sets/move), 10-12 reps, 60s rest. 10% deload for comfortable execution.',
    descAr: 'مجموعات أقل (مجموعتان/تمرين)، 10-12 تكرار، راحة 60 ثانية. تخفيف 10% للأوزان لتقليل الإجهاد.',
    durationMins: 35,
    rpeEn: 'RPE 6.5',
    rpeAr: 'مجهود 6.5',
    setsDescEn: '2 sets / exercise',
    setsDescAr: 'مجموعتان / تمرين',
    colorBorder: 'border-emerald-500/30',
    colorBg: 'bg-emerald-500/10 hover:bg-emerald-500/15',
    colorText: 'text-emerald-400',
    colorActiveBg: 'bg-emerald-500/15',
    colorActiveBorder: 'border-emerald-500',
    colorActiveRing: 'ring-2 ring-emerald-500/40',
    icon: Feather,
  },
  {
    id: 'standard',
    nameEn: 'Standard',
    nameAr: 'قياسي (الأساسي)',
    badgeEn: 'Level 2 • Recommended',
    badgeAr: 'المستوى 2 • موصى به',
    descEn: 'Balanced hypertrophy (3-4 sets/move), 8-12 reps, 90s rest. Optimal progressive overload.',
    descAr: 'الحجم البنائي المعتمد (3-4 مجموعات)، 8-12 تكرار، راحة 90 ثانية. التوازن المثالي للنمو والقوة.',
    durationMins: 50,
    rpeEn: 'RPE 8.0',
    rpeAr: 'مجهود 8.0',
    setsDescEn: '3-4 sets / exercise',
    setsDescAr: '3-4 مجموعات / تمرين',
    colorBorder: 'border-primary/30',
    colorBg: 'bg-primary/10 hover:bg-primary/15',
    colorText: 'text-primary',
    colorActiveBg: 'bg-primary/15',
    colorActiveBorder: 'border-primary',
    colorActiveRing: 'ring-2 ring-primary/40',
    icon: Dumbbell,
  },
  {
    id: 'hard',
    nameEn: 'Advanced',
    nameAr: 'متقدم (مكثف)',
    badgeEn: 'Level 3 • High Intensity',
    badgeAr: 'المستوى 3 • أقصى كثافة',
    descEn: 'Peak volume (4-5 sets on compounds), 6-8 reps, 120s rest. Maximum progressive overload.',
    descAr: 'أقصى حجم تدريبي (4-5 مجموعات)، أوزان ثقيلة، 6-8 تكرار، راحة 120 ثانية. لكسر أرقامك التدريبية.',
    durationMins: 65,
    rpeEn: 'RPE 9.0',
    rpeAr: 'مجهود 9.0',
    setsDescEn: '4-5 sets / exercise',
    setsDescAr: '4-5 مجموعات / تمرين',
    colorBorder: 'border-purple-500/30',
    colorBg: 'bg-purple-500/10 hover:bg-purple-500/15',
    colorText: 'text-purple-400',
    colorActiveBg: 'bg-purple-500/15',
    colorActiveBorder: 'border-purple-500',
    colorActiveRing: 'ring-2 ring-purple-500/40',
    icon: Zap,
  },
];

interface DailyWorkoutHubProps {
  profile: UserProfile;
  history: WorkoutSession[];
  activeWorkout: WorkoutSession | null;
  onStartWorkout: () => void;
  onStartSpecificWorkout: (session: WorkoutSession) => void;
  onOpenWarmupModal: () => void;
  onFinishActiveWorkout?: () => void;
  onSelectExercise?: (exerciseId: string) => void;
}

export const DailyWorkoutHub: React.FC<DailyWorkoutHubProps> = ({
  profile,
  history,
  activeWorkout,
  onStartWorkout,
  onStartSpecificWorkout,
  onOpenWarmupModal,
  onFinishActiveWorkout,
  onSelectExercise,
}) => {
  const isAr = profile.language === 'ar';
  const todayIndex = WeeklyScheduleService.getTodayDayIndex();

  const [schedule, setSchedule] = useState<WeeklyDayPlan[]>(() => 
    WeeklyScheduleService.getWeeklySchedule(profile)
  );

  // The day currently being viewed (defaults to today)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(todayIndex);

  // Workout difficulty level state (easy | standard | hard)
  const [difficultyLevel, setDifficultyLevel] = useState<WorkoutDifficultyLevel>('standard');
  const [difficultyFeedback, setDifficultyFeedback] = useState<string | null>(null);

  // Swap days state
  const [swapMode, setSwapMode] = useState<boolean>(false);
  const [swapSourceIndex, setSwapSourceIndex] = useState<number | null>(null);
  const [swapFeedback, setSwapFeedback] = useState<string | null>(null);

  // Horizontal scroll container ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get current selected day plan
  const activeDay = schedule[selectedDayIndex] || schedule[0];
  const isViewingToday = selectedDayIndex === todayIndex;

  // Build concrete session for the active day with difficulty scaling
  const [currentSession, setCurrentSession] = useState<WorkoutSession>(() => 
    WeeklyScheduleService.buildWorkoutForDay(activeDay, profile, history, difficultyLevel)
  );

  // Update session when activeDay changes, schedule updates, or difficulty level changes
  useEffect(() => {
    const session = WeeklyScheduleService.buildWorkoutForDay(activeDay, profile, history, difficultyLevel);
    setCurrentSession(session);
  }, [activeDay, profile, history, difficultyLevel]);

  // One-click difficulty toggling handler
  const handleSelectDifficulty = (newLevel: WorkoutDifficultyLevel) => {
    if (newLevel === difficultyLevel) return;
    setDifficultyLevel(newLevel);

    const targetOpt = DIFFICULTY_LEVELS.find((d) => d.id === newLevel);
    const msg = isAr
      ? `تم تحويل الجلسة إلى: ${targetOpt?.nameAr} • تم تحديث المجموعات والتكرارات والأوزان`
      : `Session calibrated to: ${targetOpt?.nameEn} • Sets, reps, and target weights updated`;

    setDifficultyFeedback(msg);
    setTimeout(() => setDifficultyFeedback(null), 3500);
  };

  // Handle Day Selection / Swap
  const handleDaySelect = (index: number) => {
    if (swapMode) {
      if (swapSourceIndex === null) {
        // Step 1: Select first day
        setSwapSourceIndex(index);
      } else if (swapSourceIndex === index) {
        // Deselect if clicked same
        setSwapSourceIndex(null);
      } else {
        // Step 2: Swap!
        const dayA = schedule[swapSourceIndex];
        const dayB = schedule[index];
        const updated = WeeklyScheduleService.swapDays(swapSourceIndex, index, profile);
        setSchedule(updated);

        const msg = isAr
          ? `تم بنجاح تبديل (${dayA.dayNameAr}: ${dayA.titleAr}) مع (${dayB.dayNameAr}: ${dayB.titleAr})!`
          : `Swapped (${dayA.dayName}: ${dayA.title}) with (${dayB.dayName}: ${dayB.title})!`;

        setSwapFeedback(msg);
        setSwapSourceIndex(null);
        setSwapMode(false);
        setSelectedDayIndex(index);

        setTimeout(() => setSwapFeedback(null), 4500);
      }
    } else {
      setSelectedDayIndex(index);
    }
  };

  // Trigger swap from the card
  const handleInitiateSwapFromCard = () => {
    setSwapMode(true);
    setSwapSourceIndex(selectedDayIndex);
  };

  // Reset schedule
  const handleResetSchedule = () => {
    if (window.confirm(isAr ? 'هل تريد استعادة ترتيب جدول الأسبوع الافتراضي؟' : 'Reset weekly workout schedule to default?')) {
      const reset = WeeklyScheduleService.resetSchedule(profile);
      setSchedule(reset);
      setSwapSourceIndex(null);
      setSwapMode(false);
      setSelectedDayIndex(todayIndex);
      setSwapFeedback(isAr ? 'تمت استعادة الجدول الافتراضي.' : 'Schedule restored to default.');
      setTimeout(() => setSwapFeedback(null), 3000);
    }
  };

  // Start the workout currently displayed with chosen difficulty level
  const handleStartCurrentWorkout = () => {
    onStartSpecificWorkout(currentSession);
  };

  // Scroll horizontal strip left/right
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header & Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card/90 p-4 sm:p-5 rounded-2xl border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/25">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground">
                {isAr ? 'جدول تمارين الأسبوع والروتين اليومي' : 'Weekly Schedule & Daily Workouts'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isAr 
                  ? 'اختر أي يوم لمعاينة تمارينه، أو استخدم ميزة التبديل لنقل تمرين يوم إلى آخر'
                  : 'Tap any day to preview exercises, or swap days freely to match your schedule'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Swap Days Toggle Button */}
          <button
            id="btn-toggle-day-swap"
            onClick={() => {
              setSwapMode(!swapMode);
              setSwapSourceIndex(null);
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-sm ${
              swapMode 
                ? 'bg-amber-500 text-neutral-950 ring-2 ring-amber-400 font-black' 
                : 'bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20'
            }`}
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>{swapMode ? (isAr ? 'إلغاء التبديل' : 'Cancel Swap') : (isAr ? 'تبديل الأيام (Swap)' : 'Swap Days')}</span>
          </button>

          {/* Reset Schedule Button */}
          <button
            id="btn-reset-schedule"
            onClick={handleResetSchedule}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            title={isAr ? 'استعادة الجدول الافتراضي' : 'Reset to default schedule'}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? 'إعادة ضبط' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* 2. Swap Feedback & Guidance Banner */}
      <AnimatePresence>
        {swapMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs shadow-sm flex items-start gap-3 text-amber-200"
          >
            <Sparkles className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-black text-amber-300">
                {swapSourceIndex === null
                  ? (isAr ? 'الخطوة 1: انقر على اليوم الأول من الشريط أدناه الذي تريد نقله' : 'Step 1: Tap the first day in the bar below to swap')
                  : (isAr 
                      ? `الخطوة 2: تم اختيار (${schedule[swapSourceIndex].dayNameAr} - ${schedule[swapSourceIndex].titleAr}). انقر على اليوم الآخر لتبديل مكانيهما فوراً!`
                      : `Step 2: Selected (${schedule[swapSourceIndex].dayName} - ${schedule[swapSourceIndex].title}). Tap another day to swap!`
                    )}
              </span>
              <p className="text-[11px] text-amber-300/80">
                {isAr 
                  ? 'يتم تبديل الروتين التدريبي بالكامل مع المحافظة على أوزانك التاريخية وسجل التمارين.' 
                  : 'Workout routines swap smoothly while preserving weights and training logs.'}
              </p>
            </div>
          </motion.div>
        )}

        {swapFeedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-xs font-bold text-emerald-300 shadow-md flex items-center gap-2.5"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{swapFeedback}</span>
          </motion.div>
        )}

        {difficultyFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="rounded-2xl border border-primary/40 bg-primary/15 p-3 text-xs font-bold text-primary shadow-md flex items-center gap-2.5"
          >
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span>{difficultyFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Horizontal Scrollable Week Days Strip */}
      <div className="relative group">
        {/* Scroll navigation arrows for desktop */}
        <button
          onClick={() => handleScroll('left')}
          className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-card border border-border shadow-md text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={() => handleScroll('right')}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-card border border-border shadow-md text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scroll-smooth no-scrollbar"
        >
          {schedule.map((day, idx) => {
            const isToday = idx === todayIndex;
            const isSelected = idx === selectedDayIndex;
            const isSourceForSwap = swapSourceIndex === idx;

            return (
              <button
                key={day.id}
                id={`weekly-day-pill-${idx}`}
                onClick={() => handleDaySelect(idx)}
                className={`flex-shrink-0 w-36 sm:w-44 text-start rounded-2xl p-3 border transition-all duration-200 relative ${
                  isSourceForSwap
                    ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]'
                    : isSelected
                    ? 'border-primary bg-primary/10 shadow-md shadow-primary/10 ring-1 ring-primary/40'
                    : isToday
                    ? 'border-primary/40 bg-card hover:border-primary/70'
                    : 'border-border/80 bg-card hover:bg-card/80 hover:border-border'
                }`}
              >
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className={`text-xs font-black ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {isAr ? day.dayNameAr : day.dayName}
                  </span>

                  <div className="flex items-center gap-1">
                    {isToday && (
                      <span className="flex items-center gap-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-primary border border-primary/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        {isAr ? 'اليوم' : 'Today'}
                      </span>
                    )}

                    {day.isSwapped && (
                      <span className="rounded-md bg-amber-500/20 px-1 py-0.5 text-[8px] font-bold text-amber-400 border border-amber-500/30">
                        {isAr ? 'مُبدّل' : 'Swapped'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Day Routine Name */}
                <div className="text-[11px] font-bold text-foreground truncate">
                  {isAr ? day.titleAr.split('(')[0] : day.title.split('(')[0]}
                </div>

                {/* Muscle Snippet */}
                <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {isAr ? day.targetMusclesAr.join(' • ') : day.targetMuscles.join(' • ')}
                </div>

                {/* Footer time / status */}
                <div className="flex items-center justify-between text-[9px] text-muted-foreground/80 mt-2 pt-1.5 border-t border-border/50">
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    ~{day.estimatedMinutes}m
                  </span>
                  <span>{day.exercisesCount} {isAr ? 'تمارين' : 'moves'}</span>
                </div>

                {/* Selection Indicator bar */}
                {isSelected && (
                  <motion.div
                    layoutId="activeDayIndicator"
                    className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Workout of the Day Detailed Interactive View */}
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-lg space-y-5">
        {/* Workout of the Day Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-primary/20 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-primary border border-primary/30">
                {isViewingToday 
                  ? (isAr ? 'تمرين اليوم المخصص' : "Today's Scheduled Workout") 
                  : (isAr ? `معاينة روتين يوم ${activeDay.dayNameAr}` : `Preview for ${activeDay.dayName}`)}
              </span>

              <span className="text-xs font-bold text-muted-foreground">
                ({isAr ? `اليوم ${activeDay.dayNumber} من 7` : `Day ${activeDay.dayNumber} of 7`})
              </span>

              {activeDay.isSwapped && (
                <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
                  {isAr ? 'تم تبديل هذا اليوم سابقاً' : 'Swapped Routine'}
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-black text-foreground">
              {isAr ? activeDay.titleAr : activeDay.title}
            </h3>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
              {isAr ? activeDay.subtitleAr : activeDay.subtitle}
            </p>

            {/* Target Muscles Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {isAr ? 'المجموعات المستهدفة:' : 'Target Muscles:'}
              </span>
              {(isAr ? activeDay.targetMusclesAr : activeDay.targetMuscles).map((muscle, idx) => (
                <span key={idx} className="rounded-lg bg-secondary px-2 py-0.5 text-xs font-bold text-foreground">
                  {muscle}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Quick Swap This Day Button */}
            <button
              onClick={handleInitiateSwapFromCard}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all shadow-sm active:scale-95"
              title={isAr ? 'تبديل روتين هذا اليوم مع يوم آخر في الأسبوع' : 'Swap this workout with another day'}
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span>{isAr ? 'تبديل هذا اليوم' : 'Swap Day'}</span>
            </button>

            {/* Smart Warm-up */}
            {!activeDay.isRestDay && (
              <button
                onClick={onOpenWarmupModal}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3.5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shadow-sm active:scale-95"
                title={isAr ? 'بدء إحماء ديناميكي 5 دقائق' : '5-minute dynamic warmup'}
              >
                <Flame className="h-4 w-4 text-amber-400 fill-current" />
                <span className="hidden sm:inline">{isAr ? 'إحماء 5 دقائق' : 'Warm-up'}</span>
              </button>
            )}

            {/* Prominent Finish Active Workout Button (if an active workout is in progress today) */}
            {activeWorkout && isViewingToday && onFinishActiveWorkout && (
              <button
                id="btn-finish-active-workout-hub"
                onClick={onFinishActiveWorkout}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
                title={isAr ? 'إنهاء تمرين اليوم الآن وعرض النتائج والسعرات' : "Finish Today's Workout Now and view results"}
              >
                <Trophy className="h-4 w-4 shrink-0" />
                <span>{isAr ? 'إنهاء تمرين اليوم الآن' : "Finish Workout Now"}</span>
              </button>
            )}

            {/* Main Train Button */}
            <button
              id="btn-start-daily-workout-hub"
              onClick={handleStartCurrentWorkout}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-black text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>
                {activeWorkout && isViewingToday
                  ? (isAr ? 'متابعة التمرين الجاري' : 'Continue Workout')
                  : isViewingToday
                  ? (isAr ? 'بدء تمرين اليوم' : "Start Today's Workout")
                  : (isAr ? `بدء تمرين ${activeDay.dayNameAr} الآن` : `Train ${activeDay.dayName} Now`)}
              </span>
            </button>
          </div>
        </div>

        {/* Quick-Access Difficulty Shortcut Grid (Standard, Easy, Advanced) */}
        {!activeDay.isRestDay && (
          <div className="space-y-2.5 pt-1 border-t border-border/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </div>
                <h4 className="text-xs sm:text-sm font-black text-foreground">
                  {isAr ? 'كثافة ومستوى تمرين اليوم (تبديل بنقرة واحدة)' : "Today's Session Intensity (One-Click Toggle)"}
                </h4>
              </div>

              <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                {difficultyLevel === 'easy' && (isAr ? 'نسخة خفيفة • استشفاء مرن وحجم أقل' : 'Light Version • Lower Volume & Less Fatigue')}
                {difficultyLevel === 'standard' && (isAr ? 'النسخة القياسية • البناء العضلي والتحميل التدريجي' : 'Standard Version • Optimal Hypertrophy')}
                {difficultyLevel === 'hard' && (isAr ? 'نسخة متقدمة مكثفة • أقصى تحفيز وأوزان ثقيلة' : 'Advanced Version • Peak Load & High Intensity')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DIFFICULTY_LEVELS.map((lvl) => {
                const isSelected = difficultyLevel === lvl.id;
                const Icon = lvl.icon;

                return (
                  <button
                    key={lvl.id}
                    id={`btn-difficulty-toggle-${lvl.id}`}
                    type="button"
                    onClick={() => handleSelectDifficulty(lvl.id)}
                    className={`group relative flex flex-col justify-between p-3.5 rounded-2xl border text-start transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? `${lvl.colorActiveBg} ${lvl.colorActiveBorder} ${lvl.colorActiveRing} shadow-md`
                        : `bg-secondary/20 border-border/70 hover:border-border hover:bg-secondary/40`
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${lvl.colorBorder} ${lvl.colorBg} ${lvl.colorText}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs sm:text-sm font-black ${isSelected ? lvl.colorText : 'text-foreground'}`}>
                                {isAr ? lvl.nameAr : lvl.nameEn}
                              </span>
                              {lvl.id === 'standard' && (
                                <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-[9px] font-black text-primary uppercase">
                                  {isAr ? 'الموصى به' : 'Optimal'}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground font-bold">
                              {isAr ? lvl.badgeAr : lvl.badgeEn}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full ${lvl.colorText} bg-card border border-current shadow-xs`}>
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {isAr ? lvl.descAr : lvl.descEn}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono font-bold pt-2 mt-2.5 border-t border-border/50 text-muted-foreground w-full">
                      <span className={isSelected ? 'text-foreground font-black' : ''}>
                        {isAr ? lvl.setsDescAr : lvl.setsDescEn}
                      </span>
                      <span className={isSelected ? `${lvl.colorText} font-black` : ''}>
                        ~{lvl.durationMins} {isAr ? 'د' : 'm'} • {isAr ? lvl.rpeAr : lvl.rpeEn}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Detailed Exercises Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>{isAr ? 'التمارين المخصصة لجلسة اليوم بالتفصيل' : 'Scheduled Exercises for this Session'}</span>
            </h4>

            <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                ~{currentSession.durationMinutes || activeDay.estimatedMinutes} {isAr ? 'دقيقة' : 'min'}
              </span>
              <span>•</span>
              <span>{currentSession.exercises?.length || activeDay.exercisesCount} {isAr ? 'تمارين' : 'exercises'}</span>
            </div>
          </div>

          {/* Exercise Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentSession.exercises && currentSession.exercises.length > 0 ? (
              currentSession.exercises.map((ex, exIdx) => {
                const totalSets = ex.sets?.length || 3;
                const sampleReps = ex.sets?.[0]?.targetReps || '8-12';
                const targetWeight = ex.sets?.[0]?.targetWeight || 0;
                const rpe = ex.targetRpe || 8.5;

                return (
                  <div
                    key={ex.exerciseId || exIdx}
                    className="flex items-start justify-between rounded-2xl border border-border/80 bg-secondary/30 p-3.5 sm:p-4 hover:border-primary/40 hover:bg-secondary/40 transition-all"
                  >
                    <div className="space-y-1.5 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/20 text-[10px] font-mono font-black text-primary">
                          {String(exIdx + 1).padStart(2, '0')}
                        </span>
                        <h5 className="text-xs sm:text-sm font-black text-foreground">
                          {isAr ? ex.exerciseNameAr || ex.exerciseName : ex.exerciseName}
                        </h5>
                      </div>

                      {/* Muscle & Equipment Badge */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-card px-2 py-0.5 text-[10px] font-bold text-muted-foreground border border-border">
                          {ex.primaryMuscle}
                        </span>
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">
                          {totalSets} {isAr ? 'مجموعات' : 'Sets'} × {sampleReps} {isAr ? 'تكرار' : 'Reps'}
                        </span>
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground font-mono">
                          RPE {rpe} • {ex.restSeconds || 90}s {isAr ? 'راحة' : 'rest'}
                        </span>
                      </div>
                    </div>

                    {onSelectExercise && (
                      <button
                        type="button"
                        onClick={() => onSelectExercise(ex.exerciseId)}
                        className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        title={isAr ? 'عرض تفاصيل وتكنيك التمرين' : 'View exercise technique'}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              // Fallback exercise names list
              (isAr ? activeDay.exerciseNamesAr : activeDay.exerciseNames).map((name, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-2xl border border-border bg-secondary/30 p-3.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/20 text-[10px] font-mono font-black text-primary">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-foreground">{name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">3 {isAr ? 'مجموعات' : 'Sets'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. Floating Quick-Access Difficulty Action Bar (Sticky at viewport bottom) */}
      {!activeDay.isRestDay && (
        <aside
          aria-label={isAr ? 'التبديل السريع لمستوى صعوبة التمرين' : 'Quick difficulty switcher'}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-[92vw]"
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 sm:gap-2.5 rounded-full border border-border/90 bg-card/95 backdrop-blur-md px-3.5 py-1.5 shadow-2xl ring-1 ring-black/20"
          >
            <div className="flex items-center gap-1.5 pr-1 text-[11px] font-black text-foreground shrink-0">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">{isAr ? 'كثافة الجلسة:' : 'Intensity:'}</span>
            </div>

            <div className="flex items-center gap-1 rounded-full bg-secondary/80 p-0.5">
              {DIFFICULTY_LEVELS.map((lvl) => {
                const isSelected = difficultyLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    id={`floating-difficulty-btn-${lvl.id}`}
                    type="button"
                    onClick={() => handleSelectDifficulty(lvl.id)}
                    className={`rounded-full px-2.5 sm:px-3.5 py-1 text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
                      isSelected
                        ? lvl.id === 'easy'
                          ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/25 font-black'
                          : lvl.id === 'hard'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 font-black'
                          : 'bg-primary text-primary-foreground shadow-md shadow-primary/25 font-black'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                    }`}
                  >
                    {isAr ? lvl.nameAr.split(' ')[0] : lvl.nameEn}
                  </button>
                );
              })}
            </div>

            <div className="hidden md:flex items-center text-[10px] font-mono text-muted-foreground pl-1.5 border-l border-border/60">
              <span>
                {difficultyLevel === 'easy' && '~35m'}
                {difficultyLevel === 'standard' && '~50m'}
                {difficultyLevel === 'hard' && '~65m'}
              </span>
            </div>
          </motion.div>
        </aside>
      )}
    </div>
  );
};
