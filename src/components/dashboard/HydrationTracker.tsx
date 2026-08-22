import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplets, 
  Plus, 
  RotateCcw, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  GlassWater, 
  Coffee, 
  CupSoda, 
  Waves,
  Sliders,
  Check
} from 'lucide-react';
import { UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { StorageService } from '../../services/storage';

interface HydrationTrackerProps {
  profile: UserProfile;
  todayWaterMl: number;
  onUpdateWater: (newTotal: number) => void;
  onUpdateProfile?: (profile: UserProfile) => void;
}

export const HydrationTracker: React.FC<HydrationTrackerProps> = ({
  profile,
  todayWaterMl,
  onUpdateWater,
  onUpdateProfile,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [customInputOpen, setCustomInputOpen] = useState(false);
  const [customMl, setCustomMl] = useState<number>(300);
  const [editGoalOpen, setEditGoalOpen] = useState(false);
  const [newGoalMl, setNewGoalMl] = useState<number>(profile.dailyWaterTargetMl || 4000);
  const [lastAddedFeedback, setLastAddedFeedback] = useState<number | null>(null);

  const goalMl = profile.dailyWaterTargetMl || 4000;
  const hydrationPercent = Math.min(100, Math.round((todayWaterMl / goalMl) * 100));
  const exactPercent = Math.round((todayWaterMl / goalMl) * 100);
  const remainingMl = Math.max(0, goalMl - todayWaterMl);
  const surplusMl = Math.max(0, todayWaterMl - goalMl);

  const triggerAdd = (amount: number) => {
    StorageService.addHydration(amount);
    const newTotal = StorageService.getTodayHydrationTotal();
    onUpdateWater(newTotal);
    setLastAddedFeedback(amount);
    setTimeout(() => setLastAddedFeedback(null), 1800);
  };

  const handleUndo = () => {
    StorageService.removeLastTodayHydration();
    const newTotal = StorageService.getTodayHydrationTotal();
    onUpdateWater(newTotal);
  };

  const handleReset = () => {
    if (window.confirm(t.dashboard.hydrationResetConfirm)) {
      StorageService.resetTodayHydration();
      onUpdateWater(0);
    }
  };

  const handleSaveGoal = () => {
    if (newGoalMl >= 1000 && onUpdateProfile) {
      const updated = { ...profile, dailyWaterTargetMl: newGoalMl };
      StorageService.saveProfile(updated);
      onUpdateProfile(updated);
      setEditGoalOpen(false);
    }
  };

  // Motivational state
  const getMotivationalFeedback = () => {
    if (exactPercent >= 100) return t.dashboard.hydrationMotivationHigh;
    if (exactPercent >= 50) return t.dashboard.hydrationMotivationMed;
    return t.dashboard.hydrationMotivationLow;
  };

  const presets = [
    { label: t.dashboard.hydrationGlass, amount: 250, icon: '🥛', desc: '+250 ml' },
    { label: t.dashboard.hydrationBottle, amount: 500, icon: '💧', desc: '+500 ml' },
    { label: t.dashboard.hydrationShaker, amount: 750, icon: '⚡', desc: '+750 ml' },
    { label: t.dashboard.hydrationFlask, amount: 1000, icon: '🌊', desc: '+1000 ml' },
  ];

  return (
    <div 
      id="daily-hydration-tracker" 
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-md relative overflow-hidden transition-all"
    >
      {/* Background Subtle Water Glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-inner">
            <Droplets className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-foreground sm:text-lg">
                {t.dashboard.hydration}
              </h3>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                exactPercent >= 100 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : exactPercent >= 50
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : 'bg-secondary text-muted-foreground border-border'
              }`}>
                {exactPercent >= 100 && <CheckCircle2 className="h-3 w-3" />}
                <span>{exactPercent}% {exactPercent >= 100 ? (isAr ? 'مكتمل' : 'Achieved') : ''}</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {t.dashboard.hydrationSubtitle}
            </p>
          </div>
        </div>

        {/* Header Right: Target Info & Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {editGoalOpen ? (
            <div className="flex items-center gap-1.5 bg-secondary/80 p-1 rounded-xl border border-border">
              <input
                type="number"
                min="1000"
                max="8000"
                step="250"
                value={newGoalMl}
                onChange={(e) => setNewGoalMl(Math.max(500, parseInt(e.target.value) || 0))}
                className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
              />
              <span className="text-[11px] text-muted-foreground">ml</span>
              <button
                onClick={handleSaveGoal}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                title="Save Target"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setNewGoalMl(goalMl);
                setEditGoalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              title={isAr ? 'تعديل الهدف اليومي' : 'Edit Daily Target'}
            >
              <Sliders className="h-3.5 w-3.5 text-blue-400" />
              <span>{t.dashboard.hydrationGoal}: <strong className="text-foreground">{goalMl.toLocaleString()} ml</strong></span>
            </button>
          )}

          {/* Undo Button */}
          {todayWaterMl > 0 && (
            <button
              id="btn-undo-hydration"
              onClick={handleUndo}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title={t.dashboard.hydrationUndo}
              aria-label="Undo last water log"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Reset Button */}
          {todayWaterMl > 0 && (
            <button
              id="btn-reset-hydration"
              onClick={handleReset}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-secondary/40 text-muted-foreground hover:text-red-400 hover:bg-secondary transition-colors"
              title={t.dashboard.hydrationReset}
              aria-label="Reset today's water logs"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Hydration Metrics & Animated Progress Bar */}
      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          {/* Main Numbers */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-foreground font-mono tracking-tight">
              {todayWaterMl.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-muted-foreground">
              / {goalMl.toLocaleString()} ml
            </span>
            <span className="text-xs font-semibold text-blue-400">
              ({(todayWaterMl / 1000).toFixed(2)} L / {(goalMl / 1000).toFixed(2)} L)
            </span>
          </div>

          {/* Remaining or Surplus Badge */}
          <div className="text-xs font-bold font-mono">
            {remainingMl > 0 ? (
              <span className="text-muted-foreground">
                {isAr ? `متبقي ${remainingMl.toLocaleString()} مل للهدف` : `${remainingMl.toLocaleString()} ml remaining`}
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>
                  {isAr 
                    ? `تم تجاوز الهدف (+${surplusMl.toLocaleString()} مل فائض)` 
                    : `Target reached (+${surplusMl.toLocaleString()} ml surplus)`}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Multi-level Fluid Progress Bar */}
        <div className="space-y-1.5">
          <div className="relative h-3.5 w-full rounded-full bg-secondary/80 overflow-hidden p-0.5 border border-border">
            {/* Animated Liquid Bar */}
            <motion.div
              className={`h-full rounded-full transition-all ${
                exactPercent >= 100
                  ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 shadow-lg shadow-cyan-500/20'
                  : 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${hydrationPercent}%` }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          {/* Milestone Ticks */}
          <div className="flex justify-between text-[10px] font-semibold text-muted-foreground px-1 font-mono">
            <span>0%</span>
            <span>25% ({(goalMl * 0.25).toFixed(0)}ml)</span>
            <span>50% ({(goalMl * 0.5).toFixed(0)}ml)</span>
            <span>75% ({(goalMl * 0.75).toFixed(0)}ml)</span>
            <span className="text-blue-400 font-bold">100% ({goalMl}ml)</span>
          </div>
        </div>
      </div>

      {/* Quick 1-Click Increment Action Buttons */}
      <div className="mt-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-muted-foreground uppercase tracking-wider">
            {isAr ? 'إضافة سريعة للاستهلاك:' : 'Quick Increment:'}
          </span>
          <AnimatePresence>
            {lastAddedFeedback !== null && (
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-xs font-extrabold text-blue-400 flex items-center gap-1"
              >
                <Check className="h-3.5 w-3.5" />
                <span>+{lastAddedFeedback} ml {isAr ? 'تمت الإضافة' : 'Logged!'}</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {presets.map((preset) => (
            <button
              key={preset.amount}
              id={`btn-add-water-${preset.amount}`}
              type="button"
              onClick={() => triggerAdd(preset.amount)}
              className="flex items-center justify-between sm:flex-col sm:justify-center gap-1.5 rounded-xl border border-border bg-secondary/30 p-2.5 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all group active:scale-95"
            >
              <div className="flex items-center gap-1.5 sm:flex-col">
                <span className="text-lg group-hover:scale-110 transition-transform">{preset.icon}</span>
                <span className="text-xs font-bold text-foreground group-hover:text-blue-400 transition-colors">
                  {preset.desc}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground line-clamp-1">
                {preset.label.split(' ')[0]}
              </span>
            </button>
          ))}

          {/* Custom ml Button & Quick Drawer */}
          <button
            id="btn-custom-water-toggle"
            type="button"
            onClick={() => setCustomInputOpen(!customInputOpen)}
            className={`flex items-center justify-between sm:flex-col sm:justify-center gap-1.5 rounded-xl border p-2.5 transition-all active:scale-95 col-span-2 sm:col-span-4 lg:col-span-1 ${
              customInputOpen 
                ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
                : 'border-dashed border-border bg-secondary/20 hover:border-blue-500/50 hover:bg-secondary/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-1.5 sm:flex-col">
              <Plus className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold text-foreground">
                {t.dashboard.hydrationCustom}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {isAr ? 'أي سعة' : 'Custom'}
            </span>
          </button>
        </div>

        {/* Custom ml Inline Input Strip */}
        <AnimatePresence>
          {customInputOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/5 p-3">
                <span className="text-xs font-bold text-foreground">
                  {isAr ? 'أدخل الكمية بالملل (ml):' : 'Enter amount (ml):'}
                </span>
                <input
                  type="number"
                  min="50"
                  max="3000"
                  step="50"
                  value={customMl}
                  onChange={(e) => setCustomMl(Math.max(10, parseInt(e.target.value) || 0))}
                  className="w-24 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-bold text-foreground focus:outline-none focus:border-blue-500 font-mono"
                />
                
                {/* Quick chip shortcuts */}
                {[150, 330, 600, 1500].map((presetVal) => (
                  <button
                    key={presetVal}
                    type="button"
                    onClick={() => setCustomMl(presetVal)}
                    className="rounded-lg border border-border bg-card px-2 py-0.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-blue-500/40"
                  >
                    +{presetVal}ml
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    if (customMl > 0) {
                      triggerAdd(customMl);
                      setCustomInputOpen(false);
                    }
                  }}
                  className="ml-auto rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow hover:bg-blue-500 transition-colors"
                >
                  {isAr ? `إضافة +${customMl} مل` : `Add +${customMl} ml`}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Motivational Hydration Advice Footer Banner */}
      <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 flex items-start gap-2.5 text-xs text-foreground leading-relaxed">
        <Sparkles className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-blue-400">{isAr ? 'التوجيه الرياضي للترطيب: ' : 'Athletic Hydration Cue: '}</span>
          <span>{getMotivationalFeedback()}</span>
        </div>
      </div>
    </div>
  );
};
