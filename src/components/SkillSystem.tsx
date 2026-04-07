import React, { useState } from 'react';
import { Lightbulb, Search, Play, BookOpen, Star, Filter, Shield, Zap, Settings, ChevronRight, FileText, Activity, Terminal } from 'lucide-react';
import { cn } from '../lib/utils';
import { Skill } from '../types';

export const SkillSystem: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const skills: Skill[] = [
    {
      id: 'SKILL-INV-01',
      title: 'Full Stock Audit',
      description: 'Systematic verification of physical inventory against digital records using real-time sync.',
      category: 'Inventory',
      icon: 'Package',
      workflowSteps: ['Initiate Audit Session', 'Scan Barcodes', 'Verify Discrepancies', 'Commit Adjustments'],
      status: 'Active'
    },
    {
      id: 'SKILL-PRO-01',
      title: 'Project Milestone Tracking',
      description: 'Advanced oversight of multi-stage development cycles and operational rollouts.',
      category: 'Project',
      icon: 'Briefcase',
      workflowSteps: ['Define Phase', 'Assign Leads', 'Set KPIS', 'Review Completion'],
      status: 'Beta'
    },
    {
      id: 'SKILL-FIN-01',
      title: 'Automated Payroll Run',
      description: 'AI-assisted calculation of salaries including taxes, pensions, and overtime.',
      category: 'Finance',
      icon: 'Landmark',
      workflowSteps: ['Verify Attendance', 'Calculate Deductions', 'Generate Payslips', 'Record Ledger'],
      status: 'Active'
    },
    {
      id: 'SKILL-INV-02',
      title: 'Inventory Hyper-Audit',
      description: 'Blockchain-inspired ledger for absolute traceability and immutable asset logs.',
      category: 'Inventory',
      icon: 'ShieldCheck',
      workflowSteps: ['Access Hyper-Ledger', 'Search Digital Hash', 'Verify Item Traceability', 'Audit Block Integrity'],
      status: 'Active'
    }
  ];

  const filteredSkills = skills.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || s.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-8 animate-in slide-in-from-right duration-500 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-amber-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
             <Lightbulb className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight italic">
              Skill Registry & SOP Desk
            </h1>
            <p className="text-sm text-neutral-500 font-medium tracking-tight">Standardized Operating Procedures • Enterprise Operational Intelligence</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-neutral-50 transition-all shadow-lg flex items-center gap-2">
            <Settings size={16} /> Registry Config
          </button>
          <button className="bg-amber-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 active:scale-95">
            <Zap className="inline mr-2" size={16} /> Force Automation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-neutral-950 p-8 rounded-[3rem] border border-neutral-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-all duration-700">
                <Search className="w-16 h-16 text-amber-500" />
             </div>
             <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-6">Search Library</h3>
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Query Skill Registry..." 
                  className="w-full bg-neutral-100 dark:bg-white/5 border border-transparent focus:border-amber-500/30 rounded-2xl py-3 pl-10 pr-4 text-xs font-black outline-none transition-all placeholder:text-neutral-400"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
             </div>

             <div className="mt-10 space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4">Core Domains</h3>
                {['All', 'Inventory', 'Project', 'Finance', 'Automation'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn("w-full text-left px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                      activeCategory === cat ? "bg-amber-500 text-white shadow-xl translate-x-3" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-white/5"
                    )}
                  >
                    {cat}
                  </button>
                ))}
             </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col gap-4">
             <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-emerald-500" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Real-time Intelligence</h4>
             </div>
             <p className="text-xs text-slate-400 font-medium leading-relaxed italic">"Optimal skill execution detected in Domain: INVENTORY. 4 processes are candidates for direct Agentic automation."</p>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-6">
           {selectedSkill ? (
              <div className="bg-white dark:bg-neutral-950 p-10 rounded-[3rem] border border-neutral-200 dark:border-white/10 shadow-xl animate-in fade-in zoom-in-95 duration-300">
                 <button 
                   onClick={() => setSelectedSkill(null)}
                   className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-8 hover:text-amber-500 transition-colors flex items-center gap-2"
                 >
                    <ChevronRight className="rotate-180" size={16} /> Return to Library
                 </button>
                 
                 <div className="flex justify-between items-start mb-10">
                    <div className="flex items-center gap-6">
                       <div className="w-20 h-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center text-amber-500">
                          <Activity size={32} />
                       </div>
                       <div>
                          <h2 className="text-3xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">{selectedSkill.title}</h2>
                          <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest mt-1 block">ID: {selectedSkill.id} • {selectedSkill.category}</span>
                       </div>
                    </div>
                    <span className="px-6 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/10">
                       {selectedSkill.status}
                    </span>
                 </div>

                 <div className="prose dark:prose-invert max-w-none">
                    <div className="bg-neutral-50 dark:bg-white/[0.02] p-8 rounded-[2rem] border border-neutral-100 dark:border-white/5">
                       <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                          <Terminal size={18} className="text-amber-500" /> Executive Workflow Definition
                       </h3>
                       <div className="space-y-6 mt-8">
                          {selectedSkill.workflowSteps.map((step, idx) => (
                             <div key={idx} className="flex gap-6 relative">
                                {idx < selectedSkill.workflowSteps.length - 1 && (
                                   <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-neutral-100 dark:bg-white/5"></div>
                                )}
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-white/10 flex items-center justify-center text-xs font-black text-neutral-400 group-hover:scale-110 transition-transform z-10 shadow-sm shrink-0">
                                   {idx + 1}
                                </div>
                                <div className="mt-2">
                                   <p className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{step}</p>
                                   <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1 tracking-tight italic">Step Objective Verified</p>
                                </div>
                             </div>
                          ))}
                       </div>
                       
                       <div className="mt-12 flex gap-4">
                          <button className="flex-1 bg-amber-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
                             Execute Standard Procedure
                          </button>
                          <button className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-white/10 text-neutral-900 dark:text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-neutral-50 transition-all">
                             Print Manual (PDF)
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredSkills.map(skill => (
                  <div 
                    key={skill.id} 
                    onClick={() => setSelectedSkill(skill)}
                    className="bg-white dark:bg-neutral-950 p-8 rounded-[3rem] border border-neutral-200 dark:border-white/10 shadow-sm hover:shadow-2xl transition-all group flex flex-col cursor-pointer hover:border-amber-500/30 active:scale-95 translate-y-0 hover:-translate-y-2 duration-300"
                  >
                    <div className="flex justify-between items-start mb-8">
                       <div className="w-14 h-14 bg-neutral-50 dark:bg-white/5 rounded-3xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500 shadow-sm">
                          <Star className="w-7 h-7" />
                       </div>
                       <div className="flex flex-col items-end gap-2">
                          <span className="px-3 py-1 bg-neutral-100 dark:bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest">
                             {skill.status}
                          </span>
                       </div>
                    </div>
                    
                    <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-2 uppercase tracking-tighter">{skill.title}</h3>
                    <p className="text-xs text-neutral-500 font-bold mb-8 flex-1 italic">"{skill.description}"</p>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-neutral-50 dark:border-white/5">
                       <div className="flex -space-x-2">
                          {[1, 2, 3].map(i => (
                             <div key={i} className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-white/10 border-2 border-white dark:border-neutral-950 flex items-center justify-center text-[8px] font-black text-neutral-400">
                                {i}
                             </div>
                          ))}
                       </div>
                       <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                          Inspect <ChevronRight size={14} />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
