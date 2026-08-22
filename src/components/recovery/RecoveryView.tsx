import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Flame, 
  Waves, 
  Moon, 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  ShieldCheck, 
  Plus 
} from 'lucide-react';
import { RecoverySession, UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { StorageService } from '../../services/storage';

interface RecoveryViewProps {
  profile: UserProfile;
}

export const RecoveryView: React.FC<RecoveryViewProps> = ({
  profile,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [recoveryLogs, setRecoveryLogs] = useState<RecoverySession[]>([]);
  const [selectedType, setSelectedType] = useState<RecoverySession['type']>('sauna');
  const [durationMin, setDurationMin] = useState<number>(15);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    setRecoveryLogs(StorageService.getRecoveryHistory());
  }, []);

  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive, timerSeconds]);

  const handleStartTimer = (mins: number) => {
    setTimerSeconds(mins * 60);
    setTimerActive(true);
  };

  const handleLogRecovery = () => {
    const session: RecoverySession = {
      id: 'rec_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: selectedType,
      durationMinutes: durationMin,
      notes: 'Completed recovery session',
      timestamp: Date.now(),
    };

    StorageService.addRecoverySession(session);
    setRecoveryLogs(StorageService.getRecoveryHistory());
  };

  return (
    <div className="space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground sm:text-3xl">
          {t.recovery.title}
        </h1>
        <p className="text-sm text-muted-foreground">{t.recovery.subtitle}</p>
      </div>

      {/* 4 Pillars of Athletic Restoration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sauna */}
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-2 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <Flame className="h-4 w-4" />
            <span>{isAr ? 'الساونا الجافة (Heat Shock)' : 'Sauna (HSP Release)'}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isAr
              ? '15-20 دقيقة عند 80-90°C لتحفيز بروتينات الصدمة الحرارية وتحسين مرونة الأوعية الدموية.'
              : '15-20 min @ 80-90°C activates Heat Shock Proteins, enhancing blood vessel compliance and growth hormone.'}
          </p>
        </div>

        {/* Steam */}
        <div className="rounded-2xl border border-blue-500/25 bg-blue-500/5 p-4 space-y-2 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
            <Waves className="h-4 w-4" />
            <span>{isAr ? 'غرفة البخار (Steam Room)' : 'Steam Room'}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isAr
              ? '10-15 دقيقة لترطيب الجهاز التنفسي، استرخاء العضلات، وتنقية المسام الجلدية.'
              : '10-15 min aids respiratory hydration, reduces systemic tension, and soothes joint stiffness.'}
          </p>
        </div>

        {/* Jacuzzi / Contrast */}
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-2 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <Sparkles className="h-4 w-4" />
            <span>{isAr ? 'الجاكوزي والاستحمام التبادلي' : 'Jacuzzi & Hydrotherapy'}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isAr
              ? 'التدليك المائي الدافئ يسرع التخلص من حمض اللاكتيك ويقلل آلام العضلات المتأخرة (DOMS).'
              : 'Warm hydro-massage increases peripheral circulation, accelerating metabolic waste clearance.'}
          </p>
        </div>

        {/* Sleep Optimization */}
        <div className="rounded-2xl border border-purple-500/25 bg-purple-500/5 p-4 space-y-2 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
            <Moon className="h-4 w-4" />
            <span>{isAr ? 'النوم العميق (7.5-8.5 ساعة)' : 'Deep Sleep Optimization'}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isAr
              ? 'غرفة مظلمة باردة (19°C) وتجنب الشاشات قبل النوم بـ 60 دقيقة لتعظيم إفراز التستوستيرون.'
              : 'Dark, cool 19°C environment, zero blue-light 60 min before sleep for natural testosterone release.'}
          </p>
        </div>
      </div>

      {/* Recovery Session & Countdown Timer */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              {isAr ? 'مؤقت وبروتوكول الاستشفاء التفاعلي' : 'Interactive Recovery Protocol Timer'}
            </h3>
          </div>
          <div className="font-mono text-lg font-black text-primary">
            {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Recovery Type */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              {isAr ? 'نوع الاستشفاء' : 'Recovery Modality'}
            </label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as any)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="sauna">{isAr ? 'ساونا جافة (Sauna)' : 'Dry Sauna'}</option>
              <option value="steam">{isAr ? 'غرفة بخار (Steam Room)' : 'Steam Room'}</option>
              <option value="jacuzzi">{isAr ? 'جاكوزي مائي (Jacuzzi)' : 'Jacuzzi'}</option>
              <option value="stretching">{isAr ? 'جلسة إطالات كاملة (Stretching)' : 'Full Body Stretching'}</option>
              <option value="sleep">{isAr ? 'نوم عميق واستشفاء' : 'Sleep Recovery'}</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              {isAr ? 'المدة (دقائق)' : 'Duration (mins)'}
            </label>
            <input
              type="number"
              min="5"
              max="60"
              step="5"
              value={durationMin}
              onChange={e => setDurationMin(parseInt(e.target.value, 10) || 15)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Quick Timer Buttons */}
          <div className="flex flex-col justify-end">
            <div className="flex items-center gap-2">
              {timerActive ? (
                <button
                  id="btn-pause-recovery-timer"
                  onClick={() => setTimerActive(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/20 py-2.5 text-xs font-bold text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                >
                  <Pause className="h-4 w-4" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  id="btn-start-recovery-timer"
                  onClick={() => handleStartTimer(durationMin)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Start Timer</span>
                </button>
              )}

              {timerSeconds > 0 && (
                <button
                  onClick={() => {
                    setTimerSeconds(0);
                    setTimerActive(false);
                  }}
                  className="rounded-xl border border-border bg-secondary p-2.5 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <button
          id="btn-log-recovery-session"
          onClick={handleLogRecovery}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-xs font-bold text-foreground border border-border hover:bg-secondary/80 transition-colors"
        >
          <Plus className="h-4 w-4 text-primary" />
          <span>{isAr ? 'تسجيل إكمال جلسة الاستشفاء' : 'Log Completed Recovery Session'}</span>
        </button>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-foreground">
          {isAr ? 'سجل جلسات الاستشفاء' : 'Recovery History'} ({recoveryLogs.length})
        </h3>

        {recoveryLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">
            {isAr ? 'لم تسجل أي جلسات استشفاء بعد.' : 'No recovery sessions logged yet.'}
          </p>
        ) : (
          <div className="space-y-2">
            {recoveryLogs.map(log => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3"
              >
                <div>
                  <span className="text-xs font-bold text-foreground capitalize">
                    {log.type} Session
                  </span>
                  <div className="text-[11px] text-muted-foreground">
                    {log.date} • {log.durationMinutes} min
                  </div>
                </div>
                <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                  {log.durationMinutes}m
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
