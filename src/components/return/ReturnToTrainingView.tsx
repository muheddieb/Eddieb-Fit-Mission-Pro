import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Flame, 
  ShieldCheck, 
  Activity, 
  HeartPulse, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  ChevronDown, 
  Info, 
  ArrowRight, 
  Zap, 
  Smile, 
  Meh, 
  Frown, 
  Moon, 
  HelpCircle, 
  RefreshCw, 
  TrendingUp, 
  Layers, 
  Youtube, 
  Check, 
  Sliders,
  Award,
  Clock,
  Dumbbell
} from 'lucide-react';
import { 
  UserProfile, 
  WorkoutSession, 
  SleepLog, 
  InterruptionAnalysis, 
  ReturnWorkoutPlan, 
  ReturnExerciseItem, 
  PreReturnCheckin, 
  PostReturnFeedback,
  ReturnTrainingState 
} from '../../types';
import { translations } from '../../i18n/translations';
import { ReturnToTrainingEngine } from '../../services/returnToTrainingEngine';

interface ReturnToTrainingViewProps {
  profile: UserProfile;
  history: WorkoutSession[];
  sleepLogs?: SleepLog[];
  onStartReturnWorkout: (session: WorkoutSession) => void;
  onResumeStandardProgram: () => void;
  onNavigateToSection?: (section: any) => void;
  onNavigate?: (section: any) => void;
}

