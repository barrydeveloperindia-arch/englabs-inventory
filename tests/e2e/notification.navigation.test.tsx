import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../../App';

// MOCKS
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn((_, ...pathSegments) => ({ _path: pathSegments.join('/') })), // Capture path
    query: vi.fn((q) => q), // Passthrough
    where: vi.fn(),
    orderBy: vi.fn(),
    onSnapshot: vi.fn((q, cb) => {
        const path = q?._path || '';
        let data: any[] = [];

        if (path.includes('notifications')) {
            data = [{
                data: () => ({
                    recipientId: 'test-admin',
                    title: 'Staff Update',
                    message: 'New staff added',
                    type: 'info',
                    read: false,
                    createdAt: new Date().toISOString(),
                    link: 'staff'
                }),
                id: 'notif-1'
            }];
        } else if (path.includes('staff')) {
            data = [{ data: () => ({ name: 'Admin', role: 'Owner', email: 'admin@hopin.com' }), id: 'test-admin' }];
        }

        const snapshot = {
            docs: data,
            docChanges: () => [],
            forEach: function (f: any) { this.docs.forEach(f); },
            empty: data.length === 0
        };
        cb(snapshot);
        return () => { };
    }),
    doc: vi.fn(),
    updateDoc: vi.fn(),
    addDoc: vi.fn(),
    deleteDoc: vi.fn(),
    setDoc: vi.fn(),
    limit: vi.fn(),
    initializeFirestore: vi.fn(() => ({}))
}));

vi.mock('../../lib/firebase', () => ({
    auth: {
        currentUser: { uid: 'test-admin', email: 'admin@hopin.com' },
        onAuthStateChanged: (cb: any) => { cb({ uid: 'test-admin', email: 'admin@hopin.com' }); return () => { }; }
    },
    db: {}
}));

describe.skip('🔔 Notification Navigation', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('Clicking a notification with link="staff" navigates to Staff View', async () => {
        render(<App />);

        // Fast-forward Splash Screen (3000ms)
        await React.act(async () => {
            vi.advanceTimersByTime(3000);
        });
        vi.useRealTimers();

        // 1. Wait for Dashboard
        await waitFor(() => {
            expect(screen.getByText(/Gross Sales Volume/i)).toBeInTheDocument();
        });

        // 2. Open Notification Tray
        const notificationTrigger = await screen.findByRole('button', { name: /notifications/i });
        fireEvent.click(notificationTrigger);

        // Debug output to see if dropdown opened
        screen.debug();

        // 3. Find Notification
        // Use regex for looser match
        const notificationItem = await screen.findByText(/Staff Update/i);
        fireEvent.click(notificationItem);

        // 4. Assert Navigation to Staff View
        await waitFor(() => {
            expect(screen.getByText(/Staff Check-in/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });
});
