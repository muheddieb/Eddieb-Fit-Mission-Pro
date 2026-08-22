import React, { useState } from 'react';
import { 
  X, 
  Play, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Sliders, 
  Zap, 
  Flame,
  Info
} from 'lucide-react';
import { CoreExercise, UserProfile } from '../../types';
import { translations } from '../../i18n/translations';

interface CoreExerciseDetailModalProps {
  exercise: CoreExercise;
  profile: UserProfile;
  onClose: () => void;
  onStartExercise: (exercise: CoreExercise, customSets: number, customReps: number, customRest: number) => void;
}

export const CoreExerciseDetailModal: React.FC<CoreExerciseDetailModalProps> = ({
  exercise,
  profile,
  onClose,
  onStartExercise,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [sets, setSets] = useState<number>(3);
  const [reps, setReps] = useState<number>(12);
  const [restSeconds, setRestSeconds] = useState<number>(45);
  const [videoModalOpen, setVideoModalOpen] = useState<boolean>(false);

  const title = isAr && exercise.nameAr ? exercise.nameAr : exercise.name;
  const description = isAr && exercise.descriptionAr ? exercise.descriptionAr : exercise.description;

  const defaultMistakes = isAr ? [
    'سحب الرقبة باليدين بقوة بدلاً من رفع الجذع بعضلات البطن.',
    'تقوس أسفل الظهر بعيداً عن الأرض وفقدان ثبات الحوض.',
    'الاعتماد على الاندفاع والتأرجح السريع بدلاً من العصر المركز.',
    'حبس النفس أثناء الحركة مما يرفع ضغط الدم ويفقد التحكم.',
  ] : [
    'Pulling the neck aggressively with hands instead of contracting rectus abdominis.',
    'Arching the lumbar spine away from the floor, disengaging core bracing.',
    'Using swing momentum rather than strict eccentric and concentric tempo.',
    'Holding breath rather than exhaling during maximum core flexion/tension.',
  ];

  const defaultInstructions = isAr ? [
    'الوضعية الابتدائية: استلقِ بثبات مع تثبيت أسفل الظهر في الأرض وشد عضلات البطن العميقة.',
    'التنفيذ: ابدأ الحركة بعصر عضلات البطن مع ثبات الورك والرقبة دون تأرجح.',
    'التنفس: أخرج الزفير بالكامل عند أعلى نقطة انقباض واسحب الشهيق أثناء النزول المحكوم.',
    'النهاية: عُد بنعومة لنقطة البداية دون إرخاء عضلات البطن تماماً للحفاظ على الضغط المستمر.',
  ] : [
    'Starting Position: Lie firm on the mat, anchor lumbar spine down, and brace transverse abdominis.',
    'Execution: Contract the core smoothly with zero pelvic tilt or spinal jerking.',
    'Breathing: Exhale forcefully at peak contraction, inhale smoothly under controlled eccentric descent.',
    'Ending: Return softly without completely disengaging core tension between repetitions.',
  ];

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${exercise.name} exercise form tutorial fitness`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground">{exercise.name} • {exercise.primaryPattern}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Quick Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {exercise.primaryPattern}
            </span>
            <span className="rounded-xl border border-border bg-secondary px-3 py-1 text-xs font-bold text-foreground">
              {exercise.equipment}
            </span>
            <span className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
              {exercise.targetRepRange}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>

          {/* Video Demonstration Section */}
          <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Play className="h-4 w-4 text-red-500 fill-current" />
                <span>{isAr ? 'فيديو الشرح التوضيحي للأداء' : 'Demonstration & Form Tutorial'}</span>
              </div>
              <a
                href={youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>YouTube</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? 'يمكنك مشاهدة الشرح الميداني الدقيق لتكنيك التمرين وتجنب أخطاء تقوس الظهر على يوتيوب.'
                : 'Watch full breakdown and biomechanical cues directly on YouTube.'}
            </p>
          </div>

          {/* How to Perform */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{isAr ? 'خطوات الأداء الصحيح (How to Perform)' : 'How to Perform Correctly'}</span>
            </h4>
            <div className="space-y-2">
              {defaultInstructions.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 rounded-xl border border-border bg-card p-3 text-xs text-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Common Mistakes */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{isAr ? 'أخطاء شائعة يجب تجنبها' : 'Common Mistakes to Avoid'}</span>
            </h4>
            <div className="space-y-2">
              {defaultMistakes.map((mistake, idx) => (
                <div key={idx} className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                  <span className="text-amber-400 font-bold">•</span>
                  <span className="leading-relaxed">{mistake}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Configurable Training Parameters */}
          <div className="rounded-2xl border border-border bg-secondary/40 p-5 space-y-4">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              <span>{isAr ? 'تخصيص معايير جلسة التمرين' : 'Training Parameters'}</span>
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                  {isAr ? 'المجموعات' : 'Sets'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={sets}
                  onChange={e => setSets(parseInt(e.target.value, 10) || 3)}
                  className="w-full rounded-xl border border-border bg-background p-2 text-center text-sm font-bold text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                  {isAr ? 'التكرارات' : 'Target Reps'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={reps}
                  onChange={e => setReps(parseInt(e.target.value, 10) || 12)}
                  className="w-full rounded-xl border border-border bg-background p-2 text-center text-sm font-bold text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                  {isAr ? 'الراحة (ثانية)' : 'Rest (s)'}
                </label>
                <input
                  type="number"
                  min="10"
                  max="180"
                  step="5"
                  value={restSeconds}
                  onChange={e => setRestSeconds(parseInt(e.target.value, 10) || 45)}
                  className="w-full rounded-xl border border-border bg-background p-2 text-center text-sm font-bold text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border bg-secondary/30 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-border bg-secondary px-4 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/80"
          >
            {t.common.close}
          </button>

          <button
            id="btn-start-single-core-exercise"
            onClick={() => onStartExercise(exercise, sets, reps, restSeconds)}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>{isAr ? 'ابدأ التمرين فوراً (Start Live)' : 'Start Active Exercise'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
