import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Flame, 
  Dumbbell, 
  TrendingUp, 
  Droplets, 
  Footprints, 
  Moon, 
  Sparkles, 
  Trophy, 
  Play, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  Scale, 
  Activity,
  Zap,
  Target,
  Watch,
  Bluetooth,
  HeartPulse
} from 'lucide-react';
import { UserProfile, WorkoutSession, BodyMeasurement } from '../../types';
import { translations } from '../../i18n/translations';
import { PPLEngine, TransitionPhaseInfo } from '../../services/pplEngine';
import { calculateProgramProgress } from '../../services/dateUtils';
import { StorageService } from '../../services/storage';
import { GeminiService } from '../../services/geminiService';
import { SamsungHealthService } from '../../services/samsungHealthService';
import { BluetoothHealthService } from '../../services/bluetoothHealthService';
import { NavSection } from '../layout/Sidebar';
import { SmartWarmupModal } from '../workout/SmartWarmupModal';
import { HydrationTracker } from './HydrationTracker';
import { LiveHeartRateBadge } from '../devices/LiveHeartRateBadge';

interface DashboardViewProps {
  profile: UserProfile;
  history: WorkoutSession[];
  activeWorkout: WorkoutSession | null;
  onStartWorkout: () => void;
  onNavigate: (section: NavSection) => void;
  onUpdateProfile?: (profile: UserProfile) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  history,
  activeWorkout,
  onStartWorkout,
  onNavigate,
  onUpdateProfile,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [dailyBriefing, setDailyBriefing] = useState<string>('');
  const [todayWaterMl, setTodayWaterMl] = useState<number>(0);
  const [briefingLoading, setBriefingLoading] = useState<boolean>(false);
  const [smartWarmupOpen, setSmartWarmupOpen] = useState<boolean>(false);
  const [samsungSummary, setSamsungSummary] = useState(SamsungHealthService.getLatestSummary());

  // Load data
  useEffect(() => {
    const meas = StorageService.getMeasurements();
    setMeasurements(meas);
    setTodayWaterMl(StorageService.getTodayHydrationTotal());
    setSamsungSummary(SamsungHealthService.getLatestSummary());

    // Fetch daily AI briefing
    setBriefingLoading(true);
    GeminiService.getDailyBriefing(
      {
        mode: profile.mode,
        completedWorkouts: history.length,
        weight: profile.currentWeightKg,
        waist: profile.currentWaistCm,
      },
      profile.language
    ).then(res => {
      setDailyBriefing(res);
      setBriefingLoading(false);
    });
  }, [profile, history]);

  const pplPhase = PPLEngine.getTodayPPLPhase(history, profile);
  const programProgress = calculateProgramProgress(profile.startDate);
  const transitionPhase = PPLEngine.getAdaptiveProgramTimeline(profile.startDate);
  const weeklyVolume = PPLEngine.calculateWeeklyVolume(history);
  const rollingAvgWeight = PPLEngine.calculate7DayWeightAverage(measurements);
  const fatLossTrend = PPLEngine.evaluateFatLossTrend(measurements, history);

  const completedWorkoutsCount = history.filter(w => w.completed).length;
  const cardioHistory = StorageService.getCardioHistory();
  const totalCardioMins = cardioHistory.reduce((sum, c) => sum + c.durationMinutes, 0);

  // Calculations for dashboard metrics and progress bars
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const workoutsThisWeek = history.filter(w => w.completed && (w.timestamp || 0) >= oneWeekAgo).length;
  const cardioThisWeek = cardioHistory
    .filter(c => (c.timestamp || 0) >= oneWeekAgo)
    .reduce((sum, c) => sum + c.durationMinutes, 0);

  const today = new Date().toISOString().split('T')[0];
  const nutritionHistory = StorageService.getNutritionHistory();
  const todayNutrition = nutritionHistory.filter(n => n.date === today);
  const todayProteinLogged = todayNutrition.reduce((sum, n) => sum + n.proteinGrams, 0);
  const todayCaloriesLogged = todayNutrition.reduce((sum, n) => sum + n.calories, 0);

