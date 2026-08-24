import React from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  Dumbbell, 
  BookOpen, 
  MoreHorizontal,
  X,
  Home,
  Utensils,
  Flame,
  HeartPulse,
  Layers,
  Sparkles,
  TrendingUp,
  Trophy,
  User,
  Settings,
  Image as ImageIcon,
  Download,
  Watch
} from 'lucide-react';
import { UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { NavSection } from './Sidebar';

interface MobileNavProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  profile: UserProfile;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
  onOpenDrawer: () => void;
  onOpenPWAInstallModal?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentSection,
  onSelectSection,
  profile,
  drawerOpen,
  onCloseDrawer,
  onOpenDrawer,
  onOpenPWAInstallModal,
}) => {
  const t = translations[profile.language];
  const isRTL = profile.language === 'ar';

  const primaryTabs: { id: NavSection; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'aiCoach', label: t.nav.aiCoach, icon: Bot },
    { id: 'workout', label: t.nav.workout, icon: Dumbbell },
    { id: 'exerciseLibrary', label: t.nav.exerciseLibrary, icon: BookOpen },
  ];

  const drawerSections: { id: NavSection; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'devices', label: t.nav.devices, icon: Watch, badge: 'BLE' },
    { id: 'home', label: t.nav.home, icon: Home },
    { id: 'nutrition', label: t.nav.nutrition, icon: Utensils },
    { id: 'preWorkout', label: t.nav.preWorkout, icon: Flame },
    { id: 'cardio', label: t.nav.cardio, icon: HeartPulse },
    { id: 'core', label: t.nav.core, icon: Layers },
    { id: 'recovery', label: t.nav.recovery, icon: Sparkles },
    { id: 'progress', label: t.nav.progress, icon: TrendingUp },
    { id: 'achievements', label: t.nav.achievements, icon: Trophy },
    { id: 'visualizer', label: t.nav.physiqueVisualizer, icon: ImageIcon, badge: '4K' },
    { id: 'profile', label: t.nav.profile, icon: User },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  return (
    <>
      {/* Bottom Sticky Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex h-16 w-full items-center justify-around border-t border-border bg-card/95 px-2 backdrop-blur md:hidden">
        {primaryTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentSection === tab.id;

          return (
            <button
              key={tab.id}
              id={`mobile-tab-${tab.id}`}
              onClick={() => {
                onSelectSection(tab.id);
                onCloseDrawer();
              }}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-3 transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        {/* More Options Tab (triggers drawer) */}
        <button
          id="mobile-tab-more"
          onClick={onOpenDrawer}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 transition-colors ${
            drawerOpen || !primaryTabs.some(t => t.id === currentSection)
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] tracking-tight">{isRTL ? 'المزيد' : 'More'}</span>
        </button>
      </div>

      {/* Slide-over Drawer for All Secondary Sections */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseDrawer}
          />

          {/* Drawer Panel */}
          <div
            className={`relative flex h-full w-4/5 max-w-sm flex-col bg-card shadow-2xl transition-transform ${
              isRTL ? 'mr-auto rounded-l-2xl' : 'ml-auto rounded-r-2xl'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                <span className="font-bold text-foreground">EDDIEB FIT</span>
              </div>
              <button
                id="btn-close-drawer"
                onClick={onCloseDrawer}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menu List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
              {drawerSections.map(item => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;

                return (
                  <button
                    key={item.id}
                    id={`drawer-item-${item.id}`}
                    onClick={() => {
                      onSelectSection(item.id);
                      onCloseDrawer();
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Drawer PWA Download Footer */}
            {onOpenPWAInstallModal && (
              <div className="border-t border-border p-3">
                <button
                  id="btn-mobile-drawer-download-pwa"
                  onClick={() => {
                    onCloseDrawer();
                    onOpenPWAInstallModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary/15 border border-primary/40 px-4 py-3 text-xs font-black text-primary hover:bg-primary/25 transition-all shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>{t.pwa.downloadApp} (PWA)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
