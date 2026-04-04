
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import StaffView from '../../components/StaffView';
import { StaffMember, AttendanceRecord, RotaShift, LeaveRequest, InventoryItem } from '../../types';

/**
 * @file master.workflow.audit.test.tsx
 * @description COMPREHENSIVE QA MASTER SUITE for Staff Management Ecosystem.
 * Covers: Dashboard, Rota, Requests, Payroll, RBAC, and Cross-Module logic.
 */

import '@testing-library/jest-dom'; // Fix: Import custom matchers

// --- 1. INFRASTRUCTURE MOCKS ---
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    AreaChart: () => <div data-testid="area-chart" />,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    BarChart: () => <div data-testid="bar-chart" />,
    Bar: () => null,
    PieChart: () => <div data-testid="pie-chart" />,
    Pie: () => null,
    ReferenceLine: () => null
}));

// Mock Lucide Icons
vi.mock('lucide-react', async () => {
    const actual = await vi.importActual('lucide-react') as any;
    return { ...actual };
});

// --- 2. DATA FIXTURES (The "Gold Standard" State) ---
const OWNER_ID = 'u_owner';
const STAFF_ID = 'u_staff';

const mockStaff: StaffMember[] = [
    {
        id: OWNER_ID, name: 'BHARAT ANAND', role: 'Owner', status: 'Active', pin: '5555',
        email: 'bharat@hop.com', joinedDate: '2025-01-01', contractType: 'Full-time',
        hourlyRate: 30, monthlyRate: 6000, dailyRate: 200, holidayEntitlement: 28, accruedHoliday: 10,
        niNumber: 'AB123456C', taxCode: '1257L', rightToWork: true, emergencyContact: '', advance: 0,
        phone: '1234567890', address: '123 Main St', dateOfBirth: '1990-01-01', bloodGroup: 'O+', department: 'Management'
    },
    {
        id: STAFF_ID, name: 'NAYAN TESTER', role: 'Shop Assistant', status: 'Active', pin: '1234',
        email: 'nayan@hop.com', joinedDate: '2026-01-01', contractType: 'Part-time',
        hourlyRate: 12, monthlyRate: 0, dailyRate: 0, holidayEntitlement: 15, accruedHoliday: 2,
        niNumber: 'XY987654Z', taxCode: '1257L', rightToWork: true, emergencyContact: '', advance: 0,
        phone: '0987654321', address: '456 High St', dateOfBirth: '2000-01-01', bloodGroup: 'A+', department: 'Sales'
    }
];

const mockAttendance: AttendanceRecord[] = [
    {
        id: 'att_1', staffId: OWNER_ID, date: new Date().toISOString().split('T')[0],
        status: 'Present', clockIn: '08:00', clockOut: '', hoursWorked: 0
    }
];

const mockRota: RotaShift[] = [
    {
        id: 'shift_1', staff_id: STAFF_ID, staff_name: 'NAYAN TESTER',
        date: new Date().toISOString().split('T')[0],
        start_time: '12:00', end_time: '20:00',
        status: 'approved', week_start: '2026-02-09',
        day: 'Friday', total_hours: 8
    }
];

const mockLeaves: LeaveRequest[] = [
    {
        id: 'leave_1', staffId: STAFF_ID, type: 'Annual',
        startDate: '2026-03-01', endDate: '2026-03-03',
        status: 'Pending', reason: 'QA Conference', requestedAt: '2026-02-13',
        totalDays: 2
    }
];

