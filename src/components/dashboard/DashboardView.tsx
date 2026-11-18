import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Calendar,
  Utensils,
  BookOpen,
  Trophy,
  Droplets,
  ChevronRight,
  ChevronLeft,
  Dumbbell,
  Check,
  TrendingDown,
  Scale,
  Plus,
  Zap,
  ArrowLeftRight,
  RotateCcw,
  Bell,
  BellOff,
  Footprints,
  HeartPulse,
  Moon,
} from 'lucide-react';
import {
  UserProfile,
  WorkoutSession,
  WorkoutDifficultyLevel,
  NutritionEntry,
  BodyMeasurement,
  DailyCheckInRecord,
  DailyGymStatus,
} from '../../types';
import { WeeklyScheduleService, WeeklyDayPlan } from '../../services/weeklyScheduleService';
import { PPLEngine } from '../../services/pplEngine';
import { StorageService } from '../../services/storage';
import { MorningMotivationService } from '../../services/morningMotivationService';
import { calculateProgramProgress } from '../../services/dateUtils';
import { FAT_LOSS_MEAL_PLANS, MealSlotItem, getRecommendedMealPlanForDate } from '../../data/fatLossMealPlan';
import { NavSection } from '../layout/Sidebar';

interface DashboardViewProps {
  profile: UserProfile;
  history: WorkoutSession[];
  activeWorkout: WorkoutSession | null;
  onStartWorkout: () => void;
  onStartSpecificWorkout?: (session: WorkoutSession) => void;
  onFinishActiveWorkout?: () => void;
  onNavigate: (section: NavSection) => void;
  onUpdateProfile?: (profile: UserProfile) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  history,
  activeWorkout,
  onStartWorkout,
  onStartSpecificWorkout,
  onFinishActiveWorkout,
  onNavigate,
  onUpdateProfile,
}) => {
  const isAr = profile.language === 'ar';
  const todayIndex = WeeklyScheduleService.getTodayDayIndex();
  const todayDateStr = new Date().toISOString().split('T')[0];

  const [schedule, setSchedule] = useState<WeeklyDayPlan[]>(() =>
    WeeklyScheduleService.getWeeklySchedule(profile)
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(todayIndex);
  const [difficultyLevel, setDifficultyLevel] = useState<WorkoutDifficultyLevel>('standard');
  const [daySwapOpen, setDaySwapOpen] = useState<boolean>(false);

  // Daily Check-In & Morning Habit State
  const [checkIn, setCheckIn] = useState<DailyCheckInRecord>(() =>
    StorageService.getTodayCheckIn(todayDateStr)
  );
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);

  // Actionable local state synced with StorageService
  const [todayWaterMl, setTodayWaterMl] = useState<number>(() =>
    StorageService.getTodayHydrationTotal()
  );
  const [nutritionLogs, setNutritionLogs] = useState<NutritionEntry[]>(() =>
    StorageService.getNutritionHistory()
  );
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>(() =>
    StorageService.getMeasurements()
  );
  const [weightInputOpen, setWeightInputOpen] = useState<boolean>(false);
  const [newWeightInput, setNewWeightInput] = useState<string>(
    String(profile.currentWeightKg || 101.1)
  );

  useEffect(() => {
    setTodayWaterMl(StorageService.getTodayHydrationTotal());
    setNutritionLogs(StorageService.getNutritionHistory());
    setMeasurements(StorageService.getMeasurements());

    // Automatically align today's check-in with completed or active workout
    const todayDone = history.some((w) => w.completed && w.date === todayDateStr);
    const stored = StorageService.getTodayCheckIn(todayDateStr);
    if (todayDone && stored.status !== 'completed') {
      const updated: DailyCheckInRecord = { ...stored, status: 'completed', updatedAt: Date.now() };
      StorageService.saveTodayCheckIn(updated);
      setCheckIn(updated);
    } else if (activeWorkout && stored.status === 'not_started') {
      const updated: DailyCheckInRecord = { ...stored, status: 'in_progress', updatedAt: Date.now() };
      StorageService.saveTodayCheckIn(updated);
      setCheckIn(updated);
    } else {
      setCheckIn(stored);
    }
  }, [history, activeWorkout, todayDateStr]);

  const activeDay = schedule[selectedDayIndex] || schedule[0];
  const todayPlan = schedule[todayIndex] || schedule[0];
  const isViewingToday = selectedDayIndex === todayIndex;
  const programProgress = calculateProgramProgress(profile.startDate);

  const currentSession = useMemo(
    () => WeeklyScheduleService.buildWorkoutForDay(activeDay, profile, history, difficultyLevel),
    [activeDay, profile, history, difficultyLevel]
  );

  const todayCardioRec = useMemo(
    () => WeeklyScheduleService.getRecommendedCardioForDay(activeDay),
    [activeDay]
  );

  // Morning Motivation Message
  const morningMessage = useMemo(
    () => MorningMotivationService.getNextMessage(profile, checkIn, Boolean(todayPlan.isRestDay)),
    [profile, checkIn, todayPlan.isRestDay]
  );

  // Trigger foreground Web/SW notification if within morning window and user opted in
  useEffect(() => {
    MorningMotivationService.sendMorningNotificationIfDue(profile, morningMessage, checkIn);
  }, [profile, morningMessage, checkIn]);

  // Daily Meal Targets calculations
  const defaultMealPlan = useMemo(() => getRecommendedMealPlanForDate(new Date()), []);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(defaultMealPlan.id);
  const todayMealPlan =
    FAT_LOSS_MEAL_PLANS.find((p) => p.id === selectedPlanId) || defaultMealPlan;

  const todayNutritionLogs = useMemo(
    () => nutritionLogs.filter((entry) => entry.date === todayDateStr),
    [nutritionLogs, todayDateStr]
  );
  const loggedCalories = todayNutritionLogs.reduce((sum, item) => sum + item.calories, 0);
  const loggedProtein = Math.round(
    todayNutritionLogs.reduce((sum, item) => sum + item.proteinGrams, 0)
  );
  const loggedFiber = Math.round(
    todayNutritionLogs.reduce((sum, item) => sum + (item.fiberGrams || 0), 0)
  );
  const calorieTarget = profile.dailyCalorieTarget || todayMealPlan.totalCalories;
  const proteinTarget = profile.dailyProteinTargetGrams || todayMealPlan.totalProtein;
  const fiberTarget = profile.dailyFiberTargetGrams || todayMealPlan.totalFiber || 32;

  // Key Progress Metrics
  const completedWorkouts = useMemo(
    () => history.filter((w) => w.completed),
    [history]
  );
  const workoutsLast7Days = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    return completedWorkouts.filter((w) => {
      const ts = w.completedAt || w.timestamp || new Date(w.date).getTime();
      return ts >= sevenDaysAgo;
    }).length;
  }, [completedWorkouts]);

  const latestWeightKg = measurements[0]?.weight ?? profile.currentWeightKg;
  const rolling7DayWeight = PPLEngine.calculate7DayWeightAverage(measurements) || latestWeightKg;
  const baselineWeightKg =
    measurements.length > 0 ? measurements[measurements.length - 1].weight : latestWeightKg;
  const weightDeltaKg = Math.round((latestWeightKg - baselineWeightKg) * 10) / 10;
  const waterTargetMl = profile.dailyWaterTargetMl || 3500;

  // Handlers
  const handleSetCheckInStatus = (nextStatus: DailyGymStatus) => {
    const updated: DailyCheckInRecord = {
      ...checkIn,
      date: todayDateStr,
      status: nextStatus,
      updatedAt: Date.now(),
      skipAction: nextStatus === 'skipped' ? checkIn.skipAction || null : null,
    };
    StorageService.saveTodayCheckIn(updated);
    setCheckIn(updated);
  };

  const handleToggleMorningWalkingSignal = () => {
    const nextActive = !checkIn.morningActive;
    const updated: DailyCheckInRecord = {
      ...checkIn,
      date: todayDateStr,
      morningActive: nextActive,
      stepsToday: nextActive ? Math.max(1500, checkIn.stepsToday || 0) : 200,
      updatedAt: Date.now(),
    };
    StorageService.saveTodayCheckIn(updated);
    setCheckIn(updated);
  };

  const handleToggleMorningNotifications = async () => {
    const nextVal = !profile.morningNotificationsEnabled;
    if (nextVal) {
      const perm = await MorningMotivationService.requestNotificationPermission();
      if (perm === 'denied' || perm === 'unsupported') {
        setNotifFeedback(
          isAr
            ? 'إشعارات المتصفح غير مسموحة على هذا الجهاز؛ ستعمل رسائل التشجيع داخل التطبيق.'
            : 'Browser notifications unavailable or blocked; in-app morning reminders remain active.'
        );
      } else {
        setNotifFeedback(
          isAr
            ? 'تم تفعيل تنبيهات الصباح (تعمل أثناء فتح التطبيق أو دعم المتصفح للـ PWA).'
            : 'Morning reminders enabled (active when app is open or browser supports PWA notifications).'
        );
      }
      setTimeout(() => setNotifFeedback(null), 4500);
    }
    if (onUpdateProfile) {
      onUpdateProfile({
        ...profile,
        morningNotificationsEnabled: nextVal,
      });
    }
  };

  const handleRestTodayTrainTomorrow = () => {
    const updatedSchedule = WeeklyScheduleService.restTodayTrainTomorrow(todayIndex, profile);
    setSchedule(updatedSchedule);
    setSelectedDayIndex(todayIndex);
    setDaySwapOpen(false);
    const updatedCheckIn: DailyCheckInRecord = {
      ...checkIn,
      date: todayDateStr,
      status: 'skipped',
      skipAction: 'rescheduled',
      updatedAt: Date.now(),
    };
    StorageService.saveTodayCheckIn(updatedCheckIn);
    setCheckIn(updatedCheckIn);
  };

  const handleMarkTodayRestDay = () => {
    const updatedSchedule = WeeklyScheduleService.changeDaySplit(todayIndex, 'rest_active', profile);
    setSchedule(updatedSchedule);
    setSelectedDayIndex(todayIndex);
    const updatedCheckIn: DailyCheckInRecord = {
      ...checkIn,
      date: todayDateStr,
      status: 'skipped',
      skipAction: 'rest_day',
      updatedAt: Date.now(),
    };
    StorageService.saveTodayCheckIn(updatedCheckIn);
    setCheckIn(updatedCheckIn);
  };

  const handleAddWater = (ml: number) => {
    StorageService.addHydration(ml);
    setTodayWaterMl(StorageService.getTodayHydrationTotal());
  };

  const handleQuickLogMeal = (meal: MealSlotItem) => {
    const entry: NutritionEntry = {
      id: `nut_${Date.now()}_${meal.slot}`,
      date: todayDateStr,
      mealType: meal.slot,
      foodName: isAr ? meal.titleAr : meal.titleEn,
      portionGrams: 1,
      calories: meal.calories,
      proteinGrams: meal.proteinGrams,
      carbsGrams: meal.carbsGrams,
      fatGrams: meal.fatGrams,
      fiberGrams: meal.fiberGrams,
      timestamp: Date.now(),
    };
    StorageService.addNutritionEntry(entry);
    setNutritionLogs(StorageService.getNutritionHistory());
  };

  const handleSaveWeightCheckIn = () => {
    const parsed = parseFloat(newWeightInput);
    if (Number.isNaN(parsed) || parsed < 30 || parsed > 300) return;

    const entry: BodyMeasurement = {
      id: `meas_${Date.now()}`,
      date: todayDateStr,
      weight: Math.round(parsed * 10) / 10,
      waistCm: measurements[0]?.waistCm || profile.currentWaistCm,
    };
    StorageService.addMeasurement(entry);
    setMeasurements(StorageService.getMeasurements());

    if (onUpdateProfile) {
      onUpdateProfile({
        ...profile,
        currentWeightKg: entry.weight,
      });
    }
    setWeightInputOpen(false);
  };

  // Next programmed workout based on PPL cycle
  const nextPplPhase = useMemo<'push' | 'pull' | 'legs'>(() => {
    const phase = PPLEngine.getTodayPPLPhase(history, profile);
    if (phase === 'push' || phase === 'pull' || phase === 'legs') {
      return phase;
    }
    return 'push';
  }, [history, profile]);

  const nextPplLabel =
    nextPplPhase === 'push'
      ? isAr ? 'دفع (Push)' : 'Push'
      : nextPplPhase === 'pull'
        ? isAr ? 'سحب (Pull)' : 'Pull'
        : isAr ? 'أرجل (Legs)' : 'Legs';

  const handleQuickStartPPL = () => {
    const pplSession = PPLEngine.buildAdaptiveWorkout({
      profile,
      history,
      splitId: nextPplPhase,
      difficultyLevel,
      location: profile.preferredLocation,
    });
    handleSetCheckInStatus('in_progress');
    if (onStartSpecificWorkout) {
      onStartSpecificWorkout(pplSession);
    } else {
      onStartWorkout();
    }
  };

  const handleSwapWithDay = (targetDayIndex: number) => {
    const updated = WeeklyScheduleService.swapDays(selectedDayIndex, targetDayIndex, profile);
    setSchedule(updated);
    setDaySwapOpen(false);
  };

  const handleChangeDaySplit = (splitId: string) => {
    const updated = WeeklyScheduleService.changeDaySplit(selectedDayIndex, splitId, profile);
    setSchedule(updated);
    setDaySwapOpen(false);
  };

  const handleResetWeekSchedule = () => {
    const updated = WeeklyScheduleService.resetSchedule(profile);
    setSchedule(updated);
    setDaySwapOpen(false);
  };

  const handleStartSelectedDayWorkout = () => {
    const hasCompletedSets = Boolean(
      activeWorkout?.exercises?.some((ex) => ex.sets?.some((s) => s.completed))
    );
    const activeMatchesSelectedDay =
      activeWorkout &&
      (activeWorkout.splitId === activeDay.splitId || activeWorkout.type === activeDay.splitId);

    handleSetCheckInStatus('in_progress');
    if (activeWorkout && isViewingToday && (activeMatchesSelectedDay || hasCompletedSets)) {
      onStartWorkout();
      return;
    }
    if (onStartSpecificWorkout) {
      onStartSpecificWorkout(currentSession);
    } else {
      onStartWorkout();
    }
  };

  const ForwardArrow = isAr ? ChevronLeft : ChevronRight;
  const morningWinLabel = `${profile.morningWindowStart || '07:30'} – ${profile.morningWindowEnd || '08:00'}`;

  return (
    <div className="space-y-5 pb-10" dir={isAr ? 'rtl' : 'ltr'}>
      {/* TODAY HERO HEADER — Answers: What is today's workout? How long? Did I complete it? Start Now */}
      <header className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <span>{isAr ? 'اليوم' : 'TODAY'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {isAr ? `نافذة الجيم: ${morningWinLabel} ص` : `Morning Window: ${morningWinLabel} AM`}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">
              {isAr ? `${todayPlan.dayNameAr} — ${todayPlan.titleAr}` : `${todayPlan.dayName} — ${todayPlan.title}`}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-mono tabular-nums">
              ~{currentSession.durationMinutes} {isAr ? 'دقيقة' : 'min'} · {currentSession.exercises.length} {isAr ? 'تمارين' : 'exercises'} · {isAr ? programProgress.formattedProgressAr : programProgress.formattedProgress}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {activeWorkout && (
              <button
                id="btn-finish-active-dashboard"
                type="button"
                onClick={onFinishActiveWorkout}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition-colors whitespace-nowrap"
              >
                <Trophy className="h-4 w-4" />
                <span>{isAr ? 'إنهاء التمرين' : 'Finish'}</span>
              </button>
            )}

            <button
              id="btn-quick-start-ppl"
              type="button"
              onClick={handleQuickStartPPL}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/70 px-3.5 py-2.5 text-xs font-bold text-foreground hover:border-primary/50 hover:text-primary transition-colors whitespace-nowrap"
              title={isAr ? 'بدء مباشر لدورة PPL' : 'Quick Start next PPL cycle'}
            >
              <Zap className="h-4 w-4 text-primary" />
              <span>{isAr ? `بدء سريع · ${nextPplLabel}` : `Quick Start · ${nextPplLabel}`}</span>
            </button>

            <button
              id="btn-start-dashboard-hero"
              type="button"
              onClick={handleStartSelectedDayWorkout}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-black text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>
                {activeWorkout && isViewingToday
                  ? isAr ? 'متابعة تمرين اليوم' : 'Resume Workout'
                  : isAr ? 'ابدأ تمرين اليوم' : 'Start Workout'}
              </span>
            </button>
          </div>
        </div>

        {/* MORNING HABIT MOTIVATION & DAILY GYM CHECK-IN BAR */}
        <div className="border-t border-border pt-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="text-xs font-black text-foreground">
              {isAr ? morningMessage.titleAr : morningMessage.titleEn}
              <span className="font-normal text-muted-foreground ms-2">
                — {isAr ? morningMessage.bodyAr : morningMessage.bodyEn}
              </span>
            </div>
            {notifFeedback && (
              <div className="text-[11px] text-primary font-semibold">{notifFeedback}</div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Activity Signal Toggle (Morning Walking / Steps) */}
            <button
              id="btn-toggle-morning-walking"
              type="button"
              onClick={handleToggleMorningWalkingSignal}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                checkIn.morningActive
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                  : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
              }`}
              title={isAr ? 'إشارة المشي الصباحي / الحركة' : 'Morning walking / steps signal'}
            >
              <Footprints className="h-3.5 w-3.5" />
              <span>{checkIn.morningActive ? (isAr ? 'حركة صباحية نشطة' : 'Morning Moving') : (isAr ? 'تسجيل مشي الصباح' : 'Morning Walk')}</span>
            </button>

            {/* Web / PWA Reminder Toggle */}
            <button
              id="btn-toggle-morning-notif"
              type="button"
              onClick={handleToggleMorningNotifications}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                profile.morningNotificationsEnabled
                  ? 'border-primary/40 bg-primary/15 text-primary'
                  : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
              }`}
              title={isAr ? 'تنبيه الصباح داخل المتصفح/PWA' : 'Browser / PWA Morning Reminder'}
            >
              {profile.morningNotificationsEnabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
              <span>{profile.morningNotificationsEnabled ? (isAr ? 'التنبيه مفعّل' : 'Alerts On') : (isAr ? 'تفعيل التنبيه' : 'Remind Me')}</span>
            </button>

            {/* Daily Gym Check-In Status Selector */}
            <div className="inline-flex rounded-lg border border-border bg-secondary/40 p-0.5 text-[11px] font-bold">
              {(
                [
                  { id: 'not_started', labelAr: 'لم يبدأ', labelEn: 'Not started' },
                  { id: 'in_progress', labelAr: 'جارٍ', labelEn: 'Active' },
                  { id: 'completed', labelAr: 'مكتمل', labelEn: 'Completed' },
                  { id: 'skipped', labelAr: 'فاتني', labelEn: 'Skipped' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  id={`btn-checkin-${st.id}`}
                  type="button"
                  onClick={() => handleSetCheckInStatus(st.id)}
                  className={`rounded-md px-2 py-1 transition-colors whitespace-nowrap ${
                    checkIn.status === st.id
                      ? st.id === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : st.id === 'skipped'
                          ? 'bg-amber-500 text-black'
                          : 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isAr ? st.labelAr : st.labelEn}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recovery Options if Today was Marked Skipped */}
        {checkIn.status === 'skipped' && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-foreground">
              {isAr
                ? 'لا مشكلة — اختر الإجراء الأنسب لتعديل جدولك بدون توقف:'
                : 'No guilt — pick a clean schedule adjustment:'}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-skip-reschedule-tomorrow"
                type="button"
                onClick={handleRestTodayTrainTomorrow}
                className="rounded-lg bg-primary px-3 py-1.5 font-bold text-primary-foreground hover:bg-primary/90"
              >
                {isAr ? 'نقل التمرين لغداً (إعادة جدولة)' : 'Reschedule to Tomorrow'}
              </button>
              <button
                id="btn-skip-mark-rest"
                type="button"
                onClick={handleMarkTodayRestDay}
                className="rounded-lg border border-border bg-card px-3 py-1.5 font-bold text-foreground hover:border-primary/50"
              >
                {isAr ? 'اعتبار اليوم راحة' : 'Rest Day'}
              </button>
              <button
                id="btn-skip-open-move"
                type="button"
                onClick={() => setDaySwapOpen(true)}
                className="rounded-lg border border-border bg-card px-3 py-1.5 font-bold text-foreground hover:border-primary/50"
              >
                {isAr ? 'نقل ليوم آخر' : 'Move Workout'}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Clean Grid: Today's Essential Workout (7 cols) + Meal Targets & Progress (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* TILE 1: TODAY'S ESSENTIAL WORKOUT */}
        <section
          aria-labelledby="tile-current-workout-heading"
          className="lg:col-span-7 rounded-2xl border border-border bg-card p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary shrink-0" />
              <h2 id="tile-current-workout-heading" className="text-base sm:text-lg font-black text-foreground">
                {isAr ? 'تفاصيل التمرين المطلوب الآن' : "Today's Workout Execution"}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('guidance')}
                className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary whitespace-nowrap"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>{isAr ? 'تفاصيل الخطة' : 'Plan Details'}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('weeklySchedule')}
                className="flex items-center gap-1 text-xs font-bold text-primary hover:underline whitespace-nowrap"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>{isAr ? 'الجدول' : 'Schedule'}</span>
              </button>
            </div>
          </div>

          {/* Interactive 7-Day Selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {schedule.map((day, idx) => {
              const isSelected = idx === selectedDayIndex;
              const isToday = idx === todayIndex;
              return (
                <button
                  key={day.id}
                  id={`dash-day-${idx}`}
                  type="button"
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isToday
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isAr ? day.dayNameAr : day.dayName.slice(0, 3)}
                </button>
              );
            })}
          </div>

          {/* Selected Day Summary + Move Workout + Difficulty Selector */}
          <div className="space-y-3 border-y border-border py-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-black text-foreground">
                  {isAr ? `${activeDay.dayNameAr}: ${activeDay.titleAr}` : `${activeDay.dayName}: ${activeDay.title}`}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 font-mono tabular-nums">
                  {currentSession.exercises.length} {isAr ? 'تمارين' : 'exercises'} · ~{currentSession.durationMinutes} {isAr ? 'دقيقة' : 'min'}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  id="btn-dashboard-toggle-day-swap"
                  type="button"
                  onClick={() => setDaySwapOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                    daySwapOpen
                      ? 'border-amber-500 bg-amber-500 text-black'
                      : 'border-border bg-secondary/60 text-foreground hover:border-primary/50 hover:text-primary'
                  }`}
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  <span>{isAr ? 'نقل / تبديل اليوم' : 'Move Workout'}</span>
                </button>

                {!activeDay.isRestDay && (
                  <div className="inline-flex rounded-xl border border-border bg-secondary/50 p-1 shrink-0">
                    {(
                      [
                        { id: 'easy', labelAr: 'سهل', labelEn: 'Easy' },
                        { id: 'standard', labelAr: 'قياسي', labelEn: 'Standard' },
                        { id: 'hard', labelAr: 'متقدم', labelEn: 'Hard' },
                      ] as const
                    ).map((lvl) => (
                      <button
                        key={lvl.id}
                        id={`dash-diff-${lvl.id}`}
                        type="button"
                        onClick={() => setDifficultyLevel(lvl.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors whitespace-nowrap ${
                          difficultyLevel === lvl.id
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {isAr ? lvl.labelAr : lvl.labelEn}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Inline Smart Move Workout Panel with GREEN / YELLOW / RED safety rating */}
            {daySwapOpen && (
              <div
                id="panel-dashboard-day-swap"
                className="rounded-xl border border-amber-500/40 bg-secondary/30 p-3.5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black text-foreground">
                    {isAr
                      ? `نقل تمرين ${activeDay.dayNameAr} إلى يوم آخر (تقييم الاستشفاء):`
                      : `Move ${activeDay.dayName} workout (with recovery safety check):`}
                  </span>
                  <div className="flex items-center gap-2">
                    {!todayPlan.isRestDay && isViewingToday && (
                      <button
                        type="button"
                        onClick={handleRestTodayTrainTomorrow}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500"
                      >
                        <Moon className="h-3 w-3" />
                        <span>{isAr ? 'راحة اليوم وتمرين غداً' : 'Rest Today & Train Tomorrow'}</span>
                      </button>
                    )}
                    {schedule.some((d) => d.isSwapped) && (
                      <button
                        type="button"
                        onClick={handleResetWeekSchedule}
                        className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-primary"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Swap targets with GREEN / YELLOW / RED indicator + 1-line reason */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {schedule.map((day, idx) => {
                    if (idx === selectedDayIndex) return null;
                    const safety = WeeklyScheduleService.evaluateMoveSafety(selectedDayIndex, idx, schedule);
                    const badgeClass =
                      safety.rating === 'green'
                        ? 'text-emerald-400'
                        : safety.rating === 'yellow'
                          ? 'text-amber-400'
                          : 'text-rose-400';

                    return (
                      <button
                        key={day.id}
                        id={`btn-swap-day-${idx}`}
                        type="button"
                        onClick={() => handleSwapWithDay(idx)}
                        className="flex items-start justify-between rounded-lg border border-border bg-card px-3 py-2 text-start hover:border-amber-500/60 transition-colors gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs font-black text-foreground">
                            <span>{isAr ? day.dayNameAr : day.dayName}</span>
                            <span className={`text-[10px] font-black ${badgeClass}`}>
                              ● {isAr ? safety.labelAr : safety.labelEn}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {isAr ? day.titleAr : day.title}
                          </div>
                          <div className="text-[10px] text-muted-foreground/80 line-clamp-1">
                            {isAr ? safety.reasonAr : safety.reasonEn}
                          </div>
                        </div>
                        <ArrowLeftRight className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-1" />
                      </button>
                    );
                  })}
                </div>

                {/* Direct Split Picker */}
                <div className="pt-2 border-t border-border/60 space-y-2">
                  <div className="text-[11px] font-bold text-muted-foreground">
                    {isAr
                      ? `أو تعيين يوم ${activeDay.dayNameAr} مباشرة إلى:`
                      : `Or set ${activeDay.dayName} directly to:`}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'push', labelAr: 'صدر وكتف (Push)', labelEn: 'Push' },
                      { id: 'pull', labelAr: 'ظهر وباي (Pull)', labelEn: 'Pull' },
                      { id: 'legs', labelAr: 'أرجل (Legs)', labelEn: 'Legs' },
                      { id: 'upper', labelAr: 'علوي (Upper)', labelEn: 'Upper' },
                      { id: 'lower', labelAr: 'سفلي (Lower)', labelEn: 'Lower' },
                      { id: 'shoulders_arms', labelAr: 'أكتاف وذراع', labelEn: 'Shoulders & Arms' },
                      { id: 'cardio_conditioning', labelAr: 'كارديو دراجة/مشي', labelEn: 'Bike / Walk Cardio' },
                      { id: 'rest_active', labelAr: 'راحة / استشفاء', labelEn: 'Rest / Recovery' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        id={`btn-set-split-${opt.id}`}
                        type="button"
                        onClick={() => handleChangeDaySplit(opt.id)}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                          activeDay.splitId === opt.id
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-foreground hover:border-primary/50'
                        }`}
                      >
                        {isAr ? opt.labelAr : opt.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Essential Exercise List: # | Exercise | Sets x Reps · Rest */}
          <div className="divide-y divide-border/70">
            {currentSession.exercises.map((ex, idx) => {
              const setsCount = ex.sets?.length || 3;
              const targetReps = ex.sets?.[0]?.targetReps || '8-12';
              const restSec = ex.restSeconds || 90;

              return (
                <div
                  key={`${ex.exerciseId}-${idx}`}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="mt-0.5 w-5 shrink-0 text-xs font-black font-mono tabular-nums text-muted-foreground">
                      {idx + 1}.
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-foreground truncate">
                        {isAr ? ex.exerciseNameAr || ex.exerciseName : ex.exerciseName}
                      </div>
                      {ex.exerciseNameAr && (
                        <div className="text-[11px] font-mono text-muted-foreground truncate" dir="ltr">
                          {isAr ? ex.exerciseName : ex.exerciseNameAr}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-end font-mono tabular-nums shrink-0">
                    <div className="text-xs font-black text-primary">
                      {setsCount} × {targetReps}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {isAr ? `راحة ${restSec}ث` : `Rest ${restSec}s`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Today's Low-Impact Cardio Prescription Line */}
          <div className="rounded-xl bg-secondary/35 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <HeartPulse className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="font-bold text-foreground truncate">
                {isAr ? todayCardioRec.labelAr : todayCardioRec.labelEn}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('cardio')}
              className="text-[11px] font-bold text-primary hover:underline shrink-0"
            >
              {isAr ? 'فتح الكارديو' : 'Cardio'}
            </button>
          </div>
        </section>

        {/* RIGHT STACK: TILE 2 (Daily Meal Targets) + TILE 3 (Key Progress) */}
        <div className="lg:col-span-5 space-y-5">
          {/* TILE 2: DAILY MEAL TARGETS */}
          <section
            aria-labelledby="tile-daily-meals-heading"
            className="rounded-2xl border border-border bg-card p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-emerald-400 shrink-0" />
                <h2 id="tile-daily-meals-heading" className="text-base sm:text-lg font-black text-foreground">
                  {isAr ? 'وجبات اليوم والأهداف' : 'Daily Meal Targets'}
                </h2>
              </div>

              <button
                id="btn-dashboard-open-meals"
                type="button"
                onClick={() => onNavigate('nutrition')}
                className="flex items-center gap-1 text-xs font-bold text-primary hover:underline whitespace-nowrap shrink-0"
              >
                <span>{isAr ? 'كل الوجبات' : 'Meal Plan'}</span>
                <ForwardArrow className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Calorie, Protein & Fiber Progress */}
            <div className="grid grid-cols-3 gap-2.5 border-y border-border py-3 font-mono tabular-nums">
              <div>
                <div className="text-[11px] font-sans text-muted-foreground">
                  {isAr ? 'السعرات' : 'Calories'}
                </div>
                <div className="text-xs sm:text-sm font-black text-foreground">
                  {loggedCalories} / {calorieTarget}
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(100, Math.round((loggedCalories / (calorieTarget || 1)) * 100))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="text-[11px] font-sans text-muted-foreground">
                  {isAr ? 'البروتين' : 'Protein'}
                </div>
                <div className="text-xs sm:text-sm font-black text-primary">
                  {loggedProtein} / {proteinTarget}g
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, Math.round((loggedProtein / (proteinTarget || 1)) * 100))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="text-[11px] font-sans text-muted-foreground">
                  {isAr ? 'الألياف' : 'Fiber'}
                </div>
                <div className="text-xs sm:text-sm font-black text-emerald-400">
                  {loggedFiber} / {fiberTarget}g
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all"
                    style={{ width: `${Math.min(100, Math.round((loggedFiber / (fiberTarget || 1)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Plan A / B / C Quick Selector */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1.5">
                {FAT_LOSS_MEAL_PLANS.map((plan, idx) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors whitespace-nowrap ${
                      todayMealPlan.id === plan.id
                        ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                        : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isAr ? `خطة ${idx === 0 ? 'أ' : idx === 1 ? 'ب' : 'ج'}` : `Plan ${idx === 0 ? 'A' : idx === 1 ? 'B' : 'C'}`}
                  </button>
                ))}
              </div>
              <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
                {todayMealPlan.totalCalories} kcal · {todayMealPlan.totalFiber}g Fiber
              </span>
            </div>

            {/* Actionable 4-Meal Checklist */}
            <div className="divide-y divide-border/70">
              {todayMealPlan.meals.map((meal) => {
                const isLogged = todayNutritionLogs.some((log) => log.mealType === meal.slot);
                return (
                  <div key={meal.slot} className="py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-black text-foreground">
                          {isAr ? meal.slotNameAr : meal.slotNameEn}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {meal.calories} kcal · {meal.proteinGrams}g P
                        </span>
                      </div>
                      <div className="text-xs font-bold text-foreground truncate mt-0.5">
                        {isAr ? meal.titleAr : meal.titleEn}
                      </div>
                    </div>

                    <button
                      id={`dash-log-meal-${meal.slot}`}
                      type="button"
                      onClick={() => handleQuickLogMeal(meal)}
                      className={`shrink-0 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors whitespace-nowrap ${
                        isLogged
                          ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                          : 'border border-border bg-secondary/60 text-foreground hover:border-primary/50 hover:text-primary'
                      }`}
                    >
                      <Check className="h-3 w-3" />
                      <span>{isLogged ? (isAr ? 'تم' : 'Logged') : (isAr ? 'تسجيل' : 'Log')}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Quick Hydration Control */}
            <div className="pt-2 border-t border-border flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-mono tabular-nums">
                <Droplets className="h-4 w-4 text-sky-400 shrink-0" />
                <span className="font-bold text-foreground">
                  {(todayWaterMl / 1000).toFixed(2)} / {(waterTargetMl / 1000).toFixed(1)} L
                </span>
              </div>
              <button
                id="dash-add-water-250"
                type="button"
                onClick={() => handleAddWater(250)}
                className="rounded-lg border border-border bg-secondary/60 px-2.5 py-1 text-[11px] font-bold text-foreground hover:bg-secondary whitespace-nowrap"
              >
                +250 ml
              </button>
            </div>
          </section>

          {/* TILE 3: HOW AM I PROGRESSING? (Simple 2x2 Summary) */}
          <section
            aria-labelledby="tile-key-metrics-heading"
            className="rounded-2xl border border-border bg-card p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary shrink-0" />
                <h2 id="tile-key-metrics-heading" className="text-base sm:text-lg font-black text-foreground">
                  {isAr ? 'مؤشرات التقدم' : 'Progress Snapshot'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('progress')}
                className="flex items-center gap-1 text-xs font-bold text-primary hover:underline whitespace-nowrap shrink-0"
              >
                <span>{isAr ? 'التفاصيل' : 'Progress'}</span>
                <ForwardArrow className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 divide-x divide-y divide-border/70 border border-border/70 rounded-xl overflow-hidden font-mono tabular-nums">
              <div className="p-3 bg-secondary/20">
                <div className="text-[11px] font-sans text-muted-foreground">
                  {isAr ? 'الوزن (متوسط 7 أيام)' : 'Weight (7d Avg)'}
                </div>
                <div className="text-base font-black text-foreground mt-0.5">
                  {rolling7DayWeight} kg
                </div>
                <div className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 shrink-0" />
                  <span>{weightDeltaKg > 0 ? `+${weightDeltaKg}` : weightDeltaKg} kg</span>
                </div>
              </div>

              <div className="p-3 bg-secondary/20">
                <div className="text-[11px] font-sans text-muted-foreground">
                  {isAr ? 'محيط الخصر' : 'Waist'}
                </div>
                <div className="text-base font-black text-foreground mt-0.5">
                  {measurements[0]?.waistCm || profile.currentWaistCm} cm
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {isAr ? `الهدف المرحلة 1: ${profile.goalWeightKg} kg` : `Phase 1: ${profile.goalWeightKg} kg`}
                </div>
              </div>

              <div className="p-3 bg-secondary/20">
                <div className="text-[11px] font-sans text-muted-foreground">
                  {isAr ? 'تمارين الأسبوع' : 'Weekly Workouts'}
                </div>
                <div className="text-base font-black text-foreground mt-0.5">
                  {workoutsLast7Days} / {profile.trainingDaysPerWeek || 4}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {completedWorkouts.length} {isAr ? 'إجمالي' : 'total'}
                </div>
              </div>

              <div className="p-3 bg-secondary/20">
                <div className="text-[11px] font-sans text-muted-foreground">
                  {isAr ? 'حالة اليوم' : 'Today Check-In'}
                </div>
                <div className="text-sm font-black text-primary mt-0.5 font-sans">
                  {checkIn.status === 'completed'
                    ? (isAr ? 'تم الإنجاز ✓' : 'Completed ✓')
                    : checkIn.status === 'in_progress'
                      ? (isAr ? 'جارٍ الآن' : 'In Progress')
                      : checkIn.status === 'skipped'
                        ? (isAr ? 'مُؤجّل' : 'Rescheduled')
                        : (isAr ? 'جاهز للبدء' : 'Ready')}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {isAr ? `يوم ${programProgress.totalProgramDay}` : `Day ${programProgress.totalProgramDay}`}
                </div>
              </div>
            </div>

            {weightInputOpen ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="dash-input-weight"
                  type="number"
                  step={0.1}
                  min={30}
                  max={300}
                  value={newWeightInput}
                  onChange={(e) => setNewWeightInput(e.target.value)}
                  className="w-28 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold font-mono tabular-nums text-foreground focus:border-primary focus:outline-none"
                />
                <button
                  id="dash-save-weight"
                  type="button"
                  onClick={handleSaveWeightCheckIn}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground whitespace-nowrap"
                >
                  {isAr ? 'حفظ' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setWeightInputOpen(false)}
                  className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <button
                  id="dash-open-weight-checkin"
                  type="button"
                  onClick={() => {
                    setNewWeightInput(String(latestWeightKg));
                    setWeightInputOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  <span>{isAr ? 'تسجيل الوزن اليوم' : 'Log Today Weight'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('guidance')}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {isAr ? 'تفاصيل الخطة الكاملة' : 'Plan Details'}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
