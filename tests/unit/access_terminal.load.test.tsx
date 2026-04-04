
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AccessTerminal } from '../../components/AccessTerminal';

// --- MOCKS ---

// Mock HTML5QRCode to prevent JSDOM errors
vi.mock('html5-qrcode', () => ({
    Html5Qrcode: vi.fn().mockImplementation(() => ({
        start: vi.fn(),
        stop: vi.fn(),
        clear: vi.fn()
    })),
    Html5QrcodeScanner: vi.fn()
}));

// Mock FaceAuth to avoid webcam/media device errors
vi.mock('../../components/FaceAuth', () => ({
    FaceAuth: () => <div data-testid="face-auth-mock">FaceAuth Component</div>
}));

// Mock Sound Effects (window.speechSynthesis)
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

describe('🔒 Unit: Access Terminal Loading State', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Displays "Syncing Personnel Database" when Staff list is empty', () => {
        // ARRANGE: Render with EMPTY staff list
        render(
            <AccessTerminal
                isOpen={true}
                onClose={() => { }}
                onAuthenticate={async () => { }}
                staff={[]} // Empty list triggers loading state
                userRole="Cashier"
                isLockMode={true}
            />
        );

        // ACT: Navigate to "Passcode" mode (where user list is shown)
        // Default mode is 'SELECT'. We need to click "Passcode" button.
        const passcodeButton = screen.getByText('Passcode');
        fireEvent.click(passcodeButton);

        // ASSERT: Loading indicator is visible
        expect(screen.getByText(/Syncing Personnel Database/i)).toBeInTheDocument();

        // ASSERT: Spinner is present
        // We look for the animated div or class
        // Since we can't easily query by class in standard RTL without setup, checking TEXT is sufficient verification of the block rendering.
    });

    it('Displays Staff List when data is available', () => {
        // ARRANGE: Render with VALID staff list
        const MOCK_STAFF = [
            { id: 's1', name: 'John Doe', role: 'Manager', pin: '1234' },
            { id: 's2', name: 'Jane Smith', role: 'Cashier', pin: '5678' }
        ];

        render(
            <AccessTerminal
                isOpen={true}
                onClose={() => { }}
                onAuthenticate={async () => { }}
                staff={MOCK_STAFF as any}
                userRole="Cashier"
                isLockMode={true}
            />
        );

        // ACT: Navigate to "Passcode" mode
        const passcodeButton = screen.getByText('Passcode');
        fireEvent.click(passcodeButton);

        // ASSERT: Loading message is NOT present
        expect(screen.queryByText(/Syncing Personnel Database/i)).not.toBeInTheDocument();

        // ASSERT: Staff names are visible
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

});
