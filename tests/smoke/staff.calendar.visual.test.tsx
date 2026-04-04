import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import StaffView from '../../components/StaffView';
import { StaffMember, AttendanceRecord, LeaveRequest } from '../../types';

// MOCKS
const mockStaff: StaffMember = {
    id: 's1',
    name: 'TEST USER',
    role: 'Cashier' as any,
    photo: '',
    status: 'Active' as any,
    pin: '0000',
    email: 'test@test.com',
    phone: '', hourlyRate: 10, monthlyRate: 0, advance: 0,
    contractType: 'Full-Time' as any, niNumber: '', taxCode: '', rightToWork: true,
    address: '', emergencyContact: '', joinedDate: '2023-01-01',
    dailyRate: 0, holidayEntitlement: 20, accruedHoliday: 0
};

// MOCK STORE (Hoisted for safe access)
const { mockStore } = vi.hoisted(() => ({
    mockStore: {
        attendance: [] as AttendanceRecord[],
        leaves: [] as LeaveRequest[]
    }
}));

vi.mock('../../lib/firebase', () => ({
    auth: {
        currentUser: { uid: 's1' }
    }
}));

vi.mock('../../lib/firestore', () => ({
    subscribeToStaff: (uid: any, cb: any) => { cb([mockStaff]); return () => { }; },
    subscribeToRota: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToRotaPreferences: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToAttendance: (uid: any, cb: any) => { cb(mockStore.attendance); return () => { }; }, // READ FROM HOISTED STORE
    subscribeToLeaves: (uid: any, cb: any) => { cb(mockStore.leaves); return () => { }; }, // READ FROM HOISTED STORE
    subscribeToTasks: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToNotifications: (uid: any, cb: any) => { cb([]); return () => { }; },
    logAction: vi.fn(),
    updateStaffMember: vi.fn(),
    addStaffMember: vi.fn(),
    subscribeToDailySales: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToLedger: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToDailyChecks: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToExpiryLogs: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToCleaningLogs: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToShopSettings: (uid: any, cb: any) => { cb({ timings: null }); return () => { }; }
}));

// HELPER: StaffView with specific data injection
const renderStaffView = (attendance: AttendanceRecord[], leaves: LeaveRequest[]) => {
    // UPDATE STORE
    mockStore.attendance = attendance;
    mockStore.leaves = leaves;

    render(
        <StaffView
            userId="test-shop-id"
            userRole="Manager"
            staff={[mockStaff]}
            setStaff={vi.fn()}
            attendance={attendance}
            setAttendance={vi.fn()}
            inventory={[]}
            activeStaffName="Manager"
            currentStaffId="admin"
            logAction={vi.fn()}
            navigateToProcurement={vi.fn()}
        />
    );
};

describe('🧪 VISUAL LOGIC: Staff View Calendar', () => {

    it('Should render MULTIPLE SHIFTS in the same day', async () => {
        const today = new Date().toISOString().split('T')[0];
        const multiShiftData: AttendanceRecord[] = [
            { id: '1', staffId: 's1', date: today, clockIn: '09:00', clockOut: '13:00', status: 'Present' },
            { id: '2', staffId: 's1', date: today, clockIn: '17:00', clockOut: '21:00', status: 'Present' }
        ];

        renderStaffView(multiShiftData, []);

        // Open Month/Calendar Tab (default is usually dashboard or list)
        // Note: Check StaffView default tab. Based on code, default is 'attendance' which shows Pulse.
        // We need to switch to 'calendar' or ensure the view renders these badges in grid.
        // The render logic is confusing in StaffView, let's target the Calendar Tab specifically if needed.
        // Or check the "Staff Pulse" or "Roster" view.

        // Toggle to Schedule (Calendar) Tab
        const calendarTab = screen.getByTestId('tab-calendar');
        fireEvent.click(calendarTab);

        await waitFor(() => {
            // EXPECT TWO "Present" badges
            const presentBadges = screen.getAllByText(/Present/i);
            expect(presentBadges.length).toBeGreaterThanOrEqual(2);
            expect(screen.getByText('09:00 - 13:00')).toBeInTheDocument();
            expect(screen.getByText('17:00 - 21:00')).toBeInTheDocument();
        });
    });

    it('Should render LEAVE and ATTENDANCE together (Co-existence)', async () => {
        const today = new Date().toISOString().split('T')[0];
        const attendanceData: AttendanceRecord[] = [
            { id: '1', staffId: 's1', date: today, clockIn: '10:00', status: 'Present' } // Currently checked in
        ];
        const leaveData: LeaveRequest[] = [
            { id: 'l1', staffId: 's1', startDate: today, endDate: today, type: 'Annual', status: 'Approved', totalDays: 1, reason: 'Half day', requestedAt: today }
        ];

        renderStaffView(attendanceData, leaveData);

        const calendarTab = screen.getByTestId('tab-calendar');
        fireEvent.click(calendarTab);

        // OPEN MONTH VIEW (To ensure 'today' is visible regardless of week start logic)
        const monthBtn = await screen.findByRole('button', { name: /month/i });
        fireEvent.click(monthBtn);

        await waitFor(() => {
            // EXPECT BOTH BADGES
            expect(screen.getByText(/ANNUAL/i)).toBeInTheDocument(); // Purple Badge
            expect(screen.getByText(/PRESENT/i)).toBeInTheDocument(); // Green Badge
        });
    });

    it('Should render MULTIPLE SHIFTS in YEAR view', async () => {
        const today = new Date().toISOString().split('T')[0];
        const monthIndex = new Date().getMonth(); // 0-11
        const multiShiftData: AttendanceRecord[] = [
            { id: '1', staffId: 's1', date: today, clockIn: '09:00', status: 'Present' },
            { id: '2', staffId: 's1', date: today, clockIn: '14:00', status: 'Present' }
        ];

        renderStaffView(multiShiftData, []);

        const calendarTab = screen.getByTestId('tab-calendar');
        fireEvent.click(calendarTab);

        // Switch to YEAR view
        const yearBtn = await screen.findByRole('button', { name: /year/i });
        fireEvent.click(yearBtn);

        await waitFor(() => {
            // In Year view, we show "Count" of days present, not details.
            // But if we have multiple shifts in ONE day, it should still count as 1 day attended or handled gracefully.
            // Logic: count = attendance.filter(...).length. 
            // If we have 2 records for same day, count is 2.
            // The badge logic: count > 20 ? emerald : count > 10 ? indigo : slate.
            // We want to verify it renders.

            // We expect at least a badge with '2d' if it counts records, or '1d' if it counts unique days?
            // count = attendance.filter(...).length -> NO.
            // Logic updated to Unique Days.
            // So for 2 shifts in 1 day, it counts as 1 Unique Day.
            // Badge should say '1d'.

            const cells = screen.getAllByText(/1d/i);
            expect(cells.length).toBeGreaterThan(0);
        });
    });

});
