
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { IDCard } from '../../components/IDCard';

// --- MOCK DATA ---
const mockStaff = {
    id: 'st-001-abc',
    name: 'John Doe',
    role: 'Store Manager',
    photo: 'https://example.com/photo.jpg',
    validUntil: '2026-12-31',
    joinedDate: '2025-01-01',
    dateOfBirth: '1990-05-15',
    bloodGroup: 'O+',
    phone: '07123456789',
    address: '123 Test Lane, London, NW1 1AB',
    email: 'john.doe@englabscivil.com'
};

describe('🪪 ID Card: Redesign & Toggle', () => {

    it('✅ TEST: should show Front side by default and display profile details', () => {
        render(<IDCard staff={mockStaff as any} onClose={vi.fn()} />);

        // Verify Name and Role are on the Front
        expect(screen.getByText('John Doe')).toBeDefined();
        expect(screen.getByText('Store Manager')).toBeDefined();

        // Verify specific details are visible
        expect(screen.getByText('ST-001-A')).toBeDefined(); // Partial ID slice
        expect(screen.getByText('O+')).toBeDefined();
    });

    it('✅ TEST: should toggle to Back side when clicking the flip button', async () => {
        render(<IDCard staff={mockStaff as any} onClose={vi.fn()} />);

        // 1. Find the toggle/flip button
        const flipBtn = screen.getByTestId('id-card-flip-btn');
        fireEvent.click(flipBtn);

        // 2. VERIFY: 'Back Side' content appears
        // We expect a large logo and store contact details on the back
        expect(screen.getAllByText(/Property of ENGLABS Inventory/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Disha Arcade/i)).toBeDefined();
    });
});
