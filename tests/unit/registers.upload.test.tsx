import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { RegistersView } from '../../components/RegistersView';
import { StaffMember } from '../../types';
import { Capacitor } from '@capacitor/core';

// --- MOCK CONTROL ---
const mocks = vi.hoisted(() => ({
    isNativePlatform: vi.fn(),
    getPhoto: vi.fn().mockResolvedValue({
        dataUrl: 'data:image/png;base64,mock-image-data'
    })
}));

// --- MOCKS ---
vi.mock('@capacitor/core', () => ({
    Capacitor: {
        isNativePlatform: mocks.isNativePlatform,
    }
}));

vi.mock('@capacitor/camera', () => ({
    Camera: {
        getPhoto: mocks.getPhoto,
    },
    CameraResultType: {
        DataUrl: 'DATA_URL'
    }
}));

vi.mock('lucide-react', () => ({
    CheckSquare: () => <span>CheckSquare</span>,
    Trash2: () => <span>Trash2</span>,
    Calendar: () => <span>Calendar</span>,
    ClipboardList: () => <span>ClipboardList</span>,
    AlertTriangle: () => <span>AlertTriangle</span>,
    ShieldCheck: () => <span>ShieldCheck</span>,
    Download: () => <span>Download</span>,
    Camera: () => <span>CameraIcon</span>,
    Upload: () => <span>Upload</span>,
    CheckCircle2: () => <span>CheckCircle2</span>,
    Loader2: () => <span>Loader2</span>,
    Check: () => <span>Check</span>,
    Search: () => <span>Search</span>,
    Filter: () => <span>Filter</span>,
    ChevronRight: () => <span>ChevronRight</span>,
    X: () => <span>X</span>,
    AlertCircle: () => <span>AlertCircle</span>,
    TrendingUp: () => <span>TrendingUp</span>,
    Clock: () => <span>Clock</span>,
    FileText: () => <span>FileText</span>,
    Activity: () => <span>Activity</span>,
}));

vi.mock('xlsx', () => ({
    utils: {
        book_new: vi.fn(),
        json_to_sheet: vi.fn(),
        book_append_sheet: vi.fn(),
    },
    writeFile: vi.fn(),
}));

vi.mock('../../lib/firestore', () => ({
    subscribeToDailyChecks: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToExpiryLogs: (uid: any, cb: any) => { cb([]); return () => { }; },
    subscribeToCleaningLogs: (uid: any, cb: any) => { cb([]); return () => { }; },
    addDailyCheck: vi.fn(),
    addExpiryLog: vi.fn(),
    addCleaningLog: vi.fn(),
}));

vi.mock('../../lib/firebase', () => ({
    auth: { currentUser: { uid: 'test-uid' } }
}));

const mockStaff = [
    { id: '1', name: 'Test Staff', role: 'Manager' }
] as StaffMember[];

describe('📸 RegistersView: Contextual Photo Upload', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.isNativePlatform.mockReturnValue(false); // Default to Web
        mocks.getPhoto.mockResolvedValue({
            dataUrl: 'data:image/png;base64,mock-image-data'
        });
    });

    it('shows photo upload for ANY task when checked (Web Mode)', async () => {
        mocks.isNativePlatform.mockReturnValue(false);

        const { container } = render(
            <RegistersView
                staff={mockStaff}
                inventory={[]}
                userId="test-uid"
                logAction={vi.fn()}
                navigateToProcurement={vi.fn()}
                activeStaffName="Test Staff"
                userRole="Manager"
                currentStaffId="1"
            />
        );

        const taskText = screen.getByText('Shop shutters & locks checked');
        const label = taskText.closest('label');
        if (!label) throw new Error("Could not find label for task");

        const checkbox = label.querySelector('input[type="checkbox"]');
        if (!checkbox) throw new Error("Could not find checkbox input");

        // Force click the checkbox
        fireEvent.click(checkbox);

        await waitFor(() => {
            expect(screen.getByText(/Add Photo/i)).toBeInTheDocument();
        });

        // Web mode: input exists
        const fileInput = container.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
    });

    it('triggers native camera handler on Native Platform', async () => {
        // SET NATIVE MODE
        mocks.isNativePlatform.mockReturnValue(true);

        const { container } = render(
            <RegistersView
                staff={mockStaff}
                inventory={[]}
                userId="test-uid"
                logAction={vi.fn()}
                navigateToProcurement={vi.fn()}
                activeStaffName="Test Staff"
                userRole="Manager"
                currentStaffId="1"
            />
        );

        // Check task
        const taskText = screen.getByText('Shop shutters & locks checked');
        const label = taskText.closest('label');
        const checkbox = label?.querySelector('input[type="checkbox"]');
        if (checkbox) fireEvent.click(checkbox);

        await waitFor(() => {
            expect(screen.getByText(/Add Photo/i)).toBeInTheDocument();
        });

        // Native mode: NO file input
        const fileInput = container.querySelector('input[type="file"]');
        expect(fileInput).not.toBeInTheDocument();

        // Find and Click the upload button
        // Since user added data-testid="upload-button", use it.
        const uploadButton = screen.getByTestId('upload-button');
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(screen.getByText('Update Photo')).toBeInTheDocument();
        }, { timeout: 2000 });
    });
});
