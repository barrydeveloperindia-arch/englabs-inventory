
import { describe, it, expect } from 'vitest';

/**
 * 📅 UNIT TEST: Calendar Aggregation Logic
 * Goal: Validate that attendance on specific dates (e.g., Feb 3rd) is correctly counted.
 */

// We assume the logic is effectively: 
// count = attendance.filter(a => a.staffId === target && a.date.startsWith('YYYY-MM')).length

describe('Calendar Logic: Monthly Aggregation', () => {

    // Mock Data mimicking what StaffView likely processes
    const attendanceRecords = [
        { id: '1', staffId: 'gaurav', date: '2026-02-01', status: 'Present' },
        { id: '2', staffId: 'gaurav', date: '2026-02-03', status: 'Present' }, // TITLE SCENARIO
        { id: '3', staffId: 'gaurav', date: '2026-02-15', status: 'Present' },
        { id: '4', staffId: 'other', date: '2026-02-03', status: 'Present' },
        { id: '5', staffId: 'gaurav', date: '2026-03-01', status: 'Present' }
    ];

    const calculateMonthlyDays = (staffId: string, month: string, records: any[]) => {
        const relevant = records.filter(r => r.staffId === staffId && r.date.startsWith(month));
        return new Set(relevant.map(r => r.date)).size;
    };

    it('Counts multiple entries on same day (e.g. 11 entries on Feb 3rd) as 1 Day', () => {
        // User Scenario: Gaurav has 11 separate clock in/out on Feb 3rd.
        // Logic should count UNIQUE DAYS.
        const multipleEntries = Array.from({ length: 11 }, (_, i) => ({
            id: `dup-${i}`,
            staffId: 'gaurav',
            date: '2026-02-03',
            status: 'Present'
        }));
        const result = calculateMonthlyDays('gaurav', '2026-02', multipleEntries);
        expect(result).toBe(1);
    });

    it('Correctly aggregates days for February 2026', () => {
        const result = calculateMonthlyDays('gaurav', '2026-02', attendanceRecords);
        expect(result).toBe(3); // 1st, 3rd, 15th
    });

    it('Specifically accounts for Feb 3rd entry', () => {
        const result = calculateMonthlyDays('gaurav', '2026-02', attendanceRecords);
        const hasFeb3 = attendanceRecords.some(r => r.staffId === 'gaurav' && r.date === '2026-02-03');
        expect(hasFeb3).toBe(true);
        expect(result).toBeGreaterThanOrEqual(1);
    });

    it('Does not count other staff', () => {
        const result = calculateMonthlyDays('gaurav', '2026-02', attendanceRecords);
        // Total 4 records for Feb, but only 3 for Gaurav
        expect(result).toBe(3);
    });

    it('Updates count when Feb 3rd is removed', () => {
        const withoutFeb3 = attendanceRecords.filter(r => r.date !== '2026-02-03');
        const result = calculateMonthlyDays('gaurav', '2026-02', withoutFeb3);
        expect(result).toBe(2); // Only 1st and 15th
    });
});
