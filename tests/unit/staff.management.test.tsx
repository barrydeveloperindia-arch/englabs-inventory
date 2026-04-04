
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import StaffView from '../../components/StaffView';
import { StaffMember } from '../../types';

const mockStaff: StaffMember[] = [
    {
        id: '1',
        name: 'Bharat Anand',
        role: 'Owner',
        status: 'Active',
        email: 'bharat@englabs.com',
        pin: '1111',
        joinedDate: '2025-01-01',
        contractType: 'Full-time',
        niNumber: 'QQ123456A',
        taxCode: '1257L',
        rightToWork: true,
        emergencyContact: 'Family',
        monthlyRate: 0,
        hourlyRate: 0,
        dailyRate: 0,
        advance: 0,
        holidayEntitlement: 28,
        accruedHoliday: 0,
        photo: 'mock.png'
    },
    {
        id: '5',
        name: 'Gaurav Panchal',
        role: 'Manager',
        status: 'Active',
        email: 'gaurav@englabs.com',
        pin: '5555',
        joinedDate: '2025-02-01',
        contractType: 'Full-time',
        niNumber: 'GP123456C',
        taxCode: '1257L',
        rightToWork: true,
        emergencyContact: 'Family',
        monthlyRate: 0,
        hourlyRate: 15.00,
        dailyRate: 0,
        advance: 0,
        holidayEntitlement: 28,
        accruedHoliday: 0,
        photo: 'mock.png'
    },
];

describe('🛡️ Unit: Staff Management', () => {
    it('renders staff registry correctly', () => {
        render(
            <StaffView
                userRole="Owner"
                staff={mockStaff}
                setStaff={vi.fn()}
                attendance={[]}
                setAttendance={vi.fn()}
                inventory={[]}
                activeStaffName="Bharat"
                currentStaffId="1"
                userId="test-shop-id"
                logAction={vi.fn()}
                navigateToProcurement={vi.fn()}
            />
        );
        // By default, it might be on 'attendance' tab. Registry is one of the tabs.
        // Let's click on high-level navigation to ensure we see the registry.
        // Wait, line 69: const [activeTab, setActiveTab] = useState('attendance');
        // I need to switch to registry tab or find the text in the registry tab after clicking.

        // Find the "Master Register" button or similar that sets tab to 'registry'
        // Actually, let's look for "Workforce Ledger" which is only in renderRegistry.

        // The registry tab button has text "Workforce" or "Registry"?
        // Let's check tab buttons.
    });

    it('displays Workforce Ledger when on registry tab', () => {
        render(
            <StaffView
                userRole="Owner"
                staff={mockStaff}
                setStaff={vi.fn()}
                attendance={[]}
                setAttendance={vi.fn()}
                inventory={[]}
                activeStaffName="Bharat"
                currentStaffId="1"
                userId="test-shop-id"
                logAction={vi.fn()}
                navigateToProcurement={vi.fn()}
            />
        );

        // Find the tab button for Registry using data-testid
        const registryTab = screen.getByTestId('tab-registry');
        fireEvent.click(registryTab);

        const registryView = screen.getByTestId('registry-view');
        const { getByText } = within(registryView);

        expect(getByText(/Workforce Ledger/i)).toBeInTheDocument();
        expect(getByText(/Bharat Anand/i)).toBeInTheDocument();
        expect(getByText(/Gaurav Panchal/i)).toBeInTheDocument();
    });

    it('filters staff by search query in registry', () => {
        render(
            <StaffView
                userRole="Owner"
                staff={mockStaff}
                setStaff={vi.fn()}
                attendance={[]}
                setAttendance={vi.fn()}
                inventory={[]}
                activeStaffName="Bharat"
                currentStaffId="1"
                userId="test-shop-id"
                logAction={vi.fn()}
                navigateToProcurement={vi.fn()}
            />
        );

        const registryTab = screen.getByTestId('tab-registry');
        fireEvent.click(registryTab);

        const searchInput = screen.getByPlaceholderText(/Audit personnel/i);
        fireEvent.change(searchInput, { target: { value: 'Gaurav' } });

        const registryView = screen.getByTestId('registry-view');
        const { getByText, queryByText } = within(registryView);

        expect(getByText(/Gaurav Panchal/i)).toBeInTheDocument();
        expect(queryByText(/Bharat Anand/i)).not.toBeInTheDocument();
    });
});
