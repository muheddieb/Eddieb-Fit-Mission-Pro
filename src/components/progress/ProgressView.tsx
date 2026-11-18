import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Scale,
  Download,
  FileText,
  Plus,
  Check,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import { BodyMeasurement, JointPainLog, UserProfile, WorkoutSession } from '../../types';
import { translations } from '../../i18n/translations';
import { PPLEngine } from '../../services/pplEngine';
import { StorageService } from '../../services/storage';

interface ProgressViewProps {
  profile: UserProfile;
  history: WorkoutSession[];
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  profile,
  history,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [painLogs, setPainLogs] = useState<JointPainLog[]>([]);
  const [newWeight, setNewWeight] = useState<number>(profile.currentWeightKg);
  const [newWaist, setNewWaist] = useState<number>(profile.currentWaistCm);
  const [newNotes, setNewNotes] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Quick Joint Safety Check-In state
  const [painArea, setPainArea] = useState<JointPainLog['area']>('knee');
  const [painSeverity, setPainSeverity] = useState<JointPainLog['severity']>('mild');

  useEffect(() => {
    setMeasurements(StorageService.getMeasurements());
    setPainLogs(StorageService.getJointPainLogs());
  }, []);

  const rollingAvg = PPLEngine.calculate7DayWeightAverage(measurements) || profile.currentWeightKg;
  const trendAnalysis = PPLEngine.evaluateFatLossTrend(measurements, history);

