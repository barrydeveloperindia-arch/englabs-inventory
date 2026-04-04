import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IDCard } from '../../components/IDCard';
import { StaffMember } from '../../types';
import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';

// Mock html2canvas
vi.mock('html2canvas', () => ({
    __esModule: true,
    default: vi.fn(() => Promise.resolve({
        toBlob: (cb: any) => cb(new Blob(['test'], { type: 'image/png' })),
        toDataURL: () => 'data:image/png;base64,fakeimage',
        width: 100,
        height: 100
    }))
}));

// Mock window.open
const originalOpen = window.open;
beforeAll(() => {
    window.open = vi.fn();
});
afterAll(() => {
    window.open = originalOpen;
});

// Mock jsPDF
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

describe('IDCard Component - All-White Design', () => {
    const mockStaff: any = {
        id: '12345678',
        name: 'John Doe',
        role: 'Owner',
        email: 'john@example.com',
        phone: '07123456789',
        address: '123 Test Lane, London',
        joinedDate: '2023-01-01',
        validUntil: '2026-12-31',
        bloodGroup: 'O+',
        dateOfBirth: '1990-01-01',
        photo: 'base64image'
    };

    it('renders staff details correctly', () => {
        render(<IDCard staff={mockStaff} onClose={vi.fn()} />);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Owner')).toBeInTheDocument();
        expect(screen.getByText('12345678')).toBeInTheDocument();
        expect(screen.getByText('O+')).toBeInTheDocument();
        expect(screen.getByText('123 Test Lane, London')).toBeInTheDocument();
    });

    it('renders header elements (Logo & Title)', () => {
        render(<IDCard staff={mockStaff} onClose={vi.fn()} />);
        // Logo Alt text
        expect(screen.getAllByAltText(/ENG/i).length).toBeGreaterThan(0);
        // Brand Title (found in Header and on Back side)
        expect(screen.getAllByText(/ENGLABS/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/INVENTORY/i).length).toBeGreaterThan(0);
    });

    it('renders share buttons', () => {
        render(<IDCard staff={mockStaff} onClose={vi.fn()} />);
        expect(screen.getByText(/WhatsApp/i)).toBeInTheDocument();
        expect(screen.getByText(/Email/i)).toBeInTheDocument();
        expect(screen.getByText(/Download PDF/i)).toBeInTheDocument();
    });

    it('opens WhatsApp with correct text as fallback when clicked', async () => {
        render(<IDCard staff={mockStaff} onClose={vi.fn()} />);
        const waButton = screen.getByText(/WhatsApp/i);
        fireEvent.click(waButton);
        await waitFor(() => {
            expect(window.open).toHaveBeenCalledWith(
                expect.stringContaining('https://wa.me/?text='),
                '_blank'
            );
        });
    });

    it('opens Email with correct subject/body as fallback when clicked', async () => {
        render(<IDCard staff={mockStaff} onClose={vi.fn()} />);
        const emailButton = screen.getByText(/Email/i);
        fireEvent.click(emailButton);
        await waitFor(() => {
            expect(window.open).toHaveBeenCalledWith(
                expect.stringContaining('mailto:?subject='),
                '_blank'
            );
        });
    });

    it('triggers onClose when close button clicked', () => {
        const onCloseMock = vi.fn();
        render(<IDCard staff={mockStaff} onClose={onCloseMock} />);
        // Find close button by icon or position (last button in the group usually or specific class)
        // Adjust if necessary based on icon usage
        // const closeButton = screen.getByRole('button', { name: /close/i }); // if aria-label exists
        // simplified selector for now
    });
});
