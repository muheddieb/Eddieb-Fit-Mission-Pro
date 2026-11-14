import React, { useState, useMemo } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  Sparkles, 
  Flame, 
  Zap, 
  Target, 
  ShieldCheck, 
  Activity, 
  Moon, 
  Scale, 
  Check, 
  Search, 
  Filter, 
  Dumbbell, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  Clock,
  Gauge,
  Layers,
  HeartPulse
} from 'lucide-react';
import { 
  Exercise, 
  WorkoutSession, 
  UserProfile, 
  WorkoutExercise, 
  SetLog,
  WorkoutDifficultyLevel,
  WorkoutTimeConstraint,
  WorkoutEquipmentFilter
} from '../../types';
import { PPLEngine, MuscleRecoveryState, SmartSubstituteItem } from '../../services/pplEngine';
import { StorageService } from '../../services/storage';

interface WorkoutSubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  activeWorkout?: WorkoutSession | null;
  currentSession?: WorkoutSession | null;
  currentExerciseIndex?: number;
  currentExercise?: WorkoutExercise;
  mode?: 'day_swap' | 'exercise_swap' | 'adaptive_tune';
  onConfirmDaySwap?: (newSession: WorkoutSession) => void;
  onSubstituteWorkout?: (newSession: WorkoutSession, reason?: string) => void;
  onConfirmExerciseSwap?: (newExercise: Exercise, reason?: string) => void;
  onSubstituteExercise?: (originalExerciseId: string, newExercise: Exercise, reason?: string) => void;
}

