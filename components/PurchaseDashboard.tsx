
import React, { useMemo } from 'react';
import { Purchase, Supplier, InventoryItem, Transaction } from '../types';
import { generateReplenishmentPlan } from '../lib/intelligence';

interface PurchaseDashboardProps {
    purchases: Purchase[];
    suppliers: Supplier[];
    onAddNew: () => void;
    inventory: InventoryItem[];
    transactions: Transaction[];
}

const PurchaseDashboard: React.FC<PurchaseDashboardProps> = ({ purchases, suppliers, onAddNew, inventory, transactions }) => {

    const stats = useMemo(() => {
        const totalSpend = purchases.reduce((acc, p) => acc + (p.amount || 0), 0);
        const totalOrders = purchases.length;
        const avgOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0;

        const outstandingTotal = suppliers.reduce((acc, s) => acc + (s.outstandingBalance || 0), 0);

        const supplierSpend = suppliers.map(s => ({
            id: s.id,
            name: s.name,
            amount: s.totalSpend || 0
        })).sort((a, b) => b.amount - a.amount).slice(0, 5);

        // Monthly Spend
        const monthlySpend: Record<string, number> = {};
        purchases.forEach(p => {
            const d = p.date ? new Date(p.date) : null;
            if (d && !isNaN(d.getTime())) {
                const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
                monthlySpend[key] = (monthlySpend[key] || 0) + (p.amount || 0);
            }
        });

        return { totalSpend, totalOrders, avgOrderValue, outstandingTotal, supplierSpend, monthlySpend };
    }, [purchases, suppliers]);

    const replenishmentPlan = useMemo(() => {
        return generateReplenishmentPlan(inventory, transactions).slice(0, 6); // Top 6 suggestions
    }, [inventory, transactions]);

    const sortedPurchases = useMemo(() => {
        return [...purchases].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }, [purchases]);

    // Gallery: Recent purchases with photos or placeholders
    const galleryItems = useMemo(() => {
        return sortedPurchases.slice(0, 12); // Show top 12
    }, [sortedPurchases]);

    const renderItems = (val: any) => {
        if (!val) return 'No Details';
        if (typeof val === 'string') return val;
        if (Array.isArray(val)) return val.map((v: any) => v.description || v.name || 'Item').join(', ');
        if (typeof val === 'object') return val.description || val.name || 'Item Details';
        return 'Details Unavailable';
    };

    const [selectedPurchase, setSelectedPurchase] = React.useState<Purchase | null>(null);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">

            {/* 1. HERO STATS (Data Heavy) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Procurement', value: `₹${stats.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: 'text-primary-600', bg: 'bg-primary-50 border-primary-100' },
                    { label: 'Outstanding Balance', value: `₹${stats.outstandingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
                    { label: 'Total Invoices', value: stats.totalOrders, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                    { label: 'Avg Invoice Value', value: `₹${stats.avgOrderValue.toFixed(2)}`, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                ].map((stat, idx) => (
                    <div key={idx} className={`${stat.bg} p-6 rounded-[2rem] border shadow-sm flex flex-col items-center justify-center text-center gap-2 transition-all hover:scale-105`}>
                        <span className={`text-2xl md:text-3xl font-black font-mono tracking-tight ${stat.color}`}>{stat.value}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
                    </div>
                ))}
            </div>

            {/* 2. VISUAL CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Top Suppliers (Bar Chart) */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Top Supplier Allocation</h4>
                    <div className="flex-1 flex flex-col justify-center space-y-4">
                        {stats.supplierSpend.map((s, idx) => {
                            const max = stats.supplierSpend[0]?.amount || 1;
                            const percent = (s.amount / max) * 100;
                            return (
                                <div key={s.id} className="w-full">
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 mb-1">
                                        <span>{s.name}</span>
                                        <span>₹{s.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary-600 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {stats.supplierSpend.length === 0 && <p className="text-center text-xs text-slate-400">No data available</p>}
                    </div>
                </div>

                {/* Recent Activity Mini-Feed */}
                <div className="bg-[#0F172A] p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-primary-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <h4 className="text-sm font-black text-white/90 uppercase tracking-widest mb-6 z-10">Live Feed</h4>
                    <div className="space-y-4 relative z-10 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                        {sortedPurchases.slice(0, 6).map(p => (
                            <div key={p.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setSelectedPurchase(p)}>
                                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-lg shrink-0">
                                    {p.receiptData ? '📸' : '📄'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{suppliers.find(s => s.id === p.supplierId)?.name || 'Unknown'}</p>
                                    <p className="text-[10px] text-white/50 truncate opacity-70">{renderItems(p.items)}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="block font-mono font-bold text-emerald-400">₹{(p.amount || 0).toFixed(2)}</span>
                                    <span className="text-[9px] text-white/30">{p.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* 2.5 REPLENISHMENT INTELLIGENCE (AI WING) */}
            <div className="bg-primary-600 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-white/20 transition-all"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-primary-200 uppercase tracking-[0.3em]">Operational Intelligence</span>
                            <div className="px-2 py-0.5 bg-emerald-400 text-emerald-950 text-[8px] font-black rounded-full animate-pulse">LIVE ANALYTICS</div>
                        </div>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tight">Predictive Replenishment Plan</h4>
                    </div>
                    <p className="mt-4 md:mt-0 text-[10px] font-bold text-primary-100/60 uppercase tracking-widest text-right">
                        Based on 30-day velocity <br /> 14-day safety buffer target
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                    {replenishmentPlan.length > 0 ? replenishmentPlan.map((item, idx) => (
                        <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl hover:bg-white/15 transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-[9px] font-black text-primary-200 uppercase tracking-widest mb-1">{item.sku}</p>
                                    <h5 className="font-bold text-white text-sm line-clamp-1">{item.name}</h5>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-[10px] font-black ${item.currentStock <= 0 ? 'bg-rose-500 text-white' : 'bg-amber-400 text-primary-900'}`}>
                                    {item.currentStock <= 0 ? 'OOS' : `${item.currentStock} LEFT`}
                                </div>
                            </div>

                            <div className="flex items-end justify-between border-t border-white/10 pt-3">
                                <div>
                                    <p className="text-[8px] font-bold text-primary-200 uppercase tracking-widest mb-0.5">Recommended Inward</p>
                                    <p className="text-xl font-black text-white">+{item.suggestedOrder}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-bold text-primary-200 uppercase tracking-widest mb-0.5">Est. Investment</p>
                                    <p className="text-sm font-black text-emerald-400">₹{item.estimatedCost.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-primary-200/50 italic border-2 border-dashed border-white/10 rounded-3xl">
                            <span className="text-3xl mb-2">✨</span>
                            <p className="text-xs font-bold uppercase tracking-widest">Inventory Levels Optimal — No immediate action required</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-end relative z-10">
                    <button
                        onClick={onAddNew}
                        className="bg-white text-primary-600 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-primary-500/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                        Initiate Bulk Procurement Launch →
                    </button>
                </div>
            </div>

            {/* 3. PHOTO HEAVY GALLERY (Receipts) */}
            <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest ml-2">Digital Receipt Vault</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div
                        onClick={onAddNew}
                        className="group aspect-[3/4] bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-300 hover:border-primary-400 hover:text-primary-400 hover:bg-slate-100 transition-all cursor-pointer animate-in zoom-in duration-300"
                    >
                        <span className="text-5xl group-hover:scale-110 transition-transform">+</span>
                        <span className="font-black uppercase text-xs tracking-widest">New Entry</span>
                    </div>

                    {galleryItems.map(p => (
                        <div
                            key={p.id}
                            onClick={() => setSelectedPurchase(p)}
                            className="group relative bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden aspect-[3/4] hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer animate-in zoom-in duration-500"
                        >

                            {/* Image / Placeholder */}
                            <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                                {p.receiptData ? (
                                    <img src={p.receiptData} className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <span className="text-4xl text-primary-300 font-black">{suppliers.find(s => s.id === p.supplierId)?.name.charAt(0) || '?'}</span>
                                    </div>
                                )}
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                            </div>

                            {/* Data Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary-300 mb-1">{p.date}</p>
                                <h5 className="font-black text-lg leading-tight mb-1 truncate">{suppliers.find(s => s.id === p.supplierId)?.name || 'Unknown'}</h5>
                                <p className="text-xs text-white/70 line-clamp-1 mb-2 opacity-80">{renderItems(p.items)}</p>
                                <div className="flex items-center justify-between border-t border-white/20 pt-2 mt-2">
                                    <span className="font-mono text-xl font-bold text-emerald-400">₹{(p.amount || 0).toFixed(2)}</span>
                                    {p.receiptData ? (
                                        <span className="text-[10px] bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors">View</span>
                                    ) : (
                                        <span className="text-[10px] bg-rose-500/20 px-2 py-1 rounded text-rose-200">No Img</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                </div>
            </div>

            {/* INVOICE MODAL */}
            {selectedPurchase && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedPurchase(null)}>
                    <div
                        className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Left: Details */}
                        <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-100 flex flex-col">
                            <div className="p-8 border-b border-slate-200/60">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Invoice Details</h3>
                                <h2 className="text-3xl font-black text-slate-800 leading-tight">
                                    {suppliers.find(s => s.id === selectedPurchase.supplierId)?.name || 'Unknown Supplier'}
                                </h2>
                                <p className="text-slate-500 font-medium mt-2">{selectedPurchase.date}</p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Items</label>
                                    <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                                        {renderItems(selectedPurchase.items)}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Amount</label>
                                    <div className="text-3xl font-mono font-black text-primary-600">
                                        ₹{selectedPurchase.amount?.toFixed(2)}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Status</label>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Fulfilled
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-200 bg-white">
                                <button
                                    onClick={() => setSelectedPurchase(null)}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-colors"
                                >
                                    Close Viewer
                                </button>
                            </div>
                        </div>

                        {/* Right: Image Preview */}
                        <div className="w-full md:w-2/3 bg-slate-900 flex items-center justify-center relative group min-h-[400px]">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                            {selectedPurchase.receiptData ? (
                                <div className="relative w-full h-full p-8 flex items-center justify-center">
                                    <img
                                        src={selectedPurchase.receiptData}
                                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-300"
                                        alt="Receipt"
                                    />
                                    <a
                                        href={selectedPurchase.receiptData}
                                        download={`Invoice_${selectedPurchase.date}.jpg`}
                                        className="absolute bottom-8 right-8 bg-white/10 hover:bg-white/20 backdrop-blur text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <span>Download Full Res</span>
                                    </a>
                                </div>
                            ) : (
                                <div className="text-center p-12">
                                    <div className="w-24 h-24 rounded-full bg-slate-800 mx-auto flex items-center justify-center mb-6">
                                        <span className="text-4xl">📄</span>
                                    </div>
                                    <h3 className="text-white font-bold text-xl mb-2">No Digital Receipt</h3>
                                    <p className="text-slate-400 text-sm max-w-xs mx-auto">This entry was created without a digital scan. Only the metadata on the left is available.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default PurchaseDashboard;
