import { UserProfile, WorkoutSession, WorkoutDifficultyLevel, DailyReadinessAssessment, MoveSafetyEvaluation } from '../types';
import { PPLEngine } from './pplEngine';
import { StorageService } from './storage';

export interface WeeklyDayPlan {
  id: string; // e.g. 'day_1'
  dayIndex: number; // 0 to 6
  dayName: string; // 'Saturday', 'Sunday', etc.
  dayNameAr: string; // 'السبت', 'الأحد', etc.
  dayNumber: number; // 1 to 7
  splitId: 'push' | 'pull' | 'legs' | 'rest_active' | 'shoulders_arms' | 'upper' | 'lower' | 'full_body' | 'cardio_conditioning';
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  targetMuscles: string[];
  targetMusclesAr: string[];
  estimatedMinutes: number;
  exercisesCount: number;
  exerciseNames: string[];
  exerciseNamesAr: string[];
  color: string;
  isRestDay: boolean;
  isSwapped?: boolean;
}

const STORAGE_KEY_WEEKLY_SCHEDULE = 'eddieb_custom_weekly_schedule_v2';

const DAY_NAMES = [
  { en: 'Saturday', ar: 'السبت' },
  { en: 'Sunday', ar: 'الأحد' },
  { en: 'Monday', ar: 'الإثنين' },
  { en: 'Tuesday', ar: 'الثلاثاء' },
  { en: 'Wednesday', ar: 'الأربعاء' },
  { en: 'Thursday', ar: 'الخميس' },
  { en: 'Friday', ar: 'الجمعة' },
];

