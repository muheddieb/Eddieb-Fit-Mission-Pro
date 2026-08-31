import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  TrendingDown,
  Equal,
  Zap,
  Volume2, 
  VolumeX,
  Play,
  Pause,
  ArrowRight,
  Radio,
  Home,
  FastForward,
  Music,
  CheckCircle2,
  Sparkles,
  Bell,
  Award,
  Calculator,
  Gauge
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { WorkoutSession, WorkoutExercise, SetLog, UserProfile, Exercise, RestSoundType, PersonalRecordEvent } from '../../types';
import { translations } from '../../i18n/translations';
import { PPLEngine, ProgressionAdvice } from '../../services/pplEngine';
import { StorageService } from '../../services/storage';
import { WakeLockService } from '../../services/wakeLockService';
import { AudioService } from '../../services/audioService';
import { PRService } from '../../services/prService';
import { RPECalculatorService, RPESuggestionResult } from '../../services/rpeService';
import { ConfettiEffect } from '../../utils/confetti';
import { PRAchievementToast } from '../common/PRAchievementToast';
import { SmartWarmupModal } from './SmartWarmupModal';
import { ExerciseHistoryComparison } from './ExerciseHistoryComparison';
import { RPECalculatorModal } from './RPECalculatorModal';

interface ActiveWorkoutModalProps {
  workout: WorkoutSession;
  profile: UserProfile;
  onSaveWorkout: (workout: WorkoutSession) => void;
  onFinishWorkout: (workout: WorkoutSession) => void;
  onClose: () => void;
  onOpenExerciseDetails: (exercise: Exercise) => void;
}

// Preset weights from 0 kg to 200 kg with fine-grained increments
const WEIGHT_OPTIONS: number[] = [
  0, 1, 2, 2.5, 3, 4, 5, 6, 7, 7.5, 8, 9, 10, 
  12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40, 
  42.5, 45, 47.5, 50, 52.5, 55, 57.5, 60, 62.5, 65, 67.5, 70, 
  72.5, 75, 77.5, 80, 82.5, 85, 87.5, 90, 95, 100, 105, 110, 
  115, 120, 125, 130, 135, 140, 145, 150, 160, 170, 180, 190, 200
];

