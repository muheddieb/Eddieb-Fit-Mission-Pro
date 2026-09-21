import {
  UserProfile,
  WorkoutSession,
  SleepLog,
  RecoverySession,
  WorkoutIntensityAssessment,
  RecoveryScoreAnalysis,
  PrescribedRecoverySession,
} from '../types';
import { RECOVERY_ROUTINES_LIBRARY } from '../data/recoveryRoutines';

export class RecoveryEngine {
  /**
   * Evaluates the last 3 workouts to determine individual and cumulative strain
   */
  static assessLastWorkouts(
    history: WorkoutSession[],
    profile: UserProfile
  ): WorkoutIntensityAssessment[] {
    // Filter completed workouts, or workouts with exercises
    const sorted = [...history]
      .filter((w) => w.completed || (w.exercises && w.exercises.length > 0))
      .sort((a, b) => {
        const timeA = a.completedAt || a.timestamp || new Date(a.date).getTime();
        const timeB = b.completedAt || b.timestamp || new Date(b.date).getTime();
        return timeB - timeA;
      });

    // Take the last 3 workouts (or create realistic baseline if user has fewer)
    const recentSessions = sorted.slice(0, 3);

    // If fewer than 3 workouts exist in history, generate baseline representation
    if (recentSessions.length === 0) {
      return this.generateDefaultAssessments(profile);
    }

    const now = Date.now();

    return recentSessions.map((w, idx) => {
      // Calculate total volume lifted
      let volumeKg = w.totalVolumeKg || 0;
      let totalRpeSum = 0;
      let rpeCount = 0;
      let completedSets = 0;

      if (w.exercises && w.exercises.length > 0) {
        w.exercises.forEach((ex) => {
          if (ex.sets) {
            ex.sets.forEach((s) => {
              if (s.completed !== false) {
                completedSets++;
                const wKg = s.actualWeight || s.targetWeight || 0;
                const r = typeof s.actualReps === 'number' ? s.actualReps : 10;
                if (!w.totalVolumeKg) {
                  volumeKg += wKg * r;
                }
                if (s.rpe) {
                  totalRpeSum += s.rpe;
                  rpeCount++;
                }
              }
            });
          }
        });
      }

      // Default reasonable values if zero
      if (volumeKg === 0) {
        volumeKg = (w.durationMinutes || 45) * 110;
      }
      const avgRpe = rpeCount > 0 ? totalRpeSum / rpeCount : (w.rating ? w.rating + 4 : 8.0);
      const duration = w.durationMinutes || 50;

      // Time elapsed
      const sessionTime = w.completedAt || w.timestamp || (now - (idx + 1) * 86400000);
      const diffMs = Math.max(0, now - sessionTime);
      const timeAgoHours = Math.round(diffMs / (1000 * 60 * 60));

      let timeAgoLabel = '';
      let timeAgoLabelAr = '';
      if (timeAgoHours < 24) {
        timeAgoLabel = timeAgoHours <= 1 ? 'Just now' : `${timeAgoHours}h ago`;
        timeAgoLabelAr = timeAgoHours <= 1 ? 'الآن' : `منذ ${timeAgoHours} ساعة`;
      } else {
        const days = Math.floor(timeAgoHours / 24);
        timeAgoLabel = days === 1 ? 'Yesterday' : `${days}d ago`;
        timeAgoLabelAr = days === 1 ? 'أمس' : `منذ ${days} أيام`;
      }

      // Calculate Workout Strain Score (0.0 - 10.0 scale)
      // Factors: Volume density, duration, and RPE
      const durationFactor = Math.min(3.5, (duration / 60) * 2.8);
      const volumeFactor = Math.min(4.0, (volumeKg / 10000) * 3.2);
      const rpeFactor = Math.min(2.5, ((avgRpe - 6.5) / 3) * 2.5);
      
      let rawStrain = durationFactor + volumeFactor + Math.max(0.5, rpeFactor);
      rawStrain = Math.min(9.8, Math.max(2.5, Math.round(rawStrain * 10) / 10));

      let intensityTier: 'low' | 'moderate' | 'high' | 'extreme' = 'moderate';
      if (rawStrain >= 8.5) intensityTier = 'extreme';
      else if (rawStrain >= 7.0) intensityTier = 'high';
      else if (rawStrain >= 4.5) intensityTier = 'moderate';
      else intensityTier = 'low';

      // Primary muscle mapping
      const { muscles, musclesAr } = this.getPrimaryMuscles(w);

      return {
        session: w,
        strainScore: rawStrain,
        volumeKg: Math.round(volumeKg),
        durationMinutes: duration,
        avgRpe: Math.round(avgRpe * 10) / 10,
        setsCount: completedSets > 0 ? completedSets : 16,
        primaryMuscles: muscles,
        primaryMusclesAr: musclesAr,
        timeAgoHours,
        timeAgoLabel,
        timeAgoLabelAr,
        intensityTier,
      };
    });
  }

