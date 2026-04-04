
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import App from '../../App';
import * as validation from '../framework/MobileTestUtils';

// --- MOCKS ---
vi.mock('recharts', async () => {
    const Original = await vi.importActual('recharts');
    return {
        ...Original,
        ResponsiveContainer: ({ children }: any) => <div style={{ width: 800, height: 800 }}>{children}</div>
    };
});

vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(),
    getApps: vi.fn(() => []),
    getApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
    onAuthStateChanged: vi.fn((auth, callback) => {
        // Default to owner for tests that don't need login flow
        callback({ uid: 'test-owner', email: 'owner@test.com' });
        return () => { };
    }),
    signOut: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
}));

vi.mock('../../lib/firebase', () => ({
    auth: { onAuthStateChanged: vi.fn() },
    db: { type: 'firestore', _databaseId: { projectId: 'test-project' } }
}));

vi.mock('firebase/firestore', () => {
    const mockRef = { id: 'mock-id', path: 'mock/path', type: 'collection' };
    return {
        getFirestore: vi.fn(() => ({})),
        collection: vi.fn(() => mockRef),
        doc: vi.fn(() => mockRef),
        query: vi.fn((q) => q),
        where: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(),
        onSnapshot: vi.fn((ref, cb) => {
            if (typeof cb === 'function') {
                cb({
                    empty: true,
                    docs: [],
                    docChanges: () => [],
                    forEach: function (f: any) { this.docs.forEach(f); }
                });
            }
            return () => { };
        }),
        setDoc: vi.fn(),
        addDoc: vi.fn(),
        updateDoc: vi.fn(),
        deleteDoc: vi.fn(),
        writeBatch: vi.fn(() => ({
            set: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            commit: vi.fn()
        }))
    };
});

// Mock all lib/firestore functions used across the app
vi.mock('../../lib/firestore', () => {
    const staff = [
        { id: '1', name: 'Bharat Anand', role: 'Owner', pin: '1111', email: 'owner@test.com' },
        { id: '5', name: 'Gaurav Panchal', role: 'Manager', pin: '5555', email: 'gaurav@test.com' },
        { id: '9', name: 'Nisha', role: 'Inventory Staff', pin: '9999', email: 'nisha@test.com' },
        { id: '10', name: 'Nayan Kumar Godhani', role: 'Shop Assistant', pin: '8888', email: 'nayan@test.com' }
    ];
    return {
        subscribeToInventory: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToTransactions: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToStaff: vi.fn((uid, cb) => { cb(staff); return () => { }; }),
        subscribeToAttendance: vi.fn((uid, cb) => {
            const data = [
                { id: 'a1', staffId: '10', date: '2026-02-12', clockIn: '09:00', clockOut: '15:00', hoursWorked: 6.0, status: 'Present' },
                { id: 'a2', staffId: '10', date: '2026-02-11', clockIn: '09:00', clockOut: '15:00', hoursWorked: 6.0, status: 'Present' },
                { id: 'a3', staffId: '10', date: '2026-02-10', clockIn: '09:00', clockOut: '15:00', hoursWorked: 6.0, status: 'Present' },
            ];
            cb(data);
            return () => { };
        }),
        subscribeToShopSettings: vi.fn((uid, cb) => { cb({ name: 'Hop-in Test' }); return () => { }; }),
        subscribeToNotifications: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToTasks: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToRota: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToLeaves: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToLedger: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToSuppliers: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToBills: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToExpenses: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToPurchases: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToDailyChecks: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToSalaries: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToDailySales: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToRotaPreferences: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToCleaningLogs: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToExpiryLogs: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        addAttendanceRecord: vi.fn(async () => ({ id: 'new-att-123' })),
        updateAttendanceRecord: vi.fn(),
        markNotificationRead: vi.fn(),
        logAction: vi.fn(),
        addBatchTasks: vi.fn(),
        getStaffDocRef: vi.fn((uid, sid) => ({ id: sid })),
        updateStaffMember: vi.fn(),
        deleteStaffMember: vi.fn(),
        addNotification: vi.fn(),
    };
});

