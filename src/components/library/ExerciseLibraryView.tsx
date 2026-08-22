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
  Info
} from 'lucide-react';
import { Exercise, UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { exerciseSeedData } from '../../data/exerciseSeed';

interface ExerciseLibraryViewProps {
  profile: UserProfile;
  onSelectExercise: (exercise: Exercise) => void;
}

export const ExerciseLibraryView: React.FC<ExerciseLibraryViewProps> = ({
  profile,
  onSelectExercise,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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

  const filteredExercises = useMemo(() => {
    return exerciseSeedData.filter(ex => {
      // Search query (matches English or Arabic names/muscles)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = ex.name.toLowerCase().includes(q) || (ex.nameAr && ex.nameAr.includes(q));
        const matchMuscle = ex.primaryMuscle.toLowerCase().includes(q) || (ex.primaryMuscleAr && ex.primaryMuscleAr.includes(q));
        const matchEq = ex.equipment.toLowerCase().includes(q);
        if (!matchName && !matchMuscle && !matchEq) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && ex.category !== selectedCategory) return false;

      // Equipment filter
      if (selectedEquipment !== 'all' && ex.equipment !== selectedEquipment) return false;

      // Difficulty filter
      if (selectedDifficulty !== 'all' && ex.difficulty !== selectedDifficulty) return false;

      // Back Safe filter
      if (backSafeOnly && !ex.tags.includes('back_safe')) return false;

      return true;
    });
  }, [searchQuery, selectedCategory, selectedEquipment, selectedDifficulty, backSafeOnly]);

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
      <div className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-sm">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isAr ? 'right-3.5' : 'left-3.5'}`} />
          <input
            id="input-search-exercise-library"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.library.searchPlaceholder}
            className={`w-full rounded-xl border border-border bg-background py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none ${
              isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'
            }`}
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
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

        {/* Secondary Filters: Equipment, Difficulty, Back-Safe Toggle */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
          {/* Equipment Selector */}
          <select
            id="select-filter-equipment"
            value={selectedEquipment}
            onChange={e => setSelectedEquipment(e.target.value)}
            className="rounded-lg border border-border bg-secondary/70 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
          >
            <option value="all">{isAr ? 'كل الأدوات' : 'All Equipment'}</option>
            <option value="Barbell">Barbell</option>
            <option value="Dumbbells">Dumbbells</option>
            <option value="Cables">Cables</option>
            <option value="Machine">Machine</option>
            <option value="Bodyweight">Bodyweight</option>
          </select>

          {/* Difficulty Selector */}
          <select
            id="select-filter-difficulty"
            value={selectedDifficulty}
            onChange={e => setSelectedDifficulty(e.target.value)}
            className="rounded-lg border border-border bg-secondary/70 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
          >
            <option value="all">{isAr ? 'كل المستويات' : 'All Levels'}</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

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
        </div>
      </div>

      {/* Exercises Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredExercises.map(ex => {
          const title = isAr && ex.nameAr ? ex.nameAr : ex.name;
          const muscle = isAr && ex.primaryMuscleAr ? ex.primaryMuscleAr : ex.primaryMuscle;

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
                    <span className="rounded bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] font-bold text-white border border-white/20">
                      {ex.equipment}
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
                    <span className="rounded bg-secondary px-2 py-0.5 font-medium">{muscle}</span>
                    <span className="rounded bg-secondary px-2 py-0.5 font-medium">{ex.difficulty}</span>
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
    </div>
  );
};
