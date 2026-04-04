
/**
 * @file staff.attendance.mobile.test.tsx
 * @description End-to-End Test for Mobile Attendance Workflows (Clock-In / Clock-Out)
 * @author Antigravity
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import App from '../../App';
import * as validation from '../framework/MobileTestUtils';

// --- SHARED STATE ---
const { authState, dbState } = vi.hoisted(() => ({
    authState: { user: { uid: 'owner-123', email: 'owner@test.com' } },
    dbState: {
        attendance: [] as any[],
        transactions: [] as any[]
    }
}));

// --- MOCKS ---

vi.mock('recharts', async () => {
    const Original = await vi.importActual('recharts');
    return {
        ...Original,
        ResponsiveContainer: ({ children }: any) => <div style={{ width: 800, height: 800 }}>{children}</div>
    };
});

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(),
    onAuthStateChanged: vi.fn((auth, callback) => {
        callback(authState.user);
        return () => { };
    }),
    signOut: vi.fn()
}));

vi.mock('../../lib/firebase', () => ({
    auth: {
        currentUser: { uid: 'attendance-user' },
        onAuthStateChanged: vi.fn((cb: any) => { cb({ uid: 'attendance-user' }); return () => { }; })
    },
    db: {}
}));

vi.mock('../../lib/firestore', () => {
    const mockStaff = [
        { id: '1', name: 'John Cashier', role: 'Cashier', pin: '1234', email: 'cashier@test.com', status: 'Active' },
        { id: '2', name: 'Jane Owner', role: 'Owner', pin: '9999', email: 'owner@test.com', status: 'Active' }
    ];

    return {
        subscribeToStaff: vi.fn((uid, cb) => { cb(mockStaff); return () => { }; }),
        subscribeToAttendance: vi.fn((uid, cb) => { cb(dbState.attendance); return () => { }; }),
        subscribeToInventory: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToTransactions: vi.fn((uid, cb) => { cb(dbState.transactions); return () => { }; }),
        subscribeToShopSettings: vi.fn((uid, cb) => { cb({}); return () => { }; }),
        subscribeToNotifications: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToLedger: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToSuppliers: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToBills: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToExpenses: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToPurchases: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToDailyChecks: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToTasks: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToSalaries: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToRota: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToRotaPreferences: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToLeaves: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToDailySales: vi.fn((uid, cb) => { cb([]); return () => { }; }),

        addAttendanceRecord: vi.fn(async (uid, data) => {
            const newId = `att-${Date.now()}`;
            dbState.attendance.push({ ...data, id: newId });
            return { id: newId };
        }),
        updateAttendanceRecord: vi.fn(async (uid, id, data) => {
            const record = dbState.attendance.find(a => a.id === id);
            if (record) Object.assign(record, data);
        }),
        logAudit: vi.fn(),
        markNotificationRead: vi.fn(),
        addLedgerEntry: vi.fn()
    };
});

// Mock Html5Qrcode
vi.mock('html5-qrcode', () => ({
    Html5QrcodeScanner: vi.fn(),
    Html5Qrcode: vi.fn(() => ({
        start: vi.fn(),
        stop: vi.fn(),
        clear: vi.fn()
    }))
}));

// Mock SplashScreen (safety net)
vi.mock('../../components/SplashScreen', () => ({
    default: () => null
}));

describe('⏰ Mobile Attendance & Timekeeping Suite', () => {

    beforeEach(() => {
        validation.resizeWindow(validation.MOBILE_VIEWPORTS.IPHONE_14_PRO.width, validation.MOBILE_VIEWPORTS.IPHONE_14_PRO.height);
        dbState.attendance = [];

        // Use Fake Timers ONLY for the Date object (to mock time)
        // Leave setTimeout, setInterval, etc. as Real Timers so waitFor() works correctly
        vi.useFakeTimers({
            toFake: ['Date']
        });
        vi.setSystemTime(new Date('2026-02-10T09:00:00Z'));
    });

    afterEach(() => {
        // No pending timers to run if we aren't faking them
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    const loadApp = async (expectedAttendanceCount = 0) => {
        render(<App initialShowSplash={false} initialLocked={true} />);

        // Wait for Staff Sync
        await waitFor(() => expect(screen.getByTestId('staff-sync-count').textContent).not.toBe('0'), { timeout: 10000 });
        
        // Wait for Attendance Sync (If needed)
        await waitFor(() => expect(screen.getByTestId('attendance-sync-count').textContent).toBe(String(expectedAttendanceCount)), { timeout: 10000 });

        // Wait for Access Terminal
        await waitFor(() => expect(screen.getByText(/Select Method/i)).toBeTruthy(), { timeout: 10000 });
    };

    it('Scenario 1: Unlock without Auto Clock-In', async () => {
        await loadApp();

        // 1. Select Intent: "Start / Unlock" (Default)
        const startBtn = screen.getByText(/Start \/ Unlock/i);
        fireEvent.click(startBtn);

        // 2. Select Method: PIN (Passcode)
        const pinModeBtn = screen.getByText(/Passcode/i);
        fireEvent.click(pinModeBtn);

        const staffEntry = await screen.findByText(/John Cashier/i);
        fireEvent.click(staffEntry);

        // Enter PIN: 1234
        // Use getAllByText and pick the one with button character if possible, or just use a more specific query
        const clickDigit = (d: string) => {
            fireEvent.click(screen.getByTestId('pin-pad-' + d));
        };

        clickDigit('1');
        clickDigit('2');
        clickDigit('3');
        clickDigit('4');

        // "Current Order" is not in SalesView, but "basket-empty-msg" or "Scan / Search Assets..." is.
        await screen.findByTestId('basket-empty-msg', {}, { timeout: 5000 });

        // NO ATTENDANCE RECORD should be created automatically
        expect(dbState.attendance.length).toBe(0);
    });

    it('Scenario 2: Clock-Out (End Shift) Updates Record', async () => {
        // Mock time BEFORE calculating todayStr for consistent matching
        vi.setSystemTime(new Date('2026-02-10T17:00:00Z'));
        const todayStr = new Date().toISOString().split('T')[0];

        dbState.attendance.push({
            id: 'existing-shift-1',
            staffId: '1',
            date: todayStr,
            clockIn: '09:00',
            status: 'Present'
        });

        await loadApp(1);

        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });

        // 1. Select Intent: "End Shift"
        const endShiftBtn = await screen.findByText(/End Shift/i, {}, { timeout: 5000 });
        fireEvent.click(endShiftBtn);

        // 2. Select Method: PIN (Passcode)
        const passwordBtn = await screen.findByText(/Passcode/i);
        fireEvent.click(passwordBtn);

        const staffEntry = await screen.findByTestId('staff-select-1');
        fireEvent.click(staffEntry);

        const clickDigit = (d: string) => {
            fireEvent.click(screen.getByTestId('pin-pad-' + d));
        };

        clickDigit('1');
        clickDigit('2');
        clickDigit('3');
        clickDigit('4');

        // Wait for the alert - Auto-submit will trigger it
        await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Goodbye')), { timeout: 10000 });

        expect(dbState.attendance.length).toBe(1);
        expect(dbState.attendance[0].clockOut).toBeDefined();
    });
});