  /**
   * Determine primary muscle chains from session type or exercise names
   */
  private static getPrimaryMuscles(w: WorkoutSession): { muscles: string[]; musclesAr: string[] } {
    const type = (w.type || '').toLowerCase();
    const name = (w.name || '').toLowerCase();

    if (type.includes('push') || name.includes('push') || name.includes('chest')) {
      return {
        muscles: ['Pectorals', 'Anterior Deltoids', 'Triceps', 'Thoracic Spine'],
        musclesAr: ['الصدر', 'الكتف الأمامي', 'الترايسبس', 'الفقرات الصدرية'],
      };
    }
    if (type.includes('pull') || name.includes('pull') || name.includes('back') || name.includes('deadlift')) {
      return {
        muscles: ['Latissimus Dorsi', 'Upper Back & Traps', 'Erector Spinae', 'Biceps'],
        musclesAr: ['عضلات المجنص (اللاتس)', 'أعلى الظهر والترابيس', 'عضلات الظهر المنتصبة', 'البايسبس'],
      };
    }
    if (type.includes('leg') || name.includes('leg') || name.includes('squat') || name.includes('lower')) {
      return {
        muscles: ['Quadriceps', 'Hamstrings', 'Gluteal Complex', 'Hip Flexors & Ankles'],
        musclesAr: ['عضلات الفخذ الأمامية', 'أوتار الركبة الخلفية', 'الأرداف', 'مفصل الورك والكاحل'],
      };
    }
    if (type.includes('shoulders_arms') || name.includes('shoulder')) {
      return {
        muscles: ['Deltoids (Anterior/Lateral/Rear)', 'Triceps & Biceps', 'Rotator Cuff'],
        musclesAr: ['عضلات الكتف الثلاثية', 'الذراعين (بايسبس وترايسبس)', 'الكفة المدورة'],
      };
    }
    return {
      muscles: ['Full Body Kinetic Chain', 'Core Stabilizers', 'Spine & Hips'],
      musclesAr: ['السلسلة الحركية للجسم بالكامل', 'عضلات الجذع والمثبتات', 'العمود الفقري والحوض'],
    };
  }

