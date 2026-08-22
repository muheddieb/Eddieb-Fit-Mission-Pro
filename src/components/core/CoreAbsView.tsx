import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  ShieldCheck, 
  Play, 
  Check, 
  Info, 
  Plus, 
  Zap, 
  Sparkles,
  ChevronRight,
  Flame,
  Clock,
  Dumbbell,
  RotateCcw,
  Activity,
  Award
} from 'lucide-react';
import { CoreExercise, CoreSession, Exercise, UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { exerciseSeedData } from '../../data/exerciseSeed';
import { StorageService } from '../../services/storage';
import { ActiveCoreModal, CoreRoutine } from './ActiveCoreModal';
import { CoreExerciseDetailModal } from './CoreExerciseDetailModal';

interface CoreAbsViewProps {
  profile: UserProfile;
  onSelectExercise: (exercise: Exercise) => void;
}

export const CoreAbsView: React.FC<CoreAbsViewProps> = ({
  profile,
  onSelectExercise,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [coreLogs, setCoreLogs] = useState<CoreSession[]>([]);
  const [selectedPatternFilter, setSelectedPatternFilter] = useState<string>('all');
  const [activeRoutine, setActiveRoutine] = useState<CoreRoutine | null>(null);
  const [detailExercise, setDetailExercise] = useState<CoreExercise | null>(null);

  // Cast raw core exercises to typed CoreExercise
  const coreExercises: CoreExercise[] = exerciseSeedData
    .filter(e => e.category === 'core')
    .map(e => ({
      id: e.id,
      name: e.name,
      nameAr: e.nameAr,
      description: e.description,
      descriptionAr: e.descriptionAr,
      primaryPattern: (e as any).primaryPattern || 'Anti-Extension',
      equipment: e.equipment,
      targetRepRange: e.targetRepRange || '12-15 reps',
      difficulty: e.difficulty,
      videoDemonstrationUrl: (e as any).videoUrl,
      targetMuscles: (e as any).targetMuscles || ['Rectus Abdominis', 'Transverse Abdominis'],
    }));

  useEffect(() => {
    setCoreLogs(StorageService.getCoreHistory());
  }, []);

  // Built-in Training Protocols
  const prebuiltRoutines: CoreRoutine[] = [
    {
      id: 'iron_fortress',
      name: 'Iron Core Fortress Routine',
      nameAr: 'حصن الكور الفولاذي (Iron Core Fortress)',
      description: 'Comprehensive 4-movement protocol targeting spinal stabilization, anti-extension, and anti-rotation.',
      descriptionAr: 'بروتوكول شامل لحماية العمود الفقري ومقاومة التمدد والدوران مع تعزيز قوة التحمل.',
      exercises: [
        {
          exercise: coreExercises.find(e => e.id === 'plank_hold') || coreExercises[0],
          sets: 3,
          targetReps: 45,
          restSeconds: 30,
        },
        {
          exercise: coreExercises.find(e => e.id === 'dead_bug') || coreExercises[1] || coreExercises[0],
          sets: 3,
          targetReps: 12,
          restSeconds: 30,
        },
        {
          exercise: coreExercises.find(e => e.id === 'side_plank') || coreExercises[2] || coreExercises[0],
          sets: 3,
          targetReps: 30,
          restSeconds: 30,
        },
        {
          exercise: coreExercises.find(e => e.id === 'bird_dog') || coreExercises[3] || coreExercises[0],
          sets: 3,
          targetReps: 10,
          restSeconds: 30,
        },
      ],
    },
    {
      id: 'sixpack_hypertrophy',
      name: 'Six-Pack Hypertrophy Protocol',
      nameAr: 'تضخيم وبروز عضلات البطن (Six-Pack Hypertrophy)',
      description: 'Dynamic weighted flexion and knee raises for deep rectus abdominis muscle hypertrophy.',
      descriptionAr: 'حركات انثناء ديناميكية لتقسيم وبروز عضلات البطن الستة مع تعزيز المقاومة العضلية.',
      exercises: [
        {
          exercise: coreExercises.find(e => e.id === 'hanging_knee_raise') || coreExercises[0],
          sets: 3,
          targetReps: 15,
          restSeconds: 45,
        },
        {
          exercise: coreExercises.find(e => e.id === 'cable_crunch') || coreExercises[1] || coreExercises[0],
          sets: 3,
          targetReps: 15,
          restSeconds: 45,
        },
        {
          exercise: coreExercises.find(e => e.id === 'pallof_press') || coreExercises[2] || coreExercises[0],
          sets: 3,
          targetReps: 12,
          restSeconds: 40,
        },
      ],
    },
    {
      id: 'express_5min',
      name: '5-Minute Rapid Core Ignition',
      nameAr: 'تنشيط الكور السريع (5 دقائق)',
      description: 'Fast-paced continuous circuit designed for quick intra-abdominal activation.',
      descriptionAr: 'دائرة سريعة ومكثفة لتنشيط عضلات البطن العميقة وأسفل الظهر في 5 دقائق.',
      exercises: [
        {
          exercise: coreExercises[0],
          sets: 2,
          targetReps: 15,
          restSeconds: 20,
        },
        {
          exercise: coreExercises[1] || coreExercises[0],
          sets: 2,
          targetReps: 15,
          restSeconds: 20,
        },
      ],
    },
  ];

  const handleStartCustomExercise = (
    exercise: CoreExercise,
    customSets: number,
    customReps: number,
    customRest: number
  ) => {
    setDetailExercise(null);
    setActiveRoutine({
      id: 'custom_' + exercise.id,
      name: exercise.name,
      nameAr: exercise.nameAr || exercise.name,
      description: exercise.description,
      descriptionAr: exercise.descriptionAr || exercise.description,
      exercises: [
        {
          exercise,
          sets: customSets,
          targetReps: customReps,
          restSeconds: customRest,
        },
      ],
    });
  };

  const handleFinishRoutineSession = (session: CoreSession) => {
    setActiveRoutine(null);
    setCoreLogs(StorageService.getCoreHistory());
  };

  const filteredExercises = selectedPatternFilter === 'all'
    ? coreExercises
    : coreExercises.filter(e => e.primaryPattern?.toLowerCase().includes(selectedPatternFilter.toLowerCase()));

  const totalCoreMinutes = coreLogs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0);

  return (
    <div className="space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground sm:text-3xl">
          {t.core.title}
        </h1>
        <p className="text-sm text-muted-foreground">{t.core.subtitle}</p>
      </div>

      {/* 4 Pillars of Biomechanical Core Stability */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Anti-Extension */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase">
            <ShieldCheck className="h-4 w-4" />
            <span>{isAr ? 'مقاومة التمدد (Anti-Extension)' : 'Anti-Extension'}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isAr
              ? 'حماية الفقرات القطنية من التقوس المفرط أثناء الأحمال الثقيلة.'
              : 'Resisting lumbar hyperextension under heavy overhead or squatting loads.'}
          </p>
          <div className="text-[11px] font-bold text-foreground">
            {isAr ? 'أمثلة: Plank, Dead Bug, Rollout' : 'Key: Plank, Dead Bug, Rollout'}
          </div>
        </div>

        {/* Anti-Rotation */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase">
            <Layers className="h-4 w-4" />
            <span>{isAr ? 'مقاومة الدوران (Anti-Rotation)' : 'Anti-Rotation'}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isAr
              ? 'تثبيت الجذع ضد قوى الالتواء لنقل القوة الحركية بكفاءة.'
              : 'Locking pelvic-ribcage alignment against rotational torque forces.'}
          </p>
          <div className="text-[11px] font-bold text-foreground">
            {isAr ? 'أمثلة: Pallof Press, Bird Dog' : 'Key: Pallof Press, Bird Dog'}
          </div>
        </div>

        {/* Anti-Lateral Flexion */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase">
            <Zap className="h-4 w-4" />
            <span>{isAr ? 'مقاومة الميل الجانبي (Anti-Lateral)' : 'Anti-Lateral Flexion'}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isAr
              ? 'تقوية عضلات الخواصر المائلة و Quadratus Lumborum للثبات.'
              : 'Strengthening internal/external obliques and QL for asymmetric stability.'}
          </p>
          <div className="text-[11px] font-bold text-foreground">
            {isAr ? 'أمثلة: Side Plank, Suitcase Carry' : 'Key: Side Plank, Suitcase Carry'}
          </div>
        </div>

        {/* Dynamic Flexion */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase">
            <Sparkles className="h-4 w-4" />
            <span>{isAr ? 'الانثناء الديناميكي (Flexion)' : 'Trunk Flexion'}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isAr
              ? 'تقريب القفص الصدري نحو الحوض لبناء بروز عضلات البطن (Six-Pack).'
              : 'Shortening rectus abdominis through controlled spinal flexion for hypertrophy.'}
          </p>
          <div className="text-[11px] font-bold text-foreground">
            {isAr ? 'أمثلة: Hanging Knee Raise, Cable Crunch' : 'Key: Hanging Knee Raise, Cable Crunch'}
          </div>
        </div>
      </div>

      {/* Pre-built Live Core Training Protocols */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            <span>{isAr ? 'بروتوكولات تدريب البطن التفاعلية' : 'Interactive Core Training Protocols'}</span>
          </h3>
          <span className="text-xs text-muted-foreground">
            {prebuiltRoutines.length} {isAr ? 'بروتوكولات جاهزة' : 'protocols ready'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {prebuiltRoutines.map(routine => (
            <div
              key={routine.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-md flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                    {routine.exercises.length} {isAr ? 'تمارين' : 'exercises'}
                  </span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    ~12-15 min
                  </span>
                </div>

                <h4 className="text-base font-bold text-foreground">
                  {isAr ? routine.nameAr : routine.name}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isAr ? routine.descriptionAr : routine.description}
                </p>
              </div>

              <button
                id={`btn-start-protocol-${routine.id}`}
                onClick={() => setActiveRoutine(routine)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{isAr ? 'ابدأ الجلسة التفاعلية الآن' : 'Start Live Session'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Core Exercises Library with Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <span>{isAr ? 'مكتبة تمارين الكور المتخصصة' : 'Specialized Core Exercise Library'}</span>
          </h3>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {[
              { id: 'all', label: isAr ? 'الكل' : 'All' },
              { id: 'Anti-Extension', label: isAr ? 'مقاومة تمدد' : 'Anti-Extension' },
              { id: 'Anti-Rotation', label: isAr ? 'مقاومة دوران' : 'Anti-Rotation' },
              { id: 'Flexion', label: isAr ? 'انثناء وبروز' : 'Flexion' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedPatternFilter(f.id)}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                  selectedPatternFilter === f.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map(ex => {
            const title = isAr && ex.nameAr ? ex.nameAr : ex.name;
            const desc = isAr && ex.descriptionAr ? ex.descriptionAr : ex.description;

            return (
              <div
                key={ex.id}
                className="group rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {ex.equipment}
                    </span>
                    <span className="text-xs font-bold text-primary">
                      {ex.targetRepRange}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {desc}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <button
                    id={`btn-guide-${ex.id}`}
                    onClick={() => setDetailExercise(ex)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/70 py-2 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
                  >
                    <Info className="h-3.5 w-3.5 text-primary" />
                    <span>{t.common.guideAndVideo}</span>
                  </button>

                  <button
                    id={`btn-start-${ex.id}`}
                    onClick={() => handleStartCustomExercise(ex, 3, 12, 45)}
                    className="flex items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                    title="Start Live"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Core History Log */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>{isAr ? 'سجل جلسات تمارين البطن المكتملة' : 'Core Training History'}</span>
          </h3>
          <span className="text-xs text-muted-foreground">
            {coreLogs.length} {isAr ? 'جلسات مسجلة' : 'sessions'} • {totalCoreMinutes} {isAr ? 'دقيقة' : 'min'}
          </span>
        </div>

        {coreLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            {isAr ? 'لم يتم تسجيل أي جلسات كور بعد. ابدأ بروتوكولك الأول الآن!' : 'No core sessions logged yet. Launch your first live routine!'}
          </p>
        ) : (
          <div className="space-y-2">
            {coreLogs.slice(0, 5).map(log => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3.5 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">
                      {isAr && log.routineNameAr ? log.routineNameAr : log.routineName || (log as any).name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {log.date} • {log.setsCompleted || 3} {isAr ? 'مجموعات' : 'sets'}
                    </div>
                  </div>
                </div>

                <div className="font-bold text-primary">
                  {log.durationMinutes} min
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Core Live Modal */}
      {activeRoutine && (
        <ActiveCoreModal
          routine={activeRoutine}
          profile={profile}
          onClose={() => setActiveRoutine(null)}
          onFinish={handleFinishRoutineSession}
        />
      )}

      {/* Exercise Detail Modal */}
      {detailExercise && (
        <CoreExerciseDetailModal
          exercise={detailExercise}
          profile={profile}
          onClose={() => setDetailExercise(null)}
          onStartExercise={handleStartCustomExercise}
        />
      )}
    </div>
  );
};
