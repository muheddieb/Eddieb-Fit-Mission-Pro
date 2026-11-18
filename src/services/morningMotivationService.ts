import { DailyCheckInRecord, UserProfile } from '../types';
import { StorageService } from './storage';

export type MorningHabitPhase =
  | 'completed'
  | 'in_progress'
  | 'skipped'
  | 'rest_day'
  | 'walking_detected'
  | 'idle_no_steps'
  | 'near_window'
  | 'pre_gym'
  | 'after_window';

export interface MorningMotivationMessage {
  id: string;
  phase: MorningHabitPhase;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  ctaLabelEn?: string;
  ctaLabelAr?: string;
  shouldNotify: boolean;
}

const MESSAGE_LIBRARY: Record<MorningHabitPhase, Omit<MorningMotivationMessage, 'phase' | 'shouldNotify'>[]> = {
  completed: [
    {
      id: 'comp_1',
      titleEn: 'Morning Mission Done',
      titleAr: 'أنجزت مهمة الصباح',
      bodyEn: 'Training logged. Your morning window is protected—focus on protein, water, and recovery.',
      bodyAr: 'تم تسجيل التمرين. حافظت على روتين الصباح—ركّز الآن على البروتين والماء والراحة.',
    },
    {
      id: 'comp_2',
      titleEn: 'Strong Start',
      titleAr: 'بداية يوم قوية',
      bodyEn: 'Consistency beats intensity. One more morning session banked toward your goal.',
      bodyAr: 'الاستمرارية أهم من المثالية. تمرينة صباحية جديدة في رصيدك اليوم.',
    },
  ],
  in_progress: [
    {
      id: 'prog_1',
      titleEn: 'Session Active',
      titleAr: 'التمرين قيد التنفيذ',
      bodyEn: 'Keep form clean and protect your knees and lower back. Morning reminders paused.',
      bodyAr: 'حافظ على الأداء السليم وحماية الركبتين وأسفل الظهر. التنبيهات متوقفة أثناء التمرين.',
    },
  ],
  skipped: [
    {
      id: 'skip_1',
      titleEn: 'No Guilt — Adjust Smartly',
      titleAr: 'بدون لوم — عدّل الخطة بذكاء',
      bodyEn: 'Missed the morning window? Move today’s session to tomorrow or take a clean rest day.',
      bodyAr: 'فاتتك نافذة الصباح؟ انقل تمرين اليوم لغداً أو اعتبره يوم راحة بدون إحباط.',
      ctaLabelEn: 'Reschedule',
      ctaLabelAr: 'إعادة جدولة',
    },
  ],
  rest_day: [
    {
      id: 'rest_1',
      titleEn: 'Scheduled Recovery Day',
      titleAr: 'يوم راحة واستشفاء',
      bodyEn: 'Optional 20 min light bike or walk and hit your 32g fiber + protein targets.',
      bodyAr: 'مشي خفيف أو دراجة 20 دقيقة اختيارياً، والتزم بهدف البروتين و32 جم ألياف.',
    },
  ],
  walking_detected: [
    {
      id: 'walk_1',
      titleEn: 'You’re Already Moving',
      titleAr: 'حركتك الصباحية ممتازة',
      bodyEn: 'Morning movement active. Keep that momentum right into the gym door.',
      bodyAr: 'النشاط الصباحي بدأ بالفعل—استمر بنفس الخطوة مباشرة نحو الجيم.',
      ctaLabelEn: 'Start Workout',
      ctaLabelAr: 'ابدأ التمرين',
    },
    {
      id: 'walk_2',
      titleEn: 'Momentum Is On Your Side',
      titleAr: 'الزخم معك الآن',
      bodyEn: 'Body is warming up. Knock out the first exercise—the rest will follow.',
      bodyAr: 'جسمك بدأ يسخن بالفعل. ابدأ بأول تمرين فقط والباقي سيسير بسلاسة.',
      ctaLabelEn: 'Start Workout',
      ctaLabelAr: 'ابدأ التمرين',
    },
  ],
  idle_no_steps: [
    {
      id: 'idle_1',
      titleEn: '10-Minute Rule',
      titleAr: 'قاعدة الـ 10 دقائق',
      bodyEn: 'You do not have to feel motivated. Just warm up for 10 minutes—then decide.',
      bodyAr: 'لا تحتاج إلى حماس الآن. فقط ابدأ 10 دقائق إحماء أو دراجة ثم قرر.',
      ctaLabelEn: 'Quick Start',
      ctaLabelAr: 'بدء سريع',
    },
    {
      id: 'idle_2',
      titleEn: 'Morning Window Open',
      titleAr: 'الوقت الذهبي بعد الفجر',
      bodyEn: 'If it waits until afternoon, the day gets busy. Lace up and get the first set done.',
      bodyAr: 'تأجيل التمرين لبعد الظهر يعني غالباً تفويته. تحرك الآن وأنهِ أول مجموعة فقط.',
      ctaLabelEn: 'Quick Start',
      ctaLabelAr: 'بدء سريع',
    },
    {
      id: 'idle_3',
      titleEn: 'Protect Your Morning Slot',
      titleAr: 'احمِ وقت تمرينك الصباحي',
      bodyEn: 'Your 7:30–8:00 AM window is your superpower. Even an Easy joint-safe session counts.',
      bodyAr: 'موعد 7:30–8:00 صباحاً هو سر التزامك. حتى جلسة خفيفة (Easy) تحافظ على السلسلة.',
      ctaLabelEn: 'Quick Start',
      ctaLabelAr: 'بدء سريع',
    },
  ],
  near_window: [
    {
      id: 'near_1',
      titleEn: 'Post-Fajr Gym Window Now',
      titleAr: 'حان وقت الجيم الصباحي',
      bodyEn: '7:30–8:00 AM target window. Water, coffee, gym bag—45 minutes and your day is won.',
      bodyAr: 'موعدك من 7:30 إلى 8:00 صباحاً. ماء، قهوة، وحقيبة الجيم—45 دقيقة وتكسب يومك.',
      ctaLabelEn: 'Start Today',
      ctaLabelAr: 'ابدأ الآن',
    },
    {
      id: 'near_2',
      titleEn: 'Beat the Busy Day',
      titleAr: 'اسبق زحمة اليوم',
      bodyEn: 'Finish training before work begins. Future you at 6 PM will thank you.',
      bodyAr: 'أنهِ تمرينك قبل انشغال اليوم. ستشكر نفسك مساءً على هذا القرار.',
      ctaLabelEn: 'Start Today',
      ctaLabelAr: 'ابدأ الآن',
    },
  ],
  pre_gym: [
    {
      id: 'pre_1',
      titleEn: 'Early Readiness',
      titleAr: 'جاهزية الصباح الباكر',
      bodyEn: 'Prep your bottle and shoes for your 7:30 AM gym slot. Simple start, steady fat loss.',
      bodyAr: 'جهّز زجاجة الماء والحذاء لموعد 7:30 صباحاً. بداية بسيطة ونتائج مستمرة.',
    },
    {
      id: 'pre_2',
      titleEn: 'Show Up First',
      titleAr: 'الحضور أولاً',
      bodyEn: 'At 101.1 kg, consistency beats heroic workouts. Show up on schedule and protect joints.',
      bodyAr: 'الالتزام المستمر أهم من الحماس المؤقت. احضر في موعدك وحافظ على سلامة مفاصلك.',
    },
  ],
  after_window: [
    {
      id: 'after_1',
      titleEn: 'Still Time to Move or Reschedule',
      titleAr: 'ما زال أمامك خيار عملي',
      bodyEn: 'Busy morning? Run a 20-min low-impact session or shift today cleanly to tomorrow.',
      bodyAr: 'صباح مزدحم؟ يمكنك عمل 20 دقيقة خفيفة أو نقل التمرين لغداً بنقرة واحدة.',
      ctaLabelEn: 'Move / Rest',
      ctaLabelAr: 'تعديل اليوم',
    },
  ],
};

