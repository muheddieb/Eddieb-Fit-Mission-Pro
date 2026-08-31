import React, { useState } from 'react';
import {
  History,
  TrendingUp,
  Dumbbell,
  Repeat,
  Trophy,
  Flame,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Calendar,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkoutExercise, WorkoutSession, UserProfile, SetLog } from '../../types';
import { translations } from '../../i18n/translations';
import { PPLEngine } from '../../services/pplEngine';

interface ExerciseHistoryComparisonProps {
  currentExercise: WorkoutExercise;
  history: WorkoutSession[];
  profile: UserProfile;
  isAr: boolean;
  onApplyPreset: (sets: Partial<SetLog>[]) => void;
}

export const ExerciseHistoryComparison: React.FC<ExerciseHistoryComparisonProps> = ({
  currentExercise,
  history,
  profile,
  isAr,
  onApplyPreset,
}) => {
  const t = translations[profile.language];
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState<boolean>(false);

  // Retrieve historical comparison & progression records
  const { lastSession, overloadRecord, progressionAdvice } = PPLEngine.getExerciseComparison(
    currentExercise.exerciseId,
    history
  );

  // Compute live comparison for the active sets being performed in current workout
  const liveComparison = currentExercise.sets.map((currentSet, index) => {
    const lastSet = lastSession?.sets[index];
    if (!lastSet) {
      return {
        hasPrevious: false,
        weightDiff: 0,
        repsDiff: 0,
        status: 'new_set' as const,
      };
    }

    const currentW = typeof currentSet.actualWeight === 'number' ? currentSet.actualWeight : (parseFloat(String(currentSet.targetWeight || 0)) || 0);
    const currentR = typeof currentSet.actualReps === 'number' ? currentSet.actualReps : (parseInt(String(currentSet.targetReps || '0').split('-')[0], 10) || 0);
    
    const weightDiff = currentW - lastSet.weight;
    const repsDiff = currentR - lastSet.reps;

    let status: 'heavier' | 'more_reps' | 'matched' | 'lighter' | 'fewer_reps' = 'matched';

    if (weightDiff > 0) {
      status = 'heavier';
    } else if (weightDiff === 0 && repsDiff > 0) {
      status = 'more_reps';
    } else if (weightDiff === 0 && repsDiff === 0) {
      status = 'matched';
    } else if (weightDiff < 0) {
      status = 'lighter';
    } else {
      status = 'fewer_reps';
    }

    return {
      hasPrevious: true,
      lastWeight: lastSet.weight,
      lastReps: lastSet.reps,
      lastRpe: lastSet.rpe,
      currentWeight: currentW,
      currentReps: currentR,
      weightDiff,
      repsDiff,
      status,
    };
  });

  // Action: Match last session values
  const handleMatchLast = () => {
    if (!lastSession || !lastSession.sets.length) return;
    const newSets = currentExercise.sets.map((set, idx) => {
      const match = lastSession.sets[idx] || lastSession.sets[lastSession.sets.length - 1];
      return {
        targetWeight: match.weight,
        actualWeight: match.weight,
        targetReps: match.reps,
        actualReps: match.reps,
        rpe: match.rpe || 8,
      };
    });
    onApplyPreset(newSets);
  };

  // Action: Challenge +2.5 kg Overload
  const handleChallengeWeight = () => {
    const baseSets = lastSession?.sets?.length ? lastSession.sets : currentExercise.sets.map(s => ({
      weight: typeof s.actualWeight === 'number' ? s.actualWeight : 50,
      reps: typeof s.actualReps === 'number' ? s.actualReps : 10,
      rpe: s.rpe || 8,
    }));

    const newSets = currentExercise.sets.map((set, idx) => {
      const match = baseSets[idx] || baseSets[baseSets.length - 1];
      const targetW = (match.weight || 0) + 2.5;
      return {
        targetWeight: targetW,
        actualWeight: targetW,
        targetReps: match.reps || 10,
        actualReps: match.reps || 10,
        rpe: 8.5,
      };
    });
    onApplyPreset(newSets);
  };

  // Action: Challenge +1 Rep Overload
  const handleChallengeReps = () => {
    const baseSets = lastSession?.sets?.length ? lastSession.sets : currentExercise.sets.map(s => ({
      weight: typeof s.actualWeight === 'number' ? s.actualWeight : 50,
      reps: typeof s.actualReps === 'number' ? s.actualReps : 10,
      rpe: s.rpe || 8,
    }));

    const newSets = currentExercise.sets.map((set, idx) => {
      const match = baseSets[idx] || baseSets[baseSets.length - 1];
      const targetR = (match.reps || 10) + 1;
      return {
        targetWeight: match.weight || 0,
        actualWeight: match.weight || 0,
        targetReps: targetR,
        actualReps: targetR,
        rpe: 8.5,
      };
    });
    onApplyPreset(newSets);
  };

  return (
    <div id="exercise-history-comparison-card" className="rounded-2xl border border-border bg-card/60 p-4 space-y-4 shadow-sm" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner: Last Session Summary & Overload Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-inner">
            <History className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-foreground">
                {t.workout.lastTimePerformance}
              </h4>
              {lastSession && (
                <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                  {lastSession.daysAgo === 0
                    ? (isAr ? 'اليوم' : 'Today')
                    : lastSession.daysAgo === 1
                    ? (isAr ? 'أمس' : '1 day ago')
                    : isAr
                    ? `منذ ${lastSession.daysAgo} أيام`
                    : `${lastSession.daysAgo} days ago`}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lastSession
                ? `${lastSession.workoutName} • ${lastSession.formattedDate}`
                : t.workout.noPreviousHistory}
            </p>
          </div>
        </div>

        {/* Times Overloaded Counter Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 shadow-xs">
            <Flame className="h-4 w-4 fill-current" />
            <span>{t.workout.timesOverloadedCount}:</span>
            <span className="font-black text-foreground font-mono text-sm">
              {overloadRecord.timesOverloaded}x
            </span>
            {overloadRecord.totalSessionsRecorded > 1 && (
              <span className="text-[10px] text-amber-300/80 font-normal">
                ({overloadRecord.overloadRatePercent}%)
              </span>
            )}
          </div>

          <button
            id="btn-toggle-history-drawer"
            onClick={() => setHistoryDrawerOpen(!historyDrawerOpen)}
            className="flex items-center gap-1 rounded-xl border border-border bg-secondary/60 px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
            title={t.workout.exerciseHistoryDrawer}
          >
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">{isAr ? 'سجل الجلسات' : 'History'}</span>
            {historyDrawerOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Set-by-Set Historical Reference & Live Comparison Chips */}
      {lastSession ? (
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>{isAr ? 'مقارنة المجموعات: السابق مقابل الحالي' : 'Set-by-Set: Last vs. Current Session'}</span>
            <span className="font-mono text-primary font-normal">
              {isAr ? 'حجم الجلسة السابقة' : 'Last Vol'}: {lastSession.totalVolumeKg.toLocaleString()} kg
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {currentExercise.sets.map((set, idx) => {
              const comp = liveComparison[idx];
              const lastSet = lastSession.sets[idx];

              return (
                <div
                  key={set.id}
                  className={`rounded-xl border p-2.5 text-xs transition-all ${
                    comp?.status === 'heavier' || comp?.status === 'more_reps'
                      ? 'border-emerald-500/40 bg-emerald-500/10 shadow-xs'
                      : comp?.status === 'matched'
                      ? 'border-border bg-secondary/30'
                      : 'border-border/70 bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-foreground">
                      {isAr ? `مجموعة ${idx + 1}` : `Set ${idx + 1}`}
                    </span>
                    {comp?.status === 'heavier' && (
                      <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-400">
                        <ArrowUpRight className="h-3 w-3" />
                        +{comp.weightDiff} kg
                      </span>
                    )}
                    {comp?.status === 'more_reps' && (
                      <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-400">
                        <ArrowUpRight className="h-3 w-3" />
                        +{comp.repsDiff} reps
                      </span>
                    )}
                    {comp?.status === 'matched' && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {isAr ? 'مطابق' : 'Matched'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground">
                    <div>
                      <span className="text-[10px] block">{isAr ? 'المرة السابقة' : 'Last Time'}:</span>
                      <span className="font-mono font-bold text-foreground">
                        {lastSet ? `${lastSet.weight} kg × ${lastSet.reps}` : '—'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] block">{isAr ? 'الحالي' : 'Current'}:</span>
                      <span className={`font-mono font-bold ${
                        comp?.status === 'heavier' || comp?.status === 'more_reps' ? 'text-emerald-400' : 'text-primary'
                      }`}>
                        {set.actualWeight ?? set.targetWeight} kg × {set.actualReps ?? set.targetReps}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* First-time baseline helper */
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <p className="text-muted-foreground">
              <span className="font-bold text-foreground">{isAr ? 'تحديد المستوى المرجعي' : 'Baseline Session'}: </span>
              {isAr
                ? 'سجل أوزان وتكرارات اليوم لتكون مرجع التطور لتمارينك القادمة ومقارنة زيادة الأوزان.'
                : 'Log today\'s weights and reps to establish your baseline for progressive overload tracking.'}
            </p>
          </div>
        </div>
      )}

      {/* Quick Action Shortcuts: Match Last Session, Challenge +2.5kg, Challenge +1 Rep */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[11px] font-bold text-muted-foreground mr-1 flex items-center gap-1">
          <Zap className="h-3 w-3 text-amber-400" />
          {isAr ? 'إجراءات التطور السريعة' : 'Overload Controls'}:
        </span>

        {lastSession && (
          <button
            id="btn-match-last-session"
            type="button"
            onClick={handleMatchLast}
            className="flex items-center gap-1 rounded-xl border border-border bg-secondary/80 px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-secondary hover:border-primary/40 transition-all shadow-xs"
            title={t.workout.quickFillLast}
          >
            <Copy className="h-3.5 w-3.5 text-primary" />
            <span>{t.workout.quickFillLast}</span>
          </button>
        )}

        <button
          id="btn-challenge-weight-2_5"
          type="button"
          onClick={handleChallengeWeight}
          className="flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-xs"
          title={t.workout.beatByWeight}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>{t.workout.beatByWeight}</span>
        </button>

        <button
          id="btn-challenge-reps-1"
          type="button"
          onClick={handleChallengeReps}
          className="flex items-center gap-1 rounded-xl border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-all shadow-xs"
          title={t.workout.beatByOneRep}
        >
          <Repeat className="h-3.5 w-3.5" />
          <span>{t.workout.beatByOneRep}</span>
        </button>
      </div>

      {/* Expandable Past Sessions History Timeline Drawer */}
      <AnimatePresence>
        {historyDrawerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border pt-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-amber-400" />
                {t.workout.overloadHistory} ({overloadRecord.totalSessionsRecorded} {isAr ? 'جلسات سابقة' : 'logged sessions'})
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {isAr ? 'أعلى وزن' : 'Peak'}: {overloadRecord.allTimeMaxWeight} kg • {overloadRecord.allTimeMaxReps} reps
              </span>
            </div>

            {overloadRecord.recentSessions.length > 0 ? (
              <div className="space-y-2">
                {overloadRecord.recentSessions.map((sess, sIdx) => (
                  <div
                    key={sess.date + sIdx}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-xs ${
                      sess.exceededPrior
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-[11px] font-bold text-foreground font-mono">
                        #{overloadRecord.totalSessionsRecorded - sIdx}
                      </div>
                      <div>
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <span>{sess.formattedDate}</span>
                          {sess.exceededPrior && (
                            <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-black text-emerald-400">
                              {isAr ? 'تطور ناجح (+Overload)' : 'Overload Smashed'}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {sess.totalSets} sets • {sess.totalVolumeKg.toLocaleString()} kg total volume
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="font-black text-foreground">
                        {sess.bestWeight} kg × {sess.bestReps} reps
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {sess.overloadType ? `Mode: ${sess.overloadType}` : 'Normal'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">
                {t.workout.noPreviousHistory}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
