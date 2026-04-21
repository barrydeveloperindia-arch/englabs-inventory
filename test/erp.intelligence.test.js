import { describe, it, expect, beforeEach, vi } from 'vitest';
import InventoryEngine from '../js/engine.js';

// Mock localStorage for Node environment
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        clear: () => { store = {}; },
        removeItem: (key) => { delete store[key]; }
    };
})();
global.localStorage = localStorageMock;
global.location = { reload: vi.fn() };

describe('EngLabs ERP: Forensic Intelligence Audit', () => {

    beforeEach(() => {
        localStorage.clear();
        InventoryEngine.reset();
    });

    it('should maintain perfect double-entry parity', () => {
        InventoryEngine.finance.recordEntry('CASH', 'EQUITY', 1000, 'T1', 'Seed Capital');
        InventoryEngine.finance.recordEntry('BANK', 'CASH', 500, 'T2', 'Deposit');
        
        const cash = InventoryEngine.finance.getBalance('CASH');
        const bank = InventoryEngine.finance.getBalance('BANK');
        const equity = InventoryEngine.finance.getBalance('EQUITY');

        expect(cash).toBe(500);
        expect(bank).toBe(500);
        expect(equity).toBe(-1000); // Credit is negative in our simple logic
        expect(cash + bank + equity).toBe(0);
    });

    it('should correctly calculate Average Rate on multiple purchases', () => {
        const item = InventoryEngine.inventory.addItem('Cement', 'Construction', 10, 'Bag');
        const itemId = item.id.slice(-4);
        
        // Purchase 1: 10 bags @ 100
        InventoryEngine.inventory.updateStock('ITM-' + itemId, 10, 100, 'IN');
        let current = InventoryEngine.inventory.getAll().find(i => i.name === 'Cement');
        expect(current.avgRate).toBe(100);

        // Purchase 2: 10 bags @ 200
        InventoryEngine.inventory.updateStock('ITM-' + itemId, 10, 200, 'IN');
        current = InventoryEngine.inventory.getAll().find(i => i.name === 'Cement');
        
        // Total Value = (10*100) + (10*200) = 3000. Total Qty = 20. Avg = 150.
        expect(current.avgRate).toBe(150);
        expect(current.qty).toBe(20);
    });

    it('should block issues that exceed current stock (Safety Guard)', () => {
        const item = InventoryEngine.inventory.addItem('Steel', 'Construction', 5, 'Kg');
        const itemId = item.id.slice(-4);
        
        InventoryEngine.inventory.updateStock('ITM-' + itemId, 10, 50, 'IN');
        const res = InventoryEngine.inventory.updateStock('ITM-' + itemId, 15, 0, 'OUT');
        
        expect(res.success).toBe(false);
        expect(res.msg).toBe('Insufficient Stock');
    });

    it('should accurately track project spend and burndown', () => {
        const proj = InventoryEngine.projects.add('Bridge Site', 5000, '2026-01-01');
        const item = InventoryEngine.inventory.addItem('Bricks', 'Construction', 100, 'Nos');
        const itemId = item.id.slice(-4);

        // Buy 100 bricks @ 10
        InventoryEngine.inventory.updateStock('ITM-' + itemId, 100, 10, 'IN');
        
        // Issue 50 bricks to project
        InventoryEngine.inventory.updateStock('ITM-' + itemId, 50, 0, 'OUT', { projectId: proj.id });
        
        const updatedProj = InventoryEngine.projects.get(proj.id);
        expect(updatedProj.spent).toBe(500); // 50 * 10
        expect(updatedProj.budget - updatedProj.spent).toBe(4500);
    });

    it('should generate forensic activity logs for every major action', () => {
        InventoryEngine.auth.login('1234'); // Admin
        InventoryEngine.projects.add('Test Audit Project', 1000, '2026-01-01');
        
        const logs = JSON.parse(localStorage.getItem('englabs_logs') || '[]');
        expect(logs.length).toBeGreaterThan(0);
        expect(logs.some(l => l.action === 'PROJECT_ADDED')).toBe(true);
        expect(logs[logs.length - 1].user).toBe('ADMIN');
    });

    it('should preserve forensic metadata (From, Mode, Category) in Site Cash entries', () => {
        InventoryEngine.finance.recordEntry('SITE_CASH', 'BANK', 5000, 'C-GENERAL', 'Test Inflow', {
            from: 'Englabs IDFC',
            mode: 'NEFT',
            category: 'MAINTENANCE'
        });

        const ledger = InventoryEngine.getCache().ledger;
        const entry = ledger.find(e => e.description === 'Test Inflow');

        expect(entry.from).toBe('Englabs IDFC');
        expect(entry.mode).toBe('NEFT');
        expect(entry.category).toBe('MAINTENANCE');
        expect(entry.type).toBe('IN');
    });

});

