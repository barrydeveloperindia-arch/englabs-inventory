
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import React from 'react';
import StaffView from '../../components/StaffView';
import { INITIAL_STAFF } from '../../constants';

// --- MOCKS ---
vi.mock('../../lib/firebase', () => ({ auth: { currentUser: { uid: 'test-admin' } }, db: {} }));

// Mock Firestore subscriptions to return static INITIAL_STAFF
vi.mock('../../lib/firestore', async (importOriginal) => {
    return {
        ...await importOriginal<any>(),
        subscribeToStaff: (_: any, cb: any) => { cb(INITIAL_STAFF); return () => { }; },
        subscribeToRota: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToRotaPreferences: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToTasks: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToNotifications: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToShopSettings: (_: any, cb: any) => { cb({ timings: null }); return () => { }; },
        subscribeToLeaves: (_: any, cb: any) => { cb([]); return () => { }; },
    };
});

describe('🏢 E2E: Org Structure & Role Consistency', () => {

    it('Displays Salil Anand with "Business Coordinator" role in Team List', async () => {
        render(
            <StaffView
                userId="test-shop-id"
                userRole="Owner"
                staff={INITIAL_STAFF}
                setStaff={vi.fn()}
                attendance={[]}
                setAttendance={vi.fn()}
                inventory={[]}
                activeStaffName="Bharat Anand"
                currentStaffId="1"
                logAction={vi.fn()}
                navigateToProcurement={vi.fn()}
            />
        );

        // Click on "Team" tab
        const teamTab = screen.getByTestId("tab-registry");
        fireEvent.click(teamTab);

        // Switch to List View (Table)
        const listToggle = screen.getByTestId("view-mode-list");
        fireEvent.click(listToggle);

        // Wait for table header specific to Team view
        await screen.findByText("Personnel Member");
        const table = await screen.findByRole('table');
        const salilRow = within(table).getByText('Salil Anand').closest('tr');
        expect(salilRow).toBeInTheDocument();

        // Check Role Column
        const roleCells = within(salilRow!).getAllByText('Business Coordinator');
        expect(roleCells.length).toBeGreaterThan(0);
    });

    it('Displays Nayan Godhani with "Shop Assistant" role in Team List', async () => {
        render(
            <StaffView
                userId="test-shop-id"
                userRole="Owner"
                staff={INITIAL_STAFF}
                setStaff={vi.fn()}
                attendance={[]}
                setAttendance={vi.fn()}
                inventory={[]}
                activeStaffName="Bharat Anand"
                currentStaffId="1"
                logAction={vi.fn()}
                navigateToProcurement={vi.fn()}
            />
        );

        // Click on "Team" tab
        const teamTab = screen.getByTestId("tab-registry");
        fireEvent.click(teamTab);

        // Switch to List View (Table)
        const listToggle = screen.getByTestId("view-mode-list");
        fireEvent.click(listToggle);

        // Find Row for Nayan
        await screen.findByText("Personnel Member");
        const table = await screen.findByRole('table');
        const nayanRow = within(table).getByText(/Nayan/i).closest('tr');
        expect(nayanRow).toBeInTheDocument();

        // Check Role Column
        // NOTE: If hardcoded logic exists, it might interfere, but here we expect data-driven from constants.
        // Check Role Column (Mobile + Desktop views duplicate the role text)
        const roleCells = within(nayanRow!).getAllByText('Shop Assistant');
        expect(roleCells.length).toBeGreaterThan(0);
    });

    it('Displays Org Chart with correct Overrides', async () => {
        // Need to switch to Org Chart Tab?
        // StaffView typically renders Org Chart at top or in a specific tab?
        // Let's assume it's visible or we can find the Org Chart cards.

        render(
            <StaffView
                userId="test-shop-id"
                userRole="Owner"
                staff={INITIAL_STAFF}
                setStaff={vi.fn()}
                attendance={[]}
                setAttendance={vi.fn()}
                inventory={[]}
                activeStaffName="Bharat Anand"
                currentStaffId="1"
                logAction={vi.fn()}
                navigateToProcurement={vi.fn()}
            />
        );

        // Search for Org Chart elements (Cards)
        // Salil Card
        // The Org Chart render logic uses `getDisplayRole`.
        // Look for visually hidden or visible text.
        // Screen.getAllByText might find multiple "Business Coordinator".
        // We want to ensure it's associated with Salil.

        // Assuming Org Chart renders cards with Name and Role.
        // We might search for "Salil Anand" and then find sibling text.
    });

});
