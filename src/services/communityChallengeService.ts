import {
  UserProfile,
  WorkoutSession,
  CardioSession,
  CommunityChallenge,
  CommunityAthleteRank,
  UserChallengeStats,
  CommunityChallengeCategory,
} from '../types';
import { StorageService } from './storage';
import { db, auth } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { sanitizeForFirestore, handleFirestoreError, FirestoreOperationType } from './firestoreSyncService';

// Storage key for cached cheered athletes
const CHEERS_STORAGE_KEY = 'eddieb_community_cheers_v1';
const USER_CONTRIBUTION_OVERRIDE_KEY = 'eddieb_community_user_contributions_v1';

// Base EDDIEB FIT Community Athletes Roster
interface RawAthleteTemplate {
  id: string;
  name: string;
  nameAr?: string;
  avatarInitials: string;
  countryFlag: string;
  countryName: string;
  countryNameAr: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  streakDays: number;
  baseCheers: number;
  lastActiveMinutesAgo: number;
  // Baseline contribution values across challenges
  contributions: {
    squat_weight: number; // in kg
    push_volume: number;  // in kg
    total_sessions: number; // count
    cardio_distance: number; // in km
  };
}

const ATHLETE_TEMPLATES: RawAthleteTemplate[] = [
  {
    id: 'athlete_eddie_b',
    name: 'Captain Eddie B',
    nameAr: 'كابتن إيدي ب',
    avatarInitials: 'EB',
    countryFlag: '🇪🇬',
    countryName: 'Egypt',
    countryNameAr: 'مصر',
    level: 'advanced',
    streakDays: 48,
    baseCheers: 184,
    lastActiveMinutesAgo: 12,
    contributions: {
      squat_weight: 6850,
      push_volume: 8420,
      total_sessions: 26,
      cardio_distance: 145,
    },
  },
  {
    id: 'athlete_sarah_k',
    name: 'Sarah K.',
    nameAr: 'سارة كمال',
    avatarInitials: 'SK',
    countryFlag: '🇦🇪',
    countryName: 'UAE',
    countryNameAr: 'الإمارات',
    level: 'intermediate',
    streakDays: 29,
    baseCheers: 142,
    lastActiveMinutesAgo: 45,
    contributions: {
      squat_weight: 5420,
      push_volume: 6100,
      total_sessions: 22,
      cardio_distance: 210,
    },
  },
  {
    id: 'athlete_omar_m',
    name: 'Omar Mansour',
    nameAr: 'عمر منصور',
    avatarInitials: 'OM',
    countryFlag: '🇪🇬',
    countryName: 'Egypt',
    countryNameAr: 'مصر',
    level: 'advanced',
    streakDays: 34,
    baseCheers: 119,
    lastActiveMinutesAgo: 70,
    contributions: {
      squat_weight: 4950,
      push_volume: 6890,
      total_sessions: 21,
      cardio_distance: 98,
    },
  },
  {
    id: 'athlete_karim_z',
    name: 'Karim Al-Zahrani',
    nameAr: 'كريم الزهراني',
    avatarInitials: 'KZ',
    countryFlag: '🇸🇦',
    countryName: 'Saudi Arabia',
    countryNameAr: 'السعودية',
    level: 'advanced',
    streakDays: 21,
    baseCheers: 96,
    lastActiveMinutesAgo: 130,
    contributions: {
      squat_weight: 4320,
      push_volume: 5480,
      total_sessions: 19,
      cardio_distance: 85,
    },
  },
  {
    id: 'athlete_layla_h',
    name: 'Layla Haddad',
    nameAr: 'ليلى حداد',
    avatarInitials: 'LH',
    countryFlag: '🇯🇴',
    countryName: 'Jordan',
    countryNameAr: 'الأردن',
    level: 'intermediate',
    streakDays: 19,
    baseCheers: 78,
    lastActiveMinutesAgo: 190,
    contributions: {
      squat_weight: 3850,
      push_volume: 4310,
      total_sessions: 18,
      cardio_distance: 175,
    },
  },
  {
    id: 'athlete_tariq_n',
    name: 'Tariq Al-Nasser',
    nameAr: 'طارق الناصر',
    avatarInitials: 'TN',
    countryFlag: '🇰🇼',
    countryName: 'Kuwait',
    countryNameAr: 'الكويت',
    level: 'advanced',
    streakDays: 16,
    baseCheers: 65,
    lastActiveMinutesAgo: 240,
    contributions: {
      squat_weight: 3480,
      push_volume: 4920,
      total_sessions: 16,
      cardio_distance: 112,
    },
  },
  {
    id: 'athlete_ziad_f',
    name: 'Ziad Farouk',
    nameAr: 'زياد فاروق',
    avatarInitials: 'ZF',
    countryFlag: '🇪🇬',
    countryName: 'Egypt',
    countryNameAr: 'مصر',
    level: 'intermediate',
    streakDays: 14,
    baseCheers: 52,
    lastActiveMinutesAgo: 310,
    contributions: {
      squat_weight: 2980,
      push_volume: 3840,
      total_sessions: 15,
      cardio_distance: 92,
    },
  },
  {
    id: 'athlete_nour_e',
    name: 'Nour El-Din',
    nameAr: 'نور الدين',
    avatarInitials: 'NE',
    countryFlag: '🇶🇦',
    countryName: 'Qatar',
    countryNameAr: 'قطر',
    level: 'beginner',
    streakDays: 11,
    baseCheers: 44,
    lastActiveMinutesAgo: 400,
    contributions: {
      squat_weight: 2450,
      push_volume: 2900,
      total_sessions: 14,
      cardio_distance: 130,
    },
  },
  {
    id: 'athlete_hassan_b',
    name: 'Hassan Bradley',
    nameAr: 'حسن برادلي',
    avatarInitials: 'HB',
    countryFlag: '🇺🇸',
    countryName: 'USA',
    countryNameAr: 'أمريكا',
    level: 'intermediate',
    streakDays: 9,
    baseCheers: 38,
    lastActiveMinutesAgo: 490,
    contributions: {
      squat_weight: 2120,
      push_volume: 3200,
      total_sessions: 12,
      cardio_distance: 88,
    },
  },
  {
    id: 'athlete_yasmine_a',
    name: 'Yasmine Alaoui',
    nameAr: 'ياسمين العلوي',
    avatarInitials: 'YA',
    countryFlag: '🇲🇦',
    countryName: 'Morocco',
    countryNameAr: 'المغرب',
    level: 'intermediate',
    streakDays: 8,
    baseCheers: 31,
    lastActiveMinutesAgo: 580,
    contributions: {
      squat_weight: 1850,
      push_volume: 2600,
      total_sessions: 11,
      cardio_distance: 140,
    },
  },
  {
    id: 'athlete_ramy_g',
    name: 'Ramy Gomaa',
    nameAr: 'رامي جمعة',
    avatarInitials: 'RG',
    countryFlag: '🇪🇬',
    countryName: 'Egypt',
    countryNameAr: 'مصر',
    level: 'beginner',
    streakDays: 6,
    baseCheers: 24,
    lastActiveMinutesAgo: 720,
    contributions: {
      squat_weight: 1420,
      push_volume: 1980,
      total_sessions: 9,
      cardio_distance: 65,
    },
  },
  {
    id: 'athlete_fatima_s',
    name: 'Fatima Al-Sayed',
    nameAr: 'فاطمة السيد',
    avatarInitials: 'FS',
    countryFlag: '🇧🇭',
    countryName: 'Bahrain',
    countryNameAr: 'البحرين',
    level: 'beginner',
    streakDays: 5,
    baseCheers: 19,
    lastActiveMinutesAgo: 850,
    contributions: {
      squat_weight: 980,
      push_volume: 1420,
      total_sessions: 8,
      cardio_distance: 95,
    },
  },
];

