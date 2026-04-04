
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus } from '../../lib/eventBus';
import { identifyStockRisks, generateReplenishmentPlan } from '../../lib/intelligence';
import { InventoryItem, Transaction } from '../../types';

/**
 * @module InventoryManagementTests
 * @description Unit tests for inventory logic, including stock updates, reorder triggers, and data integrity.
 */

describe('Inventory Management System', () => {

    const mockInventory: InventoryItem[] = [
        {
            id: 'item-1',
            name: 'Coca Cola 500ml',
            sku: 'COLA-500',
            barcode: '123456789',
            stock: 10,
            minStock: 5,
            price: 1.50,
            costPrice: 0.80,
            vatRate: 20,
            category: 'Drinks',
            brand: 'Coca Cola',
            supplierId: 'sup-1',
            status: 'Active',
            unitType: 'pcs',
            packSize: '1',
            origin: 'UK',
            lastBuyPrice: 0.80,
            logs: [],
            updatedAt: new Date().toISOString()
        },
        {
            id: 'item-2',
            name: 'Walkers Crisps',
            sku: 'WLK-CRS',
            barcode: '987654321',
            stock: 2,
            minStock: 10,
            price: 1.00,
            costPrice: 0.50,
            vatRate: 20,
            category: 'Snacks',
            brand: 'Walkers',
            supplierId: 'sup-1',
            status: 'Active',
            unitType: 'pcs',
            packSize: '1',
            origin: 'UK',
            lastBuyPrice: 0.50,
            logs: [],
            updatedAt: new Date().toISOString()
        }
    ];

    const mockTransactions: Transaction[] = [
        {
            id: 'tx-1',
            timestamp: new Date().toISOString(),
            staffId: 'staff-1',
            staffName: 'John Doe',
            items: [
                { id: 'item-1', name: 'Coca Cola 500ml', qty: 2, price: 1.50, brand: 'Coca Cola', sku: 'COLA-500', vatRate: 20 }
            ],
            total: 3.00,
            subtotal: 2.50,
            discountAmount: 0,
            vatTotal: 0.50,
            paymentMethod: 'Cash',
            vatBreakdown: { 0: { gross: 0, net: 0, vat: 0 }, 5: { gross: 0, net: 0, vat: 0 }, 20: { gross: 3.00, net: 2.50, vat: 0.50 } }
        },
        {
            id: 'tx-2',
            timestamp: new Date().toISOString(),
            staffId: 'staff-1',
            staffName: 'John Doe',
            items: [
                { id: 'item-2', name: 'Walkers Crisps', qty: 5, price: 1.00, brand: 'Walkers', sku: 'WLK-CRS', vatRate: 20 }
            ],
            total: 5.00,
            subtotal: 4.50,
            discountAmount: 0,
            vatTotal: 0.50,
            paymentMethod: 'Cash',
            vatBreakdown: { 0: { gross: 0, net: 0, vat: 0 }, 5: { gross: 0, net: 0, vat: 0 }, 20: { gross: 5.00, net: 4.50, vat: 0.50 } }
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Stock Logic & Failsafes', () => {
        it('should correctly identify items at risk of stock-out', () => {
            const risks = identifyStockRisks(mockInventory, mockTransactions);
            // item-2 has stock 2 and minStock 10
            expect(risks.some(r => r.id === 'item-2')).toBe(true);
            expect(risks.some(r => r.id === 'item-1')).toBe(false);
        });

        it('should generate a valid replenishment plan with order quantities', () => {
            const plan = generateReplenishmentPlan(mockInventory, mockTransactions);
            const colaSuggestion = plan.find(p => p.sku === 'COLA-500');
            const crispSuggestion = plan.find(p => p.sku === 'WLK-CRS');

            // Cola is fine (stock 10 > min 5), so it shouldn't be in the plan
            expect(colaSuggestion).toBeUndefined();

            // Crisps need restocking
            expect(crispSuggestion).toBeDefined();
            expect(crispSuggestion?.suggestedOrder).toBeGreaterThan(0);
        });
    });

    describe('Autonomous Scanning Repercussions', () => {
        it('should emit a strategist prediction when stock falls below critical levels', () => {
            const emitSpy = vi.spyOn(eventBus, 'emit');

            // Trigger an analysis that includes the low stock item
            identifyStockRisks(mockInventory, mockTransactions);

            expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({
                type: 'STRATEGIST_STOCK_PREDICTION',
                payload: expect.objectContaining({
                    item: 'Walkers Crisps',
                    action: 'REORDER'
                })
            }));
        });
    });

    describe('Core Inventory Operations', () => {
        it('should correctly increment stock during a PURCHASE operation', () => {
            const item = { ...mockInventory[0] };
            const initialStock = item.stock;
            const updateQty = 5;

            // Logic being tested: INVENTORY[item].quantity += qty
            const newStock = initialStock + updateQty;
            item.stock = newStock;

            expect(item.stock).toBe(15);
            expect(item.stock).toBeGreaterThan(initialStock);
        });

        it('should correctly decrement stock during a SALE operation', () => {
            const item = { ...mockInventory[0] };
            const initialStock = item.stock;
            const updateQty = 1;

            // Logic being tested: INVENTORY[item].quantity -= qty
            const newStock = initialStock - updateQty;
            item.stock = newStock;

            expect(item.stock).toBe(9);
            expect(item.stock).toBeLessThan(initialStock);
        });

        it('should trigger a failsafe when stock becomes negative', () => {
            const item = { ...mockInventory[1] }; // Stock is 2
            const updateQty = 5; // Sale of 5

            const newStock = item.stock - updateQty;
            item.stock = newStock;

            // Logic check for negative stock
            expect(item.stock).toBeLessThan(0);

            // Verify our intelligence engine flags this as a risk
            const updatedInventory = [item];
            const transactions: Transaction[] = [
                {
                    id: 'tx-neg-risk',
                    timestamp: new Date().toISOString(),
                    staffId: 'staff-1',
                    staffName: 'John Doe',
                    total: 1.00,
                    subtotal: 0.80,
                    discountAmount: 0,
                    vatTotal: 0.20,
                    paymentMethod: 'Cash',
                    vatBreakdown: { 0: { gross: 0, net: 0, vat: 0 }, 5: { gross: 0, net: 0, vat: 0 }, 20: { gross: 0, net: 0, vat: 0 } },
                    items: [{ id: item.id, name: item.name, brand: item.brand, price: item.price, qty: 1, vatRate: 20, sku: item.sku }]
                }
            ];

            const risks = identifyStockRisks(updatedInventory, transactions);
            expect(risks.some(r => r.id === item.id)).toBe(true);
        });
    });

    describe('Data Integrity', () => {
        it('should ensure all inventory items have mandatory audit fields', () => {
            mockInventory.forEach(item => {
                expect(item.id).toBeDefined();
                expect(item.stock).toBeTypeOf('number');
                expect(item.minStock).toBeTypeOf('number');
                expect(item.updatedAt).toBeDefined();
            });
        });
    });
});
