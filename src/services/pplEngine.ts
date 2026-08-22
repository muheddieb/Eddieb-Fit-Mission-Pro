import { 
  Exercise, 
  WorkoutSession, 
  WorkoutExercise, 
  SetLog, 
  UserProfile, 
  BodyMeasurement 
} from '../types';
import { exerciseSeedData } from '../data/exerciseSeed';
import { calculateProgramProgress, parseDateAtMidnight } from './dateUtils';

export interface ProgressionAdvice {
  recommendedWeight: number;
  recommendedReps: string;
  recommendedRpe: number;
  reason: string;
  reasonAr: string;
  status: 'increase' | 'maintain' | 'deload' | 'baseline';
}

export interface TransitionPhaseInfo {
  currentWeek: number;
  currentDayInWeek: number;
  totalProgramDay: number;
  totalDaysElapsed: number;
  cycleNumber: number;
  weekInCycle: number;
  startDate: string;
  formattedProgress: string;
  formattedProgressAr: string;
  phaseTitle: string;
  phaseTitleAr: string;
  focusDirectives: string[];
  focusDirectivesAr: string[];
  calorieAdjustment: string;
  calorieAdjustmentAr: string;
  cardioRecommendation: string;
  cardioRecommendationAr: string;
}

export interface WeeklyVolumeSession {
  id: string;
  date: string;
  dayName: string;
  dayNameAr: string;
  name: string;
  nameAr: string;
  type: string;
  volumeKg: number;
  setsCount: number;
  completed: boolean;
}

export interface WeeklyVolumeInfo {
  currentWeekVolumeKg: number;
  currentWeekVolumeTons: number;
  previousWeekVolumeKg: number;
  volumeDeltaKg: number;
  volumeDeltaPercent: number;
  totalSetsCompleted: number;
  totalRepsCompleted: number;
  workoutsInWeekCount: number;
  avgVolumePerWorkoutKg: number;
  status: 'overload_achieved' | 'steady_maintenance' | 'volume_deload' | 'baseline';
  statusBadge: string;
  statusBadgeAr: string;
  feedback: string;
  feedbackAr: string;
  sessionBreakdown: WeeklyVolumeSession[];
}

