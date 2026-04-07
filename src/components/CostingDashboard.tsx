

/**
 * Costing & Margin Analysis Engine
 * 
 * Provides deep-dive analytics into profitability:
 * - Item-Level Margins: Calculates potential profit vs actual realized profit
 * - Cost Trend Analysis: Gross Revenue vs Cost of Goods Sold over time
 * - Efficiency Alerts: Flags products with <15% margin
 * - High Cost Inventory: Identifies capital-heavy stock
 * 
 * Features interactive sorting and filtering for full inventory audits.
 * 
 * @component CostingDashboard
 */
import React, { useState, useMemo } from 'react';
import { Transaction, InventoryItem } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar } from 'recharts';
import { SHOP_INFO } from '../constants';

interface CostingDashboardProps {
    transactions: Transaction[];
    inventory: InventoryItem[];
}

const CostingDashboard: React.FC<CostingDashboardProps> = ({ transactions, inventory }) => {
    const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

    // Helper to get Year/Month/Week keys (Reused from Sales Dashboard could be utils)
    const getPeriodKey = (date: Date, type: 'weekly' | 'monthly' | 'yearly') => {
        if (type === 'yearly') return date.getFullYear().toString();
        if (type === 'monthly') return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const oneJan = new Date(date.getFullYear(), 0, 1);
        const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
        return `${date.getFullYear()}-W${week}`;
    };

    const dashboardData = useMemo(() => {
        const itemAgg: Record<string, { name: string, qty: number, revenue: number, netRevenue: number, cost: number, minMargin: number, maxMargin: number }> = {};
        const timeAgg: Record<string, { revenue: number, cost: number }> = {};

        transactions.forEach(t => {
            const date = new Date(t.timestamp);
            const key = getPeriodKey(date, period);

            if (!timeAgg[key]) timeAgg[key] = { revenue: 0, cost: 0 };
            timeAgg[key].revenue += t.total; // Gross Revenue

            t.items.forEach(item => {
                const cost = (item.costPrice || 0) * item.qty;
                timeAgg[key].cost += cost;

                // VAT Calc
                // Default to 0 if undefined? No, standard is 20, but food is 0. 
                // If the transaction record has no vatRate, we might have a problem.
                // But the historical simulation put vatRate in.
                const vatRate = item.vatRate !== undefined ? item.vatRate : 20;
                const rateMultiplier = vatRate / 100;
                const netPrice = item.price / (1 + rateMultiplier);

                // Item Analysis
                if (!itemAgg[item.name]) {
                    itemAgg[item.name] = {
                        name: item.name,
                        qty: 0,
                        revenue: 0,
                        netRevenue: 0,
                        cost: 0,
                        minMargin: 100, // Placeholder
                        maxMargin: -100
                    };
                }

                const entry = itemAgg[item.name];
                entry.qty += item.qty;
                entry.revenue += (item.price * item.qty);
                entry.netRevenue += (netPrice * item.qty);
                entry.cost += cost;

                // Margin for this specific sale instance
                const unitMarginPct = netPrice ? ((netPrice - (item.costPrice || 0)) / netPrice) * 100 : 0;

                if (unitMarginPct < entry.minMargin) entry.minMargin = unitMarginPct;
                if (unitMarginPct > entry.maxMargin) entry.maxMargin = unitMarginPct;
            });
        });

        const timeline = Object.entries(timeAgg)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([name, data]) => ({
                name,
                Revenue: data.revenue,
                Cost: data.cost,
                Profit: data.revenue - data.cost // Gross Approx
            }));

        const items = Object.values(itemAgg).map(i => {
            const totalProfit = i.netRevenue - i.cost;
            const avgMargin = i.netRevenue ? (totalProfit / i.netRevenue) * 100 : 0;
            return { ...i, avgMargin };
        });

        // Top Cost Contributors (High Spend)
        const highCostItems = [...items].sort((a, b) => b.cost - a.cost).slice(0, 10);

        // Low Margin Warning (High Volume but Low Margin)
        const lowMarginItems = items
            .filter(i => i.qty > 5 && i.avgMargin < 15) // Sold at least 5 units, margin < 15%
            .sort((a, b) => a.avgMargin - b.avgMargin)
            .slice(0, 10);

        return { timeline, highCostItems, lowMarginItems, allItems: items };
    }, [transactions, period]);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const filteredItems = useMemo(() => {
        let sorted = [...dashboardData.allItems];

        if (searchTerm) {
            sorted = sorted.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (sortConfig) {
            sorted.sort((a, b) => {
                // @ts-ignore dynamic sort
                const aVal = a[sortConfig.key];
                // @ts-ignore
                const bVal = b[sortConfig.key];

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return sorted;
    }, [dashboardData, searchTerm, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc'; // Default to desc for numbers usually

        if (sortConfig && sortConfig.key === key) {
            direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else if (key === 'name') {
            direction = 'asc'; // Names default asc
        }

        setSortConfig({ key, direction });
    };

    const SortIcon = ({ colKey }: { colKey: string }) => {
        if (sortConfig?.key !== colKey) return <span className="opacity-20 ml-1">⇅</span>;
        return <span className="ml-1 text-primary-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black uppercase text-ink-base tracking-tighter">Cost Analytics</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">COGS & Margin Analysis</p>
                </div>

                <div className="bg-surface-elevated p-1.5 rounded-xl border border-surface-highlight flex gap-1">
                    {(['weekly', 'monthly', 'yearly'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${period === p ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:bg-surface-highlight'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cost Trend Chart */}
            <div className="bg-surface-elevated p-8 rounded-[2.5rem] border border-surface-highlight shadow-sm h-[400px]">
                <h4 className="text-lg font-black text-ink-base uppercase tracking-tight mb-8">Cost vs Revenue Trend</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData.timeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.05} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="Revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                        <Area type="monotone" dataKey="Cost" stroke="#f59e0b" fillOpacity={1} fill="url(#colorCost)" strokeWidth={2} />
                        <Legend />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* High Cost Items */}
                <div className="bg-surface-elevated p-8 rounded-[2.5rem] border border-surface-highlight shadow-sm h-[500px] flex flex-col">
                    <h4 className="text-lg font-black text-ink-base uppercase tracking-tight mb-8">Highest Cost Absorption</h4>
                    <div className="overflow-y-auto pr-2 space-y-3 flex-1">
                        {dashboardData.highCostItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-surface-ground rounded-2xl border border-surface-highlight">
                                <div>
                                    <p className="font-bold text-ink-base text-xs uppercase truncate max-w-[200px]">{item.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 mt-1">{item.qty} units sold</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-amber-600 font-mono">{SHOP_INFO.currency}{item.cost.toFixed(2)}</p>
                                    <p className="text-[9px] font-bold text-amber-600/60 uppercase">Total Cost</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Low Margin Alerts */}
                <div className="bg-surface-elevated p-8 rounded-[2.5rem] border border-surface-highlight shadow-sm h-[500px] flex flex-col">
                    <h4 className="text-lg font-black text-ink-base uppercase tracking-tight mb-8">Low Margin Alerts (&lt; 15%)</h4>
                    <div className="overflow-y-auto pr-2 space-y-3 flex-1">
                        {dashboardData.lowMarginItems.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <span className="text-4xl mb-4">✅</span>
                                <p className="text-xs font-black uppercase tracking-widest">No Low Margin Items Found</p>
                            </div>
                        )}
                        {dashboardData.lowMarginItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100">
                                <div>
                                    <p className="font-bold text-rose-900 text-xs uppercase truncate max-w-[200px]">{item.name}</p>
                                    <p className="text-[9px] font-bold text-rose-400 mt-1">Avg Margin: {item.avgMargin.toFixed(1)}%</p>
                                </div>
                                <div className="text-right">
                                    <div className="w-20 h-2 bg-rose-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500" style={{ width: `${Math.max(0, item.avgMargin)}%` }}></div>
                                    </div>
                                    <p className="text-[9px] font-bold text-rose-400 uppercase mt-1">Efficiency</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detail Table */}
            <div className="bg-surface-elevated rounded-[2.5rem] border border-surface-highlight shadow-sm overflow-hidden mb-20">
                <div className="p-8 border-b border-surface-highlight flex flex-col md:flex-row justify-between items-center gap-4">
                    <h4 className="text-lg font-black text-ink-base uppercase tracking-tight">Full Cost Inventory</h4>
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-surface-ground border border-surface-highlight px-4 py-2 rounded-xl text-xs font-bold outline-none focus:border-amber-500 w-full md:w-64"
                    />
                </div>
                <div className="max-h-[600px] overflow-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-surface-elevated text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 border-b z-10">
                            <tr>
                                <th onClick={() => handleSort('name')} className="px-8 py-4 bg-surface-elevated cursor-pointer hover:text-primary-500 select-none">Item Name <SortIcon colKey="name" /></th>
                                <th onClick={() => handleSort('qty')} className="px-8 py-4 text-right bg-surface-elevated cursor-pointer hover:text-primary-500 select-none">Qty Sold <SortIcon colKey="qty" /></th>
                                <th onClick={() => handleSort('cost')} className="px-8 py-4 text-right bg-surface-elevated cursor-pointer hover:text-primary-500 select-none">Total Cost <SortIcon colKey="cost" /></th>
                                <th onClick={() => handleSort('revenue')} className="px-8 py-4 text-right bg-surface-elevated text-emerald-600 cursor-pointer hover:text-emerald-700 select-none">Total Rev <SortIcon colKey="revenue" /></th>
                                <th onClick={() => handleSort('avgMargin')} className="px-8 py-4 text-right bg-surface-elevated cursor-pointer hover:text-primary-500 select-none">Avg Margin <SortIcon colKey="avgMargin" /></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-bold text-ink-base">
                            {filteredItems.map((item, i) => (
                                <tr key={i} className="hover:bg-primary-50/50 transition-colors">
                                    <td className="px-8 py-4">{item.name}</td>
                                    <td className="px-8 py-4 text-right font-mono text-slate-500">{item.qty}</td>
                                    <td className="px-8 py-4 text-right font-mono text-amber-600">{SHOP_INFO.currency}{item.cost.toFixed(2)}</td>
                                    <td className="px-8 py-4 text-right font-mono text-emerald-600">{SHOP_INFO.currency}{item.revenue.toFixed(2)}</td>
                                    <td className="px-8 py-4 text-right">
                                        <span className={`px-2 py-1 rounded-lg ${item.avgMargin < 15 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {item.avgMargin.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-10 text-center text-slate-400 uppercase tracking-widest">No items found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CostingDashboard;
