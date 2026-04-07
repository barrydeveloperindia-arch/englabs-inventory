import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { NavigationSidebar } from '../../components/NavigationSidebar';
import '@testing-library/jest-dom';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    LayoutDashboard: () => <div data-testid="icon-dashboard" />,
    ShoppingCart: () => <div data-testid="icon-sales" />,
    Package: () => <div data-testid="icon-inventory" />,
    Users: () => <div data-testid="icon-staff" />,
    Landmark: () => <div data-testid="icon-financials" />,
    FileText: () => <div data-testid="icon-purchases" />,
    Truck: () => <div data-testid="icon-suppliers" />,
    LineChart: () => <div data-testid="icon-analytics" />,
    Bot: () => <div data-testid="icon-ai" />,
    HelpCircle: () => <div data-testid="icon-support" />,
    Settings: () => <div data-testid="icon-settings" />,
    LogOut: () => <div data-testid="icon-logout" />,
    ChevronLeft: () => <div data-testid="icon-left" />,
    ChevronRight: () => <div data-testid="icon-right" />,
    Eye: () => <div data-testid="icon-eye" />,
    Briefcase: () => <div data-testid="icon-briefcase" />,
    Activity: () => <div data-testid="icon-activity" />,
    Lightbulb: () => <div data-testid="icon-lightbulb" />,
    FlaskConical: () => <div data-testid="icon-test" />,
    Camera: () => <div data-testid="icon-camera" />,
    Zap: () => <div data-testid="icon-zap" />,
    Info: () => <div data-testid="icon-info" />,
}));

describe('🎨 Branding & Logo Integrity Suite', () => {
    const mockProps = {
        activeView: 'dashboard' as any,
        setActiveView: vi.fn(),
        userRole: 'Owner' as any,
        isMobileMenuOpen: false,
        setIsMobileMenuOpen: vi.fn(),
        onLock: vi.fn(),
    };
 
    beforeEach(() => {
        // Ensure viewport size is sufficient for desktop layout and showing brand header
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });
        vi.clearAllMocks();
    });
 
    it('Scenario 1: Sidebar Logo must be rendered and visible', () => {
        render(<NavigationSidebar {...mockProps} />);
 
        const logoImg = screen.getByAltText(/ENGLABS Inventory/i);
        expect(logoImg).toBeInTheDocument();
        
        // Brand logo container should not have visibility-reducing filters
        const logoContainer = logoImg.parentElement;
        expect(logoContainer?.className).not.toContain('brightness-0');
        expect(logoContainer?.className).not.toContain('invert');
    });
 
    it('Scenario 2: Sidebar Branding labels must be present', () => {
        render(<NavigationSidebar {...mockProps} />);
 
        expect(screen.getByText(/ENGLABS/i)).toBeInTheDocument();
        expect(screen.getByText(/Engineering Portal/i)).toBeInTheDocument();
        expect(screen.getByText(/Core System/i)).toBeInTheDocument();
        expect(screen.getByText(/Inventory/i)).toBeInTheDocument();
    });
});
