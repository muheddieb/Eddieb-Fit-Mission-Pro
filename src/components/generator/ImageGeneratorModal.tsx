import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Download, 
  Image as ImageIcon, 
  Cpu, 
  Layers, 
  Check, 
  AlertCircle, 
  RectangleHorizontal,
  Maximize2
} from 'lucide-react';
import { GeneratedImageRecord, UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { GeminiService } from '../../services/geminiService';
import { StorageService } from '../../services/storage';

interface ImageGeneratorModalProps {
  profile: UserProfile;
  onClose: () => void;
}

export const ImageGeneratorModal: React.FC<ImageGeneratorModalProps> = ({
  profile,
  onClose,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [prompt, setPrompt] = useState<string>('Cinematic aesthetic athletic male physique, lean muscle definition, six-pack abs, defined chest and shoulders, dramatic gym lighting, 8k hyper-detailed sports photography');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('2K');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [savedGallery, setSavedGallery] = useState<GeneratedImageRecord[]>([]);

  useEffect(() => {
    setSavedGallery(StorageService.getSavedImages());
  }, []);

  const samplePrompts = isAr
    ? [
        {
          label: 'هدف البنية العضلية الرياضية',
          prompt: 'Athletic lean muscular physique, natural bodybuilding proportions, defined abdominals, vascularity, high contrast studio lighting',
        },
        {
          label: 'وجبة تغذية رياضية مصرية متكاملة',
          prompt: 'Gourmet healthy athletic meal plate, grilled chicken breast, Egyptian baladi bread, fresh green salad, olive oil, high protein macros, culinary photography',
        },
        {
          label: 'تحليل المسار الحركي لتمرين البنش برس',
          prompt: 'Scientific anatomical breakdown of barbell bench press, glowing pectoral and tricep muscle fibers highlighted, biomechanical motion illustration',
        },
      ]
    : [
        {
          label: 'Target Lean Athletic Physique',
          prompt: 'Athletic lean muscular physique, natural bodybuilding proportions, defined abdominals, vascularity, high contrast studio lighting',
        },
        {
          label: 'Balanced High-Protein Egyptian Fuel Plate',
          prompt: 'Gourmet healthy athletic meal plate, grilled chicken breast, Egyptian baladi bread, fresh green salad, olive oil, high protein macros, culinary photography',
        },
        {
          label: 'Biomechanical Chest Muscle Anatomy',
          prompt: 'Scientific anatomical breakdown of barbell bench press, glowing pectoral and tricep muscle fibers highlighted, biomechanical motion illustration',
        },
      ];

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);

    const res = await GeminiService.generateHighQualityImage(prompt, imageSize, aspectRatio);

    if (res.success && res.imageUrl) {
      setGeneratedImage(res.imageUrl);

      const record: GeneratedImageRecord = {
        id: 'img_' + Date.now(),
        imageUrl: res.imageUrl,
        prompt,
        imageSize: res.imageSize || imageSize,
        aspectRatio,
        createdAt: Date.now(),
      };

      StorageService.saveGeneratedImage(record);
      setSavedGallery(StorageService.getSavedImages());
    } else {
      setError(res.error || 'Image generation failed. Please verify API key permissions.');
    }

    setLoading(false);
  };

  const handleDownloadImage = (url: string, filename: string = 'eddieb-fit-visualizer.jpg') => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md overflow-y-auto" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-fade-slide-up transition-all duration-300 transform">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-foreground sm:text-xl">
                  {t.imageGen.title}
                </h2>
                <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/30">
                  gemini-3-pro-image-preview
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t.imageGen.subtitle}</p>
            </div>
          </div>

          <button
            id="btn-close-image-generator"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
          {/* Generation Controls */}
          <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-4">
            {/* Prompt Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t.imageGen.promptLabel}
              </label>
              <textarea
                id="textarea-image-prompt"
                rows={3}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Describe your target physique, exercise anatomy, or athletic visualization..."
                className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none custom-scrollbar"
              />
            </div>

            {/* Quick Prompt Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground">{t.common.quick} Presets:</span>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    id={`btn-preset-prompt-${idx}`}
                    onClick={() => setPrompt(p.prompt)}
                    className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Affordance (1K, 2K, 4K) & Aspect Ratio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
              {/* Image Size Affordance */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-primary" />
                  <span>{t.imageGen.resolutionAffordance}</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['1K', '2K', '4K'] as const).map(size => (
                    <button
                      key={size}
                      id={`btn-size-${size}`}
                      type="button"
                      onClick={() => setImageSize(size)}
                      className={`rounded-xl border py-2 text-xs font-black transition-all ${
                        imageSize === size
                          ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                          : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio Selector */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>{t.imageGen.aspectRatioLabel}</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {['1:1', '3:4', '4:3', '9:16', '16:9'].map(ratio => (
                    <button
                      key={ratio}
                      id={`btn-ratio-${ratio.replace(':', '-')}`}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`rounded-lg border py-2 text-[11px] font-bold transition-all ${
                        aspectRatio === ratio
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Generate Action Button */}
            <button
              id="btn-trigger-image-generation"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  <span>{t.imageGen.generating} ({imageSize})...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>{t.imageGen.generateButton} ({imageSize})</span>
                </>
              )}
            </button>
          </div>

          {/* Active Generation Preview Result */}
          {generatedImage && (
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>{isAr ? 'الصورة المولدة بجودة فائقة' : 'Generated Ultra-High Definition Result'}</span>
                </h3>
                <button
                  id="btn-download-generated-image"
                  onClick={() => handleDownloadImage(generatedImage)}
                  className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/80 border border-border"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{t.common.save}</span>
                </button>
              </div>

              <div className="rounded-xl overflow-hidden border border-border bg-black/50 flex items-center justify-center max-h-[480px]">
                <img
                  src={generatedImage}
                  alt="Generated Athletic Visual"
                  className="max-h-[480px] w-auto object-contain"
                />
              </div>
            </div>
          )}

          {/* Saved Gallery */}
          {savedGallery.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <span>{t.imageGen.galleryTitle} ({savedGallery.length})</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {savedGallery.map(img => (
                  <div key={img.id} className="group relative rounded-xl overflow-hidden border border-border bg-secondary/30 aspect-square">
                    <img
                      src={img.imageUrl}
                      alt={img.prompt}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <span className="rounded bg-primary/80 px-1.5 py-0.5 text-[9px] font-bold text-white self-start">
                        {img.imageSize}
                      </span>
                      <button
                        onClick={() => handleDownloadImage(img.imageUrl)}
                        className="flex items-center justify-center gap-1 rounded bg-white text-black py-1 text-[11px] font-bold hover:bg-white/90"
                      >
                        <Download className="h-3 w-3" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
