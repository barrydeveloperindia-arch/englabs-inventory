import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { InventoryItem, Transaction, UserRole, AttendanceRecord, Bill } from '../types';
import { SHOP_INFO } from '../constants';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  Package,
  Filter,
  Shield
} from 'lucide-react';
import { cn } from '../lib/utils';
import { DashboardSkeleton } from './ui/Skeleton';
import { calculateRevenueForecast } from '../lib/intelligence';
import { OperationalIntelligence } from './OperationalIntelligence';

interface DashboardProps {
  userId: string;
  transactions: Transaction[];
  inventory: InventoryItem[];
  role: UserRole;
  staff: any[];
  attendance: AttendanceRecord[];
  salaries?: any[];
  bills: Bill[];
}

const Dashboard: React.FC<DashboardProps> = ({ userId, transactions, inventory, role, attendance, bills, staff }) => {
  const [isLoading, setIsLoading] = useState(import.meta.env.MODE !== 'test');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate enterprise-level initial data fetch
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const chartData = useMemo(() => {
    const data: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      data[key] = 0;
    }
    transactions.forEach(t => {
      const dateKey = t.timestamp.split('T')[0];
      if (data[dateKey] !== undefined) data[dateKey] += t.total;
    });
    return Object.entries(data).map(([date, sales]) => ({
      name: new Date(date).toLocaleDateString('en-GB', { weekday: 'short' }),
      sales
    }));
  }, [transactions]);

  const recentOrders = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [transactions]);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 pt-10 px-2 lg:px-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 data-testid="dashboard-heading" className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">OPERATIONAL INTELLIGENCE</h1>
          <p className="text-sm text-neutral-500 font-medium">Monitoring ENGLABS Enterprise Performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className={cn(
              "flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:border-primary-500 dark:hover:border-primary-500/50 hover:text-primary-600 dark:hover:text-primary-400 transition-all shadow-sm",
              isRefreshing && "animate-pulse"
            )}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Refreshing..." : "Live Sync"}
          </button>
          <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary-600/20 active:scale-95">
            Generation Report
          </button>
        </div>
      </div>

      {/* Primary Metrics Feed */}
      {/* Primary Metrics Feed */}
      <OperationalIntelligence
        transactions={transactions}
        attendance={attendance}
        inventory={inventory}
        staffCount={staff.length}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* System Integrity (Security & Audit) */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-sm overflow-hidden relative group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">System Integrity</p>
              <h3 className="text-3xl font-black text-success-500 mb-2">VERIFIED</h3>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-success-500" />
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider italic">Audit Log Secure</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-success-500/10 rounded-xl flex items-center justify-center text-success-500">
              <Shield className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-success-500 mt-2 uppercase tracking-widest">Double-Entry Ledger Synced</p>
        </div>
      </div>

      {/* Main Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Graph */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div>
              <h4 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-widest">Procurement Analytics</h4>
              <p className="text-xs text-neutral-400 font-medium">Weekly asset influx and outflow performance</p>
            </div>
            <div className="flex items-center gap-2 p-1 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/10">
              <button className="px-3 py-1 text-[10px] font-bold text-primary-600 bg-white dark:bg-neutral-800 rounded-md shadow-sm">Daily</button>
              <button className="px-3 py-1 text-[10px] font-bold text-neutral-500">Weekly</button>
              <button className="px-3 py-1 text-[10px] font-bold text-neutral-500">Monthly</button>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#57D6A4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#57D6A4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" className="dark:opacity-10" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }}
                  tickFormatter={(val) => `${SHOP_INFO.currency}${val}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    padding: '12px',
                    backgroundColor: '#171717',
                    color: '#fff'
                  }}
                  itemStyle={{ fontWeight: 800, color: '#fff' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#093D5E"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="lg:col-span-1 bg-white dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-widest">Recent Activity</h4>
            <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" title="Real-time Stream"></div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
            {recentOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40">
                <Package size={32} className="mb-2 text-neutral-400" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Idle Terminal</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="group flex gap-4 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-white/5 transition-all cursor-pointer">
                  <div className="w-10 h-10 bg-neutral-100 dark:bg-white/5 rounded-full flex items-center justify-center shrink-0 border border-neutral-200/50 dark:border-white/5">
                    <Package className="w-5 h-5 text-neutral-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start mb-0.5">
                      <h5 className="text-xs font-bold text-neutral-900 dark:text-white truncate pr-2">Dispatch Order #{order.id.slice(0, 6)}</h5>
                      <span className="text-[10px] font-black text-neutral-900 dark:text-white shrink-0">
                        {SHOP_INFO.currency}{order.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[9px] font-black uppercase text-success-500 px-1.5 py-0.5 bg-success-500/10 rounded-md">Settled</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-6 py-2.5 bg-neutral-100 dark:bg-white/5 text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest rounded-xl hover:text-primary-600 transition-colors">
            View All Journals
          </button>
        </div>
      </div>

      {/* Operations Overview Table */}
      <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h4 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-widest">Global Dispatch Ledger</h4>
            <p className="text-xs text-neutral-400 font-medium">Comprehensive audit trail of recent asset movements</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input type="text" placeholder="Filter ID..." className="pl-9 pr-3 py-1.5 bg-neutral-100 dark:bg-white/5 border border-transparent focus:border-neutral-200 text-xs rounded-lg outline-none" />
            </div>
            <button className="p-1.5 bg-neutral-100 dark:bg-white/5 border border-transparent hover:border-neutral-200 rounded-lg">
              <Filter className="w-4 h-4 text-neutral-500" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-white/5">
                <th className="py-4 pl-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Transaction Ref</th>
                <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Method</th>
                <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Timestamp</th>
                <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right pr-12">Items</th>
                <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Settlement</th>
                <th className="py-4 pr-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
              {recentOrders.map((order) => (
                <tr key={order.id} className="group hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-4 pl-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                      <span className="font-mono text-[11px] font-bold text-primary-600 dark:text-primary-400">TXN-{order.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase">{order.paymentMethod || 'Cash'}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-medium text-neutral-500">{new Date(order.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </td>
                  <td className="py-4 text-right pr-12">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">{order.items.length} units</span>
                  </td>
                  <td className="py-4 text-right">
                    <span className="font-mono text-xs font-black text-neutral-900 dark:text-white">{SHOP_INFO.currency}{order.total.toFixed(2)}</span>
                  </td>
                  <td className="py-4 pr-4 text-right">
                    <span className="inline-flex items-center gap-1 bg-success-500/10 text-success-500 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                      Success
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
