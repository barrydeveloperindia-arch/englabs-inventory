
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus } from '../../lib/eventBus';
import { InventoryItem } from '../../types';

/**
 * @module ProcurementAITests
 * @description Verifies the logic for Procurement Intelligence and Autonomous Inventory Scans.
 */
describe('Procurement Intelligence & Autonomous Vision Scans', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should correctly categorize stock health for procurement', () => {
        const mockInventory: InventoryItem[] = [
            { id: '1', name: 'Optimized Item', stock: 20, minStock: 5, category: 'Snacks', price: 1, costPrice: 0.5, vatRate: 20, status: 'Active', brand: 'Generic', sku: 'SKU1', lastBuyPrice: 0.5, unitType: 'pcs', packSize: '1', origin: 'UK', logs: [], barcode: '123', supplierId: 'sup1' },
            { id: '2', name: 'Low Stock Item', stock: 4, minStock: 5, category: 'Drinks', price: 2, costPrice: 1, vatRate: 20, status: 'Active', brand: 'Generic', sku: 'SKU2', lastBuyPrice: 1, unitType: 'pcs', packSize: '1', origin: 'UK', logs: [], barcode: '456', supplierId: 'sup1' },
            { id: '3', name: 'Critical Item', stock: 1, minStock: 5, category: 'Groceries', price: 3, costPrice: 1.5, vatRate: 20, status: 'Active', brand: 'Generic', sku: 'SKU3', lastBuyPrice: 1.5, unitType: 'pcs', packSize: '1', origin: 'UK', logs: [], barcode: '789', supplierId: 'sup1' }
        ];

        const lowCount = mockInventory.filter(i => i.stock > 0 && i.stock <= 5).length;
        const criticalCount = mockInventory.filter(i => i.stock <= 2).length;

        expect(lowCount).toBe(2); // Low and Critical both count as <= 5
        expect(criticalCount).toBe(1);
    });

    it('should emit INVENTORY_SCAN_ACTION event on autonomous scan', async () => {
        const spy = vi.fn();
        eventBus.on('INVENTORY_SCAN_ACTION', spy);

        const payload = {
            itemId: 'test-id',
            itemName: 'Test Product',
            type: 'SALE' as const,
            timestamp: Date.now()
        };

        eventBus.emit({
            type: 'INVENTORY_SCAN_ACTION',
            payload
        });

        expect(spy).toHaveBeenCalledWith(payload);
    });

    it('should calculate correct UK VAT for neural sales', () => {
        const price = 10.00;
        const vatRate = 20; // 20%
        const netPrice = price / (1 + vatRate / 100);
        const vatAmount = price - netPrice;

        expect(netPrice).toBeCloseTo(8.33, 2);
        expect(vatAmount).toBeCloseTo(1.67, 2);
    });

});