export const SPLIT_DEFINITIONS: Record<string, {
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  targetMuscles: string[];
  targetMusclesAr: string[];
  estimatedMinutes: number;
  exercisesCount: number;
  exerciseNames: string[];
  exerciseNamesAr: string[];
  color: string;
  isRestDay: boolean;
}> = {
  push: {
    title: 'Chest, Shoulders & Triceps',
    titleAr: 'تمرين الصدر والأكتاف والترايسبس',
    subtitle: 'Upper chest development, shoulder cap, and triceps press',
    subtitleAr: 'تركيز على زوايا الصدر العلوية، استدارة الكتف وقوة الترايسبس',
    targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
    targetMusclesAr: ['الصدر', 'الأكتاف', 'الترايسبس'],
    estimatedMinutes: 52,
    exercisesCount: 5,
    exerciseNames: ['Incline DB Press', 'Flat Barbell Press', 'DB Lateral Raise', 'Overhead Press', 'Tricep Rope Pushdown'],
    exerciseNamesAr: ['تجميع دمبل بنش مائل', 'ضغط بار مستوي', 'رفرفة جانبي بالدمبل', 'ضغط بار للأكتاف', 'ترايسبس كابل'],
    color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
    isRestDay: false,
  },
  pull: {
    title: 'Back, Lats & Biceps',
    titleAr: 'تمرين عضلات الظهر واللاتس والبايسبس',
    subtitle: 'Back thickness, V-taper lats width, and biceps overload',
    subtitleAr: 'بناء عرض اللاتس وكثافة الظهر وتطوير عضلات البايسبس',
    targetMuscles: ['Lats', 'Upper Back', 'Rear Delts', 'Biceps'],
    targetMusclesAr: ['اللاتس', 'أعلى الظهر', 'الكتف الخلفي', 'البايسبس'],
    estimatedMinutes: 50,
    exercisesCount: 5,
    exerciseNames: ['Lat Pulldown', 'Seated Cable Row', 'Chest Supported DB Row', 'Face Pulls', 'Incline Dumbbell Curl'],
    exerciseNamesAr: ['سحب ظهر أمامي واسع', 'سحب كابل جالس', 'تجديف دمبل مائل', 'فيس بول للكتف الخلفي', 'بايسبس دمبل بنش مائل'],
    color: 'from-blue-500/20 to-sky-500/20 text-blue-400 border-blue-500/30',
    isRestDay: false,
  },
  legs: {
    title: 'Legs, Quads & Hamstrings (Joint-Safe)',
    titleAr: 'تمرين الأرجل (آمن للركبة وأسفل الظهر)',
    subtitle: 'Back-supported leg press, hamstring curls, goblet squats & calves',
    subtitleAr: 'دفع الأرجل مسنود الظهر، مرجحة خلفي، جوبلت سكوات وسمانة بأمان للمفاصل',
    targetMuscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
    targetMusclesAr: ['الفخذ الأمامي', 'الفخذ الخلفي', 'المؤخرة', 'السمانة'],
    estimatedMinutes: 50,
    exercisesCount: 5,
    exerciseNames: ['Leg Press (Back-Supported)', 'Leg Curl', 'Goblet Squat', 'Leg Extension', 'Calf Raise'],
    exerciseNamesAr: ['دفع أرجل مسنود الظهر', 'مرجحة أرجل خلفي', 'جوبلت سكوات بالدمبل', 'فرد أرجل أمامي', 'سمانة واقف'],
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    isRestDay: false,
  },
  upper: {
    title: 'Upper Body Power & V-Taper',
    titleAr: 'تمرين جزء علوي شامل (Upper Body)',
    subtitle: 'Balanced Torso Compound Volume',
    subtitleAr: 'دمج شامل لعضلات الصدر والظهر والأكتاف في جلسة واحدة',
    targetMuscles: ['Chest', 'Back', 'Shoulders', 'Arms'],
    targetMusclesAr: ['الصدر', 'الظهر', 'الأكتاف', 'الذراعين'],
    estimatedMinutes: 52,
    exercisesCount: 6,
    exerciseNames: ['Incline DB Press', 'Lat Pulldown', 'DB Shoulder Press', 'Seated Cable Row', 'Bicep/Tricep Superset'],
    exerciseNamesAr: ['تجميع دمبل مائل', 'سحب ظهر عالي واسع', 'ضغط أكتاف دمبل', 'سحب كابل جالس', 'بايسبس وترايسبس'],
    color: 'from-purple-500/20 to-violet-500/20 text-purple-400 border-purple-500/30',
    isRestDay: false,
  },
  lower: {
    title: 'Lower Body & Glutes (Low-Stress)',
    titleAr: 'جزء سفلي وحوض (ضغط منخفض على المفاصل)',
    subtitle: 'Controlled Glute, Hamstring & Quad Machine Work',
    subtitleAr: 'تركيز على تقوية العضلات مع حماية الركبة وأسفل الظهر',
    targetMuscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
    targetMusclesAr: ['الأرجل', 'الخلفيات', 'المؤخرة', 'السمانة'],
    estimatedMinutes: 45,
    exercisesCount: 5,
    exerciseNames: ['Leg Press', 'Glute Bridge', 'Lying Hamstring Curl', 'Standing Calf Raise', 'Core Deadbug'],
    exerciseNamesAr: ['دفع أرجل مسنود', 'جسر الأرداف', 'مرجحة خلفي', 'سمانة واقف', 'تمرين ديدباج للكور'],
    color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
    isRestDay: false,
  },
  shoulders_arms: {
    title: 'Shoulders & Arms Hypertrophy',
    titleAr: 'تمرين تخصصي للأكتاف والذراعين',
    subtitle: 'Cannonball Delts & Peak Bicep/Tricep Growth',
    subtitleAr: 'عزل كامل لزوايا الكتف الثلاث وتفجير نمو الذراعين',
    targetMuscles: ['Lateral Delts', 'Rear Delts', 'Biceps', 'Triceps'],
    targetMusclesAr: ['الأكتاف الجانبية', 'الأكتاف الخلفية', 'البايسبس', 'الترايسبس'],
    estimatedMinutes: 45,
    exercisesCount: 5,
    exerciseNames: ['Seated DB Overhead Press', 'Cable Lateral Raise', 'Incline Hammer Curl', 'Skull Crushers', 'Rope Pushdown'],
    exerciseNamesAr: ['ضغط أكتاف دمبل جالس', 'رفرفة كابل جانبي', 'هامر كيرل بنش مائل', 'سكال كراشر ترايسبس', 'ترايسبس كابل'],
    color: 'from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30',
    isRestDay: false,
  },
  rest_active: {
    title: 'Active Recovery & Low-Impact Cardio',
    titleAr: 'استشفاء نشط ومشي أو دراجة خفيفة',
    subtitle: 'Tissue Repair, Zone 2 Bike/Walk & Mobility',
    subtitleAr: 'استشفاء المفاصل والعضلات مع كارديو منخفض الصدمات',
    targetMuscles: ['Core', 'Hip Mobility', 'Zone 2 Cardio'],
    targetMusclesAr: ['الكور', 'مرونة الحوض', 'كارديو زون 2'],
    estimatedMinutes: 30,
    exercisesCount: 4,
    exerciseNames: ['Stationary Bike / Treadmill Walk (25m)', 'Plank & Anti-Extension', 'Deadbugs', 'Full-Body Mobility Stretch'],
    exerciseNamesAr: ['دراجة ثابتة أو مشي سير (25 د)', 'بلانك وثبات الجذع', 'تمرين ديدباج للكور', 'إطالات ومرونة شاملة'],
    color: 'from-slate-500/20 to-zinc-500/20 text-slate-300 border-slate-500/30',
    isRestDay: true,
  },
  cardio_conditioning: {
    title: 'Low-Impact Zone 2 Cardio (Bike & Walk)',
    titleAr: 'كارديو منخفض الصدمات (دراجة ثابتة ومشي)',
    subtitle: 'Joint-Safe Fat Oxidation & Cardiovascular Endurance',
    subtitleAr: 'حرق دهون مستدام على الدراجة أو المشاية بدون ضغط على الركبة',
    targetMuscles: ['Cardiovascular', 'Core Stability'],
    targetMusclesAr: ['الجهاز القلبي', 'ثبات الكور'],
    estimatedMinutes: 35,
    exercisesCount: 3,
    exerciseNames: ['Stationary Bike (20-30m Zone 2)', 'Treadmill Incline Walk (10-15m)', 'Core Stability Plank'],
    exerciseNamesAr: ['دراجة ثابتة (20-30 د زون 2)', 'مشي مائل على السير (10-15 د)', 'بلانك ثابت للكور'],
    color: 'from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30',
    isRestDay: true,
  },
};