export const ReturnToTrainingView: React.FC<ReturnToTrainingViewProps> = ({
  profile,
  history,
  sleepLogs,
  onStartReturnWorkout,
  onResumeStandardProgram,
  onNavigateToSection,
  onNavigate,
}) => {
  const t = translations[profile.language];
  const tr = t.returnToTraining;
  const isAr = profile.language === 'ar';

  // Analysis & Plan State
  const [analysis, setAnalysis] = useState<InterruptionAnalysis>(() => 
    ReturnToTrainingEngine.analyzeInterruption(history, profile, sleepLogs)
  );
  
  const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(1);
  const [preCheckin, setPreCheckin] = useState<PreReturnCheckin | null>(null);
  const [activePlan, setActivePlan] = useState<ReturnWorkoutPlan>(() => 
    ReturnToTrainingEngine.generateReturnPlan(
      ReturnToTrainingEngine.analyzeInterruption(history, profile, sleepLogs),
      profile,
      history,
      1
    )
  );

  // Pre-checkin Form State
  const [feeling, setFeeling] = useState<'great' | 'good' | 'normal' | 'tired' | 'very_tired'>('good');
  const [painLevel, setPainLevel] = useState<'none' | 'mild' | 'pain'>('none');
  const [painArea, setPainArea] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState<number>(7);
  const [sleepQuality, setSleepQuality] = useState<number>(8);
  const [checkinSaved, setCheckinSaved] = useState<boolean>(false);
  const [showCheckinDrawer, setShowCheckinDrawer] = useState<boolean>(false);

  // Post-workout Feedback Modal State
  const [showPostModal, setShowPostModal] = useState<boolean>(false);
  const [postFeedback, setPostFeedback] = useState<Partial<PostReturnFeedback>>({
    energyRating: 4,
    fatigueRating: 2,
    muscleSoreness: 'mild',
    difficultyRating: 'just_right',
    sessionRpe: 6.5,
    completedAllExercises: true,
    experiencedShortnessOfBreath: false,
    experiencedPain: false,
    painDetails: '',
  });
  const [postResult, setPostResult] = useState<PostReturnFeedback | null>(null);

  // Expanded Stage Accordions
  const [expandedStages, setExpandedStages] = useState<{ [key: string]: boolean }>({
    warmup: true,
    mobility: true,
    activation: true,
    lightStrength: true,
    cooldown: false,
  });

  // Selected Alternative Swap Modal/Drawer
  const [swappingExercise, setSwappingExercise] = useState<ReturnExerciseItem | null>(null);

  // Recalculate analysis on props change
  useEffect(() => {
    const freshAnalysis = ReturnToTrainingEngine.analyzeInterruption(history, profile, sleepLogs);
    setAnalysis(freshAnalysis);
    const freshPlan = ReturnToTrainingEngine.generateReturnPlan(freshAnalysis, profile, history, currentSessionIndex, preCheckin || undefined);
    setActivePlan(freshPlan);
  }, [history, profile, sleepLogs, currentSessionIndex]);

  const toggleStage = (stageKey: string) => {
    setExpandedStages(prev => ({ ...prev, [stageKey]: !prev[stageKey] }));
  };

  const handleApplyPreCheckin = () => {
    const checkinData: PreReturnCheckin = {
      feeling,
      painLevel,
      painArea: painLevel !== 'none' ? painArea : undefined,
      energyLevel,
      sleepQuality,
      timestamp: Date.now(),
    };
    setPreCheckin(checkinData);
    setCheckinSaved(true);

    const updatedPlan = ReturnToTrainingEngine.generateReturnPlan(
      analysis,
      profile,
      history,
      currentSessionIndex,
      checkinData
    );
    setActivePlan(updatedPlan);

    setTimeout(() => {
      setCheckinSaved(false);
      setShowCheckinDrawer(false);
    }, 1200);
  };

  const handleLaunchWorkout = () => {
    const session = ReturnToTrainingEngine.convertToWorkoutSession(activePlan, profile);
    onStartReturnWorkout(session);
  };

  const handleSubmitPostFeedback = () => {
    const evaluated = ReturnToTrainingEngine.evaluatePostWorkoutFeedback(
      postFeedback,
      analysis,
      activePlan
    );
    setPostResult(evaluated);

    // Save state
    const currentState = ReturnToTrainingEngine.getReturnTrainingState() || {
      isInReturnMode: true,
      analysis,
      activePlan,
      completedSessionsCount: 0,
      targetSessionsCount: analysis.totalReturnSessionsNeeded,
      preCheckinHistory: [],
      postFeedbackHistory: [],
      userDismissed: false,
    };

    currentState.completedSessionsCount += 1;
    currentState.postFeedbackHistory.push(evaluated);
    ReturnToTrainingEngine.saveReturnTrainingState(currentState);
  };

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 65) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const getReadinessBarGradient = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-teal-400';
    if (score >= 65) return 'from-amber-500 to-orange-400';
    return 'from-rose-500 to-orange-500';
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 border border-neutral-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <RotateCcw className="w-3.5 h-3.5 animate-spin-slow" />
                {isAr ? analysis.levelLabelAr : analysis.levelLabel}
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getReadinessColor(analysis.currentReadinessScore)}`}>
                <Activity className="w-3.5 h-3.5" />
                {isAr ? analysis.readinessLabelAr : analysis.readinessLabel} ({analysis.currentReadinessScore}%)
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              {tr.title}
            </h1>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              {isAr ? analysis.reasonTextAr : analysis.reasonText}
            </p>
          </div>

          {/* Quick Metrics Badge Card */}
          <div className="flex flex-row md:flex-col items-center justify-around md:justify-center p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80 backdrop-blur-sm min-w-[200px] gap-4">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-amber-400">
                {analysis.daysSinceLastWorkout}
              </div>
              <div className="text-xs text-neutral-400 font-medium">
                {tr.daysSince}
              </div>
            </div>
            <div className="h-8 w-[1px] md:h-[1px] md:w-full bg-neutral-800" />
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                {Math.round(analysis.recommendedLoadFactor * 100)}%
              </div>
              <div className="text-xs text-neutral-400 font-medium">
                {tr.suggestedWeight}
              </div>
            </div>
          </div>
        </div>

        {/* Readiness Gauge Progress Line */}
        <div className="mt-6 pt-5 border-t border-neutral-800/80">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-emerald-400" />
              {tr.currentReadiness}
            </span>
            <span className="font-mono font-bold text-white">
              {analysis.currentReadinessScore} / 100
            </span>
          </div>
          <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 p-0.5">
            <div 
              className={`h-full rounded-full bg-gradient-to-r ${getReadinessBarGradient(analysis.currentReadinessScore)} transition-all duration-1000`}
              style={{ width: `${Math.min(100, Math.max(10, analysis.currentReadinessScore))}%` }}
            />
          </div>
        </div>

        {/* Reassurance Notice */}
        <div className="mt-4 flex items-start gap-2.5 p-3 rounded-lg bg-neutral-950/60 border border-neutral-800/60 text-xs text-neutral-300">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{tr.noHistoryResetNote}</span>
        </div>
      </div>

      {/* Multi-Session Progress Steps (If Level >= 3 or totalSessions > 1) */}
      {analysis.totalReturnSessionsNeeded > 1 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              {tr.returnProgress}
            </h3>
            <span className="text-xs font-mono text-neutral-400">
              {isAr ? `الجلسة ${currentSessionIndex} من ${analysis.totalReturnSessionsNeeded}` : `Session ${currentSessionIndex} of ${analysis.totalReturnSessionsNeeded}`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setCurrentSessionIndex(1)}
              className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                currentSessionIndex === 1 
                  ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-md' 
                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="space-y-1">
                <div className="text-xs font-bold text-amber-400 uppercase">
                  {isAr ? 'اليوم 1' : 'Day 1'}
                </div>
                <div className="text-sm font-semibold text-neutral-200">
                  {isAr ? 'إعادة التنشيط والحركية' : 'Re-Activation & Mobility'}
                </div>
                <div className="text-xs text-neutral-400">
                  {isAr ? 'تليين المفاصل وتنشيط العضلات' : 'Joint lubrication & deep activation'}
                </div>
              </div>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                currentSessionIndex === 1 ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
              }`}>
                1
              </div>
            </button>

            <button
              onClick={() => setCurrentSessionIndex(2)}
              className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                currentSessionIndex === 2 
                  ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-md' 
                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="space-y-1">
                <div className="text-xs font-bold text-amber-400 uppercase">
                  {isAr ? 'اليوم 2' : 'Day 2'}
                </div>
                <div className="text-sm font-semibold text-neutral-200">
                  {isAr ? 'تقييم الجاهزية والجسر التدريبي' : 'Readiness Bridge & Compounds'}
                </div>
                <div className="text-xs text-neutral-400">
                  {isAr ? 'حركات مركبة خفيفة قبل العودة للـPPL' : 'Calibrated compound testing'}
                </div>
              </div>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                currentSessionIndex === 2 ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
              }`}>
                2
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Pre-Workout Readiness Check-in Accordion */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
        <button
          onClick={() => setShowCheckinDrawer(prev => !prev)}
          className="w-full p-4 md:p-5 flex items-center justify-between bg-neutral-900 hover:bg-neutral-850 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {tr.preCheckinTitle}
                {preCheckin && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {tr.checkinApplied}
                  </span>
                )}
              </h3>
              <p className="text-xs text-neutral-400">
                {tr.preCheckinSubtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-neutral-400">
            {showCheckinDrawer ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
        </button>

        {showCheckinDrawer && (
          <div className="p-5 border-t border-neutral-800 bg-neutral-950/70 space-y-5">
            {/* Feelings Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wide">
                {tr.howFeelToday}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { key: 'great', label: tr.feelingGreat, icon: Smile, color: 'hover:border-emerald-500' },
                  { key: 'good', label: tr.feelingGood, icon: Smile, color: 'hover:border-teal-500' },
                  { key: 'normal', label: tr.feelingNormal, icon: Meh, color: 'hover:border-blue-500' },
                  { key: 'tired', label: tr.feelingTired, icon: Frown, color: 'hover:border-amber-500' },
                  { key: 'very_tired', label: tr.feelingVeryTired, icon: Moon, color: 'hover:border-rose-500' },
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFeeling(item.key as any)}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      feeling === item.key
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                        : `bg-neutral-900 border-neutral-800 text-neutral-400 ${item.color}`
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pain / Discomfort Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wide">
                {tr.anyPain}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { key: 'none', label: tr.noPain },
                  { key: 'mild', label: tr.mildDiscomfort },
                  { key: 'pain', label: tr.pain },
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setPainLevel(item.key as any)}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-medium text-center transition-all ${
                      painLevel === item.key
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {painLevel !== 'none' && (
                <div className="pt-2">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'Lower Back', labelAr: 'أسفل الظهر' },
                      { key: 'Shoulder', labelAr: 'الكتف' },
                      { key: 'Knee', labelAr: 'الركبة' },
                      { key: 'Elbow', labelAr: 'الكوع' },
                      { key: 'Neck', labelAr: 'الرقبة' },
                      { key: 'Hip', labelAr: 'الحوض / الهانش' },
                    ].map(area => (
                      <button
                        key={area.key}
                        type="button"
                        onClick={() => setPainArea(area.key)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                          painArea === area.key
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        {isAr ? area.labelAr : area.key}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sliders: Energy & Sleep */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-neutral-300">{tr.energyLevel}</span>
                  <span className="font-mono font-bold text-amber-400">{energyLevel} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energyLevel}
                  onChange={e => setEnergyLevel(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-neutral-300">{tr.sleepQuality}</span>
                  <span className="font-mono font-bold text-blue-400">{sleepQuality} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sleepQuality}
                  onChange={e => setSleepQuality(Number(e.target.value))}
                  className="w-full accent-blue-500 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Apply Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleApplyPreCheckin}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                {checkinSaved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                {checkinSaved ? tr.checkinApplied : tr.applyCheckin}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Plan Overview Header & Actions */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              {tr.sessionOverview}
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              {isAr ? activePlan.titleAr : activePlan.title}
            </h2>
            <p className="text-xs md:text-sm text-neutral-400 mt-1">
              {isAr ? activePlan.primaryGoalAr : activePlan.primaryGoal}
            </p>
          </div>

          {/* Key Stats Pill Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-center">
              <div className="text-xs text-neutral-400">{tr.duration}</div>
              <div className="text-sm font-bold text-white font-mono flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                ~{activePlan.estimatedDurationMinutes} {t.common.minutes}
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-center">
              <div className="text-xs text-neutral-400">{tr.targetRpe}</div>
              <div className="text-sm font-bold text-amber-400 font-mono">
                RPE {activePlan.targetRpeRange}
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-center">
              <div className="text-xs text-neutral-400">{tr.exercises}</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">
                {activePlan.totalExercisesCount}
              </div>
            </div>
          </div>
        </div>

        {/* Adaptive Dynamic Note if any */}
        {(activePlan.adaptiveNote || activePlan.adaptiveNoteAr) && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">{isAr ? 'تعديل ذكي مخصص:' : 'AI Dynamic Calibration:'} </span>
              {isAr ? activePlan.adaptiveNoteAr : activePlan.adaptiveNote}
            </div>
          </div>
        )}

        {/* Launch Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <button
            onClick={handleLaunchWorkout}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
          >
            <Play className="w-5 h-5 fill-neutral-950" />
            {tr.startReturnWorkout}
          </button>

          <button
            onClick={() => setShowPostModal(true)}
            className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-bold text-sm border border-neutral-700 flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {tr.postCheckinTitle}
          </button>

          <button
            onClick={onResumeStandardProgram}
            className="w-full sm:w-auto py-3.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 font-medium text-xs border border-neutral-800 transition-colors"
          >
            {tr.resumeCarefully}
          </button>
        </div>
      </div>

      {/* Multi-Stage Exercises Breakdown (A to E) */}
      <div className="space-y-4">
        {/* PHASE A: General Warm-up */}
        <StageSection
          stageKey="warmup"
          title={tr.phaseA}
          subtitle={isAr ? 'رفع حرارة الجسم وتنشيط الدورة الدموية' : 'Core temperature elevation & dynamic blood flow'}
          icon={Flame}
          iconColor="text-orange-400"
          exercises={activePlan.stages.warmup}
          expanded={expandedStages.warmup}
          onToggle={() => toggleStage('warmup')}
          profile={profile}
          t={t}
          tr={tr}
          isAr={isAr}
        />

        {/* PHASE B: Joint Mobility */}
        <StageSection
          stageKey="mobility"
          title={tr.phaseB}
          subtitle={isAr ? 'تليين المفاصل (الفقرات الصدرية، الحوض، الكاحل)' : 'Targeted joint capsule & tissue lubrication'}
          icon={Activity}
          iconColor="text-blue-400"
          exercises={activePlan.stages.mobility}
          expanded={expandedStages.mobility}
          onToggle={() => toggleStage('mobility')}
          profile={profile}
          t={t}
          tr={tr}
          isAr={isAr}
        />

        {/* PHASE C: Muscle Activation */}
        <StageSection
          stageKey="activation"
          title={tr.phaseC}
          subtitle={isAr ? 'تنشيط الجلوتس والكور ولوحي الكتف' : 'Glute, core & scapular motor unit priming'}
          icon={Zap}
          iconColor="text-amber-400"
          exercises={activePlan.stages.activation}
          expanded={expandedStages.activation}
          onToggle={() => toggleStage('activation')}
          profile={profile}
          t={t}
          tr={tr}
          isAr={isAr}
        />

        {/* PHASE D: Light Reconditioning Strength */}
        <StageSection
          stageKey="lightStrength"
          title={tr.phaseD}
          subtitle={isAr ? 'حركات مركبة خفيفة مع أوزان مخفضة ومحسوبة' : 'Movement quality focus at reduced calibrated loads'}
          icon={Dumbbell}
          iconColor="text-emerald-400"
          exercises={activePlan.stages.lightStrength}
          expanded={expandedStages.lightStrength}
          onToggle={() => toggleStage('lightStrength')}
          profile={profile}
          t={t}
          tr={tr}
          isAr={isAr}
          isStrength
        />

        {/* PHASE E: Cool-down & Recovery */}
        <StageSection
          stageKey="cooldown"
          title={tr.phaseE}
          subtitle={isAr ? 'التنفس الحجابي المهدئ واستطالة الألياف' : 'Diaphragmatic breathing & parasympathetic reset'}
          icon={HeartPulse}
          iconColor="text-teal-400"
          exercises={activePlan.stages.cooldown}
          expanded={expandedStages.cooldown}
          onToggle={() => toggleStage('cooldown')}
          profile={profile}
          t={t}
          tr={tr}
          isAr={isAr}
        />
      </div>

      {/* AI Coach Integration Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-neutral-900 to-neutral-900 border border-blue-900/40 rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">
              {tr.learnMoreCoach}
            </h4>
            <p className="text-xs text-neutral-400">
              {isAr
                ? 'تحدث مع مدربك الذكي لمعرفة المزيد عن فترات الراحة، أوزان العودة، وتغذية مرحلة الاستشفاء.'
                : 'Discuss progressive overload ramp-up, nutrition adjustments, and DOMS prevention with your AI Sports Coach.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => (onNavigateToSection || onNavigate)?.('aiCoach')}
          className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shrink-0"
        >
          <span>{t.nav.aiCoach}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Post-Workout Assessment & Decision Engine Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  {tr.postCheckinTitle}
                </h3>
                <p className="text-xs text-neutral-400">
                  {tr.postCheckinSubtitle}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPostModal(false);
                  setPostResult(null);
                }}
                className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {!postResult ? (
              <div className="space-y-4">
                {/* Energy Level */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 uppercase">
                    {tr.howWasEnergy} ({postFeedback.energyRating || 4}/5)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPostFeedback(prev => ({ ...prev, energyRating: val }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                          postFeedback.energyRating === val
                            ? 'bg-amber-500 text-neutral-950 border-amber-500'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fatigue Rating */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 uppercase">
                    {tr.howWasFatigue} ({postFeedback.fatigueRating || 2}/5)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPostFeedback(prev => ({ ...prev, fatigueRating: val }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                          postFeedback.fatigueRating === val
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Muscle Soreness */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 uppercase">
                    {tr.muscleSoreness}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: 'none', label: isAr ? 'لا يوجد' : 'None' },
                      { key: 'mild', label: isAr ? 'خفيف' : 'Mild' },
                      { key: 'moderate', label: isAr ? 'متوسط' : 'Moderate' },
                      { key: 'severe', label: isAr ? 'شديد' : 'Severe' },
                    ].map(item => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setPostFeedback(prev => ({ ...prev, muscleSoreness: item.key as any }))}
                        className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                          postFeedback.muscleSoreness === item.key
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Session RPE */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-neutral-300 uppercase">{tr.sessionRpeScore}</span>
                    <span className="font-mono font-bold text-amber-400">RPE {postFeedback.sessionRpe || 6.5}</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="10"
                    step="0.5"
                    value={postFeedback.sessionRpe || 6.5}
                    onChange={e => setPostFeedback(prev => ({ ...prev, sessionRpe: Number(e.target.value) }))}
                    className="w-full accent-amber-500 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Pain Checkbox */}
                <div className="pt-1">
                  <label className="flex items-center gap-2.5 p-3 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={postFeedback.experiencedPain || false}
                      onChange={e => setPostFeedback(prev => ({ ...prev, experiencedPain: e.target.checked }))}
                      className="rounded accent-rose-500 w-4 h-4"
                    />
                    <span className="text-xs text-neutral-300 font-medium">
                      {isAr ? 'هل شعرت بأي ألم حاد أو انزعاج مفصلي يستدعي الحذر؟' : 'Did you feel any sharp pain or joint ache?'}
                    </span>
                  </label>

                  {postFeedback.experiencedPain && (
                    <input
                      type="text"
                      placeholder={isAr ? 'اذكر المفصل أو العضلة المتأثرة...' : 'Specify affected joint or muscle...'}
                      value={postFeedback.painDetails || ''}
                      onChange={e => setPostFeedback(prev => ({ ...prev, painDetails: e.target.value }))}
                      className="mt-2 w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-rose-500/50 text-white placeholder-neutral-500"
                    />
                  )}
                </div>

                {/* Submit Feedback */}
                <button
                  type="button"
                  onClick={handleSubmitPostFeedback}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm shadow-md transition-colors mt-2"
                >
                  {tr.submitFeedback}
                </button>
              </div>
            ) : (
              /* AI Decision Output */
              <div className="space-y-4 text-center py-2">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                  postResult.aiDecision === 'ready_to_resume'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : postResult.aiDecision === 'medical_consultation_advised'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}>
                  {postResult.aiDecision === 'ready_to_resume' ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : postResult.aiDecision === 'medical_consultation_advised' ? (
                    <AlertTriangle className="w-8 h-8" />
                  ) : (
                    <Activity className="w-8 h-8" />
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl font-black text-white">
                    {postResult.aiDecision === 'ready_to_resume'
                      ? tr.decisionReady
                      : postResult.aiDecision === 'take_extra_recovery'
                      ? tr.decisionExtra
                      : postResult.aiDecision === 'medical_consultation_advised'
                      ? tr.decisionMedical
                      : tr.decisionExtend}
                  </h4>
                  <p className="text-xs md:text-sm text-neutral-300 max-w-md mx-auto leading-relaxed pt-1">
                    {isAr ? postResult.aiDecisionTextAr : postResult.aiDecisionText}
                  </p>
                </div>

                <div className="pt-4 flex flex-col gap-2.5">
                  {postResult.aiDecision === 'ready_to_resume' && (
                    <button
                      onClick={() => {
                        setShowPostModal(false);
                        onResumeStandardProgram();
                      }}
                      className="w-full py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm transition-colors shadow-md"
                    >
                      {tr.resumeStandardTraining}
                    </button>
                  )}

                  {postResult.aiDecision === 'extend_reconditioning' && (
                    <button
                      onClick={() => {
                        setCurrentSessionIndex(2);
                        setShowPostModal(false);
                      }}
                      className="w-full py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-colors"
                    >
                      {isAr ? 'الانتقال إلى الجلسة 2 غداً' : 'Advance to Session 2'}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowPostModal(false);
                      setPostResult(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs"
                  >
                    {t.common.close}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface StageSectionProps {
  stageKey: string;
  title: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  exercises: ReturnExerciseItem[];
  expanded: boolean;
  onToggle: () => void;
  profile: UserProfile;
  t: any;
  tr: any;
  isAr: boolean;
  isStrength?: boolean;
}

const StageSection: React.FC<StageSectionProps> = ({
  stageKey,
  title,
  subtitle,
  icon: Icon,
  iconColor,
  exercises,
  expanded,
  onToggle,
  profile,
  t,
  tr,
  isAr,
  isStrength,
}) => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-md">
      <button
        onClick={onToggle}
        className="w-full p-4 md:p-5 flex items-center justify-between bg-neutral-900 hover:bg-neutral-850 transition-colors text-left"
      >
        <div className="flex items-center gap-3.5">
          <div className={`w-9 h-9 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-bold text-white">
                {title}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-950 text-neutral-400 border border-neutral-800 font-mono">
                {exercises.length} {exercises.length === 1 ? 'Exercise' : 'Exercises'}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="text-neutral-400">
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </div>
      </button>

      {expanded && (
        <div className="p-4 md:p-5 border-t border-neutral-800 bg-neutral-950/40 space-y-4">
          {exercises.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800/80 hover:border-neutral-700/80 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-300 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {isAr ? item.nameAr : item.name}
                    </h4>
                    <div className="text-[11px] text-amber-400 font-medium">
                      {isAr ? item.primaryMuscleAr || item.primaryMuscle : item.primaryMuscle}
                    </div>
                  </div>
                </div>

                {/* Target Metric Badges */}
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono">
                    {item.targetSets} {t.common.sets} × {item.targetReps}
                  </span>

                  {isStrength && item.suggestedWeightKg > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold font-mono">
                      {item.suggestedWeightKg} kg
                      {item.weightReductionPercent && item.weightReductionPercent > 0 && (
                        <span className="text-[10px] text-neutral-400 ml-1 font-normal">
                          (-{item.weightReductionPercent}%)
                        </span>
                      )}
                    </span>
                  )}

                  <span className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-amber-400 font-mono">
                    RPE {item.targetRpe}
                  </span>

                  {item.restSeconds > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 font-mono">
                      {item.restSeconds}s rest
                    </span>
                  )}
                </div>
              </div>

              {/* Instructions list */}
              {item.instructions && item.instructions.length > 0 && (
                <div className="space-y-1 text-xs text-neutral-300 pl-4 pr-4 border-l-2 border-amber-500/40 my-2">
                  {(isAr ? item.instructionsAr : item.instructions).map((ins, i) => (
                    <div key={i} className="leading-relaxed">
                      • {ins}
                    </div>
                  ))}
                </div>
              )}

              {/* Safety Note */}
              {(item.safetyNotes || item.safetyNotesAr) && (
                <div className="text-[11px] text-neutral-400 bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{isAr ? item.safetyNotesAr : item.safetyNotes}</span>
                </div>
              )}

              {/* Youtube search helper */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.name + ' form technique')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-red-400 transition-colors"
                >
                  <Youtube className="w-3.5 h-3.5 text-red-500" />
                  <span>{t.common.watchVideo}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
