import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import SalesView from '../../components/SalesView';

/**
 * 🛒 SMOKE TEST: SALES VIEW
 * ------------------------------------------------------------------
 * "The Money Maker"
 * 
 * Objective: Verify that the Point of Sale (POS) interface renders correctly.
 * Critical Checkpoints:
 * 1. Product Grid Loading
 * 2. Cart Panel Existence
 * 3. Payment Controls
 */

// --- MOCKS ---

const mockStaff = [{
    id: 'test_user',
    name: 'Test User',
    role: 'Cashier' as any,
    photo: '',
    status: 'Active' as any,
    pin: '1234',
    hourlyRate: 10,
    monthlyRate: 0,
    advance: 0,
    email: 't@t.com',
    contractType: 'Full-Time' as any,
    niNumber: 'AB123456C',
    taxCode: '1257L',
    rightToWork: true,
    address: '123 St',
    emergencyContact: 'Mom',
    startDate: '2023-01-01',
    joinedDate: '2023-01-01',
    dailyRate: 0,
    holidayEntitlement: 28,
    accruedHoliday: 0,
    phone: '123456'
}];

vi.mock('../../lib/firebase', () => ({
    auth: {
        currentUser: { uid: 'test_user' }
    }
}));

// 1. Mock Firebase Hook / Data
// We need to ensure the component doesn't break trying to fetch products.
vi.mock('../../lib/firestore', () => ({
    subscribeToInventory: (uid: any, cb: any) => {
        // Return dummy inventory matching props for consistency
        cb([
            { id: '1', name: 'Test Milk', price: 1.50, stock: 20, barcode: '123', category: 'Dairy' },
        ]);
        return () => { }; // Unsubscribe function
    },
    // Safe-mock other subscriptions that might trigger
    subscribeToStaff: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToCustomers: (uid: any, cb: any) => { cb([]); return () => { }; },
    processTransaction: vi.fn().mockResolvedValue(true)
}));

// 2. Mock Cart Context
vi.mock('../../context/CartContext', () => ({
    useCart: () => ({
        cart: [],
        addToCart: vi.fn(),
        removeFromCart: vi.fn(),
        clearCart: vi.fn(),
        total: 0,
    }),
}));

// 3. Mock Router/Navigation if used
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

describe('💰 Smoke Test: Sales View (POS)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the core POS layout', () => {
        render(
            <SalesView
                userId="test-shop-id"
                transactions={[]}
                setTransactions={vi.fn()}
                refunds={[]}
                setRefunds={vi.fn()}
                inventory={[]}
                setInventory={vi.fn()}
                userRole="Cashier"
                staff={mockStaff}
                activeStaffId="test_user"
                logAction={vi.fn()}
                postToLedger={vi.fn()}
            />
        );

        // 1. Check for Main Sections
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();

        // 2. Check for Cart Area (Pay Button -> Cash/Card exist)
        expect(screen.getAllByText(/Cash/i)[0]).toBeInTheDocument();

        // 3. Check for Category Tabs or Filter
        expect(screen.getByText(/Sales Revenue Trend/i)).toBeInTheDocument();
    });

    // Grid test removed as items are hidden until search
    // See 'can search for items' below

    it('can search for items', async () => {
        render(
            <SalesView
                userId="test-shop-id"
                transactions={[]}
                setTransactions={vi.fn()}
                refunds={[]}
                setRefunds={vi.fn()}
                inventory={[{ id: '1', name: 'Test Milk', price: 1.50, stock: 20, barcode: '123', category: 'Dairy', brand: 'Farm', sku: 'MILK1', vatRate: 0, costPrice: 1, supplierId: 'S1', minStock: 5, unitType: 'pcs', packSize: '1', status: 'Active', origin: 'Local', updatedAt: '' }]}
                setInventory={vi.fn()}
                userRole="Cashier"
                staff={mockStaff}
                activeStaffId="test_user"
                logAction={vi.fn()}
                postToLedger={vi.fn()}
            />
        );

        // 1. Initial State: Basket Empty
        expect(screen.getByText(/Basket Empty/i)).toBeInTheDocument();

        // 2. Search for Item
        const searchInput = screen.getByPlaceholderText(/Search/i);
        fireEvent.change(searchInput, { target: { value: 'Milk' } });

        // 3. Verify Item Appears in Dropdown
        await waitFor(() => {
            expect(screen.getAllByText(/Test Milk/i)[0]).toBeInTheDocument();
        });
    });
});
