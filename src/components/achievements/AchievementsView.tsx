import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Flame, 
  Zap, 
  ShieldCheck, 
  Target, 
  Layers, 
  HeartPulse, 
  Droplets,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { Achievement, UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { StorageService } from '../../services/storage';

interface AchievementsViewProps {
  profile: UserProfile;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  profile,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    const list = StorageService.checkAndUpdateAchievements();
    setAchievements(list);
  }, []);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return Flame;
      case 'Zap': return Zap;
      case 'ShieldCheck': return ShieldCheck;
      case 'Target': return Target;
      case 'Layers': return Layers;
      case 'HeartPulse': return HeartPulse;
      case 'Droplets': return Droplets;
      default: return Trophy;
    }
  };

  return (
    <div className="space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">
            {t.achievements.title}
          </h1>
          <p className="text-sm text-muted-foreground">{t.achievements.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-primary/20 px-4 py-2 text-xs font-black text-primary border border-primary/30">
            {unlockedCount} / {achievements.length} {isAr ? 'مكتمل' : 'Unlocked'}
          </span>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map(ach => {
          const Icon = getIconComponent(ach.icon);
          const percent = Math.min(100, Math.round((ach.progress / ach.maxProgress) * 100));
          const title = isAr && ach.titleAr ? ach.titleAr : ach.title;
          const desc = isAr && ach.descriptionAr ? ach.descriptionAr : ach.description;

          return (
            <div
              key={ach.id}
              className={`rounded-2xl border p-5 transition-all shadow-sm flex flex-col justify-between ${
                ach.unlocked
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-border bg-card opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      ach.unlocked
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  {ach.unlocked ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{isAr ? 'مكتمل' : 'Unlocked'}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                      <Lock className="h-3.5 w-3.5" />
                      <span>{ach.progress}/{ach.maxProgress}</span>
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-base font-bold text-foreground">
                  {title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold mb-1">
                  <span>{isAr ? 'نسبة التقدم' : 'Progress'}</span>
                  <span>{percent}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      ach.unlocked ? 'bg-emerald-500' : 'bg-primary'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
