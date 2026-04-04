
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import StaffView from '../../components/StaffView';
import { AttendanceRecord } from '../../types';

// MOCKS
vi.mock('../../lib/firebase', () => ({
    auth: { currentUser: { uid: 'test-user-id' } },
    db: {}
}));

// 11 entries for Feb 3rd
const mockAttendanceParams: Partial<AttendanceRecord>[] = Array.from({ length: 11 }, (_, i) => ({
    id: `a${i}`,
    staffId: 'g1',
    date: '2026-02-03',
    clockIn: `${9 + Math.floor(i / 2)}:${i % 2 === 0 ? '00' : '30'}`,
    clockOut: `${10 + Math.floor(i / 2)}:00`,
    status: 'Present',
    hoursWorked: 1,
    overtime: 0
}));

vi.mock('../../lib/firestore', () => {
    return {
        subscribeToStaff: (_: any, cb: any) => {
            cb([
                { id: 'g1', name: 'Gaurav', role: 'Cashier', photo: '', status: 'Active' }
            ]); return () => { };
        },
        subscribeToLeaves: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToAttendance: (_: any, cb: any) => {
            cb(mockAttendanceParams);
            return () => { };
        },
        subscribeToRota: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToRotaPreferences: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToTasks: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToNotifications: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToShopSettings: (_: any, cb: any) => { cb({ timings: null }); return () => { }; },
        logAction: vi.fn()
    };
});

describe('👀 SMOKE: Gaurav Calendar Entry (11 Records)', () => {

    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-02-03T10:00:00'));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('Displays 1d for Gaurav in Feb 2026 when 11 separate entries exist (Unique Days)', async () => {
        // Spy on console
        const logSpy = vi.spyOn(console, 'log');

        render(
            <StaffView
                userId="test-shop-id"
                userRole="Manager"
                staff={[{ id: 'g1', name: 'Gaurav', hourlyRate: 10 } as any]}
                setStaff={vi.fn()}
                attendance={mockAttendanceParams as AttendanceRecord[]}
                setAttendance={vi.fn()}
                inventory={[]}
                activeStaffName="Manager"
                currentStaffId="admin"
                logAction={vi.fn()}
                navigateToProcurement={vi.fn()}
            />
        );

        // 1. Switch to Calendar Tab
        const calendarTab = screen.getByTestId('tab-calendar');
        fireEvent.click(calendarTab);

        // 2. Switch to Year View (Buttons: week, month, year)
        // Wait for tab switch rendering - use findByRole for the button
        const yearBtn = await screen.findByRole('button', { name: /year/i }, { timeout: 3000 });
        fireEvent.click(yearBtn);

        // 3. Look for Gaurav's Row - Expect at least one occurrence
        expect(screen.getAllByText('Gaurav').length).toBeGreaterThan(0);

        // 4. Look for "1d"
        try {
            const badges = await screen.findAllByText(/1d/i, {}, { timeout: 2000 });
            expect(badges.length).toBeGreaterThan(0);
        } catch (e) {
            const logs = logSpy.mock.calls.map(c => c.join(' ')).join('\n');
            throw new Error(`Element not found. LOGS:\n${logs}\n--End Logs--`);
        }
    });

});
