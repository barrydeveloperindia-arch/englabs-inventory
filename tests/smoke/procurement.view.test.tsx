
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import PurchasesView from '../../components/PurchasesView';
import { Purchase, Supplier, InventoryItem, Bill } from '../../types';

// --- MOCKS ---

// 1. Firebase Auth
vi.mock('../../lib/firebase', () => ({
    auth: { currentUser: { uid: 'test-user' } },
    db: {}
}));

// 2. Firestore Actions
vi.mock('../../lib/firestore', () => ({
    addPurchase: vi.fn(),
    addBill: vi.fn(),
    updateInventoryItem: vi.fn(),
    updateSupplier: vi.fn(),
    updatePurchase: vi.fn(),
}));

// 3. Storage Utils (Dynamic Import Mock)
vi.mock('../../lib/storage_utils', () => ({
    compressImage: vi.fn((file) => Promise.resolve(file)),
    uploadFile: vi.fn(() => Promise.resolve('https://mock-url.com/receipt.jpg'))
}));

// 4. Google GenAI
vi.mock('@google/genai', () => ({
    GoogleGenAI: vi.fn().mockImplementation(() => ({
        models: {
            generateContent: vi.fn().mockResolvedValue({
                text: JSON.stringify({
                    total_amount: 100,
                    date: '2026-05-20',
                    items_summary: 'Test Items',
                    invoice_number: 'INV-AI-123'
                })
            })
        }
    }))
}));

describe('📦 PROCESSING: Procurement (PurchasesView)', () => {
    const mockSetPurchases = vi.fn();
    const mockSetSuppliers = vi.fn();
    const mockSetInventory = vi.fn();
    const mockSetBills = vi.fn();
    const mockLogAction = vi.fn();

    const mockPurchases: Purchase[] = [];
    const mockSuppliers: Supplier[] = [
        { id: 'sup1', name: 'Test Supplier', totalSpend: 0, outstandingBalance: 0, orderCount: 0, lastOrderDate: '', contactName: 'John', email: '', phone: '', category: 'General' },
    ];
    const mockInventory: InventoryItem[] = [
        { id: 'item1', name: 'Test Item', stock: 10, category: 'Stock', brand: 'TestBrand', costPrice: 5, price: 10, minStock: 5, supplierId: 'sup1', logs: [], barcode: '', sku: 'SKU1', lastBuyPrice: 5, unitType: 'pcs', packSize: '1', origin: 'UK', status: 'Active', vatRate: 20 }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        vi.spyOn(window, 'alert').mockImplementation(() => { });
    });

    const renderComponent = () => {
        render(
            <PurchasesView
                userId="test-shop-id"
                purchases={mockPurchases}
                setPurchases={mockSetPurchases}
                suppliers={mockSuppliers}
                setSuppliers={mockSetSuppliers}
                logAction={mockLogAction}
                inventory={mockInventory}
                setInventory={mockSetInventory}
                bills={[]}
                setBills={mockSetBills}
                activeStaffName="Test User"
                postToLedger={vi.fn()}
                transactions={[]}
            />
        );
    };

    it('Renders Dashboard Mode by default', () => {
        renderComponent();
        expect(screen.getByText(/Stock Acquisition Interface/i)).toBeInTheDocument();
        expect(screen.getByText(/Daily Financial Reconciliation/i)).toBeInTheDocument();
    });

    it('Switches to Register New (Ledger) Mode', () => {
        renderComponent();
        const registerBtns = screen.getAllByText(/Register New/i);
        fireEvent.click(registerBtns[0]); // There might be mobile/desktop versions
        expect(screen.getByText(/1. Date/i)).toBeInTheDocument();
    });

    it('Allows manual entry of a purchase', async () => {
        const { addPurchase } = await import('../../lib/firestore');
        renderComponent();

        // Enter Register Mode
        const registerBtns = screen.getAllByText(/Register New/i);
        fireEvent.click(registerBtns[0]);

        // Fill Form via Inputs directly looking for placeholder or adjacent label
        // Helper to find input by label text pattern
        const findInput = (regex: RegExp) => screen.getByText(regex).nextElementSibling as HTMLElement;
        const findSelect = (regex: RegExp) => screen.getByText(regex).nextElementSibling as HTMLElement;

        fireEvent.change(screen.getByPlaceholderText(/e.g. INV-9985/i), { target: { value: 'INV-TEST-001' } });

        // Select Vendor (Using combobox role and ensuring we pick the right one is hard, let's use value on the select found by label)
        const vendorSelect = screen.getByText(/3. Vendor/i).nextElementSibling;
        fireEvent.change(vendorSelect!, { target: { value: 'sup1' } });

        // Item Select
        // The item selection has a label "5. Item Description" and then a div with select and input
        // structure: label -> div -> select, input
        const itemLabel = screen.getByText(/5. Item Description/i);
        const itemContainer = itemLabel.nextElementSibling;
        const itemSelect = itemContainer?.querySelector('select');
        fireEvent.change(itemSelect!, { target: { value: 'item1' } });

        // Quantity
        const qtyInput = screen.getByText(/6. Quantity/i).nextElementSibling;
        fireEvent.change(qtyInput!, { target: { value: '10' } });

        // Amount
        const amtInput = screen.getByText(/8. Total Amount/i).nextElementSibling;
        fireEvent.change(amtInput!, { target: { value: '100' } });

        // Remarks
        const remInput = screen.getByPlaceholderText(/e.g. GST Bill Received/i);
        fireEvent.change(remInput, { target: { value: 'Test Purchase' } });

        // Submit
        fireEvent.click(screen.getByText(/Record Purchase Entry/i));

        await waitFor(() => {
            expect(addPurchase).toHaveBeenCalled();
            expect(mockLogAction).toHaveBeenCalledWith('Asset Procurement', 'purchases', expect.stringContaining('100.00'), 'Info');
        });
    });

});
