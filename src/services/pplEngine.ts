import { 
  Exercise, 
  WorkoutSession, 
  WorkoutExercise, 
  SetLog, 
  UserProfile, 
  BodyMeasurement 
} from '../types';
import { exerciseSeedData } from '../data/exerciseSeed';

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
  phaseTitle: string;
  phaseTitleAr: string;
  focusDirectives: string[];
  focusDirectivesAr: string[];
  calorieAdjustment: string;
  calorieAdjustmentAr: string;
  cardioRecommendation: string;
  cardioRecommendationAr: string;
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

  // 4-Week Adaptive Transition Engine
  getFourWeekTransition(startDateStr: string): TransitionPhaseInfo {
    const start = new Date(startDateStr || Date.now()).getTime();
    const now = Date.now();
    const daysElapsed = Math.max(0, Math.floor((now - start) / 86400000));
    const currentWeek = Math.min(4, Math.max(1, Math.floor(daysElapsed / 7) + 1));

    switch (currentWeek) {
      case 1:
        return {
          currentWeek: 1,
          phaseTitle: 'Week 1: Stability & Baseline Calibration',
          phaseTitleAr: 'الأسبوع 1: الاستقرار وتثبيت الأوزان المرجعية',
          focusDirectives: [
            'Establish rock-solid form on primary compound movements (Bench, Squat, Rows).',
            'Modest caloric deficit (250-350 kcal) ensuring zero loss of training stamina.',
            'Target 7,500 daily steps with low-impact incline treadmill walking.',
          ],
          focusDirectivesAr: [
            'تثبيت التكنيك في الحركات المركبة الأساسية (البنش، السكوات، السحب).',
            'عجز سعرات معتدل (250-350 سعرة) لضمان عدم تأثر طاقة التمرين.',
            'استهداف 7,500 خطوة يومياً مع المشي بميل خفيف.',
          ],
          calorieAdjustment: 'Slight deficit (~300 kcal below TDEE)',
          calorieAdjustmentAr: 'عجز طفيف (~300 سعرة تحت الثبات)',
          cardioRecommendation: '2 x 20 min LISS Incline Walk',
          cardioRecommendationAr: 'جلستان 20 دقيقة مشي بميل',
        };
      case 2:
        return {
          currentWeek: 2,
          phaseTitle: 'Week 2: Resistance Maintenance & Step Progression',
          phaseTitleAr: 'الأسبوع 2: الحفاظ على الأحمال وزيادة النشاط اليومي',
          focusDirectives: [
            'Do NOT drop working set weights—preserve muscle tension above all else.',
            'Increase daily movement target to 8,500 - 9,500 steps.',
            'Track 7-day average scale weight and waist circumference.',
          ],
          focusDirectivesAr: [
            'لا تقلل أوزان التمرين—الشد العضلي هو الحامي الأول للكتلة العضلية.',
            'رفع خطوات المشي اليومية إلى 8,500 - 9,500 خطوة.',
            'متابعة متوسط الوزن لـ 7 أيام مع قياس الخصر.',
          ],
          calorieAdjustment: 'Maintain steady deficit, protein >= 2.0g/kg',
          calorieAdjustmentAr: 'عجز ثابت مع بروتين لا يقل عن 2.0 جم/كجم',
          cardioRecommendation: '3 x 25 min Zone 2 Cycling / Walking',
          cardioRecommendationAr: '3 جلسات 25 دقيقة كارديو معتدل',
        };
      case 3:
        return {
          currentWeek: 3,
          phaseTitle: 'Week 3: Strength Preservation & Recovery Audit',
          phaseTitleAr: 'الأسبوع 3: صيانة القوة وتقييم جودة الاستشفاء',
          focusDirectives: [
            'Audit sleep (7-8.5 hrs) and hydration (3.5L+).',
            'Ensure RPE stays within 7-8 to avoid accumulating central fatigue.',
            'Incorporate post-workout static stretching and sauna recovery.',
          ],
          focusDirectivesAr: [
            'تقييم ساعات النوم (7-8.5 ساعة) والترطيب (3.5+ لتر).',
            'الحفاظ على معدل RPE بين 7-8 لتجنب الإجهاد العصبي التراكمي.',
            'جلسات إطالات بعد التمرين مع ساونا للاستشفاء.',
          ],
          calorieAdjustment: 'Keep steady, high Egyptian protein staples (Areesh, Chicken, Ful)',
          calorieAdjustmentAr: 'تثبيت السعرات مع التركيز على مصادر البروتين',
          cardioRecommendation: '3 x 30 min Incline Walk',
          cardioRecommendationAr: '3 جلسات 30 دقيقة مشي بميل',
        };
      case 4:
      default:
        return {
          currentWeek: 4,
          phaseTitle: 'Week 4: Trend Assessment & Phase Calibration',
          phaseTitleAr: 'الأسبوع 4: تقييم النتائج الشاملة وتحديث الخطة',
          focusDirectives: [
            'Comprehensive review: Compare Week 1 vs Week 4 waist trend, strength, and energy.',
            'If waist dropped and strength held: continue controlled fat-loss trajectory.',
            'If fatigue is high: execute a 1-week volume reload before next progression block.',
          ],
          focusDirectivesAr: [
            'مراجعة شاملة: مقارنة مقاس الخصر والأوزان ومعدل النشاط مع الأسبوع الأول.',
            'إذا نزل الخصر وثبتت القوة: الاستمرار في نفس المنظومة بنجاح.',
            'إذا كان الإجهاد مرتفعاً: أسبوع تخفيف أحمال خفيف قبل الدورة التالية.',
          ],
          calorieAdjustment: 'Evaluate waist trend to calibrate baseline',
          calorieAdjustmentAr: 'تقييم مؤشر الخصر لتحديث السعرات',
          cardioRecommendation: 'Maintain 75-90 min total weekly LISS',
          cardioRecommendationAr: 'الحفاظ على 75-90 دقيقة كارديو أسبوعياً',
        };
    }
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
