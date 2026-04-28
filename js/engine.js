/**
 * 🌀 EngLabs Master ERP: Forensic Core Engine
 * Manages Projects, Inventory, Accounts, and Procurement.
 */
import { EXCEL_SEED } from './seed_data.js';

const InventoryEngine = (() => {
    // 🛡️ HEADLESS SAFETY: Handle Node/Testing environments
    const safeGet = (key, fallback) => {
        if (typeof localStorage === 'undefined') return fallback;
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : fallback;
    };

    // 🗄️ STATE REPOSITORY
    const _cache = {
        projects: safeGet('englabs_projects', []),
        items: safeGet('englabs_items', []),
        transactions: safeGet('englabs_tx', []),
        vendors: safeGet('englabs_vendors', []),
        pos: safeGet('englabs_pos', []),
        ledger: safeGet('englabs_ledger', []),
        currentUser: null,
        isLocked: (typeof localStorage !== 'undefined' && localStorage.getItem('englabs_locked') === 'true')
    };

    // 🔬 PRIVATE UTILS
    const _save = (key, data) => {
        if (typeof localStorage !== 'undefined') localStorage.setItem(`englabs_${key}`, JSON.stringify(data));
    };
    
    const logActivity = (action, details) => {
        const log = {
            timestamp: new Date().toISOString(),
            user: _cache.currentUser?.name || 'SYSTEM',
            role: _cache.currentUser?.role || 'ANONYMOUS',
            action,
            details
        };
        const logs = safeGet('englabs_logs', []);
        logs.push(log);
        _save('logs', logs);
    };

    // 🏗️ PROJECT MODULE
    const projects = {
        add: (name, budget, date) => {
            const p = {
                id: 'PRJ-' + Date.now().toString().slice(-4),
                name,
                budget: parseFloat(budget),
                spent: 0,
                date,
                status: 'ACTIVE'
            };
            _cache.projects.push(p);
            _save('projects', _cache.projects);
            logActivity('PROJECT_ADDED', `Created project: ${name}`);
            return p;
        },
        update: (id, name, budget, date) => {
            const p = _cache.projects.find(x => x.id === id);
            if (p) {
                p.name = name;
                p.budget = parseFloat(budget);
                p.date = date;
                _save('projects', _cache.projects);
                logActivity('PROJECT_UPDATED', `Updated project: ${name}`);
            }
            return p;
        },
        getAll: () => _cache.projects,
        get: (id) => _cache.projects.find(p => p.id === id)
    };

    // 📦 INVENTORY MODULE
    const inventory = {
        addItem: (name, category, minStock, unit) => {
            const item = {
                id: 'ITM-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
                name,
                category,
                qty: 0,
                unit,
                avgRate: 0,
                minStock: parseFloat(minStock)
            };
            _cache.items.push(item);
            _save('items', _cache.items);
            logActivity('ITEM_ADDED', `Registered item: ${name}`);
            return item;
        },
        getAll: () => _cache.items,
        updateStock: (itemId, qtyChange, rate, type, metadata) => {
            const item = _cache.items.find(i => i.id === itemId);
            if (!item) return { success: false, msg: 'Item not found' };

            if (type === 'IN') {
                const totalVal = (item.qty * item.avgRate) + (qtyChange * rate);
                item.qty += qtyChange;
                item.avgRate = totalVal / item.qty;
            } else {
                if (item.qty < qtyChange) return { success: false, msg: 'Insufficient Stock' };
                item.qty -= qtyChange;
                // If it's a project issue, update project spend
                if (metadata?.projectId) {
                    const p = projects.get(metadata.projectId);
                    if (p) p.spent += (qtyChange * item.avgRate);
                }
            }

            _save('items', _cache.items);
            _save('projects', _cache.projects);
            
            // Record Transaction
            const tx = {
                id: 'TX-' + Date.now().toString().slice(-6),
                date: new Date().toISOString(),
                itemId,
                qty: qtyChange,
                rate: type === 'IN' ? rate : item.avgRate,
                type,
                metadata
            };
            _cache.transactions.push(tx);
            _save('tx', _cache.transactions);

            // 🛡️ Forensic Audit Injection
            if (type === 'OUT') {
                logActivity('STOCK_REMOVED', `Issued ${qtyChange} units of ${item.name} to ${metadata?.projectId || 'GENERAL'}`);
            } else {
                logActivity('STOCK_ADDED', `Restocked ${qtyChange} units of ${item.name}`);
            }
            
            return { success: true, tx };

        }
    };

    // 💰 FINANCE MODULE (Triple-Entry)
    const finance = {
        recordEntry: (dr, cr, amount, ref, desc, metadata = {}) => {
            const entry = {
                id: 'FIN-' + Date.now().toString().slice(-6),
                date: metadata.date || new Date().toISOString(),
                debit: dr,
                credit: cr,
                amount: parseFloat(amount),
                reference: ref,
                description: desc,
                type: dr === 'SITE_CASH' ? 'IN' : 'OUT',
                ...metadata
            };
            _cache.ledger.push(entry);
            _save('ledger', _cache.ledger);
            return entry;
        },
        getBalance: (account) => {
            return _cache.ledger.reduce((acc, entry) => {
                if (entry.debit === account) return acc + entry.amount;
                if (entry.credit === account) return acc - entry.amount;
                return acc;
            }, 0);
        }
    };

    // 🔐 AUTH MODULE
    const auth = {
        login: (pin) => {
            const roles = { '1234': 'ADMIN', '5678': 'MANAGER', '0000': 'STORE' };
            if (roles[pin]) {
                _cache.currentUser = { name: roles[pin], role: roles[pin] };
                logActivity('LOGIN', `User logged in as ${roles[pin]}`);
                return { success: true, user: _cache.currentUser };
            }
            return { success: false };
        },
        logout: () => {
            logActivity('LOGOUT', 'User logged out');
            _cache.currentUser = null;
        }
    };

    // 📊 MIS REPORTING
    const reports = {
        getDashboardStats: () => {
            const cash = finance.getBalance('CASH');
            const bank = finance.getBalance('BANK');
            const stockVal = _cache.items.reduce((acc, i) => acc + (i.qty * i.avgRate), 0);
            return {
                totalCash: cash + bank,
                stockValue: stockVal,
                activeProjects: _cache.projects.filter(p => p.status === 'ACTIVE').length
            };
        }
    };

    const seedData = () => {
        if (_cache.projects.length > 0) return;
        
        console.log("🏭 Seeding Engine with Professional and Excel Ingested Data...");

        // 🏗️ Projects from Excel / Default
        const defaultProjects = [
            { id: 'C4925', name: 'Marelli Project (Ph-1)', budget: 1500000 },
            { id: 'C5131', name: 'Delhi Expo Site', budget: 800000 }
        ];

        defaultProjects.forEach(p => projects.add(p.name, p.budget, '2026-04-01'));

        // 📦 Inventory Seed (Stationery & Office Focus)
        const i1 = inventory.addItem('A4 Paper Rim (75GSM)', 'Stationery', 200, 'Nos');
        inventory.updateStock(i1.id, 500, 280, 'IN', { projectId: 'OPENING' });
        
        const i2 = inventory.addItem('HP Laserjet Toner 12A', 'Office Supplies', 10, 'Nos');
        inventory.updateStock(i2.id, 25, 3200, 'IN', { projectId: 'OPENING' });
        
        const i3 = inventory.addItem('Safety PPE Kit (L1)', 'Safety & PPE', 50, 'Set');
        inventory.updateStock(i3.id, 100, 1500, 'IN', { projectId: 'OPENING' });
        
        const i4 = inventory.addItem('Logitech Wireless Combo', 'Electronics & IT', 15, 'Nos');
        inventory.updateStock(i4.id, 30, 1850, 'IN', { projectId: 'OPENING' });


        // ➕ Inject Discovered Items from Site Cash
        if (EXCEL_SEED.discoveredItems) {
            EXCEL_SEED.discoveredItems.forEach(itemInfo => {
                const item = inventory.addItem(itemInfo.name, 'Discovered - Site Cash', 5, 'Nos');
                // Auto-fill actual forensic stock and rate from Excel
                inventory.updateStock(item.id, itemInfo.qty, itemInfo.rate, 'IN', { projectId: 'EXCEL_SYNC' });
            });
        }



        // 🏛️ Financial Ledger Injection (EXCEL)
        // Only seed if ledger is empty to prevent duplication on reload
        if (EXCEL_SEED.ledger && _cache.ledger.length === 0) {

            EXCEL_SEED.ledger.forEach(l => {
                const dr = l.type === 'IN' ? 'SITE_CASH' : 'EXPENSE';
                const cr = l.type === 'IN' ? 'BANK' : 'SITE_CASH';
                finance.recordEntry(dr, cr, l.amount, l.project, l.description, {
                    date: l.date,
                    from: l.from,
                    mode: l.mode,
                    recBy: l.recBy,
                    balance: l.balance,
                    category: l.category, // Forensic Category Persistence
                    project: l.project // Explicitly set for easy access
                });

            });
        } else {
            finance.recordEntry('CASH', 'EQUITY', 500000, 'OPENING', 'Initial Capital Inflow');
            finance.recordEntry('BANK', 'EQUITY', 2500000, 'OPENING', 'Fixed Deposit Reserve');
        }
        
        logActivity('SYSTEM_SEED', 'Engine initialized with Excel metadata and forensic audit trails.');
    };

    const reset = () => {
        if (typeof localStorage !== 'undefined') {
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith('englabs_')) localStorage.removeItem(k);
            });
        }
        // 🧼 CLEAR MEMORY CACHE for testing parity
        _cache.projects = [];
        _cache.items = [];
        _cache.transactions = [];
        _cache.vendors = [];
        _cache.pos = [];
        _cache.ledger = [];
        _cache.currentUser = null;
        _cache.isLocked = false;
        
        if (typeof location !== 'undefined' && location.reload) location.reload();
    };

    return {
        projects,
        inventory,
        finance,
        auth,
        reports,
        seedData,
        reset,
        logActivity,
        getCache: () => _cache,
        EXCEL_SEED: EXCEL_SEED
    };
})();

if (typeof window !== 'undefined') window.InventoryEngine = InventoryEngine;
export default InventoryEngine;
