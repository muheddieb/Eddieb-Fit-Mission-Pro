import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Scale, 
  Target, 
  Download, 
  FileText, 
  Plus, 
  Calendar, 
  Activity, 
  Check, 
  Sparkles,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { BodyMeasurement, UserProfile, WorkoutSession } from '../../types';
import { translations } from '../../i18n/translations';
import { PPLEngine } from '../../services/pplEngine';
import { StorageService } from '../../services/storage';
import { ProgressCharts } from './ProgressCharts';

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
  const [newWeight, setNewWeight] = useState<number>(profile.currentWeightKg);
  const [newWaist, setNewWaist] = useState<number>(profile.currentWaistCm);
  const [newNotes, setNewNotes] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMeasurements(StorageService.getMeasurements());
  }, []);

  const rollingAvg = PPLEngine.calculate7DayWeightAverage(measurements);
  const trendAnalysis = PPLEngine.evaluateFatLossTrend(measurements, history);

  const handleAddMeasurement = () => {
    const entry: BodyMeasurement = {
      id: 'm_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      weight: newWeight,
      waistCm: newWaist,
      notes: newNotes.trim() || undefined,
    };

    StorageService.addMeasurement(entry);
    setMeasurements(StorageService.getMeasurements());
    setNewNotes('');
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
    setDownloadSuccess('JSON backup exported successfully');
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
    setDownloadSuccess('Workouts CSV exported successfully');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header & Export Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">
            {t.progress.analyticsTitle}
          </h1>
          <p className="text-sm text-muted-foreground">{t.progress.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-json"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Download className="h-4 w-4 text-primary" />
            <span>Export JSON</span>
          </button>

          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors"
          >
            <FileText className="h-4 w-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-400 flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* 7-Day Rolling Average & Recomp Analysis Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              {isAr ? 'تحليل مسار إعادة التشكيل العضلي وحرق الدهون' : 'Recomposition & Fat-Loss Trend Diagnostics'}
            </h3>
          </div>
          <span className="rounded-lg bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
            {isAr ? trendAnalysis.badgeAr : trendAnalysis.badge}
          </span>
        </div>

        {/* Rolling Average Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Scale className="h-4 w-4 text-primary" />
              <span>{t.progress.rollingWeightAvg}</span>
            </div>
            <div className="text-2xl font-black text-foreground mt-1">
              {rollingAvg} <span className="text-xs text-muted-foreground">kg</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isAr ? 'متوسط 7 أيام لتصفية احتباس الماء' : '7-day filter for water & glycogen fluctuations'}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="h-4 w-4 text-emerald-400" />
              <span>{t.progress.waistMeasurement}</span>
            </div>
            <div className="text-2xl font-black text-foreground mt-1">
              {profile.currentWaistCm} <span className="text-xs text-muted-foreground">cm</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isAr ? 'المؤشر البيولوجي الأهم لحرق دهون البطن' : 'Primary biological marker of visceral fat loss'}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity className="h-4 w-4 text-amber-400" />
              <span>{isAr ? 'المجموعات التدريبية المكتملة' : 'Completed Workout Volume'}</span>
            </div>
            <div className="text-2xl font-black text-foreground mt-1">
              {history.length} <span className="text-xs text-muted-foreground">sessions</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isAr ? 'انضباط الحمل التدريبي المتدرج' : 'Consistent progressive overload logging'}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {isAr ? trendAnalysis.explanationAr : trendAnalysis.explanation}
        </p>
      </div>

      {/* Interactive Recharts Progress Analytics */}
      <ProgressCharts
        measurements={measurements}
        profile={profile}
        history={history}
        isAr={isAr}
      />

      {/* Log New Measurement Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-foreground">
          {t.progress.logWeight}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              {isAr ? 'الوزن (كجم)' : 'Body Weight (kg)'}
            </label>
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={e => setNewWeight(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              {isAr ? 'محيط الخصر عند السرة (سم)' : 'Waist at Navel (cm)'}
            </label>
            <input
              type="number"
              step="0.5"
              value={newWaist}
              onChange={e => setNewWaist(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              {isAr ? 'ملاحظات' : 'Notes / Energy / Morning Check'}
            </label>
            <input
              type="text"
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              placeholder="Fasted morning weight..."
              className="w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <button
          id="btn-save-measurement-entry"
          onClick={handleAddMeasurement}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>{isAr ? 'حفظ القياس في السجل' : 'Save Measurement'}</span>
        </button>
      </div>

      {/* Historical Measurements Table */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-foreground">
          {isAr ? 'سجل القياسات التاريخي' : 'Measurement Log History'} ({measurements.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-bold uppercase">
                <th className="py-2.5 px-3">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="py-2.5 px-3">{isAr ? 'الوزن (كجم)' : 'Weight (kg)'}</th>
                <th className="py-2.5 px-3">{isAr ? 'الخصر (سم)' : 'Waist (cm)'}</th>
                <th className="py-2.5 px-3">{isAr ? 'ملاحظات' : 'Notes'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {measurements.map(m => (
                <tr key={m.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-foreground">{m.date}</td>
                  <td className="py-2.5 px-3 font-bold text-primary">{m.weight} kg</td>
                  <td className="py-2.5 px-3 font-medium text-foreground">{m.waistCm || '-'} cm</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{m.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
