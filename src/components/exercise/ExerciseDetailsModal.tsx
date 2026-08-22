import React, { useState } from 'react';
import { 
  X, 
  Play, 
  ExternalLink, 
  AlertTriangle, 
  Wind, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  ShieldCheck,
  Search,
  Home,
  Flame,
  Target
} from 'lucide-react';
import { Exercise, UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { PPLEngine } from '../../services/pplEngine';

interface ExerciseDetailsModalProps {
  exercise: Exercise | null;
  profile: UserProfile;
  onClose: () => void;
  onSelectAlternative?: (exerciseId: string) => void;
  onGoHome?: () => void;
}

export const ExerciseDetailsModal: React.FC<ExerciseDetailsModalProps> = ({
  exercise,
  profile,
  onClose,
  onSelectAlternative,
  onGoHome,
}) => {
  if (!exercise) return null;

  const t = translations[profile.language];
  const isAr = profile.language === 'ar';
  const [showEmbeddedVideo, setShowEmbeddedVideo] = useState(false);

  const title = isAr && exercise.nameAr ? exercise.nameAr : exercise.name;
  const primaryMuscle = isAr && exercise.primaryMuscleAr ? exercise.primaryMuscleAr : exercise.primaryMuscle;
  const secondaryMuscles = isAr && exercise.secondaryMusclesAr ? exercise.secondaryMusclesAr : exercise.secondaryMuscles;
  const instructions = isAr && exercise.instructionsAr && exercise.instructionsAr.length > 0 ? exercise.instructionsAr : exercise.instructions;
  const benefits = isAr && exercise.benefitsAr && exercise.benefitsAr.length > 0 ? exercise.benefitsAr : exercise.benefits;
  const mistakes = isAr && exercise.commonMistakesAr && exercise.commonMistakesAr.length > 0 ? exercise.commonMistakesAr : exercise.commonMistakes;
  const breathing = isAr && exercise.breathingAr ? exercise.breathingAr : exercise.breathing;
  const equipment = isAr && exercise.equipmentAr ? exercise.equipmentAr : exercise.equipment;

  const youtubeQuery = encodeURIComponent(exercise.youtubeSearchQuery || `${exercise.name} form tutorial technique fitness`);
  const searchUrl = `https://www.youtube.com/results?search_query=${youtubeQuery}`;

  const handleHomeClick = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative flex flex-col w-full max-w-3xl max-h-[92vh] rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            {/* Home Navigation Button */}
            <button
              id="btn-exercise-to-home"
              onClick={handleHomeClick}
              className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all shadow-sm"
              title={isAr ? 'العودة للصفحة الرئيسية (Home)' : 'Back to Home Dashboard'}
            >
              <Home className="h-4 w-4" />
              <span>{isAr ? 'الرئيسية' : 'Home'}</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-foreground">{title}</h2>
                {exercise.tags.includes('back_safe') && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="h-3 w-3" />
                    {isAr ? 'آمن للظهر' : 'Back Safe'}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {primaryMuscle} • {equipment} • {exercise.exerciseType}
              </p>
            </div>
          </div>

          <button
            id="btn-close-exercise-details"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {/* 80kg Fat Loss & Muscle Preservation Advisory */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3">
            <Target className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-foreground block mb-0.5">
                {isAr ? 'التوجيه التدريبي للوصول لوزن 80 كجم (Target 80kg):' : 'Training Directive for 80kg Goal:'}
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {isAr 
                  ? 'ركز على أداء التكرارات بتحكم كامل في مرحلة النزول (Eccentric) لحرق طاقة أعلى والحفاظ على الكتلة العضلية (64.9 كجم) أثناء نزول الدهون من 32.5% إلى المعدل الرياضي.' 
                  : 'Emphasize a strict 3-second eccentric tempo to maximize mechanical tension and preserve 65kg+ muscle mass while in a caloric deficit towards 80kg.'}
              </p>
            </div>
          </div>

          {/* Video or Image Header */}
          <div className="rounded-2xl overflow-hidden border border-border bg-secondary/30 shadow-inner">
            {showEmbeddedVideo && exercise.youtubeVideoId ? (
              <div className="relative aspect-video w-full">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${exercise.youtubeVideoId}?autoplay=1&rel=0`}
                  title={exercise.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              </div>
            ) : (
              <div className="relative aspect-video max-h-64 w-full bg-muted flex items-center justify-center overflow-hidden group">
                <img
                  src={exercise.imageUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80'}
                  alt={title}
                  className="h-full w-full object-cover object-center opacity-85 transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex items-end p-4 justify-between">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow">
                      {exercise.targetRepRange} reps
                    </span>
                    <span className="rounded-lg bg-black/60 backdrop-blur px-2.5 py-1 text-xs font-semibold text-white border border-white/20">
                      RPE {exercise.rpeTarget}
                    </span>
                    <span className="rounded-lg bg-black/60 backdrop-blur px-2.5 py-1 text-xs font-semibold text-white border border-white/20">
                      {exercise.restSeconds}s rest
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {exercise.youtubeVideoId && (
                      <button
                        id="btn-play-embedded-video"
                        onClick={() => setShowEmbeddedVideo(true)}
                        className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg hover:bg-red-500 transition-colors"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>{t.common.watchVideo}</span>
                      </button>
                    )}
                    <a
                      id="btn-open-youtube-external"
                      href={searchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl bg-secondary/90 px-3 py-1.5 text-xs font-semibold text-foreground border border-border hover:bg-secondary transition-colors"
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>{t.common.openYoutube}</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Muscles Targeted */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-bold text-foreground mb-2.5 flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>{t.exerciseDetails.anatomyTarget}</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg bg-primary/20 px-3 py-1 text-xs font-bold text-primary border border-primary/30">
                {t.exerciseDetails.primary}: {primaryMuscle}
              </span>
              {secondaryMuscles && secondaryMuscles.length > 0 && secondaryMuscles.map((sec, idx) => (
                <span key={idx} className="rounded-lg bg-secondary px-2.5 py-1 text-xs text-muted-foreground border border-border">
                  {sec}
                </span>
              ))}
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{t.exerciseDetails.instructions}</span>
            </h3>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              {instructions.map((step, idx) => (
                <li key={idx} className="leading-relaxed bg-secondary/30 rounded-lg p-2.5 border border-border/50">
                  <span className="text-foreground font-medium">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Common Mistakes */}
          {mistakes && mistakes.length > 0 && (
            <div className="space-y-2.5 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{t.exerciseDetails.mistakes}</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
                {mistakes.map((mistake, idx) => (
                  <li key={idx} className="leading-relaxed">{mistake}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Breathing Pattern */}
          {breathing && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3">
              <Wind className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-blue-400 mb-1">{t.exerciseDetails.breathing}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{breathing}</p>
              </div>
            </div>
          )}

          {/* Biomechanical Alternatives */}
          {exercise.alternatives && exercise.alternatives.length > 0 && (
            <div className="space-y-3 border-t border-border pt-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span>{t.exerciseDetails.alternatives}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {exercise.alternatives.map(altId => {
                  const altEx = PPLEngine.getExerciseById(altId);
                  if (!altEx) return null;
                  const altTitle = isAr && altEx.nameAr ? altEx.nameAr : altEx.name;

                  return (
                    <button
                      key={altId}
                      id={`btn-select-alt-${altId}`}
                      onClick={() => onSelectAlternative && onSelectAlternative(altId)}
                      className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-3 text-left hover:bg-secondary hover:border-primary/40 transition-colors group"
                    >
                      <div>
                        <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          {altTitle}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {altEx.equipment} • {altEx.difficulty}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-primary">{t.common.viewDetails}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 border-t border-border bg-card/95 p-4 flex justify-end">
          <button
            id="btn-return-workout-bottom"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            {t.exerciseDetails.returnToWorkout}
          </button>
        </div>
      </div>
    </div>
  );
};
