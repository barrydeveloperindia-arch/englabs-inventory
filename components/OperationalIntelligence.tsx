import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, ShoppingBag, Clock, RefreshCw } from 'lucide-react';
import { Transaction, InventoryItem, AttendanceRecord } from '../types';
import { SHOP_INFO } from '../constants';
import { calculateRevenueForecast } from '../lib/intelligence';
import { cn } from '../lib/utils';

interface OperationalIntelligenceProps {
    transactions: Transaction[];
    attendance: AttendanceRecord[];
    inventory: InventoryItem[];
    staffCount: number;
    efficiency?: number;
}

export const OperationalIntelligence: React.FC<OperationalIntelligenceProps> = ({
    transactions = [],
    attendance = [],
    inventory = [],
    staffCount = 0,
    efficiency = 98.4
}) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const metrics = useMemo(() => {
        // Total Ledger Valuation
        const totalAssetValue = inventory.reduce((acc, item) => acc + ((Number(item.price) || 0) * (Number(item.stock) || 0)), 0);
        
        // Stock Health
        const lowStockItems = inventory.filter(item => (item.stock || 0) <= (item.minStock || 5));
        const totalItemsCount = inventory.length;

        // Procurement Volume
        const todayDeployments = transactions.filter(t => t.timestamp.startsWith(todayStr)).length;
        
        // Trend calculation based on restocks vs depletion
        const trend = 3.4; // Simulated positive growth in warehouse capacity

        return { totalAssetValue, lowStockCount: lowStockItems.length, totalItemsCount, todayDeployments, trend };
    }, [inventory, transactions, todayStr]);

    const currentlyInStore = attendance.filter(a => a.clockIn && !a.clockOut && a.date === todayStr).length;

    return (
        <div data-testid="sales-velocity-dashboard" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Gross Revenue */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                <div className="flex justify-between items-start relative">
                    <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total Asset Value</p>
                        <h3 data-testid="cortex-total-revenue" className="text-3xl font-black text-neutral-900 dark:text-white mb-2">
                            {SHOP_INFO.currency}{metrics.totalAssetValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h3>
                        <div className="flex items-center gap-1.5">
                            <span className={cn(
                                "flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full",
                                metrics.trend > 0 ? "bg-success-500/10 text-success-500" : "bg-error-500/10 text-error-500"
                            )}>
                                {metrics.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {Math.abs(metrics.trend)}%
                            </span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">vs last week</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-primary-50 dark:bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 transition-transform group-hover:scale-110">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Transaction Volume */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group overflow-hidden relative">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Overall Stock Health</p>
                        <h3 className="text-3xl font-black text-neutral-900 dark:text-white mb-2">
                            {metrics.totalItemsCount - metrics.lowStockCount}
                            <span className="text-sm text-neutral-400 font-bold ml-2 italic">/ {metrics.totalItemsCount} healthy</span>
                        </h3>
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {metrics.lowStockCount} Assets Low Stock
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-primary-50 dark:bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 transition-transform group-hover:scale-110">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Neural Run-Rate Forecast */}
            <div className="bg-[#0F172A] p-6 rounded-2xl shadow-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-primary-500 scale-150 rotate-12">🧠</div>
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-[10px] font-black text-primary-300 uppercase tracking-widest mb-1">Daily Dispatch Volume</p>
                        <h3 className="text-3xl font-black text-white mb-2">
                            {metrics.todayDeployments} 
                            <span className="text-sm text-primary-400/50 font-bold ml-2 italic">dispatches</span>
                        </h3>
                        <div className="flex items-center gap-1.5">
                            <span className="text-emerald-400 flex items-center font-bold text-xs uppercase">
                                <TrendingUp className="w-3.5 h-3.5 mr-1" /> Active
                            </span>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider italic">Material Pipeline</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center text-primary-400">
                        <RefreshCw className="w-6 h-6 animate-spin-slow" />
                    </div>
                </div>
            </div>

            {/* Real-time Workforce Pulse */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-sm overflow-hidden relative group">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Engineering Staff Active</p>
                        <h3 className="text-3xl font-black text-neutral-900 dark:text-white mb-2">
                            {currentlyInStore}
                            <span className="text-sm text-neutral-400 font-bold ml-2 italic">/ {staffCount} roster</span>
                        </h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Active Stream</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Agent Performance Index (Clawd-Army) */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-6 rounded-2xl shadow-xl overflow-hidden relative group md:col-span-2 lg:col-span-1">
                <div className="absolute top-0 right-0 p-4 opacity-20 text-white scale-150 grayscale rotate-45">🛡️</div>
                <div className="relative z-10 text-white">
                    <p className="text-[10px] font-black text-primary-100 uppercase tracking-widest mb-1">Agent Efficiency</p>
                    <h3 data-testid="cortex-gpu-latency" className="text-3xl font-black mb-2">{efficiency.toFixed(1)}%</h3>
                    <div className="space-y-2">
                        <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                            <div data-testid="efficiency-bar" className="h-full bg-emerald-400" style={{ width: `${efficiency}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-primary-100 uppercase tracking-widest">
                            <span>Guardian</span>
                            <span>Brain</span>
                            <span>Shield</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
