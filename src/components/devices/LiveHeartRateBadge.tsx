import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Bluetooth, 
  Battery, 
  Activity, 
  Flame, 
  Sliders, 
  CheckCircle2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { 
  BluetoothHealthService 
} from '../../services/bluetoothHealthService';
import { 
  LiveTelemetryData, 
  BluetoothDeviceInfo, 
  BluetoothConnectionStatus, 
  HeartRateZone 
} from '../../types';

interface LiveHeartRateBadgeProps {
  onOpenDevicesModal?: () => void;
  compact?: boolean;
  className?: string;
  isArabic?: boolean;
}

const ZONE_COLORS: Record<HeartRateZone, { bg: string; text: string; border: string; labelEn: string; labelAr: string }> = {
  1: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', labelEn: 'Z1 Warmup', labelAr: 'Z1 إحماء' },
  2: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', labelEn: 'Z2 Fat Burn', labelAr: 'Z2 حرق دهون' },
  3: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/40', labelEn: 'Z3 Aerobic', labelAr: 'Z3 هوائي' },
  4: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', labelEn: 'Z4 Threshold', labelAr: 'Z4 عتبة شديدة' },
  5: { bg: 'bg-rose-500/25', text: 'text-rose-400', border: 'border-rose-500/50', labelEn: 'Z5 Max Redline', labelAr: 'Z5 أقصى جهد' },
};

export const LiveHeartRateBadge: React.FC<LiveHeartRateBadgeProps> = ({
  onOpenDevicesModal,
  compact = false,
  className = '',
  isArabic = false,
}) => {
  const [status, setStatus] = useState<BluetoothConnectionStatus>(BluetoothHealthService.getStatus());
  const [device, setDevice] = useState<BluetoothDeviceInfo | null>(BluetoothHealthService.getDeviceInfo());
  const [telemetry, setTelemetry] = useState<LiveTelemetryData>(BluetoothHealthService.getLatestTelemetry());

  useEffect(() => {
    const unsubDev = BluetoothHealthService.subscribeDeviceState((dev, st) => {
      setDevice(dev);
      setStatus(st);
    });

    const unsubTel = BluetoothHealthService.subscribeTelemetry((tel) => {
      setTelemetry(tel);
    });

    return () => {
      unsubDev();
      unsubTel();
    };
  }, []);

  const isConnected = status === 'connected';
  const bpm = telemetry.heartRateBpm;
  const zone = telemetry.heartRateZone || 1;
  const zoneInfo = ZONE_COLORS[zone];

  if (!isConnected) {
    return (
      <button
        type="button"
        id="btn-quick-connect-watch"
        onClick={onOpenDevicesModal}
        className={`flex items-center gap-1.5 rounded-xl border border-dashed border-border/80 bg-secondary/30 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:bg-secondary/60 hover:text-foreground transition-all ${className}`}
        title={isArabic ? 'ربط ساعة سامسونج جالاكسي أو البلوتوث' : 'Connect Galaxy Watch or Bluetooth HRM'}
      >
        <Bluetooth className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-semibold">{isArabic ? 'ساعة البلوتوث' : 'Health Watch'}</span>
        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">OFF</span>
      </button>
    );
  }

  if (compact) {
    return (
      <button
        type="button"
        id="btn-live-hr-compact"
        onClick={onOpenDevicesModal}
        className={`flex items-center gap-2 rounded-xl border ${zoneInfo.border} ${zoneInfo.bg} px-2.5 py-1 text-xs transition-all shadow-sm ${className}`}
      >
        <Heart className={`h-3.5 w-3.5 fill-current ${zoneInfo.text} animate-pulse`} />
        <span className="font-black text-foreground font-mono tracking-tight">{bpm > 0 ? `${bpm} BPM` : '--'}</span>
        <span className={`text-[10px] font-bold ${zoneInfo.text}`}>
          {isArabic ? zoneInfo.labelAr : zoneInfo.labelEn}
        </span>
      </button>
    );
  }

  return (
    <div
      onClick={onOpenDevicesModal}
      className={`cursor-pointer group flex items-center justify-between rounded-2xl border ${zoneInfo.border} ${zoneInfo.bg} p-3 transition-all hover:shadow-md ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${zoneInfo.border} bg-background shadow-inner`}>
          <Heart className={`h-5 w-5 fill-current ${zoneInfo.text} animate-pulse`} />
          {telemetry.isSimulated && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-black text-primary-foreground">
              S
            </span>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-foreground font-mono leading-none tracking-tight">
              {bpm > 0 ? bpm : '--'}
            </span>
            <span className="text-xs font-bold text-muted-foreground">BPM</span>
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${zoneInfo.bg} ${zoneInfo.text} border ${zoneInfo.border}`}>
              {isArabic ? zoneInfo.labelAr : zoneInfo.labelEn}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
            <span className="truncate max-w-[120px] font-medium text-foreground">
              {device?.name || (isArabic ? 'ساعة متصلة' : 'Connected Watch')}
            </span>
            {device?.batteryLevel !== undefined && (
              <span className="flex items-center gap-0.5 text-muted-foreground">
                <Battery className="h-3 w-3" />
                {device.batteryLevel}%
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end text-right">
        {telemetry.caloriesBurnedRate !== undefined && telemetry.caloriesBurnedRate > 0 && (
          <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
            <Flame className="h-3.5 w-3.5" />
            <span>{telemetry.caloriesBurnedRate} kcal/min</span>
          </div>
        )}
        {telemetry.hrvRmssd !== undefined && (
          <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
            <Activity className="h-3 w-3" />
            <span>HRV {telemetry.hrvRmssd}ms</span>
          </div>
        )}
      </div>
    </div>
  );
};
