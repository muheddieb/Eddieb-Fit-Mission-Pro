import React, { useState, useEffect, useRef } from 'react';
import { 
  Bluetooth, 
  Watch, 
  Heart, 
  Activity, 
  Flame, 
  Battery, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles, 
  Moon, 
  Footprints, 
  Scale, 
  ShieldCheck, 
  Smartphone, 
  Info, 
  Zap, 
  Sliders, 
  Download, 
  Plus, 
  Trash2,
  ChevronRight,
  Wifi,
  WifiOff,
  ExternalLink
} from 'lucide-react';
import { 
  UserProfile, 
  LiveTelemetryData, 
  BluetoothDeviceInfo, 
  BluetoothConnectionStatus, 
  HeartRateZone, 
  BluetoothDeviceType,
  SamsungHealthDailySummary, 
  SamsungHealthSyncRecord 
} from '../../types';
import { BluetoothHealthService, SUPPORTED_DEVICE_BRANDS, SupportedDeviceBrand } from '../../services/bluetoothHealthService';
import { SamsungHealthService } from '../../services/samsungHealthService';
import { StorageService } from '../../services/storage';
import { BluetoothActivityLogsTab } from './BluetoothActivityLogsTab';
import { HeartRateTrends24hChart } from './HeartRateTrends24hChart';

interface HealthDevicesViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onClose?: () => void;
  isModal?: boolean;
}

type DeviceTab = 'bluetooth' | 'activity_logs' | 'samsung_sync' | 'measures_analytics' | 'setup_guide';

const HR_ZONES_CONFIG: Record<HeartRateZone, { 
  nameEn: string; 
  nameAr: string; 
  range: string; 
  color: string; 
  bg: string; 
  border: string; 
  descEn: string; 
  descAr: string;
}> = {
  1: { 
    nameEn: 'Zone 1: Warm-up & Recovery', 
    nameAr: 'المنطقة 1: الإحماء والاستشفاء', 
    range: '< 60% Max HR', 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/15', 
    border: 'border-blue-500/30',
    descEn: 'Active recovery, cellular repair, mobility work, gentle warm-up.',
    descAr: 'استشفاء عضلي نشط، تجديد الطاقة، حركات الإطالة والإحماء الخفيف.',
  },
  2: { 
    nameEn: 'Zone 2: Aerobic & Fat Oxidation', 
    nameAr: 'المنطقة 2: أكسدة وحرق الدهون', 
    range: '60% - 70% Max HR', 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/15', 
    border: 'border-emerald-500/30',
    descEn: 'Optimal mitochondrial efficiency, maximal body fat oxidation.',
    descAr: 'أقصى كفاءة للميتوكوندريا وحرق الدهون المخزنة كوقود.',
  },
  3: { 
    nameEn: 'Zone 3: Aerobic Tempo & Endurance', 
    nameAr: 'المنطقة 3: القدرة الهوائية والتحمل', 
    range: '70% - 80% Max HR', 
    color: 'text-cyan-400', 
    bg: 'bg-cyan-500/15', 
    border: 'border-cyan-500/30',
    descEn: 'Cardiovascular conditioning, stamina building, steady pace.',
    descAr: 'تحسين سعة الرئتين، اللياقة القلبية وتحمل التدريب.',
  },
  4: { 
    nameEn: 'Zone 4: Anaerobic Lactate Threshold', 
    nameAr: 'المنطقة 4: عتبة اللاكتات اللاهوائية', 
    range: '80% - 90% Max HR', 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/15', 
    border: 'border-amber-500/30',
    descEn: 'High intensity resistance sets, heavy lifting, speed intervals.',
    descAr: 'مجموعات الحديد الثقيلة، التدريب عالي الشدة وفترات السرعة.',
  },
  5: { 
    nameEn: 'Zone 5: Maximum Peak Effort (VO2 Max)', 
    nameAr: 'المنطقة 5: أقصى طاقة وانفجار', 
    range: '> 90% Max HR', 
    color: 'text-rose-400', 
    bg: 'bg-rose-500/20', 
    border: 'border-rose-500/40',
    descEn: 'Maximal sprint output, PR attempts, brief anaerobic bursts.',
    descAr: 'محاولات الأوزان القياسية والانفجار العضلي الأقصى.',
  },
};

