
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import StaffView from '../../components/StaffView';

// --- MOCKS ---
const mockStaffMember = {
    id: 's1',
    name: 'Alice Status',
    role: 'Cashier' as any,
    photo: '',
    status: 'Active' as any,
    pin: '0000',
    email: 'alice@test.com',
    phone: '123',
    hourlyRate: 10,
    monthlyRate: 0,
    advance: 0,
    contractType: 'Full-Time' as any,
    niNumber: 'AB123456C',
    taxCode: '1257L',
    rightToWork: true,
    address: '123 St',
    emergencyContact: 'Mom',
    startDate: '2023-01-01',
    joinedDate: '2023-01-01',
    dailyRate: 0,
    holidayEntitlement: 20,
    accruedHoliday: 0
};

// Mock Dependencies
const mocks = {
    subscribeToStaff: vi.fn(),
    subscribeToRota: vi.fn(),
    subscribeToRotaPreferences: vi.fn(),
    subscribeToAttendance: vi.fn(),
    subscribeToLeaves: vi.fn(),
    subscribeToTasks: vi.fn(),
    subscribeToNotifications: vi.fn(),
    subscribeToShopSettings: vi.fn(),
};

vi.mock('../../lib/firebase', () => ({
    auth: {
        currentUser: { uid: 's1' },
        onAuthStateChanged: vi.fn((cb: any) => { cb({ uid: 's1' }); return () => { }; })
    }
}));

vi.mock('../../lib/firestore', () => ({
    subscribeToStaff: (uid: any, cb: any) => { cb([mockStaffMember]); return () => { }; },
    subscribeToRota: (uid: any, cb: any) => mocks.subscribeToRota(uid, cb),
    subscribeToRotaPreferences: (uid: any, cb: any) => mocks.subscribeToRotaPreferences(uid, cb),
    subscribeToAttendance: (uid: any, cb: any) => mocks.subscribeToAttendance(uid, cb),
    subscribeToLeaves: (uid: any, cb: any) => mocks.subscribeToLeaves(uid, cb),
    subscribeToTasks: (uid: any, cb: any) => mocks.subscribeToTasks(uid, cb),
    subscribeToNotifications: (uid: any, cb: any) => mocks.subscribeToNotifications(uid, cb),
    subscribeToShopSettings: (uid: any, cb: any) => mocks.subscribeToShopSettings(uid, cb),
    logAction: vi.fn(),
    updateStaffMember: vi.fn(),
    addStaffMember: vi.fn(),
}));

describe('🛡️ Unit: Staff Status & Availability', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Defaults
        mocks.subscribeToRota.mockImplementation((_, cb) => { cb([]); return () => { }; });
        mocks.subscribeToRotaPreferences.mockImplementation((_, cb) => { cb([]); return () => { }; });
        mocks.subscribeToAttendance.mockImplementation((_, cb) => { cb([]); return () => { }; });
        mocks.subscribeToLeaves.mockImplementation((_, cb) => { cb([]); return () => { }; });
        mocks.subscribeToTasks.mockImplementation((_, cb) => { cb([]); return () => { }; });
        mocks.subscribeToNotifications.mockImplementation((_, cb) => { cb([]); return () => { }; });
        mocks.subscribeToShopSettings.mockImplementation((_, cb) => { cb({ timings: null }); return () => { }; });
    });

    const renderView = () => {
        render(
            <StaffView
                userRole="Manager"
                staff={[mockStaffMember]}
                setStaff={vi.fn()}
                attendance={[]}
                setAttendance={vi.fn()}
                inventory={[]}
                activeStaffName="Manager"
                currentStaffId="s1"
                userId="s1"
                logAction={vi.fn()}
                navigateToProcurement={vi.fn()}
            />
        );
    };

    it('✅ Status: Staff in Store Today (Present)', async () => {
        // Mock Attendance for Today
        const today = new Date().toISOString().split('T')[0];
        mocks.subscribeToAttendance.mockImplementation((_, cb) => {
            cb([{
                id: 'a1',
                staffId: 's1',
                date: today,
                clockIn: '09:00',
                clockOut: null, // Still in store
                status: 'Present'
            }]);
            return () => { };
        });

        renderView();

        // Verify "Present" or "Clocked In" is visible
        // Assuming Dashboard or List view shows this status
        await waitFor(() => {
            // Adjust text expectation based on actual UI
            const statusElement = screen.getByText(/In Store|Present/i);
            expect(statusElement).toBeInTheDocument();
        });
    });

    it('📅 Status: Scheduled Today', async () => {
        // Mock Shift for Today
        const today = new Date().toISOString().split('T')[0];
        mocks.subscribeToRota.mockImplementation((_, cb) => {
            cb([{
                id: 'sh1',
                staff_id: 's1',
                date: today,
                start_time: '10:00',
                end_time: '18:00',
                status: 'published'
            }]);
            return () => { };
        });

        renderView();

        await waitFor(() => {
            // Verify Shift Time is displayed
            expect(screen.getByText(/10:00 - 18:00/)).toBeInTheDocument();
            // Maybe verify "Scheduled" text if it exists
        });
    });

    it('🏖️ Status: On Vacation (Annual Leave)', async () => {
        // Mock Leave for Today
        const today = new Date().toISOString().split('T')[0];
        mocks.subscribeToLeaves.mockImplementation((_, cb) => {
            cb([{
                id: 'l1',
                staffId: 's1',
                type: 'Annual',
                startDate: today,
                endDate: today,
                status: 'Approved'
            }]);
            return () => { };
        });

        renderView();

        await waitFor(() => {
            expect(screen.getByText(/Annual/i)).toBeInTheDocument();
        });
    });

    it('🤒 Status: Unavailable / Sick', async () => {
        // Mock Sick Leave for Today
        const today = new Date().toISOString().split('T')[0];
        mocks.subscribeToLeaves.mockImplementation((_, cb) => {
            cb([{
                id: 'l2',
                staffId: 's1',
                type: 'Sick',
                startDate: today,
                endDate: today,
                status: 'Approved'
            }]);
            return () => { };
        });

        renderView();

        await waitFor(() => {
            expect(screen.getByText(/Sick/i)).toBeInTheDocument();
        });
    });

});
