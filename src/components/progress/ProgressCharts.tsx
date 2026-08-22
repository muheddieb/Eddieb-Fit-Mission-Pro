import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import { 
  TrendingUp, 
  Scale, 
  Target, 
  Calendar, 
  Flame, 
  Layers, 
  Activity, 
  Dumbbell,
  ArrowDownRight, 
  ArrowUpRight, 
  Minus,
  BarChart3,
  Zap,
  Clock,
  Award
} from 'lucide-react';
import { BodyMeasurement, UserProfile, WorkoutSession } from '../../types';

interface ProgressChartsProps {
  measurements: BodyMeasurement[];
  profile: UserProfile;
  history: WorkoutSession[];
  isAr?: boolean;
}

type ChartMetric = 'frequency' | 'volume' | 'compound_lifts' | 'body_weight' | 'waist_matrix';
type TimeRange = '14d' | '30d' | '90d' | 'all';

export const ProgressCharts: React.FC<ProgressChartsProps> = ({
  measurements,
  profile,
  history,
  isAr = false,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('frequency');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>('');

  // 1. Sort measurements & workouts chronologically
  const sortedMeasurements = useMemo(() => {
    return [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [measurements]);

  const sortedWorkouts = useMemo(() => {
    return [...history]
      .filter(w => w.completed)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [history]);

  // Filter workouts by time range
  const filteredWorkouts = useMemo(() => {
    if (timeRange === 'all') return sortedWorkouts;
    const daysLimit = timeRange === '14d' ? 14 : timeRange === '30d' ? 30 : 90;
    const cutoffTime = Date.now() - daysLimit * 86400000;
    return sortedWorkouts.filter(w => new Date(w.date).getTime() >= cutoffTime);
  }, [sortedWorkouts, timeRange]);

  // Filter measurements by time range
  const chartDataMeasurements = useMemo(() => {
    const raw = sortedMeasurements.map((m, index) => {
      const currentDate = new Date(m.date).getTime();
      const past7Days = sortedMeasurements
        .slice(0, index + 1)
        .filter(prev => {
          const prevDate = new Date(prev.date).getTime();
          return (currentDate - prevDate) <= 7 * 86400000;
        });

      const avgWeight = past7Days.length > 0
        ? parseFloat((past7Days.reduce((acc, curr) => acc + curr.weight, 0) / past7Days.length).toFixed(1))
        : m.weight;

      return {
        id: m.id,
        date: m.date,
        formattedDate: new Date(m.date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
          month: 'short',
          day: 'numeric',
        }),
        weight: m.weight,
        rollingAvg: avgWeight,
        waist: m.waistCm || null,
        goalWeight: profile.goalWeightKg,
        notes: m.notes,
      };
    });

    if (timeRange === 'all') return raw;
    const daysLimit = timeRange === '14d' ? 14 : timeRange === '30d' ? 30 : 90;
    const cutoffTime = Date.now() - daysLimit * 86400000;
    return raw.filter(item => new Date(item.date).getTime() >= cutoffTime);
  }, [sortedMeasurements, timeRange, profile.goalWeightKg, isAr]);

  // 2. Compute Workout Frequency Analytics (Weekly aggregations)
  const weeklyFrequencyData = useMemo(() => {
    if (sortedWorkouts.length === 0) return [];

    // Group workouts by ISO week string
    const weekMap: { [weekKey: string]: { 
      weekLabel: string; 
      total: number; 
      push: number; 
      pull: number; 
      legs: number; 
      other: number;
      target: number;
      timestamp: number;
    } } = {};

    sortedWorkouts.forEach(w => {
      const d = new Date(w.date);
      // Get week number / monday date
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      const weekKey = monday.toISOString().split('T')[0];
      const weekLabel = monday.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });

      if (!weekMap[weekKey]) {
        weekMap[weekKey] = {
          weekLabel: `${isAr ? 'أسبوع' : 'Wk'} ${weekLabel}`,
          total: 0,
          push: 0,
          pull: 0,
          legs: 0,
          other: 0,
          target: profile.trainingDaysPerWeek || 4,
          timestamp: monday.getTime(),
        };
      }

      weekMap[weekKey].total += 1;
      const typeLower = (w.type || '').toLowerCase();
      if (typeLower.includes('push')) weekMap[weekKey].push += 1;
      else if (typeLower.includes('pull')) weekMap[weekKey].pull += 1;
      else if (typeLower.includes('leg')) weekMap[weekKey].legs += 1;
      else weekMap[weekKey].other += 1;
    });

    const result = Object.values(weekMap).sort((a, b) => a.timestamp - b.timestamp);
    if (timeRange === '14d') return result.slice(-2);
    if (timeRange === '30d') return result.slice(-4);
    if (timeRange === '90d') return result.slice(-12);
    return result;
  }, [sortedWorkouts, profile.trainingDaysPerWeek, isAr, timeRange]);

  // 3. Compute Session Volume Progression & Tonnage Data
  const volumeProgressionData = useMemo(() => {
    return filteredWorkouts.map((w, idx, arr) => {
      let totalSets = 0;
      let totalReps = 0;
      let sessionTonnage = 0;
      const muscleBreakdown: { [muscle: string]: number } = {};

      w.exercises.forEach(ex => {
        let exTonnage = 0;
        ex.sets.forEach(s => {
          if (s.completed) {
            totalSets += 1;
            const reps = s.actualReps || 0;
            const weight = s.actualWeight || 0;
            totalReps += reps;
            const setLoad = reps * (weight > 0 ? weight : (profile.currentWeightKg * 0.6)); // fallback bodyweight multiplier
            sessionTonnage += setLoad;
            exTonnage += setLoad;
          }
        });
        const muscle = ex.primaryMuscle || 'Other';
        muscleBreakdown[muscle] = (muscleBreakdown[muscle] || 0) + Math.round(exTonnage);
      });

      // Compute 3-session moving average of tonnage
      const windowStart = Math.max(0, idx - 2);
      const windowItems = arr.slice(windowStart, idx + 1);
      let windowTonnageSum = 0;
      windowItems.forEach(item => {
        item.exercises.forEach(ex => {
          ex.sets.forEach(s => {
            if (s.completed) {
              const r = s.actualReps || 0;
              const wt = s.actualWeight || 0;
              windowTonnageSum += r * (wt > 0 ? wt : (profile.currentWeightKg * 0.6));
            }
          });
        });
      });
      const movingAvgTonnage = Math.round(windowTonnageSum / windowItems.length);

      return {
        id: w.id,
        date: w.date,
        formattedDate: new Date(w.date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
          month: 'short',
          day: 'numeric',
        }),
        name: isAr && w.nameAr ? w.nameAr : w.name,
        type: w.type,
        durationMinutes: w.durationMinutes || 45,
        totalSets,
        totalReps,
        tonnage: Math.round(sessionTonnage),
        movingAvgTonnage,
        intensityKgPerRep: totalReps > 0 ? parseFloat((sessionTonnage / totalReps).toFixed(1)) : 0,
      };
    });
  }, [filteredWorkouts, profile.currentWeightKg, isAr]);

  // 4. Extract distinct compound exercises for single lift progression drilldown
  const availableExercises = useMemo(() => {
    const map = new Map<string, { name: string; nameAr?: string; count: number }>();
    sortedWorkouts.forEach(w => {
      w.exercises.forEach(ex => {
        if (!map.has(ex.exerciseName)) {
          map.set(ex.exerciseName, {
            name: ex.exerciseName,
            nameAr: ex.exerciseNameAr,
            count: 1,
          });
        } else {
          const current = map.get(ex.exerciseName)!;
          current.count += 1;
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [sortedWorkouts]);

  // Set default selected exercise if none
  const currentSelectedExercise = selectedExerciseName || (availableExercises[0]?.name || '');

  // 5. Compound lift progression data
  const compoundLiftData = useMemo(() => {
    if (!currentSelectedExercise) return [];

    const data: {
      date: string;
      formattedDate: string;
      maxWeight: number;
      exerciseTonnage: number;
      totalReps: number;
      workingSets: number;
    }[] = [];

    filteredWorkouts.forEach(w => {
      const match = w.exercises.find(e => e.exerciseName === currentSelectedExercise);
      if (match) {
        let maxWt = 0;
        let tonnage = 0;
        let reps = 0;
        let completedSetsCount = 0;

        match.sets.forEach(s => {
          if (s.completed) {
            completedSetsCount += 1;
            const wt = s.actualWeight || 0;
            const rp = s.actualReps || 0;
            if (wt > maxWt) maxWt = wt;
            tonnage += wt * rp;
            reps += rp;
          }
        });

        if (completedSetsCount > 0) {
          data.push({
            date: w.date,
            formattedDate: new Date(w.date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
              month: 'short',
              day: 'numeric',
            }),
            maxWeight: maxWt,
            exerciseTonnage: Math.round(tonnage),
            totalReps: reps,
            workingSets: completedSetsCount,
          });
        }
      }
    });

    return data;
  }, [filteredWorkouts, currentSelectedExercise, isAr]);

  // 6. High-level Volume & Frequency Summary Calculations
  const volumeStats = useMemo(() => {
    const totalTonnageAllTime = volumeProgressionData.reduce((sum, d) => sum + d.tonnage, 0);
    const avgTonnagePerSession = volumeProgressionData.length > 0
      ? Math.round(totalTonnageAllTime / volumeProgressionData.length)
      : 0;
    const peakSessionTonnage = volumeProgressionData.length > 0
      ? Math.max(...volumeProgressionData.map(d => d.tonnage))
      : 0;
    const totalWorkouts = filteredWorkouts.length;
    const totalSets = volumeProgressionData.reduce((sum, d) => sum + d.totalSets, 0);
    const totalReps = volumeProgressionData.reduce((sum, d) => sum + d.totalReps, 0);

    // Progressive Overload % comparison (First vs Latest)
    let volumeGrowthPercent = 0;
    if (volumeProgressionData.length >= 2) {
      const firstTonnage = volumeProgressionData[0].tonnage;
      const lastTonnage = volumeProgressionData[volumeProgressionData.length - 1].tonnage;
      if (firstTonnage > 0) {
        volumeGrowthPercent = parseFloat((((lastTonnage - firstTonnage) / firstTonnage) * 100).toFixed(1));
      }
    }

    // Weekly consistency %
    const targetPerWeek = profile.trainingDaysPerWeek || 4;
    const avgWeeklySessions = weeklyFrequencyData.length > 0
      ? parseFloat((weeklyFrequencyData.reduce((sum, w) => sum + w.total, 0) / weeklyFrequencyData.length).toFixed(1))
      : 0;
    const consistencyRate = Math.min(100, Math.round((avgWeeklySessions / targetPerWeek) * 100));

    return {
      totalTonnageAllTime,
      avgTonnagePerSession,
      peakSessionTonnage,
      totalWorkouts,
      totalSets,
      totalReps,
      volumeGrowthPercent,
      avgWeeklySessions,
      consistencyRate,
      targetPerWeek,
    };
  }, [volumeProgressionData, filteredWorkouts, weeklyFrequencyData, profile.trainingDaysPerWeek]);

  // Biometrics summary stats
  const biometricStats = useMemo(() => {
    if (sortedMeasurements.length === 0) {
      return {
        initialWeight: profile.currentWeightKg,
        latestWeight: profile.currentWeightKg,
        weightDelta: 0,
        initialWaist: profile.currentWaistCm,
        latestWaist: profile.currentWaistCm,
        waistDelta: 0,
        toGoalKg: profile.currentWeightKg - profile.goalWeightKg,
      };
    }
    const first = sortedMeasurements[0];
    const latest = sortedMeasurements[sortedMeasurements.length - 1];
    return {
      initialWeight: first.weight,
      latestWeight: latest.weight,
      weightDelta: parseFloat((latest.weight - first.weight).toFixed(1)),
      initialWaist: first.waistCm || profile.currentWaistCm,
      latestWaist: latest.waistCm || profile.currentWaistCm,
      waistDelta: (latest.waistCm && first.waistCm) ? parseFloat((latest.waistCm - first.waistCm).toFixed(1)) : 0,
      toGoalKg: parseFloat((latest.weight - profile.goalWeightKg).toFixed(1)),
    };
  }, [sortedMeasurements, profile]);

  // Custom Tooltip for Volume and Frequency
  const CustomAnalyticsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-xl border border-border bg-card/95 p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[200px] z-50">
          <div className="font-black text-foreground flex items-center justify-between border-b border-border pb-1.5">
            <span>{data.name || data.weekLabel || data.formattedDate || label}</span>
            <span className="text-[10px] text-muted-foreground font-mono">{data.date || ''}</span>
          </div>

          <div className="space-y-1">
            {payload.map((entry: any, idx: number) => (
              <div key={`item-${idx}`} className="flex items-center justify-between gap-4 font-semibold text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-muted-foreground">{entry.name}:</span>
                </span>
                <span className="font-mono font-bold text-foreground">
                  {entry.value.toLocaleString()} {entry.unit || ''}
                </span>
              </div>
            ))}
          </div>

          {data.durationMinutes && (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
              <span>{isAr ? 'مدة الجلسة:' : 'Duration:'}</span>
              <span className="font-mono">{data.durationMinutes} min</span>
            </div>
          )}

          {data.notes && (
            <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/50 italic">
              "{data.notes}"
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-md space-y-6">
      {/* Header & Chart Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-foreground">
                {isAr ? 'تحليلات تردد التمرين والحمل التدريبي (D3/Recharts)' : 'Workout Frequency & Volume Analytics (Recharts)'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr 
                  ? 'متابعة مسار تكرار التمارين الأسبوعي، الحجم التدريبي الإجمالي (Tonnage)، وتطور الأوزان' 
                  : 'Track weekly workout frequency, total volume load (tonnage kg), and progressive overload'}
              </p>
            </div>
          </div>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/40 p-1 self-start sm:self-auto">
          {(['14d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {range === '14d' ? '14D' : range === '30d' ? '30D' : range === '90d' ? '90D' : (isAr ? 'الكل' : 'ALL')}
            </button>
          ))}
        </div>
      </div>

      {/* High-Level Analytical KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Weekly Frequency */}
        <div className="rounded-xl border border-border bg-secondary/30 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
            <span>{isAr ? 'التردد الأسبوعي' : 'Weekly Cadence'}</span>
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground mt-1">
            {volumeStats.avgWeeklySessions} <span className="text-xs font-normal text-muted-foreground">/ {volumeStats.targetPerWeek} {isAr ? 'أيام' : 'days'}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 mt-1">
            <Award className="h-3.5 w-3.5" />
            <span>{volumeStats.consistencyRate}% {isAr ? 'نسبة الالتزام' : 'Adherence'}</span>
          </div>
        </div>

        {/* Total Tonnage Lifted */}
        <div className="rounded-xl border border-border bg-secondary/30 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
            <span>{isAr ? 'إجمالي الحجم التدريبي' : 'Total Volume Load'}</span>
            <Dumbbell className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground mt-1">
            {(volumeStats.totalTonnageAllTime / 1000).toFixed(1)} <span className="text-xs font-normal text-muted-foreground">tonnes</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold mt-1">
            {volumeStats.volumeGrowthPercent >= 0 ? (
              <span className="text-emerald-400 flex items-center">
                <ArrowUpRight className="h-3.5 w-3.5" /> +{volumeStats.volumeGrowthPercent}%
              </span>
            ) : (
              <span className="text-rose-400 flex items-center">
                <ArrowDownRight className="h-3.5 w-3.5" /> {volumeStats.volumeGrowthPercent}%
              </span>
            )}
            <span className="text-[10px] text-muted-foreground font-normal">
              {isAr ? 'نمو الحمل' : 'progression'}
            </span>
          </div>
        </div>

        {/* Average Session Volume */}
        <div className="rounded-xl border border-border bg-secondary/30 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
            <span>{isAr ? 'متوسط الجلسة' : 'Avg Session Load'}</span>
            <Activity className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground mt-1">
            {volumeStats.avgTonnagePerSession.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kg</span>
          </div>
          <div className="text-[11px] font-bold text-amber-400 mt-1">
            {volumeStats.totalSets} {isAr ? 'مجموعات مكتملة' : 'completed sets'}
          </div>
        </div>

        {/* Peak Session Volume */}
        <div className="rounded-xl border border-border bg-secondary/30 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
            <span>{isAr ? 'أعلى حمل تدريبي' : 'Peak Session'}</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground mt-1">
            {volumeStats.peakSessionTonnage.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kg</span>
          </div>
          <div className="text-[11px] font-semibold text-muted-foreground mt-1">
            {volumeStats.totalWorkouts} {isAr ? 'تمارين مسجلة' : 'sessions logged'}
          </div>
        </div>
      </div>

      {/* Metric Mode Pill Selectors */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <button
          id="btn-metric-frequency"
          onClick={() => setSelectedMetric('frequency')}
          className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
            selectedMetric === 'frequency'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'border border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>{isAr ? 'تردد التمارين الأسبوعي' : 'Workout Frequency'}</span>
        </button>

        <button
          id="btn-metric-volume"
          onClick={() => setSelectedMetric('volume')}
          className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
            selectedMetric === 'volume'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'border border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>{isAr ? 'الحجم التدريبي (Tonnage kg)' : 'Volume Progression'}</span>
        </button>

        <button
          id="btn-metric-compound"
          onClick={() => setSelectedMetric('compound_lifts')}
          className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
            selectedMetric === 'compound_lifts'
              ? 'bg-amber-600 text-white shadow-md'
              : 'border border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          <Dumbbell className="h-3.5 w-3.5" />
          <span>{isAr ? 'تطور أوزان التمارين المركبة' : 'Compound Lift Progression'}</span>
        </button>

        <button
          id="btn-metric-weight-avg"
          onClick={() => setSelectedMetric('body_weight')}
          className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
            selectedMetric === 'body_weight'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'border border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          <Scale className="h-3.5 w-3.5" />
          <span>{isAr ? 'الوزن والمتوسط المتحرك' : 'Weight & 7-Day Trend'}</span>
        </button>

        <button
          id="btn-metric-waist"
          onClick={() => setSelectedMetric('waist_matrix')}
          className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
            selectedMetric === 'waist_matrix'
              ? 'bg-teal-600 text-white shadow-md'
              : 'border border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          <Target className="h-3.5 w-3.5" />
          <span>{isAr ? 'محيط الخصر والمصفوفة' : 'Waist & Dual Matrix'}</span>
        </button>
      </div>

      {/* Sub-header Controls for Compound Lift Drilldown */}
      {selectedMetric === 'compound_lifts' && availableExercises.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-secondary/30 p-2.5">
          <span className="text-xs font-bold text-muted-foreground">
            {isAr ? 'اختر التمرين المركب:' : 'Select Compound Lift:'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {availableExercises.slice(0, 6).map(ex => (
              <button
                key={ex.name}
                onClick={() => setSelectedExerciseName(ex.name)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  currentSelectedExercise === ex.name
                    ? 'bg-amber-500 text-black font-bold shadow'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {isAr && ex.nameAr ? ex.nameAr : ex.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Responsive Recharts Container */}
      <div className="h-80 sm:h-96 w-full pt-2">
        {selectedMetric === 'frequency' ? (
          /* WORKOUT FREQUENCY & CONSISTENCY: Stacked Bar Chart with Target Reference Line */
          weeklyFrequencyData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20 p-6 text-center text-muted-foreground">
              <Calendar className="h-8 w-8 mb-2 text-muted-foreground/60" />
              <p className="text-xs font-bold">{isAr ? 'لا توجد تمارين مسجلة حتى الآن' : 'No workouts logged in selected timeframe'}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyFrequencyData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" vertical={false} />
                <XAxis 
                  dataKey="weekLabel" 
                  stroke="#888888" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#333338' }} 
                />
                <YAxis 
                  domain={[0, Math.max(6, (profile.trainingDaysPerWeek || 4) + 1)]} 
                  stroke="#888888" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#333338' }}
                  unit={isAr ? ' ج' : 'd'}
                />
                <Tooltip content={<CustomAnalyticsTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} 
                />
                <ReferenceLine 
                  y={profile.trainingDaysPerWeek || 4} 
                  stroke="#f59e0b" 
                  strokeDasharray="4 4" 
                  label={{ 
                    value: `${isAr ? 'الهدف الأسبوعي' : 'Target'}: ${profile.trainingDaysPerWeek || 4}d`, 
                    fill: '#f59e0b', 
                    fontSize: 10, 
                    position: 'insideTopRight' 
                  }} 
                />
                <Bar 
                  dataKey="push" 
                  name={isAr ? 'تمارين الدفع (Push)' : 'Push Split'} 
                  stackId="split" 
                  fill="#6366f1" 
                  radius={[0, 0, 0, 0]} 
                />
                <Bar 
                  dataKey="pull" 
                  name={isAr ? 'تمارين السحب (Pull)' : 'Pull Split'} 
                  stackId="split" 
                  fill="#10b981" 
                  radius={[0, 0, 0, 0]} 
                />
                <Bar 
                  dataKey="legs" 
                  name={isAr ? 'تمارين الأرجل (Legs)' : 'Legs Split'} 
                  stackId="split" 
                  fill="#f59e0b" 
                  radius={[0, 0, 0, 0]} 
                />
                <Bar 
                  dataKey="other" 
                  name={isAr ? 'تمارين أخرى / كارديو' : 'Home / Other'} 
                  stackId="split" 
                  fill="#ec4899" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          )
        ) : selectedMetric === 'volume' ? (
          /* VOLUME PROGRESSION & TONNAGE TREND: Area Chart with 3-Session Moving Average */
          volumeProgressionData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20 p-6 text-center text-muted-foreground">
              <Activity className="h-8 w-8 mb-2 text-muted-foreground/60" />
              <p className="text-xs font-bold">{isAr ? 'لا توجد بيانات حجم تدريبي مسجلة' : 'No volume data available'}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={volumeProgressionData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="volumeTonnageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" vertical={false} />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="#888888" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#333338' }} 
                />
                <YAxis 
                  yAxisId="tonnageAxis"
                  stroke="#6366f1" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#6366f1' }}
                  unit="kg"
                />
                <YAxis 
                  yAxisId="setsAxis"
                  orientation="right"
                  stroke="#10b981" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#10b981' }}
                  unit=" sets"
                />
                <Tooltip content={<CustomAnalyticsTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} 
                />
                <Area 
                  yAxisId="tonnageAxis"
                  type="monotone" 
                  dataKey="tonnage" 
                  name={isAr ? 'الحمل التدريبي (Tonnage kg)' : 'Session Tonnage (kg)'} 
                  stroke="#6366f1" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#volumeTonnageGradient)" 
                  activeDot={{ r: 6, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                />
                <Line 
                  yAxisId="tonnageAxis"
                  type="monotone" 
                  dataKey="movingAvgTonnage" 
                  name={isAr ? 'المتوسط المتحرك للحمل' : '3-Session Volume Trend'} 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#f59e0b' }} 
                />
                <Line 
                  yAxisId="setsAxis"
                  type="monotone" 
                  dataKey="totalSets" 
                  name={isAr ? 'إجمالي المجموعات' : 'Completed Sets'} 
                  stroke="#10b981" 
                  strokeWidth={1.5} 
                  dot={{ r: 3, fill: '#10b981' }} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          )
        ) : selectedMetric === 'compound_lifts' ? (
          /* COMPOUND LIFT PROGRESSION: Max Working Weight (kg) & Exercise Tonnage */
          compoundLiftData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20 p-6 text-center text-muted-foreground">
              <Dumbbell className="h-8 w-8 mb-2 text-muted-foreground/60" />
              <p className="text-xs font-bold">
                {isAr ? `لا توجد بيانات مسجلة لتمرين ${currentSelectedExercise}` : `No session data logged for ${currentSelectedExercise}`}
              </p>
              <p className="text-[11px] mt-1">{isAr ? 'اختر تمريناً آخر من القائمة أعلاه' : 'Select another compound lift from the list above'}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={compoundLiftData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="liftTonnageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" vertical={false} />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="#888888" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#333338' }} 
                />
                <YAxis 
                  yAxisId="weightAxis"
                  stroke="#f59e0b" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#f59e0b' }}
                  unit="kg"
                />
                <YAxis 
                  yAxisId="tonnageAxis"
                  orientation="right"
                  stroke="#6366f1" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#6366f1' }}
                  unit="kg load"
                />
                <Tooltip content={<CustomAnalyticsTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} 
                />
                <Line 
                  yAxisId="weightAxis"
                  type="monotone" 
                  dataKey="maxWeight" 
                  name={isAr ? 'أعلى وزن عملي (Working Weight kg)' : 'Max Working Weight (kg)'} 
                  stroke="#f59e0b" 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }} 
                  activeDot={{ r: 7 }}
                />
                <Area 
                  yAxisId="tonnageAxis"
                  type="monotone" 
                  dataKey="exerciseTonnage" 
                  name={isAr ? 'حجم التمرين (Exercise Tonnage kg)' : 'Exercise Tonnage (kg)'} 
                  stroke="#6366f1" 
                  strokeWidth={2} 
                  fillOpacity={1}
                  fill="url(#liftTonnageGradient)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )
        ) : selectedMetric === 'body_weight' ? (
          /* BODY WEIGHT & 7-DAY AVERAGE AREA CHART */
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartDataMeasurements} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" vertical={false} />
              <XAxis 
                dataKey="formattedDate" 
                stroke="#888888" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#333338' }} 
              />
              <YAxis 
                domain={['dataMin - 2', 'dataMax + 2']} 
                stroke="#888888" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#333338' }}
                unit="kg"
              />
              <Tooltip content={<CustomAnalyticsTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} 
              />
              <ReferenceLine 
                y={profile.goalWeightKg} 
                stroke="#f59e0b" 
                strokeDasharray="4 4" 
                label={{ 
                  value: `${isAr ? 'الهدف' : 'Goal'}: ${profile.goalWeightKg}kg`, 
                  fill: '#f59e0b', 
                  fontSize: 10, 
                  position: 'insideTopRight' 
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="weight" 
                name={isAr ? 'الوزن المسجل' : 'Scale Weight (kg)'} 
                stroke="#6366f1" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#weightGradient)" 
                activeDot={{ r: 6, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="rollingAvg" 
                name={isAr ? 'متوسط 7 أيام' : '7-Day Rolling Avg (kg)'} 
                stroke="#10b981" 
                strokeWidth={2} 
                strokeDasharray="3 3"
                dot={{ r: 3, fill: '#10b981' }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          /* WAIST & DUAL MATRIX: Weight & Waist Correlation */
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartDataMeasurements} margin={{ top: 15, right: -5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" vertical={false} />
              <XAxis 
                dataKey="formattedDate" 
                stroke="#888888" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#333338' }} 
              />
              <YAxis 
                yAxisId="left" 
                domain={['dataMin - 2', 'dataMax + 2']} 
                stroke="#6366f1" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#6366f1' }}
                unit="kg"
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                domain={['dataMin - 2', 'dataMax + 2']} 
                stroke="#10b981" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#10b981' }}
                unit="cm"
              />
              <Tooltip content={<CustomAnalyticsTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} 
              />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="weight" 
                name={isAr ? 'الوزن (كجم)' : 'Weight (kg)'} 
                stroke="#6366f1" 
                strokeWidth={2.5} 
                dot={{ r: 4, fill: '#6366f1' }} 
                activeDot={{ r: 6 }} 
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="waist" 
                name={isAr ? 'الخصر (سم)' : 'Waist Navel (cm)'} 
                stroke="#10b981" 
                strokeWidth={2.5} 
                dot={{ r: 4, fill: '#10b981' }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Physiological and Progressive Overload Guidance Footer */}
      <div className="rounded-xl border border-border/80 bg-secondary/20 p-3.5 text-xs text-muted-foreground flex items-start gap-2.5">
        <Activity className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {isAr
            ? '💡 قاعدة التحميل التدريجي (Progressive Overload): استمرار زيادة الحجم التدريبي الإجمالي (Tonnage kg) أو زيادة الأوزان مع ثبات التكرارات هو الضامن البيولوجي الأساسي لبناء العضلات والحفاظ عليها أثناء نزول الوزن من 100.9 كجم إلى 80 كجم.'
            : '💡 Progressive Overload Principle: Steadily increasing total volume load (Tonnage = Weight × Reps) or working weight while preserving strict form is the primary biological stimulus for muscle hypertrophy and preservation during caloric deficits.'}
        </p>
      </div>
    </div>
  );
};
