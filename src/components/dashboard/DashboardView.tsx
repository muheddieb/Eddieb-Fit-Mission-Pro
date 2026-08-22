import React, { useState, useEffect } from 'react';
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
  Target
} from 'lucide-react';
import { UserProfile, WorkoutSession, BodyMeasurement } from '../../types';
import { translations } from '../../i18n/translations';
import { PPLEngine, TransitionPhaseInfo } from '../../services/pplEngine';
import { StorageService } from '../../services/storage';
import { GeminiService } from '../../services/geminiService';
import { NavSection } from '../layout/Sidebar';

interface DashboardViewProps {
  profile: UserProfile;
  history: WorkoutSession[];
  activeWorkout: WorkoutSession | null;
  onStartWorkout: () => void;
  onNavigate: (section: NavSection) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  history,
  activeWorkout,
  onStartWorkout,
  onNavigate,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [dailyBriefing, setDailyBriefing] = useState<string>('');
  const [todayWaterMl, setTodayWaterMl] = useState<number>(0);
  const [briefingLoading, setBriefingLoading] = useState<boolean>(false);

  // Load data
  useEffect(() => {
    const meas = StorageService.getMeasurements();
    setMeasurements(meas);
    setTodayWaterMl(StorageService.getTodayHydrationTotal());

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
  const transitionPhase = PPLEngine.getFourWeekTransition(profile.startDate);
  const rollingAvgWeight = PPLEngine.calculate7DayWeightAverage(measurements);
  const fatLossTrend = PPLEngine.evaluateFatLossTrend(measurements, history);

  const completedWorkoutsCount = history.filter(w => w.completed).length;
  const cardioHistory = StorageService.getCardioHistory();
  const totalCardioMins = cardioHistory.reduce((sum, c) => sum + c.durationMinutes, 0);

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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {t.dashboard.title}, {profile.name.split(' ')[0]}
            </h1>
            <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
              <Zap className="h-3 w-3" />
              {isAr ? `الأسبوع ${transitionPhase.currentWeek}` : `Week ${transitionPhase.currentWeek}`}
            </span>
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

            {/* 4-Week Transition Phase Context */}
            <div className="mt-4 space-y-2.5">
              <div className="text-xs font-bold text-foreground">
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
              <span>{t.common.location}: </span>
              <strong className="text-foreground capitalize">{profile.preferredLocation}</strong>
              <span className="mx-2">•</span>
              <span>{t.dashboard.trainingDays}: </span>
              <strong className="text-foreground">{profile.trainingDaysPerWeek}d/wk</strong>
            </div>

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

      {/* Daily Habits & Hydration Widget Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Hydration Tracker */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
              <Droplets className="h-4 w-4" />
              <span>{t.dashboard.hydration}</span>
            </div>
            <div className="text-xl font-black text-foreground mt-1">
              {todayWaterMl} <span className="text-xs text-muted-foreground">/ {profile.dailyWaterTargetMl} ml</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {Math.round((todayWaterMl / profile.dailyWaterTargetMl) * 100)}% {t.common.completed}
            </div>
          </div>

          <button
            id="btn-quick-add-water"
            onClick={handleAddQuickWater}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
            title="Log +250ml Water"
          >
            +250
          </button>
        </div>

        {/* Daily Protein Target */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <Flame className="h-4 w-4" />
            <span>{t.nutrition.proteinTarget}</span>
          </div>
          <div className="text-xl font-black text-foreground mt-1">
            {profile.dailyProteinTargetGrams} <span className="text-xs text-muted-foreground">g / day</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            ~{(profile.dailyProteinTargetGrams / profile.currentWeightKg).toFixed(1)}g per kg bodyweight
          </div>
        </div>

        {/* Total Completed Missions */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <Trophy className="h-4 w-4" />
            <span>{t.achievements.workoutsLogged}</span>
          </div>
          <div className="text-xl font-black text-foreground mt-1">
            {completedWorkoutsCount} <span className="text-xs text-muted-foreground">sessions</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            PPL consistency active
          </div>
        </div>

        {/* Cardio Minutes Logged */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400">
            <Activity className="h-4 w-4" />
            <span>{t.cardio.title}</span>
          </div>
          <div className="text-xl font-black text-foreground mt-1">
            {totalCardioMins} <span className="text-xs text-muted-foreground">minutes</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Zone 2 Fat-Oxidation
          </div>
        </div>
      </div>
    </div>
  );
};
