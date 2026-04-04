import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Dashboard from '../../components/Dashboard';

/**
 * 📊 SMOKE TEST: DASHBOARD
 * ------------------------------------------------------------------
 * "The Command Center"
 * 
 * Objective: Verify admin widgets and charts container load.
 * Critical Issues: Charts often crash JSDOM tests, so robust mocking is needed.
 */

// --- MOCKS ---

// 1. Mock Recharts (CRITICAL)
// Recharts uses ResizeObserver which is missing in JSDOM.
vi.mock('recharts', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        ResponsiveContainer: ({ children }: any) => <div className="recharts-mock" style={{ width: 500, height: 300 }}>{children}</div>,
    };
});

// 2. Mock Data Subscriptions
vi.mock('../../lib/firestore', () => ({
    subscribeToTransactions: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToAttendance: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToNotifications: (uid: any, cb: any) => { cb([]); return () => { }; },
    // Dashboard might aggregate these:
    subscribeToInventory: (uid: any, cb: any) => { cb([]); return () => { }; },
}));

describe('📊 Smoke Test: Admin Dashboard', () => {

    it('renders key metrics widgets', () => {
        render(
            <Dashboard
                userId="test-shop-id"
                role="Owner"
                transactions={[]}
                inventory={[]}
                attendance={[]}
                staff={[]}
                bills={[]}
                salaries={[]}
            />
        );

        // 1. Sales Metric
        // Look for generic headings or specific "Gross Sales Volume"
        // Use getAllByText if strictness is an issue with multiple "Sales" words
        expect(screen.getAllByText(/Sales/i).length).toBeGreaterThan(0);

        // 2. Transaction Volume Metric
        expect(screen.getAllByText(/Transactions/i).length).toBeGreaterThan(0);

        // 3. Activity Feed / Tables
        const headings = screen.getAllByRole('heading');
        expect(headings.length).toBeGreaterThan(0);
    });

    it('renders chart containers (Mocked)', () => {
        const { container } = render(
            <Dashboard
                userId="test-shop-id"
                role="Owner"
                transactions={[]}
                inventory={[]}
                attendance={[]}
                staff={[]}
                bills={[]}
                salaries={[]}
            />
        );

        // Check if our mocked Recharts container is present
        expect(container.querySelector('.recharts-mock')).toBeInTheDocument();
    });
});
