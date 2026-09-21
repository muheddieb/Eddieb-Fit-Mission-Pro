import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Flame,
  Wind,
  ShieldCheck,
  Star,
  Activity,
  HeartPulse,
} from 'lucide-react';
import { PrescribedRecoverySession, RecoveryRoutinePose, RecoverySession } from '../../types';
import { StorageService } from '../../services/storage';

interface GuidedRecoveryModalProps {
  routine: PrescribedRecoverySession | null;
  isOpen: boolean;
  onClose: () => void;
  onSessionCompleted?: (session: RecoverySession) => void;
  isAr?: boolean;
}

export const GuidedRecoveryModal: React.FC<GuidedRecoveryModalProps> = ({
  routine,
  isOpen,
  onClose,
  onSessionCompleted,
  isAr = false,
}) => {
  if (!isOpen || !routine) return null;

  const [currentPoseIdx, setCurrentPoseIdx] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(
    routine.poses[0]?.durationSeconds || 60
  );
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [elapsedTotalSeconds, setElapsedTotalSeconds] = useState(0);
  const [userRating, setUserRating] = useState(5);
  const [userNotes, setUserNotes] = useState('');
  const [sideSwitched, setSideSwitched] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');

  const currentPose: RecoveryRoutinePose | undefined = routine.poses[currentPoseIdx];
  const timerRef = useRef<any>(null);
  const totalPoses = routine.poses.length;

  // Reset when routine opens or pose changes
  useEffect(() => {
    if (routine && routine.poses[currentPoseIdx]) {
      setSecondsRemaining(routine.poses[currentPoseIdx].durationSeconds);
      setSideSwitched(false);
    }
  }, [currentPoseIdx, routine]);

  // Timer Tick
  useEffect(() => {
    if (isActive && !isCompleted) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Check if there is next pose
            if (currentPoseIdx < totalPoses - 1) {
              setCurrentPoseIdx((p) => p + 1);
              return routine.poses[currentPoseIdx + 1]?.durationSeconds || 60;
            } else {
              // Finished all poses
              setIsActive(false);
              setIsCompleted(true);
              return 0;
            }
          }

          // Check side switch for bilateral poses
          if (currentPose?.bilateral && currentPose.sideSwitchSeconds) {
            if (prev === currentPose.sideSwitchSeconds) {
              setSideSwitched(true);
            }
          }
          return prev - 1;
        });

        setElapsedTotalSeconds((tot) => tot + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, isCompleted, currentPoseIdx, totalPoses, routine, currentPose]);

  // Breathing guide cycle (Inhale 4s, Hold 2s, Exhale 6s)
  useEffect(() => {
    if (!isActive) return;
    const breathInterval = setInterval(() => {
      setBreathPhase((prev) => {
        if (prev === 'inhale') return 'hold';
        if (prev === 'hold') return 'exhale';
        return 'inhale';
      });
    }, 4000);
    return () => clearInterval(breathInterval);
  }, [isActive]);

  const togglePlay = () => setIsActive(!isActive);

  const resetCurrentPose = () => {
    if (currentPose) {
      setSecondsRemaining(currentPose.durationSeconds);
      setSideSwitched(false);
    }
  };

  const handleNextPose = () => {
    if (currentPoseIdx < totalPoses - 1) {
      setCurrentPoseIdx((p) => p + 1);
    } else {
      setIsActive(false);
      setIsCompleted(true);
    }
  };

  const handlePrevPose = () => {
    if (currentPoseIdx > 0) {
      setCurrentPoseIdx((p) => p - 1);
    }
  };

  const addTime = (delta: number) => {
    setSecondsRemaining((s) => Math.max(5, s + delta));
  };

  const handleSaveAndFinish = () => {
    const durationMinutes = Math.max(1, Math.round(elapsedTotalSeconds / 60));
    const newSession: RecoverySession = {
      id: `rec_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: routine.category,
      typeName: routine.title,
      typeNameAr: routine.titleAr,
      durationMinutes,
      recoveryRating: userRating,
      notes: userNotes || `${routine.title} completed. Feeling restored.`,
      timestamp: Date.now(),
    };

    StorageService.addRecoverySession(newSession);
    if (onSessionCompleted) {
      onSessionCompleted(newSession);
    }
    onClose();
  };

  // Progress Calculations
  const poseDuration = currentPose?.durationSeconds || 60;
  const progressPercent = Math.min(
    100,
    Math.round(((poseDuration - secondsRemaining) / poseDuration) * 100)
  );

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'yoga':
        return 'bg-purple-900/50 border-purple-500/40 text-purple-300';
      case 'mobility':
        return 'bg-cyan-900/50 border-cyan-500/40 text-cyan-300';
      case 'stretching':
      default:
        return 'bg-emerald-900/50 border-emerald-500/40 text-emerald-300';
    }
  };

  return (
    <div
      id="guided-recovery-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        id="guided-recovery-modal-card"
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${getCategoryBadgeColor(
                routine.category
              )}`}
            >
              {isAr ? routine.categoryLabelAr : routine.categoryLabel}
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-100 line-clamp-1">
                {isAr ? routine.titleAr : routine.title}
              </h3>
              <p className="text-xs text-zinc-400">
                {isAr
                  ? `الحركة ${currentPoseIdx + 1} من ${totalPoses} • الإجمالي ~${routine.durationMinutes} دقيقة`
                  : `Pose ${currentPoseIdx + 1} of ${totalPoses} • Total ~${routine.durationMinutes} mins`}
              </p>
            </div>
          </div>

          <button
            id="guided-modal-close-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-step progress bar */}
        <div className="w-full bg-zinc-900 h-1.5 flex">
          {routine.poses.map((p, idx) => {
            let barBg = 'bg-zinc-800';
            if (idx < currentPoseIdx) barBg = 'bg-emerald-500';
            else if (idx === currentPoseIdx) barBg = 'bg-amber-400';
            return (
              <div
                key={p.id}
                className={`h-full flex-1 border-r border-zinc-950 transition-colors ${barBg}`}
              />
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {!isCompleted ? (
            <>
              {/* Active Pose Header */}
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs font-medium text-zinc-400">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {isAr ? 'التركيز العضلي:' : 'Target Focus:'}{' '}
                    <strong className="text-zinc-200">
                      {isAr
                        ? currentPose?.targetMusclesAr?.join('، ')
                        : currentPose?.targetMuscles?.join(', ')}
                    </strong>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {isAr ? currentPose?.nameAr : currentPose?.name}
                </h2>
              </div>

              {/* Central Timer & Circular Display */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative flex items-center justify-center w-52 h-52 sm:w-60 sm:h-60 rounded-full border-4 border-zinc-800/80 bg-zinc-900/40 shadow-inner">
                  {/* Circular progress stroke */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="44%"
                      className="stroke-zinc-800 fill-none"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="44%"
                      className={`fill-none transition-all duration-700 stroke-current ${
                        routine.category === 'yoga'
                          ? 'text-purple-400'
                          : routine.category === 'mobility'
                          ? 'text-cyan-400'
                          : 'text-emerald-400'
                      }`}
                      strokeWidth="8"
                      strokeDasharray={700}
                      strokeDashoffset={700 - (700 * progressPercent) / 100}
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Inner Timer Digits */}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <span className="text-4xl sm:text-5xl font-black tracking-tighter text-white font-mono">
                      {formatTime(secondsRemaining)}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-zinc-400 mt-1 font-semibold">
                      {isActive
                        ? isAr
                          ? 'جارِ الإطالة'
                          : 'In Progress'
                        : isAr
                        ? 'موقوف مؤقتاً'
                        : 'Paused'}
                    </span>

                    {/* Bilateral Side Switch Indicator */}
                    {currentPose?.bilateral && (
                      <div
                        className={`mt-2 px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                          sideSwitched
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {sideSwitched
                          ? isAr
                            ? 'بدل للجانب الثاني ↺'
                            : 'Switch to 2nd Side ↺'
                          : isAr
                          ? `بدل عند 0:${currentPose.sideSwitchSeconds || 30}`
                          : `Switch at 0:${currentPose.sideSwitchSeconds || 30}`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Breathing Guidance Bubble */}
                <div className="mt-4 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                  <Wind
                    className={`w-4 h-4 transition-transform duration-1000 ${
                      isActive && breathPhase === 'inhale'
                        ? 'scale-125 text-cyan-400'
                        : isActive && breathPhase === 'exhale'
                        ? 'scale-90 text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  />
                  <span>
                    {isAr ? 'إيقاع التنفس الهادئ: ' : 'Vagal Cadence: '}
                    <strong className="text-zinc-100 font-semibold capitalize">
                      {breathPhase === 'inhale'
                        ? isAr
                          ? 'شهيق عميق (4 ثوان)'
                          : 'Deep Inhale (4s)'
                        : breathPhase === 'hold'
                        ? isAr
                          ? 'حبس هادئ (2 ثوان)'
                          : 'Soft Pause (2s)'
                        : isAr
                        ? 'زفير بطيء ومريح (6 ثوان)'
                        : 'Slow Exhale (6s)'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  id="recovery-prev-pose-btn"
                  onClick={handlePrevPose}
                  disabled={currentPoseIdx === 0}
                  className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title={isAr ? 'الحركة السابقة' : 'Previous Pose'}
                >
                  {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>

                <button
                  id="recovery-minus15-btn"
                  onClick={() => addTime(-15)}
                  className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="-15s"
                >
                  -15s
                </button>

                <button
                  id="recovery-play-pause-btn"
                  onClick={togglePlay}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isActive ? (
                    <>
                      <Pause className="w-5 h-5 fill-current" />
                      <span>{isAr ? 'إيقاف مؤقت' : 'Pause'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>{isAr ? 'ابدأ الإطالة' : 'Start / Resume'}</span>
                    </>
                  )}
                </button>

                <button
                  id="recovery-plus15-btn"
                  onClick={() => addTime(15)}
                  className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="+15s"
                >
                  +15s
                </button>

                <button
                  id="recovery-restart-pose-btn"
                  onClick={resetCurrentPose}
                  className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  title={isAr ? 'إعادة المؤقت' : 'Reset Timer'}
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  id="recovery-next-pose-btn"
                  onClick={handleNextPose}
                  className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  title={isAr ? 'الحركة التالية' : 'Next Pose'}
                >
                  {isAr ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              </div>

              {/* Instructions & Clinical Cues */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    {isAr ? 'تعليمات الوضعية:' : 'Biomechanic Execution:'}
                  </h4>
                  <p className="text-sm text-zinc-200 leading-relaxed">
                    {isAr ? currentPose?.instructionsAr : currentPose?.instructions}
                  </p>
                </div>

                {currentPose?.cues && currentPose.cues.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800/60 space-y-1.5">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      {isAr ? 'إشارات الأداء والتنفس:' : 'Coaching Cues & Posture:'}
                    </h5>
                    <ul className="space-y-1">
                      {(isAr ? currentPose.cuesAr : currentPose.cues).map((cue, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{cue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Session Completed Screen */
            <div className="py-6 flex flex-col items-center text-center space-y-5 animate-fadeIn">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/60">
                <Sparkles className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white">
                  {isAr ? 'اكتملت جلسة الاستشفاء بنجاح!' : 'Recovery Session Completed!'}
                </h3>
                <p className="text-sm text-zinc-400 max-w-md mx-auto">
                  {isAr
                    ? 'تم تخفيف التوتر الميكانيكي، وإعادة توازن الجهاز العصبي، وتحفيز تدفق الدم لبناء الألياف العضلية.'
                    : 'Mechanical tension released, neuromuscular tone restored, and blood flow stimulated to prime tissue repair.'}
                </p>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                  <span className="text-xs text-zinc-400">{isAr ? 'المدة الإجمالية' : 'Duration'}</span>
                  <div className="text-xl font-bold text-white mt-0.5">
                    {Math.max(1, Math.round(elapsedTotalSeconds / 60))}{' '}
                    <span className="text-xs text-zinc-400">{isAr ? 'دقيقة' : 'min'}</span>
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                  <span className="text-xs text-zinc-400">{isAr ? 'نوع الجلسة' : 'Modality'}</span>
                  <div className="text-sm font-bold text-emerald-400 mt-1 capitalize">
                    {routine.category}
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-300">
                  {isAr ? 'كيف تشعر بجاهزيتك الجسدية الآن؟' : 'How refreshed do your muscles feel?'}
                </span>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className="p-1.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= userRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes input */}
              <div className="w-full max-w-md">
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder={
                    isAr
                      ? 'ملاحظات اختيارية عن مرونة العضلات أو موضع الشد...'
                      : 'Optional notes on muscle tension, flexibility gains, or feel...'
                  }
                  rows={2}
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Final Action Button */}
              <button
                id="recovery-save-log-btn"
                onClick={handleSaveAndFinish}
                className="w-full max-w-md py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50 transition-all hover:scale-[1.01]"
              >
                <ShieldCheck className="w-5 h-5 fill-current" />
                <span>
                  {isAr
                    ? 'حفظ في سجل الاستشفاء وتحديث مؤشر الجاهزية'
                    : 'Log to Recovery History & Update Score'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer (when playing) */}
        {!isCompleted && (
          <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
            <button
              onClick={() => setIsCompleted(true)}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {isAr ? 'تخطي وإنهاء الجلسة' : 'Finish early'}
            </button>
            <span className="text-xs text-zinc-500 font-mono">
              {isAr ? 'إجمالي الوقت:' : 'Total time:'} {formatTime(elapsedTotalSeconds)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
