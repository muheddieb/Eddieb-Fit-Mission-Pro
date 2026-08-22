import React, { useState } from 'react';
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
  ShieldAlert
} from 'lucide-react';
import { UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { StorageService } from '../../services/storage';

interface SettingsViewProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onResetApp: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onResetApp,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

      {/* Preferences (Theme & Language) */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-5">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <span>{isAr ? 'المظهر واللغة' : 'Appearance & Language'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Language */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.settings.language}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateProfile({ ...profile, language: 'en' })}
                className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                  profile.language === 'en'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-secondary/50 text-muted-foreground hover:bg-secondary'
                }`}
              >
                English (LTR)
              </button>
              <button
                type="button"
                onClick={() => onUpdateProfile({ ...profile, language: 'ar' })}
                className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                  profile.language === 'ar'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-secondary/50 text-muted-foreground hover:bg-secondary'
                }`}
              >
                العربية (RTL)
              </button>
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.settings.theme}</label>
            <select
              value={profile.theme}
              onChange={e => onUpdateProfile({ ...profile, theme: e.target.value as any })}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="elegant_dark">✨ Elegant Dark (Obsidian & Indigo)</option>
              <option value="fitness_dark">⚡ Fitness Obsidian & Emerald</option>
              <option value="dark">🌑 Pure Midnight Dark</option>
              <option value="light">☀️ Clean Minimal Light</option>
              <option value="warm_amber">🔥 High-Energy Amber</option>
            </select>
          </div>
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
