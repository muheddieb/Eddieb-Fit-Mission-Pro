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
  CheckCircle2,
  Users,
  Award
} from 'lucide-react';
import { Achievement, UserProfile, WorkoutSession, CardioSession } from '../../types';
import { translations } from '../../i18n/translations';
import { StorageService } from '../../services/storage';
import { CommunityChallengeSection } from './CommunityChallengeSection';

interface AchievementsViewProps {
  profile: UserProfile;
  history?: WorkoutSession[];
  cardioHistory?: CardioSession[];
  onStartWorkout?: () => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  profile,
  history = [],
  cardioHistory = [],
  onStartWorkout,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeTab, setActiveTab] = useState<'community' | 'badges' | 'all'>('all');

  // Workouts and cardio from props or local storage
  const [workoutList, setWorkoutList] = useState<WorkoutSession[]>(history);
  const [cardioList, setCardioList] = useState<CardioSession[]>(cardioHistory);

  useEffect(() => {
    const list = StorageService.checkAndUpdateAchievements();
    setAchievements(list);
    if (!history || history.length === 0) {
      setWorkoutList(StorageService.getWorkoutHistory());
    }
    if (!cardioHistory || cardioHistory.length === 0) {
      setCardioList(StorageService.getCardioHistory());
    }
  }, [history, cardioHistory]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return Flame;
      case 'Zap':
        return Zap;
      case 'ShieldCheck':
        return ShieldCheck;
      case 'Target':
        return Target;
      case 'Layers':
        return Layers;
      case 'HeartPulse':
        return HeartPulse;
      case 'Droplets':
        return Droplets;
      default:
        return Trophy;
    }
  };

  return (
    <div className="space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header & Section Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-foreground sm:text-3xl">
              {t.achievements.title}
            </h1>
            <span className="rounded-full bg-primary/10 border border-primary/30 px-2.5 py-0.5 text-xs font-extrabold text-primary">
              EDDIEB FIT
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAr
              ? 'الأهداف الجماعية الشهرية، لوحة صدارة الأبطال، والأوسمة الشخصية للإنجاز الرياضي.'
              : 'Monthly group goals, athlete community rankings, and personal milestone badges.'}
          </p>
        </div>

        {/* View Segmented Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-card border border-border/60 self-start sm:self-auto shadow-xs">
          <button
            id="tab-view-all"
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isAr ? 'عرض الكل' : 'All Views'}
          </button>
          <button
            id="tab-view-community"
            type="button"
            onClick={() => setActiveTab('community')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'community'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>{isAr ? 'تحديات المجتمع' : 'Community Challenge'}</span>
          </button>
          <button
            id="tab-view-badges"
            type="button"
            onClick={() => setActiveTab('badges')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'badges'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>{isAr ? 'الأوسمة الشخصية' : 'Personal Badges'}</span>
            <span className="text-[10px] px-1 py-0.2 rounded-full bg-muted text-foreground">
              {unlockedCount}
            </span>
          </button>
        </div>
      </div>

      {/* 1. COMMUNITY CHALLENGE SECTION */}
      {(activeTab === 'all' || activeTab === 'community') && (
        <CommunityChallengeSection
          profile={profile}
          history={workoutList}
          cardioHistory={cardioList}
          onStartWorkout={onStartWorkout}
        />
      )}

      {/* 2. PERSONAL BADGES & MILESTONES SECTION */}
      {(activeTab === 'all' || activeTab === 'badges') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                {isAr ? 'أوسمة الإنجاز الفردية' : 'Personal Milestone Badges'}
              </h2>
            </div>
            <span className="rounded-xl bg-primary/15 px-3 py-1 text-xs font-bold text-primary border border-primary/30">
              {unlockedCount} / {achievements.length} {isAr ? 'أوسمة مفتوحة' : 'Unlocked'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((ach) => {
              const Icon = getIconComponent(ach.icon);
              const percent = Math.min(100, Math.round((ach.progress / ach.maxProgress) * 100));
              const title = isAr && ach.titleAr ? ach.titleAr : ach.title;
              const desc = isAr && ach.descriptionAr ? ach.descriptionAr : ach.description;

              return (
                <div
                  key={ach.id}
                  id={`achievement-card-${ach.id}`}
                  className={`rounded-2xl border p-5 transition-all shadow-sm flex flex-col justify-between ${
                    ach.unlocked
                      ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60'
                      : 'border-border bg-card/70 opacity-75 hover:opacity-90'
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
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{isAr ? 'مكتمل' : 'Unlocked'}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          <Lock className="h-3.5 w-3.5" />
                          <span>
                            {ach.progress}/{ach.maxProgress}
                          </span>
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 text-base font-bold text-foreground">{title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
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
      )}
    </div>
  );
};
