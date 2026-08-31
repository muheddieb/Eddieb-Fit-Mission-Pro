import { 
  UserProfile, 
  WorkoutSession, 
  SleepLog, 
  InterruptionAnalysis, 
  ReturnToTrainingLevel, 
  ReturnWorkoutPlan, 
  ReturnExerciseItem, 
  PreReturnCheckin, 
  PostReturnFeedback,
  ReturnTrainingState
} from '../types';
import { exerciseSeedData } from '../data/exerciseSeed';
import { PPLEngine } from './pplEngine';

const RETURN_STATE_STORAGE_KEY = 'eddieb_return_to_training_state_v1';

export const ReturnToTrainingEngine = {
  /**
   * Analyze workout history to detect interruptions, classify severity level,
   * calculate current readiness, and determine the optimal return pathway.
   */
  analyzeInterruption(
    history: WorkoutSession[], 
    profile: UserProfile, 
    sleepLogs?: SleepLog[]
  ): InterruptionAnalysis {
    const completedWorkouts = [...history]
      .filter(w => w.completed)
      .sort((a, b) => {
        const timeA = a.completedAt || (a.timestamp || new Date(a.date).getTime());
        const timeB = b.completedAt || (b.timestamp || new Date(b.date).getTime());
        return timeB - timeA;
      });

    // If brand new user with 0 workouts
    if (completedWorkouts.length === 0) {
      return {
        daysSinceLastWorkout: 0,
        lastWorkoutDate: null,
        interruptionLevel: 'normal',
        interruptionLevelNumber: 0,
        levelLabel: 'Fresh Start / First Session',
        levelLabelAr: 'بداية جديدة / أول تمرين',
        isInterrupted: false,
        currentReadinessScore: 90,
        readinessLevel: 'optimal',
        readinessLabel: 'Ready for Baseline Induction',
        readinessLabelAr: 'جاهز لتسجيل نقطة البداية',
        totalReturnSessionsNeeded: 1,
        currentReturnSessionIndex: 1,
        recurringBreakPattern: false,
        totalPreviousBreaks: 0,
        recommendedLoadFactor: 0.85,
        recommendedVolumeFactor: 0.85,
        recommendedRpeTarget: 7,
        reasonText: 'Initial baseline induction session. Start with calibrated exploratory weights.',
        reasonTextAr: 'جلسة تحديد نقطة البداية الأولى. ابدأ بأوزان استكشافية تدريجية.',
        summaryGuidance: 'Focus on movement technique and establishing your baseline loads.',
        summaryGuidanceAr: 'ركز على إتقان التكنيك الحركي وتحديد أوزان البداية بدقة.',
      };
    }

    const lastWorkout = completedWorkouts[0];
    const lastDateStr = lastWorkout.date;
    const now = new Date();
    
    // Parse last workout date cleanly at midnight
    const [y, m, d] = lastDateStr.split('-').map(Number);
    const lastDate = new Date(y, m - 1, d);
    const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = todayAtMidnight.getTime() - lastDate.getTime();
    const daysSinceLastWorkout = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    // Calculate historical break frequency (how many past gaps > 7 days occurred)
    let totalPreviousBreaks = 0;
    for (let i = 0; i < completedWorkouts.length - 1; i++) {
      const w1 = new Date(completedWorkouts[i].date);
      const w2 = new Date(completedWorkouts[i + 1].date);
      const gapDays = Math.floor((w1.getTime() - w2.getTime()) / (1000 * 60 * 60 * 24));
      if (gapDays >= 7) {
        totalPreviousBreaks++;
      }
    }
    const recurringBreakPattern = totalPreviousBreaks >= 2;

    // Calculate last performance metrics
    let totalLastVol = 0;
    let rpeSum = 0;
    let rpeCount = 0;
    const primaryExNames: string[] = [];

    lastWorkout.exercises?.forEach(ex => {
      primaryExNames.push(ex.exerciseName);
      ex.sets?.forEach(s => {
        if (s.completed) {
          totalLastVol += (s.actualWeight || 0) * (s.actualReps || 0);
          if (s.rpe) {
            rpeSum += s.rpe;
            rpeCount++;
          }
        }
      });
    });

    const avgLastRpe = rpeCount > 0 ? +(rpeSum / rpeCount).toFixed(1) : 8;

    // Default baseline readiness
    let readinessScore = 95;
    let level: ReturnToTrainingLevel = 'normal';
    let levelNumber: 0 | 1 | 2 | 3 | 4 = 0;
    let totalSessionsNeeded = 1;
    let loadFactor = 1.0;
    let volumeFactor = 1.0;
    let rpeTarget = 8;
    let levelLabel = 'Level 0 — Normal Consistency';
    let levelLabelAr = 'المستوى 0 — تدريب اعتيادي منتظم';
    let reasonText = '';
    let reasonTextAr = '';
    let summaryGuidance = '';
    let summaryGuidanceAr = '';

    if (daysSinceLastWorkout <= 3) {
      // Level 0: 0-3 days
      level = 'normal';
      levelNumber = 0;
      readinessScore = 96;
      loadFactor = 1.0;
      volumeFactor = 1.0;
      rpeTarget = 8;
      totalSessionsNeeded = 0;
      levelLabel = 'Level 0 — Normal Discipline';
      levelLabelAr = 'المستوى 0 — تدريب منتظم وطبيعي';
      reasonText = `You trained ${daysSinceLastWorkout === 0 ? 'today' : daysSinceLastWorkout === 1 ? 'yesterday' : `${daysSinceLastWorkout} days ago`}. Your neuromuscular system and conditioning are fully primed for standard progressive training.`;
      reasonTextAr = `آخر تمرين كان ${daysSinceLastWorkout === 0 ? 'اليوم' : daysSinceLastWorkout === 1 ? 'أمس' : `منذ ${daysSinceLastWorkout} أيام`}. جهازك العصبي وعضلاتك في قمة الجاهزية لمواصلة البرنامج الاعتيادي وزيادة الأحمال.`;
      summaryGuidance = 'Continue standard PPL progression with full target weights and volume.';
      summaryGuidanceAr = 'استمر في برنامج الدفع والسحب والأرجل الاعتيادي مع تطبيق الزيادة التدريجية للأحمال.';
    } else if (daysSinceLastWorkout <= 7) {
      // Level 1: 4-7 days
      level = 'light';
      levelNumber = 1;
      readinessScore = 85;
      loadFactor = 0.90;
      volumeFactor = 0.85;
      rpeTarget = 7.5;
      totalSessionsNeeded = 1;
      levelLabel = 'Level 1 — Short Break (Light Return)';
      levelLabelAr = 'المستوى 1 — انقطاع قصير (عودة خفيفة)';
      reasonText = `You have taken a ${daysSinceLastWorkout}-day rest. While cardiovascular and muscle mass are intact, nervous system readiness drops slightly. We reduce working intensity by 10-15% for the first session.`;
      reasonTextAr = `انقطعت لمدة ${daysSinceLastWorkout} أيام. الكتلة العضلية والتحمل سليمين تماماً، ولكن الكفاءة العصبية تقل بنسبة طفيفة. سنبدأ الجلسة الأولى بشدة أقل بنسبة 10-15% لضمان الانسيابية.`;
      summaryGuidance = 'Start with slightly conservative weights (90% load) on first sets, focusing on joint lubrication and crisp form.';
      summaryGuidanceAr = 'ابدأ بأوزان متحفظة قليلاً (90% من أوزانك المعتادة) مع التركيز على مرونة المفاصل وجودة الحركة.';
    } else if (daysSinceLastWorkout <= 14) {
      // Level 2: 8-14 days
      level = 'moderate';
      levelNumber = 2;
      readinessScore = 70;
      loadFactor = 0.75;
      volumeFactor = 0.75;
      rpeTarget = 7.0;
      totalSessionsNeeded = 1;
      levelLabel = 'Level 2 — Moderate Return Mode';
      levelLabelAr = 'المستوى 2 — انقطاع متوسط (تفعيل وضع العودة الذكي)';
      reasonText = `It has been ${daysSinceLastWorkout} days since your last workout. Tendon stiffness and muscle glycogen sensitivity have adapted down. Jumping straight to heavy weights increases injury risk and excessive delayed onset muscle soreness (DOMS).`;
      reasonTextAr = `مر ${daysSinceLastWorkout} يوماً منذ آخر تمرين. مرونة الأوتار وحساسية الجليكوجين انخفضت مؤقتاً. العودة المباشرة للأوزان الثقيلة السابقة ترفع احتمالية الإجهاد والشد العضلي الشديد. سنقوم بإعادة تنشيط مدروسة.`;
      summaryGuidance = 'Perform a 1-session re-activation workout at 75% load and RPE 7 before resuming standard progressive overload.';
      summaryGuidanceAr = 'أداء جلسة تنشيط وإعادة تهيئة بحمل 75% وجهد RPE 7 لاستعادة السيطرة الحركية قبل استئناف البرنامج الأساسي.';
    } else if (daysSinceLastWorkout <= 30) {
      // Level 3: 15-30 days
      level = 'reconditioning';
      levelNumber = 3;
      readinessScore = 55;
      loadFactor = 0.65;
      volumeFactor = 0.65;
      rpeTarget = 6.5;
      totalSessionsNeeded = 2;
      levelLabel = 'Level 3 — Reconditioning Phase';
      levelLabelAr = 'المستوى 3 — انقطاع طويل (مرحلة إعادة التكييف والتأهيل)';
      reasonText = `You have been away for ${daysSinceLastWorkout} days. We are initiating a 2-session Reconditioning Phase (Day 1: Mobility & Core Re-activation; Day 2: Light Compound Quality) to safely prepare connective tissues and restore neuromuscular firing.`;
      reasonTextAr = `انقطعت عن التمرين لمدة ${daysSinceLastWorkout} يوماً. قمنا بتفعيل مسار إعادة التكييف والتأهيل عبر جلستين (اليوم 1: تنشيط الحركية والمفاصل والكور؛ اليوم 2: حركة خفيفة للجسم) لحماية الأربطة واستعادة التوافق العضلي العصبي.`;
      summaryGuidance = '2 progressive re-entry sessions at 65% loads with strict focus on movement mechanics and zero failure.';
      summaryGuidanceAr = 'جلستان متتاليتان لإعادة التكييف بحمل 65% من أوزانك السابقة والتركيز التام على جودة المسار الحركي والابتعاد عن الفشل العضلي.';
    } else {
      // Level 4: >30 days
      level = 'restart';
      levelNumber = 4;
      readinessScore = 40;
      loadFactor = 0.50;
      volumeFactor = 0.50;
      rpeTarget = 6.0;
      totalSessionsNeeded = 2;
      levelLabel = 'Level 4 — Restart & Re-Entry Assessment';
      levelLabelAr = 'المستوى 4 — انقطاع ممتد (إعادة تقييم الجاهزية والبدء المتدرج)';
      reasonText = `You have been off training for ${daysSinceLastWorkout} days (${Math.floor(daysSinceLastWorkout / 30)} months). Your previous fitness foundation and muscle memory remain coded in your muscle nuclei, but current systemic readiness requires gradual re-priming.`;
      reasonTextAr = `توقفت عن التدريب منذ ${daysSinceLastWorkout} يوماً. ذاكرتك العضلية والأساس التدريبي السابق محفوظان بالكامل، لكن الجاهزية الفسيولوجية الحالية تتطلب عودة تدريجية ذكية لحماية المفاصل وإعادة بناء اللياقة.`;
      summaryGuidance = 'Structured reconditioning with gentle full-body activation at 50-55% historical loads and progressive post-workout readiness calibration.';
      summaryGuidanceAr = 'إعادة تأهيل متدرجة بأحمال 50-55% من مستواك السابق مع تقييم استجابة جسمك بعد كل جلسة لرفع الشدة خطوة بخطوة.';
    }

    // Incorporate sleep correlation if available
    if (sleepLogs && sleepLogs.length > 0) {
      const recentSleep = sleepLogs[0];
      if (recentSleep.durationHours < 6.0 || recentSleep.qualityScore < 65) {
        readinessScore = Math.max(30, readinessScore - 8);
      } else if (recentSleep.durationHours >= 7.5 && recentSleep.qualityScore >= 80) {
        readinessScore = Math.min(100, readinessScore + 5);
      }
    }

    // If user has recurring break pattern, add tailored sports science feedback
    if (recurringBreakPattern && daysSinceLastWorkout >= 4) {
      reasonText += ` (Note: A recurring training rhythm was detected. The AI adapts your volume flexibility without penalizing your historical records).`;
      reasonTextAr += ` (ملاحظة: تم رصد نمط انقطاع متكرر بسبب ظروف السفر أو العمل. النظام يكيف حجم التدريب بمرونة دون التأثير على أرقامك القياسية وتاريخك).`;
    }

    let readinessLevel: 'optimal' | 'good' | 'moderate' | 'low' | 'reconditioning' = 'optimal';
    let readinessLabel = 'Optimal Readiness';
    let readinessLabelAr = 'جاهزية ممتازة';

    if (readinessScore >= 85) {
      readinessLevel = 'optimal';
      readinessLabel = 'Optimal Readiness';
      readinessLabelAr = 'جاهزية بدنية عالية';
    } else if (readinessScore >= 75) {
      readinessLevel = 'good';
      readinessLabel = 'Good Readiness (Minor Ramp)';
      readinessLabelAr = 'جاهزية جيدة (تدرج خفيف)';
    } else if (readinessScore >= 60) {
      readinessLevel = 'moderate';
      readinessLabel = 'Moderate Readiness';
      readinessLabelAr = 'جاهزية متوسطة (تنشيط مطلوب)';
    } else if (readinessScore >= 45) {
      readinessLevel = 'low';
      readinessLabel = 'Low Systemic Readiness';
      readinessLabelAr = 'جاهزية منخفضة مؤقتاً';
    } else {
      readinessLevel = 'reconditioning';
      readinessLabel = 'Reconditioning Stage Required';
      readinessLabelAr = 'مرحلة إعادة تأهيل وتكييف كاملة';
    }

    return {
      daysSinceLastWorkout,
      lastWorkoutDate: lastDateStr,
      lastWorkoutName: lastWorkout.name,
      lastWorkoutNameAr: lastWorkout.nameAr,
      interruptionLevel: level,
      interruptionLevelNumber: levelNumber,
      levelLabel,
      levelLabelAr,
      isInterrupted: daysSinceLastWorkout >= 4,
      currentReadinessScore: readinessScore,
      readinessLevel,
      readinessLabel,
      readinessLabelAr,
      totalReturnSessionsNeeded: totalSessionsNeeded,
      currentReturnSessionIndex: 1,
      recurringBreakPattern,
      totalPreviousBreaks,
      recommendedLoadFactor: loadFactor,
      recommendedVolumeFactor: volumeFactor,
      recommendedRpeTarget: rpeTarget,
      reasonText,
      reasonTextAr,
      summaryGuidance,
      summaryGuidanceAr,
      lastPerformanceSummary: {
        totalVolumeKg: totalLastVol,
        avgRpe: avgLastRpe,
        primaryExercises: primaryExNames.slice(0, 4),
      },
    };
  },

  /**
   * Find historical weight for an exercise to calculate safe calibrated reduction.
   */
  findHistoricalWeight(exerciseId: string, history: WorkoutSession[]): number {
    for (const session of history) {
      if (!session.exercises) continue;
      for (const ex of session.exercises) {
        if (ex.exerciseId === exerciseId || ex.exerciseName?.toLowerCase() === exerciseId.toLowerCase()) {
          const completedSets = ex.sets?.filter(s => s.completed && s.actualWeight > 0) || [];
          if (completedSets.length > 0) {
            // Return max working weight
            const weights = completedSets.map(s => s.actualWeight);
            return Math.max(...weights);
          }
        }
      }
    }
    // Default safe baseline weight
    const seed = exerciseSeedData.find(e => e.id === exerciseId);
    if (seed?.equipment.toLowerCase().includes('barbell')) return 40;
    if (seed?.equipment.toLowerCase().includes('dumbbell')) return 14;
    if (seed?.equipment.toLowerCase().includes('cable')) return 25;
    return 0; // bodyweight
  },

  /**
   * Generate complete structured multi-stage Return-to-Training Workout Plan.
   * Covers Phases A to E (Warm-up, Mobility, Activation, Light Reconditioning, Cool-down).
   */
  generateReturnPlan(
    analysis: InterruptionAnalysis,
    profile: UserProfile,
    history: WorkoutSession[],
    sessionIndex: number = 1,
    checkin?: PreReturnCheckin
  ): ReturnWorkoutPlan {
    const isHome = profile.preferredLocation === 'home';
    const isAr = profile.language === 'ar';
    const loadFactor = analysis.recommendedLoadFactor;

    // Apply pre-workout check-in adjustments if provided
    let dynamicLoadFactor = loadFactor;
    let dynamicSetsDelta = 0;
    let adaptiveNote = '';
    let adaptiveNoteAr = '';

    if (checkin) {
      if (checkin.feeling === 'tired' || checkin.feeling === 'very_tired' || checkin.energyLevel <= 4) {
        dynamicLoadFactor = Math.max(0.40, dynamicLoadFactor - 0.10);
        dynamicSetsDelta = -1;
        adaptiveNote = 'Volume reduced by 1 set and load softened due to reported low energy and fatigue.';
        adaptiveNoteAr = 'تم تخفيف الحمل بنسبة إضافية 10% وتقليل المجموعات بمقدار مجموعة واحدة نظراً للشعور بالإجهاد المسجل.';
      } else if (checkin.feeling === 'great' && checkin.energyLevel >= 8 && checkin.sleepQuality >= 8) {
        dynamicLoadFactor = Math.min(0.85, dynamicLoadFactor + 0.05);
        adaptiveNote = 'Slight intensity calibration boost (+5%) enabled due to optimal sleep and high readiness energy.';
        adaptiveNoteAr = 'تمت إضافة تحفيز طفيف للحمل (+5%) نظراً لجودة النوم العالية ومستوى الطاقة الممتاز اليوم.';
      }

      if (checkin.painLevel === 'mild' || checkin.painLevel === 'pain') {
        const area = checkin.painArea ? ` (${checkin.painArea})` : '';
        adaptiveNote += ` Discomfort reported${area}. Biomechanical joint caution flags attached to all loading sets.`;
        adaptiveNoteAr += ` تم تسجيل انزعاج مفصلي${area}. تم تفعيل تنبيهات الأمان وتخفيف الحمل على المفاصل المتأثرة.`;
      }
    }

    // ----------------------------------------------------
    // PHASE A: General Warm-up
    // ----------------------------------------------------
    const warmupItems: ReturnExerciseItem[] = [
      {
        id: 'ret_warmup_1',
        exerciseId: 'warmup_cardio_light',
        name: isHome ? 'Dynamic Bodyweight Movement & High Knees' : 'Incline Treadmill Walk & Core Temp Elevation',
        nameAr: isHome ? 'حركة خفيفة ورفع الركبتين لرفع حرارة الجسم' : 'مشي تدريجي على السير المائل لرفع حرارة الجسم',
        stage: 'warmup',
        stageLabel: 'Phase A: General Warm-up',
        stageLabelAr: 'المرحلة أ: الإحماء العام',
        targetSets: 1,
        targetReps: '5-7 min',
        suggestedWeightKg: 0,
        durationSeconds: 360,
        restSeconds: 30,
        targetRpe: 5,
        instructions: [
          'Elevate core body temperature gradually.',
          'Breathe deeply in through the nose and out through the mouth.',
          'Keep heart rate in comfortable Zone 1-2 (100-120 BPM).'
        ],
        instructionsAr: [
          'رفع درجة حرارة الجسم والعضلات تدريجياً.',
          'تنفس بعمق من الأنف والزفير من الفم.',
          'الحفاظ على نبض القلب في المنطقة المريحة (100-120 نبضة/د).'
        ],
        safetyNotes: 'Do not sprint or push high speeds. Focus purely on systemic blood flow.',
        safetyNotesAr: 'لا تجري بسرعة عالية. الهدف هو زيادة تدفق الدم للمفاصل والعضلات فقط.',
        primaryMuscle: 'Cardiovascular System',
        primaryMuscleAr: 'الجهاز الدوري والقلب',
      },
      {
        id: 'ret_warmup_2',
        exerciseId: 'warmup_arm_leg_swings',
        name: 'Dynamic Arm Swings & Leg Swings',
        nameAr: 'أرجحة الذراعين والأرجل الحركية',
        stage: 'warmup',
        stageLabel: 'Phase A: General Warm-up',
        stageLabelAr: 'المرحلة أ: الإحماء العام',
        targetSets: 2,
        targetReps: '12-15 swings each side',
        suggestedWeightKg: 0,
        durationSeconds: 120,
        restSeconds: 20,
        targetRpe: 5,
        instructions: [
          'Perform forward-backward and side-to-side leg swings holding a wall or rail.',
          'Cross arms gently across chest to lubricate shoulder capsules.'
        ],
        instructionsAr: [
          'أرجحة الساق للأمام والخلف وللجانبين مع الاستناد على جدار أو حامل.',
          'تحريك الذراعين باتساع الصدر لتليين محفظة الكتف.'
        ],
        primaryMuscle: 'Hips & Shoulder Girdle',
        primaryMuscleAr: 'مفاصل الحوض وحزام الكتف',
      }
    ];

    // ----------------------------------------------------
    // PHASE B: Joint Mobility
    // ----------------------------------------------------
    const mobilityItems: ReturnExerciseItem[] = [
      {
        id: 'ret_mob_1',
        exerciseId: 'mob_thoracic_rotations',
        name: 'Thoracic Spine Rotations (Open Books / Quadruped)',
        nameAr: 'دوران وتليين الفقرات الصدرية وأعلى الظهر',
        stage: 'mobility',
        stageLabel: 'Phase B: Joint Mobility',
        stageLabelAr: 'المرحلة ب: مرونة المفاصل',
        targetSets: 2,
        targetReps: '8 reps per side',
        suggestedWeightKg: 0,
        durationSeconds: 90,
        restSeconds: 30,
        targetRpe: 5.5,
        instructions: [
          'Start on hands and knees, place one hand behind head.',
          'Rotate elbow toward opposite wrist, then rotate upward toward ceiling opening chest.',
          'Breathe out at the top stretch.'
        ],
        instructionsAr: [
          'ابدأ بوضعية الارتكاز على اليدين والركبتين، وضع يداً خلف الرأس.',
          'قم بتدوير الكوع نحو المعصم المقابل، ثم افتح الصدر لأعلى باتجاه السقف.',
          'اخرج زفيراً عند الوصول لأعلى نقطة إطالة.'
        ],
        safetyNotes: 'Keep hips stable; rotate purely through upper and mid-back.',
        safetyNotesAr: 'ثبت الحوض؛ اجعل الدوران صادراً من الفقرات الصدرية وأعلى الظهر فقط.',
        primaryMuscle: 'Thoracic Spine & Scapulae',
        primaryMuscleAr: 'الفقرات الصدرية ولوحي الكتف',
      },
      {
        id: 'ret_mob_2',
        exerciseId: 'mob_worlds_greatest_stretch',
        name: "World's Greatest Stretch (Lunge + Reach + Hamstring Rock)",
        nameAr: 'تمرين الإطالة الشامل (اللانج + دوران الجذع + استطالة الفخذ)',
        stage: 'mobility',
        stageLabel: 'Phase B: Joint Mobility',
        stageLabelAr: 'المرحلة ب: مرونة المفاصل',
        targetSets: 2,
        targetReps: '6 reps per side',
        suggestedWeightKg: 0,
        durationSeconds: 120,
        restSeconds: 30,
        targetRpe: 6,
        instructions: [
          'Step into a deep forward lunge with hands on floor inside front foot.',
          'Reach inside elbow toward floor, then rotate arm straight up to the sky.',
          'Rock hips back to gently stretch the front hamstring.'
        ],
        instructionsAr: [
          'اندفع للأمام بوضعية لانج عميقة مع وضع اليدين على الأرض بجانب القدم الأمامية.',
          'أنزل الكوع نحو الأرض ثم ارفع الذراع لأعلى نحو السماء مع تدوير الجذع.',
          'ارجع بالحوض للخلف لتمديد العضلة الخلفية للساق الأمامية.'
        ],
        primaryMuscle: 'Hip Flexors, Hamstrings & Thoracic Spine',
        primaryMuscleAr: 'عضلات الحوض والهانش والخلفيات',
      },
      {
        id: 'ret_mob_3',
        exerciseId: 'mob_deep_squat_ankle_rock',
        name: 'Deep Goblet/Assisted Squat Pry & Ankle Mobility',
        nameAr: 'جلسة القرفصاء العميقة وتليين مفصل الكاحل',
        stage: 'mobility',
        stageLabel: 'Phase B: Joint Mobility',
        stageLabelAr: 'المرحلة ب: مرونة المفاصل',
        targetSets: 2,
        targetReps: '30s hold & rock',
        suggestedWeightKg: 0,
        durationSeconds: 60,
        restSeconds: 30,
        targetRpe: 5.5,
        instructions: [
          'Sit deep into a comfortable squat (holding a sturdy pole or light plate if needed).',
          'Use elbows to gently nudge knees outward.',
          'Gently shift weight side-to-side to mobilize ankle dorsiflexion.'
        ],
        instructionsAr: [
          'اجلس بوضعية سكوات عميقة ومريحة (مع الاستناد على عمود أو وزن خفيف إذا لزم).',
          'استخدم الكوعين لدفع الركبتين للخارج برفق.',
          'انقل وزنك يميناً ويساراً لزيادة مرونة مفصل الكاحل.'
        ],
        primaryMuscle: 'Ankles, Hips & Adductors',
        primaryMuscleAr: 'مفصل الكاحل والحوض والعضلات الضامة',
      }
    ];

    // ----------------------------------------------------
    // PHASE C: Muscle Activation
    // ----------------------------------------------------
    const activationItems: ReturnExerciseItem[] = [
      {
        id: 'ret_act_1',
        exerciseId: 'act_glute_bridge',
        name: 'Glute Bridge with 2-Second Isometric Squeeze',
        nameAr: 'رفع الحوض مع عصر الجلوتس لمدة ثانيتين',
        stage: 'activation',
        stageLabel: 'Phase C: Muscle Activation',
        stageLabelAr: 'المرحلة ج: تنشيط العضلات المستهدفة',
        targetSets: 2,
        targetReps: '12-15 reps',
        suggestedWeightKg: 0,
        restSeconds: 45,
        targetRpe: 6,
        instructions: [
          'Lie on back with knees bent at 90 degrees and feet flat.',
          'Drive through heels and extend hips fully until straight line from knees to shoulders.',
          'Hold at peak contraction for 2 full seconds.'
        ],
        instructionsAr: [
          'استلقِ على الظهر مع ثني الركبتين بزاوية 90 درجة.',
          'ادفع من خلال الكعبين وارفع الحوض حتى يشكل خطاً مستقيماً مع الركبتين والكتفين.',
          'اثبت في قمة الانقباض لمدة ثانيتين كاملتين مع عصر العضلة.'
        ],
        primaryMuscle: 'Gluteus Maximus & Hamstrings',
        primaryMuscleAr: 'عضلات الجلوتس والمؤخرة',
      },
      {
        id: 'ret_act_2',
        exerciseId: 'act_deadbug_bird_dog',
        name: 'Dead Bug / Bird-Dog Anti-Extension Core Activation',
        nameAr: 'تمرين الديد باج / بيرد دوج لتنشيط عضلات الكور العميقة',
        stage: 'activation',
        stageLabel: 'Phase C: Muscle Activation',
        stageLabelAr: 'المرحلة ج: تنشيط العضلات المستهدفة',
        targetSets: 2,
        targetReps: '10 reps per side',
        suggestedWeightKg: 0,
        restSeconds: 45,
        targetRpe: 6,
        instructions: [
          'Maintain neutral lumbar spine with lower back glued to floor (Dead Bug) or flat back (Bird Dog).',
          'Extend opposite arm and leg slowly while bracing core like preparing for a punch.'
        ],
        instructionsAr: [
          'حافظ على استقامة العمود الفقري مع تثبيت أسفل الظهر جيداً.',
          'مد الذراع والساق المعاكسة ببطء مع شد عضلات البطن وكأنك تستعد لصد ضربة.'
        ],
        primaryMuscle: 'Transverse Abdominis & Deep Core',
        primaryMuscleAr: 'عضلات البطن العميقة والكور',
      },
      {
        id: 'ret_act_3',
        exerciseId: 'act_band_face_pull_slide',
        name: isHome ? 'Prone Y-T-W Scapular Retractions' : 'Banded / Cable Face Pulls with External Rotation',
        nameAr: isHome ? 'تمرين Y-T-W الأرضي لتنشيط عضلات الظهر العلوية والكتف' : 'فيس بول بالكابل أو المقاومة لتنشيط لوحي الكتف والكتف الخلفي',
        stage: 'activation',
        stageLabel: 'Phase C: Muscle Activation',
        stageLabelAr: 'المرحلة ج: تنشيط العضلات المستهدفة',
        targetSets: 2,
        targetReps: '12-15 reps',
        suggestedWeightKg: isHome ? 0 : 15,
        restSeconds: 45,
        targetRpe: 6.5,
        instructions: [
          'Pull hands toward eye level while spreading elbows apart.',
          'Squeeze shoulder blades together and externally rotate forearms backward.'
        ],
        instructionsAr: [
          'اسحب المقبض نحو مستوى العينين مع فتح الكوعين للخارج.',
          'قم بضم لوحي الكتف معاً وتدوير الساعدين للخلف في نهاية الحركة.'
        ],
        primaryMuscle: 'Rear Delts & Rhomboids',
        primaryMuscleAr: 'الكتف الخلفي والعضلات المعينية بأعلى الظهر',
      }
    ];

    // ----------------------------------------------------
    // PHASE D: Light Strength & Movement Quality Reconditioning
    // Tailored based on Gym vs Home & Session 1 vs Session 2
    // ----------------------------------------------------
    const targetSetsCount = Math.max(2, (analysis.interruptionLevelNumber >= 3 ? 2 : 3) + dynamicSetsDelta);

    let strengthExercises: {
      id: string;
      exerciseId: string;
      name: string;
      nameAr: string;
      primaryMuscle: string;
      primaryMuscleAr: string;
      targetReps: string;
      restSec: number;
      defaultWeight: number;
      instructions: string[];
      instructionsAr: string[];
      alternatives: string[];
    }[] = [];

    if (sessionIndex === 1) {
      // Session 1: Full-Body Movement Pattern Reactivation (Squat, Press, Pull, Hinge, Lateral)
      strengthExercises = [
        {
          id: 'ret_str_1',
          exerciseId: isHome ? 'legs_goblet_squat' : 'legs_leg_press',
          name: isHome ? 'Dumbbell Goblet Squat (Tempo 3-1-1)' : 'Leg Press / Controlled Goblet Squat',
          nameAr: isHome ? 'سكوات كأس بالدمبل مع النزول البطيء' : 'مكبس الأرجل أو سكوات بالدمبل بنزول متحكم',
          primaryMuscle: 'Quadriceps & Glutes',
          primaryMuscleAr: 'الفخذ الأمامي والجلوتس',
          targetReps: '10-12',
          restSec: 75,
          defaultWeight: isHome ? 12 : 80,
          instructions: [
            'Lower down over 3 seconds under strict control.',
            'Keep chest proud and drive evenly through whole foot.',
            'Stop 3 reps shy of muscle failure (RPE 6.5-7).'
          ],
          instructionsAr: [
            'انزل لأسفل في 3 ثوانٍ بتحكم كامل وتوازن.',
            'حافظ على استقامة الصدر وادفع بالقدم كاملة.',
            'توقف قبل الفشل العضلي بـ 3 تكرارات (جهد RPE 6.5-7).'
          ],
          alternatives: ['legs_barbell_squat', 'legs_bulgarian_split_squat', 'legs_leg_extension'],
        },
        {
          id: 'ret_str_2',
          exerciseId: isHome ? 'push_dumbbell_incline_press' : 'push_dumbbell_incline_press',
          name: 'Incline Dumbbell Chest Press (Controlled Arc)',
          nameAr: 'تجميع دمبل على بنش مائل بمدى حركي كامل ومريح',
          primaryMuscle: 'Upper & Mid Chest',
          primaryMuscleAr: 'عضلة الصدر العلوية والمتوسطة',
          targetReps: '10-12',
          restSec: 75,
          defaultWeight: 16,
          instructions: [
            'Control the descent to full stretch across the chest.',
            'Press up along a gentle natural arc without banging dumbbells together.',
            'Focus on mind-muscle connection rather than shifting heavy iron.'
          ],
          instructionsAr: [
            'تحكم في النزول لإطالة الصدر بشكل مريح.',
            'ادفع لأعلى بمسار قوسي طبيعي دون تصادم الدمبلز.',
            'ركز على الاتصال العضلي العصبي وجودة الحركة وليس الوزن.'
          ],
          alternatives: ['push_barbell_bench_press', 'push_pushups', 'push_cable_chest_fly'],
        },
        {
          id: 'ret_str_3',
          exerciseId: isHome ? 'pull_dumbbell_single_arm_row' : 'pull_lat_pulldown',
          name: isHome ? 'Single-Arm Dumbbell Row' : 'Lat Pulldown (Neutral or Wide Grip)',
          nameAr: isHome ? 'تجديف دمبل فردي مع الاستناد' : 'سحب عالي للظهر (Lat Pulldown) بقبضة مريحة',
          primaryMuscle: 'Latissimus Dorsi & Upper Back',
          primaryMuscleAr: 'عضلات المجنص والظهر',
          targetReps: '10-12',
          restSec: 75,
          defaultWeight: isHome ? 14 : 45,
          instructions: [
            'Pull with elbows driving down toward back pockets.',
            'Hold the contracted squeeze for 1 second before extending arms smoothly.'
          ],
          instructionsAr: [
            'اسحب مع توجيه الكوعين نحو أسفل الظهر.',
            'اثبت في قمة الانقباض لثانية واحدة قبل إعادة فرد الذراعين بنعومة.'
          ],
          alternatives: ['pull_seated_cable_row', 'pull_barbell_bent_row', 'pull_pullups'],
        },
        {
          id: 'ret_str_4',
          exerciseId: isHome ? 'legs_romanian_deadlift' : 'legs_romanian_deadlift',
          name: 'Dumbbell Romanian Deadlift (Hinge Pattern Focus)',
          nameAr: 'رفعة ميتة رومانية بالدمبلز (تركيز ثني الحوض)',
          primaryMuscle: 'Hamstrings & Glutes',
          primaryMuscleAr: 'العضلات الخلفية وأسفل الظهر',
          targetReps: '10-12',
          restSec: 75,
          defaultWeight: 16,
          instructions: [
            'Push hips straight backward as if closing a door behind you.',
            'Maintain a flat back and feel deep hamstring stretch below knees.',
            'Squeeze glutes to stand tall without hyper-extending lower back.'
          ],
          instructionsAr: [
            'ادفع الحوض للخلف تماماً كأنك تغلق باباً خلفك بمؤخرتك.',
            'حافظ على استقامة الظهر واشعر بالإطالة في الخلفيات أسفل الركبتين.',
            'اعصر الجلوتس للوقوف باستقامة دون مبالغة في تقويس الظهر.'
          ],
          alternatives: ['legs_leg_curl', 'legs_barbell_deadlift', 'legs_lying_leg_curl'],
        },
        {
          id: 'ret_str_5',
          exerciseId: 'push_lateral_raises',
          name: 'Dumbbell Lateral Raises (Shoulder Pump)',
          nameAr: 'رفرفة جانبي بالدمبلز لتنشيط الكتف الجانبي',
          primaryMuscle: 'Lateral Deltoid',
          primaryMuscleAr: 'عضلة الكتف الجانبي',
          targetReps: '12-15',
          restSec: 60,
          defaultWeight: 6,
          instructions: [
            'Lead with elbows slightly in front of the body line (scapular plane).',
            'Smooth control, zero body swinging.'
          ],
          instructionsAr: [
            'ارفع من خلال الكوعين للأمام قليلاً في المستوى الحركي للكتف.',
            'تحكم سلس وتجنب مرجحة الجسم نهائياً.'
          ],
          alternatives: ['push_cable_lateral_raise', 'push_seated_dumbbell_shoulder_press'],
        }
      ];
    } else {
      // Session 2: Movement Assessment & Conditioning Bridge
      strengthExercises = [
        {
          id: 'ret_str_2_1',
          exerciseId: isHome ? 'legs_bulgarian_split_squat' : 'legs_barbell_squat',
          name: isHome ? 'Bulgarian Split Squat (Unilateral Stability)' : 'Barbell Back Squat / Hack Squat (Calibrated)',
          nameAr: isHome ? 'سكوات بلغاري فردي لاستعادة التوازن والقوة' : 'سكوات بالبار أو هاك سكوات بوزن محسوب',
          primaryMuscle: 'Quadriceps, Glutes & Adductors',
          primaryMuscleAr: 'الفخذ الأمامي والجلوتس والتوازن',
          targetReps: '8-10',
          restSec: 90,
          defaultWeight: isHome ? 10 : 50,
          instructions: [
            'Test depth and stability. Keep heels planted firmly.',
            'Maintain steady tempo and solid abdominal bracing.'
          ],
          instructionsAr: [
            'اختبر عمق النزول والتوازن مع ثبات الكعبين على الأرض.',
            'حافظ على إيقاع منتظم وشد عضلات البطن.'
          ],
          alternatives: ['legs_leg_press', 'legs_goblet_squat'],
        },
        {
          id: 'ret_str_2_2',
          exerciseId: isHome ? 'push_pushups' : 'push_barbell_bench_press',
          name: isHome ? 'Deficit Push-Ups / DB Flat Press' : 'Flat Barbell Bench Press (Smooth Progression Check)',
          nameAr: isHome ? 'تمرين ضغط مع رفع اليدين / تجميع دمبل مستوي' : 'ضغط بار مستوي على البنش (اختبار المسار الحركي)',
          primaryMuscle: 'Pectoralis Major & Triceps',
          primaryMuscleAr: 'عضلة الصدر والترايسبس',
          targetReps: '8-10',
          restSec: 90,
          defaultWeight: isHome ? 0 : 45,
          instructions: [
            'Plant feet, pinch shoulder blades into the bench.',
            'Lower smoothly to sternum and press with authority.'
          ],
          instructionsAr: [
            'ثبت القدمين وضم لوحي الكتف على البنش.',
            'أنزل البار بسلاسة لمنتصف الصدر وادفع بقوة وثبات.'
          ],
          alternatives: ['push_dumbbell_incline_press', 'push_chest_dips'],
        },
        {
          id: 'ret_str_2_3',
          exerciseId: isHome ? 'pull_incline_dumbbell_curl' : 'pull_seated_cable_row',
          name: isHome ? 'Dumbbell Chest-Supported Row & Bicep Curl' : 'Seated Cable Row (Close / Neutral Grip)',
          nameAr: isHome ? 'تجديف دمبل مائل مع تبادل بايسبس' : 'سحب أرضي بالكابل للظهر بقبضة مريحة',
          primaryMuscle: 'Mid-Back, Rhomboids & Biceps',
          primaryMuscleAr: 'منتصف الظهر ولوحي الكتف والبايسبس',
          targetReps: '10-12',
          restSec: 75,
          defaultWeight: isHome ? 12 : 45,
          instructions: [
            'Initiate the row by retracting scapulae then pulling elbows back.',
            'Hold the peak contraction for 1 second.'
          ],
          instructionsAr: [
            'ابدأ السحب بضم لوحي الكتف ثم سحب الكوعين للخلف.',
            'اثبت في قمة الانقباض لثانية كاملة.'
          ],
          alternatives: ['pull_lat_pulldown', 'pull_barbell_bent_row'],
        },
        {
          id: 'ret_str_2_4',
          exerciseId: 'core_plank_hold',
          name: 'High Plank to Low Plank Transitions & Stability',
          nameAr: 'بلانك مع الثبات والتنفس لتقوية الجذع',
          primaryMuscle: 'Core & Anterior Chain',
          primaryMuscleAr: 'عضلات الجذع والبطن',
          targetReps: '30-45s hold',
          restSec: 60,
          defaultWeight: 0,
          instructions: [
            'Squeeze glutes and quads; keep body in a rigid straight plank line.',
            'Breathe steadily without letting hips sag.'
          ],
          instructionsAr: [
            'اعصر الجلوتس والفخذين وحافظ على استقامة الجسم كاللوح.',
            'تنفس بانتظام دون السماح للحوض بالهبوط لأسفل.'
          ],
          alternatives: ['core_dead_bug', 'core_bird_dog'],
        }
      ];
    }

    const lightStrengthItems: ReturnExerciseItem[] = strengthExercises.map(ex => {
      const histWeight = this.findHistoricalWeight(ex.exerciseId, history) || ex.defaultWeight;
      const suggestedWeight = histWeight > 0 
        ? +(Math.round((histWeight * dynamicLoadFactor) / 2.5) * 2.5).toFixed(1)
        : 0;
      const reductionPct = histWeight > 0 
        ? Math.round((1 - (suggestedWeight / histWeight)) * 100)
        : 0;

      return {
        id: `ret_${ex.id}`,
        exerciseId: ex.exerciseId,
        name: ex.name,
        nameAr: ex.nameAr,
        stage: 'light_strength',
        stageLabel: 'Phase D: Light Reconditioning Strength',
        stageLabelAr: 'المرحلة د: إعادة التكييف العضلي',
        targetSets: targetSetsCount,
        targetReps: ex.targetReps,
        suggestedWeightKg: suggestedWeight,
        historicalWorkingWeightKg: histWeight,
        weightReductionPercent: reductionPct,
        restSeconds: ex.restSec,
        targetRpe: analysis.recommendedRpeTarget,
        instructions: ex.instructions,
        instructionsAr: ex.instructionsAr,
        safetyNotes: `Movement Quality > Load. Weight reduced by ${reductionPct}% to re-sensitize receptors safely. Stop 2-3 reps before failure.`,
        safetyNotesAr: `جودة الحركة أهم من الوزن. تم تخفيف الحمل بنسبة ${reductionPct}% لإعادة تهيئة العضلات بأمان. توقف قبل الفشل بـ 2-3 تكرارات.`,
        primaryMuscle: ex.primaryMuscle,
        primaryMuscleAr: ex.primaryMuscleAr,
        alternatives: ex.alternatives,
      };
    });

    // ----------------------------------------------------
    // PHASE E: Cool-down & Parasympathetic Recovery
    // ----------------------------------------------------
    const cooldownItems: ReturnExerciseItem[] = [
      {
        id: 'ret_cool_1',
        exerciseId: 'cool_box_breathing',
        name: 'Diaphragmatic Box Breathing (Heart Rate Reset)',
        nameAr: 'التنفس الحجابي المهدئ لخفض نبض القلب والاستشفاء',
        stage: 'cooldown',
        stageLabel: 'Phase E: Cool-down & Recovery',
        stageLabelAr: 'المرحلة هـ: التهدئة واستعادة النبض',
        targetSets: 1,
        targetReps: '2-3 min',
        suggestedWeightKg: 0,
        durationSeconds: 150,
        restSeconds: 0,
        targetRpe: 2,
        instructions: [
          'Lie down or sit comfortably. Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds, hold for 4 seconds.',
          'Signals nervous system to shift from sympathetic (fight-or-flight) to parasympathetic (rest & repair).'
        ],
        instructionsAr: [
          'استلقِ أو اجلس بارتياح. شهيق في 4 ثوانٍ، كتم 4 ثوانٍ، زفير 4 ثوانٍ، كتم 4 ثوانٍ.',
          'يرسل إشارات للجهاز العصبي للتحول من وضع الإجهاد إلى وضع الاستشفاء والبناء.'
        ],
        primaryMuscle: 'Autonomic Nervous System & Diaphragm',
        primaryMuscleAr: 'الجهاز العصبي وعضلة الحجاب الحاجز',
      },
      {
        id: 'ret_cool_2',
        exerciseId: 'cool_passive_stretches',
        name: 'Hamstring, Hip Flexor & Pec Wall Passive Stretches',
        nameAr: 'استطالة هادئة للفخذين والحوض والصدر',
        stage: 'cooldown',
        stageLabel: 'Phase E: Cool-down & Recovery',
        stageLabelAr: 'المرحلة هـ: التهدئة واستعادة النبض',
        targetSets: 1,
        targetReps: '30s hold each',
        suggestedWeightKg: 0,
        durationSeconds: 120,
        restSeconds: 0,
        targetRpe: 3,
        instructions: [
          'Hold each static stretch gently without bouncing or pain.',
          'Focus on full muscle lengthening and relaxation.'
        ],
        instructionsAr: [
          'اثبت في كل استطالة برفق دون اهتزاز أو ألم.',
          'ركز على ارتخاء واستطالة ألياف العضلات.'
        ],
        primaryMuscle: 'Full Body Connective Tissue',
        primaryMuscleAr: 'الأنسجة الضامة والأوتار العضلية',
      }
    ];

    const totalExercises = 
      warmupItems.length + 
      mobilityItems.length + 
      activationItems.length + 
      lightStrengthItems.length + 
      cooldownItems.length;

    const estimatedDuration = Math.round(
      (warmupItems.length * 4) + 
      (mobilityItems.length * 3) + 
      (activationItems.length * 3) + 
      (lightStrengthItems.length * targetSetsCount * 2.2) + 
      5
    );

    return {
      id: `return_plan_${Date.now()}_s${sessionIndex}`,
      sessionIndex,
      totalSessions: analysis.totalReturnSessionsNeeded,
      level: analysis.interruptionLevel,
      levelNumber: analysis.interruptionLevelNumber,
      title: sessionIndex === 1
        ? (isAr ? 'جلسة العودة وإعادة التنشيط (المرحلة 1)' : 'Re-Activation & Conditioning Session (Day 1)')
        : (isAr ? 'جلسة تقييم الجاهزية والجسر التدريبي (المرحلة 2)' : 'Movement Quality & Readiness Bridge (Day 2)'),
      titleAr: sessionIndex === 1
        ? 'جلسة العودة وإعادة التنشيط (المرحلة 1)'
        : 'جلسة تقييم الجاهزية والجسر التدريبي (المرحلة 2)',
      subtitle: isAr
        ? `خطة ذكية مخصصة بعد انقطاع ${analysis.daysSinceLastWorkout} يوماً — استعادة النشاط تدريجياً`
        : `Smart return protocol after a ${analysis.daysSinceLastWorkout}-day break — Gradual readiness restoration`,
      subtitleAr: `خطة ذكية مخصصة بعد انقطاع ${analysis.daysSinceLastWorkout} يوماً — استعادة النشاط تدريجياً`,
      estimatedDurationMinutes: estimatedDuration,
      targetIntensity: analysis.interruptionLevelNumber >= 3 ? 'light' : 'light_moderate',
      targetRpeRange: `${analysis.recommendedRpeTarget - 1}-${analysis.recommendedRpeTarget}`,
      estimatedCalories: Math.round(estimatedDuration * 5.8),
      stages: {
        warmup: warmupItems,
        mobility: mobilityItems,
        activation: activationItems,
        lightStrength: lightStrengthItems,
        cooldown: cooldownItems,
      },
      totalExercisesCount: totalExercises,
      primaryGoal: 'Reactivate muscular firing, lubricate connective tissue, and establish safe return baseline without DOMS or injury.',
      primaryGoalAr: 'إعادة تنشيط التوافق العضلي العصبي، تليين المفاصل والأوتار، وتأسيس عودة آمنة بدون إجهاد زائد أو إصابات.',
      adaptiveNote,
      adaptiveNoteAr,
    };
  },

  /**
   * Evaluate Post-Workout Feedback and determine next step via the AI Decision Engine.
   */
  evaluatePostWorkoutFeedback(
    feedback: Partial<PostReturnFeedback>,
    analysis: InterruptionAnalysis,
    plan: ReturnWorkoutPlan
  ): PostReturnFeedback {
    const isAr = true; // Provides both AR & EN strings

    let decision: 'ready_to_resume' | 'take_extra_recovery' | 'extend_reconditioning' | 'medical_consultation_advised' = 'ready_to_resume';
    let decisionText = '';
    let decisionTextAr = '';

    // Safety checks first
    if (feedback.experiencedPain && feedback.painDetails) {
      decision = 'medical_consultation_advised';
      decisionText = 'Pain or abnormal discomfort was recorded during training. We strongly recommend resting the affected joint and consulting a medical professional if pain persists. We will avoid loaded exercises on that area.';
      decisionTextAr = 'تم تسجيل ألم أو انزعاج غير معتاد أثناء التمرين. ننصحك بإراحة المفصل واستشارة أخصائي إذا استمر الألم. سيقوم النظام بحجب وتغيير التمارين الضاغطة على تلك المنطقة تلقائياً.';
    } else if (feedback.fatigueRating && feedback.fatigueRating >= 4 && feedback.muscleSoreness === 'severe') {
      decision = 'take_extra_recovery';
      decisionText = "Elevated systemic fatigue and muscle soreness detected. Your body is adapting to the reload. Let's schedule an active recovery & mobility day before adding weight.";
      decisionTextAr = 'تم رصد إجهاد مرتفع وتصلب عضلي. جسمك يتكيف مع إعادة التحميل. ننصحك بجلسة استشفاء خفيف وإطالات غداً قبل زيادة الأوزان.';
    } else if (plan.sessionIndex < plan.totalSessions) {
      // Advance to next session
      decision = 'extend_reconditioning';
      decisionText = `Session ${plan.sessionIndex} completed with solid movement control! You are ready for Session ${plan.sessionIndex + 1} of your Return Protocol tomorrow.`;
      decisionTextAr = `أنجزت الجلسة ${plan.sessionIndex} بجودة حركة ممتازة! أنت جاهز للجلسة ${plan.sessionIndex + 1} من مسار العودة غداً لتأكيد الجاهزية.`;
    } else {
      // Completed all required sessions with good tolerance
      if (feedback.sessionRpe && feedback.sessionRpe <= 7.5 && (!feedback.fatigueRating || feedback.fatigueRating <= 3)) {
        decision = 'ready_to_resume';
        decisionText = "Outstanding performance! Your readiness score is fully restored. You are approved to resume your standard progressive Push/Pull/Legs training program.";
        decisionTextAr = 'أداء رائع وممتاز! تم استعادة جاهزيتك البدنية والعصبية بنجاح. أنت الآن مؤهل للعودة لبرنامجك التدريبي الأساسي واستئناف زيادة الأحمال بثقة.';
      } else {
        decision = 'take_extra_recovery';
        decisionText = 'Good workout completion. Let us take one gentle recovery day, then resume your regular training program with slight initial deloading.';
        decisionTextAr = 'إكمال ناجح للتمرين. خذ يوماً من الاستشفاء المريح ثم عد لبرنامجك التدريبي مع التدرج في الأحمال.';
      }
    }

    return {
      id: `feedback_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      sessionNumber: plan.sessionIndex,
      energyRating: feedback.energyRating || 4,
      fatigueRating: feedback.fatigueRating || 2,
      muscleSoreness: feedback.muscleSoreness || 'mild',
      difficultyRating: feedback.difficultyRating || 'just_right',
      sessionRpe: feedback.sessionRpe || 6.5,
      completedAllExercises: feedback.completedAllExercises !== false,
      experiencedShortnessOfBreath: feedback.experiencedShortnessOfBreath || false,
      experiencedPain: feedback.experiencedPain || false,
      painDetails: feedback.painDetails,
      timestamp: Date.now(),
      aiDecision: decision,
      aiDecisionText: decisionText,
      aiDecisionTextAr: decisionTextAr,
    };
  },

  /**
   * Convert ReturnWorkoutPlan into a standard WorkoutSession so it can be played,
   * tracked with rest timers and sound alerts in ActiveWorkoutModal seamlessly!
   */
  convertToWorkoutSession(plan: ReturnWorkoutPlan, profile: UserProfile): WorkoutSession {
    const today = new Date().toISOString().split('T')[0];

    // Combine all stages into a unified workout exercises array
    const allItems: ReturnExerciseItem[] = [
      ...plan.stages.warmup,
      ...plan.stages.mobility,
      ...plan.stages.activation,
      ...plan.stages.lightStrength,
      ...plan.stages.cooldown,
    ];

    const workoutExercises = allItems.map(item => {
      const setsCount = item.targetSets || 1;
      const targetRepsNum = parseInt(item.targetReps.split('-')[0] || '10', 10) || 10;
      
      const sets = [];
      for (let i = 1; i <= setsCount; i++) {
        sets.push({
          id: `ret_set_${item.id}_${i}`,
          setNumber: i,
          targetReps: item.targetReps,
          actualReps: targetRepsNum,
          targetWeight: item.suggestedWeightKg || 0,
          actualWeight: item.suggestedWeightKg || 0,
          rpe: item.targetRpe || 6,
          completed: false,
        });
      }

      return {
        exerciseId: item.exerciseId,
        exerciseName: item.name,
        exerciseNameAr: item.nameAr,
        primaryMuscle: item.primaryMuscle,
        sets,
        restSeconds: item.restSeconds || 60,
        targetRpe: item.targetRpe || 6,
        notes: item.safetyNotesAr || item.safetyNotes || item.instructions[0],
        completed: false,
      };
    });

    return {
      id: `session_return_${Date.now()}`,
      date: today,
      name: `Return to Training: ${plan.title}`,
      nameAr: `العودة بعد الانقطاع: ${plan.titleAr}`,
      type: 'full_body',
      mode: profile.mode,
      durationMinutes: plan.estimatedDurationMinutes,
      exercises: workoutExercises,
      notes: plan.adaptiveNoteAr || plan.primaryGoalAr || 'Return to training reconditioning session',
      completed: false,
      startedAt: Date.now(),
    };
  },

  /**
   * Storage helpers for ReturnTrainingState
   */
  getReturnTrainingState(): ReturnTrainingState | null {
    try {
      const data = localStorage.getItem(RETURN_STATE_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to load ReturnTrainingState:', e);
    }
    return null;
  },

  saveReturnTrainingState(state: ReturnTrainingState): void {
    try {
      localStorage.setItem(RETURN_STATE_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save ReturnTrainingState:', e);
    }
  },

  dismissReturnMode(): void {
    const current = this.getReturnTrainingState();
    if (current) {
      current.userDismissed = true;
      current.isInReturnMode = false;
      current.resumedStandardAt = Date.now();
      this.saveReturnTrainingState(current);
    }
  }
};
