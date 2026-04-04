import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import App from '../../App';
import * as validation from '../framework/MobileTestUtils';
import * as Firestore from '../../lib/firestore';

// Hoisted state for Auth only
const { authState } = vi.hoisted(() => ({
    authState: { user: { uid: 'owner-123', email: 'owner@test.com' } }
}));

// Mock Recharts
vi.mock('recharts', async () => {
    const Original = await vi.importActual('recharts');
    return {
        ...Original,
        ResponsiveContainer: ({ children }: any) => <div style={{ width: 800, height: 800 }}>{children}</div>
    };
});

// Mock Auth
vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(),
    onAuthStateChanged: vi.fn((auth, callback) => { callback(authState.user); return () => { }; }),
    signOut: vi.fn()
}));

vi.mock('../../lib/firebase', () => ({
    auth: { currentUser: { uid: 'owner-123', email: 'owner@test.com' } },
    db: {}
}));

// Mock lib/firestore with Local State and Helper Exports
vi.mock('../../lib/firestore', () => {
    const mockStaff = [
        { id: '1', name: 'John Cashier', role: 'Cashier', pin: '1234', email: 'cashier@test.com' },
        { id: '2', name: 'Jane Owner', role: 'Owner', pin: '9999', email: 'owner@test.com' },
        { id: '3', name: 'Mike Manager', role: 'Manager', pin: '5678', email: 'manager@test.com' }
    ];
    const mockInventory = [
        { id: 'milk', name: 'Whole Milk', price: 1.50, stock: 20, category: 'Dairy', barcode: '111', brand: 'Fresh', sku: 'MILK-001', vatRate: 0, costPrice: 0.80, packSize: '1L' },
        { id: 'bread', name: 'Sourdough', price: 2.80, stock: 10, category: 'Bakery', barcode: '222', brand: 'Baker', sku: 'BREAD-001', vatRate: 0, costPrice: 1.20, packSize: '1' }
    ];

    const transactions: any[] = [];
    const attendance: any[] = [];

    return {
        subscribeToInventory: vi.fn((uid, cb) => { cb(mockInventory); return () => { }; }),
        subscribeToTransactions: vi.fn((uid, cb) => { cb(transactions); return () => { }; }),
        subscribeToStaff: vi.fn((uid, cb) => { cb(mockStaff); return () => { }; }),
        subscribeToAttendance: vi.fn((uid, cb) => { cb(attendance); return () => { }; }),
        subscribeToShopSettings: vi.fn((uid, cb) => { cb({}); return () => { }; }),
        subscribeToLedger: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToNotifications: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToSuppliers: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToBills: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToExpenses: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToPurchases: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToDailyChecks: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToExpiryLogs: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToCleaningLogs: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToTasks: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToSalaries: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToRota: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToRotaPreferences: vi.fn((uid, cb) => { cb([]); return () => { }; }),
        subscribeToLeaves: vi.fn((uid, cb) => { cb([]); return () => { }; }),

        processTransaction: vi.fn((uid, tx) => { transactions.push(tx); return Promise.resolve(); }),
        addLedgerEntry: vi.fn(() => Promise.resolve()),
        addAttendanceRecord: vi.fn(() => Promise.resolve()),
        updateAttendanceRecord: vi.fn(() => Promise.resolve()),
        markNotificationRead: vi.fn(() => Promise.resolve()),
        addAuditEntry: vi.fn(() => Promise.resolve()),

        getStaffRef: vi.fn(() => ({ _path: 'staff' })),

        // Testing Helpers
        getTransactions: () => transactions,
        resetMockState: () => { transactions.length = 0; attendance.length = 0; }
    };
});

// Mock Firestore (keeping it for context-aware path handling if needed elsewhere)
vi.mock('firebase/firestore', () => {
    return {
        getFirestore: vi.fn(() => ({})),
        collection: vi.fn((db, ...paths) => ({ _path: paths.join('/') })),
        query: vi.fn((coll) => ({ _path: coll._path })),
        where: vi.fn(() => ({})),
        orderBy: vi.fn(() => ({})),
        limit: vi.fn(() => ({})),
        doc: vi.fn((db, ...paths) => ({ _path: paths.join('/') })),
        setDoc: vi.fn(),
        addDoc: vi.fn(),
        updateDoc: vi.fn(),
        writeBatch: vi.fn(() => ({ set: vi.fn(), update: vi.fn(), commit: vi.fn() })),
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
        deleteDoc: vi.fn(),
        serverTimestamp: vi.fn(() => new Date().toISOString()),
        increment: vi.fn(),
        getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
        getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] }))
    };
});

