import React, { useState } from 'react';
import { FlaskConical, Search, Play, CheckCircle2, XCircle, AlertCircle, FileCode, History, Link, Filter, Plus, ChevronRight, Activity, Terminal, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { TestCase } from '../types';

export const TestCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'status' | 'cases' | 'artifacts'>('status');

  const testCases: TestCase[] = [
    { id: 'TC-INV-01', title: 'Inventory Real-time Sync', module: 'Inventory', expectation: 'Stock changes on POS reflect in inventory master within 500ms.', status: 'PASS', lastRun: '2026-03-22 14:10' },
    { id: 'TC-PRO-01', title: 'Task RBAC Enforcement', module: 'Project', expectation: 'Sub-managers cannot delete global project milestones.', status: 'PASS', lastRun: '2026-03-22 14:12' },
    { id: 'TC-SYS-01', title: 'Cold-Start Bootstrap', module: 'System', expectation: 'Application hydrates under 1.5s on Windows with special character paths.', status: 'FAIL', lastRun: '2026-03-22 14:15' },
    { id: 'TC-FIN-01', title: 'Vat Invariant Check', module: 'System', expectation: 'Gross must always equal Net + VAT within epsilon of 0.01.', status: 'PASS', lastRun: '2026-03-22 14:18' }
  ];

  return (
    <div className="flex flex-col gap-8 animate-in slide-in-from-right duration-500 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-lg shadow-primary-600/20">
             <FlaskConical className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight italic">
              Verification Layer & QA Desk
            </h1>
            <p className="text-sm text-neutral-500 font-medium tracking-tight">Antigravity Verified • Automated System Health & Reliability Audit</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-neutral-50 transition-all shadow-lg flex items-center gap-2">
            <History size={16} /> Audit History
          </button>
          <button className="bg-primary-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary-500 transition-all shadow-lg shadow-primary-600/20 active:scale-95 flex items-center gap-3">
            <Play size={16} /> Full Regression
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-6">
           <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'System Health', val: '94.2%', icon: <Activity />, color: 'text-primary-500' },
                { label: 'Pass Rate', val: '75%', icon: <CheckCircle2 />, color: 'text-emerald-500' },
                { label: 'Stability Index', val: 'STABLE', icon: <ShieldCheck />, color: 'text-blue-500' }
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-neutral-950 p-6 rounded-[2rem] border border-neutral-200 dark:border-white/10 shadow-sm relative group overflow-hidden">
                   <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform">{stat.icon}</div>
                   <p className={cn("text-2xl font-black tracking-tighter", stat.color)}>{stat.val}</p>
                   <h3 className="text-[10px] font-black tracking-widest text-neutral-400 uppercase mt-1">{stat.label}</h3>
                </div>
              ))}
           </div>

           <div className="bg-white dark:bg-neutral-950 rounded-[2.5rem] border border-neutral-200 dark:border-white/10 shadow-xl overflow-hidden">
              <div className="p-8 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between bg-neutral-50/50 dark:bg-white/5">
                 <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">Active Quality Audit</h3>
                 <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
                      <input 
                        type="text" 
                        placeholder="Filter Cases..." 
                        className="bg-neutral-100 dark:bg-white/5 border-none text-neutral-900 dark:text-white pl-9 pr-3 py-1.5 rounded-xl text-[10px] font-black outline-none w-48 focus:ring-2 ring-primary-500/20 transition-all uppercase"
                      />
                    </div>
                 </div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-neutral-50/50 dark:bg-white/5 text-[10px] font-black tracking-widest text-neutral-400 uppercase">
                          <th className="px-8 py-4">ID</th>
                          <th className="px-8 py-4">Test Title</th>
                          <th className="px-8 py-4">Module</th>
                          <th className="px-8 py-4">Outcome</th>
                          <th className="px-8 py-4 text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                       {testCases.map((tc) => (
                         <tr key={tc.id} className="hover:bg-neutral-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                            <td className="px-8 py-6">
                               <span className="text-[9px] font-black text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-md border border-primary-500/10 uppercase">
                                 {tc.id}
                               </span>
                            </td>
                            <td className="px-8 py-6">
                               <h4 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tighter group-hover:text-primary-500 transition-colors leading-tight">{tc.title}</h4>
                               <p className="text-[10px] text-neutral-400 font-bold uppercase mt-1 tracking-tight truncate italic">"{tc.expectation}"</p>
                            </td>
                            <td className="px-8 py-6">
                               <span className="px-3 py-1 bg-neutral-100 dark:bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest">
                                  {tc.module}
                               </span>
                            </td>
                            <td className="px-8 py-6">
                               <div className={cn("inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                                  tc.status === 'PASS' ? "text-emerald-500" : "text-rose-500"
                               )}>
                                  {tc.status === 'PASS' ? <CheckCircle2 className="w-4 h-4 shadow-[0_0_12px_rgba(16,185,129,0.5)]" /> : <XCircle className="w-4 h-4 shadow-[0_0_12px_rgba(244,63,94,0.5)]" />}
                                  {tc.status}
                               </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <button className="p-2 text-neutral-300 hover:text-primary-600 border border-transparent hover:border-neutral-100 dark:hover:border-white/10 rounded-xl transition-all">
                                  <Terminal size={18} />
                               </button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-white dark:bg-neutral-950 p-8 rounded-[3rem] border border-neutral-200 dark:border-white/10 shadow-sm flex flex-col items-center text-center gap-6">
              <div className="w-20 h-20 bg-primary-500/10 rounded-[2.5rem] flex items-center justify-center text-primary-500">
                 <ShieldCheck size={40} />
              </div>
              <div>
                 <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-widest">Antigravity Guard</h3>
                 <p className="text-xs text-neutral-500 font-bold mt-2 italic leading-relaxed px-4">
                    "Verification Engine is operating at 100% security logic. All commands are audited before commit."
                 </p>
              </div>
              <button className="w-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                 <Terminal size={14} /> Open VCR Console
              </button>
           </div>

           <div className="bg-white dark:bg-neutral-900 p-8 rounded-[3rem] border border-neutral-200 dark:border-white/10 shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-8 flex items-center gap-2">
                 <Activity size={14} className="text-amber-500" /> CI/CD Artifact Stream
              </h4>
              <div className="space-y-6">
                 {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 group">
                       <div className="w-1.5 bg-primary-500/20 rounded-full flex-shrink-0 group-hover:bg-primary-500 transition-colors"></div>
                       <div className="flex-1">
                          <p className="text-[11px] font-black text-neutral-900 dark:text-white uppercase tracking-tight">Post-Push Verification Logic #{i*120}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[9px] font-black uppercase tracking-widest italic text-neutral-400">
                             <span className="text-emerald-500">SUCCESS</span>
                             <span>•</span>
                             <span>4.2s Execution</span>
                          </div>
                       </div>
                    </div>
                 ))}
                 <button className="w-full mt-4 text-[9px] font-black uppercase tracking-widest text-primary-500 hover:text-primary-600 transition-colors">
                    View Comprehensive Log History
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
