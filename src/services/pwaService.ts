export type PlatformType = 'ios' | 'android' | 'desktop-chrome' | 'desktop-safari' | 'desktop-other';

export interface PWAState {
  canInstall: boolean;
  isInstalled: boolean;
  isOfflineReady: boolean;
  platform: PlatformType;
  hasUpdate: boolean;
}

type PWAListener = (state: PWAState) => void;

class PWAServiceManager {
  private deferredPrompt: any = null;
  private isInstalled: boolean = false;
  private isOfflineReady: boolean = false;
  private hasUpdate: boolean = false;
  private platform: PlatformType = 'desktop-other';
  private listeners: Set<PWAListener> = new Set();
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.detectPlatform();
      this.checkInstalledStatus();
      this.initEventListeners();
      this.registerServiceWorker();
    }
  }

  public init() {
    if (typeof window !== 'undefined') {
      this.checkInstalledStatus();
      this.registerServiceWorker();
    }
  }

  private detectPlatform() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /android/.test(userAgent);
    const isChrome = /chrome|chromium|crios/.test(userAgent) && !/edge|edg|opr\//.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|chromium|crios/.test(userAgent);

    if (isIOS) {
      this.platform = 'ios';
    } else if (isAndroid) {
      this.platform = 'android';
    } else if (isChrome) {
      this.platform = 'desktop-chrome';
    } else if (isSafari) {
      this.platform = 'desktop-safari';
    } else {
      this.platform = 'desktop-other';
    }
  }

  private checkInstalledStatus() {
    // Check if running in standalone display mode
    const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;

    this.isInstalled = isStandaloneDisplay || isIOSStandalone || isFullscreen || isMinimalUI;
  }

  private initEventListeners() {
    // Capture the beforeinstallprompt event for Android and Desktop Chrome/Edge
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.notifyListeners();
    });

    // App installed event
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstalled = true;
      this.notifyListeners();
    });

    // Display mode change listener
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (evt) => {
      this.isInstalled = evt.matches;
      this.notifyListeners();
    });
  }

  public registerServiceWorker() {
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            this.registration = reg;
            this.isOfflineReady = true;

            // Check for service worker updates
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    this.hasUpdate = true;
                    this.notifyListeners();
                  }
                };
              }
            };
            this.notifyListeners();
          })
          .catch((err) => {
            console.warn('ServiceWorker registration error:', err);
          });
      });
    }
  }

  public getState(): PWAState {
    return {
      canInstall: !!this.deferredPrompt || this.platform === 'ios' || (!this.isInstalled && (this.platform === 'desktop-chrome' || this.platform === 'desktop-safari')),
      isInstalled: this.isInstalled,
      isOfflineReady: this.isOfflineReady,
      platform: this.platform,
      hasUpdate: this.hasUpdate,
    };
  }

  public subscribe(listener: PWAListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  /**
   * Triggers the native install prompt dialog or returns false if manual steps are needed
   */
  public async promptInstall(): Promise<'accepted' | 'dismissed' | 'manual'> {
    if (this.deferredPrompt) {
      try {
        this.deferredPrompt.prompt();
        const choiceResult = await this.deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          this.isInstalled = true;
          this.deferredPrompt = null;
          this.notifyListeners();
          return 'accepted';
        } else {
          this.deferredPrompt = null;
          this.notifyListeners();
          return 'dismissed';
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
        return 'manual';
      }
    }
    return 'manual';
  }

  /**
   * Applies the latest service worker update immediately
   */
  public applyUpdate() {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }
}

export const PWAService = new PWAServiceManager();
