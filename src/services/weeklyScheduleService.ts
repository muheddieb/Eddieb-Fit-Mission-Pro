import { UserProfile, WorkoutSession, WorkoutDifficultyLevel } from '../types';
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
    title: 'Legs, Quads & Hamstrings',
    titleAr: 'تمرين الأرجل وعضلات الفخذ والخلفيات',
    subtitle: 'Lower body foundation, quad sweep, and hamstrings power',
    subtitleAr: 'تطوير عضلات الفخذ الأمامية والخلفية وسلسلة الحركة السفلية',
    targetMuscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
    targetMusclesAr: ['الفخذ الأمامي', 'الفخذ الخلفي', 'المؤخرة', 'السمانة'],
    estimatedMinutes: 55,
    exercisesCount: 5,
    exerciseNames: ['Barbell Squat / Hack Squat', 'Romanian Deadlift (RDL)', 'Leg Press', 'Leg Extension', 'Seated Calf Raise'],
    exerciseNamesAr: ['سكوات بار / هاك سكوات', 'ديدليفت روماني RDL', 'دفع أجهزة الأرجل', 'فرد أرجل أمامي', 'سمانة جالس'],
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
    estimatedMinutes: 55,
    exercisesCount: 6,
    exerciseNames: ['Incline DB Press', 'Weighted Pull-Ups / Pulldown', 'DB Shoulder Press', 'Cable Row', 'Bicep/Tricep Superset'],
    exerciseNamesAr: ['تجميع دمبل مائل', 'عقلة / سحب ظهر واسع', 'ضغط أكتاف دمبل', 'سحب كابل', 'سوبر ست باي وتراي'],
    color: 'from-purple-500/20 to-violet-500/20 text-purple-400 border-purple-500/30',
    isRestDay: false,
  },
  lower: {
    title: 'Lower Body & Core Stability',
    titleAr: 'تمرين جزء سفلي وكور (Lower Body)',
    subtitle: 'Leg Foundation & Trunk Rigidity',
    subtitleAr: 'تركيز على توازن القوة السفلية واستقرار الجذع والكور',
    targetMuscles: ['Quads', 'Hamstrings', 'Calves', 'Core'],
    targetMusclesAr: ['الأرجل', 'الخلفيات', 'السمانة', 'عضلات الكور'],
    estimatedMinutes: 50,
    exercisesCount: 5,
    exerciseNames: ['Front/Goblet Squat', 'Lying Hamstring Curl', 'Bulgarian Split Squat', 'Standing Calf Raise', 'Hanging Leg Raise'],
    exerciseNamesAr: ['جوبلت سكوات', 'مرجحة أرجل خلفي نائم', 'سكوات بلغاري منفرد', 'سمانة واقف', 'رفع أرجل للكور'],
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
    estimatedMinutes: 48,
    exercisesCount: 5,
    exerciseNames: ['Seated DB Overhead Press', 'Cable Lateral Raise', 'Incline Hammer Curl', 'Skull Crushers', 'Spider Curl'],
    exerciseNamesAr: ['ضغط أكتاف دمبل جالس', 'رفرفة كابل جانبي', 'هامر كيرل بنش مائل', 'سكال كراشر ترايسبس', 'سبايدر كيرل للباي'],
    color: 'from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30',
    isRestDay: false,
  },
  rest_active: {
    title: 'Active Recovery & Core Mobility',
    titleAr: 'استشفاء نشط، كور، وكارديو خفيف',
    subtitle: 'Tissue Repair, Zone 2 Cardio & Mobility',
    subtitleAr: 'إصلاح الألياف العضلية، تحسين مرونة المفاصل والكارديو الصحي',
    targetMuscles: ['Core', 'Hip Flexors', 'Cardiovascular'],
    targetMusclesAr: ['الكور', 'مرونة الحوض', 'الجهاز الدوري'],
    estimatedMinutes: 35,
    exercisesCount: 4,
    exerciseNames: ['Plank & Anti-Extension', 'Treadmill Incline Zone 2', 'Foam Rolling & Hip Mobility', 'Deadbugs'],
    exerciseNamesAr: ['بلانك وثبات الجذع', 'كارديو مشي مائل زون 2', 'فوم رولر ومرونة المفاصل', 'تمرين ديدباج للكور'],
    color: 'from-slate-500/20 to-zinc-500/20 text-slate-300 border-slate-500/30',
    isRestDay: true,
  },
  cardio_conditioning: {
    title: 'Cardio & HIIT Conditioning',
    titleAr: 'كارديو مكثف وتحمل هوائي (HIIT)',
    subtitle: 'Fat Oxidation & High VO2 Max Work',
    subtitleAr: 'حرق دهون مكثف، رفع السعة الرئوية واللياقة القلبية',
    targetMuscles: ['Cardiovascular', 'Full Body Conditioning'],
    targetMusclesAr: ['الجهاز القلبي التنفسي', 'اللياقة الشاملة'],
    estimatedMinutes: 40,
    exercisesCount: 3,
    exerciseNames: ['Incline Treadmill Sprints', 'Rower Intervals', 'Core Circuit'],
    exerciseNamesAr: ['سبرينتات سير مائل', 'تجديف هوائي فترات', 'دائرة عضلات بطن'],
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
    difficultyLevel: WorkoutDifficultyLevel = 'standard'
  ): WorkoutSession {
    return PPLEngine.buildAdaptiveWorkout({
      profile,
      history,
      splitId: day.splitId,
      difficultyLevel,
      customName: `${day.dayName}: ${day.title}`,
      customNameAr: `${day.dayNameAr}: ${day.titleAr}`,
    });
  },

  // Get current day of week index (0 for Saturday, 1 for Sunday, ..., 6 for Friday)
  getTodayDayIndex(): number {
    const jsDay = new Date().getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    // Map to Saturday-based week: Saturday = 0, Sunday = 1, ..., Friday = 6
    const map = [1, 2, 3, 4, 5, 6, 0];
    return map[jsDay];
  },
};
