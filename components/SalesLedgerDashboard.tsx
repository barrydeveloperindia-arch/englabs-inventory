
/**
 * Sales Analytics Dashboard
 * 
 * Visualizes transactional data to provide insights on:
 * - Hour-by-Hour Sales Performance (Heatmaps)
 * - Weekly/Monthly Revenue Trends
 * - Category Distribution (Alcohol, Tobacco, Groceries, etc.)
 * - Payment Method Splits (Cash vs Card)
 * 
 * Uses Recharts for data visualization using live Transaction data.
 * 
 * @component SalesLedgerDashboard
 */
import React, { useState, useMemo } from 'react';
import { Transaction, InventoryItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { SHOP_INFO } from '../constants';

interface SalesLedgerDashboardProps {
    transactions: Transaction[];
    inventory: InventoryItem[];
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

const SalesLedgerDashboard: React.FC<SalesLedgerDashboardProps> = ({ transactions, inventory }) => {
    const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

    // Helper to get Year/Month/Week keys
    const getPeriodKey = (date: Date, type: 'weekly' | 'monthly' | 'yearly') => {
        if (type === 'yearly') return date.getFullYear().toString();
        if (type === 'monthly') return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        // Simple Weekly: Week number
        const oneJan = new Date(date.getFullYear(), 0, 1);
        const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
        return `${date.getFullYear()}-W${week}`;
    };

    const dashboardData = useMemo(() => {
        // Optimization: Create Inventory Map (O(Inv))
        const inventoryMap = new Map<string, InventoryItem>();
        inventory.forEach(i => {
            inventoryMap.set(i.id, i);
            if (i.sku) inventoryMap.set(i.sku, i); // Double index for SKU lookup fallback
        });

        const agg: Record<string, { revenue: number; itemsSold: number; profit: number }> = {};
        const categoryAgg: Record<string, number> = {};
        const itemAgg: Record<string, number> = {};

        transactions.forEach(t => {
            const date = new Date(t.timestamp);
            const key = getPeriodKey(date, period);

            if (!agg[key]) agg[key] = { revenue: 0, itemsSold: 0, profit: 0 };

            agg[key].revenue += t.total;

            t.items.forEach(item => {
                agg[key].itemsSold += item.qty;

                // Profit Calc (Revenue - Cost)
                // VAT excluded from Profit? Usually Gross Profit = Net Sales - COGS
                // Here we do (Price - Cost) * Qty for simplicity, assuming Price is Gross? 
                // Ideally should perform VAT strip. 
                // Cost Price is usually Net. Price is Gross. 
                // Gross Profit = (Price / (1+VAT)) - Cost.

                const rateMultiplier = (item.vatRate || 20) / 100;
                const netPrice = item.price / (1 + rateMultiplier);
                const profit = (netPrice - (item.costPrice || 0)) * item.qty;

                agg[key].profit += profit;

                // Generic Category aggregation
                // We need to look up category from inventory if not on transaction item (legacy)
                // Transaction item currently has name, brand. We don't store category on transaction items usually to save space, 
                // but we can infer or look up.
                // Let's rely on name/brand or look up in inventory array.
                let cat = 'Uncategorized';
                // Try to find in inventory
                // Optimization: Use a Map if inventory is large. For now find is ok for small < 2000 items.
                // Actually for dashboard performance, let's just use what we have or 'General'.
                // Or if we really want categories, we might need a lookup map passed in props.

                // Optimized Lookup
                const found = inventoryMap.get(item.id) || inventoryMap.get(item.sku);
                if (found) cat = found.category;

                categoryAgg[cat] = (categoryAgg[cat] || 0) + item.qty; // Track volume
                itemAgg[item.name] = (itemAgg[item.name] || 0) + item.qty;
            });
        });

        // Format for Chart
        const chartData = Object.entries(agg)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([name, data]) => ({
                name,
                Revenue: data.revenue,
                Items: data.itemsSold,
                Profit: data.profit
            }));

        // Format Top Categories
        const topCategories = Object.entries(categoryAgg)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        // Format Top Items
        const topItems = Object.entries(itemAgg)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        return { chartData, topCategories, topItems };
    }, [transactions, period, inventory]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black uppercase text-ink-base tracking-tighter">Sales Ledger</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Volume & Revenue Analytics</p>
                </div>

                <div className="bg-surface-elevated p-1.5 rounded-xl border border-surface-highlight flex gap-1">
                    {(['weekly', 'monthly', 'yearly'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${period === p ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:bg-surface-highlight'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Bar Chart */}
            <div className="bg-surface-elevated p-8 rounded-[2.5rem] border border-surface-highlight shadow-sm h-[400px]">
                <h4 className="text-lg font-black text-ink-base uppercase tracking-tight mb-8">Performance Timeline</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" orientation="left" stroke="#4f46e5" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <Tooltip
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                        />
                        <Legend iconType="circle" />
                        <Bar yAxisId="left" dataKey="Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} name={`Revenue (${SHOP_INFO.currency})`} />
                        <Bar yAxisId="right" dataKey="Items" fill="#10b981" radius={[4, 4, 0, 0]} name="Items Sold (Qty)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
                {/* Top Categories */}
                <div className="bg-surface-elevated p-8 rounded-[2.5rem] border border-surface-highlight shadow-sm h-[400px] flex flex-col">
                    <h4 className="text-lg font-black text-ink-base uppercase tracking-tight mb-8">Category Mix (Volume)</h4>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dashboardData.topCategories}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {dashboardData.topCategories.map((entry, index) => (
                                        <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Trending Items */}
                <div className="bg-surface-elevated p-8 rounded-[2.5rem] border border-surface-highlight shadow-sm h-[400px] overflow-hidden flex flex-col">
                    <h4 className="text-lg font-black text-ink-base uppercase tracking-tight mb-8">Top Movers</h4>
                    <div className="overflow-y-auto pr-2 space-y-4">
                        {dashboardData.topItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-surface-ground rounded-2xl border border-surface-highlight">
                                <div className="flex items-center gap-4">
                                    <span className="w-8 h-8 flex items-center justify-center bg-primary-100 text-primary-600 font-black rounded-lg text-xs">#{idx + 1}</span>
                                    <span className="font-bold text-ink-base text-sm uppercase truncate max-w-[200px]">{item.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block font-black text-xl text-emerald-600">{item.value}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Sold</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesLedgerDashboard;
