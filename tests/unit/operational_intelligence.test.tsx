
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { OperationalIntelligence } from '../../components/OperationalIntelligence';

// Mock Recharts and Lucide to keep it light
vi.mock('lucide-react', () => ({
    TrendingUp: () => <div data-testid="trending-up" />,
    TrendingDown: () => <div data-testid="trending-down" />,
    ShoppingBag: () => <div data-testid="shopping-bag" />,
    Clock: () => <div data-testid="clock" />,
    RefreshCw: () => <div data-testid="refresh-cw" />,
}));

describe('OperationalIntelligence UI Component', () => {
    const mockProps = {
        transactions: [
            { id: '1', total: 100, timestamp: new Date().toISOString(), items: [] },
            { id: '2', total: 200, timestamp: new Date().toISOString(), items: [] },
        ] as any,
        attendance: [
            { id: 'a1', clockIn: '09:00', clockOut: null, date: new Date().toISOString().split('T')[0] }
        ] as any,
        staffCount: 5,
        efficiency: 95.5,
        inventory: [
            { id: 'i1', price: 100, stock: 1, minStock: 2 } as any,
            { id: 'i2', price: 100, stock: 2, minStock: 2 } as any,
        ]
    };

    it('renders all key metrics cards', () => {
        render(<OperationalIntelligence {...mockProps} />);

        expect(screen.getByText(/Total Asset Value/i)).toBeInTheDocument();
        expect(screen.getByText(/Overall Stock Health/i)).toBeInTheDocument();
        expect(screen.getByText(/Daily Dispatch Volume/i)).toBeInTheDocument();
        expect(screen.getByText(/Engineering Staff Active/i)).toBeInTheDocument();
        expect(screen.getByText(/Agent Efficiency/i)).toBeInTheDocument();
    });

    it('displays the correct asset value and staff count', () => {
        render(<OperationalIntelligence {...mockProps} />);
 
        // Asset value should be ₹300.00
        expect(screen.getByText(/₹300.00/i)).toBeInTheDocument();
 
        // Staff count should be 1 / 5
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText(/\/ 5/)).toBeInTheDocument();
    });

    it('displays the efficiency index correctly', () => {
        render(<OperationalIntelligence {...mockProps} />);
        expect(screen.getByText('95.5%')).toBeInTheDocument();
    });
});