export const WorkoutSubstitutionModal: React.FC<WorkoutSubstitutionModalProps> = ({
  isOpen,
  onClose,
  profile,
  activeWorkout,
  currentSession,
  currentExerciseIndex = 0,
  currentExercise: propCurrentExercise,
  mode = 'exercise_swap',
  onConfirmDaySwap,
  onSubstituteWorkout,
  onConfirmExerciseSwap,
  onSubstituteExercise,
}) => {
  const isAr = profile?.language === 'ar';
  const session = activeWorkout || currentSession || null;
  const history = useMemo(() => StorageService.getWorkoutHistory(), []);

  const [activeMode, setActiveMode] = useState<'day_swap' | 'exercise_swap' | 'adaptive_tune'>(
    mode === 'adaptive_tune' ? 'adaptive_tune' : mode
  );

  // Track which exercise index in the session is being swapped
  const resolvedInitialIndex = useMemo(() => {
    if (propCurrentExercise && session?.exercises) {
      const idx = session.exercises.findIndex(e => e.exerciseId === propCurrentExercise.exerciseId);
      if (idx >= 0) return idx;
    }
    return currentExerciseIndex;
  }, [propCurrentExercise, session, currentExerciseIndex]);

  const [targetExerciseIndex, setTargetExerciseIndex] = useState<number>(resolvedInitialIndex);

  React.useEffect(() => {
    setTargetExerciseIndex(resolvedInitialIndex);
  }, [resolvedInitialIndex, isOpen]);

  // Adaptive Parameters
  const [selectedDifficulty, setSelectedDifficulty] = useState<WorkoutDifficultyLevel>(
    session?.difficultyLevel || 'standard'
  );
  const [selectedTimeConstraint, setSelectedTimeConstraint] = useState<WorkoutTimeConstraint>(
    session?.timeConstraint || 'full'
  );
  const [selectedEquipment, setSelectedEquipment] = useState<WorkoutEquipmentFilter>(
    session?.equipmentFocus || (profile?.preferredLocation === 'home' ? 'home' : 'all')
  );

  // Exercise Swap State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [lowFatigueOnly, setLowFatigueOnly] = useState<boolean>(false);
  const [selectedReason, setSelectedReason] = useState<string>('congestion');
  const [customReasonText] = useState<string>('');

  // Day Swap State
  const [selectedSplitId, setSelectedSplitId] = useState<string>(session?.type || 'push');
  const [daySwapReason] = useState<string>('muscle_fatigue');

  const currentExercise = session?.exercises?.[targetExerciseIndex] || propCurrentExercise;
  const fullCurrentExercise = currentExercise 
    ? PPLEngine.getExerciseById(currentExercise.exerciseId) 
    : undefined;

  const availableSplits = useMemo(() => PPLEngine.getAvailableSplits(), []);
  const muscleRecovery = useMemo(() => PPLEngine.getMuscleRecoveryStatus(history), [history]);

  // Ranked substitute exercises with smart score and match reasons
  const rankedSubstitutes = useMemo(() => {
    if (!fullCurrentExercise) return [];

    let list = PPLEngine.getSmartRankedSubstitutes(fullCurrentExercise.id, {
      equipment: selectedEquipment,
      difficulty: selectedDifficulty,
      lowFatigueOnly: lowFatigueOnly,
      filterMuscle: selectedMuscle !== 'all' ? selectedMuscle : undefined,
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        item.exercise.name.toLowerCase().includes(q) || 
        (item.exercise.nameAr && item.exercise.nameAr.includes(q)) ||
        item.exercise.primaryMuscle.toLowerCase().includes(q) ||
        (item.exercise.primaryMuscleAr && item.exercise.primaryMuscleAr.includes(q)) ||
        item.exercise.equipment.toLowerCase().includes(q)
      );
    }

    return list;
  }, [fullCurrentExercise, selectedEquipment, selectedDifficulty, lowFatigueOnly, selectedMuscle, searchQuery]);

  if (!isOpen) return null;

  const handleApplyExerciseSwap = (substituteExercise: Exercise, matchReason?: string) => {
    const reasonLabelEn =
      selectedReason === 'congestion' ? 'Gym congestion / machine occupied' :
      selectedReason === 'equipment' ? 'Equipment unavailable' :
      selectedReason === 'fatigue' ? 'Target muscle soreness / joint comfort' :
      selectedReason === 'variety' ? 'Exercise variation & stimulus novelty' :
      customReasonText || matchReason || 'Custom substitution';

    const reasonLabelAr =
      selectedReason === 'congestion' ? 'ازدحام الصالة / الجهاز مشغول حالياً' :
      selectedReason === 'equipment' ? 'الأداة غير متوفرة حالياً' :
      selectedReason === 'fatigue' ? 'إجهاد عضلي أو حماية المفاصل وأسفل الظهر' :
      selectedReason === 'variety' ? 'تنويع الزوايا والحوافز العضلية' :
      customReasonText || matchReason || 'تبديل مخصص';

    const finalReason = isAr ? reasonLabelAr : reasonLabelEn;
    const origId = currentExercise?.exerciseId || fullCurrentExercise?.id || '';

    if (onSubstituteExercise && origId) {
      onSubstituteExercise(origId, substituteExercise, finalReason);
    } else if (onConfirmExerciseSwap) {
      // Record substitution in storage if parent doesn't handle it via onSubstituteExercise
      StorageService.addWorkoutSubstitution({
        id: 'sub_ex_' + Date.now(),
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: 'exercise_swap',
        originalItem: fullCurrentExercise?.name || currentExercise?.exerciseName || 'Original Exercise',
        originalItemAr: fullCurrentExercise?.nameAr || currentExercise?.exerciseNameAr || 'التمرين الأصلي',
        newItem: substituteExercise.name,
        newItemAr: substituteExercise.nameAr,
        reason: reasonLabelEn,
        reasonAr: reasonLabelAr,
        targetMuscleGroup: substituteExercise.primaryMuscle,
        fatigueLevelReported: lowFatigueOnly ? 'Low fatigue preference' : selectedDifficulty,
      });
      onConfirmExerciseSwap(substituteExercise, finalReason);
    }
    onClose();
  };

  const handleApplyDaySwap = () => {
    const reasonLabelEn = daySwapReason === 'muscle_fatigue' ? 'Muscle group soreness & recovery need' :
                          daySwapReason === 'time_limit' ? `Time constraint (${selectedTimeConstraint})` :
                          daySwapReason === 'difficulty_adjust' ? `Adjusted level to ${selectedDifficulty}` :
                          daySwapReason === 'home_preference' ? 'Switched to home / calisthenics' : 'Adaptive split customization';
    const reasonLabelAr = daySwapReason === 'muscle_fatigue' ? 'إجهاد عضلي والحاجة للاستشفاء' :
                          daySwapReason === 'time_limit' ? `ضيق الوقت (${selectedTimeConstraint})` :
                          daySwapReason === 'difficulty_adjust' ? `تعديل الصعوبة إلى المستوى ${selectedDifficulty}` :
                          daySwapReason === 'home_preference' ? 'التحويل لتمرين منزلي' : 'تكييف وتخصيص الجدول';

    const newSession = PPLEngine.buildWorkoutForSplit(selectedSplitId, profile, history, {
      difficultyLevel: selectedDifficulty,
      timeConstraint: selectedTimeConstraint,
      equipment: selectedEquipment,
      location: selectedEquipment === 'home' ? 'home' : profile.preferredLocation,
      originalType: session?.type || 'push',
      originalName: session?.name || 'Scheduled Workout',
      originalNameAr: session?.nameAr || 'التمرينة المجدولة',
      reason: reasonLabelEn,
      reasonAr: reasonLabelAr,
    });

    StorageService.addWorkoutSubstitution({
      id: 'sub_day_' + Date.now(),
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: 'day_swap',
      originalItem: session?.name || 'Scheduled Split',
      originalItemAr: session?.nameAr || 'جدول اليوم المجدول',
      newItem: newSession.name,
      newItemAr: newSession.nameAr,
      reason: reasonLabelEn,
      reasonAr: reasonLabelAr,
      targetMuscleGroup: selectedSplitId,
    });

    if (onSubstituteWorkout) {
      onSubstituteWorkout(newSession, isAr ? reasonLabelAr : reasonLabelEn);
    } else if (onConfirmDaySwap) {
      onConfirmDaySwap(newSession);
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div 
        id="workout-substitution-modal-container"
        className="relative w-full max-w-3xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-5 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-foreground">
                  {isAr ? 'نظام التمارين المتكيف والمرن (Adaptive Workout)' : 'Adaptive Training & Customization'}
                </h2>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  {isAr ? 'مرونة ذكية' : 'Smart Adaptation'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isAr 
                  ? 'برنامج التدريب إطار ذكي مرن يخدمك، وليس قيداً يجبرك. خصص تمرينك وصعوبته ووقتك بحرية.' 
                  : 'Training is an intelligent guide, not a prison. Adjust your routine, difficulty, and time freely.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex border-b border-border bg-muted/20 p-2 gap-2">
          <button
            onClick={() => setActiveMode('day_swap')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'day_swap'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>{isAr ? 'تخصيص وتبديل تمرين اليوم' : 'Tune & Swap Today Split'}</span>
          </button>

          <button
            onClick={() => setActiveMode('exercise_swap')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'exercise_swap'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Dumbbell className="h-3.5 w-3.5" />
            <span>{isAr ? 'تبديل تمرين فردي ذكي' : 'Substitute Single Exercise'}</span>
            {fullCurrentExercise && (
              <span className="text-[10px] opacity-80 truncate max-w-[120px]">
                ({isAr && fullCurrentExercise.nameAr ? fullCurrentExercise.nameAr : fullCurrentExercise.name})
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveMode('adaptive_tune')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'adaptive_tune'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <HeartPulse className="h-3.5 w-3.5 text-rose-400" />
            <span>{isAr ? 'حالة استشفاء العضلات' : 'Muscle Recovery Vitals'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* ========================================================================= */}
          {/* TAB 1: DAY SPLIT & ADAPTIVE PARAMETERS */}
          {/* ========================================================================= */}
          {activeMode === 'day_swap' && (
            <div className="space-y-5">
              {/* 3 Difficulty Levels Selection */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      {isAr ? 'مستوى الشدة والصعوبة لليوم (3 مستويات):' : 'Workout Difficulty Level (3 Levels):'}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {selectedDifficulty === 'easy' ? (isAr ? 'المستوى 1: خفيف / مرن' : 'Level 1: Light / Gentle') :
                     selectedDifficulty === 'hard' ? (isAr ? 'المستوى 3: مكثف / متقدم' : 'Level 3: Advanced / Heavy') :
                     (isAr ? 'المستوى 2: قياسي متوازن' : 'Level 2: Standard Overload')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedDifficulty('easy')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      selectedDifficulty === 'easy'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-black ring-1 ring-emerald-500'
                        : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="text-xs font-bold">{isAr ? 'المستوى 1 (خفيف)' : 'Level 1 (Easy)'}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {isAr ? 'أوزان مريحة وتكرارات 10-12' : 'Gentle joint load & 10-12 reps'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDifficulty('standard')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      selectedDifficulty === 'standard'
                        ? 'bg-primary/20 border-primary text-primary font-black ring-1 ring-primary'
                        : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="text-xs font-bold">{isAr ? 'المستوى 2 (قياسي)' : 'Level 2 (Standard)'}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {isAr ? 'الحمل المتدرج المستهدف 8-10' : 'Progressive overload 8-10 reps'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDifficulty('hard')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      selectedDifficulty === 'hard'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400 font-black ring-1 ring-rose-500'
                        : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="text-xs font-bold">{isAr ? 'المستوى 3 (مكثف)' : 'Level 3 (Hard)'}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {isAr ? 'أوزان ثقيلة وحجم تدريبي عالٍ' : 'Heavy volume & power sets'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Time Constraint & Equipment Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Limited Time Options */}
                <div className="rounded-2xl border border-border bg-card p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span>{isAr ? 'الوقت المتاح للتمرين اليوم:' : 'Available Time (Quick Workout):'}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'full', labelEn: 'Full', labelAr: 'كامل' },
                      { id: '30min', labelEn: '30m', labelAr: '30 د' },
                      { id: '20min', labelEn: '20m', labelAr: '20 د' },
                      { id: '10min', labelEn: '10m', labelAr: '10 د' },
                    ].map(tc => (
                      <button
                        key={tc.id}
                        type="button"
                        onClick={() => setSelectedTimeConstraint(tc.id as any)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                          selectedTimeConstraint === tc.id
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                            : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {isAr ? tc.labelAr : tc.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Equipment Variety Options */}
                <div className="rounded-2xl border border-border bg-card p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Layers className="h-4 w-4 text-cyan-400" />
                    <span>{isAr ? 'الأدوات والمكان:' : 'Equipment & Location:'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'all', labelEn: 'All Gym', labelAr: 'الجم كامل' },
                      { id: 'dumbbells', labelEn: 'Dumbbells', labelAr: 'دمبل فقط' },
                      { id: 'home', labelEn: 'Home', labelAr: 'منزلي' },
                    ].map(eq => (
                      <button
                        key={eq.id}
                        type="button"
                        onClick={() => setSelectedEquipment(eq.id as any)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                          selectedEquipment === eq.id
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                            : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {isAr ? eq.labelAr : eq.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Splits Grid Selection */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-foreground block">
                  {isAr ? 'اختر الروتين المطلوب لليوم:' : 'Select Target Workout Split:'}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1">
                  {availableSplits.map(split => {
                    const isSelected = selectedSplitId === split.id;
                    const isCurrentScheduled = activeWorkout?.type === split.id;

                    return (
                      <div
                        key={split.id}
                        onClick={() => setSelectedSplitId(split.id)}
                        className={`cursor-pointer rounded-2xl border p-3.5 transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary'
                            : 'border-border bg-card hover:border-primary/40'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className={`rounded-xl px-2.5 py-1 text-[11px] font-bold border bg-gradient-to-r ${split.color}`}>
                              {isAr ? split.nameAr.split('(')[0] : split.name.split('(')[0]}
                            </span>

                            {isCurrentScheduled && (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded">
                                {isAr ? 'المجدول اليوم' : 'Scheduled'}
                              </span>
                            )}

                            {isSelected && (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check className="h-3 w-3 stroke-[3]" />
                              </div>
                            )}
                          </div>

                          <h3 className="text-xs font-bold text-foreground pt-1">
                            {isAr ? split.nameAr : split.name}
                          </h3>

                          <div className="flex flex-wrap gap-1">
                            {(isAr ? split.musclesAr : split.muscles).map((m, idx) => (
                              <span key={idx} className="text-[10px] bg-secondary/70 text-muted-foreground px-1.5 py-0.5 rounded">
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: SMART RANKED EXERCISE SUBSTITUTION */}
          {/* ========================================================================= */}
          {activeMode === 'exercise_swap' && (
            <div className="space-y-4">
              {/* Session Exercise Selector (Switch which exercise in the workout to swap) */}
              {session?.exercises && session.exercises.length > 1 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground block">
                    {isAr ? 'اختر التمرين المراد استبداله من جلسة اليوم:' : 'Select Movement in Session to Swap:'}
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
                    {session.exercises.map((ex, idx) => (
                      <button
                        key={ex.exerciseId + idx}
                        type="button"
                        onClick={() => setTargetExerciseIndex(idx)}
                        className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all ${
                          idx === targetExerciseIndex
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-secondary'
                        }`}
                      >
                        <span>{idx + 1}.</span>
                        <span className="truncate max-w-[140px]">
                          {isAr && ex.exerciseNameAr ? ex.exerciseNameAr : ex.exerciseName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Exercise Being Substituted Banner */}
              {fullCurrentExercise && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-amber-400">
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                      <span>{isAr ? 'التمرين المبرمج المراد استبداله:' : 'Programmed Movement to Replace:'}</span>
                    </div>
                    <div className="text-sm font-black text-foreground">
                      {isAr && fullCurrentExercise.nameAr ? fullCurrentExercise.nameAr : fullCurrentExercise.name}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{isAr && fullCurrentExercise.primaryMuscleAr ? fullCurrentExercise.primaryMuscleAr : fullCurrentExercise.primaryMuscle}</span>
                      <span aria-hidden="true">·</span>
                      <span>{isAr && fullCurrentExercise.equipmentAr ? fullCurrentExercise.equipmentAr : fullCurrentExercise.equipment}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-primary font-semibold">
                        {fullCurrentExercise.targetSets} sets × {fullCurrentExercise.targetRepRange}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLowFatigueOnly(!lowFatigueOnly)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold border transition-all ${
                      lowFatigueOnly 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-card text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>{isAr ? 'حماية المفاصل وأسفل الظهر' : 'Joint-Friendly Focus'}</span>
                  </button>
                </div>
              )}

              {/* Swap Reason Selector (Congestion, Unavailable Equipment, Joint Comfort, Variety) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-card/70 p-3 space-y-2">
                  <span className="text-[11px] font-bold text-foreground block">
                    {isAr ? 'سبب تبديل التمرين:' : 'Reason for Swap:'}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'congestion', labelEn: 'Machine Busy / Crowded', labelAr: 'ازدحام / الجهاز مشغول' },
                      { id: 'equipment', labelEn: 'Equipment Missing', labelAr: 'الأداة غير متوفرة' },
                      { id: 'fatigue', labelEn: 'Joint / Back Comfort', labelAr: 'راحة المفاصل والظهر' },
                      { id: 'variety', labelEn: 'Movement Variety', labelAr: 'تنويع الزوايا' },
                    ].map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedReason(r.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border text-center transition-colors ${
                          selectedReason === r.id
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-secondary/50 text-muted-foreground border-border hover:text-foreground'
                        }`}
                      >
                        {isAr ? r.labelAr : r.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Available Equipment Filter Bar */}
                <div className="rounded-xl border border-border bg-card/70 p-3 space-y-2">
                  <span className="text-[11px] font-bold text-foreground block">
                    {isAr ? 'الأداة المتاحة لك الآن:' : 'Filter by Available Equipment:'}
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'all', labelEn: 'All Gear', labelAr: 'الكل' },
                      { id: 'dumbbells', labelEn: 'Dumbbells', labelAr: 'دمبل' },
                      { id: 'cables', labelEn: 'Cables', labelAr: 'كابلات' },
                      { id: 'machines', labelEn: 'Machines', labelAr: 'أجهزة' },
                      { id: 'barbell', labelEn: 'Barbell', labelAr: 'بار' },
                      { id: 'bodyweight', labelEn: 'Bodyweight', labelAr: 'وزن الجسم' },
                    ].map(eq => (
                      <button
                        key={eq.id}
                        type="button"
                        onClick={() => setSelectedEquipment(eq.id as WorkoutEquipmentFilter)}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border text-center transition-colors ${
                          selectedEquipment === eq.id
                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                            : 'bg-secondary/50 text-muted-foreground border-border hover:text-foreground'
                        }`}
                      >
                        {isAr ? eq.labelAr : eq.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground rtl:right-auto rtl:left-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث عن تمرين بديل بالاسم أو العضلة أو الأداة...' : 'Search equivalent variation by name, muscle, or equipment...'}
                  className="w-full rounded-xl border border-border bg-card py-2 px-9 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Ranked Alternatives List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{isAr ? 'البدائل المكافئة والمرتبة ميكانيكياً:' : 'Biomechanically Equivalent Variations:'}</span>
                  <span>{rankedSubstitutes.length} {isAr ? 'تمارين مكافئة' : 'Equivalent Options'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {rankedSubstitutes.map(item => {
                    const ex = item.exercise;
                    const subAdvice = PPLEngine.calculateProgression(ex.id, history);
                    return (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => handleApplyExerciseSwap(ex, isAr ? item.reasonAr : item.reason)}
                        className="group text-left rtl:text-right cursor-pointer rounded-2xl border border-border bg-card p-3.5 hover:border-primary hover:bg-primary/5 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-1.5 w-full">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
                              {isAr && ex.nameAr ? ex.nameAr : ex.name}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0">
                              {item.matchScore}% {isAr ? 'تطابق' : 'Match'}
                            </span>
                          </div>

                          <div className="text-[11px] text-muted-foreground">
                            {isAr ? item.reasonAr : item.reason}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                            <span className="text-foreground font-semibold">
                              {isAr && ex.primaryMuscleAr ? ex.primaryMuscleAr : ex.primaryMuscle}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{isAr && ex.equipmentAr ? ex.equipmentAr : ex.equipment}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-primary font-bold">
                              {subAdvice.recommendedWeight > 0
                                ? (isAr ? `الوزن المقترح: ${subAdvice.recommendedWeight} كجم` : `Suggested: ${subAdvice.recommendedWeight} kg`)
                                : (isAr ? 'وزن الجسم' : 'Bodyweight')}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between w-full border-t border-border/50 pt-2">
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {ex.targetSets} sets × {ex.targetRepRange}
                          </span>
                          <span className="text-[11px] font-bold text-primary flex items-center gap-1 group-hover:underline">
                            <span>{isAr ? 'استبدال فوراً' : 'Swap Exercise'}</span>
                            <ChevronRight className="h-3 w-3 rtl:rotate-180" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: LIVE MUSCLE RECOVERY VITALS */}
          {/* ========================================================================= */}
          {activeMode === 'adaptive_tune' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-rose-400" />
                    <h3 className="text-sm font-bold text-foreground">
                      {isAr ? 'مؤشر استشفاء المجموعات العضلية الحية' : 'Live Muscle Group Recovery Telemetry'}
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {isAr ? 'محسوبة بناءً على جلساتك الأخيرة' : 'Calculated from recent completed logs'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {muscleRecovery.map(mr => (
                    <div 
                      key={mr.muscleKey}
                      className="rounded-xl border border-border/80 bg-secondary/30 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          {isAr ? mr.nameAr : mr.name}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          mr.status === 'fresh'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : mr.status === 'recovering'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                          {mr.recoveryScorePercent}% {mr.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Visual Recovery Bar */}
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            mr.status === 'fresh'
                              ? 'bg-emerald-400'
                              : mr.status === 'recovering'
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          }`}
                          style={{ width: `${mr.recoveryScorePercent}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {isAr ? mr.adviceAr : mr.advice}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border p-4 bg-card/60 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          {activeMode === 'day_swap' && (
            <button
              id="btn-confirm-day-split-swap"
              onClick={handleApplyDaySwap}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
            >
              <Check className="h-4 w-4" />
              <span>{isAr ? 'تطبيق هذا الجدول المتكيف' : 'Apply Adaptive Split'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
