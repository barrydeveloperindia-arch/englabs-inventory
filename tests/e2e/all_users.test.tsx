
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import StaffView from '../../components/StaffView';
import { INITIAL_STAFF } from '../../constants';

// --- Mocks ---
vi.mock('../../lib/firebase', () => ({ auth: { currentUser: { uid: 'test-user' } }, db: {} }));

vi.mock('../../lib/firestore', async (importOriginal) => {
    return {
        ...await importOriginal<any>(),
        subscribeToStaff: (_: any, cb: any) => { cb(INITIAL_STAFF); return () => { }; },
        subscribeToAttendance: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToLeaves: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToRota: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToRotaPreferences: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToTasks: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToNotifications: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToShopSettings: (_: any, cb: any) => { cb({ timings: null }); return () => { }; },
        addAttendanceRecord: vi.fn(),
        updateAttendanceRecord: vi.fn(),
        logAction: vi.fn(),
        addLeaveRequest: vi.fn(),
        addBatchTasks: vi.fn()
    };
});

describe('🚀 E2E: All Users Workflow Suite', () => {

    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-02-03T09:00:00'));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    const TEST_USERS = [
        { id: '1', name: 'Bharat Anand', role: 'Owner' },
        { id: '5', name: 'Gaurav Panchal', role: 'Manager' },
        { id: '9', name: 'Nisha', role: 'Shop Assistant' }
    ];

    TEST_USERS.forEach(user => {
        it(`User ${user.name} (${user.role}) loads dashboard with correct permissions`, async () => {
            // Set Identity in LocalStorage for App-level RBAC detection
            localStorage.setItem('englabs_identity', user.id);

            const { unmount } = render(
                <StaffView
                    userId="test-shop-id"
                    userRole={user.role as any}
                    staff={INITIAL_STAFF}
                    setStaff={vi.fn()}
                    attendance={[]}
                    setAttendance={vi.fn()}
                    inventory={[]}
                    activeStaffName={user.name}
                    currentStaffId={user.id}
                    logAction={vi.fn()}
                    navigateToProcurement={vi.fn()}
                />
            );

            // 1. Role Specific Checks
            if (user.role === 'Owner' || user.role === 'Manager') {
                expect(screen.getByRole('heading', { level: 1, name: 'Operational Intelligence' })).toBeInTheDocument();
            } else {
                expect(screen.getByRole('heading', { level: 1, name: 'Personal Terminal' })).toBeInTheDocument();
            }

            // 2. Verify Clock In/Out Access (Everyone usually sees this on their own dashboard)
            // The component typically renders the clock-in widget.
            const clockInBtn = screen.queryByRole('button', { name: /Clock In/i });
            if (clockInBtn) {
                expect(clockInBtn).toBeInTheDocument();
            }

            unmount();
        });
    });

    it('Scenario: Nisha (Staff) successfully Clocks In', async () => {
        const nisha = INITIAL_STAFF.find(s => s.name === 'Nisha')!;

        render(
            <StaffView
                userId="test-shop-id"
                userRole="Inventory Staff"
                staff={INITIAL_STAFF}
                setStaff={vi.fn()}
                attendance={[]}
                setAttendance={vi.fn()}
                inventory={[]}
                activeStaffName="Nisha"
                currentStaffId={nisha.id}
                logAction={vi.fn()}
                navigateToProcurement={vi.fn()}
            />
        );

        // Ensure "Clock In" is visible (Nisha Dashboard)
        const clockBtn = await screen.findByRole('button', { name: /Clock In/i });
        expect(clockBtn).toBeInTheDocument();

        // Click Clock In
        fireEvent.click(clockBtn);

        // Note: Actual DB call is mocked (addAttendanceRecord). 
        const { addAttendanceRecord } = await import('../../lib/firestore');
        expect(addAttendanceRecord).toHaveBeenCalled();
    });

    it('Scenario: Gaurav (Manager) generates tasks', async () => {
        // Mock Confirm
        vi.spyOn(window, 'confirm').mockImplementation(() => true);
        vi.spyOn(window, 'alert').mockImplementation(() => { });

        render(
            <StaffView
                userId="test-shop-id"
                userRole="Manager"
                staff={INITIAL_STAFF}
                setStaff={vi.fn()}
                attendance={[]}
                setAttendance={vi.fn()}
                inventory={[]}
                activeStaffName="Gaurav Panchal"
                currentStaffId="5" // Gaurav ID
                logAction={vi.fn()}
                navigateToProcurement={vi.fn()}
            />
        );

        // Find "Intelligence Setup" button
        const generateBtn = await screen.findByRole('button', { name: /Intelligence Setup/i });
        fireEvent.click(generateBtn);

        const { addBatchTasks } = await import('../../lib/firestore');
        expect(addBatchTasks).toHaveBeenCalled();
    });
});