  // Recomp weight journey progress
  const startWeight = profile.startWeightKg || 88;
  const goalWeight = profile.goalWeightKg || 80;
  const currentWeight = profile.currentWeightKg || 88;
  const totalWeightDelta = Math.max(0.5, startWeight - goalWeight);
  const weightProgressMade = Math.max(0, startWeight - currentWeight);
  const weightLossProgressPercent = Math.min(100, Math.max(0, Math.round((weightProgressMade / totalWeightDelta) * 100)));

  // Hydration percentage
  const hydrationPercent = Math.min(100, Math.round((todayWaterMl / (profile.dailyWaterTargetMl || 3000)) * 100));

  // Protein percentage
  const proteinPercent = Math.min(
    100,
    Math.round(((todayProteinLogged > 0 ? todayProteinLogged : (profile.dailyProteinTargetGrams * 0.65)) / profile.dailyProteinTargetGrams) * 100)
  );

  // Weekly workout consistency percentage
  const weeklyWorkoutPercent = Math.min(100, Math.round((workoutsThisWeek / (profile.trainingDaysPerWeek || 5)) * 100));

  // Cardio weekly progress (target 150 min Zone 2 fat loss)
  const cardioTargetMins = 150;
  const cardioWeeklyPercent = Math.min(100, Math.round((cardioThisWeek / cardioTargetMins) * 100));

  // Mesocycle Block Phase Progress
  const blockProgressPercent = Math.min(100, Math.round((programProgress.weekInCycle / 4) * 100));

  // Quick hydration click (+250ml)
  const handleAddQuickWater = () => {
    StorageService.addHydration(250);
    setTodayWaterMl(StorageService.getTodayHydrationTotal());
  };

  const phaseBadgeColor = 
    pplPhase === 'push' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
    pplPhase === 'pull' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
    pplPhase === 'legs' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
    'bg-purple-500/20 text-purple-400 border-purple-500/30';