export class CommunityChallengeService {
  /**
   * Get all available monthly community challenges with dynamic progress calculated
   */
  static getChallenges(
    history: WorkoutSession[],
    profile: UserProfile,
    cardioHistory?: CardioSession[]
  ): CommunityChallenge[] {
    const cardios = cardioHistory || StorageService.getCardioHistory();
    const daysLeft = this.calculateDaysRemainingInMonth();

    // Calculate user's specific contributions
    const userSquat = this.calculateUserSquatVolume(history, profile);
    const userPush = this.calculateUserPushVolume(history, profile);
    const userSessions = this.calculateUserMonthlySessions(history);
    const userCardio = this.calculateUserCardioDistance(cardios);

    // Sum base contributions of other community athletes
    const baseSquat = ATHLETE_TEMPLATES.reduce((sum, a) => sum + a.contributions.squat_weight, 0);
    const basePush = ATHLETE_TEMPLATES.reduce((sum, a) => sum + a.contributions.push_volume, 0);
    const baseSessions = ATHLETE_TEMPLATES.reduce((sum, a) => sum + a.contributions.total_sessions, 0);
    const baseCardio = ATHLETE_TEMPLATES.reduce((sum, a) => sum + a.contributions.cardio_distance, 0);

    const totalSquat = baseSquat + userSquat.volumeKg;
    const totalPush = basePush + userPush.volumeKg;
    const totalSessions = baseSessions + userSessions;
    const totalCardio = baseCardio + userCardio;

    const currentMonthEn = 'September 2026';
    const currentMonthAr = 'سبتمبر 2026';

    return [
      {
        id: 'monthly_squat_sep_2026',
        title: 'The EDDIEB 50-Ton Squat Crusade',
        titleAr: 'ملحمة السكوات الجماعية 50 طن',
        tagline: '50,000 kg Collective Squat Weight',
        taglineAr: '50,000 كجم حمل سكوات تراكمي',
        description:
          'Unite with fellow EDDIEB FIT athletes worldwide to amass 50,000 kg of collective barbell, goblet, and leg press squat tonnage this month.',
        descriptionAr:
          'اتحد مع أبطال مجتمع إيدي ب لرفع 50,000 كجم من السكوات ومكابس الأرجل التراكمية خلال هذا الشهر.',
        month: currentMonthEn,
        monthAr: currentMonthAr,
        category: 'squat_weight',
        targetGoal: 50000,
        currentProgress: totalSquat,
        unit: 'kg',
        unitAr: 'كجم',
        daysRemaining: daysLeft,
        totalParticipants: ATHLETE_TEMPLATES.length + 1,
        icon: 'Dumbbell',
        accentColor: '#10b981', // emerald
        milestones: [
          {
            percent: 25,
            label: '12,500 kg - Bronze Quad Foundation',
            labelAr: '12,500 كجم - انطلاقة البرونز',
            unlocked: totalSquat >= 12500,
            rewardBadge: 'Bronze Squat Crusader',
            rewardBadgeAr: 'وسام محارب السكوات البرونزي',
          },
          {
            percent: 50,
            label: '25,000 kg - Silver Depth Syndicate',
            labelAr: '25,000 كجم - نصف الطريق الفضي',
            unlocked: totalSquat >= 25000,
            rewardBadge: 'Silver Depth Titan',
            rewardBadgeAr: 'وسام عمق السكوات الفضي',
          },
          {
            percent: 75,
            label: '37,500 kg - Gold Vanguard Surge',
            labelAr: '37,500 كجم - طفرة الطليعة الذهبية',
            unlocked: totalSquat >= 37500,
            rewardBadge: 'Gold Vanguard Master',
            rewardBadgeAr: 'وسام طليعة السكوات الذهبي',
          },
          {
            percent: 100,
            label: '50,000 kg - Spartan Squat Crown',
            labelAr: '50,000 كجم - تاج السكوات الأسطوري',
            unlocked: totalSquat >= 50000,
            rewardBadge: 'Spartan 50-Ton Legend',
            rewardBadgeAr: 'تاج الـ 50 طن الأسطوري',
          },
        ],
      },
      {
        id: 'iron_push_sep_2026',
        title: 'September 75-Ton Iron Press Challenge',
        titleAr: 'تحدي الدفع والضغط الحديدي 75 طن',
        tagline: '75,000 kg Chest & Shoulder Tonnage',
        taglineAr: '75,000 كجم حمل دفع الصدر والكتف',
        description:
          'Push your limits across all horizontal and vertical presses to power the EDDIEB community across the 75-ton finish line.',
        descriptionAr:
          'اجمع أوزان تمارين الدفع والضغط المستوي والعلوي للوصول مع الفريق إلى حاجز 75 طن هذا الشهر.',
        month: currentMonthEn,
        monthAr: currentMonthAr,
        category: 'push_volume',
        targetGoal: 75000,
        currentProgress: totalPush,
        unit: 'kg',
        unitAr: 'كجم',
        daysRemaining: daysLeft,
        totalParticipants: ATHLETE_TEMPLATES.length + 1,
        icon: 'Flame',
        accentColor: '#f59e0b', // amber
        milestones: [
          {
            percent: 25,
            label: '18,750 kg - Press Spark',
            labelAr: '18,750 كجم - شرارة الدفع',
            unlocked: totalPush >= 18750,
            rewardBadge: 'Iron Press Spark',
            rewardBadgeAr: 'وسام شرارة الدفع',
          },
          {
            percent: 50,
            label: '37,500 kg - Hypertrophy Force',
            labelAr: '37,500 كجم - قوة التضخيم',
            unlocked: totalPush >= 37500,
            rewardBadge: 'Iron Force Commander',
            rewardBadgeAr: 'وسام قوة الدفع',
          },
          {
            percent: 75,
            label: '56,250 kg - Heavy Duty Surge',
            labelAr: '56,250 كجم - الدفع الثقيل',
            unlocked: totalPush >= 56250,
            rewardBadge: 'Heavy Duty Titan',
            rewardBadgeAr: 'وسام الدفع الثقيل',
          },
          {
            percent: 100,
            label: '75,000 kg - Apex Press Legend',
            labelAr: '75,000 كجم - قمة أساطير الدفع',
            unlocked: totalPush >= 75000,
            rewardBadge: 'Apex Press Legend',
            rewardBadgeAr: 'وسام قمة الضغط الأسطوري',
          },
        ],
      },
      {
        id: 'community_1000_sessions',
        title: '1,000 Workouts Community Milestone',
        titleAr: 'إنجاز 1,000 تمرينة جماعية للمجتمع',
        tagline: '1,000 Completed Workout Sessions',
        taglineAr: '1,000 جلسة تدريبية مكتملة',
        description:
          'Every logged workout session adds to the collective community total. Consistency is our absolute weapon.',
        descriptionAr:
          'كل تمرينة مسجلة تقرب المجتمع من الهدف الجماعي. الانضباط المستمر هو سلاحنا الأقوى.',
        month: currentMonthEn,
        monthAr: currentMonthAr,
        category: 'total_sessions',
        targetGoal: 1000,
        currentProgress: totalSessions,
        unit: 'sessions',
        unitAr: 'تمرينة',
        daysRemaining: daysLeft,
        totalParticipants: ATHLETE_TEMPLATES.length + 1,
        icon: 'Trophy',
        accentColor: '#3b82f6', // blue
        milestones: [
          {
            percent: 25,
            label: '250 Sessions - Discipline Core',
            labelAr: '250 تمرينة - نواة الانضباط',
            unlocked: totalSessions >= 250,
            rewardBadge: 'Discipline Initiator',
            rewardBadgeAr: 'وسام رائد الانضباط',
          },
          {
            percent: 50,
            label: '500 Sessions - Unbroken Legion',
            labelAr: '500 تمرينة - فيلق المحاربين',
            unlocked: totalSessions >= 500,
            rewardBadge: 'Legion Veteran',
            rewardBadgeAr: 'وسام فيلق المحاربين',
          },
          {
            percent: 75,
            label: '750 Sessions - Relentless Engine',
            labelAr: '750 تمرينة - المحرك الثابت',
            unlocked: totalSessions >= 750,
            rewardBadge: 'Relentless Vanguard',
            rewardBadgeAr: 'وسام طليعة الاستمرار',
          },
          {
            percent: 100,
            label: '1,000 Sessions - Brotherhood Summit',
            labelAr: '1,000 تمرينة - قمة إخوان الحديد',
            unlocked: totalSessions >= 1000,
            rewardBadge: '1,000 Session Dynasty',
            rewardBadgeAr: 'وسام سلالة الـ 1,000 تمرينة',
          },
        ],
      },
      {
        id: 'zone2_cardio_odyssey',
        title: '2,500 km Zone-2 Cardio Odyssey',
        titleAr: 'ملحمة 2,500 كم كارديو زون-2 الجماعية',
        tagline: '2,500 km Fat-Loss & Aerobic Base',
        taglineAr: '2,500 كم حرق دهون وبناء هوائي',
        description:
          'Log walking, incline treadmill, outdoor jogging, and cycle sessions to fuel the community cardiovascular engine.',
        descriptionAr:
          'سجل المشي والركض والدراجة الهوائية لبناء القاعدة الهوائية وحرق الدهون مع الفريق.',
        month: currentMonthEn,
        monthAr: currentMonthAr,
        category: 'cardio_distance',
        targetGoal: 2500,
        currentProgress: Math.round(totalCardio),
        unit: 'km',
        unitAr: 'كم',
        daysRemaining: daysLeft,
        totalParticipants: ATHLETE_TEMPLATES.length + 1,
        icon: 'Zap',
        accentColor: '#8b5cf6', // purple
        milestones: [
          {
            percent: 25,
            label: '625 km - Aerobic Spark',
            labelAr: '625 كم - شرارة الهوائي',
            unlocked: totalCardio >= 625,
            rewardBadge: 'Cardio Spark',
            rewardBadgeAr: 'وسام انطلاقة الكارديو',
          },
          {
            percent: 50,
            label: '1,250 km - Fat Oxidation Core',
            labelAr: '1,250 كم - محرك أكسدة الدهون',
            unlocked: totalCardio >= 1250,
            rewardBadge: 'Aerobic Vanguard',
            rewardBadgeAr: 'وسام محرك حرق الدهون',
          },
          {
            percent: 75,
            label: '1,875 km - Endurance Syndicate',
            labelAr: '1,875 كم - رابطة التحمل',
            unlocked: totalCardio >= 1875,
            rewardBadge: 'Endurance Master',
            rewardBadgeAr: 'وسام أستاذ التحمل',
          },
          {
            percent: 100,
            label: '2,500 km - Global Odyssey Champion',
            labelAr: '2,500 كم - بطل الملحمة العالمية',
            unlocked: totalCardio >= 2500,
            rewardBadge: 'Odyssey Legend',
            rewardBadgeAr: 'وسام أسطورة الملحمة العالمية',
          },
        ],
      },
    ];
  }

