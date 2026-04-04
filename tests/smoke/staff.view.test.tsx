import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import StaffView from '../../components/StaffView';

/**
 * 👥 SMOKE TEST: STAFF & ROTA
 * ------------------------------------------------------------------
 * "The Staff Roster"
 * 
 * Objective: Verify the Shift Planner and Staff List render.
 * Critical Checkpoints:
 * 1. Staff List (Cards)
 * 2. Rota Grid / Calendar
 * 3. Tab Switching
 */

// --- MOCKS ---

const mockStaffMember = {
    id: 's1',
    name: 'Alice Staff',
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

vi.mock('../../lib/firebase', () => ({
    auth: {
        currentUser: { uid: 's2' }
    }
}));

// Mock all the subscriptions StaffView uses
vi.mock('../../lib/firestore', () => ({
    // Staff Data
    subscribeToStaff: (uid: any, cb: any) => {
        cb([mockStaffMember]);
        return () => { };
    },
    // Rota Data
    subscribeToRota: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToRotaPreferences: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToAttendance: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToLeaves: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToTasks: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToNotifications: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToShopSettings: (uid: any, cb: any) => { cb({ timings: null }); return () => { }; },

    // Actions might be called on mount
    logAction: vi.fn(),
    updateStaffMember: vi.fn(),
    addStaffMember: vi.fn(),
}));

describe('👥 Smoke Test: Staff Management View', () => {

    it('renders the staff directory dashboard by default', async () => {
        render(
            <StaffView
                userId="test-shop-id"
                userRole="Manager"
                staff={[mockStaffMember]}
                setStaff={vi.fn()}
                attendance={[]}
                setAttendance={vi.fn()}
                inventory={[]}
                activeStaffName="Bob Manager"
                currentStaffId="s2"
                logAction={vi.fn()}
                navigateToProcurement={vi.fn()}
            />
        );

        // 1. Check for Operational Intelligence heading (Manager default)
        await waitFor(() => {
            expect(screen.getByTestId('dashboard-heading')).toHaveTextContent(/Operational Intelligence/i);
        });

        // 2. Switch to Personnel Ledger to see staff list
        const registryTab = screen.getByTestId('tab-registry');
        fireEvent.click(registryTab);

        await waitFor(() => {
            expect(screen.getAllByText(/Alice Staff/).length).toBeGreaterThan(0);
        });
    });

    it('can switch to Rota/Calendar tab', async () => {
        render(
            <StaffView
                userId="test-shop-id"
                userRole="Manager"
                staff={[mockStaffMember]}
                setStaff={vi.fn()}
                attendance={[]}
                setAttendance={vi.fn()}
                inventory={[]}
                activeStaffName="Bob Manager"
                currentStaffId="s2"
                logAction={vi.fn()}
                navigateToProcurement={vi.fn()}
            />
        );

        // 1. Find Tab Triggers
        const rotaTab = screen.getByTestId('tab-rota'); // id is 'rota', label is 'Shift Architect'
        const calendarTab = screen.getByTestId('tab-calendar'); // id is 'calendar', label is 'Schedule'

        // 2. Click Rota tab
        fireEvent.click(rotaTab);

        // 3. Verify Rota View Loaded (Check for Publish button)
        await waitFor(() => {
            expect(screen.getByText(/Publish Rota/i)).toBeInTheDocument();
        });

        // 4. Click Calendar tab
        fireEvent.click(calendarTab);

        // 5. Verify Calendar View Loaded (Check for Export button)
        await waitFor(() => {
            expect(screen.getByText(/Export/i)).toBeInTheDocument();
        });
    });
});
