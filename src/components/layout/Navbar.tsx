import React from 'react';
import { 
  Dumbbell, 
  Flame, 
  Globe, 
  Moon, 
  Sun, 
  Sparkles, 
  Play, 
  Menu,
  ShieldAlert,
  Download
} from 'lucide-react';
import { UserProfile, WorkoutSession } from '../../types';
import { translations } from '../../i18n/translations';

interface NavbarProps {
  profile: UserProfile;
  activeWorkout: WorkoutSession | null;
  onUpdateProfile: (profile: UserProfile) => void;
  onOpenActiveWorkout: () => void;
  onToggleMobileDrawer: () => void;
  onOpenVisualizer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  activeWorkout,
  onUpdateProfile,
  onOpenActiveWorkout,
  onToggleMobileDrawer,
  onOpenVisualizer,
}) => {
  const t = translations[profile.language];
  const isRTL = profile.language === 'ar';

  const toggleLanguage = () => {
    const nextLang = profile.language === 'en' ? 'ar' : 'en';
    onUpdateProfile({ ...profile, language: nextLang });
  };

  const toggleTheme = () => {
    const themeCycle = ['elegant_dark', 'fitness_dark', 'dark', 'light', 'warm_amber'] as const;
    const currentIndex = themeCycle.indexOf(profile.theme as any);
    const nextTheme = themeCycle[(currentIndex + 1) % themeCycle.length];
    onUpdateProfile({ ...profile, theme: nextTheme });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
      {/* Left: Brand / Mobile menu trigger */}
      <div className="flex items-center gap-3">
        <button
          id="btn-mobile-menu"
          onClick={onToggleMobileDrawer}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary/50 text-foreground transition-colors hover:bg-secondary md:hidden"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black tracking-wider text-foreground text-base">EDDIEB FIT</span>
              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary tracking-widest uppercase">
                MISSION
              </span>
            </div>
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              {profile.mode === 'muscle_recomp' ? t.modes.muscle_recomp : t.modes.controlled_fat_loss}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Quick actions & controls */}
      <div className="flex items-center gap-2">
        {/* Active Workout Resume Pill (if in progress) */}
        {activeWorkout && (
          <button
            id="btn-resume-nav-workout"
            onClick={onOpenActiveWorkout}
            className="flex animate-pulse items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span className="hidden sm:inline">{t.dashboard.continueWorkout}</span>
            <span className="sm:hidden">{t.common.active}</span>
          </button>
        )}

        {/* AI Visualizer Button */}
        <button
          id="btn-open-visualizer-nav"
          onClick={onOpenVisualizer}
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          title="AI Visualizer 1K-4K"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden md:inline">Visualizer 1K-4K</span>
        </button>

        {/* Language Switcher Button */}
        <button
          id="btn-language-toggle"
          onClick={toggleLanguage}
          className="flex h-9 items-center gap-1 rounded-lg border border-border bg-secondary/50 px-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
          title="Switch Language (AR/EN)"
        >
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span>{profile.language === 'en' ? 'العربية' : 'EN'}</span>
        </button>

        {/* Theme Switcher Button */}
        <button
          id="btn-theme-toggle"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
          title={`Current Theme: ${profile.theme}. Click to change.`}
        >
          {profile.theme === 'light' ? (
            <Sun className="h-4 w-4 text-amber-500" />
          ) : (
            <Moon className="h-4 w-4 text-primary" />
          )}
        </button>
      </div>
    </header>
  );
};
