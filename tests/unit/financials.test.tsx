
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import FinancialsView from '../../components/FinancialsView';
import { LedgerEntry } from '../../types';

const mockLedger: LedgerEntry[] = [
    {
        id: 'l1',
        timestamp: '2025-01-01T10:00:00Z',
        type: 'Credit',
        category: 'Sales',
        amount: 100,
        description: 'Daily Sales',
        referenceId: 't1',

        account: 'Sales Revenue'
    },
    {
        id: 'l2',
        timestamp: '2025-01-01T11:00:00Z',
        type: 'Debit',
        category: 'Inventory',
        amount: 100,
        description: 'Daily Sales Cash',
        referenceId: 't1',

        account: 'Cash in Hand'
    },
    {
        id: 'l3',
        timestamp: '2025-01-01T12:00:00Z',
        type: 'Debit',
        category: 'Expense',
        amount: 30,
        description: 'Milk purchase',
        referenceId: 'e1',

        account: 'Operational Expense'
    },
    {
        id: 'l4',
        timestamp: '2025-01-01T12:00:00Z',
        type: 'Credit',
        category: 'Inventory',
        amount: 30,
        description: 'Milk purchase payment',
        referenceId: 'e1',

        account: 'Cash in Hand'
    }
];

describe('🛡️ Unit: Financials Ledger', () => {
    it('renders financial summary heading', () => {
        render(
            <FinancialsView
                userId="test-shop-id"
                ledger={mockLedger}
                setLedger={vi.fn()}
                transactions={[]}
                inventory={[]}
                suppliers={[]}
                bills={[]}
                expenses={[]}
                setExpenses={vi.fn()}
                salaries={[]}
                staff={[]}
                postToLedger={vi.fn()}
                setBills={vi.fn()}
                setSuppliers={vi.fn()}
                logAction={vi.fn()}
                userRole="Owner"
                currentStaffId="s1"
                activeStaffName="Test Owner"
                navigateToProcurement={vi.fn()}
            />
        );
        expect(screen.getByText(/Financial Intelligence/i)).toBeInTheDocument();
    });

    it('calculates Net Balance (Assets) correctly', () => {
        render(
            <FinancialsView
                userId="test-shop-id"
                ledger={mockLedger}
                setLedger={vi.fn()}
                transactions={[]}
                inventory={[]}
                suppliers={[]}
                bills={[]}
                expenses={[]}
                setExpenses={vi.fn()}
                salaries={[]}
                staff={[]}
                postToLedger={vi.fn()}
                setBills={vi.fn()}
                setSuppliers={vi.fn()}
                logAction={vi.fn()}
                userRole="Owner"
                currentStaffId="s1"
                activeStaffName="Test Owner"
                navigateToProcurement={vi.fn()}
            />
        );
        // Liquid Assets: Cash in Hand (100 - 30 = 70)
        const liquidAssets = screen.getByText(/Liquid Assets/i).parentElement;
        expect(liquidAssets).toHaveTextContent(/70/);
    });

    it('calculates Revenue correctly', () => {
        render(
            <FinancialsView
                userId="test-shop-id"
                ledger={mockLedger}
                setLedger={vi.fn()}
                transactions={[]}
                inventory={[]}
                suppliers={[]}
                bills={[]}
                expenses={[]}
                setExpenses={vi.fn()}
                salaries={[]}
                staff={[]}
                postToLedger={vi.fn()}
                setBills={vi.fn()}
                setSuppliers={vi.fn()}
                logAction={vi.fn()}
                userRole="Owner"
                currentStaffId="s1"
                activeStaffName="Test Owner"
                navigateToProcurement={vi.fn()}
            />
        );
        // Total Revenue: 100
        const revenueCard = screen.getByText(/Total Revenue/i).parentElement;
        expect(revenueCard).toHaveTextContent(/100/);
    });

    it('calculates Net Profit correctly', () => {
        render(
            <FinancialsView
                userId="test-shop-id"
                ledger={mockLedger}
                setLedger={vi.fn()}
                transactions={[]}
                inventory={[]}
                suppliers={[]}
                bills={[]}
                expenses={[]}
                setExpenses={vi.fn()}
                salaries={[]}
                staff={[]}
                postToLedger={vi.fn()}
                setBills={vi.fn()}
                setSuppliers={vi.fn()}
                logAction={vi.fn()}
                userRole="Owner"
                currentStaffId="s1"
                activeStaffName="Test Owner"
                navigateToProcurement={vi.fn()}
            />
        );
        // Net Profit: Revenue 100 - OpEx 30 = 70
        const netProfitCard = screen.getByText(/Net Profit/i).parentElement;
        expect(netProfitCard).toHaveTextContent(/70/);
    });
});
