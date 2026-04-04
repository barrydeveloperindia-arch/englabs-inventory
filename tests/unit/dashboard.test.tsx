
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import Dashboard from '../../components/Dashboard';
import { Transaction, InventoryItem } from '../../types';

// Mock Recharts to avoid SVG rendering issues in JSDOM
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    AreaChart: () => <div data-testid="area-chart" />,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    BarChart: () => <div data-testid="bar-chart" />,
    Bar: () => null,
    Cell: () => null,
    PieChart: () => <div data-testid="pie-chart" />,
    Pie: () => null,
}));

const mockTransactions: Transaction[] = [
    {
        id: '1',
        timestamp: '2025-01-01T10:00:00Z',
        total: 100,
        items: [],

        paymentMethod: 'Cash',
        staffId: '1',
        staffName: 'Bharat',
        subtotal: 100,
        discountAmount: 0,
        vatTotal: 0,
        vatBreakdown: { 0: { gross: 0, net: 0, vat: 0 }, 5: { gross: 0, net: 0, vat: 0 }, 20: { gross: 0, net: 0, vat: 0 } }
    },
    {
        id: '2',
        timestamp: '2025-01-01T11:00:00Z',
        total: 50,
        items: [],

        paymentMethod: 'Card',
        staffId: '1',
        staffName: 'Bharat',
        subtotal: 50,
        discountAmount: 0,
        vatTotal: 0,
        vatBreakdown: { 0: { gross: 0, net: 0, vat: 0 }, 5: { gross: 0, net: 0, vat: 0 }, 20: { gross: 0, net: 0, vat: 0 } }
    },
];

const mockInventory: InventoryItem[] = [
    {
        id: '1',
        name: 'Product A',
        stock: 5,
        minStock: 10,
        price: 10,
        category: 'Groceries',
        barcode: '123',
        sku: 'SKU1',
        brand: 'A',
        packSize: '1',
        unitType: 'pcs',
        costPrice: 5,
        lastBuyPrice: 5,
        vatRate: 0,
        status: 'Active',
        supplierId: 'sup-1',
        origin: 'UK'
    },
    {
        id: '2',
        name: 'Product B',
        stock: 20,
        minStock: 10,
        price: 20,
        category: 'Drinks',
        barcode: '456',
        sku: 'SKU2',
        brand: 'B',
        packSize: '1',
        unitType: 'pcs',
        costPrice: 10,
        lastBuyPrice: 10,
        vatRate: 0,
        status: 'Active',
        supplierId: 'sup-1',
        origin: 'UK'
    },
];

describe('🛡️ Unit: Dashboard Metrics', () => {
    it('renders dashboard heading correctly', () => {
        render(
            <Dashboard
                userId="test-shop-id"
                transactions={mockTransactions}
                inventory={mockInventory}
                role="Owner"
                staff={[]}
                attendance={[]}
                bills={[]}
            />
        );
        expect(screen.getByTestId('dashboard-heading')).toHaveTextContent(/Operational Intelligence/i);
    });

    it('calculates Total Sales correctly', () => {
        render(
            <Dashboard
                userId="test-shop-id"
                transactions={mockTransactions}
                inventory={mockInventory}
                role="Owner"
                staff={[]}
                attendance={[]}
                bills={[]}
            />
        );
        // Total should be 150
        expect(screen.getByText(/150.00/)).toBeInTheDocument();
    });

    it('renders recent orders correctly', () => {
        render(
            <Dashboard
                userId="test-shop-id"
                transactions={mockTransactions}
                inventory={mockInventory}
                role="Owner"
                staff={[]}
                attendance={[]}
                bills={[]}
            />
        );
        expect(screen.getAllByText(/Terminal Sale/i)).toHaveLength(2);
    });
});
