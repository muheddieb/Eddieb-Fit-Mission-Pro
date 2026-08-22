import React from 'react';
import { 
  Home, 
  Dumbbell, 
  Zap, 
  ShieldCheck, 
  Play, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Exercise, UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { exerciseSeedData } from '../../data/exerciseSeed';

interface HomeWorkoutsViewProps {
  profile: UserProfile;
  onSelectExercise: (exercise: Exercise) => void;
  onStartHomeWorkout: () => void;
}

export const HomeWorkoutsView: React.FC<HomeWorkoutsViewProps> = ({
  profile,
  onSelectExercise,
  onStartHomeWorkout,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const homeExercises = exerciseSeedData.filter(
    e => e.equipment === 'Bodyweight' || e.equipment === 'Dumbbells' || e.tags.includes('home_friendly')
  );

  return (
    <div className="space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header & Quick Action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">
            {t.home.title}
          </h1>
          <p className="text-sm text-muted-foreground">{t.home.subtitle}</p>
        </div>

        <button
          id="btn-start-home-routine"
          onClick={onStartHomeWorkout}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>{isAr ? 'بدء روتين منزلي كامل' : 'Start Full Home Routine'}</span>
        </button>
      </div>

      {/* Directives Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Zap className="h-4 w-4" />
            <span>{isAr ? 'التحكم في زمن الحركة (Tempo)' : 'Eccentric Tempo Control'}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isAr 
              ? 'مع الأوزان الخفيفة أو وزن الجسم، ركز على النزول البطيء (3-4 ثوانٍ) لزيادة التوتر الميكانيكي على الألياف العضلية.'
              : 'Maximize mechanical tension with minimal weight by slowing eccentric descent to 3-4 seconds per rep.'}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <span>{isAr ? 'حماية المفاصل وأسفل الظهر' : 'Joint & Spinal Longevity'}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isAr
              ? 'استخدم تمارين مثل Dead Bug و Bird Dog و Pushups مع تفعيل قوي للكور وتفادي تقويس الظهر.'
              : 'Maintain strict neutral spine with anti-extension core bracing across all bodyweight movements.'}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <Sparkles className="h-4 w-4" />
            <span>{isAr ? 'مقياس RPE المنزلي' : 'Home RPE Calibration'}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isAr
              ? 'تمرن حتى يتبقى لك 1 إلى 2 تكرار قبل الفشل العضلي (RPE 8-9) لتحفيز البناء العضلي بدون أوزان ثقيلة.'
              : 'Push bodyweight sets to 1-2 reps shy of technical failure (RPE 8.5) to trigger muscle hypertrophy.'}
          </p>
        </div>
      </div>

      {/* Home Movements Catalog */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">
          {isAr ? 'تمارين المنزل ووزن الجسم المتاحة' : 'Calisthenics & Home Equipment Library'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {homeExercises.map(ex => {
            const title = isAr && ex.nameAr ? ex.nameAr : ex.name;

            return (
              <div
                key={ex.id}
                onClick={() => onSelectExercise(ex)}
                className="group cursor-pointer rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {ex.equipment}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {ex.targetRepRange} reps
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {isAr && ex.descriptionAr ? ex.descriptionAr : ex.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs font-bold text-primary">
                  <span>{t.common.viewDetails}</span>
                  <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
