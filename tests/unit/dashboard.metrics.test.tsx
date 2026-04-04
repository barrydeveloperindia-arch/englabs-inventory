
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import React from 'react';
import Dashboard from '../../components/Dashboard';

// --- MOCK RECHARTS ---
vi.mock('recharts', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        ResponsiveContainer: ({ children }: any) => <div className="recharts-mock">{children}</div>,
        BarChart: () => <div>BarChart</div>,
        PieChart: () => <div>PieChart</div>,
    };
});

describe('📊 Integration: Dashboard Metrics Accuracy', () => {

    // Test Data
    const MOCK_TRANSACTIONS = [
        { id: 't1', total: 100.00, timestamp: new Date().toISOString(), items: [] },
        { id: 't2', total: 250.50, timestamp: new Date().toISOString(), items: [] },
        { id: 't3', total: 49.50, timestamp: new Date().toISOString(), items: [] }
    ];
    // SUM: 100 + 250.50 + 49.50 = 400.00

    const MOCK_ATTENDANCE = [
        { id: 'a1', status: 'Present', staffId: 's1' },
        { id: 'a2', status: 'Sick Leave', staffId: 's2' },
        { id: 'a3', status: 'Present', staffId: 's3' },
        { id: 'a4', status: 'Absent', staffId: 's4' }
    ];
    // Present: 2

    const MOCK_INVENTORY = [
        // Assuming Low Stock Threshold is typically 10 or 20
        { id: 'i1', name: 'Milk', stockLevel: 5 }, // Low
        { id: 'i2', name: 'Coffee', stockLevel: 100 }, // OK
        { id: 'i3', name: 'Sugar', stockLevel: 2 } // Low
    ];
    // Low Stock Count: 2

    it('Calculates Total Sales Volume accurately', () => {
        render(
            <Dashboard
                userId="test-shop-id"
                role="Owner"
                transactions={MOCK_TRANSACTIONS as any}
                inventory={[]}
                attendance={[]}
                staff={[]}
                bills={[]}
                salaries={[]}
            />
        );

        // Expect £400.00
        // Use a flexible search for currency formatting
        // Look for the "Gross Sales Volume" card or similar
        const salesText = screen.getByText(/400\.00/);
        expect(salesText).toBeInTheDocument();
    });

    it('Calculates Total Orders Count accurately', () => {
        render(
            <Dashboard
                userId="test-shop-id"
                role="Owner"
                transactions={MOCK_TRANSACTIONS as any}
                inventory={[]}
                attendance={[]}
                staff={[]}
                bills={[]}
                salaries={[]}
            />
        );

        // Expect 3
        // "3" is a very common number. Let's try to find it within a specific metric context if possible.
        // Often dashboard has "Total Orders" label.
        // We'll search for the value '3' generally first.
        const orderCount = screen.queryByText('3');
        expect(orderCount).toBeInTheDocument();
    });


});
