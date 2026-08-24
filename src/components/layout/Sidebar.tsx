import React from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  Dumbbell, 
  BookOpen, 
  Home as HomeIcon, 
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
  ChevronLeft,
  ChevronRight,
  Download,
  Watch
} from 'lucide-react';
import { UserProfile } from '../../types';
import { translations } from '../../i18n/translations';

export type NavSection = 
  | 'dashboard' 
  | 'aiCoach' 
  | 'workout' 
  | 'exerciseLibrary' 
  | 'home' 
  | 'nutrition' 
  | 'preWorkout' 
  | 'cardio' 
  | 'core' 
  | 'recovery' 
  | 'progress' 
  | 'motivation' 
  | 'achievements' 
  | 'visualizer' 
  | 'devices'
  | 'profile' 
  | 'settings';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  profile: UserProfile;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenPWAInstallModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  profile,
  collapsed,
  onToggleCollapse,
  onOpenPWAInstallModal,
}) => {
  const t = translations[profile.language];
  const isRTL = profile.language === 'ar';

  const menuItems: { id: NavSection; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'aiCoach', label: t.nav.aiCoach, icon: Bot, badge: 'AI' },
    { id: 'workout', label: t.nav.workout, icon: Dumbbell },
    { id: 'devices', label: t.nav.devices, icon: Watch, badge: 'BLE' },
    { id: 'exerciseLibrary', label: t.nav.exerciseLibrary, icon: BookOpen },
    { id: 'home', label: t.nav.home, icon: HomeIcon },
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
    <aside
      className={`hidden md:flex flex-col border-border bg-card/60 backdrop-blur transition-all duration-300 ${
        isRTL ? 'border-l' : 'border-r'
      } ${collapsed ? 'w-20' : 'w-64'}`}
      style={{ height: 'calc(100vh - 4rem)' }}
    >
      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 custom-scrollbar">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectSection(item.id)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/30'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
              {!collapsed && (
                <div className="flex flex-1 items-center justify-between overflow-hidden">
                  <span className="truncate text-left">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        isActive ? 'bg-black/20 text-primary-foreground' : 'bg-primary/15 text-primary'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* PWA Download & Collapse Toggle Footer */}
      <div className="border-t border-border p-3 space-y-2">
        {onOpenPWAInstallModal && (
          <button
            id="btn-sidebar-pwa-install"
            onClick={onOpenPWAInstallModal}
            className={`flex w-full items-center gap-2.5 rounded-xl border border-primary/40 bg-primary/10 p-2 text-xs font-bold text-primary hover:bg-primary/20 transition-all ${
              collapsed ? 'justify-center' : 'justify-start px-3'
            }`}
            title={t.pwa.downloadApp}
          >
            <Download className="h-4 w-4 shrink-0 animate-bounce" />
            {!collapsed && (
              <div className="flex flex-1 items-center justify-between min-w-0">
                <span className="truncate">{t.pwa.downloadApp}</span>
                <span className="rounded bg-primary/25 px-1.5 py-0.5 text-[9px] font-black text-primary uppercase">
                  PWA
                </span>
              </div>
            )}
          </button>
        )}

        <button
          id="btn-toggle-sidebar"
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary/40 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          {isRTL ? (
            collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
          )}
          {!collapsed && <span>{isRTL ? 'تصغير القائمة' : 'Collapse'}</span>}
        </button>
      </div>
    </aside>
  );
};