export const HealthDevicesView: React.FC<HealthDevicesViewProps> = ({
  profile,
  onUpdateProfile,
  onClose,
  isModal = false,
}) => {
  const isAr = profile.language === 'ar';
  const [activeTab, setActiveTab] = useState<DeviceTab>('bluetooth');

  // Bluetooth State
  const [btStatus, setBtStatus] = useState<BluetoothConnectionStatus>(BluetoothHealthService.getStatus());
  const [btDevice, setBtDevice] = useState<BluetoothDeviceInfo | null>(BluetoothHealthService.getDeviceInfo());
  const [btErrorMessage, setBtErrorMessage] = useState<string>('');
  const [telemetry, setTelemetry] = useState<LiveTelemetryData>(BluetoothHealthService.getLatestTelemetry());
  const [telemetryHistory, setTelemetryHistory] = useState<LiveTelemetryData[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(BluetoothHealthService.isSimulatorActive());
  const [simIntensity, setSimIntensity] = useState<number>(135);

  // Samsung Health State
  const [summaries, setSummaries] = useState<SamsungHealthDailySummary[]>([]);
  const [latestSummary, setLatestSummary] = useState<SamsungHealthDailySummary | null>(null);
  const [syncRecords, setSyncRecords] = useState<SamsungHealthSyncRecord[]>([]);
  const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showManualModal, setShowManualModal] = useState<boolean>(false);

  // Manual Entry Form State
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manualSteps, setManualSteps] = useState<number>(8500);
  const [manualActiveCal, setManualActiveCal] = useState<number>(450);
  const [manualRestingHr, setManualRestingHr] = useState<number>(62);
  const [manualSleepHrs, setManualSleepHrs] = useState<number>(7.5);
  const [manualSleepScore, setManualSleepScore] = useState<number>(85);
  const [manualWeight, setManualWeight] = useState<number>(profile.currentWeightKg || 100.95);
  const [manualFatPct, setManualFatPct] = useState<number>(profile.latestScaleScan?.bodyFatPercent || 32.5);
  const [manualMuscleKg, setManualMuscleKg] = useState<number>(profile.latestScaleScan?.skeletalMuscleKg || 33.9);
  const [manualSpO2, setManualSpO2] = useState<number>(98);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load Samsung Health Data
    const loadedSummaries = SamsungHealthService.getDailySummaries();
    setSummaries(loadedSummaries);
    setLatestSummary(loadedSummaries.length > 0 ? loadedSummaries[0] : null);
    setSyncRecords(SamsungHealthService.getSyncRecords());

    // Subscribe to Bluetooth state
    const unsubDev = BluetoothHealthService.subscribeDeviceState((dev, status, err) => {
      setBtDevice(dev);
      setBtStatus(status);
      if (err) setBtErrorMessage(err);
      setIsSimulating(BluetoothHealthService.isSimulatorActive());
    });

    const unsubTel = BluetoothHealthService.subscribeTelemetry((tel) => {
      setTelemetry(tel);
      setTelemetryHistory([...BluetoothHealthService.getTelemetryHistory()]);
    });

    return () => {
      unsubDev();
      unsubTel();
    };
  }, []);

  const [selectedBrandId, setSelectedBrandId] = useState<BluetoothDeviceType>('generic_hrm');
  const [showBrandGuideModal, setShowBrandGuideModal] = useState<boolean>(false);
  const [activeGuideBrand, setActiveGuideBrand] = useState<SupportedDeviceBrand | null>(null);

  // Connect via Web Bluetooth API directly within user-initiated click context
  const handleConnectBluetooth = async (preferredType?: BluetoothDeviceType) => {
    setBtErrorMessage('');
    const brandToUse = preferredType || selectedBrandId;

    try {
      // Fast pre-check for browser Web Bluetooth support
      if (!BluetoothHealthService.isSupported()) {
        setBtErrorMessage(
          isAr 
            ? 'المتصفح الحالي لا يدعم تقنية Web Bluetooth (يُفضل استخدام متصفح Chrome أو Edge على الحاسوب أو أجهزة الأندرويد).' 
            : 'Web Bluetooth is not supported in this browser. Please use Chrome or Edge.'
        );
        return;
      }

      // Execute request directly within the user-initiated click event stack
      const result = await BluetoothHealthService.requestAndConnect(brandToUse);
      
      if (!result.success) {
        // Handle user cancellation / AbortError gracefully without triggering alert banners
        if (result.errorCode === 'USER_CANCELLED') {
          setBtErrorMessage('');
          return;
        }
        
        if (result.errorCode === 'PERMISSIONS_POLICY_DISALLOWED' || result.errorMessage?.includes('permissions policy') || result.errorMessage?.includes('disallowed')) {
          setBtErrorMessage('PERMISSIONS_POLICY_DISALLOWED');
        } else if (result.errorCode === 'BROWSER_UNSUPPORTED') {
          setBtErrorMessage(
            isAr 
              ? 'المتصفح الحالي لا يدعم تقنية Web Bluetooth (يُفضل استخدام متصفح Chrome أو Edge أو Opera على الحاسوب/الأندرويد).' 
              : 'Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or a WebBLE browser.'
          );
        } else if (result.errorCode === 'BLUETOOTH_ADAPTER_DISABLED') {
          setBtErrorMessage(
            isAr 
              ? 'يرجى التأكد من تشغيل البلوتوث (Bluetooth) في إعدادات جهازك ثم إعادة المحاولة.' 
              : 'Please ensure Bluetooth is turned ON in your device settings and try again.'
          );
        } else {
          setBtErrorMessage(
            result.errorMessage || (
              isAr 
                ? 'تعذر العثور على الجهاز أو إتمام الاقتران. يمكنك استخدام وضع المحاكي المباشر.' 
                : 'Could not discover device or complete pairing. You can use Live Simulator mode.'
            )
          );
        }
      }
    } catch (err: any) {
      // Gracefully catch synchronous or unexpected AbortError, NotFoundError, or user cancellations
      const isAbortOrCancel = 
        err?.name === 'AbortError' || 
        err?.name === 'NotFoundError' || 
        (err?.message && (err.message.toLowerCase().includes('cancel') || err.message.toLowerCase().includes('abort')));

      if (isAbortOrCancel) {
        // User closed or dismissed the device picker dialog — exit gracefully without opening secondary windows
        setBtErrorMessage('');
        return;
      }

      console.warn('Bluetooth connection error:', err);
      if (err?.name === 'SecurityError' || err?.message?.includes('permissions policy') || err?.message?.includes('disallowed')) {
        setBtErrorMessage('PERMISSIONS_POLICY_DISALLOWED');
      } else {
        setBtErrorMessage(
          err?.message || (
            isAr 
              ? 'حدث خطأ أثناء محاولة الاتصال بالبلوتوث.' 
              : 'An error occurred while attempting to connect to Bluetooth.'
          )
        );
      }
    }
  };

  const handleDisconnectBluetooth = () => {
    BluetoothHealthService.disconnect();
  };

  const handleToggleSimulator = (preferredType?: BluetoothDeviceType) => {
    if (isSimulating) {
      BluetoothHealthService.stopSimulator();
      setIsSimulating(false);
      setBtStatus('disconnected');
    } else {
      const brandId = preferredType || selectedBrandId;
      const brandMeta = SUPPORTED_DEVICE_BRANDS.find(b => b.id === brandId) || SUPPORTED_DEVICE_BRANDS[0];
      const simName = `${brandMeta.name} (Simulated Live)`;
      BluetoothHealthService.startSimulator(brandId, simName);
      setIsSimulating(true);
      setBtStatus('connected');
    }
  };

  const handleSetSimulatorZone = (bpm: number) => {
    setSimIntensity(bpm);
    BluetoothHealthService.setSimulatorIntensity(bpm);
  };

  // Handle Samsung Health File Upload (JSON or CSV)
  const processUploadedFile = (file: File) => {
    const reader = new FileReader();
    const fileName = file.name.toLowerCase();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      if (fileName.endsWith('.json')) {
        const result = SamsungHealthService.parseSamsungHealthJson(content);
        if (result.error) {
          setImportStatus({ type: 'error', message: result.error });
        } else {
          setImportStatus({ 
            type: 'success', 
            message: isAr 
              ? `تم بنجاح استيراد ${result.summaries.length} يوماً من بيانات سامسونج هيلث!` 
              : `Successfully imported ${result.summaries.length} days of Samsung Health data!` 
          });
          refreshSamsungData();
        }
      } else if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
        const result = SamsungHealthService.parseSamsungHealthCsv(content, file.name);
        if (result.error) {
          setImportStatus({ type: 'error', message: result.error });
        } else {
          setImportStatus({ 
            type: 'success', 
            message: isAr 
              ? `تم بنجاح استخراج ${result.summaries.length} قياسات من ملف ${file.name}!` 
              : `Successfully parsed ${result.summaries.length} records from ${file.name}!` 
          });
          refreshSamsungData();
        }
      } else {
        setImportStatus({ 
          type: 'error', 
          message: isAr ? 'يرجى تحميل ملف بتنسيق JSON أو CSV مأخوذ من تطبيق Samsung Health' : 'Please upload a JSON or CSV file exported from Samsung Health.' 
        });
      }
    };

    reader.onerror = () => {
      setImportStatus({ type: 'error', message: isAr ? 'تعذر قراءة الملف المرفوع' : 'Failed to read the file.' });
    };

    reader.readAsText(file);
  };

  const refreshSamsungData = () => {
    const loaded = SamsungHealthService.getDailySummaries();
    setSummaries(loaded);
    setLatestSummary(loaded.length > 0 ? loaded[0] : null);
    setSyncRecords(SamsungHealthService.getSyncRecords());
  };

  // Load Seed / Real Demo Data for Samsung Health
  const handleLoadSampleSamsungData = () => {
    const seed = SamsungHealthService.getSeedSummaries();
    seed.forEach(s => SamsungHealthService.saveDailySummary(s));
    
    SamsungHealthService.addSyncRecord({
      id: 'sync_sample_' + Date.now(),
      timestamp: Date.now(),
      fileName: 'galaxy_watch_sample_telemetry.json',
      fileType: 'Galaxy Watch BIA & Steps',
      recordsImported: seed.length,
      dateRange: 'Past 4 Days',
      status: 'success',
      summary: 'Loaded official Samsung Health test dataset with InBody BIA & Sleep stages.',
      summaryAr: 'تم تحميل حزمة بيانات سامسونج هيلث وساعة جالاكسي التجريبية.',
    });

    setImportStatus({ 
      type: 'success', 
      message: isAr ? 'تم تحميل بيانات سامسونج هيلث وساعة جالاكسي بنجاح!' : 'Samsung Health & Galaxy Watch sample data loaded successfully!' 
    });
    refreshSamsungData();
  };

  // Apply Selected Summary to User Profile
  const handleApplySummaryToProfile = (summary: SamsungHealthDailySummary) => {
    const updated = SamsungHealthService.applySummaryToProfile(summary);
    onUpdateProfile(updated);
    setImportStatus({ 
      type: 'success', 
      message: isAr 
        ? `تم تحديث ملف الرياضي وبيانات InBody بالوزن (${summary.bodyComposition?.weightKg} كجم) ونسبة الدهون (${summary.bodyComposition?.bodyFatPercent}%)!` 
        : `Applied Galaxy Watch InBody metrics to athlete profile (${summary.bodyComposition?.weightKg} kg, ${summary.bodyComposition?.bodyFatPercent}% Body Fat)!` 
    });
  };

  // Save Manual Entry Form
  const handleSaveManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newSummary: SamsungHealthDailySummary = {
      id: 'sh_manual_' + manualDate,
      date: manualDate,
      steps: manualSteps,
      stepTarget: 10000,
      activeMinutes: Math.round(manualSteps / 110),
      activeCaloriesBurnedKcal: manualActiveCal,
      totalCaloriesBurnedKcal: manualActiveCal + 1950,
      distanceKm: Math.round((manualSteps * 0.00078) * 100) / 100,
      restingHeartRateBpm: manualRestingHr,
      avgHeartRateBpm: manualRestingHr + 14,
      maxHeartRateBpm: manualRestingHr + 90,
      bloodOxygenSpO2Percent: manualSpO2,
      sleepDurationMinutes: Math.round(manualSleepHrs * 60),
      sleepScore: manualSleepScore,
      bodyComposition: {
        weightKg: manualWeight,
        bodyFatPercent: manualFatPct,
        skeletalMuscleKg: manualMuscleKg,
        bodyFatKg: Math.round(manualWeight * (manualFatPct / 100) * 10) / 10,
        waterPercent: 50.2,
        bmrKcal: 1950,
        visceralFat: 21,
      },
      source: 'manual_entry',
      importedAt: Date.now(),
    };

    SamsungHealthService.saveDailySummary(newSummary);
    SamsungHealthService.addSyncRecord({
      id: 'sync_man_' + Date.now(),
      timestamp: Date.now(),
      fileName: 'Manual Entry',
      fileType: 'Direct Watch Log',
      recordsImported: 1,
      dateRange: manualDate,
      status: 'success',
      summary: `Manual entry of Samsung Health data for ${manualDate}.`,
      summaryAr: `تسجيل يدوي لبيانات سامسونج هيلث ليوم ${manualDate}.`,
    });

    handleApplySummaryToProfile(newSummary);
    refreshSamsungData();
    setShowManualModal(false);
  };

  const currentZone = telemetry.heartRateZone || 1;
  const currentZoneInfo = HR_ZONES_CONFIG[currentZone];

  return (
    <div className={`space-y-6 ${isModal ? 'p-1' : 'max-w-6xl mx-auto py-4 px-3 sm:px-6'}`}>
      {/* Top Header Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-lg shadow-blue-500/20">
              <Watch className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-foreground">
                  {isAr ? 'تكامل Samsung Health والساعات الذكية' : 'Samsung Health & Bluetooth Watch Hub'}
                </h1>
                <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-black text-primary uppercase">
                  BLE GATT & BIA
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {isAr 
                  ? 'ربط مباشر لساعات سامسونج جالاكسي، قياسات النبض الحية، ومزامنة تقارير النوم، الخطوات وتركيب الجسم InBody.' 
                  : 'Live Bluetooth GATT heart-rate telemetry, InBody BIA scan sync, daily steps, and Samsung Health diagnostics.'}
              </p>
            </div>
          </div>

          {/* Quick Connect Actions */}
          <div className="flex items-center gap-2">
            {btStatus === 'connected' ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-400">
                  <Wifi className="h-4 w-4" />
                  <span>{btDevice?.name || (isAr ? 'ساعة متصلة' : 'Connected')}</span>
                </span>
                <button
                  type="button"
                  id="btn-disconnect-bt"
                  onClick={handleDisconnectBluetooth}
                  className="rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  {isAr ? 'قطع الاتصال' : 'Disconnect'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-connect-watch-ble"
                  onClick={handleConnectBluetooth}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  <Bluetooth className="h-4 w-4" />
                  <span>{isAr ? 'مسح وربط الساعة (Bluetooth)' : 'Scan & Connect Watch'}</span>
                </button>

                <button
                  type="button"
                  id="btn-toggle-sim-mode"
                  onClick={handleToggleSimulator}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all ${
                    isSimulating 
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400' 
                      : 'border-border bg-secondary/50 text-foreground hover:bg-secondary'
                  }`}
                  title={isAr ? 'تشغيل وضع المحاكي المباشر بدون جهاز فعلي' : 'Run Live Simulator without hardware'}
                >
                  <Zap className="h-4 w-4 text-cyan-400" />
                  <span>{isAr ? 'المحاكي المباشر' : 'Live Simulator'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bluetooth Error & Permissions Policy Alert */}
        {btErrorMessage && (
          btErrorMessage === 'PERMISSIONS_POLICY_DISALLOWED' ? (
            <div className="mt-4 rounded-2xl border border-sky-500/40 bg-gradient-to-r from-sky-500/15 via-background to-cyan-500/10 p-4 shadow-lg animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span>{isAr ? 'واجهة البلوتوث مقيدة داخل نافذة المعاينة المدمجة' : 'Web Bluetooth in Preview Frame'}</span>
                      <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-400 border border-sky-500/30">
                        {isAr ? 'بيئة المعاينة' : 'Preview Sandbox'}
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                      {isAr 
                        ? 'تمنع متصفحات الويب (Chrome / Edge) مسح أجهزة البلوتوث الحقيقية مباشرة داخل إطارات المعاينة المضمنة (iFrame) لأسباب أمنية. لتجربة الاتصال الفعلي بساعتك، استخدم زر فتح التطبيق في المتصفح أو قم بتشغيل المحاكي الحي المباشر.' 
                        : 'Web browsers restrict Web Bluetooth requests inside embedded preview iframes. Open the standalone app or use the Live Telemetry Simulator for real-time cardiac zones.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    id="btn-start-sim-from-err"
                    onClick={() => {
                      setBtErrorMessage('');
                      handleToggleSimulator();
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-xs font-bold px-4 py-2 shadow-sm transition-all active:scale-95"
                  >
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    <span>{isAr ? 'تشغيل المحاكي الحي الآن' : 'Start Live Simulator'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBtErrorMessage('')}
                    className="rounded-xl border border-border bg-secondary/50 p-2 text-muted-foreground hover:text-foreground text-xs"
                    title={isAr ? 'إغلاق التنبيه' : 'Dismiss'}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>{btErrorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setBtErrorMessage('')}
                className="text-muted-foreground hover:text-foreground text-[11px] font-bold"
              >
                {isAr ? 'إغلاق' : 'Dismiss'}
              </button>
            </div>
          )
        )}

        {/* Import Status Alert */}
        {importStatus.type !== 'idle' && (
          <div
            className={`mt-4 flex items-center justify-between rounded-xl p-3 text-xs ${
              importStatus.type === 'success'
                ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border border-red-500/40 bg-red-500/10 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {importStatus.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              )}
              <span>{importStatus.message}</span>
            </div>
            <button
              onClick={() => setImportStatus({ type: 'idle', message: '' })}
              className="text-muted-foreground hover:text-foreground text-[11px] font-bold"
            >
              {isAr ? 'إغلاق' : 'Dismiss'}
            </button>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <button
            type="button"
            id="tab-bt-telemetry"
            onClick={() => setActiveTab('bluetooth')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'bluetooth'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Heart className="h-4 w-4" />
            <span>{isAr ? 'نبض الساعة المباشر (Live BLE)' : 'Live Watch Telemetry'}</span>
            {btStatus === 'connected' && (
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            type="button"
            id="tab-bt-activity-logs"
            onClick={() => setActiveTab('activity_logs')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'activity_logs'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Footprints className="h-4 w-4" />
            <span>{isAr ? 'سجل نشاط أجهزة البلوتوث (Steps & HRV)' : 'Bluetooth Activity Log'}</span>
            <span className="rounded-full bg-sky-500/20 px-1.5 py-0.2 text-[9px] font-black text-sky-400 border border-sky-500/30">
              NEW
            </span>
          </button>

          <button
            type="button"
            id="tab-samsung-sync"
            onClick={() => setActiveTab('samsung_sync')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'samsung_sync'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>{isAr ? 'استيراد ومزامنة Samsung Health' : 'Samsung Health Import'}</span>
          </button>

          <button
            type="button"
            id="tab-measures-analytics"
            onClick={() => setActiveTab('measures_analytics')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'measures_analytics'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>{isAr ? 'تحليلات InBody والنوم والنشاط' : 'InBody, Sleep & Steps Analytics'}</span>
          </button>

          <button
            type="button"
            id="tab-setup-guide"
            onClick={() => setActiveTab('setup_guide')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'setup_guide'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Info className="h-4 w-4" />
            <span>{isAr ? 'دليل إعداد ساعة جالاكسي' : 'Galaxy Watch Setup Guide'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE BLUETOOTH WATCH & TELEMETRY */}
      {/* ========================================================================= */}
      {activeTab === 'bluetooth' && (
        <div className="space-y-6">
          {/* Real-Time Cardiac Monitor & Live Zone Card */}
          <div className={`rounded-3xl border ${currentZoneInfo.border} ${currentZoneInfo.bg} p-6 shadow-md transition-all`}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              {/* Pulsing Heart & BPM Display */}
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-border/80 bg-background/80 shadow-2xl backdrop-blur">
                  <Heart className={`h-12 w-12 fill-current ${currentZoneInfo.color} ${btStatus === 'connected' ? 'animate-pulse' : 'opacity-40'}`} />
                  {btStatus === 'connected' && (
                    <span className="absolute -bottom-2 rounded-full bg-background border border-border px-2 py-0.5 text-[9px] font-black text-foreground">
                      LIVE
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-center sm:justify-start gap-2">
                    <span className="text-5xl font-black text-foreground font-mono tracking-tight">
                      {btStatus === 'connected' && telemetry.heartRateBpm > 0 ? telemetry.heartRateBpm : '--'}
                    </span>
                    <span className="text-base font-bold text-muted-foreground">BPM</span>
                  </div>

                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className={`rounded-lg px-2 py-0.5 text-xs font-black border ${currentZoneInfo.border} ${currentZoneInfo.bg} ${currentZoneInfo.color}`}>
                      {isAr ? currentZoneInfo.nameAr : currentZoneInfo.nameEn}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground font-medium">
                    {isAr ? currentZoneInfo.descAr : currentZoneInfo.descEn}
                  </p>
                </div>
              </div>

              {/* Real-time Physiological Vitals */}
              <div className="grid grid-cols-3 gap-3">
                {/* Calories Burn Rate */}
                <div className="rounded-2xl border border-border/60 bg-background/60 p-3.5 text-center backdrop-blur">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-400">
                    <Flame className="h-3.5 w-3.5" />
                    <span>{isAr ? 'معدل الحرق' : 'Burn Rate'}</span>
                  </div>
                  <div className="text-lg font-black text-foreground font-mono mt-1">
                    {telemetry.caloriesBurnedRate || 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground">kcal / min</div>
                </div>

                {/* Heart Rate Variability HRV */}
                <div className="rounded-2xl border border-border/60 bg-background/60 p-3.5 text-center backdrop-blur">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-cyan-400">
                    <Activity className="h-3.5 w-3.5" />
                    <span>{isAr ? 'تقلب النبض HRV' : 'HRV (RMSSD)'}</span>
                  </div>
                  <div className="text-lg font-black text-foreground font-mono mt-1">
                    {telemetry.hrvRmssd ? `${telemetry.hrvRmssd}ms` : '42ms'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{isAr ? 'حالة التعافي' : 'Readiness'}</div>
                </div>

                {/* Device Battery & Sensor */}
                <div className="rounded-2xl border border-border/60 bg-background/60 p-3.5 text-center backdrop-blur">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-400">
                    <Battery className="h-3.5 w-3.5" />
                    <span>{isAr ? 'البطارية' : 'Battery'}</span>
                  </div>
                  <div className="text-lg font-black text-foreground font-mono mt-1">
                    {btDevice?.batteryLevel !== undefined ? `${btDevice.batteryLevel}%` : '88%'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{btDevice?.sensorLocation || 'Wrist'}</div>
                </div>
              </div>

              {/* Heart Rate Zone Gauge */}
              <div className="space-y-2 rounded-2xl border border-border/60 bg-background/60 p-4 backdrop-blur">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted-foreground">{isAr ? 'مقياس مناطق النبض' : 'Target HR Zones'}</span>
                  <span className="text-foreground font-mono">Max HR: {220 - (profile.age || 41)} BPM</span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 h-3.5 w-full rounded-full bg-secondary/50 p-0.5 overflow-hidden">
                  {[1, 2, 3, 4, 5].map((z) => {
                    const active = (telemetry.heartRateZone || 1) >= z;
                    const isCurrent = (telemetry.heartRateZone || 1) === z;
                    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-amber-500', 'bg-rose-500'];
                    return (
                      <div
                        key={z}
                        className={`h-full rounded-sm transition-all duration-300 ${
                          active ? colors[z - 1] : 'bg-secondary/80'
                        } ${isCurrent ? 'ring-2 ring-white shadow-lg' : ''}`}
                        title={`Zone ${z}`}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Z1 (Recovery)</span>
                  <span>Z2 (Fat Loss)</span>
                  <span>Z3 (Tempo)</span>
                  <span>Z4 (Lactate)</span>
                  <span>Z5 (Peak)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Simulator Intensity Switcher (when simulation mode is active) */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  {isAr ? 'التحكم في شدة النبض بالمحاكي' : 'Live Heart Rate Simulator Intensity Control'}
                </h3>
              </div>
              <span className="text-xs text-muted-foreground">
                {isAr ? 'اختر الشدة لمحاكاة التمارين وحرق الدهون' : 'Simulate different exercise intensities'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => handleSetSimulatorZone(70)}
                className={`rounded-xl border p-2.5 text-center text-xs transition-all ${
                  simIntensity <= 80 ? 'border-blue-500 bg-blue-500/20 text-blue-400 font-bold' : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary'
                }`}
              >
                <div className="font-bold">70 BPM</div>
                <div className="text-[10px]">{isAr ? 'راحة واستشفاء' : 'Resting / Z1'}</div>
              </button>

              <button
                type="button"
                onClick={() => handleSetSimulatorZone(125)}
                className={`rounded-xl border p-2.5 text-center text-xs transition-all ${
                  simIntensity > 80 && simIntensity <= 130 ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold' : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary'
                }`}
              >
                <div className="font-bold">125 BPM</div>
                <div className="text-[10px]">{isAr ? 'حرق دهون Z2' : 'Fat Burn / Z2'}</div>
              </button>

              <button
                type="button"
                onClick={() => handleSetSimulatorZone(142)}
                className={`rounded-xl border p-2.5 text-center text-xs transition-all ${
                  simIntensity > 130 && simIntensity <= 150 ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400 font-bold' : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary'
                }`}
              >
                <div className="font-bold">142 BPM</div>
                <div className="text-[10px]">{isAr ? 'كارديو وتحمل Z3' : 'Aerobic / Z3'}</div>
              </button>

              <button
                type="button"
                onClick={() => handleSetSimulatorZone(162)}
                className={`rounded-xl border p-2.5 text-center text-xs transition-all ${
                  simIntensity > 150 && simIntensity <= 170 ? 'border-amber-500 bg-amber-500/20 text-amber-400 font-bold' : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary'
                }`}
              >
                <div className="font-bold">162 BPM</div>
                <div className="text-[10px]">{isAr ? 'مجموعات حديد Z4' : 'Lifting Set / Z4'}</div>
              </button>

              <button
                type="button"
                onClick={() => handleSetSimulatorZone(180)}
                className={`col-span-2 sm:col-span-1 rounded-xl border p-2.5 text-center text-xs transition-all ${
                  simIntensity > 170 ? 'border-rose-500 bg-rose-500/20 text-rose-400 font-bold' : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary'
                }`}
              >
                <div className="font-bold">180 BPM</div>
                <div className="text-[10px]">{isAr ? 'أقصى جهد Z5' : 'Peak Sprint / Z5'}</div>
              </button>
            </div>
          </div>

          {/* 24-Hour Heart Rate Trend Line Chart (Recharts) */}
          <HeartRateTrends24hChart 
            profile={profile} 
            isArabic={isAr} 
          />

          {/* Quick Jump to Synced Activity Logs */}
          <div className="rounded-3xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 via-card to-emerald-500/10 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Footprints className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  {isAr ? 'سجل نشاط البلوتوث المباشر (الخطوات، HRV، والسعرات)' : 'Bluetooth Activity Log & Biometrics History'}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isAr 
                    ? 'استعرض الجلسات والأنشطة المسحوبة من ساعتك الذكية مصنفة بمقاييس Steps و HRV و Active Calories.'
                    : 'View all recent sessions pulled from your connected wearable, with full steps, HRV recovery scores, and active calorie burn.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-jump-to-activity-logs"
              onClick={() => setActiveTab('activity_logs')}
              className="flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 px-4 text-xs shadow-md shadow-sky-500/20 transition-all shrink-0 active:scale-95"
            >
              <span>{isAr ? 'فتح سجل النشاط' : 'Open Activity Log Tab'}</span>
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>

          {/* Universal Wearable Device Selector & Connection Hub */}
          <div className="rounded-3xl border border-border bg-card p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {isAr ? 'الأجهزة الرياضية والساعات الذكية المدعومة (Universal BLE)' : 'Supported Wearables & Bluetooth HRM Sensors'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isAr 
                    ? 'اختر نوع ساعتك أو جهازك للربط المباشر أو تفعيل المحاكي المخصص وقراءة دليل الإعداد.' 
                    : 'Select your wearable brand for direct Bluetooth pairing, brand-specific telemetry simulation, or pairing guides.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  {isAr ? `${SUPPORTED_DEVICE_BRANDS.length} ماركة مدعومة` : `${SUPPORTED_DEVICE_BRANDS.length} Brands Supported`}
                </span>
              </div>
            </div>
            
            {/* Grid of all 12 Universal Brands */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SUPPORTED_DEVICE_BRANDS.map((brand) => {
                const isSelected = selectedBrandId === brand.id;
                const isCurrentlyConnected = btDevice?.type === brand.id && btStatus === 'connected';

                return (
                  <div
                    key={brand.id}
                    className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                      isCurrentlyConnected
                        ? 'border-emerald-500/50 bg-emerald-500/10 shadow-sm'
                        : isSelected
                        ? 'border-primary/50 bg-primary/5 shadow-sm'
                        : 'border-border/70 bg-secondary/20 hover:border-border hover:bg-secondary/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br ${brand.color}`}>
                            {brand.category === 'watch' ? (
                              <Watch className="h-4 w-4" />
                            ) : brand.category === 'ring' ? (
                              <Sparkles className="h-4 w-4" />
                            ) : brand.category === 'strap' ? (
                              <Activity className="h-4 w-4" />
                            ) : (
                              <Bluetooth className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-foreground leading-tight">
                              {isAr ? brand.nameAr : brand.name}
                            </h4>
                            <span className="text-[10px] text-muted-foreground">
                              {brand.popularModels[0]}
                            </span>
                          </div>
                        </div>

                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-bold text-muted-foreground shrink-0 border border-border">
                          {isAr ? brand.badgeAr : brand.badge}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mt-1">
                        {isAr ? brand.descriptionAr : brand.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveGuideBrand(brand);
                          setShowBrandGuideModal(true);
                        }}
                        className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Info className="h-3 w-3" />
                        <span>{isAr ? 'طريقة الربط' : 'Setup Guide'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBrandId(brand.id);
                            handleToggleSimulator(brand.id);
                          }}
                          className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all border ${
                            isSimulating && btDevice?.type === brand.id
                              ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                              : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
                          }`}
                          title={isAr ? 'محاكاة هذا الجهاز' : 'Simulate this device'}
                        >
                          <Zap className="h-3 w-3 inline mr-0.5" />
                          {isAr ? 'محاكاة' : 'Simulate'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBrandId(brand.id);
                            handleConnectBluetooth(brand.id);
                          }}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                            isCurrentlyConnected
                              ? 'bg-emerald-500 text-white'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          }`}
                        >
                          <Bluetooth className="h-3 w-3" />
                          <span>{isCurrentlyConnected ? (isAr ? 'متصل' : 'Connected') : (isAr ? 'ربط BLE' : 'Pair')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wearable Brand Setup Guide Modal */}
          {showBrandGuideModal && activeGuideBrand && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-br ${activeGuideBrand.color}`}>
                      <Watch className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        {isAr ? activeGuideBrand.nameAr : activeGuideBrand.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {isAr ? 'دليل إعداد الاتصال بالبلوتوث' : 'Bluetooth GATT Pairing Instructions'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowBrandGuideModal(false)}
                    className="rounded-xl border border-border bg-secondary/50 p-2 text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 rounded-2xl border border-border bg-secondary/20 p-4 text-xs">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>{isAr ? 'خطوات التوصيل المباشر:' : 'Direct Connection Steps:'}</span>
                  </h4>

                  {activeGuideBrand.id === 'apple_watch' ? (
                    <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground leading-relaxed">
                      <li>{isAr ? 'افتح تطبيق Workout على ساعة Apple Watch أو تطبيق Heart Rate Broadcast.' : 'Open Heart Rate Broadcast or BLE Companion on your Apple Watch.'}</li>
                      <li>{isAr ? 'تأكد من تفعيل مشاركة النبض عبر البلوتوث (Bluetooth Broadcast).' : 'Ensure Bluetooth Heart Rate broadcasting is active.'}</li>
                      <li>{isAr ? 'اضغط على زر (ربط BLE) في التطبيق واختر ساعتك من نافذة المتصفح.' : 'Click "Pair BLE" in this app and choose your Apple Watch in browser prompt.'}</li>
                    </ol>
                  ) : activeGuideBrand.id === 'garmin' ? (
                    <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground leading-relaxed">
                      <li>{isAr ? 'في ساعة جارمن: اذهب إلى الإعدادات > المستشعرات > نبضات القلب > بث النبض (Broadcast HR).' : 'On Garmin watch: Go to Settings > Sensors & Accessories > Wrist Heart Rate > Broadcast Heart Rate.'}</li>
                      <li>{isAr ? 'فعل البث المباشر (Broadcast During Activity أو Broadcast Live).' : 'Enable Broadcast Live during your session.'}</li>
                      <li>{isAr ? 'اضغط (ربط BLE) وسيتعرف التطبيق فوراً على نبضاتك بدقة رياضية.' : 'Click "Pair BLE" to link your Garmin cardiac telemetry.'}</li>
                    </ol>
                  ) : activeGuideBrand.id === 'polar' || activeGuideBrand.id === 'wahoo' ? (
                    <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground leading-relaxed">
                      <li>{isAr ? 'ارتدِ حزام الصدر (Polar H10 أو Wahoo TICKR) وتأكد من ترطيب القطبين الموصلين.' : 'Put on the chest strap and moisten electrode pads for solid skin contact.'}</li>
                      <li>{isAr ? 'يتم تفعيل البلوتوث تلقائياً بمجرد إغلاق القفل ولمس الجلد.' : 'Bluetooth transmits automatically when snapped on.'}</li>
                      <li>{isAr ? 'اضغط (ربط BLE) للاتصال فورا وقراءة أدق نبضات وتخطيط HRV.' : 'Click "Pair BLE" for gold-standard ECG & HRV telemetry.'}</li>
                    </ol>
                  ) : activeGuideBrand.id === 'whoop' ? (
                    <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground leading-relaxed">
                      <li>{isAr ? 'في تطبيق WHOOP على هاتفك: اذهب إلى Device Settings > Heart Rate Broadcast.' : 'In WHOOP app: Go to Device Settings > Heart Rate Broadcast.'}</li>
                      <li>{isAr ? 'فعل خيار "Broadcast Heart Rate".' : 'Toggle on "Broadcast Heart Rate".'}</li>
                      <li>{isAr ? 'اضغط (ربط BLE) هنا للاتصال المباشر بحزام ووب.' : 'Click "Pair BLE" to link your WHOOP band.'}</li>
                    </ol>
                  ) : (
                    <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground leading-relaxed">
                      <li>{isAr ? 'تأكد من تشغيل البلوتوث على جهازك وسماح مشاركة قياسات النبض.' : 'Ensure Bluetooth is ON and HRM broadcasting is enabled.'}</li>
                      <li>{isAr ? 'اجعل الجهاز قريباً من الهاتف أو الحاسوب.' : 'Keep device in close proximity.'}</li>
                      <li>{isAr ? 'اضغط على (ربط BLE) لاكتشافه واقترانه.' : 'Click "Pair BLE" to scan and link.'}</li>
                    </ol>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBrandGuideModal(false);
                      handleConnectBluetooth(activeGuideBrand.id);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    <Bluetooth className="h-4 w-4" />
                    <span>{isAr ? 'بدء الاقتران الآن' : 'Start Pairing Now'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BLUETOOTH HEALTH DEVICES RECENT ACTIVITY LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'activity_logs' && (
        <BluetoothActivityLogsTab
          profile={profile}
          isArabic={isAr}
          onNavigateToLive={() => setActiveTab('bluetooth')}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SAMSUNG HEALTH IMPORT & SYNC */}
      {/* ========================================================================= */}
      {activeTab === 'samsung_sync' && (
        <div className="space-y-6">
          {/* File Drag & Drop / Upload Area */}
          <div className="rounded-3xl border border-border bg-card p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {isAr ? 'استيراد ملفات Samsung Health' : 'Import Samsung Health Export Files'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isAr 
                    ? 'يدعم ملفات JSON أو ملفات CSV المأخوذة من تحميل البيانات الشخصية في تطبيق سامسونج هيلث.' 
                    : 'Upload JSON or CSV data archives from Samsung Health Personal Data Export.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isAr ? 'تسجيل يدوي سريع' : 'Quick Manual Log'}</span>
                </button>

                <button
                  type="button"
                  id="btn-load-samsung-sample"
                  onClick={handleLoadSampleSamsungData}
                  className="flex items-center gap-1.5 rounded-xl bg-primary/15 border border-primary/30 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/25 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isAr ? 'تحميل بيانات تجريبية حقيقية' : 'Load Sample Galaxy Data'}</span>
                </button>
              </div>
            </div>

            {/* Dropzone Container */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  processUploadedFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-primary bg-primary/10 scale-[1.01]' 
                  : 'border-border/80 bg-secondary/20 hover:border-primary/50 hover:bg-secondary/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    processUploadedFile(e.target.files[0]);
                  }
                }}
              />
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary mb-3">
                <UploadCloud className="h-7 w-7" />
              </div>
              <p className="text-sm font-bold text-foreground">
                {isAr ? 'اسحب ملف بيانات Samsung Health هنا، أو انقر للاختيار' : 'Drag & drop your Samsung Health export file, or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isAr 
                  ? 'يدعم ملفات: step_daily_trend.csv, tracker.heart_rate.bin.csv, body_composition.csv أو ملفات JSON' 
                  : 'Supports: step_daily_trend.csv, body_composition.csv, sleep_data.csv, or full JSON export'}
              </p>
            </div>
          </div>

          {/* Parsed Summaries List */}
          <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                {isAr ? 'البيانات والمقاييس المستوردة' : 'Imported Daily Measures'} ({summaries.length})
              </h3>
              <span className="text-xs text-muted-foreground">
                {isAr ? 'اضغط لتطبيق قياسات InBody على ملفك' : 'Click apply to sync InBody metrics to profile'}
              </span>
            </div>

            {summaries.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                {isAr ? 'لم يتم استيراد أي بيانات بعد. استخدم زر تحميل العينة أو ارفع ملفك.' : 'No data imported yet. Click "Load Sample Galaxy Data" to test.'}
              </div>
            ) : (
              <div className="space-y-3">
                {summaries.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between rounded-2xl border border-border bg-secondary/30 p-4 gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-foreground font-mono">{item.date}</span>
                        <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                          {item.source}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 text-foreground font-semibold">
                          <Footprints className="h-3.5 w-3.5 text-cyan-400" />
                          {item.steps.toLocaleString()} {isAr ? 'خطوة' : 'steps'}
                        </span>
                        <span className="flex items-center gap-1 text-foreground font-semibold">
                          <Flame className="h-3.5 w-3.5 text-amber-400" />
                          {item.activeCaloriesBurnedKcal} kcal
                        </span>
                        <span className="flex items-center gap-1 text-foreground font-semibold">
                          <Moon className="h-3.5 w-3.5 text-indigo-400" />
                          {Math.round((item.sleepDurationMinutes || 440) / 60 * 10) / 10} hrs ({item.sleepScore || 85}%)
                        </span>
                        {item.restingHeartRateBpm && (
                          <span className="flex items-center gap-1 text-foreground font-semibold">
                            <Heart className="h-3.5 w-3.5 text-rose-400" />
                            {item.restingHeartRateBpm} BPM Rest
                          </span>
                        )}
                        {item.bodyComposition && (
                          <span className="flex items-center gap-1 text-primary font-bold">
                            <Scale className="h-3.5 w-3.5" />
                            {item.bodyComposition.weightKg}kg ({item.bodyComposition.bodyFatPercent}% Fat / {item.bodyComposition.skeletalMuscleKg}kg Muscle)
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplySummaryToProfile(item)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-all shrink-0"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{isAr ? 'تطبيق InBody على البروفايل' : 'Apply InBody to Profile'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MEASURES & INBODY ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'measures_analytics' && (
        <div className="space-y-6">
          {/* Latest Summary Top Banner */}
          {latestSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Daily Steps */}
              <div className="rounded-3xl border border-border bg-card p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-bold">
                  <span>{isAr ? 'خطوات اليوم (ساعة جالاكسي)' : "Today's Steps (Watch)"}</span>
                  <Footprints className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-foreground font-mono">
                  {latestSummary.steps.toLocaleString()}
                </div>
                <div className="space-y-1">
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div 
                      className="h-full bg-cyan-400 rounded-full" 
                      style={{ width: `${Math.min(100, (latestSummary.steps / (latestSummary.stepTarget || 10000)) * 100)}%` }} 
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{Math.round((latestSummary.steps / (latestSummary.stepTarget || 10000)) * 100)}% of 10k target</span>
                    <span>{latestSummary.distanceKm} km</span>
                  </div>
                </div>
              </div>

              {/* Sleep Score & Duration */}
              <div className="rounded-3xl border border-border bg-card p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-bold">
                  <span>{isAr ? 'تحليل النوم والاستشفاء' : 'Sleep Score & Recovery'}</span>
                  <Moon className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-foreground font-mono">
                  {latestSummary.sleepScore || 88} <span className="text-xs font-normal text-muted-foreground">/ 100</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">
                    {Math.floor((latestSummary.sleepDurationMinutes || 440) / 60)}h {(latestSummary.sleepDurationMinutes || 440) % 60}m
                  </span>
                  <span>• {latestSummary.sleepDeepMinutes || 92}m Deep Sleep</span>
                </div>
              </div>

              {/* Resting HR & SpO2 */}
              <div className="rounded-3xl border border-border bg-card p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-bold">
                  <span>{isAr ? 'نبض الراحة والأكسجين' : 'Resting HR & SpO2'}</span>
                  <Heart className="h-4 w-4 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-foreground font-mono">
                  {latestSummary.restingHeartRateBpm || 61} <span className="text-xs font-normal text-muted-foreground">BPM</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-emerald-400 font-bold">SpO2: {latestSummary.bloodOxygenSpO2Percent || 98}%</span>
                  <span>• BP: {latestSummary.bloodPressureSystolic || 119}/{latestSummary.bloodPressureDiastolic || 77}</span>
                </div>
              </div>

              {/* InBody Weight & Fat % */}
              <div className="rounded-3xl border border-border bg-card p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-bold">
                  <span>{isAr ? 'تحليل BIA من الساعة' : 'Galaxy Watch BIA Scan'}</span>
                  <Scale className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-black text-primary font-mono">
                  {latestSummary.bodyComposition?.weightKg || profile.currentWeightKg} <span className="text-xs font-normal text-muted-foreground">kg</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{latestSummary.bodyComposition?.bodyFatPercent || 32.1}% Fat</span>
                  <span>• {latestSummary.bodyComposition?.skeletalMuscleKg || 34.0}kg Muscle</span>
                </div>
              </div>
            </div>
          )}

          {/* 24-Hour Heart Rate Trend Line Chart (Recharts) */}
          <HeartRateTrends24hChart 
            profile={profile} 
            isArabic={isAr} 
          />

          {/* Full InBody BIA Galaxy Watch Composition Card */}
          <div className="rounded-3xl border border-border bg-card p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  {isAr ? 'تحليل تكوين الجسم InBody من ساعة سامسونج جالاكسي' : 'Galaxy Watch InBody BIA Body Composition'}
                </h3>
              </div>
              <span className="text-xs text-muted-foreground">
                Bioelectrical Impedance Analysis (BIA) Sensor
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5 text-center">
                <div className="text-[11px] text-muted-foreground">{isAr ? 'الوزن الكلي' : 'Total Weight'}</div>
                <div className="text-xl font-black text-foreground font-mono mt-1">
                  {latestSummary?.bodyComposition?.weightKg || profile.currentWeightKg} kg
                </div>
                <div className="text-[10px] text-emerald-400">{isAr ? 'هدف: 80 كجم' : 'Goal: 80.0 kg'}</div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5 text-center">
                <div className="text-[11px] text-muted-foreground">{isAr ? 'نسبة الدهون' : 'Body Fat %'}</div>
                <div className="text-xl font-black text-amber-400 font-mono mt-1">
                  {latestSummary?.bodyComposition?.bodyFatPercent || 32.5}%
                </div>
                <div className="text-[10px] text-muted-foreground">{latestSummary?.bodyComposition?.bodyFatKg || 32.8} kg Fat</div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5 text-center">
                <div className="text-[11px] text-muted-foreground">{isAr ? 'الكتلة العضلية الهيكلية' : 'Skeletal Muscle'}</div>
                <div className="text-xl font-black text-primary font-mono mt-1">
                  {latestSummary?.bodyComposition?.skeletalMuscleKg || 33.9} kg
                </div>
                <div className="text-[10px] text-emerald-400">{isAr ? 'محمية أثناء الحرق' : 'Preserved'}</div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5 text-center">
                <div className="text-[11px] text-muted-foreground">{isAr ? 'مياه الجسم' : 'Body Water'}</div>
                <div className="text-xl font-black text-blue-400 font-mono mt-1">
                  {latestSummary?.bodyComposition?.waterPercent || 49.8}%
                </div>
                <div className="text-[10px] text-muted-foreground">50.3 Liters</div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5 text-center">
                <div className="text-[11px] text-muted-foreground">{isAr ? 'الأيض الأساسي BMR' : 'BMR Energy'}</div>
                <div className="text-xl font-black text-rose-400 font-mono mt-1">
                  {latestSummary?.bodyComposition?.bmrKcal || 1950}
                </div>
                <div className="text-[10px] text-muted-foreground">kcal / day</div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5 text-center">
                <div className="text-[11px] text-muted-foreground">{isAr ? 'الدهون الحشوية' : 'Visceral Fat'}</div>
                <div className="text-xl font-black text-amber-400 font-mono mt-1">
                  {latestSummary?.bodyComposition?.visceralFat || 22.0}
                </div>
                <div className="text-[10px] text-muted-foreground">{isAr ? 'مستوى الخطورة' : 'Target: < 10'}</div>
              </div>
            </div>
          </div>

          {/* Sync History Logs */}
          <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">
              {isAr ? 'سجل عمليات المزامنة السابقة' : 'Samsung Health Sync History'}
            </h3>

            <div className="space-y-2">
              {syncRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 p-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-foreground">{rec.fileName}</div>
                      <div className="text-muted-foreground mt-0.5">
                        {isAr ? rec.summaryAr : rec.summary}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-muted-foreground font-mono">
                    {new Date(rec.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SETUP GUIDE */}
      {/* ========================================================================= */}
      {activeTab === 'setup_guide' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Galaxy Watch BLE Broadcast Guide */}
            <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2.5 text-primary">
                <Watch className="h-5 w-5" />
                <h3 className="text-base font-bold text-foreground">
                  {isAr ? 'طريقة تفعيل بث النبض المباشر بساعة جالاكسي' : 'Galaxy Watch Live HR Broadcast Setup'}
                </h3>
              </div>

              <ol className="space-y-3 text-xs text-muted-foreground list-decimal list-inside font-medium leading-relaxed">
                <li>
                  <strong className="text-foreground">{isAr ? 'افتح تطبيق Samsung Health على الساعة' : 'Open Samsung Health on your Galaxy Watch'}</strong>: 
                  {isAr ? ' انتقل إلى الإعدادات ثم قياس معدل ضربات القلب واختر (القياس المستمر Continuous).' : ' Go to Settings > Heart Rate > Select "Measure Continuously".'}
                </li>
                <li>
                  <strong className="text-foreground">{isAr ? 'تفعيل مشاركة معدل ضربات القلب (BLE HRM)' : 'Enable HR Broadcast to External Devices'}</strong>: 
                  {isAr ? ' في وضع التمرين، اختر مشاركة معدل النبض عبر البلوتوث للأجهزة القريبة.' : ' In workout mode, enable HR sharing over Bluetooth GATT.'}
                </li>
                <li>
                  <strong className="text-foreground">{isAr ? 'انقر على زر "مسح وربط الساعة" في التطبيق' : 'Click "Scan & Connect Watch" in App'}</strong>: 
                  {isAr ? ' سيظهر لك نافذة متصفح لاختيار ساعة Galaxy Watch وربطها فورياً.' : ' Select your Galaxy Watch from the browser Bluetooth prompt to pair instantly.'}
                </li>
              </ol>
            </div>

            {/* Samsung Health Export Guide */}
            <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2.5 text-cyan-400">
                <FileText className="h-5 w-5" />
                <h3 className="text-base font-bold text-foreground">
                  {isAr ? 'كيفية تصدير بيانات Samsung Health من الهاتف' : 'How to Download Samsung Health Data'}
                </h3>
              </div>

              <ol className="space-y-3 text-xs text-muted-foreground list-decimal list-inside font-medium leading-relaxed">
                <li>
                  <strong className="text-foreground">{isAr ? 'افتح تطبيق Samsung Health على هاتف سامسونج' : 'Open Samsung Health on your Phone'}</strong>: 
                  {isAr ? ' اضغط على أيقونة (المزيد / النقاط الثلاث) في أعلى اليمين ثم اختر الإعدادات.' : ' Tap the top menu > Settings.'}
                </li>
                <li>
                  <strong className="text-foreground">{isAr ? 'تنزيل البيانات الشخصية (Download Personal Data)' : 'Download Personal Data'}</strong>: 
                  {isAr ? ' انقر على تنزيل البيانات الشخصية وسيتم إنشاء ملف الأرشيف.' : ' Tap "Download Personal Data" to generate your full health export.'}
                </li>
                <li>
                  <strong className="text-foreground">{isAr ? 'رفع الملف في التطبيق' : 'Upload File to EddieB OS'}</strong>: 
                  {isAr ? ' اسحب الملف في تبويب "استيراد ومزامنة" وسيقوم النظام بقراءة خطواتك ونسبة الدهون تلقائياً.' : ' Drag and drop the CSV/JSON file to automatically ingest steps, sleep, and InBody metrics.'}
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">
                {isAr ? 'تسجيل مقاييس ساعة سامسونج جالاكسي يدوياً' : 'Log Samsung Health Watch Metrics Manually'}
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    {isAr ? 'التاريخ' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    {isAr ? 'عدد الخطوات' : 'Daily Steps'}
                  </label>
                  <input
                    type="number"
                    value={manualSteps}
                    onChange={(e) => setManualSteps(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    {isAr ? 'الوزن من الساعة (كجم)' : 'InBody Weight (kg)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualWeight}
                    onChange={(e) => setManualWeight(parseFloat(e.target.value) || 100)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    {isAr ? 'نسبة الدهون (%)' : 'Body Fat (%)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualFatPct}
                    onChange={(e) => setManualFatPct(parseFloat(e.target.value) || 32)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground font-mono font-bold text-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    {isAr ? 'الكتلة العضلية (كجم)' : 'Skeletal Muscle (kg)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualMuscleKg}
                    onChange={(e) => setManualMuscleKg(parseFloat(e.target.value) || 34)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground font-mono font-bold text-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    {isAr ? 'نبض الراحة (BPM)' : 'Resting Heart Rate'}
                  </label>
                  <input
                    type="number"
                    value={manualRestingHr}
                    onChange={(e) => setManualRestingHr(parseInt(e.target.value, 10) || 60)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground font-mono font-bold text-rose-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    {isAr ? 'ساعات النوم' : 'Sleep Hours'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualSleepHrs}
                    onChange={(e) => setManualSleepHrs(parseFloat(e.target.value) || 7)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    {isAr ? 'تقييم النوم (Score)' : 'Sleep Score (0-100)'}
                  </label>
                  <input
                    type="number"
                    value={manualSleepScore}
                    onChange={(e) => setManualSleepScore(parseInt(e.target.value, 10) || 80)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="rounded-xl border border-border bg-secondary/40 px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-secondary"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90"
                >
                  {isAr ? 'حفظ وتحديث البروفايل' : 'Save & Sync to Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
