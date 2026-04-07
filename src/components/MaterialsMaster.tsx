import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  BarChart3, 
  Database, 
  ShieldCheck, 
  Download, 
  AlertTriangle,
  FolderOpen,
  ChevronLeft,
  ArrowRight,
  Monitor
} from 'lucide-react';
import { cn } from '../lib/utils';
import { InventoryItem } from '../types';
import { PRODUCT_TAXONOMY, INITIAL_CATEGORIES } from '../constants';

interface MaterialsMasterProps {
  inventory: InventoryItem[];
}

export const MaterialsMaster: React.FC<MaterialsMasterProps> = ({ inventory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // High-Fidelity Categorization
  const folders = useMemo(() => INITIAL_CATEGORIES, []);

  const currentItems = useMemo(() => {
    let base = inventory;
    if (selectedFolder && selectedFolder !== 'All') {
      base = base.filter(i => i.category === selectedFolder);
    }
    if (searchTerm) {
      base = base.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return base;
  }, [inventory, selectedFolder, searchTerm]);

  const totalValue = useMemo(() => {
    return currentItems.reduce((acc, item) => acc + (item.price || 0) * (item.stock || 0), 0);
  }, [currentItems]);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700 pb-24">
      {/* 🚀 ENTERPRISE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-neutral-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 blur-[120px] -mr-32 -mt-32 pointer-events-none" />
        <div className="z-10">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-1.5 h-6 bg-primary-500 rounded-full" />
             <h1 className="text-3xl font-black uppercase tracking-tighter italic">Materials Master</h1>
          </div>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest leading-relaxed">
            Centralized Asset Registry • {inventory.length} Registered SKUs • Real-time Compliance Audit
          </p>
        </div>
        <div className="flex gap-4 z-10">
          <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all backdrop-blur-md flex items-center gap-3 group">
            <Download size={18} className="group-hover:translate-y-0.5 transition-transform" /> 
            Export Ledger
          </button>
          <button 
            onClick={() => setIsRegistering(true)}
            className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-primary-900/40 hover:-translate-y-1 active:scale-95 flex items-center gap-3"
          >
            <Plus size={18} /> Register Asset
          </button>
        </div>
      </div>

      {/* 📊 GLOBAL ANALYTICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Roster', val: currentItems.length.toString(), icon: <Database size={20} />, color: 'text-blue-500' },
          { label: 'Asset Valuation', val: `₹${(totalValue / 100000).toFixed(2)}L`, icon: <BarChart3 size={20} />, color: 'text-emerald-500' },
          { label: 'Inventory Deficit', val: currentItems.filter(i => (i.stock || 0) < (i.minStock || 0)).length.toString(), icon: <AlertTriangle size={20} />, color: 'text-rose-500' },
          { label: 'Sync Integrity', val: 'SECURE', icon: <ShieldCheck size={20} />, color: 'text-primary-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-neutral-900/50 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-white/5 shadow-sm relative group hover:shadow-xl transition-all">
             <div className={cn("absolute top-6 right-6 opacity-20 group-hover:scale-125 transition-transform", stat.color)}>{stat.icon}</div>
             <p className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter mb-1">{stat.val}</p>
             <h3 className="text-[10px] font-black tracking-[0.2em] text-neutral-400 uppercase">{stat.label}</h3>
          </div>
        ))}
      </div>

      {/* 📂 MASTER FOLDER NAVIGATION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
           <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Catalogue Folders</h4>
           {selectedFolder && (
             <button onClick={() => setSelectedFolder(null)} className="text-[10px] font-black uppercase text-primary-500 hover:underline">View All Folders</button>
           )}
        </div>
        
        {!selectedFolder ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {folders.map(folder => (
              <button 
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-white/5 shadow-sm hover:border-primary-500 hover:shadow-lg transition-all flex flex-col items-center gap-3 group"
              >
                <div className="w-12 h-12 bg-neutral-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-neutral-400 group-hover:text-primary-500 group-hover:scale-110 transition-all">
                   <FolderOpen size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 text-center line-clamp-1">{folder}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 p-6 rounded-[2rem] border border-neutral-200 dark:border-white/5 shadow-sm">
             <button onClick={() => setSelectedFolder(null)} className="w-10 h-10 flex items-center justify-center bg-neutral-100 dark:bg-white/5 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all">
                <ChevronLeft size={20} />
             </button>
             <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Materials Master</span>
                <ChevronRight size={14} className="text-neutral-300" />
                <span className="text-sm font-black text-neutral-900 dark:text-white uppercase italic tracking-tight">{selectedFolder}</span>
             </div>
          </div>
        )}
      </div>

      {/* 📦 SKU REGISTRY TABLE */}
      <div className="bg-white dark:bg-neutral-900/30 rounded-[3rem] border border-neutral-200 dark:border-white/5 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="p-8 border-b border-neutral-200 dark:border-white/10 flex flex-col md:flex-row gap-6 items-center justify-between bg-white dark:bg-neutral-900/50">
           <div className="relative w-full max-w-xl group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors" size={18} />
             <input 
               type="text" 
               placeholder="High-Precision Discovery: Search by SKU, ID, or Asset Name..." 
               className="w-full bg-neutral-100 dark:bg-white/5 border border-transparent focus:border-primary-500/30 focus:ring-4 focus:ring-primary-500/10 text-neutral-900 dark:text-white pl-12 pr-6 py-4 rounded-3xl text-xs font-bold outline-none transition-all"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
           </div>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10">
                 <ShieldCheck size={16} /> LIVE ROSTER SYNC ACTIVE
              </div>
              <button className="p-4 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-2xl text-neutral-500 hover:text-primary-500 transition-all">
                 <Filter size={20} />
              </button>
           </div>
        </div>

        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-neutral-50/50 dark:bg-white/5 text-[9px] font-black tracking-[0.2em] text-neutral-400 uppercase border-b border-neutral-200 dark:border-white/5">
                    <th className="px-10 py-6">Health</th>
                    <th className="px-10 py-6">Reference</th>
                    <th className="px-10 py-6">Asset Specifications</th>
                    <th className="px-10 py-6">Current Holding</th>
                    <th className="px-10 py-6 text-right">Discovery</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                 {currentItems.length > 0 ? currentItems.map((item) => (
                   <tr key={item.id} onClick={() => setViewingItem(item)} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-all group cursor-pointer">
                      <td className="px-10 py-8">
                         <div className={cn("w-2.5 h-2.5 rounded-full", 
                            (item.stock || 0) < (item.minStock || 0) ? "bg-rose-500 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.6)]" : "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                         )}></div>
                      </td>
                      <td className="px-10 py-8">
                         <span className="font-mono text-[10px] font-black text-primary-500 bg-primary-500/5 px-3 py-1.5 rounded-lg border border-primary-500/10 uppercase tracking-tighter">
                           {item.sku || item.id.slice(0, 12)}
                         </span>
                      </td>
                      <td className="px-10 py-8">
                         <h4 className="text-[13px] font-black text-neutral-900 dark:text-white uppercase tracking-tight group-hover:text-primary-500 transition-colors line-clamp-1">{item.brand} {item.name}</h4>
                         <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">{item.category}</span>
                            <ChevronRight size={10} className="text-neutral-300" />
                            <span className="text-[9px] text-neutral-500 font-black uppercase tracking-tight">{item.brand}</span>
                         </div>
                      </td>
                      <td className="px-10 py-8">
                         <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-neutral-900 dark:text-white tracking-tighter">{(item.stock || 0).toLocaleString()}</span>
                            <span className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">UNITS</span>
                         </div>
                         <div className="w-28 h-1.5 bg-neutral-100 dark:bg-white/5 rounded-full mt-2 overflow-hidden shadow-inner">
                            <div className={cn("h-full rounded-full transition-all duration-1000", (item.stock || 0) < (item.minStock || 0) ? "bg-rose-500 w-1/4 shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "bg-emerald-500 w-3/4")}></div>
                         </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                         <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-neutral-100 dark:bg-white/5 text-neutral-400 group-hover:bg-primary-600 group-hover:text-white group-hover:shadow-xl group-hover:shadow-primary-600/20 transition-all duration-300">
                            <ChevronRight size={20} />
                         </button>
                      </td>
                   </tr>
                 )) : (
                   <tr>
                     <td colSpan={5} className="py-32 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-50 grayscale">
                           <Database size={64} className="text-neutral-300" />
                           <p className="text-sm font-black text-neutral-400 uppercase tracking-widest italic">No matching records discovered in registry</p>
                        </div>
                     </td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>

      {/* 🔍 ASSET EXPLORER MODAL */}
      {viewingItem && (
        <div className="fixed inset-0 z-[1200] bg-neutral-900/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-950 w-full max-w-2xl rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">
            <div className="bg-neutral-900 p-12 text-white relative flex justify-between items-start">
               <div>
                  <span className="text-[10px] font-black text-primary-400 uppercase tracking-[0.3em] mb-2 block">Asset Detail: {viewingItem.sku || viewingItem.id}</span>
                  <h3 className="text-4xl font-black uppercase tracking-tighter italic leading-none">{viewingItem.brand} {viewingItem.name}</h3>
               </div>
               <button onClick={() => setViewingItem(null)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl hover:bg-rose-500 transition-colors">✕</button>
            </div>
            <div className="flex-1 p-12 space-y-8 overflow-y-auto no-scrollbar pb-24">
               <div className="grid grid-cols-2 gap-8">
                  <div className="p-6 bg-neutral-50 dark:bg-white/5 rounded-3xl border border-neutral-100 dark:border-white/5">
                     <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Stock Status</p>
                     <p className="text-2xl font-black text-neutral-900 dark:text-white">{viewingItem.stock} Units</p>
                  </div>
                  <div className="p-6 bg-neutral-50 dark:bg-white/5 rounded-3xl border border-neutral-100 dark:border-white/5">
                     <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Mkt. Valuation</p>
                     <p className="text-2xl font-black text-emerald-500">₹{(viewingItem.price || 0).toLocaleString()}</p>
                  </div>
               </div>
               <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b dark:border-white/10 pb-2">Technical Properties</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {[
                        { label: 'Category', value: viewingItem.category },
                        { label: 'Barcode', value: viewingItem.barcode || 'SYSTEM-GEN-01' },
                        { label: 'Shelf Loc.', value: viewingItem.shelfLocation || 'W-01A' },
                        { label: 'Min Level', value: viewingItem.minStock || '5 Units' }
                     ].map((prop, i) => (
                        <div key={i} className="flex justify-between items-center py-1">
                           <span className="text-xs font-bold text-neutral-500 uppercase">{prop.label}</span>
                           <span className="text-xs font-black text-neutral-900 dark:text-white uppercase">{prop.value}</span>
                        </div>
                     ))}
                  </div>
               </div>
               <button className="w-full bg-primary-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-6">
                  Initiate Stock Correction
               </button>
            </div>
          </div>
        </div>
      )}

      {/* ➕ REGISTRATION MODAL */}
      {isRegistering && (
        <div className="fixed inset-0 z-[1200] bg-neutral-900/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-950 w-full max-w-3xl rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">
            <div className="bg-primary-600 p-12 text-white flex justify-between items-center">
               <h3 className="text-3xl font-black uppercase tracking-tighter italic">Asset Registration Terminal</h3>
               <button onClick={() => setIsRegistering(false)} className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center text-2xl hover:bg-rose-500 transition-colors">✕</button>
            </div>
            <div className="p-12 space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <input type="text" placeholder="ASSET NAME" className="bg-neutral-100 dark:bg-neutral-900 px-6 py-4 rounded-2xl text-xs font-bold w-full outline-primary-500" />
                  <input type="text" placeholder="BRAND / MANUFACTURER" className="bg-neutral-100 dark:bg-neutral-900 px-6 py-4 rounded-2xl text-xs font-bold w-full outline-primary-500" />
               </div>
               <div className="grid grid-cols-3 gap-6">
                  <input type="number" placeholder="INITIAL QTY" className="bg-neutral-100 dark:bg-neutral-900 px-6 py-4 rounded-2xl text-xs font-bold w-full outline-primary-500" />
                  <input type="text" placeholder="CATEGORY" className="bg-neutral-100 dark:bg-neutral-900 px-6 py-4 rounded-2xl text-xs font-bold w-full outline-primary-500" />
                  <input type="number" placeholder="UNIT PRICE" className="bg-neutral-100 dark:bg-neutral-900 px-6 py-4 rounded-2xl text-xs font-bold w-full outline-primary-500" />
               </div>
               <button className="w-full bg-primary-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-primary-700 transition-all mt-6">
                  Commit Record to Registry
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsMaster;
