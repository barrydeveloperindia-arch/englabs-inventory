import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../../App';

// Mock Recharts
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    AreaChart: () => <div>AreaChart</div>,
    BarChart: () => <div>BarChart</div>,
    Bar: () => null,
    CartesianGrid: () => null,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    ReferenceLine: () => null,
    Cell: () => null
}));

// Mock Firebase
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    collection: vi.fn((_, ...path) => ({ _path: path.join('/') })),
    query: vi.fn(q => q),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    onSnapshot: vi.fn((q, cb) => {
        const snapshot = {
            docs: q?._path?.includes('staff')
                ? [{ data: () => ({ id: 'owner-1', name: 'Boss', role: 'Owner', email: 'owner@test.com' }), id: 'owner-1' }]
                : [],
            docChanges: () => [],
            forEach: function (f: any) { this.docs.forEach(f); }
        };
        cb(snapshot);
        return () => { };
    })
}));

vi.mock('../../lib/firebase', () => ({
    auth: {
        currentUser: { uid: 'owner-1', email: 'owner@test.com' },
        onAuthStateChanged: (cb: any) => { cb({ uid: 'owner-1', email: 'owner@test.com' }); return () => { }; }
    },
    db: {}
}));

vi.mock('../../lib/firestore', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        getStaffMembers: async () => [{ id: 'owner-1', name: 'Boss', role: 'Owner' }],
        subscribeToShopSettings: (_: any, cb: any) => { cb({ timings: null }); return () => { }; },
    };
});

describe('🧭 HR Navigation & Roles', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setConfig({ testTimeout: 10000 });
    });
    afterEach(() => vi.useRealTimers());

    it('Navigates between HR Tabs correctly', async () => {
        render(<App />);
        await React.act(async () => { vi.advanceTimersByTime(3000); });
        vi.useRealTimers();

        // 1. Enter Staff View
        fireEvent.click(await screen.findByText(/Personnel Management|Workforce/i));

        // 2. Wait for Owner Role
        await waitFor(() => {
            expect(screen.getByTestId('staff-view-container')).toHaveAttribute('data-role', 'Owner');
        });

        // 3. Verify Default Tab (Dashboard)
        expect(screen.getByTestId('tab-attendance')).toHaveClass('bg-indigo-600');
        expect(screen.getByText(/Terminal Session/i)).toBeInTheDocument();

        // 4. Click Team
        fireEvent.click(screen.getByTestId('tab-registry'));
        await waitFor(() => expect(screen.getByTestId('tab-registry')).toHaveClass('bg-indigo-600'));
        expect(screen.getByText(/Total Workforce/i)).toBeInTheDocument();

        // 5. Click Calendar
        fireEvent.click(screen.getByTestId('tab-calendar'));
        await waitFor(() => expect(screen.getByTestId('tab-calendar')).toHaveClass('bg-indigo-600'));
        // Calendar has specific headers
        expect(screen.getByText(/Personnel/i)).toBeInTheDocument(); // Table Header

        // 6. Click Payroll
        fireEvent.click(screen.getByTestId('tab-payroll'));
        await waitFor(() => expect(screen.getByTestId('tab-payroll')).toHaveClass('bg-indigo-600'));
        expect(screen.getByTestId('payroll-table')).toBeInTheDocument();
    });
});
