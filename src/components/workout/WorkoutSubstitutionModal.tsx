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
  activeWorkout: WorkoutSession | null;
  currentExerciseIndex?: number;
  mode?: 'day_swap' | 'exercise_swap' | 'adaptive_tune';
  onConfirmDaySwap?: (newSession: WorkoutSession) => void;
  onConfirmExerciseSwap?: (newExercise: Exercise, reason?: string) => void;
}

export const WorkoutSubstitutionModal: React.FC<WorkoutSubstitutionModalProps> = ({
  isOpen,
  onClose,
  profile,
  activeWorkout,
  currentExerciseIndex = 0,
  mode = 'exercise_swap',
  onConfirmDaySwap,
  onConfirmExerciseSwap,
}) => {
  const isAr = profile?.language === 'ar';
  const history = useMemo(() => StorageService.getWorkoutHistory(), []);

  const [activeMode, setActiveMode] = useState<'day_swap' | 'exercise_swap' | 'adaptive_tune'>(
    mode === 'adaptive_tune' ? 'adaptive_tune' : mode
  );
  
  // Adaptive Parameters
  const [selectedDifficulty, setSelectedDifficulty] = useState<WorkoutDifficultyLevel>(
    activeWorkout?.difficultyLevel || 'standard'
  );
  const [selectedTimeConstraint, setSelectedTimeConstraint] = useState<WorkoutTimeConstraint>(
    activeWorkout?.timeConstraint || 'full'
  );
  const [selectedEquipment, setSelectedEquipment] = useState<WorkoutEquipmentFilter>(
    activeWorkout?.equipmentFocus || (profile?.preferredLocation === 'home' ? 'home' : 'all')
  );

  // Exercise Swap State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [lowFatigueOnly, setLowFatigueOnly] = useState<boolean>(false);
  const [selectedReason, setSelectedReason] = useState<string>('fatigue');
  const [customReasonText, setCustomReasonText] = useState<string>('');

  // Day Swap State
  const [selectedSplitId, setSelectedSplitId] = useState<string>(activeWorkout?.type || 'push');
  const [daySwapReason, setDaySwapReason] = useState<string>('muscle_fatigue');

  const currentExercise = activeWorkout?.exercises?.[currentExerciseIndex];
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
        (item.exercise.primaryMuscleAr && item.exercise.primaryMuscleAr.includes(q))
      );
    }

    return list;
  }, [fullCurrentExercise, selectedEquipment, selectedDifficulty, lowFatigueOnly, selectedMuscle, searchQuery]);

  if (!isOpen) return null;

  const handleApplyExerciseSwap = (substituteExercise: Exercise, matchReason?: string) => {
    const reasonLabelEn = selectedReason === 'fatigue' ? 'Target muscle soreness / joint fatigue' :
                          selectedReason === 'equipment' ? 'Equipment unavailable / gym crowded' :
                          selectedReason === 'variety' ? 'Exercise variation & novelty' : customReasonText || matchReason || 'Custom substitution';
    const reasonLabelAr = selectedReason === 'fatigue' ? 'إجهاد عضلي أو حماية المفاصل' :
                          selectedReason === 'equipment' ? 'الجهاز غير متوفر في الصالة' :
                          selectedReason === 'variety' ? 'تنويع الحوافز العضلية' : customReasonText || matchReason || 'تبديل مخصص';

    // Record substitution in storage
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

    if (onConfirmExerciseSwap) {
      onConfirmExerciseSwap(substituteExercise, isAr ? reasonLabelAr : reasonLabelEn);
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
      originalType: activeWorkout?.type || 'push',
      originalName: activeWorkout?.name || 'Scheduled Workout',
      originalNameAr: activeWorkout?.nameAr || 'التمرينة المجدولة',
      reason: reasonLabelEn,
      reasonAr: reasonLabelAr,
    });

    StorageService.addWorkoutSubstitution({
      id: 'sub_day_' + Date.now(),
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: 'day_swap',
      originalItem: activeWorkout?.name || 'Scheduled Split',
      originalItemAr: activeWorkout?.nameAr || 'جدول اليوم المجدول',
      newItem: newSession.name,
      newItemAr: newSession.nameAr,
      reason: reasonLabelEn,
      reasonAr: reasonLabelAr,
      targetMuscleGroup: selectedSplitId,
    });

    if (onConfirmDaySwap) {
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
              {/* Current Exercise Being Substituted Banner */}
              {fullCurrentExercise && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-amber-400">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{isAr ? 'التمرين الحالي المراد تبديله:' : 'Currently Selected Exercise to Replace:'}</span>
                    </div>
                    <div className="text-sm font-black text-foreground">
                      {isAr && fullCurrentExercise.nameAr ? fullCurrentExercise.nameAr : fullCurrentExercise.name}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="bg-muted px-2 py-0.5 rounded font-medium">
                        {isAr && fullCurrentExercise.primaryMuscleAr ? fullCurrentExercise.primaryMuscleAr : fullCurrentExercise.primaryMuscle}
                      </span>
                      <span className="bg-muted px-2 py-0.5 rounded font-medium">
                        {isAr && fullCurrentExercise.equipmentAr ? fullCurrentExercise.equipmentAr : fullCurrentExercise.equipment}
                      </span>
                      <span className="font-mono text-primary">
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
                    <span>{isAr ? 'كوابل وأجهزة فقط (حماية المفاصل)' : 'Joint-Friendly (Cables/Machines)'}</span>
                  </button>
                </div>
              )}

              {/* Filters & Search */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground rtl:right-auto rtl:left-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isAr ? 'بحث عن بديل ذكي بالاسم أو العضلة...' : 'Search smart substitute by name or muscle...'}
                    className="w-full rounded-xl border border-border bg-card py-2 px-9 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Ranked Alternatives List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{isAr ? 'البدائل المتطابقة والمرتبة ميكانيكياً:' : 'Top Biomechanically Ranked Substitutes:'}</span>
                  <span>{rankedSubstitutes.length} {isAr ? 'بدائل ذكية' : 'Smart Substitutes'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {rankedSubstitutes.map(item => {
                    const ex = item.exercise;
                    return (
                      <div
                        key={ex.id}
                        onClick={() => handleApplyExerciseSwap(ex, isAr ? item.reasonAr : item.reason)}
                        className="group cursor-pointer rounded-2xl border border-border bg-card p-3.5 hover:border-primary hover:bg-primary/5 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
                              {isAr && ex.nameAr ? ex.nameAr : ex.name}
                            </span>
                            <span className="rounded-full bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 border border-primary/20">
                              {item.matchScore}% Match
                            </span>
                          </div>

                          <div className="text-[11px] text-muted-foreground">
                            {isAr ? item.reasonAr : item.reason}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                            <span className="bg-secondary px-2 py-0.5 rounded">
                              {isAr && ex.primaryMuscleAr ? ex.primaryMuscleAr : ex.primaryMuscle}
                            </span>
                            <span className="bg-secondary px-2 py-0.5 rounded">
                              {ex.equipment}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-end">
                          <span className="text-[11px] font-bold text-primary flex items-center gap-1 group-hover:underline">
                            <span>{isAr ? 'اختيار هذا البديل' : 'Select Exercise'}</span>
                            <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
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
