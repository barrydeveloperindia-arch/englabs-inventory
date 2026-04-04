
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IDCard } from '../../components/IDCard';
import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';

// Mock html2canvas
vi.mock('html2canvas', () => ({
    __esModule: true,
    default: vi.fn(() => Promise.resolve({
        toDataURL: () => 'data:image/png;base64,fakeimage',
        width: 100,
        height: 100
    }))
}));

// Mock jsPDF - Define inside to avoid hoisting issues
vi.mock('jspdf', () => {
    return {
        __esModule: true,
        default: class {
            constructor() {
                return {
                    addImage: vi.fn(),
                    save: vi.fn(),
                    output: vi.fn(() => new Blob(['pdf-content'], { type: 'application/pdf' })),
                    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
                    getImageProperties: vi.fn(() => ({ width: 100, height: 100 }))
                };
            }
        }
    };
});

// Mock Navigator Share
const mockShare = vi.fn();
Object.defineProperty(navigator, 'share', {
    value: mockShare,
    writable: true
});
Object.defineProperty(navigator, 'canShare', {
    value: () => true,
    writable: true
});

describe('IDCard PDF Sharing', () => {
    const mockStaff: any = {
        id: '12345678',
        name: 'John Doe',
        role: 'Test Role',
        email: 'john@example.com',
        phone: '07123456789',
        joinedDate: '2023-01-01',
        validUntil: '2026-12-31'
    };

    it('generates PDF and calls navigator.share when WhatsApp is clicked (Mobile behavior)', async () => {
        render(<IDCard staff={mockStaff} onClose={vi.fn()} />);

        const waButton = screen.getByText(/WhatsApp/i);
        fireEvent.click(waButton);

        await waitFor(() => {
            expect(mockShare).toHaveBeenCalledWith(expect.objectContaining({
                files: expect.arrayContaining([expect.any(File)])
            }));
        }, { timeout: 2000 });

        const callArgs = mockShare.mock.calls[0][0];
        const file = callArgs.files[0];
        expect(file.type).toBe('application/pdf');
    });

    it('generates PDF and calls navigator.share when Email is clicked (Mobile behavior)', async () => {
        mockShare.mockClear();
        render(<IDCard staff={mockStaff} onClose={vi.fn()} />);

        const emailButton = screen.getByText(/Email/i);
        fireEvent.click(emailButton);

        await waitFor(() => {
            expect(mockShare).toHaveBeenCalled();
        }, { timeout: 2000 });
    });
});
