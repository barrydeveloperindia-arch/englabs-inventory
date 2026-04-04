
import React, { useState, useMemo } from 'react';
import { InventoryItem, UserRole, ViewType, StaffMember, Transaction, VatBandSummary, LedgerEntry } from '../types';
import { SHOP_INFO } from '../constants';
import { useNotifications } from './NotificationProvider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { processTransaction } from '../lib/firestore';
import { auth } from '../lib/firebase';
import { Html5Qrcode } from "html5-qrcode";

interface SalesViewProps {
  userId: string;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  refunds: any[];
  setRefunds: React.Dispatch<React.SetStateAction<any[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  userRole: UserRole;
  staff: StaffMember[];
  activeStaffId: string;
  logAction: (action: string, module: ViewType, details: string, severity?: 'Info' | 'Warning' | 'Critical') => void;
  onCheckoutComplete?: () => void;
  postToLedger: (entries: Omit<LedgerEntry, 'id' | 'timestamp'>[]) => void;
}

// Demo Mock Data Generator
const generateMockTrendData = (startDate: string, endDate: string) => {
  const data = [];
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const isWeekend = current.getDay() === 0 || current.getDay() === 6;
    const base = isWeekend ? 4500 : 2800;
    const randomVar = Math.random() * 1500;

    data.push({
      date: new Date(current).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      revenue: base + randomVar
    });
    current.setDate(current.getDate() + 1);
  }
  return data;
};



interface BasketItem {
  id: string;
  name: string;
  brand: string;
  packSize: string;
  price: number;
  costPrice: number;
  vatRate: number;
  qty: number;
  sku: string;
}

