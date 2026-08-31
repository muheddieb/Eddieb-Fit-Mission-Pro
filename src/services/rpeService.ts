/**
 * RPE (Rate of Perceived Exertion) & RIR (Reps in Reserve) Calculation Service
 * 
 * Provides evidence-based calculations for:
 * 1. Estimated 1-Rep Max (e1RM) using RTS / Mike Tuchscherer and Brzycki RIR models
 * 2. Dynamic weight adjustment suggestions based on actual vs target RPE
 * 3. Reps in Reserve (RIR) interpretations and tactical training guidance
 * 4. Comprehensive RPE percentage tables for precision auto-regulation
 */

export interface RPEInfo {
  rpe: number;
  rir: number; // Reps in Reserve
  labelEn: string;
  labelAr: string;
  intensityPercentApprox: number; // approximate 1-rep percentage
  descriptionEn: string;
  descriptionAr: string;
  category: 'light' | 'moderate' | 'optimal' | 'hard' | 'maximal';
  color: string; // Tailwind color classes
  badgeBg: string;
  badgeText: string;
  recommendationEn: string;
  recommendationAr: string;
}

export interface RPESuggestionInput {
  currentWeight: number;
  actualReps: number;
  actualRpe: number;
  targetRpe?: number;
  targetReps?: number;
  exerciseName?: string;
  isCompound?: boolean;
}

export interface RPESuggestionResult {
  estimated1RM: number;
  currentIntensityPercent: number;
  actualRir: number;
  targetRpe: number;
  targetReps: number;
  targetRir: number;
  suggestedWeight: number;
  weightDelta: number; // positive = increase, negative = decrease
  percentageDelta: number;
  action: 'increase' | 'maintain' | 'decrease' | 'deload';
  reasonEn: string;
  reasonAr: string;
  tacticalTipEn: string;
  tacticalTipAr: string;
  rpeDelta: number; // actualRpe - targetRpe
  confidence: 'high' | 'medium' | 'moderate';
}

/**
 * Standard RTS / Mike Tuchscherer % of 1RM Matrix by Reps and RPE
 * Values represent fraction of 1RM (e.g. 1 rep @ RPE 10 = 1.00 = 100%)
 */
export const RPE_PERCENTAGE_TABLE: Record<number, Record<number, number>> = {
  // RPE: { reps: percentage }
  10: {
    1: 1.000, 2: 0.955, 3: 0.922, 4: 0.892, 5: 0.863, 
    6: 0.837, 7: 0.811, 8: 0.786, 9: 0.762, 10: 0.739, 11: 0.717, 12: 0.695
  },
  9.5: {
    1: 0.978, 2: 0.939, 3: 0.907, 4: 0.878, 5: 0.850, 
    6: 0.824, 7: 0.799, 8: 0.774, 9: 0.751, 10: 0.728, 11: 0.706, 12: 0.684
  },
  9: {
    1: 0.955, 2: 0.922, 3: 0.892, 4: 0.863, 5: 0.837, 
    6: 0.811, 7: 0.786, 8: 0.762, 9: 0.739, 10: 0.717, 11: 0.695, 12: 0.673
  },
  8.5: {
    1: 0.939, 2: 0.907, 3: 0.878, 4: 0.850, 5: 0.824, 
    6: 0.799, 7: 0.774, 8: 0.751, 9: 0.728, 10: 0.706, 11: 0.684, 12: 0.662
  },
  8: {
    1: 0.922, 2: 0.892, 3: 0.863, 4: 0.837, 5: 0.811, 
    6: 0.786, 7: 0.762, 8: 0.739, 9: 0.717, 10: 0.695, 11: 0.673, 12: 0.651
  },
  7.5: {
    1: 0.907, 2: 0.878, 3: 0.850, 4: 0.824, 5: 0.799, 
    6: 0.774, 7: 0.751, 8: 0.728, 9: 0.706, 10: 0.684, 11: 0.662, 12: 0.640
  },
  7: {
    1: 0.892, 2: 0.863, 3: 0.837, 4: 0.811, 5: 0.786, 
    6: 0.762, 7: 0.739, 8: 0.717, 9: 0.695, 10: 0.673, 11: 0.651, 12: 0.629
  },
  6.5: {
    1: 0.878, 2: 0.850, 3: 0.824, 4: 0.799, 5: 0.774, 
    6: 0.751, 7: 0.728, 8: 0.706, 9: 0.684, 10: 0.662, 11: 0.640, 12: 0.618
  },
  6: {
    1: 0.863, 2: 0.837, 3: 0.811, 4: 0.786, 5: 0.762, 
    6: 0.739, 7: 0.717, 8: 0.695, 9: 0.673, 10: 0.651, 11: 0.629, 12: 0.607
  }
};

