
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../../App';

// --- STANDARD MOCKS ---
vi.mock('../../lib/firebase', () => ({
    auth: {
        onAuthStateChanged: (cb: any) => {
            cb({ uid: 'test-shop-id', email: 'owner@test.com' });
            return () => { };
        },
        currentUser: { uid: 'test-shop-id' }
    },
    db: { type: 'firestore' },
    storage: {}
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    doc: vi.fn(),
    query: vi.fn(q => q),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    getDocs: vi.fn(() => Promise.resolve({ docs: [], empty: true })),
    setDoc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    onSnapshot: vi.fn((q, cb) => {
        if (typeof cb === 'function') {
            cb({ empty: true, docs: [], docChanges: () => [], forEach: () => { } });
        }
        return () => { };
    }),
    writeBatch: vi.fn(() => ({
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn()
    })),
    increment: vi.fn(),
    getFirestore: vi.fn(() => ({})),
    serverTimestamp: vi.fn(() => new Date().toISOString()),
}));

vi.mock('../../lib/firestore', () => ({
    subscribeToStaff: (uid: any, cb: any) => { cb([{ id: 's1', name: 'Test Boss', role: 'Owner', status: 'Active', email: 'owner@test.com' }]); return () => { }; },
    subscribeToAttendance: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToNotifications: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToSuppliers: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToBills: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToPurchases: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToExpenses: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToShopSettings: (uid: any, cb: any) => { cb({ timings: {} }); return () => { }; },
    subscribeToRota: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToRotaPreferences: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToDailySales: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToInventory: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToTransactions: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToLeaves: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToDailyChecks: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToTasks: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToSalaries: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToLedger: (uid: any, cb: any) => { cb([]); return () => { }; },
    addLedgerEntry: vi.fn(),
    logAction: vi.fn(),
    processTransaction: vi.fn(),
    markNotificationRead: vi.fn(),
    addAttendanceRecord: vi.fn(),
    updateAttendanceRecord: vi.fn(),
}));

// Mock Notification System
vi.mock('../../components/NotificationProvider', () => ({
    useNotifications: () => ({ showToast: vi.fn() }),
    NotificationProvider: ({ children }: any) => <div>{children}</div>,
}));

describe('🗺️ Master Navigation: All Buttons & Folders', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('✅ should navigate to Sales, Inventory, and Staff views', async () => {
        render(<App initialShowSplash={false} initialLocked={false} />);

        // 1. Wait for Auth & Initial Load (Unlock Terminal)
        // In test mode, we'll assume the terminal unlocks and shows Sidebar

        await waitFor(() => {
            expect(screen.getByText(/Operational Intelligence/i)).toBeInTheDocument();
        }, { timeout: 5000 });

        // 2. Test: Go to Sales View (Point of Sale)
        const salesTab = screen.getByText(/Point of Sale/i);
        fireEvent.click(salesTab);
        expect(screen.getAllByPlaceholderText(/Search/i).length).toBeGreaterThan(1); // One in App, one in SalesView

        // 3. Test: Go to Inventory View
        const inventoryTab = screen.getByText(/Stock Console/i);
        fireEvent.click(inventoryTab);
        expect(screen.getByText(/Cloud Sync/i)).toBeDefined(); // Found in InventoryView

        // 4. Test: Go to Staff Management (Workforce)
        const staffTab = screen.getByText(/Workforce/i);
        fireEvent.click(staffTab);
        expect(screen.getByText(/Workforce Ledger/i)).toBeDefined(); // Found in StaffView
    });

    it('✅ should handle Mobile Sidebar toggle', async () => {
        // Resize window to mobile
        global.innerWidth = 375;
        global.dispatchEvent(new Event('resize'));

        render(<App initialShowSplash={false} initialLocked={false} />);

        // Find and click Mobile Menu Button (Lucide Menu Icon)
        const menuBtn = screen.getByTestId('mobile-menu-btn');
        fireEvent.click(menuBtn);

        // Verify Sidebar is Open
        expect(screen.getByText(/End Session/i)).toBeVisible();
    });
});