const SalesView: React.FC<SalesViewProps> = ({
  userId, transactions, setTransactions, inventory, setInventory, activeStaffId, logAction, postToLedger, staff
}) => {
  const { showToast } = useNotifications();
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');



  // Receipt / Sales Slip State
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<Transaction | null>(null);

  // Date Range for Analytics
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);



  // Scanner State
  const [isScannerActive, setIsScannerActive] = useState(false);
  const scannerRef = React.useRef<Html5Qrcode | null>(null);

  const currentStaffMember = useMemo(() => staff.find(s => s.id === activeStaffId), [staff, activeStaffId]);

  // Scanner Logic
  const startScanner = async () => {
    setIsScannerActive(true);
    setTimeout(async () => {
      try {
        // Ensure element exists
        const elementExists = document.getElementById("sales-scanner-reader");
        if (!elementExists) throw new Error("Scanner element not found");

        const scanner = new Html5Qrcode("sales-scanner-reader");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          undefined
        );
      } catch (err) {
        console.error("Scanner failed:", err);
        alert("Unable to access camera for scanning.");
        setIsScannerActive(false);
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }
    setIsScannerActive(false);
  };

  const handleScanSuccess = (barcode: string) => {
    stopScanner();
    const item = inventory.find(i => i.barcode === barcode);
    if (item) {
      addToBasket(item);
      logAction('Barcode Scan', 'sales', `Added ${item.name} via Camera`, 'Info');
    } else {
      alert(`Product with barcode ${barcode} not found.`);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return inventory.filter(item =>
      item.name?.toLowerCase().includes(q) ||
      item.brand?.toLowerCase().includes(q) ||
      item.barcode?.includes(q) ||
      item.sku?.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [inventory, searchQuery]);

  const addToBasket = (item: InventoryItem) => {
    if (item.stock <= 0) {
      alert(`⚠️ OUT OF STOCK: ${item.name} cannot be sold.`);
      return;
    }

    setBasket(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (existing.qty >= item.stock) return prev;
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        id: item.id,
        name: item.name,
        brand: item.brand,
        packSize: item.packSize,
        price: item.price,
        costPrice: item.costPrice || item.lastBuyPrice || 0,
        vatRate: item.vatRate,
        qty: 1,
        sku: item.sku
      }];
    });
    setSearchQuery('');
  };

  const totals = useMemo(() => {
    const subtotal = basket.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const costTotal = basket.reduce((acc, i) => acc + (i.costPrice * i.qty), 0);
    const vatBreakdown: Record<number, VatBandSummary> = {
      0: { gross: 0, net: 0, vat: 0 },
      5: { gross: 0, net: 0, vat: 0 },
      20: { gross: 0, net: 0, vat: 0 }
    };

    basket.forEach(item => {
      const itemGross = item.price * item.qty;
      const rateMultiplier = item.vatRate / 100;
      const net = itemGross / (1 + rateMultiplier);
      const vat = itemGross - net;
      vatBreakdown[item.vatRate].gross += itemGross;
      vatBreakdown[item.vatRate].net += net;
      vatBreakdown[item.vatRate].vat += vat;
    });

    const vatTotal = Object.values(vatBreakdown).reduce((a, b) => a + b.vat, 0);
    return { subtotal, total: subtotal, costTotal, vatTotal, vatBreakdown };
  }, [basket]);

  // Daily Trend Data Calculation
  const trendData = useMemo(() => {
    const dailyMap: Record<string, number> = {};

    // Initialize dates in range to 0
    let current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      dailyMap[dateStr] = 0;
      current.setDate(current.getDate() + 1);
    }

    // Populate with actual transactions
    transactions.forEach(t => {
      const tDate = t.timestamp.split('T')[0];
      if (dailyMap[tDate] !== undefined) {
        dailyMap[tDate] += t.total;
      }
    });

    return Object.entries(dailyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        revenue
      }));
  }, [transactions, startDate, endDate]);

  // Use Mock Data if Real Data is Empty (For Aesthetics/Demo)
  const displayTrendData = useMemo(() => {
    const totalRev = trendData.reduce((acc, curr) => acc + curr.revenue, 0);
    if (totalRev === 0) {
      return generateMockTrendData(startDate, endDate);
    }
    return trendData;
  }, [trendData, startDate, endDate]);

  const handleCheckout = (method: 'Cash' | 'Card') => {
    if (basket.length === 0) return;

    const transactionId = crypto.randomUUID();
    const newTransaction: Transaction = {
      id: transactionId,
      timestamp: new Date().toISOString(),
      staffId: activeStaffId,
      staffName: currentStaffMember?.name || 'Unknown',
      subtotal: totals.total,
      discountAmount: 0,
      total: totals.total,
      vatTotal: totals.vatTotal,
      paymentMethod: method,
      items: basket.map(b => ({ ...b })),
      vatBreakdown: totals.vatBreakdown as any
    };

    postToLedger([
      // 1. Asset Entry (Cash/Bank)
      {
        account: method === 'Cash' ? 'Cash in Hand' : 'Bank Account',
        type: 'Debit',
        amount: totals.total,
        referenceId: transactionId,
        description: `POS Sale #${transactionId.slice(0, 8)}`,
        category: 'Sales'
      },
      // 2. Revenue Entry (Net of VAT)
      {
        account: 'Sales Revenue',
        type: 'Credit',
        amount: totals.total - totals.vatTotal,
        referenceId: transactionId,
        description: `Revenue Sale #${transactionId.slice(0, 8)}`,
        category: 'Sales'
      },
      // 3. VAT Liability Entry
      {
        account: 'VAT Liability',
        type: 'Credit',
        amount: totals.vatTotal,
        referenceId: transactionId,
        description: `VAT from Sale #${transactionId.slice(0, 8)}`,
        category: 'Sales'
      },
      // 4. COGS Entry (Consumption)
      {
        account: 'Cost of Goods Sold',
        type: 'Debit',
        amount: totals.costTotal,
        referenceId: transactionId,
        description: `COGS for Sale #${transactionId.slice(0, 8)}`,
        category: 'Inventory'
      },
      // 5. Inventory Asset Entry (Reduction)
      {
        account: 'Inventory Asset',
        type: 'Credit',
        amount: totals.costTotal,
        referenceId: transactionId,
        description: `Stock Reduction Sale #${transactionId.slice(0, 8)}`,
        category: 'Inventory'
      }
    ]);

    // Firestore Transaction
    if (userId) {
      processTransaction(userId, newTransaction)
        .then(() => {
          logAction('POS Checkout', 'sales', `Checkout ${SHOP_INFO.currency}${totals.total.toFixed(2)}`, 'Info');
          showToast(`Sale Complete: ${SHOP_INFO.currency}${totals.total.toFixed(2)}`, 'success', 'Transaction Verified');
          // Show Receipt instead of just clearing
          setLastReceipt(newTransaction);
          setShowReceipt(true);
          setBasket([]);
        })
        .catch(err => {
          console.error("Transaction failed", err);
          showToast("Transaction failed to process. Please try again.", 'error', 'Checkout Failed');
        });
    } else {
      showToast("Shop Context Missing. Please reload.", 'warning', 'Checkout Blocked');
    }

    // Ledger Updates (Previously duplicated, now removed)
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Personal Terminal</h1>
          <p className="text-sm text-neutral-500 font-medium">Enterprise Point of Sale • {SHOP_INFO.name}</p>
        </div>
      </div>

      {/* Sales Performance Analytics */}
      <div className="bg-surface-elevated p-8 rounded-[2.5rem] border border-surface-highlight shadow-sm space-y-8 no-print">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h4 className="text-xl font-black text-ink-base uppercase tracking-tight">Sales Revenue Trend</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Daily Performance Matrix</p>
          </div>
          <div className="flex items-center gap-4 bg-surface-elevated p-2 rounded-2xl border border-slate-100">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase outline-none px-3 cursor-pointer"
            />
            <span className="text-slate-300 text-[10px] font-black">TO</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase outline-none px-3 cursor-pointer"
            />
          </div>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }}
                tickFormatter={(val) => `${SHOP_INFO.currency}${val}`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                  padding: '12px'
                }}
                labelStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', color: '#64748b', marginBottom: '4px' }}
                itemStyle={{ fontWeight: 900, color: '#093D5E', fontSize: '14px' }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#093D5E"
                strokeWidth={4}
                dot={{ r: 4, fill: '#81D1A9', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-48 lg:pb-0">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-elevated p-6 md:p-10 rounded-[2.5rem] border border-surface-highlight shadow-sm space-y-8">
            <div className="relative group">
              <span className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 text-xl">🔍</span>
              <input
                type="text"
                placeholder="Scan / Search Assets..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-surface-elevated border border-surface-highlight rounded-[1.5rem] pl-20 pr-20 py-6 md:py-8 text-base md:text-lg font-black outline-none focus:border-primary-600 focus:bg-surface-elevated transition-all shadow-inner uppercase"
              />

              <button
                onClick={startScanner}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors"
                title="Open Camera Scanner"
              >
                <code className="text-[10px] font-black uppercase tracking-wider">SCAN</code>
              </button>

              {/* Scanner Overlay */}
              {isScannerActive && (
                <div className="absolute top-full left-0 right-0 mt-4 z-[60] bg-black rounded-3xl overflow-hidden border-4 border-primary-500 shadow-2xl">
                  <div id="sales-scanner-reader" className="w-full h-64"></div>
                  <button onClick={stopScanner} className="w-full py-4 bg-error-500 text-white font-bold uppercase tracking-widest">Close Scanner</button>
                </div>
              )}
              {searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-surface-elevated border border-surface-highlight rounded-[2rem] shadow-2xl z-50 overflow-hidden divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
                  {filteredItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => addToBasket(item)}
                      disabled={item.stock <= 0}
                      className="w-full p-6 flex justify-between items-center text-left hover:bg-surface-elevated transition-colors group/item"
                    >
                      <div className="space-y-1">
                        <p className="font-black text-ink-base uppercase text-sm leading-tight">
                          <span className="text-primary-600 mr-2">{item.brand}</span>
                          {item.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          SKU: {item.sku} • Bal: {item.stock}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-xl text-ink-base group-hover/item:text-primary-600 transition-colors">{SHOP_INFO.currency}{item.price.toFixed(2)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="min-h-[400px] flex flex-col gap-4">
              {basket.map(item => (
                <div key={item.id} className="p-6 bg-surface-elevated border border-slate-100 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
                  <div className="flex-1 w-full md:w-auto text-center md:text-left">
                    <h6 className="font-black text-ink-base text-sm uppercase leading-tight">{item.brand} {item.name}</h6>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">
                      {SHOP_INFO.currency}{item.price.toFixed(2)} • VAT {item.vatRate}%
                    </p>
                  </div>
                  <div className="flex items-center gap-4 md:gap-8 justify-between w-full md:w-auto">
                    <div className="flex items-center bg-surface-elevated p-1.5 rounded-2xl gap-4 border border-slate-100">
                      <button onClick={() => setBasket(b => b.map(i => i.id === item.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i))} className="w-10 h-10 bg-surface-elevated border border-surface-highlight rounded-xl shadow-sm font-black text-slate-400 hover:text-rose-600 transition-colors">-</button>
                      <span className="text-xl font-black font-mono w-8 text-center text-ink-base">{item.qty}</span>
                      <button onClick={() => setBasket(b => b.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i))} className="w-10 h-10 bg-surface-elevated border border-surface-highlight rounded-xl shadow-sm font-black text-slate-400 hover:text-primary-600 transition-colors">+</button>
                    </div>
                    <div className="w-24 md:w-32 text-right">
                      <p className="text-xl md:text-2xl font-black font-mono text-ink-base tracking-tighter">{SHOP_INFO.currency}{(item.price * item.qty).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {basket.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20 py-20">
                  <span className="text-8xl mb-8 text-primary-200">🛒</span>
                  <p data-testid="basket-empty-msg" className="font-black uppercase tracking-[0.4em] text-ink-base text-center px-4">Basket Empty</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          {/* Mobile Pay Bar (Fixed Bottom) */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-primary-700 p-6 rounded-t-[2rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] z-[100] border-t border-white/10">
            <div className="flex justify-between items-center mb-4">
              <p className="text-primary-200 text-[10px] font-black uppercase tracking-[0.2em]">Total</p>
              <h3 className="text-3xl font-black font-mono text-white tracking-tighter">{SHOP_INFO.currency}{totals.total.toFixed(2)}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleCheckout('Cash')} disabled={basket.length === 0} className="bg-success-500 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] text-white shadow-lg active:scale-95 transition-all">Cash</button>
              <button onClick={() => handleCheckout('Card')} disabled={basket.length === 0} className="bg-primary-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] text-white shadow-lg active:scale-95 transition-all">Card</button>
            </div>
          </div>

          {/* Desktop Pay Panel */}
          <div className="hidden lg:block bg-primary-700 p-12 rounded-[3rem] text-white shadow-2xl space-y-12 sticky top-10">
            <div className="text-center space-y-4">
              <p className="text-primary-200 text-[10px] font-black uppercase tracking-[0.5em]">Total Settlement</p>
              <h3 className="text-7xl font-black font-mono tracking-tighter">{SHOP_INFO.currency}{totals.total.toFixed(2)}</h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <button onClick={() => handleCheckout('Cash')} disabled={basket.length === 0} className="bg-success-500 py-6 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-success-600 transition-all shadow-xl">Settle Cash</button>
              <button onClick={() => handleCheckout('Card')} disabled={basket.length === 0} className="bg-primary-600 py-6 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-primary-700 transition-all shadow-xl">Settle Card</button>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Slip / Receipt Modal */}
      {showReceipt && lastReceipt && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black w-full max-w-sm rounded-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Receipt Content - Scrollable */}
            <div className="p-8 overflow-y-auto flex-1 font-mono text-sm leading-relaxed receipt-content">

              {/* Header */}
              <div className="text-center mb-6 space-y-1">
                <h2 className="text-xl font-black uppercase tracking-wider">{SHOP_INFO.name}</h2>
                <p className="text-xs uppercase">{SHOP_INFO.address}</p>
                <p className="text-xs">VAT Reg: GB 123 4567 89</p>
                <p className="text-xs">{new Date(lastReceipt.timestamp).toLocaleString('en-GB')}</p>
              </div>

              {/* Transaction Info */}
              <div className="border-b-2 border-dashed border-black pb-4 mb-4 space-y-1">
                <div className="flex justify-between">
                  <span>Rect #:</span>
                  <span>{lastReceipt.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Staff:</span>
                  <span className="uppercase">{lastReceipt.staffName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pay Mode:</span>
                  <span className="uppercase font-bold">{lastReceipt.paymentMethod}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2 mb-6">
                {lastReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <div className="font-bold">{item.qty} x {item.name}</div>
                      <div className="text-[10px] text-gray-500">@{SHOP_INFO.currency}{item.price.toFixed(2)}</div>
                    </div>
                    <div>{SHOP_INFO.currency}{(item.price * item.qty).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t-2 border-dashed border-black pt-4 space-y-1 text-right">
                <div className="flex justify-between text-xs">
                  <span>Subtotal</span>
                  <span>{SHOP_INFO.currency}{lastReceipt.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs mb-2">
                  <span>VAT ({lastReceipt.vatTotal > 0 ? 'Inc' : '0%'})</span>
                  <span>{SHOP_INFO.currency}{lastReceipt.vatTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-black border-t-2 border-black pt-2">
                  <span>TOTAL</span>
                  <span>{SHOP_INFO.currency}{lastReceipt.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 text-center text-xs space-y-2">
                <p>THANK YOU FOR SHOPPING!</p>
                <p>Please retain receipt for returns.</p>
                <p>www.englabinv.com</p>
              </div>

            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-4 no-print">
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 py-4 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold uppercase tracking-widest transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                  /* In a real app, this would trigger a thermal printer via WebUSB or custom protocol */
                }}
                className="flex-1 py-4 bg-black text-white hover:bg-gray-800 rounded-xl font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <span>🖨️</span> Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesView;
