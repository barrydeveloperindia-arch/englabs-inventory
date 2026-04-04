
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TeslaInventoryOS } from '../../components/TeslaInventoryOS';
import { InventoryItem } from '../../types';

// 🔍 Mocking Core Dependencies
vi.mock('@google/genai', () => ({
    GoogleGenAI: vi.fn().mockImplementation(() => ({
        models: {
            generateContent: vi.fn().mockResolvedValue({
                text: JSON.stringify({
                    itemName: "HT Bolt M12",
                    qty: 50,
                    price: 2.5,
                    confidence: 0.95
                })
            })
        }
    }))
}));

vi.mock('html5-qrcode', () => ({
    Html5QrcodeScanner: vi.fn().mockImplementation(() => ({
        render: vi.fn(),
        clear: vi.fn()
    }))
}));

// 📷 Mock MediaDevices
const mockStream = {
    getTracks: () => [{ stop: vi.fn() }]
};
global.navigator.mediaDevices = {
    getUserMedia: vi.fn().mockResolvedValue(mockStream)
} as any;

describe('Tesla Mode: Autonomous Inventory OS - Functional Test', () => {
    const mockInventory: InventoryItem[] = [
        { id: '1', name: 'HT Bolt M12', stock: 100, price: 2.5, category: 'Hardware', sku: 'HTB-12' } as any
    ];
    const setInventory = vi.fn();
    const logAction = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the Tesla Mode HUD with correct styling', () => {
        render(
            <TeslaInventoryOS 
                userId="shop-123" 
                inventory={mockInventory} 
                setInventory={setInventory} 
                logAction={logAction} 
            />
        );

        expect(screen.getByText(/TESLA/i)).toBeInTheDocument();
        expect(screen.getByText(/MODE/i)).toBeInTheDocument();
        expect(screen.getByText(/Auto-Pilot Active/i)).toBeInTheDocument();
        expect(screen.getByText(/Neural History/i)).toBeInTheDocument();
    });

    it('should toggle Auto-Pilot mode correctly', () => {
        render(
            <TeslaInventoryOS 
                userId="shop-123" 
                inventory={mockInventory} 
                setInventory={setInventory} 
                logAction={logAction} 
            />
        );

        const toggleBtn = screen.getByText(/Auto-Pilot Active/i);
        fireEvent.click(toggleBtn);
        expect(screen.getByText(/Manual Override/i)).toBeInTheDocument();
        
        fireEvent.click(screen.getByText(/Manual Override/i));
        expect(screen.getByText(/Auto-Pilot Active/i)).toBeInTheDocument();
    });

    it('should commit an update automatically when in Auto-Pilot and confidence is high', async () => {
        render(
            <TeslaInventoryOS 
                userId="shop-123" 
                inventory={mockInventory} 
                setInventory={setInventory} 
                logAction={logAction} 
            />
        );

        // 1. Simulate Scan Bill click
        const scanBillBtn = screen.getByText(/Scan Bill/i);
        fireEvent.click(scanBillBtn);

        // 2. Wait for Neural Processing (mocked)
        await waitFor(() => {
            expect(screen.getByText(/Neural Matrix Reconstruction/i)).toBeInTheDocument();
        });

        // 3. Verify Inventory Update is called (Autonomous Commit)
        await waitFor(() => {
            expect(setInventory).toHaveBeenCalled();
            const updateFn = setInventory.mock.calls[0][0];
            const updatedInventory = updateFn(mockInventory);
            
            const boltItem = updatedInventory.find((i: any) => i.name === "HT Bolt M12");
            expect(boltItem.stock).toBe(150); // 100 + 50 from mock AI
        });

        // 4. Verify Log Entry
        expect(logAction).toHaveBeenCalledWith(
            expect.stringContaining('Tesla Vision: BILL Managed'),
            'inventory',
            expect.stringContaining('HT Bolt M12 (+50)'),
            'Info'
        );

        // 5. Verify UI Log Update
        expect(screen.getByText(/HT Bolt M12/i)).toBeInTheDocument();
        expect(screen.getByText(/95% Confidence/i)).toBeInTheDocument();
    });

    it('should handle scan errors gracefully', async () => {
        const { GoogleGenAI } = await import('@google/genai');
        (GoogleGenAI as any).mockImplementationOnce(() => ({
            models: {
                generateContent: vi.fn().mockRejectedValue(new Error("Network Error"))
            }
        }));

        render(
            <TeslaInventoryOS 
                userId="shop-123" 
                inventory={mockInventory} 
                setInventory={setInventory} 
                logAction={logAction} 
            />
        );

        fireEvent.click(screen.getByText(/Scan Bill/i));

        await waitFor(() => {
            expect(logAction).toHaveBeenCalledWith(
                "Tesla Vision Error",
                'inventory',
                "Unclear scan detected",
                'Warning'
            );
        });
    });
});
