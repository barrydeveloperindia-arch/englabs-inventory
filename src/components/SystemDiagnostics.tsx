import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Database,
  Smartphone,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SystemDiagnosticsProps {
  isFirestoreOnline?: boolean;
  latency?: number;
  timeDrift?: number; // in seconds
  batteryLevel?: number; // 0 to 1
  cpuLoad?: number;
}

export const SystemDiagnostics: React.FC<SystemDiagnosticsProps> = ({
  isFirestoreOnline = true,
  latency = 42,
  timeDrift = 0,
  batteryLevel = 0.85,
  cpuLoad = 12
}) => {
  const [pulse, setPulse] = useState(true);

  // Subtle heartbeat animation (disabled in test mode to prevent deadlocks)
  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    const interval = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(interval);
  }, []);

  const isTimeSyncHealthy = Math.abs(timeDrift) < 5;
  const isBatteryLow = batteryLevel < 0.2;

  return (
    <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden relative group max-w-2xl">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg bg-primary-500/10 text-primary-400",
              pulse && "animate-pulse"
            )}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">System Diagnostics</h3>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Node: ENGLABS-HQ-01</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operational
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Database Pulse */}
          <div data-testid="firestore-pulse" className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Firestore Pulse</span>
            </div>
            <div className="flex items-end justify-between">
              <span className={cn(
                "text-lg font-black uppercase tracking-tighter",
                isFirestoreOnline ? "text-emerald-400" : "text-rose-500"
              )}>
                {isFirestoreOnline ? 'HEALTHY' : 'OFFLINE'}
              </span>
              <span className="text-[10px] font-bold text-neutral-500 mb-1">{latency}ms</span>
            </div>
          </div>

          {/* Time Sync */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Chronos Sync</span>
            </div>
            <div className="flex items-end justify-between">
              <span className={cn(
                "text-lg font-black uppercase tracking-tighter",
                isTimeSyncHealthy ? "text-white" : "text-amber-500"
              )}>
                {isTimeSyncHealthy ? 'SYNCED' : 'SYNC WARNING'}
              </span>
              <span className="text-[10px] font-bold text-neutral-500 mb-1">+{timeDrift}s</span>
            </div>
          </div>

          {/* Machine Health (CPU) */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Cortex Load</span>
            </div>
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex justify-between items-center">
                <span className="text-lg font-black text-white uppercase tracking-tighter">{cpuLoad}%</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase italic">Optimized</span>
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500" style={{ width: `${cpuLoad}%` }} />
              </div>
            </div>
          </div>

          {/* Mobile Power Monitor */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Term. Energy</span>
            </div>
            <div className="flex items-end justify-between">
              <span className={cn(
                "text-lg font-black uppercase tracking-tighter",
                isBatteryLow ? "text-rose-500" : "text-white"
              )}>
                {Math.round(batteryLevel * 100)}%
              </span>
              {isBatteryLow && (
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3 h-3" /> LOW POWER
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Intelligence Seal */}
        <div className="mt-8 flex items-center justify-between p-3 rounded-xl bg-primary-500/5 border border-primary-500/10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary-400" />
            <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Secured by Clawd-Guardian</span>
          </div>
          <span className="text-[9px] font-bold text-neutral-500 italic">v2026.4.5</span>
        </div>
      </div>
    </div>
  );
};
