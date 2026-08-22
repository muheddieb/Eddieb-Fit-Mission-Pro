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
  Scale
} from 'lucide-react';
import { FoodItemSeed, NutritionEntry, UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { foodItemSeedData, prePostWorkoutTips } from '../../data/nutritionSeed';
import { StorageService } from '../../services/storage';

interface NutritionViewProps {
  profile: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
}

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
  const [tdeeActivity, setTdeeActivity] = useState<number>(1.55); // 1.2: Sedentary, 1.375: Light, 1.55: Moderate, 1.725: Heavy, 1.9: Extreme
  const [tdeeGoal, setTdeeGoal] = useState<'aggressive_cut' | 'moderate_cut' | 'maintenance' | 'recomp' | 'lean_bulk'>('moderate_cut');
  const [appliedNotification, setAppliedNotification] = useState<boolean>(false);

  const tips = isAr ? prePostWorkoutTips.ar : prePostWorkoutTips.en;

  useEffect(() => {
    setNutritionLogs(StorageService.getNutritionHistory());
  }, []);

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

  // Goal adjustment
  let goalCalorieTarget = calculatedTDEE;
  let targetProteinGrams = Math.round(tdeeWeight * 2.2); // ~2.2g per kg bodyweight
  let goalDescription = '';
  let goalDescriptionAr = '';

  if (tdeeGoal === 'aggressive_cut') {
    goalCalorieTarget = Math.round(calculatedTDEE * 0.75); // -25% deficit
    targetProteinGrams = Math.round(tdeeWeight * 2.4);
    goalDescription = 'Aggressive Fat Loss (-25% Deficit, High Satiety)';
    goalDescriptionAr = 'حرق دهون مكثف (عجز 25% مع بروتين عالي جداً)';
  } else if (tdeeGoal === 'moderate_cut') {
    goalCalorieTarget = Math.round(calculatedTDEE * 0.82); // -18% deficit
    targetProteinGrams = Math.round(tdeeWeight * 2.2);
    goalDescription = 'Controlled Fat Loss (-18% Deficit, Muscle Preserving)';
    goalDescriptionAr = 'تنشيف محسوب ومستدام (عجز 18% للحفاظ على الكتلة العضلية)';
  } else if (tdeeGoal === 'recomp') {
    goalCalorieTarget = Math.round(calculatedTDEE * 0.95); // -5% slight deficit
    targetProteinGrams = Math.round(tdeeWeight * 2.3);
    goalDescription = 'Body Recomposition (Simultaneous Fat Loss & Muscle Tone)';
    goalDescriptionAr = 'إعادة تشكيل الجسم (بناء عضل مع خفض الدهون تدريجياً)';
  } else if (tdeeGoal === 'maintenance') {
    goalCalorieTarget = calculatedTDEE;
    targetProteinGrams = Math.round(tdeeWeight * 2.0);
    goalDescription = 'Energy Balance Maintenance';
    goalDescriptionAr = 'تثبيت الوزن وتوازن الطاقة الكامل';
  } else if (tdeeGoal === 'lean_bulk') {
    goalCalorieTarget = Math.round(calculatedTDEE * 1.10); // +10% surplus
    targetProteinGrams = Math.round(tdeeWeight * 2.0);
    goalDescription = 'Lean Muscle Mass Surplus (+10%)';
    goalDescriptionAr = 'تضخيم عضلي صافي وفائض مدروس (+10%)';
  }

  // Recommended Macros distribution for Target
  const targetFatGrams = Math.round((goalCalorieTarget * 0.25) / 9);
  const targetCarbsGrams = Math.max(50, Math.round((goalCalorieTarget - (targetProteinGrams * 4 + targetFatGrams * 9)) / 4));

  const handleApplyTDEETargets = () => {
    const updatedProfile: UserProfile = {
      ...profile,
      dailyCalorieTarget: goalCalorieTarget,
      dailyProteinTargetGrams: targetProteinGrams,
      currentWeightKg: tdeeWeight,
      heightCm: tdeeHeight,
      age: tdeeAge,
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
            {totalCaloriesLogged} <span className="text-xs text-muted-foreground">/ {profile.dailyCalorieTarget} kcal</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, (totalCaloriesLogged / profile.dailyCalorieTarget) * 100)}%` }}
            />
          </div>
        </div>

        {/* Protein Card */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase">{t.nutrition.protein}</span>
            <span className="text-xs font-bold text-primary">Goal: {profile.dailyProteinTargetGrams}g</span>
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {totalProteinLogged} <span className="text-xs text-muted-foreground">/ {profile.dailyProteinTargetGrams} g</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, (totalProteinLogged / profile.dailyProteinTargetGrams) * 100)}%` }}
            />
          </div>
        </div>

        {/* Carbohydrates Card */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase">{t.nutrition.carbs}</span>
            <span className="text-xs text-muted-foreground">Energy</span>
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {totalCarbsLogged} <span className="text-xs text-muted-foreground">g</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Glycogen fuel for heavy lifting
          </p>
        </div>

        {/* Fats Card */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase">{t.nutrition.fats}</span>
            <span className="text-xs text-muted-foreground">Hormonal</span>
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {totalFatLogged} <span className="text-xs text-muted-foreground">g</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Olive oil, egg yolks, seeds
          </p>
        </div>
      </div>

      {/* TDEE (Total Daily Energy Expenditure) Calculator */}
      <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-foreground">
                  {isAr ? 'حاسبة استهلاك الطاقة الكلي (TDEE) والسعرات الدقيقة' : 'TDEE (Total Daily Energy Expenditure) Calculator'}
                </h3>
                <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-black text-primary uppercase">
                  Mifflin-St Jeor
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr 
                  ? 'احسب معدل الحرق اليومي الحقيقي وحدد هدف السعرات والماكروز تلقائياً للتنشيف أو البناء'
                  : 'Calculate your exact metabolic expenditure and optimize daily caloric deficits for fat loss.'}
              </p>
            </div>
          </div>
        </div>

        {/* Calculator Inputs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
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
              {isAr ? 'الوزن الحالي (كجم)' : 'Current Weight (kg)'}
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
              <option value="1.2">{isAr ? 'خامل (مكتبي / قليل الحركة)' : 'Sedentary (desk job)'}</option>
              <option value="1.375">{isAr ? 'نشاط خفيف (1-2 يوم تمرين)' : 'Light (1-2 days/wk)'}</option>
              <option value="1.55">{isAr ? 'نشاط متوسط (3-5 أيام تمرين)' : 'Moderate (3-5 days/wk)'}</option>
              <option value="1.725">{isAr ? 'نشاط عالي (6-7 أيام مكثفة)' : 'Heavy (6-7 days/wk)'}</option>
              <option value="1.9">{isAr ? 'نشاط رياضي شاق (تدريب مضاعف)' : 'Extreme (Athlete 2x/day)'}</option>
            </select>
          </div>

          {/* Goal Selector */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">
              {isAr ? 'الهدف التدريبي' : 'Fitness Mission'}
            </label>
            <select
              value={tdeeGoal}
              onChange={e => setTdeeGoal(e.target.value as any)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-bold text-primary focus:border-primary focus:outline-none"
            >
              <option value="aggressive_cut">{isAr ? 'تنشيف سريع (-25%)' : 'Aggressive Cut (-25%)'}</option>
              <option value="moderate_cut">{isAr ? 'تنشيف مدروس (-18%)' : 'Controlled Fat Loss (-18%)'}</option>
              <option value="recomp">{isAr ? 'إعادة تشكيل Recomp (-5%)' : 'Body Recomp (-5%)'}</option>
              <option value="maintenance">{isAr ? 'تثبيت الوزن (0%)' : 'Maintenance (0%)'}</option>
              <option value="lean_bulk">{isAr ? 'تضخيم صافي (+10%)' : 'Lean Bulk (+10%)'}</option>
            </select>
          </div>
        </div>

        {/* TDEE Summary & Calculated Target Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center rounded-2xl border border-primary/20 bg-secondary/40 p-4">
          {/* Left stats: BMR & Maintenance TDEE */}
          <div className="md:col-span-4 space-y-2 border-b md:border-b-0 md:border-r border-border pb-3 md:pb-0 md:pr-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{isAr ? 'معدل الأيض الأساسي (BMR):' : 'Basal Metabolic Rate (BMR):'}</span>
              <span className="font-mono font-black text-foreground">{bmr} kcal</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{isAr ? 'إجمالي الحرق اليومي (TDEE):' : 'Total Daily Burn (TDEE):'}</span>
              <span className="font-mono font-black text-amber-400 text-sm">{calculatedTDEE} kcal</span>
            </div>
            <div className="text-[11px] text-muted-foreground pt-1">
              {isAr ? goalDescriptionAr : goalDescription}
            </div>
          </div>

          {/* Center targets: Recommended Calorie & Protein */}
          <div className="md:col-span-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-border bg-card p-2.5">
              <div className="text-[10px] text-muted-foreground font-bold uppercase">{isAr ? 'السعرات المستهدفة' : 'Target Calories'}</div>
              <div className="text-lg font-black text-amber-400 font-mono mt-0.5">{goalCalorieTarget}</div>
              <div className="text-[10px] text-muted-foreground">kcal / day</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-2.5">
              <div className="text-[10px] text-muted-foreground font-bold uppercase">{isAr ? 'البروتين' : 'Protein'}</div>
              <div className="text-lg font-black text-primary font-mono mt-0.5">{targetProteinGrams}</div>
              <div className="text-[10px] text-muted-foreground">g / day</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-2.5">
              <div className="text-[10px] text-muted-foreground font-bold uppercase">{isAr ? 'الكارب / الدهون' : 'Carbs / Fat'}</div>
              <div className="text-sm font-black text-foreground font-mono mt-1">{targetCarbsGrams}g / {targetFatGrams}g</div>
              <div className="text-[10px] text-muted-foreground">{isAr ? 'توزيع مثالي' : 'optimal'}</div>
            </div>
          </div>

          {/* Right action: Apply to Profile Button */}
          <div className="md:col-span-3 flex flex-col items-center justify-center">
            <button
              id="btn-apply-tdee-to-profile"
              onClick={handleApplyTDEETargets}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95"
            >
              <Target className="h-4 w-4" />
              <span>{isAr ? 'اعتماد الأهداف في الملف' : 'Apply Targets to App'}</span>
            </button>
            {appliedNotification && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 mt-2 animate-bounce">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isAr ? 'تم تحديث الأهداف اليومية بنجاح!' : 'Targets Applied to Profile!'}
              </span>
            )}
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
