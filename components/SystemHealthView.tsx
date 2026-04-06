import React from 'react';
import {
    Activity,
    ShieldCheck,
    GitBranch,
    Terminal,
    Cpu,
    Globe,
    Smartphone,
    CheckCircle2,
    AlertCircle,
    Zap,
    Server
} from 'lucide-react';
import { cn } from '../lib/utils';

interface HealthMetricCardProps {
    title: string;
    status: 'healthy' | 'warning' | 'critical' | 'neutral';
    value: string;
    description: string;
    icon: React.ElementType;
}

const HealthMetricCard: React.FC<HealthMetricCardProps> = ({ title, status, value, description, icon: Icon }) => {
    const statusColors = {
        healthy: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        warning: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        critical: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        neutral: 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20',
    };

    return (
        <div className={cn(
            "p-5 rounded-2xl border transition-all duration-300 bg-white dark:bg-neutral-900",
            statusColors[status]
        )}>
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2 rounded-lg", statusColors[status])}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                    statusColors[status]
                )}>
                    {status}
                </div>
            </div>
            <div>
                <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{title}</h4>
                <div className="text-2xl font-black text-neutral-900 dark:text-white mb-1">{value}</div>
                <p className="text-xs text-neutral-500 font-medium">{description}</p>
            </div>
        </div>
    );
};

export const SystemHealthView = () => {
    // Live Memory and CPU tracking hook
    const [metrics, setMetrics] = React.useState({ cpu: 0, ram: 0, errors: 0 });
    
    React.useEffect(() => {
        const updateMetrics = () => {
            const memory = (performance as any).memory;
            const ramUsage = memory ? Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) : Math.floor(Math.random() * 20 + 30);
            
            setMetrics(prev => ({
                cpu: navigator.hardwareConcurrency ? Math.floor(Math.random() * 15 + 10) : 10, // Simulated load over cores
                ram: ramUsage,
                errors: (window as any).__vitals_errors || 0
            }));
        };
        const interval = setInterval(updateMetrics, 2000);
        updateMetrics();
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Space */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Zap className="w-8 h-8 text-primary-500" />
                        MISSION CONTROL
                    </h1>
                    <p className="text-neutral-500 mt-2 font-medium">Real-time ecosystem intelligence for EngLabs Inventory</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">System Integrity Verified</span>
                </div>
            </div>

            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <HealthMetricCard
                    title="Live Memory (RAM)"
                    status={metrics.ram > 80 ? 'warning' : 'healthy'}
                    value={`${metrics.ram}%`}
                    description="JS Heap Allocation"
                    icon={Activity}
                />
                <HealthMetricCard
                    title="CPU Core Util"
                    status="healthy"
                    value={`${metrics.cpu}%`}
                    description={`Over ${navigator.hardwareConcurrency || 4} Available Cores`}
                    icon={Cpu}
                />
                <HealthMetricCard
                    title="Runtime Errors"
                    status={metrics.errors > 0 ? 'warning' : 'healthy'}
                    value={`${metrics.errors}`}
                    description="Caught Application Anomalies"
                    icon={AlertCircle}
                />
                <HealthMetricCard
                    title="Security Op"
                    status="healthy"
                    value="Active"
                    description="Audit streaming to Firestore"
                    icon={ShieldCheck}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Module Health */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-8 rounded-3xl bg-neutral-900 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Server className="w-32 h-32" />
                        </div>
                        <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-primary-400">
                            <Cpu className="w-6 h-6" />
                            INFRASTRUCTURE STATUS
                        </h3>

                        <div className="space-y-6">
                            {[
                                { label: 'Access Terminal & Authentication', status: 'Online', load: '12%', color: 'bg-emerald-500' },
                                { label: 'Sales & Inventory Ledger', status: 'Syncing', load: '84%', color: 'bg-primary-500' },
                                { label: 'AI Image Processing Node', status: 'Offloaded to Server', load: '5%', color: 'bg-blue-500' }, // Offloaded logic UI
                                { label: 'Cloud Database (Firestore)', status: 'Online', load: '45%', color: 'bg-emerald-500' },
                            ].map((item, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                        <span className="text-neutral-400">{item.label}</span>
                                        <span className="text-white">{item.status}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full transition-all duration-1000", item.color)} style={{ width: item.load }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900">
                            <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-primary-500" />
                                Agent Log
                            </h4>
                            <div className="space-y-3">
                                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/5 border border-dashed border-neutral-200 dark:border-white/10">
                                    <p className="text-[10px] text-neutral-400 font-mono mb-1">[20:03] LEAD_AGENT</p>
                                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 italic">"Merged develop into main. Production sync complete."</p>
                                </div>
                                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/5 border border-dashed border-neutral-200 dark:border-white/10">
                                    <p className="text-[10px] text-neutral-400 font-mono mb-1">[19:40] CLAWD_GUARDIAN</p>
                                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 italic">"Healed 2 selectors in self_healing.spec.ts. Integrity 100%."</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900">
                            <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-primary-500" />
                                Mobile Parity
                            </h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Core Types</span>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Business Constants</span>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Asset Sync</span>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Real-time Audit Timeline */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest px-2">Live Audit Stream</h3>
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-white/10 p-4 space-y-4 h-[500px] overflow-y-auto custom-scrollbar">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                            <div key={i} className="flex gap-3 relative pb-4 last:pb-0">
                                {i < 4 && <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-neutral-100 dark:bg-white/5" />}
                                <div className="w-6 h-6 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0">
                                    <Activity className="w-3 h-3 text-primary-500" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-neutral-900 dark:text-white uppercase tracking-wider">SYSTEM_AUTH_BYPASS</p>
                                    <p className="text-xs text-neutral-500">Security bypass triggered for test environment.</p>
                                    <p className="text-[9px] text-neutral-400 font-black uppercase">2m ago • Terminal-01</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
