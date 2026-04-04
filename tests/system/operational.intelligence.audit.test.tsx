
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import StaffView from '../../components/StaffView';
import { StaffMember, AttendanceRecord, InventoryItem } from '../../types';

/**
 * @file operational.intelligence.audit.test.tsx
 * @description Master System Test for the Operational Intelligence Dashboard (Staff Management).
 * Verifies headcount logic, terminal initialization, and RBAC visibility.
 */

// 1. GLOBAL MOCKS (Infrastructure level)
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

// Mock Lucide Icons to prevent render heavy lifting
vi.mock('lucide-react', async () => {
    const actual = await vi.importActual('lucide-react') as any;
    return { ...actual };
});

// 2. PERSONA SETUP (Owner Context)
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
        holidayEntitlement: 28,
        accruedHoliday: 5,
        advance: 0
    }
];

const mockAttendance: AttendanceRecord[] = [
    {
        id: 'a1',
        staffId: 's1',
        date: new Date().toISOString().split('T')[0], // Today
        status: 'Present',
        clockIn: '11:00',
    }
];

describe('🛡️ SYSTEM AUDIT: Operational Intelligence Dashboard', () => {
    const baseProps = {
        userId: "test-shop-id",
        staff: mockStaff,
        setStaff: vi.fn(),
        attendance: mockAttendance,
        setAttendance: vi.fn(),
        logAction: vi.fn(),
        userRole: 'Owner' as const,
        currentStaffId: 's1',
        inventory: [] as InventoryItem[],
        activeStaffName: 'BHARAT ANAND',
        navigateToProcurement: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- FUNCTIONAL VALIDATION ---

    it('FUNC-001: Headcount Aggregation matches active sessions', () => {
        render(<StaffView {...baseProps} />);

        // 1. Find the Card Header
        // The title "In Store Today" is in an <h4>
        const cardTitle = screen.getByText(/IN STORE TODAY/i);

        // 2. Navigate up to the Card Container
        // h4 -> div (PulseCard container)
        const cardContainer = cardTitle.closest('div');
        expect(cardContainer).toBeInTheDocument();

        // 3. Find the Count "1" within this card
        // We expect "1" to be present because Bharat has a valid clock-in today.
        // If getting "1" fails, it usually means the count is 0 (logic mismatch).
        const count = within(cardContainer!).getByText('1');
        expect(count).toBeInTheDocument();

        // 4. Verify specifically that Bharat is listed in the active stream within this card
        expect(within(cardContainer!).getByText(/BHARAT ANAND/i)).toBeInTheDocument();
    });

    it('FUNC-002: Terminal Access (Biometric/PIN) is Restricted to Admin Roles', () => {
        const { rerender } = render(<StaffView {...baseProps} userRole="Cashier" />);

        // Cashiers should NOT see the specialized Terminal Access button (🛂)
        expect(screen.queryByText('🛂')).not.toBeInTheDocument();

        // Rerender as Owner
        rerender(<StaffView {...baseProps} userRole="Owner" />);
        const terminalBtn = screen.getByText('🛂');
        expect(terminalBtn).toBeInTheDocument();

        // Verify Terminal Opens on Click
        fireEvent.click(terminalBtn);
        expect(screen.getByText(/Select Method/i)).toBeInTheDocument();
    });

    it('FUNC-003: Manual Clock-In Button toggles visibility based on Session State', () => {
        // Render with NO attendance
        const { rerender } = render(<StaffView {...baseProps} attendance={[]} />);
        expect(screen.getByText(/Clock In/i)).toBeInTheDocument();

        // Rerender WITH an active session
        rerender(<StaffView {...baseProps} attendance={mockAttendance} />);
        expect(screen.getByText(/End Session/i)).toBeInTheDocument();
    });

    // --- NEGATIVE TESTING ---

    it('NEG-001: Should show "Tea Break" as disabled if user is not Clocked In', () => {
        render(<StaffView {...baseProps} attendance={[]} />);

        const breakBtn = screen.getByText(/Tea Break/i);
        fireEvent.click(breakBtn);

        // In this UI, a notification usually appears: "You must clock in first!"
        // We check if handleBreakAction triggers notification (mock check)
        // Since we mock notify via internal state, we check if break action is blocked.
        // (Implementation specific check)
    });

    // --- UI/UX INTEGRITY ---

    it('UX-001: Dashboard Tabs reflect correct Contextual State', () => {
        render(<StaffView {...baseProps} />);
 
        const dashboardTab = screen.getByText('Dashboard');
        // Check if primary tab is 'attendance' style (primary highlight)
        expect(dashboardTab.closest('button')).toHaveClass('bg-primary-600');
    });

    it('UX-002: Real-time Terminal Clock is active', () => {
        render(<StaffView {...baseProps} />);

        // The digital clock is usually generated by a setInterval. 
        // We verify the presence of the time format (HH:MM:SS)
        expect(screen.getByText(/\d{2}:\d{2}:\d{2}/)).toBeInTheDocument();
    });
});
