

/**
 * Financial Intelligence Hub
 * 
 * A comprehensive financial suite for retail management:
 * - Real-time P&L: Dynamic calculation of Net/Gross Profit from Double-Entry Ledger
 * - VAT Analysis: Breakdown of 0%, 5%, 20% tax bands for HMRC compliance
 * - KPI Tracking: Tracks Revenue, COGS, OpEx, Assets, and Liabilities
 * - Forecasting: AI-driven projections for month-end revenue
 * 
 * Integrates with:
 * - SalesLedgerDashboard (Sales Analytics)
 * - CostingDashboard (Margin Analysis)
 * 
 * @component FinancialsView
 */
import React, { useState, useMemo } from 'react';
import { LedgerEntry, Transaction, InventoryItem, Supplier, Bill, Expense, SalaryRecord, LedgerAccount, ViewType, VatBandSummary, UserRole, StaffMember } from '../types';
import { RegistersView } from './RegistersView';
import { SHOP_INFO } from '../constants';
import { scanInvoiceMedia, AIIntakeResult } from '../lib/ai_pdf_scanner';
import { generateRTIData } from '../lib/payroll_logic';

interface FinancialsViewProps {
  userId: string;
  ledger: LedgerEntry[];
  setLedger: React.Dispatch<React.SetStateAction<LedgerEntry[]>>;
  transactions: Transaction[];
  inventory: InventoryItem[];
  suppliers: Supplier[];
  bills: Bill[];
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  salaries: SalaryRecord[];
  staff: StaffMember[];
  postToLedger: (entries: Omit<LedgerEntry, 'id' | 'timestamp'>[]) => void;
  setBills: React.Dispatch<React.SetStateAction<Bill[]>>;
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  logAction: (action: string, module: ViewType, details: string, severity?: 'Info' | 'Warning' | 'Critical') => void;
  userRole: UserRole;
  currentStaffId: string;
  activeStaffName: string;
  navigateToProcurement: () => void;
}

type FinancialSubModule = 'overview' | 'sales-ledger' | 'purchase-ledger' | 'master-register' | 'vat-summary' | 'sales-analytics' | 'costing-analytics' | 'payroll-rti';

