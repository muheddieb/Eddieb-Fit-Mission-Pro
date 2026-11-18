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
  Volume2,
  VolumeX,
  Play,
  Pause,
  Home,
  FastForward,
  Bell,
  Calculator,
  Dumbbell,
  BookOpen,
  ArrowLeftRight,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { WorkoutSession, WorkoutExercise, SetLog, UserProfile, Exercise, RestSoundType, PersonalRecordEvent, WorkoutDifficultyLevel, WorkoutEquipmentFilter } from '../../types';
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
import { WorkoutSubstitutionModal } from './WorkoutSubstitutionModal';

interface ActiveWorkoutModalProps {
  workout: WorkoutSession;
  profile: UserProfile;
  onSaveWorkout: (workout: WorkoutSession) => void;
  onFinishWorkout: (workout: WorkoutSession) => void;
  onClose: () => void;
  onOpenExerciseDetails: (exercise: Exercise) => void;
}

// Preset weights from 0 kg to 200 kg with fine-grained increments (supports all dumbbell & barbell steps)
const WEIGHT_OPTIONS: number[] = [
  0, 1, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10,
  11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 17.5, 18, 19, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40,
  42.5, 45, 47.5, 50, 52.5, 55, 57.5, 60, 62.5, 65, 67.5, 70,
  72.5, 75, 77.5, 80, 82.5, 85, 87.5, 90, 95, 100, 105, 110,
  115, 120, 125, 130, 135, 140, 145, 150, 160, 170, 180, 190, 200
];

const PER_SIDE_WEIGHT_OPTIONS: number[] = [
  0, 1, 1.25, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10,
  11, 12, 12.5, 13.5, 14, 15, 16, 17.5, 18, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40,
  45, 50, 55, 60, 65, 70, 75, 80, 90, 100
];

function detectDualHandExercise(exercise?: WorkoutExercise | null, fullEx?: Exercise | null): boolean {
  if (!exercise) return false;
  const combined = [
    exercise.exerciseName || '',
    exercise.exerciseNameAr || '',
    fullEx?.name || '',
    fullEx?.nameAr || '',
    fullEx?.equipment || '',
    fullEx?.equipmentAr || '',
    exercise.primaryMuscle || '',
  ]
    .join(' ')
    .toLowerCase();

  const isExplicitBarbellOnly =
    (combined.includes('barbell') || combined.includes('ez-bar') || combined.includes('ez bar') || combined.includes('بار')) &&
    !combined.includes('dumbbell') &&
    !combined.includes('دمبل');

  if (isExplicitBarbellOnly) return false;

  return (
    combined.includes('dumbbell') ||
    combined.includes('dumbbells') ||
    combined.includes('db ') ||
    combined.includes('دمبل') ||
    combined.includes('دمبلز') ||
    combined.includes('bicep') ||
    combined.includes('curl') ||
    combined.includes('بايسبس') ||
    combined.includes('باي') ||
    combined.includes('تبادل') ||
    combined.includes('hammer') ||
    combined.includes('هامر') ||
    combined.includes('lateral raise') ||
    combined.includes('رفرفة') ||
    combined.includes('fly') ||
    combined.includes('تفتيح') ||
    combined.includes('split squat') ||
    combined.includes('بلغاري') ||
    combined.includes('single arm') ||
    combined.includes('يد واحدة')
  );
}

function detectExerciseLoadConfig(exercise?: WorkoutExercise | null, fullEx?: Exercise | null) {
  if (!exercise) {
    return { isBarbell: false, isDumbbellDual: false, isBilateral: false, defaultBarWeight: 0 };
  }
  const combined = [
    exercise.exerciseName || '',
    exercise.exerciseNameAr || '',
    fullEx?.name || '',
    fullEx?.nameAr || '',
    fullEx?.equipment || '',
    fullEx?.equipmentAr || '',
  ]
    .join(' ')
    .toLowerCase();

  const isDumbbellDual = detectDualHandExercise(exercise, fullEx);
  const isEzBar = combined.includes('ez-bar') || combined.includes('ez bar') || combined.includes('زجزاج') || combined.includes('skull crusher');
  const isBarbell =
    !isDumbbellDual &&
    (isEzBar ||
      combined.includes('barbell') ||
      combined.includes('بار') ||
      combined.includes('deadlift') ||
      combined.includes('squat') ||
      combined.includes('bench press') ||
      combined.includes('overhead press') ||
      combined.includes('bent-over row') ||
      combined.includes('bent row')) &&
    !combined.includes('machine') &&
    !combined.includes('cable') &&
    !combined.includes('جهاز') &&
    !combined.includes('كابل');

  const isPlateLoadedMachine =
    combined.includes('leg press') ||
    combined.includes('hack squat') ||
    combined.includes('smith') ||
    combined.includes('هاك') ||
    combined.includes('دفع أرجل');

  const defaultBarWeight = isEzBar ? 10 : isBarbell ? 20 : 0;

  return {
    isBarbell,
    isDumbbellDual,
    isBilateral: isBarbell || isDumbbellDual || isPlateLoadedMachine,
    defaultBarWeight,
  };
}

function toPerSideWeight(totalKg: number, barKg: number): number {
  if (totalKg <= 0) return 0;
  if (barKg > 0) {
    return Math.max(0, Math.round(((totalKg - barKg) / 2) * 100) / 100);
  }
  return Math.round((totalKg / 2) * 100) / 100;
}

function fromPerSideWeight(perSideKg: number, barKg: number): number {
  const safeSide = Math.max(0, perSideKg);
  if (safeSide === 0) return barKg > 0 ? barKg : 0;
  return Math.round((barKg + safeSide * 2) * 100) / 100;
}

// Preset reps from 1 to 50
const REPS_OPTIONS: number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 
  16, 17, 18, 19, 20, 22, 24, 25, 28, 30, 35, 40, 45, 50
];

interface PlateSpec {
  weight: number;
  nameEn: string;
  nameAr: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dotColor: string;
  heightClass: string;
  widthClass: string;
}

