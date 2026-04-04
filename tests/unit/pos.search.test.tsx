
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import SalesView from '../../components/SalesView';

/**
 * 🛒 POS TERMINAL: SEARCH & SCAN
 * ------------------------------------------------------------------
 * Objective: Verify that typing a product name or scanning a barcode 
 * correctly populates the candidate list for the basket.
 */

// --- MOCK DATA ---
const mockInventory = [
    { id: '1', name: 'Fresh Milk', price: 1.50, stock: 10, barcode: '50123', category: 'Dairy', status: 'Active' },
    { id: '2', name: 'Baked Beans', price: 0.85, stock: 50, barcode: '50456', category: 'Canned', status: 'Active' },
];

const mockStaff = [{ id: 's1', name: 'John Boss', role: 'Owner', status: 'Active' }];

describe('🛒 POS Terminal: Search & Scan Logic', () => {

    it('🔍 TEST: should find product by typing name', async () => {
        // 1. Render SalesView with mock inventory
        render(
            <SalesView
                userId="test-shop-id"
                inventory={mockInventory as any}
                staff={mockStaff as any}
                transactions={[]}
                setTransactions={vi.fn()}
                refunds={[]}
                setRefunds={vi.fn()}
                setInventory={vi.fn()}
                userRole="Owner"
                activeStaffId="s1"
                logAction={vi.fn()}
                postToLedger={vi.fn()}
            />
        );

        // 2. Identify search input
        const searchInput = screen.getByPlaceholderText(/Search/i);

        // 3. User types 'Milk'
        fireEvent.change(searchInput, { target: { value: 'Milk' } });

        // 4. VERIFY: 'Fresh Milk' appears in the results candidate list
        await waitFor(() => {
            expect(screen.getByText('Fresh Milk')).toBeDefined();
        });
    });

    it('📦 TEST: should find product by scanning barcode', async () => {
        render(
            <SalesView
                userId="test-shop-id"
                inventory={mockInventory as any}
                staff={mockStaff as any}
                transactions={[]}
                setTransactions={vi.fn()}
                refunds={[]}
                setRefunds={vi.fn()}
                setInventory={vi.fn()}
                userRole="Owner"
                activeStaffId="s1"
                logAction={vi.fn()}
                postToLedger={vi.fn()}
            />
        );

        const searchInput = screen.getByPlaceholderText(/Search/i);

        // 5. User scans '50456' (Barcode for Baked Beans)
        fireEvent.change(searchInput, { target: { value: '50456' } });

        // 6. VERIFY: 'Baked Beans' is matched
        await waitFor(() => {
            expect(screen.getByText('Baked Beans')).toBeDefined();
        });
    });
});
