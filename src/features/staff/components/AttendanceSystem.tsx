import React from 'react';
import { UserCheck, AlertCircle, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { AttendanceRecord, StaffMember } from '../types';
import { cn } from '../../../lib/utils';
import { useAttendance } from '../hooks/useAttendance';

interface AttendanceSystemProps {
  userId: string;
  staff: StaffMember[];
  attendance: AttendanceRecord[];
  selectedStaffId: string;
  logAction: any;
  delayRate: number;
  attendanceRate: number;
  overtimeMins: number;
  leaves: any[];
}

export const AttendanceSystem: React.FC<AttendanceSystemProps> = ({
  userId, staff, attendance, selectedStaffId, logAction, delayRate, attendanceRate, overtimeMins, leaves
}) => {
  const { handleAttendanceAction, isProcessing } = useAttendance(userId, staff, attendance, logAction);
  const targetStaff = staff.find(s => s.id === selectedStaffId);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendance.find(a => a.staffId === selectedStaffId && a.date === todayStr);

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-8">
      {/* Quick Punch & Performance Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-sm border border-neutral-200 dark:border-white/10 flex flex-col justify-between h-[380px]">
          <div>
            <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-widest mb-1">Live Operation</h3>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Authentication Protocol Required</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-white/5 flex items-center justify-center border-4 border-dashed border-neutral-200 dark:border-white/10">
              <Clock className={cn("w-10 h-10 text-neutral-300", todayRecord?.clockIn && !todayRecord.clockOut && "text-success-500 animate-pulse")} />
            </div>
            <div className="text-center">
              <p className="text-xs font-black text-neutral-900 dark:text-white uppercase">{targetStaff?.name || 'No Professional Selected'}</p>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter shadow-sm">{todayRecord?.clockIn ? `Signed In at ${todayRecord.clockIn}` : 'Status: Offline'}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleAttendanceAction(selectedStaffId, todayRecord?.clockIn && !todayRecord.clockOut ? 'OUT' : 'IN')}
              disabled={isProcessing}
              className={cn(
                "flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-95",
                todayRecord?.clockIn && !todayRecord.clockOut ? "bg-error-500 text-white shadow-error-500/20" : "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
              )}
            >
              {todayRecord?.clockIn && !todayRecord.clockOut ? 'Clock Out' : 'Clock In'}
            </button>
          </div>
        </div>

        {/* Global Performance Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-6">
            {/* Delay Variance */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-error-50 dark:bg-error-500/10 rounded-lg text-error-500"><AlertCircle className="w-3.5 h-3.5" /></div>
                    <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">Delay Variance</span>
                </div>
                <p className="text-3xl font-black text-neutral-900 dark:text-white mb-2">{delayRate}%</p>
                <div className="w-full h-1 bg-neutral-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-error-500" style={{ width: `${delayRate}%` }}></div>
                </div>
            </div>

            {/* Attendance Rate */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-success-50 dark:bg-success-500/10 rounded-lg text-success-500"><UserCheck className="w-3.5 h-3.5" /></div>
                    <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">Attendance</span>
                </div>
                <p className="text-3xl font-black text-neutral-900 dark:text-white mb-2">{attendanceRate}%</p>
                <div className="w-full h-1 bg-neutral-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-success-500" style={{ width: `${attendanceRate}%` }}></div>
                </div>
            </div>

            {/* Overtime Accumulation */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-primary-50 dark:bg-primary-500/10 rounded-lg text-primary-500"><TrendingUp className="w-3.5 h-3.5" /></div>
                    <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">Overtime</span>
                </div>
                <p className="text-3xl font-black text-neutral-900 dark:text-white mb-2">{formatDuration(overtimeMins)}</p>
                <span className="text-[9px] font-black text-success-500 flex items-center gap-1">Pitched Target</span>
            </div>

            {/* Leave Pool Integration */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-base leading-none">🏖️</span>
                    <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">Leave Pool</span>
                </div>
                {(() => {
                    const entitlement = targetStaff?.holidayEntitlement || 28;
                    const used = leaves.filter(l => l.staffId === selectedStaffId && l.status === 'Approved' && l.type === 'Annual').reduce((acc, curr) => acc + curr.totalDays, 0);
                    const remaining = entitlement - used;
                    const perc = Math.max(0, (remaining / entitlement) * 100);
                    return (
                        <>
                            <p className="text-3xl font-black text-neutral-900 dark:text-white mb-2">{remaining} <small className="text-xs text-neutral-400">/ {entitlement}</small></p>
                            <div className="w-full h-1 bg-neutral-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-500" style={{ width: `${perc}%` }}></div>
                            </div>
                        </>
                    );
                })()}
            </div>
        </div>
      </div>
    </div>
  );
};
