export interface MealSlotItem {
  slot: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  slotNameEn: string;
  slotNameAr: string;
  timingEn: string;
  timingAr: string;
  titleEn: string;
  titleAr: string;
  itemsEn: string[];
  itemsAr: string[];
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  altEn: string;
  altAr: string;
}

export interface DailyMealPlanTemplate {
  id: 'egyptian_balanced' | 'quick_practical' | 'high_protein_cut';
  nameEn: string;
  nameAr: string;
  subtitleEn: string;
  subtitleAr: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  meals: MealSlotItem[];
}

export const FAT_LOSS_MEAL_PLANS: DailyMealPlanTemplate[] = [
  {
    id: 'egyptian_balanced',
    nameEn: 'Plan A: Balanced Egyptian Cut',
    nameAr: 'خطة أ: نظام مصري متوازن لحرق الدهون',
    subtitleEn: 'High-satiety everyday foods • ~1,860 kcal • 160g P • 32g Fiber',
    subtitleAr: 'أطعمة يومية مشبعة ومتوفرة • ~1,860 سعرة • 160 جم بروتين • 32 جم ألياف',
    totalCalories: 1860,
    totalProtein: 160,
    totalCarbs: 175,
    totalFat: 52,
    totalFiber: 32,
    meals: [
      {
        slot: 'breakfast',
        slotNameEn: 'Breakfast',
        slotNameAr: 'الفطار',
        timingEn: '8:00 – 10:00 AM',
        timingAr: '8:00 – 10:00 صباحاً',
        titleEn: '3 Boiled Eggs + Areesh Cheese + Baladi Bread',
        titleAr: '3 بيضات مسلوقة + جبنة قريش + عيش بلدي',
        itemsEn: [
          '3 whole boiled eggs',
          '100g Areesh cheese with 1 tsp olive oil & tomatoes/cucumber',
          '1 whole-wheat Baladi loaf (or 2 brown toast slices)',
        ],
        itemsAr: [
          '3 بيضات مسلوقة كاملة',
          '100 جم جبنة قريش + ملعقة صغيرة زيت زيتون + خيار وطماطم',
          '1 رغيف عيش بلدي بالردة (أو 2 شريحة توست أسمر)',
        ],
        calories: 490,
        proteinGrams: 38,
        carbsGrams: 46,
        fatGrams: 17,
        fiberGrams: 8,
        altEn: 'Alternative: 200g Ful Mudammas (minimal oil) + 2 boiled eggs + 1/2 Baladi loaf',
        altAr: 'بديل سريع: طبق فول مدمس (200 جم بزيت خفيف وليمون) + 2 بيضة مسلوقة + نصف رغيف بلدي',
      },
      {
        slot: 'lunch',
        slotNameEn: 'Lunch (Main Meal)',
        slotNameAr: 'الغداء (الوجبة الأساسية)',
        timingEn: '2:00 – 4:00 PM',
        timingAr: '2:00 – 4:00 عصراً',
        titleEn: 'Grilled Chicken Breast + Steamed Rice + Green Salad',
        titleAr: 'صدور دجاج مشوية + أرز بسمتي/مصري + سلطة خضراء',
        itemsEn: [
          '200g grilled chicken breast (measured cooked, skinless)',
          '150g cooked rice (about 6–7 tablespoons) or 200g boiled potato',
          'Large mixed green salad with lemon & 1 tsp olive oil + cooked veggies',
        ],
        itemsAr: [
          '200 جم صدور دجاج مشوية بدون جلد',
          '6–7 ملاعق أرز مسلوق/بسمتي (150 جم مطهو) أو 200 جم بطاطس مسلوقة',
          'طبق سلطة خضراء كبير بليمون + خضار سوتيه أو ملوخية خفيفة',
        ],
        calories: 590,
        proteinGrams: 62,
        carbsGrams: 54,
        fatGrams: 12,
        fiberGrams: 10,
        altEn: 'Alternative: 200g grilled lean beef/fish fillet + 150g rice + salad',
        altAr: 'بديل سريع: 200 جم سمك فيليه أو لحم أحمر مشوي + 6 ملاعق أرز + سلطة خضراء',
      },
      {
        slot: 'snack',
        slotNameEn: 'Pre/Afternoon Snack',
        slotNameAr: 'سناك (قبل التمرين / العصر)',
        timingEn: '5:30 – 6:30 PM',
        timingAr: '5:30 – 6:30 مساءً',
        titleEn: 'Greek Yogurt + Banana + Black Coffee',
        titleAr: 'زبادي يوناني + ثمرة موز + قهوة سادة',
        itemsEn: [
          '170g low-fat Greek yogurt (or 2 regular light yogurts)',
          '1 medium banana (great 45 min before training)',
          '10g raw almonds (about 8 nuts) + black coffee without sugar',
        ],
        itemsAr: [
          'علبة زبادي يوناني لايت (170 جم) أو كوب لبن رايب',
          'ثمرة موز متوسطة (ممتازة قبل التمرين بـ 45 دقيقة)',
          '8 حبات لوز نيء + فنجان قهوة سادة بدون سكر',
        ],
        calories: 290,
        proteinGrams: 19,
        carbsGrams: 34,
        fatGrams: 9,
        fiberGrams: 6,
        altEn: 'Alternative: 50g oats with water/milk + 1 apple + cinnamon',
        altAr: 'بديل سريع: 50 جم شوفان مطهو + تفاحة خضراء + رشة قرفة',
      },
      {
        slot: 'dinner',
        slotNameEn: 'Dinner (Light & High-Casein)',
        slotNameAr: 'العشاء (خفيف ومشبع للنوم)',
        timingEn: '8:30 – 10:00 PM',
        timingAr: '8:30 – 10:00 مساءً',
        titleEn: 'Tuna in Water OR 200g Areesh Cheese + Salad',
        titleAr: 'علبة تونة مصفاة أو 200 جم جبنة قريش + سلطة',
        itemsEn: [
          '1 can tuna in spring water (140g drained) OR 200g Areesh cheese',
          '1/2 whole-wheat Baladi loaf (or skip bread on low-activity days)',
          'Sliced cucumber, lettuce, bell pepper & lemon',
        ],
        itemsAr: [
          'علبة تونة قطع في ماء (مصفاة 140 جم) أو 200 جم جبنة قريش',
          'نصف رغيف بلدي (أو بدون خبز في أيام الراحة)',
          'خيار وخس وفلفل ألوان مع رشة كمون وليمون',
        ],
        calories: 490,
        proteinGrams: 41,
        carbsGrams: 41,
        fatGrams: 14,
        fiberGrams: 8,
        altEn: 'Alternative: 3 egg whites + 1 whole egg omelet with veggies',
        altAr: 'بديل سريع: أومليت 3 بياض بيض + بيضة كاملة مع فلفل وبصل بدون زبدة',
      },
    ],
  },
  {
    id: 'quick_practical',
    nameEn: 'Plan B: Quick Workday Cut',
    nameAr: 'خطة ب: يوم عمل سريع وعملي',
    subtitleEn: 'Minimal cooking time • ~1,790 kcal • 150g P • 31g Fiber',
    subtitleAr: 'تحضير سريع مناسب لأيام العمل • ~1,790 سعرة • 150 جم بروتين • 31 جم ألياف',
    totalCalories: 1790,
    totalProtein: 150,
    totalCarbs: 165,
    totalFat: 52,
    totalFiber: 31,
    meals: [
      {
        slot: 'breakfast',
        slotNameEn: 'Breakfast',
        slotNameAr: 'الفطار',
        timingEn: '8:00 – 9:30 AM',
        timingAr: '8:00 – 9:30 صباحاً',
        titleEn: 'Oats + Greek Yogurt + Chia/Berries',
        titleAr: 'شوفان بالزبادي اليوناني والفواكه',
        itemsEn: [
          '50g rolled oats soaked or cooked in water/skim milk',
          '170g Greek yogurt mixed with cinnamon',
          '1 small banana or apple + 2 boiled eggs on the side',
        ],
        itemsAr: [
          '50 جم شوفان كامل الحبة مع ماء أو حليب خالي الدسم',
          'علبة زبادي يوناني (170 جم) + رشة قرفة',
          'ثمرة تفاح أو موز صغيرة + 2 بيضة مسلوقة',
        ],
        calories: 470,
        proteinGrams: 34,
        carbsGrams: 54,
        fatGrams: 13,
        fiberGrams: 9,
        altEn: 'Alternative: 150g Areesh cheese + 1 Baladi bread + tea without sugar',
        altAr: 'بديل سريع: 150 جم جبنة قريش + رغيف بلدي + شاي بدون سكر',
      },
      {
        slot: 'lunch',
        slotNameEn: 'Lunch',
        slotNameAr: 'الغداء',
        timingEn: '1:30 – 3:30 PM',
        timingAr: '1:30 – 3:30 عصراً',
        titleEn: 'Tuna Salad Bowl + Whole-Grain Toast / Rice',
        titleAr: 'سلطة تونة غنية بالبروتين + أرز أو توست',
        itemsEn: [
          '2 cans tuna in water (drained, ~260g) with lemon & mustard',
          '120g cooked rice OR 2 brown toast slices',
          'Diced tomatoes, cucumbers, sweet corn (30g), parsley',
        ],
        itemsAr: [
          '2 علبة تونة في ماء (مصفاة) مع ليمون ومستردة',
          '5 ملاعق أرز مسلوق (120 جم) أو 2 شريحة توست بني',
          'خضار مقطعة (طماطم، خيار، بقدونس، جرجير)',
        ],
        calories: 510,
        proteinGrams: 58,
        carbsGrams: 44,
        fatGrams: 10,
        fiberGrams: 8,
        altEn: 'Alternative: 180g grilled chicken strips wrap in 1 tortilla/Baladi bread',
        altAr: 'بديل سريع: 180 جم شرائح دجاج مشوي في رغيف بلدي مع سلطة',
      },
      {
        slot: 'snack',
        slotNameEn: 'Snack',
        slotNameAr: 'سناك',
        timingEn: '5:00 – 6:30 PM',
        timingAr: '5:00 – 6:30 مساءً',
        titleEn: '1 Orange / Apple + 15g Nuts + Coffee',
        titleAr: 'ثمرة فاكهة + مكسرات خفيفة + قهوة',
        itemsEn: [
          '1 medium orange or green apple',
          '15g raw walnuts or almonds (small handful)',
          'Black coffee or green tea',
        ],
        itemsAr: [
          'ثمرة برتقال أو تفاح أخضر',
          '15 جم مكسرات نيئة (حوالي 10 حبات لوز أو عين جمل)',
          'قهوة سادة أو شاي أخضر بدون سكر',
        ],
        calories: 210,
        proteinGrams: 5,
        carbsGrams: 24,
        fatGrams: 10,
        fiberGrams: 5,
        altEn: 'Alternative: 1 cup low-fat Laban Rayeb + cucumber slices',
        altAr: 'بديل سريع: كوب لبن رايب لايت + شرائح خيار',
      },
      {
        slot: 'dinner',
        slotNameEn: 'Dinner',
        slotNameAr: 'العشاء',
        timingEn: '8:00 – 9:30 PM',
        timingAr: '8:00 – 9:30 مساءً',
        titleEn: 'Grilled Chicken/Kofta + Roasted Veggies',
        titleAr: 'بروتين مشوي خفيف + خضار مشوية/سلطة',
        itemsEn: [
          '180g grilled chicken breast or lean grilled beef kofta',
          '250g roasted zucchini, broccoli, & bell peppers (1 tsp olive oil)',
          '1 small boiled potato (120g) if post-workout',
        ],
        itemsAr: [
          '180 جم صدور دجاج أو كفتة مشوية قليلة الدسم',
          'طبق خضار مشوية أو سوتيه (كوسة، بروكلي، فلفل) بملعقة صغيرة زيت زيتون',
          'ثمرة بطاطس مسلوقة صغيرة (120 جم) في أيام التمرين',
        ],
        calories: 600,
        proteinGrams: 53,
        carbsGrams: 43,
        fatGrams: 19,
        fiberGrams: 9,
        altEn: 'Alternative: 200g Areesh cheese + 2 boiled eggs + salad',
        altAr: 'بديل سريع: 200 جم جبنة قريش + 2 بيضة مسلوقة + سلطة',
      },
    ],
  },
  {
    id: 'high_protein_cut',
    nameEn: 'Plan C: High-Protein Training Day',
    nameAr: 'خطة ج: يوم تمرين ثقيل (بروتين عالي)',
    subtitleEn: 'Supports strength & fat loss • ~1,950 kcal • 170g P • 33g Fiber',
    subtitleAr: 'يدعم الحفاظ على العضلات وأداء التمرين • ~1,950 سعرة • 170 جم بروتين • 33 جم ألياف',
    totalCalories: 1950,
    totalProtein: 170,
    totalCarbs: 190,
    totalFat: 54,
    totalFiber: 33,
    meals: [
      {
        slot: 'breakfast',
        slotNameEn: 'Breakfast',
        slotNameAr: 'الفطار',
        timingEn: '8:30 – 10:00 AM',
        timingAr: '8:30 – 10:00 صباحاً',
        titleEn: '4-Egg Omelet (2 Whole + 2 Whites) + Areesh + Bread',
        titleAr: 'أومليت 4 بيضات (2 كاملة + 2 بياض) + قريش + عيش بلدي',
        itemsEn: [
          '2 whole eggs + 2 egg whites scrambled with spinach & peppers',
          '80g Areesh cheese',
          '1 Baladi bread loaf',
        ],
        itemsAr: [
          '2 بيضة كاملة + 2 بياض بيض مع فلفل وسبانخ',
          '80 جم جبنة قريش',
          '1 رغيف عيش بلدي بالردة',
        ],
        calories: 510,
        proteinGrams: 42,
        carbsGrams: 45,
        fatGrams: 17,
        fiberGrams: 8,
        altEn: 'Alternative: 250g low-fat Greek yogurt + 40g oats + 1 scoop whey',
        altAr: 'بديل سريع: 250 جم زبادي يوناني + 40 جم شوفان + سكوب بروتين',
      },
      {
        slot: 'lunch',
        slotNameEn: 'Lunch',
        slotNameAr: 'الغداء',
        timingEn: '2:00 – 4:00 PM',
        timingAr: '2:00 – 4:00 عصراً',
        titleEn: '220g Lean Steak / Chicken + 200g Rice + Salad',
        titleAr: '220 جم دجاج أو لحم مشوي صافي + أرز + سلطة',
        itemsEn: [
          '220g grilled chicken breast or lean beef',
          '200g steamed basmati rice (about 8 tablespoons)',
          'Large green salad + light vegetable soup',
        ],
        itemsAr: [
          '220 جم صدور دجاج مشوية أو لحم أحمر خالي الدهن',
          '8 ملاعق أرز بسمتي مسلوق (200 جم)',
          'طبق سلطة خضراء كبير + شوربة خضار خفيفة',
        ],
        calories: 670,
        proteinGrams: 68,
        carbsGrams: 66,
        fatGrams: 14,
        fiberGrams: 10,
        altEn: 'Alternative: 250g grilled tilapia/salmon + 220g baked potato + salad',
        altAr: 'بديل سريع: 250 جم سمك بلطي مشوي + 220 جم بطاطس مشوية + سلطة',
      },
      {
        slot: 'snack',
        slotNameEn: 'Pre/Post Workout Snack',
        slotNameAr: 'سناك (حول التمرين)',
        timingEn: '5:30 – 7:00 PM',
        timingAr: '5:30 – 7:00 مساءً',
        titleEn: 'Banana + Greek Yogurt / Whey + Coffee',
        titleAr: 'موزة + زبادي يوناني أو واي بروتين + قهوة',
        itemsEn: [
          '170g Greek yogurt (or 1 scoop whey protein in water)',
          '1 large banana',
          'Black coffee 40 minutes pre-workout',
        ],
        itemsAr: [
          'علبة زبادي يوناني (170 جم) أو سكوب واي بروتين في ماء',
          'ثمرة موز كبيرة قبل التمرين',
          'فنجان قهوة سادة قبل التمرين بـ 40 دقيقة',
        ],
        calories: 270,
        proteinGrams: 22,
        carbsGrams: 36,
        fatGrams: 4,
        fiberGrams: 6,
        altEn: 'Alternative: 2 slices brown toast + 1 tbsp honey + 2 boiled eggs',
        altAr: 'بديل سريع: 2 توست أسمر + ملعقة عسل صغيرة + 2 بيضة مسلوقة',
      },
      {
        slot: 'dinner',
        slotNameEn: 'Dinner',
        slotNameAr: 'العشاء',
        timingEn: '9:00 – 10:30 PM',
        timingAr: '9:00 – 10:30 مساءً',
        titleEn: '200g Areesh Cheese OR Tuna + 1/2 Loaf + Salad',
        titleAr: '200 جم جبنة قريش أو علبة تونة + نصف رغيف + سلطة',
        itemsEn: [
          '200g Areesh cheese with 1 tbsp olive oil & zaatar OR 150g grilled chicken',
          '1/2 Baladi loaf + cucumber & tomatoes',
          '1 cup warm green tea or mint tea without sugar',
        ],
        itemsAr: [
          '200 جم جبنة قريش بملعقة زيت زيتون وزعتر (أو 150 جم دجاج مشوي)',
          'نصف رغيف بلدي + خيار وطماطم',
          'كوب شاي أخضر أو نعناع بدون سكر',
        ],
        calories: 500,
        proteinGrams: 38,
        carbsGrams: 43,
        fatGrams: 19,
        fiberGrams: 9,
        altEn: 'Alternative: 1 can tuna + 150g boiled potato + green salad',
        altAr: 'بديل سريع: علبة تونة مصفاة + 150 جم بطاطس مسلوقة + سلطة',
      },
    ],
  },
];

export function getRecommendedMealPlanForDate(date: Date = new Date()): DailyMealPlanTemplate {
  const dayIndex = date.getDay(); // 0..6
  return FAT_LOSS_MEAL_PLANS[dayIndex % FAT_LOSS_MEAL_PLANS.length];
}
