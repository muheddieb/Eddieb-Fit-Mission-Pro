import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Activity,
  Utensils,
  Flame,
  Download,
  Maximize2,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Layers,
  Cpu,
  Trash2,
  ExternalLink,
  AlertCircle,
  Eye,
  X,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, GeneratedImageRecord } from '../../types';
import { translations } from '../../i18n/translations';
import { GeminiService } from '../../services/geminiService';
import { StorageService } from '../../services/storage';
import {
  VISUALIZER_QUICK_ACTIONS,
  VisualizerQuickAction,
} from '../../data/visualizerPresets';

interface VisualizerViewProps {
  profile: UserProfile;
  onOpenCustomStudio: () => void;
  onTriggerActionInModal?: (action: VisualizerQuickAction) => void;
}

export const VisualizerView: React.FC<VisualizerViewProps> = ({
  profile,
  onOpenCustomStudio,
}) => {
  const isAr = profile.language === 'ar';
  const t = translations[profile.language] || translations.en;

  const [activeGeneratingId, setActiveGeneratingId] = useState<string | null>(null);
  const [activeGeneratingName, setActiveGeneratingName] = useState<string>('');
  const [activeGeneratingSize, setActiveGeneratingSize] = useState<string>('2K');
  const [generationTime, setGenerationTime] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [latestGeneratedImage, setLatestGeneratedImage] = useState<GeneratedImageRecord | null>(null);
  const [savedGallery, setSavedGallery] = useState<GeneratedImageRecord[]>([]);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Load saved gallery on mount
  useEffect(() => {
    setSavedGallery(StorageService.getSavedImages());
  }, []);

  // Timer for active generation
  useEffect(() => {
    let interval: any = null;
    if (activeGeneratingId) {
      setGenerationTime(0);
      interval = setInterval(() => {
        setGenerationTime((prev) => prev + 1);
      }, 1000);
    } else {
      setGenerationTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeGeneratingId]);

  // Trigger 1-Click Quick Action Generation
  const handleTriggerQuickAction = async (action: VisualizerQuickAction) => {
    if (activeGeneratingId) return; // Prevent double trigger while busy

    setActiveGeneratingId(action.id);
    setActiveGeneratingName(isAr ? action.nameAr : action.name);
    setActiveGeneratingSize(action.imageSize);
    setErrorMessage(null);

    try {
      const res = await GeminiService.generateHighQualityImage(
        action.prompt,
        action.imageSize,
        action.aspectRatio
      );

      if (res.success && res.imageUrl) {
        const record: GeneratedImageRecord = {
          id: 'img_' + Date.now(),
          imageUrl: res.imageUrl,
          prompt: action.prompt,
          imageSize: (res.imageSize as any) || action.imageSize,
          aspectRatio: action.aspectRatio,
          createdAt: Date.now(),
        };

        StorageService.saveGeneratedImage(record);
        setLatestGeneratedImage(record);
        setSavedGallery(StorageService.getSavedImages());
      } else {
        // Fallback demo visual if API key is not configured or in sandbox
        console.warn('Image generation returned error or unconfigured key:', res.error);
        const fallbackUrl = action.samplePreviewUrl;
        const fallbackRecord: GeneratedImageRecord = {
          id: 'img_preview_' + Date.now(),
          imageUrl: fallbackUrl,
          prompt: action.prompt,
          imageSize: action.imageSize,
          aspectRatio: action.aspectRatio,
          createdAt: Date.now(),
        };

        StorageService.saveGeneratedImage(fallbackRecord);
        setLatestGeneratedImage(fallbackRecord);
        setSavedGallery(StorageService.getSavedImages());

        if (res.error && !res.error.includes('unconfigured')) {
          setErrorMessage(res.error);
        }
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Error occurred during generation');
    } finally {
      setActiveGeneratingId(null);
    }
  };

  const handleDownload = (url: string, filename: string = 'eddieb-fit-visualizer.jpg') => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleDeleteSavedImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.deleteGeneratedImage(id);
    setSavedGallery(StorageService.getSavedImages());
    if (latestGeneratedImage?.id === id) {
      setLatestGeneratedImage(null);
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Activity':
        return <Activity className="h-5 w-5" />;
      case 'Utensils':
        return <Utensils className="h-5 w-5" />;
      case 'Flame':
        return <Flame className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-slide-up transition-all duration-300 ease-out" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header & Resolution Capability Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="h-5 w-5" />
              </span>
              <span>{isAr ? 'المولد البصري للفيزيك والتمارين' : 'AI Physique & Exercise Visualizer'}</span>
            </h1>
            <span className="rounded-full bg-primary/15 text-primary border border-primary/30 px-2.5 py-0.5 text-xs font-black">
              1K • 2K • 4K
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            {isAr
              ? 'توليد مرئيات رياضية واقعية، مخططات تشريح ميكانيكا العضلات، وأطباق تغذية ماكروز متكاملة بدقة 1K، 2K، و4K فائقة الوضوح.'
              : 'Synthesize ultra-high resolution athletic physiques, biomechanical muscle anatomy diagrams, and macro fuel plates in 1K, 2K, and 4K.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id="btn-open-studio-generator-view"
            onClick={onOpenCustomStudio}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all active:scale-95"
          >
            <Sliders className="h-4 w-4" />
            <span>{isAr ? 'استوديو التوليد المخصص' : 'Custom Studio Generator'}</span>
          </button>
        </div>
      </div>

      {/* QUICK ACTIONS ROW (Prominent 1-Click Generation) */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
              <h2 className="text-base sm:text-lg font-black text-foreground">
                {isAr ? 'إجراءات سريعة: أنماط التوليد بنقرة واحدة' : 'Quick Actions: 1-Click Style Generator'}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? 'انقر مباشرة لتوليد النمط الفني فوراً بأبعاد ونسب مدروسة علمياً ودقة 2K عالية'
                : 'Click any style card below to immediately trigger ultra-high resolution generation.'}
            </p>
          </div>

          <span className="text-[11px] font-semibold text-muted-foreground hidden sm:inline-block">
            {isAr ? '3 أنماط رياضية جاهزة' : '3 Ready-to-use Styles'}
          </span>
        </div>

        {/* 3-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VISUALIZER_QUICK_ACTIONS.map((action) => {
            const isGeneratingThis = activeGeneratingId === action.id;

            return (
              <div
                key={action.id}
                id={`quick-action-card-${action.id}`}
                className={`group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-4 transition-all duration-200 shadow-sm hover:shadow-md ${action.borderHover} overflow-hidden`}
              >
                {/* Background ambient accent */}
                <div
                  className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br ${action.accentGradient} blur-2xl transition-opacity group-hover:opacity-100 opacity-60`}
                />

                <div className="space-y-3 relative z-10">
                  {/* Top Meta Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary border border-border text-foreground group-hover:border-primary/40 transition-colors">
                        {renderIcon(action.iconName)}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          {isAr ? action.categoryAr : action.category}
                        </span>
                        <h3 className="text-sm sm:text-base font-black text-foreground leading-tight">
                          {isAr ? action.nameAr : action.name}
                        </h3>
                      </div>
                    </div>

                    <span className="rounded-lg bg-secondary/80 border border-border px-2 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
                      {isAr ? action.badgeAr : action.badge}
                    </span>
                  </div>

                  {/* Preview Thumbnail */}
                  <div className="relative h-28 sm:h-32 w-full overflow-hidden rounded-xl border border-border bg-muted">
                    <img
                      src={action.samplePreviewUrl}
                      alt={action.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-2.5">
                      <span className="text-[11px] font-medium text-white/90 line-clamp-1">
                        {isAr ? action.nameAr : action.name}
                      </span>
                    </div>
                  </div>

                  {/* Descriptive Tagline */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[36px]">
                    {isAr ? action.taglineAr : action.tagline}
                  </p>
                </div>

                {/* 1-Click Action Button */}
                <div className="pt-3 border-t border-border/70 mt-3 relative z-10">
                  <button
                    id={`btn-trigger-${action.id}`}
                    type="button"
                    onClick={() => handleTriggerQuickAction(action)}
                    disabled={activeGeneratingId !== null}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${action.btnColor}`}
                  >
                    {isGeneratingThis ? (
                      <>
                        <Sparkles className="h-3.5 w-3.5 animate-spin" />
                        <span>
                          {isAr ? `جاري التوليد (${generationTime} ث)...` : `Generating (${generationTime}s)...`}
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{isAr ? 'توليد بنقرة واحدة' : 'Generate with 1-Click'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ACTIVE GENERATION IN PROGRESS FEEDBACK */}
      {activeGeneratingId && (
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 text-center space-y-3 shadow-inner animate-pulse">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Sparkles className="h-6 w-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-foreground">
              {isAr
                ? `جاري معالجة وتوليد "${activeGeneratingName}" بدقة ${activeGeneratingSize}...`
                : `Synthesizing "${activeGeneratingName}" in ${activeGeneratingSize} Ultra-HD...`}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              gemini-3-pro-image-preview • {generationTime}s elapsed
            </p>
          </div>
        </div>
      )}

      {/* ERROR NOTICE IF OCCURRED */}
      {errorMessage && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">{isAr ? 'تنبيه التوليد:' : 'Generation Notice:'}</span>
              <span>{errorMessage}</span>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-300 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* LATEST GENERATED IMAGE SPOTLIGHT RESULT */}
      {latestGeneratedImage && (
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Check className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-foreground">
                  {isAr ? 'النتيجة المولدة حديثاً' : 'Latest Generated Visual'}
                </h3>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {latestGeneratedImage.imageSize} • {latestGeneratedImage.aspectRatio} • {new Date(latestGeneratedImage.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleCopyPrompt(latestGeneratedImage.prompt)}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors"
              >
                {copiedPrompt ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedPrompt ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الوصف' : 'Copy Prompt')}</span>
              </button>

              <button
                type="button"
                onClick={() => setLightboxImage(latestGeneratedImage.imageUrl)}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>{isAr ? 'تكبير' : 'Zoom'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownload(latestGeneratedImage.imageUrl)}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{isAr ? 'تحميل الصورة' : 'Download Image'}</span>
              </button>
            </div>
          </div>

          {/* Full High-Resolution Visual Container */}
          <div className="relative rounded-xl overflow-hidden border border-border bg-black/80 flex items-center justify-center max-h-[550px] group">
            <img
              src={latestGeneratedImage.imageUrl}
              alt="Athletic Synthesis"
              referrerPolicy="no-referrer"
              className="max-h-[550px] w-auto object-contain cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
              onClick={() => setLightboxImage(latestGeneratedImage.imageUrl)}
            />
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md rounded-lg px-2.5 py-1 text-[11px] font-mono font-bold text-white border border-white/10">
              {latestGeneratedImage.imageSize} UHD
            </div>
          </div>

          <div className="p-3 rounded-xl bg-secondary/40 border border-border text-xs text-muted-foreground space-y-1">
            <span className="font-bold text-foreground block">{isAr ? 'الوصف الهندسي للتوليد:' : 'Engineering Prompt:'}</span>
            <p className="font-mono text-[11px] leading-relaxed">{latestGeneratedImage.prompt}</p>
          </div>
        </section>
      )}

      {/* SAVED GALLERY OF PAST VISUALS */}
      {savedGallery.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h3 className="text-base font-black text-foreground">
                {isAr ? 'معرض التصاميم المحفوظة' : 'Saved Visualizations Gallery'}
              </h3>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-mono text-muted-foreground border border-border">
                {savedGallery.length}
              </span>
            </div>

            <button
              onClick={onOpenCustomStudio}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>{isAr ? 'فتح الاستوديو للتحكم الكامل' : 'Open Full Studio'}</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {savedGallery.map((img) => (
              <div
                key={img.id}
                className="group relative rounded-xl overflow-hidden border border-border bg-card aspect-square shadow-sm hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => setLightboxImage(img.imageUrl)}
              >
                <img
                  src={img.imageUrl}
                  alt={img.prompt}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Top Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="rounded bg-black/70 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-mono font-bold text-white border border-white/15">
                    {img.imageSize}
                  </span>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => handleDeleteSavedImage(img.id, e)}
                  title={isAr ? 'حذف من المعرض' : 'Delete from gallery'}
                  className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-black/60 text-white/80 hover:text-red-400 hover:bg-black/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {/* Bottom Overlay Info */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-white/90 line-clamp-1 max-w-[70%] font-medium">
                    {img.aspectRatio}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(img.imageUrl);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded bg-white text-black hover:bg-white/90"
                    title={isAr ? 'تحميل' : 'Download'}
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
            onClick={() => setLightboxImage(null)}
          >
            <div className="relative max-h-[90vh] max-w-[90vw] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute -top-12 right-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={lightboxImage}
                alt="Enlarged Visual"
                referrerPolicy="no-referrer"
                className="max-h-[85vh] max-w-[88vw] rounded-2xl object-contain shadow-2xl border border-white/10"
              />
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => handleDownload(lightboxImage)}
                  className="flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-xs font-bold hover:bg-white/90 transition-colors shadow-lg"
                >
                  <Download className="h-4 w-4" />
                  <span>{isAr ? 'تحميل الصورة الأصلية' : 'Download High-Res'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
