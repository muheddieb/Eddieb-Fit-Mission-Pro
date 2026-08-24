import React, { useState, useEffect } from 'react';
import { 
  Watch, 
  Heart, 
  Activity, 
  Flame, 
  Footprints, 
  Zap, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Filter, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Battery, 
  Layers, 
  TrendingUp, 
  Download,
  AlertCircle,
  Bluetooth,
  Radio,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  UserProfile, 
  BluetoothActivityLog, 
  BluetoothActivityCategory, 
  BluetoothDeviceType, 
  HeartRateZone 
} from '../../types';
import { BluetoothHealthService } from '../../services/bluetoothHealthService';
import { translations } from '../../i18n/translations';
import { HeartRateTrends24hChart } from './HeartRateTrends24hChart';

interface BluetoothActivityLogsTabProps {
  profile: UserProfile;
  isArabic: boolean;
  onNavigateToLive?: () => void;
}

const CATEGORY_CONFIG: Record<BluetoothActivityCategory, { en: string; ar: string; color: string; bg: string; border: string }> = {
  workout: {
    en: 'Resistance Training',
    ar: 'تدريب المقاومة والحديد',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  cardio: {
    en: 'Aerobic Cardio',
    ar: 'كارديو هوائي لحرق الدهون',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  walking: {
    en: 'Steps & Walking',
    ar: 'المشي وتجميع الخطوات',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
  },
  hiit: {
    en: 'HIIT & Conditioning',
    ar: 'تدريب عالي الكثافة (HIIT)',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  },
  mobility: {
    en: 'Mobility & Recovery',
    ar: 'استشفاء وإطالات حركية',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
  },
  daily_tracking: {
    en: 'All-Day Telemetry',
    ar: 'تتبع النشاط اليومي المستمر',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
  },
};

const HRV_STATUS_CONFIG = {
  optimal: {
    en: 'Optimal Recovery',
    ar: 'استشفاء مثالي (جهاز لاودي)',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    descEn: 'High parasympathetic vagal tone. Body is primed for high training volume and progressive overload.',
    descAr: 'نشاط استشفائي عالي للجهاز العصبي. الجسم جاهز للأوزان الثقيلة وزيادة الشدة.',
  },
  good: {
    en: 'Good Autonomic Tone',
    ar: 'استشفاء جيد ومتوازن',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/40',
    descEn: 'Balanced autonomic nervous system. Proceed with programmed workout intensity.',
    descAr: 'توازن جيد للجهاز العصبي المستقل. يمكنك متابعة جدول التمرين المعتاد.',
  },
  recovering: {
    en: 'Active Recovery',
    ar: 'في طور الاستشفاء',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/40',
    descEn: 'Moderate sympathetic demand. Ensure adequate hydration, post-workout protein, and 7-8 hrs sleep.',
    descAr: 'إجهاد متوسط. احرص على كفاية الماء والبروتين و7-8 ساعات نوم.',
  },
  fatigued: {
    en: 'CNS Fatigue Detected',
    ar: 'إجهاد عصبي مركزي',
    color: 'text-rose-400',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/40',
    descEn: 'Reduced HRV indicates CNS or cardiovascular stress. Consider Zone 2 cardio or active mobility.',
    descAr: 'انخفاض HRV يشير لإجهاد عصبي. يفضل أداء كارديو خفيف أو إطالات بدلاً من الأوزان القصوى.',
  },
};

export const BluetoothActivityLogsTab: React.FC<BluetoothActivityLogsTabProps> = ({
  profile,
  isArabic,
  onNavigateToLive,
}) => {
  const isAr = isArabic;
  const t = isAr ? translations.ar : translations.en;

  const [logs, setLogs] = useState<BluetoothActivityLog[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isPullingBuffer, setIsPullingBuffer] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [show24hChart, setShow24hChart] = useState<boolean>(true);

  // Manual Log Form State
  const [manualTitle, setManualTitle] = useState<string>('');
  const [manualCategory, setManualCategory] = useState<BluetoothActivityCategory>('workout');
  const [manualDuration, setManualDuration] = useState<number>(45);
  const [manualSteps, setManualSteps] = useState<number>(3800);
  const [manualHrv, setManualHrv] = useState<number>(54);
  const [manualActiveCalories, setManualActiveCalories] = useState<number>(420);
  const [manualAvgHr, setManualAvgHr] = useState<number>(132);
  const [manualMaxHr, setManualMaxHr] = useState<number>(165);
  const [manualDeviceName, setManualDeviceName] = useState<string>('Samsung Galaxy Watch 6 Pro');
  const [manualDeviceType, setManualDeviceType] = useState<BluetoothDeviceType>('samsung_galaxy_watch');
  const [manualNotes, setManualNotes] = useState<string>('');

  // Load logs on mount
  const refreshLogs = () => {
    const loaded = BluetoothHealthService.getActivityLogs();
    setLogs(loaded);
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  // Handle Pull Recent Activity Buffer from Connected Watch
  const handlePullBuffer = () => {
    setIsPullingBuffer(true);
    setTimeout(() => {
      const dev = BluetoothHealthService.getDeviceInfo();
      const newLog = BluetoothHealthService.pullWatchActivityBuffer(dev?.name, dev?.type);
      refreshLogs();
      setIsPullingBuffer(false);
      setNotification({
        type: 'success',
        message: isAr 
          ? `تم سحب جلسة جديدة بنجاح (${newLog.steps.toLocaleString()} خطوة، HRV: ${newLog.hrvRmssd} ms، ${newLog.activeCalories} سعرة)!`
          : `Successfully pulled new activity buffer (${newLog.steps.toLocaleString()} steps, HRV: ${newLog.hrvRmssd} ms, ${newLog.activeCalories} kcal)!`
      });
      setTimeout(() => setNotification(null), 4500);
    }, 800);
  };

  // Handle Recording Current Live Session
  const handleRecordLiveSession = () => {
    const newLog = BluetoothHealthService.syncCurrentSessionAsLog({
      title: isAr ? 'جلسة تدريب حية متزامنة' : 'Live Synced Training Session',
      titleAr: 'جلسة تدريب حية متزامنة',
      category: 'workout',
    });
    refreshLogs();
    setNotification({
      type: 'success',
      message: isAr 
        ? `تم حفظ وتوثيق الجلسة الحية في السجل (${newLog.activeCalories} سعرة حرارية نشطة)!`
        : `Committed live session to activity logs (${newLog.activeCalories} active kcal)!`
    });
    setTimeout(() => setNotification(null), 4500);
  };

  // Handle Delete Log
  const handleDeleteLog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    BluetoothHealthService.deleteActivityLog(id);
    refreshLogs();
  };

  // Handle Save Manual Entry
  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    const hrvStatus: 'optimal' | 'good' | 'fatigued' | 'recovering' = 
      manualHrv >= 55 ? 'optimal' : manualHrv >= 45 ? 'good' : manualHrv >= 35 ? 'recovering' : 'fatigued';

    const newLog: BluetoothActivityLog = {
      id: 'bt_manual_' + Date.now(),
      deviceId: 'manual_' + Date.now(),
      deviceName: manualDeviceName || 'Samsung Galaxy Watch 6 Pro',
      deviceType: manualDeviceType,
      timestamp: Date.now(),
      dateStr: new Date().toISOString(),
      activityTitle: manualTitle || (isAr ? 'جلسة نشاط مسجلة' : 'Logged Device Activity'),
      activityTitleAr: manualTitle || (isAr ? 'جلسة نشاط مسجلة' : 'Logged Device Activity'),
      category: manualCategory,
      durationMinutes: manualDuration,
      steps: manualSteps,
      hrvRmssd: manualHrv,
      hrvStatus: hrvStatus,
      activeCalories: manualActiveCalories,
      totalCalories: manualActiveCalories + Math.round((manualDuration / 60) * 80),
      avgHeartRateBpm: manualAvgHr,
      maxHeartRateBpm: manualMaxHr,
      primaryZone: BluetoothHealthService.calculateZone(manualAvgHr, profile.age || 41),
      timeInZones: {
        zone1Mins: Math.round(manualDuration * 0.15),
        zone2Mins: Math.round(manualDuration * 0.40),
        zone3Mins: Math.round(manualDuration * 0.30),
        zone4Mins: Math.round(manualDuration * 0.15),
        zone5Mins: 0,
      },
      distanceKm: Math.round((manualSteps * 0.00078) * 100) / 100,
      sensorLocation: 'Wrist',
      source: 'manual_device_log',
      syncedAt: Date.now(),
      notes: manualNotes || (isAr ? 'تسجيل يدوي لجهاز البلوتوث.' : 'Manual entry for Bluetooth health device.'),
    };

    BluetoothHealthService.saveActivityLog(newLog);
    refreshLogs();
    setShowManualModal(false);
    setNotification({
      type: 'success',
      message: isAr ? 'تمت إضافة النشاط بنجاح إلى السجل!' : 'Successfully added device activity log!'
    });
    setTimeout(() => setNotification(null), 4500);
  };

  // Export CSV
  const handleExportCSV = () => {
    let csv = 'Timestamp,Device Name,Activity,Category,Duration (min),Steps,HRV RMSSD (ms),HRV Status,Active Calories (kcal),Avg BPM,Max BPM,Primary Zone,Source\n';
    logs.forEach(l => {
      csv += `"${new Date(l.timestamp).toLocaleString()}","${l.deviceName}","${l.activityTitle}","${l.category}",${l.durationMinutes},${l.steps},${l.hrvRmssd},"${l.hrvStatus}",${l.activeCalories},${l.avgHeartRateBpm},${l.maxHeartRateBpm},${l.primaryZone},"${l.source}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eddieb_bluetooth_activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Aggregate Metrics Calculations
  const totalSteps = logs.reduce((acc, l) => acc + (l.steps || 0), 0);
  const totalActiveCalories = logs.reduce((acc, l) => acc + (l.activeCalories || 0), 0);
  const validHrvLogs = logs.filter(l => l.hrvRmssd && l.hrvRmssd > 0);
  const avgHrv = validHrvLogs.length > 0 ? Math.round(validHrvLogs.reduce((acc, l) => acc + l.hrvRmssd, 0) / validHrvLogs.length) : 54;
  const totalDurationMinutes = logs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);

  // Filtered Logs
  const filteredLogs = logs.filter(l => {
    if (selectedCategory !== 'all' && l.category !== selectedCategory) return false;
    if (selectedDevice !== 'all' && l.deviceType !== selectedDevice) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = l.activityTitle.toLowerCase().includes(q) || (l.activityTitleAr && l.activityTitleAr.includes(q));
      const matchDev = l.deviceName.toLowerCase().includes(q);
      const matchNotes = l.notes?.toLowerCase().includes(q);
      if (!matchTitle && !matchDev && !matchNotes) return false;
    }
    return true;
  });

  const distinctDevices: BluetoothDeviceType[] = Array.from(new Set(logs.map(l => l.deviceType)));

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-300 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-bold"
          >
            {isAr ? 'إغلاق' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Aggregate Overview Card: Steps, HRV, Active Calories */}
      <div className="rounded-3xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Radio className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-foreground">
                  {isAr ? 'سجل نشاط أجهزة وساعات البلوتوث' : 'Bluetooth Health Devices Activity Log'}
                </h2>
                <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-sky-400 border border-sky-500/30">
                  {logs.length} {isAr ? 'جلسات مسجلة' : 'Synced Sessions'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {isAr 
                  ? 'بيانات الخطوات المسحوبة، تقلب ضربات القلب (HRV) للاستشفاء، وحرق السعرات الحرارية النشطة من الساعات المتزامنة.'
                  : 'Activity sessions pulled directly from paired Bluetooth health wearables: Steps, Heart Rate Variability (HRV), and Active Calories.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-pull-watch-buffer"
              onClick={handlePullBuffer}
              disabled={isPullingBuffer}
              className="flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold py-2.5 px-3.5 text-xs shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isPullingBuffer ? 'animate-spin' : ''}`} />
              <span>{isPullingBuffer ? (isAr ? 'جاري السحب...' : 'Pulling Buffer...') : (isAr ? 'سحب بيانات الساعة الأخيرة' : 'Pull Watch Activity Buffer')}</span>
            </button>

            <button
              type="button"
              id="btn-sync-live-session"
              onClick={handleRecordLiveSession}
              className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-bold py-2.5 px-3.5 text-xs transition-all"
            >
              <Zap className="h-4 w-4" />
              <span>{isAr ? 'توثيق الجلسة الحية بالسجل' : 'Record Live Session to Log'}</span>
            </button>

            <button
              type="button"
              id="btn-open-manual-ble-log"
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-foreground font-semibold py-2.5 px-3 text-xs transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>{isAr ? 'تسجيل نشاط يدوي' : 'Log Activity'}</span>
            </button>

            <button
              type="button"
              id="btn-export-ble-csv"
              onClick={handleExportCSV}
              className="rounded-xl border border-border bg-secondary/40 hover:bg-secondary p-2.5 text-muted-foreground hover:text-foreground transition-all"
              title={isAr ? 'تصدير كملف CSV' : 'Export as CSV'}
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 3 Core Biometric Highlight Tiles: Steps, HRV, Active Calories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Synced Steps Card */}
          <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                <Footprints className="h-4 w-4 text-sky-400" />
                {isAr ? 'الخطوات المسحوبة' : 'Synced Steps'}
              </span>
              <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-black text-sky-400">
                {Math.round((totalSteps * 0.00078) * 10) / 10} km
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
              {totalSteps.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {isAr 
                ? `مجموع خطوات التمارين والمشي المقروءة عبر حساسات الحركة والبلوتوث.`
                : `Total workout & cadence steps captured via BLE motion telemetry.`}
            </p>
          </div>

          {/* 2. Heart Rate Variability (HRV) Card */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-emerald-400" />
                {isAr ? 'تقلب ضربات القلب (HRV)' : 'Heart Rate Variability'}
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-400">
                RMSSD: {avgHrv} ms
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-foreground font-mono flex items-baseline gap-1.5">
              <span>{avgHrv}</span>
              <span className="text-xs font-semibold text-muted-foreground">ms avg</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {isAr 
                ? `مؤشر الاستشفاء اللاودي: توازن الجهاز العصبي واستعداد العضلات للأحمال.`
                : `Vagal tone recovery index: Autonomic balance and muscular CNS readiness.`}
            </p>
          </div>

          {/* 3. Active Calories Card */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-amber-400" />
                {isAr ? 'السعرات الحرارية النشطة' : 'Active Calories'}
              </span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-400">
                Keytel & VO2
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-foreground font-mono flex items-baseline gap-1.5">
              <span>{totalActiveCalories.toLocaleString()}</span>
              <span className="text-xs font-semibold text-muted-foreground">kcal</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {isAr 
                ? `الطاقة الحركية المحروقة أثناء الجلسات عبر معدل ضربات القلب الحقيقي.`
                : `Net active metabolic expenditure computed from heart rate telemetry.`}
            </p>
          </div>

          {/* 4. Total Monitored Duration Card */}
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-indigo-400" />
                {isAr ? 'مدة النشاط المرصود' : 'Monitored Duration'}
              </span>
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-black text-indigo-400">
                {logs.length} Logs
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-foreground font-mono flex items-baseline gap-1.5">
              <span>{Math.floor(totalDurationMinutes / 60)}h {totalDurationMinutes % 60}m</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {isAr 
                ? `إجمالي زمن التدريب المرصود بالساعات الذكية وأحزمة النبض.`
                : `Total cumulative training duration tracked with connected hardware.`}
            </p>
          </div>
        </div>
      </div>

      {/* Collapsible / Interactive 24-Hour Heart Rate Trend Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-500 animate-pulse" />
            <h4 className="text-sm font-bold text-foreground">
              {isAr ? 'منحنى معدل ضربات القلب خلال 24 ساعة (Recharts)' : '24-Hour Continuous Heart Rate Telemetry'}
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setShow24hChart(!show24hChart)}
            className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{show24hChart ? (isAr ? 'إخفاء المنحنى' : 'Collapse Chart') : (isAr ? 'عرض المنحنى' : 'Expand Chart')}</span>
            {show24hChart ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {show24hChart && (
          <HeartRateTrends24hChart
            profile={profile}
            isArabic={isAr}
            onRefresh={refreshLogs}
          />
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              id="search-ble-activity-logs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث في السجلات (اسم التمرين، نوع الساعة، الملاحظات)...' : 'Search logs by activity name, watch model, or notes...'}
              className="w-full rounded-xl border border-border bg-secondary/30 pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {isAr ? 'جميع الفئات' : 'All Categories'}
            </button>
            {(['workout', 'cardio', 'walking', 'hiit', 'mobility'] as BluetoothActivityCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? `${CATEGORY_CONFIG[cat].bg} ${CATEGORY_CONFIG[cat].color} border ${CATEGORY_CONFIG[cat].border}`
                    : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {isAr ? CATEGORY_CONFIG[cat].ar : CATEGORY_CONFIG[cat].en}
              </button>
            ))}
          </div>
        </div>

        {/* Device Filter Pills (if multiple devices exist) */}
        {distinctDevices.length > 1 && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/60 text-xs">
            <span className="text-muted-foreground font-semibold flex items-center gap-1">
              <Watch className="h-3.5 w-3.5" />
              {isAr ? 'تصفية حسب الجهاز:' : 'Filter by Device:'}
            </span>
            <button
              onClick={() => setSelectedDevice('all')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                selectedDevice === 'all' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            {distinctDevices.map(devType => (
              <button
                key={devType}
                onClick={() => setSelectedDevice(devType)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase ${
                  selectedDevice === devType ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {String(devType).replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Activity Logs Cards List */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <Watch className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              {isAr ? 'لا توجد سجلات تطابق البحث' : 'No Bluetooth Activity Logs Found'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {isAr 
                ? 'قم بربط ساعتك عبر البلوتوث واضغط "سحب بيانات الساعة الأخيرة" أو أضف نشاطاً يدوياً جديداً.'
                : 'Connect your Bluetooth wearable and click "Pull Watch Activity Buffer" or log a manual entry.'}
            </p>
            <button
              onClick={handlePullBuffer}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{isAr ? 'سحب بيانات تجريبية فورية' : 'Pull Sample Buffer'}</span>
            </button>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const cat = CATEGORY_CONFIG[log.category] || CATEGORY_CONFIG.workout;
            const hrvConf = HRV_STATUS_CONFIG[log.hrvStatus] || HRV_STATUS_CONFIG.optimal;
            const isExpanded = expandedLogId === log.id;
            const logDate = new Date(log.timestamp);
            const dateDisplay = logDate.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={log.id}
                id={`ble-log-${log.id}`}
                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                className={`rounded-2xl border bg-card p-5 shadow-sm transition-all cursor-pointer hover:border-primary/50 hover:shadow-md ${
                  isExpanded ? 'border-primary/60 bg-gradient-to-b from-card to-secondary/20 ring-1 ring-primary/30' : 'border-border'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Device & Title Header */}
                  <div className="flex items-start gap-3.5">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${cat.border} ${cat.bg} ${cat.color} shadow-sm mt-0.5`}>
                      {log.category === 'walking' ? (
                        <Footprints className="h-5 w-5" />
                      ) : log.category === 'cardio' ? (
                        <Heart className="h-5 w-5" />
                      ) : log.category === 'hiit' ? (
                        <Zap className="h-5 w-5" />
                      ) : (
                        <Watch className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-foreground">
                          {isAr ? (log.activityTitleAr || log.activityTitle) : log.activityTitle}
                        </h4>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cat.bg} ${cat.color} border ${cat.border}`}>
                          {isAr ? cat.ar : cat.en}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1 font-medium">
                          <Watch className="h-3.5 w-3.5 text-sky-400" />
                          <span>{log.deviceName}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-indigo-400" />
                          <span>{dateDisplay}</span>
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-foreground">
                          {log.durationMinutes} {isAr ? 'دقيقة' : 'min'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center/Right: The 3 Primary Required Metrics (Steps, HRV, Active Calories) */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 sm:flex sm:items-center sm:justify-end">
                    {/* Metric 1: Steps */}
                    <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-center sm:min-w-[100px]">
                      <div className="text-[10px] font-bold uppercase text-sky-300 flex items-center justify-center gap-1">
                        <Footprints className="h-3 w-3 text-sky-400" />
                        <span>{isAr ? 'الخطوات' : 'Steps'}</span>
                      </div>
                      <div className="text-sm sm:text-base font-black text-foreground font-mono mt-0.5">
                        {log.steps.toLocaleString()}
                      </div>
                      {log.distanceKm && (
                        <div className="text-[9px] text-muted-foreground font-mono">
                          {log.distanceKm} km
                        </div>
                      )}
                    </div>

                    {/* Metric 2: Heart Rate Variability (HRV) */}
                    <div className={`rounded-xl border ${hrvConf.border} ${hrvConf.bg} px-3 py-2 text-center sm:min-w-[110px]`}>
                      <div className={`text-[10px] font-bold uppercase ${hrvConf.color} flex items-center justify-center gap-1`}>
                        <Activity className="h-3 w-3" />
                        <span>{isAr ? 'HRV' : 'HRV (RMSSD)'}</span>
                      </div>
                      <div className="text-sm sm:text-base font-black text-foreground font-mono mt-0.5">
                        {log.hrvRmssd} <span className="text-[10px] font-normal text-muted-foreground">ms</span>
                      </div>
                      <div className={`text-[9px] font-bold ${hrvConf.color} truncate`}>
                        {isAr ? hrvConf.ar.split(' ')[0] : hrvConf.en.split(' ')[0]}
                      </div>
                    </div>

                    {/* Metric 3: Active Calories */}
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center sm:min-w-[105px]">
                      <div className="text-[10px] font-bold uppercase text-amber-300 flex items-center justify-center gap-1">
                        <Flame className="h-3 w-3 text-amber-400" />
                        <span>{isAr ? 'سعرات نشطة' : 'Active Cal'}</span>
                      </div>
                      <div className="text-sm sm:text-base font-black text-foreground font-mono mt-0.5">
                        {log.activeCalories} <span className="text-[10px] font-normal text-muted-foreground">kcal</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground font-mono">
                        {Math.round((log.activeCalories / log.durationMinutes) * 60)} kcal/hr
                      </div>
                    </div>
                  </div>

                  {/* Chevron Toggle & Delete */}
                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteLog(log.id, e)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title={isAr ? 'حذف السجل' : 'Delete Log'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="text-muted-foreground">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Biometric Telemetry Breakdown */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border/80 space-y-4 animate-in fade-in slide-in-from-top-1">
                    {/* HRV Recovery Clinical Interpretation Banner */}
                    <div className={`rounded-xl border ${hrvConf.border} ${hrvConf.bg} p-3.5 text-xs space-y-1`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${hrvConf.color} flex items-center gap-1.5`}>
                          <Sparkles className="h-3.5 w-3.5" />
                          {isAr ? hrvConf.ar : hrvConf.en} (HRV RMSSD: {log.hrvRmssd} ms)
                        </span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">
                          {log.source.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {isAr ? hrvConf.descAr : hrvConf.descEn}
                      </p>
                    </div>

                    {/* Cardiovascular Aerobic Zones Distribution Bar */}
                    {log.timeInZones && (
                      <div className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            <Heart className="h-3.5 w-3.5 text-rose-400" />
                            {isAr ? 'توزيع مناطق نبض القلب أثناء الجلسة' : 'Heart Rate Aerobic Zones Distribution'}
                          </span>
                          <span className="text-muted-foreground font-mono">
                            Avg: {log.avgHeartRateBpm} bpm • Max: {log.maxHeartRateBpm} bpm
                          </span>
                        </div>

                        {/* Zone Color Bar */}
                        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div style={{ width: `${(log.timeInZones.zone1Mins / log.durationMinutes) * 100}%` }} className="bg-blue-400" title="Zone 1 Warmup" />
                          <div style={{ width: `${(log.timeInZones.zone2Mins / log.durationMinutes) * 100}%` }} className="bg-emerald-400" title="Zone 2 Fat Burn" />
                          <div style={{ width: `${(log.timeInZones.zone3Mins / log.durationMinutes) * 100}%` }} className="bg-cyan-400" title="Zone 3 Aerobic" />
                          <div style={{ width: `${(log.timeInZones.zone4Mins / log.durationMinutes) * 100}%` }} className="bg-amber-400" title="Zone 4 Anaerobic" />
                          <div style={{ width: `${(log.timeInZones.zone5Mins / log.durationMinutes) * 100}%` }} className="bg-rose-500" title="Zone 5 Max" />
                        </div>

                        <div className="grid grid-cols-5 gap-1 text-center text-[10px] text-muted-foreground">
                          <div>Z1: {log.timeInZones.zone1Mins}m</div>
                          <div className="text-emerald-400 font-semibold">Z2: {log.timeInZones.zone2Mins}m</div>
                          <div>Z3: {log.timeInZones.zone3Mins}m</div>
                          <div className="text-amber-400 font-semibold">Z4: {log.timeInZones.zone4Mins}m</div>
                          <div>Z5: {log.timeInZones.zone5Mins}m</div>
                        </div>
                      </div>
                    )}

                    {/* Sensor Technical Metadata Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground pt-1">
                      <div className="flex items-center gap-3">
                        <span>{isAr ? 'موقع الحساس:' : 'Sensor:'} <strong className="text-foreground">{log.sensorLocation || 'Wrist'}</strong></span>
                        {log.batteryLevelAtSync && (
                          <span className="flex items-center gap-1">
                            <Battery className="h-3 w-3 text-emerald-400" />
                            <span>{log.batteryLevelAtSync}%</span>
                          </span>
                        )}
                        <span>{isAr ? 'الإجمالي:' : 'Total Exp:'} <strong className="text-foreground">{log.totalCalories || log.activeCalories + 80} kcal</strong></span>
                      </div>

                      {log.notes && (
                        <span className="italic text-foreground/80">
                          "{log.notes}"
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* HRV Trend and Recovery Insights Educational Card */}
      <div className="rounded-3xl border border-border bg-gradient-to-r from-secondary/40 via-card to-secondary/40 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {isAr ? 'كيف تستفيد من بيانات Steps و HRV و Active Calories في نظامك؟' : 'Optimizing Push/Pull/Legs with Bluetooth HRV & Calorie Telemetry'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr 
                ? 'فهم التغذية الراجعة من حساسات البلوتوث لضبط الكارديو وأيام التدريب الشاق.'
                : 'Scientific rationale for pairing wearable biometric feedback with fat loss & muscle recomposition.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
          <div className="rounded-xl border border-border bg-background/60 p-3.5 space-y-1.5">
            <div className="font-bold text-sky-400 flex items-center gap-1.5">
              <Footprints className="h-4 w-4" />
              <span>{isAr ? 'تجميع الخطوات و NEAT' : 'Non-Exercise Steps (NEAT)'}</span>
            </div>
            <p>
              {isAr 
                ? 'الخطوات اليومية هي المحرك الأساسي لحرق الدهون دون إرهاق الجهاز العصبي، وتساعد في إبقاء الحرق مرتفعاً.'
                : 'Daily steps accumulate low-stress energy expenditure without triggering central nervous system fatigue.'}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background/60 p-3.5 space-y-1.5">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Activity className="h-4 w-4" />
              <span>{isAr ? 'تقلب النبض HRV والاستشفاء' : 'HRV (RMSSD) & Overload'}</span>
            </div>
            <p>
              {isAr 
                ? 'إذا كان الـ HRV أعلى من 50 ms، فالجسم في حالة استعداد لكسر أوزان قياسية. إذا انخفض بشكل حاد، ركز على النوم والكارديو الخفيف.'
                : 'Elevated HRV (>50ms) signals parasympathetic dominance for heavy lifts. Acute drops suggest prioritizing rest and Zone 2.'}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background/60 p-3.5 space-y-1.5">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <Flame className="h-4 w-4" />
              <span>{isAr ? 'السعرات النشطة وعجز السعرات' : 'Active Deficit Precision'}</span>
            </div>
            <p>
              {isAr 
                ? 'تساعدك السعرات النشطة المسحوبة من الساعة في ضبط كمية الكربوهيدرات والبروتين بدقة للحفاظ على الكتلة العضلية.'
                : 'Real-time active calorie burn guides exact nutritional fueling to preserve lean mass during controlled fat loss.'}
            </p>
          </div>
        </div>
      </div>

      {/* Manual BLE Log Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <Plus className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {isAr ? 'تسجيل نشاط جهاز بلوتوث يدوياً' : 'Log Bluetooth Health Activity'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  {isAr ? 'عنوان النشاط / التمرين' : 'Activity Title'}
                </label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder={isAr ? 'مثال: تمرين دفع وتضخيم الصدر' : 'e.g. Push Hypertrophy & Overload'}
                  className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    {isAr ? 'فئة النشاط' : 'Category'}
                  </label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value as BluetoothActivityCategory)}
                    className="w-full rounded-xl border border-border bg-secondary/30 px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="workout">{isAr ? 'تدريب مقاومة' : 'Resistance Training'}</option>
                    <option value="cardio">{isAr ? 'كارديو هوائي' : 'Aerobic Cardio'}</option>
                    <option value="walking">{isAr ? 'مشي وخطوات' : 'Steps & Walking'}</option>
                    <option value="hiit">{isAr ? 'تدريب مكثف (HIIT)' : 'HIIT Intervals'}</option>
                    <option value="mobility">{isAr ? 'استشفاء وإطالات' : 'Mobility & Recovery'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    {isAr ? 'المدة (بالدقائق)' : 'Duration (mins)'}
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={manualDuration}
                    onChange={(e) => setManualDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Trio Inputs: Steps, HRV, Active Calories */}
              <div className="grid grid-cols-3 gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3.5">
                <div>
                  <label className="block font-bold text-sky-400 mb-1 flex items-center gap-1">
                    <Footprints className="h-3.5 w-3.5" />
                    <span>{isAr ? 'الخطوات' : 'Steps'}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={manualSteps}
                    onChange={(e) => setManualSteps(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-foreground font-mono focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-400 mb-1 flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5" />
                    <span>{isAr ? 'HRV (ms)' : 'HRV (ms)'}</span>
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="150"
                    value={manualHrv}
                    onChange={(e) => setManualHrv(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-foreground font-mono focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-amber-400 mb-1 flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5" />
                    <span>{isAr ? 'سعرات نشطة' : 'Active Cal'}</span>
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={manualActiveCalories}
                    onChange={(e) => setManualActiveCalories(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-foreground font-mono focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    {isAr ? 'متوسط النبض (BPM)' : 'Avg Heart Rate'}
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="220"
                    value={manualAvgHr}
                    onChange={(e) => setManualAvgHr(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2 text-foreground font-mono focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    {isAr ? 'أقصى نبض (Max BPM)' : 'Max Heart Rate'}
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="220"
                    value={manualMaxHr}
                    onChange={(e) => setManualMaxHr(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2 text-foreground font-mono focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  {isAr ? 'اسم الجهاز وساعة اليد' : 'Device Model'}
                </label>
                <input
                  type="text"
                  value={manualDeviceName}
                  onChange={(e) => setManualDeviceName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="rounded-xl border border-border bg-secondary/50 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90"
                >
                  {isAr ? 'حفظ النشاط بالسجل' : 'Save to Activity Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
