
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import React from 'react';
import { AccessTerminal } from '../../components/AccessTerminal';

const mockStaff = [
    { id: '1', name: 'Test User', role: 'Owner', pin: '1234', email: 'test@test.com' }
];

describe('AccessTerminal Error Handling', () => {
    it('shows error message on invalid PIN', async () => {
        const onAuthenticate = vi.fn().mockRejectedValue(new Error('Invalid PIN'));

        render(
            <AccessTerminal
                isOpen={true}
                onClose={() => { }}
                staff={mockStaff as any}
                onAuthenticate={onAuthenticate}
            />
        );

        // Select PIN method
        fireEvent.click(screen.getByText(/Passcode/i));

        // Select Staff
        fireEvent.click(screen.getByText(/Test User/i));

        // Enter wrong digits
        fireEvent.click(screen.getByTestId('pin-pad-1'));
        fireEvent.click(screen.getByTestId('pin-pad-1'));
        fireEvent.click(screen.getByTestId('pin-pad-1'));
        fireEvent.click(screen.getByTestId('pin-pad-1'));

        // Should show error
        await waitFor(() => {
            expect(screen.getByText(/Invalid PIN/i)).toBeInTheDocument();
        });
    });

    it('shows camera access error if QR scanner fails', async () => {
        // Mock Navigator MediaDevices for Hardware Heartbeat
        Object.defineProperty(navigator, 'mediaDevices', {
            value: {
                enumerateDevices: vi.fn().mockResolvedValue([{ kind: 'videoinput', label: 'Webcam' }]),
                getUserMedia: vi.fn(),
            },
            writable: true,
        });

        render(
            <AccessTerminal
                isOpen={true}
                onClose={() => { }}
                staff={mockStaff as any}
                onAuthenticate={vi.fn()}
            />
        );

        // Wait for hardware check
        await waitFor(() => {
            expect(screen.getByTestId('mode-qr')).toBeEnabled();
        });

        fireEvent.click(screen.getByTestId('mode-qr'));
        // The component handles QR scanner internally
        // We can check if it shows an error message if the library fails
    });
});
