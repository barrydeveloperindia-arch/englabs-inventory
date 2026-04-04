
import React from 'react';
import { render, screen } from '@testing-library/react';
import { NavigationSidebar } from '../../components/NavigationSidebar';
import { UserRole } from '../../types';
import '@testing-library/jest-dom';
import { vi, describe, test, expect } from 'vitest';

// Mock dependencies
vi.mock('../../lib/firebase', () => ({
    auth: { currentUser: { uid: 'test-uid' } }
}));

// Mock Logo and ThemeToggle to avoid complex rendering
vi.mock('../../components/Logo', () => ({
    BrandLogo: () => <div data-testid="logo">Logo</div>
}));
vi.mock('../../components/ui/ThemeToggle', () => ({
    ThemeToggle: () => <div>ThemeToggle</div>
}));

describe('NavigationSidebar Access Control', () => {
    const mockSetActiveView = vi.fn();
    const mockSetIsMobileMenuOpen = vi.fn();
    const mockOnLock = vi.fn();

    const renderSidebar = (role: UserRole) => {
        render(
            <NavigationSidebar
                activeView="dashboard"
                setActiveView={mockSetActiveView}
                userRole={role}
                isMobileMenuOpen={true} // Open to ensure items are rendered
                setIsMobileMenuOpen={mockSetIsMobileMenuOpen}
                onLock={mockOnLock}
            />
        );
    };

    test('Shop Assistant should see Sales, Inventory, and Staff tabs', () => {
        renderSidebar('Shop Assistant');

        // Allowed
        expect(screen.getByText('Point of Sale')).toBeInTheDocument();
        expect(screen.getByText('Stock Console')).toBeInTheDocument();
        expect(screen.getByText('Workforce')).toBeInTheDocument();

        // Restricted
        expect(screen.queryByText('Shop Camera')).not.toBeInTheDocument();
        expect(screen.queryByText('Ledger')).not.toBeInTheDocument();
        expect(screen.queryByText('Procurement')).not.toBeInTheDocument();
    });

    test('Manager should see Shop Camera and Procurement', () => {
        renderSidebar('Manager');

        // Note: 'Shop Camera' is the label for command-center
        expect(screen.getByText('Shop Camera')).toBeInTheDocument();
        expect(screen.getByText('Procurement')).toBeInTheDocument();
        expect(screen.getByText('Point of Sale')).toBeInTheDocument();
        expect(screen.getByText('Workforce')).toBeInTheDocument();
    });

    test('Director should see Financials', () => {
        renderSidebar('Director');
        expect(screen.getByText('Ledger')).toBeInTheDocument();
    });

    test('Cashier should see Sales and Staff but NO Inventory Management (if restricted)', () => {
        // Based on current implementation, Cashier IS in the roleLimit for Sales and Staff
        renderSidebar('Cashier');

        expect(screen.getByText('Point of Sale')).toBeInTheDocument();
        expect(screen.getByText('Workforce')).toBeInTheDocument();

        // Check Admin Tabs
        expect(screen.queryByText('Shop Camera')).not.toBeInTheDocument();
    });
});
