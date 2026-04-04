
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import StaffView from '../../components/StaffView';
import * as firestoreHooks from '../../lib/firestore';

// --- MOCKS ---

vi.mock('react-router-dom', () => ({
    MemoryRouter: ({ children }: any) => children,
    useNavigate: () => vi.fn(),
    Link: ({ children }: any) => children,
    useLocation: () => ({ pathname: '/' }),
}));

vi.mock('../../lib/firebase', () => ({
    auth: { currentUser: { uid: 's1' } },
    db: {},
    storage: {}
}));

vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    BarChart: () => null,
    PieChart: () => null,
    AreaChart: () => null,
    LineChart: () => null,
    Bar: () => null,
    Pie: () => null,
    Area: () => null,
    Line: () => null,
    ReferenceLine: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    Cell: () => null,
}));

vi.mock('../../lib/firestore', () => ({
    subscribeToStaff: vi.fn(),
    subscribeToRota: vi.fn(),
    subscribeToRotaPreferences: vi.fn(),
    subscribeToAttendance: vi.fn(),
    subscribeToLeaves: vi.fn(),
    subscribeToTasks: vi.fn(),
    subscribeToNotifications: vi.fn(),
    subscribeToShopSettings: vi.fn(),
    logAction: vi.fn(),
    updateStaffMember: vi.fn(),
    addStaffMember: vi.fn(),
    deleteStaffMember: vi.fn(),
    getStaffDocRef: vi.fn(),
    saveRotaPreference: vi.fn(),
    updateLeaveRequest: vi.fn(),
    addLeaveRequest: vi.fn(),
    updateTask: vi.fn(),
    addNotification: vi.fn(),
}));

const mockStaffMember = {
    id: 's1',
    name: 'Alice Status',
    role: 'Cashier' as const,
    photo: '',
    status: 'Active' as const,
    pin: '0000',
    email: 'alice@test.com',
    phone: '123',
    hourlyRate: 10,
    monthlyRate: 0,
    advance: 0,
    contractType: 'Full-time' as const,
    niNumber: 'AB',
    taxCode: '1257L',
    rightToWork: true,
    address: '123',
    emergencyContact: 'Mom',
    startDate: '2023',
    joinedDate: '2023',
    dailyRate: 0,
    holidayEntitlement: 20,
    accruedHoliday: 0
};

