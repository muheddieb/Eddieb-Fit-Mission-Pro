import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  Moon, 
  Brain, 
  Activity, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  RefreshCw, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  History,
  Dumbbell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DailyReadinessAssessment, 
  SleepQualityRating, 
  StressLevelRating, 
  MuscleSorenessRating, 
  UserProfile 
} from '../../types';
import { PPLEngine } from '../../services/pplEngine';
import { StorageService } from '../../services/storage';

interface DailyReadinessCardProps {
  profile: UserProfile;
  isAr: boolean;
  onReadinessUpdated?: (assessment: DailyReadinessAssessment) => void;
}

const MUSCLE_OPTIONS = [
  { id: 'chest', en: 'Chest', ar: 'الصدر' },
  { id: 'shoulders', en: 'Shoulders', ar: 'الأكتاف' },
  { id: 'back', en: 'Back', ar: 'الظهر' },
  { id: 'arms', en: 'Arms', ar: 'الذراعين' },
  { id: 'quads', en: 'Quads', ar: 'الفخذ الأمامي' },
  { id: 'hamstrings', en: 'Hamstrings', ar: 'الفخذ الخلفي' },
  { id: 'core', en: 'Core & Lower Back', ar: 'الكور وأسفل الظهر' },
];

export const DailyReadinessCard: React.FC<DailyReadinessCardProps> = ({
  isAr,
  onReadinessUpdated,
}) => {
  const [assessment, setAssessment] = useState<DailyReadinessAssessment | null>(() => 
    StorageService.getTodayDailyReadiness()
  );

  const [isEditing, setIsEditing] = useState<boolean>(() => !StorageService.getTodayDailyReadiness());
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<DailyReadinessAssessment[]>([]);

  // Form State
  const [sleepQuality, setSleepQuality] = useState<SleepQualityRating>(assessment?.sleepQuality || 'good');
  const [sleepHours, setSleepHours] = useState<number>(assessment?.sleepHoursEstimated || 7.5);
  const [stressLevel, setStressLevel] = useState<StressLevelRating>(assessment?.stressLevel || 'low');
  const [muscleSoreness, setMuscleSoreness] = useState<MuscleSorenessRating>(assessment?.muscleSoreness || 'none');
  const [soreMuscles, setSoreMuscles] = useState<string[]>(assessment?.soreMuscleGroups || []);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Sync state if saved today
  useEffect(() => {
    const todayLog = StorageService.getTodayDailyReadiness();
    setAssessment(todayLog);
    if (!todayLog) {
      setIsEditing(true);
    }
  }, []);

  const loadHistory = () => {
    const history = StorageService.getDailyReadinessHistory();
    setHistoryList(history.slice(0, 7));
  };

  // Preview score live as user chooses answers
  const livePreviewAssessment = PPLEngine.calculateDailyReadiness({
    sleepQuality,
    sleepHoursEstimated: sleepHours,
    stressLevel,
    muscleSoreness,
    soreMuscleGroups: soreMuscles,
  });

  const handleToggleMuscle = (muscleId: string) => {
    setSoreMuscles(prev => 
      prev.includes(muscleId) ? prev.filter(m => m !== muscleId) : [...prev, muscleId]
    );
  };

  const handleSaveAssessment = () => {
    const newAssessment = PPLEngine.calculateDailyReadiness({
      sleepQuality,
      sleepHoursEstimated: sleepHours,
      stressLevel,
      muscleSoreness,
      soreMuscleGroups: soreMuscles,
    });

    StorageService.saveDailyReadiness(newAssessment);
    setAssessment(newAssessment);
    setIsEditing(false);

    const msg = isAr
      ? `تم حفظ استبيان الجاهزية بنجاح (${newAssessment.readinessScore}% - ${newAssessment.titleAr}) • تم ضبط شدة تمرين اليوم تلقائياً`
      : `Daily Readiness saved (${newAssessment.readinessScore}% - ${newAssessment.titleEn}) • Today's workout intensity auto-calibrated`;

    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);

    if (onReadinessUpdated) {
      onReadinessUpdated(newAssessment);
    }
  };

  // Sleep Quality Options
  const SLEEP_OPTIONS: { id: SleepQualityRating; en: string; ar: string; descEn: string; descAr: string; score: number }[] = [
    { id: 'poor', en: 'Poor / Broken', ar: 'سيء / متقطع', descEn: '<6 hrs or restless, high fatigue', descAr: 'أقل من 6 ساعات أو نوم متقطع وإجهاد', score: 25 },
    { id: 'fair', en: 'Fair / Average', ar: 'متوسط / مقبول', descEn: '6-7 hrs, mild fatigue', descAr: '6-7 ساعات وإحساس خفيف بالإرهاق', score: 55 },
    { id: 'good', en: 'Good / Rested', ar: 'جيد / مستقر', descEn: '7-8 hrs, energized & fresh', descAr: '7-8 ساعات واستيقاظ نشيط وطبيعي', score: 82 },
    { id: 'optimal', en: 'Optimal / Deep', ar: 'ممتاز / عميق', descEn: '8+ hrs, fully restored sleep', descAr: 'أكثر من 8 ساعات واستشفاء عصبي كامل', score: 100 },
  ];

  // Stress Level Options
  const STRESS_OPTIONS: { id: StressLevelRating; en: string; ar: string; descEn: string; descAr: string; score: number }[] = [
    { id: 'low', en: 'Low / Calm', ar: 'منخفض / هادئ', descEn: 'Relaxed, mentally focused', descAr: 'ذهن صافٍ وهدوء بدون ضغوط خارجية', score: 100 },
    { id: 'moderate', en: 'Moderate', ar: 'معتدل / اعتيادي', descEn: 'Normal daily workload & tasks', descAr: 'مهام العمل اليومية الاعتيادية', score: 75 },
    { id: 'high', en: 'High / Demanding', ar: 'مرتفع / مرهق', descEn: 'Elevated mental or life strain', descAr: 'ضغط عمل أو توتر ذهني ملحوظ', score: 45 },
    { id: 'extreme', en: 'Extreme Stress', ar: 'شديد / استنزاف', descEn: 'High cognitive exhaustion', descAr: 'إرهاق ذهني واستنزاف عصبي كبير', score: 15 },
  ];

  // Muscle Soreness Options
  const SORENESS_OPTIONS: { id: MuscleSorenessRating; en: string; ar: string; descEn: string; descAr: string; score: number }[] = [
    { id: 'none', en: 'Fresh / None', ar: 'منتعش / لا إجهاد', descEn: 'Zero soreness, ready to push', descAr: 'عضلات خفيفة ومستعدة للأوزان', score: 100 },
    { id: 'mild', en: 'Mild Stiffness', ar: 'شد خفيف', descEn: 'Light tightness, full ROM', descAr: 'مرونة طبيعية مع إحساس خفيف بالشد', score: 80 },
    { id: 'moderate', en: 'Moderate DOMS', ar: 'ألم عضلي متوسط', descEn: 'Aching in trained groups', descAr: 'ألم استشفائي واضح في العضلات المدربة', score: 50 },
    { id: 'severe', en: 'Severe Soreness', ar: 'ألم عضلي شديد', descEn: 'Deep fatigue, restricted ROM', descAr: 'تيبس حاد وألم يحد من حركة المفاصل', score: 20 },
  ];

  const currentScore = isEditing ? livePreviewAssessment.readinessScore : (assessment?.readinessScore || 70);
  const currentTier = isEditing ? livePreviewAssessment.readinessTier : (assessment?.readinessTier || 'moderate');

  const getTierColor = (tier: string) => {
    if (tier === 'optimal') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (tier === 'low') return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
  };

  const getTierBadge = (tier: string) => {
    if (tier === 'optimal') return { en: 'Optimal Recovery', ar: 'جاهزية قصوى' };
    if (tier === 'low') return { en: 'Fatigue Mitigation', ar: 'تخفيف الحمل التدريبي' };
    return { en: 'Standard Baseline', ar: 'جاهزية قياسية متوازنة' };
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-lg space-y-5 relative overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Ambient Glow subtle accent */}
      <div 
        className={`absolute -top-24 ${isAr ? '-left-24' : '-right-24'} h-48 w-48 rounded-full blur-3xl pointer-events-none opacity-20 ${
          currentTier === 'optimal' ? 'bg-emerald-500' : currentTier === 'low' ? 'bg-rose-500' : 'bg-cyan-500'
        }`}
      />

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/25 shadow-sm">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-foreground">
                {isAr ? 'استبيان الجاهزية اليومية والمعايرة الذكية' : 'Daily Readiness & PPLEngine Auto-Regulation'}
              </h3>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black border ${getTierColor(currentTier)}`}>
                {currentScore}% • {isAr ? getTierBadge(currentTier).ar : getTierBadge(currentTier).en}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr 
                ? 'تقييم جودة النوم، التوتر، وإجهاد العضلات لمعايرة شدة وحجم تدريب اليوم بدقة'
                : 'Assess sleep, stress, and muscle soreness to auto-calibrate training intensity via PPLEngine.'}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {assessment && !isEditing ? (
            <button
              id="btn-edit-daily-readiness"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{isAr ? 'تعديل الاستبيان' : 'Update Check-In'}</span>
            </button>
          ) : (
            assessment && (
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            )
          )}

          <button
            onClick={() => {
              if (!showHistory) loadHistory();
              setShowHistory(!showHistory);
            }}
            className="flex items-center gap-1 rounded-xl border border-border bg-secondary/30 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
            title={isAr ? 'سجل الجاهزية السابقة' : 'Readiness History'}
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? 'السجل' : 'History'}</span>
            {showHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Instant Feedback Alert */}
      {feedbackMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-primary/40 bg-primary/10 p-3.5 text-xs sm:text-sm font-bold text-primary flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </motion.div>
      )}

      {/* Main Content: Editing Questionnaire Mode vs Completed Summary Mode */}
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editing-mode"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Question 1: Sleep Quality */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                    <Moon className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-foreground">
                    1. {isAr ? 'جودة ومدة النوم الليلي' : 'Night Sleep Quality & Recovery'}
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {sleepHours} {isAr ? 'ساعات' : 'hrs'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SLEEP_OPTIONS.map((opt) => {
                  const isSelected = sleepQuality === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      id={`btn-sleep-opt-${opt.id}`}
                      onClick={() => setSleepQuality(opt.id)}
                      className={`flex flex-col justify-between p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/15 ring-2 ring-indigo-500/30 shadow-md'
                          : 'border-border/70 bg-secondary/30 hover:border-border hover:bg-secondary/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-black ${isSelected ? 'text-indigo-400' : 'text-foreground'}`}>
                            {isAr ? opt.ar : opt.en}
                          </span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400 stroke-[3]" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          {isAr ? opt.descAr : opt.descEn}
                        </p>
                      </div>
                      <div className="mt-2 pt-1 border-t border-border/40 text-[9px] font-mono text-muted-foreground">
                        {opt.score} {isAr ? 'نقطة' : 'pts'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Hours Stepper Slider */}
              <div className="flex items-center justify-between gap-3 bg-secondary/20 p-2.5 rounded-xl border border-border/60">
                <span className="text-xs font-semibold text-muted-foreground">
                  {isAr ? 'المدة التقديرية للنوم:' : 'Estimated Sleep Duration:'}
                </span>
                <div className="flex items-center gap-1.5">
                  {[5, 6, 7, 7.5, 8, 9].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setSleepHours(h)}
                      className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        sleepHours === h
                          ? 'bg-indigo-500 text-white shadow-sm'
                          : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Question 2: Stress & Cognitive Load */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                  <Brain className="h-4 w-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-black text-foreground">
                  2. {isAr ? 'مستوى التوتر والإجهاد الذهني' : 'Mental Stress & Life Load'}
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {STRESS_OPTIONS.map((opt) => {
                  const isSelected = stressLevel === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      id={`btn-stress-opt-${opt.id}`}
                      onClick={() => setStressLevel(opt.id)}
                      className={`flex flex-col justify-between p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/30 shadow-md'
                          : 'border-border/70 bg-secondary/30 hover:border-border hover:bg-secondary/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-black ${isSelected ? 'text-amber-400' : 'text-foreground'}`}>
                            {isAr ? opt.ar : opt.en}
                          </span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-amber-400 stroke-[3]" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          {isAr ? opt.descAr : opt.descEn}
                        </p>
                      </div>
                      <div className="mt-2 pt-1 border-t border-border/40 text-[9px] font-mono text-muted-foreground">
                        {opt.score} {isAr ? 'نقطة' : 'pts'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question 3: Muscle Soreness (DOMS) */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
                  <Activity className="h-4 w-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-black text-foreground">
                  3. {isAr ? 'الإجهاد العضلي وآلام الاستشفاء (DOMS)' : 'Muscle Soreness & Systemic Tightness'}
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SORENESS_OPTIONS.map((opt) => {
                  const isSelected = muscleSoreness === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      id={`btn-soreness-opt-${opt.id}`}
                      onClick={() => setMuscleSoreness(opt.id)}
                      className={`flex flex-col justify-between p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                        isSelected
                          ? 'border-rose-500 bg-rose-500/15 ring-2 ring-rose-500/30 shadow-md'
                          : 'border-border/70 bg-secondary/30 hover:border-border hover:bg-secondary/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-black ${isSelected ? 'text-rose-400' : 'text-foreground'}`}>
                            {isAr ? opt.ar : opt.en}
                          </span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-rose-400 stroke-[3]" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          {isAr ? opt.descAr : opt.descEn}
                        </p>
                      </div>
                      <div className="mt-2 pt-1 border-t border-border/40 text-[9px] font-mono text-muted-foreground">
                        {opt.score} {isAr ? 'نقطة' : 'pts'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Specific Muscle Group Selector (if soreness present) */}
              {muscleSoreness !== 'none' && (
                <div className="bg-secondary/20 p-3 rounded-2xl border border-border/60 space-y-2">
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {isAr ? 'حدد العضلات التي تشعر فيها بالإجهاد (اختياري):' : 'Select sore muscle groups (optional):'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {MUSCLE_OPTIONS.map((m) => {
                      const isChecked = soreMuscles.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleToggleMuscle(m.id)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                            isChecked
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'bg-secondary text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {isAr ? m.ar : m.en}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Live Auto-Regulation Preview Box */}
            <div className={`rounded-2xl border p-4 transition-all ${
              livePreviewAssessment.readinessTier === 'optimal'
                ? 'border-emerald-500/40 bg-emerald-500/10'
                : livePreviewAssessment.readinessTier === 'low'
                ? 'border-rose-500/40 bg-rose-500/10'
                : 'border-cyan-500/40 bg-cyan-500/10'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-foreground" />
                  <span className="text-xs sm:text-sm font-black text-foreground">
                    {isAr ? 'المعايرة التدريبية الفورية من PPLEngine:' : 'Instant PPLEngine Auto-Regulation Calibration:'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-foreground">
                    {isAr ? 'الجاهزية التقديرية:' : 'Readiness:'} {livePreviewAssessment.readinessScore}%
                  </span>
                  <span className="rounded-md bg-card/80 px-2 py-0.5 text-xs font-black uppercase text-foreground">
                    {isAr ? livePreviewAssessment.titleAr : livePreviewAssessment.titleEn}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs leading-relaxed">
                <div className="space-y-1">
                  <div className="font-bold text-foreground">
                    {isAr ? livePreviewAssessment.pplActionDirectiveAr : livePreviewAssessment.pplActionDirectiveEn}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {isAr ? livePreviewAssessment.descriptionAr : livePreviewAssessment.descriptionEn}
                  </div>
                </div>

                <button
                  id="btn-save-daily-readiness"
                  type="button"
                  onClick={handleSaveAssessment}
                  className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-black text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 cursor-pointer"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>{isAr ? 'حفظ وتطبيق على تمرين اليوم' : "Save & Calibrate Today's Workout"}</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Completed Summary Card */
          <motion.div
            key="summary-mode"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Left Score Gauge Badge (3 cols) */}
              <div className="md:col-span-3 flex flex-col items-center justify-center p-4 rounded-2xl bg-secondary/30 border border-border/80 text-center">
                <div className="relative flex items-center justify-center">
                  <div className={`text-4xl font-black ${
                    currentTier === 'optimal' ? 'text-emerald-400' : currentTier === 'low' ? 'text-rose-400' : 'text-cyan-400'
                  }`}>
                    {assessment?.readinessScore}%
                  </div>
                </div>
                <div className="text-xs font-black uppercase tracking-wider text-foreground mt-1">
                  {isAr ? getTierBadge(currentTier).ar : getTierBadge(currentTier).en}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  {isAr ? 'تم التسجيل لليوم' : 'Logged for Today'}
                </div>
              </div>

              {/* Middle 3 Metric Breakdown Chips (5 cols) */}
              <div className="md:col-span-5 grid grid-cols-3 gap-2">
                {/* Sleep */}
                <div className="p-3 rounded-2xl bg-secondary/20 border border-border/60 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-semibold">
                    <Moon className="h-3 w-3 text-indigo-400" />
                    <span>{isAr ? 'النوم' : 'Sleep'}</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-foreground capitalize mt-1">
                    {assessment?.sleepQuality}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    ~{assessment?.sleepHoursEstimated || 7.5}h
                  </div>
                </div>

                {/* Stress */}
                <div className="p-3 rounded-2xl bg-secondary/20 border border-border/60 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-semibold">
                    <Brain className="h-3 w-3 text-amber-400" />
                    <span>{isAr ? 'التوتر' : 'Stress'}</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-foreground capitalize mt-1">
                    {assessment?.stressLevel}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {isAr ? 'ضغط ذهني' : 'Cognitive'}
                  </div>
                </div>

                {/* Soreness */}
                <div className="p-3 rounded-2xl bg-secondary/20 border border-border/60 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-semibold">
                    <Activity className="h-3 w-3 text-rose-400" />
                    <span>{isAr ? 'الإجهاد' : 'DOMS'}</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-foreground capitalize mt-1">
                    {assessment?.muscleSoreness}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {assessment?.soreMuscleGroups && assessment.soreMuscleGroups.length > 0 
                      ? `${assessment.soreMuscleGroups.length} ${isAr ? 'عضلات' : 'muscles'}` 
                      : (isAr ? 'لا شد' : 'None')}
                  </div>
                </div>
              </div>

              {/* Right PPLEngine Action Directive (4 cols) */}
              <div className={`md:col-span-4 p-4 rounded-2xl border flex flex-col justify-between ${
                currentTier === 'optimal' 
                  ? 'border-emerald-500/30 bg-emerald-500/10' 
                  : currentTier === 'low' 
                  ? 'border-rose-500/30 bg-rose-500/10' 
                  : 'border-cyan-500/30 bg-cyan-500/10'
              }`}>
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-foreground mb-1">
                    <Zap className="h-3.5 w-3.5 fill-current text-primary" />
                    <span>{isAr ? 'تأثير PPLEngine النشط:' : 'Active PPLEngine Calibration:'}</span>
                  </div>
                  <p className="text-xs font-bold text-foreground leading-snug">
                    {isAr ? assessment?.pplActionDirectiveAr : assessment?.pplActionDirectiveEn}
                  </p>
                </div>
                <div className="text-[10px] text-muted-foreground mt-2 pt-1 border-t border-border/40">
                  {isAr ? assessment?.recommendedModalityAr : assessment?.recommendedModalityEn}
                </div>
              </div>
            </div>

            {/* Quick Helper Banner */}
            <div className="flex items-center justify-between bg-secondary/15 px-3 py-2 rounded-xl text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Dumbbell className="h-3.5 w-3.5 text-primary" />
                <span>
                  {isAr 
                    ? 'تم تطبيق هذه المعايرة تلقائياً على أوزان ومجموعات تمرين اليوم في مركز التدريب أدناه.'
                    : "This calibration is actively integrated into today's sets, weights, and rest periods in the workout hub below."}
                </span>
              </span>
              <button
                onClick={() => setIsEditing(true)}
                className="font-bold text-primary hover:underline"
              >
                {isAr ? 'إعادة التقييم' : 'Re-assess'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsible History Section */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border pt-4 space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {isAr ? 'سجل الجاهزية لآخر 7 أيام' : 'Recent 7-Day Readiness History'}
              </h4>
              <span className="text-[10px] font-mono text-muted-foreground">
                {historyList.length} {isAr ? 'سجلات' : 'entries'}
              </span>
            </div>

            {historyList.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                {isAr ? 'لا توجد سجلات سابقة بعد.' : 'No previous readiness logs recorded.'}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {historyList.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-xl border border-border bg-secondary/20 flex flex-col justify-between text-center">
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {item.date}
                    </div>
                    <div className={`text-lg font-black my-1 ${
                      item.readinessTier === 'optimal' ? 'text-emerald-400' : item.readinessTier === 'low' ? 'text-rose-400' : 'text-cyan-400'
                    }`}>
                      {item.readinessScore}%
                    </div>
                    <div className="text-[9px] font-bold text-muted-foreground capitalize truncate">
                      {item.sleepQuality} • {item.muscleSoreness}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
