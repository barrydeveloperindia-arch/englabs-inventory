import React from 'react';
import { AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { AttendanceRecord, StaffMember } from '@/types';
import { cn } from '@/lib/utils';

interface StaffAttendanceTableProps {
  records: AttendanceRecord[];
  shopHours: any;
  onEdit: (record: AttendanceRecord) => void;
}

export const StaffAttendanceTable: React.FC<StaffAttendanceTableProps> = ({ records, shopHours, onEdit }) => {
  return (
    <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-sm border border-neutral-200 dark:border-white/10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-widest">Workforce Ledger</h3>
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">Historical verification of sessions</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-white/5">
              <th className="py-4 pl-4 text-[9px] font-black text-neutral-400 uppercase tracking-widest">Entry Ref</th>
              <th className="py-4 text-[9px] font-black text-neutral-400 uppercase tracking-widest text-center">Protocol Status</th>
              <th className="py-4 text-[9px] font-black text-neutral-400 uppercase tracking-widest">Operational Window</th>
              <th className="py-4 text-[9px] font-black text-neutral-400 uppercase tracking-widest text-right">Net Units</th>
              <th className="py-4 text-[9px] font-black text-neutral-400 uppercase tracking-widest text-right pr-4 text-error-500">Overrun</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
            {records
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(record => {
                const isLate = (() => {
                  if (!record.clockIn) return false;
                  const dayName = new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' });
                  const startTime = shopHours[dayName]?.start || '08:00';
                  const [targetH, targetM] = startTime.split(':').map(Number);
                  const targetMins = targetH * 60 + targetM + 5;
                  const [h, m] = record.clockIn.split(':').map(Number);
                  return (h * 60 + m) > targetMins;
                })();
                const ot = record.hoursWorked && record.hoursWorked > 8 ? record.hoursWorked - 8 : 0;

                return (
                  <tr key={record.id} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition-all group cursor-pointer" onClick={() => onEdit(record)}>
                    <td className="py-4 pl-4">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-neutral-900 dark:text-white uppercase">{new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', weekday: 'short' })}</span>
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">Terminal ID: {record.id.slice(0, 6)}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                        isLate ? "bg-error-500/10 text-error-500" : "bg-success-500/10 text-success-500"
                      )}>
                        {isLate ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {isLate ? "Deviation Logged" : "Protocol Match"}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-neutral-600 dark:text-neutral-400">{record.clockIn || '--:--'}</span>
                        <ChevronRight className="w-3 h-3 text-neutral-300" />
                        <span className="text-[11px] font-mono font-bold text-neutral-600 dark:text-neutral-400">{record.clockOut || 'IN PROGRESS'}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-xs font-black text-neutral-900 dark:text-white tabular-nums">{record.hoursWorked?.toFixed(2) || '0.00'}h</span>
                    </td>
                    <td className="py-4 text-right pr-4">
                      <span className={cn("text-xs font-black tabular-nums", ot > 0 ? "text-error-500" : "text-neutral-300 dark:text-neutral-800")}>{ot > 0 ? `+${ot.toFixed(2)}h` : '0.00h'}</span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