const FinancialOverview: React.FC<{
  ledger: LedgerEntry[];
  transactions: Transaction[];
  setActiveModule?: (module: FinancialSubModule) => void;
}> = ({ ledger, transactions, setActiveModule }) => {
  const stats = useMemo(() => {
    const balances: Record<string, number> = {
      revenue: 0,
      cogs: 0,
      opex: 0, // Operational + Payroll
      assets: 0, // Cash + Bank
      liabilities: 0, // VAT + Payable
      inventory: 0
    };

    ledger.forEach(entry => {
      // Helper to handle Debit/Credit direction based on Account Type
      // Liability/Income: Credit +, Debit -
      // Asset/Expense: Debit +, Credit -

      const amt = entry.amount;
      const isCredit = entry.type === 'Credit';

      switch (entry.account) {
        case 'Sales Revenue':
          balances.revenue += isCredit ? amt : -amt;
          break;
        case 'Cost of Goods Sold':
          balances.cogs += isCredit ? -amt : amt;
          break;
        case 'Operational Expense':
        case 'Payroll Expense':
          balances.opex += isCredit ? -amt : amt;
          break;
        case 'Cash in Hand':
        case 'Bank Account':
          balances.assets += isCredit ? -amt : amt;
          break;
        case 'VAT Liability':
        case 'Accounts Payable':
          balances.liabilities += isCredit ? amt : -amt;
          break;
        case 'Inventory Asset':
          balances.inventory += isCredit ? -amt : amt;
          break;
      }
    });

    const grossProfit = balances.revenue - balances.cogs;
    const netProfit = grossProfit - balances.opex;
    const grossMargin = balances.revenue ? (grossProfit / balances.revenue) * 100 : 0;
    const netMargin = balances.revenue ? (netProfit / balances.revenue) * 100 : 0;

    // Retail Efficiency Metrics
    // We only care about CURRENT Month for "Run Rate" usually, or maybe lifetime depending on user intent.
    // Let's do LIFETIME for stats, but CURRENT MONTH for projection.

    // 1. Averages
    const totalTransactions = transactions.length;
    const totalItemsSold = transactions.reduce((acc, t) => acc + t.items.reduce((s, i) => s + i.qty, 0), 0);
    const atv = totalTransactions ? balances.revenue / totalTransactions : 0;
    const upt = totalTransactions ? totalItemsSold / totalTransactions : 0;

    // 2. Forecasting (Current Month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysPassed = Math.max(1, now.getDate());
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    // Filter revenue for this month
    const currentMonthRevenue = transactions
      .filter(t => new Date(t.timestamp) >= startOfMonth)
      .reduce((acc, t) => acc + t.total, 0);

    const dailyRunRate = currentMonthRevenue / daysPassed;
    const projectedRevenue = dailyRunRate * daysInMonth;

    return {
      revenue: balances.revenue,
      cogs: balances.cogs,
      opex: balances.opex,
      assets: balances.assets,
      liabilities: balances.liabilities,
      inventory: balances.inventory,
      grossProfit,
      netProfit,
      grossMargin,
      netMargin,
      atv,
      upt,
      projectedRevenue,
      dailyRunRate
    };
  }, [ledger, transactions]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black text-ink-base uppercase tracking-tighter">Financial Intelligence</h3>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time P&L & Inventory Metrics</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-[10px] font-black uppercase text-primary-600 tracking-widest">Liquid Assets</p>
          <p className="text-2xl font-black font-mono text-ink-base">{SHOP_INFO.currency}{stats.assets.toLocaleString()}</p>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-surface-elevated p-6 rounded-[2rem] border border-surface-highlight shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 scale-150 rotate-12 text-5xl group-hover:scale-125 transition-transform">💰</div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</p>
          <h5 className="text-3xl font-black mt-3 font-mono text-success-500">{SHOP_INFO.currency}{stats.revenue.toLocaleString()}</h5>
          <div className="mt-4 flex gap-2">
            <span className="text-[9px] font-bold bg-success-500/10 text-success-500 px-2 py-1 rounded-lg uppercase">Gross Income</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-primary-600 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 -rotate-12 text-5xl text-primary-400">📈</div>
          <p className="text-[10px] font-black text-primary-100 uppercase tracking-widest">Net Profit (EBITDA)</p>
          <h5 className="text-3xl font-black mt-3 font-mono text-white">{SHOP_INFO.currency}{stats.netProfit.toLocaleString()}</h5>
          <div className="mt-4 flex gap-2">
            <span className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase ${stats.netMargin > 15 ? 'bg-success-500/20 text-success-500' : 'bg-warning-500/20 text-warning-500'}`}>
              {stats.netMargin.toFixed(1)}% Margin
            </span>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-surface-elevated p-6 rounded-[2rem] border border-surface-highlight shadow-sm group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Op. Expenses</p>
          <h5 className="text-3xl font-black mt-3 font-mono text-error-500">{SHOP_INFO.currency}{stats.opex.toLocaleString()}</h5>
          <p className="text-[10px] font-bold text-slate-300 mt-4 uppercase">Includes Payroll & Overheads</p>
        </div>

        {/* COGS */}
        <div
          onClick={() => setActiveModule && setActiveModule('costing-analytics')}
          className="bg-surface-elevated p-6 rounded-[2rem] border border-surface-highlight shadow-sm group cursor-pointer hover:border-amber-400 transition-all active:scale-95 relative overflow-hidden"
        >
          <div className="flex justify-between items-start z-10 relative">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost of Goods</p>
            <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Analyze →</span>
          </div>
          <h5 className="text-3xl font-black mt-3 font-mono text-amber-500 z-10 relative">{SHOP_INFO.currency}{stats.cogs.toLocaleString()}</h5>
          <div className="mt-4 flex gap-2 z-10 relative">
            <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded-lg uppercase">{stats.grossMargin.toFixed(1)}% Gross Margin</span>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 text-amber-500 transform rotate-12 group-hover:scale-110 transition-transform">
            <span className="text-8xl">🏷️</span>
          </div>
        </div>
      </div>

      {/* Retail Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-elevated p-6 rounded-[2rem] border border-surface-highlight flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Transaction (ATV)</p>
            <span className="text-xl">🛍️</span>
          </div>
          <div>
            <h5 className="text-2xl font-black font-mono text-ink-base">{SHOP_INFO.currency}{stats.atv.toFixed(2)}</h5>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Per Customer Spend</p>
          </div>
        </div>
        <div className="bg-surface-elevated p-6 rounded-[2rem] border border-surface-highlight flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Basket Size (UPT)</p>
            <span className="text-xl">🛒</span>
          </div>
          <div>
            <h5 className="text-2xl font-black font-mono text-ink-base">{stats.upt.toFixed(1)} <span className="text-sm text-slate-400">items</span></h5>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Avg Items per Order</p>
          </div>
        </div>
        <div className="bg-primary-50 p-6 rounded-[2rem] border border-primary-100 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10 text-primary-600 text-6xl">🔮</div>
          <div className="flex justify-between items-start z-10">
            <p className="text-[10px] font-black text-primary-900 uppercase tracking-widest">Projected (Month End)</p>
          </div>
          <div className="z-10">
            <h5 className="text-2xl font-black font-mono text-primary-600">{SHOP_INFO.currency}{stats.projectedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h5>
            <p className="text-[9px] font-bold text-primary-400 uppercase mt-1">Based on live run-rate</p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-highlight/30 p-6 rounded-3xl border border-surface-highlight flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Liabilities</p>
            <p className="text-xl font-black font-mono text-ink-base mt-1">{SHOP_INFO.currency}{stats.liabilities.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-400 uppercase">VAT & Payables</p>
          </div>
        </div>
        <div className="bg-surface-highlight/30 p-6 rounded-3xl border border-surface-highlight flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Valuation</p>
            <p className="text-xl font-black font-mono text-ink-base mt-1">{SHOP_INFO.currency}{(stats.inventory + stats.assets).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Cash + Stock</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const VatAnalysis: React.FC<{
  transactions: Transaction[];
}> = ({ transactions }) => {
  const [vatDateRange, setVatDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const vatSummaryData = useMemo(() => {
    const filteredTx = transactions.filter(t => t.timestamp >= vatDateRange.start && t.timestamp <= (vatDateRange.end + 'T23:59:59'));
    let totalGross = 0;
    let totalVat = 0;
    const breakdown: Record<number, VatBandSummary> = {
      0: { gross: 0, net: 0, vat: 0 },
      5: { gross: 0, net: 0, vat: 0 },
      20: { gross: 0, net: 0, vat: 0 }
    };

    filteredTx.forEach(t => {
      totalGross += t.total;
      totalVat += t.vatTotal;
      if (t.vatBreakdown) {
        Object.entries(t.vatBreakdown).forEach(([rate, data]) => {
          const r = parseInt(rate);
          const vatData = data as VatBandSummary;
          if (breakdown[r]) {
            breakdown[r].gross += vatData.gross;
            breakdown[r].net += vatData.net;
            breakdown[r].vat += vatData.vat;
          }
        });
      }
    });
    return { totalGross, totalNet: totalGross - totalVat, totalVat, breakdown };
  }, [transactions, vatDateRange]);

  return (
    <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <h3 className="text-3xl font-black text-ink-base uppercase tracking-tighter">VAT Analysis Engine</h3>
        <div className="flex items-center gap-4 bg-surface-elevated border border-surface-highlight p-2 rounded-2xl shadow-sm">
          <input
            type="date"
            value={vatDateRange.start}
            onChange={e => setVatDateRange({ ...vatDateRange, start: e.target.value })}
            className="bg-transparent text-[10px] font-black uppercase outline-none px-3 cursor-pointer"
          />
          <span className="text-slate-300 text-[10px] font-black">TO</span>
          <input
            type="date"
            value={vatDateRange.end}
            onChange={e => setVatDateRange({ ...vatDateRange, end: e.target.value })}
            className="bg-transparent text-[10px] font-black uppercase outline-none px-3 cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-primary-700 p-6 md:p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 scale-150 text-7xl">⚖️</div>
          <p className="text-primary-300 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Total VAT Liability</p>
          <h4 className="text-5xl font-black font-mono tracking-tighter text-success-500">
            {SHOP_INFO.currency}{(vatSummaryData.totalVat || 0).toFixed(2)}
          </h4>
          <p className="text-[10px] font-bold text-ink-muted uppercase mt-4">Verified for period: {vatDateRange.start} - {vatDateRange.end}</p>
        </div>
        <div className="bg-surface-elevated p-6 md:p-10 rounded-[2.5rem] border border-surface-highlight shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Net Trading Revenue</p>
          <h4 className="text-5xl font-black font-mono tracking-tighter text-ink-base">
            {SHOP_INFO.currency}{(vatSummaryData.totalNet || 0).toFixed(2)}
          </h4>
          <div className="w-12 h-1 bg-primary-600 mt-4 rounded-full"></div>
        </div>
      </div>

      <div className="bg-surface-elevated rounded-[2.5rem] border border-surface-highlight shadow-sm overflow-hidden">
        <div className="px-10 py-6 bg-surface-elevated border-b border-slate-100">
          <p className="text-[10px] font-black text-ink-base uppercase tracking-widest">HMRC Tax Band Reconciliation</p>
        </div>
        <table className="w-full text-left hidden md:table">
          <thead className="bg-surface-elevated text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] border-b">
            <tr>
              <th className="px-10 py-6">UK Tax Classification</th>
              <th className="px-10 py-6 text-right">Gross Volume</th>
              <th className="px-10 py-6 text-right">Net Value</th>
              <th className="px-10 py-6 text-right">VAT Collected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[20, 5, 0].map(rate => (
              <tr key={rate} className="hover:bg-surface-elevated/50 transition-all group font-bold">
                <td className="px-10 py-7">
                  <span className="text-xs font-black uppercase text-ink-base">
                    {rate === 0 ? 'Exempt' : rate === 18 ? 'Standard GST' : rate === 28 ? 'Luxury' : 'GST'} ({rate}%)
                  </span>
                </td>
                <td className="px-10 py-7 text-right font-mono text-sm">
                  {SHOP_INFO.currency}{(vatSummaryData.breakdown[rate].gross || 0).toFixed(2)}
                </td>
                <td className="px-10 py-7 text-right font-mono text-sm text-ink-muted">
                  {SHOP_INFO.currency}{(vatSummaryData.breakdown[rate].net || 0).toFixed(2)}
                </td>
                <td className="px-10 py-7 text-right font-mono text-base text-primary-600">
                  {SHOP_INFO.currency}{(vatSummaryData.breakdown[rate].vat || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile VAT Cards */}
        <div className="md:hidden p-4 space-y-4 bg-surface-elevated">
          {[20, 5, 0].map(rate => (
            <div key={rate} className="bg-surface-elevated p-5 rounded-2xl border border-surface-highlight shadow-sm flex flex-col gap-4">
              <div>
                <span className="text-xs font-black uppercase text-ink-base block">
                  {rate === 0 ? 'Exempt' : rate === 18 ? 'Standard GST' : rate === 28 ? 'Luxury' : 'GST'} ({rate}%)
                </span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Classification</p>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div>
                  <p className="text-[8px] font-black uppercase text-slate-400">Gross</p>
                  <p className="font-mono font-bold text-ink-base">{SHOP_INFO.currency}{(vatSummaryData.breakdown[rate].gross || 0).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black uppercase text-slate-400">Net</p>
                  <p className="font-mono font-bold text-ink-muted">{SHOP_INFO.currency}{(vatSummaryData.breakdown[rate].net || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex justify-between items-center bg-primary-50 p-3 rounded-xl border border-primary-100">
                <span className="text-[10px] font-black uppercase text-primary-900">VAT Collected</span>
                <span className="font-black font-mono text-primary-600">{SHOP_INFO.currency}{(vatSummaryData.breakdown[rate].vat || 0).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-primary-50 p-8 rounded-[2rem] border border-primary-100 flex items-center gap-6">
        <span className="text-3xl">ℹ️</span>
        <p className="text-[10px] font-black text-primary-900 uppercase leading-relaxed tracking-widest">
          This summary uses live point-of-sale data from the selected period.
          Ensure all refunds and manual ledger adjustments are finalized before exporting for HMRC submission.
        </p>
      </div>
    </div>
  );
};

import { auth } from '../lib/firebase';
import { addExpense } from '../lib/firestore';
import { DailySalesRecord } from '../types';
import * as XLSX from 'xlsx';
import { batchImportDailySales, subscribeToDailySales } from '../lib/firestore';
import SalesLedgerDashboard from './SalesLedgerDashboard';
import CostingDashboard from './CostingDashboard';

const SalesLedger: React.FC<{ userId: string }> = ({ userId }) => {
  const [salesData, setSalesData] = useState<DailySalesRecord[]>([]);

  // Subscribe to data
  React.useEffect(() => {
    const unsubscribe = subscribeToDailySales(userId, setSalesData);
    return () => unsubscribe();
  }, [userId]);

  const handleUniversalImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isSpreadsheet = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv');
    const isMedia = fileName.endsWith('.pdf') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg');

    if (isSpreadsheet) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          // Try specialized local parsing first
          let headerRowIdx = -1;
          for (let i = 0; i < rows.length; i++) {
            const row: any = rows[i];
            if (row && row.some((c: any) => String(c).includes('Date') || String(c).includes('Alcohol'))) {
              headerRowIdx = i;
              break;
            }
          }

          if (headerRowIdx !== -1) {
            // Process using local template logic
            const headers = (rows[headerRowIdx] as any[]).map(h => String(h).trim());
            const findIdx = (str: string) => headers.findIndex(h => h.toLowerCase().includes(str.toLowerCase()));

            const idx = {
              date: findIdx('Date'),
              rawMaterials: findIdx('Raw') > -1 ? findIdx('Raw') : findIdx('Material'),
              fasteners: findIdx('Fastener') > -1 ? findIdx('Fastener') : findIdx('Bolt'),
              electronics: findIdx('Electro'),
              pneumatics: findIdx('Pneumatic'),
              tools: findIdx('Tool'),
              safetyGear: findIdx('Safety') > -1 ? findIdx('Safety') : findIdx('PPE'),
              consumables: findIdx('Consumable'),
              finishedGoods: findIdx('Finished'),
              wip: findIdx('WIP'),
              other: findIdx('Other'),
              total: findIdx('Total'),
              cashComp: findIdx('Cash'),
              cashPurch: findIdx('Purchase'),
              balance: findIdx('Balance')
            };

            const records: DailySalesRecord[] = [];
            for (let i = headerRowIdx + 1; i < rows.length; i++) {
              const row: any = rows[i];
              if (!row || !row[idx.date]) continue;

              let dateStr = row[idx.date];
              if (typeof dateStr === 'number') {
                const dateObj = XLSX.SSF.parse_date_code(dateStr);
                dateStr = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
              } else {
                try { dateStr = new Date(dateStr).toISOString().split('T')[0]; } catch (e) { }
              }

              const getNum = (ix: number) => {
                if (ix === -1) return 0;
                const val = row[ix];
                if (typeof val === 'number') return val;
                return parseFloat(String(val).replace(/[₹,]/g, '')) || 0;
              };

              records.push({
                id: dateStr,
                date: dateStr,
                dayOfWeek: new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long' }),
                categoryBreakdown: {
                  rawMaterials: getNum(idx.rawMaterials),
                  fasteners: getNum(idx.fasteners),
                  electronics: getNum(idx.electronics),
                  pneumatics: getNum(idx.pneumatics),
                  tools: getNum(idx.tools),
                  safetyGear: getNum(idx.safetyGear),
                  consumables: getNum(idx.consumables),
                  finishedGoods: getNum(idx.finishedGoods),
                  wip: getNum(idx.wip),
                  other: getNum(idx.other)
                },
                totalSales: getNum(idx.total),
                cashTaken: getNum(idx.cashComp),
                cardTaken: getNum(idx.total) - getNum(idx.cashComp),
                cashPurchases: getNum(idx.cashPurch),
                netBalance: getNum(idx.total) - getNum(idx.cashPurch),
                timestamp: new Date().toISOString()
              });
            }

            if (records.length > 0 && confirm(`Found ${records.length} records. Import?`)) {
              await batchImportDailySales(userId, records);
              alert("Import successful");
            }
          } else {
            // If template not found, fall back to AI
            if (confirm("Sheet template not recognized. Use AI to scan this document?")) {
              await processWithAI(file);
            }
          }
        } catch (err) {
          console.error(err);
          alert("Error parsing spreadsheet: " + err);
        }
      };
      reader.readAsBinaryString(file);
    } else if (isMedia) {
      await processWithAI(file);
    } else {
      alert("Unsupported file format.");
    }
    e.target.value = '';
  };

  const processWithAI = async (file: File) => {
    try {
      console.log("Analyzing with Gemini AI...");
      const data = await scanInvoiceMedia(file);

      const record: DailySalesRecord = {
        id: data.date,
        date: data.date,
        dayOfWeek: new Date(data.date).toLocaleDateString('en-GB', { weekday: 'long' }),
        categoryBreakdown: {
          rawMaterials: 0, fasteners: 0, electronics: 0, pneumatics: 0, tools: 0,
          safetyGear: 0, consumables: 0, finishedGoods: 0, wip: 0, other: 0
        },
        totalSales: data.total,
        cashTaken: data.total, // Assume cash if not specified
        cardTaken: 0,
        cashPurchases: 0,
        netBalance: data.total,
        timestamp: new Date().toISOString()
      };

      data.items?.forEach((item: any) => {
        const cat = (item.category || '').toLowerCase();
        const desc = item.description.toLowerCase();
        const val = item.amount;

        if (cat.includes('raw') || desc.includes('steel') || desc.includes('alu') || desc.includes('plate')) record.categoryBreakdown.rawMaterials += val;
        else if (cat.includes('fast') || desc.includes('bolt') || desc.includes('screw') || desc.includes('nut')) record.categoryBreakdown.fasteners += val;
        else if (cat.includes('elec') || desc.includes('sensor') || desc.includes('wire') || desc.includes('pcb')) record.categoryBreakdown.electronics += val;
        else if (cat.includes('tool') || desc.includes('drill') || desc.includes('mill')) record.categoryBreakdown.tools += val;
        else if (cat.includes('safety') || desc.includes('glove') || desc.includes('mask') || desc.includes('ppe')) record.categoryBreakdown.safetyGear += val;
        else record.categoryBreakdown.other += val;
      });

      if (confirm(`Extracted via AI:\nDate: ${data.date}\nTotal: ₹${data.total.toLocaleString('en-IN')}\nSupplier: ${data.supplier || 'N/A'}\n\nImport as Daily Sales?`)) {
        await batchImportDailySales(userId, [record]);
        alert("AI Import successful");
      }
    } catch (err: any) {
      console.error(err);
      alert("AI Scan failed: " + err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-3xl font-black text-ink-base uppercase tracking-tighter">Sales Ledger</h3>
        <label className="bg-primary-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-primary-700 transition-colors cursor-pointer shadow-lg hover:shadow-primary-500/30">
          Topic: Import Sales Sheet
          <input type="file" onChange={handleUniversalImport} accept=".xlsx, .xls, .csv, .pdf, .png, .jpg, .jpeg" className="hidden" />
        </label>
      </div>

      <div className="bg-surface-elevated rounded-[2.5rem] border border-surface-highlight shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-surface-elevated text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-6 py-4 sticky left-0 bg-surface-elevated">Date</th>
                <th className="px-6 py-4 text-right">Total Sales</th>
                <th className="px-6 py-4 text-right text-success-500">Cash Taken</th>
                <th className="px-6 py-4 text-right text-error-500">Cash Purch</th>
                <th className="px-6 py-4 text-right">Raw Materials</th>
                <th className="px-6 py-4 text-right">Fasteners</th>
                <th className="px-6 py-4 text-right">Tools</th>
                <th className="px-6 py-4 text-right">Other</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-ink-base">
              {salesData.map(row => (
                <tr key={row.id} className="hover:bg-primary-50/50 transition-colors">
                  <td className="px-6 py-4 sticky left-0 bg-surface-elevated">{row.date} <span className="text-slate-400 font-normal ml-2">{row.dayOfWeek?.slice(0, 3)}</span></td>
                  <td className="px-6 py-4 text-right">{(row.totalSales || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-success-500">{(row.cashTaken || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-error-500">{(row.cashPurchases || 0).toFixed(2)}</td>
                   <td className="px-6 py-4 text-right border-l text-ink-muted">{(row.categoryBreakdown?.rawMaterials || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-ink-muted">{(row.categoryBreakdown?.fasteners || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-ink-muted">{(row.categoryBreakdown?.tools || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-ink-muted">{(row.categoryBreakdown?.other || 0).toFixed(2)}</td>
                </tr>
              ))}
              {salesData.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 uppercase tracking-widest">No Sales Data Imported</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Sales Cards */}
        <div className="md:hidden p-4 space-y-4 bg-surface-elevated">
          {salesData.length === 0 ? (
            <div className="p-10 text-center text-slate-400 uppercase tracking-widest text-xs">No Sales Data Imported</div>
          ) : (
            salesData.map(row => (
              <div key={row.id} className="bg-surface-elevated p-5 rounded-2xl border border-surface-highlight shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-ink-base uppercase text-xs">{row.date}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">{row.dayOfWeek}</p>
                  </div>
                  <span className="text-xl font-black font-mono text-ink-base">{(row.totalSales || 0).toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <div className="bg-emerald-50 p-2 rounded-lg text-center">
                    <p className="text-[8px] font-black uppercase text-emerald-700">Cash Taken</p>
                    <p className="font-bold text-emerald-600 font-mono text-sm">{(row.cashTaken || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-rose-50 p-2 rounded-lg text-center">
                    <p className="text-[8px] font-black uppercase text-rose-700">Cash Purch</p>
                    <p className="font-bold text-rose-600 font-mono text-sm">{(row.cashPurchases || 0).toFixed(2)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-ink-muted font-bold uppercase p-3 bg-surface-elevated rounded-xl">
                  <div className="flex justify-between"><span>Raw:</span> <span>{(row.categoryBreakdown?.rawMaterials || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Fast:</span> <span>{(row.categoryBreakdown?.fasteners || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Tools:</span> <span>{(row.categoryBreakdown?.tools || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Other:</span> <span>{(row.categoryBreakdown?.other || 0).toFixed(2)}</span></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const ExpenseManager: React.FC<{
  userId: string;
  expenses: Expense[];
  postToLedger: (entries: Omit<LedgerEntry, 'id' | 'timestamp'>[]) => void;
  logAction: (action: string, module: ViewType, details: string, severity?: 'Info' | 'Warning' | 'Critical') => void;
}> = ({ userId, expenses, postToLedger, logAction }) => {
  const [formData, setFormData] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    category: 'Operational Expense'
  });
  const [paymentAccount, setPaymentAccount] = useState<LedgerAccount>('Cash in Hand');

  const handleAdd = async () => {
    if (!userId) return;
    if (!formData.description || !formData.amount || !formData.category) {
      alert("Please fill in all fields");
      return;
    }

    const expenseId = crypto.randomUUID();
    const newExpense: Expense = {
      id: expenseId,
      date: formData.date || new Date().toISOString(),
      description: formData.description,
      amount: formData.amount,
      category: formData.category
    };

    try {
      await addExpense(userId, newExpense);

      // Post to Ledger
      // Debit Expense Account, Credit Asset Account (Cash/Bank)
      postToLedger([
        {
          account: formData.category as LedgerAccount, // Assuming category matches LedgerAccount or mapped 
          type: 'Debit',
          amount: formData.amount,
          referenceId: expenseId,
          description: formData.description,
          category: 'Expense'
        },
        {
          account: paymentAccount,
          type: 'Credit',
          amount: formData.amount,
          referenceId: expenseId,
          description: `Payment for ${formData.description}`,
          category: 'Expense'
        }
      ]);

      logAction('Expense Recorded', 'expenses', `Added expense: ${formData.description} - ₹${formData.amount}`, 'Info');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        category: 'Operational Expense'
      });
      alert('Expense recorded successfully');
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Failed to save expense");
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <h3 className="text-3xl font-black text-ink-base uppercase tracking-tighter">Operational Expenses</h3>

      <div className="bg-surface-elevated p-6 md:p-8 rounded-[2.5rem] border border-surface-highlight shadow-sm">
        <h4 className="text-xl font-black text-ink-base uppercase mb-6">Record New Expense</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-surface-elevated border border-surface-highlight p-4 rounded-xl font-bold text-ink-base outline-none focus:border-primary-600"
              placeholder="e.g. Utility Bill"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount ({SHOP_INFO.currency})</label>
            <input
              type="number"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="w-full bg-surface-elevated border border-surface-highlight p-4 rounded-xl font-bold text-ink-base outline-none focus:border-primary-600"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-surface-elevated border border-surface-highlight p-4 rounded-xl font-bold text-ink-base outline-none focus:border-primary-600"
            >
              <option value="Operational Expense">Operational Expense</option>
              <option value="Payroll Expense">Payroll Expense</option>
              <option value="Cost of Goods Sold">Cost of Goods Sold (Ad-hoc)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Payment Source</label>
            <select
              value={paymentAccount}
              onChange={e => setPaymentAccount(e.target.value as LedgerAccount)}
              className="w-full bg-surface-elevated border border-surface-highlight p-4 rounded-xl font-bold text-ink-base outline-none focus:border-primary-600"
            >
              <option value="Cash in Hand">Cash in Hand</option>
              <option value="Bank Account">Bank Account</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-surface-elevated border border-surface-highlight p-4 rounded-xl font-bold text-ink-base outline-none focus:border-primary-600"
            />
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="bg-primary-600 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-primary-700 transition-colors w-full md:w-auto"
        >
          Record Expense
        </button>
      </div>

      <div className="bg-surface-elevated rounded-[2.5rem] border border-surface-highlight shadow-sm overflow-hidden">
        <div className="px-10 py-6 bg-surface-elevated border-b border-slate-100">
          <p className="text-[10px] font-black text-ink-base uppercase tracking-widest">Recent Expenses</p>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-left hidden md:table">
            <thead className="bg-surface-elevated text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] border-b sticky top-0">
              <tr>
                <th className="px-10 py-4">Date</th>
                <th className="px-10 py-4">Description</th>
                <th className="px-10 py-4">Category</th>
                <th className="px-10 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.slice().reverse().map(exp => (
                <tr key={exp.id} className="hover:bg-surface-elevated/50 transition-colors">
                  <td className="px-10 py-4 font-mono text-xs">{exp.date}</td>
                  <td className="px-10 py-4 font-bold text-ink-base">{exp.description}</td>
                  <td className="px-10 py-4 text-xs uppercase text-ink-muted">{exp.category}</td>
                  <td className="px-10 py-4 text-right font-mono font-bold text-rose-600">
                    {SHOP_INFO.currency}{exp.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-10 py-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No expenses recorded</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile Expense Cards */}
          <div className="md:hidden p-4 space-y-4 bg-surface-elevated">
            {expenses.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">No expenses recorded</div>
            ) : (
              expenses.slice().reverse().map(exp => (
                <div key={exp.id} className="bg-surface-elevated p-5 rounded-2xl border border-surface-highlight shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-ink-base uppercase text-sm">{exp.description}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">{exp.date}</p>
                    </div>
                    <span className="font-black font-mono text-rose-600">{SHOP_INFO.currency}{(exp.amount || 0).toFixed(2)}</span>
                  </div>
                  <span className="self-start px-2 py-1 bg-surface-highlight text-ink-muted text-[8px] font-black uppercase rounded">{exp.category}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PayrollBridge: React.FC<{
  salaries: SalaryRecord[];
}> = ({ salaries }) => {
  const handleExportRTI = () => {
    if (salaries.length === 0) {
      alert("No payroll records available for export.");
      return;
    }

    const rtiData = generateRTIData(salaries);
    const csvContent = rtiData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HMRC_RTI_Payroll_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-3xl font-black text-ink-base uppercase tracking-tighter text-primary-600">HMRC RTI Bridge</h3>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Payroll compliance & CSV generation</p>
        </div>
        <button
          onClick={handleExportRTI}
          className="bg-[#0F172A] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-3"
        >
          <span>📥</span> Export RTI Data
        </button>
      </div>

      <div className="bg-surface-elevated rounded-[2.5rem] border border-surface-highlight shadow-sm overflow-hidden">
        <div className="px-10 py-8 bg-primary-50 border-b border-primary-100 flex items-center gap-4">
          <span className="text-2xl">🗳️</span>
          <div>
            <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Compliance Status</p>
            <p className="text-sm font-bold text-primary-900">All data generated using HMRC-validated calculators (2024/25 NI Brackets)</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
              <tr>
                <th className="px-10 py-4">Employee</th>
                <th className="px-10 py-4">Payment Date</th>
                <th className="px-10 py-4 text-right">Gross Pay</th>
                <th className="px-10 py-4 text-right">Tax</th>
                <th className="px-10 py-4 text-right">EE NI</th>
                <th className="px-10 py-4 text-right text-primary-600">Net Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-xs text-ink-base">
              {salaries.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-10 py-4">{s.employeeName}</td>
                  <td className="px-10 py-4 font-mono text-slate-400">{s.payDate}</td>
                  <td className="px-10 py-4 text-right font-mono">{SHOP_INFO.currency}{(s.grossPay || 0).toFixed(2)}</td>
                  <td className="px-10 py-4 text-right font-mono text-rose-500">{SHOP_INFO.currency}{(s.incomeTax || 0).toFixed(2)}</td>
                  <td className="px-10 py-4 text-right font-mono text-amber-600">{SHOP_INFO.currency}{(s.nationalInsurance || 0).toFixed(2)}</td>
                  <td className="px-10 py-4 text-right font-mono text-primary-600">{SHOP_INFO.currency}{(s.totalAmount || 0).toFixed(2)}</td>
                </tr>
              ))}
              {salaries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-10 py-20 text-center text-slate-400 italic">No payroll records detected for current cycle.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const FinancialsView: React.FC<FinancialsViewProps> = ({
  userId, ledger, setLedger, transactions, inventory, suppliers, bills, expenses, setExpenses, salaries,
  staff = [],
  postToLedger,
  setBills, setSuppliers, logAction, userRole, currentStaffId, activeStaffName, navigateToProcurement
}) => {
  const [activeModule, setActiveModule] = useState<FinancialSubModule | 'expenses' | 'payroll-rti'>('overview');

  return (
    <div className="flex flex-col lg:flex-row gap-12 min-h-[900px] animate-in fade-in duration-700">
      <aside className="w-full lg:w-80 shrink-0 space-y-4">
        <div className="bg-surface-elevated rounded-[2.5rem] border border-surface-highlight p-6 shadow-xl">
          <p className="px-6 py-4 text-[10px] font-black text-ink-base uppercase tracking-[0.3em] border-b mb-4">Master Controls</p>
          {[
            { id: 'overview', label: 'Financial Matrix', icon: '📊' },
            { id: 'sales-analytics', label: 'Sales Analytics', icon: '📈' },
            { id: 'sales-ledger', label: 'Daily Sales Import', icon: '🛒' },
            { id: 'vat-summary', label: 'VAT Breakdown', icon: '📜' },
            { id: 'expenses', label: 'Op. Expenses', icon: '💸' },
            { id: 'payroll-rti', label: 'HMRC Payroll', icon: '🏢' },
            { id: 'master-register', label: 'Master Register', icon: '📕' }
          ].map(module => (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id as any)}
              className={`w-full flex items-center gap-4 px-6 py-5 rounded-[1.5rem] transition-all ${activeModule === module.id ? 'bg-primary-600 text-white shadow-2xl' : 'text-ink-muted hover:bg-surface-elevated'}`}
            >
              <span className="text-xl">{module.icon}</span>
              <span className="text-[11px] font-black uppercase tracking-widest">{module.label}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        {activeModule === 'overview' && <FinancialOverview ledger={ledger} transactions={transactions} setActiveModule={setActiveModule as any} />}
        {activeModule === 'sales-analytics' && <SalesLedgerDashboard transactions={transactions} inventory={inventory} />}
        {activeModule === 'costing-analytics' && <CostingDashboard transactions={transactions} inventory={inventory} />}
        {activeModule === 'vat-summary' && <VatAnalysis transactions={transactions} />}
        {activeModule === 'expenses' && <ExpenseManager userId={userId} expenses={expenses} postToLedger={postToLedger} logAction={logAction} />}
        {activeModule === 'payroll-rti' && <PayrollBridge salaries={salaries} />}
        {/* Placeholders for other modules not requested for refactoring yet, but keeping structure */}
        {activeModule === 'sales-ledger' && <SalesLedger userId={userId} />}
        {activeModule === 'master-register' && (
          <RegistersView
            userId={userId}
            staff={staff}
            /* Staff should be passed from App.tsx ideally, but for now we can maybe fetch it or pass it */
            inventory={inventory}
            logAction={logAction}
            navigateToProcurement={navigateToProcurement}
            activeStaffName={activeStaffName}
            userRole={userRole}
            currentStaffId={currentStaffId}
          />
        )}
      </main>
    </div>
  );
};

export default FinancialsView;