const COMPETITION_PLATES: PlateSpec[] = [
  { weight: 25, nameEn: 'Red 25kg', nameAr: 'أحمر 25 كجم', bgClass: 'bg-rose-600', borderClass: 'border-rose-400', textClass: 'text-white', dotColor: '#e11d48', heightClass: 'h-24', widthClass: 'w-6' },
  { weight: 20, nameEn: 'Blue 20kg', nameAr: 'أزرق 20 كجم', bgClass: 'bg-blue-600', borderClass: 'border-blue-400', textClass: 'text-white', dotColor: '#2563eb', heightClass: 'h-24', widthClass: 'w-5' },
  { weight: 15, nameEn: 'Yellow 15kg', nameAr: 'أصفر 15 كجم', bgClass: 'bg-amber-400', borderClass: 'border-amber-300', textClass: 'text-black', dotColor: '#fbbf24', heightClass: 'h-20', widthClass: 'w-5' },
  { weight: 10, nameEn: 'Green 10kg', nameAr: 'أخضر 10 كجم', bgClass: 'bg-emerald-600', borderClass: 'border-emerald-400', textClass: 'text-white', dotColor: '#059669', heightClass: 'h-16', widthClass: 'w-4' },
  { weight: 5, nameEn: 'White 5kg', nameAr: 'أبيض 5 كجم', bgClass: 'bg-zinc-100', borderClass: 'border-zinc-300', textClass: 'text-zinc-950', dotColor: '#f4f4f5', heightClass: 'h-14', widthClass: 'w-4' },
  { weight: 2.5, nameEn: 'Black 2.5kg', nameAr: 'أسود 2.5 كجم', bgClass: 'bg-zinc-800', borderClass: 'border-zinc-500', textClass: 'text-zinc-100', dotColor: '#52525b', heightClass: 'h-12', widthClass: 'w-3.5' },
  { weight: 1.25, nameEn: 'Silver 1.25kg', nameAr: 'فضي 1.25 كجم', bgClass: 'bg-slate-400', borderClass: 'border-slate-200', textClass: 'text-slate-950', dotColor: '#94a3b8', heightClass: 'h-10', widthClass: 'w-3' },
];

