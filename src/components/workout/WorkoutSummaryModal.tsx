import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Flame,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  Clock,
  Dumbbell,
  TrendingUp,
  Zap,
  Sparkles,
  Droplets,
  Moon,
  Utensils,
  ChevronRight,
  X,
  Activity,
  Award,
  AlertCircle,
  Home,
  BarChart3,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { UserProfile, WorkoutSession } from '../../types';
import { AudioService } from '../../services/audioService';

interface WorkoutSummaryModalProps {
  workout: WorkoutSession;
  profile: UserProfile;
  history?: WorkoutSession[];
  isOpen: boolean;
  onClose: () => void;
  onResumeWorkout?: () => void;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  workout,
  profile,
  history = [],
  isOpen,
  onClose,
  onResumeWorkout,
}) => {
  const isAr = profile.language === 'ar';
  const [copied, setCopied] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<'volume' | 'calories' | 'sets'>('volume');

  // Launch victory fanfare and confetti on mount
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899'],
        });
        AudioService.playWorkoutEndCue(0.35);
      } catch (e) {
        // Safe fallback
      }
    }
  }, [isOpen]);

  // Compute key workout stats (completed vs planned sets, volume, etc.)
  const stats = useMemo(() => {
    let totalCompletedSets = 0;
    let totalPlannedSets = 0;
    let totalVolume = 0;
    let totalReps = 0;
    let completedExercisesCount = 0;
    let totalRpeSum = 0;
    let rpeCount = 0;

    const perExerciseData = workout.exercises.map((ex, idx) => {
      let exVol = 0;
      let exReps = 0;
      let exCompletedSets = 0;

      ex.sets.forEach((s) => {
        totalPlannedSets += 1;
        if (s.completed) {
          totalCompletedSets += 1;
          exCompletedSets += 1;
          const w = s.actualWeight || s.targetWeight || 0;
          const r = s.actualReps || (typeof s.targetReps === 'number' ? s.targetReps : parseInt(String(s.targetReps || 0), 10));
          exVol += w * r;
          exReps += r;
          totalVolume += w * r;
          totalReps += r;

          if (s.rpe) {
            totalRpeSum += s.rpe;
            rpeCount += 1;
          }
        }
      });

      if (exCompletedSets > 0) {
        completedExercisesCount += 1;
      }

      const shortName = isAr
        ? (ex.exerciseNameAr || ex.exerciseName).split(' ').slice(0, 2).join(' ')
        : ex.exerciseName.split(' ').slice(0, 2).join(' ');

      // Calorie estimate per exercise based on work volume and sets
      const exCalories = Math.round(exCompletedSets * 18 + (exVol * 0.012));

      return {
        id: ex.id || `ex-${idx}`,
        name: isAr ? (ex.exerciseNameAr || ex.exerciseName) : ex.exerciseName,
        shortName,
        volume: Math.round(exVol),
        reps: exReps,
        completedSets: exCompletedSets,
        targetSets: ex.sets.length,
        calories: exCalories,
      };
    });

    const completionRate = totalPlannedSets > 0 ? Math.round((totalCompletedSets / totalPlannedSets) * 100) : 100;
    const isFull = completionRate >= 95;
    const avgRpe = rpeCount > 0 ? (totalRpeSum / rpeCount).toFixed(1) : '8.0';

    // Calorie calculation: Weight-adjusted resistance metabolic equivalent (MET 6.5) + volume bonus + EPOC
    const userWeight = profile.weightKg || 104;
    const durationMin = Math.max(12, workout.durationMinutes || 45);
    // Base active burn = MET * weight * (min / 60)
    const baseActiveKcal = Math.round(6.5 * userWeight * (durationMin / 60));
    const volumeBonusKcal = Math.round(totalVolume * 0.014);
    const activeCalories = Math.max(180, Math.round(baseActiveKcal * 0.65 + volumeBonusKcal));
    const epocAfterburn = Math.round(activeCalories * 0.22); // 22% EPOC over 24-48 hours
    const totalCaloriesBurned = activeCalories + epocAfterburn;
    const fatGramsBurned = (totalCaloriesBurned * 0.45 / 9).toFixed(1); // 45% fat oxidation in resistance training

    return {
      totalCompletedSets,
      totalPlannedSets,
      completionRate,
      isFull,
      totalVolume: Math.round(totalVolume),
      totalVolumeTons: (totalVolume / 1000).toFixed(2),
      totalReps,
      completedExercisesCount,
      totalExercisesCount: workout.exercises.length,
      avgRpe,
      durationMin,
      activeCalories,
      epocAfterburn,
      totalCaloriesBurned,
      fatGramsBurned,
      perExerciseData,
    };
  }, [workout, profile, isAr]);

  // Next Workout Split & Recovery Tips Deduction
  const nextWorkoutInfo = useMemo(() => {
    const currentType = workout.type;
    let nextType = 'pull';
    let nextName = 'Pull (Back, Biceps & Rear Delts)';
    let nextNameAr = 'Pull - عضلات السحب (الظهر، البايسبس، والكتف الخلفي)';
    let targetedMusclesToday = isAr ? 'عضلات الدفع (الصدر، الكتف الأمامي، والترايسبس)' : 'Push Muscles (Chest, Shoulders & Triceps)';
    let nextFocusTip = isAr
      ? 'في التمرين القادم، ركز على سحب الأوزان بالمرفقين، وتثبيت لوحي الكتف لتحقيق أقصى تفعيل لعضلات الظهر العريضة Lats.'
      : 'In your next session, focus on elbow drive and scapular retraction for maximum lats recruitment.';

    if (currentType === 'pull') {
      nextType = 'legs';
      nextName = 'Legs & Core (Quads, Hamstrings & Calves)';
      nextNameAr = 'Legs - عضلات الأرجل والبطات وأسفل الظهر';
      targetedMusclesToday = isAr ? 'عضلات السحب (الظهر، البايسبس، والكتف الخلفي)' : 'Pull Muscles (Back, Biceps & Rear Delts)';
      nextFocusTip = isAr
        ? 'في التمرين القادم، ركز على النزول العميق في تمارين السكوات والضغط بالأكواع، وتدفئة الركبتين جيداً.'
        : 'Next session, focus on controlled depth on squats, knee warm-ups, and driving through mid-foot.';
    } else if (currentType === 'legs') {
      nextType = 'push';
      nextName = 'Push (Chest, Shoulders & Triceps)';
      nextNameAr = 'Push - عضلات الدفع (الصدر، الأكتاف، والترايسبس)';
      targetedMusclesToday = isAr ? 'عضلات الأرجل والأسفل' : 'Legs & Lower Body';
      nextFocusTip = isAr
        ? 'في التمرين القادم، ركز على العصر العضلي في أعلى نقطة والتحكم في المرحلة السلبية (3 ثوان نزول).'
        : 'Next session, emphasize the peak contraction and 3-second eccentric tempo on presses.';
    }

    // Protein requirement based on bodyweight: 0.35g/kg for immediate post-workout window
    const targetProteinGrams = Math.round(profile.weightKg * 0.38) || 35;
    const targetWaterMl = Math.round(stats.durationMin * 16) || 800;

    return {
      nextType,
      nextName,
      nextNameAr,
      targetedMusclesToday,
      nextFocusTip,
      targetProteinGrams,
      targetWaterMl,
    };
  }, [workout.type, isAr, profile.weightKg, stats.durationMin]);

  // Copy Summary text to clipboard
  const handleCopySummary = () => {
    const text = isAr
      ? `🏆 تقرير إنجاز التمرين - تطبيق EDDIEB FIT MISSION
التمرين: ${workout.nameAr || workout.name}
الحالة: ${stats.isFull ? 'إنجاز كامل بنسبة 100%' : `إنجاز جزئي ممتاز (${stats.completionRate}%)`}
🔥 إجمالي السعرات المحروقة: ${stats.totalCaloriesBurned} سعرة (نشط: ${stats.activeCalories} + حرق لاحق EPOC: ${stats.epocAfterburn})
⚖️ الحجم التدريبي المرفوع: ${stats.totalVolume.toLocaleString()} كجم (${stats.totalVolumeTons} طن)
⏱️ المدة: ${stats.durationMin} دقيقة
💪 المجموعات: ${stats.totalCompletedSets} من أصل ${stats.totalPlannedSets} مجموعة
🎯 متوسط الشدة RPE: ${stats.avgRpe} / 10
التمرين القادم: ${nextWorkoutInfo.nextNameAr}`
      : `🏆 Workout Completion Report - EDDIEB FIT MISSION
Workout: ${workout.name}
Status: ${stats.isFull ? '100% Complete' : `Partial Success (${stats.completionRate}%)`}
🔥 Calories Burned: ${stats.totalCaloriesBurned} kcal (Active: ${stats.activeCalories} + EPOC: ${stats.epocAfterburn})
⚖️ Total Volume: ${stats.totalVolume.toLocaleString()} kg (${stats.totalVolumeTons} tons)
⏱️ Duration: ${stats.durationMin} mins
💪 Sets Completed: ${stats.totalCompletedSets} / ${stats.totalPlannedSets} sets
🎯 Avg Intensity RPE: ${stats.avgRpe} / 10
Next Session: ${nextWorkoutInfo.nextName}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 overflow-y-auto backdrop-blur-md"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-3xl rounded-3xl border border-emerald-500/30 bg-card p-4 sm:p-7 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          {/* Top Decorative Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-emerald-500/25 via-primary/20 to-transparent blur-3xl pointer-events-none" />

          {/* Header Action Bar */}
          <div className="flex items-center justify-between border-b border-border/70 pb-3 sm:pb-4 relative z-10 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-md shadow-emerald-500/10">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    {isAr ? 'ملخص إنجاز التدريب' : 'Workout Completion Summary'}
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300 border border-emerald-500/30">
                    {stats.isFull
                      ? (isAr ? 'مكتمل 100%' : '100% Complete')
                      : (isAr ? `إنجاز جزئي (${stats.completionRate}%)` : `Partial (${stats.completionRate}%)`)}
                  </span>
                </div>
                <h2 className="text-base sm:text-xl font-black text-foreground">
                  {isAr ? (workout.nameAr || workout.name) : workout.name}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                id="btn-copy-workout-summary"
                onClick={handleCopySummary}
                className="flex items-center gap-1 rounded-xl border border-border bg-secondary/60 hover:bg-secondary text-foreground text-xs font-bold px-2.5 sm:px-3 py-1.5 transition-all shadow-sm"
                title={isAr ? 'نسخ ملخص النتائج' : 'Copy Summary'}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">{isAr ? 'تم النسخ' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="hidden sm:inline">{isAr ? 'نسخ النتائج' : 'Copy'}</span>
                  </>
                )}
              </button>

              <button
                id="btn-close-summary-modal"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Summary Body */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-1 sm:p-2 space-y-5 custom-scrollbar relative z-10 pt-3">
            {/* 1. Motivational Banner tailored to completion */}
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-black text-foreground">
                    {stats.isFull
                      ? (isAr ? 'أحسنت يا بطل! أتممت تمرين اليوم باحترافية كاملة 💪' : 'Outstanding work! 100% full workout accomplished 💪')
                      : (isAr ? 'خطوة جبارة للأمام! الاستمرارية هي سر التطور ⚡' : 'Great discipline! Consistency builds champions ⚡')}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {stats.isFull
                      ? (isAr
                        ? `لقد أتممت ${stats.totalCompletedSets} مجموعة بحجم إجمالي ${stats.totalVolume.toLocaleString()} كجم. هذا التحميل التدريجي يرسل إشارات نمو عضلية قوية ويحفز الاستقلاب طوال اليوم.`
                        : `أنجزت ${stats.totalCompletedSets} من أصل ${stats.totalPlannedSets} مجموعة (${stats.completionRate}%). حتى في التمرين الجزئي، كل تكرار رفعته حرق سعرات وحافظ على الكتلة العضلية ومنع فقدان القوة!`)
                      : `You completed ${stats.totalCompletedSets} sets with ${stats.totalVolume.toLocaleString()} kg total volume. Every set preserves lean tissue, fires up metabolism, and drives fat loss.`}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Key Positive Metrics Grid (Calories, Volume, Sets, Intensity) */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>{isAr ? 'النتائج الإيجابية وحرق السعرات' : 'Positive Results & Calories Burned'}</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {/* Total Calories Burned */}
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5 shadow-sm space-y-1 relative overflow-hidden">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
                    <span>{isAr ? 'السعرات المحروقة' : 'Calories Burned'}</span>
                    <Flame className="h-4 w-4" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-foreground font-mono">
                    {stats.totalCaloriesBurned}
                    <span className="text-xs font-bold text-muted-foreground ms-1">{isAr ? 'سعرة' : 'kcal'}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    <span>{isAr ? `نشط: ${stats.activeCalories} + بعد التمرين: ${stats.epocAfterburn}` : `Active: ${stats.activeCalories} + EPOC: ${stats.epocAfterburn}`}</span>
                  </div>
                </div>

                {/* Total Volume Lifted */}
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3.5 shadow-sm space-y-1 relative overflow-hidden">
                  <div className="flex items-center justify-between text-[11px] font-bold text-primary">
                    <span>{isAr ? 'الحجم الإجمالي' : 'Total Volume'}</span>
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-foreground font-mono">
                    {stats.totalVolumeTons}
                    <span className="text-xs font-bold text-muted-foreground ms-1">{isAr ? 'طن' : 'tons'}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    <span>{stats.totalVolume.toLocaleString()} {isAr ? 'كجم حديد مرفوع' : 'kg lifted'}</span>
                  </div>
                </div>

                {/* Completed Sets */}
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                    <span>{isAr ? 'المجموعات والتكرارات' : 'Sets & Reps'}</span>
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-foreground font-mono">
                    {stats.totalCompletedSets}/{stats.totalPlannedSets}
                    <span className="text-xs font-bold text-muted-foreground ms-1">{isAr ? 'مجموعة' : 'sets'}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    <span>{stats.totalReps} {isAr ? 'تكرار صحيح' : 'reps executed'}</span>
                  </div>
                </div>

                {/* Intensity & Fat Loss Impact */}
                <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-3.5 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-sky-400">
                    <span>{isAr ? 'الشدة والدهون' : 'Intensity & Fat'}</span>
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-foreground font-mono">
                    ~{stats.fatGramsBurned}
                    <span className="text-xs font-bold text-muted-foreground ms-1">{isAr ? 'جم دهون' : 'g fat'}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    <span>{isAr ? `متوسط RPE: ${stats.avgRpe}/10` : `Avg RPE: ${stats.avgRpe}/10`}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Interactive Results Chart (Recharts) */}
            <div className="rounded-2xl border border-border bg-secondary/20 p-4 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <h4 className="text-xs sm:text-sm font-black text-foreground">
                    {isAr ? 'الرسم البياني لتفاصيل التمرين' : 'Workout Performance Breakdown Chart'}
                  </h4>
                </div>

                {/* Chart Mode Tabs */}
                <div className="flex items-center rounded-xl border border-border bg-card p-1 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveChartTab('volume')}
                    className={`rounded-lg px-2.5 py-1 transition-all ${
                      activeChartTab === 'volume'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isAr ? 'حجم الأوزان (كجم)' : 'Volume (kg)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveChartTab('calories')}
                    className={`rounded-lg px-2.5 py-1 transition-all ${
                      activeChartTab === 'calories'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isAr ? 'حرق السعرات' : 'Calories'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveChartTab('sets')}
                    className={`rounded-lg px-2.5 py-1 transition-all ${
                      activeChartTab === 'sets'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isAr ? 'المجموعات' : 'Sets'}
                  </button>
                </div>
              </div>

              {/* Chart Visual Stage */}
              <div className="h-56 sm:h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {activeChartTab === 'volume' ? (
                    <BarChart data={stats.perExerciseData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                      <XAxis
                        dataKey="shortName"
                        stroke="var(--muted-foreground)"
                        fontSize={10}
                        tickLine={false}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: 'var(--foreground)',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                        }}
                        formatter={(val: any) => [`${Number(val).toLocaleString()} ${isAr ? 'كجم' : 'kg'}`, isAr ? 'الحجم المرفوع' : 'Volume']}
                        labelFormatter={(label: any) => `${label}`}
                      />
                      <Bar dataKey="volume" radius={[8, 8, 0, 0]}>
                        {stats.perExerciseData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index % 2 === 0 ? 'var(--primary)' : '#10b981'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : activeChartTab === 'calories' ? (
                    <AreaChart data={stats.perExerciseData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                      <defs>
                        <linearGradient id="calGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                      <XAxis
                        dataKey="shortName"
                        stroke="var(--muted-foreground)"
                        fontSize={10}
                        tickLine={false}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: 'var(--foreground)',
                        }}
                        formatter={(val: any) => [`${val} ${isAr ? 'سعرة' : 'kcal'}`, isAr ? 'السعرات التقديرية' : 'Estimated Burn']}
                      />
                      <Area
                        type="monotone"
                        dataKey="calories"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#calGradient)"
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={stats.perExerciseData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                      <XAxis
                        dataKey="shortName"
                        stroke="var(--muted-foreground)"
                        fontSize={10}
                        tickLine={false}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: 'var(--foreground)',
                        }}
                        formatter={(val: any, name: any) => [
                          `${val} ${isAr ? 'مجموعات' : 'sets'}`,
                          name === 'completedSets' ? (isAr ? 'المنجزة' : 'Completed') : (isAr ? 'المخططة' : 'Target'),
                        ]}
                      />
                      <Bar dataKey="completedSets" fill="#10b981" radius={[6, 6, 0, 0]} name="completedSets" />
                      <Bar dataKey="targetSets" fill="var(--muted-foreground)" opacity={0.3} radius={[6, 6, 0, 0]} name="targetSets" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Actionable Tips for Next Workout & Recovery Guidance */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span>{isAr ? 'نصائح للاستشفاء والتمرين القادم' : 'Recovery & Next Workout Advice'}</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Immediate Recovery Window (Nutrition & Hydration) */}
                <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-black text-foreground">
                    <Utensils className="h-4 w-4 text-emerald-400" />
                    <span>{isAr ? 'التغذية والاستشفاء الفوري' : 'Post-Workout Nutrition'}</span>
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                        1
                      </div>
                      <div>
                        <span className="font-bold text-foreground">
                          {isAr ? `بروتين: ${nextWorkoutInfo.targetProteinGrams} جم` : `Protein: ${nextWorkoutInfo.targetProteinGrams}g`}
                        </span>
                        <p className="text-[11px] mt-0.5 leading-normal">
                          {isAr
                            ? 'تناول وجبة غنية بالبروتين (صدر دجاج، بيض، أو واي بروتين) لتفعيل مسار mTOR وتخليق البروتين العضلي.'
                            : 'Consume a high-protein meal or shake to initiate muscle protein synthesis and repair.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400 font-bold text-[10px]">
                        2
                      </div>
                      <div>
                        <span className="font-bold text-foreground">
                          {isAr ? `تعويض السوائل: ${nextWorkoutInfo.targetWaterMl} مل` : `Hydration: ${nextWorkoutInfo.targetWaterMl} ml`}
                        </span>
                        <p className="text-[11px] mt-0.5 leading-normal">
                          {isAr
                            ? 'اشرب الماء مع رشة بسيطة من ملح الهيمالايا لتعويض الإلكتروليتات وتجنب تقلصات العضلات.'
                            : 'Drink water with electrolytes to restore plasma volume and prevent muscle cramps.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 font-bold text-[10px]">
                        3
                      </div>
                      <div>
                        <span className="font-bold text-foreground">
                          {isAr ? 'النوم العميق (7.5 - 8.5 ساعات)' : 'Deep Sleep (7.5 - 8.5h)'}
                        </span>
                        <p className="text-[11px] mt-0.5 leading-normal">
                          {isAr
                            ? 'معظم هرمون النمو وإصلاح الألياف يتم أثناء النوم العميق الليلة، احرص على غرفة باردة ومظلمة.'
                            : 'Most growth hormone release occurs during deep sleep. Keep your room dark and cool.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Workout Split Strategy */}
                <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-black text-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{isAr ? 'خطة تمرينك القادم في الجدول' : 'Next Scheduled Workout'}</span>
                  </div>

                  <div className="rounded-xl border border-primary/25 bg-primary/10 p-3 space-y-1">
                    <div className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      {isAr ? 'الجلسة القادمة الموصى بها' : 'Next Session'}
                    </div>
                    <div className="text-sm font-black text-foreground">
                      {isAr ? nextWorkoutInfo.nextNameAr : nextWorkoutInfo.nextName}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 text-foreground font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{isAr ? 'الاستشفاء العضلي:' : 'Muscle Recovery:'}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {isAr
                        ? `عضلات ${nextWorkoutInfo.targetedMusclesToday} التي تمرنت عليها اليوم تحتاج 48 - 72 ساعة استشفاء كاملة لتنمو. اتركها ترتاح وتجهز للتركيز غداً على العضلات المقابلة.`
                        : `The muscles trained today need 48-72 hours to fully regenerate and grow stronger.`}
                    </p>

                    <div className="pt-1 text-[11px] text-primary font-medium">
                      💡 {nextWorkoutInfo.nextFocusTip}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="mt-4 pt-3 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-2.5 relative z-10 shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onResumeWorkout && !stats.isFull && (
                <button
                  id="btn-resume-workout-from-summary"
                  onClick={() => {
                    onClose();
                    onResumeWorkout();
                  }}
                  className="flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/60 hover:bg-secondary px-3.5 py-2.5 text-xs font-bold text-foreground transition-all"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>{isAr ? 'استئناف التمرين' : 'Resume Workout'}</span>
                </button>
              )}

              <button
                id="btn-share-summary-card"
                onClick={handleCopySummary}
                className="flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2.5 text-xs font-bold text-emerald-400 transition-all"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>{isAr ? 'مشاركة الإنجاز' : 'Share Achievement'}</span>
              </button>
            </div>

            <button
              id="btn-finish-and-go-home"
              onClick={onClose}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 text-xs sm:text-sm font-black shadow-lg shadow-primary/25 transition-all active:scale-95"
            >
              <Home className="h-4 w-4" />
              <span>{isAr ? 'تم بنجاح • العودة للرئيسية' : 'Done • Back to Dashboard'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
