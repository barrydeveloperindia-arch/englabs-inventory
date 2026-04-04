import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { BrandLogo } from '../../components/Logo';
import { AccessTerminal } from '../../components/AccessTerminal';
import { NavigationSidebar } from '../../components/NavigationSidebar';

describe('Smoke Tests - Critical Components', () => {
    it('renders BrandLogo without crashing', () => {
        const { container } = render(<BrandLogo size="md" />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it('renders AccessTerminal when open', () => {
        // Mock FaceAuth to avoid camera issues
        vi.mock('../../components/FaceAuth', () => ({
            FaceAuth: () => <div>Mock FaceAuth</div>
        }));

        const { getByText } = render(
            <AccessTerminal
                isOpen={true}
                onClose={vi.fn()}
                staff={[]}
                onAuthenticate={vi.fn()}
                userRole="Assistant"
            />
        );
        const logo = document.querySelector('img[alt="ENGLABS Inventory"]');
        expect(logo).toBeInTheDocument();
        expect(getByText('Secure Entry Point')).toBeInTheDocument();
    });

    it('renders NavigationSidebar', () => {
        // Mock hooks if necessary (useNavigate etc)? NavigationSidebar uses Link?
        // NavigationSidebar uses Icons and Logo.
        // It uses `auth` from firebase? Yes.
        // We might need to mock firebase auth.

        vi.mock('../../lib/firebase', () => ({
            auth: { currentUser: { email: 'test@example.com' } }
        }));

        const { container } = render(
            <NavigationSidebar
                activeView="dashboard"
                setActiveView={vi.fn()}
                isMobileMenuOpen={true}
                setIsMobileMenuOpen={vi.fn()}
                userRole="Owner"
                onLock={vi.fn()}
            />
        );
        expect(container).toBeInTheDocument();
        const logo = container.querySelector('img[alt="ENGLABS Inventory"]');
        expect(logo).toBeInTheDocument();
    });
});
