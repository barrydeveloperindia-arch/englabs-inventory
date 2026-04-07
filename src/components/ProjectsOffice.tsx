import React, { useState } from 'react';
import { Briefcase, Search, Filter, Plus, ChevronRight, BarChart3, Clock, ShieldCheck, Map, Activity, User, MoreVertical } from 'lucide-react';
import { cn } from '../lib/utils';
import { ShopTask } from '../types';

interface ProjectsOfficeProps {
  tasks: ShopTask[];
}

export const ProjectsOffice: React.FC<ProjectsOfficeProps> = ({ tasks }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTasks = tasks.slice(0, 5); // Mocked for UI demonstration

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-right duration-500 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-3 italic">
            <Briefcase className="text-amber-500" />
            Projects Office
          </h1>
          <p className="text-sm text-neutral-500 font-medium tracking-tight">Site Portfolio Management • Real-time P&L Monitoring</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-neutral-50 transition-all shadow-lg flex items-center gap-2">
            <Map size={16} /> Site Map
          </button>
          <button className="bg-amber-640 bg-amber-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 active:scale-95">
            Initialize Site
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Sites', val: '08', icon: <Briefcase />, color: 'text-amber-500' },
          { label: 'Completion rate', val: '84.2%', icon: <Activity />, color: 'text-emerald-500' },
          { label: 'Site Staff', val: '124', icon: <User />, color: 'text-primary-500' },
          { label: 'Sync Status', val: 'SECURE', icon: <ShieldCheck />, color: 'text-emerald-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-neutral-950 p-6 rounded-[2rem] border border-neutral-200 dark:border-white/10 shadow-sm relative group overflow-hidden">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform">{stat.icon}</div>
             <p className="text-2xl font-black text-neutral-900 dark:text-white tracking-tighter">{stat.val}</p>
             <h3 className="text-[10px] font-black tracking-widest text-neutral-400 uppercase mt-1">{stat.label}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white dark:bg-neutral-950 rounded-[2.5rem] border border-neutral-200 dark:border-white/10 shadow-xl overflow-hidden">
              <div className="p-8 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between">
                 <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">Active Operation Registry</h3>
                 <div className="flex gap-2">
                    <button className="p-2 text-neutral-400 hover:text-amber-500 transition-all">
                       <Filter size={20} />
                    </button>
                    <button className="p-2 text-neutral-400 hover:text-amber-500 transition-all">
                       <MoreVertical size={20} />
                    </button>
                 </div>
              </div>

              <div className="p-4 space-y-4">
                 {filteredTasks.length === 0 ? (
                    <div className="p-20 text-center opacity-50 flex flex-col items-center gap-4">
                       <Briefcase size={64} className="text-neutral-400" />
                       <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">No Projects Registered</p>
                    </div>
                 ) : (
                    tasks.slice(0, 4).map((task, i) => (
                      <div key={task.id} className="bg-neutral-50 dark:bg-white/[0.03] p-6 rounded-[2rem] border border-transparent hover:border-amber-500/30 transition-all group flex items-center justify-between">
                         <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-white dark:bg-neutral-900 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm group-hover:scale-110 transition-transform">
                               <Map size={24} />
                            </div>
                            <div>
                               <h4 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tighter">{task.title}</h4>
                               <p className="text-[10px] text-neutral-400 font-bold uppercase mt-1 tracking-tight italic">Assigned to {task.assignedTo || 'Unassigned'}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-8">
                            <div className="text-right">
                               <p className="text-[14px] font-black text-neutral-900 dark:text-white tracking-tighter">74.2%</p>
                               <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest italic">Milestone 4</span>
                            </div>
                            <div className="w-24 h-1.5 bg-neutral-200 dark:bg-white/10 rounded-full overflow-hidden">
                               <div className="h-full bg-amber-500 w-3/4 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]"></div>
                            </div>
                            <button className="p-2 text-neutral-300 hover:text-amber-500 transition-all">
                               <ChevronRight size={20} />
                            </button>
                         </div>
                      </div>
                    ))
                 )}
              </div>
           </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
           <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/20 blur-[100px] -mr-24 -mt-24 pointer-events-none group-hover:bg-amber-500/30 transition-all duration-1000"></div>
              <h3 className="text-sm font-black uppercase tracking-widest text-amber-500 mb-6">Agentic Site Intelligence</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed italic">"Projected consumption for Site ENC-04 indicates a 14% delta from predicted ledger. Auto-syncing stock buffers to prevent downtime."</p>
              <div className="mt-8 pt-6 border-t border-white/5">
                 <button className="w-full bg-white text-slate-900 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-lg hover:bg-amber-400 transition-all">
                    Initiate Auto-Audit
                 </button>
              </div>
           </div>

           <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-white/10 shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-6 flex items-center gap-2">
                 <Clock size={14} className="text-primary-500" /> Site Activity Stream
              </h4>
              <div className="space-y-6">
                 {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4">
                       <div className="w-1 bg-neutral-100 dark:bg-white/5 rounded-full flex-shrink-0"></div>
                       <div>
                          <p className="text-xs font-black text-neutral-900 dark:text-white uppercase">Site {i} Journal updated</p>
                          <span className="text-[10px] text-neutral-400 font-bold uppercase mt-1 tracking-tighter">14 mins ago • Site Manager AUDIT-0{i}</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
