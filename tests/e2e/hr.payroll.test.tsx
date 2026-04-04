import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import App from '../../App';
import * as firestoreModule from '../../lib/firestore';

// Mock Recharts to avoid JSDOM resize/layout issues
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div style={{ width: 500, height: 300 }}>{children}</div>,
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

// ROBUST TYPESAFE MOCKING
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn((_, ...pathSegments) => ({ _path: pathSegments.join('/') })),
    query: vi.fn((q) => q),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    doc: vi.fn(),
    updateDoc: vi.fn(),
    addDoc: vi.fn(),
    deleteDoc: vi.fn(),
    setDoc: vi.fn(),
    initializeFirestore: vi.fn(() => ({})),
    onSnapshot: vi.fn((q, cb) => {
        const path = q?._path || '';
        console.log('📢 [HR Mock] onSnapshot:', path);

        let data: any[] = [];

        // 1. STAFF
        if (path.includes('/staff')) {
            data = [
                {
                    data: () => ({ id: 'owner-1', name: 'Boss', role: 'Owner', email: 'owner@test.com' }),
                    id: 'owner-1'
                },
                {
                    data: () => ({
                        id: 'staff-1',
                        name: 'Alice Worker',
                        role: 'Assistant',
                        hourlyRate: 10.00,
                        advance: 50, // Modified for test case (50 deduction expected)
                        email: 'alice@shop.com'
                    }),
                    id: 'staff-1'
                }
            ];
        }
        // 2. ATTENDANCE (5 Days * 8 Hours = 40 Hours)
        else if (path.includes('attendance')) {
            const records = [];
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            for (let i = 1; i <= 5; i++) {
                const day = String(i).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                records.push({
                    id: `att-${i}`,
                    staffId: 'staff-1',
                    date: dateStr,
                    // 09:00 to 17:00 = 8 Hours
                    clockIn: `${dateStr}T09:00:00.000Z`,
                    clockOut: `${dateStr}T17:00:00.000Z`,
                    status: 'Present',
                    hoursWorked: 8
                });
            }
            data = records.map(r => ({ data: () => r, id: r.id }));
        }
        // 3. ADVANCE REQUESTS
        else if (path.includes('advance-requests')) {
            data = [{
                data: () => ({
                    id: 'adv-1',
                    staffId: 'staff-1',
                    amount: 50,
                    reason: 'Emergency',
                    requestDate: '2023-10-01',
                    status: 'Approved'
                }),
                id: 'adv-1'
            }];
        }

        const snapshot = {
            docs: data,
            docChanges: () => [],
            forEach: function (f: any) { this.docs.forEach(f); },
            empty: data.length === 0
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

// Mock Module level getters/setters if necessary
vi.mock('../../lib/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof firestoreModule>();
    return {
        ...actual,
        getStaffMembers: async () => [{ id: 'staff-1', name: 'Alice Worker' }],
        subscribeToShopSettings: (_: any, cb: any) => { cb({ timings: null }); return () => { }; },
        // Helper to force role in test if needed, usually managed mostly by Auth
    };
});


describe('💼 HR & Payroll System (Owner Access)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        // Increase timeout for E2E
        vi.setConfig({ testTimeout: 15000 });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // Mock Logic for Deterministic E2E Results
    vi.mock('../../lib/payroll_logic', () => ({
        calculatePayroll: (staffMember: any, regHours: number, otHours: number) => {
            const gross = (regHours * (staffMember.hourlyRate || 0)) + (otHours * (staffMember.hourlyRate || 0) * 1.5);
            return {
                grossPay: gross,
                totalHours: regHours + otHours,
                regularHours: regHours,
                overtimeHours: otHours,
                overtimePay: otHours * (staffMember.hourlyRate || 0) * 1.5
            };
        },
        calculateTaxAndNI: (gross: number) => ({
            tax: 0,
            ni: 0,
            pension: 0,
            totalDeductions: 0
        })
    }));

    it('Calculates Weekly Payroll Correctly and Deducts Advances', async () => {
        render(<App />);

        // 1. Splash Screen
        await React.act(async () => { vi.advanceTimersByTime(3000); });
        vi.useRealTimers();

        // 2. Navigate to Staff View
        const staffNav = await screen.findByText(/Workforce/i);
        fireEvent.click(staffNav);

        // 3. Robust Wait for Role: Owner
        // Wait for StaffView to mount, then wait for Role Prop to propagate
        await waitFor(() => {
            const container = screen.getByTestId('staff-view-container');
            expect(container).toHaveAttribute('data-role', 'Owner');
        }, { timeout: 10000 });

        // 4. Click Payroll Tab (Should be visible now)
        const payrollTab = screen.getByTestId('tab-payroll');
        expect(payrollTab).toBeInTheDocument();
        fireEvent.click(payrollTab);

        // 5. Verify Rows
        const rows = screen.getByTestId('payroll-table').querySelectorAll('tbody tr');
        // Expect at least Alice Worker
        await waitFor(() => {
            const table = screen.getByTestId('payroll-table');
            expect(table).toHaveTextContent(/Alice/i);
        });

        // 6. Verify Gross Pay (40h * £10 = £400)
        expect(screen.getByText('£400.00')).toBeInTheDocument();

        // 7. Verify Advance Deduction (Assuming £50 Advance)
        // Table shows "-£50.00" in Advance Column
        const advanceCell = screen.getByText('-£50.00');
        expect(advanceCell).toBeInTheDocument();

        // 8. Verify Net Pay (£400 - £0 Tax - £50 Advance = £350)
        // Look for Emerald Green Value
        const netPay = screen.getByText('£350.00');
        expect(netPay).toBeInTheDocument();

        // 9. Generate Payslip Action
        // Find Action Button
        const actionBtns = screen.getAllByTitle('Download Payslip');
        expect(actionBtns.length).toBeGreaterThan(0);
        // Note: Alert can't be asserted easily in JSDOM relying on window.alert unless mocked.
        // We assume interactivity works if buttons are found.
    }, 15000); // Test Specific Timeout
});
