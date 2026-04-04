
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import * as React from 'react';
import { AccessTerminal } from '../../components/AccessTerminal';

// --- MOCKS ---
vi.mock('html5-qrcode', () => ({
    Html5Qrcode: vi.fn().mockImplementation(() => ({
        start: vi.fn(),
        stop: vi.fn(),
        clear: vi.fn()
    })),
    Html5QrcodeScanner: vi.fn()
}));

// Mock FaceAuth to simulate authentication
vi.mock('../../components/FaceAuth', () => ({
    FaceAuth: ({ onAuthenticate }: { onAuthenticate: (id: string) => void }) => (
        <div data-testid="face-auth-mock">
            <button onClick={() => onAuthenticate('s1')} data-testid="mock-face-match-s1">Simulate Match s1 (Admin)</button>
            <button onClick={() => onAuthenticate('s2')} data-testid="mock-face-match-s2">Simulate Match s2 (Staff)</button>
        </div>
    )
}));

// Mock Sound Effects
Object.defineProperty(window, 'speechSynthesis', {
    value: {
        speak: vi.fn(),
        cancel: vi.fn(),
        getVoices: vi.fn().mockReturnValue([]),
    },
    writable: true,
});
Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    value: vi.fn(),
    writable: true,
});

// Mock Navigator MediaDevices for Hardware Heartbeat
Object.defineProperty(navigator, 'mediaDevices', {
    value: {
        enumerateDevices: vi.fn().mockResolvedValue([{ kind: 'videoinput', label: 'Webcam' }]),
        getUserMedia: vi.fn(),
    },
    writable: true,
});

