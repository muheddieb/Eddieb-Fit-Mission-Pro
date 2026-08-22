import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Globe, 
  Moon, 
  Sun, 
  Download, 
  FileText, 
  Trash2, 
  AlertTriangle, 
  Check, 
  Smartphone, 
  ShieldAlert, 
  Volume2, 
  Play, 
  Music, 
  Target, 
  Palette, 
  Sparkles, 
  Zap, 
  Flame, 
  Crown, 
  Cpu, 
  Activity, 
  Shield,
  ShieldCheck,
  WifiOff,
  Maximize
} from 'lucide-react';
import { UserProfile, RestSoundType, AppTheme } from '../../types';
import { translations } from '../../i18n/translations';
import { StorageService } from '../../services/storage';
import { AudioService } from '../../services/audioService';
import { PWAService, PWAState } from '../../services/pwaService';
import { THEME_OPTIONS, ThemeOption } from '../../utils/themeData';

interface SettingsViewProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onResetApp: () => void;
  onOpenPWAInstallModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onResetApp,
  onOpenPWAInstallModal,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pwaState, setPwaState] = useState<PWAState>(PWAService.getState());

  useEffect(() => {
    const unsub = PWAService.subscribe((state) => setPwaState(state));
    return () => unsub();
  }, []);

  const handleTestSound = (sound: RestSoundType) => {
    AudioService.playSound(sound);
  };

  const handleExportJSON = () => {
    const jsonStr = StorageService.exportAllDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eddieb-fit-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMsg('Full JSON data export downloaded successfully');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleExportCSV = () => {
    const csvStr = StorageService.exportWorkoutsAsCSV();
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eddieb-fit-workouts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMsg('Workouts CSV history exported');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handlePerformReset = () => {
    StorageService.resetAllData();
    onResetApp();
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground sm:text-3xl">
          {t.settings.title}
        </h1>
        <p className="text-sm text-muted-foreground">{t.settings.subtitle}</p>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-400 flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Preferences (Language) */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <span>{isAr ? 'لغة التطبيق' : 'Application Language'}</span>
        </h3>

        <div className="grid grid-cols-2 gap-3 max-w-md">
          <button
            type="button"
            onClick={() => onUpdateProfile({ ...profile, language: 'en' })}
            className={`rounded-xl border py-3 px-4 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              profile.language === 'en'
                ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <span>🇺🇸 English (LTR)</span>
          </button>
          <button
            type="button"
            onClick={() => onUpdateProfile({ ...profile, language: 'ar' })}
            className={`rounded-xl border py-3 px-4 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              profile.language === 'ar'
                ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <span>🇪🇬 العربية (RTL)</span>
          </button>
        </div>
      </div>

      {/* Motivational Theme Studio & Gallery */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>{isAr ? 'استوديو السمات والألوان التحفيزية' : 'Motivational Theme & Color Studio'}</span>
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-extrabold text-primary uppercase tracking-wider">
                  12 Themes
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                {t.settings.themeSubtitle}
              </p>
            </div>
          </div>

          {/* Active Theme Badge */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-1.5 self-start sm:self-auto">
            <span className="text-[11px] text-muted-foreground">{isAr ? 'السمة النشطة:' : 'Active:'}</span>
            <span className="text-xs font-extrabold text-primary">
              {THEME_OPTIONS.find(th => th.id === profile.theme)?.[isAr ? 'nameAr' : 'nameEn'] || profile.theme}
            </span>
          </div>
        </div>

        {/* Motivational Theme Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {THEME_OPTIONS.map((themeOpt) => {
            const isSelected = profile.theme === themeOpt.id;
            return (
              <button
                key={themeOpt.id}
                id={`btn-theme-select-${themeOpt.id}`}
                type="button"
                onClick={() => onUpdateProfile({ ...profile, theme: themeOpt.id })}
                className={`relative flex flex-col text-left rounded-2xl border p-4 transition-all duration-200 group text-start overflow-hidden ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/10 bg-secondary/80'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-secondary/40'
                }`}
              >
                {/* Top: Name & Tag */}
                <div className="flex items-start justify-between gap-2 mb-2.5 w-full">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-4 w-4 rounded-full shadow-sm shrink-0 border border-white/20"
                      style={{ backgroundColor: themeOpt.primaryColor }}
                    />
                    <div>
                      <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
                        {isAr ? themeOpt.nameAr : themeOpt.nameEn}
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {isAr ? themeOpt.vibeAr : themeOpt.vibeEn}
                      </p>
                    </div>
                  </div>

                  <span 
                    className="rounded-full px-2 py-0.5 text-[9px] font-extrabold tracking-wider shrink-0"
                    style={{
                      backgroundColor: `${themeOpt.primaryColor}20`,
                      color: themeOpt.primaryColor,
                      border: `1px solid ${themeOpt.primaryColor}40`
                    }}
                  >
                    {isAr ? themeOpt.badgeAr : themeOpt.badge}
                  </span>
                </div>

                {/* Theme Visual Palette Mockup Preview */}
                <div 
                  className="w-full rounded-xl p-2.5 mb-2.5 border transition-all"
                  style={{
                    backgroundColor: themeOpt.bgPreview,
                    borderColor: themeOpt.borderPreview,
                    color: themeOpt.textColor
                  }}
                >
                  <div 
                    className="rounded-lg p-2 flex items-center justify-between border"
                    style={{
                      backgroundColor: themeOpt.cardPreview,
                      borderColor: themeOpt.borderPreview
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div 
                        className="h-2 w-6 rounded-full"
                        style={{ backgroundColor: themeOpt.primaryColor }}
                      />
                      <div 
                        className="h-2 w-10 rounded-full opacity-40"
                        style={{ backgroundColor: themeOpt.textColor }}
                      />
                    </div>
                    <div 
                      className="px-2 py-0.5 rounded text-[8px] font-bold"
                      style={{
                        backgroundColor: themeOpt.primaryColor,
                        color: themeOpt.id === 'spartan_gold' || themeOpt.id === 'cyber_lime' || themeOpt.id === 'arctic_frost' || themeOpt.id === 'warm_amber' || themeOpt.id === 'solar_orange' || themeOpt.id === 'fitness_dark' || themeOpt.id === 'electric_cyan' ? '#000000' : '#ffffff'
                      }}
                    >
                      {isAr ? 'تمرين' : 'LIFT'}
                    </div>
                  </div>
                </div>

                {/* Slogan */}
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mt-auto">
                  {isAr ? themeOpt.sloganAr : themeOpt.sloganEn}
                </p>

                {/* Active Indicator Bar */}
                {isSelected && (
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-primary rounded-b-2xl shadow-sm" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Display & Screen Wake Lock Settings */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <span>{isAr ? 'إبقاء الشاشة مفعلة أثناء التمرين (Screen Wake Lock)' : 'Screen Wake Lock & Display'}</span>
          </h3>
          <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
            {profile.screenWakeDuration === 'never' 
              ? (isAr ? 'مفعل دائماً' : 'Always Active') 
              : (isAr ? `إيقاف بعد ${profile.screenWakeDuration || 'never'}` : `Auto-off: ${profile.screenWakeDuration}`)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {isAr
            ? 'منع إغلاق أو إطفاء الشاشة تلقائياً أثناء جلسات رفع الأثقال، الكارديو، أو تمارين البطن النشطة حتى تتابع عداد الراحة والمجموعات بدون لمس الشاشة.'
            : 'Keep the screen awake during active lifting, cardio, or core sessions so you can monitor timers and sets hands-free without phone sleep.'}
        </p>

        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-2">
            {isAr ? 'مدة إبقاء الشاشة مضاءة (Screen Wake Duration)' : 'Screen Wake Duration'}
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(['1m', '2m', '5m', '10m', '30m', 'never'] as const).map(dur => (
              <button
                key={dur}
                id={`btn-wake-${dur}`}
                type="button"
                onClick={() => onUpdateProfile({ ...profile, screenWakeDuration: dur })}
                className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                  (profile.screenWakeDuration || 'never') === dur
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary'
                }`}
              >
                {dur === 'never' ? (isAr ? 'دائماً (Never)' : 'Always') : dur}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rest Timer Audio Notification Settings */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <span>{isAr ? 'صوت انتهاء فترة الراحة (Rest Timer Alert Sound)' : 'Rest Timer Alert Sound'}</span>
          </h3>
          <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary">
            {profile.restSoundType || 'beep'}
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {isAr
            ? 'حدد نغمة التنبيه التي تصدر فور انتهاء وقت الراحة بين المجموعات لتنبيهك بالبدء في المجموعة التالية فوراً (الافتراضي هو Beep صافرة القياسية).'
            : 'Select the audible tone played when the inter-set rest timer reaches zero to signal the start of your next set.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            { id: 'beep', nameAr: 'صفارة قياسية (Beep)', nameEn: 'Standard Beep' },
            { id: 'whistle', nameAr: 'صافرة حكم (Whistle)', nameEn: 'Whistle' },
            { id: 'chime', nameAr: 'رنين ناعم (Chime)', nameEn: 'Harmonic Chime' },
            { id: 'buzzer', nameAr: 'جرس صالة (Buzzer)', nameEn: 'Gym Buzzer' },
            { id: 'bell', nameAr: 'جرس جولة (Bell)', nameEn: 'Boxing Bell' },
          ].map(snd => {
            const isSelected = (profile.restSoundType || 'beep') === snd.id;
            return (
              <div
                key={snd.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-3.5 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-sm shadow-primary/20'
                    : 'border-border bg-secondary/30 hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-foreground">
                    {isAr ? snd.nameAr : snd.nameEn}
                  </span>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>

                <div className="flex items-center gap-2 mt-auto pt-2">
                  <button
                    type="button"
                    id={`btn-select-sound-${snd.id}`}
                    onClick={() => {
                      onUpdateProfile({ ...profile, restSoundType: snd.id as RestSoundType });
                      handleTestSound(snd.id as RestSoundType);
                    }}
                    className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border bg-card text-foreground hover:bg-secondary'
                    }`}
                  >
                    {isAr ? 'اختيار' : 'Select'}
                  </button>

                  <button
                    type="button"
                    id={`btn-test-sound-${snd.id}`}
                    onClick={() => handleTestSound(snd.id as RestSoundType)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary"
                    title={isAr ? 'استماع للصوت' : 'Test sound'}
                  >
                    <Play className="h-3 w-3 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Bodyweight 80kg Strategy & Measurements Summary */}
      <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-md space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span>{isAr ? 'هدف الوزن المثالي (Target 80kg Goal)' : 'Target Weight Goal (80 kg)'}</span>
          </h3>
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-400 border border-emerald-500/30">
            {profile.goalWeightKg || 80} kg Target
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-secondary/30 p-3 text-center">
            <div className="text-[11px] font-bold text-muted-foreground">{isAr ? 'الوزن الحالي' : 'Current Weight'}</div>
            <div className="text-xl font-black text-foreground font-mono">{profile.currentWeightKg} kg</div>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-center">
            <div className="text-[11px] font-bold text-primary">{isAr ? 'الهدف المطلوب' : 'Target Weight'}</div>
            <div className="text-xl font-black text-primary font-mono">{profile.goalWeightKg || 80} kg</div>
          </div>
          <div className="rounded-xl border border-border bg-secondary/30 p-3 text-center">
            <div className="text-[11px] font-bold text-muted-foreground">{isAr ? 'المتبقي للتخلص منه' : 'To Lose'}</div>
            <div className="text-xl font-black text-amber-400 font-mono">
              -{(profile.currentWeightKg - (profile.goalWeightKg || 80)).toFixed(1)} kg
            </div>
          </div>
          <div className="rounded-xl border border-border bg-secondary/30 p-3 text-center">
            <div className="text-[11px] font-bold text-muted-foreground">{isAr ? 'نسبة الدهون المستهدفة' : 'Target Fat %'}</div>
            <div className="text-xl font-black text-emerald-400 font-mono">~15 - 17%</div>
          </div>
        </div>
      </div>

      {/* Advanced Cardio Experience Preferences */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-5">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <span>{isAr ? 'تفضيلات الكارديو الذكي (Smart Cardio Preferences)' : 'Cardio Experience Preferences'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Motivation Audio/Banner Intervals */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              {isAr ? 'تكرار التحفيز الصوتي / الإشعارات' : 'Motivation Frequency'}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['1m', '2m', 'off'] as const).map(freq => (
                <button
                  key={freq}
                  id={`btn-cardio-freq-${freq}`}
                  type="button"
                  onClick={() => onUpdateProfile({ ...profile, cardioMotivationFrequency: freq })}
                  className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                    (profile.cardioMotivationFrequency || '1m') === freq
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {freq === 'off' ? (isAr ? 'إيقاف' : 'Off') : freq}
                </button>
              ))}
            </div>
          </div>

          {/* Auto GPS Tracking */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              {isAr ? 'تتبع GPS التلقائي في الخارج' : 'Outdoor GPS Tracking'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-gps-enabled"
                onClick={() => onUpdateProfile({ ...profile, autoGpsTracking: true })}
                className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                  profile.autoGpsTracking !== false
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary'
                }`}
              >
                {isAr ? 'تفعيل (On)' : 'Enabled'}
              </button>
              <button
                type="button"
                id="btn-gps-disabled"
                onClick={() => onUpdateProfile({ ...profile, autoGpsTracking: false })}
                className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                  profile.autoGpsTracking === false
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary'
                }`}
              >
                {isAr ? 'إيقاف (Off)' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* Distance Units */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              {isAr ? 'وحدة قياس المسافة' : 'Distance Units'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-unit-km"
                onClick={() => onUpdateProfile({ ...profile, units: 'km' })}
                className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                  (profile.units || 'km') === 'km'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary'
                }`}
              >
                Kilometers (km)
              </button>
              <button
                type="button"
                id="btn-unit-miles"
                onClick={() => onUpdateProfile({ ...profile, units: 'miles' })}
                className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                  profile.units === 'miles'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary'
                }`}
              >
                Miles (mi)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PWA Download & Gym Offline Installation */}
      <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-card via-primary/5 to-card p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30 shadow-inner">
              <Download className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">
                {t.pwa.installTitle}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isAr ? 'تثبيت كـ PWA على الهاتف أو الكمبيوتر للعمل دون إنترنت' : 'Progressive Web App (PWA) with 100% Gym Offline capability'}
              </p>
            </div>
          </div>

          {pwaState.isInstalled ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-4 w-4" />
              <span>{t.pwa.installedBadge}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary border border-primary/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isAr ? 'جاهز للتثبيت' : 'Ready to Install'}</span>
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {pwaState.isInstalled ? t.pwa.installedDesc : t.pwa.installSubtitle}
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/40 p-2.5 text-xs">
            <WifiOff className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-muted-foreground">{isAr ? '100% بدون نت في الجيم' : '100% Offline Gym Logging'}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/40 p-2.5 text-xs">
            <Zap className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="text-muted-foreground">{isAr ? 'إقلاع فوري بدون تحميل' : 'Instant Launch & Fast UI'}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/40 p-2.5 text-xs">
            <Maximize className="h-4 w-4 text-cyan-400 shrink-0" />
            <span className="text-muted-foreground">{isAr ? 'شاشة كاملة وتجربة أصلية' : 'Full-Screen Distraction Free'}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {onOpenPWAInstallModal && (
            <button
              id="btn-settings-open-pwa-modal"
              onClick={onOpenPWAInstallModal}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-black text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>{pwaState.isInstalled ? (isAr ? 'عرض تفاصيل التثبيت' : 'View Install Details') : t.pwa.installBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* Data Backup & Export */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          <span>{isAr ? 'النسخ الاحتياطي وتصدير البيانات' : 'Data Backup & Export'}</span>
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {isAr
            ? 'كافة بياناتك مخزنة محلياً وأولاً بأول في متصفحك. يمكنك تنزيل نسخة احتياطية كاملة بصيغة JSON أو تصدير سجل التمارين بصيغة CSV.'
            : 'All workouts, measurements, and nutrition logs are stored local-first. You can download an offline JSON backup or CSV workout spreadsheet anytime.'}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            id="btn-settings-export-json"
            onClick={handleExportJSON}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>{t.settings.exportData} (JSON)</span>
          </button>

          <button
            id="btn-settings-export-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-5 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/80 transition-colors"
          >
            <FileText className="h-4 w-4 text-emerald-400" />
            <span>{isAr ? 'تصدير جدول التمارين (CSV)' : 'Export Workouts (CSV)'}</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>{isAr ? 'منطقة الحذف وإعادة التعيين' : 'Reset Database & Factory Restore'}</span>
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {isAr
            ? 'سيؤدي هذا الإجراء إلى مسح كافة التمارين المسجلة، الصور المولدة، وسجل المحادثات، وإعادة التطبيق إلى حالته الافتراضية.'
            : 'This irreversible action wipes all logged workout sessions, chat history, and generated images, restoring factory default state.'}
        </p>

        {confirmReset ? (
          <div className="flex items-center gap-3 pt-2">
            <button
              id="btn-confirm-delete-all"
              onClick={handlePerformReset}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-red-500 transition-colors"
            >
              {isAr ? 'تأكيد الحذف نهائياً' : 'Yes, Delete Everything'}
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="rounded-xl border border-border bg-secondary px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary/80"
            >
              {t.common.cancel}
            </button>
          </div>
        ) : (
          <button
            id="btn-trigger-reset-dialog"
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>{t.settings.resetData}</span>
          </button>
        )}
      </div>
    </div>
  );
};
