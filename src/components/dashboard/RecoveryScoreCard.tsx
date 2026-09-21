import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartPulse,
  Flame,
  Shield,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCw,
  Dumbbell,
  Activity,
  CheckCircle,
  Layers,
  Zap,
} from 'lucide-react';
import {
  UserProfile,
  WorkoutSession,
  SleepLog,
  RecoverySession,
  PrescribedRecoverySession,
  PrescribedRecoveryCategory,
} from '../../types';
import { RecoveryEngine } from '../../services/recoveryEngine';
import { GuidedRecoveryModal } from '../recovery/GuidedRecoveryModal';
import { StorageService } from '../../services/storage';

interface RecoveryScoreCardProps {
  profile: UserProfile;
  history: WorkoutSession[];
  sleepHistory?: SleepLog[];
  recoveryHistory?: RecoverySession[];
  onRefresh?: () => void;
  isAr?: boolean;
}

export const RecoveryScoreCard: React.FC<RecoveryScoreCardProps> = ({
  profile,
  history,
  sleepHistory = [],
  recoveryHistory = [],
  onRefresh,
  isAr = false,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | PrescribedRecoveryCategory>('all');
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);
  const [activeGuidedSession, setActiveGuidedSession] = useState<PrescribedRecoverySession | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Compute Recovery Score & Recommendations
  const analysis = useMemo(() => {
    // refreshKey forces recalculation when sessions are completed
    return RecoveryEngine.calculateRecoveryScore(
      history,
      profile,
      sleepHistory.length > 0 ? sleepHistory : StorageService.getSleepHistory(),
      recoveryHistory.length > 0 ? recoveryHistory : StorageService.getRecoveryHistory()
    );
  }, [history, profile, sleepHistory, recoveryHistory, refreshKey]);

  const filteredSessions = useMemo(() => {
    if (activeTab === 'all') return analysis.suggestedSessions;
    return analysis.suggestedSessions.filter((s) => s.category === activeTab);
  }, [analysis.suggestedSessions, activeTab]);

  const handleRecalculate = () => {
    setRefreshKey((k) => k + 1);
    if (onRefresh) onRefresh();
  };

  const handleSessionFinished = (session: RecoverySession) => {
    setRefreshKey((k) => k + 1);
    if (onRefresh) onRefresh();
  };

  // Status color styles
  const getScoreColorConfig = (score: number) => {
    if (score >= 82) {
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        stroke: '#34d399',
        gradient: 'from-emerald-500 to-teal-400',
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      };
    }
    if (score >= 65) {
      return {
        text: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/30',
        stroke: '#22d3ee',
        gradient: 'from-cyan-500 to-blue-400',
        badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      };
    }
    if (score >= 45) {
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        stroke: '#fbbf24',
        gradient: 'from-amber-500 to-orange-400',
        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      };
    }
    return {
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      stroke: '#f87171',
      gradient: 'from-red-500 to-rose-400',
      badge: 'bg-red-500/15 text-red-300 border-red-500/30',
    };
  };

  const colorConfig = getScoreColorConfig(analysis.score);

  // Category Icon & Color
  const getCategoryBadge = (category: PrescribedRecoveryCategory) => {
    switch (category) {
      case 'yoga':
        return {
          icon: '🧘',
          en: 'Yoga Flow',
          ar: 'تدفق يوغا',
          badge: 'bg-purple-900/40 text-purple-300 border-purple-500/30',
        };
      case 'mobility':
        return {
          icon: '🔄',
          en: 'Joint Mobility',
          ar: 'مرونة المفاصل',
          badge: 'bg-cyan-900/40 text-cyan-300 border-cyan-500/30',
        };
      case 'stretching':
      default:
        return {
          icon: '🤸',
          en: 'Deep Stretch',
          ar: 'إطالات عميقة',
          badge: 'bg-emerald-900/40 text-emerald-300 border-emerald-500/30',
        };
    }
  };

  return (
    <div
      id="dashboard-recovery-score-card"
      className="rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-6"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Background ambient decorative glow */}
      <div
        className="absolute -right-20 -top-20 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-15"
        style={{ background: colorConfig.stroke }}
      />

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-primary shadow-inner">
            <HeartPulse className="w-6 h-6 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">
                {isAr ? 'مؤشر الجاهزية والاستشفاء الذكي' : 'Smart Recovery Readiness Score'}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorConfig.badge}`}
              >
                {isAr ? analysis.statusLabelAr : analysis.statusLabel}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isAr
                ? 'تحليل دقيق لكثافة آخر 3 تمارين واقتراح بروتوكولات اليوغا والمرونة المناسبة لتسريع البناء العضلي.'
                : 'Calibrated from your last 3 workouts to prescribe targeted yoga, mobility, and fascial stretching.'}
            </p>
          </div>
        </div>

        {/* Recalculate Trigger */}
        <button
          id="btn-recalculate-recovery"
          onClick={handleRecalculate}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          title={isAr ? 'إعادة الحساب' : 'Recalculate'}
        >
          <RotateCw className="w-3.5 h-3.5 text-zinc-400" />
          <span>{isAr ? 'تحديث المؤشر' : 'Re-assess'}</span>
        </button>
      </div>

      {/* Primary Score Grid & Sub-metrics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left Column (5 cols): Radial Score Gauge */}
        <div className="md:col-span-5 flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/70">
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            {/* SVG Radial Gauge */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="46"
                className="stroke-zinc-800 fill-none"
                strokeWidth="7"
              />
              <circle
                cx="56"
                cy="56"
                r="46"
                fill="none"
                stroke={colorConfig.stroke}
                strokeWidth="7"
                strokeDasharray={289}
                strokeDashoffset={289 - (289 * analysis.score) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white font-mono leading-none">
                {analysis.score}%
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">
                {isAr ? 'جاهزية' : 'Readiness'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-center sm:text-start">
            <h4 className="text-sm font-bold text-white">
              {isAr ? 'حالة التعافي الفسيولوجي' : 'Physiological Readiness'}
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
              {isAr ? analysis.summaryTextAr : analysis.summaryText}
            </p>
            <div className="pt-1 flex flex-wrap gap-1.5 justify-center sm:justify-start">
              {analysis.targetedMusclesFatigued.map((m, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/60"
                >
                  {isAr ? analysis.targetedMusclesFatiguedAr[idx] || m : m}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Strain Sub-indicators */}
        <div className="md:col-span-7 grid grid-cols-3 gap-3">
          {/* Muscular Fatigue */}
          <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold">{isAr ? 'إجهاد الألياف' : 'Muscle Fatigue'}</span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-white font-mono">
              {analysis.muscularFatigueScore}%
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-700"
                style={{ width: `${analysis.muscularFatigueScore}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-400 block truncate">
              {isAr ? 'حمل الألياف والأوزان' : 'Tissue micro-damage'}
            </span>
          </div>

          {/* CNS Strain */}
          <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold">{isAr ? 'الجهاز العصبي' : 'CNS Fatigue'}</span>
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-black text-white font-mono">
              {analysis.cnsFatigueScore}%
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${analysis.cnsFatigueScore}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-400 block truncate">
              {isAr ? 'الجهد العصبي وتواتر النبض' : 'Neural drive recovery'}
            </span>
          </div>

          {/* Joint & Tendon Load */}
          <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold">{isAr ? 'إجهاد المفاصل' : 'Joint Stress'}</span>
              <Shield className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-base sm:text-lg font-black text-white capitalize leading-tight">
              {analysis.jointStressLevel === 'elevated'
                ? isAr
                  ? 'مرتفع'
                  : 'Elevated'
                : analysis.jointStressLevel === 'moderate'
                ? isAr
                  ? 'معتدل'
                  : 'Moderate'
                : isAr
                ? 'منخفض'
                : 'Optimal'}
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  analysis.jointStressLevel === 'elevated'
                    ? 'bg-red-500 w-4/5'
                    : analysis.jointStressLevel === 'moderate'
                    ? 'bg-amber-400 w-1/2'
                    : 'bg-emerald-400 w-1/4'
                }`}
              />
            </div>
            <span className="text-[10px] text-zinc-400 block truncate">
              {isAr ? analysis.jointStressLabelAr : analysis.jointStressLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Last 3 Workouts Intensity Row */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs sm:text-sm font-bold text-zinc-200">
              {isAr ? 'كثافة آخر 3 تمارين مسجلة:' : 'Intensity of Your Last 3 Workouts:'}
            </h4>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            {isAr
              ? `إجمالي الإجهاد: ${analysis.cumulativeStrain} / ${analysis.maxPossibleStrain}`
              : `Cumulative Strain: ${analysis.cumulativeStrain} / ${analysis.maxPossibleStrain}`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {analysis.lastWorkouts.map((workoutItem, index) => {
            const isLast = index === 0;
            return (
              <div
                key={workoutItem.session.id || index}
                className={`p-3.5 rounded-xl border transition-all ${
                  isLast
                    ? 'bg-zinc-900/70 border-zinc-700/80 shadow-md'
                    : 'bg-zinc-900/30 border-zinc-800/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate">
                    <span className="text-[10px] font-semibold text-zinc-400 block">
                      {isAr ? workoutItem.timeAgoLabelAr : workoutItem.timeAgoLabel}
                    </span>
                    <h5 className="text-xs font-black text-white truncate mt-0.5">
                      {isAr
                        ? workoutItem.session.nameAr || workoutItem.session.name
                        : workoutItem.session.name}
                    </h5>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                      workoutItem.strainScore >= 8.0
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : workoutItem.strainScore >= 6.5
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    Strain {workoutItem.strainScore}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400 font-mono border-t border-zinc-800/60 pt-2">
                  <span>
                    {workoutItem.volumeKg.toLocaleString()}{' '}
                    <span className="text-zinc-500">kg</span>
                  </span>
                  <span>
                    {workoutItem.durationMinutes} <span className="text-zinc-500">min</span>
                  </span>
                  <span>
                    RPE <strong className="text-zinc-200">{workoutItem.avgRpe}</strong>
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {workoutItem.primaryMuscles.slice(0, 2).map((m, mIdx) => (
                    <span
                      key={mIdx}
                      className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-800/90 text-zinc-300"
                    >
                      {isAr ? workoutItem.primaryMusclesAr[mIdx] || m : m}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested Sessions Section: Yoga, Mobility & Stretching */}
      <div className="space-y-4 pt-2 border-t border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-black text-white">
                {isAr
                  ? 'بروتوكولات الاستشفاء الموصوفة بناءً على تمارينك'
                  : 'Prescribed Restorative Protocols'}
              </h4>
            </div>
            <p className="text-xs text-zinc-400">
              {isAr
                ? 'جلسات يوغا ومرونة مخصصة لاستهداف العضلات المجهدة في آخر 3 تمارين وتحسين المرونة والمفاصل.'
                : 'Clinical routines targeting the exact muscle chains loaded in your recent training bouts.'}
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isAr ? 'الكل (3)' : 'All (3)'}
            </button>
            <button
              onClick={() => setActiveTab('yoga')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'yoga'
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-800/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>🧘</span>
              <span>{isAr ? 'يوغا' : 'Yoga'}</span>
            </button>
            <button
              onClick={() => setActiveTab('mobility')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'mobility'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>🔄</span>
              <span>{isAr ? 'مرونة' : 'Mobility'}</span>
            </button>
            <button
              onClick={() => setActiveTab('stretching')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'stretching'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>🤸</span>
              <span>{isAr ? 'إطالات' : 'Stretching'}</span>
            </button>
          </div>
        </div>

        {/* Sessions Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredSessions.map((routine) => {
            const catBadge = getCategoryBadge(routine.category);
            const isExpanded = expandedRoutineId === routine.id;

            return (
              <div
                key={routine.id}
                className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 transition-all flex flex-col justify-between overflow-hidden group shadow-lg"
              >
                <div className="p-4 space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${catBadge.badge}`}
                    >
                      <span>{catBadge.icon}</span>
                      <span>{isAr ? catBadge.ar : catBadge.en}</span>
                    </span>

                    <span className="flex items-center gap-1 text-xs text-zinc-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{routine.durationMinutes} min</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h5 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {isAr ? routine.titleAr : routine.title}
                    </h5>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {isAr ? routine.descriptionAr : routine.description}
                    </p>
                  </div>

                  {/* Dynamic Match Reason (Connected to Last 3 Workouts!) */}
                  <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{isAr ? routine.matchReasonAr : routine.matchReason}</span>
                  </div>

                  {/* Target Muscles */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(isAr ? routine.targetMusclesAr : routine.targetMuscles).map((tm, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300"
                      >
                        {tm}
                      </span>
                    ))}
                  </div>

                  {/* Expandable Pose Preview */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-2 border-t border-zinc-800/80 space-y-2 text-xs"
                    >
                      <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] block">
                        {isAr ? 'حركات الجلسة:' : 'Poses / Sequence:'}
                      </span>
                      <ul className="space-y-1.5">
                        {routine.poses.map((p, pIdx) => (
                          <li
                            key={p.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60 text-zinc-300"
                          >
                            <span className="truncate pr-2 font-medium">
                              {pIdx + 1}. {isAr ? p.nameAr : p.name}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                              {p.durationSeconds}s
                            </span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/50 flex items-center gap-2">
                  <button
                    id={`btn-start-session-${routine.id}`}
                    onClick={() => setActiveGuidedSession(routine)}
                    className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all active:scale-[0.98]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isAr ? 'بدء الجلسة التفاعلية' : 'Start Guided Session'}</span>
                  </button>

                  <button
                    onClick={() =>
                      setExpandedRoutineId(isExpanded ? null : routine.id)
                    }
                    className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    title={isAr ? 'عرض الحركات' : 'View poses'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guided Recovery Player Modal */}
      <GuidedRecoveryModal
        routine={activeGuidedSession}
        isOpen={!!activeGuidedSession}
        onClose={() => setActiveGuidedSession(null)}
        onSessionCompleted={handleSessionFinished}
        isAr={isAr}
      />
    </div>
  );
};
