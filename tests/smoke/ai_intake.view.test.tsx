
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import SmartAIIntakeView from '../../components/SmartAIIntakeView';
import { InventoryItem } from '../../types';

// --- MOCKS ---
vi.mock('../../lib/firebase', () => ({
    auth: { currentUser: { uid: 'test-user' } },
    db: {}
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    writeBatch: vi.fn(() => ({
        set: vi.fn(),
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined)
    })),
    increment: vi.fn(),
    getDocs: vi.fn(),
    collection: vi.fn()
}));

// Robust GoogleAI Mock
vi.mock('@google/genai', () => ({
    GoogleGenAI: class {
        getGenerativeModel() { return { generateContent: vi.fn() }; }
    }
}));

vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: class {
        constructor() { }
        getGenerativeModel() {
            return {
                generateContent: () => Promise.resolve({
                    response: {
                        text: () => JSON.stringify([
                            {
                                name: "AI Verified Chips",
                                brand: "Lays",
                                qty: 50,
                                costPrice: 0.5,
                                price: 1.2,
                                category: "Snacks",
                                shelfLocation: "A1",
                                barcode: "123456789",
                                sku: "LAYS-VS",
                                box_2d: [0, 0, 1, 1]
                            }
                        ])
                    }
                })
            };
        }
    },
    SchemaType: { ARRAY: 'ARRAY', OBJECT: 'OBJECT', STRING: 'STRING', NUMBER: 'NUMBER' }
}));

describe('🧠 INTELLIGENCE: Smart AI Intake', () => {
    const mockSetInventory = vi.fn();
    const mockLogAction = vi.fn();
    const mockInventory: InventoryItem[] = [];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(window, 'alert').mockImplementation(() => { });
        vi.spyOn(window, 'confirm').mockReturnValue(true);
    });

    const renderComponent = () => {
        render(
            <SmartAIIntakeView
                userId="test-shop-id"
                inventory={mockInventory}
                setInventory={mockSetInventory}
                logAction={mockLogAction}
                postToLedger={vi.fn()}
            />
        );
    };

    it('Renders the AI Interface', () => {
        renderComponent();
        expect(screen.getByText(/Smart Intake/i)).toBeInTheDocument();
    });

    it('Processes Text Input via Mock AI', async () => {
        renderComponent();
        const textarea = screen.getByPlaceholderText(/Or paste manual text entry here/i);
        fireEvent.change(textarea, { target: { value: '50 packets of Lays' } });
        fireEvent.click(screen.getByTitle(/Run AI Analysis/i));

        expect(await screen.findByText(/AI Verified Chips/i)).toBeInTheDocument();
    });

    it('Commits Staged Items to Database', async () => {
        renderComponent();
        const textarea = screen.getByPlaceholderText(/Or paste manual text entry here/i);
        fireEvent.change(textarea, { target: { value: 'Text' } });
        fireEvent.click(screen.getByTitle(/Run AI Analysis/i));

        await waitFor(() => screen.getByText(/Commit to Master Ledger/i));

        const commitBtn = screen.getByText(/Commit to Master Ledger/i);
        fireEvent.click(commitBtn);

        await waitFor(() => {
            expect(mockLogAction).toHaveBeenCalledWith('Inventory Commitment', 'smart-intake', expect.any(String), 'Info');
        });
    });
});