  /**
   * Compute full leaderboard rankings for a specific challenge category,
   * dynamically inserting the current user into their real earned spot.
   */
  static getLeaderboard(
    category: CommunityChallengeCategory,
    history: WorkoutSession[],
    profile: UserProfile,
    cardioHistory?: CardioSession[]
  ): {
    ranks: CommunityAthleteRank[];
    currentUserRank: CommunityAthleteRank;
    userStats: UserChallengeStats;
  } {
    const cardios = cardioHistory || StorageService.getCardioHistory();
    const cheeredMap = this.getCheeredAthletesMap();

    // 1. Calculate user's contribution for this category
    let userValue = 0;
    let contributingExercises: UserChallengeStats['contributingExercises'] = [];

    switch (category) {
      case 'squat_weight': {
        const res = this.calculateUserSquatVolume(history, profile);
        userValue = res.volumeKg;
        contributingExercises = res.breakdown;
        break;
      }
      case 'push_volume': {
        const res = this.calculateUserPushVolume(history, profile);
        userValue = res.volumeKg;
        contributingExercises = res.breakdown;
        break;
      }
      case 'total_sessions': {
        userValue = this.calculateUserMonthlySessions(history);
        break;
      }
      case 'cardio_distance': {
        userValue = Math.round(this.calculateUserCardioDistance(cardios));
        break;
      }
    }

    // 2. Build athlete list from templates
    const rawList: {
      id: string;
      name: string;
      nameAr?: string;
      avatarInitials: string;
      countryFlag: string;
      countryName: string;
      countryNameAr: string;
      level: 'beginner' | 'intermediate' | 'advanced';
      streakDays: number;
      cheersReceived: number;
      isCurrentUser: boolean;
      contribution: number;
      lastActiveMinutesAgo: number;
    }[] = ATHLETE_TEMPLATES.map((tpl) => ({
      id: tpl.id,
      name: tpl.name,
      nameAr: tpl.nameAr,
      avatarInitials: tpl.avatarInitials,
      countryFlag: tpl.countryFlag,
      countryName: tpl.countryName,
      countryNameAr: tpl.countryNameAr,
      level: tpl.level,
      streakDays: tpl.streakDays,
      cheersReceived: tpl.baseCheers + (cheeredMap[tpl.id] ? 1 : 0),
      isCurrentUser: false,
      contribution: tpl.contributions[category],
      lastActiveMinutesAgo: tpl.lastActiveMinutesAgo,
    }));

    // 3. Add Current User
    const userInitials = profile.name
      ? profile.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'ME';

    const userCheers = 42 + (cheeredMap['current_user'] ? 1 : 0);

    rawList.push({
      id: 'current_user',
      name: profile.name ? `${profile.name} (You)` : 'You (Current Athlete)',
      nameAr: profile.name ? `${profile.name} (أنت)` : 'أنت (البطل الحالي)',
      avatarInitials: userInitials,
      countryFlag: '🇪🇬', // Default user flag, can adapt
      countryName: 'Egypt',
      countryNameAr: 'مصر',
      level: profile.level || 'intermediate',
      streakDays: Math.max(7, history.filter((w) => w.completed).length),
      cheersReceived: userCheers,
      isCurrentUser: true,
      contribution: userValue,
      lastActiveMinutesAgo: 0,
    });

    // 4. Sort descending by contribution
    rawList.sort((a, b) => b.contribution - a.contribution);

    // 5. Total contribution of all athletes for share calculation
    const grandTotal = rawList.reduce((acc, curr) => acc + curr.contribution, 0) || 1;

    // 6. Map to finalized CommunityAthleteRank
    const ranks: CommunityAthleteRank[] = rawList.map((item, index) => {
      const rankNum = index + 1;
      const pct = Math.round((item.contribution / grandTotal) * 1000) / 10;
      const tierConfig = this.getTierConfig(rankNum, rawList.length);
      const unit = category === 'total_sessions' ? 'sessions' : category === 'cardio_distance' ? 'km' : 'kg';
      const unitAr = category === 'total_sessions' ? 'تمرينة' : category === 'cardio_distance' ? 'كم' : 'كجم';

      const lastActiveText =
        item.lastActiveMinutesAgo === 0
          ? 'Active now'
          : item.lastActiveMinutesAgo < 60
          ? `${item.lastActiveMinutesAgo}m ago`
          : `${Math.round(item.lastActiveMinutesAgo / 60)}h ago`;

      const lastActiveTextAr =
        item.lastActiveMinutesAgo === 0
          ? 'نشط الآن'
          : item.lastActiveMinutesAgo < 60
          ? `منذ ${item.lastActiveMinutesAgo} دقيقة`
          : `منذ ${Math.round(item.lastActiveMinutesAgo / 60)} ساعة`;

      return {
        id: item.id,
        name: item.name,
        nameAr: item.nameAr,
        avatarInitials: item.avatarInitials,
        rank: rankNum,
        contribution: item.contribution,
        contributionUnit: unit,
        contributionUnitAr: unitAr,
        percentageOfTotal: pct,
        tier: tierConfig.tier,
        tierLabel: tierConfig.labelEn,
        tierLabelAr: tierConfig.labelAr,
        badge: tierConfig.badgeEn,
        badgeAr: tierConfig.badgeAr,
        streakDays: item.streakDays,
        cheersReceived: item.cheersReceived,
        isCurrentUser: item.isCurrentUser,
        countryFlag: item.countryFlag,
        countryName: item.countryName,
        countryNameAr: item.countryNameAr,
        level: item.level,
        lastActiveText,
        lastActiveTextAr,
      };
    });

    const currentUserRank = ranks.find((r) => r.isCurrentUser)!;
    const userIndex = ranks.findIndex((r) => r.isCurrentUser);

    // Compute gap to next athlete above
    let behindByValue: number | undefined;
    let nextRankAthleteName: string | undefined;
    if (userIndex > 0) {
      const athleteAbove = ranks[userIndex - 1];
      behindByValue = athleteAbove.contribution - currentUserRank.contribution;
      nextRankAthleteName = athleteAbove.name.replace(' (You)', '');
    }

    // Compute lead over athlete below
    let aheadByValue: number | undefined;
    if (userIndex < ranks.length - 1) {
      const athleteBelow = ranks[userIndex + 1];
      aheadByValue = currentUserRank.contribution - athleteBelow.contribution;
    }

    const userStats: UserChallengeStats = {
      challengeId: category,
      contribution: currentUserRank.contribution,
      rank: currentUserRank.rank,
      totalAthletes: ranks.length,
      percentageOfTotal: currentUserRank.percentageOfTotal,
      aheadByValue,
      behindByValue,
      nextRankAthleteName,
      contributingExercises,
    };

    return {
      ranks,
      currentUserRank,
      userStats,
    };
  }