export const PPLEngine = {
  // Get all exercises
  getAllExercises(): Exercise[] {
    return exerciseSeedData;
  },

  getExerciseById(id: string): Exercise | undefined {
    return exerciseSeedData.find(e => e.id === id);
  },

  // Get alternative or substitute exercises in same muscle group/category
  getAlternativeExercises(exerciseId: string): Exercise[] {
    const current = this.getExerciseById(exerciseId);
    if (!current) return [];
    return exerciseSeedData.filter(
      e => e.id !== exerciseId && (e.category === current.category || e.primaryMuscle === current.primaryMuscle)
    );
  },

  // Determine today's PPL phase based on history and training days
  getTodayPPLPhase(history: WorkoutSession[], profile: UserProfile): 'push' | 'pull' | 'legs' | 'rest_active' {
    const completedWorkouts = history.filter(w => w.completed);
    if (completedWorkouts.length === 0) return 'push';

    const lastWorkout = completedWorkouts[0];
    const today = new Date().toISOString().split('T')[0];

    // If today already has a completed workout, show rest or next
    if (lastWorkout.date === today) {
      return 'rest_active';
    }

    const lastType = lastWorkout.type;
    if (lastType === 'push') return 'pull';
    if (lastType === 'pull') return 'legs';
    if (lastType === 'legs') {
      // Depending on frequency (e.g., 4 days vs 6 days)
      if (profile.trainingDaysPerWeek <= 4) {
        return 'rest_active';
      }
      return 'push';
    }

    return 'push';
  },

  // Build a complete, structured daily workout session
  buildDailyWorkout(profile: UserProfile, history: WorkoutSession[]): WorkoutSession {
    const today = new Date().toISOString().split('T')[0];
    const phase = this.getTodayPPLPhase(history, profile);

    let sessionName = 'Push Session (Chest, Shoulders, Triceps)';
    let sessionNameAr = 'تمرينة دفع (الصدر، الأكتاف، الترايسبس)';
    let targetCategory: 'push' | 'pull' | 'legs' | 'core' | 'recovery' = 'push';

    if (phase === 'pull') {
      sessionName = 'Pull Session (Back, Rear Delts, Biceps)';
      sessionNameAr = 'تمرينة سحب (الظهر، الكتف الخلفي، البايسبس)';
      targetCategory = 'pull';
    } else if (phase === 'legs') {
      sessionName = 'Legs Session (Quads, Hamstrings, Calves)';
      sessionNameAr = 'تمرينة أرجل (الفخذ الأمامي والخلفي والسمانة)';
      targetCategory = 'legs';
    } else if (phase === 'rest_active') {
      sessionName = 'Active Recovery & Core Session';
      sessionNameAr = 'استشفاء نشط وتمارين كور ومرونة';
      targetCategory = 'core';
    }

    // Select candidate exercises matching category, location, and equipment
    const isHome = profile.preferredLocation === 'home';
    const exercisesInCat = exerciseSeedData.filter(e => {
      if (phase === 'rest_active') {
        return e.category === 'core' || e.category === 'recovery';
      }
      return e.category === targetCategory;
    });

    // Select primary compound, secondary, and isolations
    const selectedExercises: Exercise[] = [];
    
    if (phase === 'push') {
      const flatPress = isHome 
        ? (this.getExerciseById('push_pushups') || exercisesInCat[0])
        : (this.getExerciseById('push_barbell_bench_press') || exercisesInCat[0]);
      const inclinePress = isHome
        ? (this.getExerciseById('push_dumbbell_incline_press') || exercisesInCat[1])
        : (this.getExerciseById('push_dumbbell_incline_press') || exercisesInCat[1]);
      const shoulderPress = isHome
        ? (this.getExerciseById('push_seated_dumbbell_shoulder_press') || exercisesInCat[2])
        : (this.getExerciseById('push_overhead_barbell_press') || exercisesInCat[2]);
      const lateralRaise = this.getExerciseById('push_lateral_raises');
      const tricepIso = isHome
        ? (this.getExerciseById('push_skull_crushers') || exercisesInCat[3])
        : (this.getExerciseById('push_tricep_rope_pushdown') || exercisesInCat[3]);

      [flatPress, inclinePress, shoulderPress, lateralRaise, tricepIso].forEach(ex => {
        if (ex && !selectedExercises.some(s => s.id === ex.id)) selectedExercises.push(ex);
      });
    } else if (phase === 'pull') {
      const heavyRow = this.getExerciseById('pull_barbell_bent_row') || exercisesInCat[0];
      const pulldown = this.getExerciseById('pull_lat_pulldown') || exercisesInCat[1];
      const cableRow = this.getExerciseById('pull_seated_cable_row') || exercisesInCat[2];
      const facePull = this.getExerciseById('pull_face_pulls');
      const bicepCurl = this.getExerciseById('pull_incline_dumbbell_curl');
      const hammerCurl = this.getExerciseById('pull_hammer_curls');

      [heavyRow, pulldown, cableRow, facePull, bicepCurl, hammerCurl].forEach(ex => {
        if (ex && !selectedExercises.some(s => s.id === ex.id)) selectedExercises.push(ex);
      });
    } else if (phase === 'legs') {
      const squat = isHome
        ? (this.getExerciseById('legs_romanian_deadlift') || exercisesInCat[0])
        : (this.getExerciseById('legs_barbell_squat') || exercisesInCat[0]);
      const rdl = this.getExerciseById('legs_romanian_deadlift');
      const quadIso = isHome
        ? (this.getExerciseById('legs_standing_calf_raise') || exercisesInCat[1])
        : (this.getExerciseById('legs_leg_press') || this.getExerciseById('legs_leg_extension') || exercisesInCat[1]);
      const hamIso = this.getExerciseById('legs_leg_curl');
      const calves = this.getExerciseById('legs_standing_calf_raise');

      [squat, rdl, quadIso, hamIso, calves].forEach(ex => {
        if (ex && !selectedExercises.some(s => s.id === ex.id)) selectedExercises.push(ex);
      });
    } else {
      // Rest / Core active
      const plank = this.getExerciseById('core_plank_hold');
      const deadBug = this.getExerciseById('core_dead_bug');
      const birdDog = this.getExerciseById('core_bird_dog');
      const sidePlank = this.getExerciseById('core_side_plank');
      const stretch = this.getExerciseById('recovery_full_body_stretch');

      [plank, deadBug, birdDog, sidePlank, stretch].forEach(ex => {
        if (ex && !selectedExercises.some(s => s.id === ex.id)) selectedExercises.push(ex);
      });
    }

    // Build WorkoutExercise array with progression-advised weights
    const workoutExercises: WorkoutExercise[] = selectedExercises.map(ex => {
      const advice = this.calculateProgression(ex.id, history);
      const setsCount = ex.targetSets || 3;
      const sets: SetLog[] = [];

      for (let i = 1; i <= setsCount; i++) {
        sets.push({
          id: `set_${ex.id}_${i}`,
          setNumber: i,
          targetReps: ex.targetRepRange || '8-10',
          actualReps: parseInt(ex.targetRepRange?.split('-')[0] || '8', 10),
          targetWeight: advice.recommendedWeight,
          actualWeight: advice.recommendedWeight,
          rpe: ex.rpeTarget || 8,
          completed: false,
        });
      }

      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        exerciseNameAr: ex.nameAr,
        primaryMuscle: ex.primaryMuscle,
        sets,
        restSeconds: ex.restSeconds || 90,
        targetRpe: ex.rpeTarget || 8,
        completed: false,
      };
    });

    return {
      id: 'session_' + Date.now(),
      date: today,
      name: sessionName,
      nameAr: sessionNameAr,
      type: phase,
      mode: profile.mode,
      durationMinutes: phase === 'rest_active' ? 30 : 55,
      exercises: workoutExercises,
      completed: false,
      startedAt: Date.now(),
    };
  },

  // Progressive Overload Intelligence Engine
  calculateProgression(exerciseId: string, history: WorkoutSession[]): ProgressionAdvice {
    const exercise = this.getExerciseById(exerciseId);
    const defaultBaselineWeight = exercise?.category === 'legs' ? 60 : exercise?.category === 'push' ? 40 : 35;

    // Find previous sessions with this exercise
    const pastSessionsWithEx: WorkoutExercise[] = [];
    for (const session of history) {
      if (!session.completed) continue;
      const found = session.exercises.find(e => e.exerciseId === exerciseId);
      if (found) pastSessionsWithEx.push(found);
    }

    if (pastSessionsWithEx.length === 0) {
      return {
        recommendedWeight: defaultBaselineWeight,
        recommendedReps: exercise?.targetRepRange || '8-10',
        recommendedRpe: exercise?.rpeTarget || 8,
        reason: 'Initial calibrated baseline weight for technique mastery.',
        reasonAr: 'وزن ابتدائي لتأكيد التكنيك والمسار الحركي السليم.',
        status: 'baseline',
      };
    }

    const lastExData = pastSessionsWithEx[0];
    const completedSets = lastExData.sets.filter(s => s.completed);

    if (completedSets.length === 0) {
      return {
        recommendedWeight: lastExData.sets[0]?.targetWeight || defaultBaselineWeight,
        recommendedReps: exercise?.targetRepRange || '8-10',
        recommendedRpe: 8,
        reason: 'Maintain previous session target.',
        reasonAr: 'الحفاظ على وزن الجلسة السابقة.',
        status: 'maintain',
      };
    }

    const lastWeight = completedSets[0].actualWeight || completedSets[0].targetWeight;
    const avgRpe = completedSets.reduce((sum, s) => sum + (s.rpe || 8), 0) / completedSets.length;
    const avgReps = completedSets.reduce((sum, s) => sum + (s.actualReps || 8), 0) / completedSets.length;

    // Target top of rep range
    const maxTargetReps = parseInt(exercise?.targetRepRange?.split('-')[1] || '10', 10);

    if (avgReps >= maxTargetReps && avgRpe <= 8) {
      // Incremental progressive load increase
      const increment = exercise?.exerciseType === 'compound' ? 2.5 : 1.25;
      const newWeight = Math.round((lastWeight + increment) * 10) / 10;
      return {
        recommendedWeight: newWeight,
        recommendedReps: exercise?.targetRepRange || '6-8',
        recommendedRpe: 8,
        reason: `Overload achieved! Hit ${avgReps.toFixed(0)} reps at RPE ${avgRpe.toFixed(1)}. Incremented by +${increment}kg.`,
        reasonAr: `تم تحقيق شرط الزيادة! حققت ${avgReps.toFixed(0)} تكرار بمعدل RPE ${avgRpe.toFixed(1)}. تمت زيادة الوزن بـ +${increment} كجم.`,
        status: 'increase',
      };
    } else if (avgRpe >= 9.5) {
      return {
        recommendedWeight: lastWeight,
        recommendedReps: exercise?.targetRepRange || '8-10',
        recommendedRpe: 8,
        reason: `RPE reached ${avgRpe.toFixed(1)} (near failure). Maintain ${lastWeight}kg to solidify motor pattern.`,
        reasonAr: `معدل الجهد RPE وصل إلى ${avgRpe.toFixed(1)}. يفضل تثبيت وزن ${lastWeight} كجم لتثبيت التكنيك والاستشفاء.`,
        status: 'maintain',
      };
    }

    return {
      recommendedWeight: lastWeight,
      recommendedReps: exercise?.targetRepRange || '8-10',
      recommendedRpe: 8,
      reason: `Solid performance at ${lastWeight}kg. Strive for +1 rep before increasing weight.`,
      reasonAr: `أداء ممتاز بوزن ${lastWeight} كجم. حاول إضافة تكرار إضافي قبل زيادة الوزن.`,
      status: 'maintain',
    };
  },

  // Exercise Substitutions (preserving movement pattern and target muscle)
  getExerciseSubstitutes(exerciseId: string): Exercise[] {
    const source = this.getExerciseById(exerciseId);
    if (!source) return [];

    return exerciseSeedData.filter(e => 
      e.id !== exerciseId && 
      (e.movementPattern === source.movementPattern || e.primaryMuscle === source.primaryMuscle)
    );
  },

  // Parse date safely at local midnight (delegates to centralized dateUtils)
  parseDateOnly(dateStr: string): Date {
    return parseDateAtMidnight(dateStr);
  },

  // Dynamic Adaptive Program Timeline Engine (Single Source of Truth: Start Date + Current Date)
  getAdaptiveProgramTimeline(startDateStr: string, customNow?: Date): TransitionPhaseInfo {
    const progress = calculateProgramProgress(startDateStr, customNow);
    const {
      currentWeek,
      currentDay: currentDayInWeek,
      totalProgramDay,
      totalElapsedDays,
      totalElapsedDays: totalDaysElapsed,
      cycleNumber,
      weekInCycle,
      startDateString: startDate,
      formattedProgress,
      formattedProgressAr,
    } = progress;

    let phaseTitle = '';
    let phaseTitleAr = '';
    let focusDirectives: string[] = [];
    let focusDirectivesAr: string[] = [];
    let calorieAdjustment = '';
    let calorieAdjustmentAr = '';
    let cardioRecommendation = '';
    let cardioRecommendationAr = '';

    switch (weekInCycle) {
      case 1:
        phaseTitle = `Week ${currentWeek}: Stability & Progressive Baseline (Cycle ${cycleNumber}, Block Week 1)`;
        phaseTitleAr = `الأسبوع ${currentWeek}: الاستقرار وتثبيت الأوزان المرجعية (الدورة ${cycleNumber}، الأسبوع 1)`;
        focusDirectives = [
          'Establish rock-solid form and benchmark loads on primary compound movements (Bench, Squat, Rows).',
          'Maintain controlled deficit or recomp surplus ensuring full recovery capacity between sessions.',
          'Accumulate steady base movement (7,500-8,500 daily steps) with low-impact cardio.',
        ];
        focusDirectivesAr = [
          'تثبيت التكنيك والأوزان المرجعية في الحركات المركبة الأساسية (البنش، السكوات، السحب).',
          'الالتزام بالسعرات المستهدفة لضمان طاقة كاملة واستشفاء سريع بين التمارين.',
          'استهداف 7,500 إلى 8,500 خطوة يومياً مع كارديو منخفض الشدة.',
        ];
        calorieAdjustment = 'Controlled energy balance (~300 kcal deficit or maintenance)';
        calorieAdjustmentAr = 'توازن طاقة منضبط (~300 سعرة عجز أو سعرات الثبات)';
        cardioRecommendation = '2-3 x 20 min LISS Incline Walk';
        cardioRecommendationAr = '2-3 جلسات 20 دقيقة مشي بميل خفيف';
        break;

      case 2:
        phaseTitle = `Week ${currentWeek}: Load Maintenance & Step Progression (Cycle ${cycleNumber}, Block Week 2)`;
        phaseTitleAr = `الأسبوع ${currentWeek}: الحفاظ على الأحمال وزيادة النشاط اليومي (الدورة ${cycleNumber}، الأسبوع 2)`;
        focusDirectives = [
          'Do NOT drop working set weights—preserve muscle mechanical tension above all else.',
          'Attempt micro-overload (+1-2 reps or +1.25kg to +2.5kg on final sets if RPE <= 8).',
          'Increase daily movement target to 8,500 - 9,500 steps.',
        ];
        focusDirectivesAr = [
          'لا تقلل أوزان التمرين—الشد الميكانيكي هو المحرك الأساسي لحماية وبناء الكتلة العضلية.',
          'محاولة زيادة تكرار أو زيادة وزن خفيفة (+1.25 إلى 2.5 كجم) في المجموعات الأخيرة إذا كان RPE <= 8.',
          'رفع خطوات المشي اليومية إلى 8,500 - 9,500 خطوة.',
        ];
        calorieAdjustment = 'Maintain steady protein >= 2.0g/kg body weight';
        calorieAdjustmentAr = 'الحفاظ على بروتين يومي لا يقل عن 2.0 جم/كجم من وزن الجسم';
        cardioRecommendation = '3 x 25 min Zone 2 Cycling / Incline Walking';
        cardioRecommendationAr = '3 جلسات 25 دقيقة كارديو معتدل Zone 2';
        break;

      case 3:
        phaseTitle = `Week ${currentWeek}: Strength Preservation & Recovery Audit (Cycle ${cycleNumber}, Block Week 3)`;
        phaseTitleAr = `الأسبوع ${currentWeek}: صيانة القوة وتقييم جودة الاستشفاء (الدورة ${cycleNumber}، الأسبوع 3)`;
        focusDirectives = [
          'Audit sleep quality (7-8.5 hrs) and daily hydration (3.5L+).',
          'Ensure target RPE stays strictly within 7-8 to avoid accumulating central nervous fatigue.',
          'Incorporate post-workout static stretching, foam rolling, and sauna recovery.',
        ];
        focusDirectivesAr = [
          'مراجعة جودة النوم (7-8.5 ساعة) ومتابعة شرب المياه (3.5 لتر فأكثر).',
          'الحفاظ على معدل الجهد RPE بين 7-8 لتجنب الإجهاد العصبي التراكمي.',
          'جلسات إطالات بعد التمرين مع ساونا أو جاكوزي لتسريع الاستشفاء.',
        ];
        calorieAdjustment = 'Consistent nutrition with high Egyptian protein staples (Areesh, Chicken breast, Ful, Eggs)';
        calorieAdjustmentAr = 'تثبيت السعرات والماكروز مع التركيز على مصادر البروتين الصحية (جبنة قريش، صدور دجاج، فول، بيض)';
        cardioRecommendation = '3 x 30 min Incline Treadmill Walk';
        cardioRecommendationAr = '3 جلسات 30 دقيقة مشي بميل على السير';
        break;

      case 4:
      default:
        phaseTitle = `Week ${currentWeek}: Trend Assessment & Volume Calibration (Cycle ${cycleNumber}, Block Week 4)`;
        phaseTitleAr = `الأسبوع ${currentWeek}: تقييم النتائج الشاملة وتحديث الخطة (الدورة ${cycleNumber}، الأسبوع 4)`;
        focusDirectives = [
          'Compare week-over-week trends in waist circumference, 7-day average scale weight, and volume tonnage.',
          'If waist decreased and working weights progressed: maintain current progressive overload protocol.',
          'If accumulated fatigue is elevated: perform a structured active recovery or deload week.',
        ];
        focusDirectivesAr = [
          'مقارنة شاملة لمحيط الخصر، متوسط الوزن لـ 7 أيام، وإجمالي الحجم التدريبي المرفوع.',
          'إذا نزل الخصر وثبتت أوزانك: الاستمرار في نفس المنظومة بنجاح تام.',
          'إذا كان الإجهاد مرتفعاً: تطبيق أسبوع استشفاء وتخفيف أحمال قبل بدء الدورة التدريبية التالية.',
        ];
        calorieAdjustment = 'Evaluate 7-day weight and waist trends to calibrate caloric baseline';
        calorieAdjustmentAr = 'تقييم مؤشر الخصر ومتوسط الوزن لتحديث السعرات المستهدفة بدقة';
        cardioRecommendation = 'Maintain 75-90 min total weekly LISS';
        cardioRecommendationAr = 'الحفاظ على 75-90 دقيقة كارديو أسبوعياً';
        break;
    }

    return {
      currentWeek,
      currentDayInWeek,
      totalProgramDay,
      totalDaysElapsed,
      cycleNumber,
      weekInCycle,
      startDate,
      formattedProgress,
      formattedProgressAr,
      phaseTitle,
      phaseTitleAr,
      focusDirectives,
      focusDirectivesAr,
      calorieAdjustment,
      calorieAdjustmentAr,
      cardioRecommendation,
      cardioRecommendationAr,
    };
  },

  // 4-Week Adaptive Transition Engine (Aliases to getAdaptiveProgramTimeline)
  getFourWeekTransition(startDateStr: string): TransitionPhaseInfo {
    return this.getAdaptiveProgramTimeline(startDateStr);
  },

  // Weekly Volume and Progressive Overload Engine
  calculateWeeklyVolume(history: WorkoutSession[], nowTimestamp?: number): WeeklyVolumeInfo {
    const now = nowTimestamp || Date.now();
    const msInDay = 86400000;
    const currentWeekStart = now - (7 * msInDay);
    const previousWeekStart = now - (14 * msInDay);

    const completedSessions = (history || []).filter(w => w.completed);
    const currentWeekSessions: WeeklyVolumeSession[] = [];
    let currentWeekVolumeKg = 0;
    let previousWeekVolumeKg = 0;
    let totalSetsCompleted = 0;
    let totalRepsCompleted = 0;

    completedSessions.forEach(session => {
      const sessionTime = new Date(session.date).getTime();
      let sessionVolume = 0;
      let sessionSets = 0;

      session.exercises.forEach(ex => {
        ex.sets.forEach(s => {
          if (s.completed) {
            const rawWeight = s.actualWeight !== undefined ? s.actualWeight : s.targetWeight;
            const weight = typeof rawWeight === 'number' ? rawWeight : (parseFloat(String(rawWeight || '0')) || 0);

            const rawReps = s.actualReps !== undefined ? s.actualReps : s.targetReps;
            const reps = typeof rawReps === 'number' ? rawReps : (parseInt(String(rawReps || '0').split('-')[0], 10) || 0);

            sessionVolume += weight * reps;
            sessionSets += 1;
            if (sessionTime >= currentWeekStart && sessionTime <= now + msInDay) {
              totalSetsCompleted += 1;
              totalRepsCompleted += reps;
            }
          }
        });
      });

      if (sessionTime >= currentWeekStart && sessionTime <= now + msInDay) {
        currentWeekVolumeKg += sessionVolume;
        const d = new Date(session.date);
        const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayNamesAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const dayIdx = d.getDay();

        currentWeekSessions.push({
          id: session.id,
          date: session.date,
          dayName: dayNamesEn[dayIdx] || 'Session',
          dayNameAr: dayNamesAr[dayIdx] || 'تمرينة',
          name: session.name,
          nameAr: session.nameAr || session.name,
          type: session.type,
          volumeKg: Math.round(sessionVolume),
          setsCount: sessionSets,
          completed: true,
        });
      } else if (sessionTime >= previousWeekStart && sessionTime < currentWeekStart) {
        previousWeekVolumeKg += sessionVolume;
      }
    });

    currentWeekVolumeKg = Math.round(currentWeekVolumeKg);
    previousWeekVolumeKg = Math.round(previousWeekVolumeKg);
    const volumeDeltaKg = currentWeekVolumeKg - previousWeekVolumeKg;
    const volumeDeltaPercent = previousWeekVolumeKg > 0 
      ? Math.round(((volumeDeltaKg / previousWeekVolumeKg) * 100) * 10) / 10 
      : 0;

    let status: 'overload_achieved' | 'steady_maintenance' | 'volume_deload' | 'baseline' = 'baseline';
    let statusBadge = 'Baseline Volume Week';
    let statusBadgeAr = 'حجم تدريبي مرجعي';
    let feedback = '';
    let feedbackAr = '';

    const currentWeekVolumeTons = Math.round((currentWeekVolumeKg / 1000) * 10) / 10;
    const workoutsInWeekCount = currentWeekSessions.length;
    const avgVolumePerWorkoutKg = workoutsInWeekCount > 0 ? Math.round(currentWeekVolumeKg / workoutsInWeekCount) : 0;

    if (previousWeekVolumeKg === 0) {
      status = 'baseline';
      statusBadge = 'Baseline Week Logged';
      statusBadgeAr = 'تسجيل الأسبوع المرجعي الأول';
      feedback = `Accumulated ${currentWeekVolumeKg.toLocaleString()} kg (${currentWeekVolumeTons} tons) across ${workoutsInWeekCount} sessions. This establishes your progressive overload baseline.`;
      feedbackAr = `تم رفع إجمالي ${currentWeekVolumeKg.toLocaleString()} كجم (${currentWeekVolumeTons} طن) عبر ${workoutsInWeekCount} تمارين. يمثل هذا نقطة البداية المرجعية لزيادة الأحمال.`;
    } else if (volumeDeltaPercent >= 3) {
      status = 'overload_achieved';
      statusBadge = `+${volumeDeltaPercent}% Overload Achieved`;
      statusBadgeAr = `+${volumeDeltaPercent}% زيادة أحمال متدرجة`;
      feedback = `Excellent progression! Volume increased by ${volumeDeltaKg.toLocaleString()} kg (+${volumeDeltaPercent}%) compared to last week. Mechanical tension and hypertrophy drive are maximized.`;
      feedbackAr = `تطور ممتاز! زاد الحجم التدريبي بمقدار ${volumeDeltaKg.toLocaleString()} كجم (+${volumeDeltaPercent}%) مقارنة بالأسبوع الماضي. استجابة البناء العضلي في أعلى مستوياتها.`;
    } else if (volumeDeltaPercent >= -5 && volumeDeltaPercent < 3) {
      status = 'steady_maintenance';
      statusBadge = `${volumeDeltaPercent >= 0 ? '+' : ''}${volumeDeltaPercent}% Volume Maintained`;
      statusBadgeAr = `${volumeDeltaPercent >= 0 ? '+' : ''}${volumeDeltaPercent}% ثبات الحجم التدريبي`;
      feedback = `Solid training consistency. Weekly volume held steady at ${currentWeekVolumeKg.toLocaleString()} kg (${volumeDeltaPercent >= 0 ? '+' : ''}${volumeDeltaPercent}% vs last week), preserving strength and muscle mass.`;
      feedbackAr = `التزام تدريبي قوي. ثبت الحجم التدريبي عند ${currentWeekVolumeKg.toLocaleString()} كجم (${volumeDeltaPercent >= 0 ? '+' : ''}${volumeDeltaPercent}%)، مما يحافظ على القوة والكتلة العضلية.`;
    } else {
      status = 'volume_deload';
      statusBadge = `${volumeDeltaPercent}% Volume Deload`;
      statusBadgeAr = `${volumeDeltaPercent}% استشفاء وخفض أحمال`;
      feedback = `Weekly volume dropped by ${Math.abs(volumeDeltaKg).toLocaleString()} kg (${volumeDeltaPercent}%). Ideal for active deload and tissue recovery if fatigue was high.`;
      feedbackAr = `انخفض الحجم التدريبي بمقدار ${Math.abs(volumeDeltaKg).toLocaleString()} كجم (${volumeDeltaPercent}%). مناسب جداً للراحة النشطة والاستشفاء في حال وجود إجهاد.`;
    }

    return {
      currentWeekVolumeKg,
      currentWeekVolumeTons,
      previousWeekVolumeKg,
      volumeDeltaKg,
      volumeDeltaPercent,
      totalSetsCompleted,
      totalRepsCompleted,
      workoutsInWeekCount,
      avgVolumePerWorkoutKg,
      status,
      statusBadge,
      statusBadgeAr,
      feedback,
      feedbackAr,
      sessionBreakdown: currentWeekSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    };
  },

  // 7-Day Rolling Weight Average Calculator
  calculate7DayWeightAverage(measurements: BodyMeasurement[]): number {
    if (!measurements || measurements.length === 0) return 0;
    const sorted = [...measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const last7 = sorted.slice(0, 7);
    const sum = last7.reduce((acc, m) => acc + m.weight, 0);
    return Math.round((sum / last7.length) * 10) / 10;
  },

  // Fat Loss & Body Composition Trend Analyzer
  evaluateFatLossTrend(measurements: BodyMeasurement[], workouts: WorkoutSession[]) {
    if (measurements.length < 2) {
      return {
        status: 'calibrating',
        badge: 'Collecting Baseline Data',
        badgeAr: 'جاري تجميع البيانات المرجعية',
        explanation: 'Log at least 2-3 body weight and waist measurements to unlock trend analysis.',
        explanationAr: 'سجل قياسين للوزن والخصر على الأقل لعرض التحليل البياني للنتائج.',
        trendScore: 'neutral',
      };
    }

    const sorted = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = sorted[0];
    const latest = sorted[sorted.length - 1];

    const weightDelta = latest.weight - first.weight;
    const waistDelta = (latest.waistCm || 0) - (first.waistCm || 0);

    // Recomposition: Waist down while weight is roughly stable
    if (waistDelta < -0.5 && Math.abs(weightDelta) <= 1.0) {
      return {
        status: 'optimal_recomp',
        badge: 'Prime Muscle Recomposition',
        badgeAr: 'إعادة تشكيل مثالية (حرق دهون + بناء عضلات)',
        explanation: `Waist decreased by ${Math.abs(waistDelta).toFixed(1)} cm while weight remained stable at ${latest.weight} kg. This signifies direct visceral fat reduction coupled with lean tissue retention.`,
        explanationAr: `نزل محيط الخصر بمقدار ${Math.abs(waistDelta).toFixed(1)} سم مع ثبات الوزن عند ${latest.weight} كجم. هذا مؤشر بيولوجي قاطع على حرق الدهون وبناء العضلات بالتزامن.`,
        trendScore: 'positive',
      };
    }

    // Steady Fat Loss
    if (weightDelta < -0.5 && waistDelta <= 0) {
      return {
        status: 'steady_fat_loss',
        badge: 'Controlled Fat-Loss On Track',
        badgeAr: 'حرق دهون منضبط وناجح',
        explanation: `Weight decreased by ${Math.abs(weightDelta).toFixed(1)} kg and waist reduced by ${Math.abs(waistDelta).toFixed(1)} cm. Training intensity and muscle mass are successfully preserved.`,
        explanationAr: `نزل الوزن بمقدار ${Math.abs(weightDelta).toFixed(1)} كجم مع نزول محيط الخصر بـ ${Math.abs(waistDelta).toFixed(1)} سم مع الحفاظ على قوة التدريب.`,
        trendScore: 'positive',
      };
    }

    // Fast Drop Warning
    if (weightDelta < -3.5 && daysBetween(first.date, latest.date) < 14) {
      return {
        status: 'too_rapid',
        badge: 'Rapid Weight Loss Warning',
        badgeAr: 'تنبيه: نزول سريع للوزن',
        explanation: 'Weight is dropping faster than 1kg/week. Increase carbohydrate and protein intake slightly to prevent loss of skeletal muscle and strength.',
        explanationAr: 'معدل النزول أسرع من 1 كجم أسبوعياً. ارفع الكربوهيدرات والبروتين قليلاً لحماية الكتلة العضلية من الهدم.',
        trendScore: 'warning',
      };
    }

    return {
      status: 'steady_progress',
      badge: 'Consistent Training Progress',
      badgeAr: 'تقدم وتطور منتظم',
      explanation: `Current weight: ${latest.weight} kg, Waist: ${latest.waistCm || 'N/A'} cm. Focus on progressive overload in every session.`,
      explanationAr: `الوزن الحالي: ${latest.weight} كجم، والخصر: ${latest.waistCm || 'غير مسجل'} سم. ركز على زيادة الأوزان والتكرارات.`,
      trendScore: 'neutral',
    };
  },
};

function daysBetween(d1: string, d2: string): number {
  return Math.abs((new Date(d2).getTime() - new Date(d1).getTime()) / 86400000);
}
