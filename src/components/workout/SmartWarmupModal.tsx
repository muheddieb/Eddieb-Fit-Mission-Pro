import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Volume2, 
  VolumeX, 
  Check, 
  Flame, 
  Sparkles, 
  Shield, 
  Compass, 
  Maximize2, 
  Activity, 
  ArrowDown, 
  Target, 
  Zap, 
  FastForward, 
  CheckCircle2, 
  Waves, 
  Dumbbell,
  Clock,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { UserProfile, ExerciseCategory } from '../../types';
import { translations } from '../../i18n/translations';
import { WarmupEngine, WarmupSequence, WarmupMovement } from '../../services/warmupEngine';
import { AudioService } from '../../services/audioService';

interface SmartWarmupModalProps {
  initialWorkoutType?: ExerciseCategory | 'push' | 'pull' | 'legs' | 'full_body' | 'rest_active' | string;
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onStartWorkout?: () => void;
}

export const SmartWarmupModal: React.FC<SmartWarmupModalProps> = ({
  initialWorkoutType = 'push',
  profile,
  isOpen,
  onClose,
  onStartWorkout
}) => {
  const isAr = profile.language === 'ar';

  // Normalize initial workout type
  const getNormalizedType = (t?: string): 'push' | 'pull' | 'legs' | 'full_body' => {
    const lower = (t || '').toLowerCase();
    if (lower.includes('push') || lower.includes('chest')) return 'push';
    if (lower.includes('pull') || lower.includes('back')) return 'pull';
    if (lower.includes('leg') || lower.includes('squat')) return 'legs';
    return 'push';
  };

  const [selectedType, setSelectedType] = useState<'push' | 'pull' | 'legs' | 'full_body'>(
    getNormalizedType(initialWorkoutType)
  );

  const [sequence, setSequence] = useState<WarmupSequence>(() => 
    WarmupEngine.getWarmupSequence(getNormalizedType(initialWorkoutType), isAr)
  );

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [exerciseSecondsLeft, setExerciseSecondsLeft] = useState<number>(50);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [completedIndices, setCompletedIndices] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // Update sequence whenever selectedType changes
  useEffect(() => {
    const seq = WarmupEngine.getWarmupSequence(selectedType, isAr);
    setSequence(seq);
    setCurrentIdx(0);
    setExerciseSecondsLeft(seq.movements[0]?.durationSeconds || 50);
    setTotalElapsedSeconds(0);
    setCompletedIndices([]);
    setIsCompleted(false);
    setIsPlaying(false);
  }, [selectedType, isAr]);

  // Keep type in sync with initialWorkoutType prop
  useEffect(() => {
    if (initialWorkoutType) {
      setSelectedType(getNormalizedType(initialWorkoutType));
    }
  }, [initialWorkoutType]);

  const currentMovement: WarmupMovement | undefined = sequence.movements[currentIdx];

  // Helper to get movement icon
  const getMovementIcon = (name?: string) => {
    switch (name) {
      case 'RotateCcw': return <RotateCcw className="h-5 w-5" />;
      case 'Maximize2': return <Maximize2 className="h-5 w-5" />;
      case 'Compass': return <Compass className="h-5 w-5" />;
      case 'Shield': return <Shield className="h-5 w-5" />;
      case 'TrendingUp': return <Activity className="h-5 w-5" />;
      case 'Zap': return <Zap className="h-5 w-5" />;
      case 'Waves': return <Waves className="h-5 w-5" />;
      case 'ArrowDown': return <ArrowDown className="h-5 w-5" />;
      case 'Target': return <Target className="h-5 w-5" />;
      case 'FastForward': return <FastForward className="h-5 w-5" />;
      case 'Sparkles': return <Sparkles className="h-5 w-5" />;
      default: return <Flame className="h-5 w-5" />;
    }
  };

  // Timer loop
  useEffect(() => {
    if (isPlaying && !isCompleted) {
      timerRef.current = setInterval(() => {
        setExerciseSecondsLeft(prev => {
          // 5-second prepare cue chime: warn athlete to prepare for next movement
          if (prev === 6 && soundEnabled) {
            AudioService.playPrepareChime(0.22);
          }
          // 3-2-1 second transition tone
          if ((prev === 4 || prev === 3 || prev === 2) && soundEnabled) {
            AudioService.playCountdownWarning(prev - 1, 0.25);
          }

          if (prev <= 1) {
            // Transition to next movement or complete
            handleMovementFinish();
            return 0;
          }
          return prev - 1;
        });

        setTotalElapsedSeconds(tot => Math.min(300, tot + 1));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isCompleted, currentIdx, sequence, soundEnabled]);

  const handleMovementFinish = () => {
    setCompletedIndices(prev => Array.from(new Set([...prev, currentIdx])));

    if (currentIdx < sequence.movements.length - 1) {
      if (soundEnabled) {
        AudioService.playRestStartCue(0.3);
      }
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setExerciseSecondsLeft(sequence.movements[nextIdx].durationSeconds);
    } else {
      // Finished all 6 movements!
      setIsPlaying(false);
      setIsCompleted(true);
      if (soundEnabled) {
        AudioService.playWorkoutEndCue(0.4);
      }
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  };

  const handleTogglePlay = () => {
    if (isCompleted) {
      handleReset();
      setIsPlaying(true);
      return;
    }
    if (!isPlaying && soundEnabled && totalElapsedSeconds === 0) {
      AudioService.playWorkoutStartCue(0.25);
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (currentIdx < sequence.movements.length - 1) {
      setCompletedIndices(prev => Array.from(new Set([...prev, currentIdx])));
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setExerciseSecondsLeft(sequence.movements[nextIdx].durationSeconds);
    } else {
      setIsCompleted(true);
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1;
      setCurrentIdx(prevIdx);
      setExerciseSecondsLeft(sequence.movements[prevIdx].durationSeconds);
    }
  };

  const handleJumpTo = (index: number) => {
    setCurrentIdx(index);
    setExerciseSecondsLeft(sequence.movements[index].durationSeconds);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setIsCompleted(false);
    setCurrentIdx(0);
    setExerciseSecondsLeft(sequence.movements[0]?.durationSeconds || 50);
    setTotalElapsedSeconds(0);
    setCompletedIndices([]);
  };

  if (!isOpen) return null;

  const totalProgressPercent = Math.min(100, Math.round((totalElapsedSeconds / 300) * 100));
  const currentDuration = currentMovement?.durationSeconds || 50;
  const currentMovementProgressPercent = Math.round(((currentDuration - exerciseSecondsLeft) / currentDuration) * 100);

  return (
    <AnimatePresence>
      <div 
        id="smart-warmup-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        >
          {/* Header Banner with Gradient Accent */}
          <div className="relative border-b border-border bg-secondary/30 px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-foreground">
                      {isAr ? sequence.titleAr : sequence.title}
                    </h2>
                    <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-black uppercase text-amber-400 border border-amber-500/30">
                      5:00 MIN
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {isAr ? sequence.subtitleAr : sequence.subtitle}
                  </p>
                </div>
              </div>

              {/* Close & Sound controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? (isAr ? 'كتم الصوت' : 'Mute Sound') : (isAr ? 'تشغيل الصوت' : 'Unmute Sound')}
                  className={`p-2 rounded-xl border transition-colors ${
                    soundEnabled 
                      ? 'bg-secondary text-foreground border-border hover:bg-secondary/80' 
                      : 'bg-destructive/10 text-destructive border-destructive/20'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>

                <button
                  id="btn-close-smart-warmup"
                  onClick={onClose}
                  className="rounded-xl border border-border bg-secondary/40 p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Workout Type Selector Tabs */}
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                {isAr ? 'نوع الجلسة:' : 'Session Type:'}
              </span>
              {(['push', 'pull', 'legs', 'full_body'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap capitalize flex items-center gap-1.5 ${
                    selectedType === type
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {type === 'push' && <Dumbbell className="h-3 w-3" />}
                  {type === 'pull' && <ArrowDown className="h-3 w-3" />}
                  {type === 'legs' && <Activity className="h-3 w-3" />}
                  {type === 'full_body' && <Sparkles className="h-3 w-3" />}
                  <span>
                    {type === 'push' && (isAr ? 'دفع (Push)' : 'Push Day')}
                    {type === 'pull' && (isAr ? 'سحب (Pull)' : 'Pull Day')}
                    {type === 'legs' && (isAr ? 'أرجل (Legs)' : 'Legs Day')}
                    {type === 'full_body' && (isAr ? 'شامل (Full Body)' : 'Full Body')}
                  </span>
                </button>
              ))}
            </div>

            {/* Total 5-Minute Overall Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground mb-1">
                <span>{isAr ? 'التقدم الإجمالي للإحماء' : 'Total 5-Min Warm-up Progress'}</span>
                <span className="font-mono text-foreground">
                  {Math.floor(totalElapsedSeconds / 60)}:{(totalElapsedSeconds % 60).toString().padStart(2, '0')} / 5:00 ({totalProgressPercent}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/80">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 to-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalProgressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Modal Body: Active Movement Card & Controls */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {isCompleted ? (
              /* Completed State */
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-foreground">
                    {isAr ? 'أحسنت! جسمك جاهز ومحمى بنسبة 100%' : 'Smart Warm-up Completed!'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                    {isAr 
                      ? 'تم تليين المفاصل وتنشيط الكفة المدورة والجهاز العصبي. أنت جاهز لرفع أوزانك الأولى بأمان وقوة!'
                      : 'Joints lubricated, neural pathways primed, and core temperature elevated. You are ready to crush your heavy sets!'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/80"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>{isAr ? 'إعادة الإحماء' : 'Restart Warm-up'}</span>
                  </button>

                  {onStartWorkout && (
                    <button
                      onClick={() => {
                        onClose();
                        onStartWorkout();
                      }}
                      className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-transform active:scale-95"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      <span>{isAr ? 'بدء التمرين الآن!' : 'Start Workout Now!'}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : currentMovement ? (
              /* Active Exercise Display */
              <div className="space-y-5">
                {/* Movement Title & Step Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                      {getMovementIcon(currentMovement.iconName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase">
                        <span>{isAr ? `الحركة ${currentIdx + 1} من ${sequence.movements.length}` : `Movement ${currentIdx + 1} of ${sequence.movements.length}`}</span>
                        <span>•</span>
                        <span className="text-muted-foreground">{currentMovement.durationSeconds}s</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-foreground">
                        {isAr ? currentMovement.nameAr : currentMovement.name}
                      </h3>
                    </div>
                  </div>

                  {/* Target Reps / Tempo Badge */}
                  <div className="rounded-xl border border-border bg-secondary/50 px-3 py-1.5 text-right sm:text-left">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">
                      {isAr ? 'الإيقاع المقترح' : 'Target Tempo / Reps'}
                    </div>
                    <div className="text-xs font-bold text-foreground">
                      {isAr ? currentMovement.repsOrTempoAr : currentMovement.repsOrTempo}
                    </div>
                  </div>
                </div>

                {/* Primary Timer & Playback Bar */}
                <div className="rounded-2xl border border-border bg-secondary/20 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Countdown Clock */}
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-card border border-border shadow-inner font-mono font-black text-3xl text-foreground">
                      {exerciseSecondsLeft}
                      <span className="absolute bottom-1 text-[9px] uppercase tracking-wider text-muted-foreground font-sans font-bold">
                        SEC
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{isAr ? 'مؤقت الحركة الحالية' : 'Movement Timer'}</span>
                        {isPlaying && (
                          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        )}
                      </div>
                      <div className="text-xs text-foreground font-semibold mt-0.5">
                        {exerciseSecondsLeft <= 5 && exerciseSecondsLeft > 0 ? (
                          <span className="text-amber-400 font-bold animate-pulse">
                            🔔 {isAr ? 'استعد للانتقال للحركة التالية!' : 'Prepare for next movement!'}
                          </span>
                        ) : (
                          <span>
                            {isPlaying ? (isAr ? 'جاري الحركة...' : 'Perform fluid reps...') : (isAr ? 'متوقف مؤقتاً' : 'Paused')}
                          </span>
                        )}
                      </div>

                      {/* Movement Mini Progress */}
                      <div className="w-36 sm:w-48 h-1.5 rounded-full bg-secondary mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${currentMovementProgressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrev}
                      disabled={currentIdx === 0}
                      className="p-3 rounded-xl border border-border bg-secondary/50 text-foreground disabled:opacity-30 hover:bg-secondary transition-colors"
                      title={isAr ? 'الحركة السابقة' : 'Previous Movement'}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                      onClick={handleTogglePlay}
                      className="flex h-12 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-lg hover:bg-primary/90 transition-transform active:scale-95"
                    >
                      {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
                    </button>

                    <button
                      onClick={handleNext}
                      className="p-3 rounded-xl border border-border bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
                      title={isAr ? 'الحركة التالية' : 'Next Movement'}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    <button
                      onClick={handleReset}
                      className="p-3 rounded-xl border border-border bg-secondary/30 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      title={isAr ? 'إعادة ضبط' : 'Reset'}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Biomechanical Rationale & Anatomy Pill Badges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Target Anatomy & Joints */}
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        {isAr ? 'المفاصل المستهدفة' : 'Target Joint Complexes'}
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {(isAr ? currentMovement.targetJointsAr : currentMovement.targetJoints).map((j, i) => (
                          <span key={i} className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-foreground">
                            {j}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        {isAr ? 'العضلات المستهدفة' : 'Activated Muscle Groups'}
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {(isAr ? currentMovement.targetMusclesAr : currentMovement.targetMuscles).map((m, i) => (
                          <span key={i} className="rounded-md bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs font-bold">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Why This Matters (Biomechanical Rationale) */}
                  <div className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{isAr ? 'لماذا هذه الحركة ضرورية لتمرينك؟' : 'Biomechanical Rationale'}</span>
                      </div>
                      <p className="text-xs text-foreground mt-2 leading-relaxed">
                        {isAr ? currentMovement.rationaleAr : currentMovement.rationale}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <span className="font-bold text-foreground">{isAr ? 'التنفس:' : 'Breathing:'}</span>
                      <span>{isAr ? currentMovement.breathingAr : currentMovement.breathing}</span>
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Execution Cues */}
                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-primary" />
                    <span>{isAr ? 'خطوات الأداء والتكنيك السليم' : 'Step-by-Step Execution Cues'}</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-foreground list-disc list-inside">
                    {(isAr ? currentMovement.cuesAr : currentMovement.cues).map((cue, i) => (
                      <li key={i} className="leading-relaxed">
                        {cue}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            {/* Sequence Timeline Strip */}
            <div className="pt-2 border-t border-border">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {isAr ? 'تسلسل الحركات (6 حركات × 50 ثانية):' : 'Sequence Overview (6 Movements × 50s):'}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {sequence.movements.map((mov, idx) => {
                  const isCurrent = idx === currentIdx;
                  const isDone = completedIndices.includes(idx);

                  return (
                    <button
                      key={mov.id}
                      onClick={() => handleJumpTo(idx)}
                      className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                        isCurrent
                          ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary'
                          : isDone
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-foreground'
                          : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span>#{idx + 1}</span>
                        {isDone ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <span>{mov.durationSeconds}s</span>
                        )}
                      </div>
                      <div className="font-bold text-[11px] mt-1 line-clamp-1 text-foreground">
                        {isAr ? mov.nameAr : mov.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="border-t border-border bg-card px-5 py-3.5 sm:px-6 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary/80"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>

            <div className="flex items-center gap-2">
              {onStartWorkout && (
                <button
                  id="btn-warmup-to-workout"
                  onClick={() => {
                    onClose();
                    onStartWorkout();
                  }}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{isAr ? 'الانتقال للتمرين' : 'Start Workout'}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
