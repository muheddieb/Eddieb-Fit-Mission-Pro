import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Trophy, 
  Flame, 
  HeartPulse, 
  Gauge, 
  Timer, 
  Navigation, 
  MapPin, 
  ChevronUp, 
  ChevronDown, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Sparkles,
  Zap,
  TrendingUp,
  Mountain,
  Compass,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { CardioSession, UserProfile } from '../../types';
import { translations } from '../../i18n/translations';
import { StorageService } from '../../services/storage';
import { WakeLockService } from '../../services/wakeLockService';

export interface ActiveCardioConfig {
  type: CardioSession['type'];
  targetDurationMinutes: number;
  inclinePercentage: number;
  initialSpeedKmh: number;
  intensity: CardioSession['intensity'];
  environment?: 'coastal' | 'mountain' | 'cyber_neon' | 'sunset';
}

interface ActiveCardioModalProps {
  config: ActiveCardioConfig;
  profile: UserProfile;
  onClose: () => void;
  onFinish: (session: CardioSession) => void;
}

export const ActiveCardioModal: React.FC<ActiveCardioModalProps> = ({
  config,
  profile,
  onClose,
  onFinish,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';
  const isMiles = profile.units === 'miles';

  // Session State
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(config.initialSpeedKmh || 5.0);
  const [currentIncline, setCurrentIncline] = useState<number>(config.inclinePercentage || 0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [environment, setEnvironment] = useState<'coastal' | 'mountain' | 'cyber_neon' | 'sunset'>(
    config.environment || 'sunset'
  );
  const [showManualEditor, setShowManualEditor] = useState<boolean>(false);

  // Motivational toast
  const [activeMotivation, setActiveMotivation] = useState<string | null>(null);
  const [milestonesTriggered, setMilestonesTriggered] = useState<Set<number>>(new Set());

  // GPS / Geolocation State
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [gpsDistanceKm, setGpsDistanceKm] = useState<number>(0);
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const geoWatchIdRef = useRef<number | null>(null);

  const timerRef = useRef<any>(null);
  const motivationTimerRef = useRef<any>(null);

  const targetSeconds = config.targetDurationMinutes * 60;

  // Screen Wake Lock
  useEffect(() => {
    WakeLockService.acquire(profile.screenWakeDuration || 'never');
    return () => {
      WakeLockService.release();
    };
  }, [profile.screenWakeDuration]);

  // Audio tone generator
  const playBeep = (freq = 880) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {}
  };

  // Distance computation
  const calculatedDistanceKm = (elapsedSeconds / 3600) * currentSpeedKmh;
  const totalDistanceKm = gpsActive && gpsDistanceKm > 0 ? gpsDistanceKm : calculatedDistanceKm;

  // Convert for display
  const displayDistance = isMiles ? totalDistanceKm * 0.621371 : totalDistanceKm;
  const distanceUnitLabel = isMiles ? 'mi' : 'km';
  const displaySpeed = isMiles ? currentSpeedKmh * 0.621371 : currentSpeedKmh;
  const speedUnitLabel = isMiles ? 'mph' : 'km/h';

  // Pace computation (minutes per unit)
  const paceMinutes = displaySpeed > 0 ? 60 / displaySpeed : 0;
  const paceM = Math.floor(paceMinutes);
  const paceS = Math.round((paceMinutes - paceM) * 60);
  const paceFormatted = displaySpeed > 0 ? `${paceM}:${paceS.toString().padStart(2, '0')}` : '--:--';

  // Calorie burn formula based on speed, incline, and user bodyweight
  const caloriesBurned = Math.round(
    (elapsedSeconds / 60) * (profile.currentWeightKg * 0.085) * (1 + currentIncline * 0.04) * (currentSpeedKmh / 4.8)
  );

  // Main Running Timer Loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  // Motivational Intervals and Milestones Loop
  useEffect(() => {
    if (!isRunning) return;

    const currentPercent = Math.round((elapsedSeconds / Math.max(1, targetSeconds)) * 100);

    // Milestones check
    const checkMilestone = (percent: number, msgAr: string, msgEn: string) => {
      if (currentPercent >= percent && !milestonesTriggered.has(percent)) {
        setMilestonesTriggered(prev => new Set(prev).add(percent));
        setActiveMotivation(isAr ? msgAr : msgEn);
        playBeep(920);
        setTimeout(() => setActiveMotivation(null), 5000);
      }
    };

    checkMilestone(25, '👏 أحسنت! قطعت أول 25% من هدفك اليوم.', '👏 Great start! First 25% completed.');
    checkMilestone(50, '⚡ منتصف الطريق! حافظ على إيقاعك وتنفسك.', '⚡ Halfway mark reached! Keep your steady breathing cadence.');
    checkMilestone(75, '🔥 الربع الأخير! اقتربت من خط النهاية.', '🔥 Final stretch! Push through the last quarter.');
    checkMilestone(100, '🏆 مبروك! أتممت هدف الجلسة بالكامل!', '🏆 Mission Complete! Target cardio duration achieved.');
  }, [elapsedSeconds, isRunning, targetSeconds, milestonesTriggered, isAr]);

  // Periodic Motivational Interval
  useEffect(() => {
    const freq = profile.cardioMotivationFrequency || '1m';
    if (freq === 'off' || !isRunning) return;

    const intervalSec = freq === '2m' ? 120 : 60;

    const motivationalPhrasesAr = [
      'تنفس بعمق وحافظ على إيقاع ثابت.',
      'أكسدة الدهون في أعلى مستوياتها الآن!',
      'كل خطوة تقربك من هدفك البدني.',
      'استمر بتركيز وثبات.',
    ];
    const motivationalPhrasesEn = [
      'Maintain continuous rhythmic breathing and steady stride.',
      'Optimal fat oxidation in Zone 2 active!',
      'Every minute builds your cardiovascular resilience.',
      'Stay disciplined and power through.',
    ];

    motivationTimerRef.current = setInterval(() => {
      if (elapsedSeconds > 10) {
        const phrases = isAr ? motivationalPhrasesAr : motivationalPhrasesEn;
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        setActiveMotivation(randomPhrase);
        playBeep(700);
        setTimeout(() => setActiveMotivation(null), 4000);
      }
    }, intervalSec * 1000);

    return () => clearInterval(motivationTimerRef.current);
  }, [isRunning, profile.cardioMotivationFrequency, isAr, elapsedSeconds]);

  // Geolocation Sensor Integration (with fallback)
  useEffect(() => {
    if (profile.autoGpsTracking !== false && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        geoWatchIdRef.current = navigator.geolocation.watchPosition(
          pos => {
            setGpsActive(true);
            const { latitude, longitude } = pos.coords;
            if (lastCoordsRef.current) {
              // Haversine formula
              const R = 6371; // km
              const dLat = ((latitude - lastCoordsRef.current.lat) * Math.PI) / 180;
              const dLon = ((longitude - lastCoordsRef.current.lng) * Math.PI) / 180;
              const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((lastCoordsRef.current.lat * Math.PI) / 180) *
                  Math.cos((latitude * Math.PI) / 180) *
                  Math.sin(dLon / 2) *
                  Math.sin(dLon / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const d = R * c;
              if (d > 0.002) {
                setGpsDistanceKm(prev => prev + d);
              }
            }
            lastCoordsRef.current = { lat: latitude, lng: longitude };
          },
          err => {
            // Graceful fallback to computed speed distance
            setGpsActive(false);
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
      } catch (e) {
        setGpsActive(false);
      }
    }

    return () => {
      if (geoWatchIdRef.current !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
      }
    };
  }, [profile.autoGpsTracking]);

  // Finish session
  const handleFinishSession = () => {
    setIsRunning(false);
    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    const finalSession: CardioSession = {
      id: 'cardio_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: config.type,
      durationMinutes,
      inclinePercentage: currentIncline,
      speedKmh: currentSpeedKmh,
      intensity: config.intensity,
      caloriesBurned,
      timestamp: Date.now(),
    };

    StorageService.addCardioSession(finalSession);

    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
      });
    } catch (e) {}

    WakeLockService.release();
    onFinish(finalSession);
  };

  const progressPercent = Math.min(100, Math.round((elapsedSeconds / Math.max(1, targetSeconds)) * 100));
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);

  // Environment visual backgrounds
  const envStyles = {
    sunset: 'from-amber-950 via-neutral-900 to-black',
    coastal: 'from-cyan-950 via-slate-900 to-black',
    mountain: 'from-emerald-950 via-stone-900 to-black',
    cyber_neon: 'from-purple-950 via-neutral-950 to-black',
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white font-sans select-none overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Dynamic Animated Environment Perspective Canvas / Horizon */}
      <div className={`absolute inset-0 bg-gradient-to-b ${envStyles[environment]} opacity-90 transition-colors duration-700`} />

      {/* Moving road lines perspective effect */}
      <div className="absolute inset-0 opacity-25 pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-48 sm:w-80 h-96 bg-gradient-to-t from-primary/30 to-transparent clip-path-trapezoid animate-pulse" />
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-1 h-72 bg-primary/60 border-l border-dashed border-primary animate-pulse" />
      </div>

      {/* Top Floating Action HUD */}
      <div className="relative z-10 flex h-16 items-center justify-between px-4 sm:px-6 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
            <HeartPulse className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black uppercase tracking-wider text-white">
                {isAr ? (config.type === 'treadmill_incline' ? 'مشاية بميل' : config.type === 'stationary_bike' ? 'دراجة ثابتة' : 'مشي ونشاط خارجي') : config.type.replace('_', ' ')}
              </span>
              {gpsActive && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
                  <Navigation className="h-3 w-3" />
                  <span>GPS</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400">
              {config.intensity === 'zone2_fat_loss' ? 'Zone 2 Lipolysis' : 'High Performance'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Environment Switcher */}
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
            {(['sunset', 'coastal', 'mountain', 'cyber_neon'] as const).map(env => (
              <button
                key={env}
                onClick={() => setEnvironment(env)}
                className={`h-7 px-2 text-[10px] font-bold rounded-lg uppercase transition-all ${
                  environment === env ? 'bg-primary text-primary-foreground shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {env.split('_')[0]}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-xl p-2 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5" />}
          </button>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Motivational Interval Pop-up Banner */}
      <AnimatePresence>
        {activeMotivation && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-20 mx-4 mt-3 rounded-2xl border border-primary/40 bg-black/80 p-3.5 text-center shadow-xl backdrop-blur-md"
          >
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-primary">
              <Sparkles className="h-4 w-4 fill-current animate-spin" />
              <span>{activeMotivation}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Portrait HUD Grid */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar flex flex-col justify-between max-w-xl mx-auto w-full">
        {/* Giant Main Timer & Progress Display */}
        <div className="my-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-bold text-neutral-300">
            <Timer className="h-3.5 w-3.5 text-primary" />
            <span>{progressPercent}% {isAr ? 'مكتمل' : 'COMPLETE'}</span>
            <span>•</span>
            <span className="text-primary font-mono">
              {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')} {isAr ? 'متبقي' : 'REMAINING'}
            </span>
          </div>

          {/* Glowing Timer */}
          <div className="font-mono text-6xl sm:text-8xl font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.15)]">
            {Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
          </div>

          {/* Progress Ring / Bar */}
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden max-w-md mx-auto">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_10px_rgba(var(--primary),0.8)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 4-Cell Telemetry HUD Metrics */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 my-4">
          {/* Distance */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm space-y-1">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>{isAr ? 'المسافة' : 'Distance'}</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-white">
              {displayDistance.toFixed(2)}
            </div>
            <div className="text-[10px] font-bold text-neutral-400 uppercase">{distanceUnitLabel}</div>
          </div>

          {/* Calories Burned */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm space-y-1">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span>{isAr ? 'السعرات المحروقة' : 'Calories'}</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-amber-400">
              {caloriesBurned}
            </div>
            <div className="text-[10px] font-bold text-neutral-400 uppercase">kcal est.</div>
          </div>

          {/* Speed & Speed Adjuster */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm space-y-1">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <Gauge className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isAr ? 'السرعة' : 'Speed'}</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">
              {displaySpeed.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setCurrentSpeedKmh(prev => Math.max(1, +(prev - 0.2).toFixed(1)))}
                className="h-6 w-6 rounded bg-white/10 text-xs font-bold hover:bg-white/20"
              >
                -
              </button>
              <span className="text-[10px] font-bold text-neutral-400 uppercase">{speedUnitLabel}</span>
              <button
                onClick={() => setCurrentSpeedKmh(prev => +(prev + 0.2).toFixed(1))}
                className="h-6 w-6 rounded bg-white/10 text-xs font-bold hover:bg-white/20"
              >
                +
              </button>
            </div>
          </div>

          {/* Pace */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm space-y-1">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
              <span>{isAr ? 'معدل السرعة' : 'Pace'}</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-cyan-400">
              {paceFormatted}
            </div>
            <div className="text-[10px] font-bold text-neutral-400 uppercase">min / {distanceUnitLabel}</div>
          </div>
        </div>

        {/* Incline Control (Treadmill Only) */}
        {config.type === 'treadmill_incline' && (
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-3 mb-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
              <Mountain className="h-4 w-4 text-amber-400" />
              <span>{isAr ? 'درجة الميل (Incline)' : 'Incline Level'}:</span>
              <span className="text-base font-black text-amber-400 font-mono">{currentIncline}%</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIncline(prev => Math.max(0, prev - 1))}
                className="rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-bold hover:bg-white/20"
              >
                -1%
              </button>
              <button
                onClick={() => setCurrentIncline(prev => Math.min(15, prev + 1))}
                className="rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-bold hover:bg-white/20"
              >
                +1%
              </button>
            </div>
          </div>
        )}

        {/* Bottom Control Bar */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {/* Pause / Resume Button */}
          <button
            id="btn-pause-cardio-session"
            onClick={() => setIsRunning(!isRunning)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black transition-all ${
              isRunning
                ? 'border border-amber-500/40 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                : 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
            }`}
          >
            {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
            <span>{isRunning ? (isAr ? 'إيقاف مؤقت' : 'Pause Session') : (isAr ? 'استئناف الكارديو' : 'Resume Session')}</span>
          </button>

          {/* Finish Button */}
          <button
            id="btn-finish-cardio-session"
            onClick={handleFinishSession}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all"
          >
            <Trophy className="h-5 w-5" />
            <span>{isAr ? 'إنهاء وحفظ الجلسة' : 'Finish & Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
