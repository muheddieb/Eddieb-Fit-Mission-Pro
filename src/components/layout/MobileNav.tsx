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
  Compass,
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

  // 4 Primary Bottom Tabs + More
  const primaryTabs: { id: NavSection; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: isRTL ? 'الرئيسية' : 'Home', icon: LayoutDashboard },
    { id: 'workout', label: isRTL ? 'التمرين' : 'Workout', icon: Dumbbell },
    { id: 'nutrition', label: isRTL ? 'الوجبات' : 'Meals', icon: Utensils },
    { id: 'guidance', label: isRTL ? 'تفاصيل الخطة' : 'Plan Details', icon: Compass },
  ];

  const drawerGroups = [
    {
      groupTitle: isRTL ? 'الأساسيات' : 'Core',
      items: [
        { id: 'dashboard' as NavSection, label: isRTL ? 'الرئيسية' : 'Home', icon: LayoutDashboard },
        { id: 'workout' as NavSection, label: isRTL ? 'تمرين اليوم' : "Today's Workout", icon: Dumbbell },
        { id: 'nutrition' as NavSection, label: isRTL ? 'الوجبات ونظام التخسيس' : 'Fat-Loss Meals', icon: Utensils },
        { id: 'weeklySchedule' as NavSection, label: isRTL ? 'الجدول الأسبوعي' : 'Weekly Schedule', icon: Calendar },
        { id: 'guidance' as NavSection, label: isRTL ? 'تفاصيل الخطة' : 'Plan Details', icon: Compass },
      ],
    },
    {
      groupTitle: isRTL ? 'تمارين وإضافات' : 'Training & Extras',
      items: [
        { id: 'exerciseLibrary' as NavSection, label: t.nav.exerciseLibrary, icon: BookOpen },
        { id: 'home' as NavSection, label: t.nav.home, icon: Home },
        { id: 'cardio' as NavSection, label: t.nav.cardio, icon: HeartPulse },
        { id: 'core' as NavSection, label: t.nav.core, icon: Layers },
        { id: 'recovery' as NavSection, label: t.nav.recovery, icon: Sparkles },
        {
          id: 'returnToTraining' as NavSection,
          label: isRTL ? 'برنامج العودة بعد الانقطاع' : 'Return to Training',
          icon: Flame,
          isHighlight: isInterrupted,
        },
      ],
    },
    {
      groupTitle: isRTL ? 'التقارير والحساب' : 'Reports & Account',
      items: [
        { id: 'progress' as NavSection, label: t.nav.progress, icon: TrendingUp },
        { id: 'aiCoach' as NavSection, label: t.nav.aiCoach, icon: Bot },
        { id: 'devices' as NavSection, label: isRTL ? 'الساعة والأجهزة' : 'Health & BLE', icon: Watch },
        { id: 'achievements' as NavSection, label: t.nav.achievements, icon: Trophy },
        { id: 'visualizer' as NavSection, label: t.nav.physiqueVisualizer, icon: ImageIcon },
        { id: 'profile' as NavSection, label: t.nav.profile, icon: User },
        { id: 'settings' as NavSection, label: t.nav.settings, icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Bottom Sticky Mobile Navigation */}
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 w-full items-center justify-around border-t border-border bg-card/95 px-2 backdrop-blur-xl md:hidden"
      >
        {primaryTabs.map((tab) => {
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
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 px-3 py-1 transition-colors ${
                isActive ? 'text-primary font-black' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] leading-none font-bold">{tab.label}</span>
            </button>
          );
        })}

        {/* More Options Tab */}
        <button
          id="mobile-tab-more"
          onClick={onOpenDrawer}
          className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 px-3 py-1 transition-colors ${
            drawerOpen || !primaryTabs.some((tab) => tab.id === currentSection)
              ? 'text-primary font-black'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] leading-none font-bold">{isRTL ? 'المزيد' : 'More'}</span>
        </button>
      </div>

      {/* Slide-over Drawer for All Secondary Sections */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onCloseDrawer} />

          <div
            className={`relative flex h-full w-[85%] max-w-sm flex-col bg-card border-border shadow-2xl ${
              isRTL ? 'mr-auto rounded-l-3xl border-l' : 'ml-auto rounded-r-3xl border-r'
            }`}
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <span className="font-black text-sm text-foreground">EDDIEB FIT</span>
                <p className="text-[11px] text-muted-foreground">{profile.name}</p>
              </div>
              <button
                id="btn-close-drawer"
                onClick={onCloseDrawer}
                className="rounded-full bg-secondary p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {drawerGroups.map((group) => (
                <div key={group.groupTitle} className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 block">
                    {group.groupTitle}
                  </span>
                  {group.items.map((item) => {
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
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground font-bold'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {onOpenPWAInstallModal && (
              <div className="border-t border-border p-3.5">
                <button
                  id="btn-drawer-pwa-install"
                  onClick={() => {
                    onCloseDrawer();
                    onOpenPWAInstallModal();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 p-2.5 text-xs font-bold text-primary"
                >
                  <Download className="h-4 w-4" />
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
