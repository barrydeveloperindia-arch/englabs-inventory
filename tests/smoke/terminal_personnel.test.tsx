
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AccessTerminal } from '../../components/AccessTerminal';

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
    auth: { currentUser: { uid: 'test-uid' } },
    db: {},
}));

const mockStaff = [
    { id: 'bharat-anand', name: 'Bharat Anand', role: 'Owner' },
    { id: 'default-admin', name: 'Admin User', role: 'Director' },
    { id: 'demo-user', name: 'Demo Manager', role: 'Manager' },
    { id: 'gaurav-staff', name: 'Gaurav Singh', role: 'Manager' }
];

describe('🛡️ Localhost Smoke Test: Access Terminal Staff', () => {

    it('should display all updated staff names and roles after selecting PIN method', async () => {
        const onAuthenticate = vi.fn();
        const onClose = vi.fn();

        render(
            <AccessTerminal
                isOpen={true}
                onClose={onClose}
                staff={mockStaff as any}
                onAuthenticate={onAuthenticate}
            />
        );

        // Switch to PIN mode to see personnel list
        fireEvent.click(screen.getByTestId('mode-pin'));

        // Verify Names
        expect(screen.getByText('Bharat Anand')).toBeInTheDocument();
        expect(screen.getByText('Admin User')).toBeInTheDocument();
        expect(screen.getByText('Demo Manager')).toBeInTheDocument();
        expect(screen.getByText('Gaurav Singh')).toBeInTheDocument();

        // Verify Roles uniquely
        // We use string match with leading/trailing spaces or specifically check the role container text
        // Role "OWNER"
        expect(screen.getByText(/^OWNER$/i)).toBeInTheDocument();
        // Role "DIRECTOR"
        expect(screen.getByText(/^DIRECTOR$/i)).toBeInTheDocument();
        // Role "MANAGER" should appear exactly twice
        expect(screen.getAllByText(/^MANAGER$/i).length).toBe(2);
    });
});
