import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import StaffView from '../../components/StaffView';
import { StaffMember, LeaveRequest } from '../../types';
import * as firestoreLib from '../../lib/firestore'; // Import to use type or verify calls if mocked manually

// MOCK DEPENDENCIES
vi.mock('../../lib/firebase', () => ({
    auth: { currentUser: { uid: 'test-user-id' } },
    db: {}
}));

vi.mock('../../lib/firestore', () => ({
    subscribeToStaff: (uid: any, cb: any) => { cb([mockStaff]); return () => { }; },
    subscribeToRota: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToRotaPreferences: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToAttendance: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToLeaves: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToTasks: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToNotifications: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToDailySales: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToLedger: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToDailyChecks: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToExpiryLogs: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToCleaningLogs: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToShopSettings: (uid: any, cb: any) => { cb({ timings: null }); return () => { }; },

    // ACTION SPIES
    logAction: vi.fn(),
    addLeaveRequest: vi.fn().mockResolvedValue({}), // SPY TARGET
    updateStaffMember: vi.fn(),
    addStaffMember: vi.fn(),
}));

// MOCK DATA
const mockStaff: StaffMember = {
    id: 's1',
    name: 'Test Staff',
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

// Import mock directly to assert on it
import { addLeaveRequest } from '../../lib/firestore';

describe('🧪 SMOKE TEST: Leave Request Workflow', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderView = () => {
        render(
            <StaffView
                userId="test-shop-id"
                userRole="Manager"
                staff={[mockStaff]}
                setStaff={vi.fn()}
                attendance={[]}
                setAttendance={vi.fn()}
                inventory={[]}
                activeStaffName="Manager"
                currentStaffId="s1" // logged in as s1
                logAction={vi.fn()}
                navigateToProcurement={vi.fn()}
            />
        );
    };

    it('Opens the Leave Request modal when clicking "+ Request Leave"', async () => {
        renderView();

        // 1. Navigate to Rota/Calendar Tab
        const calendarTab = screen.getByTestId('tab-calendar');
        fireEvent.click(calendarTab);

        // 2. Click "+ Request Leave"
        // It should be visible in the Calendar View
        const requestBtn = await screen.findByText(/\+ Request Leave/i);
        fireEvent.click(requestBtn);

        // 3. Verify Modal Title
        expect(await screen.findByText("Request Absences")).toBeInTheDocument();

        // 4. Verify Inputs exist
        expect(screen.getByText("Start Date")).toBeInTheDocument();
        expect(screen.getByText("End Date")).toBeInTheDocument();
    });

    it('Submits a valid leave request', async () => {
        renderView();

        // 1. Open Modal
        fireEvent.click(screen.getByTestId('tab-calendar'));
        fireEvent.click(await screen.findByText(/\+ Request Leave/i));

        // 2. Fill Form
        // 2. Fill Form
        /* 
           FILL START DATE 
        */
        // Use text content to find label, then sibling input
        const startLabel = screen.getByText(/Start Date/i);
        const startInput = startLabel.nextElementSibling as HTMLInputElement;
        expect(startInput.tagName).toBe('INPUT'); // Verify we found an input
        fireEvent.change(startInput, { target: { value: '2026-05-01' } });



        /* 
           FILL END DATE 
        */
        const endLabel = screen.getByText("End Date");
        const endInput = endLabel.nextElementSibling as HTMLInputElement;
        fireEvent.change(endInput, { target: { value: '2026-05-05' } });

        /* 
           FILL REASON 
        */
        const reasonInput = screen.getByPlaceholderText(/Family vacation/i);
        fireEvent.change(reasonInput, { target: { value: 'Going to the moon' } });

        // 3. Submit
        const submitBtn = screen.getByText("Submit Request");
        fireEvent.click(submitBtn);

        // 4. Verify Call
        await waitFor(() => {
            expect(addLeaveRequest).toHaveBeenCalledTimes(1);
            // Verify payload
            // Expect: (userId, object)
            // We can check arguments partially
            expect(addLeaveRequest).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    staffId: 's1',
                    type: 'Annual',
                    startDate: '2026-05-01',
                    endDate: '2026-05-05',
                    totalDays: 5, // 1st to 5th inclusive = 5 days
                    reason: 'Going to the moon',
                    status: 'Pending'
                })
            );
        });

    });

});