function calculatePlateBreakdown(totalWeightKg: number, barWeightKg: number) {
  if (totalWeightKg <= 0) {
    return {
      isBodyweight: true,
      isBarOnly: false,
      perSideKg: 0,
      groupedPerSide: [] as { spec: PlateSpec; count: number }[],
      flatPlatesPerSide: [] as PlateSpec[],
      remainderPerSideKg: 0,
      compactText: '',
    };
  }

  if (totalWeightKg <= barWeightKg) {
    return {
      isBodyweight: false,
      isBarOnly: true,
      perSideKg: 0,
      groupedPerSide: [] as { spec: PlateSpec; count: number }[],
      flatPlatesPerSide: [] as PlateSpec[],
      remainderPerSideKg: 0,
      compactText: 'Bar Only',
    };
  }

  const targetPerSide = Math.max(0, (totalWeightKg - barWeightKg) / 2);
  let remaining = Math.round(targetPerSide * 100) / 100;
  const groupedPerSide: { spec: PlateSpec; count: number }[] = [];
  const flatPlatesPerSide: PlateSpec[] = [];

  for (const spec of COMPETITION_PLATES) {
    if (remaining >= spec.weight - 0.001) {
      const count = Math.floor((remaining + 0.001) / spec.weight);
      if (count > 0) {
        groupedPerSide.push({ spec, count });
        for (let i = 0; i < Math.min(count, 8); i++) {
          flatPlatesPerSide.push(spec);
        }
        remaining = Math.round((remaining - count * spec.weight) * 100) / 100;
      }
    }
  }

  const compactText = groupedPerSide
    .map(g => (g.count > 1 ? `${g.spec.weight}×${g.count}` : `${g.spec.weight}`))
    .join('+');

  return {
    isBodyweight: false,
    isBarOnly: false,
    perSideKg: Math.round(targetPerSide * 100) / 100,
    groupedPerSide,
    flatPlatesPerSide,
    remainderPerSideKg: remaining,
    compactText,
  };
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
  const [totalTimerDuration, setTotalTimerDuration] = useState<number>(90);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [restCompleteToast, setRestCompleteToast] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedSound] = useState<RestSoundType>(profile.restSoundType || 'beep');
  const [swapExerciseOpen, setSwapExerciseOpen] = useState<boolean>(false);
  const [swapEquipmentFilter, setSwapEquipmentFilter] = useState<WorkoutEquipmentFilter>('all');
  const [jointPainFilter, setJointPainFilter] = useState<boolean>(false);
  const [substitutionModalOpen, setSubstitutionModalOpen] = useState<boolean>(false);
  const [showRestPresets, setShowRestPresets] = useState<boolean>(false);
  const [smartWarmupOpen, setSmartWarmupOpen] = useState<boolean>(false);

  // RPE Calculator & Auto-Regulation State
  const [rpeCalculatorOpen, setRpeCalculatorOpen] = useState<boolean>(false);
  const [rpeCalcInitialData, setRpeCalcInitialData] = useState<{ weight?: number; reps?: number; rpe?: number } | null>(null);

  // Exercise Guidance Slide-Out Panel State
  const [guidanceOpen, setGuidanceOpen] = useState<boolean>(false);
  const [inspectedPlateSetIndex, setInspectedPlateSetIndex] = useState<number>(0);

  // Weight Input Mode ('total' default | 'per_side') & Per-Exercise Bar Weight Override (inside Exercise Guidance)
  const [weightInputMode, setWeightInputMode] = useState<'total' | 'per_side'>('total');
  const [barWeightByExercise, setBarWeightByExercise] = useState<Record<string, number>>({});

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
    AudioService.playRestCompleteCue(selectedSound, 0.45);
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
                new Notification(isAr ? '🔔 انتهت فترة الراحة!' : '🔔 Rest Complete!', {
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
    AudioService.unlockAudio();
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
    forceOverride: boolean = false,
    useRpeAdjusted: boolean = true
  ): boolean => {
    const targetExercise = workout.exercises[exerciseIndex];
    if (!targetExercise) return false;

    const { lastSession, progressionAdvice: exAdvice } = PPLEngine.getExerciseComparison(targetExercise.exerciseId, history);
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

        const rpeSetSuggestion = exAdvice.setBySetSuggestions?.[sIdx] ||
          (exAdvice.setBySetSuggestions && exAdvice.setBySetSuggestions.length > 0
            ? exAdvice.setBySetSuggestions[exAdvice.setBySetSuggestions.length - 1]
            : undefined);

        const targetW = useRpeAdjusted
          ? (rpeSetSuggestion?.suggestedWeight ?? exAdvice.recommendedWeight ?? prevSet.weight)
          : prevSet.weight;

        const targetR = useRpeAdjusted
          ? (rpeSetSuggestion?.lastReps ?? prevSet.reps)
          : prevSet.reps;

        modified = true;
        return {
          ...s,
          targetWeight: targetW,
          actualWeight: targetW,
          targetReps: targetR,
          actualReps: targetR,
          rpe: useRpeAdjusted ? 8 : (prevSet.rpe ?? s.rpe ?? 8),
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

  // Automatically pre-fill the current exercise's input fields with RPE-calibrated suggested weights from last session
  useEffect(() => {
    const ex = workout.exercises[currentExerciseIndex];
    if (!ex) return;

    if (!autoPrefilledExerciseIds.current.has(ex.exerciseId)) {
      const anyCompleted = ex.sets.some(s => s.completed);
      if (!anyCompleted) {
        const success = prefillExerciseWithLastSession(currentExerciseIndex, false, true);
        if (success) {
          autoPrefilledExerciseIds.current.add(ex.exerciseId);
        }
      }
    }
  }, [currentExerciseIndex, prefillExerciseWithLastSession, workout.exercises]);

  // Compute live forecast for NEXT future session based on current exercise's logged RPEs
  const nextSessionForecast = useMemo(() => {
    if (!currentExercise) return null;
    return PPLEngine.calculateNextSessionForecastFromCurrentSets(currentExercise);
  }, [currentExercise]);

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

  // Smart Substitution for current exercise with automatic weight calibration & logging
  const handleSubstituteExercise = (
    originalExerciseId: string,
    newExercise: Exercise,
    reason?: string
  ) => {
    // Allow new exercise to be auto-prefilled from its own history
    autoPrefilledExerciseIds.current.delete(newExercise.id);

    // Calculate appropriate starting weight & reps for the new exercise
    const newExAdvice = PPLEngine.calculateProgression(newExercise.id, history);
    const activeDiff = workout.difficultyLevel || 'standard';
    const diffMultiplier = activeDiff === 'easy' ? 0.85 : activeDiff === 'hard' ? 1.075 : 1.0;
    const defaultRepNum = activeDiff === 'easy'
      ? 12
      : activeDiff === 'hard'
        ? 8
        : (parseInt(String(newExercise.targetRepRange || '10').split('-')[0], 10) || 10);

    const updatedExercises = workout.exercises.map((ex, idx) => {
      if (idx !== currentExerciseIndex && ex.exerciseId !== originalExerciseId) return ex;

      const rootOriginalId = ex.originalExerciseId || ex.exerciseId;
      const rootOriginalName = ex.originalExerciseName || ex.exerciseName;
      const rootOriginalNameAr = ex.originalExerciseNameAr || ex.exerciseNameAr || ex.exerciseName;

      const calibratedSets: SetLog[] = ex.sets.map((s, sIdx) => {
        if (s.completed) return s;
        const setSuggestion = newExAdvice.setBySetSuggestions?.[sIdx] ||
          (newExAdvice.setBySetSuggestions && newExAdvice.setBySetSuggestions.length > 0
            ? newExAdvice.setBySetSuggestions[newExAdvice.setBySetSuggestions.length - 1]
            : undefined);
        const rawW = setSuggestion?.suggestedWeight ?? newExAdvice.recommendedWeight ?? 0;
        const calibratedW = rawW > 0 ? Math.max(2.5, Math.round((rawW * diffMultiplier) / 2.5) * 2.5) : 0;
        const calibratedR = setSuggestion?.lastReps ?? defaultRepNum;

        return {
          ...s,
          targetWeight: calibratedW,
          actualWeight: calibratedW,
          targetReps: newExercise.targetRepRange || calibratedR,
          actualReps: calibratedR,
          rpe: newExercise.rpeTarget || 8,
          completed: false,
        };
      });

      return {
        exerciseId: newExercise.id,
        exerciseName: newExercise.name,
        exerciseNameAr: newExercise.nameAr,
        primaryMuscle: newExercise.primaryMuscle,
        targetRpe: newExercise.rpeTarget || 8,
        restSeconds: newExercise.restSeconds || 90,
        isSubstituted: newExercise.id !== rootOriginalId,
        originalExerciseId: newExercise.id !== rootOriginalId ? rootOriginalId : undefined,
        originalExerciseName: newExercise.id !== rootOriginalId ? rootOriginalName : undefined,
        originalExerciseNameAr: newExercise.id !== rootOriginalId ? rootOriginalNameAr : undefined,
        substitutionReason: reason || 'Swapped for equivalent variation based on available equipment / gym congestion',
        sets: calibratedSets,
        completed: false,
      };
    });

    const updatedWorkout: WorkoutSession = {
      ...workout,
      exercises: updatedExercises,
    };

    setWorkout(updatedWorkout);
    StorageService.saveActiveWorkout(updatedWorkout);

    // Record substitution log
    StorageService.addWorkoutSubstitution({
      id: 'sub_' + Date.now(),
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      sessionId: workout.id,
      type: 'exercise_swap',
      originalItem: currentExercise.exerciseName,
      originalItemAr: currentExercise.exerciseNameAr || currentExercise.exerciseName,
      newItem: newExercise.name,
      newItemAr: newExercise.nameAr || newExercise.name,
      originalId: originalExerciseId,
      originalName: currentExercise.exerciseName,
      substitutedId: newExercise.id,
      substitutedName: newExercise.name,
      reason: reason || 'Available equipment / gym congestion swap',
      reasonAr: reason || 'تبديل حسب الأجهزة المتاحة أو ازدحام الصالة',
    });

    if (soundEnabled) {
      AudioService.playBeep(660, 0.1, 0.2);
    }
  };

  // Revert a swapped exercise back to its originally programmed movement
  const handleRevertToOriginalExercise = () => {
    if (!currentExercise?.originalExerciseId) return;
    const origEx = PPLEngine.getExerciseById(currentExercise.originalExerciseId);
    if (!origEx) return;
    handleSubstituteExercise(
      currentExercise.exerciseId,
      origEx,
      isAr ? 'استعادة التمرين الأصلي المبرمج' : 'Reverted to originally programmed movement'
    );
    setSwapExerciseOpen(false);
  };

  // Substitute entire workout day split (e.g. Push -> Pull or Full Body)
  const handleSubstituteWorkout = (
    newSession: WorkoutSession,
    reason?: string
  ) => {
    setWorkout(newSession);
    setCurrentExerciseIndex(0);
    StorageService.saveActiveWorkout(newSession);

    // Record workout split substitution log
    StorageService.addWorkoutSubstitution({
      id: 'sub_split_' + Date.now(),
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      sessionId: workout.id,
      type: 'day_swap',
      originalItem: workout.name,
      originalItemAr: workout.nameAr || workout.name,
      newItem: newSession.name,
      newItemAr: newSession.nameAr || newSession.name,
      originalId: workout.type,
      originalName: workout.name,
      substitutedId: newSession.type,
      substitutedName: newSession.name,
      reason: reason || 'Day split swap requested by user',
      reasonAr: reason || 'تبديل تقسيم اليوم التدريبي حسب رغبة المتدرب',
    });

    if (soundEnabled) {
      AudioService.playBeep(880, 0.15, 0.3);
    }
  };

  const handleSwapExercise = (newExercise: Exercise, matchReason?: string) => {
    const reasonTextEn = matchReason || `Switched to ${newExercise.equipment}`;
    const reasonTextAr = matchReason || `تم التبديل إلى ${newExercise.equipmentAr || newExercise.equipment}`;

    handleSubstituteExercise(
      currentExercise.exerciseId,
      newExercise,
      isAr ? reasonTextAr : reasonTextEn
    );
    setSwapExerciseOpen(false);
  };

  // Compute live completed sets counts
  const { completedSetsCount, totalSetsCount, isAllSetsCompleted } = useMemo(() => {
    let completed = 0;
    let total = 0;
    workout.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        total += 1;
        if (s.completed) completed += 1;
      });
    });
    return {
      completedSetsCount: completed,
      totalSetsCount: total,
      isAllSetsCompleted: total > 0 && completed === total,
    };
  }, [workout]);

  // Finish Workout with audio cue and robust storage completion (Complete or Partial)
  const handleFinish = () => {
    let totalVolume = 0;
    workout.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) {
          const w = s.actualWeight || s.targetWeight || 0;
          const r = s.actualReps || (typeof s.targetReps === 'number' ? s.targetReps : parseInt(String(s.targetReps || 0), 10));
          totalVolume += w * r;
        }
      });
    });

    const finishedWorkout: WorkoutSession = {
      ...workout,
      completed: true,
      completedAt: Date.now(),
      durationMinutes: Math.max(12, Math.round((Date.now() - (workout.startedAt || workout.timestamp || Date.now())) / 60000)),
      totalVolumeKg: totalVolume,
      notes: workout.notes || (isAllSetsCompleted ? 'Full workout completed with progressive overload.' : `Partial workout finished: ${completedSetsCount} sets completed.`),
    };

    // Save to robust storage layer & sync today's gym check-in
    StorageService.completeWorkout(finishedWorkout);
    const todayStr = new Date().toISOString().split('T')[0];
    const existingCheckIn = StorageService.getTodayCheckIn(todayStr);
    StorageService.saveTodayCheckIn({
      ...existingCheckIn,
      date: todayStr,
      status: 'completed',
      skipAction: null,
      updatedAt: Date.now(),
    });

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

  // Smart ranked equivalent variations filtered by available equipment & joint safety
  const smartRankedSubstitutes = useMemo(() => {
    if (!currentExercise?.exerciseId) return [];
    return PPLEngine.getSmartRankedSubstitutes(currentExercise.exerciseId, {
      equipment: swapEquipmentFilter,
      difficulty: workout.difficultyLevel || 'standard',
      lowFatigueOnly: jointPainFilter,
    });
  }, [currentExercise?.exerciseId, swapEquipmentFilter, workout.difficultyLevel, jointPainFilter]);

  const comparisonData = PPLEngine.getExerciseComparison(currentExercise?.exerciseId, history);

  // Computed Rest Timer Variables
  const progressFraction = totalTimerDuration > 0 ? (timerSeconds / totalTimerDuration) : 0;
  const elapsedPercent = Math.min(100, Math.max(0, (1 - progressFraction) * 100));

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

  // Current active difficulty level of this session
  const activeDifficultyLevel: WorkoutDifficultyLevel = workout.difficultyLevel || 'standard';

  // Handler: Dynamically switch Difficulty Level (Easy, Standard, Advanced) and replace today's exercises, sets, & weights
  const handleSelectDifficultyLevel = (newLevel: WorkoutDifficultyLevel) => {
    if (newLevel === activeDifficultyLevel) return;

    // Resolve splitId from workout.splitId or workout.type
    const effectiveSplitId =
      workout.splitId ||
      (['push', 'pull', 'legs', 'shoulders_arms', 'upper', 'lower', 'full_body', 'rest_active'].includes(workout.type as string)
        ? (workout.type as string)
        : 'push');

    // Strip previous difficulty suffix from custom name if present
    const cleanBaseName = (workout.name || '').replace(/ • (Light \/ Level 1|Advanced \/ Level 3|Readiness Scaled \(.*?\)|Peak Readiness)/g, '');
    const cleanBaseNameAr = (workout.nameAr || '').replace(/ • (المستوى 1 \(خفيف \/ مرن\)|المستوى 3 \(متقدم \/ مكثف\)|معدل بالجاهزية \(.*?\)|ذروة الجاهزية)/g, '');

    const regeneratedSession = PPLEngine.buildAdaptiveWorkout({
      profile,
      history,
      splitId: effectiveSplitId,
      difficultyLevel: newLevel,
      timeConstraint: workout.timeConstraint || 'full',
      equipment: workout.equipmentFocus || 'all',
      location: profile.preferredLocation,
      isAdaptiveReturn: workout.isAdaptiveReturn,
      readiness: workout.dailyReadiness,
      customName: cleanBaseName || undefined,
      customNameAr: cleanBaseNameAr || undefined,
    });

    // Preserve any already-completed sets if the same exercise exists in the new tier
    const mergedExercises = regeneratedSession.exercises.map((newEx) => {
      const existingMatch = workout.exercises.find((oldEx) => oldEx.exerciseId === newEx.exerciseId);
      if (existingMatch && existingMatch.sets.some((s) => s.completed)) {
        const completedOldSets = existingMatch.sets.filter((s) => s.completed);
        const remainingNewSets = newEx.sets.slice(completedOldSets.length).map((s, idx) => ({
          ...s,
          setNumber: completedOldSets.length + idx + 1,
        }));
        const combinedSets = [...completedOldSets, ...remainingNewSets];
        return {
          ...newEx,
          sets: combinedSets,
          completed: combinedSets.length > 0 && combinedSets.every((s) => s.completed),
        };
      }
      return newEx;
    });

    const updatedWorkout: WorkoutSession = {
      ...regeneratedSession,
      id: workout.id,
      startedAt: workout.startedAt || Date.now(),
      difficultyLevel: newLevel,
      splitId: effectiveSplitId,
      exercises: mergedExercises,
    };

    setWorkout(updatedWorkout);
    setCurrentExerciseIndex(0);
    autoPrefilledExerciseIds.current.clear();

    if (soundEnabled) {
      AudioService.playBeep(newLevel === 'hard' ? 980 : newLevel === 'easy' ? 640 : 800, 0.12, 0.25);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Clean Minimal Top Action Bar */}
      <div className="flex h-14 sm:h-16 items-center justify-between border-b border-border bg-card px-3 sm:px-6 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            id="btn-workout-to-home"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors shrink-0"
            title={isAr ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
          >
            <Home className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">{isAr ? 'الرئيسية' : 'Home'}</span>
          </button>

          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-black text-foreground truncate">
              {isAr ? workout.nameAr || workout.name : workout.name}
            </h2>
            <div className="text-[11px] font-mono tabular-nums text-muted-foreground">
              {workout.exercises.filter(e => e.completed).length}/{workout.exercises.length} {isAr ? 'تمارين مكتملة' : 'exercises done'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Exercise Guidance Slide-Out Trigger */}
          <button
            id="btn-toggle-workout-tools"
            type="button"
            onClick={() => setGuidanceOpen(true)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
              guidanceOpen
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-secondary/60 text-foreground hover:bg-secondary'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>{isAr ? 'إرشادات التمرين' : 'Exercise Guidance'}</span>
          </button>

          <button
            id="btn-finish-workout-top"
            onClick={handleFinish}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-black text-white transition-colors"
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>{isAr ? 'إنهاء التمرين' : 'Finish'}</span>
          </button>

          <button
            id="btn-close-active-workout"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Concise Workout Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 custom-scrollbar">
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Exercise Numbered Tabs (1, 2, 3...) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {workout.exercises.map((ex, idx) => (
              <button
                key={ex.exerciseId + idx}
                id={`pill-ex-${idx}`}
                onClick={() => setCurrentExerciseIndex(idx)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                  idx === currentExerciseIndex
                    ? 'border-primary bg-primary text-primary-foreground'
                    : ex.completed
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="font-mono tabular-nums">{idx + 1}.</span>
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {isAr && ex.exerciseNameAr ? ex.exerciseNameAr : ex.exerciseName}
                </span>
                {ex.completed && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            ))}
          </div>

          {/* Main Minimal Active Exercise Card: Essential Exercise Name, Previous Performance & Current Target */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
            {/* Essential Header: Exercise Name + Video + Swap + Specific Exercise Guidance */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black text-foreground">
                  {currentExerciseIndex + 1}. {isAr && currentExercise.exerciseNameAr ? currentExercise.exerciseNameAr : currentExercise.exerciseName}
                </h3>
                {currentExercise.exerciseNameAr && (
                  <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate" dir="ltr">
                    {isAr ? currentExercise.exerciseName : currentExercise.exerciseNameAr}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  id="btn-youtube-english-search"
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${currentExercise.exerciseName} proper form exercise tutorial`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-xl border border-border bg-secondary/60 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors whitespace-nowrap"
                >
                  <Play className="h-3 w-3 fill-current text-red-400" />
                  <span>{isAr ? 'فيديو' : 'Video'}</span>
                </a>

                <button
                  id="btn-quick-swap-exercise"
                  type="button"
                  onClick={() => setSwapExerciseOpen(prev => !prev)}
                  className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                    swapExerciseOpen
                      ? 'border-amber-500 bg-amber-500 text-black'
                      : 'border-border bg-secondary/60 text-foreground hover:bg-secondary'
                  }`}
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  <span>{isAr ? 'تبديل' : 'Swap'}</span>
                </button>

                <button
                  id="btn-open-exercise-guidance"
                  type="button"
                  onClick={() => setGuidanceOpen(true)}
                  className="flex items-center gap-1 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{isAr ? 'إرشادات' : 'Guidance'}</span>
                </button>
              </div>
            </div>

            {/* Instant Exercise Swap Drawer (only when Swap clicked) */}
            <AnimatePresence>
              {swapExerciseOpen && (
                <motion.div
                  id="panel-instant-exercise-swap"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden rounded-xl border border-amber-500/40 bg-secondary/30 p-3.5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-foreground">
                      {isAr ? 'اختر بديلاً مكافئاً حسب المتاح:' : 'Choose Equivalent Movement:'}
                    </span>
                    <div className="flex items-center gap-3">
                      {currentExercise.isSubstituted && currentExercise.originalExerciseId && (
                        <button
                          type="button"
                          onClick={handleRevertToOriginalExercise}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          {isAr ? 'استعادة التمرين الأصلي' : 'Revert Original'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSwapExerciseOpen(false)}
                        className="text-xs font-bold text-muted-foreground hover:text-foreground"
                      >
                        {t.common.cancel}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'all', labelEn: 'All', labelAr: 'الكل' },
                      { id: 'dumbbells', labelEn: 'Dumbbells', labelAr: 'دمبل' },
                      { id: 'cables', labelEn: 'Cables', labelAr: 'كابلات' },
                      { id: 'machines', labelEn: 'Machines', labelAr: 'أجهزة' },
                      { id: 'barbell', labelEn: 'Barbell', labelAr: 'بار' },
                    ].map(eq => (
                      <button
                        key={eq.id}
                        id={`btn-swap-filter-${eq.id}`}
                        type="button"
                        onClick={() => setSwapEquipmentFilter(eq.id as WorkoutEquipmentFilter)}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
                          swapEquipmentFilter === eq.id
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-muted-foreground'
                        }`}
                      >
                        {isAr ? eq.labelAr : eq.labelEn}
                      </button>
                    ))}
                    <button
                      id="btn-swap-filter-joint-safe"
                      type="button"
                      onClick={() => setJointPainFilter(prev => !prev)}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 ${
                        jointPainFilter
                          ? 'border-amber-500/60 bg-amber-500/20 text-amber-400'
                          : 'border-border bg-card text-muted-foreground'
                      }`}
                    >
                      <ShieldAlert className="h-3 w-3" />
                      <span>{isAr ? 'آمن للمفاصل فقط' : 'Joint-Safe Only'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {smartRankedSubstitutes.map(item => {
                      const sub = item.exercise;
                      return (
                        <button
                          key={sub.id}
                          id={`btn-select-substitute-${sub.id}`}
                          type="button"
                          onClick={() => handleSwapExercise(sub, isAr ? item.reasonAr : item.reason)}
                          className="flex items-center justify-between rounded-xl border border-border bg-card p-2.5 text-start hover:border-amber-500/60 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-foreground truncate">
                              {isAr && sub.nameAr ? sub.nameAr : sub.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {isAr && sub.equipmentAr ? sub.equipmentAr : sub.equipment}
                            </div>
                          </div>
                          <ArrowLeftRight className="h-3.5 w-3.5 text-amber-400 shrink-0 ms-2" />
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Concise Target Line (Essential Target Only) */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums text-muted-foreground">
              <span>
                {isAr ? 'الهدف اليوم:' : 'Target:'}{' '}
                <strong className="text-foreground">
                  {currentExercise.sets.length} × {fullExerciseData?.targetRepRange || currentExercise.sets[0]?.targetReps || '8-12'}
                </strong>
              </span>
              {progressionAdvice && progressionAdvice.recommendedWeight > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {isAr ? 'المقترح:' : 'Suggested:'}{' '}
                    <strong className="text-primary">{progressionAdvice.recommendedWeight} kg</strong>
                  </span>
                </>
              )}
            </div>

            {/* Minimal Sets Table: # | Prev | Weight | Reps | RPE | Done */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-1.5 text-center text-[11px] font-bold text-muted-foreground px-2">
                <div className="col-span-1">#</div>
                <div className="col-span-3">{isAr ? 'السابق' : 'Prev'}</div>
                <div className="col-span-3">
                  {weightInputMode === 'total' ? (isAr ? 'الوزن (kg)' : 'Weight') : (isAr ? 'جانب (kg)' : 'Per Side')}
                </div>
                <div className="col-span-2">{isAr ? 'العدات' : 'Reps'}</div>
                <div className="col-span-2">RPE</div>
                <div className="col-span-1">{isAr ? 'تم' : '✓'}</div>
              </div>

              {currentExercise.sets.map((setLog, sIdx) => {
                const currentRpe = typeof setLog.rpe === 'number' ? setLog.rpe : 8;
                const currentW = typeof setLog.actualWeight === 'number' ? setLog.actualWeight : 0;
                const loadCfg = detectExerciseLoadConfig(currentExercise, fullExerciseData);
                const activeBarWeight = barWeightByExercise[currentExercise.exerciseId] ?? loadCfg.defaultBarWeight;
                const perSideVal = toPerSideWeight(currentW, activeBarWeight);
                const displayedInputVal = weightInputMode === 'total' ? currentW : perSideVal;

                const prevSet =
                  comparisonData.lastSession?.sets?.[sIdx] ||
                  comparisonData.lastSession?.sets?.[comparisonData.lastSession.sets.length - 1];

                return (
                  <div
                    key={setLog.id}
                    className={`grid grid-cols-12 items-center gap-1.5 rounded-xl border p-2 transition-colors ${
                      setLog.completed
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-border bg-secondary/20'
                    }`}
                  >
                    {/* Set # */}
                    <div className="col-span-1 text-center text-xs font-black font-mono tabular-nums text-foreground">
                      {setLog.setNumber}
                    </div>

                    {/* Previous Performance Inline */}
                    <div className="col-span-3 text-center text-[11px] font-mono tabular-nums text-muted-foreground">
                      {prevSet ? `${prevSet.weight}×${prevSet.reps}` : '—'}
                    </div>

                    {/* Weight Input + Preset Selector */}
                    <div className="col-span-3 flex items-center rounded-lg border border-border bg-card overflow-hidden">
                      <input
                        id={`input-weight-${setLog.id}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={0.5}
                        value={displayedInputVal}
                        onFocus={e => e.currentTarget.select()}
                        onChange={e => {
                          const raw = parseFloat(e.target.value);
                          const numericVal = Number.isNaN(raw) ? 0 : Math.max(0, raw);
                          const nextTotal =
                            weightInputMode === 'total'
                              ? numericVal
                              : fromPerSideWeight(numericVal, activeBarWeight);
                          handleUpdateSet(setLog.id, 'actualWeight', nextTotal);
                        }}
                        className="w-full min-w-0 bg-transparent py-1.5 px-1 text-center text-xs sm:text-sm font-bold font-mono tabular-nums text-foreground focus:outline-none"
                      />
                      <div className="relative flex h-8 w-5 shrink-0 items-center justify-center border-s border-border bg-secondary/40">
                        <ChevronDown className="h-3 w-3 text-muted-foreground pointer-events-none" />
                        <select
                          id={`select-weight-${setLog.id}`}
                          value={displayedInputVal}
                          onChange={e => {
                            const picked = parseFloat(e.target.value);
                            const nextTotal =
                              weightInputMode === 'total'
                                ? picked
                                : fromPerSideWeight(picked, activeBarWeight);
                            handleUpdateSet(setLog.id, 'actualWeight', nextTotal);
                          }}
                          className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                        >
                          {weightInputMode === 'total'
                            ? WEIGHT_OPTIONS.map(w => (
                                <option key={w} value={w}>
                                  {w} kg
                                </option>
                              ))
                            : PER_SIDE_WEIGHT_OPTIONS.map(sw => (
                                <option key={sw} value={sw}>
                                  {sw} kg/side
                                </option>
                              ))}
                        </select>
                      </div>
                    </div>

                    {/* Reps Selector */}
                    <div className="col-span-2">
                      <select
                        id={`select-reps-${setLog.id}`}
                        value={setLog.actualReps}
                        onChange={e => handleUpdateSet(setLog.id, 'actualReps', parseInt(e.target.value, 10))}
                        className="w-full rounded-lg border border-border bg-card py-1.5 px-1 text-center text-xs font-bold font-mono tabular-nums text-foreground focus:outline-none"
                      >
                        {!REPS_OPTIONS.includes(setLog.actualReps) && setLog.actualReps > 0 && (
                          <option value={setLog.actualReps}>{setLog.actualReps}</option>
                        )}
                        {REPS_OPTIONS.map(r => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Compact RPE Selector */}
                    <div className="col-span-2">
                      <select
                        id={`select-rpe-${setLog.id}`}
                        value={currentRpe}
                        onChange={e => handleUpdateSet(setLog.id, 'rpe', parseFloat(e.target.value))}
                        className="w-full rounded-lg border border-border bg-card py-1.5 px-1 text-center text-xs font-bold font-mono tabular-nums text-foreground focus:outline-none"
                      >
                        {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(val => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Complete Set Check Button */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        id={`btn-toggle-set-${setLog.id}`}
                        onClick={() => handleToggleSetCompletion(setLog)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                          setLog.completed
                            ? 'bg-emerald-500 text-white'
                            : 'border border-border bg-card text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add / Remove Set Row */}
              <div className="flex items-center justify-between pt-2">
                <button
                  id="btn-add-extra-set"
                  onClick={handleAddSet}
                  className="flex items-center gap-1 rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-xs font-bold text-primary hover:bg-secondary"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t.workout.addSet}</span>
                </button>

                {currentExercise.sets.length > 1 && (
                  <button
                    id="btn-remove-last-set"
                    onClick={() => handleRemoveSet(currentExercise.sets[currentExercise.sets.length - 1].id)}
                    className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{t.common.delete}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Prev / Next Exercise Navigation */}
          <div className="flex items-center justify-between gap-2">
            <button
              id="btn-prev-exercise"
              onClick={() => setCurrentExerciseIndex(prev => Math.max(0, prev - 1))}
              disabled={currentExerciseIndex === 0}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground disabled:opacity-40 hover:bg-secondary"
            >
              {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              <span>{t.workout.prevExercise}</span>
            </button>

            <span className="text-xs font-mono tabular-nums font-bold text-muted-foreground">
              {currentExerciseIndex + 1} / {workout.exercises.length}
            </span>

            {currentExerciseIndex < workout.exercises.length - 1 ? (
              <button
                id="btn-next-exercise"
                onClick={() => setCurrentExerciseIndex(prev => Math.min(workout.exercises.length - 1, prev + 1))}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
              >
                <span>{t.workout.nextExercise}</span>
                {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <button
                id="btn-finish-workout-bottom-prominent"
                onClick={handleFinish}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-black text-white"
              >
                <Trophy className="h-4 w-4" />
                <span>{isAr ? 'إنهاء وحفظ التمرين' : 'Finish Workout'}</span>
              </button>
            )}
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
                {timerActive && timerSeconds <= 5 && timerSeconds > 0 && (
                  <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/30">
                    {isAr ? 'استعد للمجموعة' : 'Prepare for Set'}
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
                    <span>{isAr ? 'انتهت فترة الراحة' : 'Rest Complete'}</span>
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
        currentWorkout={workout}
        profile={profile}
        onClose={() => setSmartWarmupOpen(false)}
      />

      {/* RPE & Auto-Regulation Load Adjustment Modal */}
      <RPECalculatorModal
        isOpen={rpeCalculatorOpen}
        profile={profile}
        exercise={currentExercise}
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

      {/* Smart Workout & Exercise Substitution Modal */}
      <WorkoutSubstitutionModal
        isOpen={substitutionModalOpen}
        activeWorkout={workout}
        currentSession={workout}
        currentExerciseIndex={currentExerciseIndex}
        currentExercise={currentExercise}
        profile={profile}
        onClose={() => setSubstitutionModalOpen(false)}
        onConfirmExerciseSwap={(newEx, reason) => {
          handleSubstituteExercise(currentExercise.exerciseId, newEx, reason);
          setSubstitutionModalOpen(false);
        }}
        onSubstituteExercise={(originalId, newEx, reason) => {
          handleSubstituteExercise(originalId, newEx, reason);
          setSubstitutionModalOpen(false);
        }}
        onConfirmDaySwap={(newSession) => {
          handleSubstituteWorkout(newSession);
          setSubstitutionModalOpen(false);
        }}
        onSubstituteWorkout={(newSession, reason) => {
          handleSubstituteWorkout(newSession, reason);
          setSubstitutionModalOpen(false);
        }}
      />

      {/* Exercise Guidance Slide-Out Panel (Per-Side Weight, Plate Calculator, Detailed History & Tools) */}
      <AnimatePresence>
        {guidanceOpen && (
          <div className="fixed inset-0 z-[60] flex justify-end" dir={isAr ? 'rtl' : 'ltr'}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setGuidanceOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.aside
              id="panel-exercise-guidance-drawer"
              aria-label={isAr ? 'إرشادات التمرين' : 'Exercise Guidance'}
              initial={{ x: isAr ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isAr ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className={`fixed inset-y-0 ${isAr ? 'left-0 border-r' : 'right-0 border-l'} z-[61] flex w-full max-w-md flex-col border-border bg-card shadow-2xl`}
            >
              {/* Slide-Out Header */}
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-primary">
                    {isAr ? 'إرشادات التمرين' : 'Exercise Guidance'}
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-foreground truncate">
                    {isAr && currentExercise.exerciseNameAr ? currentExercise.exerciseNameAr : currentExercise.exerciseName}
                  </h4>
                </div>
                <button
                  id="btn-close-exercise-guidance"
                  type="button"
                  onClick={() => setGuidanceOpen(false)}
                  className="rounded-xl border border-border bg-secondary/60 p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Slide-Out Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                {/* 1. Per-Side Weight & Plate Calculator */}
                {(() => {
                  const loadCfg = detectExerciseLoadConfig(currentExercise, fullExerciseData);
                  const activeBarWeight = barWeightByExercise[currentExercise.exerciseId] ?? loadCfg.defaultBarWeight;
                  const safeSetIdx = Math.min(inspectedPlateSetIndex, Math.max(0, currentExercise.sets.length - 1));
                  const inspectedSet = currentExercise.sets[safeSetIdx] || currentExercise.sets[0];
                  const inspectedWeight = inspectedSet?.actualWeight || 0;
                  const perSideWeight = toPerSideWeight(inspectedWeight, activeBarWeight);
                  const breakdown = calculatePlateBreakdown(inspectedWeight, activeBarWeight);

                  return (
                    <section className="space-y-3 border-b border-border pb-5">
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="text-xs sm:text-sm font-black text-foreground">
                          {isAr ? '1. حساب الوزن (يمين/شمال) والطارات' : '1. Per-Side Weight & Plate Calculator'}
                        </h5>

                        {/* Toggle Input Mode (Total vs Per Side) */}
                        <div className="inline-flex rounded-lg border border-border bg-secondary/50 p-0.5 text-[11px] font-bold">
                          <button
                            id="btn-weight-mode-total"
                            type="button"
                            onClick={() => setWeightInputMode('total')}
                            className={`rounded-md px-2.5 py-1 transition-colors ${
                              weightInputMode === 'total'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {isAr ? 'إجمالي' : 'Total'}
                          </button>
                          <button
                            id="btn-weight-mode-per-side"
                            type="button"
                            onClick={() => setWeightInputMode('per_side')}
                            className={`rounded-md px-2.5 py-1 transition-colors ${
                              weightInputMode === 'per_side'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {isAr ? 'لكل جانب' : 'Per Side'}
                          </button>
                        </div>
                      </div>

                      {/* Set Selector for Plate & Per-Side Inspection */}
                      <div className="flex flex-wrap gap-1.5">
                        {currentExercise.sets.map((s, idx) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setInspectedPlateSetIndex(idx)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-bold font-mono tabular-nums ${
                              safeSetIdx === idx
                                ? 'border-primary bg-primary/15 text-primary'
                                : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {isAr ? `م${s.setNumber}` : `S${s.setNumber}`} ({s.actualWeight}kg)
                          </button>
                        ))}
                      </div>

                      {/* Bar Weight Selector */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-muted-foreground">
                          {isAr ? 'وزن البار المستخدم:' : 'Bar Weight:'}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { kg: 0, labelEn: 'No Bar (0)', labelAr: 'بدون بار (0)' },
                            { kg: 10, labelEn: '10kg EZ', labelAr: 'بار 10' },
                            { kg: 15, labelEn: '15kg Bar', labelAr: 'بار 15' },
                            { kg: 20, labelEn: '20kg Bar', labelAr: 'بار 20' },
                          ].map(bar => (
                            <button
                              key={bar.kg}
                              type="button"
                              onClick={() =>
                                setBarWeightByExercise(prev => ({
                                  ...prev,
                                  [currentExercise.exerciseId]: bar.kg,
                                }))
                              }
                              className={`rounded-lg border px-2.5 py-1 text-xs font-bold font-mono ${
                                activeBarWeight === bar.kg
                                  ? 'border-primary bg-primary/15 text-primary'
                                  : 'border-border bg-secondary/40 text-muted-foreground'
                              }`}
                            >
                              {isAr ? bar.labelAr : bar.labelEn}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Calculated Per-Side Split & Plate Breakdown */}
                      <div className="rounded-xl bg-secondary/40 p-3.5 space-y-2.5 text-xs font-mono tabular-nums">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-sans">
                            {isAr ? `المجموعة ${inspectedSet?.setNumber || 1} — الإجمالي:` : `Set ${inspectedSet?.setNumber || 1} Total:`}
                          </span>
                          <span className="font-black text-foreground">{inspectedWeight} kg</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-sans">
                            {isAr ? 'الوزن لكل جانب (يمين / شمال):' : 'Per Side (Right / Left):'}
                          </span>
                          <span className="font-black text-primary">{perSideWeight} kg</span>
                        </div>

                        {activeBarWeight > 0 && (
                          <div className="pt-2 border-t border-border/60 space-y-1.5">
                            <div className="text-[11px] font-sans text-muted-foreground">
                              {isAr ? 'طارات البار المطلوبة على كل جانب:' : 'Plates per bar sleeve:'}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {breakdown.groupedPerSide.length > 0 ? (
                                breakdown.groupedPerSide.map(item => (
                                  <span
                                    key={item.spec.weight}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold"
                                  >
                                    <span>{item.count} × {item.spec.weight} kg</span>
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground font-sans">
                                  {isAr ? 'البار فارغ فقط' : 'Empty bar only'}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })()}

                {/* 2. Detailed History & RPE Progression */}
                <section className="space-y-3 border-b border-border pb-5">
                  <h5 className="text-xs sm:text-sm font-black text-foreground">
                    {isAr ? '2. السجل التفصيلي وتوصية الـ RPE' : '2. Detailed History & RPE Progression'}
                  </h5>

                  {liveRpeSuggestion && nextSet && (
                    <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs flex items-center justify-between gap-2">
                      <span className="text-foreground font-semibold">
                        {isAr
                          ? `اقتراح الـ RPE للمجموعة ${nextSet.setNumber}: ${liveRpeSuggestion.suggestedWeight} كجم`
                          : `RPE suggestion for Set ${nextSet.setNumber}: ${liveRpeSuggestion.suggestedWeight} kg`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplyRPEWeightToNextSet(liveRpeSuggestion.suggestedWeight)}
                        className="rounded-lg bg-primary px-3 py-1 font-bold text-primary-foreground shrink-0"
                      >
                        {isAr ? 'تطبيق' : 'Apply'}
                      </button>
                    </div>
                  )}

                  {nextSessionForecast && (
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-muted-foreground">
                        {isAr ? 'توقع الجلسة القادمة:' : 'Next session forecast:'}
                      </span>
                      <span className="font-mono tabular-nums font-black text-primary">
                        {nextSessionForecast.recommendedWeight} kg ({nextSessionForecast.weightDeltaKg && nextSessionForecast.weightDeltaKg > 0 ? `+${nextSessionForecast.weightDeltaKg}` : nextSessionForecast.weightDeltaKg || 0} kg)
                      </span>
                    </div>
                  )}

                  <ExerciseHistoryComparison
                    currentExercise={currentExercise}
                    history={history}
                    profile={profile}
                    isAr={isAr}
                    onApplyPreset={handleApplyPresetSets}
                  />
                </section>

                {/* 3. Technique Guide, Difficulty & Session Tools */}
                <section className="space-y-3">
                  <h5 className="text-xs sm:text-sm font-black text-foreground">
                    {isAr ? '3. أدوات التمرين والصعوبة' : '3. Technique & Session Controls'}
                  </h5>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-muted-foreground">
                      {isAr ? 'مستوى الصعوبة:' : 'Difficulty:'}
                    </span>
                    <div className="inline-flex rounded-xl border border-border bg-secondary/50 p-1">
                      {(
                        [
                          { id: 'easy', labelAr: 'سهل', labelEn: 'Easy' },
                          { id: 'standard', labelAr: 'قياسي', labelEn: 'Standard' },
                          { id: 'hard', labelAr: 'متقدم', labelEn: 'Hard' },
                        ] as const
                      ).map(lvl => (
                        <button
                          key={lvl.id}
                          id={`btn-modal-difficulty-${lvl.id}`}
                          type="button"
                          onClick={() => handleSelectDifficultyLevel(lvl.id)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                            activeDifficultyLevel === lvl.id
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {isAr ? lvl.labelAr : lvl.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {fullExerciseData && (
                      <button
                        id="btn-view-exercise-guide"
                        type="button"
                        onClick={() => onOpenExerciseDetails(fullExerciseData)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary"
                      >
                        <Info className="h-3.5 w-3.5 text-primary" />
                        <span>{isAr ? 'شرح التكنيك' : 'Form Guide'}</span>
                      </button>
                    )}

                    <button
                      id="btn-open-rpe-calculator"
                      type="button"
                      onClick={() => handleOpenRPECalculator()}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary"
                    >
                      <Calculator className="h-3.5 w-3.5 text-primary" />
                      <span>{t.workout.rpeCalculatorBtn}</span>
                    </button>

                    <button
                      id="btn-warmup-workout-top"
                      type="button"
                      onClick={() => setSmartWarmupOpen(true)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary"
                    >
                      <Flame className="h-3.5 w-3.5 text-amber-400" />
                      <span>{isAr ? 'إحماء 5 دقائق' : '5m Warm-up'}</span>
                    </button>

                    <button
                      id="btn-swap-exercise-toggle"
                      type="button"
                      onClick={() => setSubstitutionModalOpen(true)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-primary" />
                      <span>{isAr ? 'تبديل يوم التمرين' : 'Swap Full Day'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSoundEnabled(prev => !prev)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary"
                  >
                    {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-primary" /> : <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span>{soundEnabled ? (isAr ? 'تنبيهات الصوت: مفعّلة' : 'Audio Cues: On') : (isAr ? 'تنبيهات الصوت: صامت' : 'Audio Cues: Muted')}</span>
                  </button>

                  {/* Knee & Lower-Back Pain Safety Check */}
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 space-y-2.5">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-black text-foreground">
                          {isAr ? 'فحص سلامة الركبة وأسفل الظهر' : 'Knee & Lower-Back Safety Check'}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                          {isAr
                            ? 'إذا شعرت بألم حاد في الركبة أو أسفل الظهر، توقف عن التمرين فوراً واستبدله بحركة منخفضة الضغط.'
                            : 'If you feel sharp knee or lower-back pain, stop this movement immediately and switch to a joint-safe alternative.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {(['knee', 'lower_back'] as const).map(area => (
                        <button
                          key={area}
                          id={`btn-report-pain-${area}`}
                          type="button"
                          onClick={() => {
                            StorageService.addJointPainLog({
                              id: `pain_${Date.now()}`,
                              date: new Date().toISOString().split('T')[0],
                              timestamp: Date.now(),
                              area,
                              severity: 'moderate',
                              exerciseName: isAr && currentExercise.exerciseNameAr ? currentExercise.exerciseNameAr : currentExercise.exerciseName,
                              actionTaken: isAr
                                ? 'إيقاف التمرين وفتح البدائل الآمنة للمفاصل.'
                                : 'Paused movement and opened joint-safe exercise substitutes.',
                            });
                            setJointPainFilter(true);
                            setGuidanceOpen(false);
                            setSwapExerciseOpen(true);
                          }}
                          className="rounded-lg border border-rose-500/40 bg-card/90 px-2.5 py-2 text-[11px] font-bold text-rose-300 hover:bg-rose-500/20 transition-colors"
                        >
                          {area === 'knee'
                            ? isAr ? 'انزعاج الركبة ← بديل آمن' : 'Knee Discomfort → Swap'
                            : isAr ? 'انزعاج أسفل الظهر ← بديل آمن' : 'Back Discomfort → Swap'}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Achievement Confetti PR Toast */}
      <PRAchievementToast
        prEvent={activePRToast}
        profile={profile}
        onClose={() => setActivePRToast(null)}
      />
    </div>
  );
};