export const WeeklyScheduleService = {
  // Generate a default 7-day schedule based on training frequency
  getDefaultSchedule(daysPerWeek: number = 4): WeeklyDayPlan[] {
    // 4-day PPL+Upper split by default
    let splitSequence: (keyof typeof SPLIT_DEFINITIONS)[] = [];

    if (daysPerWeek <= 3) {
      splitSequence = ['push', 'rest_active', 'pull', 'rest_active', 'legs', 'rest_active', 'rest_active'];
    } else if (daysPerWeek === 4) {
      // 4 days: Push, Pull, Rest, Legs, Upper, Rest, Rest
      splitSequence = ['push', 'pull', 'rest_active', 'legs', 'upper', 'rest_active', 'rest_active'];
    } else if (daysPerWeek === 5) {
      // 5 days: Push, Pull, Legs, Rest, Upper, Lower, Rest
      splitSequence = ['push', 'pull', 'legs', 'rest_active', 'upper', 'lower', 'rest_active'];
    } else {
      // 6 days: Push, Pull, Legs, Push, Pull, Legs, Rest
      splitSequence = ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'rest_active'];
    }

    return splitSequence.map((splitId, idx) => {
      const def = SPLIT_DEFINITIONS[splitId] || SPLIT_DEFINITIONS.push;
      const dayNameInfo = DAY_NAMES[idx % 7];

      return {
        id: `day_${idx + 1}`,
        dayIndex: idx,
        dayName: dayNameInfo.en,
        dayNameAr: dayNameInfo.ar,
        dayNumber: idx + 1,
        splitId: splitId as any,
        title: def.title,
        titleAr: def.titleAr,
        subtitle: def.subtitle,
        subtitleAr: def.subtitleAr,
        targetMuscles: def.targetMuscles,
        targetMusclesAr: def.targetMusclesAr,
        estimatedMinutes: def.estimatedMinutes,
        exercisesCount: def.exercisesCount,
        exerciseNames: def.exerciseNames,
        exerciseNamesAr: def.exerciseNamesAr,
        color: def.color,
        isRestDay: def.isRestDay,
        isSwapped: false,
      };
    });
  },

  // Load custom weekly schedule or return default
  getWeeklySchedule(profile: UserProfile): WeeklyDayPlan[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WEEKLY_SCHEDULE);
      if (raw) {
        const parsed: WeeklyDayPlan[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === 7) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load custom weekly schedule:', e);
    }

    const defaultSched = this.getDefaultSchedule(profile.trainingDaysPerWeek || 4);
    this.saveWeeklySchedule(defaultSched);
    return defaultSched;
  },

  // Save weekly schedule to storage
  saveWeeklySchedule(schedule: WeeklyDayPlan[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_WEEKLY_SCHEDULE, JSON.stringify(schedule));
    } catch (e) {
      console.error('Failed to save weekly schedule:', e);
    }
  },

  // Swap two days in the weekly schedule visually
  swapDays(dayAIndex: number, dayBIndex: number, profile: UserProfile): WeeklyDayPlan[] {
    const current = this.getWeeklySchedule(profile);
    if (
      dayAIndex < 0 || dayAIndex >= current.length ||
      dayBIndex < 0 || dayBIndex >= current.length ||
      dayAIndex === dayBIndex
    ) {
      return current;
    }

    const dayA = current[dayAIndex];
    const dayB = current[dayBIndex];

    // Swap their workout routines while retaining day names & index
    const newDayA: WeeklyDayPlan = {
      ...dayA,
      splitId: dayB.splitId,
      title: dayB.title,
      titleAr: dayB.titleAr,
      subtitle: dayB.subtitle,
      subtitleAr: dayB.subtitleAr,
      targetMuscles: dayB.targetMuscles,
      targetMusclesAr: dayB.targetMusclesAr,
      estimatedMinutes: dayB.estimatedMinutes,
      exercisesCount: dayB.exercisesCount,
      exerciseNames: dayB.exerciseNames,
      exerciseNamesAr: dayB.exerciseNamesAr,
      color: dayB.color,
      isRestDay: dayB.isRestDay,
      isSwapped: true,
    };

    const newDayB: WeeklyDayPlan = {
      ...dayB,
      splitId: dayA.splitId,
      title: dayA.title,
      titleAr: dayA.titleAr,
      subtitle: dayA.subtitle,
      subtitleAr: dayA.subtitleAr,
      targetMuscles: dayA.targetMuscles,
      targetMusclesAr: dayA.targetMusclesAr,
      estimatedMinutes: dayA.estimatedMinutes,
      exercisesCount: dayA.exercisesCount,
      exerciseNames: dayA.exerciseNames,
      exerciseNamesAr: dayA.exerciseNamesAr,
      color: dayA.color,
      isRestDay: dayA.isRestDay,
      isSwapped: true,
    };

    const updated = [...current];
    updated[dayAIndex] = newDayA;
    updated[dayBIndex] = newDayB;

    this.saveWeeklySchedule(updated);

    // Record substitution in storage for history
    StorageService.addWorkoutSubstitution({
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: 'day_swap',
      originalItem: `${dayA.dayName}: ${dayA.title}`,
      originalItemAr: `${dayA.dayNameAr}: ${dayA.titleAr}`,
      newItem: `${dayB.dayName}: ${dayB.title}`,
      newItemAr: `${dayB.dayNameAr}: ${dayB.titleAr}`,
      reason: 'User weekly day swap via interactive planner',
      reasonAr: `تبديل مرن بين ${dayA.dayNameAr} و ${dayB.dayNameAr}`,
      targetMuscleGroup: `${dayA.targetMuscles.join(', ')} <-> ${dayB.targetMuscles.join(', ')}`,
    });

    return updated;
  },

  // Change a single day's routine
  changeDaySplit(dayIndex: number, newSplitId: string, profile: UserProfile): WeeklyDayPlan[] {
    const current = this.getWeeklySchedule(profile);
    if (dayIndex < 0 || dayIndex >= current.length) return current;

    const def = SPLIT_DEFINITIONS[newSplitId];
    if (!def) return current;

    const target = current[dayIndex];
    const updatedDay: WeeklyDayPlan = {
      ...target,
      splitId: newSplitId as any,
      title: def.title,
      titleAr: def.titleAr,
      subtitle: def.subtitle,
      subtitleAr: def.subtitleAr,
      targetMuscles: def.targetMuscles,
      targetMusclesAr: def.targetMusclesAr,
      estimatedMinutes: def.estimatedMinutes,
      exercisesCount: def.exercisesCount,
      exerciseNames: def.exerciseNames,
      exerciseNamesAr: def.exerciseNamesAr,
      color: def.color,
      isRestDay: def.isRestDay,
      isSwapped: true,
    };

    const updated = [...current];
    updated[dayIndex] = updatedDay;
    this.saveWeeklySchedule(updated);
    return updated;
  },

  // Reset to default
  resetSchedule(profile: UserProfile): WeeklyDayPlan[] {
    const defaultSched = this.getDefaultSchedule(profile.trainingDaysPerWeek || 4);
    this.saveWeeklySchedule(defaultSched);
    return defaultSched;
  },

  // Build a concrete workout session for a given day in the weekly plan
  buildWorkoutForDay(
    day: WeeklyDayPlan,
    profile: UserProfile,
    history: WorkoutSession[],
    difficultyLevel: WorkoutDifficultyLevel = 'standard',
    readiness?: DailyReadinessAssessment | null
  ): WorkoutSession {
    return PPLEngine.buildAdaptiveWorkout({
      profile,
      history,
      splitId: day.splitId,
      difficultyLevel,
      readiness,
      customName: `${day.dayName}: ${day.title}`,
      customNameAr: `${day.dayNameAr}: ${day.titleAr}`,
    });
  },

  // Evaluate if swapping/moving dayA and dayB is GREEN, YELLOW, or RED for recovery
  evaluateMoveSafety(
    sourceDayIndex: number,
    targetDayIndex: number,
    schedule: WeeklyDayPlan[]
  ): MoveSafetyEvaluation {
    if (
      sourceDayIndex < 0 ||
      sourceDayIndex >= schedule.length ||
      targetDayIndex < 0 ||
      targetDayIndex >= schedule.length ||
      sourceDayIndex === targetDayIndex
    ) {
      return {
        rating: 'green',
        labelEn: 'Recommended',
        labelAr: 'مناسب',
        reasonEn: 'Valid schedule option.',
        reasonAr: 'خيار مناسب في الجدول.',
      };
    }

    // Build hypothetical swapped schedule
    const simulated = [...schedule];
    const tempA = { ...schedule[sourceDayIndex], splitId: schedule[targetDayIndex].splitId, isRestDay: schedule[targetDayIndex].isRestDay };
    const tempB = { ...schedule[targetDayIndex], splitId: schedule[sourceDayIndex].splitId, isRestDay: schedule[sourceDayIndex].isRestDay };
    simulated[sourceDayIndex] = tempA;
    simulated[targetDayIndex] = tempB;

    const muscleFamilies = (splitId: WeeklyDayPlan['splitId']): string[] => {
      switch (splitId) {
        case 'push': return ['push_chest', 'shoulders', 'triceps'];
        case 'pull': return ['pull_back', 'biceps'];
        case 'legs': return ['legs_knee_back'];
        case 'lower': return ['legs_knee_back'];
        case 'upper': return ['push_chest', 'pull_back', 'shoulders', 'biceps', 'triceps'];
        case 'shoulders_arms': return ['shoulders', 'biceps', 'triceps'];
        case 'full_body': return ['push_chest', 'pull_back', 'legs_knee_back'];
        default: return [];
      }
    };

    const checkPair = (idx1: number, idx2: number): MoveSafetyEvaluation | null => {
      const a = simulated[idx1];
      const b = simulated[idx2];
      if (a.isRestDay || b.isRestDay) return null;

      const famA = muscleFamilies(a.splitId);
      const famB = muscleFamilies(b.splitId);

      // RED: Same heavy lower-body stress back-to-back or exact same split back-to-back
      if (famA.includes('legs_knee_back') && famB.includes('legs_knee_back')) {
        return {
          rating: 'red',
          labelEn: 'Not Recommended',
          labelAr: 'غير موصى به',
          reasonEn: `${a.dayName} & ${b.dayName} put heavy knee/lower-back leg work back-to-back.`,
          reasonAr: `تتابع ${a.dayNameAr} و ${b.dayNameAr} يضع ضغطاً متتالياً على الركبتين وأسفل الظهر.`,
        };
      }
      if (a.splitId === b.splitId) {
        return {
          rating: 'red',
          labelEn: 'Not Recommended',
          labelAr: 'غير موصى به',
          reasonEn: `Same muscle group (${a.splitId}) scheduled two days in a row without 48h recovery.`,
          reasonAr: `نفس العضلات متكررة يومين متتاليين بدون 48 ساعة استشفاء.`,
        };
      }

      // YELLOW: Partial overlap (e.g. Push adjacent to Upper or Shoulders & Arms)
      const shared = famA.filter((f) => famB.includes(f));
      if (shared.length > 0) {
        return {
          rating: 'yellow',
          labelEn: 'Caution',
          labelAr: 'مقبول بحذر',
          reasonEn: `Partial upper-body overlap between ${a.dayName} & ${b.dayName}; keep intensity controlled.`,
          reasonAr: `تداخل جزئي لعضلات الجزء العلوي بين ${a.dayNameAr} و ${b.dayNameAr}—خفف الشدة قليلاً.`,
        };
      }

      return null;
    };

    // Check adjacent pairs around both affected indices (including wrap-around week)
    let worst: MoveSafetyEvaluation | null = null;
    const indicesToInspect = [sourceDayIndex, targetDayIndex];
    for (const idx of indicesToInspect) {
      const prevIdx = (idx + 6) % 7;
      const nextIdx = (idx + 1) % 7;
      const c1 = checkPair(prevIdx, idx);
      const c2 = checkPair(idx, nextIdx);
      for (const candidate of [c1, c2]) {
        if (!candidate) continue;
        if (candidate.rating === 'red') return candidate;
        if (candidate.rating === 'yellow') worst = candidate;
      }
    }

    if (worst) return worst;

    return {
      rating: 'green',
      labelEn: 'Recommended',
      labelAr: 'موصى به (آمن)',
      reasonEn: 'Clean 48h+ muscle recovery spacing and joint-safe week order.',
      reasonAr: 'توزيع ممتاز يضمن 48 ساعة راحة للعضلات وحماية للمفاصل.',
    };
  },

  // One-tap: "Rest Today & Train Tomorrow" — moves today's workout to tomorrow cleanly
  restTodayTrainTomorrow(todayIndex: number, profile: UserProfile): WeeklyDayPlan[] {
    const current = this.getWeeklySchedule(profile);
    const tomorrowIndex = (todayIndex + 1) % 7;
    const todayPlan = current[todayIndex];
    if (!todayPlan || todayPlan.isRestDay) {
      return current;
    }

    const tomorrowPlan = current[tomorrowIndex];
    // If tomorrow is already a rest day, swap today <-> tomorrow cleanly
    if (tomorrowPlan.isRestDay) {
      return this.swapDays(todayIndex, tomorrowIndex, profile);
    }

    // Otherwise shift remaining days or place today's workout on tomorrow & mark today rest_active
    const updated = [...current];
    const restDef = SPLIT_DEFINITIONS.rest_active;

    // Push today's workout into tomorrow, and look for nearest rest slot in week to absorb tomorrow's workout
    const restSlotIdx = current.findIndex((d, idx) => idx !== todayIndex && idx !== tomorrowIndex && d.isRestDay);
    if (restSlotIdx >= 0) {
      const oldTomorrow = { ...tomorrowPlan };
      updated[tomorrowIndex] = {
        ...tomorrowPlan,
        splitId: todayPlan.splitId,
        title: todayPlan.title,
        titleAr: todayPlan.titleAr,
        subtitle: todayPlan.subtitle,
        subtitleAr: todayPlan.subtitleAr,
        targetMuscles: todayPlan.targetMuscles,
        targetMusclesAr: todayPlan.targetMusclesAr,
        estimatedMinutes: todayPlan.estimatedMinutes,
        exercisesCount: todayPlan.exercisesCount,
        exerciseNames: todayPlan.exerciseNames,
        exerciseNamesAr: todayPlan.exerciseNamesAr,
        color: todayPlan.color,
        isRestDay: false,
        isSwapped: true,
      };
      updated[restSlotIdx] = {
        ...updated[restSlotIdx],
        splitId: oldTomorrow.splitId,
        title: oldTomorrow.title,
        titleAr: oldTomorrow.titleAr,
        subtitle: oldTomorrow.subtitle,
        subtitleAr: oldTomorrow.subtitleAr,
        targetMuscles: oldTomorrow.targetMuscles,
        targetMusclesAr: oldTomorrow.targetMusclesAr,
        estimatedMinutes: oldTomorrow.estimatedMinutes,
        exercisesCount: oldTomorrow.exercisesCount,
        exerciseNames: oldTomorrow.exerciseNames,
        exerciseNamesAr: oldTomorrow.exerciseNamesAr,
        color: oldTomorrow.color,
        isRestDay: false,
        isSwapped: true,
      };
    } else {
      // Direct swap with tomorrow if all 7 days are active
      return this.swapDays(todayIndex, tomorrowIndex, profile);
    }

    updated[todayIndex] = {
      ...todayPlan,
      splitId: 'rest_active',
      title: restDef.title,
      titleAr: restDef.titleAr,
      subtitle: restDef.subtitle,
      subtitleAr: restDef.subtitleAr,
      targetMuscles: restDef.targetMuscles,
      targetMusclesAr: restDef.targetMusclesAr,
      estimatedMinutes: restDef.estimatedMinutes,
      exercisesCount: restDef.exercisesCount,
      exerciseNames: restDef.exerciseNames,
      exerciseNamesAr: restDef.exerciseNamesAr,
      color: restDef.color,
      isRestDay: true,
      isSwapped: true,
    };

    this.saveWeeklySchedule(updated);
    return updated;
  },

  // Get concise low-impact cardio recommendation for any day
  getRecommendedCardioForDay(day: WeeklyDayPlan): { labelEn: string; labelAr: string } {
    if (day.splitId === 'legs' || day.splitId === 'lower') {
      return {
        labelEn: '15 min Stationary Bike (easy spin cooldown)',
        labelAr: '15 دقيقة دراجة ثابتة (تهدئة خفيفة بدون ضغط على الركبة)',
      };
    }
    if (day.isRestDay) {
      return {
        labelEn: '25–30 min Stationary Bike or Treadmill Walk (Zone 2)',
        labelAr: '25–30 دقيقة دراجة ثابتة أو مشي على السير (زون 2)',
      };
    }
    return {
      labelEn: '20 min Treadmill Incline Walk (6–8%) or Stationary Bike post-lifting',
      labelAr: '20 دقيقة مشي بميل خفيف (6–8%) أو دراجة ثابتة بعد التمرين',
    };
  },

  // Get current day of week index (0 for Saturday, 1 for Sunday, ..., 6 for Friday)
  getTodayDayIndex(): number {
    const jsDay = new Date().getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    // Map to Saturday-based week: Saturday = 0, Sunday = 1, ..., Friday = 6
    const map = [1, 2, 3, 4, 5, 6, 0];
    return map[jsDay];
  },
};
