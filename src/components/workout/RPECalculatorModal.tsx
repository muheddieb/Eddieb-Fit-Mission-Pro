import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calculator, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Equal, 
  Info, 
  Check, 
  Zap, 
  ArrowRight, 
  HelpCircle, 
  Dumbbell, 
  Gauge, 
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RPECalculatorService, RPE_DEFINITIONS, RPESuggestionResult } from '../../services/rpeService';
import { WorkoutExercise, UserProfile } from '../../types';
import { translations } from '../../i18n/translations';

interface RPECalculatorModalProps {
  exercise?: WorkoutExercise;
  profile?: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onApplyWeightToNextSet: (suggestedWeight: number, targetReps?: number, targetRpe?: number) => void;
  onApplyWeightToAllRemaining: (suggestedWeight: number, targetReps?: number, targetRpe?: number) => void;
  initialWeight?: number;
  initialReps?: number;
  initialRpe?: number;
  targetRpe?: number;
  exerciseName?: string;
  isAr?: boolean;
}

export const RPECalculatorModal: React.FC<RPECalculatorModalProps> = ({
  exercise,
  profile,
  isOpen,
  onClose,
  onApplyWeightToNextSet,
  onApplyWeightToAllRemaining,
  initialWeight,
  initialReps,
  initialRpe,
  targetRpe: propTargetRpe,
  exerciseName: propExerciseName,
  isAr: propIsAr,
}) => {
  const lang = profile?.language || (propIsAr ? 'ar' : 'en');
  const isAr = propIsAr ?? (lang === 'ar');
  const t = translations[lang] || translations.en;

  // Pick default values from last completed set or defaults
  const completedSets = exercise?.sets ? exercise.sets.filter(s => s.completed) : [];
  const lastSet = completedSets[completedSets.length - 1] || exercise?.sets?.[0];

  const [weight, setWeight] = useState<number>(
    initialWeight ?? (lastSet?.actualWeight || lastSet?.targetWeight || 50)
  );
  const [reps, setReps] = useState<number>(
    initialReps ?? (lastSet?.actualReps || 10)
  );
  const [actualRpe, setActualRpe] = useState<number>(
    initialRpe ?? (lastSet?.rpe || 8)
  );
  const [targetRpe, setTargetRpe] = useState<number>(
    propTargetRpe ?? (exercise?.targetRpe || 8)
  );
  const [targetReps, setTargetReps] = useState<number>(
    typeof lastSet?.targetReps === 'number' 
      ? lastSet.targetReps 
      : (typeof lastSet?.targetReps === 'string' ? parseInt(lastSet.targetReps, 10) || 10 : 10)
  );
  const [activeTab, setActiveTab] = useState<'calculator' | 'matrix' | 'guide'>('calculator');
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  // Sync state if initial props change when opened
  React.useEffect(() => {
    if (isOpen) {
      if (initialWeight !== undefined) setWeight(initialWeight);
      if (initialReps !== undefined) setReps(initialReps);
      if (initialRpe !== undefined) setActualRpe(initialRpe);
      if (propTargetRpe !== undefined) setTargetRpe(propTargetRpe);
      else if (exercise?.targetRpe !== undefined) setTargetRpe(exercise.targetRpe);
    }
  }, [isOpen, initialWeight, initialReps, initialRpe, propTargetRpe, exercise?.targetRpe]);

  const currentExerciseName = propExerciseName || exercise?.exerciseName || '';

  // Compute dynamic suggestion live
  const suggestion: RPESuggestionResult = useMemo(() => {
    return RPECalculatorService.calculateSuggestion({
      currentWeight: weight,
      actualReps: reps,
      actualRpe,
      targetRpe,
      targetReps,
      exerciseName: currentExerciseName,
    });
  }, [weight, reps, actualRpe, targetRpe, targetReps, currentExerciseName]);

  // Compute Matrix of weights
  const weightMatrix = useMemo(() => {
    return RPECalculatorService.generateWeightMatrix(suggestion.estimated1RM);
  }, [suggestion.estimated1RM]);

  // Get active RPE metadata
  const currentRpeInfo = RPECalculatorService.getRPEInfo(actualRpe);
  const targetRpeInfo = RPECalculatorService.getRPEInfo(targetRpe);

  if (!isOpen) return null;

  const handleApplyNext = () => {
    onApplyWeightToNextSet(suggestion.suggestedWeight, targetReps, targetRpe);
    setAppliedNotification(
      isAr 
        ? `تم تطبيق ${suggestion.suggestedWeight} كجم على المجموعة التالية!` 
        : `Applied ${suggestion.suggestedWeight} kg to the next set!`
    );
    setTimeout(() => {
      setAppliedNotification(null);
      onClose();
    }, 900);
  };

  const handleApplyAll = () => {
    onApplyWeightToAllRemaining(suggestion.suggestedWeight, targetReps, targetRpe);
    setAppliedNotification(
      isAr 
        ? `تم تطبيق ${suggestion.suggestedWeight} كجم على جميع المجموعات المتبقية!` 
        : `Applied ${suggestion.suggestedWeight} kg to all remaining sets!`
    );
    setTimeout(() => {
      setAppliedNotification(null);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-primary/30 bg-card p-4 sm:p-6 shadow-2xl my-auto text-foreground"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 border border-primary/40 text-primary shadow-inner">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-foreground">
                  {isAr ? 'حاسبة RPE وضبط الأوزان الذكي' : 'RPE Weight Auto-Regulation'}
                </span>
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-black text-primary border border-primary/30 uppercase tracking-wider">
                  {isAr ? 'تلقائي' : 'Smart'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {isAr && exercise.exerciseNameAr ? exercise.exerciseNameAr : exercise.exerciseName}
              </p>
            </div>
          </div>

          <button
            id="btn-close-rpe-modal"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex items-center gap-1.5 border-b border-border/50 py-2.5">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'calculator'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>{isAr ? 'الحاسبة والاقتراح' : 'Calculator & Suggestion'}</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'matrix'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <Gauge className="h-3.5 w-3.5" />
            <span>{isAr ? 'جدول أوزان RPE' : 'RPE Weight Matrix'}</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'guide'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{isAr ? 'دليل مقياس RPE' : 'RPE & RIR Scale'}</span>
          </button>
        </div>

        {/* Toast Notification when weight applied */}
        <AnimatePresence>
          {appliedNotification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 p-2.5 text-xs font-bold text-emerald-400"
            >
              <Check className="h-4 w-4" />
              <span>{appliedNotification}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB 1: Main Calculator View */}
        {activeTab === 'calculator' && (
          <div className="mt-4 space-y-4 max-h-[62vh] overflow-y-auto pr-1">
            {/* Input Controls Grid */}
            <div className="rounded-2xl border border-border bg-secondary/20 p-4 space-y-3.5">
              <div className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                {isAr ? 'بيانات المجموعة السابقة / الحالية' : 'Previous / Logged Set Performance'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Weight Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>{isAr ? 'الوزن المرفوع' : 'Weight Lifted'}</span>
                    <span className="text-muted-foreground font-mono text-[11px]">kg</span>
                  </label>
                  <div className="flex items-center rounded-xl border border-border bg-card p-1">
                    <button
                      type="button"
                      onClick={() => setWeight(w => Math.max(0, w - (w >= 40 ? 2.5 : 1)))}
                      className="px-2.5 py-1 text-xs font-black text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="400"
                      value={weight}
                      onChange={e => setWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-transparent text-center text-sm font-black text-foreground focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setWeight(w => w + (w >= 40 ? 2.5 : 1))}
                      className="px-2.5 py-1 text-xs font-black text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Actual Reps Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>{isAr ? 'التكرارات المنجزة' : 'Reps Completed'}</span>
                    <span className="text-muted-foreground font-mono text-[11px]">reps</span>
                  </label>
                  <div className="flex items-center rounded-xl border border-border bg-card p-1">
                    <button
                      type="button"
                      onClick={() => setReps(r => Math.max(1, r - 1))}
                      className="px-2.5 py-1 text-xs font-black text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={reps}
                      onChange={e => setReps(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full bg-transparent text-center text-sm font-black text-foreground focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setReps(r => Math.min(50, r + 1))}
                      className="px-2.5 py-1 text-xs font-black text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Actual RPE Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>{isAr ? 'مستوى الجهد (RPE)' : 'Actual RPE'}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${currentRpeInfo.badgeBg} ${currentRpeInfo.badgeText}`}>
                      {currentRpeInfo.rir} RIR
                    </span>
                  </label>
                  <select
                    value={actualRpe}
                    onChange={e => setActualRpe(parseFloat(e.target.value))}
                    className="w-full rounded-xl border border-border bg-card py-2 px-2 text-center text-xs font-bold text-foreground focus:border-primary focus:outline-none cursor-pointer"
                  >
                    <option value="10">RPE 10 (0 RIR - فشل كامل)</option>
                    <option value="9.5">RPE 9.5 (0-1 RIR - قريب من الفشل)</option>
                    <option value="9">RPE 9 (1 RIR - تكرار متبقي)</option>
                    <option value="8.5">RPE 8.5 (1-2 RIR - تكراران محتملان)</option>
                    <option value="8">RPE 8 (2 RIR - المعيار الذهبي للبناء)</option>
                    <option value="7.5">RPE 7.5 (2-3 RIR - جيد جداً)</option>
                    <option value="7">RPE 7 (3 RIR - سرعة جيدة)</option>
                    <option value="6.5">RPE 6.5 (3-4 RIR - خفيف نسبياً)</option>
                    <option value="6">RPE 6 (4+ RIR - إحماء)</option>
                  </select>
                </div>
              </div>

              {/* Target Settings for Next Set */}
              <div className="pt-2 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground flex items-center justify-between">
                    <span>{isAr ? 'الجهد المستهدف للمجموعة القادمة (Target RPE)' : 'Target RPE for Next Set'}</span>
                    <span className="text-primary font-bold text-[11px]">{targetRpeInfo.rir} RIR</span>
                  </label>
                  <select
                    value={targetRpe}
                    onChange={e => setTargetRpe(parseFloat(e.target.value))}
                    className="w-full rounded-xl border border-primary/30 bg-card py-2 px-2 text-center text-xs font-bold text-foreground focus:border-primary focus:outline-none cursor-pointer"
                  >
                    <option value="8">RPE 8 (2 RIR - الهدف الأساسي الموصى به)</option>
                    <option value="8.5">RPE 8.5 (1-2 RIR - أوزان ثقيلة)</option>
                    <option value="9">RPE 9 (1 RIR - مجموعة أخيرة قوية)</option>
                    <option value="7.5">RPE 7.5 (2-3 RIR - تركيز على الحجم)</option>
                    <option value="7">RPE 7 (3 RIR - خفيف واستشفائي)</option>
                    <option value="9.5">RPE 9.5 (قريب من الفشل)</option>
                    <option value="10">RPE 10 (فشل كامل)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground flex items-center justify-between">
                    <span>{isAr ? 'التكرارات المستهدفة' : 'Target Reps for Next Set'}</span>
                    <span className="text-muted-foreground font-mono text-[11px]">reps</span>
                  </label>
                  <div className="flex items-center rounded-xl border border-border bg-card p-1">
                    <button
                      type="button"
                      onClick={() => setTargetReps(r => Math.max(1, r - 1))}
                      className="px-2.5 py-1 text-xs font-black text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={targetReps}
                      onChange={e => setTargetReps(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full bg-transparent text-center text-sm font-black text-foreground focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setTargetReps(r => Math.min(30, r + 1))}
                      className="px-2.5 py-1 text-xs font-black text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Results Card */}
            <div className="overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card p-4 sm:p-5 shadow-xl relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                      {isAr ? 'الوزن المقترح للمجموعة القادمة' : 'Recommended Next Set Load'}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${
                      suggestion.action === 'increase'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : suggestion.action === 'decrease'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-primary/20 text-primary border border-primary/30'
                    }`}>
                      {suggestion.action === 'increase' && <TrendingUp className="h-3 w-3" />}
                      {suggestion.action === 'decrease' && <TrendingDown className="h-3 w-3" />}
                      {suggestion.action === 'maintain' && <Equal className="h-3 w-3" />}
                      <span>
                        {suggestion.action === 'increase' 
                          ? (isAr ? `زيادة وزن (+${suggestion.weightDelta} kg)` : `Increase (+${suggestion.weightDelta} kg)`)
                          : suggestion.action === 'decrease'
                            ? (isAr ? `تخفيف وزن (${suggestion.weightDelta} kg)` : `Decrease (${suggestion.weightDelta} kg)`)
                            : (isAr ? 'ثبات الوزن' : 'Maintain Weight')}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-foreground tracking-tight">
                      {suggestion.suggestedWeight} <span className="text-base font-normal text-muted-foreground">kg</span>
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      × {targetReps} {isAr ? 'تكرار' : 'reps'} @ RPE {targetRpe}
                    </span>
                  </div>
                </div>

                {/* Estimated 1RM metric badge */}
                <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-secondary/50 p-3 shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary font-black">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">
                      {isAr ? 'أقصى وزن تقديري (e1RM)' : 'Estimated 1RM'}
                    </div>
                    <div className="text-sm font-black font-mono text-foreground">
                      {suggestion.estimated1RM} kg
                      <span className="text-[10px] text-muted-foreground font-normal ml-1">
                        ({suggestion.currentIntensityPercent}% intensity)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIR Visual Progress Bar */}
              <div className="mt-4 pt-3 border-t border-border/40 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-muted-foreground">
                    {isAr ? 'مستوى الاحتياط العضلي (Reps in Reserve):' : 'Reps in Reserve (RIR):'}
                  </span>
                  <span className="font-mono text-foreground">
                    {suggestion.actualRir} RIR ({isAr ? 'متبقي' : 'left in tank'})
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      suggestion.actualRir === 0
                        ? 'bg-red-500 w-[100%]'
                        : suggestion.actualRir <= 1
                          ? 'bg-amber-400 w-[85%]'
                          : suggestion.actualRir <= 2
                            ? 'bg-emerald-400 w-[70%]'
                            : 'bg-blue-400 w-[45%]'
                    }`}
                  />
                </div>
              </div>

              {/* Explanation & Tactical Coaching Tip */}
              <div className="mt-3 rounded-xl bg-secondary/40 p-3 space-y-1.5 text-xs">
                <div className="font-semibold text-foreground leading-relaxed">
                  {isAr ? suggestion.reasonAr : suggestion.reasonEn}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-primary font-bold">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  <span>{isAr ? suggestion.tacticalTipAr : suggestion.tacticalTipEn}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                id="btn-apply-rpe-next-set"
                onClick={handleApplyNext}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                <Check className="h-4 w-4" />
                <span>
                  {isAr 
                    ? `تطبيق (${suggestion.suggestedWeight} كجم) على المجموعة التالية` 
                    : `Apply (${suggestion.suggestedWeight} kg) to Next Set`}
                </span>
              </button>

              <button
                id="btn-apply-rpe-all-remaining"
                onClick={handleApplyAll}
                className="flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-xs sm:text-sm font-bold text-primary hover:bg-primary/20 active:scale-[0.98] transition-all"
              >
                <Zap className="h-4 w-4" />
                <span>
                  {isAr 
                    ? `تطبيق على جميع المجموعات المتبقية (${suggestion.suggestedWeight} كجم)` 
                    : `Apply to All Remaining Sets (${suggestion.suggestedWeight} kg)`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: RPE Matrix Table */}
        {activeTab === 'matrix' && (
          <div className="mt-4 space-y-4 max-h-[62vh] overflow-y-auto pr-1">
            <div className="rounded-2xl border border-border bg-secondary/20 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-foreground">
                  {isAr ? `جدول الأوزان المقترحة بناءً على 1RM = ${suggestion.estimated1RM} كجم` : `Target Weights Matrix for e1RM = ${suggestion.estimated1RM} kg`}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {isAr && exercise.exerciseNameAr ? exercise.exerciseNameAr : exercise.exerciseName}
                </span>
              </div>

              {suggestion.estimated1RM <= 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  {isAr ? 'أدخل وزناً وتكرارات صحيحة في تبويب الحاسبة لحساب الجدول.' : 'Enter valid weight & reps in the calculator tab to view matrix.'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-bold">
                        <th className="py-2 px-2 text-left">{isAr ? 'التكرار' : 'Reps'}</th>
                        <th className="py-2 px-1 text-slate-400">RPE 7</th>
                        <th className="py-2 px-1 text-blue-400">RPE 7.5</th>
                        <th className="py-2 px-1 text-emerald-400 bg-emerald-500/10 rounded-t-lg">RPE 8 ⭐</th>
                        <th className="py-2 px-1 text-cyan-400">RPE 8.5</th>
                        <th className="py-2 px-1 text-amber-400">RPE 9</th>
                        <th className="py-2 px-1 text-rose-400">RPE 9.5</th>
                        <th className="py-2 px-1 text-red-400">RPE 10</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono">
                      {weightMatrix.map(row => (
                        <tr key={row.reps} className="hover:bg-secondary/40 transition-colors">
                          <td className="py-2 px-2 text-left font-bold text-foreground">
                            {row.reps} {isAr ? 'تكرار' : 'reps'}
                          </td>
                          <td className="py-2 px-1 text-slate-300">{row.weightsByRpe[7]}k</td>
                          <td className="py-2 px-1 text-blue-300">{row.weightsByRpe[7.5]}k</td>
                          <td className="py-2 px-1 font-black text-emerald-400 bg-emerald-500/10">
                            {row.weightsByRpe[8]} kg
                          </td>
                          <td className="py-2 px-1 text-cyan-300">{row.weightsByRpe[8.5]}k</td>
                          <td className="py-2 px-1 text-amber-300">{row.weightsByRpe[9]}k</td>
                          <td className="py-2 px-1 text-rose-300">{row.weightsByRpe[9.5]}k</td>
                          <td className="py-2 px-1 text-red-400">{row.weightsByRpe[10]}k</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground leading-relaxed flex items-start gap-2">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                {isAr 
                  ? 'القيم محسوبة بدقة حسب خوارزمية RTS (Reactive Training Systems) وتُعد المرجع العالمي الأحدث لبرمجة القوة والتضخيم التكيفي.'
                  : 'Calculated using Reactive Training Systems (RTS) percentage algorithm for optimal autoregulated strength and hypertrophy progression.'}
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: Visual Scale Reference Guide */}
        {activeTab === 'guide' && (
          <div className="mt-4 space-y-2.5 max-h-[62vh] overflow-y-auto pr-1">
            {Object.values(RPE_DEFINITIONS)
              .sort((a, b) => b.rpe - a.rpe)
              .map(info => (
                <div
                  key={info.rpe}
                  className={`rounded-xl border p-3 transition-all ${info.color} bg-card/60`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-black ${info.badgeBg} ${info.badgeText}`}>
                        RPE {info.rpe}
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {isAr ? info.labelAr : info.labelEn}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-muted-foreground">
                      {info.rir} {isAr ? 'تكرارات متبقية (RIR)' : 'Reps in Reserve'}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mb-1.5">
                    {isAr ? info.descriptionAr : info.descriptionEn}
                  </p>

                  <div className="text-[11px] font-semibold text-primary/90 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 shrink-0" />
                    <span>{isAr ? info.recommendationAr : info.recommendationEn}</span>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span>{isAr ? 'الضبط الذكي للأحمال التدريبية' : 'Smart Auto-Regulation'}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-border bg-secondary/80 px-4 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
          >
            {t.common.close}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
