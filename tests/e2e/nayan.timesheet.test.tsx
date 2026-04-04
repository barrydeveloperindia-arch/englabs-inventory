
/**
 * @file nayan.attendance.test.tsx
 * @description Verifies Nayan's attendance (Time Sheet) data rendering for Rota Planning.
 * 
 * Based on User Request:
 * "I am giving you Nayan's time sheet for rota planning. Please update it and get it tested first."
 * 
 * Test Scenarios:
 * 1. Log in as Nayan (or Owner viewing Nayan)
 * 2. Verify "Monthly Activity Log" contains:
 *    - Feb 10, 2026: 09:00 - 15:00 (Working)
 *    - Feb 11, 2026: 09:00 - 15:00 (Working)
 *    - Feb 12, 2026: 09:00 - 15:00 (Working)
 */

import { render, screen, act, within, waitFor } from '@testing-library/react';
// @ts-ignore
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import App from '../../App';
import * as firestoreLib from '../../lib/firestore'; // Mock target

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({ currentUser: { uid: 'owner-uid' } })),
    onAuthStateChanged: vi.fn((auth, cb) => {
        // Authenticate as Nayan to view his own Monthly Log
        // User Role: Shop Assistant (ID 8)
        cb({ uid: '8', email: 'nayan@example.com' });
        return () => { };
    }),
    signOut: vi.fn()
}));

// Mock Firestore
vi.mock('../../lib/firebase', () => ({
    auth: {
        currentUser: { uid: '8' },
        onAuthStateChanged: vi.fn((cb: any) => { cb({ uid: '8' }); return () => { }; })
    },
    db: {}
}));
vi.mock('firebase/firestore', async (importOriginal) => {
    // @ts-ignore
    const actual = await importOriginal() as any;
    return {
        ...actual,
        getFirestore: vi.fn(() => ({})),
        collection: vi.fn((db, ...paths) => ({ _path: paths.join('/') })),
        query: vi.fn((coll) => ({ _path: coll._path })),
        where: vi.fn(() => ({})),
        orderBy: vi.fn(() => ({})),
        limit: vi.fn(() => ({})),
        onSnapshot: vi.fn((q, cb) => {
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
        doc: vi.fn((db, ...paths) => ({ _path: paths.join('/') })),
        setDoc: vi.fn(),
    }
});

vi.mock('../../lib/firestore', () => {
    // 1. Mock Staff - Including Nayan
    const mockStaff = [
        { id: '1', name: 'Bharat Anand', role: 'Owner', pin: '1111' },
        {
            id: '8',
            name: 'Nayan Kumar Godhani',
            role: 'Shop Assistant',
            pin: '8888',
            email: 'nayan@example.com',
            joinedDate: '2025-02-01',
            status: 'Active',
            photo: 'https://example.com/nayan.jpg'
        }
    ];

    // 2. Mock Attendance Data (The "Time Sheet" provided by User)
    // Dates: Feb 10, 11, 12, 2026.
    const mockAttendance = [
        {
            id: 'att-1',
            staffId: '8',
            date: '2026-02-10', // Tue
            clockIn: '09:00',
            clockOut: '15:00',
            status: 'Present',
            hoursWorked: 6.0
        },
        {
            id: 'att-2',
            staffId: '8',
            date: '2026-02-11', // Wed
            clockIn: '09:00',
            clockOut: '15:00', // Image says Time Out 03:00 PM
            status: 'Present',
            hoursWorked: 6.0
        },
        {
            id: 'att-3',
            staffId: '8',
            date: '2026-02-12', // Thu
            clockIn: '09:00',
            clockOut: '15:00',
            status: 'Present',
            hoursWorked: 6.0
        }
    ];

    return {
        subscribeToInventory: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToTransactions: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToStaff: vi.fn((uid, cb) => { cb(mockStaff); return () => { }; }),
        subscribeToAttendance: vi.fn((uid, cb) => { cb(mockAttendance); return () => { }; }), // <--- Injecting Data
        subscribeToLedger: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToSuppliers: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToBills: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToExpenses: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToPurchases: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToNotifications: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToShopSettings: vi.fn((uid, cb) => { cb({}); return () => { }; }),
        subscribeToDailyChecks: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToExpiryLogs: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToCleaningLogs: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToTasks: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToSalaries: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToRota: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToRotaPreferences: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToLeaves: vi.fn((uid, cb) => { cb([]); return () => { }; }),

        getStaffRef: vi.fn(() => ({ _path: 'staff' })),
        markNotificationRead: vi.fn(),
        addAttendanceRecord: vi.fn(),
        updateAttendanceRecord: vi.fn()
    };
});

// Helper to wait for splash
const waitForAppLoad = async () => {
    await act(async () => { vi.advanceTimersByTime(3500); });
    vi.useRealTimers();
};

// Set System Time to FEB 12, 2026 (Thursday) to match the timesheet context
const MOCK_DATE = new Date('2026-02-12T12:00:00');

describe('📋 Nayan Timesheet Verification', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(MOCK_DATE); // Use correct year/month
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('Verifies Nayans Attendance Log for Feb 10-12, 2026', async () => {
        render(<App />);
        await waitForAppLoad();

        // 1. Navigate to Staff View
        // (App defaults to Sales for Shop Assistant. Need to switch to Staff Management)
        const staffNav = screen.getByText(/Workforce/i);
        await act(async () => {
            staffNav.click();
        });

        // 2. "Monthly Activity Log" shows entries for the *current user*.
        // The mock auth returns Nayan's email, so App logs in as Nayan.
        // StaffView for non-admin/non-manager might only show "My Profile" or similar.
        // Assuming StaffView default content for normal staff includes "Monthly Activity Log".

        expect(screen.getByText(/Personnel Ledger/i)).toBeInTheDocument();

        // 3. Check for specific dates and hours

        // Row 1: Feb 12
        const rowThu = screen.getAllByRole('row').find(el => within(el as HTMLElement).queryByText(/Thu/i) && within(el as HTMLElement).queryByText(/12/i));
        expect(rowThu).toBeInTheDocument();

        // Row 2: Feb 11
        const rowWed = screen.getAllByRole('row').find(el => within(el as HTMLElement).queryByText(/Wed/i) && within(el as HTMLElement).queryByText(/11/i));
        expect(rowWed).toBeInTheDocument();

        // Row 3: Feb 10
        const rowTue = screen.getAllByRole('row').find(el => within(el as HTMLElement).queryByText(/Tue/i) && within(el as HTMLElement).queryByText(/10/i));
        expect(rowTue).toBeInTheDocument();

        // Check Hours Worked column (6.00h)
        const hoursCells = screen.getAllByText(/6\.00h/i);
        expect(hoursCells.length).toBeGreaterThanOrEqual(3);
    });
});