function parseHHMMToMinutes(hhmm: string | undefined, fallbackMinutes: number): number {
  if (!hhmm || !hhmm.includes(':')) return fallbackMinutes;
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return fallbackMinutes;
  return h * 60 + m;
}

export const MorningMotivationService = {
  detectPhase(
    profile: UserProfile,
    checkIn: DailyCheckInRecord,
    isRestDay: boolean,
    now: Date = new Date()
  ): MorningHabitPhase {
    if (checkIn.status === 'completed') return 'completed';
    if (checkIn.status === 'in_progress') return 'in_progress';
    if (checkIn.status === 'skipped') return 'skipped';
    if (isRestDay) return 'rest_day';

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const startMin = parseHHMMToMinutes(profile.morningWindowStart, 7 * 60 + 30); // 07:30
    const endMin = parseHHMMToMinutes(profile.morningWindowEnd, 8 * 60 + 0); // 08:00

    // Walking / active steps signal
    if (checkIn.morningActive || (checkIn.stepsToday !== undefined && checkIn.stepsToday >= 1200)) {
      return 'walking_detected';
    }

    // Inside morning gym window (plus 30 min buffer)
    if (nowMinutes >= startMin - 30 && nowMinutes <= endMin + 45) {
      if (checkIn.stepsToday !== undefined && checkIn.stepsToday < 400 && nowMinutes >= startMin) {
        return 'idle_no_steps';
      }
      return 'near_window';
    }

    if (nowMinutes < startMin - 30) {
      return 'pre_gym';
    }

    return 'after_window';
  },

  getNextMessage(
    profile: UserProfile,
    checkIn: DailyCheckInRecord,
    isRestDay: boolean,
    now: Date = new Date()
  ): MorningMotivationMessage {
    const phase = this.detectPhase(profile, checkIn, isRestDay, now);
    const pool = MESSAGE_LIBRARY[phase] || MESSAGE_LIBRARY.near_window;
    const state = StorageService.getMorningMotivationState();

    // Pick a message not in recentMessageIds to avoid repetition
    const unused = pool.filter((m) => !state.recentMessageIds.includes(m.id));
    const chosen = unused.length > 0 ? unused[0] : pool[0];

    const todayStr = now.toISOString().split('T')[0];
    if (state.lastShownDate !== todayStr || !state.recentMessageIds.includes(chosen.id)) {
      const updatedRecent = [chosen.id, ...state.recentMessageIds.filter((id) => id !== chosen.id)].slice(0, 6);
      StorageService.saveMorningMotivationState({
        ...state,
        recentMessageIds: updatedRecent,
        lastShownDate: todayStr,
      });
    }

    const shouldNotify =
      (phase === 'near_window' || phase === 'idle_no_steps') &&
      Boolean(profile.morningNotificationsEnabled);

    return {
      ...chosen,
      phase,
      shouldNotify,
    };
  },

  async requestNotificationPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    if (Notification.permission === 'granted') return 'granted';
    try {
      const result = await Notification.requestPermission();
      return result;
    } catch {
      return Notification.permission;
    }
  },

  async sendMorningNotificationIfDue(
    profile: UserProfile,
    message: MorningMotivationMessage,
    checkIn: DailyCheckInRecord
  ): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission !== 'granted') return false;
    if (!profile.morningNotificationsEnabled) return false;
    // Pause / stop notifications if workout started or finished or skipped
    if (checkIn.status === 'in_progress' || checkIn.status === 'completed' || checkIn.status === 'skipped') {
      return false;
    }
    if (message.phase !== 'near_window' && message.phase !== 'idle_no_steps') {
      return false;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const state = StorageService.getMorningMotivationState();
    if (state.lastNotifiedDate === todayStr) {
      return false; // Already notified once for today's window
    }

    const isAr = profile.language === 'ar';
    const title = isAr ? message.titleAr : message.titleEn;
    const body = isAr ? message.bodyAr : message.bodyEn;

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon: '/icons/icon-192.svg',
            badge: '/icons/icon-192.svg',
            tag: `morning-gym-${todayStr}`,
          });
          StorageService.saveMorningMotivationState({
            ...state,
            lastNotifiedDate: todayStr,
          });
          return true;
        }
      }
      new Notification(title, { body, icon: '/icons/icon-192.svg', tag: `morning-gym-${todayStr}` });
      StorageService.saveMorningMotivationState({
        ...state,
        lastNotifiedDate: todayStr,
      });
      return true;
    } catch {
      return false;
    }
  },
};
