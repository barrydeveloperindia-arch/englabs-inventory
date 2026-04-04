
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import React from 'react';
import { AccessTerminal } from '../../components/AccessTerminal';

// Mock html5-qrcode
vi.mock('html5-qrcode', () => ({
    Html5QrcodeScanner: vi.fn(),
    Html5Qrcode: vi.fn(() => ({
        start: vi.fn(),
        stop: vi.fn(),
        clear: vi.fn()
    }))
}));

describe('Debug AccessTerminal', () => {
    it('Should render Select Method when open', async () => {
        const mockStaff = [
            { id: '1', name: 'John', role: 'Cashier', pin: '1234' }
        ];

        render(
            <AccessTerminal
                isOpen={true}
                onClose={vi.fn()}
                staff={mockStaff as any}
                onAuthenticate={async () => { }}
                isLockMode={true}
            />
        );

        console.log('DEBUG: Temp AccessTerminal Test DOM:');
        screen.debug();

        await waitFor(() => expect(screen.getByText(/Select Method/i)).toBeInTheDocument());
    });
});
