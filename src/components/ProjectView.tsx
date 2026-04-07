import React, { useState, useMemo } from 'react';
import { ViewType, StaffMember, ShopTask, InventoryItem, UserRole } from '../types';
import { RegistersView } from './RegistersView';
import { Briefcase, CheckCircle2, Clock, AlertCircle, Plus, Search, Filter, Layout, List, Calendar as CalendarIcon, ClipboardList, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { addTask, updateTask, deleteStaffMember } from '../lib/firestore'; // Using existing helpers where applicable
import { auth } from '../lib/firebase';

interface ProjectViewProps {
  userId: string;
  staff: StaffMember[];
  inventory: InventoryItem[];
  logAction: (action: string, module: ViewType, details: string, severity?: 'Info' | 'Warning' | 'Critical') => void;
  userRole: UserRole;
  currentStaffId: string;
  activeStaffName: string;
  tasks: ShopTask[];
}

export const ProjectView: React.FC<ProjectViewProps> = ({
  userId,
  staff,
  inventory,
  logAction,
  userRole,
  currentStaffId,
  activeStaffName,
  tasks
}) => {
  const [activeTab, setActiveTab] = useState<'board' | 'compliance' | 'milestones'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'In Progress' | 'Completed'>('All');

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           t.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'Pending').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      completed: tasks.filter(t => t.status === 'Completed').length,
    };
  }, [tasks]);

  const renderTaskBoard = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 p-2 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-sm flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search project tasks..." 
              className="w-full bg-transparent border-none pl-10 pr-4 py-2 text-sm outline-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="h-6 w-px bg-neutral-200 dark:bg-white/10 hidden md:block" />
          <select 
            className="bg-transparent border-none text-xs font-bold uppercase tracking-widest text-neutral-500 outline-none cursor-pointer px-4"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Scope" value={stats.total} icon={ClipboardList} color="bg-primary-500" />
        <StatCard title="Backlog" value={stats.pending} icon={Clock} color="bg-amber-500" />
        <StatCard title="In Motion" value={stats.inProgress} icon={Zap} color="bg-blue-500" />
        <StatCard title="Verified" value={stats.completed} icon={CheckCircle2} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {['Pending', 'In Progress', 'Completed'].map(status => (
          <div key={status} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", 
                  status === 'Pending' ? "bg-amber-500" : 
                  status === 'In Progress' ? "bg-blue-500" : "bg-emerald-500"
                )} />
                {status}
              </h4>
              <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                {tasks.filter(t => t.status === status).length}
              </span>
            </div>
            
            <div className="space-y-4 min-h-[300px]">
              {tasks.filter(t => t.status === status).map(task => (
                <TaskCard key={task.id} task={task} staff={staff} />
              ))}
              {tasks.filter(t => t.status === status).length === 0 && (
                <div className="h-40 border-2 border-dashed border-neutral-100 dark:border-white/5 rounded-3xl flex items-center justify-center">
                  <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">No Tasks</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary-600" />
            Project Execution Desk
          </h1>
          <p className="text-sm text-neutral-500 font-medium">Independent workflow & milestone tracking ecosystem</p>
        </div>
        
        <div className="flex bg-white dark:bg-neutral-900 p-1.5 rounded-2xl shadow-sm border border-neutral-200 dark:border-white/10">
          <TabButton active={activeTab === 'board'} onClick={() => setActiveTab('board')} label="Task Board" icon={Layout} />
          <TabButton active={activeTab === 'compliance'} onClick={() => setActiveTab('compliance')} label="Compliance" icon={ShieldCheck} />
          <TabButton active={activeTab === 'milestones'} onClick={() => setActiveTab('milestones')} label="Milestones" icon={List} />
        </div>
      </div>

      <div className="space-y-8">
        {activeTab === 'board' && renderTaskBoard()}
        {activeTab === 'compliance' && (
          <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-white/10 overflow-hidden shadow-xl p-8">
            <RegistersView 
              userId={userId} 
              staff={staff} 
              inventory={inventory} 
              logAction={logAction} 
              navigateToProcurement={() => {}} 
              activeStaffName={activeStaffName} 
              userRole={userRole} 
              currentStaffId={currentStaffId} 
            />
          </div>
        )}
        {activeTab === 'milestones' && (
          <div className="p-20 text-center bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-white/10">
            <AlertCircle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-widest">Milestone Tracker Under Construction</h3>
            <p className="text-sm text-neutral-500 font-bold mt-2">Integrating with high-fidelity performance metrics...</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
    <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl -mr-12 -mt-12 opacity-10 transition-all group-hover:opacity-20", color)} />
    <div className="flex items-center gap-4 relative">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-0.5">{title}</p>
        <p className="text-2xl font-black text-neutral-900 dark:text-white tabular-nums">{value}</p>
      </div>
    </div>
  </div>
);

const TaskCard = ({ task, staff }: { task: ShopTask, staff: StaffMember[] }) => {
  const assignee = staff.find(s => s.id === task.assignedTo);
  return (
    <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200 dark:border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
      <div className="flex justify-between items-start mb-4">
        <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest", 
          task.priority === 'High' ? "bg-rose-500 text-white" : 
          task.priority === 'Medium' ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-500"
        )}>
          {task.priority || 'Low'}
        </span>
        <button className="text-neutral-300 hover:text-neutral-900 transition-colors">•••</button>
      </div>
      <h5 className="text-sm font-bold text-neutral-900 dark:text-white mb-2 leading-tight group-hover:text-primary-600 transition-colors">{task.title}</h5>
      {task.description && <p className="text-xs text-neutral-500 line-clamp-2 mb-4 font-medium">{task.description}</p>}
      
      <div className="flex items-center justify-between pt-4 border-t border-neutral-50 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden border border-white">
            {assignee?.photo && <img src={assignee.photo} className="w-full h-full object-cover" />}
          </div>
          <span className="text-[10px] font-bold text-neutral-400 uppercase">{assignee?.name.split(' ')[0]}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-400">
          <Clock className="w-3 h-3" />
          {new Date(task.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
  <button 
    onClick={onClick}
    className={cn("flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
      active ? "bg-slate-900 text-white shadow-lg" : "text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 dark:hover:bg-white/5"
    )}
  >
    <Icon className="w-3.5 h-3.5" />
    <span className="hidden sm:inline">{label}</span>
  </button>
);
