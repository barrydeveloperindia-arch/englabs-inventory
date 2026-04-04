
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import { NavigationSidebar } from '../../components/NavigationSidebar';

// --- MOCKS ---

// Mock Firebase Auth
vi.mock('../../lib/firebase', () => ({
    auth: {
        currentUser: { uid: 'test-user' }
    }
}));

// Mock Logo (to check presence/absence)
vi.mock('../../components/Logo', () => ({
    BrandLogo: () => <div data-testid="app-logo">LOGO</div>
}));

// Mock ThemeToggle
vi.mock('../../components/ui/ThemeToggle', () => ({
    ThemeToggle: () => <div>ThemeToggle</div>
}));

// Helper to resize window
const resizeWindow = (height: number) => {
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
    window.dispatchEvent(new Event('resize'));
};

describe('📱 Unit: Navigation Sidebar Landscape Optimization', () => {

    // Common Props
    const defaultProps = {
        activeView: 'dashboard' as any,
        setActiveView: vi.fn(),
        userRole: 'Owner' as any,
        isMobileMenuOpen: true, // Force open for testing content
        setIsMobileMenuOpen: vi.fn(),
        onLock: vi.fn()
    };

    beforeEach(() => {
        // Reset to standard Desktop/Pro size
        resizeWindow(1080);
    });

    it('Shows Header (Logo & Title) on Tall Screens (Desktop/Portrait)', () => {
        render(<NavigationSidebar {...defaultProps} />);

        // Should see Logo
        expect(screen.getByTestId('app-logo')).toBeInTheDocument();
        // Should see Title Text
        expect(screen.getByText(/ENGLABS\s*Inventory/i)).toBeInTheDocument();
    });

    it('Hides Header (Logo & Title) on Short Screens (Mobile Landscape)', () => {
        // Simulate iPhone Landscape Height (~375px)
        resizeWindow(375);

        render(<NavigationSidebar {...defaultProps} />);

        // Should NOT see Logo
        expect(screen.queryByTestId('app-logo')).not.toBeInTheDocument();

        // Should NOT see Title Text
        // Note: We search for the text. queryByText returns null if not found.
        expect(screen.queryByText('ENGLABS Inventory', { exact: false })).not.toBeInTheDocument();

        // Modules list should still be there (verifying structure)
        expect(screen.getByText('Inventory Engine')).toBeInTheDocument();
        expect(screen.getAllByText('Center').length).toBeGreaterThan(0);
    });

    it('Responds to Window Resize dynamically', () => {
        const { rerender } = render(<NavigationSidebar {...defaultProps} />);

        // Start Tall -> Visible
        expect(screen.getByTestId('app-logo')).toBeInTheDocument();

        // Resize to Short -> Hidden
        act(() => {
            resizeWindow(400);
        });

        // Vitest/React renders are synchronous in tests usually, but hooks need updates. 
        // We might need to force update if the event listener isn't picked up instantly?
        // resizeWindow dispatches 'resize'. Component useEffect listens.
        // It updates state -> re-render.

        expect(screen.queryByTestId('app-logo')).not.toBeInTheDocument();

        // Resize back to Tall -> Visible
        act(() => {
            resizeWindow(900);
        });

        expect(screen.getByTestId('app-logo')).toBeInTheDocument();
    });

});
