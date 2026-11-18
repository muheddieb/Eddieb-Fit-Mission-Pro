import React, { useState } from 'react';
import {
  BookOpen,
  Scale,
  Gauge,
  Calendar,
  Utensils,
  Calculator,
  HeartPulse,
  ShieldAlert,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { SPLIT_DEFINITIONS } from '../../services/weeklyScheduleService';

interface GuidanceViewProps {
  profile: UserProfile;
  onNavigateToMeals?: () => void;
}

type PlanTab = 'training' | 'cardio_nutrition' | 'weights_rpe' | 'goals_safety';

const PLATE_STEPS = [25, 20, 15, 10, 5, 2.5, 1.25];

function computePlates(totalKg: number, barKg: number): { perSide: number; plates: { w: number; count: number }[] } {
  if (totalKg <= barKg) return { perSide: 0, plates: [] };
  const perSide = Math.round(((totalKg - barKg) / 2) * 100) / 100;
  let rem = perSide;
  const plates: { w: number; count: number }[] = [];
  for (const w of PLATE_STEPS) {
    if (rem >= w - 0.001) {
      const count = Math.floor((rem + 0.001) / w);
      if (count > 0) {
        plates.push({ w, count });
        rem = Math.round((rem - count * w) * 100) / 100;
      }
    }
  }
  return { perSide, plates };
}

export const GuidanceView: React.FC<GuidanceViewProps> = ({
  profile,
  onNavigateToMeals,
}) => {
  const isAr = profile.language === 'ar';
  const [activeTab, setActiveTab] = useState<PlanTab>('training');

  // Interactive simple weight calculator for Total vs Per-Side & Plates
  const [calcMode, setCalcMode] = useState<'dumbbell' | 'barbell'>('dumbbell');
  const [barWeight, setBarWeight] = useState<number>(20);
  const [sampleTotalKg, setSampleTotalKg] = useState<number>(15);

  const perSideDumbbell = Math.round((sampleTotalKg / 2) * 100) / 100;
  const barbellBreakdown = computePlates(sampleTotalKg, barWeight);

  const tabs: { id: PlanTab; labelAr: string; labelEn: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'training', labelAr: 'الهيكل الأسبوعي والبدائل', labelEn: 'Weekly Plan & Swaps', icon: Calendar },
    { id: 'cardio_nutrition', labelAr: 'الكارديو والتغذية', labelEn: 'Cardio & Nutrition', icon: Utensils },
    { id: 'weights_rpe', labelAr: 'حساب الأوزان والـ RPE', labelEn: 'Weights & RPE', icon: Scale },
    { id: 'goals_safety', labelAr: 'الأهداف والسلامة', labelEn: 'Goals & Safety', icon: ShieldAlert },
  ];

  const weeklyBlueprint = [
    { dayAr: 'السبت', dayEn: 'Saturday', split: SPLIT_DEFINITIONS.push },
    { dayAr: 'الأحد', dayEn: 'Sunday', split: SPLIT_DEFINITIONS.pull },
    { dayAr: 'الإثنين', dayEn: 'Monday', split: SPLIT_DEFINITIONS.rest_active },
    { dayAr: 'الثلاثاء', dayEn: 'Tuesday', split: SPLIT_DEFINITIONS.legs },
    { dayAr: 'الأربعاء', dayEn: 'Wednesday', split: SPLIT_DEFINITIONS.upper },
    { dayAr: 'الخميس', dayEn: 'Thursday', split: SPLIT_DEFINITIONS.rest_active },
    { dayAr: 'الجمعة', dayEn: 'Friday', split: SPLIT_DEFINITIONS.rest_active },
  ];

  return (
    <div className="space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/25">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">
              {isAr ? 'تفاصيل الخطة الكاملة (Plan Details)' : 'Plan Details & Full Blueprint'}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isAr
                ? 'الهيكل الأسبوعي المرن، بدائل حماية المفاصل، استراتيجية الكارديو والتغذية، قواعد التطور، وملاحظات السلامة.'
                : 'Complete weekly structure, joint-safe exercise substitutions, cardio & nutrition targets, progression rules, and safety notes.'}
            </p>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`guide-tab-${tab.id}`}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-colors ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Weekly Structure, Substitutions, Progression & Morning Habit */}
      {activeTab === 'training' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-base font-black text-foreground">
              {isAr ? '1. الهيكل الأسبوعي المرن (4 أيام جيم + 3 استشفاء/كارديو خفيف)' : '1. Flexible 4-Day Gym Structure (Move Any Day)'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? 'يمكنك نقل أي يوم مع أي يوم آخر من الرئيسية أو الجدول الأسبوعي. التقييم التلقائي يحذرك بالأخضر/الأصفر/الأحمر إذا تعاقب ضغط متشابه على نفس العضلات أو الركبتين.'
                : 'Any day can be swapped or moved from Home or Weekly Schedule. Automatic Green/Yellow/Red checks guard against back-to-back muscle overlap or consecutive knee/back stress.'}
            </p>
            <div className="divide-y divide-border/70 text-xs">
              {weeklyBlueprint.map((item) => (
                <div key={item.dayEn} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="font-black text-foreground">
                    {isAr ? item.dayAr : item.dayEn} — <span className="text-primary">{isAr ? item.split.titleAr : item.split.title}</span>
                  </div>
                  <div className="text-muted-foreground font-mono tabular-nums">
                    ~{item.split.estimatedMinutes}m · {(isAr ? item.split.exerciseNamesAr : item.split.exerciseNames).slice(0, 3).join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Joint-Friendly Exercise Explanations & Substitutions */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <h2 className="text-base font-black text-foreground">
                {isAr ? '2. بدائل حماية الركبة وأسفل الظهر (وزن 101.1 كجم)' : '2. Knee & Lower-Back Safe Substitutions'}
              </h2>
              <div className="divide-y divide-border/70 text-xs">
                {[
                  {
                    avoidAr: 'سكوات بار ثقيل على الظهر',
                    avoidEn: 'Heavy Barbell Back Squat',
                    useAr: 'دفع أرجل مسنود الظهر (Leg Press) أو جوبلت سكوات متحكم فيه',
                    useEn: 'Back-Supported Leg Press or Controlled Goblet Squat',
                  },
                  {
                    avoidAr: 'تجديف بار منحني حر ثقيل',
                    avoidEn: 'Heavy Free Barbell Bent Row',
                    useAr: 'تجديف كابل جالس أو تجديف دمبل مسنود الصدر',
                    useEn: 'Seated Cable Row or Chest-Supported DB Row',
                  },
                  {
                    avoidAr: 'جري أو نط حبل أو HIIT قفز',
                    avoidEn: 'Running, Jumping, or High-Impact HIIT',
                    useAr: 'دراجة ثابتة (Stationary Bike) أو مشي سير مستوي/مائل خفيف',
                    useEn: 'Stationary Bike or Flat/Gentle Incline Treadmill Walk',
                  },
                ].map((row) => (
                  <div key={row.avoidEn} className="py-2.5 space-y-1">
                    <div className="text-muted-foreground">
                      {isAr ? 'بدلاً من: ' : 'Swap out: '} <span className="line-through">{isAr ? row.avoidAr : row.avoidEn}</span>
                    </div>
                    <div className="font-bold text-emerald-400">
                      {isAr ? 'استخدم: ' : 'Use: '} {isAr ? row.useAr : row.useEn}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progression Rules + Morning Consistency System */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <h2 className="text-base font-black text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{isAr ? '3. قواعد التقدم وبروتوكول الفجر (7:30–8:00 ص)' : '3. Progression & Post-Fajr Habit Rules'}</span>
              </h2>
              <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">{isAr ? 'قاعدة التدرج المزدوج: ' : 'Double Progression: '}</strong>
                    {isAr
                      ? 'عند إتمام أعلى عدات مطلوبة (مثلاً 12 عدة) في كل المجموعات بجهد RPE ≤ 8.5 بدون ألم، زد الوزن +2.5 كجم المرة القادمة.'
                      : 'Once you hit the top of the rep range (e.g. 12 reps) across all sets at RPE ≤ 8.5 pain-free, add +2.5 kg next session.'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">{isAr ? 'نافذة الصباح الذهبية (7:30–8:00 ص): ' : 'Morning Window (7:30–8:00 AM): '}</strong>
                    {isAr
                      ? 'في أيام قلة الحماس التزم بقاعدة الـ 10 دقائق فقط أو اختر المستوى السهل (Easy). الاستمرار أهم من الثقل.'
                      : 'On low-motivation mornings, apply the 10-Minute Rule or pick the Easy difficulty tier. Showing up beats skipping.'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">{isAr ? 'حدود تنبيهات المتصفح (PWA): ' : 'Web / PWA Notification Note: '}</strong>
                    {isAr
                      ? 'التنبيهات تعمل داخل تطبيق الويب وعبر إشعارات المتصفح عند السماح بها؛ لأن هذا تطبيق ويب (PWA) فجدولة الخلفية المضمونة تماماً تتطلب منبه الهاتف الأساسي.'
                      : 'Reminders run while the web app is open and via browser notifications if permitted; as a web PWA, guaranteed OS wake alarms still rely on your phone alarm.'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Cardio & Fat-Loss Nutrition Strategy */}
      {activeTab === 'cardio_nutrition' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-primary font-black text-base">
              <HeartPulse className="h-5 w-5" />
              <h2>{isAr ? 'استراتيجية الكارديو المخصصة (دراجة ثابتة ومشي فقط)' : 'Low-Impact Cardio Strategy (Bike & Treadmill Walk Only)'}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="border-s-2 border-primary ps-3 space-y-1">
                <div className="font-bold text-foreground">{isAr ? 'الأجهزة المعتمدة في الجيم' : 'Approved Gym Machines'}</div>
                <p className="text-muted-foreground">
                  {isAr ? 'الدراجة الثابتة (أولوية عند إجهاد الركبة) والمشاية الكهربائية مشياً فقط (سرعة 4.2–5.0 كم/س وميل 4–8%).' : 'Stationary Bike (top choice for knee comfort) and Treadmill Walking (4.2–5.0 km/h, 4–8% incline).'}
                </p>
              </div>
              <div className="border-s-2 border-emerald-500 ps-3 space-y-1">
                <div className="font-bold text-foreground">{isAr ? 'المدة، الشدة، والتكرار' : 'Duration, Intensity & Frequency'}</div>
                <p className="text-muted-foreground">
                  {isAr ? '20–30 دقيقة بعد التمرين أو 30 د صباحاً في أيام الراحة • 3–5 مرات أسبوعياً في Zone 2.' : '20–30 min post-lifting or 30m on rest days • 3–5x/week at conversational Zone 2 (60–70% HR).'}
                </p>
              </div>
              <div className="border-s-2 border-amber-500 ps-3 space-y-1">
                <div className="font-bold text-foreground">{isAr ? 'التدرج الآمن' : 'Weekly Progression'}</div>
                <p className="text-muted-foreground">
                  {isAr ? 'ابدأ بـ 20 دقيقة وزد 5 دقائق كل أسبوعين حتى 35 دقيقة قبل رفع المقاومة أو الميل. بدون جري أو قفز.' : 'Start at 20 min and add +5 min every 2 weeks up to 35 min before raising resistance. Zero jumping/running.'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-black text-foreground">
                {isAr ? 'أهداف التغذية اليومية واستراتيجية خسارة الدهون' : 'Nutrition Targets & Weight-Loss Strategy'}
              </h2>
              {onNavigateToMeals && (
                <button
                  type="button"
                  onClick={onNavigateToMeals}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                >
                  {isAr ? 'فتح صفحة الوجبات اليومية' : 'Open Daily Meal Plan'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono tabular-nums text-xs border-y border-border py-3">
              <div>
                <div className="font-sans text-muted-foreground">{isAr ? 'السعرات المستهدفة' : 'Calories'}</div>
                <div className="text-base font-black text-foreground">{profile.dailyCalorieTarget || 1900} kcal</div>
              </div>
              <div>
                <div className="font-sans text-muted-foreground">{isAr ? 'البروتين' : 'Protein'}</div>
                <div className="text-base font-black text-primary">{profile.dailyProteinTargetGrams || 170} g</div>
              </div>
              <div>
                <div className="font-sans text-muted-foreground">{isAr ? 'الكربوهيدرات' : 'Carbs'}</div>
                <div className="text-base font-black text-foreground">{profile.dailyCarbsTargetGrams || 175} g</div>
              </div>
              <div>
                <div className="font-sans text-muted-foreground">{isAr ? 'الدهون الصحية' : 'Fat'}</div>
                <div className="text-base font-black text-foreground">{profile.dailyFatTargetGrams || 54} g</div>
              </div>
              <div>
                <div className="font-sans text-muted-foreground">{isAr ? 'الألياف والماء' : 'Fiber & Water'}</div>
                <div className="text-base font-black text-emerald-400">{profile.dailyFiberTargetGrams || 32}g · 3.5L</div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {isAr
                ? 'مع معدل حرق أساسي ~1,951 سعرة ووزن 101.1 كجم، استهلاك 1,850–1,950 سعرة مع 170 جم بروتين و32 جم ألياف يحقق نزولاً صحياً بمعدل 0.5–0.9 كجم أسبوعياً مع حماية الكتلة العضلية (34.3 كجم عضل هيكلي) وتقليل دهون البطن الحشوية.'
                : 'With BMR ~1,951 kcal at 101.1 kg, eating 1,850–1,950 kcal with 170g protein and 32g fiber creates a sustainable 0.5–0.9 kg/week fat loss while preserving 34.3 kg skeletal muscle and reducing visceral fat.'}
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: Weights, Sides & RPE Calculator */}
      {activeTab === 'weights_rpe' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <h2 className="text-base font-black text-foreground">
                {isAr ? '1. حساب أوزان الدامبلز والبار (يمين وشمال)' : '1. Dumbbell & Barbell Weight Guide'}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isAr
                  ? 'أثناء التمرين يمكنك التبديل بين وضع "إجمالي" و"لكل جانب". في الدمبل (7.5 كجم لكل يد = 15 كجم إجمالي). في البار: الإجمالي = وزن البار (20 كجم) + الطارات على الجانبين.'
                  : 'Switch between "Total" and "Per Side" inside any workout. For dumbbells, 7.5 kg/hand = 15 kg Total. For barbells, Total = Bar (20 kg) + plates on both sleeves.'}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <h2 className="text-base font-black text-foreground flex items-center gap-2">
                <Gauge className="h-4 w-4 text-primary" />
                <span>{isAr ? '2. مقياس الجهد (RPE)' : '2. RPE Effort Scale'}</span>
              </h2>
              <div className="space-y-1.5 text-xs font-mono tabular-nums">
                <div className="flex justify-between"><span className="text-sky-400 font-bold">RPE 6–7</span><span>{isAr ? 'سهل (متبقي 3-4 عدات) — زد +2.5 كجم' : 'Easy (3-4 RIR) — Add +2.5 kg'}</span></div>
                <div className="flex justify-between"><span className="text-emerald-400 font-bold">RPE 7.5–8.5</span><span>{isAr ? 'مثالي لحرق الدهون وبناء العضل' : 'Optimal Zone (1.5-2 RIR)'}</span></div>
                <div className="flex justify-between"><span className="text-amber-400 font-bold">RPE 9–10</span><span>{isAr ? 'أقصى جهد — ثبّت أو خفف لحماية المفاصل' : 'Max effort — Hold or deload for joints'}</span></div>
              </div>
            </div>
          </div>

          {/* Interactive Simple Weight & Plate Calculator */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <h3 className="text-sm sm:text-base font-black text-foreground">
                  {isAr ? 'حاسبة تقسيم الوزن (يمين وشمال + الطارات)' : 'Quick Weight & Plate Split Calculator'}
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => { setCalcMode('dumbbell'); setSampleTotalKg(15); }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                    calcMode === 'dumbbell' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary/40 text-muted-foreground'
                  }`}
                >
                  {isAr ? 'دمبل (يمين + شمال)' : 'Dumbbells'}
                </button>
                <button
                  type="button"
                  onClick={() => { setCalcMode('barbell'); setSampleTotalKg(60); }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                    calcMode === 'barbell' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary/40 text-muted-foreground'
                  }`}
                >
                  {isAr ? 'بار وطارات' : 'Barbell Plates'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                  {isAr ? 'الوزن الإجمالي (كجم)' : 'Total Weight (kg)'}
                </label>
                <input
                  type="number"
                  min={0}
                  step={2.5}
                  value={sampleTotalKg}
                  onChange={(e) => setSampleTotalKg(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold font-mono tabular-nums text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {calcMode === 'barbell' && (
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                    {isAr ? 'وزن البار' : 'Bar Weight'}
                  </label>
                  <select
                    value={barWeight}
                    onChange={(e) => setBarWeight(parseFloat(e.target.value))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value={20}>{isAr ? 'بار أولمبي (20 كجم)' : 'Olympic Bar (20 kg)'}</option>
                    <option value={15}>{isAr ? 'بار متوسط (15 كجم)' : '15 kg Bar'}</option>
                    <option value={10}>{isAr ? 'بار زجزاج EZ (10 كجم)' : 'EZ-Bar (10 kg)'}</option>
                    <option value={0}>{isAr ? 'بدون بار (0 كجم)' : 'No Bar (0 kg)'}</option>
                  </select>
                </div>
              )}

              <div className={`rounded-xl border border-primary/30 bg-primary/10 p-3 font-mono tabular-nums ${calcMode === 'dumbbell' ? 'sm:col-span-2' : ''}`}>
                {calcMode === 'dumbbell' ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                    <span className="text-muted-foreground font-sans">{isAr ? 'في كل يد:' : 'Each Hand:'}</span>
                    <span className="font-black text-primary">
                      {perSideDumbbell} kg {isAr ? 'يمين' : 'R'} + {perSideDumbbell} kg {isAr ? 'شمال' : 'L'} = {sampleTotalKg} kg
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-sans">{isAr ? 'على كل جانب من البار:' : 'Per Side on Bar:'}</span>
                      <span className="font-black text-primary">{barbellBreakdown.perSide} kg</span>
                    </div>
                    <div className="text-foreground font-bold">
                      {barbellBreakdown.plates.length > 0
                        ? barbellBreakdown.plates.map((p) => `${p.w}kg × ${p.count}`).join(' + ')
                        : isAr ? 'البار فارغ فقط' : 'Empty Bar Only'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Recovery, Progress Guide, Long-Term Goals & Safety Notes */}
      {activeTab === 'goals_safety' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Long-Term Milestones */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <h2 className="text-base font-black text-foreground">
                {isAr ? '1. الأهداف طويلة المدى ومنهجية القياس' : '1. Long-Term Milestones & Measurement Guide'}
              </h2>
              <div className="divide-y divide-border/70 text-xs">
                <div className="py-2 flex justify-between font-mono tabular-nums">
                  <span className="font-sans text-muted-foreground">{isAr ? 'الوزن المرجعي الحالي (BIA):' : 'Current Baseline (BIA):'}</span>
                  <span className="font-black text-foreground">101.1 kg · 32.5% Fat</span>
                </div>
                <div className="py-2 flex justify-between font-mono tabular-nums">
                  <span className="font-sans text-muted-foreground">{isAr ? 'المرحلة 1 (12–16 أسبوع):' : 'Phase 1 (12–16 wks):'}</span>
                  <span className="font-black text-primary">92.0 kg (-9 kg)</span>
                </div>
                <div className="py-2 flex justify-between font-mono tabular-nums">
                  <span className="font-sans text-muted-foreground">{isAr ? 'المرحلة 2 (هدف التطبيق):' : 'Phase 2 Target:'}</span>
                  <span className="font-black text-emerald-400">80.0 kg (-21.1 kg)</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isAr
                  ? 'قِس الوزن صباحاً بعد الحمام وقبل الأكل 3–4 مرات أسبوعياً، واعتمد على متوسط 7 أيام ومحيط الخصر عند السرة. قياسات جهاز الـ BIA مؤشرات اتجاهية فقط وليست تشخيصاً طبياً.'
                  : 'Weigh fasted in the morning 3–4x/week and track the 7-day rolling average plus waist at navel. BIA scale readings are trends/indicators only, not medical diagnostics.'}
              </p>
            </div>

            {/* Medical & Joint Safety Notes */}
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 space-y-3">
              <h2 className="text-base font-black text-foreground flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-400" />
                <span>{isAr ? '2. ملاحظات السلامة الطبية والمفاصل' : '2. Medical & Joint Safety Notes'}</span>
              </h2>
              <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                <li>
                  • <strong className="text-foreground">{isAr ? 'استشارة طبية: ' : 'Medical Clearance: '}</strong>
                  {isAr
                    ? 'في حال وجود أمراض مزمنة، ضغط، سكر، أو إصابات سابقة، راجع طبيبك قبل تعديل النظام الرياضي أو الغذائي.'
                    : 'Consult a qualified physician before starting intense exercise or dietary changes if you have existing conditions.'}
                </li>
                <li>
                  • <strong className="text-foreground">{isAr ? 'حدود التطبيق: ' : 'App Scope: '}</strong>
                  {isAr
                    ? 'هذا التطبيق مساعد للياقة والتنظيم ولا يشخّص أمراضاً ولا يغير أو يصف أي أدوية.'
                    : 'This application supports fitness planning only—it never diagnoses medical conditions or adjusts medications.'}
                </li>
                <li>
                  • <strong className="text-foreground">{isAr ? 'إشارة التوقف الفوري: ' : 'Pain Stop Rule: '}</strong>
                  {isAr
                    ? 'توقف فوراً عن أي تمرين يسبب ألماً حاداً في الركبة أو أسفل الظهر، واستخدم زر "تبديل" أو دراجة ثابتة بدون مقاومة عالية.'
                    : 'Stop any exercise immediately if you feel sharp knee or lower-back pain. Swap to a joint-safe alternative or rest.'}
                </li>
                <li>
                  • <strong className="text-foreground">{isAr ? 'الاستشفاء والنوم: ' : 'Recovery & Sleep: '}</strong>
                  {isAr
                    ? 'استهدف 7–8 ساعات نوم للحفاظ على هرمونات الشبع وقوة التمرين الصباحي.'
                    : 'Aim for 7–8 hours of sleep to support morning energy, muscle retention, and appetite control.'}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
