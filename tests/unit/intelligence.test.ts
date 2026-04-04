
import { describe, it, expect, vi } from 'vitest';
import {
    calculateRevenueForecast,
    identifyStockRisks,
    generateReplenishmentPlan,
    calculateSalesVelocity,
    MarketIntelligence
} from '../../lib/intelligence';
import { Transaction, InventoryItem } from '../../types';

// Mock side-effect modules
vi.mock('../../lib/agenticHistory', () => ({
    persistDecision: vi.fn().mockResolvedValue('mock-id')
}));

vi.mock('../../lib/eventBus', () => ({
    eventBus: {
        emit: vi.fn()
    }
}));

describe('🧠 Intelligence Engine Unit Tests', () => {

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const mockTransactions: any[] = [
        {
            id: 't1',
            total: 100,
            timestamp: yesterday.toISOString(),
            items: [{ id: 'item1', name: 'Risk Item', brand: 'Brand A', price: 50, qty: 10, vatRate: 20, sku: 'SKU1' }],
            staffId: 's1',
            staffName: 'Gaurav',
            subtotal: 80,
            discountAmount: 0,
            vatTotal: 20,
            paymentMethod: 'Cash',
            vatBreakdown: { 0: { gross: 0, net: 0, vat: 0 }, 5: { gross: 0, net: 0, vat: 0 }, 20: { gross: 100, net: 80, vat: 20 } }
        }
    ];

    const mockInventory: InventoryItem[] = [
        {
            id: 'item1', name: 'Risk Item', stock: 1, minStock: 20, sku: 'SKU1', category: 'Stock',
            brand: 'BrandA', price: 10, costPrice: 5, vatRate: 20, status: 'Active',
            unitType: 'pcs', packSize: '1', origin: 'UK', lastBuyPrice: 5, logs: [], barcode: '123',
            supplierId: 'sup1'
        },
        {
            id: 'item2', name: 'Healthy Item', stock: 100, minStock: 5, sku: 'SKU2', category: 'Stock',
            brand: 'BrandB', price: 10, costPrice: 5, vatRate: 20, status: 'Active',
            unitType: 'pcs', packSize: '1', origin: 'UK', lastBuyPrice: 5, logs: [], barcode: '456',
            supplierId: 'sup1'
        }
    ];

    it('Calculates Sales Velocity correctly', () => {
        // 10 units sold in last 7 days = 1.42 units per day
        const velocity = calculateSalesVelocity(mockTransactions, 'item1', 7);
        expect(velocity).toBeCloseTo(1.428, 2);
    });

    it('Calculates Revenue Forecast based on Run-Rate', () => {
        const result = calculateRevenueForecast(mockTransactions);
        expect(result.predictedRevenue).toBeGreaterThan(0);
        // 100 in 7 days = 14.28 per day -> 428.57 per month
        expect(result.predictedRevenue).toBeCloseTo(428.57, 2);
        expect(result.confidence).toBe(0.88);
    });

    it('Identifies Stock-Out Risks for Low Stock Items', () => {
        const risks = identifyStockRisks(mockInventory, mockTransactions);
        expect(risks.some(r => r.id === 'item1')).toBe(true);
        expect(risks.some(r => r.id === 'item2')).toBe(false);
    });

    it('Generates Replenishment Plan with Safety Buffers', () => {
        const plan = generateReplenishmentPlan(mockInventory, mockTransactions);
        expect(plan.length).toBeGreaterThan(0);
        const suggestion = plan.find(s => s.sku === 'SKU1');
        expect(suggestion).toBeDefined();
        // suggestedOrder = Max(20 * 2, ceil(1.428 * 14)) = Max(40, 20) = 40
        expect(suggestion?.suggestedOrder).toBe(40);
        expect(suggestion?.estimatedCost).toBe(200); // 40 * 5 costPrice
    });

    it('MarketIntelligence.analyzeInventory produces correct insights', () => {
        const insights = MarketIntelligence.analyzeInventory(mockInventory, mockTransactions);
        // Expect 2 insights: item1 (REORDER) and item2 (DISCOUNT because velocity=0 and stock=100)
        expect(insights.length).toBe(2);

        const reorder = insights.find(i => i.recommendation === 'REORDER');
        const discount = insights.find(i => i.recommendation === 'DISCOUNT');

        expect(reorder?.sku).toBe('SKU1');
        expect(discount?.sku).toBe('SKU2');
    });
});
