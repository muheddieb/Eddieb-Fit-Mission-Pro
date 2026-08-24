import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  Cell,
} from 'recharts';
import {
  Moon,
  TrendingUp,
  Dumbbell,
  Sparkles,
  Zap,
  Activity,
  Heart,
  Calendar,
  Layers,
  Award,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Flame,
  Info,
  Clock,
  Check
} from 'lucide-react';
import { 
  SleepLog, 
  WorkoutSession, 
  UserProfile, 
  SleepWorkoutCorrelationPoint 
} from '../../types';
import { SleepCorrelationEngine } from '../../services/sleepCorrelationEngine';
import { StorageService } from '../../services/storage';

interface SleepPerformanceCorrelationChartProps {
  sleepLogs: SleepLog[];
  workoutHistory: WorkoutSession[];
  profile: UserProfile;
  onOpenLogger: (log?: SleepLog) => void;
  onRefresh: () => void;
  isAr?: boolean;
}

type ChartView = 'volume_vs_duration' | 'rpe_vs_quality' | 'biometrics_matrix';

export const SleepPerformanceCorrelationChart: React.FC<SleepPerformanceCorrelationChartProps> = ({
  sleepLogs,
  workoutHistory,
  profile,
  onOpenLogger,
  onRefresh,
  isAr = false,
}) => {
  const [chartView, setChartView] = useState<ChartView>('volume_vs_duration');
  const [selectedPoint, setSelectedPoint] = useState<SleepWorkoutCorrelationPoint | null>(null);

  const correlation = useMemo(() => {
    return SleepCorrelationEngine.analyzeCorrelation(sleepLogs, workoutHistory);
  }, [sleepLogs, workoutHistory]);

  const { points, summary } = correlation;

  const handleDeleteLog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(isAr ? 'هل أنت متأكد من حذف سجل النوم هذا؟' : 'Are you sure you want to delete this sleep log?')) {
      StorageService.deleteSleepLog(id);
      onRefresh();
    }
  };

  // Custom Tooltip for Volume vs Duration
  const CustomCorrelationTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const pt: SleepWorkoutCorrelationPoint = payload[0]?.payload;
    if (!pt) return null;

    return (
      <div className="rounded-2xl border border-border/80 bg-popover/95 p-4 shadow-2xl backdrop-blur-md text-xs space-y-3 min-w-[260px] max-w-sm">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{isAr ? pt.displayDateAr : pt.displayDate}</span>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
            pt.sleepDurationHours >= 7.5 && pt.sleepQualityScore >= 85
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : pt.sleepDeficit
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
          }`}>
            {pt.sleepDurationHours >= 7.5 ? (isAr ? 'نوم مثالي' : 'Optimal Sleep') : (isAr ? 'نوم قليل' : 'Sleep Deficit')}
          </span>
        </div>

        {/* Sleep Biometrics */}
        <div className="space-y-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 p-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-purple-300 font-bold flex items-center gap-1">
              <Moon className="h-3.5 w-3.5" />
              <span>{isAr ? 'النوم والاستشفاء:' : 'Sleep Telemetry:'}</span>
            </span>
            <span className="font-mono font-black text-purple-300">
              {pt.sleepDurationHours}h • {pt.sleepQualityScore}% {isAr ? 'جودة' : 'Score'}
            </span>
          </div>
          {pt.deepSleepMinutes && (
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{isAr ? 'نوم عميق / أحلام:' : 'Deep / REM:'}</span>
              <span className="font-mono">{pt.deepSleepMinutes}m / {pt.remSleepMinutes}m</span>
            </div>
          )}
          {pt.restingHeartRateBpm && (
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{isAr ? 'النبض / HRV:' : 'RHR / HRV:'}</span>
              <span className="font-mono">{pt.restingHeartRateBpm} bpm / {pt.hrvRmssdMs} ms</span>
            </div>
          )}
        </div>

        {/* Workout Performance Outcome */}
        {pt.hasWorkout ? (
          <div className="space-y-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Dumbbell className="h-3.5 w-3.5" />
                <span className="truncate max-w-[140px]">{isAr ? pt.workoutNameAr || pt.workoutName : pt.workoutName}</span>
              </span>
              <span className="font-mono font-black text-emerald-400">
                {pt.workoutVolumeTons} Tons
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{isAr ? 'إجمالي الحجم / المجموعات:' : 'Volume / Sets:'}</span>
              <span className="font-mono font-bold text-foreground">
                {pt.workoutVolumeKg?.toLocaleString()} kg ({pt.completedSets} sets)
              </span>
            </div>
            {pt.avgWorkoutRpe && (
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{isAr ? 'متوسط الجهد (RPE):' : 'Avg Workout RPE:'}</span>
                <span className="font-mono font-bold text-amber-400">{pt.avgWorkoutRpe} / 10</span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-secondary/40 p-2 text-center text-[11px] text-muted-foreground">
            {isAr ? 'يوم راحة استشفائي (Rest Day)' : 'Active Rest & Recovery Day'}
          </div>
        )}

        {pt.notes && (
          <p className="text-[10px] text-muted-foreground italic border-t border-border/40 pt-1.5">
            "{pt.notes}"
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6" id="section-sleep-quality-correlation">
      {/* Header with Title and Action Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 text-white shadow-md shadow-purple-500/20">
            <Moon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-foreground">
                {isAr ? 'مؤشر جودة النوم وارتباطه المباشر بالأداء التدريبي' : 'Sleep Quality & Workout Performance Correlation'}
              </h3>
              <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-purple-300 border border-purple-500/30">
                {isAr ? summary.correlationStrengthAr : `${summary.correlationStrength.toUpperCase()} CORRELATION`}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {isAr
                ? 'تحليل بيولوجي دقيق يربط عمق وساعات النوم بالأحمال الميكانيكية المرفوعة والجهد العصبي (RPE).'
                : 'Scientific correlation model demonstrating how sleep duration & quality directly drive hypertrophy volume and RPE resilience.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Chart View Switcher */}
          <div className="flex items-center rounded-xl bg-secondary/50 p-1 border border-border">
            <button
              type="button"
              id="btn-view-vol-duration"
              onClick={() => setChartView('volume_vs_duration')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                chartView === 'volume_vs_duration'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'الحجم vs ساعات النوم' : 'Volume vs Sleep (h)'}
            </button>
            <button
              type="button"
              id="btn-view-rpe-quality"
              onClick={() => setChartView('rpe_vs_quality')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                chartView === 'rpe_vs_quality'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'مؤشر RPE vs الجودة' : 'RPE vs Quality Score'}
            </button>
            <button
              type="button"
              id="btn-view-biometrics"
              onClick={() => setChartView('biometrics_matrix')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                chartView === 'biometrics_matrix'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'القياسات الحيوية (HRV)' : 'Biometrics Matrix'}
            </button>
          </div>

          {/* Log Sleep Button */}
          <button
            type="button"
            id="btn-open-log-sleep"
            onClick={() => onOpenLogger()}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:from-purple-500 hover:to-indigo-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>{isAr ? 'تسجيل نوم جديد' : 'Log Sleep'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Correlation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Card 1: Volume Boost */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300 uppercase">
            <span>{isAr ? 'فارق الحجم التدريبي' : 'Volume Tonnage Boost'}</span>
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono flex items-baseline gap-1">
            <span>+{summary.volumeBoostOnOptimalSleepPercent}%</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">
            {isAr ? 'عند النوم ≥ 7.5 ساعة مقابل النوم القصير' : 'When sleep ≥7.5h vs sub-7h nights'}
          </div>
        </div>

        {/* Card 2: Average Sleep Duration */}
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-300 uppercase">
            <span>{isAr ? 'متوسط ساعات النوم' : 'Avg Sleep Duration'}</span>
            <Moon className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono flex items-baseline gap-1">
            <span>{summary.avgSleepDurationHours}</span>
            <span className="text-xs font-semibold text-muted-foreground">{isAr ? 'ساعات' : 'Hours'}</span>
          </div>
          <div className="text-[10px] text-purple-300 font-medium">
            {isAr ? `متوسط الجودة: ${summary.avgQualityScore}%` : `Avg Quality: ${summary.avgQualityScore}%`}
          </div>
        </div>

        {/* Card 3: CNS Fatigue Shield */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 uppercase">
            <span>{isAr ? 'فارق إجهاد RPE' : 'RPE Fatigue Strain'}</span>
            <Zap className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono flex items-baseline gap-1">
            <span>+{summary.rpeFatigueDiffOnShortSleep > 0 ? summary.rpeFatigueDiffOnShortSleep : 0.9}</span>
            <span className="text-xs font-semibold text-muted-foreground">RPE</span>
          </div>
          <div className="text-[10px] text-amber-400 font-medium">
            {isAr ? 'إجهاد زائد على نفس الأوزان عند قلة النوم' : 'Extra strain under sleep deprivation'}
          </div>
        </div>

        {/* Card 4: Optimal Sleep Sweet Spot */}
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-sky-300 uppercase">
            <span>{isAr ? 'المدى المثالي للأداء' : 'Prime Sleep Window'}</span>
            <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground font-mono flex items-baseline gap-1">
            <span>{isAr ? summary.optimalSleepRangeAr : summary.optimalSleepRange}</span>
          </div>
          <div className="text-[10px] text-sky-400 font-medium">
            {isAr ? `متوسط HRV: ${summary.avgHrv}ms` : `Avg HRV: ${summary.avgHrv}ms RMSSD`}
          </div>
        </div>
      </div>

      {/* Main Dual-Axis Recharts Canvas */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 text-muted-foreground">
            {chartView === 'volume_vs_duration' ? (
              <>
                <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>{isAr ? 'الحجم التدريبي المرفوع (طن)' : 'Workout Volume (Tons)'}</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium text-purple-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
                  <span>{isAr ? 'ساعات النوم (Sleep Hours)' : 'Sleep Duration (Hours)'}</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium text-purple-300/70">
                  <span className="h-0.5 w-3 bg-purple-400 border-b border-dashed border-purple-400" />
                  <span>{isAr ? 'الحد الأدنى للاستشفاء (7.5h)' : 'Optimal Threshold (7.5h)'}</span>
                </span>
              </>
            ) : chartView === 'rpe_vs_quality' ? (
              <>
                <span className="flex items-center gap-1.5 font-medium text-rose-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span>{isAr ? 'متوسط شدة التمرين (RPE)' : 'Avg Workout RPE'}</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium text-teal-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-400" />
                  <span>{isAr ? 'مؤشر جودة النوم (0-100%)' : 'Sleep Quality Score (%)'}</span>
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 font-medium text-sky-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                  <span>{isAr ? 'الاستشفاء العصبي (HRV ms)' : 'HRV (ms RMSSD)'}</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium text-indigo-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
                  <span>{isAr ? 'دقائق النوم العميق (Deep Min)' : 'Deep Sleep (min)'}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* The Recharts Container */}
        <div className="h-72 sm:h-80 w-full rounded-2xl border border-border/80 bg-background/50 p-2 sm:p-4 backdrop-blur-sm">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'volume_vs_duration' ? (
              <ComposedChart
                data={points}
                margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="sleepDurationArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false} />
                <XAxis 
                  dataKey={isAr ? "displayDateAr" : "displayDate"} 
                  stroke="currentColor" 
                  className="text-[10px] text-muted-foreground font-mono" 
                  tickLine={false} 
                  axisLine={false} 
                  dy={8} 
                />

                {/* Left Y-Axis: Workout Volume in Tons */}
                <YAxis
                  yAxisId="left"
                  stroke="currentColor"
                  className="text-[10px] text-emerald-400 font-mono"
                  tickLine={false}
                  axisLine={false}
                  dx={-4}
                  unit="T"
                  domain={[0, 18]}
                />

                {/* Right Y-Axis: Sleep Duration in Hours */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="currentColor"
                  className="text-[10px] text-purple-400 font-mono"
                  tickLine={false}
                  axisLine={false}
                  dx={4}
                  unit="h"
                  domain={[4, 11]}
                />

                <Tooltip content={<CustomCorrelationTooltip />} />

                {/* Reference Line for 7.5h optimal sleep */}
                <ReferenceLine
                  yAxisId="right"
                  y={7.5}
                  stroke="#a855f7"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />

                {/* Workout Volume Bars */}
                <Bar
                  yAxisId="left"
                  dataKey="workoutVolumeTons"
                  name={isAr ? 'حجم التمرين (طن)' : 'Workout Volume (Tons)'}
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                >
                  {points.map((entry, index) => (
                    <Cell
                      key={`cell-vol-${index}`}
                      fill={
                        entry.sleepDurationHours >= 7.5
                          ? '#10b981'
                          : entry.sleepDeficit
                          ? '#f59e0b'
                          : '#059669'
                      }
                    />
                  ))}
                </Bar>

                {/* Sleep Duration Line & Area */}
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="sleepDurationHours"
                  stroke="none"
                  fill="url(#sleepDurationArea)"
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="sleepDurationHours"
                  stroke="#a855f7"
                  strokeWidth={3}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (!cx || !cy || !payload) return <circle key={`dot-empty-${Math.random()}`} />;
                    return (
                      <circle
                        key={`slp-dot-${payload.date}`}
                        cx={cx}
                        cy={cy}
                        r={payload.sleepDurationHours >= 7.5 ? 5 : 4}
                        fill={payload.sleepDurationHours >= 7.5 ? '#c084fc' : '#f43f5e'}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                    );
                  }}
                  activeDot={{
                    r: 7,
                    fill: '#c084fc',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              </ComposedChart>
            ) : chartView === 'rpe_vs_quality' ? (
              <ComposedChart
                data={points}
                margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false} />
                <XAxis dataKey={isAr ? "displayDateAr" : "displayDate"} stroke="currentColor" className="text-[10px] text-muted-foreground font-mono" tickLine={false} axisLine={false} dy={8} />

                {/* Left Y-Axis: RPE */}
                <YAxis
                  yAxisId="rpeAxis"
                  stroke="currentColor"
                  className="text-[10px] text-rose-400 font-mono"
                  tickLine={false}
                  axisLine={false}
                  dx={-4}
                  domain={[6, 10]}
                />

                {/* Right Y-Axis: Quality Score */}
                <YAxis
                  yAxisId="qualityAxis"
                  orientation="right"
                  stroke="currentColor"
                  className="text-[10px] text-teal-400 font-mono"
                  tickLine={false}
                  axisLine={false}
                  dx={4}
                  unit="%"
                  domain={[50, 100]}
                />

                <Tooltip content={<CustomCorrelationTooltip />} />

                {/* Quality Score Bar/Area */}
                <Bar
                  yAxisId="qualityAxis"
                  dataKey="sleepQualityScore"
                  name={isAr ? 'جودة النوم %' : 'Sleep Quality %'}
                  fill="#14b8a6"
                  opacity={0.7}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />

                {/* RPE Line */}
                <Line
                  yAxisId="rpeAxis"
                  type="monotone"
                  dataKey="avgWorkoutRpe"
                  stroke="#f43f5e"
                  strokeWidth={2.8}
                  dot={{ r: 4, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 1.5 }}
                  name={isAr ? 'متوسط RPE' : 'Avg RPE'}
                />
              </ComposedChart>
            ) : (
              /* Mode 3: Biometrics Matrix (HRV & Deep Sleep) */
              <ComposedChart
                data={points}
                margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false} />
                <XAxis dataKey={isAr ? "displayDateAr" : "displayDate"} stroke="currentColor" className="text-[10px] text-muted-foreground font-mono" tickLine={false} axisLine={false} dy={8} />

                <YAxis
                  yAxisId="hrvAxis"
                  stroke="currentColor"
                  className="text-[10px] text-sky-400 font-mono"
                  tickLine={false}
                  axisLine={false}
                  dx={-4}
                  unit="ms"
                  domain={[30, 90]}
                />

                <YAxis
                  yAxisId="deepAxis"
                  orientation="right"
                  stroke="currentColor"
                  className="text-[10px] text-indigo-400 font-mono"
                  tickLine={false}
                  axisLine={false}
                  dx={4}
                  unit="m"
                  domain={[30, 160]}
                />

                <Tooltip content={<CustomCorrelationTooltip />} />

                <Bar
                  yAxisId="deepAxis"
                  dataKey="deepSleepMinutes"
                  name={isAr ? 'دقائق النوم العميق' : 'Deep Sleep (min)'}
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />

                <Line
                  yAxisId="hrvAxis"
                  type="monotone"
                  dataKey="hrvRmssdMs"
                  stroke="#38bdf8"
                  strokeWidth={2.8}
                  dot={{ r: 4, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 1.5 }}
                  name={isAr ? 'الاستشفاء العصبي (HRV)' : 'HRV (ms)'}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scientific Bio-Feedback Insights Cards */}
      <div className="space-y-3 pt-2 border-t border-border/80">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <h4 className="text-sm font-bold text-foreground">
            {isAr ? 'الاستنتاجات الفسيولوجية والتوجيهات البيولوجية' : 'Physiological Bio-Feedback & Performance Insights'}
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {summary.bioInsights.map((insight, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border p-4 space-y-2 transition-all ${
                insight.impact === 'positive'
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : insight.impact === 'warning'
                  ? 'border-amber-500/30 bg-amber-500/10'
                  : 'border-purple-500/30 bg-purple-500/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  insight.impact === 'positive'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : insight.impact === 'warning'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {insight.impact === 'positive' && <TrendingUp className="h-4 w-4" />}
                  {insight.impact === 'warning' && <Zap className="h-4 w-4" />}
                  {insight.impact === 'info' && <Heart className="h-4 w-4" />}
                </div>
                <h5 className="text-xs font-bold text-foreground leading-tight">
                  {isAr ? insight.titleAr : insight.title}
                </h5>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {isAr ? insight.descAr : insight.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Chronological Sleep vs Workout Audit Log List */}
      <div className="rounded-2xl border border-border bg-secondary/20 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
              {isAr ? 'سجل مقارنة النوم مع نتائج التمارين اليومية' : 'Sleep vs Workout Outcome Log History'}
            </h4>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {sleepLogs.length} {isAr ? 'سجلات مسجلة' : 'Logged Nights'}
          </span>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {points.slice().reverse().map((pt) => {
            const rawLog = sleepLogs.find(l => l.date === pt.date);
            return (
              <div
                key={pt.date}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 hover:bg-secondary/40 transition-colors"
              >
                {/* Left: Sleep Info */}
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    pt.sleepDurationHours >= 7.5 && pt.sleepQualityScore >= 85
                      ? 'bg-purple-500/20 text-purple-300'
                      : pt.sleepDeficit
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-secondary text-muted-foreground'
                  }`}>
                    <Moon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {isAr ? pt.displayDateAr : pt.displayDate}
                      </span>
                      <span className="font-mono text-xs font-black text-purple-400">
                        {pt.sleepDurationHours}h
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        pt.sleepQualityScore >= 85 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-secondary text-muted-foreground'
                      }`}>
                        {pt.sleepQualityScore}% {isAr ? 'جودة' : 'Score'}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>RHR: {pt.restingHeartRateBpm || 54} bpm</span>
                      <span>•</span>
                      <span>HRV: {pt.hrvRmssdMs || 65} ms</span>
                      {rawLog?.factors && rawLog.factors.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-[10px] text-teal-400">
                            {rawLog.factors.length} {isAr ? 'عوامل محفزة' : 'factors'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Workout Outcome & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                  {pt.hasWorkout ? (
                    <div className="text-left sm:text-right">
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 sm:justify-end">
                        <Dumbbell className="h-3.5 w-3.5" />
                        <span>{pt.workoutVolumeTons} Tons</span>
                        <span className="text-[10px] text-muted-foreground">({pt.completedSets} sets)</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {isAr ? pt.workoutNameAr || pt.workoutName : pt.workoutName} • RPE {pt.avgWorkoutRpe}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted-foreground italic">
                      {isAr ? 'راحة استشفائية' : 'Rest Day'}
                    </span>
                  )}

                  {/* Actions */}
                  {rawLog && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenLogger(rawLog)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title={isAr ? 'تعديل' : 'Edit'}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteLog(rawLog.id, e)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                        title={isAr ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
