import { useState, useEffect } from 'react';
import { AttendanceRecord, StaffMember } from '../../../types';
import { addAttendanceRecord, updateAttendanceRecord } from '../../../lib/firestore';

export function useAttendance(userId: string, staff: StaffMember[], attendance: AttendanceRecord[], logAction: any) {
    const [isProcessing, setIsProcessing] = useState(false);

    const calculateHours = (start: string, end: string): number => {
        if (!start || !end) return 0;
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += (24 * 60); // Handle midnight crossing
        return Math.max(0, parseFloat((diff / 60).toFixed(2)));
    };

    const handleAttendanceAction = async (targetStaffId: string, type: 'IN' | 'OUT') => {
        setIsProcessing(true);
        const today = new Date().toISOString().split('T')[0];
        const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        const targetStaff = staff.find(s => s.id === targetStaffId);

        try {
            if (type === 'IN') {
                const newRecord: AttendanceRecord = {
                    id: crypto.randomUUID(),
                    staffId: targetStaffId,
                    date: today,
                    status: 'Present',
                    clockIn: time,
                    notes: 'Console Entry'
                };
                await addAttendanceRecord(userId, newRecord);
                logAction('Attendance', 'staff', `Clocked IN: ${targetStaff?.name}`, 'Info');
            } else {
                const activeShift = attendance.find(a => a.staffId === targetStaffId && !a.clockOut);
                if (activeShift) {
                    await updateAttendanceRecord(userId, activeShift.id, {
                        clockOut: time,
                        hoursWorked: calculateHours(activeShift.clockIn || '00:00', time)
                    });
                    logAction('Attendance', 'staff', `Clocked OUT: ${targetStaff?.name}`, 'Info');
                }
            }
        } catch (error) {
            console.error("Attendance Action Failed:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    return { handleAttendanceAction, isProcessing };
}
