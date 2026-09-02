import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flame, Sparkles, X, TrendingUp, Check, Award } from 'lucide-react';
import { PersonalRecordEvent, UserProfile } from '../../types';
import { translations } from '../../i18n/translations';

interface PRAchievementToastProps {
  prEvent: PersonalRecordEvent | null;
  profile: UserProfile;
  onClose: () => void;
}

export const PRAchievementToast: React.FC<PRAchievementToastProps> = ({
  prEvent,
  profile,
  onClose,
}) => {
  const lang = profile?.language || 'en';
  const t = translations[lang] || translations.en;
  const isAr = lang === 'ar';

  // Auto dismiss after 5 seconds
  useEffect(() => {
    if (!prEvent) return;
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [prEvent, onClose]);

  if (!prEvent) return null;

  const isWeightPR = prEvent.prType === 'weight';
  const exerciseDisplayName = isAr && prEvent.exerciseNameAr 
    ? prEvent.exerciseNameAr 
    : prEvent.exerciseName;

  return (
    <AnimatePresence>
      <div 
        id="pr-achievement-toast-container"
        className="fixed top-5 inset-x-4 sm:inset-x-auto sm:right-6 sm:left-auto z-[100] max-w-md pointer-events-auto"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -25, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative overflow-hidden rounded-2xl border-2 border-amber-400/70 bg-card p-4 sm:p-5 shadow-2xl shadow-amber-500/25 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(20, 20, 25, 0.95) 45%, rgba(239, 68, 68, 0.12) 100%)',
          }}
        >
          {/* Shimmering Animated Top Border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-red-500 animate-pulse" />

          <div className="flex items-start gap-3.5">
            {/* Crown / Flame Icon with Glowing Aura */}
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-500/40">
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-background animate-bounce">
                ★
              </span>
              {isWeightPR ? (
                <Trophy className="h-6 w-6 fill-current animate-pulse" />
              ) : (
                <Flame className="h-6 w-6 fill-current animate-pulse" />
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 space-y-1">
              {/* Header Eyebrow */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                    <Sparkles className="h-3 w-3" />
                    {isWeightPR ? (isAr ? '🔥 رقم قياسي جديد في الوزن' : '🔥 NEW WEIGHT PR!') : (isAr ? '⚡ رقم قياسي جديد في الحجم' : '⚡ NEW VOLUME PR!')}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {isAr ? `المجموعة ${prEvent.setNumber}` : `Set ${prEvent.setNumber}`}
                  </span>
                </div>

                <button
                  id="btn-close-pr-toast"
                  onClick={onClose}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Exercise Name */}
              <h4 className="text-sm sm:text-base font-black text-foreground pt-0.5">
                {exerciseDisplayName}
              </h4>

              {/* Metric Breakdown */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {isWeightPR ? (
                  <div className="flex items-center gap-1 font-mono font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    <span className="text-base sm:text-lg">{prEvent.newValue}</span>
                    <span>kg</span>
                    <span className="text-[11px] font-normal text-muted-foreground">({prEvent.reps} reps)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 font-mono font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <span className="text-base sm:text-lg">{prEvent.newValue.toLocaleString()}</span>
                    <span>kg volume</span>
                  </div>
                )}

                {/* Differential Gain Badge */}
                {prEvent.diff > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                    <TrendingUp className="h-3 w-3" />
                    <span>+{prEvent.diff} {isWeightPR ? 'kg' : 'kg-vol'} {isAr ? 'عن السابق' : 'over previous'}</span>
                  </span>
                )}
              </div>

              {/* Congratulatory motivational subline */}
              <p className="text-[11px] text-muted-foreground pt-1 leading-snug">
                {isAr 
                  ? 'تم تسجيل الرقم القياسي بنجاح وتحديث مسار التحميل التدريجي!' 
                  : 'Milestone logged permanently. Progressive overload achieved!'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
