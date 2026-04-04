import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StaffView from '../../components/StaffView';
import React from 'react';



const mockProps = {
    setStaff: vi.fn(),
    attendance: [],
    setAttendance: vi.fn(),
    inventory: [],
    logAction: vi.fn(),
    navigateToProcurement: vi.fn(),
};

describe('🛡️ StaffView Mount', () => {
    it('mounts without crashing', () => {
        render(
            <StaffView 
                {...mockProps} 
                userRole="Owner" 
                currentStaffId="owner1"
                activeStaffName="Alice Owner"
                staff={[]} 
                userId="owner1"
            />
        );
        expect(screen.getByTestId('tab-attendance')).toBeInTheDocument();
    });
});
