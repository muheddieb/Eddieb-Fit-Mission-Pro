import React, { useState } from 'react';
import { 
  User, 
  Save, 
  Dumbbell, 
  Scale, 
  Target, 
  Calendar, 
  MapPin, 
  Flame, 
  Droplets,
  Check,
  Zap,
  Clock,
  RotateCcw
} from 'lucide-react';
import { UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { StorageService } from '../../services/storage';
import { PPLEngine } from '../../services/pplEngine';
import { calculateProgramProgress } from '../../services/dateUtils';

interface ProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onUpdateProfile,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [formData, setFormData] = useState<UserProfile>(profile);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Centralized calculated adaptive timeline based on currently selected start date
  const programProgress = calculateProgramProgress(formData.startDate);
  const liveTimeline = PPLEngine.getAdaptiveProgramTimeline(formData.startDate);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    StorageService.saveProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSetPresetDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, startDate: dateStr }));
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground sm:text-3xl">
          {t.profile.title}
        </h1>
        <p className="text-sm text-muted-foreground">{t.profile.subtitle}</p>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-400 flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>{isAr ? 'تم حفظ التعديلات بنجاح' : 'Athlete parameters updated successfully'}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-6">
        {/* Core Bio */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
            {isAr ? 'البيانات الشخصية والبدنية' : 'Physical & Anthropometric Data'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.profile.name}</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.profile.age}</label>
              <input
                type="number"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: parseInt(e.target.value, 10) || 25 })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.profile.height} (cm)</label>
              <input
                type="number"
                value={formData.heightCm}
                onChange={e => setFormData({ ...formData, heightCm: parseInt(e.target.value, 10) || 175 })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.profile.currentWeight} (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.currentWeightKg}
                onChange={e => setFormData({ ...formData, currentWeightKg: parseFloat(e.target.value) || 80 })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.profile.goalWeight} (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.goalWeightKg}
                onChange={e => setFormData({ ...formData, goalWeightKg: parseFloat(e.target.value) || 75 })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">{isAr ? 'محيط الخصر (سم)' : 'Waist at Navel (cm)'}</label>
              <input
                type="number"
                step="0.5"
                value={formData.currentWaistCm}
                onChange={e => setFormData({ ...formData, currentWaistCm: parseFloat(e.target.value) || 85 })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Adaptive Program Timeline & Subscription Start Date */}
        <div className="space-y-4 rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-primary/20 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                  {isAr ? 'تاريخ بداية البرنامج والاشتراك (Adaptive Timeline)' : 'Adaptive Program Start Date'}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isAr 
                  ? 'يتم حساب الأسبوع الحالي واليوم تلقائياً من تاريخ البداية. يمكنك إدخال تاريخ قديم أو حديث بحرية.'
                  : 'Program weeks and progression cycles are computed dynamically from your start date. Historical dates are fully supported.'}
              </p>
            </div>

            <span className="inline-flex items-center gap-1 self-start sm:self-auto rounded-full bg-primary/20 px-3 py-1 text-xs font-black text-primary border border-primary/30">
              <Zap className="h-3.5 w-3.5" />
              <span>{isAr ? liveTimeline.formattedProgressAr : liveTimeline.formattedProgress}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6 space-y-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                  {isAr ? 'تاريخ بداية البرنامج (Start Date)' : 'Program Start Date'}
                </label>
                <input
                  id="input-program-start-date"
                  type="date"
                  value={formData.startDate || new Date().toISOString().split('T')[0]}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">{isAr ? 'اختصارات سريعة:' : 'Quick Presets:'}</span>
                <button
                  type="button"
                  onClick={() => handleSetPresetDate(0)}
                  className="rounded-lg border border-border bg-secondary/60 px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  {isAr ? 'اليوم (الأسبوع 1)' : 'Today (Week 1)'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetDate(14)}
                  className="rounded-lg border border-border bg-secondary/60 px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  {isAr ? 'منذ أسبوعين (الأسبوع 3)' : '2 Wks Ago (Week 3)'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetDate(30)}
                  className="rounded-lg border border-border bg-secondary/60 px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  {isAr ? 'منذ شهر (الأسبوع 5)' : '1 Mo Ago (Week 5)'}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, startDate: '2026-06-15' }))}
                  className="rounded-lg border border-border bg-secondary/60 px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  {isAr ? '15 يونيو (الأسبوع 10)' : 'Jun 15 (Week 10)'}
                </button>
              </div>
            </div>

            {/* Real-Time Timeline Calculated Card */}
            <div className="md:col-span-6 rounded-xl border border-border bg-card p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold border-b border-border pb-1.5">
                <span className="text-muted-foreground">{isAr ? 'الحساب الديناميكي:' : 'Calculated Program Status:'}</span>
                <span className="text-primary font-mono font-black">
                  {isAr ? `اليوم ${programProgress.totalProgramDay} في البرنامج` : `Day ${programProgress.totalProgramDay} of Program`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-secondary/40 p-2">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">{isAr ? 'الأسبوع الحالي' : 'Current Week'}</div>
                  <div className="text-base font-black text-foreground mt-0.5">Week {programProgress.currentWeek}</div>
                </div>
                <div className="rounded-lg bg-secondary/40 p-2">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">{isAr ? 'يوم الأسبوع' : 'Day in Week'}</div>
                  <div className="text-base font-black text-foreground mt-0.5">Day {programProgress.currentDay} / 7</div>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                <strong className="text-foreground">{isAr ? liveTimeline.phaseTitleAr : liveTimeline.phaseTitle}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Training Programming & Environment */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
            {isAr ? 'بيئة ونظام التدريب' : 'Programming & Environment Settings'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.profile.mode}</label>
              <select
                value={formData.mode}
                onChange={e => setFormData({ ...formData, mode: e.target.value as any })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              >
                <option value="muscle_recomp">{t.modes.muscle_recomp}</option>
                <option value="controlled_fat_loss">{t.modes.controlled_fat_loss}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.profile.trainingDays}</label>
              <select
                value={formData.trainingDaysPerWeek}
                onChange={e => setFormData({ ...formData, trainingDaysPerWeek: parseInt(e.target.value, 10) })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              >
                <option value="3">3 Days / Week (PPL Full)</option>
                <option value="4">4 Days / Week (PPL + Upper/Core)</option>
                <option value="5">5 Days / Week (PPL + Weak Point)</option>
                <option value="6">6 Days / Week (PPL x 2 Intense)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.profile.location}</label>
              <select
                value={formData.preferredLocation}
                onChange={e => setFormData({ ...formData, preferredLocation: e.target.value as any })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              >
                <option value="gym">{isAr ? 'الجيم (Commercial Gym)' : 'Commercial Gym'}</option>
                <option value="home">{isAr ? 'المنزل (Home Minimal)' : 'Home Minimal'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Nutritional & Hydration Targets */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border pb-2">
            {isAr ? 'الأهداف الغذائية واليومية' : 'Daily Targets'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                {t.nutrition.dailyTarget} (kcal)
              </label>
              <input
                type="number"
                step="50"
                value={formData.dailyCalorieTarget}
                onChange={e => setFormData({ ...formData, dailyCalorieTarget: parseInt(e.target.value, 10) || 2200 })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                {t.nutrition.proteinTarget} (grams)
              </label>
              <input
                type="number"
                value={formData.dailyProteinTargetGrams}
                onChange={e => setFormData({ ...formData, dailyProteinTargetGrams: parseInt(e.target.value, 10) || 160 })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                {t.dashboard.hydration} (ml)
              </label>
              <input
                type="number"
                step="250"
                value={formData.dailyWaterTargetMl}
                onChange={e => setFormData({ ...formData, dailyWaterTargetMl: parseInt(e.target.value, 10) || 3500 })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            id="btn-save-profile-settings"
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{t.common.save}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