export const RPE_DEFINITIONS: Record<number, RPEInfo> = {
  10: {
    rpe: 10,
    rir: 0,
    labelEn: 'RPE 10 (Maximal Effort)',
    labelAr: 'RPE 10 (أقصى مجهود - فشل عضلي)',
    intensityPercentApprox: 100,
    descriptionEn: 'Absolute failure or zero additional reps possible even with max effort.',
    descriptionAr: 'فشل عضلي كامل، لا يمكن أداء أي تكرار إضافي أو زيادة وزن حتى بأقصى جهد.',
    category: 'maximal',
    color: 'border-red-500 text-red-400',
    badgeBg: 'bg-red-500/20',
    badgeText: 'text-red-400',
    recommendationEn: 'Overshot for standard sets. Reduce weight by 5-10% to protect CNS and avoid premature fatigue.',
    recommendationAr: 'مجهود مفرط للمجموعات البنائية. يُنصح بخفض الوزن 5-10% لتفادي إجهاد الجهاز العصبي.',
  },
  9.5: {
    rpe: 9.5,
    rir: 0.5,
    labelEn: 'RPE 9.5 (Near Limit)',
    labelAr: 'RPE 9.5 (قريب جداً من الفشل)',
    intensityPercentApprox: 98,
    descriptionEn: 'No reps left, but maybe a slight weight increase was possible.',
    descriptionAr: 'لا توجد تكرارات متبقية، ولكن ربما كان بالإمكان زيادة بسيطة جداً في الوزن.',
    category: 'hard',
    color: 'border-rose-500 text-rose-400',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-400',
    recommendationEn: 'Very high strain. Reduce by 2.5-5% if you have more sets remaining.',
    recommendationAr: 'إجهاد عالٍ جداً. خفف 2.5 - 5% إذا كانت لديك مجموعات قادمة للحفاظ على الجودة.',
  },
  9: {
    rpe: 9,
    rir: 1,
    labelEn: 'RPE 9 (1 Rep in Reserve)',
    labelAr: 'RPE 9 (تكرار واحد متبقي)',
    intensityPercentApprox: 95,
    descriptionEn: 'Could have completed 1 more rep with good form.',
    descriptionAr: 'كان بإمكانك أداء تكرار واحد إضافي فقط بتكنيك سليم.',
    category: 'hard',
    color: 'border-amber-500 text-amber-400',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-400',
    recommendationEn: 'Heavy working set. Maintain weight for final sets or reduce slightly if fatigue accumulates.',
    recommendationAr: 'مجموعة ثقيلة ومحفزة. حافظ على الوزن أو خففه قليلاً إذا شعرت بتراكم التعب.',
  },
  8.5: {
    rpe: 8.5,
    rir: 1.5,
    labelEn: 'RPE 8.5 (1-2 Reps in Reserve)',
    labelAr: 'RPE 8.5 (تكرار إلى تكرارين متبقيين)',
    intensityPercentApprox: 94,
    descriptionEn: 'Definitely 1 rep in reserve, maybe 2 with high drive.',
    descriptionAr: 'مؤكد بقاء تكرار واحد، وربما تكراران بعزيمة عالية.',
    category: 'optimal',
    color: 'border-cyan-500 text-cyan-400',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-400',
    recommendationEn: 'Sweet spot for heavy hypertrophy and strength progression.',
    recommendationAr: 'النطاق المثالي لتحفيز التضخيم العضلي وزيادة القوة المستمرة.',
  },
  8: {
    rpe: 8,
    rir: 2,
    labelEn: 'RPE 8 (2 Reps in Reserve - Hypertrophy Gold)',
    labelAr: 'RPE 8 (المعيار الذهبي للبناء - تكراران في الاحتياط)',
    intensityPercentApprox: 92,
    descriptionEn: 'Could have completed 2 more clean reps. Optimal stimulus-to-fatigue ratio.',
    descriptionAr: 'كان بالإمكان إكمال تكرارين إضافيين بأمان. أفضل توازن بين التحفيز العضلي وسرعة الاستشفاء.',
    category: 'optimal',
    color: 'border-emerald-500 text-emerald-400',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400',
    recommendationEn: 'Target achieved perfectly. Maintain weight or micro-load +1-2.5 kg if energy is high.',
    recommendationAr: 'الهدف تم بنجاح تام! حافظ على الوزن، أو قم بزيادة تدريجية بسيطة +1 إلى 2.5 كجم.',
  },
  7.5: {
    rpe: 7.5,
    rir: 2.5,
    labelEn: 'RPE 7.5 (2-3 Reps in Reserve)',
    labelAr: 'RPE 7.5 (2 إلى 3 تكرارات متبقية)',
    intensityPercentApprox: 90,
    descriptionEn: 'Solid working set with controlled bar speed throughout.',
    descriptionAr: 'مجموعة ممتازة مع سرعة وثبات كامل في المدى الحركي.',
    category: 'optimal',
    color: 'border-blue-500 text-blue-400',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-400',
    recommendationEn: 'Good capacity left. Safe to increase by 2-5% for next set.',
    recommendationAr: 'لديك طاقة متبقية جيدة. يمكنك زيادة الوزن 2-5% للمجموعة القادمة بأمان.',
  },
  7: {
    rpe: 7,
    rir: 3,
    labelEn: 'RPE 7 (3 Reps in Reserve)',
    labelAr: 'RPE 7 (3 تكرارات متبقية - خفيف نسبياً)',
    intensityPercentApprox: 89,
    descriptionEn: 'Bar moved quickly. Could easily do 3 more reps.',
    descriptionAr: 'حركة الوزن كانت سريعة وسلسة. كان بإمكانك إكمال 3 تكرارات إضافية بسهولة.',
    category: 'moderate',
    color: 'border-indigo-500 text-indigo-400',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-400',
    recommendationEn: 'Slightly under working threshold. Increase weight by 5-7.5% to reach target hypertrophy zone.',
    recommendationAr: 'أخف من الحمل البنائي المطلوب. ارفع الوزن 5-7.5% للوصول للتحفيز المستهدف.',
  },
  6.5: {
    rpe: 6.5,
    rir: 3.5,
    labelEn: 'RPE 6.5 (3-4 Reps in Reserve)',
    labelAr: 'RPE 6.5 (3 إلى 4 تكرارات متبقية)',
    intensityPercentApprox: 87,
    descriptionEn: 'Moderate effort. Excellent for warmup or speed work.',
    descriptionAr: 'جهد متوسط، ممتاز للإحماء أو تدريب السرعة والانفجارية.',
    category: 'light',
    color: 'border-slate-500 text-slate-300',
    badgeBg: 'bg-slate-500/20',
    badgeText: 'text-slate-300',
    recommendationEn: 'Too light for main working set. Increase weight by 7.5-10%.',
    recommendationAr: 'خفيف بالنسبة لمجموعة أساسية. ارفع الوزن 7.5-10% للوصول للجهد الفعّال.',
  },
  6: {
    rpe: 6,
    rir: 4,
    labelEn: 'RPE 6 (4+ Reps in Reserve)',
    labelAr: 'RPE 6 (4 تكرارات فأكثر في الاحتياط)',
    intensityPercentApprox: 85,
    descriptionEn: 'Warmup or dynamic effort pace. Effortless bar speed.',
    descriptionAr: 'إحماء أو سرعة حركية. مجهود خفيف جداً ولا يشكل أي إرهاق.',
    category: 'light',
    color: 'border-slate-600 text-slate-400',
    badgeBg: 'bg-slate-600/20',
    badgeText: 'text-slate-400',
    recommendationEn: 'Warmup load. Add significant weight (+10-15%) for working sets.',
    recommendationAr: 'وزن إحماء. أضف وزناً كافياً (+10-15%) للمجموعات الأساسية.',
  }
};

