import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Layers,
  TrendingUp,
  Activity,
  Dumbbell,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Filter,
  BarChart3,
  LineChart as LineChartIcon,
  ChevronRight,
  Info,
} from 'lucide-react';
import { UserProfile, WorkoutSession, MajorMuscleGroup, MuscleGroupVolumePoint, MuscleGroupSummary } from '../../types';
import { translations } from '../../i18n/translations';
import { PPLEngine } from '../../services/pplEngine';

interface MuscleGroupVolumeChartProps {
  history: WorkoutSession[];
  profile: UserProfile;
  isAr: boolean;
}

type SplitFilter = 'all' | 'push' | 'pull' | 'legs' | 'core';
type ViewMode = 'line' | 'stacked_bar' | 'sets' | 'individual';

export const MuscleGroupVolumeChart: React.FC<MuscleGroupVolumeChartProps> = ({
  history,
  profile,
  isAr,
}) => {
  const t = translations[profile.language];
  const [splitFilter, setSplitFilter] = useState<SplitFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('line');
  const [selectedMuscle, setSelectedMuscle] = useState<MajorMuscleGroup>('chest');

  // Compute weekly volume trends per muscle group
  const { weeks, summaries, overallTonnageKg, topOverloadedMuscle, activeWeekTonnageKg } = useMemo(() => {
    return PPLEngine.getWeeklyMuscleGroupVolumes(history, profile);
  }, [history, profile]);

  // Filtered summaries based on category filter
  const filteredSummaries = useMemo(() => {
    if (splitFilter === 'all') return summaries;
    return summaries.filter(s => s.splitCategory === splitFilter);
  }, [summaries, splitFilter]);

  // Active muscle summary for individual mode
  const currentMuscleSummary = useMemo(() => {
    return summaries.find(s => s.id === selectedMuscle) || summaries[0];
  }, [summaries, selectedMuscle]);

  // Helper formatting
  const formatKg = (val: number) => {
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}k`;
    }
    return `${Math.round(val)}`;
  };

  const getMuscleKey = (id: MajorMuscleGroup) => {
    if (id === 'hamstrings_glutes') return 'hamstringsGlutesKg';
    return `${id}Kg`;
  };

  const getMuscleSetsKey = (id: MajorMuscleGroup) => {
    if (id === 'hamstrings_glutes') return 'hamstringsGlutesSets';
    return `${id}Sets`;
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const weekItem = weeks.find(w => (isAr ? w.weekLabelAr : w.weekLabel) === label) || weeks[0];
    const totalWeeklyKg = weekItem ? weekItem.totalKg : 0;

    return (
      <div className="rounded-xl border border-border/80 bg-card/95 p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[200px]" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="border-b border-border pb-1.5 flex items-center justify-between gap-2">
          <span className="font-black text-foreground">{label}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{weekItem?.dateRange}</span>
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto">
          {payload.map((entry: any, index: number) => {
            return (
              <div key={`item-${index}`} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 rounded-full shadow-xs"
                    style={{ backgroundColor: entry.color || entry.stroke || entry.fill }}
                  />
                  <span className="text-muted-foreground font-medium">{entry.name}:</span>
                </div>
                <span className="font-mono font-bold text-foreground">
                  {viewMode === 'sets' ? `${entry.value} sets` : `${entry.value.toLocaleString()} kg`}
                </span>
              </div>
            );
          })}
        </div>

        {viewMode !== 'sets' && (
          <div className="border-t border-border pt-1.5 flex items-center justify-between text-xs font-bold text-primary">
            <span>{isAr ? 'إجمالي الأسبوع' : 'Weekly Tonnage'}:</span>
            <span className="font-mono">{totalWeeklyKg.toLocaleString()} kg</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="section-muscle-volume-trends" className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground sm:text-xl">
                {t.progress.muscleGroupVolumeTitle}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t.progress.muscleGroupVolumeSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Top Quick Metrics */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/40 px-3 py-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-muted-foreground">{isAr ? 'أعلى تطور' : 'Top Overload'}:</span>
            <span className="font-black text-foreground">
              {isAr ? topOverloadedMuscle.nameAr : topOverloadedMuscle.name}
            </span>
            <span className="font-mono font-bold text-emerald-400">+{topOverloadedMuscle.deltaPercent}%</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/40 px-3 py-1.5">
            <Dumbbell className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">{isAr ? 'حجم الأسبوع الحالي' : 'Active Week'}:</span>
            <span className="font-mono font-black text-primary">
              {activeWeekTonnageKg.toLocaleString()} kg
            </span>
          </div>
        </div>
      </div>

      {/* Control Toolbar: Muscle Category Filter & Chart View Mode */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-secondary/20 p-2.5 rounded-xl border border-border/60">
        {/* Split Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-muted-foreground mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            {isAr ? 'القسم' : 'Split'}:
          </span>
          <button
            id="filter-muscle-all"
            onClick={() => setSplitFilter('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              splitFilter === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {t.progress.filterAllMuscles}
          </button>
          <button
            id="filter-muscle-push"
            onClick={() => setSplitFilter('push')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              splitFilter === 'push'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-card text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {t.progress.filterPushMuscles}
          </button>
          <button
            id="filter-muscle-pull"
            onClick={() => setSplitFilter('pull')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              splitFilter === 'pull'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-card text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {t.progress.filterPullMuscles}
          </button>
          <button
            id="filter-muscle-legs"
            onClick={() => setSplitFilter('legs')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              splitFilter === 'legs'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-card text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {t.progress.filterLegMuscles}
          </button>
          <button
            id="filter-muscle-core"
            onClick={() => setSplitFilter('core')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              splitFilter === 'core'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-card text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {t.progress.filterCoreMuscles}
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-background/80 p-1 rounded-lg border border-border self-end sm:self-auto">
          <button
            id="view-mode-line"
            onClick={() => setViewMode('line')}
            title={t.progress.viewMultiLine}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
              viewMode === 'line'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LineChartIcon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{t.progress.viewMultiLine}</span>
          </button>

          <button
            id="view-mode-stacked"
            onClick={() => setViewMode('stacked_bar')}
            title={t.progress.viewStackedBar}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
              viewMode === 'stacked_bar'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{t.progress.viewStackedBar}</span>
          </button>

          <button
            id="view-mode-sets"
            onClick={() => setViewMode('sets')}
            title={t.progress.weeklySets}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
              viewMode === 'sets'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{t.progress.weeklySets}</span>
          </button>

          <button
            id="view-mode-individual"
            onClick={() => setViewMode('individual')}
            title={t.progress.viewIndividual}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
              viewMode === 'individual'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Dumbbell className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{t.progress.viewIndividual}</span>
          </button>
        </div>
      </div>

      {/* Individual Muscle Selector Pills (Shown when in Individual Mode) */}
      {viewMode === 'individual' && (
        <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-card border border-border">
          <span className="text-xs font-bold text-muted-foreground px-1">
            {isAr ? 'اختر العضلة' : 'Select Target Muscle'}:
          </span>
          {summaries.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedMuscle(s.id)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all border ${
                selectedMuscle === s.id
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
              }`}
              style={{
                backgroundColor: selectedMuscle === s.id ? s.color : undefined,
              }}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: selectedMuscle === s.id ? '#ffffff' : s.color }}
              />
              <span>{isAr ? s.nameAr : s.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Primary Chart Canvas */}
      <div className="h-[340px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'line' ? (
            <LineChart
              data={weeks}
              margin={{ top: 10, right: isAr ? 10 : 30, left: isAr ? 30 : 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis
                dataKey={isAr ? 'weekLabelAr' : 'weekLabel'}
                stroke="currentColor"
                opacity={0.7}
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                stroke="currentColor"
                opacity={0.7}
                tick={{ fontSize: 11 }}
                tickFormatter={formatKg}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => <span className="text-xs font-bold text-foreground">{value}</span>}
              />
              {filteredSummaries.map(s => (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={getMuscleKey(s.id)}
                  name={isAr ? s.nameAr : s.name}
                  stroke={s.color}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: s.color, strokeWidth: 1.5, stroke: '#1e293b' }}
                  activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          ) : viewMode === 'stacked_bar' ? (
            <BarChart
              data={weeks}
              margin={{ top: 10, right: isAr ? 10 : 30, left: isAr ? 30 : 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis
                dataKey={isAr ? 'weekLabelAr' : 'weekLabel'}
                stroke="currentColor"
                opacity={0.7}
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                stroke="currentColor"
                opacity={0.7}
                tick={{ fontSize: 11 }}
                tickFormatter={formatKg}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => <span className="text-xs font-bold text-foreground">{value}</span>}
              />
              {filteredSummaries.map(s => (
                <Bar
                  key={s.id}
                  dataKey={getMuscleKey(s.id)}
                  name={isAr ? s.nameAr : s.name}
                  stackId="tonnage"
                  fill={s.color}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          ) : viewMode === 'sets' ? (
            <BarChart
              data={weeks}
              margin={{ top: 10, right: isAr ? 10 : 30, left: isAr ? 30 : 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis
                dataKey={isAr ? 'weekLabelAr' : 'weekLabel'}
                stroke="currentColor"
                opacity={0.7}
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                stroke="currentColor"
                opacity={0.7}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: isAr ? 'المجموعات الأسبوعية' : 'Direct Sets/Wk',
                  angle: -90,
                  position: 'insideLeft',
                  fontSize: 10,
                  fill: 'currentColor',
                  opacity: 0.6,
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={10} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'MEV (10 sets)', fill: '#3b82f6', fontSize: 10 }} />
              <ReferenceLine y={20} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'MAV (20 sets)', fill: '#10b981', fontSize: 10 }} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => <span className="text-xs font-bold text-foreground">{value}</span>}
              />
              {filteredSummaries.map(s => (
                <Bar
                  key={s.id}
                  dataKey={getMuscleSetsKey(s.id)}
                  name={isAr ? s.nameAr : s.name}
                  fill={s.color}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : (
            /* Individual Focus Mode */
            <LineChart
              data={weeks}
              margin={{ top: 10, right: isAr ? 10 : 30, left: isAr ? 30 : 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis
                dataKey={isAr ? 'weekLabelAr' : 'weekLabel'}
                stroke="currentColor"
                opacity={0.7}
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                stroke="currentColor"
                opacity={0.7}
                tick={{ fontSize: 11 }}
                tickFormatter={formatKg}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={getMuscleKey(selectedMuscle)}
                name={isAr ? currentMuscleSummary.nameAr : currentMuscleSummary.name}
                stroke={currentMuscleSummary.color}
                strokeWidth={3.5}
                dot={{ r: 4, fill: currentMuscleSummary.color, strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 8, stroke: '#ffffff', strokeWidth: 3 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Hypertrophy Window Guidance */}
      <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs text-primary">
        <Info className="h-4 w-4 shrink-0" />
        <p className="leading-tight">
          <span className="font-bold">{isAr ? 'القاعدة العلمية للبناء العضلي' : 'Hypertrophy Guidance'}: </span>
          {t.progress.mevMavGuidance}
        </p>
      </div>

      {/* Muscle-by-Muscle Detail Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center justify-between">
          <span>{t.progress.muscleBreakdownList}</span>
          <span className="text-xs text-muted-foreground font-normal">
            {isAr ? 'انقر على أي عضلة للتركيز عليها' : 'Click any card to isolate in chart'}
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSummaries.map(muscle => {
            const isSelected = selectedMuscle === muscle.id && viewMode === 'individual';

            return (
              <div
                key={muscle.id}
                onClick={() => {
                  setSelectedMuscle(muscle.id);
                  setViewMode('individual');
                }}
                className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${
                  isSelected
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border bg-card hover:border-border/80 hover:bg-secondary/20'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: muscle.color }}
                    />
                    <span className="text-sm font-black text-foreground">
                      {isAr ? muscle.nameAr : muscle.name}
                    </span>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                      muscle.splitCategory === 'push'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : muscle.splitCategory === 'pull'
                        ? 'bg-blue-500/15 text-blue-400'
                        : muscle.splitCategory === 'legs'
                        ? 'bg-cyan-500/15 text-cyan-400'
                        : 'bg-purple-500/15 text-purple-400'
                    }`}
                  >
                    {muscle.splitCategory}
                  </span>
                </div>

                {/* Numbers */}
                <div className="flex items-baseline justify-between mt-2">
                  <div>
                    <span className="text-xs text-muted-foreground">{isAr ? 'الحجم الأسبوعي' : 'Weekly Volume'}:</span>
                    <div className="text-lg font-black text-foreground font-mono">
                      {muscle.currentWeeklyVolumeKg.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kg</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">{isAr ? 'المجموعات' : 'Direct Sets'}:</span>
                    <div className="text-sm font-bold text-foreground font-mono">
                      {muscle.currentWeeklySets} <span className="text-[10px] font-normal text-muted-foreground">sets</span>
                    </div>
                  </div>
                </div>

                {/* Overload Delta & Status */}
                <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <TrendingUp className={`h-3.5 w-3.5 ${muscle.deltaPercent >= 0 ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span className="text-[11px] text-muted-foreground">{isAr ? 'التطور' : 'Delta'}:</span>
                    <span className={`font-mono font-bold ${muscle.deltaPercent >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {muscle.deltaPercent >= 0 ? `+${muscle.deltaPercent}%` : `${muscle.deltaPercent}%`}
                    </span>
                  </div>

                  <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[140px]">
                    {muscle.recommendedSetRange}
                  </span>
                </div>

                {/* Top Exercise Drivers */}
                {muscle.topExerciseNames.length > 0 && (
                  <div className="mt-2 text-[10px] text-muted-foreground truncate">
                    <span className="font-bold text-foreground/80">{isAr ? 'أهم التمارين' : 'Drivers'}: </span>
                    {muscle.topExerciseNames.slice(0, 2).join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