// Preset reps from 1 to 50
const REPS_OPTIONS: number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 
  16, 17, 18, 19, 20, 22, 24, 25, 28, 30, 35, 40, 45, 50
];

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
  const [totalTimerDuration, setTotalTimerDuration] = useState<number>(90);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [restCompleteToast, setRestCompleteToast] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedSound, setSelectedSound] = useState<RestSoundType>(profile.restSoundType || 'beep');
  const [swapExerciseOpen, setSwapExerciseOpen] = useState<boolean>(false);
  const [soundPickerOpen, setSoundPickerOpen] = useState<boolean>(false);
  const [showRestPresets, setShowRestPresets] = useState<boolean>(false);
  const [smartWarmupOpen, setSmartWarmupOpen] = useState<boolean>(false);
  
  // RPE Calculator & Auto-Regulation State
  const [rpeCalculatorOpen, setRpeCalculatorOpen] = useState<boolean>(false);
  const [rpeCalcInitialData, setRpeCalcInitialData] = useState<{ weight?: number; reps?: number; rpe?: number } | null>(null);

  // Achievement Confetti & PR Celebration State
  const [activePRToast, setActivePRToast] = useState<PersonalRecordEvent | null>(null);

  const timerRef = useRef<any>(null);
  const hasTriggeredStartCue = useRef<boolean>(false);
  // Tracks exercise IDs that have been automatically prefilled in this session
  const autoPrefilledExerciseIds = useRef<Set<string>>(new Set());

  // Play Workout Start Audio Cue on modal mount
  useEffect(() => {
    if (!hasTriggeredStartCue.current && soundEnabled) {
      AudioService.playWorkoutStartCue(0.3);
      hasTriggeredStartCue.current = true;
    }
  }, [soundEnabled]);

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

  // Play configured rest completion sound (beep / whistle / chime / buzzer / bell)
  const triggerRestSound = () => {
    if (!soundEnabled) return;
    AudioService.playSound(selectedSound, 0.45);
  };

  // Timer countdown interval with 5-second prepare chime, 3-2-1 countdown audio cues & end cue
  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            setRestCompleteToast(true);
            triggerRestSound();

            // Try sending a browser system notification if permitted
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(isAr ? 'انتهت فترة الراحة!' : 'Rest Complete!', {
                  body: isAr ? 'حان وقت أداء مجموعتك التالية بكامل قوتك.' : 'Time to crush your next set.',
                  icon: '/favicon.ico',
                });
              } catch {
                // safe fallback
              }
            }
            return 0;
          }
          // 5-second prepare cue: subtle chime to signal user to prepare for next set
          if (prev === 6) {
            if (soundEnabled) {
              AudioService.playPrepareChime(0.22);
            }
          }
          // 3-2-1 transition warnings
          if (prev === 4 || prev === 3 || prev === 2) {
            if (soundEnabled) {
              AudioService.playCountdownWarning(prev - 1, 0.25);
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [timerActive, timerSeconds, soundEnabled, selectedSound, isAr]);

  const startTimer = (seconds: number) => {
    const duration = Math.max(5, seconds);
    setTotalTimerDuration(duration);
    setTimerSeconds(duration);
    setTimerActive(true);
    setRestCompleteToast(false);
    if (soundEnabled) {
      AudioService.playRestStartCue(0.25);
    }
  };

  const endRestImmediately = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerSeconds(0);
    setTimerActive(false);
    setRestCompleteToast(false);
    if (soundEnabled) {
      AudioService.playRestSkipCue(0.25);
    }
  };

  const adjustTimer = (delta: number) => {
    setRestCompleteToast(false);
    setTimerSeconds(prev => {
      const next = Math.max(0, prev + delta);
      if (next > totalTimerDuration) {
        setTotalTimerDuration(next);
      }
      if (next > 0 && !timerActive) {
        setTimerActive(true);
      }
      return next;
    });
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
    let prDetected: PersonalRecordEvent | null = null;

    const updatedExercises = workout.exercises.map((ex, idx) => {
      if (idx !== currentExerciseIndex) return ex;
      const updatedSets = ex.sets.map(s => {
        if (s.id === setId) {
          const updated = { ...s, [field]: value };
          // If set is completed and user changed weight/reps, re-evaluate PR
          if (updated.completed && (field === 'actualWeight' || field === 'actualReps')) {
            const pr = PRService.checkForPR(
              ex.exerciseId,
              ex.exerciseName,
              ex.exerciseNameAr,
              updated,
              history,
              workout
            );
            if (pr) {
              updated.isPR = true;
              updated.prType = pr.prType;
              prDetected = pr;
            } else {
              updated.isPR = false;
              updated.prType = undefined;
            }
          }
          return updated;
        }
        return s;
      });

      const allDone = updatedSets.every(s => s.completed);
      return { ...ex, sets: updatedSets, completed: allDone };
    });

    setWorkout({ ...workout, exercises: updatedExercises });

    if (prDetected) {
      ConfettiEffect.triggerPRAchievement();
      if (soundEnabled) {
        AudioService.playPRAchievementCue(0.35);
      }
      setActivePRToast(prDetected);
    }
  };

  // Toggle set completion, evaluate PR records, trigger Confetti animation and rest timer
  const handleToggleSetCompletion = (setLog: SetLog) => {
    const nextCompleted = !setLog.completed;
    let prDetected: PersonalRecordEvent | null = null;

    if (nextCompleted) {
      // Check for Personal Record (Weight PR or Volume PR)
      const candidateSet: SetLog = {
        ...setLog,
        completed: true,
      };
      prDetected = PRService.checkForPR(
        currentExercise.exerciseId,
        currentExercise.exerciseName,
        currentExercise.exerciseNameAr,
        candidateSet,
        history,
        workout
      );
    }

    const updatedExercises = workout.exercises.map((ex, idx) => {
      if (idx !== currentExerciseIndex) return ex;
      const updatedSets = ex.sets.map(s => {
        if (s.id === setLog.id) {
          return { 
            ...s, 
            completed: nextCompleted,
            isPR: nextCompleted && prDetected ? true : (nextCompleted ? s.isPR : false),
            prType: nextCompleted && prDetected ? prDetected.prType : (nextCompleted ? s.prType : undefined),
          };
        }
        return s;
      });

      const allDone = updatedSets.every(s => s.completed);
      return { ...ex, sets: updatedSets, completed: allDone };
    });

    setWorkout({ ...workout, exercises: updatedExercises });

    if (nextCompleted) {
      if (prDetected) {
        // Trigger high-impact multi-stage achievement confetti effect!
        ConfettiEffect.triggerPRAchievement();
        if (soundEnabled) {
          AudioService.playPRAchievementCue(0.35);
        }
        setActivePRToast(prDetected);
      } else {
        if (soundEnabled) {
          AudioService.playBeep(880, 0.1, 0.2);
        }
      }

      // Trigger rest timer based on exercise rest specification
      const rest = currentExercise.restSeconds || 90;
      startTimer(rest);
    }
  };

  /**
   * Helper function that automatically pre-fills the input fields with the last session's
   * weight and reps for the current or specified exercise to streamline progression tracking.
   *
   * @param exerciseIndex - The target exercise index in workout.exercises (default: currentExerciseIndex)
   * @param forceOverride - If true, replaces existing values even if not pristine
   * @returns boolean - Whether historical sets were found and successfully pre-filled
   */
  const prefillExerciseWithLastSession = useCallback((
    exerciseIndex: number = currentExerciseIndex,
    forceOverride: boolean = false
  ): boolean => {
    const targetExercise = workout.exercises[exerciseIndex];
    if (!targetExercise) return false;

    const { lastSession } = PPLEngine.getExerciseComparison(targetExercise.exerciseId, history);
    if (!lastSession || !lastSession.sets || lastSession.sets.length === 0) {
      return false;
    }

    let modified = false;
    const updatedExercises = workout.exercises.map((ex, idx) => {
      if (idx !== exerciseIndex) return ex;

      const updatedSets = ex.sets.map((s, sIdx) => {
        // Do not overwrite completed sets unless explicitly forced
        if (s.completed && !forceOverride) return s;

        const prevSet = lastSession.sets[sIdx] || lastSession.sets[lastSession.sets.length - 1];
        if (!prevSet) return s;

        modified = true;
        return {
          ...s,
          targetWeight: prevSet.weight,
          actualWeight: prevSet.weight,
          targetReps: prevSet.reps,
          actualReps: prevSet.reps,
          rpe: prevSet.rpe ?? s.rpe ?? 8,
        };
      });

      return { ...ex, sets: updatedSets };
    });

    if (modified) {
      setWorkout(prev => ({ ...prev, exercises: updatedExercises }));
      return true;
    }
    return false;
  }, [workout.exercises, currentExerciseIndex, history]);

  // Automatically pre-fill the current exercise's input fields with last session's weight and reps
  useEffect(() => {
    const ex = workout.exercises[currentExerciseIndex];
    if (!ex) return;

    if (!autoPrefilledExerciseIds.current.has(ex.exerciseId)) {
      const anyCompleted = ex.sets.some(s => s.completed);
      if (!anyCompleted) {
        const success = prefillExerciseWithLastSession(currentExerciseIndex, false);
        if (success) {
          autoPrefilledExerciseIds.current.add(ex.exerciseId);
        }
      }
    }
  }, [currentExerciseIndex, prefillExerciseWithLastSession, workout.exercises]);

  // Handler: Apply preset sets from history comparison shortcuts
  const handleApplyPresetSets = (newSetsData: Partial<SetLog>[]) => {
    const updatedExercises = workout.exercises.map((ex, idx) => {
      if (idx !== currentExerciseIndex) return ex;
      const updatedSets = ex.sets.map((s, sIdx) => {
        const preset = newSetsData[sIdx];
        if (!preset) return s;
        return {
          ...s,
          ...preset,
        };
      });
      return { ...ex, sets: updatedSets };
    });

    setWorkout({ ...workout, exercises: updatedExercises });
    if (soundEnabled) {
      AudioService.playBeep(880, 0.1, 0.2);
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
    if (soundEnabled) {
      AudioService.playBeep(880, 0.1, 0.2);
    }
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
    // Allow new exercise to be auto-prefilled from its own history
    autoPrefilledExerciseIds.current.delete(newExercise.id);

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

  // Finish Workout with audio cue
  const handleFinish = () => {
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
      durationMinutes: Math.max(15, Math.round((Date.now() - (workout.startedAt || workout.timestamp || Date.now())) / 60000)),
      totalVolumeKg: totalVolume,
      notes: workout.notes || 'Mission accomplished with progressive overload and fat loss focus.',
    };

    // Play victory finish fanfare audio cue
    if (soundEnabled) {
      AudioService.playWorkoutEndCue(0.35);
    }

    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    WakeLockService.release();
    onFinishWorkout(finishedWorkout);
  };

  const substitutes = fullExerciseData
    ? PPLEngine.getAlternativeExercises(fullExerciseData.id)
    : [];

  const comparisonData = PPLEngine.getExerciseComparison(currentExercise?.exerciseId, history);

  // Computed Rest Timer Variables
  const progressFraction = totalTimerDuration > 0 ? (timerSeconds / totalTimerDuration) : 0;
  const elapsedPercent = Math.min(100, Math.max(0, (1 - progressFraction) * 100));
  const remainingPercent = Math.min(100, Math.max(0, progressFraction * 100));

  // Determine next upcoming set in this exercise or next exercise
  const uncompletedSets = currentExercise ? currentExercise.sets.filter(s => !s.completed) : [];
  const nextSet = uncompletedSets[0];
  const nextExercise = workout.exercises[currentExerciseIndex + 1];

  // Dynamic RPE Auto-Regulation Suggestion calculation based on most recent completed set
  const completedSetsForCurrentExercise = currentExercise ? currentExercise.sets.filter(s => s.completed) : [];
  const lastCompletedSet = completedSetsForCurrentExercise[completedSetsForCurrentExercise.length - 1];
  
  const liveRpeSuggestion: RPESuggestionResult | null = useMemo(() => {
    if (!lastCompletedSet || uncompletedSets.length === 0) return null;
    return RPECalculatorService.calculateSuggestion({
      currentWeight: lastCompletedSet.actualWeight || 0,
      actualReps: lastCompletedSet.actualReps || 1,
      actualRpe: lastCompletedSet.rpe || 8,
      targetRpe: currentExercise.targetRpe || 8,
      targetReps: typeof nextSet?.targetReps === 'number' 
        ? nextSet.targetReps 
        : (typeof nextSet?.targetReps === 'string' ? parseInt(nextSet.targetReps, 10) || 10 : 10),
      exerciseName: currentExercise.exerciseName,
    });
  }, [lastCompletedSet, uncompletedSets.length, currentExercise?.targetRpe, currentExercise?.exerciseName, nextSet?.targetReps]);

  // Handler: Apply RPE suggested weight to next incomplete set
  const handleApplyRPEWeightToNextSet = (suggestedWeight: number, targetReps?: number, targetRpe?: number) => {
    if (!nextSet) return;
    const updatedExercises = workout.exercises.map((ex, idx) => {
      if (idx !== currentExerciseIndex) return ex;
      const updatedSets = ex.sets.map(s => {
        if (s.id === nextSet.id) {
          return {
            ...s,
            targetWeight: suggestedWeight,
            actualWeight: suggestedWeight,
            targetReps: targetReps ?? s.targetReps,
            actualReps: targetReps ?? s.actualReps,
            rpe: targetRpe ?? s.rpe ?? 8,
          };
        }
        return s;
      });
      return { ...ex, sets: updatedSets };
    });

    setWorkout({ ...workout, exercises: updatedExercises });
    if (soundEnabled) {
      AudioService.playBeep(880, 0.1, 0.2);
    }
  };

  // Handler: Apply RPE suggested weight to all remaining incomplete sets
  const handleApplyRPEWeightToAllRemaining = (suggestedWeight: number, targetReps?: number, targetRpe?: number) => {
    const updatedExercises = workout.exercises.map((ex, idx) => {
      if (idx !== currentExerciseIndex) return ex;
      const updatedSets = ex.sets.map(s => {
        if (!s.completed) {
          return {
            ...s,
            targetWeight: suggestedWeight,
            actualWeight: suggestedWeight,
            targetReps: targetReps ?? s.targetReps,
            actualReps: targetReps ?? s.actualReps,
            rpe: targetRpe ?? s.rpe ?? 8,
          };
        }
        return s;
      });
      return { ...ex, sets: updatedSets };
    });

    setWorkout({ ...workout, exercises: updatedExercises });
    if (soundEnabled) {
      AudioService.playBeep(880, 0.1, 0.2);
    }
  };

  // Handler: Open RPE Calculator with optional prefilled values
  const handleOpenRPECalculator = (weight?: number, reps?: number, rpe?: number) => {
    setRpeCalcInitialData({
      weight: weight ?? lastCompletedSet?.actualWeight ?? currentExercise?.sets[0]?.actualWeight ?? 50,
      reps: reps ?? lastCompletedSet?.actualReps ?? currentExercise?.sets[0]?.actualReps ?? 10,
      rpe: rpe ?? lastCompletedSet?.rpe ?? 8,
    });
    setRpeCalculatorOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Session Action Bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Home Screen Navigation Button */}
          <button
            id="btn-workout-to-home"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all shadow-sm"
            title={isAr ? 'العودة للصفحة الرئيسية (التمرين يظل نشطاً)' : 'Back to Home Dashboard (Workout stays active)'}
          >
            <Home className="h-4 w-4" />
            <span>{isAr ? 'الرئيسية' : 'Home'}</span>
          </button>

          <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Flame className="h-5 w-5 fill-current" />
          </div>

          <div>
            <h2 className="text-sm font-black text-foreground sm:text-base">
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
          {/* Sound & Tone Selector Dropdown Trigger */}
          <button
            id="btn-warmup-workout-top"
            onClick={() => setSmartWarmupOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all shadow-sm"
            title={isAr ? 'الإحماء الذكي الديناميكي (5 دقائق)' : '5-Minute Smart Warm-up'}
          >
            <Flame className="h-4 w-4 fill-current" />
            <span className="hidden sm:inline">{isAr ? 'إحماء ذكي (5 د)' : 'Smart Warm-up (5m)'}</span>
            <span className="sm:hidden">{isAr ? 'إحماء' : 'Warm-up'}</span>
          </button>

          <div className="relative">
            <button
              id="btn-sound-toggle-workout"
              onClick={() => setSoundPickerOpen(!soundPickerOpen)}
              className="flex items-center gap-1 rounded-lg border border-border bg-secondary/60 px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
              title={isAr ? 'تغيير صوت وتنبيهات التدريب (Start, End, Rest, Beep)' : 'Workout Audio Cues & Rest Sound Selector'}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-[11px] capitalize hidden sm:inline">{selectedSound}</span>
            </button>

            {soundPickerOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-border p-2 shadow-2xl z-50 space-y-1"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>{isAr ? 'المؤثرات الصوتية للجلسة' : 'Workout Audio Cues'}</span>
                  <Bell className="h-3 w-3 text-primary" />
                </div>
                {(['beep', 'whistle', 'chime', 'buzzer', 'bell'] as RestSoundType[]).map(st => (
                  <button
                    key={st}
                    onClick={() => {
                      setSelectedSound(st);
                      AudioService.preview(st);
                      setSoundPickerOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors ${
                      selectedSound === st
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'text-foreground hover:bg-secondary'
                    }`}
                  >
                    <span className="capitalize">
                      {st === 'beep' ? 'Standard Beep (افتراضي)' :
                       st === 'whistle' ? 'صافرة تدريب (Whistle)' :
                       st === 'chime' ? 'جرس رقمي (Chime)' :
                       st === 'buzzer' ? 'بوق الجيم (Buzzer)' : 'جرس حلبة (Bell)'}
                    </span>
                    {selectedSound === st && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
                <div className="border-t border-border pt-1">
                  <button
                    onClick={() => {
                      setSoundEnabled(!soundEnabled);
                      setSoundPickerOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary"
                  >
                    <span>{soundEnabled ? (isAr ? 'كتم جميع الأصوات' : 'Mute All Audio') : (isAr ? 'تفعيل الأصوات' : 'Unmute Audio')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button
            id="btn-finish-workout-top"
            onClick={handleFinish}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-colors"
          >
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">{t.workout.finishWorkout}</span>
            <span className="sm:hidden">{isAr ? 'إنهاء' : 'Finish'}</span>
          </button>

          <button
            id="btn-close-active-workout"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title={isAr ? 'إخفاء مؤقت والعودة للرئيسية' : 'Minimize workout'}
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

          {/* Current Exercise Card with Motion Transition */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentExerciseIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="rounded-2xl border border-border bg-card p-5 shadow-lg space-y-5"
            >
              {/* Header info & quick action icons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-foreground">
                      {isAr && currentExercise.exerciseNameAr ? currentExercise.exerciseNameAr : currentExercise.exerciseName}
                    </h3>
                    <span className="rounded-lg bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground font-semibold">
                      {currentExercise.primaryMuscle}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.workout.targetReps}: <span className="font-bold text-foreground">{fullExerciseData?.targetRepRange || '8-10'}</span> • {t.workout.rpe}: <span className="font-bold text-foreground">{currentExercise.targetRpe}</span> • {t.workout.rest}: <span className="font-bold text-foreground">{currentExercise.restSeconds}s</span>
                  </p>
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  {/* RPE Auto-Regulation & Load Calculator Button */}
                  <button
                    id="btn-open-rpe-calculator"
                    type="button"
                    onClick={() => handleOpenRPECalculator()}
                    className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all shadow-sm"
                    title={t.workout.rpeCalculatorSubtitle}
                  >
                    <Calculator className="h-3.5 w-3.5" />
                    <span>{t.workout.rpeCalculatorBtn}</span>
                    <span className="rounded-md bg-primary/20 px-1.5 py-0.2 text-[10px] font-black text-primary">
                      RPE {currentExercise.targetRpe || 8}
                    </span>
                  </button>

                  {fullExerciseData && (
                    <button
                      id="btn-view-exercise-guide"
                      onClick={() => onOpenExerciseDetails(fullExerciseData)}
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                    >
                      <Info className="h-4 w-4 text-primary" />
                      <span>{t.common.guideAndVideo}</span>
                    </button>
                  )}

                  <button
                    id="btn-swap-exercise-toggle"
                    onClick={() => setSwapExerciseOpen(!swapExerciseOpen)}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{t.workout.substitute}</span>
                  </button>
                </div>
              </div>

              {/* Progressive Overload Advisor Banner */}
              {progressionAdvice && (
                <div className="rounded-xl border border-primary/25 bg-primary/10 p-3.5 flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold text-foreground mb-0.5">
                      {t.workout.progression}: {progressionAdvice.recommendedWeight} kg ({progressionAdvice.status.toUpperCase()})
                    </div>
                    <div className="text-muted-foreground">
                      {isAr && progressionAdvice.reasonAr ? progressionAdvice.reasonAr : progressionAdvice.reason}
                    </div>
                  </div>
                </div>
              )}

              {/* Historical Performance Comparison & Overload Progression Tracker */}
              <ExerciseHistoryComparison
                currentExercise={currentExercise}
                history={history}
                profile={profile}
                isAr={isAr}
                onApplyPreset={handleApplyPresetSets}
              />

              {/* Exercise Substitute Modal Drawer */}
              <AnimatePresence>
                {swapExerciseOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border border-border bg-secondary/40 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        {isAr ? 'التمارين البديلة لنفس العضلة المستهدفة' : 'Targeted Alternative Exercises'}
                      </span>
                      <button
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
                          onClick={() => handleSwapExercise(sub)}
                          className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5 text-left text-xs font-semibold text-foreground hover:border-primary transition-colors"
                        >
                          <div>
                            <div className="font-bold">{isAr && sub.nameAr ? sub.nameAr : sub.name}</div>
                            <div className="text-[10px] text-muted-foreground">{sub.equipment} • {sub.difficulty}</div>
                          </div>
                          <CheckCircle2 className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sets Logging Table with Dropdown Lists for Weight & Reps */}
              <div className="space-y-3">
                {/* Auto-Prefill Status Indicator with Quick Re-sync Action */}
                {comparisonData.lastSession && comparisonData.lastSession.sets.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3.5 py-2 text-xs">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <Sparkles className="h-4 w-4 text-primary shrink-0" />
                      <span>{t.workout.autoPrefillBadge}</span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        ({comparisonData.lastSession.sets[0]?.weight} kg × {comparisonData.lastSession.sets[0]?.reps} reps)
                      </span>
                    </div>
                    <button
                      id="btn-reapply-last-prefill"
                      type="button"
                      onClick={() => prefillExerciseWithLastSession(currentExerciseIndex, true)}
                      className="text-xs font-bold text-primary hover:underline hover:text-primary/80 transition-colors"
                      title={t.workout.autoPrefilledNote}
                    >
                      {t.workout.quickFillLast}
                    </button>
                  </div>
                )}

                {/* Live In-Exercise Active Rest Banner with Visual Progress Gauge */}
                <AnimatePresence>
                  {timerActive && timerSeconds > 0 && (
                    <motion.div
                      id="banner-in-exercise-rest-timer"
                      initial={{ opacity: 0, height: 0, y: -8 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/15 via-card to-primary/10 p-3.5 shadow-md shadow-primary/10"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                            {/* Circular SVG Gauge */}
                            <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44">
                              <circle
                                cx="22"
                                cy="22"
                                r="17"
                                className="stroke-muted/30"
                                strokeWidth="3.5"
                                fill="transparent"
                              />
                              <circle
                                cx="22"
                                cy="22"
                                r="17"
                                className={`transition-all duration-300 ease-linear ${
                                  timerSeconds <= 5
                                    ? 'stroke-amber-400'
                                    : timerSeconds <= 15
                                      ? 'stroke-cyan-400'
                                      : 'stroke-primary'
                                }`}
                                strokeWidth="3.5"
                                strokeDasharray={106.8}
                                strokeDashoffset={106.8 * (1 - (timerSeconds / (totalTimerDuration || 1)))}
                                strokeLinecap="round"
                                fill="transparent"
                              />
                            </svg>
                            <span className="absolute text-[11px] font-black font-mono text-foreground">
                              {timerSeconds}s
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-black text-foreground">
                              <span>{isAr ? '⏳ استراحة نشطة بين المجموعات' : '⏳ Active Rest Countdown'}</span>
                              {timerSeconds <= 5 && (
                                <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/40 animate-pulse">
                                  {isAr ? '🔔 استعد للمجموعة!' : '🔔 Get Ready!'}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {nextSet ? (
                                <span>
                                  {isAr
                                    ? `المجموعة القادمة: ${nextSet.setNumber} (${nextSet.actualWeight} كجم × ${nextSet.actualReps} تكرار)`
                                    : `Up Next: Set ${nextSet.setNumber} (${nextSet.actualWeight} kg × ${nextSet.actualReps} reps)`}
                                </span>
                              ) : nextExercise ? (
                                <span>
                                  {isAr ? `التالي: ${nextExercise.exerciseNameAr || nextExercise.exerciseName}` : `Next Exercise: ${nextExercise.exerciseName}`}
                                </span>
                              ) : (
                                <span>{isAr ? 'تم إكمال جميع مجموعات هذا التمرين!' : 'All sets for this exercise finished!'}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            id="btn-in-banner-add-30"
                            type="button"
                            onClick={() => adjustTimer(30)}
                            className="rounded-xl border border-border bg-secondary/80 px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
                          >
                            +30s
                          </button>
                          <button
                            id="btn-in-banner-skip-rest"
                            type="button"
                            onClick={endRestImmediately}
                            className="flex items-center gap-1 rounded-xl bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 transition-colors shadow-sm"
                            title={isAr ? 'إنهاء الراحة والبدء بالمجموعة' : 'Skip rest and start next set'}
                          >
                            <FastForward className="h-3.5 w-3.5" />
                            <span>{isAr ? 'تخطي الراحة' : 'Skip Rest'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Live Animated Linear Progress Bar */}
                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary/70">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ease-linear ${
                            timerSeconds <= 5
                              ? 'bg-amber-400'
                              : timerSeconds <= 15
                                ? 'bg-cyan-400'
                                : 'bg-primary'
                          }`}
                          style={{ width: `${elapsedPercent}%` }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Live Smart RPE Auto-Regulation Suggestion Banner */}
                <AnimatePresence>
                  {liveRpeSuggestion && lastCompletedSet && (
                    <motion.div
                      id="card-live-rpe-suggestion"
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -6, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`overflow-hidden rounded-2xl border p-4 shadow-lg transition-all ${
                        liveRpeSuggestion.action === 'increase'
                          ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-card to-card'
                          : liveRpeSuggestion.action === 'decrease'
                            ? 'border-rose-500/40 bg-gradient-to-r from-rose-500/15 via-card to-card'
                            : 'border-primary/40 bg-gradient-to-r from-primary/15 via-card to-card'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                              <Sparkles className="h-3.5 w-3.5 text-primary" />
                              <span>{t.workout.rpeSmartAdviceBadge}</span>
                            </span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${
                              liveRpeSuggestion.action === 'increase'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : liveRpeSuggestion.action === 'decrease'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'bg-primary/20 text-primary border border-primary/30'
                            }`}>
                              {liveRpeSuggestion.action === 'increase' && <TrendingUp className="h-3 w-3" />}
                              {liveRpeSuggestion.action === 'decrease' && <TrendingDown className="h-3 w-3" />}
                              {liveRpeSuggestion.action === 'maintain' && <Equal className="h-3 w-3" />}
                              <span>
                                {liveRpeSuggestion.action === 'increase'
                                  ? (isAr ? `توصية بزيادة الوزن (+${liveRpeSuggestion.weightDelta} kg)` : `Suggested Increase (+${liveRpeSuggestion.weightDelta} kg)`)
                                  : liveRpeSuggestion.action === 'decrease'
                                    ? (isAr ? `توصية بخفض الوزن (${liveRpeSuggestion.weightDelta} kg)` : `Suggested Decrease (${liveRpeSuggestion.weightDelta} kg)`)
                                    : (isAr ? 'الوزن الحالي مثالي' : 'Current Weight Optimal')}
                              </span>
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {isAr
                                ? `المجموعة ${lastCompletedSet.setNumber}: ${lastCompletedSet.actualWeight} كجم @ RPE ${lastCompletedSet.rpe || 8}`
                                : `Set ${lastCompletedSet.setNumber}: ${lastCompletedSet.actualWeight} kg @ RPE ${lastCompletedSet.rpe || 8}`}
                            </span>
                          </div>

                          <div className="flex items-baseline gap-2 pt-0.5">
                            <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
                              {liveRpeSuggestion.suggestedWeight} kg
                            </span>
                            <span className="text-xs text-muted-foreground font-semibold">
                              {isAr ? `للمجموعة ${nextSet?.setNumber || 'القادمة'} (هدف RPE ${liveRpeSuggestion.targetRpe})` : `for Set ${nextSet?.setNumber || 'Next'} (target RPE ${liveRpeSuggestion.targetRpe})`}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                            {isAr ? liveRpeSuggestion.reasonAr : liveRpeSuggestion.reasonEn}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex sm:flex-col items-stretch justify-end gap-2 shrink-0 pt-1 sm:pt-0">
                          {nextSet && (
                            <button
                              id="btn-apply-live-rpe-next"
                              type="button"
                              onClick={() => handleApplyRPEWeightToNextSet(liveRpeSuggestion.suggestedWeight, liveRpeSuggestion.targetReps, liveRpeSuggestion.targetRpe)}
                              className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>{isAr ? `تطبيق على المجموعة ${nextSet.setNumber}` : `Apply to Set ${nextSet.setNumber}`}</span>
                            </button>
                          )}

                          <div className="flex items-center gap-1.5">
                            <button
                              id="btn-apply-live-rpe-all"
                              type="button"
                              onClick={() => handleApplyRPEWeightToAllRemaining(liveRpeSuggestion.suggestedWeight, liveRpeSuggestion.targetReps, liveRpeSuggestion.targetRpe)}
                              className="w-full flex items-center justify-center gap-1 rounded-xl border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/20 transition-colors"
                              title={t.workout.rpeApplyToAllRemaining}
                            >
                              <Zap className="h-3 w-3" />
                              <span>{isAr ? 'تطبيق على الكل' : 'Apply All'}</span>
                            </button>

                            <button
                              id="btn-open-rpe-from-banner"
                              type="button"
                              onClick={() => handleOpenRPECalculator(lastCompletedSet.actualWeight, lastCompletedSet.actualReps, lastCompletedSet.rpe)}
                              className="flex items-center justify-center gap-1 rounded-xl border border-border bg-secondary/80 px-2.5 py-1.5 text-[11px] font-bold text-foreground hover:bg-secondary transition-colors"
                              title={t.workout.rpeCalculatorTitle}
                            >
                              <Calculator className="h-3 w-3 text-primary" />
                              <span>{isAr ? 'حاسبة RPE' : 'Calculator'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-12 gap-2 text-center text-xs font-bold text-muted-foreground px-2">
                  <div className="col-span-2 text-left">{t.workout.set}</div>
                  <div className="col-span-4">{isAr ? 'الوزن (قائمة منسدلة)' : 'Weight (Drop-Down)'}</div>
                  <div className="col-span-3">{isAr ? 'التكرار (قائمة)' : 'Reps (Drop-Down)'}</div>
                  <div className="col-span-2">{t.workout.rpe}</div>
                  <div className="col-span-1">{t.common.done}</div>
                </div>

                <div className="space-y-2.5">
                  <AnimatePresence initial={false}>
                    {currentExercise.sets.map((setLog) => (
                      <motion.div
                        key={setLog.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, height: 0 }}
                        transition={{ duration: 0.16 }}
                        className={`grid grid-cols-12 items-center gap-2 rounded-xl border p-2.5 transition-all ${
                          setLog.isPR
                            ? 'border-amber-400/60 bg-amber-400/10 shadow-sm shadow-amber-500/15 ring-1 ring-amber-400/30'
                            : setLog.completed
                              ? 'border-emerald-500/40 bg-emerald-500/10'
                              : 'border-border bg-secondary/30'
                        }`}
                      >
                        {/* Set Number & PR Badge */}
                        <div className="col-span-2 flex items-center gap-1.5 font-bold text-foreground text-sm">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black shadow-inner ${
                            setLog.isPR ? 'bg-amber-400 text-black shadow-amber-400/30' : 'bg-secondary'
                          }`}>
                            {setLog.setNumber}
                          </span>
                          {setLog.isPR && (
                            <span 
                              className="hidden sm:inline-flex items-center gap-0.5 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black text-amber-400 border border-amber-500/30 animate-pulse"
                              title={setLog.prType === 'weight' ? (isAr ? 'رقم قياسي في الوزن' : 'Weight PR') : (isAr ? 'رقم قياسي في الحجم' : 'Volume PR')}
                            >
                              <Trophy className="h-2.5 w-2.5" />
                              <span>{isAr ? 'رقم قياسي' : 'PR'}</span>
                            </span>
                          )}
                        </div>

                        {/* Weight Drop-Down List (Select) */}
                        <div className="col-span-4">
                          <select
                            id={`select-weight-${setLog.id}`}
                            value={setLog.actualWeight}
                            onChange={e => handleUpdateSet(setLog.id, 'actualWeight', parseFloat(e.target.value))}
                            className="w-full rounded-xl border border-border bg-card py-2 px-2 text-center text-xs sm:text-sm font-bold text-foreground focus:border-primary focus:outline-none transition-colors cursor-pointer hover:border-primary/50"
                          >
                            {!WEIGHT_OPTIONS.includes(setLog.actualWeight) && setLog.actualWeight > 0 && (
                              <option value={setLog.actualWeight}>{setLog.actualWeight} kg (Custom)</option>
                            )}
                            {WEIGHT_OPTIONS.map(w => (
                              <option key={w} value={w}>
                                {w === 0 ? (isAr ? 'وزن الجسم (0 kg)' : 'Bodyweight (0 kg)') : `${w} kg`}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Reps Drop-Down List (Select) */}
                        <div className="col-span-3">
                          <select
                            id={`select-reps-${setLog.id}`}
                            value={setLog.actualReps}
                            onChange={e => handleUpdateSet(setLog.id, 'actualReps', parseInt(e.target.value, 10))}
                            className="w-full rounded-xl border border-border bg-card py-2 px-2 text-center text-xs sm:text-sm font-bold text-foreground focus:border-primary focus:outline-none transition-colors cursor-pointer hover:border-primary/50"
                          >
                            {!REPS_OPTIONS.includes(setLog.actualReps) && setLog.actualReps > 0 && (
                              <option value={setLog.actualReps}>{setLog.actualReps} Reps</option>
                            )}
                            {REPS_OPTIONS.map(r => (
                              <option key={r} value={r}>
                                {r} {isAr ? 'تكرار' : 'reps'}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* RPE Selector (6 - 10) with RIR and Calculator Shortcut */}
                        <div className="col-span-2 flex flex-col items-center">
                          <select
                            id={`select-rpe-${setLog.id}`}
                            value={setLog.rpe || 8}
                            onChange={e => handleUpdateSet(setLog.id, 'rpe', parseFloat(e.target.value))}
                            className="w-full rounded-xl border border-border bg-card py-2 px-1 text-center text-xs font-semibold text-foreground focus:border-primary focus:outline-none cursor-pointer"
                          >
                            <option value="6">RPE 6</option>
                            <option value="6.5">6.5</option>
                            <option value="7">RPE 7</option>
                            <option value="7.5">7.5</option>
                            <option value="8">RPE 8</option>
                            <option value="8.5">8.5</option>
                            <option value="9">RPE 9</option>
                            <option value="9.5">9.5</option>
                            <option value="10">10 (Max)</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleOpenRPECalculator(setLog.actualWeight, setLog.actualReps, setLog.rpe)}
                            className="mt-0.5 text-[9px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
                            title={isAr ? 'فتح حاسبة RPE' : 'Open RPE Calculator'}
                          >
                            <Calculator className="h-2.5 w-2.5" />
                            <span>{Math.max(0, Math.round((10 - (setLog.rpe || 8)) * 10) / 10)} RIR</span>
                          </button>
                        </div>

                        {/* Completed Checkbox Button */}
                        <div className="col-span-1 flex justify-center">
                          <button
                            id={`btn-toggle-set-${setLog.id}`}
                            onClick={() => handleToggleSetCompletion(setLog)}
                            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                              setLog.completed
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105'
                                : 'border border-border bg-card text-muted-foreground hover:bg-secondary'
                            }`}
                            title={isAr ? 'تأكيد إكمال المجموعة وبدء الراحة' : 'Log set and start rest timer'}
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
                    className="flex items-center gap-1.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t.workout.addSet}</span>
                  </button>

                  {currentExercise.sets.length > 1 && (
                    <button
                      id="btn-remove-last-set"
                      onClick={() => handleRemoveSet(currentExercise.sets[currentExercise.sets.length - 1].id)}
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-red-400 transition-colors"
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

            <span className="text-xs text-muted-foreground font-bold">
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

      {/* Floating Interactive Rest Timer Bar with Full-Width Visual Progress and Sound Alert */}
      <div className="relative border-t border-border bg-card/95 p-3 backdrop-blur sm:px-6 shadow-2xl">
        {/* Top Edge Full-Width Animated Glowing Progress Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-secondary/50 overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ease-linear ${
              timerSeconds <= 5 && timerSeconds > 0
                ? 'bg-amber-400 shadow-md shadow-amber-400/50'
                : timerSeconds <= 15 && timerSeconds > 0
                  ? 'bg-cyan-400 shadow-md shadow-cyan-400/50'
                  : 'bg-primary shadow-md shadow-primary/50'
            }`}
            style={{ width: `${timerSeconds > 0 ? elapsedPercent : 0}%` }}
          />
        </div>

        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            {/* Circular Gauge Ring */}
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
              <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44">
                <circle
                  cx="22"
                  cy="22"
                  r="17"
                  className="stroke-muted/30"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="17"
                  className={`transition-all duration-300 ease-linear ${
                    timerSeconds <= 5 && timerSeconds > 0
                      ? 'stroke-amber-400'
                      : timerSeconds <= 15 && timerSeconds > 0
                        ? 'stroke-cyan-400'
                        : 'stroke-primary'
                  }`}
                  strokeWidth="3.5"
                  strokeDasharray={106.8}
                  strokeDashoffset={106.8 * (1 - (timerSeconds / (totalTimerDuration || 1)))}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <Timer className={`absolute h-4 w-4 ${timerActive ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
            </div>

            <div>
              <div className="text-[10px] uppercase font-black text-muted-foreground tracking-wider flex items-center gap-1.5">
                <span>{t.workout.restTimer}</span>
                {timerActive && timerSeconds > 5 && (
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
                {timerActive && timerSeconds <= 5 && timerSeconds > 0 && (
                  <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/30 animate-pulse">
                    {isAr ? '🔔 استعد للمجموعة!' : '🔔 Prepare for Set!'}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-foreground font-mono">
                  {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                </span>
                {timerSeconds > 0 && (
                  <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                    / {Math.floor(totalTimerDuration / 60)}:{(totalTimerDuration % 60).toString().padStart(2, '0')} ({Math.round(elapsedPercent)}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Toggle Presets Drawer Button */}
            <button
              id="btn-toggle-rest-presets"
              type="button"
              onClick={() => setShowRestPresets(!showRestPresets)}
              className={`rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                showRestPresets
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
              title={isAr ? 'عرض فترات الراحة الجاهزة' : 'Show Rest Presets'}
            >
              <span className="text-[11px]">{isAr ? 'فترات سريعة' : 'Presets'}</span>
            </button>

            {/* Quick Adjustment Buttons */}
            <button
              id="btn-timer-minus-15"
              onClick={() => adjustTimer(-15)}
              className="rounded-xl border border-border bg-secondary/50 px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
            >
              -15s
            </button>
            <button
              id="btn-timer-plus-30"
              onClick={() => adjustTimer(30)}
              className="rounded-xl border border-border bg-secondary/50 px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
            >
              +30s
            </button>

            {/* End Rest Now Button */}
            {timerSeconds > 0 && (
              <button
                id="btn-end-rest-now"
                onClick={endRestImmediately}
                className="flex items-center gap-1 rounded-xl bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 transition-colors shadow-sm"
                title={isAr ? 'إنهاء الراحة الآن والبدء في المجموعة التالية فوراً' : 'End rest right now'}
              >
                <FastForward className="h-3.5 w-3.5" />
                <span>{isAr ? 'إنهاء الراحة الآن' : 'End Rest Now'}</span>
              </button>
            )}

            {timerActive ? (
              <button
                id="btn-pause-timer"
                onClick={() => setTimerActive(false)}
                className="flex items-center gap-1 rounded-xl bg-secondary px-3 py-1.5 text-xs font-bold text-foreground border border-border hover:bg-secondary/80 transition-colors"
              >
                <Pause className="h-3.5 w-3.5" />
                <span>{isAr ? 'إيقاف مؤقت' : 'Pause'}</span>
              </button>
            ) : (
              <button
                id="btn-start-timer-90"
                onClick={() => startTimer(timerSeconds > 0 ? timerSeconds : (currentExercise.restSeconds || 90))}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{timerSeconds > 0 ? (isAr ? 'استئناف' : 'Resume') : `${t.workout.startRest} (${currentExercise.restSeconds || 90}s)`}</span>
              </button>
            )}

            {timerSeconds > 0 && (
              <button
                id="btn-reset-timer"
                onClick={endRestImmediately}
                className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title={isAr ? 'تصفير العداد' : 'Reset timer'}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Expandable Rest Presets Bar */}
        <AnimatePresence>
          {showRestPresets && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-auto max-w-4xl border-t border-border/60 pt-2.5 mt-2 flex flex-wrap items-center justify-between gap-2"
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-muted-foreground">{t.workout.restPresets}:</span>
                {[30, 45, 60, 90, 120, 180].map(pSec => (
                  <button
                    key={pSec}
                    type="button"
                    onClick={() => {
                      startTimer(pSec);
                      setShowRestPresets(false);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      totalTimerDuration === pSec && timerActive
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                        : 'border border-border bg-secondary/50 text-foreground hover:bg-secondary'
                    }`}
                  >
                    {pSec}s
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-border bg-secondary/50 px-2 py-1 text-xs font-semibold text-foreground hover:bg-secondary"
                  title={soundEnabled ? t.workout.muteSound : t.workout.unmuteSound}
                >
                  {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-primary" /> : <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span>{soundEnabled ? (isAr ? 'صوت مفعّل' : 'Sound On') : (isAr ? 'صامت' : 'Muted')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => AudioService.preview(selectedSound)}
                  className="rounded-lg border border-border bg-secondary/50 px-2 py-1 text-xs font-semibold text-foreground hover:bg-secondary"
                  title={t.workout.soundPreview}
                >
                  🔔 {t.workout.soundPreview}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rest Complete Floating Notification Toast */}
      <AnimatePresence>
        {restCompleteToast && (
          <motion.div
            id="toast-rest-complete"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl border border-emerald-500/40 bg-card/95 p-4 shadow-2xl backdrop-blur-md ring-1 ring-emerald-500/20"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-bounce">
                  <Bell className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <div className="text-sm font-black text-foreground flex items-center gap-1.5">
                    <span>{isAr ? '🔔 انتهت فترة الراحة!' : '🔔 Rest Complete!'}</span>
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {nextSet ? (
                      <span>
                        {isAr
                          ? `جاهز للمجموعة ${nextSet.setNumber} (${nextSet.actualWeight} كجم × ${nextSet.actualReps} تكرار)`
                          : `Ready for Set ${nextSet.setNumber} (${nextSet.actualWeight} kg × ${nextSet.actualReps} reps)`}
                      </span>
                    ) : nextExercise ? (
                      <span>
                        {isAr
                          ? `جاهز للتمرين التالي: ${nextExercise.exerciseNameAr || nextExercise.exerciseName}`
                          : `Ready for next exercise: ${nextExercise.exerciseName}`}
                      </span>
                    ) : (
                      <span>{t.workout.restCompleteAlert}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                id="btn-dismiss-rest-toast"
                type="button"
                onClick={() => setRestCompleteToast(false)}
                className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-colors shrink-0"
              >
                {isAr ? 'بدء المجموعة' : 'Start Set'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Warm-up 5-Minute Modal */}
      <SmartWarmupModal
        isOpen={smartWarmupOpen}
        initialWorkoutType={workout.type}
        profile={profile}
        onClose={() => setSmartWarmupOpen(false)}
      />

      {/* RPE & Auto-Regulation Load Adjustment Modal */}
      <RPECalculatorModal
        isOpen={rpeCalculatorOpen}
        onClose={() => {
          setRpeCalculatorOpen(false);
          setRpeCalcInitialData(null);
        }}
        initialWeight={rpeCalcInitialData?.weight ?? lastCompletedSet?.actualWeight ?? currentExercise?.sets[0]?.actualWeight ?? 50}
        initialReps={rpeCalcInitialData?.reps ?? lastCompletedSet?.actualReps ?? currentExercise?.sets[0]?.actualReps ?? 10}
        initialRpe={rpeCalcInitialData?.rpe ?? lastCompletedSet?.rpe ?? 8}
        targetRpe={currentExercise?.targetRpe ?? 8}
        exerciseName={isAr && currentExercise?.exerciseNameAr ? currentExercise.exerciseNameAr : currentExercise?.exerciseName || ''}
        isAr={isAr}
        onApplyWeightToNextSet={(weight, reps, rpe) => {
          handleApplyRPEWeightToNextSet(weight, reps, rpe);
        }}
        onApplyWeightToAllRemaining={(weight, reps, rpe) => {
          handleApplyRPEWeightToAllRemaining(weight, reps, rpe);
        }}
      />

      {/* Achievement Confetti PR Toast */}
      <PRAchievementToast
        prEvent={activePRToast}
        profile={profile}
        onClose={() => setActivePRToast(null)}
      />
    </div>
  );
};
