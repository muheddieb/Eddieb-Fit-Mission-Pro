import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Dumbbell, 
  Play, 
  ShieldCheck, 
  Check, 
  Layers,
  ChevronRight,
  Info,
  X,
  RotateCcw,
  Target,
  Sparkles
} from 'lucide-react';
import { Exercise, UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { exerciseSeedData } from '../../data/exerciseSeed';

interface ExerciseLibraryViewProps {
  profile: UserProfile;
  onSelectExercise: (exercise: Exercise) => void;
}

// Arabic normalization helper for resilient search matching (e.g. أ/إ/آ -> ا, ة -> ه)
function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '');
}

export const ExerciseLibraryView: React.FC<ExerciseLibraryViewProps> = ({
  profile,
  onSelectExercise,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [backSafeOnly, setBackSafeOnly] = useState<boolean>(false);

  const categories = [
    { id: 'all', label: isAr ? 'الكل' : 'All Categories' },
    { id: 'push', label: isAr ? 'دفع (صدر/كتف/تراي)' : 'Push (Chest/Delts/Triceps)' },
    { id: 'pull', label: isAr ? 'سحب (ظهر/بايسبس)' : 'Pull (Back/Biceps)' },
    { id: 'legs', label: isAr ? 'أرجل (فخذ/سمانة)' : 'Legs (Quads/Hams/Calves)' },
    { id: 'core', label: isAr ? 'كور وبطن' : 'Core & Abs' },
    { id: 'recovery', label: isAr ? 'استشفاء وإطالات' : 'Recovery & Stretches' },
  ];

  const muscleFilterOptions = [
    { id: 'all', labelEn: 'All Muscle Groups', labelAr: 'كل المجموعات العضلية' },
    { id: 'chest', labelEn: 'Chest / Pectorals', labelAr: 'الصدر' },
    { id: 'back', labelEn: 'Back & Lats', labelAr: 'الظهر والمجنص' },
    { id: 'shoulders', labelEn: 'Shoulders & Delts', labelAr: 'الأكتاف' },
    { id: 'arms', labelEn: 'Arms (Biceps & Triceps)', labelAr: 'الذراعين (باي وتراي)' },
    { id: 'legs', labelEn: 'Legs (Quads, Hams, Glutes)', labelAr: 'الأرجل والمقعدة' },
    { id: 'calves', labelEn: 'Calves', labelAr: 'السمانة' },
    { id: 'core', labelEn: 'Core & Abs', labelAr: 'البطن والكور' },
  ];

  const equipmentOptions = [
    { id: 'all', labelEn: 'All Equipment', labelAr: 'كل الأدوات والأجهزة' },
    { id: 'Dumbbells', labelEn: 'Dumbbells', labelAr: 'الدمبلز (Dumbbells)' },
    { id: 'Barbell', labelEn: 'Barbell', labelAr: 'البار (Barbell)' },
    { id: 'Cable', labelEn: 'Cable Station', labelAr: 'الكابل (Cables)' },
    { id: 'Machine', labelEn: 'Machines', labelAr: 'الأجهزة (Machine)' },
    { id: 'Bodyweight', labelEn: 'Bodyweight', labelAr: 'وزن الجسم (Bodyweight)' },
  ];

  // Quick suggestion filter tags to quickly search or filter
  const quickSearchTags = [
    { labelEn: 'Chest', labelAr: 'صدر', type: 'muscle', value: 'chest' },
    { labelEn: 'Back', labelAr: 'ظهر', type: 'muscle', value: 'back' },
    { labelEn: 'Shoulders', labelAr: 'أكتاف', type: 'muscle', value: 'shoulders' },
    { labelEn: 'Legs', labelAr: 'أرجل', type: 'muscle', value: 'legs' },
    { labelEn: 'Arms', labelAr: 'ذراعين', type: 'muscle', value: 'arms' },
    { labelEn: 'Dumbbells', labelAr: 'دمبل', type: 'equipment', value: 'Dumbbells' },
    { labelEn: 'Barbell', labelAr: 'بار', type: 'equipment', value: 'Barbell' },
    { labelEn: 'Cables', labelAr: 'كابل', type: 'equipment', value: 'Cable' },
    { labelEn: 'Bodyweight', labelAr: 'وزن جسم', type: 'equipment', value: 'Bodyweight' },
  ];

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedMuscle('all');
    setSelectedEquipment('all');
    setSelectedDifficulty('all');
    setBackSafeOnly(false);
  };

  const hasActiveFilters = 
    searchQuery.trim() !== '' || 
    selectedCategory !== 'all' || 
    selectedMuscle !== 'all' || 
    selectedEquipment !== 'all' || 
    selectedDifficulty !== 'all' || 
    backSafeOnly;

  // Filter exercises with multi-criteria search
  const filteredExercises = useMemo(() => {
    return exerciseSeedData.filter(ex => {
      // 1. Multi-token Search Bar Query: matches name, muscle group, or equipment type
      if (searchQuery.trim()) {
        const queryTokens = normalizeArabic(searchQuery.trim()).split(/\s+/);

        // Build comprehensive searchable corpus for the exercise
        const corpus = normalizeArabic([
          ex.name,
          ex.nameAr || '',
          ex.primaryMuscle,
          ex.primaryMuscleAr || '',
          ...(ex.secondaryMuscles || []),
          ...(ex.secondaryMusclesAr || []),
          ex.equipment,
          ex.equipmentAr || '',
          ex.category,
          ex.movementPattern || '',
          ex.exerciseType || '',
          ...(ex.tags || []),
          // Aliases for muscle groups
          ex.primaryMuscle.toLowerCase().includes('chest') || ex.name.toLowerCase().includes('bench') ? 'chest pecs صدر بنش' : '',
          ex.primaryMuscle.toLowerCase().includes('lat') || ex.primaryMuscle.toLowerCase().includes('back') ? 'back lats ظهر مجنص سحب' : '',
          ex.primaryMuscle.toLowerCase().includes('delt') ? 'shoulder shoulders delts اكتاف كتف' : '',
          ex.primaryMuscle.toLowerCase().includes('bicep') ? 'biceps bicep arms ذراع باي بايسبس' : '',
          ex.primaryMuscle.toLowerCase().includes('tricep') ? 'triceps tricep arms ذراع تراي ترايسبس' : '',
          ex.primaryMuscle.toLowerCase().includes('quad') || ex.primaryMuscle.toLowerCase().includes('hamstring') || ex.primaryMuscle.toLowerCase().includes('glute') || ex.primaryMuscle.toLowerCase().includes('calf') ? 'legs leg quads ارجل رجل فخذ سمانه مقعده' : '',
          ex.primaryMuscle.toLowerCase().includes('core') || ex.primaryMuscle.toLowerCase().includes('abdominal') ? 'abs core بطن كور معده' : '',
          // Aliases for equipment
          ex.equipment.toLowerCase().includes('dumbbell') ? 'dumbbell dumbbells دمبل دمبلز' : '',
          ex.equipment.toLowerCase().includes('barbell') ? 'barbell بار' : '',
          ex.equipment.toLowerCase().includes('cable') ? 'cable cables كابل كيبل' : '',
          ex.equipment.toLowerCase().includes('machine') ? 'machine جهاز ماكينه' : '',
          ex.equipment.toLowerCase().includes('bodyweight') ? 'bodyweight وزن الجسم كاليسثنكس' : '',
        ].join(' '));

        // Every token must match in the exercise corpus
        const allTokensMatch = queryTokens.every(token => corpus.includes(token));
        if (!allTokensMatch) return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'all' && ex.category !== selectedCategory) return false;

      // 3. Target Muscle Group dropdown filter
      if (selectedMuscle !== 'all') {
        const muscleLower = (ex.primaryMuscle + ' ' + (ex.secondaryMuscles || []).join(' ')).toLowerCase();
        switch (selectedMuscle) {
          case 'chest':
            if (!muscleLower.includes('chest') && !muscleLower.includes('pectoral')) return false;
            break;
          case 'back':
            if (!muscleLower.includes('back') && !muscleLower.includes('lat') && !muscleLower.includes('rhomboid') && !muscleLower.includes('erector')) return false;
            break;
          case 'shoulders':
            if (!muscleLower.includes('delt') && !muscleLower.includes('shoulder')) return false;
            break;
          case 'arms':
            if (!muscleLower.includes('bicep') && !muscleLower.includes('tricep') && !muscleLower.includes('brachialis')) return false;
            break;
          case 'legs':
            if (!muscleLower.includes('quad') && !muscleLower.includes('hamstring') && !muscleLower.includes('glute')) return false;
            break;
          case 'calves':
            if (!muscleLower.includes('calf') && !muscleLower.includes('calves') && !muscleLower.includes('soleus')) return false;
            break;
          case 'core':
            if (!muscleLower.includes('core') && !muscleLower.includes('abdominal') && !muscleLower.includes('oblique')) return false;
            break;
          default:
            break;
        }
      }

      // 4. Equipment filter (supports substrings like 'Barbell', 'Dumbbells', 'Cable', 'Machine', 'Bodyweight')
      if (selectedEquipment !== 'all') {
        const eqLower = ex.equipment.toLowerCase();
        const targetEq = selectedEquipment.toLowerCase();
        if (!eqLower.includes(targetEq)) return false;
      }

      // 5. Difficulty filter
      if (selectedDifficulty !== 'all' && ex.difficulty !== selectedDifficulty) return false;

      // 6. Back Safe filter
      if (backSafeOnly && !ex.tags.includes('back_safe')) return false;

      return true;
    });
  }, [searchQuery, selectedCategory, selectedMuscle, selectedEquipment, selectedDifficulty, backSafeOnly]);

  return (
    <div className="space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">
            {t.library.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.library.subtitle} ({filteredExercises.length} {isAr ? 'تمرين متاح' : 'exercises'})
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-sm">
        {/* Prominent Search Bar */}
        <div className="space-y-2">
          <div className="relative flex items-center">
            <Search className={`absolute h-4 w-4 text-muted-foreground pointer-events-none ${isAr ? 'right-3.5' : 'left-3.5'}`} />
            <input
              id="input-search-exercise-library"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                isAr 
                  ? 'ابحث باسم التمرين، العضلة، أو نوع الأداة (مثال: بنش، دمبل، صدر، كابل، أرجل)...' 
                  : 'Search by exercise name, muscle group, or equipment type (e.g. Bench, Dumbbell, Chest, Cable)...'
              }
              className={`w-full rounded-xl border border-border bg-background py-3 text-sm text-foreground placeholder:text-muted-foreground/80 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-inner ${
                isAr ? 'pr-10 pl-24' : 'pl-10 pr-24'
              }`}
            />
            {/* Search Bar Right Controls: Counter & Clear Button */}
            <div className={`absolute flex items-center gap-1.5 ${isAr ? 'left-2.5' : 'right-2.5'}`}>
              {searchQuery && (
                <button
                  id="btn-clear-search-library"
                  onClick={() => setSearchQuery('')}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  title={isAr ? 'مسح البحث' : 'Clear search'}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <span className="rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] font-mono font-bold text-muted-foreground border border-border/50 whitespace-nowrap">
                {filteredExercises.length} {isAr ? 'نتيجة' : 'results'}
              </span>
            </div>
          </div>

          {/* Quick Search Suggestion Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 custom-scrollbar text-xs">
            <span className="text-[11px] font-bold text-muted-foreground shrink-0 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>{isAr ? 'بحث سريع:' : 'Quick Filter:'}</span>
            </span>
            {quickSearchTags.map((tag, idx) => {
              const isActive = 
                (tag.type === 'muscle' && selectedMuscle === tag.value) ||
                (tag.type === 'equipment' && selectedEquipment === tag.value);

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (tag.type === 'muscle') {
                      setSelectedMuscle(selectedMuscle === tag.value ? 'all' : tag.value);
                    } else if (tag.type === 'equipment') {
                      setSelectedEquipment(selectedEquipment === tag.value ? 'all' : tag.value);
                    }
                  }}
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all border ${
                    isActive
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border/60 bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {isAr ? tag.labelAr : tag.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter Horizontal Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar pt-1 border-t border-border/60">
          {categories.map(cat => (
            <button
              key={cat.id}
              id={`filter-cat-${cat.id}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Secondary Filter Controls: Muscle Group, Equipment, Difficulty, Back-Safe */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border">
          {/* Target Muscle Group Dropdown */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="select-filter-muscle" className="text-xs font-bold text-muted-foreground shrink-0">
              {isAr ? 'العضلة:' : 'Muscle:'}
            </label>
            <select
              id="select-filter-muscle"
              value={selectedMuscle}
              onChange={e => setSelectedMuscle(e.target.value)}
              className="rounded-lg border border-border bg-secondary/70 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
            >
              {muscleFilterOptions.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {isAr ? opt.labelAr : opt.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Equipment Selector */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="select-filter-equipment" className="text-xs font-bold text-muted-foreground shrink-0">
              {isAr ? 'الأداة:' : 'Equipment:'}
            </label>
            <select
              id="select-filter-equipment"
              value={selectedEquipment}
              onChange={e => setSelectedEquipment(e.target.value)}
              className="rounded-lg border border-border bg-secondary/70 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
            >
              {equipmentOptions.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {isAr ? opt.labelAr : opt.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Selector */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="select-filter-difficulty" className="text-xs font-bold text-muted-foreground shrink-0">
              {isAr ? 'المستوى:' : 'Level:'}
            </label>
            <select
              id="select-filter-difficulty"
              value={selectedDifficulty}
              onChange={e => setSelectedDifficulty(e.target.value)}
              className="rounded-lg border border-border bg-secondary/70 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">{isAr ? 'كل المستويات' : 'All Levels'}</option>
              <option value="beginner">{isAr ? 'مبتدئ (Beginner)' : 'Beginner'}</option>
              <option value="intermediate">{isAr ? 'متوسط (Intermediate)' : 'Intermediate'}</option>
              <option value="advanced">{isAr ? 'متقدم (Advanced)' : 'Advanced'}</option>
            </select>
          </div>

          {/* Back Safe Toggle */}
          <button
            id="btn-toggle-back-safe"
            onClick={() => setBackSafeOnly(!backSafeOnly)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
              backSafeOnly
                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                : 'border-border bg-secondary/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{t.library.backSafeOnly}</span>
          </button>

          {/* Reset Filters Button if any filter is active */}
          {hasActiveFilters && (
            <button
              id="btn-reset-library-filters"
              onClick={handleResetFilters}
              className="flex items-center gap-1 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title={isAr ? 'إعادة ضبط كافة الفلاتر' : 'Reset all filters'}
            >
              <RotateCcw className="h-3 w-3" />
              <span>{isAr ? 'مسح الفلاتر' : 'Reset Filters'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Exercises Grid or Empty State */}
      {filteredExercises.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 sm:p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/60 text-muted-foreground border border-border">
            <Search className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-foreground">
              {isAr ? 'لم يتم العثور على تمارين مطابقة' : 'No exercises found'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {searchQuery.trim() ? (
                isAr ? (
                  <>لم نجد تمارين تطابق البحث &quot;<span className="text-foreground font-semibold">{searchQuery}</span>&quot;. جرب البحث باسم تمرين آخر، أو اختيار عضلة أو نوع أداة مختلف.</>
                ) : (
                  <>No exercises match &quot;<span className="text-foreground font-semibold">{searchQuery}</span>&quot;. Try searching for another exercise name, muscle group, or equipment type.</>
                )
              ) : (
                isAr
                  ? 'لا توجد تمارين تطابق مجموعة الفلاتر المحددة حالياً. جرب توسيع الفلاتر.'
                  : 'No exercises match the currently active filter combination. Try resetting your filters.'
              )}
            </p>
          </div>
          <button
            id="btn-empty-state-reset"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-transform active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{isAr ? 'إعادة ضبط البحث والفلاتر' : 'Reset Search & Filters'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredExercises.map(ex => {
            const title = isAr && ex.nameAr ? ex.nameAr : ex.name;
            const muscle = isAr && ex.primaryMuscleAr ? ex.primaryMuscleAr : ex.primaryMuscle;
            const eqLabel = isAr && ex.equipmentAr ? ex.equipmentAr : ex.equipment;

            return (
              <div
                key={ex.id}
                onClick={() => onSelectExercise(ex)}
                className="group cursor-pointer rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Exercise Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={ex.imageUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80'}
                      alt={title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 justify-between">
                      <span className="rounded bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] font-bold text-white border border-white/20 truncate max-w-[65%]">
                        {eqLabel}
                      </span>
                      <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                        {ex.targetRepRange}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                        {title}
                      </h3>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="rounded bg-secondary px-2 py-0.5 font-medium text-foreground">{muscle}</span>
                      <span className="rounded bg-secondary/80 px-2 py-0.5 font-medium">{ex.difficulty}</span>
                      {ex.tags.includes('back_safe') && (
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          {isAr ? 'آمن للظهر' : 'Back Safe'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action footer */}
                <div className="border-t border-border p-3 bg-secondary/20 flex items-center justify-between text-xs font-bold text-primary">
                  <span>{t.common.viewDetails}</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