  /**
   * Default realistic assessments if user is starting out
   */
  private static generateDefaultAssessments(profile: UserProfile): WorkoutIntensityAssessment[] {
    const now = Date.now();
    return [
      {
        session: {
          id: 'w_sim_1',
          date: new Date(now - 18 * 3600000).toISOString().split('T')[0],
          name: 'Push Hypertrophy & Delts',
          nameAr: 'تمرين دفع وتضخيم الصدر والأكتاف',
          type: 'push',
          mode: profile.mode,
          durationMinutes: 52,
          completed: true,
          exercises: [],
        },
        strainScore: 7.8,
        volumeKg: 8400,
        durationMinutes: 52,
        avgRpe: 8.2,
        setsCount: 16,
        primaryMuscles: ['Pectorals', 'Anterior Deltoids', 'Triceps'],
        primaryMusclesAr: ['الصدر', 'الكتف الأمامي', 'الترايسبس'],
        timeAgoHours: 18,
        timeAgoLabel: '18h ago',
        timeAgoLabelAr: 'منذ 18 ساعة',
        intensityTier: 'high',
      },
      {
        session: {
          id: 'w_sim_2',
          date: new Date(now - 42 * 3600000).toISOString().split('T')[0],
          name: 'Legs & Posterior Power',
          nameAr: 'تمرين أرجل وقوة السلسلة الخلفية',
          type: 'legs',
          mode: profile.mode,
          durationMinutes: 58,
          completed: true,
          exercises: [],
        },
        strainScore: 8.6,
        volumeKg: 11200,
        durationMinutes: 58,
        avgRpe: 8.5,
        setsCount: 18,
        primaryMuscles: ['Quadriceps', 'Hamstrings', 'Gluteal Complex'],
        primaryMusclesAr: ['الفخذ الأمامي', 'أوتار الركبة', 'الأرداف'],
        timeAgoHours: 42,
        timeAgoLabel: 'Yesterday',
        timeAgoLabelAr: 'أمس',
        intensityTier: 'extreme',
      },
      {
        session: {
          id: 'w_sim_3',
          date: new Date(now - 66 * 3600000).toISOString().split('T')[0],
          name: 'Pull Density & Lat Width',
          nameAr: 'تمرين سحب وكثافة الظهر والمجنص',
          type: 'pull',
          mode: profile.mode,
          durationMinutes: 50,
          completed: true,
          exercises: [],
        },
        strainScore: 7.2,
        volumeKg: 9100,
        durationMinutes: 50,
        avgRpe: 8.0,
        setsCount: 15,
        primaryMuscles: ['Latissimus Dorsi', 'Upper Back', 'Erector Spinae'],
        primaryMusclesAr: ['المجنص', 'أعلى الظهر', 'الفقرات القطنية'],
        timeAgoHours: 66,
        timeAgoLabel: '2d ago',
        timeAgoLabelAr: 'منذ يومين',
        intensityTier: 'high',
      },
    ];
  }

