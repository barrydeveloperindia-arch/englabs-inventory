
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  History, 
  User, 
  Package, 
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AuditLog {
  id: string;
  timestamp: string;
  action: 'Stock Added' | 'Stock Removed' | 'Project Allocated' | 'Damaged Reported';
  staff: string;
  itemId: string;
  itemName: string;
  quantity: number;
  hash: string; // "Digital Thread" simulation
}

const MOCK_LOGS: AuditLog[] = [
  { id: '1', timestamp: '2026-04-01 10:45:12', action: 'Stock Added', staff: 'Bharat Anand', itemId: 'HTB-12', itemName: 'HT Bolt M12', quantity: 500, hash: '0x8f2c...4a1e' } ,
  { id: '2', timestamp: '2026-04-01 09:30:00', action: 'Project Allocated', staff: 'Gaurav Panchal', itemId: 'SS-404', itemName: 'Stainless Sheet', quantity: 20, hash: '0x3d7a...ef91' } ,
  { id: '3', timestamp: '2026-03-31 16:20:45', action: 'Stock Removed', staff: 'Salil Anand', itemId: 'NV-201', itemName: 'Pneumatic Valve', quantity: 5, hash: '0x1c4e...8b5d' } ,
];

export const InventoryHyperAudit: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 🛡️ Hyper-Audit Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shadow-xl shadow-primary-500/10">
            <ShieldCheck size={28} className="text-primary-400" />
          </div>
          <div>
            <h2 className="text-[10px] font-black text-primary-400 tracking-widest uppercase mb-1">Blockchain-Verified Traceability</h2>
            <h1 className="text-4xl font-black text-white tracking-tight">HYPER-AUDIT <span className="text-emerald-400">LEDGER</span></h1>
            <p className="text-slate-500 text-sm font-bold mt-2 flex items-center gap-2">
              <Lock size={14} className="text-emerald-500/60" /> Total Immutability Log • Corporate 2026-27 Protocol
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-white transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search Digital Hash..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all min-w-[300px]"
            />
          </div>
          <button className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* 🧵 The Digital Thread View */}
      <div className="grid grid-cols-1 gap-4">
        {MOCK_LOGS.filter(l => l.hash.includes(searchTerm) || l.itemName.includes(searchTerm)).map((log) => (
          <div key={log.id} className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 hover:border-primary-500/40 transition-all group flex items-center gap-6">
            
            <div className="flex flex-col items-center gap-1 shrink-0 w-24">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">ID: {log.id}</span>
               <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/5 group-hover:bg-primary-500/10 transition-all">
                 <History size={20} className="text-slate-400 group-hover:text-primary-400" />
               </div>
            </div>

            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-3 mb-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                    log.action === 'Stock Added' ? "bg-emerald-500/10 text-emerald-400" :
                    log.action === 'Stock Removed' ? "bg-rose-500/10 text-rose-400" :
                    "bg-amber-500/10 text-amber-400"
                  )}>
                    {log.action}
                  </span>
                  <span className="text-[10px] font-black text-slate-500 uppercase">{log.timestamp}</span>
               </div>
               <h3 className="text-xl font-black text-white truncate flex items-center gap-3">
                  <Package size={18} className="text-slate-600" />
                  {log.itemName}
                  <ArrowRight size={14} className="text-slate-700" />
                  <span className="text-primary-400">{log.quantity} Units</span>
               </h3>
               <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white/5 px-3 py-1 rounded-lg">
                    <User size={14} className="text-slate-500" /> {log.staff}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400/60 bg-emerald-500/5 px-3 py-1 rounded-lg border border-emerald-500/10">
                    <CheckCircle2 size={12} /> HASH: {log.hash}
                  </div>
               </div>
            </div>

            <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
               Verify Block <ArrowUpRight size={16} />
            </button>

          </div>
        ))}
      </div>

      {/* 📊 Summary Discovery Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {[
          { label: 'Uptime Integrity', val: '99.98%', color: 'indigo' },
          { label: 'Active Sites', val: '04', color: 'emerald' },
          { label: 'Hash Verification', val: 'SECURE', color: 'cyan' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-slate-900/30 border border-white/5 p-6 rounded-2xl flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
            <span className={cn("text-lg font-black tracking-tight text-white", `text-${stat.color}-400`)}>{stat.val}</span>
          </div>
        ))}
      </div>

    </div>
  );
};
