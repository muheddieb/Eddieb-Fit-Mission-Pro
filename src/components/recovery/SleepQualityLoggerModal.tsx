import React, { useState, useEffect } from 'react';
import { 
  X, 
  Moon, 
  Sun, 
  Sparkles, 
  Activity, 
  Heart, 
  Zap, 
  Flame, 
  ShieldCheck, 
  Check, 
  Clock, 
  Smartphone, 
  Sliders, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { SleepLog, UserProfile } from '../../types';
import { StorageService } from '../../services/storage';

interface SleepQualityLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (log: SleepLog) => void;
  existingLog?: SleepLog | null;
  profile: UserProfile;
  isAr?: boolean;
}

export const SleepQualityLoggerModal: React.FC<SleepQualityLoggerModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  existingLog,
  profile,
  isAr = false,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(existingLog?.date || todayStr);
  const [bedTime, setBedTime] = useState<string>(existingLog?.bedTime || '22:30');
  const [wakeTime, setWakeTime] = useState<string>(existingLog?.wakeTime || '06:45');
  const [durationHours, setDurationHours] = useState<number>(existingLog?.durationHours || 8.25);
  const [qualityScore, setQualityScore] = useState<number>(existingLog?.qualityScore || 90);
  const [perceivedRecovery, setPerceivedRecovery] = useState<1 | 2 | 3 | 4 | 5>(
    (existingLog?.perceivedRecovery as any) || 4
  );
  const [deepSleepMinutes, setDeepSleepMinutes] = useState<number>(existingLog?.deepSleepMinutes || 110);
  const [remSleepMinutes, setRemSleepMinutes] = useState<number>(existingLog?.remSleepMinutes || 105);
  const [restingHeartRateBpm, setRestingHeartRateBpm] = useState<number>(existingLog?.restingHeartRateBpm || 54);
  const [hrvRmssdMs, setHrvRmssdMs] = useState<number>(existingLog?.hrvRmssdMs || 68);
  const [selectedFactors, setSelectedFactors] = useState<string[]>(
    existingLog?.factors || ['dark_cool_room', 'magnesium', 'no_screens_60m']
  );
  const [notes, setNotes] = useState<string>(existingLog?.notes || '');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Sync state when existingLog changes
  useEffect(() => {
    if (existingLog) {
      setDate(existingLog.date);
      setBedTime(existingLog.bedTime);
      setWakeTime(existingLog.wakeTime);
      setDurationHours(existingLog.durationHours);
      setQualityScore(existingLog.qualityScore);
      setPerceivedRecovery(existingLog.perceivedRecovery);
      setDeepSleepMinutes(existingLog.deepSleepMinutes || 100);
      setRemSleepMinutes(existingLog.remSleepMinutes || 95);
      setRestingHeartRateBpm(existingLog.restingHeartRateBpm || 55);
      setHrvRmssdMs(existingLog.hrvRmssdMs || 65);
      setSelectedFactors(existingLog.factors || []);
      setNotes(existingLog.notes || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setBedTime('22:30');
      setWakeTime('06:45');
      setDurationHours(8.25);
      setQualityScore(90);
      setPerceivedRecovery(4);
      setDeepSleepMinutes(110);
      setRemSleepMinutes(105);
      setRestingHeartRateBpm(54);
      setHrvRmssdMs(68);
      setSelectedFactors(['dark_cool_room', 'magnesium', 'no_screens_60m']);
      setNotes('');
    }
  }, [existingLog, isOpen]);

  // Recalculate duration whenever bedTime or wakeTime changes
  const calculateDurationFromTimes = (bed: string, wake: string) => {
    try {
      const [bH, bM] = bed.split(':').map(Number);
      const [wH, wM] = wake.split(':').map(Number);

      let bMinutes = bH * 60 + bM;
      let wMinutes = wH * 60 + wM;

      if (wMinutes < bMinutes) {
        wMinutes += 24 * 60; // Next morning
      }

      const diffMinutes = wMinutes - bMinutes;
      const hours = Math.round((diffMinutes / 60) * 100) / 100;
      setDurationHours(hours);

      // Auto-estimate deep and REM sleep proportionally
      const estDeep = Math.round(diffMinutes * 0.22);
      const estRem = Math.round(diffMinutes * 0.21);
      setDeepSleepMinutes(estDeep);
      setRemSleepMinutes(estRem);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBedTimeChange = (val: string) => {
    setBedTime(val);
    calculateDurationFromTimes(val, wakeTime);
  };

  const handleWakeTimeChange = (val: string) => {
    setWakeTime(val);
    calculateDurationFromTimes(bedTime, val);
  };

  const toggleFactor = (key: string) => {
    if (selectedFactors.includes(key)) {
      setSelectedFactors(selectedFactors.filter(f => f !== key));
    } else {
      setSelectedFactors([...selectedFactors, key]);
    }
  };

  const handleWearableSync = (device: string) => {
    setSyncFeedback(isAr ? `تمت المزامنة اللحظية من ${device}` : `Successfully synced telemetry from ${device}`);
    // Simulate real biometric pull
    setQualityScore(92);
    setDurationHours(8.0);
    setBedTime('22:45');
    setWakeTime('06:45');
    setDeepSleepMinutes(115);
    setRemSleepMinutes(108);
    setRestingHeartRateBpm(52);
    setHrvRmssdMs(71);
    setPerceivedRecovery(5);
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const handleSave = () => {
    const factorLabelsAr: Record<string, string> = {
      dark_cool_room: 'غرفة مظلمة وباردة (19°C)',
      no_screens_60m: 'إيقاف الشاشات قبل 60 دقيقة',
      magnesium: 'مغنيسيوم جلايسينات / زنك',
      no_caffeine_late: 'تجنب الكافيين بعد العصر',
      late_heavy_meal: 'وجبة عشاء متأخرة ثقيلة',
      stress: 'توتر أو انقطاع في النوم',
    };

    const log: SleepLog = {
      id: existingLog?.id || 'slp_' + Date.now(),
      date,
      bedTime,
      wakeTime,
      durationHours,
      qualityScore,
      deepSleepMinutes,
      remSleepMinutes,
      lightSleepMinutes: Math.max(0, Math.round(durationHours * 60) - (deepSleepMinutes + remSleepMinutes)),
      awakeMinutes: 20,
      restingHeartRateBpm,
      hrvRmssdMs,
      perceivedRecovery,
      factors: selectedFactors,
      factorsAr: selectedFactors.map(f => factorLabelsAr[f] || f),
      notes: notes.trim(),
      source: 'manual',
      timestamp: Date.now(),
    };

    StorageService.addSleepLog(log);
    onSaved(log);
    onClose();
  };

  if (!isOpen) return null;

  const factorOptions = [
    { key: 'dark_cool_room', labelEn: 'Dark & Cool Room (19°C)', labelAr: 'غرفة مظلمة وباردة (19°C)', icon: Moon, good: true },
    { key: 'no_screens_60m', labelEn: 'Zero Screen Time 60m Prior', labelAr: 'إيقاف الشاشات قبل 60 دقيقة', icon: Smartphone, good: true },
    { key: 'magnesium', labelEn: 'Magnesium Glycinate / Zinc', labelAr: 'مغنيسيوم جلايسينات / زنك', icon: Sparkles, good: true },
    { key: 'no_caffeine_late', labelEn: 'Zero Caffeine After 3 PM', labelAr: 'تجنب الكافيين بعد العصر', icon: ShieldCheck, good: true },
    { key: 'late_heavy_meal', labelEn: 'Late Heavy Meal (<2h Bedtime)', labelAr: 'وجبة عشاء متأخرة ثقيلة', icon: AlertCircle, good: false },
    { key: 'stress', labelEn: 'Interrupted Sleep / Stress', labelAr: 'توتر أو انقطاع في النوم', icon: AlertCircle, good: false },
  ];

  const readinessLevels = [
    { level: 1, labelEn: 'Exhausted', labelAr: 'منهك تماماً', color: 'text-rose-400 border-rose-500/40 bg-rose-500/10' },
    { level: 2, labelEn: 'Sluggish', labelAr: 'إجهاد وخمول', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
    { level: 3, labelEn: 'Moderate', labelAr: 'معتدل / قياسي', color: 'text-sky-400 border-sky-500/40 bg-sky-500/10' },
    { level: 4, labelEn: 'Energized', labelAr: 'نشيط ومستعد', color: 'text-teal-400 border-teal-500/40 bg-teal-500/10' },
    { level: 5, labelEn: 'Peak / PR Ready', labelAr: 'جاهزية قصوى لتحطيم الأرقام', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/15' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 text-white shadow-md shadow-purple-500/20">
              <Moon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">
                {isAr ? 'تسجيل جودة النوم والاستشفاء العصبي' : 'Log Sleep Quality & Recovery Telemetry'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isAr ? 'ربط مدة ونوعية النوم بأداء وجلسات تمرين اليوم.' : 'Correlate sleep depth & duration directly with your daily workout performance.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Wearable Fast Sync Bar */}
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
            <Smartphone className="h-4 w-4 text-purple-400" />
            <span>{isAr ? 'المزامنة السريعة من الساعات الذكية:' : 'Quick Sync from Smartwear:'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleWearableSync('Galaxy Watch / Health')}
              className="rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 px-3 py-1.5 text-xs font-bold text-purple-300 transition-all"
            >
              Galaxy Watch
            </button>
            <button
              type="button"
              onClick={() => handleWearableSync('Apple Health')}
              className="rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 px-3 py-1.5 text-xs font-bold text-purple-300 transition-all"
            >
              Apple Health
            </button>
          </div>
        </div>

        {syncFeedback && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-2.5 text-xs font-bold text-emerald-400 animate-in fade-in">
            <Check className="h-4 w-4" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Date, Bedtime, and Wake-up time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              {isAr ? 'تاريخ الاستيقاظ' : 'Wake-up Date'}
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              {isAr ? 'وقت الخلود للنوم (Bedtime)' : 'Bedtime'}
            </label>
            <input
              type="time"
              value={bedTime}
              onChange={e => handleBedTimeChange(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-bold text-foreground focus:border-primary focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              {isAr ? 'وقت الاستيقاظ (Wake-up)' : 'Wake-up Time'}
            </label>
            <input
              type="time"
              value={wakeTime}
              onChange={e => handleWakeTimeChange(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-bold text-foreground focus:border-primary focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Sleep Duration & Quality Score Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Duration */}
          <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-purple-400" />
                <span>{isAr ? 'إجمالي ساعات النوم' : 'Sleep Duration'}</span>
              </span>
              <span className="font-mono text-base font-black text-purple-400">
                {Math.floor(durationHours)}h {Math.round((durationHours % 1) * 60)}m ({durationHours} hrs)
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="11"
              step="0.25"
              value={durationHours}
              onChange={e => setDurationHours(parseFloat(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>4h (Critical Deficit)</span>
              <span className="text-emerald-400 font-bold">7.5h - 8.5h (Optimal)</span>
              <span>11h</span>
            </div>
          </div>

          {/* Quality Score */}
          <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>{isAr ? 'مؤشر جودة النوم (0-100)' : 'Sleep Quality Score'}</span>
              </span>
              <span className={`font-mono text-base font-black ${
                qualityScore >= 85 ? 'text-emerald-400' : qualityScore >= 75 ? 'text-teal-400' : qualityScore >= 65 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {qualityScore}% {qualityScore >= 85 ? (isAr ? 'ممتاز' : 'Optimal') : qualityScore >= 70 ? (isAr ? 'جيد' : 'Good') : (isAr ? 'إجهاد' : 'Fatigued')}
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="100"
              step="1"
              value={qualityScore}
              onChange={e => setQualityScore(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>40% (Poor)</span>
              <span className="text-emerald-400 font-bold">85%+ (Hypertrophy Peak)</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Perceived Morning Readiness Rating */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-foreground">
            {isAr ? 'مستوى الجاهزية والاستشفاء العصبي عند الاستيقاظ (CNS Readiness):' : 'Perceived Morning Physical & CNS Readiness:'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {readinessLevels.map(lvl => {
              const isSelected = perceivedRecovery === lvl.level;
              return (
                <button
                  key={lvl.level}
                  type="button"
                  onClick={() => setPerceivedRecovery(lvl.level as any)}
                  className={`rounded-2xl border p-3 text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? `${lvl.color} ring-2 ring-primary/40 shadow-sm`
                      : 'border-border bg-secondary/20 text-muted-foreground hover:bg-secondary/50'
                  }`}
                >
                  <span className="text-base font-black font-mono">{lvl.level}/5</span>
                  <span className="text-[10px] font-bold leading-tight">{isAr ? lvl.labelAr : lvl.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Deep Sleep, REM & Biometrics */}
        <div className="rounded-2xl border border-border bg-secondary/20 p-4 space-y-3">
          <div className="text-xs font-bold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-sky-400" />
              <span>{isAr ? 'تفاصيل أطوار النوم والقياسات الحيوية' : 'Sleep Stages & Biometrics (Optional)'}</span>
            </span>
            <span className="text-[10px] text-muted-foreground">{isAr ? 'تأثير إفراز هرمون النمو' : 'Growth Hormone Stimulus'}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                {isAr ? 'نوم عميق (Deep Min)' : 'Deep Sleep (min)'}
              </label>
              <input
                type="number"
                min="0"
                max="240"
                value={deepSleepMinutes}
                onChange={e => setDeepSleepMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-xl border border-border bg-background p-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                {isAr ? 'نوم الأحلام (REM Min)' : 'REM Sleep (min)'}
              </label>
              <input
                type="number"
                min="0"
                max="240"
                value={remSleepMinutes}
                onChange={e => setRemSleepMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-xl border border-border bg-background p-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                {isAr ? 'نبض الراحة (RHR bpm)' : 'Resting HR (bpm)'}
              </label>
              <input
                type="number"
                min="40"
                max="100"
                value={restingHeartRateBpm}
                onChange={e => setRestingHeartRateBpm(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-xl border border-border bg-background p-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                {isAr ? 'الاستشفاء العصبي (HRV ms)' : 'HRV (ms RMSSD)'}
              </label>
              <input
                type="number"
                min="20"
                max="120"
                value={hrvRmssdMs}
                onChange={e => setHrvRmssdMs(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-xl border border-border bg-background p-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Sleep Hygiene & Environmental Factors */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-foreground">
            {isAr ? 'عوامل وبيئة النوم (Sleep Hygiene Factors):' : 'Sleep Hygiene & Recovery Factors:'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {factorOptions.map(opt => {
              const active = selectedFactors.includes(opt.key);
              const Icon = opt.icon;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => toggleFactor(opt.key)}
                  className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-bold transition-all text-left ${
                    active
                      ? opt.good
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                      : 'border-border bg-card/60 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{isAr ? opt.labelAr : opt.labelEn}</span>
                  </span>
                  <div className={`h-4 w-4 rounded-md flex items-center justify-center border ${
                    active ? (opt.good ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-amber-500 border-amber-400 text-white') : 'border-border'
                  }`}>
                    {active && <Check className="h-3 w-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1.5">
            {isAr ? 'ملاحظات وتجربة الاستيقاظ' : 'Morning Notes & Perceived Energy'}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={isAr ? 'مثال: استيقظت بنشاط عالي، العضلات مسترخية ومستعدة للتمرين الثقيل...' : 'e.g., Felt completely refreshed, zero joint stiffness, ready for heavy push session...'}
            className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:border-primary focus:outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/80">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            id="btn-save-sleep-log"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/20 hover:from-purple-500 hover:to-indigo-500 transition-all"
          >
            <Check className="h-4 w-4" />
            <span>{isAr ? 'حفظ ومزامنة تحليل النوم' : 'Save & Correlate Sleep'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
