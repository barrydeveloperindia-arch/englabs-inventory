import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { AttendanceRecord } from '@/types';

interface AttendanceAnalyticsProps {
  attendance: AttendanceRecord[];
  selectedStaffId: string;
}

export const AttendanceAnalytics: React.FC<AttendanceAnalyticsProps> = ({ attendance, selectedStaffId }) => {
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const rec = attendance.find(a => a.staffId === selectedStaffId && a.date === dateStr);
      let timeVal = null;
      if (rec && rec.clockIn) {
        const [h, m] = rec.clockIn.split(':').map(Number);
        timeVal = h * 60 + m;
      }
      return {
        day: d.toLocaleString('default', { weekday: 'short' }).slice(0, 3).toUpperCase(),
        time: timeVal,
        isLate: timeVal ? timeVal > 540 : false
      };
    });
  }, [attendance, selectedStaffId]);

  return (
    <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-sm border border-neutral-200 dark:border-white/10 h-[380px] flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-widest">Attendance Performance</h3>
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">Rolling 7-day synchronization</p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" className="dark:opacity-5" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#888', fontSize: 9, fontWeight: 900 }}
              dy={10}
            />
            <YAxis
              domain={[420, 720]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#888', fontSize: 9, fontWeight: 700 }}
              tickFormatter={(val) => `${Math.floor(val / 60)}:${(val % 60).toString().padStart(2, '0')}`}
            />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '10px', fontSize: '10px', fontWeight: 800 }} />
            <ReferenceLine y={540} stroke="#F59E0B" strokeDasharray="4 4" strokeWidth={1} label={{ value: 'HQ TARGET', fill: '#F59E0B', fontSize: 8, fontWeight: 900, position: 'insideTopRight' }} />
            <Area type="monotone" dataKey="time" stroke="#4F46E5" strokeWidth={3} fill="url(#colorPerf)" connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
