import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import StaffView from '../../components/StaffView';
import React from 'react';

// Use same mocks as setupTests for icons to be consistent




const mockOwner: any = {
    id: 'owner1',
    name: 'Alice Owner',
    role: 'Owner',
    pin: '1111',
    status: 'Active',
    contractType: 'Full-time',
    niNumber: 'AB123456C',
    taxCode: '1257L',
    joinedDate: '2020-01-01',
    hourlyRate: 50,
    advance: 0,
    holidayEntitlement: 28,
    accruedHoliday: 0,
    rightToWork: true
};

const mockCashier: any = {
    id: 'cashier1',
    name: 'Bob Cashier',
    role: 'Cashier',
    pin: '2222',
    status: 'Active',
    contractType: 'Full-time',
    niNumber: 'CD789012E',
    taxCode: '1257L',
    joinedDate: '2023-01-01',
    hourlyRate: 15,
    advance: 0,
    holidayEntitlement: 28,
    accruedHoliday: 0,
    rightToWork: true
};

const mockProps = {
    setStaff: vi.fn(),
    attendance: [],
    setAttendance: vi.fn(),
    inventory: [],
    logAction: vi.fn(),
    navigateToProcurement: vi.fn(),
};

describe('🛡️ Unit: Staff RBAC (Permission Matrix)', () => {

    it('Owner Case: Full Access - Can see Manage Button & Financials', async () => {
        render(
            <StaffView 
                {...mockProps} 
                userRole="Owner" 
                currentStaffId="owner1"
                activeStaffName="Alice Owner"
                staff={[mockOwner, mockCashier]} 
                userId="owner1"
            />
        );

        // 0. Go to Master Register
        const teamTab = await screen.findByText('Master Register');
        fireEvent.click(teamTab);

        // 1. Identify Bob and click menu
        const menuBtn = await screen.findByTestId(`menu-btn-${mockCashier.id}`);
        fireEvent.click(menuBtn);

        // 2. Click Edit
        const editBtn = await screen.findByTestId(`edit-btn-${mockCashier.id}`);
        fireEvent.click(editBtn);

        // 3. Financial Tab MUST be there
        await waitFor(() => {
            expect(screen.getByTestId('tab-financials')).toBeInTheDocument();
        }, { timeout: 2000 });
        
        expect(screen.getByText('Timesheet & Pay')).toBeInTheDocument();
    });

    it('Cashier SHOULD NOT see "Timesheet & Pay" tab in the Edit Modal', async () => {
        render(
            <StaffView 
                {...mockProps} 
                userRole="Cashier" 
                currentStaffId="cashier1"
                activeStaffName="Bob Cashier"
                staff={[mockOwner, mockCashier]} 
                userId="cashier1"
            />
        );

        // 0. Go to Master Register
        const teamTab = await screen.findByText('Master Register');
        fireEvent.click(teamTab);

        // 1. Identify themselves and click menu
        const menuBtn = await screen.findByTestId(`menu-btn-${mockCashier.id}`);
        fireEvent.click(menuBtn);

        // 2. Click Edit
        const editBtn = await screen.findByTestId(`edit-btn-${mockCashier.id}`);
        fireEvent.click(editBtn);

        // 3. Financial Tab MUST NOT be there
        expect(screen.queryByTestId('tab-financials')).toBeNull();
        expect(screen.queryByText('Timesheet & Pay')).toBeNull();
        
        // Sanity: Profile tab IS there
        expect(screen.getByText('Profile')).toBeInTheDocument();
    });
});
