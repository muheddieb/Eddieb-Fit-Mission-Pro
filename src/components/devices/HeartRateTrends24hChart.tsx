import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  Area,
  ComposedChart
} from 'recharts';
import {
  Heart,
  Activity,
  TrendingUp,
  Clock,
  Flame,
  Moon,
  Zap,
  RefreshCw,
  Watch,
  Info,
  Sliders,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { UserProfile, HeartRate24hPoint, HeartRateZone } from '../../types';
import { BluetoothHealthService } from '../../services/bluetoothHealthService';
import { translations } from '../../i18n/translations';

interface HeartRateTrends24hChartProps {
  profile: UserProfile;
  isArabic?: boolean;
  onRefresh?: () => void;
}

type FilterView = 'all' | 'workouts' | 'recovery';

const ZONE_COLORS: Record<HeartRateZone, { text: string; bg: string; border: string; hex: string }> = {
  1: { text: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', hex: '#60a5fa' },
  2: { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', hex: '#34d399' },
  3: { text: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30', hex: '#22d3ee' },
  4: { text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', hex: '#fbbf24' },
  5: { text: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30', hex: '#f43f5e' },
};

export const HeartRateTrends24hChart: React.FC<HeartRateTrends24hChartProps> = ({
  profile,
  isArabic = false,
  onRefresh,
}) => {
  const isAr = isArabic || profile.language === 'ar';
  const t = translations[profile.language || 'en'];

  const [data, setData] = useState<HeartRate24hPoint[]>([]);
  const [filterView, setFilterView] = useState<FilterView>('all');
  const [showZones, setShowZones] = useState<boolean>(true);
  const [showRestingLine, setShowRestingLine] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const userAge = profile.age || 41;
  const maxHeartRate = 220 - userAge;
  const zone2Threshold = Math.round(maxHeartRate * 0.60);
  const zone3Threshold = Math.round(maxHeartRate * 0.70);
  const zone4Threshold = Math.round(maxHeartRate * 0.80);
  const zone5Threshold = Math.round(maxHeartRate * 0.90);

  // Load trend data
  const loadTrendData = () => {
    const trend = BluetoothHealthService.get24HourHeartRateTrend(userAge);
    setData(trend);
  };

  useEffect(() => {
    loadTrendData();

    // Subscribe to live telemetry so the chart automatically reacts if user is exercising or measuring
    const unsub = BluetoothHealthService.subscribeTelemetry(() => {
      loadTrendData();
    });

    return () => unsub();
  }, [userAge]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadTrendData();
      setIsRefreshing(false);
      if (onRefresh) onRefresh();
    }, 400);
  };

  // Computed summary metrics
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        currentHr: 72,
        minHr: 54,
        maxHr: 168,
        avgHr: 76,
        avgHrv: 58,
        timeInZ2Plus: 125,
        restAvg: 58,
      };
    }

    const hrValues = data.map(d => d.heartRate);
    const hrvValues = data.filter(d => d.hrvRmssd).map(d => d.hrvRmssd as number);
    const currentHr = data[data.length - 1]?.heartRate || 72;
    const minHr = Math.min(...hrValues);
    const maxHr = Math.max(...hrValues);
    const avgHr = Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length);
    const avgHrv = hrvValues.length > 0 ? Math.round(hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length) : 56;
    const workoutPoints = data.filter(d => d.isWorkout).length;
    const sleepPoints = data.filter(d => d.isSleep);
    const restAvg = sleepPoints.length > 0
      ? Math.round(sleepPoints.reduce((acc, p) => acc + p.heartRate, 0) / sleepPoints.length)
      : minHr;

    return {
      currentHr,
      minHr,
      maxHr,
      avgHr,
      avgHrv,
      timeInZ2Plus: workoutPoints * 60,
      restAvg,
    };
  }, [data]);

  // Filtered chart data for highlight views
  const chartData = useMemo(() => {
    return data.map(pt => {
      let isHighlighted = true;
      if (filterView === 'workouts') {
        isHighlighted = pt.isWorkout || pt.heartRate >= zone2Threshold;
      } else if (filterView === 'recovery') {
        isHighlighted = pt.isSleep || pt.heartRate < zone2Threshold;
      }

      return {
        ...pt,
        displayHeartRate: isHighlighted ? pt.heartRate : null,
      };
    });
  }, [data, filterView, zone2Threshold]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const pt: HeartRate24hPoint = payload[0]?.payload;
    if (!pt) return null;

    const zoneColor = ZONE_COLORS[pt.zone] || ZONE_COLORS[1];

    return (
      <div className="rounded-2xl border border-border/80 bg-popover/95 p-4 shadow-2xl backdrop-blur-md text-xs space-y-2.5 min-w-[220px] max-w-xs animate-in fade-in duration-150">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>{pt.timeLabel === 'Now' ? (isAr ? 'الآن (مباشر)' : 'Now (Live)') : pt.timeLabel}</span>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${zoneColor.bg} ${zoneColor.text} border ${zoneColor.border}`}>
            {isAr ? pt.zoneNameAr.split(':')[0] : `Zone ${pt.zone}`}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <Heart className="h-4 w-4 text-rose-500 fill-rose-500 self-center animate-pulse" />
            <span className="text-2xl font-black text-foreground font-mono">{pt.heartRate}</span>
            <span className="text-[11px] font-bold text-muted-foreground">BPM</span>
          </div>
          {pt.hrvRmssd && (
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block">HRV</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">{pt.hrvRmssd} ms</span>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-secondary/50 p-2.5 space-y-1">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            {pt.isSleep ? (
              <Moon className="h-3.5 w-3.5 text-indigo-400" />
            ) : pt.isWorkout ? (
              <Zap className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Activity className="h-3.5 w-3.5 text-sky-400" />
            )}
            <span>{isAr ? pt.activityAr : pt.activityEn}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
            <span>Range: {pt.minHr} - {pt.maxHr} BPM</span>
            <span>Rest Base: {pt.restingHr} BPM</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 border-t border-border/40">
          <span className="flex items-center gap-1 truncate">
            <Watch className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate">{pt.source}</span>
          </span>
          <span className="text-emerald-400 font-medium">Synced</span>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
      {/* Header with Title and Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 text-white shadow-md shadow-rose-500/20">
            <Heart className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-foreground">
                {isAr ? 'منحنى معدل ضربات القلب خلال 24 ساعة' : '24-Hour Heart Rate Trend & Zones'}
              </h3>
              <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-rose-400 border border-rose-500/30">
                {isAr ? 'بيانات متزامنة' : 'Device Synced'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {isAr
                ? 'تتبع بيومتري دقيق على مدار الـ 24 ساعة الماضية مسحوب من حساسات ساعة وسوار البلوتوث.'
                : 'Continuous 24-hour cardiac telemetry synced from paired optical & ECG wearable sensors.'}
            </p>
          </div>
        </div>

        {/* View Mode Pills & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl bg-secondary/50 p-1 border border-border">
            <button
              type="button"
              onClick={() => setFilterView('all')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                filterView === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'الكل (24س)' : 'All 24h'}
            </button>
            <button
              type="button"
              onClick={() => setFilterView('workouts')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                filterView === 'workouts'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'التمارين والجهد' : 'Workouts'}
            </button>
            <button
              type="button"
              onClick={() => setFilterView('recovery')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                filterView === 'recovery'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'النوم والاستشفاء' : 'Recovery & Sleep'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/40 hover:bg-secondary text-foreground p-2 text-xs font-bold transition-all disabled:opacity-50"
            title={isAr ? 'تحديث ومزامنة البيانات' : 'Refresh Telemetry'}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Stat Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Stat 1: Current / Live HR */}
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-bold text-rose-300 uppercase">
            <span>{isAr ? 'النبض الحالي' : 'Current / Latest'}</span>
            <Heart className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono flex items-baseline gap-1">
            <span>{stats.currentHr}</span>
            <span className="text-xs font-semibold text-muted-foreground">BPM</span>
          </div>
          <div className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
            <span>{BluetoothHealthService.getStatus() === 'connected' ? (isAr ? 'مباشر من الحساس' : 'Live BLE Feed') : (isAr ? 'آخر قراءة مسجلة' : 'Last Synced')}</span>
          </div>
        </div>

        {/* Stat 2: 24h Resting Baseline */}
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-sky-300 uppercase">
            <span>{isAr ? 'نبض الراحة والأدنى' : '24h Resting Min'}</span>
            <Moon className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono flex items-baseline gap-1">
            <span>{stats.minHr}</span>
            <span className="text-xs font-semibold text-muted-foreground">BPM</span>
          </div>
          <div className="text-[10px] text-sky-400 font-medium">
            {isAr ? `متوسط النوم: ${stats.restAvg} BPM` : `Sleep Avg: ${stats.restAvg} BPM`}
          </div>
        </div>

        {/* Stat 3: 24h Peak Heart Rate */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 uppercase">
            <span>{isAr ? 'أعلى نبض (Peak)' : '24h Peak HR'}</span>
            <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono flex items-baseline gap-1">
            <span>{stats.maxHr}</span>
            <span className="text-xs font-semibold text-muted-foreground">BPM</span>
          </div>
          <div className="text-[10px] text-amber-400 font-medium">
            {isAr ? `المنطقة ${BluetoothHealthService.calculateZone(stats.maxHr, userAge)}: جهد مرتفع` : `Zone ${BluetoothHealthService.calculateZone(stats.maxHr, userAge)} High Output`}
          </div>
        </div>

        {/* Stat 4: Average Daily HR & HRV */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300 uppercase">
            <span>{isAr ? 'المتوسط و HRV' : 'Average & HRV'}</span>
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono flex items-baseline gap-1">
            <span>{stats.avgHr}</span>
            <span className="text-xs font-semibold text-muted-foreground">BPM</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">
            HRV RMSSD: {stats.avgHrv} ms
          </div>
        </div>
      </div>

      {/* Main Recharts Line Chart Container */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span>{isAr ? 'معدل النبض (BPM)' : 'Heart Rate (BPM)'}</span>
            </span>
            {showRestingLine && (
              <span className="flex items-center gap-1.5 font-medium text-sky-400">
                <span className="h-0.5 w-3 bg-sky-400 border-b border-dashed border-sky-400" />
                <span>{isAr ? 'خط الراحة (60 BPM)' : 'Resting Baseline (60 BPM)'}</span>
              </span>
            )}
          </div>

          {/* Chart Display Toggles */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowZones(!showZones)}
              className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-all border ${
                showZones
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-border bg-secondary/30 text-muted-foreground'
              }`}
            >
              {isAr ? 'إظهار نطاقات المناطق' : 'Target Zone Bands'}
            </button>

            <button
              type="button"
              onClick={() => setShowRestingLine(!showRestingLine)}
              className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-all border ${
                showRestingLine
                  ? 'border-sky-500/40 bg-sky-500/10 text-sky-400'
                  : 'border-border bg-secondary/30 text-muted-foreground'
              }`}
            >
              {isAr ? 'خط الأساس' : 'Resting Line'}
            </button>
          </div>
        </div>

        {/* The Recharts Responsive Canvas */}
        <div className="h-72 sm:h-80 w-full rounded-2xl border border-border/80 bg-background/50 p-2 sm:p-4 backdrop-blur-sm">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
            >
              <defs>
                <linearGradient id="hrAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="60%" stopColor="#f43f5e" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hrLineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="40%" stopColor="#34d399" />
                  <stop offset="70%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-border/40"
                vertical={false}
              />

              <XAxis
                dataKey="timeLabel"
                stroke="currentColor"
                className="text-[10px] text-muted-foreground font-mono"
                tickLine={false}
                axisLine={false}
                dy={8}
                interval="preserveStartEnd"
              />

              <YAxis
                domain={[45, Math.max(180, maxHeartRate)]}
                stroke="currentColor"
                className="text-[10px] text-muted-foreground font-mono"
                tickLine={false}
                axisLine={false}
                dx={-4}
                ticks={[50, 70, 90, 115, 140, 165, 185]}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Target Heart Rate Zones Colored Reference Areas (if enabled) */}
              {showZones && (
                <>
                  {/* Zone 2 Fat Burn Band */}
                  <ReferenceArea
                    y1={zone2Threshold}
                    y2={zone3Threshold}
                    {...({ fill: '#34d399', fillOpacity: 0.06, strokeOpacity: 0 } as any)}
                  />
                  {/* Zone 4 Anaerobic / Heavy Lifting Band */}
                  <ReferenceArea
                    y1={zone4Threshold}
                    y2={zone5Threshold}
                    {...({ fill: '#fbbf24', fillOpacity: 0.07, strokeOpacity: 0 } as any)}
                  />
                  {/* Peak Zone 5 */}
                  <ReferenceArea
                    y1={zone5Threshold}
                    y2={maxHeartRate}
                    {...({ fill: '#f43f5e', fillOpacity: 0.09, strokeOpacity: 0 } as any)}
                  />
                </>
              )}

              {/* Resting HR Baseline Reference Line */}
              {showRestingLine && (
                <ReferenceLine
                  y={60}
                  stroke="#38bdf8"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: isAr ? 'خط الراحة 60' : 'Rest 60',
                    position: 'insideBottomRight',
                    fill: '#38bdf8',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                />
              )}

              {/* Zone 2 Fat Burn Boundary Line */}
              {showZones && (
                <ReferenceLine
                  y={zone2Threshold}
                  stroke="#34d399"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                  label={{
                    value: isAr ? `Z2 حرق دهون (${zone2Threshold})` : `Z2 Fat Burn (${zone2Threshold})`,
                    position: 'insideTopLeft',
                    fill: '#34d399',
                    fontSize: 9,
                  }}
                />
              )}

              {/* Subtle Area Fill for Atmosphere */}
              <Area
                type="monotone"
                dataKey="displayHeartRate"
                stroke="none"
                fill="url(#hrAreaGradient)"
                isAnimationActive={false}
              />

              {/* Primary 24-Hour Heart Rate Line */}
              <Line
                type="monotone"
                dataKey="displayHeartRate"
                stroke="#f43f5e"
                strokeWidth={2.8}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!cx || !cy || !payload) return <circle key={`dot-empty-${Math.random()}`} />;
                  if (payload.isWorkout || payload.heartRate >= zone3Threshold) {
                    return (
                      <circle
                        key={`dot-${payload.timestamp}`}
                        cx={cx}
                        cy={cy}
                        r={4.5}
                        fill="#f43f5e"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        className="animate-pulse"
                      />
                    );
                  }
                  if (payload.timeLabel === 'Now') {
                    return (
                      <circle
                        key="dot-now"
                        cx={cx}
                        cy={cy}
                        r={5.5}
                        fill="#f43f5e"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    );
                  }
                  return <circle key={`dot-${payload.timestamp}`} cx={cx} cy={cy} r={1.5} fill="#f43f5e" opacity={0.6} />;
                }}
                activeDot={{
                  r: 7,
                  fill: '#f43f5e',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  className: 'shadow-lg shadow-rose-500/50',
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heart Rate Zones Legend and Physiological Guide */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-border/70 text-xs">
        {([1, 2, 3, 4, 5] as HeartRateZone[]).map((zoneNum) => {
          const zc = ZONE_COLORS[zoneNum];
          const minBpm = zoneNum === 1 ? 50 : zoneNum === 2 ? zone2Threshold : zoneNum === 3 ? zone3Threshold : zoneNum === 4 ? zone4Threshold : zone5Threshold;
          const maxBpm = zoneNum === 1 ? zone2Threshold - 1 : zoneNum === 2 ? zone3Threshold - 1 : zoneNum === 3 ? zone4Threshold - 1 : zoneNum === 4 ? zone5Threshold - 1 : maxHeartRate;

          const namesEn = ['Recovery', 'Fat Burn (Zone 2)', 'Aerobic Tempo', 'Threshold & Lifts', 'Peak Output'];
          const namesAr = ['استشفاء وإحماء', 'حرق الدهون (Z2)', 'كارديو هوائي', 'عتبة اللاكتات والحديد', 'أقصى طاقة'];

          return (
            <div
              key={zoneNum}
              className={`rounded-xl border ${zc.border} ${zc.bg} p-2.5 space-y-1`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase ${zc.text}`}>
                  Zone {zoneNum}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {minBpm}-{maxBpm}
                </span>
              </div>
              <div className="font-bold text-foreground text-[11px] truncate">
                {isAr ? namesAr[zoneNum - 1] : namesEn[zoneNum - 1]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