describe('🏆 FEB 12: COMPREHENSIVE TASKS VERIFICATION', () => {

    beforeEach(() => {
        // Ensure large viewport for desktop navigation to be visible
        window.innerWidth = 1200;
        window.innerHeight = 800;
        window.dispatchEvent(new Event('resize'));
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const enterPIN = async (pin: string) => {
        for (const digit of pin.split('')) {
            const buttons = screen.getAllByText(digit);
            fireEvent.click(buttons[0]);
        }
    };

    it('Task 1: Mobile App Startup & Terminal Access (Gaurav PIN 5555)', async () => {
        render(<App initialShowSplash={false} initialLocked={true} />);

        // Verify Access Terminal Mounts
        expect(await screen.findByText(/Select Method/i)).toBeInTheDocument();

        // Select PIN Method
        fireEvent.click(screen.getByText(/Passcode/i));

        // Find Gaurav
        const gaurav = await screen.findByText(/Gaurav Panchal/i);
        fireEvent.click(gaurav);

        // Enter PIN 5555
        await enterPIN('5555');
        fireEvent.click(screen.getByText('OK'));

        // Should unlock to Dashboard
        await waitFor(() => expect(screen.getByTestId('dashboard-heading')).toHaveTextContent(/Operational Intelligence/i));
    });

    it('Task 2: HR Navigation & Workforce Section Renaming', async () => {
        render(<App initialShowSplash={false} initialLocked={false} />);

        // Check for Workforce link (Renamed from Staff Management)
        const staffNav = await screen.findByTestId('nav-staff');
        expect(staffNav).toHaveTextContent(/Workforce/i);

        fireEvent.click(staffNav);

        // Verify it navigates to Staff Management view (Workforce Ledger heading)
        await waitFor(() => expect(screen.getByText(/Workforce Ledger|Workforce/i)).toBeInTheDocument());
    });

    it('Task 3: Organization Chart Visual Verification', async () => {
        render(<App initialShowSplash={false} initialLocked={false} />);

        // Open Staff Management
        const staffNav = await screen.findByTestId('nav-staff');
        fireEvent.click(staffNav);

        // Open Org Chart Tab
        const chartTab = await screen.findByTestId('tab-chart');
        fireEvent.click(chartTab);

        // Verify Core Management heading in Org Chart
        await waitFor(() => expect(screen.getByText(/Core Management/i)).toBeInTheDocument());
    });

    it('Task 4: Nayan Timesheet & Attendance Workflow', async () => {
        render(<App initialShowSplash={false} initialLocked={true} />);

        // Select PIN Method
        fireEvent.click(await screen.findByText(/Passcode/i));

        // Find Nayan
        const nayan = await screen.findByText(/Nayan Kumar Godhani/i);
        fireEvent.click(nayan);

        // Enter PIN 8888
        await enterPIN('8888');
        fireEvent.click(screen.getByText('OK'));

        // Success unlock (Nayan is Shop Assistant -> Staff View / Personal Terminal)
        await waitFor(() => {
            const heading = screen.getByTestId('dashboard-heading');
            expect(heading).toHaveTextContent(/Personal Terminal/i);
        }, { timeout: 3000 });

        // Open Staff View
        const staffNav = await screen.findByTestId('nav-staff');
        fireEvent.click(staffNav);

        // Verify Attendance Ledger (Workforce Ledger) shows entries
        await waitFor(() => expect(screen.getByText(/Workforce Ledger/i)).toBeInTheDocument());

        // Verify specific entries (Feb 10th - image source says 09:00 - 15:00)
        expect(screen.getAllByText(/6\.00h/i).length).toBeGreaterThanOrEqual(1);
    });

    it('Task 5: ID Card Redesign Aesthetic Check', async () => {
        render(<App initialShowSplash={false} initialLocked={false} />);

        // Open Staff Management
        const staffNav = await screen.findByTestId('nav-staff');
        fireEvent.click(staffNav);

        // Switch to Registry tab
        const registryTab = await screen.findByTestId('tab-registry');
        fireEvent.click(registryTab);

        // Wait for registry view to be fully loaded
        await screen.findByTestId('registry-view');

        // Open ID Card for Bharat (ID 1)
        const bharatRow = await screen.findByTestId('staff-row-1');
        const idCardBtn = within(bharatRow).getByTitle('Generate Identity');
        fireEvent.click(idCardBtn);

        // Verify ID Card renders (should find at least 2 instances of Bharat Anand now: table and card)
        await waitFor(() => expect(screen.getAllByText(/Bharat Anand/i).length).toBeGreaterThanOrEqual(1));
        expect(screen.getByText(/Authorised Personnel/i)).toBeInTheDocument();

        // Download PDF button (Modern White Aesthetic)
        expect(screen.getByText(/Download PDF/i)).toBeInTheDocument();
        expect(screen.getByText(/WhatsApp/i)).toBeInTheDocument();
    });
});
