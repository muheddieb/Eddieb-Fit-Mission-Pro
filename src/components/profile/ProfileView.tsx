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
  Check
} from 'lucide-react';
import { UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { StorageService } from '../../services/storage';

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    StorageService.saveProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
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
