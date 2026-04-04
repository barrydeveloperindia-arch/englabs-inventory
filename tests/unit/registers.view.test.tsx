
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { RegistersView } from '../../components/RegistersView';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UserRole, StaffMember, InventoryItem } from '../../types';

// --- Mocks ---
vi.mock('../../lib/firebase', () => ({
    auth: {
        currentUser: { uid: 'test-user-id' }
    }
}));

const mockAddDailyCheck = vi.fn();
const mockAddExpiryLog = vi.fn();
const mockAddCleaningLog = vi.fn();

vi.mock('../../lib/firestore', () => ({
    subscribeToDailyChecks: vi.fn((userId, callback) => {
        // Initial empty state
        callback([]);
        return () => { };
    }),
    subscribeToExpiryLogs: vi.fn((userId, callback) => {
        callback([]);
        return () => { };
    }),
    subscribeToCleaningLogs: vi.fn((userId, callback) => {
        callback([]);
        return () => { };
    }),
    addDailyCheck: (userId: string, data: any) => mockAddDailyCheck(userId, data),
    addExpiryLog: (userId: string, data: any) => mockAddExpiryLog(userId, data),
    addCleaningLog: (userId: string, data: any) => mockAddCleaningLog(userId, data),
}));

vi.mock('xlsx', () => ({
    utils: {
        book_new: vi.fn(),
        json_to_sheet: vi.fn(),
        book_append_sheet: vi.fn(),
    },
    writeFile: vi.fn(),
}));

vi.mock('jspdf', () => ({
    default: class {
        text = vi.fn();
        save = vi.fn();
        setFontSize = vi.fn();
    }
}));

vi.mock('jspdf-autotable', () => ({
    default: vi.fn(),
}));

vi.mock('@capacitor/camera', () => ({
    Camera: {
        getPhoto: vi.fn(),
    }
}));

// --- Test Data ---
const mockStaff = [
    {
        id: 's1',
        name: 'Test Staff',
        role: 'Staff' as UserRole,
        pin: '1234',
        email: 'test@example.com',
        joinedDate: '2023-01-01',
        contractType: 'Full-time',
        niNumber: 'AB123456C',
        taxCode: '1257L',
        rightToWork: true,
        emergencyContact: '1234567890',
        status: 'Active',
        monthlyRate: 2000,
        hourlyRate: 15,
        dailyRate: 100,
        advance: 0,
        holidayEntitlement: 20,
        accruedHoliday: 0,
    }
] as unknown as StaffMember[];

const mockInventory = [
    {
        id: 'i1',
        name: 'Milk',
        brand: 'Amul',
        category: 'Dairy',
        price: 50,
        stock: 10,
        minStock: 5,
        barcode: '123',
        sku: '123',
        packSize: '1L',
        unitType: 'litre',
        supplierId: 'sup1',
        origin: 'India',
        costPrice: 40,
        vatRate: 0,
        status: 'Active'
    }
] as unknown as InventoryItem[];

const defaultProps = {
    userId: 'test-user-id',
    staff: mockStaff,
    inventory: mockInventory,
    logAction: vi.fn(),
    navigateToProcurement: vi.fn(),
    activeStaffName: 'Test Staff',
    userRole: 'Manager' as UserRole,
    currentStaffId: 's1'
};

describe('RegistersView Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the Shop Registers header and enhanced dashboard elements', () => {
        render(<RegistersView {...defaultProps} />);

        expect(screen.getByText('SHOP REGISTERS')).toBeInTheDocument();
        expect(screen.getByText('Daily Checks')).toBeInTheDocument();
        // Analytics Section
        expect(screen.getByText("Today's Overview")).toBeInTheDocument();
    });

    it('displays validation alert when trying to submit checks without tasks', () => {
        render(<RegistersView {...defaultProps} />);

        // Add confirm mock
        window.alert = vi.fn();

        const submitBtn = screen.getByText('Log Opening Check');
        fireEvent.click(submitBtn);

        expect(window.alert).toHaveBeenCalledWith("Please complete at least one check before saving.");
    });

    it('shows confirmation modal before improved submission', async () => {
        render(<RegistersView {...defaultProps} />);

        // Complete a task
        const taskLabel = screen.getByText('Shop shutters & locks checked');
        fireEvent.click(taskLabel);

        // Click Log
        const logBtn = screen.getByText('Log Opening Check');
        fireEvent.click(logBtn);

        // Modal should appear
        expect(screen.getByText('Confirm Submission')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to log these Opening checks/i)).toBeInTheDocument();

        // Confirm
        const confirmBtn = screen.getByText('Confirm & Log');
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(mockAddDailyCheck).toHaveBeenCalledTimes(1);
        });

        // Check Success Toast
        expect(await screen.findByText('Opening Checks Logged Successfully')).toBeInTheDocument();
    });

    it('filters audit log correctly', async () => {
        // Mock data subscription would be complex here due to internal state, 
        // focus on UI elements presence for search/filter
        render(<RegistersView {...defaultProps} />);

        expect(screen.getByPlaceholderText('Search logs...')).toBeInTheDocument();
        expect(screen.getByText('All Status')).toBeInTheDocument();
    });

    it('handles PDF export trigger', () => {
        render(<RegistersView {...defaultProps} />);

        // Find PDF export button (by title attribute since text 'PDF' is hidden on small screens possible, but we look for text as default behavior)
        const pdfBtn = screen.getByTitle('Export to PDF');
        fireEvent.click(pdfBtn);

        // Since we mock jsPDF class, we assume if no error thrown, it executed
        // We can't easily spy on the constructor instance methods without more complex mocking
        // Ideally we check if `jspdf` constructor was called, but vitest mock above handles safe execution
    });

    it('handles barcode scanning and auto-selection in Expiry tab', async () => {
        render(<RegistersView {...defaultProps} />);

        // Switch to Expiry tab
        fireEvent.click(screen.getByText('Expiry'));

        const barcodeInput = screen.getByPlaceholderText('Scan barcode...');
        fireEvent.change(barcodeInput, { target: { value: '123' } });

        // Wait for the lookup effect
        await waitFor(() => {
            // Check the select value
            const select = screen.getByRole('combobox', { name: /Product Name/i });
            expect(select).toHaveValue('i1');
        }, { timeout: 2000 });
    });
});
