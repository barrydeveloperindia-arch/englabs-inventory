
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import StaffView from '../../components/StaffView';

// E2E Mock Setup
vi.mock('../../lib/firebase', () => ({ auth: { currentUser: { uid: 'g1' } }, db: {} }));

// Store listeners to simulate updates
let attendanceListener: ((data: any[]) => void) | null = null;

vi.mock('../../lib/firestore', async (importOriginal) => {
    return {
        ...await importOriginal<any>(),
        subscribeToStaff: (_: any, cb: any) => { cb([{ id: 'g1', name: 'Gaurav', role: 'Cashier', hourlyRate: 11.44 }]); return () => { }; },

        // Capture Listener
        subscribeToAttendance: (_: any, cb: any) => {
            console.log('E2E: Subscribed to Attendance');
            attendanceListener = cb;
            cb([]); // Initial Empty
            return () => { attendanceListener = null; };
        },

        subscribeToLeaves: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToRota: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToRotaPreferences: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToTasks: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToNotifications: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToShopSettings: (_: any, cb: any) => { cb({ timings: null }); return () => { }; },
        addAttendanceRecord: vi.fn(),
        logAction: vi.fn()
    };
});

describe('🚀 E2E: Gaurav Attendance Flow (Feb 3rd)', () => {

    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-02-03T12:00:00'));
        attendanceListener = null;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('Gaurav clocks in for Feb 3rd and it appears on Roster', async () => {
        const { rerender } = render(
            <StaffView
                userId="test-shop-id"
                userRole="Manager"
                staff={[{ id: 'g1', name: 'Gaurav', hourlyRate: 11.44 } as any]}
                setStaff={vi.fn()}
                attendance={[]}
                setAttendance={vi.fn()}
                inventory={[]}
                activeStaffName="Gaurav"
                currentStaffId="g1"
                logAction={vi.fn()}
                navigateToProcurement={vi.fn()}
            />
        );

        // 1. Simulate DB Update (Clock In) via Prop Update
        const feb3Entry = { id: 'new1', staffId: 'g1', date: '2026-02-03', clockIn: '09:00', clockOut: '17:00' };

        // RE-RENDER with new data (simulating App passing down new attendance)
        rerender(
            <StaffView
                userId="test-shop-id"
                userRole="Manager"
                staff={[{ id: 'g1', name: 'Gaurav', hourlyRate: 11.44 } as any]}
                setStaff={vi.fn()}
                attendance={[feb3Entry] as any}
                setAttendance={vi.fn()}
                inventory={[]}
                activeStaffName="Gaurav"
                currentStaffId="g1"
                logAction={vi.fn()}
                navigateToProcurement={vi.fn()}
            />
        );

        // 2. Switch to Calendar Tab
        const calendarTab = screen.getByTestId('tab-calendar');
        fireEvent.click(calendarTab);

        // 3. Switch to Year View
        // Wait for tab switch rendering
        const yearBtn = await screen.findByRole('button', { name: /year/i }, { timeout: 3000 });
        fireEvent.click(yearBtn);

        // 4. Verify Feb 3rd shows "1d" (1 entry)
        screen.debug(undefined, 20000); // Debugging output
        expect(await screen.findByText(/1d/)).toBeInTheDocument();
    });
});
