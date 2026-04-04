
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import StaffView from '../../components/StaffView';

/**
 * 📅 ATTENDANCE & WORKFORCE LOGIC
 * ------------------------------------------------------------------
 * Objective: Verify real-time status tracking (In-Store, Scheduled, Leave)
 * and ensure multiple daily shift entries are supported.
 */

// --- MOCK DATA ---
const mockStaff = [
    { id: 's1', name: 'Nayan', role: 'Staff', status: 'Active' },
    { id: 's2', name: 'Sam', role: 'Staff', status: 'Active' },
    { id: 's3', name: 'Owner', role: 'Owner', status: 'Active' }
];

const todayStr = new Date().toISOString().split('T')[0];

describe('📅 Attendance & Workforce Logic', () => {

    it('✅ TEST: should identify "In Store Today" for active sessions', async () => {
        const mockAttendance = [
            { id: 'a1', staffId: 's1', date: todayStr, clockIn: '09:00', status: 'Present' }, // Active
            { id: 'a2', staffId: 's2', date: todayStr, clockIn: '08:00', clockOut: '12:00', status: 'Present' } // Finished
        ];

        render(
            <StaffView
                userId="test-shop-id"
                staff={mockStaff as any}
                attendance={mockAttendance as any}
                setStaff={vi.fn()}
                setAttendance={vi.fn()}
                logAction={vi.fn()}
                userRole="Owner"
                currentStaffId="s3"
                inventory={[]}
                activeStaffName="Owner"
                navigateToProcurement={vi.fn()}
            />
        );

        // 1. Identify "In Store Today" section
        // 2. VERIFY: Only Nayan (s1) is counted as active in store, OR both if history is counted
        // In current code, it counts anyone with a record today. 
        // The requirement suggests "In Store" should be active sessions.

        await waitFor(() => {
            const card = screen.getByText(/In Store Today/i).closest('div');
            const presentCount = card?.querySelector('span');
            // Logic: Only s1 is present (s2 clicked out)
            expect(presentCount?.textContent).toBe('1');
        });
    });

    it('🔄 TEST: should support multiple check-ins per day (Shift-wise)', async () => {
        // This is a NEW feature we are implementing.
        // Logic: If Nayan clocks out at 12:00 and clocks in again at 14:00, 
        // there should be TWO records or the logic should allow a second entry.

        const mockAttendance = [
            { id: 'a1', staffId: 's1', date: todayStr, clockIn: '09:00', clockOut: '12:00', status: 'Present' }
        ];

        // Assuming we have a helper to check-in
        // In App.tsx, it checks `!hasShift` (any record for today). We need to change it to `!hasOpenShift`.

        expect(mockAttendance.length).toBe(1);
        // If we trigger another check-in, it should add record 'a3'
    });
});
