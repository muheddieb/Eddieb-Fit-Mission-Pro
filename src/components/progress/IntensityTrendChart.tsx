import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  LineChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { 
  Zap, 
  Dumbbell, 
  TrendingUp, 
  Activity, 
  Calendar, 
  Layers, 
  Award,
  Sparkles,
  Flame,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { UserProfile, WorkoutSession } from '../../types';
import { translations } from '../../i18n/translations';

interface IntensityTrendChartProps {
  history: WorkoutSession[];
  profile: UserProfile;
  isAr?: boolean;
}

type ViewMode = 'combined' | 'cumulative' | 'intensity';

export const IntensityTrendChart: React.FC<IntensityTrendChartProps> = ({
  history,
  profile,
  isAr = false,
}) => {
  const t = translations[profile.language];
  const [viewMode, setViewMode] = useState<ViewMode>('combined');

  // Compute 30-day timeline and metrics
  const { timelineData, stats, hasWorkoutsIn30Days } = useMemo(() => {
    // 1. Build a 30-day date array from 29 days ago up to today
    const now = new Date();
    // Normalize to midnight
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const days: { dateStr: string; timestamp: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(todayMidnight - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ dateStr, timestamp: d.getTime() });
    }

    // 2. Map completed workouts by date
    const completedWorkouts = history.filter(w => w.completed);
    const workoutsByDate = new Map<string, WorkoutSession[]>();
    
    completedWorkouts.forEach(w => {
      const dateStr = w.date;
      if (!workoutsByDate.has(dateStr)) {
        workoutsByDate.set(dateStr, []);
      }
      workoutsByDate.get(dateStr)!.push(w);
    });

    // Check if any workouts exist in this 30-day window
    let totalWorkoutsInWindow = 0;
    let runningCumulativeKg = 0;

    const rawData = days.map((day, idx) => {
      const sessions = workoutsByDate.get(day.dateStr) || [];
      let dailyVolumeKg = 0;
      let dailySets = 0;
      let dailyReps = 0;
      const sessionNames: string[] = [];
      let primarySplit = 'Rest';

      if (sessions.length > 0) {
        totalWorkoutsInWindow += sessions.length;
        sessions.forEach(sess => {
          sessionNames.push(isAr && sess.nameAr ? sess.nameAr : sess.name);
          const typeLower = (sess.type || '').toLowerCase();
          if (typeLower.includes('push')) primarySplit = isAr ? 'دفع' : 'Push';
          else if (typeLower.includes('pull')) primarySplit = isAr ? 'سحب' : 'Pull';
          else if (typeLower.includes('leg')) primarySplit = isAr ? 'أرجل' : 'Legs';
          else primarySplit = isAr ? 'تمرين عام' : 'Session';

          sess.exercises.forEach(ex => {
            ex.sets.forEach(s => {
              if (s.completed) {
                dailySets += 1;
                const r = s.actualReps || 0;
                const wt = s.actualWeight || 0;
                dailyReps += r;
                // If weight is 0 (bodyweight), apply a 60% bodyweight baseline
                const effectiveWeight = wt > 0 ? wt : (profile.currentWeightKg * 0.6);
                dailyVolumeKg += r * effectiveWeight;
              }
            });
          });
        });
      }

      dailyVolumeKg = Math.round(dailyVolumeKg);
      runningCumulativeKg += dailyVolumeKg;

      const dObj = new Date(day.dateStr);
      const formattedDate = dObj.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });
      const dayOfWeek = dObj.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'narrow' });

      const avgIntensityPerRep = dailyReps > 0 
        ? parseFloat((dailyVolumeKg / dailyReps).toFixed(1)) 
        : 0;

      return {
        date: day.dateStr,
        timestamp: day.timestamp,
        formattedDate,
        dayOfWeek,
        dailyVolumeKg,
        dailyVolumeTonnes: parseFloat((dailyVolumeKg / 1000).toFixed(2)),
        dailySets,
        dailyReps,
        avgIntensityPerRep,
        cumulativeVolumeKg: runningCumulativeKg,
        cumulativeVolumeTonnes: parseFloat((runningCumulativeKg / 1000).toFixed(2)),
        sessionsCount: sessions.length,
        sessionNames: sessionNames.join(' + '),
        primarySplit,
        isRestDay: sessions.length === 0,
      };
    });

    // 3. Calculate 7-day rolling moving average for each day
    const timelineData = rawData.map((d, index) => {
      const windowStart = Math.max(0, index - 6);
      const windowSlice = rawData.slice(windowStart, index + 1);
      const windowSum = windowSlice.reduce((sum, item) => sum + item.dailyVolumeKg, 0);
      const movingAvg7d = Math.round(windowSum / windowSlice.length);
      return {
        ...d,
        movingAvg7dVolume: movingAvg7d,
        movingAvg7dTonnes: parseFloat((movingAvg7d / 1000).toFixed(2)),
      };
    });

    // 4. Compute Summary Statistics for 30 days
    const total30DayVolumeKg = runningCumulativeKg;
    const total30DayVolumeTonnes = parseFloat((total30DayVolumeKg / 1000).toFixed(1));
    const activeDaysCount = timelineData.filter(d => d.dailyVolumeKg > 0).length;
    const avgVolumeActiveDay = activeDaysCount > 0 
      ? Math.round(total30DayVolumeKg / activeDaysCount) 
      : 0;
    const peakDailyVolume = Math.max(0, ...timelineData.map(d => d.dailyVolumeKg));
    const totalReps30d = timelineData.reduce((sum, d) => sum + d.dailyReps, 0);
    const overallAvgIntensity = totalReps30d > 0 
      ? parseFloat((total30DayVolumeKg / totalReps30d).toFixed(1)) 
      : 0;
    const totalSets30d = timelineData.reduce((sum, d) => sum + d.dailySets, 0);

    return {
      timelineData,
      stats: {
        total30DayVolumeKg,
        total30DayVolumeTonnes,
        activeDaysCount,
        avgVolumeActiveDay,
        peakDailyVolume,
        overallAvgIntensity,
        totalSets30d,
        totalReps30d,
        totalWorkoutsInWindow,
      },
      hasWorkoutsIn30Days: totalWorkoutsInWindow > 0,
    };
  }, [history, profile, isAr]);

  // Custom 30-Day Tooltip
  const Custom30DayTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div 
          className="rounded-xl border border-border p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[220px] z-50 animate-in fade-in zoom-in-95 duration-100"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/80 pb-1.5 font-bold text-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{data.formattedDate}</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
              data.isRestDay 
                ? 'bg-secondary text-muted-foreground' 
                : 'bg-primary/20 text-primary border border-primary/30'
            }`}>
              {data.primarySplit}
            </span>
          </div>

          {/* Session Name if Active */}
          {!data.isRestDay && data.sessionNames && (
            <div className="text-[11px] font-bold text-foreground/90 truncate">
              {data.sessionNames}
            </div>
          )}

          {/* Metrics List */}
          <div className="space-y-1 pt-0.5">
            {data.dailyVolumeKg > 0 ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span>{t.progress.dailyVolumeBars}:</span>
                  </span>
                  <span className="font-mono font-bold text-indigo-400">
                    {data.dailyVolumeKg.toLocaleString()} kg ({data.dailyVolumeTonnes} t)
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <span>{t.progress.intensityLine}:</span>
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    {data.avgIntensityPerRep} kg/rep
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>{isAr ? 'المجموعات / التكرارات:' : 'Sets / Reps:'}</span>
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {data.dailySets} sets ({data.dailyReps} reps)
                  </span>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground italic text-[11px] py-0.5">
                {isAr ? 'يوم استشفاء ونمو عضلي' : 'Active Recovery / Rest Day'}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/60 text-[11px]">
              <span className="text-muted-foreground">{t.progress.cumulativeVolume}:</span>
              <span className="font-mono font-bold text-cyan-400">
                {data.cumulativeVolumeTonnes} tonnes
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      id="intensity-trend-30day-container" 
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-md space-y-6 relative overflow-hidden"
    >
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Header & Mode Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-inner">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-foreground">
                {t.progress.intensityTrendTitle}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-[11px] font-extrabold text-indigo-400">
                30D Tonnage
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.progress.intensityTrendSubtitle}
            </p>
          </div>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/40 p-1 self-start sm:self-auto">
          <button
            id="btn-view-combined"
            onClick={() => setViewMode('combined')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
              viewMode === 'combined'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Daily Volume & Intensity Line"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>{isAr ? 'الحجم والشدة' : 'Volume & Load'}</span>
          </button>

          <button
            id="btn-view-cumulative"
            onClick={() => setViewMode('cumulative')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
              viewMode === 'cumulative'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Cumulative Tonnage Over 30 Days"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{isAr ? 'التراكمي' : 'Cumulative'}</span>
          </button>

          <button
            id="btn-view-intensity"
            onClick={() => setViewMode('intensity')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
              viewMode === 'intensity'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Neuromuscular Intensity per Rep"
          >
            <Flame className="h-3.5 w-3.5" />
            <span>{isAr ? 'كثافة التكرار' : 'Intensity/Rep'}</span>
          </button>
        </div>
      </div>

      {/* 30-Day Analytical KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 30D Total Volume */}
        <div className="rounded-xl border border-border bg-secondary/30 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
            <span>{t.progress.total30DayVolume}</span>
            <Dumbbell className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground mt-1">
            {stats.total30DayVolumeTonnes} <span className="text-xs font-normal text-muted-foreground">tonnes</span>
          </div>
          <div className="text-[11px] font-bold text-indigo-400 mt-1 font-mono">
            {stats.total30DayVolumeKg.toLocaleString()} kg lifted
          </div>
        </div>

        {/* Avg Load per Rep */}
        <div className="rounded-xl border border-border bg-secondary/30 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
            <span>{t.progress.avgIntensityPerRep}</span>
            <Flame className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground mt-1">
            {stats.overallAvgIntensity} <span className="text-xs font-normal text-muted-foreground">kg/rep</span>
          </div>
          <div className="text-[11px] font-semibold text-amber-400/90 mt-1">
            {stats.totalReps30d.toLocaleString()} {isAr ? 'تكرار إجمالي' : 'total reps'}
          </div>
        </div>

        {/* Peak 30D Session Load */}
        <div className="rounded-xl border border-border bg-secondary/30 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
            <span>{t.progress.peakSessionVolume}</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground mt-1">
            {stats.peakDailyVolume.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kg</span>
          </div>
          <div className="text-[11px] font-semibold text-emerald-400 mt-1">
            {stats.avgVolumeActiveDay > 0 ? `${stats.avgVolumeActiveDay.toLocaleString()} kg avg/day` : '0 kg'}
          </div>
        </div>

        {/* Active Days */}
        <div className="rounded-xl border border-border bg-secondary/30 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
            <span>{t.progress.activeTrainingDays}</span>
            <Calendar className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground mt-1">
            {stats.activeDaysCount} <span className="text-xs font-normal text-muted-foreground">/ 30 days</span>
          </div>
          <div className="text-[11px] font-bold text-cyan-400 mt-1">
            {stats.totalSets30d} {isAr ? 'مجموعة تدريبية' : 'working sets'}
          </div>
        </div>
      </div>

      {/* Main 30-Day Recharts Canvas Container */}
      <div className="h-80 sm:h-96 w-full pt-2">
        {!hasWorkoutsIn30Days ? (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/20 p-6 text-center text-muted-foreground">
            <Zap className="h-10 w-10 mb-3 text-indigo-400/60" />
            <p className="text-sm font-bold text-foreground max-w-md">
              {t.progress.noVolume30Days}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {isAr 
                ? 'ستظهر هنا أعمدة الحمل اليومي والمنحنى البياني فور إنهاء جلسات التمرين وتسجيل الأوزان والتكرارات.' 
                : 'Daily volume bars and neuromuscular intensity curves will populate automatically as workout sessions are completed.'}
            </p>
          </div>
        ) : viewMode === 'combined' ? (
          /* COMBINED: Daily Volume Bar + 7-Day Moving Avg Line + Intensity/Rep Line */
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timelineData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="intensityBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#4338ca" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="movingAvgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" vertical={false} />
              
              <XAxis 
                dataKey="formattedDate" 
                stroke="#888888" 
                fontSize={10} 
                tickLine={false} 
                axisLine={{ stroke: '#333338' }}
                interval={isAr ? 3 : 2}
              />
              
              {/* Left Y-Axis: Daily Volume (kg) */}
              <YAxis 
                yAxisId="volumeAxis"
                stroke="#6366f1" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#6366f1' }}
                unit="kg"
              />

              {/* Right Y-Axis: Intensity (kg/rep) */}
              <YAxis 
                yAxisId="intensityAxis"
                orientation="right"
                stroke="#f59e0b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#f59e0b' }}
                unit=" kg/r"
              />

              <Tooltip content={<Custom30DayTooltip />} />
              
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} 
              />

              {/* Daily Volume Lifted Bars */}
              <Bar 
                yAxisId="volumeAxis"
                dataKey="dailyVolumeKg" 
                name={isAr ? 'الحجم التدريبي اليومي (كجم)' : 'Daily Volume (kg)'} 
                fill="url(#intensityBarGrad)" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={28}
              />

              {/* 7-Day Rolling Volume Moving Average */}
              <Line 
                yAxisId="volumeAxis"
                type="monotone" 
                dataKey="movingAvg7dVolume" 
                name={isAr ? 'متوسط 7 أيام للحمل (كجم)' : '7-Day Volume Trend (kg)'} 
                stroke="#10b981" 
                strokeWidth={2.5} 
                dot={false}
                activeDot={{ r: 5, fill: '#10b981' }}
              />

              {/* Intensity Load per Rep */}
              <Line 
                yAxisId="intensityAxis"
                type="monotone" 
                dataKey="avgIntensityPerRep" 
                name={isAr ? 'متوسط الشدة (كجم/تكرار)' : 'Avg Intensity (kg/rep)'} 
                stroke="#f59e0b" 
                strokeWidth={2} 
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#f59e0b' }} 
                activeDot={{ r: 6, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : viewMode === 'cumulative' ? (
          /* CUMULATIVE VOLUME CURVE: Area Chart */
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="cumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" vertical={false} />
              
              <XAxis 
                dataKey="formattedDate" 
                stroke="#888888" 
                fontSize={10} 
                tickLine={false} 
                axisLine={{ stroke: '#333338' }}
                interval={2}
              />
              
              <YAxis 
                stroke="#06b6d4" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#06b6d4' }}
                unit=" t"
              />

              <Tooltip content={<Custom30DayTooltip />} />
              
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} 
              />

              <Area 
                type="monotone" 
                dataKey="cumulativeVolumeTonnes" 
                name={isAr ? 'الحجم التراكمي (أطنان)' : 'Cumulative Tonnage (tonnes)'} 
                stroke="#06b6d4" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#cumulativeGrad)" 
                activeDot={{ r: 6, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          /* NEUROMUSCULAR INTENSITY PER REP: High-resolution Line Chart */
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" vertical={false} />
              
              <XAxis 
                dataKey="formattedDate" 
                stroke="#888888" 
                fontSize={10} 
                tickLine={false} 
                axisLine={{ stroke: '#333338' }}
                interval={2}
              />
              
              <YAxis 
                stroke="#f59e0b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#f59e0b' }}
                unit=" kg"
              />

              <Tooltip content={<Custom30DayTooltip />} />
              
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} 
              />

              <ReferenceLine 
                y={stats.overallAvgIntensity} 
                stroke="#6366f1" 
                strokeDasharray="4 4" 
                label={{ 
                  value: `${isAr ? 'المتوسط' : 'Avg'}: ${stats.overallAvgIntensity} kg/rep`, 
                  fill: '#6366f1', 
                  fontSize: 10, 
                  position: 'insideTopRight' 
                }} 
              />

              <Line 
                type="monotone" 
                dataKey="avgIntensityPerRep" 
                name={isAr ? 'متوسط الوزن لكل تكرار (كجم)' : 'Load per Repetition (kg/rep)'} 
                stroke="#f59e0b" 
                strokeWidth={2.5} 
                dot={{ r: 4, fill: '#f59e0b' }} 
                activeDot={{ r: 7, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Scientific Overload Guidance Footer */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5 text-xs text-foreground flex items-start gap-2.5 leading-relaxed">
        <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-indigo-400">
            {isAr ? 'المفهوم الفسيولوجي لكثافة الحجم التدريبي: ' : 'Physiological Intensity & Volume Directive: '}
          </span>
          <span className="text-muted-foreground">
            {isAr 
              ? 'مراقبة الحجم التدريبي المرفوع على مدار 30 يوماً (الوزن × التكرارات) تضمن بقاء التحفيز العصبي والعضلي في نطاق البناء والحفاظ على الكتلة العضلية أثناء عجز السعرات الحرارية.' 
              : 'Tracking total tonnage and average load per repetition across rolling 30-day windows guarantees continuous progressive overload stimulus, safeguarding lean muscle tissue during fat-loss recomp.'}
          </span>
        </div>
      </div>
    </div>
  );
};
