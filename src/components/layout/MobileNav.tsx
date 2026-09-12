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
  Watch,
  Calendar,
  ChevronRight
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
  isInterrupted?: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentSection,
  onSelectSection,
  profile,
  drawerOpen,
  onCloseDrawer,
  onOpenDrawer,
  onOpenPWAInstallModal,
  isInterrupted,
}) => {
  const t = translations[profile.language];
  const isRTL = profile.language === 'ar';

  // 5 primary high-frequency bottom tabs
  const primaryTabs: { id: NavSection; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: isRTL ? 'الرئيسية' : 'Home', icon: LayoutDashboard },
    { id: 'weeklySchedule', label: isRTL ? 'الجدول' : 'Schedule', icon: Calendar },
    { id: 'workout', label: isRTL ? 'التمرين' : 'Workout', icon: Dumbbell },
    { id: 'aiCoach', label: isRTL ? 'المدرب' : 'Coach', icon: Bot },
  ];

  // Grouped drawer categories for modern scannability
  const drawerGroups = [
    {
      groupTitle: isRTL ? 'التدريب وجدول التمارين' : 'Training & Planning',
      items: [
        { id: 'weeklySchedule' as NavSection, label: isRTL ? 'جدول تمارين الأسبوع' : 'Weekly Schedule', icon: Calendar, badge: isRTL ? 'تبديل' : 'Swap' },
        { id: 'workout' as NavSection, label: t.nav.workout, icon: Dumbbell },
        { 
          id: 'returnToTraining' as NavSection, 
          label: isRTL ? 'برنامج العودة بعد الانقطاع' : 'Return to Training', 
          icon: Sparkles, 
          badge: isInterrupted ? (isRTL ? 'موصى به' : 'Smart') : undefined,
          isHighlight: isInterrupted
        },
        { id: 'exerciseLibrary' as NavSection, label: t.nav.exerciseLibrary, icon: BookOpen },
        { id: 'home' as NavSection, label: t.nav.home, icon: Home },
        { id: 'core' as NavSection, label: t.nav.core, icon: Layers },
        { id: 'cardio' as NavSection, label: t.nav.cardio, icon: HeartPulse },
      ]
    },
    {
      groupTitle: isRTL ? 'الذكاء الاصطناعي والأجهزة' : 'AI & Smart Devices',
      items: [
        { id: 'aiCoach' as NavSection, label: t.nav.aiCoach, icon: Bot, badge: 'AI' },
        { id: 'devices' as NavSection, label: isRTL ? 'ساعة سامسونج والأجهزة' : 'Samsung Health & BLE', icon: Watch, badge: 'BLE' },
        { id: 'visualizer' as NavSection, label: isRTL ? 'المولد البصري للفيزيك' : 'Physique Visualizer', icon: ImageIcon, badge: '4K' },
      ]
    },
    {
      groupTitle: isRTL ? 'التغذية والاستشفاء' : 'Nutrition & Recovery',
      items: [
        { id: 'nutrition' as NavSection, label: t.nav.nutrition, icon: Utensils },
        { id: 'preWorkout' as NavSection, label: t.nav.preWorkout, icon: Flame },
        { id: 'recovery' as NavSection, label: t.nav.recovery, icon: Sparkles },
      ]
    },
    {
      groupTitle: isRTL ? 'التقدم والحساب' : 'Analytics & Profile',
      items: [
        { id: 'progress' as NavSection, label: t.nav.progress, icon: TrendingUp },
        { id: 'achievements' as NavSection, label: t.nav.achievements, icon: Trophy },
        { id: 'profile' as NavSection, label: t.nav.profile, icon: User },
        { id: 'settings' as NavSection, label: t.nav.settings, icon: Settings },
      ]
    }
  ];

  return (
    <>
      {/* Bottom Sticky Mobile Navigation */}
      <div 
        dir={isRTL ? 'rtl' : 'ltr'}
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 w-full items-center justify-around border-t border-border/80 bg-card/95 px-2 backdrop-blur-xl md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
      >
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
              className={`flex flex-col items-center justify-center gap-1 py-1 px-3.5 transition-all duration-200 active:scale-95 ${
                isActive 
                  ? 'text-primary font-black scale-105' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`flex items-center justify-center rounded-xl p-1 transition-all ${
                isActive ? 'bg-primary/20 text-primary shadow-sm shadow-primary/20' : ''
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-[10px] tracking-tight leading-none ${isActive ? 'font-black text-primary' : 'font-semibold'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* More Options Tab (triggers drawer) */}
        <button
          id="mobile-tab-more"
          onClick={onOpenDrawer}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3.5 transition-all duration-200 active:scale-95 ${
            drawerOpen || !primaryTabs.some(t => t.id === currentSection)
              ? 'text-primary font-black scale-105'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className={`flex items-center justify-center rounded-xl p-1 transition-all ${
            drawerOpen || !primaryTabs.some(t => t.id === currentSection)
              ? 'bg-primary/20 text-primary shadow-sm shadow-primary/20' 
              : ''
          }`}>
            <MoreHorizontal className="h-5 w-5" />
          </div>
          <span className={`text-[10px] tracking-tight leading-none ${
            drawerOpen || !primaryTabs.some(t => t.id === currentSection) ? 'font-black text-primary' : 'font-semibold'
          }`}>
            {isRTL ? 'المزيد' : 'More'}
          </span>
        </button>
      </div>

      {/* Slide-over Drawer for All Secondary Sections */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            onClick={onCloseDrawer}
          />

          {/* Drawer Panel */}
          <div
            className={`relative flex h-full w-[85%] max-w-sm flex-col bg-card border-border shadow-2xl transition-transform ${
              isRTL ? 'mr-auto rounded-l-3xl border-l' : 'ml-auto rounded-r-3xl border-r'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/80 p-4 bg-secondary/30">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-md shadow-primary/30">
                  EF
                </div>
                <div>
                  <span className="font-black text-sm tracking-wide text-foreground">EDDIEB FIT</span>
                  <p className="text-[10px] text-muted-foreground">{profile.name} • {isRTL ? 'النسخة الرياضية' : 'Pro Athlete'}</p>
                </div>
              </div>
              <button
                id="btn-close-drawer"
                onClick={onCloseDrawer}
                className="rounded-full bg-secondary/80 p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Menu List Grouped */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {drawerGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground/80 px-2 block">
                    {group.groupTitle}
                  </span>
                  <div className="space-y-1">
                    {group.items.map(item => {
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
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/20'
                              : item.isHighlight
                              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold hover:bg-amber-500/25'
                              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary-foreground' : item.isHighlight ? 'text-amber-400' : 'text-muted-foreground'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                              isActive
                                ? 'bg-black/20 text-white'
                                : item.isHighlight
                                ? 'bg-amber-500 text-neutral-950'
                                : 'bg-primary/20 text-primary'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Drawer PWA Download Footer */}
            {onOpenPWAInstallModal && (
              <div className="border-t border-border/80 p-3.5 bg-secondary/20">
                <button
                  id="btn-drawer-pwa-install"
                  onClick={() => {
                    onCloseDrawer();
                    onOpenPWAInstallModal();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 p-2.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all shadow-sm"
                >
                  <Download className="h-4 w-4 animate-bounce" />
                  <span>{t.pwa.downloadApp}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