describe('🛡️ Unit: Staff Status Final', () => {

    const todayStr = new Date().toISOString().split('T')[0];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(firestoreHooks.subscribeToStaff).mockImplementation((_, cb: any) => { cb([mockStaffMember]); return () => { }; });
        vi.mocked(firestoreHooks.subscribeToRota).mockImplementation((_, cb: any) => { cb([]); return () => { }; });
        vi.mocked(firestoreHooks.subscribeToRotaPreferences).mockImplementation((_, cb: any) => { cb([]); return () => { }; });
        // NOTE: Default returns empty. Each test may override.
        vi.mocked(firestoreHooks.subscribeToAttendance).mockImplementation((_, cb: any) => { cb([]); return () => { }; });
        vi.mocked(firestoreHooks.subscribeToLeaves).mockImplementation((_, cb: any) => { cb([]); return () => { }; });
        vi.mocked(firestoreHooks.subscribeToTasks).mockImplementation((_, cb: any) => { cb([]); return () => { }; });
        vi.mocked(firestoreHooks.subscribeToNotifications).mockImplementation((_, cb: any) => { cb([]); return () => { }; });
        vi.mocked(firestoreHooks.subscribeToShopSettings).mockImplementation((_, cb: any) => { cb({ timings: {} }); return () => { }; });
    });

    const renderView = (propsOverrides: any = {}) => {
        return render(
            <StaffView
                userRole="Manager"
                staff={[mockStaffMember]}
                setStaff={vi.fn()}
                attendance={propsOverrides.attendance || []}
                setAttendance={vi.fn()}
                inventory={[]}
                activeStaffName="Manager"
                currentStaffId="s1"
                logAction={vi.fn()}
                navigateToProcurement={vi.fn()}
                {...propsOverrides}
            />
        );
    };

    it('✅ Status: Staff in Store Today (Present)', async () => {
        const mockAttendance = [
            { id: 'a1', staffId: 's1', date: todayStr, clockIn: '09:00', clockOut: null, status: 'Present' },
        ];

        renderView({ attendance: mockAttendance });

        const registryTab = screen.getByTestId('tab-registry');
        fireEvent.click(registryTab);

        // Wait for Registry View to Mount
        await expect(screen.findByTestId('registry-view')).resolves.toBeInTheDocument();

        // Wait for Staff Row
        await expect(screen.findByTestId('staff-row-s1')).resolves.toBeInTheDocument();

        // Check for 'Live in Store' (formerly 'Present')
        const presentText = await screen.findByText(/Live in Store|Present/i, {}, { timeout: 5000 });
        expect(presentText).toBeInTheDocument();
    });

    it('📅 Status: Scheduled Today', async () => {
        const mockShifts = [
            { id: 'sh1', staff_id: 's1', date: todayStr, start_time: '09:00', end_time: '17:00', role: 'Cashier', status: 'published', week_start: '2026-02-02', total_hours: 8 },
        ];
        vi.mocked(firestoreHooks.subscribeToRota).mockImplementation((_, cb: any) => { cb(mockShifts); return () => { }; });

        renderView({ attendance: [] });

        const registryTab = screen.getByTestId('tab-registry');
        fireEvent.click(registryTab);

        await expect(screen.findByTestId('registry-view')).resolves.toBeInTheDocument();
        await expect(screen.findByTestId('staff-row-s1')).resolves.toBeInTheDocument();

        await waitFor(async () => {
            const timeText = await screen.findByTestId('status-scheduled');
            expect(timeText).toBeInTheDocument();
        }, { timeout: 10000 });
    });

    it('🏖️ Status: On Vacation (Annual Leave)', async () => {
        const mockLeaves = [{
            id: 'l1',
            staffId: 's1',
            type: 'Annual',
            startDate: todayStr,
            endDate: todayStr,
            status: 'Approved',
            reason: 'Holiday',
            requestedAt: '2024-01-01'
        }];
        vi.mocked(firestoreHooks.subscribeToLeaves).mockImplementation((_, cb: any) => { cb(mockLeaves); return () => { }; });
        renderView({ attendance: [] });

        const registryTab = screen.getByTestId('tab-registry');
        fireEvent.click(registryTab);

        await expect(screen.findByTestId('registry-view')).resolves.toBeInTheDocument();
        await expect(screen.findByTestId('staff-row-s1')).resolves.toBeInTheDocument();

        await waitFor(async () => {
            const badges = await screen.findByTestId('status-leave-annual');
            expect(badges).toBeInTheDocument();
        }, { timeout: 10000 });
    });

    it('🤒 Status: Unavailable / Sick', async () => {
        const mockLeaves = [{
            id: 'l2',
            staffId: 's1',
            type: 'Sick',
            startDate: todayStr,
            endDate: todayStr,
            status: 'Approved',
            reason: 'Flu',
            requestedAt: '2024-01-01'
        }];
        vi.mocked(firestoreHooks.subscribeToLeaves).mockImplementation((_, cb: any) => { cb(mockLeaves); return () => { }; });
        renderView({ attendance: [] });

        const registryTab = screen.getByTestId('tab-registry');
        fireEvent.click(registryTab);

        await expect(screen.findByTestId('registry-view')).resolves.toBeInTheDocument();
        await expect(screen.findByTestId('staff-row-s1')).resolves.toBeInTheDocument();

        await waitFor(async () => {
            const badges = await screen.findByTestId('status-leave-sick');
            expect(badges).toBeInTheDocument();
        }, { timeout: 10000 });
    });

});
