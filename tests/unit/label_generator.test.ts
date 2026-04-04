
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateShelfLabels } from '../../lib/label_generator';
import { InventoryItem } from '../../types';

// Mock jsPDF
vi.mock('jspdf', () => {
    return {
        jsPDF: class {
            addPage = vi.fn();
            save = vi.fn();
            setDrawColor = vi.fn();
            rect = vi.fn();
            setFont = vi.fn();
            setFontSize = vi.fn();
            setTextColor = vi.fn();
            text = vi.fn();
            splitTextToSize = vi.fn().mockReturnValue(['Mock Text']);
            addImage = vi.fn();
        }
    };
});

// Mock JsBarcode
vi.mock('jsbarcode', () => {
    return {
        default: vi.fn()
    };
});

describe('🏷️ Label Generator Unit Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock document.createElement for canvas
        if (typeof global !== 'undefined') {
            (global as any).document = {
                createElement: vi.fn().mockReturnValue({
                    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock')
                })
            };
        }
    });

    const mockItems: InventoryItem[] = [
        {
            id: 'item1', name: 'Test Product', stock: 10, minStock: 5, sku: 'SKU1', category: 'Stock',
            brand: 'Test Brand', price: 9.99, costPrice: 5, vatRate: 20, status: 'Active',
            unitType: 'pcs', packSize: '1', origin: 'UK', lastBuyPrice: 5, logs: [], barcode: '1234567890123',
            supplierId: 'sup1'
        }
    ];

    it('Generates a PDF for a list of items', async () => {
        const fileName = await generateShelfLabels(mockItems);
        expect(fileName).toContain('SEL_Labels');
        expect(fileName).toContain('.pdf');
    });

    it('Handles empty item list gracefully', async () => {
        const fileName = await generateShelfLabels([]);
        expect(fileName).toBeDefined();
    });
});