  const sortedMeas = useMemo(
    () => [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [measurements]
  );
  const currentWeight = sortedMeas.length > 0 ? sortedMeas[sortedMeas.length - 1].weight : profile.currentWeightKg;
  const baselineWeight = sortedMeas.length > 0 ? sortedMeas[0].weight : currentWeight;
  const weightChange = Math.round((currentWeight - baselineWeight) * 10) / 10;
  const currentWaist = sortedMeas.length > 0 ? (sortedMeas[sortedMeas.length - 1].waistCm || profile.currentWaistCm) : profile.currentWaistCm;

  const completedWorkouts = useMemo(() => history.filter(w => w.completed), [history]);
  const workoutsThisWeek = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    return completedWorkouts.filter(w => (w.completedAt || w.timestamp || new Date(w.date).getTime()) >= sevenDaysAgo).length;
  }, [completedWorkouts]);
  const targetDays = profile.trainingDaysPerWeek || 4;
  const consistencyPct = Math.min(100, Math.round((workoutsThisWeek / targetDays) * 100));

  const todayCheckIn = StorageService.getTodayCheckIn();
  const checkIns = StorageService.getDailyCheckIns();
  const avgStepsOrActive = useMemo(() => {
    const withSteps = checkIns.filter(c => typeof c.stepsToday === 'number' && c.stepsToday > 0);
    if (withSteps.length === 0) return todayCheckIn.morningActive ? 4500 : 0;
    return Math.round(withSteps.reduce((s, c) => s + (c.stepsToday || 0), 0) / withSteps.length);
  }, [checkIns, todayCheckIn.morningActive]);

  // Strength progression summary (latest 2 completed vs earliest 2)
  const strengthProgressLabel = useMemo(() => {
    const withVol = completedWorkouts.filter(w => (w.totalVolumeKg || 0) > 0);
    if (withVol.length < 2) return isAr ? 'خط أساس قيد البناء' : 'Building baseline';
    const latestVol = withVol[0].totalVolumeKg || 0;
    const prevVol = withVol[Math.min(withVol.length - 1, 3)].totalVolumeKg || latestVol;
    const diffPct = prevVol > 0 ? Math.round(((latestVol - prevVol) / prevVol) * 100) : 0;
    return `${diffPct >= 0 ? '+' : ''}${diffPct}% ${isAr ? 'حجم التدريب' : 'tonnage'}`;
  }, [completedWorkouts, isAr]);

  // Estimated body-fat trend (BIA baseline 32.5% adjusted proportionally by waist/weight trend — indicator only)
  const baseBiaFatPct = profile.latestScaleScan?.bodyFatPercent || 32.5;
  const estBodyFatTrend = Math.max(
    12,
    Math.round((baseBiaFatPct + weightChange * 0.45) * 10) / 10
  );

  const handleAddMeasurement = () => {
    if (!newWeight || newWeight < 30 || newWeight > 300) return;
    const entry: BodyMeasurement = {
      id: 'm_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      weight: Math.round(newWeight * 10) / 10,
      waistCm: newWaist,
      notes: newNotes.trim() || undefined,
    };

    StorageService.addMeasurement(entry);
    setMeasurements(StorageService.getMeasurements());
    setNewNotes('');
  };

  const handleLogJointPain = () => {
    const actionTaken =
      painSeverity === 'sharp'
        ? isAr
          ? 'إيقاف التمرين المسبب للألم وتبديله بجهاز آمن أو دراجة ثابتة.'
          : 'Stopped painful movement immediately; switched to joint-safe option or rest.'
        : isAr
          ? 'تخفيف الوزن 15% والتبديل للمستوى السهل (Easy).'
          : 'Reduced load by 15% and switched to Easy joint-friendly tier.';

    StorageService.addJointPainLog({
      id: `pain_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      area: painArea,
      severity: painSeverity,
      actionTaken,
    });
    setPainLogs(StorageService.getJointPainLogs());
  };

  const handleExportJSON = () => {
    const jsonStr = StorageService.exportAllDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eddieb-fit-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess('JSON backup exported');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleExportCSV = () => {
    const csvStr = StorageService.exportWorkoutsAsCSV();
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eddieb-fit-workouts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess('Workouts CSV exported');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header & Export Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">
            {isAr ? 'ملخص التقدم والنتائج' : 'Progress Summary'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isAr
              ? 'مؤشرات واضحة ومباشرة بدون تشتيت — قياسات الـ BIA مؤشرات اتجاهية وليست طبية.'
              : 'Focused core metrics without chart clutter. BIA figures are directional trends, not medical diagnostics.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-export-json"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Download className="h-4 w-4 text-primary" />
            <span>JSON</span>
          </button>

          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors"
          >
            <FileText className="h-4 w-4 text-emerald-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-400 flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Adaptive Feedback Banner */}
      <div className={`rounded-2xl border p-5 space-y-2 ${
        trendAnalysis.trendScore === 'warning'
          ? 'border-amber-500/40 bg-amber-500/10'
          : trendAnalysis.trendScore === 'positive'
            ? 'border-emerald-500/40 bg-emerald-500/10'
            : 'border-border bg-card'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-sm sm:text-base font-black text-foreground">
              {isAr ? trendAnalysis.badgeAr : trendAnalysis.badge}
            </h2>
          </div>
          <span className="text-xs font-mono tabular-nums font-bold text-muted-foreground">
            {isAr ? 'متوسط 7 أيام:' : '7d Avg:'} {rollingAvg} kg
          </span>
        </div>
        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
          {isAr ? trendAnalysis.explanationAr : trendAnalysis.explanation}
        </p>
      </div>

      {/* 9 Essential Progress Metrics Grid (Zero Heavy Charts, Pure Tabular Numbers) */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/70 border-b border-border/70 font-mono tabular-nums">
          <div className="p-4 space-y-1">
            <div className="text-[11px] font-sans text-muted-foreground">{isAr ? 'الوزن الحالي' : 'Current Weight'}</div>
            <div className="text-2xl font-black text-foreground">{currentWeight} kg</div>
            <div className="text-[11px] font-sans text-muted-foreground">{isAr ? 'هدف المرحلة 1: 80 كجم' : 'Phase 1 Target: 80 kg'}</div>
          </div>

          <div className="p-4 space-y-1">
            <div className="text-[11px] font-sans text-muted-foreground">{isAr ? 'متوسط الوزن (7 أيام)' : '7-Day Weight Avg'}</div>
            <div className="text-2xl font-black text-primary">{rollingAvg} kg</div>
            <div className="text-[11px] font-sans text-muted-foreground">{isAr ? 'يصفي تغيرات السوائل' : 'Smooths daily water shifts'}</div>
          </div>

          <div className="p-4 space-y-1">
            <div className="text-[11px] font-sans text-muted-foreground">{isAr ? 'التغير الكلي في الوزن' : 'Weight Change'}</div>
            <div className={`text-2xl font-black ${weightChange <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {weightChange > 0 ? `+${weightChange}` : weightChange} kg
            </div>
            <div className="text-[11px] font-sans text-muted-foreground">{isAr ? `من خط البداية ${baselineWeight} كجم` : `From ${baselineWeight} kg start`}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/70 border-b border-border/70 font-mono tabular-nums">
          <div className="p-4 space-y-1">
            <div className="text-[11px] font-sans text-muted-foreground">{isAr ? 'محيط الخصر' : 'Waist Circumference'}</div>
            <div className="text-2xl font-black text-foreground">{currentWaist} cm</div>
            <div className="text-[11px] font-sans text-muted-foreground">{isAr ? 'مؤشر دهون البطن الحشوية' : 'Visceral fat trend indicator'}</div>
          </div>

          <div className="p-4 space-y-1">
            <div className="text-[11px] font-sans text-muted-foreground">{isAr ? 'الالتزام الأسبوعي' : 'Workout Consistency'}</div>
            <div className="text-2xl font-black text-emerald-400">{consistencyPct}%</div>
            <div className="text-[11px] font-sans text-muted-foreground">{workoutsThisWeek} / {targetDays} {isAr ? 'جلسات هذا الأسبوع' : 'sessions this week'}</div>
          </div>

          <div className="p-4 space-y-1">
            <div className="text-[11px] font-sans text-muted-foreground">{isAr ? 'إجمالي التمارين المكتملة' : 'Completed Sessions'}</div>
            <div className="text-2xl font-black text-foreground">{completedWorkouts.length}</div>
            <div className="text-[11px] font-sans text-muted-foreground">{isAr ? 'منذ بداية البرنامج' : 'Total logged sessions'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/70 font-mono tabular-nums">
          <div className="p-4 space-y-1">
            <div className="text-[11px] font-sans text-muted-foreground">{isAr ? 'النشاط / خطوات الصباح' : 'Daily Steps / Activity'}</div>
            <div className="text-xl font-black text-foreground">
              {avgStepsOrActive > 0 ? avgStepsOrActive.toLocaleString() : (isAr ? 'سجّل من الرئيسية' : 'Log on Home')}
            </div>
            <div className="text-[11px] font-sans text-muted-foreground">{isAr ? 'الهدف اليومي: 7,500–9,000 خطوة' : 'Target: 7,500–9,000 steps/day'}</div>
          </div>

          <div className="p-4 space-y-1">
            <div className="text-[11px] font-sans text-muted-foreground">{isAr ? 'تطور القوة العضلية' : 'Strength Progression'}</div>
            <div className="text-xl font-black text-primary">{strengthProgressLabel}</div>
            <div className="text-[11px] font-sans text-muted-foreground">{isAr ? 'مقارنة بأول الجلسات' : 'Compared to baseline'}</div>
          </div>

          <div className="p-4 space-y-1">
            <div className="text-[11px] font-sans text-muted-foreground">{isAr ? 'اتجاه نسبة الدهون (تقديري BIA)' : 'Est. Body-Fat Trend (BIA)'}</div>
            <div className="text-xl font-black text-foreground">~{estBodyFatTrend}%</div>
            <div className="text-[11px] font-sans text-muted-foreground">{isAr ? 'مؤشر اتجاهي وليس طبياً' : 'Directional indicator only'}</div>
          </div>
        </div>
      </div>

      {/* Log Weight / Waist + Knee/Back Joint Pain Safety Check */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Log Weight & Waist */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-base font-black text-foreground flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <span>{t.progress.logWeight}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                {isAr ? 'الوزن (كجم)' : 'Weight (kg)'}
              </label>
              <input
                type="number"
                step="0.1"
                value={newWeight}
                onChange={e => setNewWeight(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold font-mono tabular-nums text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                {isAr ? 'الخصر (سم)' : 'Waist (cm)'}
              </label>
              <input
                type="number"
                step="0.5"
                value={newWaist}
                onChange={e => setNewWaist(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold font-mono tabular-nums text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                {isAr ? 'ملاحظات' : 'Notes'}
              </label>
              <input
                type="text"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder={isAr ? 'بعد الفجر صائم...' : 'Morning fasted...'}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <button
            id="btn-save-measurement-entry"
            onClick={handleAddMeasurement}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{isAr ? 'حفظ القياس' : 'Save Check-In'}</span>
          </button>
        </div>

        {/* Joint / Knee / Lower-Back Pain Safety Check */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-base font-black text-foreground flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <span>{isAr ? 'فحص سلامة الركبة وأسفل الظهر' : 'Knee & Lower-Back Safety Check'}</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? 'إذا شعرت بألم غير معتاد في الركبة أو أسفل الظهر، سجله هنا ليقترح التطبيق تخفيف الحمل أو تبديل التمرين فوراً.'
              : 'Log any unusual knee or lower-back discomfort to trigger joint-safe load adjustments.'}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{isAr ? 'المنطقة' : 'Area'}</label>
              <select
                value={painArea}
                onChange={e => setPainArea(e.target.value as JointPainLog['area'])}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-bold text-foreground"
              >
                <option value="knee">{isAr ? 'الركبة' : 'Knee'}</option>
                <option value="lower_back">{isAr ? 'أسفل الظهر' : 'Lower Back'}</option>
                <option value="shoulder">{isAr ? 'الكتف' : 'Shoulder'}</option>
                <option value="other">{isAr ? 'أخرى' : 'Other'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">{isAr ? 'الدرجة' : 'Severity'}</label>
              <select
                value={painSeverity}
                onChange={e => setPainSeverity(e.target.value as JointPainLog['severity'])}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-bold text-foreground"
              >
                <option value="mild">{isAr ? 'بسيط (تيبس خفيف)' : 'Mild tightness'}</option>
                <option value="moderate">{isAr ? 'متوسط (خفف الوزن)' : 'Moderate (reduce load)'}</option>
                <option value="sharp">{isAr ? 'حاد (توقف فوراً)' : 'Sharp pain (stop lift)'}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              id="btn-log-joint-pain"
              type="button"
              onClick={handleLogJointPain}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/25"
            >
              <Activity className="h-3.5 w-3.5" />
              <span>{isAr ? 'تسجيل تنبيه المفصل' : 'Log Joint Check'}</span>
            </button>
            {painLogs.length > 0 && (
              <span className="text-[11px] text-muted-foreground truncate">
                {painLogs[0].date}: {painLogs[0].actionTaken}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Historical Measurements Table */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-base font-black text-foreground">
          {isAr ? 'سجل القياسات التاريخي' : 'Measurement Log History'} ({measurements.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start font-mono tabular-nums">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-sans font-bold">
                <th className="py-2.5 px-3 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'الوزن (كجم)' : 'Weight (kg)'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'الخصر (سم)' : 'Waist (cm)'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'ملاحظات' : 'Notes'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {measurements.map(m => (
                <tr key={m.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-foreground">{m.date}</td>
                  <td className="py-2.5 px-3 font-bold text-primary">{m.weight} kg</td>
                  <td className="py-2.5 px-3 font-medium text-foreground">{m.waistCm || '-'} cm</td>
                  <td className="py-2.5 px-3 font-sans text-muted-foreground">{m.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
