
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { AccessTerminal } from '../../components/AccessTerminal';

// Mock Navigator MediaDevices
const mockEnumerateDevices = vi.fn();
Object.defineProperty(navigator, 'mediaDevices', {
    value: {
        enumerateDevices: mockEnumerateDevices,
        getUserMedia: vi.fn(),
        createUserMedia: vi.fn(),
    },
    writable: true,
});

describe('🛡️ Unit: Access Terminal Resilience', () => {

    const MOCK_STAFF = [
        { id: 's1', name: 'Admin', role: 'Owner', pin: '9999', faceDescriptor: [0.1] }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Disables FACE and QR modes when No Camera is Detected', async () => {
        // Mock NO videoinput devices
        mockEnumerateDevices.mockResolvedValue([
            { kind: 'audioinput', label: 'Microphone' }
        ]);

        render(
            <AccessTerminal
                isOpen={true}
                onClose={() => { }}
                staff={MOCK_STAFF as any}
                onAuthenticate={async () => { }}
                userRole="Shop Assistant"
            />
        );

        // Wait for heartbeat check
        await waitFor(() => {
            // We expect some visual indicator or disabled state
            // Let's assume we implement a "Camera Offline" text or disabled button
            // For now, let's verify the buttons are NOT in the document or are disabled.
            // Best practice: Render them disabled with a tooltip or "Offline" text.
            // Implementation plan: Add text "OFFLINE" to the button.
            expect(screen.getAllByText(/OFFLINE/i).length).toBeGreaterThan(0);
        });

        // Verify "Face Rec" button contains "OFFLINE" or is disabled
        const faceBtn = screen.getByTestId('mode-face');
        expect(faceBtn).toBeDisabled();
        expect(faceBtn).toHaveTextContent(/OFFLINE/i);

        // Verify "Scan ID" (QR) button contains "OFFLINE" or is disabled
        const qrBtn = screen.getByTestId('mode-qr');
        expect(qrBtn).toBeDisabled();
        expect(qrBtn).toHaveTextContent(/OFFLINE/i);
    });

    it('Enables FACE and QR modes when Camera IS Detected', async () => {
        // Mock YES videoinput devices
        mockEnumerateDevices.mockResolvedValue([
            { kind: 'videoinput', label: 'Webcam' }
        ]);

        render(
            <AccessTerminal
                isOpen={true}
                onClose={() => { }}
                staff={MOCK_STAFF as any}
                onAuthenticate={async () => { }}
                userRole="Shop Assistant"
            />
        );

        await waitFor(() => {
            // Buttons should be enabled (not disabled)
            expect(screen.getByTestId('mode-face')).not.toBeDisabled();
            expect(screen.queryByText(/OFFLINE/i)).not.toBeInTheDocument();
        });
    });

    it('Displays System Status indicator for Hardware', async () => {
        mockEnumerateDevices.mockResolvedValue([]); // No camera

        const { container } = render(
            <AccessTerminal
                isOpen={true}
                onClose={() => { }}
                staff={MOCK_STAFF as any}
                onAuthenticate={async () => { }}
                userRole="Shop Assistant"
            />
        );

        // Wait for check
        // findAllByText resolves if at least one match is found (and returns an array)
        // It rejects if NONE are found.
        await screen.findAllByText(/Camera Offline/i, {}, { timeout: 2000 });

        expect(screen.getAllByText(/Camera Offline/i).length).toBeGreaterThan(0);
    });

});
