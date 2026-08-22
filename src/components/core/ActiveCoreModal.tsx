import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Check, 
  Timer, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Flame, 
  Trophy, 
  Plus, 
  Minus,
  Play, 
  Pause, 
  ShieldCheck, 
  Activity,
  SkipForward,
  Volume2,
  VolumeX,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { CoreExercise, CoreSession, UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { StorageService } from '../../services/storage';
import { WakeLockService } from '../../services/wakeLockService';

export interface CoreRoutine {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  exercises: {
    exercise: CoreExercise;
    sets: number;
    targetReps: number;
    restSeconds: number;
  }[];
}

interface ActiveCoreModalProps {
  routine: CoreRoutine;
  profile: UserProfile;
  onClose: () => void;
  onFinish: (session: CoreSession) => void;
}

export const ActiveCoreModal: React.FC<ActiveCoreModalProps> = ({
  routine,
  profile,
  onClose,
  onFinish,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [currentExIndex, setCurrentExIndex] = useState<number>(0);
  const [currentSet, setCurrentSet] = useState<number>(1);
  const [currentReps, setCurrentReps] = useState<number>(0);
  const [completedSetsCount, setCompletedSetsCount] = useState<number>(0);

  // Rest Timer State
  const [isResting, setIsResting] = useState<boolean>(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const timerRef = useRef<any>(null);
  const elapsedRef = useRef<any>(null);

  const currentItem = routine.exercises[currentExIndex] || routine.exercises[0];
  const currentEx = currentItem.exercise;
  const targetSets = currentItem.sets;
  const targetReps = currentItem.targetReps;
  const restDuration = currentItem.restSeconds || 45;

  const totalExercisesCount = routine.exercises.length;
  const totalSetsInRoutine = routine.exercises.reduce((acc, curr) => acc + curr.sets, 0);

  // Screen Wake Lock
  useEffect(() => {
    WakeLockService.acquire(profile.screenWakeDuration || 'never');
    return () => {
      WakeLockService.release();
    };
  }, [profile.screenWakeDuration]);

  // Overall workout elapsed timer
  useEffect(() => {
    if (!isPaused) {
      elapsedRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(elapsedRef.current);
    }
    return () => clearInterval(elapsedRef.current);
  }, [isPaused]);

  // Audio tone generator
  const playTone = (freq = 880) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // safe fallback
    }
  };

  // Rest countdown
  useEffect(() => {
    if (isResting && restSecondsLeft > 0 && !isPaused) {
      timerRef.current = setInterval(() => {
        setRestSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsResting(false);
            playTone(950);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isResting, restSecondsLeft, isPaused]);

  // Add a rep
  const handleAddRep = () => {
    playTone(520);
    setCurrentReps(prev => {
      const next = prev + 1;
      if (next >= targetReps) {
        // Target reached, complete set after slight feedback
        setTimeout(() => {
          handleCompleteSet(next);
        }, 180);
      }
      return next;
    });
  };

  // Complete current set
  const handleCompleteSet = (finalReps?: number) => {
    playTone(680);
    setCompletedSetsCount(prev => prev + 1);

    const isLastSetOfEx = currentSet >= targetSets;
    const isLastEx = currentExIndex >= totalExercisesCount - 1;

    if (isLastSetOfEx && isLastEx) {
      // All exercises finished!
      handleFinishWorkout();
      return;
    }

    // Trigger rest timer
    setIsResting(true);
    setRestSecondsLeft(restDuration);

    if (isLastSetOfEx) {
      // Move to next exercise
      setCurrentExIndex(prev => prev + 1);
      setCurrentSet(1);
      setCurrentReps(0);
    } else {
      // Move to next set
      setCurrentSet(prev => prev + 1);
      setCurrentReps(0);
    }
  };

  const handleSkipRest = () => {
    setIsResting(false);
    setRestSecondsLeft(0);
  };

  const handleFinishWorkout = () => {
    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const session: CoreSession = {
      id: 'core_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      routineName: routine.name,
      routineNameAr: routine.nameAr,
      exercisesCount: routine.exercises.length,
      setsCompleted: Math.max(1, completedSetsCount + 1),
      durationMinutes,
      completed: true,
      timestamp: Date.now(),
    };

    StorageService.addCoreSession(session);

    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    WakeLockService.release();
    onFinish(session);
  };

  const progressPercent = Math.min(
    100,
    Math.round((completedSetsCount / Math.max(1, totalSetsInRoutine)) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-card/90 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Flame className="h-5 w-5 fill-current" />
          </div>
          <div>
            <h2 className="text-base font-black text-foreground sm:text-lg">
              {isAr ? routine.nameAr : routine.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{isAr ? `تمرين ${currentExIndex + 1} من ${totalExercisesCount}` : `Ex ${currentExIndex + 1}/${totalExercisesCount}`}</span>
              <span>•</span>
              <span>{Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Audio feedback toggle"
          >
            {soundEnabled ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5" />}
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              isPaused 
                ? 'bg-amber-500 text-black shadow-md' 
                : 'border border-border bg-secondary text-foreground hover:bg-secondary/80'
            }`}
          >
            {isPaused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5" />}
            <span>{isPaused ? (isAr ? 'استئناف' : 'Resume') : (isAr ? 'إيقاف مؤقت' : 'Pause')}</span>
          </button>

          <button
            onClick={handleFinishWorkout}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-colors"
          >
            <Trophy className="h-4 w-4" />
            <span>{isAr ? 'إنهاء وحفظ' : 'Finish'}</span>
          </button>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar Header */}
      <div className="w-full bg-secondary/60 h-1.5">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Core Trainer Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar flex flex-col justify-between max-w-2xl mx-auto w-full">
        {/* Rest Overlay or Main Interactive Set Card */}
        <AnimatePresence mode="wait">
          {isResting ? (
            <motion.div
              key="rest-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="my-auto rounded-3xl border border-primary/40 bg-card/90 p-8 text-center shadow-2xl space-y-6"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-xs font-bold text-primary">
                <Timer className="h-4 w-4 animate-spin" />
                <span>{isAr ? 'فترة الراحة والاستشفاء' : 'Rest & Recovery Interval'}</span>
              </div>

              <div className="font-mono text-6xl sm:text-7xl font-black text-primary">
                {Math.floor(restSecondsLeft / 60)}:{(restSecondsLeft % 60).toString().padStart(2, '0')}
              </div>

              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {isAr
                  ? 'تنفس بعمق وقم بتهدئة ضربات القلب استعداداً للمجموعة التالية بقوة وثبات عالي.'
                  : 'Breathe diaphragmatically and stabilize intra-abdominal pressure for maximum core tension next set.'}
              </p>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setRestSecondsLeft(prev => prev + 15)}
                  className="rounded-xl border border-border bg-secondary/80 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
                >
                  +15s
                </button>
                <button
                  onClick={handleSkipRest}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                >
                  <SkipForward className="h-4 w-4" />
                  <span>{isAr ? 'تخطي الراحة والبدء' : 'Skip Rest'}</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`ex-view-${currentExIndex}-${currentSet}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 my-auto"
            >
              {/* Exercise Details Card */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-xl text-center space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span className="rounded-lg bg-secondary px-2.5 py-1 text-foreground">
                    {isAr ? `تمرين ${currentExIndex + 1} من ${totalExercisesCount}` : `Exercise ${currentExIndex + 1}/${totalExercisesCount}`}
                  </span>
                  <span className="rounded-lg bg-primary/20 text-primary px-2.5 py-1 font-bold">
                    {isAr ? `المجموعة ${currentSet} من ${targetSets}` : `Set ${currentSet} of ${targetSets}`}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                    {isAr && currentEx.nameAr ? currentEx.nameAr : currentEx.name}
                  </h3>
                  <p className="text-xs text-primary font-bold mt-1">
                    {currentEx.primaryPattern} • {currentEx.equipment}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                  {isAr && currentEx.descriptionAr ? currentEx.descriptionAr : currentEx.description}
                </p>

                {/* Progress Indicators */}
                <div className="flex items-center justify-center gap-6 pt-2">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground font-bold">{isAr ? 'التكرارات الحالية' : 'Current'}</div>
                    <div className="text-3xl font-black text-foreground font-mono">{currentReps}</div>
                  </div>
                  <div className="text-2xl font-light text-muted-foreground">/</div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground font-bold">{isAr ? 'الهدف' : 'Target'}</div>
                    <div className="text-3xl font-black text-primary font-mono">{targetReps}</div>
                  </div>
                </div>

                {/* Big Rep Counter Action Button */}
                <div className="pt-4 flex flex-col items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    id="btn-add-core-rep"
                    onClick={handleAddRep}
                    className="flex h-32 w-32 sm:h-36 sm:w-36 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all font-black"
                  >
                    <Plus className="h-8 w-8 mb-1" />
                    <span className="text-sm uppercase tracking-widest">{isAr ? '+1 تكرار' : '+1 REP'}</span>
                  </motion.button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentReps(prev => Math.max(0, prev - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                      title="Minus 1 rep"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setCurrentReps(prev => prev + 5)}
                      className="rounded-lg border border-border bg-secondary px-3 py-1 text-xs font-bold text-foreground hover:bg-secondary/80"
                    >
                      +5 Reps
                    </button>
                    <button
                      onClick={() => handleCompleteSet(currentReps)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-bold hover:bg-emerald-600/30"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{isAr ? 'إكمال المجموعة' : 'Done Set'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Routine Footer Summary */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 mt-6 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>{isAr ? 'ثبات الجذع وتفعيل عضلات البطن العميقة' : 'Intra-abdominal stability active'}</span>
          </div>
          <div className="font-bold text-foreground">
            {completedSetsCount} / {totalSetsInRoutine} {isAr ? 'مجموعات مكتملة' : 'sets completed'}
          </div>
        </div>
      </div>
    </div>
  );
};