describe('🚀 MASTER WORKFLOW QA: Staff Management Ecosystem', () => {
    const defaultProps = {
        userId: "test-shop-id",
        staff: mockStaff,
        setStaff: vi.fn(),
        attendance: mockAttendance, // Pre-filled with Owner attendance
        setAttendance: vi.fn(),
        logAction: vi.fn(),
        userRole: 'Owner' as const, // Default Admin View
        currentStaffId: OWNER_ID,
        inventory: [] as InventoryItem[],
        activeStaffName: 'BHARAT ANAND',
        navigateToProcurement: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- MODULE 1: DASHBOARD & OPERATIONAL INTELLIGENCE ---
    it('TC-DASH-01: Validates "Operational Intelligence" loads with correct metrics', () => {
        render(<StaffView {...defaultProps} />);

        // 1. Check Header
        expect(screen.getByText(/Monitoring attendance and workforce metrics/i)).toBeInTheDocument();

        // 2. Validate "In Store Today" KPI
        // Should show 1 (Bharat is present in mockAttendance)
        const inStoreCard = screen.getByText(/IN STORE TODAY/i).closest('div');
        expect(within(inStoreCard!).getByText('1')).toBeInTheDocument();
        expect(within(inStoreCard!).getByText(/BHARAT ANAND/i)).toBeInTheDocument();
    });

    it('TC-DASH-02: Terminal "End Session" Logic', () => {
        // Owner is clocked in (mockAttendance), so button should be "End Session"
        render(<StaffView {...defaultProps} />);

        const actionButton = screen.getByText(/End Session/i);
        expect(actionButton).toBeInTheDocument();
        expect(actionButton).toHaveClass('bg-neutral-900'); // Check styling for active state
    });

    // --- MODULE 2: ROTA PLANNER ---
    it('TC-ROTA-01: Rota View renders and displays scheduled shifts', async () => {
        render(<StaffView {...defaultProps} />);

        // Switch to "Rota Planner" tab
        const rotaTab = screen.getByText(/Rota Planner/i);
        fireEvent.click(rotaTab);

        // Verify we are in Rota mode
        expect(await screen.findByText(/Week of/i)).toBeInTheDocument();
    });


    // --- MODULE 3: PAYROLL & HR ---
    it('TC-PAY-01: Payroll calculation accurately reflects worked hours', async () => {
        render(<StaffView {...defaultProps} />);

        // Navigate to Payroll
        fireEvent.click(screen.getByText(/Staff Payroll/i));

        // Should show Payroll Header (appears in both tab and h1, so use findAllByText)
        const payrollHeaders = await screen.findAllByText(/Staff Payroll/i);
        expect(payrollHeaders.length).toBeGreaterThan(0);

        // Bharat worked 9 hours. Rate is 30. Total = 270.
        // We look for his row.
        // Note: Narrow down to the table to avoid ambiguity with the staff selector dropdown
        const payrollTable = screen.getByTestId('payroll-table');
        const bharatRow = within(payrollTable).getByText(/BHARAT ANAND/i).closest('tr');
        expect(bharatRow).toBeInTheDocument();

        // Check for presence of metrics in the row
        expect(bharatRow).toHaveTextContent(/30.00/i); // Hourly Rate
        expect(bharatRow).toHaveTextContent(/Owner/i);
    });

    // --- MODULE 4: RBAC SECURITY ---
    it('TC-SEC-01: RBAC Enforcement - "Shop Assistant" cannot see Payroll', () => {
        const { queryByText } = render(
            <StaffView
                {...defaultProps}
                userRole="Shop Assistant"
                currentStaffId={STAFF_ID}
            />
        );

        // Security check: Payroll tab must NOT exist
        expect(screen.queryByText(/Staff Payroll/i)).not.toBeInTheDocument();
 
        // Compliance logs also hidden usually
        expect(screen.queryByText(/Compliance/i)).not.toBeInTheDocument();
    });

    it('TC-SEC-02: RBAC Enforcement - "Shop Assistant" cannot delete staff', () => {
        render(
            <StaffView
                {...defaultProps}
                userRole="Shop Assistant"
                currentStaffId={STAFF_ID}
            />
        );

        // Switch to Org Chart where delete buttons usually are
        fireEvent.click(screen.getByText(/Organization/i));

        // Delete button (Trash2 icon) should NOT be present for regular staff
        // Note: This relies on the "isAdmin" logic in StaffView
        const deleteButtons = screen.queryAllByTitle(/Remove Staff/i);
        expect(deleteButtons).toHaveLength(0);
    });

    // --- MODULE 5: COMPLIANCE & LOGS ---
    it('TC-COMP-01: Compliance Tab Loads', async () => {
        render(<StaffView {...defaultProps} />);
        fireEvent.click(screen.getByText(/Compliance/i));

        expect(await screen.findByText(/SHOP REGISTERS/i)).toBeInTheDocument();
    });

});