export class RPECalculatorService {
  /**
   * Get metadata and guidance for a given RPE value
   */
  static getRPEInfo(rpe: number): RPEInfo {
    const clampedRpe = Math.min(10, Math.max(6, Math.round(rpe * 2) / 2));
    return RPE_DEFINITIONS[clampedRpe] || RPE_DEFINITIONS[8];
  }

  /**
   * Calculate Estimated 1-Rep Max (e1RM) using RTS / RPE percentage matrix with fallback
   */
  static calculateE1RM(weight: number, reps: number, rpe: number): number {
    if (weight <= 0 || reps <= 0) return 0;

    const clampedRpe = Math.min(10, Math.max(6, Math.round(rpe * 2) / 2));
    const clampedReps = Math.min(12, Math.max(1, Math.round(reps)));

    const percentage = RPE_PERCENTAGE_TABLE[clampedRpe]?.[clampedReps];

    if (percentage && percentage > 0) {
      const e1rm = weight / percentage;
      return Math.round(e1rm * 10) / 10;
    }

    // Mathematical formula fallback: Brzycki with RIR
    const rir = Math.max(0, 10 - rpe);
    const effectiveReps = reps + rir;
    if (effectiveReps >= 37) return weight; // safety guard
    const e1rm = weight * (36 / (37 - effectiveReps));
    return Math.round(e1rm * 10) / 10;
  }