describe('🔒 Unit: Access Terminal Security Phases', () => {

    const MOCK_STAFF = [
        { id: 's1', name: 'Admin User', role: 'Owner', pin: '9999' },
        { id: 's2', name: 'Regular Staff', role: 'Assistant', pin: '1234' }
    ];

    const mockOnClose = vi.fn();
    const mockOnAuthenticate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('Triggers Admin Lock when non-admin tries to close', () => {
        render(
            <AccessTerminal
                isOpen={true}
                onClose={mockOnClose}
                onAuthenticate={mockOnAuthenticate}
                staff={MOCK_STAFF as any}
                userRole="Assistant"
                isLockMode={false} // Allow close button to appear
            />
        );

        const closeBtn = screen.getByTestId('close-terminal-btn');
        fireEvent.click(closeBtn);

        // Should NOT close immediately
        expect(mockOnClose).not.toHaveBeenCalled();
        // Should show "Restricted Access" / Admin Lock UI
        expect(screen.getByText(/Restricted Access/i)).toBeInTheDocument();
    });

    it('Unlocks with Valid Admin PIN', () => {
        render(
            <AccessTerminal
                isOpen={true}
                onClose={mockOnClose}
                onAuthenticate={mockOnAuthenticate}
                staff={MOCK_STAFF as any}
                userRole="Assistant"
                isLockMode={false}
            />
        );

        // Trigger Lock
        fireEvent.click(screen.getByTestId('close-terminal-btn'));

        // Enter '9999'
        fireEvent.click(screen.getByTestId('admin-pad-9'));
        fireEvent.click(screen.getByTestId('admin-pad-9'));
        fireEvent.click(screen.getByTestId('admin-pad-9'));
        fireEvent.click(screen.getByTestId('admin-pad-9'));

        // Submit
        fireEvent.click(screen.getByTestId('admin-pad-ok'));

        // Should close
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('Security Phase 1: Activates Brute Force Lockout after 5 failed attempts', async () => {
        render(
            <AccessTerminal
                isOpen={true}
                onClose={mockOnClose}
                onAuthenticate={mockOnAuthenticate}
                staff={MOCK_STAFF as any}
                userRole="Assistant"
                isLockMode={false}
            />
        );

        // Trigger Lock
        fireEvent.click(screen.getByTestId('close-terminal-btn'));

        // Fail 5 times
        const failLogin = () => {
            // Enter '1111' (Wrong)
            fireEvent.click(screen.getByTestId('admin-pad-1'));
            fireEvent.click(screen.getByTestId('admin-pad-1'));
            fireEvent.click(screen.getByTestId('admin-pad-1'));
            fireEvent.click(screen.getByTestId('admin-pad-1'));
            fireEvent.click(screen.getByTestId('admin-pad-ok'));
        }

        // 1
        failLogin();
        expect(screen.getByText(/Invalid PIN/i)).toBeInTheDocument();

        // 2, 3, 4
        failLogin();
        failLogin();
        failLogin();

        // 5th Attempt
        failLogin();

        // Should be locked
        expect(screen.getByText(/TERMINAL LOCKED/i)).toBeInTheDocument();

        // Try Valid PIN during lockout
        // Enter '9999'
        fireEvent.click(screen.getByTestId('admin-pad-9'));
        fireEvent.click(screen.getByTestId('admin-pad-9'));
        fireEvent.click(screen.getByTestId('admin-pad-9'));
        fireEvent.click(screen.getByTestId('admin-pad-9'));
        fireEvent.click(screen.getByTestId('admin-pad-ok'));

        // Should STILL be locked
        expect(mockOnClose).not.toHaveBeenCalled();
        expect(screen.getByText(/LOCKED: Wait/i)).toBeInTheDocument();

        // FAST FORWARD 16 minutes
        act(() => {
            vi.advanceTimersByTime(16 * 60 * 1000);
        });

        // Try Valid PIN again
        fireEvent.click(screen.getByTestId('admin-pad-9'));
        fireEvent.click(screen.getByTestId('admin-pad-9'));
        fireEvent.click(screen.getByTestId('admin-pad-9'));
        fireEvent.click(screen.getByTestId('admin-pad-9'));
        fireEvent.click(screen.getByTestId('admin-pad-ok'));

        // Should work now!
        expect(mockOnClose).toHaveBeenCalled();
    });

    it.skip('Uses Real FaceAuth Component (Scan-First Mode)', async () => {
        render(
            <AccessTerminal
                isOpen={true}
                onClose={mockOnClose}
                onAuthenticate={mockOnAuthenticate}
                staff={MOCK_STAFF as any}
                userRole="Assistant"
            />
        );

        // 1. Select Method -> Face (Mocked)
        fireEvent.click(screen.getByText('Face Rec'));

        act(() => {
            vi.runOnlyPendingTimers();
        });

        // 2. Should render FaceAuth mock IMMEDIATELY (No user selection)
        expect(await screen.findByTestId('face-auth-mock')).toBeInTheDocument();

        // 3. Trigger Auth for Associate (s2) - Single Factor
        fireEvent.click(screen.getByTestId('mock-face-match-s2'));

        // 4. Should call onAuthenticate with matched ID
        expect(mockOnAuthenticate).toHaveBeenCalledWith('s2', 'FACE', undefined, 'UNLOCK');
    });

    it.skip('Enforces MFA for Admin User (Face -> PIN)', async () => {
        render(
            <AccessTerminal
                isOpen={true}
                onClose={mockOnClose}
                onAuthenticate={mockOnAuthenticate}
                staff={MOCK_STAFF as any}
                userRole="Assistant"
            />
        );

        // 1. Select Method -> Face 
        const faceBtn = screen.getByText('Face Rec');
        fireEvent.click(faceBtn);

        // 2. Trigger Face Auth for ADMIN (s1)
        const mockFaceBtn = await screen.findByTestId('mock-face-match-s1');
        fireEvent.click(mockFaceBtn);

        // 3. Verify transitioning to MFA (PIN Required)
        // Wait for status update - "CONFIRM IDENTITY" badge
        await screen.findByText(/CONFIRM IDENTITY/i);

        // Check message specific to PIN requirement
        expect(screen.getByText(/Face Match ✓/i)).toBeInTheDocument();

        // 4. Enter Admin PIN '9999' on the new PIN pad
        // Use findBy to wait for UI transition (Face -> PIN mode)
        const pin9 = await screen.findByTestId('pin-pad-9');
        fireEvent.click(pin9);
        fireEvent.click(pin9);
        fireEvent.click(pin9);
        fireEvent.click(pin9);

        const pinOK = screen.getByTestId('pin-pad-ok');
        fireEvent.click(pinOK);

        // 5. NOW should authenticate with PIN method (as 2nd factor)
        await waitFor(() => {
            expect(mockOnAuthenticate).toHaveBeenCalledWith('s1', 'PIN', undefined, 'UNLOCK');
        });
    });

    it.skip('Enforces MFA Reverse (PIN -> Face)', async () => {
        render(
            <AccessTerminal
                isOpen={true}
                onClose={mockOnClose}
                onAuthenticate={mockOnAuthenticate}
                staff={MOCK_STAFF as any}
                userRole="Assistant"
            />
        );

        // 1. Select Method -> PIN
        fireEvent.click(screen.getByText('PIN Code'));

        // 2. Enter Admin PIN
        const pin9 = await screen.findByTestId('pin-pad-9');
        fireEvent.click(pin9);
        fireEvent.click(pin9);
        fireEvent.click(pin9);
        fireEvent.click(pin9);
        fireEvent.click(screen.getByTestId('pin-pad-ok'));

        // 3. Should NOT authenticate yet -> Ask for Face
        expect(mockOnAuthenticate).not.toHaveBeenCalled();
        await screen.findByText(/CONFIRM IDENTITY/i);
        expect(screen.getByText(/PIN Accepted ✓/i)).toBeInTheDocument();

        // 4. Should have switched to FACE mode automatically
        // Verify mock face auth is visible
        const mockFaceBtn = await screen.findByTestId('mock-face-match-s1');
        fireEvent.click(mockFaceBtn);

        // 5. Authenticate
        await waitFor(() => {
            expect(mockOnAuthenticate).toHaveBeenCalledWith('s1', 'FACE', undefined, 'UNLOCK');
        });
    });

    it.skip('MFA Fails if Wrong User provides 2nd Factor', async () => {
        render(
            <AccessTerminal
                isOpen={true}
                onClose={mockOnClose}
                onAuthenticate={mockOnAuthenticate}
                staff={MOCK_STAFF as any}
                userRole="Assistant"
            />
        );

        // 1. Face (Admin s1)
        fireEvent.click(screen.getByText('Face Rec'));
        fireEvent.click(await screen.findByTestId('mock-face-match-s1'));

        // 2. Wait for MFA Challenge
        await screen.findByText(/CONFIRM IDENTITY/i);

        // 3. Enter WRONG PIN (Use s2's PIN '1234')
        // Only s1's PIN works for s1, but let's say someone else tries to login?
        // Wait, if I enter a valid PIN for another user (s2), does it fail MFA?
        // Yes, processAuth checks `id === mfaPendingUser?.id`.

        const pin1 = await screen.findByTestId('pin-pad-1');
        const pin2 = screen.getByTestId('pin-pad-2');
        const pin3 = screen.getByTestId('pin-pad-3');
        const pin4 = screen.getByTestId('pin-pad-4');

        fireEvent.click(pin1);
        fireEvent.click(pin2);
        fireEvent.click(pin3);
        fireEvent.click(pin4);
        fireEvent.click(screen.getByTestId('pin-pad-ok'));

        // 4. Should Fail / Reset
        await waitFor(() => {
            // Expect error message or reset
            expect(screen.getByText(/MFA Mismatch/i)).toBeInTheDocument();
        });

        expect(mockOnAuthenticate).not.toHaveBeenCalled();
    });

});
