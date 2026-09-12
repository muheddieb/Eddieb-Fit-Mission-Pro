import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  ArrowLeftRight, 
  Play, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Dumbbell, 
  Clock, 
  Flame, 
  Layers, 
  ShieldCheck, 
  ChevronRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { UserProfile, WorkoutSession } from '../../types';
import { WeeklyScheduleService, WeeklyDayPlan, SPLIT_DEFINITIONS } from '../../services/weeklyScheduleService';

interface WeeklyScheduleViewProps {
  profile: UserProfile;
  history: WorkoutSession[];
  onStartSpecificWorkout: (session: WorkoutSession) => void;
  onNavigateToSection?: (section: any) => void;
  compact?: boolean; // When embedded inside dashboard
}

export const WeeklyScheduleView: React.FC<WeeklyScheduleViewProps> = ({
  profile,
  history,
  onStartSpecificWorkout,
  compact = false,
}) => {
  const isAr = profile.language === 'ar';
  const [schedule, setSchedule] = useState<WeeklyDayPlan[]>(() => 
    WeeklyScheduleService.getWeeklySchedule(profile)
  );
  const [swapMode, setSwapMode] = useState<boolean>(false);
  const [selectedDayIndexForSwap, setSelectedDayIndexForSwap] = useState<number | null>(null);
  const [swapFeedback, setSwapFeedback] = useState<string | null>(null);
  const [activeDayDetailModal, setActiveDayDetailModal] = useState<WeeklyDayPlan | null>(null);
  const [editSplitDayIndex, setEditSplitDayIndex] = useState<number | null>(null);

  const todayIndex = WeeklyScheduleService.getTodayDayIndex();

  // Handler: Select day for swapping
  const handleDayClick = (dayIndex: number) => {
    if (!swapMode) {
      // If not in swap mode, open details modal or prepare
      setActiveDayDetailModal(schedule[dayIndex]);
      return;
    }

    if (selectedDayIndexForSwap === null) {
      // Pick first day
      setSelectedDayIndexForSwap(dayIndex);
    } else if (selectedDayIndexForSwap === dayIndex) {
      // Deselect if clicked again
      setSelectedDayIndexForSwap(null);
    } else {
      // Perform swap between selectedDayIndexForSwap and dayIndex!
      const firstDay = schedule[selectedDayIndexForSwap];
      const secondDay = schedule[dayIndex];
      const updated = WeeklyScheduleService.swapDays(selectedDayIndexForSwap, dayIndex, profile);
      setSchedule(updated);

      const msg = isAr 
        ? `تم تبديل (${firstDay.dayNameAr}: ${firstDay.titleAr}) مع (${secondDay.dayNameAr}: ${secondDay.titleAr}) بنجاح!`
        : `Swapped (${firstDay.dayName}: ${firstDay.title}) with (${secondDay.dayName}: ${secondDay.title})!`;
      
      setSwapFeedback(msg);
      setSelectedDayIndexForSwap(null);
      setSwapMode(false);

      setTimeout(() => {
        setSwapFeedback(null);
      }, 4500);
    }
  };

  // Quick swap initiator from card button
  const handleTriggerCardSwap = (e: React.MouseEvent, dayIndex: number) => {
    e.stopPropagation();
    setSwapMode(true);
    setSelectedDayIndexForSwap(dayIndex);
  };

  // Handler: Start a day's workout
  const handleStartDay = (e: React.MouseEvent, day: WeeklyDayPlan) => {
    e.stopPropagation();
    const session = WeeklyScheduleService.buildWorkoutForDay(day, profile, history);
    onStartSpecificWorkout(session);
  };

  // Reset to default schedule
  const handleReset = () => {
    if (window.confirm(isAr ? 'هل تريد استعادة ترتيب جدول الأسبوع الافتراضي؟' : 'Reset weekly schedule back to default?')) {
      const reset = WeeklyScheduleService.resetSchedule(profile);
      setSchedule(reset);
      setSelectedDayIndexForSwap(null);
      setSwapMode(false);
      setSwapFeedback(isAr ? 'تمت استعادة الجدول الافتراضي بنجاح.' : 'Weekly schedule reset to default.');
      setTimeout(() => setSwapFeedback(null), 3000);
    }
  };

  // Change split for a specific day
  const handleChangeSplit = (newSplitId: string) => {
    if (editSplitDayIndex !== null) {
      const updated = WeeklyScheduleService.changeDaySplit(editSplitDayIndex, newSplitId, profile);
      setSchedule(updated);
      setEditSplitDayIndex(null);
      setSwapFeedback(isAr ? 'تم تحديث تمرين اليوم بنجاح.' : 'Day split updated successfully.');
      setTimeout(() => setSwapFeedback(null), 3000);
    }
  };

  const trainingDaysCount = schedule.filter(d => !d.isRestDay).length;
  const restDaysCount = schedule.filter(d => d.isRestDay).length;

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card/80 p-4 sm:p-5 rounded-2xl border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground">
                {isAr ? 'جدول تمارين الأسبوع ومرونة التبديل' : 'Weekly Schedule & Flexible Day Swapping'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isAr 
                  ? `${trainingDaysCount} أيام تدريب • ${restDaysCount} أيام استشفاء • انقر على أي يوم لبدء تمرينه أو تبديله`
                  : `${trainingDaysCount} training days • ${restDaysCount} rest days • Tap any day to start or swap`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Swap Mode Toggle Button */}
          <button
            id="btn-toggle-swap-mode"
            onClick={() => {
              setSwapMode(!swapMode);
              setSelectedDayIndexForSwap(null);
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-sm ${
              swapMode 
                ? 'bg-amber-500 text-neutral-950 ring-2 ring-amber-400 font-black' 
                : 'bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20'
            }`}
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>{swapMode ? (isAr ? 'إلغاء وضع التبديل' : 'Exit Swap Mode') : (isAr ? 'تبديل الأيام (Swap)' : 'Swap Days')}</span>
          </button>

          {/* Reset Schedule Button */}
          <button
            id="btn-reset-weekly-schedule"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            title={isAr ? 'إعادة ضبط الجدول الافتراضي' : 'Reset to default schedule'}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? 'إعادة ضبط' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Swap Guidance Banner */}
      <AnimatePresence>
        {swapMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs shadow-sm flex items-start gap-3 text-amber-200"
          >
            <Sparkles className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-black text-amber-300">
                {selectedDayIndexForSwap === null
                  ? (isAr ? 'الخطوة 1: انقر على اليوم الأول الذي ترغب في نقله أو تبديله' : 'Step 1: Tap the first day you wish to swap (e.g. Legs Day)')
                  : (isAr 
                      ? `الخطوة 2: تم تحديد (${schedule[selectedDayIndexForSwap].dayNameAr} - ${schedule[selectedDayIndexForSwap].titleAr}). الآن انقر على اليوم الآخر لإتمام التبديل الفوري!`
                      : `Step 2: Selected (${schedule[selectedDayIndexForSwap].dayName} - ${schedule[selectedDayIndexForSwap].title}). Now tap the other day to finalize the swap!`
                    )}
              </span>
              <p className="text-[11px] text-amber-300/80">
                {isAr 
                  ? 'يتم تبديل محتوى التمرين تلقائياً مع الحفاظ الكامل على أوزانك التاريخية وسجل تقدمك الرياضي.' 
                  : 'Routines swap seamlessly while fully preserving progressive overload history and weight calibration.'}
              </p>
            </div>
          </motion.div>
        )}

        {swapFeedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-3.5 text-xs font-bold text-emerald-300 shadow-md flex items-center gap-2.5"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{swapFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Days Grid */}
      <div className={`grid gap-3.5 ${compact ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
        {schedule.map((day, idx) => {
          const isToday = idx === todayIndex;
          const isSelectedForSwap = selectedDayIndexForSwap === idx;

          return (
            <motion.div
              key={day.id}
              onClick={() => handleDayClick(idx)}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              className={`relative cursor-pointer rounded-2xl border p-4 transition-all flex flex-col justify-between shadow-sm ${
                isSelectedForSwap 
                  ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-400 shadow-lg shadow-amber-500/10' 
                  : isToday
                  ? 'border-primary/60 bg-gradient-to-br from-primary/10 via-card to-card shadow-md'
                  : 'border-border/80 bg-card hover:border-primary/40 hover:bg-card/90'
              }`}
            >
              {/* Day Header Top Row */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-foreground">
                      {isAr ? day.dayNameAr : day.dayName}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({isAr ? `اليوم ${day.dayNumber}` : `Day ${day.dayNumber}`})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isToday && (
                      <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary border border-primary/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        {isAr ? 'اليوم' : 'Today'}
                      </span>
                    )}

                    {day.isSwapped && (
                      <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/30">
                        {isAr ? 'مُبدّل' : 'Swapped'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Routine Badge & Title */}
                <div>
                  <span className={`inline-block rounded-lg px-2.5 py-1 text-[11px] font-black border bg-gradient-to-r ${day.color}`}>
                    {isAr ? day.titleAr.split('(')[0] : day.title.split('(')[0]}
                  </span>

                  <h4 className="text-xs font-bold text-foreground mt-1.5 line-clamp-1">
                    {isAr ? day.titleAr : day.title}
                  </h4>

                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                    {isAr ? day.subtitleAr : day.subtitle}
                  </p>
                </div>

                {/* Target Muscle Pills */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {(isAr ? day.targetMusclesAr : day.targetMuscles).slice(0, 3).map((m, mIdx) => (
                    <span key={mIdx} className="rounded-md bg-secondary/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80">
                      {m}
                    </span>
                  ))}
                  {day.targetMuscles.length > 3 && (
                    <span className="text-[10px] text-muted-foreground self-center">
                      +{day.targetMuscles.length - 3}
                    </span>
                  )}
                </div>

                {/* Exercise Preview snippet */}
                <div className="border-t border-border/60 pt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1 font-semibold">
                      <Clock className="h-3 w-3" />
                      ~{day.estimatedMinutes} {isAr ? 'دقيقة' : 'min'}
                    </span>
                    <span className="font-semibold">
                      {day.exercisesCount} {isAr ? 'تمارين أساسية' : 'exercises'}
                    </span>
                  </div>

                  <ul className="text-[10px] text-muted-foreground space-y-0.5 line-clamp-2 list-inside list-disc">
                    {(isAr ? day.exerciseNamesAr : day.exerciseNames).slice(0, 2).map((ex, exIdx) => (
                      <li key={exIdx} className="truncate">{ex}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Card Action Buttons */}
              <div className="mt-3 pt-2.5 border-t border-border/80 flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={(e) => handleTriggerCardSwap(e, idx)}
                  className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold border transition-all ${
                    isSelectedForSwap
                      ? 'bg-amber-500 text-neutral-950 border-amber-400 font-black'
                      : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                  title={isAr ? 'تبديل هذا اليوم مع يوم آخر' : 'Swap this day with another'}
                >
                  <ArrowLeftRight className="h-3 w-3" />
                  <span>{isSelectedForSwap ? (isAr ? 'تم التحديد' : 'Selected') : (isAr ? 'تبديل' : 'Swap')}</span>
                </button>

                {!day.isRestDay ? (
                  <button
                    type="button"
                    onClick={(e) => handleStartDay(e, day)}
                    className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground hover:bg-primary/90 shadow-sm transition-all active:scale-95"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>{isToday ? (isAr ? 'تمرين اليوم' : 'Train Today') : (isAr ? 'ابدأ الآن' : 'Train')}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleStartDay(e, day)}
                    className="flex items-center gap-1 rounded-xl border border-border bg-secondary/30 px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-all"
                  >
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    <span>{isAr ? 'استشفاء' : 'Recovery'}</span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Day Details Modal */}
      {activeDayDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-xs font-bold text-primary">
                  {isAr ? activeDayDetailModal.dayNameAr : activeDayDetailModal.dayName} • {isAr ? `اليوم ${activeDayDetailModal.dayNumber}` : `Day ${activeDayDetailModal.dayNumber}`}
                </span>
                <h3 className="text-base sm:text-lg font-black text-foreground">
                  {isAr ? activeDayDetailModal.titleAr : activeDayDetailModal.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveDayDetailModal(null)}
                className="rounded-full bg-secondary p-1.5 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {isAr ? activeDayDetailModal.subtitleAr : activeDayDetailModal.subtitle}
            </p>

            {/* Exercises list in detail */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground block">
                {isAr ? 'تمارين الجلسة المجدولة:' : 'Scheduled Exercises:'}
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(isAr ? activeDayDetailModal.exerciseNamesAr : activeDayDetailModal.exerciseNames).map((ex, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-2.5 text-xs">
                    <span className="font-bold text-foreground">{ex}</span>
                    <span className="text-[10px] text-primary font-mono font-semibold">3-4 sets</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button
                onClick={() => {
                  const idx = activeDayDetailModal.dayIndex;
                  setActiveDayDetailModal(null);
                  setSwapMode(true);
                  setSelectedDayIndexForSwap(idx);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span>{isAr ? 'تبديل هذا اليوم' : 'Swap This Day'}</span>
              </button>

              <button
                onClick={(e) => {
                  const day = activeDayDetailModal;
                  setActiveDayDetailModal(null);
                  handleStartDay(e, day);
                }}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-all"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{isAr ? 'بدء هذه الجلسة الآن' : 'Start This Routine'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
