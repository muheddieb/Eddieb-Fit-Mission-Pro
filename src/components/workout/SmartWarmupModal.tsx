import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Info,
  Sliders,
  RefreshCw,
  Layers,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { UserProfile, ExerciseCategory, WorkoutSession } from '../../types';
import { translations } from '../../i18n/translations';
import { 
  WarmupEngine, 
  WarmupSequence, 
  WarmupMovement, 
  SessionMuscleAnalysis,
  WarmupGenerationOptions 
} from '../../services/warmupEngine';
import { AudioService } from '../../services/audioService';

interface SmartWarmupModalProps {
  initialWorkoutType?: ExerciseCategory | 'push' | 'pull' | 'legs' | 'full_body' | 'rest_active' | string;
  currentWorkout?: WorkoutSession;
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onStartWorkout?: () => void;
}

export const SmartWarmupModal: React.FC<SmartWarmupModalProps> = ({
  initialWorkoutType = 'push',
  currentWorkout,
  profile,
  isOpen,
  onClose,
  onStartWorkout
}) => {
  const isAr = profile?.language === 'ar';

  // Modal active tab: 'player' (interactive guided workout) | 'generator' (dynamic muscle analysis & generator)
  const [activeTab, setActiveTab] = useState<'player' | 'generator'>('player');

  // Generator options
  const [durationMinutes, setDurationMinutes] = useState<3 | 5 | 8>(5);
  const [focusMode, setFocusMode] = useState<'balanced' | 'mobility' | 'activation' | 'stretching'>('balanced');
  const [stiffAreas, setStiffAreas] = useState<string[]>([]);
  const [regeneratedPulse, setRegeneratedPulse] = useState<boolean>(false);

  // Analyze muscles for current workout
  const muscleAnalysis: SessionMuscleAnalysis = useMemo(() => {
    if (currentWorkout) {
      return WarmupEngine.analyzeSessionMuscles(currentWorkout);
    }
    // Fallback if no full workout is provided
    const dummyWorkout: WorkoutSession = {
      id: 'default',
      date: new Date().toISOString().split('T')[0],
      name: initialWorkoutType || 'Workout Session',
      nameAr: initialWorkoutType || 'جلسة التمرين',
      type: (initialWorkoutType || 'push') as any,
      mode: profile.mode || 'muscle_recomp',
      durationMinutes: 45,
      completed: false,
      exercises: []
    };
    return WarmupEngine.analyzeSessionMuscles(dummyWorkout);
  }, [currentWorkout, initialWorkoutType]);

  // Generate sequence
  const [sequence, setSequence] = useState<WarmupSequence>(() => {
    if (currentWorkout) {
      return WarmupEngine.generateDynamicWarmup(currentWorkout, {
        durationMinutes: 5,
        focusMode: 'balanced',
        stiffAreas: [],
        isAr
      });
    }
    return WarmupEngine.getWarmupSequence(initialWorkoutType, isAr);
  });

  // Playback state
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [exerciseSecondsLeft, setExerciseSecondsLeft] = useState<number>(50);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [completedIndices, setCompletedIndices] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // Sync sequence when currentWorkout or options change
  const buildAndApplySequence = (dur = durationMinutes, foc = focusMode, stiff = stiffAreas) => {
    if (currentWorkout) {
      const newSeq = WarmupEngine.generateDynamicWarmup(currentWorkout, {
        durationMinutes: dur,
        focusMode: foc,
        stiffAreas: stiff,
        isAr
      });
      setSequence(newSeq);
      setCurrentIdx(0);
      setExerciseSecondsLeft(newSeq.movements[0]?.durationSeconds || 50);
      setTotalElapsedSeconds(0);
      setCompletedIndices([]);
      setIsCompleted(false);
      setIsPlaying(false);
    } else {
      const newSeq = WarmupEngine.getWarmupSequence(initialWorkoutType, isAr);
      setSequence(newSeq);
      setCurrentIdx(0);
      setExerciseSecondsLeft(newSeq.movements[0]?.durationSeconds || 50);
      setTotalElapsedSeconds(0);
      setCompletedIndices([]);
      setIsCompleted(false);
      setIsPlaying(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (isOpen) {
      buildAndApplySequence(durationMinutes, focusMode, stiffAreas);
    }
  }, [isOpen, currentWorkout, initialWorkoutType, isAr]);

  const currentMovement: WarmupMovement | undefined = sequence.movements[currentIdx];

  // Helper to get movement icon
  const getMovementIcon = (name?: string) => {
    switch (name) {
      case 'RotateCcw': return <RotateCcw className="h-5 w-5" />;
      case 'Maximize2': return <Maximize2 className="h-5 w-5" />;
      case 'Compass': return <Compass className="h-5 w-5" />;
      case 'Shield': return <Shield className="h-5 w-5" />;
      case 'Activity': return <Activity className="h-5 w-5" />;
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

        setTotalElapsedSeconds(tot => Math.min(sequence.totalDurationSeconds, tot + 1));
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
      // Finished all movements!
      setIsPlaying(false);
      setIsCompleted(true);
      if (soundEnabled) {
        AudioService.playWorkoutEndCue(0.4);
      }
      try {
        confetti({
          particleCount: 90,
          spread: 75,
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

  const toggleStiffArea = (area: string) => {
    setStiffAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const handleRegenerate = () => {
    buildAndApplySequence(durationMinutes, focusMode, stiffAreas);
    setRegeneratedPulse(true);
    setTimeout(() => setRegeneratedPulse(false), 2000);
  };

  const handleStartFromGenerator = () => {
    buildAndApplySequence(durationMinutes, focusMode, stiffAreas);
    setActiveTab('player');
    setIsPlaying(true);
  };

  if (!isOpen) return null;

  const totalSecsTarget = sequence.totalDurationSeconds || 300;
  const totalProgressPercent = Math.min(100, Math.round((totalElapsedSeconds / totalSecsTarget) * 100));
  const currentDuration = currentMovement?.durationSeconds || 50;
  const currentMovementProgressPercent = Math.round(((currentDuration - exerciseSecondsLeft) / currentDuration) * 100);

  return (
    <AnimatePresence>
      <div 
        id="smart-warmup-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        >
          {/* Header Banner */}
          <div className="relative border-b border-border bg-secondary/30 px-4 py-3.5 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
                  <Flame className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-foreground truncate">
                      {isAr ? sequence.titleAr : sequence.title}
                    </h2>
                    <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-black uppercase text-amber-400 border border-amber-500/30 whitespace-nowrap">
                      {Math.round(sequence.totalDurationSeconds / 60)}:00 MIN
                    </span>
                    {currentWorkout && (
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20 whitespace-nowrap">
                        {isAr ? 'مخصص للجلستك' : 'Session Tailored'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {isAr ? sequence.subtitleAr : sequence.subtitle}
                  </p>
                </div>
              </div>

              {/* Action Controls: Sound & Close */}
              <div className="flex items-center gap-2 shrink-0">
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

            {/* Navigation Tabs: Guided Player vs. Dynamic Generator */}
            <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-secondary/50 p-1 rounded-xl border border-border">
                <button
                  id="tab-warmup-player"
                  onClick={() => setActiveTab('player')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'player'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>{isAr ? 'المشغّل التفاعلي' : 'Interactive Player'}</span>
                </button>

                <button
                  id="tab-warmup-generator"
                  onClick={() => setActiveTab('generator')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'generator'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>{isAr ? 'مُولّد الإحماء وتحليل العضلات' : 'Dynamic Generator & Muscles'}</span>
                  {currentWorkout && (
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              </div>

              {/* Progress pill if in player mode */}
              {activeTab === 'player' && (
                <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                  <span className="font-bold text-foreground">
                    {Math.floor(totalElapsedSeconds / 60)}:{(totalElapsedSeconds % 60).toString().padStart(2, '0')}
                  </span>
                  <span>/</span>
                  <span>{Math.round(sequence.totalDurationSeconds / 60)}:00</span>
                  <span className="text-primary font-bold">({totalProgressPercent}%)</span>
                </div>
              )}
            </div>

            {/* Overall Progress Line */}
            {activeTab === 'player' && (
              <div className="mt-2.5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/80">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${totalProgressPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
            {activeTab === 'generator' ? (
              /* ================= DYNAMIC GENERATOR VIEW ================= */
              <div className="space-y-6">
                {/* 1. Detected Muscles in Session */}
                <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                        {isAr ? 'تحليل العضلات المستهدفة في جلستك' : 'Session Targeted Muscles Breakdown'}
                      </h3>
                    </div>
                    {currentWorkout && (
                      <span className="text-xs text-muted-foreground font-semibold">
                        {workoutExercisesCount(currentWorkout)} {isAr ? 'تمارين مكتشفة' : 'exercises detected'}
                      </span>
                    )}
                  </div>

                  {/* Muscle Badges & Percentages */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1">
                    {muscleAnalysis.primaryMuscles.map((m, idx) => (
                      <div 
                        key={idx}
                        className="rounded-xl border border-border bg-secondary/40 p-2.5 flex flex-col justify-between space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-foreground truncate">{isAr ? m.nameAr : m.name}</span>
                          <span className="text-primary font-mono">{m.percentage}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${Math.min(100, m.percentage * 1.5)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Detected Exercises Chips */}
                  {muscleAnalysis.targetExerciseNames.length > 0 && (
                    <div className="pt-2 border-t border-border/60">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {isAr ? 'التمارين الرئيسية المرتبطة بالإحماء:' : 'Target exercises primed by this sequence:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {muscleAnalysis.targetExerciseNames.map((ex, i) => (
                          <span key={i} className="rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground border border-border/50">
                            {isAr ? ex.ar : ex.en}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detected Joint Complexes */}
                  {muscleAnalysis.detectedJointComplexes.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {isAr ? 'المفاصل التي سيتم تليينها بيوميكانيكياً:' : 'Key Joint Complexes Prepared:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {muscleAnalysis.detectedJointComplexes.map((joint, i) => (
                          <span key={i} className="rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 text-xs font-bold">
                            {isAr ? joint.nameAr : joint.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Customizer Controls */}
                <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-black text-foreground uppercase tracking-wider">
                    <Sliders className="h-4 w-4 text-primary" />
                    <span>{isAr ? 'خيارات تخصيص الإحماء' : 'Dynamic Generator Parameters'}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Duration Picker */}
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-2">
                        {isAr ? 'مدة الإحماء المطلوبة:' : 'Warm-up Duration:'}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { min: 3 as const, labelEn: '3m Express', labelAr: '3 د سريعة', count: '4 drills' },
                          { min: 5 as const, labelEn: '5m Standard', labelAr: '5 د مثالية', count: '6 drills' },
                          { min: 8 as const, labelEn: '8m Deep', labelAr: '8 د عميقة', count: '8 drills' }
                        ].map(item => (
                          <button
                            key={item.min}
                            onClick={() => setDurationMinutes(item.min)}
                            className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                              durationMinutes === item.min
                                ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                                : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary'
                            }`}
                          >
                            <span className="text-xs font-black">{isAr ? item.labelAr : item.labelEn}</span>
                            <span className="text-[10px] opacity-75 font-semibold">{item.count}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Focus Mode Picker */}
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-2">
                        {isAr ? 'أسلوب التركيز:' : 'Focus Strategy:'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'balanced' as const, en: 'Balanced', ar: 'متوازن وشامل' },
                          { id: 'mobility' as const, en: 'Joint Mobility', ar: 'مرونة المفاصل' },
                          { id: 'activation' as const, en: 'Neuromuscular', ar: 'تفعيل عضلات التثبيت' },
                          { id: 'stretching' as const, en: 'Dynamic Stretch', ar: 'إطالات حركية' }
                        ].map(m => (
                          <button
                            key={m.id}
                            onClick={() => setFocusMode(m.id)}
                            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all text-center ${
                              focusMode === m.id
                                ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                                : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary'
                            }`}
                          >
                            {isAr ? m.ar : m.en}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stiff Areas Add-on Boosters */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-2">
                      {isAr ? 'مناطق تشعر فيها بالشد أو تحتاج لعناية خاصة (اختياري):' : 'Areas of tightness / extra focus (Optional):'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'shoulders', en: 'Shoulders & Rotator Cuff', ar: 'الأكتاف والكفة المدورة' },
                        { id: 'hips', en: 'Hips & Pelvis', ar: 'الحوض والعضلات الضامة' },
                        { id: 'lower_back', en: 'Lower Back & Spine', ar: 'أسفل الظهر والعمود الفقري' },
                        { id: 'ankles', en: 'Ankles & Calves', ar: 'الكواحل والسمانة' },
                        { id: 'wrists', en: 'Wrists & Forearms', ar: 'المعاصم والساعدين' }
                      ].map(area => {
                        const active = stiffAreas.includes(area.id);
                        return (
                          <button
                            key={area.id}
                            onClick={() => toggleStiffArea(area.id)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                              active
                                ? 'border-amber-500 bg-amber-500/15 text-amber-400 font-bold'
                                : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary'
                            }`}
                          >
                            {active ? <Check className="h-3.5 w-3.5" /> : <span>+</span>}
                            <span>{isAr ? area.ar : area.en}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Regenerate Action Banner */}
                  <div className="pt-2 flex items-center justify-between flex-wrap gap-3 border-t border-border/60">
                    <button
                      id="btn-regenerate-dynamic-warmup"
                      onClick={handleRegenerate}
                      className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-all active:scale-95"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>{isAr ? 'إعادة بناء السلسلة وفق المعطيات' : 'Update & Re-calibrate Sequence'}</span>
                    </button>

                    {regeneratedPulse && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-bounce">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{isAr ? 'تم تحديث الحركات خصيصاً لجلسة اليوم!' : 'Sequence re-calibrated successfully!'}</span>
                      </span>
                    )}

                    <button
                      id="btn-start-warmup-from-generator"
                      onClick={handleStartFromGenerator}
                      className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-transform active:scale-95"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      <span>{isAr ? `بدء الإحماء المخصص (${durationMinutes} دقائق)` : `Start Tailored Warm-up (${durationMinutes}m)`}</span>
                    </button>
                  </div>
                </div>

                {/* 3. Generated Movements Sequence Preview */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                      {isAr ? `الحركات المقترحة بالتسلسل (${sequence.movements.length} حركات):` : `Generated Sequence Preview (${sequence.movements.length} movements):`}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sequence.movements.map((mov, idx) => (
                      <div 
                        key={mov.id + idx}
                        className="rounded-xl border border-border bg-card p-3.5 space-y-2 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-primary flex items-center gap-1.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px]">
                              {idx + 1}
                            </span>
                            <span>{mov.durationSeconds}s</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            {isAr ? mov.repsOrTempoAr : mov.repsOrTempo}
                          </span>
                        </div>

                        <div className="font-bold text-sm text-foreground">
                          {isAr ? mov.nameAr : mov.name}
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {isAr ? mov.rationaleAr : mov.rationale}
                        </p>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {(isAr ? mov.targetMusclesAr : mov.targetMuscles).slice(0, 2).map((m, i) => (
                            <span key={i} className="text-[10px] bg-secondary px-2 py-0.5 rounded text-foreground font-medium">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ================= INTERACTIVE GUIDED PLAYER VIEW ================= */
              <div>
                {isCompleted ? (
                  /* Completed Celebration Screen */
                  <div className="text-center py-8 space-y-4">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-foreground">
                        {isAr ? 'أحسنت! جسمك جاهز ومحمى بنسبة 100%' : 'Smart Warm-up Completed!'}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
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
                          id="btn-warmup-start-workout-action"
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
                  /* Active Movement Card */
                  <div className="space-y-5">
                    {/* Movement Title & Step Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0">
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
                          id="btn-play-pause-warmup"
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

                      {/* Right: Why This Matters (Biomechanical Rationale Tailored to Today's Exercises) */}
                      <div className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>{isAr ? 'الأساس البيوميكانيكي لجلستك اليوم:' : 'Biomechanical Rationale:'}</span>
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
                <div className="pt-4 border-t border-border mt-4">
                  <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    <span>
                      {isAr ? `تسلسل الحركات (${sequence.movements.length} حركات):` : `Sequence Overview (${sequence.movements.length} Movements):`}
                    </span>
                    <button
                      onClick={() => setActiveTab('generator')}
                      className="text-primary hover:underline text-[11px] flex items-center gap-1"
                    >
                      <Sliders className="h-3 w-3" />
                      <span>{isAr ? 'تعديل أو إعادة التخصيص' : 'Customize Sequence'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {sequence.movements.map((mov, idx) => {
                      const isCurrent = idx === currentIdx;
                      const isDone = completedIndices.includes(idx);

                      return (
                        <button
                          key={mov.id + idx}
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
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="border-t border-border bg-card px-4 py-3 sm:px-6 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary/80"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>

            <div className="flex items-center gap-2">
              {activeTab === 'generator' ? (
                <button
                  id="btn-apply-and-start-warmup"
                  onClick={handleStartFromGenerator}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-transform active:scale-95"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{isAr ? 'بدء الإحماء المباشر' : 'Start Guided Warm-up'}</span>
                </button>
              ) : (
                onStartWorkout && (
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
                )
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

function workoutExercisesCount(workout: WorkoutSession): number {
  return workout.exercises ? workout.exercises.length : 0;
}