  /**
   * Round weight to standard gym plate increments (0.5 kg, 1 kg, or 2.5 kg)
   */
  static roundToPlateIncrement(weight: number): number {
    if (weight <= 0) return 0;
    if (weight < 15) {
      // Small weights: 0.5 kg increments
      return Math.round(weight * 2) / 2;
    } else if (weight < 40) {
      // Moderate weights: 1.0 kg or 1.25 kg increments (round to 1.0 or 2.5)
      const roundedHalf = Math.round(weight * 2) / 2;
      return roundedHalf;
    } else {
      // Heavy barbell weights: 2.5 kg increments
      return Math.round(weight / 2.5) * 2.5;
    }
  }

  /**
   * Calculate Dynamic Weight Adjustment Suggestions based on Actual vs Target RPE
   */
  static calculateSuggestion(input: RPESuggestionInput): RPESuggestionResult {
    const currentWeight = input.currentWeight || 0;
    const actualReps = Math.max(1, input.actualReps || 1);
    const actualRpe = Math.min(10, Math.max(6, input.actualRpe || 8));
    const targetRpe = Math.min(10, Math.max(6, input.targetRpe || 8));
    const targetReps = Math.max(1, input.targetReps || actualReps);

    const actualRir = Math.max(0, Math.round((10 - actualRpe) * 10) / 10);
    const targetRir = Math.max(0, Math.round((10 - targetRpe) * 10) / 10);
    const rpeDelta = Math.round((actualRpe - targetRpe) * 10) / 10;

    // 1. Calculate Estimated 1RM
    const e1RM = this.calculateE1RM(currentWeight, actualReps, actualRpe);

    // 2. Lookup Target Intensity Percentage
    const clampedTargetRpe = Math.min(10, Math.max(6, Math.round(targetRpe * 2) / 2));
    const clampedTargetReps = Math.min(12, Math.max(1, Math.round(targetReps)));
    const targetPercentage = RPE_PERCENTAGE_TABLE[clampedTargetRpe]?.[clampedTargetReps] || (0.75);

    // 3. Compute Theoretical Target Weight
    let rawSuggestedWeight = e1RM * targetPercentage;
    if (currentWeight === 0) {
      rawSuggestedWeight = 0;
    }

    // 4. Fine-tune adjustment step
    let suggestedWeight = this.roundToPlateIncrement(rawSuggestedWeight);
    if (currentWeight > 0 && suggestedWeight === 0) {
      suggestedWeight = currentWeight;
    }

    const weightDelta = Math.round((suggestedWeight - currentWeight) * 10) / 10;
    const percentageDelta = currentWeight > 0 
      ? Math.round((weightDelta / currentWeight) * 1000) / 10 
      : 0;

    // 5. Determine Action and Tactical Explanation
    let action: 'increase' | 'maintain' | 'decrease' | 'deload' = 'maintain';
    let reasonEn = '';
    let reasonAr = '';
    let tacticalTipEn = '';
    let tacticalTipAr = '';

    if (rpeDelta >= 1.5) {
      // Major overshoot (e.g. RPE 9.5 or 10 vs target 8)
      action = 'decrease';
      reasonEn = `You exceeded target effort (RPE ${actualRpe} vs target ${targetRpe}). Reducing weight by ${Math.abs(weightDelta)} kg (${Math.abs(percentageDelta)}%) prevents excessive central nervous system burnout.`;
      reasonAr = `تجاوزت الجهد المستهدف (سجلت RPE ${actualRpe} مقابل المستهدف ${targetRpe}). تقليل الوزن بمقدار ${Math.abs(weightDelta)} كجم (${Math.abs(percentageDelta)}%) يحمي جهازك العصبي من الإرهاق المبكر.`;
      tacticalTipEn = `Rest at least 2 to 3 minutes before the next set to restore ATP-CP energy stores.`;
      tacticalTipAr = `خذ قسط راحة لا يقل عن 2 إلى 3 دقائق لاستعادة مخازن الطاقة ATP-CP بالكامل.`;
    } else if (rpeDelta >= 0.5) {
      // Slight overshoot (e.g. RPE 8.5 vs target 8)
      if (Math.abs(weightDelta) >= 1) {
        action = 'decrease';
        reasonEn = `Slightly above target fatigue (RPE ${actualRpe}). A minor adjustment of ${weightDelta} kg keeps you in the optimal hypertrophy growth pocket.`;
        reasonAr = `أعلى قليلاً من الجهد المستهدف (RPE ${actualRpe}). تعديل طفيف بمقدار ${weightDelta} كجم يبقيك في النطاق الذهبي للبناء العضلي.`;
      } else {
        action = 'maintain';
        reasonEn = `Target effort closely matched (RPE ${actualRpe}). Maintain current weight with focus on controlled eccentric tempo.`;
        reasonAr = `الجهد قريب جداً من المستهدف (RPE ${actualRpe}). حافظ على نفس الوزن مع التركيز على النزول البطيء المحكوم.`;
      }
      tacticalTipEn = `Focus on tight core bracing and explosive concentric drive.`;
      tacticalTipAr = `ركز على شد عضلات الكور بقوة والدفع الانفجاري المنضبط.`;
    } else if (rpeDelta <= -1.5) {
      // Major undershoot (e.g. RPE 6 or 6.5 vs target 8)
      action = 'increase';
      reasonEn = `Load was lighter than intended (RPE ${actualRpe}, ~${actualRir} reps in reserve). Adding +${weightDelta} kg (+${percentageDelta}%) will unlock true high-threshold motor unit recruitment.`;
      reasonAr = `الوزن كان خفيفاً عن المطلوب (RPE ${actualRpe}، متبقي ~${actualRir} تكرارات). زيادة +${weightDelta} كجم (+${percentageDelta}%) ستفعّل الألياف العضلية البنائية المستهدفة.`;
      tacticalTipEn = `You have high energy today! Take advantage and safely challenge yourself.`;
      tacticalTipAr = `طاقتك اليوم عالية! استغل هذه الجاهزية وطبق الزيادة التدريجية بأمان.`;
    } else if (rpeDelta <= -0.5) {
      // Slight undershoot (e.g. RPE 7 vs target 8)
      action = 'increase';
      reasonEn = `Good speed and control (RPE ${actualRpe}). Adding a micro-load of +${Math.max(1, weightDelta)} kg will hit your exact target RPE ${targetRpe}.`;
      reasonAr = `تحكم وسرعة ممتازة (RPE ${actualRpe}). زيادة تدريجية بسيطة +${Math.max(1, weightDelta)} كجم ستوصلك مباشرة للجهد البنائي المستهدف ${targetRpe}.`;
      tacticalTipEn = `Maintain pristine biomechanical form on every rep.`;
      tacticalTipAr = `حافظ على التكنيك البيوميكانيكي المثالي في كل تكرار.`;
    } else {
      // Perfect match (RPE delta ~ 0)
      action = 'maintain';
      reasonEn = `Spot-on target effort! RPE ${actualRpe} (2 reps in reserve) maximizes muscle protein synthesis stimulus without excessive damage.`;
      reasonAr = `إصابة دقيقة للهدف! RPE ${actualRpe} (تكراران في الاحتياط) يحقق أقصى تحفيز للبناء العضلي دون إجهاد زائد.`;
      tacticalTipEn = `Maintain current load and aim for 1 extra rep if feel remains strong.`;
      tacticalTipAr = `حافظ على هذا الوزن وحاول إضافة تكرار إضافي إذا استمرت طاقتك قوية.`;
    }

    const currentIntensityPercent = e1RM > 0 ? Math.round((currentWeight / e1RM) * 100) : 0;

    return {
      estimated1RM: e1RM,
      currentIntensityPercent,
      actualRir,
      targetRpe,
      targetReps,
      targetRir,
      suggestedWeight,
      weightDelta,
      percentageDelta,
      action,
      reasonEn,
      reasonAr,
      tacticalTipEn,
      tacticalTipAr,
      rpeDelta,
      confidence: actualReps <= 10 ? 'high' : 'medium'
    };
  }

  /**
   * Generate an interactive Matrix Table of calculated weights for an exercise
   * across multiple rep targets (3, 5, 6, 8, 10, 12) and RPE values (7, 8, 9, 10)
   */
  static generateWeightMatrix(e1RM: number): { reps: number; weightsByRpe: Record<number, number> }[] {
    if (e1RM <= 0) return [];

    const repColumns = [3, 5, 6, 8, 10, 12];
    const rpeLevels = [7, 7.5, 8, 8.5, 9, 9.5, 10];

    return repColumns.map(reps => {
      const weightsByRpe: Record<number, number> = {};
      rpeLevels.forEach(rpe => {
        const pct = RPE_PERCENTAGE_TABLE[rpe]?.[reps] || 0.7;
        weightsByRpe[rpe] = this.roundToPlateIncrement(e1RM * pct);
      });
      return {
        reps,
        weightsByRpe
      };
    });
  }
}
