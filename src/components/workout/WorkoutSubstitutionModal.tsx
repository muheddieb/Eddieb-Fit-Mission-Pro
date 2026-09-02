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
  ChevronRight
} from 'lucide-react';
import { Exercise, WorkoutSession, UserProfile, WorkoutExercise, SetLog } from '../../types';
import { PPLEngine } from '../../services/pplEngine';
import { StorageService } from '../../services/storage';

interface WorkoutSubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  activeWorkout: WorkoutSession | null;
  currentExerciseIndex?: number;
  mode?: 'day_swap' | 'exercise_swap';
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

  const [activeMode, setActiveMode] = useState<'day_swap' | 'exercise_swap'>(mode);
  
  // Exercise Swap State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [lowFatigueOnly, setLowFatigueOnly] = useState<boolean>(false);
  const [selectedReason, setSelectedReason] = useState<string>('fatigue');
  const [customReasonText, setCustomReasonText] = useState<string>('');

  // Day Swap State
  const [selectedSplitId, setSelectedSplitId] = useState<string>('push');
  const [daySwapReason, setDaySwapReason] = useState<string>('muscle_fatigue');

  const currentExercise = activeWorkout?.exercises?.[currentExerciseIndex];
  const fullCurrentExercise = currentExercise 
    ? PPLEngine.getExerciseById(currentExercise.exerciseId) 
    : undefined;

  const availableSplits = useMemo(() => PPLEngine.getAvailableSplits(), []);

  // Filtered substitute exercises
  const candidateExercises = useMemo(() => {
    if (!fullCurrentExercise) return exerciseSeedDataSlice();

    let list = PPLEngine.getSmartSubstitutes(fullCurrentExercise.id, {
      filterMuscle: selectedMuscle,
      filterEquipment: selectedEquipment,
      lowFatigueOnly: lowFatigueOnly,
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(e => 
        e.name.toLowerCase().includes(q) || 
        (e.nameAr && e.nameAr.includes(q)) ||
        e.primaryMuscle.toLowerCase().includes(q) ||
        (e.primaryMuscleAr && e.primaryMuscleAr.includes(q))
      );
    }

    return list;
  }, [fullCurrentExercise, selectedMuscle, selectedEquipment, lowFatigueOnly, searchQuery]);

  function exerciseSeedDataSlice(): Exercise[] {
    return PPLEngine.getAllExercises().slice(0, 12);
  }

  if (!isOpen) return null;

  const handleApplyExerciseSwap = (substituteExercise: Exercise) => {
    const reasonLabelEn = selectedReason === 'fatigue' ? 'Target muscle soreness / joint fatigue' :
                          selectedReason === 'equipment' ? 'Equipment unavailable / gym crowded' :
                          selectedReason === 'variety' ? 'Exercise variation & novelty' : customReasonText || 'Custom substitution';
    const reasonLabelAr = selectedReason === 'fatigue' ? 'إجهاد عضلي أو حماية المفاصل' :
                          selectedReason === 'equipment' ? 'الجهاز غير متوفر في الصالة' :
                          selectedReason === 'variety' ? 'تنويع الحوافز العضلية' : customReasonText || 'تبديل مخصص';

    // Record substitution
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
      fatigueLevelReported: lowFatigueOnly ? 'Low fatigue preference' : 'Standard',
    });

    if (onConfirmExerciseSwap) {
      onConfirmExerciseSwap(substituteExercise, isAr ? reasonLabelAr : reasonLabelEn);
    }
    onClose();
  };

  const handleApplyDaySwap = () => {
    const reasonLabelEn = daySwapReason === 'muscle_fatigue' ? 'Muscle group soreness & recovery need' :
                          daySwapReason === 'time_limit' ? 'Time constraint / shortened routine' :
                          daySwapReason === 'home_preference' ? 'Switched to home / calisthenics' : 'Alternative day preference';
    const reasonLabelAr = daySwapReason === 'muscle_fatigue' ? 'إجهاد عضلي والحاجة للاستشفاء' :
                          daySwapReason === 'time_limit' ? 'ضيق الوقت واختصار الروتين' :
                          daySwapReason === 'home_preference' ? 'التحويل لتمرين منزلي' : 'تفضيل جدول مختلف لليوم';

    const newSession = PPLEngine.buildWorkoutForSplit(selectedSplitId, profile, history, {
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
        className="relative w-full max-w-3xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-5 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/25">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-foreground">
                  {isAr ? 'نظام التبديل المرن للتمارين' : 'Flexible Workout Substitution'}
                </h2>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                  {isAr ? 'حفظ التقدم' : 'Safe Tracking'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isAr 
                  ? 'عدّل تمرين اليوم أو استبدل أي تمرين دون التأثير على تقدمك وسجل أرقامك القياسية.' 
                  : 'Swap today\'s routine or replace specific exercises without disrupting progressive overload history.'}
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
            onClick={() => setActiveMode('exercise_swap')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'exercise_swap'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Dumbbell className="h-3.5 w-3.5" />
            <span>{isAr ? 'تبديل تمرين فردي' : 'Substitute Exercise'}</span>
            {fullCurrentExercise && (
              <span className="text-[10px] opacity-80 truncate max-w-[120px]">
                ({isAr && fullCurrentExercise.nameAr ? fullCurrentExercise.nameAr : fullCurrentExercise.name})
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveMode('day_swap')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'day_swap'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>{isAr ? 'تبديل جدول/روتين اليوم كاملاً' : 'Switch Entire Day Split'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {activeMode === 'exercise_swap' ? (
            /* ================= EXERCISE SUBSTITUTION MODE ================= */
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

                  <div className="text-right sm:text-left">
                    <span className="text-[11px] text-amber-300/90 font-medium">
                      {isAr ? 'سيتم نقل الأوزان وسجل التقدم تلقائياً' : 'Historical calibration applied automatically'}
                    </span>
                  </div>
                </div>
              )}

              {/* Reason & Joint-Friendly Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/20 p-3 rounded-2xl border border-border">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1.5">
                    {isAr ? 'سبب التبديل (اختياري للتوثيق):' : 'Substitution Reason:'}
                  </label>
                  <select
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="fatigue">{isAr ? 'إجهاد عضلي / ألم مفاصل خفيف' : 'Muscle soreness / Joint fatigue'}</option>
                    <option value="equipment">{isAr ? 'الجهاز مشغول أو غير متوفر' : 'Equipment busy or unavailable'}</option>
                    <option value="variety">{isAr ? 'تفضيل تنويع التمرين' : 'Preference & Muscle variation'}</option>
                    <option value="other">{isAr ? 'سبب آخر' : 'Other reason'}</option>
                  </select>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-0">
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
                    <span>{isAr ? 'خيارات صديقة للمفاصل (كوابل وأجهزة)' : 'Joint-Friendly (Cables/Machines)'}</span>
                  </button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground rtl:right-auto rtl:left-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isAr ? 'بحث بالاسم، العضلة، أو نوع الأداة...' : 'Search alternative exercise by name or muscle...'}
                    className="w-full rounded-xl border border-border bg-card py-2 px-9 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Muscle Filter Chips */}
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {[
                    { id: 'all', nameEn: 'All Muscles', nameAr: 'جميع العضلات' },
                    { id: 'chest', nameEn: 'Chest', nameAr: 'الصدر' },
                    { id: 'back', nameEn: 'Back / Lats', nameAr: 'الظهر واللاتس' },
                    { id: 'shoulder', nameEn: 'Shoulders', nameAr: 'الأكتاف' },
                    { id: 'bicep', nameEn: 'Biceps', nameAr: 'البايسبس' },
                    { id: 'tricep', nameEn: 'Triceps', nameAr: 'الترايسبس' },
                    { id: 'quad', nameEn: 'Quads', nameAr: 'الفخذ الأمامي' },
                    { id: 'hamstring', nameEn: 'Hamstrings', nameAr: 'الفخذ الخلفي' },
                    { id: 'core', nameEn: 'Core / Abs', nameAr: 'البطن والكور' },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMuscle(m.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        selectedMuscle === m.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {isAr ? m.nameAr : m.nameEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Candidate Exercises Grid */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{isAr ? `التمارين البديلة المقترحة (${candidateExercises.length}):` : `Suggested Alternative Exercises (${candidateExercises.length}):`}</span>
                  <span className="text-[11px]">{isAr ? 'اضغط على التمرين لتثبيته فوراً' : 'Click exercise to substitute'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                  {candidateExercises.map(ex => {
                    const advice = PPLEngine.calculateProgression(ex.id, history);
                    const title = isAr && ex.nameAr ? ex.nameAr : ex.name;
                    const muscle = isAr && ex.primaryMuscleAr ? ex.primaryMuscleAr : ex.primaryMuscle;
                    const equip = isAr && ex.equipmentAr ? ex.equipmentAr : ex.equipment;

                    return (
                      <div
                        key={ex.id}
                        onClick={() => handleApplyExerciseSwap(ex)}
                        className="group cursor-pointer rounded-2xl border border-border bg-card p-3.5 shadow-sm hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                              {equip}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {ex.targetRepRange} reps
                            </span>
                          </div>

                          <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {title}
                          </h3>

                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {muscle} • {ex.level}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[11px]">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>
                              {isAr ? `الوزن المقترح: ${advice.recommendedWeight} كجم` : `Suggested: ${advice.recommendedWeight} kg`}
                            </span>
                          </div>

                          <span className="font-bold text-primary flex items-center gap-0.5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                            {isAr ? 'اختيار' : 'Select'}
                            <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ================= DAY SPLIT SUBSTITUTION MODE ================= */
            <div className="space-y-4">
              {/* Day Swap Guidance Banner */}
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                  <Sparkles className="h-4 w-4" />
                  <span>{isAr ? 'حرية تدريبية كاملة دون كسر جدول البرنامج الأساسي' : 'Full Adaptive Freedom Without Breaking Core Split'}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isAr 
                    ? 'إذا شعرت بإجهاد في عضلات معينة اليوم (مثل الأرجل أو أسفل الظهر)، يمكنك اختيار جدول تدريب آخر. سيقوم المحرك الذكي بتسجيل هذا التبديل وتكييف أوزان الجلسة المختارة فوراً.'
                    : 'If experiencing soreness or fatigue in today\'s target muscles (e.g. Legs), choose an alternative routine. The engine auto-calibrates weights and logs it as a structured substitution.'}
                </p>
              </div>

              {/* Day Swap Reason */}
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                  {isAr ? 'سبب تبديل جدول اليوم:' : 'Reason for Day Split Change:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'muscle_fatigue', nameEn: 'Legs/Back Fatigue', nameAr: 'إجهاد أرجل / ظهر' },
                    { id: 'joint_care', nameEn: 'Joint Deload', nameAr: 'حماية المفاصل' },
                    { id: 'time_limit', nameEn: 'Short Session', nameAr: 'ضيق الوقت' },
                    { id: 'home_preference', nameEn: 'Home Training', nameAr: 'تمرين منزلي' },
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setDaySwapReason(r.id)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        daySwapReason === r.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-muted-foreground border-border hover:text-foreground'
                      }`}
                    >
                      {isAr ? r.nameAr : r.nameEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Splits Grid Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">
                  {isAr ? 'اختر الروتين البديل لليوم:' : 'Select Alternative Workout Split:'}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {availableSplits.map(split => {
                    const isSelected = selectedSplitId === split.id;
                    const isCurrentScheduled = activeWorkout?.type === split.id;

                    return (
                      <div
                        key={split.id}
                        onClick={() => setSelectedSplitId(split.id)}
                        className={`cursor-pointer rounded-2xl border p-4 transition-all flex flex-col justify-between ${
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

                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                            {isAr ? split.descriptionAr : split.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
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
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>{isAr ? 'تأكيد وبدء هذا الجدول' : 'Confirm & Start This Split'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
