import { ScreenWakeDuration } from '../types';

let wakeLockSentinel: any = null;
let wakeLockTimeout: any = null;
let currentDuration: ScreenWakeDuration = 'never';
let isActiveSession: boolean = false;

const durationToMs = (duration: ScreenWakeDuration): number | null => {
  switch (duration) {
    case '1m':
      return 60 * 1000;
    case '2m':
      return 2 * 60 * 1000;
    case '5m':
      return 5 * 60 * 1000;
    case '10m':
      return 10 * 60 * 1000;
    case '30m':
      return 30 * 60 * 1000;
    case 'never':
    default:
      return null;
  }
};

const handleVisibilityChange = async () => {
  if (isActiveSession && document.visibilityState === 'visible') {
    await requestLock();
  }
};

const requestLock = async () => {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return false;
  }

  try {
    if (wakeLockSentinel && !wakeLockSentinel.released) {
      return true;
    }
    wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
    
    wakeLockSentinel.addEventListener('release', () => {
      // Sentinel was released by system/browser
    });
    return true;
  } catch (err) {
    // Graceful fallback - device/browser may deny or lack battery/permission
    console.warn('Screen Wake Lock could not be acquired:', err);
    return false;
  }
};

export const WakeLockService = {
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  },

  isActive(): boolean {
    return !!wakeLockSentinel && !wakeLockSentinel.released;
  },

  async acquire(duration: ScreenWakeDuration = 'never'): Promise<boolean> {
    currentDuration = duration;
    isActiveSession = true;

    // Clear any existing timer
    if (wakeLockTimeout) {
      clearTimeout(wakeLockTimeout);
      wakeLockTimeout = null;
    }

    const acquired = await requestLock();

    // Set auto-release timer if duration is specified
    const ms = durationToMs(duration);
    if (ms !== null && ms > 0) {
      wakeLockTimeout = setTimeout(() => {
        WakeLockService.release();
      }, ms);
    }

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return acquired;
  },

  async release(): Promise<void> {
    isActiveSession = false;
    if (wakeLockTimeout) {
      clearTimeout(wakeLockTimeout);
      wakeLockTimeout = null;
    }

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }

    if (wakeLockSentinel) {
      try {
        await wakeLockSentinel.release();
      } catch (err) {
        // Safe catch
      } finally {
        wakeLockSentinel = null;
      }
    }
  },
};
