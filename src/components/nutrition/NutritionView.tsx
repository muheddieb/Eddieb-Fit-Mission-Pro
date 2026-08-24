import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  Flame, 
  Droplets, 
  Plus, 
  Trash2, 
  Check, 
  Calculator, 
  Coffee, 
  Info, 
  Sparkles,
  Search,
  Activity,
  Target,
  Zap,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Scale,
  RotateCcw,
  Dumbbell
} from 'lucide-react';
import { FoodItemSeed, NutritionEntry, UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { foodItemSeedData, prePostWorkoutTips } from '../../data/nutritionSeed';
import { StorageService } from '../../services/storage';

interface NutritionViewProps {
  profile: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
}

export type TDEEGoalCategory = 'fat_loss' | 'muscle_gain' | 'maintenance_recomp';

export const NutritionView: React.FC<NutritionViewProps> = ({
  profile,
  onUpdateProfile,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [nutritionLogs, setNutritionLogs] = useState<NutritionEntry[]>([]);
  const [selectedFoodId, setSelectedFoodId] = useState<string>(foodItemSeedData[0].id);
  const [portionGrams, setPortionGrams] = useState<number>(foodItemSeedData[0].defaultPortion);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout'>('lunch');
  const [customFoodName, setCustomFoodName] = useState<string>('');
  const [customCalories, setCustomCalories] = useState<number>(200);
  const [customProtein, setCustomProtein] = useState<number>(25);

  // TDEE Interactive Calculator State
  const [tdeeAge, setTdeeAge] = useState<number>(profile.age || 26);
  const [tdeeHeight, setTdeeHeight] = useState<number>(profile.heightCm || 180);
  const [tdeeWeight, setTdeeWeight] = useState<number>(profile.currentWeightKg || 88);
  const [tdeeGender, setTdeeGender] = useState<'male' | 'female'>('male');
  const [tdeeActivity, setTdeeActivity] = useState<number>(
    profile.activityLevel === 'sedentary' ? 1.2 :
    profile.activityLevel === 'light' ? 1.375 :
    profile.activityLevel === 'very_active' ? 1.725 : 1.55
  );
  
  // Goal category and preset
  const [goalCategory, setGoalCategory] = useState<TDEEGoalCategory>(
    profile.mode === 'controlled_fat_loss' ? 'fat_loss' : 'muscle_gain'
  );
  const [tdeePreset, setTdeePreset] = useState<string>(
    profile.mode === 'controlled_fat_loss' ? 'moderate_cut' : 'lean_bulk'
  );
  const [appliedNotification, setAppliedNotification] = useState<boolean>(false);

  const tips = isAr ? prePostWorkoutTips.ar : prePostWorkoutTips.en;

  useEffect(() => {
    setNutritionLogs(StorageService.getNutritionHistory());
  }, []);

  const handleSyncWithProfile = () => {
    setTdeeAge(profile.age || 26);
    setTdeeHeight(profile.heightCm || 180);
    setTdeeWeight(profile.currentWeightKg || 88);
    setTdeeActivity(
      profile.activityLevel === 'sedentary' ? 1.2 :
      profile.activityLevel === 'light' ? 1.375 :
      profile.activityLevel === 'very_active' ? 1.725 : 1.55
    );
    if (profile.mode === 'controlled_fat_loss') {
      setGoalCategory('fat_loss');
      setTdeePreset('moderate_cut');
    } else {
      setGoalCategory('muscle_gain');
      setTdeePreset('lean_bulk');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = nutritionLogs.filter(n => n.date === today);

  const totalCaloriesLogged = todayLogs.reduce((sum, n) => sum + n.calories, 0);
  const totalProteinLogged = todayLogs.reduce((sum, n) => sum + n.proteinGrams, 0);
  const totalCarbsLogged = todayLogs.reduce((sum, n) => sum + (n.carbsGrams || 0), 0);
  const totalFatLogged = todayLogs.reduce((sum, n) => sum + (n.fatGrams || 0), 0);

  const selectedFood = foodItemSeedData.find(f => f.id === selectedFoodId) || foodItemSeedData[0];

  const calculatedCalories = Math.round((selectedFood.caloriesPer100g * portionGrams) / 100);
  const calculatedProtein = Math.round(((selectedFood.proteinPer100g * portionGrams) / 100) * 10) / 10;
  const calculatedCarbs = Math.round(((selectedFood.carbsPer100g * portionGrams) / 100) * 10) / 10;
  const calculatedFat = Math.round(((selectedFood.fatPer100g * portionGrams) / 100) * 10) / 10;

  // Mifflin-St Jeor TDEE & BMR Formula
  const bmr = Math.round(
    tdeeGender === 'male'
      ? 10 * tdeeWeight + 6.25 * tdeeHeight - 5 * tdeeAge + 5
      : 10 * tdeeWeight + 6.25 * tdeeHeight - 5 * tdeeAge - 161
  );

  const calculatedTDEE = Math.round(bmr * tdeeActivity);

  // Goal & Macro Calculations based on Category & Preset
  let calorieMultiplier = 1.0;
  let proteinMultiplierPerKg = 2.2;
  let goalNameEn = 'Controlled Fat Loss';
  let goalNameAr = 'تنشيف محسوب ومستدام';
  let goalDescriptionEn = 'Moderate caloric deficit designed to maximize fat oxidation while completely preserving lean muscle mass.';
  let goalDescriptionAr = 'عجز سعرات معتدل ومدروس لحرق الدهون العنيدة مع الحفاظ التام على الكتلة العضلية المكتسبة.';
  let calorieDeltaLabel = '-18%';

  if (goalCategory === 'fat_loss') {
    if (tdeePreset === 'aggressive_cut') {
      calorieMultiplier = 0.75;
      proteinMultiplierPerKg = 2.4;
      goalNameEn = 'Aggressive Fat Loss (-25%)';
      goalNameAr = 'حرق دهون مكثف (-25%)';
      goalDescriptionEn = 'Higher caloric deficit with elevated protein intake (2.4g/kg) to maximize fullness and protect muscle fibers.';
      goalDescriptionAr = 'عجز سعرات مرتفع مع بروتين عالٍ جداً (2.4 جم/كجم) للشبع التام وحماية الألياف العضلية.';
      calorieDeltaLabel = '-25%';
    } else if (tdeePreset === 'mild_cut') {
      calorieMultiplier = 0.90;
      proteinMultiplierPerKg = 2.0;
      goalNameEn = 'Mild Fat Loss (-10%)';
      goalNameAr = 'تنشيف تدريجي هادئ (-10%)';
      goalDescriptionEn = 'Gentle, continuous deficit ideal for easy adherence and sustained heavy lifting strength.';
      goalDescriptionAr = 'عجز خفيف ومستمر يسهل الالتزام به مع الحفاظ على أعلى طاقة وقوة تدريبية.';
      calorieDeltaLabel = '-10%';
    } else {
      // Default: moderate_cut
      calorieMultiplier = 0.82;
      proteinMultiplierPerKg = 2.2;
      goalNameEn = 'Controlled Fat Loss (-18%)';
      goalNameAr = 'تنشيف محسوب ومستدام (-18%)';
      goalDescriptionEn = 'Gold-standard deficit (18%) providing rapid fat loss without metabolic slowdown or strength drop.';
      goalDescriptionAr = 'المعيار الذهبي للتنشيف (عجز 18%) لحرق الدهون المستمر دون هبوط الطاقة أو بطء الحرق.';
      calorieDeltaLabel = '-18%';
    }
  } else if (goalCategory === 'muscle_gain') {
    if (tdeePreset === 'hypertrophy_bulk') {
      calorieMultiplier = 1.15;
      proteinMultiplierPerKg = 2.2;
      goalNameEn = 'Maximum Hypertrophy Surplus (+15%)';
      goalNameAr = 'تضخيم مكثف لبناء العضلات (+15%)';
      goalDescriptionEn = 'Elevated caloric surplus to fuel high-volume hypertrophy sets, glycogen loading, and rapid recovery.';
      goalDescriptionAr = 'فائض طاقة مرتفع لتغذية تمارين الأحجام العالية وإعادة شحن الجليكوجين وتسريع البناء العضلي.';
      calorieDeltaLabel = '+15%';
    } else if (tdeePreset === 'mild_bulk') {
      calorieMultiplier = 1.05;
      proteinMultiplierPerKg = 2.0;
      goalNameEn = 'Clean Micro-Surplus (+5%)';
      goalNameAr = 'فائض نقي دقيق (+5%)';
      goalDescriptionEn = 'Leanest muscle mass accumulation with virtually zero fat gain.';
      goalDescriptionAr = 'بناء عضل نقي وبطيء مع تجنب أي دهون إضافية نهائياً.';
      calorieDeltaLabel = '+5%';
    } else {
      // Default: lean_bulk
      calorieMultiplier = 1.10;
      proteinMultiplierPerKg = 2.1;
      goalNameEn = 'Lean Muscle Bulk (+10%)';
      goalNameAr = 'تضخيم عضلي صافي (+10%)';
      goalDescriptionEn = 'Optimal 10% surplus providing maximum muscle protein synthesis with minimal fat accumulation.';
      goalDescriptionAr = 'فائض مثالي 10% يدعم تخليق البروتين العضلي لأقصى درجة مع بقاء نسبة الدهون منخفضة.';
      calorieDeltaLabel = '+10%';
    }
  } else {
    // Maintenance / Recomp
    if (tdeePreset === 'recomp') {
      calorieMultiplier = 0.95;
      proteinMultiplierPerKg = 2.3;
      goalNameEn = 'Body Recomposition (-5%)';
      goalNameAr = 'إعادة تشكيل الجسم Recomp (-5%)';
      goalDescriptionEn = 'High-protein slight deficit to simultaneously melt fat and tone/hypertrophy muscle tissue.';
      goalDescriptionAr = 'عجز طفيف جداً مع بروتين عالي لحرق الدهون وبناء العضلات في نفس الوقت بالتوازي.';
      calorieDeltaLabel = '-5%';
    } else {
      calorieMultiplier = 1.00;
      proteinMultiplierPerKg = 2.0;
      goalNameEn = 'Maintenance (Energy Balance 0%)';
      goalNameAr = 'تثبيت الوزن وتوازن الطاقة (0%)';
      goalDescriptionEn = 'Exact caloric equilibrium to maintain stable weight while fueling intense gym performance.';
      goalDescriptionAr = 'توازن طاقة دقيق لتثبيت الوزن مع توفير أقصى طاقة ونشاط للأداء الرياضي في الجيم.';
      calorieDeltaLabel = '0%';
    }
  }

  const goalCalorieTarget = Math.round(calculatedTDEE * calorieMultiplier);
  const targetProteinGrams = Math.round(tdeeWeight * proteinMultiplierPerKg);
  const targetProteinCalories = targetProteinGrams * 4;

  // 25% of calories from healthy fats (optimal hormonal profile)
  const targetFatCalories = Math.round(goalCalorieTarget * 0.25);
  const targetFatGrams = Math.round(targetFatCalories / 9);

  // Remaining calories allotted to carbohydrates
  const targetCarbsCalories = Math.max(200, goalCalorieTarget - (targetProteinCalories + targetFatCalories));
  const targetCarbsGrams = Math.round(targetCarbsCalories / 4);

  // Percentage breakdown
  const proteinPercent = Math.round((targetProteinCalories / goalCalorieTarget) * 100);
  const fatPercent = Math.round((targetFatCalories / goalCalorieTarget) * 100);
  const carbsPercent = Math.max(0, 100 - (proteinPercent + fatPercent));

  // Resolved targets for display cards
  const displayCalorieTarget = profile.dailyCalorieTarget || goalCalorieTarget;
  const displayProteinTarget = profile.dailyProteinTargetGrams || targetProteinGrams;
  const displayCarbsTarget = profile.dailyCarbsTargetGrams || targetCarbsGrams;
  const displayFatTarget = profile.dailyFatTargetGrams || targetFatGrams;

  const handleApplyTDEETargets = () => {
    const updatedProfile: UserProfile = {
      ...profile,
      dailyCalorieTarget: goalCalorieTarget,
      dailyProteinTargetGrams: targetProteinGrams,
      dailyCarbsTargetGrams: targetCarbsGrams,
      dailyFatTargetGrams: targetFatGrams,
      currentWeightKg: tdeeWeight,
      heightCm: tdeeHeight,
      age: tdeeAge,
      mode: goalCategory === 'fat_loss' ? 'controlled_fat_loss' : 'muscle_recomp',
    };

    StorageService.saveProfile(updatedProfile);
    if (onUpdateProfile) {
      onUpdateProfile(updatedProfile);
    }
    setAppliedNotification(true);
    setTimeout(() => setAppliedNotification(false), 4000);
  };

  const handleLogFoodItem = () => {
    const foodTitle = isAr && selectedFood.nameAr ? selectedFood.nameAr : selectedFood.name;

    const entry: NutritionEntry = {
      id: 'nut_' + Date.now(),
      date: today,
      mealType: selectedMealType,
      foodName: foodTitle,
      portionGrams,
      calories: calculatedCalories,
      proteinGrams: calculatedProtein,
      carbsGrams: calculatedCarbs,
      fatGrams: calculatedFat,
      timestamp: Date.now(),
    };

    StorageService.addNutritionEntry(entry);
    setNutritionLogs(StorageService.getNutritionHistory());
  };

  const handleLogCustomItem = () => {
    if (!customFoodName.trim()) return;

    const entry: NutritionEntry = {
      id: 'nut_' + Date.now(),
      date: today,
      mealType: selectedMealType,
      foodName: customFoodName.trim(),
      portionGrams: 100,
      calories: customCalories,
      proteinGrams: customProtein,
      timestamp: Date.now(),
    };

    StorageService.addNutritionEntry(entry);
    setNutritionLogs(StorageService.getNutritionHistory());
    setCustomFoodName('');
  };

  const handleDeleteLog = (id: string) => {
    StorageService.deleteNutritionEntry(id);
    setNutritionLogs(StorageService.getNutritionHistory());
  };

  return (
    <div className="space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground sm:text-3xl">
          {t.nutrition.title}
        </h1>
        <p className="text-sm text-muted-foreground">{t.nutrition.subtitle}</p>
      </div>

      {/* Macro Tracking Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calories Card */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase">{t.nutrition.calories}</span>
            <Flame className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {totalCaloriesLogged} <span className="text-xs text-muted-foreground">/ {displayCalorieTarget} kcal</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, (totalCaloriesLogged / displayCalorieTarget) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-1.5 font-medium">
            <span>{isAr ? 'المتبقي اليوم:' : 'Remaining:'}</span>
            <span className="font-mono font-bold text-foreground">
              {Math.max(0, displayCalorieTarget - totalCaloriesLogged)} kcal
            </span>
          </div>
        </div>

        {/* Protein Card */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase">{t.nutrition.protein}</span>
            <span className="text-xs font-bold text-primary">Goal: {displayProteinTarget}g</span>
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {totalProteinLogged} <span className="text-xs text-muted-foreground">/ {displayProteinTarget} g</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, (totalProteinLogged / displayProteinTarget) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-1.5 font-medium">
            <span>{isAr ? 'المتبقي اليوم:' : 'Remaining:'}</span>
            <span className="font-mono font-bold text-primary">
              {Math.max(0, displayProteinTarget - totalProteinLogged)} g
            </span>
          </div>
        </div>

        {/* Carbohydrates Card */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase">{t.nutrition.carbs}</span>
            <span className="text-xs font-bold text-blue-400">Goal: {displayCarbsTarget}g</span>
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {totalCarbsLogged} <span className="text-xs text-muted-foreground">/ {displayCarbsTarget} g</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, (totalCarbsLogged / displayCarbsTarget) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-1.5 font-medium">
            <span>{isAr ? 'المتبقي اليوم:' : 'Remaining:'}</span>
            <span className="font-mono font-bold text-blue-400">
              {Math.max(0, displayCarbsTarget - totalCarbsLogged)} g
            </span>
          </div>
        </div>

        {/* Fats Card */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase">{t.nutrition.fats}</span>
            <span className="text-xs font-bold text-emerald-400">Goal: {displayFatTarget}g</span>
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {totalFatLogged} <span className="text-xs text-muted-foreground">/ {displayFatTarget} g</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, (totalFatLogged / displayFatTarget) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-1.5 font-medium">
            <span>{isAr ? 'المتبقي اليوم:' : 'Remaining:'}</span>
            <span className="font-mono font-bold text-emerald-400">
              {Math.max(0, displayFatTarget - totalFatLogged)} g
            </span>
          </div>
        </div>
      </div>

      {/* TDEE & Macronutrient Target Calculator */}
      <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-xl space-y-6">
        {/* Header & Sync */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-foreground">
                  {isAr ? 'حاسبة استهلاك الطاقة الكلي (TDEE) وتوزيع الماكروز' : 'TDEE & Macro Target Calculator'}
                </h3>
                <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-black text-primary uppercase">
                  Mifflin-St Jeor
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr 
                  ? 'احسب معدل الحرق اليومي واستخرج جرامات البروتين، الكارب، والدهون حسب هدف التنشيف أو البناء العضلي'
                  : 'Calculate metabolic burn and derive exact protein, carbohydrate, and fat targets for fat-loss or muscle-gain.'}
              </p>
            </div>
          </div>

          <button
            id="btn-sync-tdee-profile"
            onClick={handleSyncWithProfile}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary hover:text-primary transition-all self-start sm:self-auto"
            title={isAr ? 'استيراد البيانات من الملف الشخصي' : 'Sync biometrics from active profile'}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{isAr ? 'مزامنة من الملف' : 'Sync Profile'}</span>
          </button>
        </div>

        {/* Step 1: Goal Category Tabs */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-2">
            {isAr ? '١. حدد الهدف التدريبي الرئيسي' : '1. Select Your Primary Fitness Goal'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Fat Loss Tab */}
            <button
              type="button"
              onClick={() => {
                setGoalCategory('fat_loss');
                setTdeePreset('moderate_cut');
              }}
              className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all ${
                goalCategory === 'fat_loss'
                  ? 'border-amber-500/80 bg-amber-500/15 shadow-md shadow-amber-500/10'
                  : 'border-border bg-secondary/30 hover:bg-secondary/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  goalCategory === 'fat_loss' ? 'bg-amber-500 text-black' : 'bg-secondary text-amber-400'
                }`}>
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-foreground">
                    {isAr ? 'تنشيف وحرق الدهون' : 'Fat Loss / Cutting'}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {isAr ? 'عجز سعرات + بروتين مرتفع' : 'Calorie Deficit & Lean Mass Preservation'}
                  </div>
                </div>
              </div>
              {goalCategory === 'fat_loss' && <CheckCircle2 className="h-4 w-4 text-amber-400" />}
            </button>

            {/* Muscle Gain Tab */}
            <button
              type="button"
              onClick={() => {
                setGoalCategory('muscle_gain');
                setTdeePreset('lean_bulk');
              }}
              className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all ${
                goalCategory === 'muscle_gain'
                  ? 'border-primary bg-primary/15 shadow-md shadow-primary/10'
                  : 'border-border bg-secondary/30 hover:bg-secondary/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  goalCategory === 'muscle_gain' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary'
                }`}>
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-foreground">
                    {isAr ? 'تضخيم وبناء عضلات صافية' : 'Muscle Gain / Bulking'}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {isAr ? 'فائض طاقة نقي + كارب عالي' : 'Calorie Surplus & Hypertrophy Fuel'}
                  </div>
                </div>
              </div>
              {goalCategory === 'muscle_gain' && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </button>

            {/* Maintenance & Recomp Tab */}
            <button
              type="button"
              onClick={() => {
                setGoalCategory('maintenance_recomp');
                setTdeePreset('recomp');
              }}
              className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all ${
                goalCategory === 'maintenance_recomp'
                  ? 'border-emerald-500/80 bg-emerald-500/15 shadow-md shadow-emerald-500/10'
                  : 'border-border bg-secondary/30 hover:bg-secondary/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  goalCategory === 'maintenance_recomp' ? 'bg-emerald-500 text-black' : 'bg-secondary text-emerald-400'
                }`}>
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-foreground">
                    {isAr ? 'تثبيت الوزن وإعادة التشكيل' : 'Maintenance & Recomp'}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {isAr ? 'توازن الطاقة أو Recomp متوازن' : 'Simultaneous Body Recomp / Balance'}
                  </div>
                </div>
              </div>
              {goalCategory === 'maintenance_recomp' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Step 2: Calculator Inputs Grid */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-2">
            {isAr ? '٢. البيانات البيومترية ومستوى النشاط' : '2. Biometric Data & Training Activity'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                {isAr ? 'الجنس' : 'Gender'}
              </label>
              <select
                value={tdeeGender}
                onChange={e => setTdeeGender(e.target.value as 'male' | 'female')}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                <option value="male">{isAr ? 'ذكر (Male)' : 'Male'}</option>
                <option value="female">{isAr ? 'أنثى (Female)' : 'Female'}</option>
              </select>
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                {isAr ? 'العمر (سنة)' : 'Age (years)'}
              </label>
              <input
                type="number"
                min="16"
                max="90"
                value={tdeeAge}
                onChange={e => setTdeeAge(parseInt(e.target.value, 10) || 25)}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {/* Height */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                {isAr ? 'الطول (سم)' : 'Height (cm)'}
              </label>
              <input
                type="number"
                min="120"
                max="230"
                value={tdeeHeight}
                onChange={e => setTdeeHeight(parseInt(e.target.value, 10) || 180)}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {/* Weight */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                {isAr ? 'الوزن الحالي (كجم)' : 'Weight (kg)'}
              </label>
              <input
                type="number"
                min="40"
                max="200"
                step="0.5"
                value={tdeeWeight}
                onChange={e => setTdeeWeight(parseFloat(e.target.value) || 80)}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                {isAr ? 'مستوى النشاط الأسبوعي' : 'Activity Multiplier'}
              </label>
              <select
                value={tdeeActivity}
                onChange={e => setTdeeActivity(parseFloat(e.target.value))}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                <option value="1.2">{isAr ? 'خامل (مكتب / قليل الحركة)' : 'Sedentary (desk job, 1.2x)'}</option>
                <option value="1.375">{isAr ? 'نشاط خفيف (1-2 يوم تمرين)' : 'Light (1-2 days/wk, 1.375x)'}</option>
                <option value="1.55">{isAr ? 'نشاط متوسط (3-5 أيام تمرين)' : 'Moderate (3-5 days/wk, 1.55x)'}</option>
                <option value="1.725">{isAr ? 'نشاط عالي (6-7 أيام مكثفة)' : 'Heavy (6-7 days/wk, 1.725x)'}</option>
                <option value="1.9">{isAr ? 'نشاط رياضي شاق (تدريب مضاعف)' : 'Extreme (Athlete 2x/day, 1.9x)'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Strategy & Deficit/Surplus Presets */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-2">
            {isAr ? '٣. استراتيجية العجز أو الفائض ومعدل التقدم' : '3. Deficit / Surplus Strategy & Progression Rate'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {goalCategory === 'fat_loss' && (
              <>
                <button
                  type="button"
                  onClick={() => setTdeePreset('moderate_cut')}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    tdeePreset === 'moderate_cut'
                      ? 'border-amber-500 bg-amber-500/15 font-bold text-foreground'
                      : 'border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black">
                    <span>{isAr ? 'تنشيف محسوب ومستدام' : 'Controlled Fat Loss'}</span>
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-400">-18%</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {isAr ? 'الموصى به: حرق سريع وحفاظ كامل على العضلات (2.2 جم بروتين/كجم)' : 'Recommended: optimal fat loss & 2.2g/kg protein'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTdeePreset('aggressive_cut')}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    tdeePreset === 'aggressive_cut'
                      ? 'border-amber-500 bg-amber-500/15 font-bold text-foreground'
                      : 'border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black">
                    <span>{isAr ? 'تنشيف سريع مكثف' : 'Aggressive Cut'}</span>
                    <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400">-25%</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {isAr ? 'عجز أعمق لنزول سريع مع بروتين أقصى (2.4 جم بروتين/كجم)' : 'Rapid deficit with high protein 2.4g/kg to prevent loss'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTdeePreset('mild_cut')}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    tdeePreset === 'mild_cut'
                      ? 'border-amber-500 bg-amber-500/15 font-bold text-foreground'
                      : 'border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black">
                    <span>{isAr ? 'تنشيف خفيف مريح' : 'Mild Fat Loss'}</span>
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-400">-10%</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {isAr ? 'عجز خفيف جداً يضمن أعلى طاقة مستمرة في الجيم' : 'Gentle deficit preserving peak energy & high workout stamina'}
                  </div>
                </button>
              </>
            )}

            {goalCategory === 'muscle_gain' && (
              <>
                <button
                  type="button"
                  onClick={() => setTdeePreset('lean_bulk')}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    tdeePreset === 'lean_bulk'
                      ? 'border-primary bg-primary/15 font-bold text-foreground'
                      : 'border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black">
                    <span>{isAr ? 'تضخيم عضلي صافي' : 'Lean Muscle Bulk'}</span>
                    <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">+10%</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {isAr ? 'الموصى به: أقصى بناء عضلي وتجنب تخزين الدهون' : 'Recommended: maximum muscle synthesis, minimal fat storage'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTdeePreset('hypertrophy_bulk')}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    tdeePreset === 'hypertrophy_bulk'
                      ? 'border-primary bg-primary/15 font-bold text-foreground'
                      : 'border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black">
                    <span>{isAr ? 'تضخيم وبناء فائق' : 'Hypertrophy Surplus'}</span>
                    <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-400">+15%</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {isAr ? 'فائض قوي لرفع أوزان أثقل وزيادة الوزن العضلي بسرعة' : 'High energy surplus for rapid recovery and heavy overload'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTdeePreset('mild_bulk')}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    tdeePreset === 'mild_bulk'
                      ? 'border-primary bg-primary/15 font-bold text-foreground'
                      : 'border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black">
                    <span>{isAr ? 'فائض نقي دقيق' : 'Clean Micro-Surplus'}</span>
                    <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">+5%</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {isAr ? 'بناء بطيء جداً ونقي 100% دون أي زيادة دهون' : 'Ultra-clean progression for lean aesthetic gains'}
                  </div>
                </button>
              </>
            )}

            {goalCategory === 'maintenance_recomp' && (
              <>
                <button
                  type="button"
                  onClick={() => setTdeePreset('recomp')}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    tdeePreset === 'recomp'
                      ? 'border-emerald-500 bg-emerald-500/15 font-bold text-foreground'
                      : 'border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black">
                    <span>{isAr ? 'إعادة التشكيل Recomposition' : 'Body Recomposition'}</span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-400">-5%</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {isAr ? 'حرق دهون وبناء عضلات في نفس الوقت ببروتين 2.3 جم/كجم' : 'Simultaneous fat loss & muscle tone with 2.3g/kg protein'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTdeePreset('maintenance')}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    tdeePreset === 'maintenance'
                      ? 'border-emerald-500 bg-emerald-500/15 font-bold text-foreground'
                      : 'border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-black">
                    <span>{isAr ? 'تثبيت الوزن وتوازن الطاقة' : 'True Maintenance'}</span>
                    <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] text-cyan-400">0%</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {isAr ? 'تثبيت تام لوزن الجسم مع توفير طاقة تدريبية كاملة' : 'Maintain exact current body weight and high athletic performance'}
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Step 4: Metabolic Breakdown & Macro Targets Display */}
        <div className="rounded-2xl border border-primary/30 bg-card p-5 shadow-lg space-y-5">
          {/* Top Metabilic Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-b border-border pb-4">
            <div className="flex items-center justify-between rounded-xl bg-secondary/40 p-3">
              <span className="text-xs text-muted-foreground">{isAr ? 'الأيض الأساسي (BMR):' : 'Basal Metabolic Rate (BMR):'}</span>
              <span className="font-mono font-black text-foreground text-sm">{bmr} kcal</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-secondary/40 p-3">
              <span className="text-xs text-muted-foreground">{isAr ? 'إجمالي الحرق اليومي (TDEE):' : 'Total Daily Burn (TDEE):'}</span>
              <span className="font-mono font-black text-amber-400 text-sm">{calculatedTDEE} kcal</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/30 p-3">
              <span className="text-xs font-bold text-primary">{isAr ? 'الهدف السعري اليومي:' : 'Target Daily Intake:'}</span>
              <span className="font-mono font-black text-primary text-base">{goalCalorieTarget} kcal ({calorieDeltaLabel})</span>
            </div>
          </div>

          {/* 4 Macro Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {/* Calories Target */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-400 uppercase">
                  <Flame className="h-3.5 w-3.5" />
                  <span>{t.nutrition.calories}</span>
                </div>
                <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                  {goalCalorieTarget}
                </div>
                <div className="text-[10px] text-muted-foreground">kcal / day</div>
              </div>
              <div className="text-[10px] font-bold text-muted-foreground mt-2 pt-2 border-t border-amber-500/20">
                {calorieDeltaLabel} {isAr ? 'من الحرق اليومي' : 'from TDEE'}
              </div>
            </div>

            {/* Protein Target */}
            <div className="rounded-2xl border border-primary/40 bg-primary/5 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-primary uppercase">
                  <Dumbbell className="h-3.5 w-3.5" />
                  <span>{t.nutrition.protein}</span>
                </div>
                <div className="text-2xl font-black text-primary font-mono mt-1">
                  {targetProteinGrams} <span className="text-xs text-muted-foreground">g</span>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {targetProteinCalories} kcal • {proteinPercent}%
                </div>
              </div>
              <div className="text-[10px] font-bold text-primary mt-2 pt-2 border-t border-primary/20">
                {proteinMultiplierPerKg} g / kg {isAr ? 'وزن الجسم' : 'bodyweight'}
              </div>
            </div>

            {/* Carbs Target */}
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-blue-400 uppercase">
                  <Zap className="h-3.5 w-3.5" />
                  <span>{t.nutrition.carbs}</span>
                </div>
                <div className="text-2xl font-black text-blue-400 font-mono mt-1">
                  {targetCarbsGrams} <span className="text-xs text-muted-foreground">g</span>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {targetCarbsCalories} kcal • {carbsPercent}%
                </div>
              </div>
              <div className="text-[10px] font-bold text-blue-400 mt-2 pt-2 border-t border-blue-500/20">
                {isAr ? 'طاقة تدريبية وجليكوجين' : 'Glycogen training fuel'}
              </div>
            </div>

            {/* Fat Target */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-400 uppercase">
                  <Droplets className="h-3.5 w-3.5" />
                  <span>{t.nutrition.fats}</span>
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                  {targetFatGrams} <span className="text-xs text-muted-foreground">g</span>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {targetFatCalories} kcal • {fatPercent}%
                </div>
              </div>
              <div className="text-[10px] font-bold text-emerald-400 mt-2 pt-2 border-t border-emerald-500/20">
                25% {isAr ? 'دعم هرموني صحي' : 'Hormonal support'}
              </div>
            </div>
          </div>

          {/* Visual Macro Distribution Ratio Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-muted-foreground">
              <span>{isAr ? 'توزيع نسب السعرات (Macro Ratio):' : 'Macronutrient Calorie Ratio:'}</span>
              <div className="flex items-center gap-3 text-[11px] font-mono font-bold">
                <span className="text-primary">{isAr ? 'بروتين' : 'Protein'}: {proteinPercent}%</span>
                <span className="text-blue-400">{isAr ? 'كارب' : 'Carbs'}: {carbsPercent}%</span>
                <span className="text-emerald-400">{isAr ? 'دهون' : 'Fat'}: {fatPercent}%</span>
              </div>
            </div>
            <div className="h-3 w-full rounded-full bg-secondary overflow-hidden flex shadow-inner">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${proteinPercent}%` }}
                title={`Protein: ${proteinPercent}%`}
              />
              <div
                className="h-full bg-blue-400 transition-all"
                style={{ width: `${carbsPercent}%` }}
                title={`Carbohydrates: ${carbsPercent}%`}
              />
              <div
                className="h-full bg-emerald-400 transition-all"
                style={{ width: `${fatPercent}%` }}
                title={`Fats: ${fatPercent}%`}
              />
            </div>
          </div>

          {/* Goal Strategy Rationale & One-Click Apply Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground leading-relaxed flex-1">
              <span className="font-bold text-foreground">
                {isAr ? goalNameAr : goalNameEn}:
              </span>{' '}
              {isAr ? goalDescriptionAr : goalDescriptionEn}
            </div>

            <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
              <button
                id="btn-apply-tdee-to-profile"
                onClick={handleApplyTDEETargets}
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-black text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 whitespace-nowrap"
              >
                <Target className="h-4 w-4" />
                <span>{isAr ? 'اعتماد الأهداف في التطبيق' : 'Apply Targets to App Profile'}</span>
              </button>
              {appliedNotification && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 mt-2 animate-bounce">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isAr ? 'تم تحديث أهداف السعرات والماكروز في ملفك!' : 'Macro Targets Applied to Profile!'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pre & Post Workout Fueling Protocols */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pre-Workout Box */}
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Coffee className="h-4 w-4" />
            <span>{tips.preWorkoutTitle}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {tips.preWorkoutSummary}
          </p>
          <ul className="space-y-1.5 text-xs text-foreground list-disc list-inside font-medium">
            {tips.preWorkoutIdeas.map((idea, idx) => (
              <li key={idx} className="leading-relaxed">{idea}</li>
            ))}
          </ul>
        </div>

        {/* Post-Workout Box */}
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Utensils className="h-4 w-4" />
            <span>{tips.postWorkoutTitle}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {tips.postWorkoutSummary}
          </p>
          <ul className="space-y-1.5 text-xs text-foreground list-disc list-inside font-medium">
            {tips.postWorkoutIdeas.map((idea, idx) => (
              <li key={idx} className="leading-relaxed">{idea}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Egyptian Staples & Portion Calculator */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              {isAr ? 'حاسبة الحصص والأغذية المصرية والرياضية' : 'Egyptian & Sports Food Portion Calculator'}
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {foodItemSeedData.length} {isAr ? 'عنصر غذائي' : 'staples'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Food Item Selector */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              {isAr ? 'اختر الطعام' : 'Select Food Staple'}
            </label>
            <select
              id="select-food-item"
              value={selectedFoodId}
              onChange={e => {
                setSelectedFoodId(e.target.value);
                const found = foodItemSeedData.find(f => f.id === e.target.value);
                if (found) setPortionGrams(found.defaultPortion);
              }}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              {foodItemSeedData.map(food => (
                <option key={food.id} value={food.id}>
                  {isAr && food.nameAr ? food.nameAr : food.name}
                </option>
              ))}
            </select>
          </div>

          {/* Portion in Grams */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              {isAr ? 'الكمية (جرام)' : 'Portion Size (grams)'}
            </label>
            <input
              type="number"
              min="10"
              max="1000"
              step="10"
              value={portionGrams}
              onChange={e => setPortionGrams(parseInt(e.target.value, 10) || 100)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Meal Type */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              {isAr ? 'نوع الوجبة' : 'Meal Slot'}
            </label>
            <select
              value={selectedMealType}
              onChange={e => setSelectedMealType(e.target.value as any)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="breakfast">{isAr ? 'إفطار' : 'Breakfast'}</option>
              <option value="lunch">{isAr ? 'غداء' : 'Lunch'}</option>
              <option value="dinner">{isAr ? 'عشاء' : 'Dinner'}</option>
              <option value="pre_workout">{isAr ? 'قبل التمرين' : 'Pre-Workout'}</option>
              <option value="post_workout">{isAr ? 'بعد التمرين' : 'Post-Workout'}</option>
              <option value="snack">{isAr ? 'سناك' : 'Snack'}</option>
            </select>
          </div>
        </div>

        {/* Live Calculation Output Card */}
        <div className="rounded-xl border border-primary/20 bg-secondary/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="grid grid-cols-4 gap-2 sm:gap-6 text-center">
            <div>
              <div className="text-[11px] text-muted-foreground">{t.nutrition.calories}</div>
              <div className="text-lg font-black text-amber-400">{calculatedCalories} kcal</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">{t.nutrition.protein}</div>
              <div className="text-lg font-black text-primary">{calculatedProtein} g</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">{t.nutrition.carbs}</div>
              <div className="text-lg font-black text-blue-400">{calculatedCarbs} g</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">{t.nutrition.fats}</div>
              <div className="text-lg font-black text-emerald-400">{calculatedFat} g</div>
            </div>
          </div>

          <button
            id="btn-log-calculated-food"
            onClick={handleLogFoodItem}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{t.nutrition.addMeal}</span>
          </button>
        </div>
      </div>

      {/* Today's Logged Meals */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-foreground">
          {isAr ? 'سجل وجبات اليوم' : "Today's Logged Meals"} ({todayLogs.length})
        </h3>

        {todayLogs.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center">
            {isAr ? 'لم تقم بتسجيل أي وجبة اليوم بعد.' : 'No meals logged yet today. Use the calculator above.'}
          </div>
        ) : (
          <div className="space-y-2">
            {todayLogs.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{item.foodName}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase">
                      {item.mealType}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {item.portionGrams}g • {item.calories} kcal • {item.proteinGrams}g protein
                    {item.carbsGrams ? ` • ${item.carbsGrams}g carbs` : ''}
                    {item.fatGrams ? ` • ${item.fatGrams}g fat` : ''}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteLog(item.id)}
                  className="p-1.5 text-muted-foreground hover:text-red-400"
                  title="Remove food"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

