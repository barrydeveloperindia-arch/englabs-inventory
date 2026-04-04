
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import StaffView from '../../components/StaffView';
import { StaffMember, AttendanceRecord, InventoryItem } from '../../types';
import '@testing-library/jest-dom';

// 1. Mock Recharts to avoid JSDOM SVG errors
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
    Cell: () => null,
    PieChart: () => <div data-testid="pie-chart" />,
    Pie: () => null,
    ReferenceLine: () => null,
}));

// 2. Mock Data Setup (Based on Screenshot Context)
const mockStaff: StaffMember[] = [
    {
        id: 's1',
        name: 'BHARAT ANAND',
        role: 'Owner',
        status: 'Active',
        pin: '5555',
        email: 'bharat@englabs.com',
        joinedDate: '2025-01-01',
        contractType: 'Full-time',
        niNumber: 'AB123456C',
        taxCode: '1250L',
        rightToWork: true,
        emergencyContact: '0123456789',
        monthlyRate: 5000,
        hourlyRate: 25,
        dailyRate: 200,
        advance: 0,
        holidayEntitlement: 28,
        accruedHoliday: 5,
    }
];

const mockAttendance: AttendanceRecord[] = [
    {
        id: 'a1',
        staffId: 's1',
        date: new Date().toISOString().split('T')[0],
        status: 'Present',
        clockIn: '11:00',
    }
];

const mockInventory: InventoryItem[] = [];

describe('🛡️ System Audit: Operational Intelligence Dashboard', () => {
    const dummyProps = {
        userId: "test-shop-id",
        staff: mockStaff,
        setStaff: vi.fn(),
        attendance: mockAttendance,
        setAttendance: vi.fn(),
        logAction: vi.fn(),
        userRole: 'Owner' as const,
        currentStaffId: 's1',
        inventory: mockInventory,
        activeStaffName: 'BHARAT ANAND',
        navigateToProcurement: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('AUDIT-UI-001: Should render the Operational Intelligence header and primary widgets', () => {
        render(<StaffView {...dummyProps} />);

        expect(screen.getByText(/Operational Intelligence/i)).toBeInTheDocument();
        expect(screen.getByText(/Monitoring attendance and workforce metrics/i)).toBeInTheDocument();
        expect(screen.getByText(/IN STORE TODAY/i)).toBeInTheDocument();
    });

    it('AUDIT-LOGIC-002: Headcount should sync with active attendance records', () => {
        render(<StaffView {...dummyProps} />);

        // Scope to "IN STORE TODAY" card to find the headcount "1"
        const inStoreMetric = screen.getByText(/IN STORE TODAY/i).closest('div');
        expect(inStoreMetric).toBeInTheDocument();
        expect(within(inStoreMetric!).getByText('1')).toBeInTheDocument();

        // Check for staff name
        expect(screen.getAllByText(/BHARAT ANAND/i).length).toBeGreaterThanOrEqual(1);
    });

    it('AUDIT-TERM-001: Terminal Interaction', () => {
        render(<StaffView {...dummyProps} />);

        // Find and click Terminal Toggle (🛂)
        const terminalToggle = screen.getByTestId('terminal-toggle');
        fireEvent.click(terminalToggle);

        // Verify Terminal Modal opens
        expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument();
        expect(screen.getByText(/Select Method/i)).toBeInTheDocument();
    });

    it('AUDIT-RBAC-001: Role-Based Visibility', () => {
        // Change role to Cashier and check if restricted tabs are gone
        render(<StaffView {...dummyProps} userRole="Cashier" />);

        // "Payroll & HR" is a tab for admins
        expect(screen.queryByText(/Payroll/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Compliance/i)).not.toBeInTheDocument();
    });
});