  return (
    <div className="space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Hero Welcome & Mode Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {t.dashboard.title}, {profile.name.split(' ')[0]}
            </h1>
            
            {/* Dynamic Adaptive Program Week & Day Badge from dateUtils */}
            <button
              onClick={() => onNavigate('profile')}
              title={isAr ? 'تعديل تاريخ بداية البرنامج' : 'Configure Program Start Date in Profile'}
              className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary border border-primary/25 hover:bg-primary/25 transition-all cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{isAr ? programProgress.formattedProgressAr : programProgress.formattedProgress}</span>
              <span className="opacity-70 text-[11px]">({isAr ? `اليوم ${programProgress.totalProgramDay}` : `Day ${programProgress.totalProgramDay}`})</span>
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {profile.mode === 'muscle_recomp' ? t.modes.muscle_recomp : t.modes.controlled_fat_loss} • {t.dashboard.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeWorkout ? (
            <button
              id="btn-resume-dashboard-hero"
              onClick={onStartWorkout}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{t.dashboard.continueWorkout}</span>
            </button>
          ) : (
            <button
              id="btn-start-dashboard-hero"
              onClick={onStartWorkout}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{t.dashboard.startWorkout} ({pplPhase.toUpperCase()})</span>
            </button>
          )}
        </div>
      </div>

      {/* Gemini AI Daily Athletic Briefing Card */}
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-primary">
                {t.dashboard.dailyBriefing}
              </h3>
              <button
                id="btn-ask-coach-briefing"
                onClick={() => onNavigate('aiCoach')}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>{t.nav.aiCoach}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <p className="mt-2 text-sm text-foreground leading-relaxed">
              {briefingLoading ? (
                <span className="text-muted-foreground italic">
                  {isAr ? 'جاري تحضير التوجيه التدريبي اليومي...' : 'Synthesizing sports science directives...'}
                </span>
              ) : (
                dailyBriefing
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Grid: PPL Split Target & Fat Loss Trend Engine */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 7 cols: PPL Daily Session Card */}
        <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t.dashboard.todayPPL}
                  </span>
                  <h3 className="text-lg font-black text-foreground capitalize">
                    {pplPhase === 'push' && (isAr ? 'جلسة الدفع (الصدر، الأكتاف، الترايسبس)' : 'Push Session (Chest, Delts, Triceps)')}
                    {pplPhase === 'pull' && (isAr ? 'جلسة السحب (الظهر، الترابيس، البايسبس)' : 'Pull Session (Back, Traps, Biceps)')}
                    {pplPhase === 'legs' && (isAr ? 'جلسة الأرجل (الفخذ، الخلفيات، السمانة)' : 'Legs Session (Quads, Hamstrings, Calves)')}
                    {pplPhase === 'rest_active' && (isAr ? 'استشفاء نشط وكور ومرونة' : 'Active Recovery & Core Session')}
                  </h3>
                </div>
              </div>

              <span className={`rounded-lg px-3 py-1 text-xs font-black uppercase border ${phaseBadgeColor}`}>
                {pplPhase}
              </span>
            </div>

            {/* Mesocycle Block Phase Context & Animated Progress Bar */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <span className="text-primary">
                    {isAr ? `دورة الميزوسايكل ${programProgress.cycleNumber}` : `Mesocycle ${programProgress.cycleNumber}`}
                  </span>
                  <span>•</span>
                  <span>
                    {isAr ? `أسبوع ${programProgress.weekInCycle} من 4` : `Block Week ${programProgress.weekInCycle} of 4`}
                  </span>
                </div>
                <span className="text-xs font-semibold text-primary font-mono">
                  {programProgress.weekInCycle} / 4 {isAr ? 'أسابيع' : 'Weeks'} ({blockProgressPercent}%)
                </span>
              </div>

              {/* Framer Motion Entry Animated Progress Bar */}
              <div className="h-2 w-full rounded-full bg-secondary/80 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${blockProgressPercent}%` }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                />
              </div>

              <div className="text-xs font-semibold text-foreground">
                {isAr ? transitionPhase.phaseTitleAr : transitionPhase.phaseTitle}
              </div>

              <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
                {(isAr ? transitionPhase.focusDirectivesAr : transitionPhase.focusDirectives).map((dir, idx) => (
                  <li key={idx} className="leading-relaxed">{dir}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-4">
            <div className="text-xs text-muted-foreground">
              <span>{t.dashboard.programStartDate}: </span>
              <strong className="text-foreground">{programProgress.startDateString}</strong>
              <span className="mx-2">•</span>
              <span>{t.dashboard.totalDaysElapsed}: </span>
              <strong className="text-foreground">{programProgress.totalElapsedDays}d ({isAr ? `اليوم ${programProgress.totalProgramDay}` : `Day ${programProgress.totalProgramDay}`})</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-launch-smart-warmup-dashboard"
                onClick={() => setSmartWarmupOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all shadow-sm"
                title={isAr ? 'بدء إحماء 5 دقائق مخصص لجلستك اليوم' : '5-Minute dynamic warm-up sequence for today’s session'}
              >
                <Flame className="h-3.5 w-3.5 fill-current" />
                <span>{t.dashboard.smartWarmup}</span>
              </button>

              <button
                id="btn-launch-workout-ppl-card"
                onClick={onStartWorkout}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{activeWorkout ? t.dashboard.continueWorkout : t.dashboard.startWorkout}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 5 cols: Fat-Loss & Body Composition Engine */}
        <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-foreground">{t.dashboard.recompStatus}</h3>
              </div>
              <span className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground">
                {isAr ? fatLossTrend.badgeAr : fatLossTrend.badge}
              </span>
            </div>

            {/* Quick Measurement Badges */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <Scale className="h-3.5 w-3.5" />
                  <span>{t.progress.rollingWeightAvg}</span>
                </div>
                <div className="text-lg font-black text-foreground mt-1">
                  {rollingAvgWeight || profile.currentWeightKg} <span className="text-xs text-muted-foreground">kg</span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <Target className="h-3.5 w-3.5" />
                  <span>{t.progress.waistMeasurement}</span>
                </div>
                <div className="text-lg font-black text-foreground mt-1">
                  {profile.currentWaistCm} <span className="text-xs text-muted-foreground">cm</span>
                </div>
              </div>
            </div>

            {/* Animated Weight Target Journey Progress Bar */}
            <div className="mt-3 rounded-xl border border-border bg-secondary/20 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground">
                  {isAr ? `الهدف: ${goalWeight} كجم` : `Goal Target: ${goalWeight} kg`}
                </span>
                <span className="text-primary font-mono">{weightLossProgressPercent}% {t.common.completed}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-emerald-500 to-emerald-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${weightLossProgressPercent}%` }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                <span>{startWeight} kg</span>
                <span>{currentWeight} kg ({isAr ? 'الحالي' : 'Current'})</span>
                <span>{goalWeight} kg ({isAr ? 'الهدف' : 'Target'})</span>
              </div>
            </div>

            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              {isAr ? fatLossTrend.explanationAr : fatLossTrend.explanation}
            </p>
          </div>

          <div className="mt-5 border-t border-border pt-3">
            <button
              id="btn-open-progress-from-dashboard"
              onClick={() => onNavigate('progress')}
              className="flex w-full items-center justify-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <span>{t.progress.analyticsTitle}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Volume & Progressive Overload Mission Tracker */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-black text-foreground sm:text-lg">
                  {t.dashboard.weeklyVolume}
                </h3>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                  weeklyVolume.status === 'overload_achieved'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : weeklyVolume.status === 'steady_maintenance'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : weeklyVolume.status === 'volume_deload'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-primary/20 text-primary border-primary/30'
                }`}>
                  {isAr ? weeklyVolume.statusBadgeAr : weeklyVolume.statusBadge}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr 
                  ? 'حساب إجمالي الأوزان المرفوعة (Tonnage) خلال الأسبوع الحالي لضمان تطبيق الزيادة التدريجية للأحمال.'
                  : 'Total working tonnage across all completed sessions in the current week to verify progressive overload.'}
              </p>
            </div>
          </div>

          {/* Big Total Tonnage Counter */}
          <div className="flex items-baseline gap-2 self-start sm:self-auto">
            <span className="text-2xl sm:text-3xl font-black text-foreground font-mono">
              {weeklyVolume.currentWeekVolumeKg.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              kg <span className="text-primary font-semibold">({weeklyVolume.currentWeekVolumeTons} tons)</span>
            </span>
          </div>
        </div>

        {/* Summary Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-secondary/30 p-3">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">{t.dashboard.vsLastWeek}</span>
            <div className="flex items-center gap-1 mt-1 text-sm font-black font-mono">
              {weeklyVolume.volumeDeltaKg > 0 ? (
                <span className="text-emerald-400">+{weeklyVolume.volumeDeltaKg.toLocaleString()} kg (+{weeklyVolume.volumeDeltaPercent}%)</span>
              ) : weeklyVolume.volumeDeltaKg < 0 ? (
                <span className="text-amber-400">{weeklyVolume.volumeDeltaKg.toLocaleString()} kg ({weeklyVolume.volumeDeltaPercent}%)</span>
              ) : (
                <span className="text-muted-foreground">0 kg (0.0%)</span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-secondary/30 p-3">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">{isAr ? 'المجموعات المكتملة' : 'Completed Sets'}</span>
            <div className="text-sm font-black text-foreground mt-1 font-mono">
              {weeklyVolume.totalSetsCompleted} <span className="text-xs font-normal text-muted-foreground">{t.common.sets}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-secondary/30 p-3">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">{isAr ? 'التكرارات المكتملة' : 'Total Reps'}</span>
            <div className="text-sm font-black text-foreground mt-1 font-mono">
              {weeklyVolume.totalRepsCompleted} <span className="text-xs font-normal text-muted-foreground">{t.common.reps}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-secondary/30 p-3">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">{isAr ? 'متوسط التمرين' : 'Avg / Session'}</span>
            <div className="text-sm font-black text-foreground mt-1 font-mono">
              {weeklyVolume.avgVolumePerWorkoutKg.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kg</span>
            </div>
          </div>
        </div>

        {/* Session-by-Session Volume Breakdown */}
        {weeklyVolume.sessionBreakdown.length > 0 ? (
          <div className="space-y-2.5 pt-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {isAr ? 'توزيع الحجم التدريبي لتمارين الأسبوع:' : 'Current Week Session Breakdown:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {weeklyVolume.sessionBreakdown.map((sess, idx) => {
                const maxSessionVol = Math.max(...weeklyVolume.sessionBreakdown.map(s => s.volumeKg), 1);
                const barWidth = Math.min(100, Math.max(15, Math.round((sess.volumeKg / maxSessionVol) * 100)));
                return (
                  <div key={sess.id || idx} className="rounded-xl border border-border bg-secondary/20 p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-foreground truncate">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/20 text-[10px] font-black text-primary">
                          {sess.type.toUpperCase().slice(0, 1)}
                        </span>
                        <span className="truncate">{isAr ? sess.nameAr : sess.name}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground shrink-0">{isAr ? sess.dayNameAr : sess.dayName}</span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-mono font-black text-foreground">{sess.volumeKg.toLocaleString()} kg</span>
                      <span className="text-[11px] text-muted-foreground">{sess.setsCount} {t.common.sets}</span>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.1 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-4 text-center text-xs text-muted-foreground">
            {isAr ? 'لم تسجل أي تمارين مكتملة هذا الأسبوع بعد. ابدأ تمرينتك اليوم لجمع وتتبع الحجم التدريبي.' : 'No completed workouts logged yet for the current week. Complete a session to start accumulating volume tonnage.'}
          </div>
        )}

        {/* Progressive Overload Coaching Feedback Banner */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-2.5 text-xs text-foreground leading-relaxed">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-primary">{t.dashboard.progressiveOverload}: </span>
            <span>{isAr ? weeklyVolume.feedbackAr : weeklyVolume.feedback}</span>
          </div>
        </div>
      </div>

      {/* Samsung Health & Smartwatch Live Integration Hub Card */}
      <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-card to-card p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/80 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-sm">
              <Watch className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-foreground">
                  {isAr ? 'تكامل Samsung Health وساعة اليد الذكية' : 'Samsung Health & Smartwatch Telemetry'}
                </h3>
                <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-sky-400 border border-sky-500/30">
                  BLE 5.0 + Health Hub
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr 
                  ? 'مزامنة قياسات الخطوات، النوم، دهون الجسم InBody، وبث نبض القلب المباشر عبر البلوتوث.'
                  : 'Live biometric sync: Real-time Bluetooth HR telemetry, Samsung Health daily steps, sleep, and InBody body composition.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LiveHeartRateBadge
              compact={false}
              isArabic={isAr}
              onOpenDevicesModal={() => onNavigate('devices')}
            />
            <button
              onClick={() => onNavigate('devices')}
              className="flex items-center gap-1 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold py-2 px-3 text-xs shadow-md transition-all"
            >
              <span>{isAr ? 'فتح بوابة الأجهزة' : 'Open Health Hub'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Snapshot Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Steps */}
          <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-semibold">
                <Footprints className="h-3.5 w-3.5 text-sky-400" />
                <span>{isAr ? 'الخطوات اليومية' : 'Daily Steps'}</span>
              </div>
            </div>
            <div className="text-lg font-black text-foreground font-mono">
              {(samsungSummary?.steps?.count || 8540).toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {isAr ? 'الهدف: 10,000 خطوة' : 'Target: 10,000 steps'} ({Math.round(((samsungSummary?.steps?.count || 8540) / 10000) * 100)}%)
            </div>
          </div>

          {/* Sleep Score & Hours */}
          <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-semibold">
                <Moon className="h-3.5 w-3.5 text-indigo-400" />
                <span>{isAr ? 'النوم والاستشفاء' : 'Sleep Score'}</span>
              </div>
            </div>
            <div className="text-lg font-black text-foreground font-mono">
              {samsungSummary?.sleep?.score || 86}/100
            </div>
            <div className="text-[10px] text-muted-foreground">
              {samsungSummary?.sleep?.durationHours || 7.8} {isAr ? 'ساعات نوم عميق' : 'hrs total duration'}
            </div>
          </div>

          {/* InBody Body Fat % */}
          <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-semibold">
                <Scale className="h-3.5 w-3.5 text-emerald-400" />
                <span>{isAr ? 'نسبة الدهون InBody' : 'InBody Body Fat'}</span>
              </div>
            </div>
            <div className="text-lg font-black text-foreground font-mono">
              {samsungSummary?.bodyComposition?.bodyFatPercent || profile.currentBodyFatPercent || 14.8}%
            </div>
            <div className="text-[10px] text-muted-foreground">
              {samsungSummary?.bodyComposition?.skeletalMuscleMassKg || 36.2} kg {isAr ? 'عضلات هيكلية' : 'skeletal muscle'}
            </div>
          </div>

          {/* Active Calories Burned */}
          <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-semibold">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>{isAr ? 'السعرات المحروقة' : 'Active Burn'}</span>
              </div>
            </div>
            <div className="text-lg font-black text-foreground font-mono">
              {(samsungSummary?.steps?.caloriesBurned || 560).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kcal</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {isAr ? 'طاقة الحركة النشطة اليوم' : 'Active expenditure today'}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Hydration Tracker Component */}
      <HydrationTracker
        profile={profile}
        todayWaterMl={todayWaterMl}
        onUpdateWater={(newTotal) => setTodayWaterMl(newTotal)}
        onUpdateProfile={onUpdateProfile}
      />

      {/* Daily Habits & Nutrition Snapshot Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* Daily Protein Target */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <Flame className="h-4 w-4" />
              <span>{t.nutrition.proteinTarget}</span>
            </div>
            <div className="text-xl font-black text-foreground mt-2">
              {profile.dailyProteinTargetGrams} <span className="text-xs text-muted-foreground">g / day</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              ~{(profile.dailyProteinTargetGrams / profile.currentWeightKg).toFixed(1)}g per kg bodyweight
            </div>
          </div>

          {/* Framer Motion Entry Animated Protein Progress Bar */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-[11px] text-muted-foreground font-semibold">
              <span>{isAr ? 'الهدف الرياضي' : 'Muscle Synthesis'}</span>
              <span className="text-amber-400 font-mono">{proteinPercent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                initial={{ width: 0 }}
                animate={{ width: `${proteinPercent}%` }}
                transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
              />
            </div>
          </div>
        </div>

        {/* Weekly Workout Consistency & Missions */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Trophy className="h-4 w-4" />
              <span>{t.achievements.workoutsLogged}</span>
            </div>
            <div className="text-xl font-black text-foreground mt-2">
              {completedWorkoutsCount} <span className="text-xs text-muted-foreground">sessions</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {workoutsThisWeek} {isAr ? 'جلسات هذا الأسبوع' : 'sessions this week'}
            </div>
          </div>

          {/* Framer Motion Entry Animated Workout Consistency Progress Bar */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-[11px] text-muted-foreground font-semibold">
              <span>{isAr ? 'الهدف الأسبوعي' : 'Weekly Adherence'}</span>
              <span className="text-emerald-400 font-mono">{weeklyWorkoutPercent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                initial={{ width: 0 }}
                animate={{ width: `${weeklyWorkoutPercent}%` }}
                transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
              />
            </div>
          </div>
        </div>

        {/* Cardio & Fat Oxidation Minutes Logged */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400">
              <Activity className="h-4 w-4" />
              <span>{t.cardio.title}</span>
            </div>
            <div className="text-xl font-black text-foreground mt-2">
              {totalCardioMins} <span className="text-xs text-muted-foreground">minutes</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {cardioThisWeek} min / {cardioTargetMins} min Zone 2 target
            </div>
          </div>

          {/* Framer Motion Entry Animated Cardio Progress Bar */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-[11px] text-muted-foreground font-semibold">
              <span>{isAr ? 'حرق الدهون الأسبوعي' : 'Weekly Cardio'}</span>
              <span className="text-purple-400 font-mono">{cardioWeeklyPercent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-400"
                initial={{ width: 0 }}
                animate={{ width: `${cardioWeeklyPercent}%` }}
                transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.55 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Smart Warm-up 5-Min Sequence Modal */}
      <SmartWarmupModal
        isOpen={smartWarmupOpen}
        initialWorkoutType={pplPhase}
        profile={profile}
        onClose={() => setSmartWarmupOpen(false)}
        onStartWorkout={() => {
          setSmartWarmupOpen(false);
          onStartWorkout();
        }}
      />
    </div>
  );
};

