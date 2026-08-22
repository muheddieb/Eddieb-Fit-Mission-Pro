import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Check, 
  Timer, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Flame, 
  Info, 
  RefreshCw, 
  Trophy, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Volume2, 
  VolumeX,
  Play,
  Pause,
  ArrowRight,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { WorkoutSession, WorkoutExercise, SetLog, UserProfile, Exercise } from '../../types';
import { translations } from '../../i18n/translations';
import { PPLEngine, ProgressionAdvice } from '../../services/pplEngine';
import { StorageService } from '../../services/storage';
import { WakeLockService } from '../../services/wakeLockService';

interface ActiveWorkoutModalProps {
  workout: WorkoutSession;
  profile: UserProfile;
  onSaveWorkout: (workout: WorkoutSession) => void;
  onFinishWorkout: (workout: WorkoutSession) => void;
  onClose: () => void;
  onOpenExerciseDetails: (exercise: Exercise) => void;
}

export const ActiveWorkoutModal: React.FC<ActiveWorkoutModalProps> = ({
  workout: initialWorkout,
  profile,
  onSaveWorkout,
  onFinishWorkout,
  onClose,
  onOpenExerciseDetails,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [workout, setWorkout] = useState<WorkoutSession>(initialWorkout);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  
  // Rest timer states
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [swapExerciseOpen, setSwapExerciseOpen] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // Acquire Screen Wake Lock on workout open, release on close
  useEffect(() => {
    WakeLockService.acquire(profile.screenWakeDuration || 'never');
    return () => {
      WakeLockService.release();
    };
  }, [profile.screenWakeDuration]);

  // Sync workout to storage whenever modified
  useEffect(() => {
    onSaveWorkout(workout);
  }, [workout]);

  // Audio tone generator using Web Audio API for timer completion
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('AudioContext beep failed:', e);
    }
  };

  // Timer interval
  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            playBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [timerActive, timerSeconds, soundEnabled]);

  const startTimer = (seconds: number) => {
    setTimerSeconds(seconds);
    setTimerActive(true);
  };

  const adjustTimer = (delta: number) => {
    setTimerSeconds(prev => Math.max(0, prev + delta));
  };

  const currentExercise = workout.exercises[currentExerciseIndex] || workout.exercises[0];
  const fullExerciseData = PPLEngine.getExerciseById(currentExercise?.exerciseId);

  // Progressive overload advice for the current exercise
  const history = StorageService.getWorkoutHistory();
  const progressionAdvice = fullExerciseData 
    ? PPLEngine.calculateProgression(fullExerciseData.id, history)
    : null;

  // Handler: Update set values
  const handleUpdateSet = (setId: string, field: keyof SetLog, value: any) => {
    const updatedExercises = workout.exercises.map((ex, idx) => {
      if (idx !== currentExerciseIndex) return ex;
      const updatedSets = ex.sets.map(s => {
        if (s.id === setId) {
          return { ...s, [field]: value };
        }
        return s;
      });

      const allDone = updatedSets.every(s => s.completed);
      return { ...ex, sets: updatedSets, completed: allDone };
    });

    setWorkout({ ...workout, exercises: updatedExercises });
  };

  // Toggle set completion and trigger rest timer
  const handleToggleSetCompletion = (setLog: SetLog) => {
    const nextCompleted = !setLog.completed;
    handleUpdateSet(setLog.id, 'completed', nextCompleted);

    if (nextCompleted) {
      // Trigger rest timer based on exercise rest specification
      const rest = currentExercise.restSeconds || 90;
      startTimer(rest);
    }
  };

  // Add extra set
  const handleAddSet = () => {
    const lastSet = currentExercise.sets[currentExercise.sets.length - 1];
    const newSet: SetLog = {
      id: 'set_' + Date.now(),
      setNumber: currentExercise.sets.length + 1,
      targetReps: lastSet ? lastSet.targetReps : 10,
      actualReps: lastSet ? lastSet.actualReps : 10,
      targetWeight: lastSet ? lastSet.targetWeight : 50,
      actualWeight: lastSet ? lastSet.actualWeight : 50,
      rpe: lastSet ? lastSet.rpe : 8,
      completed: false,
    };

    const updatedExercises = workout.exercises.map((ex, idx) => {
      if (idx !== currentExerciseIndex) return ex;
      return {
        ...ex,
        sets: [...ex.sets, newSet],
        completed: false,
      };
    });

    setWorkout({ ...workout, exercises: updatedExercises });
  };

  // Remove set
  const handleRemoveSet = (setId: string) => {
    if (currentExercise.sets.length <= 1) return;

    const updatedExercises = workout.exercises.map((ex, idx) => {
      if (idx !== currentExerciseIndex) return ex;
      const remainingSets = ex.sets
        .filter(s => s.id !== setId)
        .map((s, i) => ({ ...s, setNumber: i + 1 }));

      const allDone = remainingSets.length > 0 && remainingSets.every(s => s.completed);
      return {
        ...ex,
        sets: remainingSets,
        completed: allDone,
      };
    });

    setWorkout({ ...workout, exercises: updatedExercises });
  };

  // Exercise substitution
  const handleSwapExercise = (newExercise: Exercise) => {
    const updatedExercises = workout.exercises.map((ex, idx) => {
      if (idx !== currentExerciseIndex) return ex;
      return {
        exerciseId: newExercise.id,
        exerciseName: newExercise.name,
        exerciseNameAr: newExercise.nameAr,
        primaryMuscle: newExercise.primaryMuscle,
        targetRpe: 8,
        restSeconds: newExercise.restSeconds,
        sets: ex.sets.map(s => ({
          ...s,
          completed: false,
        })),
        completed: false,
      };
    });

    setWorkout({ ...workout, exercises: updatedExercises });
    setSwapExerciseOpen(false);
  };

  // Finish Workout
  const handleFinish = () => {
    // Calculate final metrics
    let totalVolume = 0;
    workout.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) {
          totalVolume += (s.actualWeight || 0) * (s.actualReps || 0);
        }
      });
    });

    const finishedWorkout: WorkoutSession = {
      ...workout,
      completed: true,
      durationMinutes: Math.max(15, Math.round((Date.now() - workout.timestamp) / 60000)),
      totalVolumeKg: totalVolume,
      notes: workout.notes || 'Workout completed with progressive overload discipline.',
    };

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // safe fallback
    }

    WakeLockService.release();
    onFinishWorkout(finishedWorkout);
  };

  const substitutes = fullExerciseData
    ? PPLEngine.getAlternativeExercises(fullExerciseData.id)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Session Action Bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Flame className="h-5 w-5 fill-current" />
          </div>
          <div>
            <h2 className="text-base font-black text-foreground sm:text-lg">
              {isAr ? workout.nameAr || workout.name : workout.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="capitalize">{workout.type}</span>
              <span>•</span>
              <span>{workout.exercises.filter(e => e.completed).length}/{workout.exercises.length} {t.common.completed}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-sound-toggle-workout"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title={soundEnabled ? 'Timer Sound On' : 'Timer Sound Off'}
          >
            {soundEnabled ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5" />}
          </button>
          
          <button
            id="btn-finish-workout-top"
            onClick={handleFinish}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-colors"
          >
            <Trophy className="h-4 w-4" />
            <span>{t.workout.finishWorkout}</span>
          </button>

          <button
            id="btn-close-active-workout"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Minimize workout"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Active Workout Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        <div className="mx-auto max-w-4xl space-y-5">
          {/* Exercise Selector Horizontal Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {workout.exercises.map((ex, idx) => (
              <button
                key={ex.exerciseId + idx}
                id={`pill-ex-${idx}`}
                onClick={() => setCurrentExerciseIndex(idx)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  idx === currentExerciseIndex
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
                    : ex.completed
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-card text-muted-foreground border border-border hover:bg-secondary'
                }`}
              >
                <span>{idx + 1}.</span>
                <span className="truncate max-w-[120px] sm:max-w-[160px]">
                  {isAr && ex.exerciseNameAr ? ex.exerciseNameAr : ex.exerciseName}
                </span>
                {ex.completed && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>

          {/* Current Exercise Card with Framer Motion Transition */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentExerciseIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="rounded-2xl border border-border bg-card p-5 shadow-lg"
            >
              {/* Header info & quick action icons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-foreground">
                      {isAr && currentExercise.exerciseNameAr ? currentExercise.exerciseNameAr : currentExercise.exerciseName}
                    </h3>
                    <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground font-medium">
                      {currentExercise.primaryMuscle}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.workout.targetReps}: {fullExerciseData?.targetRepRange || '8-10'} • {t.workout.rpe}: {currentExercise.targetRpe} • {t.workout.rest}: {currentExercise.restSeconds}s
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {fullExerciseData && (
                    <button
                      id="btn-view-exercise-guide"
                      onClick={() => onOpenExerciseDetails(fullExerciseData)}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                    >
                      <Info className="h-4 w-4 text-primary" />
                      <span>{t.common.guideAndVideo}</span>
                    </button>
                  )}

                  <button
                    id="btn-swap-exercise-toggle"
                    onClick={() => setSwapExerciseOpen(!swapExerciseOpen)}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{t.workout.substitute}</span>
                  </button>
                </div>
              </div>

              {/* Progressive Overload Advisor Banner */}
              {progressionAdvice && (
                <div className="mt-4 rounded-xl border border-primary/25 bg-primary/10 p-3.5 flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold text-foreground mb-0.5">
                      {t.workout.progression}: {progressionAdvice.recommendedWeight} kg ({progressionAdvice.status.toUpperCase()})
                    </div>
                    <div className="text-muted-foreground">
                      {isAr ? progressionAdvice.reasonAr : progressionAdvice.reason}
                    </div>
                  </div>
                </div>
              )}

              {/* Substitution Drawer (if opened) */}
              <AnimatePresence>
                {swapExerciseOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden rounded-xl border border-border bg-secondary/40 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground">
                        {isAr ? 'بدائل مطابقة لنفس المسار الحركي:' : 'Biomechanical Movement Substitutes:'}
                      </h4>
                      <button
                        id="btn-close-substitutes"
                        onClick={() => setSwapExerciseOpen(false)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {t.common.cancel}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {substitutes.map(sub => (
                        <button
                          key={sub.id}
                          id={`btn-swap-to-${sub.id}`}
                          onClick={() => handleSwapExercise(sub)}
                          className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5 text-left hover:border-primary/40 hover:bg-card/80 transition-colors"
                        >
                          <div>
                            <div className="text-xs font-bold text-foreground">
                              {isAr && sub.nameAr ? sub.nameAr : sub.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {sub.equipment} • {sub.difficulty}
                            </div>
                          </div>
                          <span className="text-xs font-bold text-primary">{t.workout.substitute}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sets Logging Table with Framer Motion Layout Transitions */}
              <div className="mt-6 space-y-3">
                <div className="grid grid-cols-12 gap-2 text-center text-xs font-bold text-muted-foreground px-2">
                  <div className="col-span-2 text-left">{t.workout.set}</div>
                  <div className="col-span-3">{t.workout.weight} (kg)</div>
                  <div className="col-span-3">{t.workout.reps}</div>
                  <div className="col-span-2">{t.workout.rpe}</div>
                  <div className="col-span-2">{t.common.done}</div>
                </div>

                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {currentExercise.sets.map((setLog) => (
                      <motion.div
                        key={setLog.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, height: 0 }}
                        transition={{ duration: 0.16 }}
                        className={`grid grid-cols-12 items-center gap-2 rounded-xl border p-2.5 transition-colors ${
                          setLog.completed
                            ? 'border-emerald-500/40 bg-emerald-500/10'
                            : 'border-border bg-secondary/30'
                        }`}
                      >
                        {/* Set Number */}
                        <div className="col-span-2 flex items-center gap-1.5 font-bold text-foreground text-sm">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs">
                            {setLog.setNumber}
                          </span>
                        </div>

                        {/* Weight Input */}
                        <div className="col-span-3">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={setLog.actualWeight || ''}
                            onChange={e => handleUpdateSet(setLog.id, 'actualWeight', parseFloat(e.target.value) || 0)}
                            placeholder="kg"
                            className="w-full rounded-lg border border-border bg-card py-1.5 text-center text-sm font-bold text-foreground focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>

                        {/* Reps Input */}
                        <div className="col-span-3">
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={setLog.actualReps || ''}
                            onChange={e => handleUpdateSet(setLog.id, 'actualReps', parseInt(e.target.value, 10) || 0)}
                            placeholder="Reps"
                            className="w-full rounded-lg border border-border bg-card py-1.5 text-center text-sm font-bold text-foreground focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>

                        {/* RPE Selector (1 - 10) */}
                        <div className="col-span-2">
                          <select
                            value={setLog.rpe || 8}
                            onChange={e => handleUpdateSet(setLog.id, 'rpe', parseFloat(e.target.value))}
                            className="w-full rounded-lg border border-border bg-card py-1.5 text-center text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                          >
                            <option value="6">6 (Warmup)</option>
                            <option value="7">7 (3 RIR)</option>
                            <option value="7.5">7.5</option>
                            <option value="8">8 (2 RIR)</option>
                            <option value="8.5">8.5</option>
                            <option value="9">9 (1 RIR)</option>
                            <option value="9.5">9.5</option>
                            <option value="10">10 (Failure)</option>
                          </select>
                        </div>

                        {/* Completed Checkbox */}
                        <div className="col-span-2 flex justify-center">
                          <button
                            id={`btn-toggle-set-${setLog.id}`}
                            onClick={() => handleToggleSetCompletion(setLog)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                              setLog.completed
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-105'
                                : 'border border-border bg-card text-muted-foreground hover:bg-secondary'
                            }`}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Set management buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    id="btn-add-extra-set"
                    onClick={handleAddSet}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t.workout.addSet}</span>
                  </button>

                  {currentExercise.sets.length > 1 && (
                    <button
                      id="btn-remove-last-set"
                      onClick={() => handleRemoveSet(currentExercise.sets[currentExercise.sets.length - 1].id)}
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{t.common.delete}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation between exercises */}
          <div className="flex items-center justify-between">
            <button
              id="btn-prev-exercise"
              onClick={() => setCurrentExerciseIndex(prev => Math.max(0, prev - 1))}
              disabled={currentExerciseIndex === 0}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground disabled:opacity-40 hover:bg-secondary transition-colors"
            >
              {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              <span>{t.workout.prevExercise}</span>
            </button>

            <span className="text-xs text-muted-foreground font-medium">
              {currentExerciseIndex + 1} / {workout.exercises.length}
            </span>

            <button
              id="btn-next-exercise"
              onClick={() => setCurrentExerciseIndex(prev => Math.min(workout.exercises.length - 1, prev + 1))}
              disabled={currentExerciseIndex === workout.exercises.length - 1}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              <span>{t.workout.nextExercise}</span>
              {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Interactive Rest Timer Bar */}
      <div className="border-t border-border bg-card/95 p-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                {t.workout.restTimer}
              </div>
              <div className="text-lg font-black text-foreground font-mono">
                {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-timer-minus-15"
              onClick={() => adjustTimer(-15)}
              className="rounded-lg border border-border bg-secondary/50 px-2 py-1 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
            >
              -15s
            </button>
            <button
              id="btn-timer-plus-30"
              onClick={() => adjustTimer(30)}
              className="rounded-lg border border-border bg-secondary/50 px-2 py-1 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
            >
              +30s
            </button>

            {timerActive ? (
              <button
                id="btn-pause-timer"
                onClick={() => setTimerActive(false)}
                className="flex items-center gap-1 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
              >
                <Pause className="h-3.5 w-3.5" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                id="btn-start-timer-90"
                onClick={() => startTimer(currentExercise.restSeconds || 90)}
                className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{t.workout.startRest}</span>
              </button>
            )}

            {timerSeconds > 0 && (
              <button
                id="btn-reset-timer"
                onClick={() => {
                  setTimerSeconds(0);
                  setTimerActive(false);
                }}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