  /**
   * Main calculation for the Recovery Score (0-100) & suggested recovery sessions
   */
  static calculateRecoveryScore(
    history: WorkoutSession[],
    profile: UserProfile,
    sleepHistory: SleepLog[] = [],
    recoveryHistory: RecoverySession[] = []
  ): RecoveryScoreAnalysis {
    const assessments = this.assessLastWorkouts(history, profile);

    // Cumulative Strain Calculation
    // Weights: Most recent workout: 50%, Second: 30%, Third: 20%
    const weights = [0.5, 0.3, 0.2];
    let weightedStrain = 0;
    let totalRawStrain = 0;

    assessments.forEach((item, index) => {
      const w = weights[index] || 0.2;
      // Recency decay: if a workout was over 48h ago, reduce its acute impact slightly
      const decayFactor = item.timeAgoHours > 48 ? 0.75 : item.timeAgoHours > 24 ? 0.88 : 1.0;
      weightedStrain += item.strainScore * w * decayFactor;
      totalRawStrain += item.strainScore;
    });

    // Baseline Recovery score starts at 100
    // Strain penalty: weightedStrain (ranges ~ 4.0 to 9.5).
    // Multiply by ~7.5 to scale penalty from ~30 to 70 points
    let recoveryScore = 100 - weightedStrain * 6.5;

    // Check recent sleep logs for recovery bonus or penalty
    let sleepImpact = 0;
    if (sleepHistory.length > 0) {
      const latestSleep = sleepHistory[0];
      const hours = latestSleep.durationHours || 7.5;
      const score = latestSleep.qualityScore || 80;

      if (score >= 85 && hours >= 7.5) {
        sleepImpact = +8; // Great sleep recovery rebound
      } else if (score >= 75 && hours >= 7.0) {
        sleepImpact = +4;
      } else if (hours < 6.0 || score < 60) {
        sleepImpact = -10; // Sleep debt penalty
      }
    }
    recoveryScore += sleepImpact;

    // Check recent recovery protocol logs (e.g. sauna, yoga, stretching in last 24h)
    const recentRecoverySessions = recoveryHistory.filter((r) => {
      const t = r.timestamp || new Date(r.date).getTime();
      return Date.now() - t < 24 * 3600000;
    });
    if (recentRecoverySessions.length > 0) {
      recoveryScore += Math.min(10, recentRecoverySessions.length * 5); // +5 per completed recovery session
    }

    // Clamp score strictly between 18 and 98
    recoveryScore = Math.min(98, Math.max(18, Math.round(recoveryScore)));

    // Categorization
    let status: 'optimal' | 'moderate' | 'fatigued' | 'critical' = 'moderate';
    let statusLabel = 'Moderate Strain (Balanced)';
    let statusLabelAr = 'إجهاد متوازن (جاهزية معتدلة)';
    let statusColor = 'text-cyan-400';
    let summaryText = 'Training load is well-distributed. Active mobility and restorative stretching will accelerate tissue repair.';
    let summaryTextAr = 'الحمل التدريبي متوازن، ويوصى بجلسة مرونة خفيفة لتعزيز التعافي العضلي وتدفق الدم.';

    if (recoveryScore >= 82) {
      status = 'optimal';
      statusLabel = 'Optimal Readiness (Peak)';
      statusLabelAr = 'جاهزية قصوى (انتعاش كامل)';
      statusColor = 'text-emerald-400';
      summaryText = 'Nervous system and muscular chains are primed. Ideal state for high mechanical tension and PR progression.';
      summaryTextAr = 'الجهاز العصبي والألياف العضلية في حالة ممتازة، ومستعدة للأوزان العالية وتحطيم الأرقام القياسية.';
    } else if (recoveryScore >= 65) {
      status = 'moderate';
      statusLabel = 'Productive State (Steady)';
      statusLabelAr = 'حالة تدريبية منتجة ومستقرة';
      statusColor = 'text-cyan-400';
      summaryText = 'Solid training volume accumulated across recent bouts. Light mobility or restorative yoga recommended.';
      summaryTextAr = 'تم تسجيل حجم تدريبي جيد في آخر 3 تمارين، وينصح بجلسة استطالة لتحسين المدى الحركي.';
    } else if (recoveryScore >= 45) {
      status = 'fatigued';
      statusLabel = 'Elevated Fatigue (Active Rest)';
      statusLabelAr = 'إجهاد عضلي مرتفع (استشفاء موصى به)';
      statusColor = 'text-amber-400';
      summaryText = 'High cumulative mechanical strain detected. Targeted myofascial stretching and parasympathetic breathing advised.';
      summaryTextAr = 'تراكم إجهاد ملحوظ في الألياف العضلية من التمارين الأخيرة؛ يفضل التركيز على إطالات عميقة وتنفس بطيء.';
    } else {
      status = 'critical';
      statusLabel = 'High Cumulative Strain';
      statusLabelAr = 'إجهاد تراكمي حرج (استشفاء إلزامي)';
      statusColor = 'text-red-400';
      summaryText = 'Significant central and peripheral fatigue. Prioritize deep restorative yoga, hydration, and sleep optimization.';
      summaryTextAr = 'إجهاد عصبي وعضلي مرتفع جداً؛ ينصح بشدة بجلسة يوغا استرخائية عميقة ونوم مبكر لاستعادة الطاقة.';
    }

    // Cumulative Strain Category
    const avgStrain = totalRawStrain / 3;
    let strainCategory: 'low' | 'moderate' | 'high' | 'extreme' = 'moderate';
    let strainCategoryLabel = 'Moderate Strain';
    let strainCategoryLabelAr = 'إجهاد معتدل';

    if (avgStrain >= 8.5) {
      strainCategory = 'extreme';
      strainCategoryLabel = 'Extreme Cumulative Strain';
      strainCategoryLabelAr = 'إجهاد تراكمي فائق';
    } else if (avgStrain >= 7.0) {
      strainCategory = 'high';
      strainCategoryLabel = 'High Cumulative Strain';
      strainCategoryLabelAr = 'إجهاد تراكمي مرتفع';
    } else if (avgStrain >= 5.0) {
      strainCategory = 'moderate';
      strainCategoryLabel = 'Productive Training Strain';
      strainCategoryLabelAr = 'إجهاد تدريبي منتظم';
    } else {
      strainCategory = 'low';
      strainCategoryLabel = 'Low Mechanical Strain';
      strainCategoryLabelAr = 'إجهاد ميكانيكي منخفض';
    }

    // Sub-metrics
    const muscularFatigue = Math.min(95, Math.max(20, Math.round(weightedStrain * 10.2)));
    const cnsFatigue = Math.min(95, Math.max(15, Math.round((weightedStrain * 8.8) - (sleepImpact > 0 ? 8 : -8))));

    let jointStressLevel: 'low' | 'moderate' | 'elevated' = 'moderate';
    let jointStressLabel = 'Moderate Joint Tension';
    let jointStressLabelAr = 'توتر مفصلي معتدل';
    if (muscularFatigue >= 80) {
      jointStressLevel = 'elevated';
      jointStressLabel = 'Elevated Joint & Tendon Load';
      jointStressLabelAr = 'ضغط مرتفع على المفاصل والأوتار';
    } else if (muscularFatigue < 45) {
      jointStressLevel = 'low';
      jointStressLabel = 'Low Joint Loading';
      jointStressLabelAr = 'راحة مفاصل تامة';
    }

    // Collect distinct muscles fatigued across the 3 workouts
    const musclesSet = new Set<string>();
    const musclesSetAr = new Set<string>();
    assessments.forEach((item) => {
      item.primaryMuscles.forEach((m) => musclesSet.add(m));
      item.primaryMusclesAr.forEach((m) => musclesSetAr.add(m));
    });

    const targetedMusclesFatigued = Array.from(musclesSet).slice(0, 5);
    const targetedMusclesFatiguedAr = Array.from(musclesSetAr).slice(0, 5);

    // Select suggested sessions based on the primary workout patterns in the last 3 sessions
    const suggestedSessions = this.selectPrescribedSessions(
      assessments,
      recoveryScore,
      status
    );

    return {
      score: recoveryScore,
      status,
      statusLabel,
      statusLabelAr,
      statusColor,
      summaryText,
      summaryTextAr,
      cumulativeStrain: Math.round(totalRawStrain * 10) / 10,
      maxPossibleStrain: 30.0,
      strainCategory,
      strainCategoryLabel,
      strainCategoryLabelAr,
      muscularFatigueScore: muscularFatigue,
      cnsFatigueScore: cnsFatigue,
      jointStressLevel,
      jointStressLabel,
      jointStressLabelAr,
      lastWorkouts: assessments,
      targetedMusclesFatigued,
      targetedMusclesFatiguedAr,
      suggestedSessions,
      lastCalculatedAt: Date.now(),
    };
  }