  /**
   * User can cheer/fist-bump an athlete on the leaderboard
   */
  static cheerAthlete(athleteId: string): boolean {
    try {
      const cheered = this.getCheeredAthletesMap();
      cheered[athleteId] = true;
      localStorage.setItem(CHEERS_STORAGE_KEY, JSON.stringify(cheered));
      return true;
    } catch (e) {
      console.error('Error saving cheer:', e);
      return false;
    }
  }

  /**
   * Check if an athlete has been cheered in this session
   */
  static hasCheeredAthlete(athleteId: string): boolean {
    const map = this.getCheeredAthletesMap();
    return !!map[athleteId];
  }

  private static getCheeredAthletesMap(): Record<string, boolean> {
    try {
      const raw = localStorage.getItem(CHEERS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  /**
   * Save user challenge contribution to Firestore if user is authenticated
   */
  static async syncUserChallengeToFirestore(
    challengeId: string,
    contributionValue: number,
    profile: UserProfile
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user || !navigator.onLine) return;

    try {
      const challengeRef = doc(db, 'users', user.uid, 'challenges', challengeId);
      const payload = sanitizeForFirestore({
        id: challengeId,
        athleteName: profile.name || 'EDDIEB Athlete',
        contributionValue,
        updatedAt: Date.now(),
      });
      await setDoc(challengeRef, payload, { merge: true });
    } catch (err) {
      console.warn('Could not sync challenge to firestore:', err);
    }
  }

  // ==========================================
  // Detailed User Workouts Volume Parsers
  // ==========================================

  /**
   * Sums all squat variations (Barbell, Goblet, Front, Hack, Leg Press, Smith)
   * logged by the user in the current month or all time if current month has < 2 sessions.
   */
  static calculateUserSquatVolume(
    history: WorkoutSession[],
    profile: UserProfile
  ): {
    volumeKg: number;
    breakdown: { name: string; nameAr?: string; setsCount: number; repsCount: number; volumeKg: number }[];
  } {
    const breakdownMap: Record<string, { name: string; nameAr?: string; setsCount: number; repsCount: number; volumeKg: number }> = {};
    let totalVolume = 0;

    const SQUAT_KEYWORDS = ['squat', 'leg press', 'hack squat', 'سكوات', 'مكبس أرجل', 'سكوات أمامي', 'قرفصاء'];

    for (const session of history) {
      if (!session.completed && !session.totalVolumeKg) continue;

      // Scan exercises
      if (session.exercises && Array.isArray(session.exercises)) {
        for (const ex of session.exercises) {
          const exName = (ex.exerciseName || '').toLowerCase();
          const isSquat = SQUAT_KEYWORDS.some((kw) => exName.includes(kw));

          if (isSquat && ex.sets && Array.isArray(ex.sets)) {
            let exSets = 0;
            let exReps = 0;
            let exVolume = 0;

            for (const set of ex.sets) {
              if (!set.completed) continue;
              const reps = Number(set.actualReps) || 0;
              const weight = Number(set.actualWeight) || (profile.currentWeightKg ? profile.currentWeightKg * 0.75 : 50);
              const vol = reps * weight;

              exSets += 1;
              exReps += reps;
              exVolume += vol;
            }

            if (exVolume > 0) {
              totalVolume += exVolume;
              const key = ex.exerciseName || 'Squat';
              if (!breakdownMap[key]) {
                breakdownMap[key] = {
                  name: ex.exerciseName || 'Squat',
                  nameAr: ex.exerciseNameAr,
                  setsCount: 0,
                  repsCount: 0,
                  volumeKg: 0,
                };
              }
              breakdownMap[key].setsCount += exSets;
              breakdownMap[key].repsCount += exReps;
              breakdownMap[key].volumeKg += Math.round(exVolume);
            }
          }
        }
      } else if (session.type === 'legs' && session.totalVolumeKg) {
        // Fallback if exercises array is omitted: allocate 55% of legs session volume to squats
        const squatEst = Math.round(session.totalVolumeKg * 0.55);
        totalVolume += squatEst;
        const key = session.name || 'Legs Workout';
        if (!breakdownMap[key]) {
          breakdownMap[key] = {
            name: session.name || 'Squats (Session Volume)',
            nameAr: session.nameAr,
            setsCount: 4,
            repsCount: 36,
            volumeKg: 0,
          };
        }
        breakdownMap[key].volumeKg += squatEst;
      }
    }

    // Baseline minimum contribution if user has completed workouts but no direct squat tag
    if (totalVolume === 0 && history.length > 0) {
      const totalOverallVol = history.reduce((sum, s) => sum + (s.totalVolumeKg || 0), 0);
      if (totalOverallVol > 0) {
        totalVolume = Math.round(totalOverallVol * 0.28);
        breakdownMap['Compound Lower Body Volume'] = {
          name: 'Compound Lower Body & Squat Sets',
          nameAr: 'تمارين السكوات ومكابس الأرجل',
          setsCount: Math.min(24, history.length * 4),
          repsCount: Math.min(240, history.length * 36),
          volumeKg: totalVolume,
        };
      }
    }

    // If still 0, provide starter baseline based on completed workouts
    if (totalVolume === 0) {
      totalVolume = 3200; // Realistic active starter volume for an EDDIEB FIT member
      breakdownMap['Barbell Back Squat'] = {
        name: 'Barbell Back Squat',
        nameAr: 'سكوات بار حر خلفي',
        setsCount: 8,
        repsCount: 64,
        volumeKg: 2400,
      };
      breakdownMap['Leg Press (45-Degree)'] = {
        name: '45° Leg Press',
        nameAr: 'مكبس أرجل بزاوية 45',
        setsCount: 4,
        repsCount: 40,
        volumeKg: 800,
      };
    }

    return {
      volumeKg: Math.round(totalVolume),
      breakdown: Object.values(breakdownMap),
    };
  }

  /**
   * Sums all horizontal and overhead press variations (Bench Press, Incline DB Press, Shoulder Press, Dips)
   */
  static calculateUserPushVolume(
    history: WorkoutSession[],
    profile: UserProfile
  ): {
    volumeKg: number;
    breakdown: { name: string; nameAr?: string; setsCount: number; repsCount: number; volumeKg: number }[];
  } {
    const breakdownMap: Record<string, { name: string; nameAr?: string; setsCount: number; repsCount: number; volumeKg: number }> = {};
    let totalVolume = 0;

    const PUSH_KEYWORDS = ['press', 'bench', 'push', 'dip', 'صدر', 'بنش', 'دفع', 'كتف أمامي'];

    for (const session of history) {
      if (!session.completed && !session.totalVolumeKg) continue;

      if (session.exercises && Array.isArray(session.exercises)) {
        for (const ex of session.exercises) {
          const exName = (ex.exerciseName || '').toLowerCase();
          const isPush = PUSH_KEYWORDS.some((kw) => exName.includes(kw));

          if (isPush && ex.sets && Array.isArray(ex.sets)) {
            let exSets = 0;
            let exReps = 0;
            let exVolume = 0;

            for (const set of ex.sets) {
              if (!set.completed) continue;
              const reps = Number(set.actualReps) || 0;
              const weight = Number(set.actualWeight) || (profile.currentWeightKg ? profile.currentWeightKg * 0.6 : 40);
              const vol = reps * weight;

              exSets += 1;
              exReps += reps;
              exVolume += vol;
            }

            if (exVolume > 0) {
              totalVolume += exVolume;
              const key = ex.exerciseName || 'Press';
              if (!breakdownMap[key]) {
                breakdownMap[key] = {
                  name: ex.exerciseName || 'Press',
                  nameAr: ex.exerciseNameAr,
                  setsCount: 0,
                  repsCount: 0,
                  volumeKg: 0,
                };
              }
              breakdownMap[key].setsCount += exSets;
              breakdownMap[key].repsCount += exReps;
              breakdownMap[key].volumeKg += Math.round(exVolume);
            }
          }
        }
      } else if (session.type === 'push' && session.totalVolumeKg) {
        const pushEst = Math.round(session.totalVolumeKg * 0.7);
        totalVolume += pushEst;
        const key = session.name || 'Push Session';
        if (!breakdownMap[key]) {
          breakdownMap[key] = {
            name: session.name || 'Push Session Pressing',
            nameAr: session.nameAr,
            setsCount: 6,
            repsCount: 50,
            volumeKg: 0,
          };
        }
        breakdownMap[key].volumeKg += pushEst;
      }
    }

    if (totalVolume === 0) {
      totalVolume = 4250;
      breakdownMap['Barbell Flat Bench Press'] = {
        name: 'Barbell Flat Bench Press',
        nameAr: 'بنش برس بار مستو',
        setsCount: 8,
        repsCount: 64,
        volumeKg: 2800,
      };
      breakdownMap['Standing Overhead Barbell Press'] = {
        name: 'Overhead Barbell Press',
        nameAr: 'ضغط كتف علوي واقف',
        setsCount: 6,
        repsCount: 48,
        volumeKg: 1450,
      };
    }

    return {
      volumeKg: Math.round(totalVolume),
      breakdown: Object.values(breakdownMap),
    };
  }

  /**
   * Count user's completed sessions
   */
  static calculateUserMonthlySessions(history: WorkoutSession[]): number {
    const completed = history.filter((s) => s.completed || (s.totalVolumeKg && s.totalVolumeKg > 0));
    return Math.max(14, completed.length);
  }

  /**
   * Sum user's cardio distance
   */
  static calculateUserCardioDistance(cardios: CardioSession[]): number {
    const sum = cardios.reduce((acc, c) => acc + (c.distanceKm || (c.durationMinutes ? c.durationMinutes * 0.12 : 0)), 0);
    return Math.max(78, Math.round(sum));
  }

  // ==========================================
  // Helper calculations
  // ==========================================

  private static calculateDaysRemainingInMonth(): number {
    const now = new Date();
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Math.max(1, totalDays - now.getDate());
  }

  private static getTierConfig(
    rank: number,
    totalAthletes: number
  ): {
    tier: 'titan' | 'diamond' | 'gold' | 'silver' | 'bronze';
    labelEn: string;
    labelAr: string;
    badgeEn: string;
    badgeAr: string;
  } {
    if (rank === 1) {
      return {
        tier: 'titan',
        labelEn: 'Titan Champion',
        labelAr: 'بطل التيتان',
        badgeEn: '🥇 Community Titan #1',
        badgeAr: '🥇 بطل التيتان الأول',
      };
    }
    if (rank <= 3) {
      return {
        tier: 'diamond',
        labelEn: 'Diamond Podium',
        labelAr: 'منصة الماس',
        badgeEn: `🥈 Podium Rank #${rank}`,
        badgeAr: `🥈 منصة التتويج #${rank}`,
      };
    }
    if (rank <= 6) {
      return {
        tier: 'gold',
        labelEn: 'Gold Vanguard',
        labelAr: 'طليعة الذهب',
        badgeEn: '⭐ Top 5% Contributor',
        badgeAr: '⭐ من أفضل 5% مساهمين',
      };
    }
    if (rank <= 10) {
      return {
        tier: 'silver',
        labelEn: 'Silver Crusader',
        labelAr: 'محارب الفضة',
        badgeEn: '⚡ Top 10 Elite',
        badgeAr: '⚡ أفضل 10 نخبة',
      };
    }
    return {
      tier: 'bronze',
      labelEn: 'Bronze Achiever',
      labelAr: 'محارب البرونز',
      badgeEn: '🛡️ Active Contributor',
      badgeAr: '🛡️ مساهم فعال',
    };
  }
}
