import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import SalesView from '../../components/SalesView'; // Adjusted path
import { UserRole } from '../../types';

// Mock Dependencies
vi.mock('../../lib/firestore', () => ({
    processTransaction: vi.fn().mockResolvedValue(true),
    subscribeToInventory: (uid: any, cb: any) => { cb([]); return () => { }; }
}));

vi.mock('../../lib/firebase', () => ({
    auth: { currentUser: { uid: 'test-user' } }
}));

const mockStaff = [{
    id: 'test_user', name: 'Test User', role: 'Cashier' as UserRole,
    photo: '', status: 'Active' as any, pin: '1234', hourlyRate: 10,
    monthlyRate: 0, advance: 0, email: 't@t.com', contractType: 'Full-Time' as any,
    niNumber: 'AB123456C', taxCode: '1257L', rightToWork: true, address: '123 St',
    emergencyContact: 'Mom', startDate: '2023-01-01', joinedDate: '2023-01-01',
    dailyRate: 0, holidayEntitlement: 20, accruedHoliday: 0, phone: '123456'
}];

const mockInventory = [{
    id: '1', name: 'E2E Milk', price: 1.50, stock: 99, barcode: '123',
    category: 'Dairy', brand: 'Farm', sku: 'MILK1', vatRate: 0,
    costPrice: 1, supplierId: 'S1', minStock: 5, unitType: 'pcs',
    packSize: '1', status: 'Active', origin: 'Local', updatedAt: ''
} as any];

/**
 * 🚆 E2E SIMULATION: CHECKOUT FLOW
 * ------------------------------------------------------------------
 * Objective: Simulate a full cashier checkout journey.
 * Flow:
 * 1. Search for Item
 * 2. Add to Basket
 * 3. Review Basket Total
 * 4. Pay via Cash
 * 5. Verify Receipt Generation
 */

describe('🚀 E2E Flow: Checkout', () => {

    it('completes a full transaction cycle', async () => {
        render(
            <SalesView
                userId="test-shop-id"
                transactions={[]}
                setTransactions={vi.fn()}
                refunds={[]}
                setRefunds={vi.fn()}
                inventory={mockInventory}
                setInventory={vi.fn()}
                userRole="Cashier"
                staff={mockStaff}
                activeStaffId="test_user"
                logAction={vi.fn()}
                postToLedger={vi.fn()}
            />
        );

        // 1. Search Item
        const searchInput = screen.getByPlaceholderText(/Search/i);
        fireEvent.change(searchInput, { target: { value: 'Milk' } });

        // 2. Add to Basket
        await waitFor(() => {
            const itemBtn = screen.getByText(/E2E Milk/i);
            fireEvent.click(itemBtn);
        });

        // 3. Verify Basket & Total
        // Should show "1.50" in the total display
        expect(screen.getAllByText(/1\.50/).length).toBeGreaterThan(0);

        // 4. Pay (Cash)
        const cashBtn = screen.getByText('Cash');
        fireEvent.click(cashBtn);

        // 5. Verify Receipt Modal
        // The modal contains "Rect #", "VAT Reg", etc.
        await waitFor(() => {
            expect(screen.getByText(/Rect #/i)).toBeInTheDocument();
        });
    });
});
