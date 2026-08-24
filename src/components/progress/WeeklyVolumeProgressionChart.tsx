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
  TrendingUp,
  Award,
  Flame,
  Zap,
  Layers,
  Calendar,
  CheckCircle2,
  BarChart3,
  Dumbbell,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  ChevronRight,
  Target,
  RefreshCw,
} from 'lucide-react';
import { UserProfile, WorkoutSession, WeeklyVolumeBlockPoint, TrainingBlockInfo, OverloadMilestone } from '../../types';
import { PPLEngine } from '../../services/pplEngine';
import { translations } from '../../i18n/translations';

interface WeeklyVolumeProgressionChartProps {
  history: WorkoutSession[];
  profile: UserProfile;
  isAr?: boolean;
}

type ViewMode = 'block_comparison' | 'continuous' | 'split_breakdown';
type VolumeUnit = 'tons' | 'kg' | 'sets';

export const WeeklyVolumeProgressionChart: React.FC<WeeklyVolumeProgressionChartProps> = ({
  history,
  profile,
  isAr = false,
}) => {
  const t = translations[profile.language || 'en'];
  const [viewMode, setViewMode] = useState<ViewMode>('block_comparison');
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>('tons');
  const [showOverloadTargetLine, setShowOverloadTargetLine] = useState<boolean>(true);
  const [selectedBlockNumber, setSelectedBlockNumber] = useState<number>(2);

  // Compute full training block progression data
  const progressionData = useMemo(() => {
    return PPLEngine.getTrainingBlocksVolumeProgression(history, profile);
  }, [history, profile]);

  const {
    weeksData,
    blocks,
    milestones,
    currentBlock,
    previousBlock,
    overallOverloadPercent,
    highestWeekVolumeKg,
    cumulativeTonnageKg,
    averageWeeklyVolumeKg,
    activeOverloadStreakWeeks,
  } = progressionData;

  // Formatted data for Block Comparison (Week 1..4 in Block 1 vs Block 2)
  const blockComparisonData = useMemo(() => {
    const b1Weeks = weeksData.filter(w => w.blockNumber === 1);
    const b2Weeks = weeksData.filter(w => w.blockNumber === 2);

    return [1, 2, 3, 4].map(wInBlock => {
      const b1 = b1Weeks.find(w => w.weekInBlock === wInBlock);
      const b2 = b2Weeks.find(w => w.weekInBlock === wInBlock);

      const b1VolTons = b1 ? b1.volumeTons : 0;
      const b2VolTons = b2 ? b2.volumeTons : 0;
      const b1VolKg = b1 ? b1.volumeKg : 0;
      const b2VolKg = b2 ? b2.volumeKg : 0;
      const b1Sets = b1 ? b1.completedSets : 0;
      const b2Sets = b2 ? b2.completedSets : 0;

      const deltaPercent = b1VolKg > 0 ? Math.round((((b2VolKg - b1VolKg) / b1VolKg) * 100) * 10) / 10 : 0;

      const weekNamesEn = ['Week 1: Adaptation', 'Week 2: Loading', 'Week 3: Peak Volume', 'Week 4: Deload & Reset'];
      const weekNamesAr = ['الأسبوع 1: التكيف', 'الأسبوع 2: زيادة الحمل', 'الأسبوع 3: قمة الحجم', 'الأسبوع 4: استشفاء وتفريغ'];

      return {
        weekInBlock: `W${wInBlock}`,
        label: isAr ? weekNamesAr[wInBlock - 1] : weekNamesEn[wInBlock - 1],
        subLabel: isAr ? `أسبوع ${wInBlock}` : `Week ${wInBlock}`,
        block1Tons: b1VolTons,
        block2Tons: b2VolTons,
        block1Kg: b1VolKg,
        block2Kg: b2VolKg,
        block1Sets: b1Sets,
        block2Sets: b2Sets,
        deltaPercent,
        isDeload: wInBlock === 4,
        b1Raw: b1,
        b2Raw: b2,
      };
    });
  }, [weeksData, isAr]);

  // Formatted data for Continuous Multi-Week Progression
  const continuousChartData = useMemo(() => {
    return weeksData.map(w => ({
      ...w,
      displayVolume: volumeUnit === 'tons' ? w.volumeTons : volumeUnit === 'kg' ? w.volumeKg : w.completedSets,
      displayTarget: volumeUnit === 'tons' ? Math.round((w.targetVolumeKg / 1000) * 10) / 10 : volumeUnit === 'kg' ? w.targetVolumeKg : 70,
      pushVolumeTons: Math.round((w.pushVolumeKg / 1000) * 10) / 10,
      pullVolumeTons: Math.round((w.pullVolumeKg / 1000) * 10) / 10,
      legsVolumeTons: Math.round((w.legsVolumeKg / 1000) * 10) / 10,
    }));
  }, [weeksData, volumeUnit]);

  // Custom Recharts Tooltip for Block Comparison
  const BlockComparisonTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const item = payload[0]?.payload;
    if (!item) return null;

    return (
      <div className="rounded-2xl border border-border/80 bg-popover/95 p-4 shadow-2xl backdrop-blur-md text-xs space-y-3 min-w-[240px] max-w-sm">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <span className="font-bold text-foreground">{item.label}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
            item.deltaPercent >= 3
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : item.isDeload
              ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
          }`}>
            {item.isDeload ? (isAr ? 'استشفاء' : 'Deload') : `${item.deltaPercent >= 0 ? '+' : ''}${item.deltaPercent}% Overload`}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span>{isAr ? 'البلوك 1 (المرجعي):' : 'Block 1 (Baseline):'}</span>
            </span>
            <span className="font-mono font-bold text-foreground">
              {volumeUnit === 'tons' ? `${item.block1Tons} Tons` : volumeUnit === 'kg' ? `${item.block1Kg.toLocaleString()} kg` : `${item.block1Sets} sets`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>{isAr ? 'البلوك 2 (الحالي):' : 'Block 2 (Current):'}</span>
            </span>
            <span className="font-mono font-black text-emerald-400">
              {volumeUnit === 'tons' ? `${item.block2Tons} Tons` : volumeUnit === 'kg' ? `${item.block2Kg.toLocaleString()} kg` : `${item.block2Sets} sets`}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-secondary/50 p-2.5 space-y-1 text-[11px]">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>{isAr ? 'فارق الوزن المرفوع:' : 'Volume Delta:'}</span>
            <span className="font-mono font-bold text-foreground">
              +{(item.block2Kg - item.block1Kg).toLocaleString()} kg
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/40">
            {item.isDeload
              ? (isAr ? 'تخفيض الحجم المبرمج لإعادة حساسية المستقبلات العضلية والاستشفاء العصبي.' : 'Planned volume taper for CNS restoration and connective tissue resilience.')
              : (isAr ? 'تحقيق التوتر الميكانيكي المطلوب لتحفيز تضخيم الألياف العضلية.' : 'Progressive overload stimulus successfully applied to drive muscular hypertrophy.')}
          </p>
        </div>
      </div>
    );
  };

  // Custom Recharts Tooltip for Continuous Progression
  const ContinuousTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const pt: WeeklyVolumeBlockPoint = payload[0]?.payload;
    if (!pt) return null;

    return (
      <div className="rounded-2xl border border-border/80 bg-popover/95 p-4 shadow-2xl backdrop-blur-md text-xs space-y-2.5 min-w-[240px] max-w-sm">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{isAr ? pt.weekLabelAr : pt.weekLabel}</span>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
            pt.isDeload
              ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
              : pt.isOverloadAchieved
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
          }`}>
            {isAr ? `البلوك ${pt.blockNumber}` : `Block ${pt.blockNumber}`}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[10px] text-muted-foreground block">{isAr ? 'إجمالي الحجم' : 'Total Weekly Tonnage'}</span>
            <span className="text-2xl font-black text-foreground font-mono">{pt.volumeTons}</span>
            <span className="text-xs font-bold text-muted-foreground ml-1">Tons ({pt.volumeKg.toLocaleString()} kg)</span>
          </div>
          {pt.overloadDeltaPercent !== undefined && (
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block">{isAr ? 'مقارنة بالبلوك السابق' : 'vs Prev Block'}</span>
              <span className={`text-xs font-black font-mono ${pt.overloadDeltaPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {pt.overloadDeltaPercent >= 0 ? `+${pt.overloadDeltaPercent}%` : `${pt.overloadDeltaPercent}%`}
              </span>
            </div>
          )}
        </div>

        {/* Split Distribution */}
        <div className="rounded-xl bg-secondary/50 p-2.5 space-y-1.5">
          <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-between">
            <span>{isAr ? 'توزيع الحجم التدريبي' : 'Split Distribution'}</span>
            <span>{pt.completedSets} Sets</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono font-bold">
            <div className="rounded-lg bg-rose-500/10 text-rose-400 p-1.5 text-center">
              <span className="block text-[9px] font-sans text-muted-foreground">{isAr ? 'دفع' : 'Push'}</span>
              {Math.round(pt.pushVolumeKg / 1000 * 10) / 10}T
            </div>
            <div className="rounded-lg bg-sky-500/10 text-sky-400 p-1.5 text-center">
              <span className="block text-[9px] font-sans text-muted-foreground">{isAr ? 'سحب' : 'Pull'}</span>
              {Math.round(pt.pullVolumeKg / 1000 * 10) / 10}T
            </div>
            <div className="rounded-lg bg-emerald-500/10 text-emerald-400 p-1.5 text-center">
              <span className="block text-[9px] font-sans text-muted-foreground">{isAr ? 'أرجل' : 'Legs'}</span>
              {Math.round(pt.legsVolumeKg / 1000 * 10) / 10}T
            </div>
          </div>
        </div>

        {pt.milestones.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 pt-1">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>{isAr ? pt.milestonesAr[0] : pt.milestones[0]}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6" id="section-weekly-volume-progression">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 text-white shadow-md shadow-emerald-500/20">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-foreground">
                {isAr ? 'تطور الحجم التدريبي وزيادة الأحمال بين البلوكات' : 'Weekly Volume & Training Block Overload'}
              </h3>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-400 border border-emerald-500/30">
                {isAr ? `+${overallOverloadPercent}% زيادة متدرجة` : `+${overallOverloadPercent}% Block Overload`}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {isAr
                ? 'مقارنة دقيقة بين البلوك التدريبي الحالي والسابق لرصد التطور وتأكيد مبدأ زيادة الأحمال التصاعدية.'
                : 'Comparing current mesocycle training blocks to previous blocks to visualize hypertrophy progression.'}
            </p>
          </div>
        </div>

        {/* View Mode Switcher & Metric Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Buttons */}
          <div className="flex items-center rounded-xl bg-secondary/50 p-1 border border-border">
            <button
              type="button"
              id="btn-view-block-comp"
              onClick={() => setViewMode('block_comparison')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                viewMode === 'block_comparison'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'مقارنة البلوكات' : 'Block Comparison'}
            </button>
            <button
              type="button"
              id="btn-view-continuous"
              onClick={() => setViewMode('continuous')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                viewMode === 'continuous'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'مسار الـ 8 أسابيع' : '8-Week Timeline'}
            </button>
            <button
              type="button"
              id="btn-view-split"
              onClick={() => setViewMode('split_breakdown')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                viewMode === 'split_breakdown'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'تقسيم الـ PPL' : 'PPL Split'}
            </button>
          </div>

          {/* Unit Toggle */}
          <div className="flex items-center rounded-xl bg-secondary/40 p-1 border border-border text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setVolumeUnit('tons')}
              className={`rounded-lg px-2 py-1 transition-colors ${
                volumeUnit === 'tons' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'طن' : 'Tons'}
            </button>
            <button
              type="button"
              onClick={() => setVolumeUnit('kg')}
              className={`rounded-lg px-2 py-1 transition-colors ${
                volumeUnit === 'kg' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'كجم' : 'kg'}
            </button>
            <button
              type="button"
              onClick={() => setVolumeUnit('sets')}
              className={`rounded-lg px-2 py-1 transition-colors ${
                volumeUnit === 'sets' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'مجموعات' : 'Sets'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Card 1: Block Overload Delta */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300 uppercase">
            <span>{isAr ? 'زيادة البلوك الحالي' : 'Block Overload Delta'}</span>
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono flex items-baseline gap-1">
            <span>+{overallOverloadPercent}%</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">
            {isAr ? `البلوك 2 vs البلوك 1 (+${Math.round((currentBlock.totalTonnageKg - previousBlock.totalTonnageKg) / 1000 * 10) / 10} طن)` : `Block 2 vs Block 1 (+${Math.round((currentBlock.totalTonnageKg - previousBlock.totalTonnageKg) / 1000 * 10) / 10}T)`}
          </div>
        </div>

        {/* Card 2: Cumulative Program Tonnage */}
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-sky-300 uppercase">
            <span>{isAr ? 'إجمالي الأطنان المرفوعة' : 'Cumulative Tonnage'}</span>
            <Flame className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono flex items-baseline gap-1">
            <span>{Math.round((cumulativeTonnageKg / 1000) * 10) / 10}</span>
            <span className="text-xs font-semibold text-muted-foreground">Tons</span>
          </div>
          <div className="text-[10px] text-sky-400 font-medium">
            {cumulativeTonnageKg.toLocaleString()} kg total mechanical work
          </div>
        </div>

        {/* Card 3: Peak Weekly Volume */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 uppercase">
            <span>{isAr ? 'أعلى أسبوع تدريبي' : 'Peak Weekly Volume'}</span>
            <Zap className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono flex items-baseline gap-1">
            <span>{Math.round((highestWeekVolumeKg / 1000) * 10) / 10}</span>
            <span className="text-xs font-semibold text-muted-foreground">Tons</span>
          </div>
          <div className="text-[10px] text-amber-400 font-medium">
            {isAr ? 'أعلى قمة في البلوك الحالي' : 'Personal Volume Record'}
          </div>
        </div>

        {/* Card 4: Overload Streak */}
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300 uppercase">
            <span>{isAr ? 'سلسلة زيادة الأحمال' : 'Overload Streak'}</span>
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono flex items-baseline gap-1">
            <span>{activeOverloadStreakWeeks}</span>
            <span className="text-xs font-semibold text-muted-foreground">{isAr ? 'أسابيع' : 'Weeks'}</span>
          </div>
          <div className="text-[10px] text-indigo-400 font-medium">
            {isAr ? 'استمرار تصاعدي متواصل' : 'Continuous overload progression'}
          </div>
        </div>
      </div>

      {/* Main Recharts Progression Canvas */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 text-muted-foreground">
            {viewMode === 'block_comparison' ? (
              <>
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                  <span>{isAr ? 'البلوك 1 (المرجعي / التأسيس)' : 'Block 1 (Baseline Foundation)'}</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span>{isAr ? 'البلوك 2 (الحالي / زيادة الأحمال)' : 'Block 2 (Current Overload)'}</span>
                </span>
              </>
            ) : viewMode === 'continuous' ? (
              <>
                <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span>{isAr ? 'الحجم الأسبوعي المرفوع' : 'Weekly Volume Output'}</span>
                </span>
                {showOverloadTargetLine && (
                  <span className="flex items-center gap-1.5 font-medium text-amber-400">
                    <span className="h-0.5 w-3 bg-amber-400 border-b border-dashed border-amber-400" />
                    <span>{isAr ? 'مسار الزيادة المستهدفة (+4%)' : 'Target Overload Slope (+4%)'}</span>
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 font-medium text-rose-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span>{isAr ? 'تمارين الدفع (الصدر/الكتف/التراي)' : 'Push Split'}</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium text-sky-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                  <span>{isAr ? 'تمارين السحب (الظهر/الباي)' : 'Pull Split'}</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span>{isAr ? 'تمارين الأرجل' : 'Legs Split'}</span>
                </span>
              </>
            )}
          </div>

          {/* Toggle Target Line */}
          {viewMode === 'continuous' && (
            <button
              type="button"
              onClick={() => setShowOverloadTargetLine(!showOverloadTargetLine)}
              className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-all border ${
                showOverloadTargetLine
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                  : 'border-border bg-secondary/30 text-muted-foreground'
              }`}
            >
              {isAr ? 'خط الهدف (+4%)' : 'Target Overload Line'}
            </button>
          )}
        </div>

        {/* The Recharts Container */}
        <div className="h-72 sm:h-80 w-full rounded-2xl border border-border/80 bg-background/50 p-2 sm:p-4 backdrop-blur-sm">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'block_comparison' ? (
              /* Mode 1: Block vs Block Comparison Chart */
              <ComposedChart
                data={blockComparisonData}
                margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false} />
                <XAxis dataKey="label" stroke="currentColor" className="text-[10px] text-muted-foreground" tickLine={false} axisLine={false} dy={8} />
                <YAxis
                  stroke="currentColor"
                  className="text-[10px] text-muted-foreground font-mono"
                  tickLine={false}
                  axisLine={false}
                  dx={-4}
                  unit={volumeUnit === 'tons' ? 'T' : volumeUnit === 'kg' ? 'k' : ''}
                />
                <Tooltip content={<BlockComparisonTooltip />} />

                {/* Block 1 (Previous Baseline) Bar */}
                <Bar
                  dataKey={volumeUnit === 'tons' ? 'block1Tons' : volumeUnit === 'kg' ? 'block1Kg' : 'block1Sets'}
                  name={isAr ? 'البلوك 1 (المرجعي)' : 'Block 1 (Baseline)'}
                  fill="#94a3b8"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={42}
                />

                {/* Block 2 (Current Overload) Bar */}
                <Bar
                  dataKey={volumeUnit === 'tons' ? 'block2Tons' : volumeUnit === 'kg' ? 'block2Kg' : 'block2Sets'}
                  name={isAr ? 'البلوك 2 (الحالي)' : 'Block 2 (Current)'}
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={42}
                >
                  {blockComparisonData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isDeload ? '#818cf8' : '#10b981'}
                    />
                  ))}
                </Bar>
              </ComposedChart>
            ) : viewMode === 'continuous' ? (
              /* Mode 2: Continuous 8-Week Timeline with Reference Bands */
              <ComposedChart
                data={continuousChartData}
                margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="volProgressionArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="60%" stopColor="#10b981" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false} />

                {/* Reference Area for Block 1 (Weeks 1-4) */}
                <ReferenceArea
                  x1="W1 (B1·W1)"
                  x2="W4 (B1·W4)"
                  {...({ fill: '#64748b', fillOpacity: 0.05, strokeOpacity: 0 } as any)}
                />

                {/* Reference Area for Block 2 (Weeks 5-8) */}
                <ReferenceArea
                  x1="W5 (B2·W1)"
                  x2="W8 (B2·W4)"
                  {...({ fill: '#10b981', fillOpacity: 0.06, strokeOpacity: 0 } as any)}
                />

                <XAxis dataKey="weekLabel" stroke="currentColor" className="text-[10px] text-muted-foreground font-mono" tickLine={false} axisLine={false} dy={8} />
                <YAxis
                  stroke="currentColor"
                  className="text-[10px] text-muted-foreground font-mono"
                  tickLine={false}
                  axisLine={false}
                  dx={-4}
                  unit={volumeUnit === 'tons' ? 'T' : volumeUnit === 'kg' ? 'k' : ''}
                />
                <Tooltip content={<ContinuousTooltip />} />

                {/* Target Overload Slope Reference Line */}
                {showOverloadTargetLine && (
                  <Line
                    type="monotone"
                    dataKey="displayTarget"
                    stroke="#fbbf24"
                    strokeDasharray="4 4"
                    strokeWidth={1.8}
                    dot={false}
                    name={isAr ? 'الهدف المتدرج' : 'Target Overload'}
                  />
                )}

                {/* Shaded Area */}
                <Area
                  type="monotone"
                  dataKey="displayVolume"
                  stroke="none"
                  fill="url(#volProgressionArea)"
                  isAnimationActive={false}
                />

                {/* Volume Output Line */}
                <Line
                  type="monotone"
                  dataKey="displayVolume"
                  stroke="#10b981"
                  strokeWidth={2.8}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (!cx || !cy || !payload) return <circle key={`dot-empty-${Math.random()}`} />;
                    if (payload.isDeload) {
                      return (
                        <circle
                          key={`dot-${payload.weekNumber}`}
                          cx={cx}
                          cy={cy}
                          r={4.5}
                          fill="#818cf8"
                          stroke="#ffffff"
                          strokeWidth={1.5}
                        />
                      );
                    }
                    if (payload.isCurrentWeek) {
                      return (
                        <circle
                          key="dot-cur"
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth={2}
                          className="animate-pulse"
                        />
                      );
                    }
                    return <circle key={`dot-${payload.weekNumber}`} cx={cx} cy={cy} r={3.5} fill="#10b981" stroke="#ffffff" strokeWidth={1} />;
                  }}
                  activeDot={{
                    r: 7,
                    fill: '#10b981',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              </ComposedChart>
            ) : (
              /* Mode 3: PPL Split Stacked Breakdown */
              <BarChart
                data={continuousChartData}
                margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false} />
                <XAxis dataKey="weekLabel" stroke="currentColor" className="text-[10px] text-muted-foreground font-mono" tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="currentColor" className="text-[10px] text-muted-foreground font-mono" tickLine={false} axisLine={false} dx={-4} unit="T" />
                <Tooltip content={<ContinuousTooltip />} />

                <Bar dataKey="pushVolumeTons" name={isAr ? 'دفع' : 'Push'} stackId="a" fill="#f43f5e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pullVolumeTons" name={isAr ? 'سحب' : 'Pull'} stackId="a" fill="#38bdf8" radius={[0, 0, 0, 0]} />
                <Bar dataKey="legsVolumeTons" name={isAr ? 'أرجل' : 'Legs'} stackId="a" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Progressive Overload Milestones Achievements Grid */}
      <div className="space-y-3 pt-2 border-t border-border/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-400" />
            <h4 className="text-sm font-bold text-foreground">
              {isAr ? 'أوسمة وإنجازات زيادة الأحمال المتدرجة' : 'Progressive Overload Milestones & Achievements'}
            </h4>
          </div>
          <span className="text-xs text-muted-foreground">
            {milestones.filter(m => m.achieved).length}/{milestones.length} {isAr ? 'مكتمل' : 'Achieved'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {milestones.map((m) => {
            const pct = Math.min(100, Math.round((m.currentValue / m.thresholdValue) * 100));

            return (
              <div
                key={m.id}
                className={`rounded-2xl border p-3.5 space-y-2.5 transition-all ${
                  m.achieved
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      m.achieved ? 'bg-emerald-500 text-white' : 'bg-secondary text-muted-foreground'
                    }`}>
                      {m.iconName === 'Flame' && <Flame className="h-4 w-4" />}
                      {m.iconName === 'Award' && <Award className="h-4 w-4" />}
                      {m.iconName === 'TrendingUp' && <TrendingUp className="h-4 w-4" />}
                      {m.iconName === 'Zap' && <Zap className="h-4 w-4" />}
                      {m.iconName === 'ShieldCheck' && <ShieldCheck className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        {isAr ? m.titleAr : m.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {m.achieved ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {m.achievedDate || (isAr ? 'مكتمل' : 'Achieved')}
                          </span>
                        ) : (
                          `${m.currentValue} / ${m.thresholdValue} ${m.unit}`
                        )}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    m.achieved
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-secondary text-muted-foreground'
                  }`}>
                    {m.achieved ? 'Unlocked' : `${pct}%`}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {isAr ? m.descriptionAr : m.description}
                </p>

                {/* Progress Bar */}
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${m.achieved ? 'bg-emerald-500' : 'bg-primary'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Week-by-Week Overload Audit Comparison Table */}
      <div className="rounded-2xl border border-border bg-secondary/20 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
              {isAr ? 'جدول مقارنة الأسابيع بين البلوك 1 والبلوك 2' : 'Block 1 vs Block 2 Overload Audit'}
            </h4>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {isAr ? 'معدل التضخيم العضلي' : 'Hypertrophy Stimulus Matrix'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left" dir={isAr ? 'rtl' : 'ltr'}>
            <thead>
              <tr className="border-b border-border text-muted-foreground font-bold uppercase text-[10px]">
                <th className="py-2 px-3">{isAr ? 'الأسبوع في البلوك' : 'Week in Block'}</th>
                <th className="py-2 px-3">{isAr ? 'البلوك 1 (المرجعي)' : 'Block 1 (Base)'}</th>
                <th className="py-2 px-3">{isAr ? 'البلوك 2 (الحالي)' : 'Block 2 (Current)'}</th>
                <th className="py-2 px-3">{isAr ? 'نسبة الزيادة' : 'Overload Delta'}</th>
                <th className="py-2 px-3">{isAr ? 'المجموعات' : 'Sets'}</th>
                <th className="py-2 px-3">{isAr ? 'الحالة الفسيولوجية' : 'Physiological Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono text-[11px]">
              {blockComparisonData.map((row) => (
                <tr key={row.weekInBlock} className="hover:bg-secondary/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold font-sans text-foreground flex items-center gap-1.5">
                    <span>{row.label}</span>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {row.block1Tons} Tons <span className="text-[10px] text-muted-foreground/80 font-sans">({row.block1Kg.toLocaleString()} kg)</span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-emerald-400">
                    {row.block2Tons} Tons <span className="text-[10px] text-emerald-400/80 font-sans">({row.block2Kg.toLocaleString()} kg)</span>
                  </td>
                  <td className="py-2.5 px-3 font-black">
                    <span className={`inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[10px] ${
                      row.isDeload
                        ? 'bg-indigo-500/15 text-indigo-400'
                        : row.deltaPercent >= 3
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {row.deltaPercent >= 0 ? `+${row.deltaPercent}%` : `${row.deltaPercent}%`}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-foreground font-sans">
                    {row.block2Sets} sets
                  </td>
                  <td className="py-2.5 px-3 font-sans text-[11px]">
                    {row.isDeload ? (
                      <span className="text-indigo-400 font-bold">{isAr ? 'تفريغ أحمال واستشفاء' : 'Active Deload & Reset'}</span>
                    ) : row.deltaPercent >= 5 ? (
                      <span className="text-emerald-400 font-bold">{isAr ? 'زيادة أحمال ممتازة (+5%+)' : 'Prime Hypertrophy Overload'}</span>
                    ) : (
                      <span className="text-amber-400 font-bold">{isAr ? 'حمل تدريبي تصاعدي' : 'Steady Volume Loading'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
