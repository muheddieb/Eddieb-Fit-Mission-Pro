import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  Flame, 
  Activity, 
  Timer, 
  Plus, 
  Check, 
  ShieldCheck, 
  Zap, 
  ArrowUpRight,
  Play,
  Gauge,
  Mountain,
  Navigation,
  Compass,
  Bike
} from 'lucide-react';
import { CardioSession, UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { StorageService } from '../../services/storage';
import { ActiveCardioModal, ActiveCardioConfig } from './ActiveCardioModal';

interface CardioViewProps {
  profile: UserProfile;
}

export const CardioView: React.FC<CardioViewProps> = ({
  profile,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [cardioLogs, setCardioLogs] = useState<CardioSession[]>([]);
  const [type, setType] = useState<CardioSession['type']>('treadmill_incline');
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [inclinePercentage, setInclinePercentage] = useState<number>(10);
  const [speedKmh, setSpeedKmh] = useState<number>(4.8);
  const [intensity, setIntensity] = useState<CardioSession['intensity']>('zone2_fat_loss');
  const [activeCardioConfig, setActiveCardioConfig] = useState<ActiveCardioConfig | null>(null);

  useEffect(() => {
    setCardioLogs(StorageService.getCardioHistory());
  }, []);

  const estimatedCalories = Math.round(
    intensity === 'zone2_fat_loss'
      ? durationMinutes * (profile.currentWeightKg * 0.08) * (1 + inclinePercentage * 0.05)
      : durationMinutes * (profile.currentWeightKg * 0.12)
  );

  const handleLogCardioManual = () => {
    const session: CardioSession = {
      id: 'cardio_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      type,
      durationMinutes,
      inclinePercentage: type === 'treadmill_incline' ? inclinePercentage : undefined,
      speedKmh,
      intensity,
      caloriesBurned: estimatedCalories,
      timestamp: Date.now(),
    };

    StorageService.addCardioSession(session);
    setCardioLogs(StorageService.getCardioHistory());
  };

  const handleStartLiveCardio = (cfg: ActiveCardioConfig) => {
    setActiveCardioConfig(cfg);
  };

  const handleFinishLiveSession = (session: CardioSession) => {
    setActiveCardioConfig(null);
    setCardioLogs(StorageService.getCardioHistory());
  };

  const totalCardioMinutes = cardioLogs.reduce((sum, c) => sum + c.durationMinutes, 0);
  const totalCaloriesBurned = cardioLogs.reduce((sum, c) => sum + (c.caloriesBurned || 0), 0);

  return (
    <div className="space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground sm:text-3xl">
          {t.cardio.title}
        </h1>
        <p className="text-sm text-muted-foreground">{t.cardio.subtitle}</p>
      </div>

      {/* Quick Launch Cards for Low-Impact Gym Cardio Modalities */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span>{isAr ? 'خيارات الكارديو الآمنة للمفاصل في الجيم' : 'Joint-Safe Gym Cardio Launchers'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Preset 1: Stationary Cycling */}
          <div className="rounded-2xl border border-primary/30 bg-card p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="font-bold text-primary">Zone 2 · Zero Knee Impact</span>
                <span className="text-muted-foreground">20–30 min</span>
              </div>

              <h4 className="text-base font-black text-foreground flex items-center gap-2">
                <Bike className="h-4 w-4 text-primary" />
                <span>{isAr ? 'دراجة ثابتة (Stationary Bike)' : 'Stationary Bike'}</span>
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isAr
                  ? 'الأفضل لوزن 101 كجم: يحرق الدهون بمقاومة متوسطة و70–85 لفة بدون أي صدمات على الركبة أو أسفل الظهر.'
                  : 'Best choice at 101 kg: smooth 70–85 RPM cadence burns fat with zero knee or lower-back impact.'}
              </p>
            </div>

            <button
              id="btn-start-live-cycling"
              onClick={() => handleStartLiveCardio({
                type: 'stationary_bike',
                targetDurationMinutes: 25,
                inclinePercentage: 0,
                initialSpeedKmh: 20.0,
                intensity: 'zone2_fat_loss',
                environment: 'coastal',
              })}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{isAr ? 'ابدأ جلسة الدراجة' : 'Start Stationary Bike'}</span>
            </button>
          </div>

          {/* Preset 2: Treadmill Walking (Flat or Gentle Incline) */}
          <div className="rounded-2xl border border-emerald-500/30 bg-card p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="font-bold text-emerald-400">Zone 2 Fat-Loss Walk</span>
                <span className="text-muted-foreground">20–30 min</span>
              </div>

              <h4 className="text-base font-black text-foreground flex items-center gap-2">
                <Mountain className="h-4 w-4 text-emerald-400" />
                <span>{isAr ? 'مشي على المشاية (Treadmill Walk)' : 'Treadmill Walking'}</span>
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isAr
                  ? 'سرعة 4.2–5.0 كم/س بميل لطيف 4–8% (بدون جري). يرفع الحرق مع حماية المفاصل.'
                  : 'Walk at 4.2–5.0 km/h with a gentle 4–8% incline (no running) to protect knees and lower back.'}
              </p>
            </div>

            <button
              id="btn-start-live-treadmill"
              onClick={() => handleStartLiveCardio({
                type: 'treadmill_incline',
                targetDurationMinutes: 25,
                inclinePercentage: 6,
                initialSpeedKmh: 4.6,
                intensity: 'zone2_fat_loss',
                environment: 'sunset',
              })}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{isAr ? 'ابدأ مشي المشاية' : 'Start Treadmill Walk'}</span>
            </button>
          </div>

          {/* Preset 3: Low-Impact Elliptical */}
          <div className="rounded-2xl border border-cyan-500/30 bg-card p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="font-bold text-cyan-400">Low-Impact Alternative</span>
                <span className="text-muted-foreground">20 min</span>
              </div>

              <h4 className="text-base font-black text-foreground flex items-center gap-2">
                <Navigation className="h-4 w-4 text-cyan-400" />
                <span>{isAr ? 'جهاز إليبتيكال (Elliptical)' : 'Low-Impact Elliptical'}</span>
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isAr
                  ? 'حركة انسيابية لكامل الجسم بدون ارتطام القدم بالأرض عند توفره في الجيم.'
                  : 'Smooth gliding stride with zero foot-strike impact when cycling or walking needs variety.'}
              </p>
            </div>

            <button
              id="btn-start-live-elliptical"
              onClick={() => handleStartLiveCardio({
                type: 'elliptical',
                targetDurationMinutes: 20,
                inclinePercentage: 0,
                initialSpeedKmh: 6.5,
                intensity: 'zone2_fat_loss',
                environment: 'mountain',
              })}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-xs font-bold text-white hover:bg-cyan-500 transition-colors"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{isAr ? 'ابدأ جلسة الإليبتيكال' : 'Start Elliptical'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clear Cardio Strategy Table */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-primary font-black text-sm">
          <ShieldCheck className="h-5 w-5" />
          <span>{isAr ? 'استراتيجية الكارديو المخصصة لوزن 101 كجم (الجيم فقط)' : 'Low-Impact Gym Cardio Strategy'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="border-s-2 border-primary ps-3 space-y-0.5">
            <div className="font-bold text-foreground">{isAr ? 'المدة والتكرار' : 'Duration & Frequency'}</div>
            <div className="text-muted-foreground">
              {isAr ? '20–30 دقيقة بعد التمرين (أو 30 د في أيام الراحة) • 3–5 مرات أسبوعياً.' : '20–30 min post-lifting (or 30m on rest days) • 3–5x/week.'}
            </div>
          </div>
          <div className="border-s-2 border-emerald-500 ps-3 space-y-0.5">
            <div className="font-bold text-foreground">{isAr ? 'الشدة (Zone 2)' : 'Intensity (Zone 2)'}</div>
            <div className="text-muted-foreground">
              {isAr ? 'نبض 60–70% (تستطيع الكلام بجمل قصيرة بدون نهجان شديد).' : '60–70% max HR (steady conversational pace, RPE 5–6).'}
            </div>
          </div>
          <div className="border-s-2 border-sky-500 ps-3 space-y-0.5">
            <div className="font-bold text-foreground">{isAr ? 'التوقيت الصباحي' : 'Timing'}</div>
            <div className="text-muted-foreground">
              {isAr ? 'بعد رفع الأوزان مباشرة للحفاظ على طاقة العضلات، أو صباحاً في أيام الراحة.' : 'Directly after lifting so strength stays high, or morning on rest days.'}
            </div>
          </div>
          <div className="border-s-2 border-amber-500 ps-3 space-y-0.5">
            <div className="font-bold text-foreground">{isAr ? 'التدرج الآمن' : 'Progression'}</div>
            <div className="text-muted-foreground">
              {isAr ? 'زد +5 دقائق كل أسبوعين قبل زيادة المقاومة أو الميل. تجنب الجري والقفز.' : 'Add +5 min every 2 weeks before increasing resistance/incline. Avoid running/jumping.'}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Cardio Setup Form */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              {isAr ? 'تخصيص جلسة كارديو (Custom Parameters)' : 'Custom Cardio Parameters'}
            </h3>
          </div>
          <span className="text-xs font-bold font-mono tabular-nums text-emerald-400">
            ~{estimatedCalories} kcal est. burn
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cardio Type */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              {isAr ? 'النوع' : 'Cardio Modality'}
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="stationary_bike">{isAr ? 'دراجة ثابتة (Stationary Bike)' : 'Stationary Bike'}</option>
              <option value="treadmill_incline">{isAr ? 'مشي بميل على المشاية (Incline Walk)' : 'Treadmill Incline Walk'}</option>
              <option value="treadmill_walk">{isAr ? 'مشي مستوي على المشاية (Treadmill Walk)' : 'Treadmill Flat Walk'}</option>
              <option value="elliptical">{isAr ? 'إليبتيكال (Elliptical)' : 'Elliptical'}</option>
            </select>
          </div>

          {/* Duration in Minutes */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              {isAr ? 'المدة (بالدقائق)' : 'Duration (minutes)'}
            </label>
            <input
              type="number"
              min="5"
              max="180"
              step="5"
              value={durationMinutes}
              onChange={e => setDurationMinutes(parseInt(e.target.value, 10) || 20)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Incline (if treadmill) */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              {isAr ? 'درجة الميل (%)' : 'Incline (%)'}
            </label>
            <input
              type="number"
              min="0"
              max="15"
              step="1"
              value={inclinePercentage}
              onChange={e => setInclinePercentage(parseFloat(e.target.value) || 0)}
              disabled={type !== 'treadmill_incline'}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none disabled:opacity-40"
            />
          </div>

          {/* Speed km/h */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              {isAr ? 'السرعة (كم/س)' : 'Speed (km/h)'}
            </label>
            <input
              type="number"
              min="1"
              max="25"
              step="0.1"
              value={speedKmh}
              onChange={e => setSpeedKmh(parseFloat(e.target.value) || 4.8)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            id="btn-start-custom-live-cardio"
            onClick={() => handleStartLiveCardio({
              type,
              targetDurationMinutes: durationMinutes,
              inclinePercentage,
              initialSpeedKmh: speedKmh,
              intensity,
            })}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>{isAr ? 'ابدأ الجلسة الحية (Live Interactive HUD)' : 'Start Live Interactive HUD'}</span>
          </button>

          <button
            id="btn-log-cardio-manual"
            onClick={handleLogCardioManual}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-5 py-3 text-xs font-bold text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{isAr ? 'تسجيل يدوي سريع' : 'Quick Manual Log'}</span>
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">
            {isAr ? 'سجل جلسات الكارديو المكتملة' : 'Cardio Session History'}
          </h3>
          <span className="text-xs text-muted-foreground">
            {totalCardioMinutes} {isAr ? 'دقيقة إجمالية' : 'total minutes'} • {totalCaloriesBurned} kcal
          </span>
        </div>

        {cardioLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            {isAr ? 'لا توجد جلسات كارديو مسجلة بعد.' : 'No cardio sessions logged yet.'}
          </p>
        ) : (
          <div className="space-y-2">
            {cardioLogs.slice(0, 8).map(log => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3.5 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground capitalize">
                      {isAr
                        ? (log.type === 'treadmill_incline' ? 'مشاية بميل' : log.type === 'stationary_bike' ? 'دراجة ثابتة' : 'مشي خارجي')
                        : log.type.replace('_', ' ')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {log.date} • {log.speedKmh ? `${log.speedKmh} km/h` : ''} {log.inclinePercentage ? `• ${log.inclinePercentage}% incline` : ''}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-primary">{log.durationMinutes} min</div>
                  <div className="text-[11px] text-emerald-400 font-medium">~{log.caloriesBurned || 0} kcal</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Live Cardio HUD Modal */}
      {activeCardioConfig && (
        <ActiveCardioModal
          config={activeCardioConfig}
          profile={profile}
          onClose={() => setActiveCardioConfig(null)}
          onFinish={handleFinishLiveSession}
        />
      )}
    </div>
  );
};
