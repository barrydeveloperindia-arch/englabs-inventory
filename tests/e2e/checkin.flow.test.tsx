import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AccessTerminal } from '../../components/AccessTerminal';
import { StaffMember, UserRole } from '../../types';

// Mock html5-qrcode to prevent Vitest JSDOM environment from hanging
vi.mock('html5-qrcode', () => ({
    Html5QrcodeScanner: vi.fn(),
    Html5Qrcode: vi.fn(() => ({
        start: vi.fn(),
        stop: vi.fn(),
        clear: vi.fn()
    }))
}));
/**
 * 🚆 E2E SIMULATION: CHECK-IN / CHECK-OUT FLOW
 * ------------------------------------------------------------------
 * Objective: Simulate Staff Authentication flow using the AccessTerminal
 */

const mockStaff: StaffMember[] = [{
    id: 's1',
    name: 'Alice Staff',
    role: 'Cashier' as UserRole,
    photo: '',
    status: 'Active' as any,
    pin: '1234',
    email: 'alice@test.com',
    phone: '', hourlyRate: 10, monthlyRate: 0, advance: 0, contractType: 'Full-time', niNumber: '', taxCode: '', rightToWork: true, address: '', emergencyContact: '', joinedDate: '', dailyRate: 0, holidayEntitlement: 0, accruedHoliday: 0
}];

describe('🚀 E2E Flow: Staff Check-In', () => {

    // Mock window.speechSynthesis
    beforeEach(() => {
        Object.defineProperty(window, 'speechSynthesis', {
            value: {
                speak: vi.fn(),
                getVoices: () => [],
            },
            writable: true
        });

        // Mock SpeechSynthesisUtterance
        (global as any).SpeechSynthesisUtterance = vi.fn();
    });

    it('successfully processes PIN authentication', async () => {
        const onAuthArgs = vi.fn().mockResolvedValue(true);
        const onCloseSpy = vi.fn();

        render(
            <AccessTerminal
                isOpen={true}
                onClose={onCloseSpy}
                staff={mockStaff}
                onAuthenticate={onAuthArgs}
                userRole="Cashier" // Current 'Terminal' role, usually limited
            />
        );

        // 1. Select PIN Mode
        // "Passcode" button
        const pinModeBtn = screen.getByText(/Passcode/i);
        fireEvent.click(pinModeBtn);

        // 2. Select User from List
        const userBtn = screen.getByText('Alice Staff');
        fireEvent.click(userBtn);

        // 3. Enter PIN '1234'
        const btn1 = screen.getByText('1');
        const btn2 = screen.getByText('2');
        const btn3 = screen.getByText('3');
        const btn4 = screen.getByText('4');
        const btnOK = screen.getByText('OK');

        fireEvent.click(btn1);
        fireEvent.click(btn2);
        fireEvent.click(btn3);
        fireEvent.click(btn4);
        fireEvent.click(btnOK);

        // 4. Verify Authentication Triggered
        // accessTerminal calls processAuth -> onAuthenticate
        await waitFor(() => {
            expect(onAuthArgs.mock.calls.length).toBeGreaterThan(0);
            expect(onAuthArgs.mock.calls[0][0]).toBe('s1');
            expect(onAuthArgs.mock.calls[0][1]).toBe('PIN');
        });

        // 5. Verify Success UI
        expect(screen.getByText(/SUCCESS/i)).toBeInTheDocument();

        // 6. Verify Close triggered
        await waitFor(() => {
            expect(onCloseSpy).toHaveBeenCalled();
        }, { timeout: 2000 });
    });
});