describe('📱 Comprehensive Mobile Workflow Suite', () => {
    beforeEach(() => {
        validation.resizeWindow(validation.MOBILE_VIEWPORTS.IPHONE_14_PRO.width, validation.MOBILE_VIEWPORTS.IPHONE_14_PRO.height);
        if ((Firestore as any).resetMockState) {
            (Firestore as any).resetMockState();
        }
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const setupAppAndUnlock = async (staffName: string, pin: string) => {
        render(<App initialShowSplash={false} initialLocked={true} />);
        await waitFor(() => expect(screen.getByText(/Start \/ Unlock/i)).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Start \/ Unlock/i));
        fireEvent.click(screen.getByText(/Passcode/i)); // Intent selection

        await waitFor(() => expect(screen.getByText(staffName)).toBeInTheDocument());
        fireEvent.click(screen.getByText(staffName));
        for (const digit of pin) {
            fireEvent.click(screen.getByRole('button', { name: digit }));
        }
        fireEvent.click(screen.getByText('OK'));
        await waitFor(() => expect(screen.queryByText(/Secure Entry Point/i)).not.toBeInTheDocument());
    };

    it('Workflow: Owner Login -> Dashboard -> Navigation -> Dead End Check', async () => {
        await setupAppAndUnlock('Jane Owner', '9999');
        await screen.findByRole('heading', { name: /Operational Intelligence/i });
        await waitFor(() => {
            expect(screen.getByText(/Total Gross Revenue/i)).toBeInTheDocument();
        });

        const menuBtns = screen.getAllByLabelText(/Open Menu/i);
        fireEvent.click(menuBtns[0]);
        fireEvent.click(screen.getByTestId("nav-staff"));
        await waitFor(() => expect(screen.getByText(/John Cashier/i)).toBeInTheDocument());

        const menuBtns2 = screen.getAllByLabelText(/Open Menu/i);
        fireEvent.click(menuBtns2[0]);
        fireEvent.click(screen.getByTestId("nav-dashboard"));
        await waitFor(() => {
            expect(screen.getByText(/Total Gross Revenue/i)).toBeInTheDocument();
        });
    });

    it('Workflow: Cashier Login -> Sales -> Add Item -> Checkout (Data Verification)', async () => {
        await setupAppAndUnlock('John Cashier', '1234');
        const searchInput = screen.getByPlaceholderText(/Scan \/ Search Assets.../i);
        fireEvent.change(searchInput, { target: { value: 'Milk' } });

        await waitFor(() => expect(screen.getAllByText(/Milk/i)[0]).toBeInTheDocument());
        fireEvent.click(screen.getAllByText(/Milk/i)[0]);

        expect(screen.getAllByText(/£1.50/i)[0]).toBeInTheDocument();

        const payBtn = screen.getAllByText('Cash')[0];
        fireEvent.click(payBtn);

        await waitFor(() => expect(screen.getByText(/THANK YOU/i)).toBeInTheDocument());

        const closeReceiptBtn = screen.getByText(/Close/i);
        fireEvent.click(closeReceiptBtn);

        await waitFor(() => {
            const txs = (Firestore as any).getTransactions ? (Firestore as any).getTransactions() : [];
            expect(txs.length).toBeGreaterThan(0);
        });

        const lastTx = (Firestore as any).getTransactions()[0];
        expect(lastTx.items[0].name).toBe('Whole Milk');
        expect(lastTx.total).toBe(1.50);
    });

    it('Workflow: Wrong PIN Entry -> Error Feedback -> Retry', async () => {
        render(<App initialShowSplash={false} initialLocked={true} />);
        await waitFor(() => expect(screen.getByText(/Start \/ Unlock/i)).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Start \/ Unlock/i));
        fireEvent.click(screen.getByText(/Passcode/i));

        await waitFor(() => expect(screen.getByText('John Cashier')).toBeInTheDocument());
        fireEvent.click(screen.getByText('John Cashier'));

        fireEvent.click(screen.getByRole('button', { name: '0' }));
        fireEvent.click(screen.getByRole('button', { name: '0' }));
        fireEvent.click(screen.getByRole('button', { name: '0' }));
        fireEvent.click(screen.getByRole('button', { name: '0' }));
        fireEvent.click(screen.getByText('OK'));

        await waitFor(() => expect(screen.getByText(/Invalid/i)).toBeInTheDocument());
        expect(screen.queryByText(/Basket Empty/i)).not.toBeInTheDocument();

        const clearBtn = screen.getByText('CLR');
        fireEvent.click(clearBtn);

        fireEvent.click(screen.getByRole('button', { name: '1' }));
        fireEvent.click(screen.getByRole('button', { name: '2' }));
        fireEvent.click(screen.getByRole('button', { name: '3' }));
        fireEvent.click(screen.getByRole('button', { name: '4' }));
        fireEvent.click(screen.getByText('OK'));

        await waitFor(() => expect(screen.queryByText(/Secure Entry Point/i)).not.toBeInTheDocument());
    });

    it('Workflow: Inventory -> Add Item Modal -> Cancel -> Verify Back at Inventory', async () => {
        await setupAppAndUnlock('Jane Owner', '9999');
        const menuBtns = screen.getAllByLabelText(/Open Menu/i);
        fireEvent.click(menuBtns[0]);
        fireEvent.click(screen.getByTestId("nav-inventory"));

        await waitFor(() => expect(screen.getByText('+')).toBeInTheDocument());
        const addBtn = screen.getByText('+');
        fireEvent.click(addBtn);

        await waitFor(() => expect(screen.getByText(/Asset Master Registry/i)).toBeInTheDocument());

        const closeBtn = screen.getByText('✕');
        fireEvent.click(closeBtn);

        await waitFor(() => expect(screen.queryByText(/Asset Master Registry/i)).not.toBeInTheDocument());
        expect(screen.getByText('+')).toBeInTheDocument();
    });
});
