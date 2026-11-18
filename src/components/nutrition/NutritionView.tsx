import React, { useState, useEffect, useMemo } from 'react';
import {
  Utensils,
  Calculator,
  Plus,
  Trash2,
  Check,
  Target,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { NutritionEntry, UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { foodItemSeedData } from '../../data/nutritionSeed';
import {
  FAT_LOSS_MEAL_PLANS,
  MealSlotItem,
  getRecommendedMealPlanForDate,
} from '../../data/fatLossMealPlan';
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

  const [activeTab, setActiveTab] = useState<'plan' | 'calculator'>('plan');
  const [nutritionLogs, setNutritionLogs] = useState<NutritionEntry[]>([]);

  const defaultPlan = useMemo(() => getRecommendedMealPlanForDate(new Date()), []);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(defaultPlan.id);
  const activeMealPlan =
    FAT_LOSS_MEAL_PLANS.find((p) => p.id === selectedPlanId) || defaultPlan;

  // Portion & custom food logger state
  const [selectedFoodId, setSelectedFoodId] = useState<string>(foodItemSeedData[0].id);
  const [portionGrams, setPortionGrams] = useState<number>(foodItemSeedData[0].defaultPortion);
  const [selectedMealType, setSelectedMealType] = useState<
    'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout'
  >('lunch');
  const [customFoodName, setCustomFoodName] = useState<string>('');
  const [customCalories, setCustomCalories] = useState<number>(250);
  const [customProtein, setCustomProtein] = useState<number>(25);

  // TDEE Interactive Calculator State
  const [tdeeAge, setTdeeAge] = useState<number>(profile.age || 26);
  const [tdeeHeight, setTdeeHeight] = useState<number>(profile.heightCm || 180);
  const [tdeeWeight, setTdeeWeight] = useState<number>(profile.currentWeightKg || 88);
  const [tdeeGender, setTdeeGender] = useState<'male' | 'female'>('male');
  const [tdeeActivity, setTdeeActivity] = useState<number>(
    profile.activityLevel === 'sedentary'
      ? 1.2
      : profile.activityLevel === 'light'
      ? 1.375
      : profile.activityLevel === 'very_active'
      ? 1.725
      : 1.55
  );
  const [goalCategory, setGoalCategory] = useState<TDEEGoalCategory>(
    profile.mode === 'controlled_fat_loss' ? 'fat_loss' : 'maintenance_recomp'
  );
  const [appliedNotification, setAppliedNotification] = useState<boolean>(false);

  useEffect(() => {
    setNutritionLogs(StorageService.getNutritionHistory());
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = nutritionLogs.filter((n) => n.date === today);

  const totalCaloriesLogged = todayLogs.reduce((sum, n) => sum + n.calories, 0);
  const totalProteinLogged = todayLogs.reduce((sum, n) => sum + n.proteinGrams, 0);
  const totalCarbsLogged = todayLogs.reduce((sum, n) => sum + (n.carbsGrams || 0), 0);
  const totalFatLogged = todayLogs.reduce((sum, n) => sum + (n.fatGrams || 0), 0);
  const totalFiberLogged = todayLogs.reduce((sum, n) => sum + (n.fiberGrams || 0), 0);

  const displayCalorieTarget = profile.dailyCalorieTarget || activeMealPlan.totalCalories;
  const displayProteinTarget = profile.dailyProteinTargetGrams || activeMealPlan.totalProtein;
  const displayFiberTarget = profile.dailyFiberTargetGrams || activeMealPlan.totalFiber || 32;

  // Log a preset meal slot directly
  const handleLogPlannedMeal = (meal: MealSlotItem) => {
    const entry: NutritionEntry = {
      id: `nut_${Date.now()}_${meal.slot}`,
      date: today,
      mealType: meal.slot,
      foodName: isAr ? meal.titleAr : meal.titleEn,
      portionGrams: 1,
      calories: meal.calories,
      proteinGrams: meal.proteinGrams,
      carbsGrams: meal.carbsGrams,
      fatGrams: meal.fatGrams,
      fiberGrams: meal.fiberGrams,
      timestamp: Date.now(),
    };
    StorageService.addNutritionEntry(entry);
    setNutritionLogs(StorageService.getNutritionHistory());
  };

  // Check if a meal slot was already logged today
  const isSlotLoggedToday = (slot: MealSlotItem['slot']) =>
    todayLogs.some((log) => log.mealType === slot);

  // Portion calculation
  const selectedFood = foodItemSeedData.find((f) => f.id === selectedFoodId) || foodItemSeedData[0];
  const calculatedCalories = Math.round((selectedFood.caloriesPer100g * portionGrams) / 100);
  const calculatedProtein = Math.round(((selectedFood.proteinPer100g * portionGrams) / 100) * 10) / 10;
  const calculatedCarbs = Math.round(((selectedFood.carbsPer100g * portionGrams) / 100) * 10) / 10;
  const calculatedFat = Math.round(((selectedFood.fatPer100g * portionGrams) / 100) * 10) / 10;

  const handleLogFoodItem = () => {
    const entry: NutritionEntry = {
      id: 'nut_' + Date.now(),
      date: today,
      mealType: selectedMealType,
      foodName: isAr && selectedFood.nameAr ? selectedFood.nameAr : selectedFood.name,
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

  // TDEE formulas
  const bmr = Math.round(
    tdeeGender === 'male'
      ? 10 * tdeeWeight + 6.25 * tdeeHeight - 5 * tdeeAge + 5
      : 10 * tdeeWeight + 6.25 * tdeeHeight - 5 * tdeeAge - 161
  );
  const calculatedTDEE = Math.round(bmr * tdeeActivity);
  const calorieMultiplier =
    goalCategory === 'fat_loss' ? 0.8 : goalCategory === 'muscle_gain' ? 1.1 : 0.95;
  const proteinMultiplier = goalCategory === 'fat_loss' ? 2.2 : 2.1;
  const goalCalorieTarget = Math.round(calculatedTDEE * calorieMultiplier);
  const targetProteinGrams = Math.round(tdeeWeight * proteinMultiplier);
  const targetFatGrams = Math.round((goalCalorieTarget * 0.25) / 9);
  const targetCarbsGrams = Math.max(
    50,
    Math.round((goalCalorieTarget - targetProteinGrams * 4 - targetFatGrams * 9) / 4)
  );

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
    if (onUpdateProfile) onUpdateProfile(updatedProfile);
    setAppliedNotification(true);
    setTimeout(() => setAppliedNotification(false), 3500);
  };

  return (
    <div className="space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header & Clean Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <Utensils className="h-5 w-5 text-emerald-400" />
            <span>{isAr ? 'الوجبات ونظام التغذية لخسارة الوزن' : 'Fat-Loss Meal Plan & Nutrition'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isAr
              ? 'وجبات يومية محددة وواضحة للفطار والغداء والعشاء والسناك بهدف إنقاص الوزن مع الحفاظ على العضلات.'
              : 'Structured daily Breakfast, Lunch, Dinner & Snack plans tailored for sustainable fat loss.'}
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-border bg-secondary/50 p-1 self-start sm:self-auto">
          <button
            id="tab-nutrition-plan"
            type="button"
            onClick={() => setActiveTab('plan')}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
              activeTab === 'plan'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isAr ? 'جدول الوجبات اليومي' : 'Daily Meal Plan'}
          </button>
          <button
            id="tab-nutrition-calc"
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
              activeTab === 'calculator'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isAr ? 'الحاسبة وتسجيل مخصص' : 'Calculator & Custom Log'}
          </button>
        </div>
      </div>

      {/* Compact Daily Summary Strip */}
      <div className="rounded-2xl border border-border bg-card p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono tabular-nums">
        <div>
          <span className="text-[11px] font-sans text-muted-foreground block">
            {isAr ? 'السعرات اليوم' : "Today's Calories"}
          </span>
          <span className="text-lg font-black text-foreground">
            {totalCaloriesLogged} <span className="text-xs font-normal text-muted-foreground">/ {displayCalorieTarget}</span>
          </span>
        </div>
        <div>
          <span className="text-[11px] font-sans text-muted-foreground block">
            {isAr ? 'البروتين اليوم' : 'Protein'}
          </span>
          <span className="text-lg font-black text-primary">
            {Math.round(totalProteinLogged)}g <span className="text-xs font-normal text-muted-foreground">/ {displayProteinTarget}g</span>
          </span>
        </div>
        <div>
          <span className="text-[11px] font-sans text-muted-foreground block">
            {isAr ? 'الألياف اليوم' : 'Fiber'}
          </span>
          <span className="text-lg font-black text-emerald-400">
            {Math.round(totalFiberLogged)}g <span className="text-xs font-normal text-muted-foreground">/ {displayFiberTarget}g</span>
          </span>
        </div>
        <div>
          <span className="text-[11px] font-sans text-muted-foreground block">
            {isAr ? 'الكارب / الدهون' : 'Carbs / Fat'}
          </span>
          <span className="text-sm font-bold text-foreground">
            {Math.round(totalCarbsLogged)}g C · {Math.round(totalFatLogged)}g F
          </span>
        </div>
      </div>

      {/* TAB 1: Structured Daily Fat-Loss Meal Plan */}
      {activeTab === 'plan' && (
        <div className="space-y-5">
          {/* Plan Switcher (Plan A, B, C) */}
          <div className="flex flex-wrap gap-2">
            {FAT_LOSS_MEAL_PLANS.map((plan) => {
              const isSelected = activeMealPlan.id === plan.id;
              return (
                <button
                  key={plan.id}
                  id={`btn-meal-plan-${plan.id}`}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`rounded-xl border px-4 py-2.5 text-start transition-colors ${
                    isSelected
                      ? 'border-emerald-500/60 bg-emerald-500/15 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-black">
                    {isAr ? plan.nameAr : plan.nameEn}
                  </div>
                  <div className="text-[11px] font-mono tabular-nums text-muted-foreground mt-0.5">
                    {isAr ? plan.subtitleAr : plan.subtitleEn}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 4 Organized Meals Grid: Breakfast, Lunch, Snack, Dinner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeMealPlan.meals.map((meal) => {
              const logged = isSlotLoggedToday(meal.slot);
              return (
                <div
                  key={meal.slot}
                  className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-4 ${
                    logged
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-2.5">
                      <div>
                        <span className="text-xs font-black text-primary">
                          {isAr ? meal.slotNameAr : meal.slotNameEn}
                        </span>
                        <span className="text-[11px] text-muted-foreground ms-2">
                          ({isAr ? meal.timingAr : meal.timingEn})
                        </span>
                      </div>
                      <span className="text-xs font-mono tabular-nums font-bold text-foreground">
                        {meal.calories} kcal • {meal.proteinGrams}g P
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-black text-foreground">
                      {isAr ? meal.titleAr : meal.titleEn}
                    </h3>

                    <ul className="space-y-1.5 text-xs sm:text-sm text-foreground list-disc list-inside">
                      {(isAr ? meal.itemsAr : meal.itemsEn).map((item, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>

                    <div className="rounded-xl bg-secondary/40 p-2.5 text-[11px] text-muted-foreground">
                      {isAr ? meal.altAr : meal.altEn}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
                      {meal.carbsGrams}g C · {meal.fatGrams}g F · {meal.fiberGrams}g Fiber
                    </span>

                    <button
                      type="button"
                      onClick={() => handleLogPlannedMeal(meal)}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                        logged
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>
                        {logged
                          ? isAr ? 'تم التسجيل (إضافة أخرى)' : 'Logged (Add Again)'
                          : isAr ? 'تم تناول الوجبة' : 'Log This Meal'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TDEE Calculator & Custom Food Logger */}
      {activeTab === 'calculator' && (
        <div className="space-y-5">
          {/* Quick Egyptian Staple Food Logger */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-base font-black text-foreground flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <span>{isAr ? 'تسجيل طعام سريع بالجرام' : 'Quick Food Portion Logger'}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  {isAr ? 'اختر الطعام' : 'Food Item'}
                </label>
                <select
                  value={selectedFoodId}
                  onChange={(e) => {
                    setSelectedFoodId(e.target.value);
                    const found = foodItemSeedData.find((f) => f.id === e.target.value);
                    if (found) setPortionGrams(found.defaultPortion);
                  }}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs sm:text-sm text-foreground"
                >
                  {foodItemSeedData.map((food) => (
                    <option key={food.id} value={food.id}>
                      {isAr && food.nameAr ? food.nameAr : food.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  {isAr ? 'الكمية (جم)' : 'Grams'}
                </label>
                <input
                  type="number"
                  min={10}
                  step={10}
                  value={portionGrams}
                  onChange={(e) => setPortionGrams(parseInt(e.target.value, 10) || 100)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold font-mono text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  {isAr ? 'الوجبة' : 'Meal Slot'}
                </label>
                <select
                  value={selectedMealType}
                  onChange={(e) => setSelectedMealType(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs sm:text-sm text-foreground"
                >
                  <option value="breakfast">{isAr ? 'الفطار' : 'Breakfast'}</option>
                  <option value="lunch">{isAr ? 'الغداء' : 'Lunch'}</option>
                  <option value="dinner">{isAr ? 'العشاء' : 'Dinner'}</option>
                  <option value="snack">{isAr ? 'سناك' : 'Snack'}</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/40 p-3 font-mono tabular-nums text-xs">
              <span>
                {calculatedCalories} kcal • {calculatedProtein}g P • {calculatedCarbs}g C • {calculatedFat}g F
              </span>
              <button
                type="button"
                onClick={handleLogFoodItem}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                <span>{t.nutrition.addMeal}</span>
              </button>
            </div>

            {/* Custom quick item */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-3 border-t border-border">
              <input
                type="text"
                placeholder={isAr ? 'أكلة مخصصة...' : 'Custom food name...'}
                value={customFoodName}
                onChange={(e) => setCustomFoodName(e.target.value)}
                className="sm:col-span-2 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="kcal"
                  value={customCalories}
                  onChange={(e) => setCustomCalories(parseInt(e.target.value, 10) || 0)}
                  className="w-1/2 rounded-xl border border-border bg-background px-2.5 py-2 text-xs font-mono text-foreground"
                />
                <input
                  type="number"
                  placeholder="P (g)"
                  value={customProtein}
                  onChange={(e) => setCustomProtein(parseInt(e.target.value, 10) || 0)}
                  className="w-1/2 rounded-xl border border-border bg-background px-2.5 py-2 text-xs font-mono text-foreground"
                />
              </div>
              <button
                type="button"
                onClick={handleLogCustomItem}
                className="rounded-xl border border-primary/40 bg-primary/15 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/25"
              >
                {isAr ? 'إضافة مخصصة' : 'Add Custom'}
              </button>
            </div>
          </div>

          {/* TDEE Calculator */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-black text-foreground">
                {isAr ? 'حاسبة السعرات المناسبة لوزنك (TDEE)' : 'Calorie & Macro Target Calculator'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setTdeeAge(profile.age || 26);
                  setTdeeHeight(profile.heightCm || 180);
                  setTdeeWeight(profile.currentWeightKg || 88);
                }}
                className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{isAr ? 'مزامنة' : 'Sync'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1">{isAr ? 'الهدف' : 'Goal'}</label>
                <select
                  value={goalCategory}
                  onChange={(e) => setGoalCategory(e.target.value as TDEEGoalCategory)}
                  className="w-full rounded-xl border border-border bg-background p-2 text-xs font-bold text-foreground"
                >
                  <option value="fat_loss">{isAr ? 'خسارة وزن (-20%)' : 'Fat Loss (-20%)'}</option>
                  <option value="maintenance_recomp">{isAr ? 'تثبيت وتنشيف (-5%)' : 'Recomp (-5%)'}</option>
                  <option value="muscle_gain">{isAr ? 'زيادة عضل (+10%)' : 'Muscle Gain (+10%)'}</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1">{isAr ? 'النوع' : 'Gender'}</label>
                <select
                  value={tdeeGender}
                  onChange={(e) => setTdeeGender(e.target.value as 'male' | 'female')}
                  className="w-full rounded-xl border border-border bg-background p-2 text-xs font-bold text-foreground"
                >
                  <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                  <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1">{isAr ? 'الوزن (كجم)' : 'Weight (kg)'}</label>
                <input
                  type="number"
                  value={tdeeWeight}
                  onChange={(e) => setTdeeWeight(parseFloat(e.target.value) || 80)}
                  className="w-full rounded-xl border border-border bg-background p-2 text-xs font-bold font-mono text-foreground"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1">{isAr ? 'الطول (سم)' : 'Height (cm)'}</label>
                <input
                  type="number"
                  value={tdeeHeight}
                  onChange={(e) => setTdeeHeight(parseInt(e.target.value, 10) || 175)}
                  className="w-full rounded-xl border border-border bg-background p-2 text-xs font-bold font-mono text-foreground"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1">{isAr ? 'النشاط' : 'Activity'}</label>
                <select
                  value={tdeeActivity}
                  onChange={(e) => setTdeeActivity(parseFloat(e.target.value))}
                  className="w-full rounded-xl border border-border bg-background p-2 text-xs font-bold text-foreground"
                >
                  <option value="1.2">{isAr ? 'خامل (1.2)' : 'Sedentary'}</option>
                  <option value="1.375">{isAr ? 'خفيف (1.375)' : 'Light'}</option>
                  <option value="1.55">{isAr ? 'متوسط (1.55)' : 'Moderate'}</option>
                  <option value="1.725">{isAr ? 'عالي (1.725)' : 'Heavy'}</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3.5 font-mono tabular-nums text-xs">
              <div>
                <span className="font-black text-primary text-sm">{goalCalorieTarget} kcal</span>
                <span className="text-muted-foreground ms-3">
                  {targetProteinGrams}g P • {targetCarbsGrams}g C • {targetFatGrams}g F
                </span>
              </div>

              <div className="flex items-center gap-2">
                {appliedNotification && (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isAr ? 'تم الحفظ' : 'Saved'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleApplyTDEETargets}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground"
                >
                  <Target className="h-3.5 w-3.5" />
                  <span>{isAr ? 'اعتماد الأهداف' : 'Apply Targets'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Logged Meals */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
        <h3 className="text-sm sm:text-base font-black text-foreground">
          {isAr ? 'الوجبات المسجلة اليوم' : "Today's Logged Meals"} ({todayLogs.length})
        </h3>

        {todayLogs.length === 0 ? (
          <div className="text-xs text-muted-foreground py-3">
            {isAr
              ? 'لم تسجل أي وجبة اليوم بعد — اضغط "تم تناول الوجبة" بجانب أي وجبة من الخطة أعلاه.'
              : 'No meals logged yet today. Tap "Log This Meal" on any planned meal above.'}
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {todayLogs.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs sm:text-sm font-bold text-foreground">{item.foodName}</div>
                  <div className="text-[11px] font-mono tabular-nums text-muted-foreground">
                    {item.mealType} • {item.calories} kcal • {item.proteinGrams}g P
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteLog(item.id)}
                  className="p-2 text-muted-foreground hover:text-rose-400"
                  title={isAr ? 'حذف' : 'Delete'}
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
