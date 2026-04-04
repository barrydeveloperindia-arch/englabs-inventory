import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import StaffView from '../../components/StaffView';

// Mock Dependencies
vi.mock('../../lib/firestore', () => ({
    getFirestore: vi.fn(),
    subscribeToStaff: vi.fn(() => () => { }),
    subscribeToAttendance: vi.fn(() => () => { }),
    subscribeToLeaves: vi.fn(() => () => { }),
    subscribeToRota: vi.fn(() => () => { }),
    subscribeToRotaPreferences: vi.fn(() => () => { }),
    subscribeToTasks: vi.fn(() => () => { }),
    getStaffMembers: vi.fn(() => Promise.resolve([])),
    initializeFirestore: vi.fn(),
    addNotification: vi.fn(),
    publishRota: vi.fn(),
    addAttendanceRecord: vi.fn(),
    updateAttendanceRecord: vi.fn(),
    deleteAttendanceRecord: vi.fn(),
    addLeaveRequest: vi.fn(),
    updateLeaveRequest: vi.fn(),
    updateStaffMember: vi.fn(),
    deleteStaffMember: vi.fn(),
    addTask: vi.fn(),
    addBatchTasks: vi.fn(),
    updateTask: vi.fn(),
    subscribeToShopSettings: vi.fn(() => () => { })
}));

vi.mock('../../lib/firebase', () => ({
    auth: { currentUser: { uid: 'owner-1' } },
    db: {}
}));

describe('💨 Verify Staff View / HR Panel Renders', () => {

    it('Renders Staff View container without crashing', () => {
        const mockProps = {
            userId: "test-shop-id",
            staff: [{ id: 's1', name: 'Owner', role: 'Owner', hourlyRate: 15 }] as any[],
            setStaff: vi.fn(),
            attendance: [],
            setAttendance: vi.fn(),
            logAction: vi.fn(),
            userRole: 'Owner' as any,
            currentStaffId: 's1',
            inventory: [],
            activeStaffName: 'Owner',
            navigateToProcurement: vi.fn()
        };

        render(<StaffView {...mockProps} />);
        // Basic check
        expect(screen.getByText(/Owner/)).toBeInTheDocument();
    });
});
