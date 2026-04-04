
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import StaffView from '../../components/StaffView';
import { UserRole } from '../../types';

// --- MOCKS ---

// Mock Firebase
const mockUpdate = vi.fn();
const mockCommit = vi.fn();
const mockBatch = {
    update: mockUpdate,
    commit: mockCommit,
    set: vi.fn(),
    delete: vi.fn()
};

vi.mock('../../lib/firebase', () => ({
    auth: { currentUser: { uid: 'test-admin' } },
    db: {}
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    collection: vi.fn(),
    // Mock doc to construct path from ALL arguments (Tight Control)
    doc: vi.fn((db, ...pathSegments) => {
        // e.g. doc(db, 'shops', 'uid', 'staff', '123') -> path: shops/uid/staff/123
        return {
            id: pathSegments[pathSegments.length - 1],
            path: pathSegments.join('/')
        };
    }),
    writeBatch: vi.fn(() => mockBatch)
}));

// Mock Firestore subscriptions
vi.mock('../../lib/firestore', async (importOriginal) => {
    return {
        ...await importOriginal<any>(),
        subscribeToStaff: (_: any, cb: any) => {
            // Do NOT call cb immediately, pass mock data via props instead for control
            return () => { };
        },
        subscribeToRota: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToRotaPreferences: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToTasks: (_: any, cb: any) => { cb([]); return () => { }; },
        subscribeToNotifications: vi.fn((_, cb) => { cb([]); return () => { }; }),
        subscribeToShopSettings: vi.fn((_, cb) => { cb({ timings: null }); return () => { }; }),
        subscribeToLeaves: (_: any, cb: any) => { cb([]); return () => { }; },
    };
});

describe('⚡ Sync Roles Functionality', () => {

    // Mock Data simulating LIVE DB (UUIDs and Old Roles)
    const MOCK_LIVE_STAFF = [
        { id: 'uuid-salil-123', name: 'Salil Anand', role: 'Owner' as UserRole, email: 'salil@test.com' },
        { id: 'uuid-nayan-456', name: 'Nayan Kumar Godhani', role: 'Inventory Staff' as UserRole, email: 'nayan@test.com' },
        { id: 'uuid-parth-789', name: 'Parth', role: 'Manager' as UserRole, email: 'parth@test.com' },
    ];

    it('Updates roles based on Name Matching when Sync button is clicked', async () => {
        // Mock window.confirm
        window.confirm = vi.fn(() => true);
        window.alert = vi.fn();
        // Mock location.reload
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { reload: vi.fn() },
        });

        render(
            <StaffView
                userId="test-admin"
                userRole="Owner"
                staff={MOCK_LIVE_STAFF as any} // Pass mock live data
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

        // Click on "Team" tab to see the button (if logic requires tab switch, but button is conditional on canManageUsers)
        // In current implementation, button is in the Header of List View.

        // 0. Click "Organization" tab to ensure it is rendered (contains Sync tool)
        const chartTab = await screen.findByText(/Organization/i);
        fireEvent.click(chartTab);

        // 1. Find Sync Button
        const syncBtn = await screen.findByTitle(/Sync Roles/i);
        expect(syncBtn).toBeInTheDocument();

        // 2. Click It
        fireEvent.click(syncBtn);

        // 3. Verify Batch Updates
        await waitFor(() => {
            expect(mockBatch.commit).toHaveBeenCalled();
        });

        // 4. Check specific updates
        // Salil (Owner -> Business Coordinator)
        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'uuid-salil-123',
                // Verify Full Path - Matches VITE_USER_ID from env (mocked to test-admin)
                path: expect.stringMatching(/shops\/test-admin\/staff\/uuid-salil-123/)
            }),
            { role: 'Business Coordinator' }
        );

        // Nayan (Inventory Staff -> Shop Assistant)
        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'uuid-nayan-456',
                path: expect.stringMatching(/shops\/test-admin\/staff\/uuid-nayan-456/)
            }),
            { role: 'Shop Assistant' }
        );

        // Parth (Manager -> Business Coordinator)
        expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'uuid-parth-789' }),
            { role: 'Business Coordinator' }
        );

        // Verify Verification Alert or Log
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Synced 3 roles'));
    });
});
