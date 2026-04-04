
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import StaffView from '../../components/StaffView';
import { StaffMember, AttendanceRecord, UserRole } from '../../types';
import * as firestoreLib from '../../lib/firestore';
import '@testing-library/jest-dom';

// Mock Recharts
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

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
    auth: { currentUser: { uid: 'test-admin-uid' } },
    db: {},
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    setDoc: vi.fn(),
    collection: vi.fn(),
    getDocs: vi.fn(),
    writeBatch: vi.fn(() => ({
        update: vi.fn(),
        commit: vi.fn(),
        delete: vi.fn(),
        set: vi.fn(),
    })),
    deleteDoc: vi.fn(),
}));

// --- Test Data ---
const mockStaff: StaffMember[] = [
    {
        id: '1', name: 'Bharat Anand', role: 'Owner', hourlyRate: 0, monthlyRate: 0, dailyRate: 0,
        status: 'Active', pin: '1111', loginBarcode: 'OWNER01', niNumber: 'QQ123456A', taxCode: '1257L',
        rightToWork: true, emergencyContact: 'Family', joinedDate: '2025-01-01', contractType: 'Full-time',
        holidayEntitlement: 28, accruedHoliday: 0, advance: 0, photo: '', address: '', phone: '', dateOfBirth: '',
        faceDescriptor: []
    },
    {
        id: '5', name: 'Gaurav Panchal', role: 'Manager', hourlyRate: 15, monthlyRate: 0, dailyRate: 0,
        status: 'Active', pin: '5555', loginBarcode: 'MGR01', niNumber: 'GP123456C', taxCode: '1257L',
        rightToWork: true, emergencyContact: 'Family', joinedDate: '2025-02-01', contractType: 'Full-time',
        holidayEntitlement: 28, accruedHoliday: 0, advance: 0, photo: '', address: '', phone: '', dateOfBirth: '',
        faceDescriptor: []
    }
];

describe('🛡️ Guardian Workflow: System-Wide Verification', () => {

    const setStaff = vi.fn();
    const setAttendance = vi.fn();
    const logAction = vi.fn();
    const navigateToProcurement = vi.fn();

    const renderView = (role: UserRole = 'Owner', currentId = '1') => {
        return render(
            <StaffView
                userId="test-shop-id"
                staff={mockStaff}
                setStaff={setStaff}
                attendance={[]}
                setAttendance={setAttendance}
                logAction={logAction}
                userRole={role}
                currentStaffId={currentId}
                inventory={[]}
                activeStaffName="Bharat Anand"
                navigateToProcurement={navigateToProcurement}
            />
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(firestoreLib, 'subscribeToLeaves').mockImplementation((uid, cb) => { cb([]); return () => { }; });
        vi.spyOn(firestoreLib, 'subscribeToRota').mockImplementation((uid, cb) => { cb([]); return () => { }; });
        vi.spyOn(firestoreLib, 'subscribeToTasks').mockImplementation((uid, cb) => { cb([]); return () => { }; });
    });

    it('GW-01: Calendar Filtering - Only show Percentage Staff', async () => {
        renderView();

        // Switch to Calendar tab
        const calendarTab = screen.getByTestId('tab-calendar');
        fireEvent.click(calendarTab);

        // In Team Roster mode, Bharat (0 rate) should be missing, Gaurav (15 rate) should be visible
        // We look for name.split(' ')[0] which is "Gaurav"
        await waitFor(() => {
            const rosterContainer = screen.getByRole('table');
            expect(within(rosterContainer).getByText(/Gaurav/i)).toBeInTheDocument();
            expect(within(rosterContainer).queryByText(/Bharat/i)).not.toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('GW-02: Quick Entry Modal - Back Button Functionality', async () => {
        renderView();

        // Open Quick Entry Modal (triggered by the '+' button in Master Register/Attendance controls)
        const addBtn = screen.getByText('+');
        fireEvent.click(addBtn);

        // Check if modal title appears
        await waitFor(() => {
            expect(screen.getByText(/Quick Entry/i)).toBeInTheDocument();
        });

        // Find "Back" button and click it
        const backBtn = screen.getByRole('button', { name: /Back/i });
        fireEvent.click(backBtn);

        // Modal should close
        await waitFor(() => {
            expect(screen.queryByText(/Quick Entry/i)).not.toBeInTheDocument();
        });
    });

    it('GW-03: Dashboard Integritiy - Metrics Reconciliation', () => {
        renderView();
        // Check "In Store Today" - with 0 attendance, it should be 0
        const inStoreCardTitle = screen.getByText(/In Store Today/i);
        const card = inStoreCardTitle.closest('.bg-white') as HTMLElement;
        expect(within(card).getByText('0')).toBeInTheDocument();
    });

});
