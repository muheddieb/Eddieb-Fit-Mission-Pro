import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  X, 
  Smartphone, 
  Monitor, 
  Check, 
  Share, 
  PlusSquare, 
  ShieldCheck, 
  WifiOff, 
  Zap, 
  Maximize, 
  CloudCheck,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { PWAService, PWAState } from '../../services/pwaService';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';
  const [pwaState, setPwaState] = useState<PWAState>(PWAService.getState());
  const [activePlatformTab, setActivePlatformTab] = useState<'mobile' | 'desktop'>(
    pwaState.platform === 'ios' || pwaState.platform === 'android' ? 'mobile' : 'desktop'
  );
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'installed' | 'dismissed'>('idle');

  useEffect(() => {
    const unsub = PWAService.subscribe((state) => {
      setPwaState(state);
      if (state.isInstalled) {
        setInstallStatus('installed');
      }
    });
    return () => unsub();
  }, []);

  const handleInstallClick = async () => {
    setInstallStatus('installing');
    const result = await PWAService.promptInstall();
    if (result === 'accepted') {
      setInstallStatus('installed');
    } else if (result === 'dismissed') {
      setInstallStatus('dismissed');
      setTimeout(() => setInstallStatus('idle'), 3000);
    } else {
      // Manual steps needed for this platform
      setInstallStatus('idle');
      if (pwaState.platform === 'ios') {
        setActivePlatformTab('mobile');
      } else {
        setActivePlatformTab('desktop');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="pwa-install-modal-overlay"
        className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl my-8"
        >
          {/* Top Decorative Header Accent */}
          <div className="h-2 w-full bg-gradient-to-r from-primary via-emerald-400 to-cyan-500" />

          {/* Close Button */}
          <button
            id="btn-close-pwa-modal"
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors z-10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Header / Brand Hero */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-start">
              {/* App Icon */}
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 via-secondary to-background border-2 border-primary/40 shadow-xl shadow-primary/20">
                <img 
                  src="/favicon.svg" 
                  alt="EDDIEB FIT Icon" 
                  className="h-14 w-14 drop-shadow-md"
                  onError={(e) => {
                    // Fallback to vector icon if svg path fails
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="absolute -bottom-2 -right-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-black text-black ring-2 ring-background">
                  PWA
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-foreground">
                    {t.pwa.installTitle}
                  </h2>
                  {pwaState.isInstalled ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {t.pwa.installedBadge}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 border border-primary/40 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      {isAr ? 'جاهز للتحميل' : 'Ready to Download'}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                  {pwaState.isInstalled ? t.pwa.installedDesc : t.pwa.installSubtitle}
                </p>
              </div>
            </div>

            {/* Primary Action Button (If not already installed) */}
            {!pwaState.isInstalled && (
              <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-start">
                  <div className="text-sm font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>{isAr ? 'تثبيت بنقرة واحدة على هاتفك أو حاسوبك' : '1-Click Direct Download & Install'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isAr ? 'يعمل بدون متجر تطبيقات، خفيف وسريع ويدعم العمل دون إنترنت.' : 'No app store required. Lightweight, instant updates, and offline ready.'}
                  </div>
                </div>

                <button
                  id="btn-trigger-pwa-install"
                  onClick={handleInstallClick}
                  disabled={installStatus === 'installing'}
                  className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>
                    {installStatus === 'installing'
                      ? (isAr ? 'جاري التحميل...' : 'Installing...')
                      : t.pwa.installBtn}
                  </span>
                </button>
              </div>
            )}

            {/* Platform Selector Tabs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  {isAr ? 'دليل التثبيت حسب جهازك' : 'Device Installation Guide'}
                </h3>
                
                <div className="flex rounded-xl bg-secondary/60 p-1 border border-border">
                  <button
                    onClick={() => setActivePlatformTab('mobile')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                      activePlatformTab === 'mobile'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>{t.pwa.mobileTabTitle}</span>
                  </button>
                  <button
                    onClick={() => setActivePlatformTab('desktop')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                      activePlatformTab === 'desktop'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    <span>{t.pwa.desktopTabTitle}</span>
                  </button>
                </div>
              </div>

              {/* Tab Content: Mobile vs Desktop Guides */}
              <div className="rounded-2xl border border-border bg-secondary/20 p-4 sm:p-5 space-y-4">
                {activePlatformTab === 'mobile' ? (
                  <div className="space-y-4">
                    {/* iOS Section */}
                    <div className="space-y-2.5 rounded-xl border border-border/80 bg-card p-4">
                      <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/20 text-xs font-black text-primary">
                          🍎
                        </span>
                        <span>{t.pwa.iosTitle}</span>
                      </div>
                      <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside pl-1">
                        <li className="flex items-start gap-2">
                          <Share className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{t.pwa.iosStep1}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <PlusSquare className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{t.pwa.iosStep2}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{t.pwa.iosStep3}</span>
                        </li>
                      </ol>
                    </div>

                    {/* Android Section */}
                    <div className="space-y-2.5 rounded-xl border border-border/80 bg-card p-4">
                      <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-xs font-black text-emerald-400">
                          🤖
                        </span>
                        <span>{t.pwa.androidTitle}</span>
                      </div>
                      <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside pl-1">
                        <li className="flex items-start gap-2">
                          <Download className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{t.pwa.androidStep1}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <span>{t.pwa.androidStep2}</span>
                        </li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2.5 rounded-xl border border-border/80 bg-card p-4">
                      <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                        <Laptop className="h-4 w-4 text-primary" />
                        <span>{t.pwa.desktopTitle}</span>
                      </div>
                      <ul className="space-y-2.5 text-xs text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Download className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{t.pwa.desktopStep1}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Maximize className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{t.pwa.desktopStep2}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PWA Athletic Highlights & Offline Capabilities */}
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                {t.pwa.featuresTitle}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-secondary/30 p-3 text-xs">
                  <WifiOff className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-muted-foreground">{t.pwa.featureOffline}</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-secondary/30 p-3 text-xs">
                  <Zap className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="text-muted-foreground">{t.pwa.featureFast}</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-secondary/30 p-3 text-xs">
                  <Maximize className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span className="text-muted-foreground">{t.pwa.featureFull}</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-secondary/30 p-3 text-xs">
                  <CloudCheck className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">{t.pwa.featureSync}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                id="btn-dismiss-pwa-modal"
                onClick={onClose}
                className="rounded-xl border border-border bg-secondary/50 px-5 py-2.5 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
