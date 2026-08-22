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
  Search
} from 'lucide-react';
import { FoodItemSeed, NutritionEntry, UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { foodItemSeedData, prePostWorkoutTips } from '../../data/nutritionSeed';
import { StorageService } from '../../services/storage';

interface NutritionViewProps {
  profile: UserProfile;
}

export const NutritionView: React.FC<NutritionViewProps> = ({
  profile,
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