  /**
   * Intelligently selects 1 Yoga, 1 Mobility, and 1 Stretching routine
   * specifically matching the split patterns and strain of the last 3 workouts.
   */
  private static selectPrescribedSessions(
    assessments: WorkoutIntensityAssessment[],
    recoveryScore: number,
    status: 'optimal' | 'moderate' | 'fatigued' | 'critical'
  ): PrescribedRecoverySession[] {
    const types = assessments.map((a) => (a.session.type || '').toLowerCase());
    const names = assessments.map((a) => (a.session.name || '').toLowerCase());

    const hasLegs = types.some((t) => t.includes('leg')) || names.some((n) => n.includes('leg') || n.includes('squat'));
    const hasPush = types.some((t) => t.includes('push')) || names.some((n) => n.includes('push') || n.includes('chest'));
    const hasPull = types.some((t) => t.includes('pull')) || names.some((n) => n.includes('pull') || n.includes('back'));

    const mostRecent = assessments[0];
    const recentType = (mostRecent?.session?.type || '').toLowerCase();
    const recentName = (mostRecent?.session?.name || '').toLowerCase();
    const totalVolume = assessments.reduce((sum, a) => sum + a.volumeKg, 0);

    // 1. SELECT YOGA SESSION
    let yogaRoutine: PrescribedRecoverySession;
    if (status === 'critical' || recoveryScore < 45) {
      // If critical fatigue, prioritize Parasympathetic Down-Regulation Yin Yoga
      yogaRoutine = {
        ...RECOVERY_ROUTINES_LIBRARY.find((r) => r.id === 'yoga-cns-parasympathetic-restorative')!,
        matchReason: `Prescribed for deep CNS reset after ${totalVolume.toLocaleString()} kg lifted across your last 3 workouts.`,
        matchReasonAr: `موصوفة لتهدئة الجهاز العصبي المركزي بعد رفع ${totalVolume.toLocaleString()} كجم في آخر 3 تمارين.`,
      };
    } else if (recentType.includes('leg') || (hasLegs && !hasPush)) {
      yogaRoutine = {
        ...RECOVERY_ROUTINES_LIBRARY.find((r) => r.id === 'yoga-legs-posterior-hip-relief')!,
        matchReason: `Calibrated to release pelvic & hamstring tension from your ${mostRecent.session.name}.`,
        matchReasonAr: `مصممة لإزالة الشد العضلي في الحوض والأوتار بعد تمرين الأرجل (${mostRecent.session.nameAr || mostRecent.session.name}).`,
      };
    } else if (recentType.includes('pull') || (hasPull && !hasPush)) {
      yogaRoutine = {
        ...RECOVERY_ROUTINES_LIBRARY.find((r) => r.id === 'yoga-pull-spine-decompression')!,
        matchReason: `Calibrated to decompress lumbar discs and stretch latissimus dorsi from ${mostRecent.session.name}.`,
        matchReasonAr: `مصممة لفك ضغط الفقرات القطنية وإطالة المجنص بعد تمرين الظهر (${mostRecent.session.nameAr || mostRecent.session.name}).`,
      };
    } else {
      // Default / Push
      yogaRoutine = {
        ...RECOVERY_ROUTINES_LIBRARY.find((r) => r.id === 'yoga-push-chest-shoulder-open')!,
        matchReason: `Calibrated to open shortened pectorals and anterior deltoids loaded in ${mostRecent.session.name}.`,
        matchReasonAr: `مصممة لفتح القفص الصدري وإطالة الكتف الأمامي بعد تمرين الدفع (${mostRecent.session.nameAr || mostRecent.session.name}).`,
      };
    }

    // 2. SELECT MOBILITY SESSION
    let mobilityRoutine: PrescribedRecoverySession;
    if (recentType.includes('leg') || (hasLegs && !hasPush)) {
      mobilityRoutine = {
        ...RECOVERY_ROUTINES_LIBRARY.find((r) => r.id === 'mobility-hip-ankle-lower-chain')!,
        matchReason: `Targets hip internal/external rotation and ankle dorsiflexion following ${mostRecent.session.name}.`,
        matchReasonAr: `تستهدف مرونة دوران مفصل الورك والكاحل بعد تمرين (${mostRecent.session.nameAr || mostRecent.session.name}).`,
      };
    } else {
      mobilityRoutine = {
        ...RECOVERY_ROUTINES_LIBRARY.find((r) => r.id === 'mobility-shoulder-t-spine')!,
        matchReason: `Restores scapular glide and thoracic rotation after heavy pressing and rowing.`,
        matchReasonAr: `تستعيد مرونة لوح الكتف والدوران الصدري بعد تمارين الضغط والتجديف العلوية.`,
      };
    }

    // 3. SELECT STRETCHING SESSION
    let stretchRoutine: PrescribedRecoverySession;
    if (recentType.includes('leg') || (hasLegs && !hasPull)) {
      stretchRoutine = {
        ...RECOVERY_ROUTINES_LIBRARY.find((r) => r.id === 'stretching-legs-hips-chain')!,
        matchReason: `Resets resting muscle tone in quadriceps, hip flexors, and calves after leg volume.`,
        matchReasonAr: `تعيد الطول الطبيعي للألياف في الفخذ الأمامي وعضلات الحوض والسمانة.`,
      };
    } else if (recentType.includes('pull') || hasPull) {
      stretchRoutine = {
        ...RECOVERY_ROUTINES_LIBRARY.find((r) => r.id === 'stretching-pull-upper-back')!,
        matchReason: `Releases trapezius, rhomboids, and lats fatigued in recent pulling sessions.`,
        matchReasonAr: `تزيل التصلب من عضلات الترابيس والمعينيات واللاتس الناتجة عن تمارين السحب.`,
      };
    } else {
      stretchRoutine = {
        ...RECOVERY_ROUTINES_LIBRARY.find((r) => r.id === 'stretching-push-anterior-chain')!,
        matchReason: `Direct static elongation for pectoralis major, anterior delts, and triceps long head.`,
        matchReasonAr: `إطالة ساكنة مباشرة لعضلات الصدر الكبير والأكتاف الأمامية ورأس الترايسبس الطويل.`,
      };
    }

    return [yogaRoutine, mobilityRoutine, stretchRoutine];
  }
}
