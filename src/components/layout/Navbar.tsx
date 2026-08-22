import React, { useState, useRef, useEffect } from 'react';
import { 
  Dumbbell, 
  Globe, 
  Moon, 
  Sun, 
  Sparkles, 
  Play, 
  Menu,
  Cloud,
  CloudOff,
  CloudCheck,
  RefreshCw,
  WifiOff,
  AlertTriangle,
  HardDrive,
  LogIn,
  LogOut,
  X,
  CheckCircle2,
  HelpCircle,
  Palette
} from 'lucide-react';
import { User } from 'firebase/auth';
import { UserProfile, WorkoutSession, SyncStatus, AppTheme } from '../../types';
import { translations } from '../../i18n/translations';
import { THEME_OPTIONS } from '../../utils/themeData';

interface NavbarProps {
  profile: UserProfile;
  activeWorkout: WorkoutSession | null;
  currentUser: User | null;
  isSyncing: boolean;
  syncStatus?: SyncStatus;
  isOnline?: boolean;
  lastSyncTimestamp?: number | null;
  onRetrySync?: () => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onOpenActiveWorkout: () => void;
  onToggleMobileDrawer: () => void;
  onOpenVisualizer: () => void;
  onSignInWithGoogle: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  activeWorkout,
  currentUser,
  isSyncing,
  syncStatus = 'idle',
  isOnline = true,
  lastSyncTimestamp = null,
  onRetrySync,
  onUpdateProfile,
  onOpenActiveWorkout,
  onToggleMobileDrawer,
  onOpenVisualizer,
  onSignInWithGoogle,
  onSignOut,
}) => {
  const t = translations[profile.language];
  const isRTL = profile.language === 'ar';
  const [syncPopoverOpen, setSyncPopoverOpen] = useState(false);
  const [themePopoverOpen, setThemePopoverOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const themePopoverRef = useRef<HTMLDivElement>(null);

  const isSyncUnavailable = !isOnline || syncStatus === 'offline' || syncStatus === 'error';

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setSyncPopoverOpen(false);
      }
      if (themePopoverRef.current && !themePopoverRef.current.contains(event.target as Node)) {
        setThemePopoverOpen(false);
      }
    };
    if (syncPopoverOpen || themePopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [syncPopoverOpen, themePopoverOpen]);

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

  const handleManualRetry = async () => {
    setIsRetrying(true);
    if (onRetrySync) {
      await onRetrySync();
    }
    setTimeout(() => {
      setIsRetrying(false);
    }, 1000);
  };

  const formatLastSync = (ts: number | null) => {
    if (!ts) return profile.language === 'ar' ? 'لم تتم المزامنة بعد' : 'Not yet synced';
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 60) return profile.language === 'ar' ? 'الآن' : 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return profile.language === 'ar' ? `منذ ${diffMin} دقيقة` : `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return profile.language === 'ar' ? `منذ ${diffHr} ساعة` : `${diffHr}h ago`;
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/95 px-3 sm:px-4 md:px-6 backdrop-blur">
      {/* Left: Brand / Mobile menu trigger */}
      <div className="flex items-center gap-2.5 sm:gap-3">
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

      {/* Right: Quick actions, Firebase Status & controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* SPECIFIC VISUAL STATUS INDICATOR WHEN FIREBASE SYNC IS UNAVAILABLE */}
        {isSyncUnavailable ? (
          <div className="relative" ref={popoverRef}>
            <button
              id="btn-sync-offline-indicator"
              onClick={() => setSyncPopoverOpen(!syncPopoverOpen)}
              className="flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-all shadow-sm shadow-amber-500/10 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              title={t.sync.offlineDesc}
              aria-label="Firebase Sync Unavailable Status"
            >
              {/* Animated Pulse Icon */}
              <div className="relative flex h-2.5 w-2.5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </div>
              <CloudOff className="h-3.5 w-3.5 animate-pulse text-amber-400" />
              <span className="hidden md:inline font-bold text-[11px] text-amber-300">
                {profile.language === 'ar' ? 'المزامنة معطلة' : 'Sync Unavailable'}
              </span>
              <span className="md:hidden font-bold text-[10px] text-amber-300">
                {profile.language === 'ar' ? 'غير متصل' : 'Offline'}
              </span>
            </button>

            {/* Offline Sync Details Popover */}
            {syncPopoverOpen && (
              <div 
                className={`absolute top-full mt-2 w-80 sm:w-96 rounded-2xl border border-amber-500/30 p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 ${
                  isRTL ? 'left-0' : 'right-0'
                }`}
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              >
                {/* Popover Header */}
                <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-3 w-3 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        {t.sync.offlineTitle}
                      </h4>
                      <p className="text-[10px] text-amber-400/90 font-medium">
                        {profile.language === 'ar' ? 'الاتصال بالسحابة متوقف مؤقتاً' : 'Cloud connectivity paused'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSyncPopoverOpen(false)}
                    className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Popover Content */}
                <div className="mt-3 space-y-3">
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground leading-relaxed">
                    {t.sync.offlineDesc}
                  </div>

                  {/* Status checklist */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-2">
                      <HardDrive className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-foreground">
                          {profile.language === 'ar' ? 'الحفظ المحلي' : 'Local Storage'}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-medium">
                          {profile.language === 'ar' ? 'نشط 100%' : '100% Active'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-2">
                      <WifiOff className="h-4 w-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-foreground">
                          {profile.language === 'ar' ? 'سحابة Firebase' : 'Firebase Cloud'}
                        </div>
                        <div className="text-[10px] text-amber-400 font-medium">
                          {profile.language === 'ar' ? 'إعادة المحاولة...' : 'Reconnecting...'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Last Sync Stamp */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                    <span>{t.sync.lastSynced}:</span>
                    <span className="font-semibold text-foreground">{formatLastSync(lastSyncTimestamp)}</span>
                  </div>

                  {/* Action: Retry Connection */}
                  <div className="pt-1 flex gap-2">
                    <button
                      id="btn-retry-sync-popover"
                      onClick={handleManualRetry}
                      disabled={isRetrying}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-black font-bold py-2 px-3 text-xs shadow-md transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                      <span>{isRetrying ? t.sync.syncing : t.sync.retry}</span>
                    </button>
                    {currentUser && (
                      <button
                        onClick={onSignOut}
                        className="flex items-center justify-center gap-1 rounded-xl border border-border bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground text-xs px-3 py-2 transition-colors"
                        title="Sign Out"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : isSyncing || syncStatus === 'syncing' ? (
          /* SYNCING IN PROGRESS BADGE */
          <div 
            className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
            title={t.sync.syncing}
          >
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
            <span className="hidden sm:inline text-[11px] font-bold">
              {t.sync.syncing}
            </span>
          </div>
        ) : currentUser ? (
          /* FIREBASE CLOUD SYNCED USER BADGE */
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div 
              className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 shadow-sm shadow-emerald-500/10"
              title={`Logged in as ${currentUser.displayName || currentUser.email} (${t.sync.synced})`}
            >
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="avatar" 
                  className="h-4 w-4 rounded-full" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <CloudCheck className="h-3.5 w-3.5 text-emerald-400" />
              )}
              <span className="hidden md:inline max-w-[85px] truncate text-[11px] font-bold">
                {currentUser.displayName?.split(' ')[0] || t.sync.synced}
              </span>
              <span className="relative flex h-1.5 w-1.5">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
            </div>
            <button
              id="btn-firebase-signout"
              onClick={onSignOut}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Sign Out of Firebase"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          /* GUEST / SIGN IN BUTTON */
          <button
            id="btn-firebase-signin"
            onClick={onSignInWithGoogle}
            className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all shadow-sm"
            title="Sign in with Google to sync workouts across devices"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Google Sync</span>
          </button>
        )}

        {/* Active Workout Resume Pill (if in progress) */}
        {activeWorkout && (
          <button
            id="btn-resume-nav-workout"
            onClick={onOpenActiveWorkout}
            className="flex animate-pulse items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 sm:px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all"
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
          className="hidden md:flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          title="AI Visualizer 1K-4K"
        >
          <Sparkles className="h-4 w-4" />
          <span>Visualizer 1K-4K</span>
        </button>

        {/* Language Switcher Button */}
        <button
          id="btn-language-toggle"
          onClick={toggleLanguage}
          className="flex h-9 items-center gap-1 rounded-lg border border-border bg-secondary/50 px-2 sm:px-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
          title="Switch Language (AR/EN)"
        >
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span>{profile.language === 'en' ? 'العربية' : 'EN'}</span>
        </button>

        {/* Theme Switcher Button & Quick Popover */}
        <div className="relative" ref={themePopoverRef}>
          <button
            id="btn-theme-toggle"
            onClick={() => setThemePopoverOpen(!themePopoverOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary/50 text-foreground hover:bg-secondary transition-colors relative"
            title={`Active Theme: ${profile.theme}. Click to choose theme.`}
            aria-label="Change Theme"
          >
            {profile.theme === 'light' ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Palette className="h-4 w-4 text-primary" />
            )}
            <span 
              className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border border-card shadow-sm"
              style={{
                backgroundColor: THEME_OPTIONS.find(th => th.id === profile.theme)?.primaryColor || 'var(--primary)'
              }}
            />
          </button>

          {/* Theme Picker Dropdown Popover */}
          {themePopoverOpen && (
            <div 
              className={`absolute top-full mt-2 z-50 w-72 sm:w-80 rounded-2xl border p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
                isRTL ? 'left-0' : 'right-0'
              }`}
              style={{ 
                backgroundColor: 'var(--card)', 
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between border-b border-border/80 pb-2.5 mb-2.5 px-1">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  <span className="text-xs font-black text-foreground">
                    {isRTL ? 'السمات والألوان التحفيزية' : 'Motivational Themes'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full border border-border">
                  {THEME_OPTIONS.length} Themes
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                {THEME_OPTIONS.map((themeOpt) => {
                  const isSelected = profile.theme === themeOpt.id;
                  return (
                    <button
                      key={themeOpt.id}
                      onClick={() => {
                        onUpdateProfile({ ...profile, theme: themeOpt.id });
                        setThemePopoverOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2.5 p-2 rounded-xl border text-start transition-all ${
                        isSelected 
                          ? 'border-primary bg-secondary font-bold shadow-sm ring-1 ring-primary/30'
                          : 'border-transparent bg-secondary/30 hover:border-border hover:bg-secondary/70 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div 
                          className="h-4 w-4 rounded-full border border-white/30 shrink-0 shadow-sm"
                          style={{ backgroundColor: themeOpt.primaryColor }}
                        />
                        <div className="min-w-0 truncate">
                          <div className="text-xs font-bold text-foreground truncate">
                            {isRTL ? themeOpt.nameAr : themeOpt.nameEn}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {isRTL ? themeOpt.vibeAr : themeOpt.vibeEn}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span 
                          className="rounded px-1.5 py-0.5 text-[8px] font-extrabold"
                          style={{
                            backgroundColor: `${themeOpt.primaryColor}25`,
                            color: themeOpt.primaryColor,
                            border: `1px solid ${themeOpt.primaryColor}40`
                          }}
                        >
                          {isRTL ? themeOpt.badgeAr : themeOpt.badge}
                        </span>
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
