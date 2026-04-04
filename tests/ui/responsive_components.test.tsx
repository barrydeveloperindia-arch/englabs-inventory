import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import StaffView from '../../components/StaffView';
import { StaffMember, AttendanceRecord } from '../../types';
import '@testing-library/jest-dom';

vi.mock('../../lib/firebase', () => ({
    auth: {
        currentUser: { uid: 'owner-id' }
    }
}));

// Mock Firestore
vi.mock('../../lib/firestore', () => ({
    subscribeToShopSettings: vi.fn(() => () => { }),
    subscribeToRota: vi.fn(() => () => { }),
    subscribeToRotaPreferences: vi.fn(() => () => { }),
    subscribeToLeaves: vi.fn(() => () => { }),
    subscribeToTasks: vi.fn(() => () => { }),
    subscribeToInventory: vi.fn(() => () => { }),
    addNotification: vi.fn(),
    processPayrollBatch: vi.fn(),
    updateStaffMember: vi.fn(),
    deleteStaffMember: vi.fn(),
    addLeaveRequest: vi.fn(),
    updateLeaveRequest: vi.fn(),
    addTask: vi.fn(),
    updateTask: vi.fn(),
    addBatchTasks: vi.fn(),
    publishRota: vi.fn(),
    saveRotaPreference: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Mock Props
const mockStaff: StaffMember[] = [
    {
        id: '1',
        name: 'TEST STAFF',
        role: 'Shop Assistant',
        pin: '1234',
        email: 'test@test.com',
        status: 'Active',
        joinedDate: '2023-01-01',
        contractType: 'Full-time',
        niNumber: 'AB123456C',
        taxCode: '1257L',
        rightToWork: true,
        emergencyContact: '',
        monthlyRate: 0,
        hourlyRate: 10,
        dailyRate: 0,
        advance: 0,
        holidayEntitlement: 20,
        accruedHoliday: 0,
        loginBarcode: '123'
    }
];

const defaultProps = {
    userId: "test-shop-id",
    staff: mockStaff,
    setStaff: vi.fn(),
    attendance: [],
    setAttendance: vi.fn(),
    logAction: vi.fn(),
    userRole: 'Owner' as const,
    currentStaffId: 'owner-id',
    inventory: [],
    activeStaffName: 'Owner',
    navigateToProcurement: vi.fn(),
};

const resizeScreen = (width: number) => {
    window.innerWidth = width;
    window.dispatchEvent(new Event('resize'));
};

describe('StaffView Responsiveness', () => {
    it('renders mobile card view on small screens', async () => {
        resizeScreen(375);
        render(<StaffView {...defaultProps} />);

        // Switch to Registry tab to see staff cards
        const registryTab = screen.getByTestId('tab-registry');
        fireEvent.click(registryTab);

        expect(screen.getByText(/Master Register/i)).toBeInTheDocument();
        expect(await screen.findByText('TEST STAFF')).toBeInTheDocument();
    });

    // We can't easily test "hidden" state with jsdom because it doesn't calculate layout/css visibility fully 
    // without a real browser, but we can check if elements exist in the DOM.
    // The "md:hidden" class is applied, so the element IS in the DOM, just hidden via CSS.
    // Testing CSS application requires e2e usually.
    // But we can verify the structure exists.
});
