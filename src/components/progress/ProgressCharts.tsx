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
} from 'recharts';
import { 
  TrendingUp, 
  Scale, 
  Target, 
  Calendar, 
  Flame, 
  Layers, 
  Activity, 
  ArrowDownRight, 
  ArrowUpRight, 
  Minus 
} from 'lucide-react';
import { BodyMeasurement, UserProfile, WorkoutSession } from '../../types';

interface ProgressChartsProps {
  measurements: BodyMeasurement[];
  profile: UserProfile;
  history: WorkoutSession[];
  isAr?: boolean;
}

type ChartMetric = 'weight_avg' | 'waist' | 'dual_matrix' | 'workout_volume';
type TimeRange = '14d' | '30d' | '90d' | 'all';

export const ProgressCharts: React.FC<ProgressChartsProps> = ({
  measurements,
  profile,
  history,
  isAr = false,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('weight_avg');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  // Sort measurements chronologically
  const sortedMeasurements = useMemo(() => {
    return [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [measurements]);

  // Compute 7-day rolling average for each point
  const chartData = useMemo(() => {
    const raw = sortedMeasurements.map((m, index) => {
      // Calculate 7-day average of points up to this point within 7 days
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

  // Compute Workout Volume Chart Data
  const workoutVolumeData = useMemo(() => {
    const sortedWorkouts = [...history]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14);

    return sortedWorkouts.map(w => {
      let totalSets = 0;
      let totalReps = 0;
      let estimatedTonnage = 0;

      w.exercises.forEach(ex => {
        ex.sets.forEach(s => {
          if (s.completed) {
            totalSets += 1;
            totalReps += s.actualReps || 0;
            estimatedTonnage += (s.actualReps || 0) * (s.actualWeight || 0);
          }
        });
      });

      return {
        date: w.date,
        formattedDate: new Date(w.date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
          month: 'short',
          day: 'numeric',
        }),
        name: isAr && w.nameAr ? w.nameAr : w.name,
        type: w.type,
        totalSets,
        totalReps,
        estimatedTonnage: Math.round(estimatedTonnage),
      };
    });
  }, [history, isAr]);

  // Key stats computations
  const stats = useMemo(() => {
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

    const wDelta = parseFloat((latest.weight - first.weight).toFixed(1));
    const waistDelta = (latest.waistCm && first.waistCm) 
      ? parseFloat((latest.waistCm - first.waistCm).toFixed(1)) 
      : 0;

    return {
      initialWeight: first.weight,
      latestWeight: latest.weight,
      weightDelta: wDelta,
      initialWaist: first.waistCm || profile.currentWaistCm,
      latestWaist: latest.waistCm || profile.currentWaistCm,
      waistDelta,
      toGoalKg: parseFloat((latest.weight - profile.goalWeightKg).toFixed(1)),
    };
  }, [sortedMeasurements, profile]);

  // Y-Axis Domain calculation helpers
  const weightMin = useMemo(() => {
    if (chartData.length === 0) return 60;
    const minVal = Math.min(...chartData.map(d => d.weight), profile.goalWeightKg);
    return Math.floor(minVal - 2);
  }, [chartData, profile.goalWeightKg]);

  const weightMax = useMemo(() => {
    if (chartData.length === 0) return 100;
    const maxVal = Math.max(...chartData.map(d => d.weight), profile.goalWeightKg);
    return Math.ceil(maxVal + 2);
  }, [chartData, profile.goalWeightKg]);

  const waistMin = useMemo(() => {
    const valid = chartData.filter(d => d.waist !== null).map(d => d.waist as number);
    if (valid.length === 0) return 70;
    return Math.floor(Math.min(...valid) - 3);
  }, [chartData]);

  const waistMax = useMemo(() => {
    const valid = chartData.filter(d => d.waist !== null).map(d => d.waist as number);
    if (valid.length === 0) return 105;
    return Math.ceil(Math.max(...valid) + 3);
  }, [chartData]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-xl border border-border bg-card/95 p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[170px]">
          <div className="font-bold text-foreground flex items-center justify-between border-b border-border pb-1">
            <span>{data.formattedDate || label}</span>
            <span className="text-[10px] text-muted-foreground">{data.date}</span>
          </div>

          {payload.map((entry: any, idx: number) => (
            <div key={`item-${idx}`} className="flex items-center justify-between gap-4 font-semibold" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span className="font-mono font-bold">
                {entry.value} {entry.unit || (entry.dataKey.includes('waist') ? 'cm' : entry.dataKey.includes('tonnage') ? 'kg' : 'kg')}
              </span>
            </div>
          ))}

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
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-md space-y-5">
      {/* Header & Chart Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-base sm:text-lg font-black text-foreground">
              {isAr ? 'مخططات التقدم والتحليلات البيومترية' : 'Biometric Progress & Recharts Analytics'}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAr 
              ? 'متابعة تغيرات الوزن المتحرك، محيط الخصر، وحجم الأحمال التدريبية' 
              : 'Interactive visualization for scale weight, 7-day rolling trend, waist reduction & volume'}
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/40 p-1">
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

      {/* Quick Biometrics High-Level Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Current Weight */}
        <div className="rounded-xl border border-border bg-secondary/30 p-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
            <span>{isAr ? 'الوزن الحالي' : 'Current Weight'}</span>
            <Scale className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="text-lg sm:text-xl font-black text-foreground mt-0.5">
            {stats.latestWeight} <span className="text-xs font-normal text-muted-foreground">kg</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold mt-1">
            {stats.weightDelta < 0 ? (
              <span className="text-emerald-400 flex items-center">
                <ArrowDownRight className="h-3.5 w-3.5" /> {Math.abs(stats.weightDelta)} kg
              </span>
            ) : stats.weightDelta > 0 ? (
              <span className="text-amber-400 flex items-center">
                <ArrowUpRight className="h-3.5 w-3.5" /> +{stats.weightDelta} kg
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center">
                <Minus className="h-3.5 w-3.5" /> 0.0 kg
              </span>
            )}
            <span className="text-[10px] text-muted-foreground font-normal">
              {isAr ? 'من البداية' : 'total'}
            </span>
          </div>
        </div>

        {/* Waist Circumference */}
        <div className="rounded-xl border border-border bg-secondary/30 p-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
            <span>{isAr ? 'محيط الخصر' : 'Waist Navel'}</span>
            <Target className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-foreground mt-0.5">
            {stats.latestWaist} <span className="text-xs font-normal text-muted-foreground">cm</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold mt-1">
            {stats.waistDelta < 0 ? (
              <span className="text-emerald-400 flex items-center">
                <ArrowDownRight className="h-3.5 w-3.5" /> {Math.abs(stats.waistDelta)} cm
              </span>
            ) : stats.waistDelta > 0 ? (
              <span className="text-rose-400 flex items-center">
                <ArrowUpRight className="h-3.5 w-3.5" /> +{stats.waistDelta} cm
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center">
                <Minus className="h-3.5 w-3.5" /> 0.0 cm
              </span>
            )}
            <span className="text-[10px] text-muted-foreground font-normal">
              {isAr ? 'تغير الخصر' : 'reduction'}
            </span>
          </div>
        </div>

        {/* Distance to Goal */}
        <div className="rounded-xl border border-border bg-secondary/30 p-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
            <span>{isAr ? 'الهدف المستهدف' : 'Goal Target'}</span>
            <Flame className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-foreground mt-0.5">
            {profile.goalWeightKg} <span className="text-xs font-normal text-muted-foreground">kg</span>
          </div>
          <div className="text-[11px] font-bold text-primary mt-1">
            {Math.abs(stats.toGoalKg)} kg {stats.toGoalKg > 0 ? (isAr ? 'متبقي للهدف' : 'to lose') : (isAr ? 'تحقق الهدف' : 'achieved')}
          </div>
        </div>

        {/* Total Check-ins */}
        <div className="rounded-xl border border-border bg-secondary/30 p-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
            <span>{isAr ? 'سجلات المتابعة' : 'Logged Entries'}</span>
            <Activity className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-foreground mt-0.5">
            {chartData.length} <span className="text-xs font-normal text-muted-foreground">{isAr ? 'تسجيل' : 'pts'}</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {history.length} {isAr ? 'تمارين مكتملة' : 'workouts'}
          </div>
        </div>
      </div>

      {/* Metric Mode Pill Selectors */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <button
          id="btn-metric-weight-avg"
          onClick={() => setSelectedMetric('weight_avg')}
          className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
            selectedMetric === 'weight_avg'
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'border border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          <Scale className="h-3.5 w-3.5" />
          <span>{isAr ? 'الوزن والمتوسط المتحرك' : 'Weight & 7-Day Average'}</span>
        </button>

        <button
          id="btn-metric-waist"
          onClick={() => setSelectedMetric('waist')}
          className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
            selectedMetric === 'waist'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'border border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          <Target className="h-3.5 w-3.5" />
          <span>{isAr ? 'محيط الخصر (سم)' : 'Waist Circumference (cm)'}</span>
        </button>

        <button
          id="btn-metric-dual"
          onClick={() => setSelectedMetric('dual_matrix')}
          className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
            selectedMetric === 'dual_matrix'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'border border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>{isAr ? 'التحليل المزدوج (وزن + خصر)' : 'Dual Matrix (Weight + Waist)'}</span>
        </button>

        <button
          id="btn-metric-volume"
          onClick={() => setSelectedMetric('workout_volume')}
          className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
            selectedMetric === 'workout_volume'
              ? 'bg-amber-600 text-white shadow-md'
              : 'border border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>{isAr ? 'حجم التمرين والأحمال' : 'Workout Volume Progression'}</span>
        </button>
      </div>

      {/* Main Responsive Recharts Container */}
      <div className="h-72 sm:h-80 w-full pt-2">
        {chartData.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20 p-6 text-center text-muted-foreground">
            <Calendar className="h-8 w-8 mb-2 text-muted-foreground/60" />
            <p className="text-xs font-bold">{isAr ? 'لا توجد بيانات كافية خلال هذه الفترة' : 'No measurements found in selected range'}</p>
            <p className="text-[11px] mt-1">{isAr ? 'قم بتسجيل قياساتك بالأسفل لإنشاء المخطط' : 'Log a new measurement below to populate charts'}</p>
          </div>
        ) : selectedMetric === 'weight_avg' ? (
          /* Area & Line Chart: Weight + 7-Day Average + Goal Reference Line */
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
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
                domain={[weightMin, weightMax]} 
                stroke="#888888" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#333338' }}
                unit="kg"
              />
              <Tooltip content={<CustomTooltip />} />
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
                name={isAr ? 'الوزن المسجل' : 'Scale Weight'} 
                stroke="#6366f1" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#weightGradient)" 
                activeDot={{ r: 6, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="rollingAvg" 
                name={isAr ? 'متوسط 7 أيام' : '7-Day Rolling Avg'} 
                stroke="#10b981" 
                strokeWidth={2} 
                strokeDasharray="3 3"
                dot={{ r: 3, fill: '#10b981' }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : selectedMetric === 'waist' ? (
          /* Area Chart: Waist Circumference (cm) */
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="waistGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
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
                domain={[waistMin, waistMax]} 
                stroke="#888888" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#333338' }}
                unit="cm"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} 
              />
              <Area 
                type="monotone" 
                dataKey="waist" 
                name={isAr ? 'محيط الخصر' : 'Waist Navel (cm)'} 
                stroke="#10b981" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#waistGradient)" 
                activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : selectedMetric === 'dual_matrix' ? (
          /* Dual-Axis Line Chart: Weight (Left Y) + Waist (Right Y) */
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
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
                domain={[weightMin, weightMax]} 
                stroke="#6366f1" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#6366f1' }}
                unit="kg"
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                domain={[waistMin, waistMax]} 
                stroke="#10b981" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#10b981' }}
                unit="cm"
              />
              <Tooltip content={<CustomTooltip />} />
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
                name={isAr ? 'الخصر (سم)' : 'Waist (cm)'} 
                stroke="#10b981" 
                strokeWidth={2.5} 
                dot={{ r: 4, fill: '#10b981' }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          /* Bar Chart: Workout Volume and Tonnage */
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workoutVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" vertical={false} />
              <XAxis 
                dataKey="formattedDate" 
                stroke="#888888" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#333338' }} 
              />
              <YAxis 
                stroke="#888888" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#333338' }} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} 
              />
              <Bar 
                dataKey="totalSets" 
                name={isAr ? 'عدد المجموعات المكتملة' : 'Completed Sets'} 
                fill="#f59e0b" 
                radius={[6, 6, 0, 0]} 
              />
              <Bar 
                dataKey="totalReps" 
                name={isAr ? 'إجمالي التكرارات' : 'Total Reps'} 
                fill="#4f46e5" 
                radius={[6, 6, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Physiological Guidance Footer Note */}
      <div className="rounded-xl border border-border/80 bg-secondary/20 p-3 text-[11px] text-muted-foreground flex items-start gap-2">
        <Activity className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {isAr
            ? '💡 نصيحة علمية: تقلبات الوزن اليومية ناتجة عن الماء والجليكوجين والملح. المؤشر الأصدق لحرق الدهون الحقيقي هو نزول محيط الخصر ومعدل المتوسط المتحرك لـ 7 أيام مع ثبات أو زيادة الأوزان في التمرين.'
            : '💡 Scientific Insight: Daily scale weight fluctuates due to hydration, glycogen, and sodium. True recomposition and visceral fat loss are confirmed when waist circumference decreases and 7-day average declines while working weight progression is preserved.'}
        </p>
      </div>
    </div>
  );
};
