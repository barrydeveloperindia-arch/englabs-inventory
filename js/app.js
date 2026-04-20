/**
 * 🛰️ Englabs_Accounts_Team: Application Controller
 */

let currentPin = '';
let currentView = 'dashboard';

// 🏗️ INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    InventoryEngine.seedData();
    checkAuth();
    updateUI();
});

function addPin(num) {
    if (currentPin.length < 4) {
        currentPin += num;
        document.getElementById('token-display').textContent = '*'.repeat(currentPin.length);
    }
}

function clearPin() {
    currentPin = '';
    document.getElementById('token-display').textContent = '';
}

function submitLogin() {
    const res = InventoryEngine.auth.login(currentPin);
    if (res.success) {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('user-display').textContent = `${res.user.role}: SAM`;
        updateUI();
    } else {
        alert('Invalid Secure Token');
        clearPin();
    }
}

function checkAuth() {
    const user = InventoryEngine.getCache().currentUser;
    if (user) {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('user-display').textContent = `${user.role}: SAM`;
    }
}

function logout() {
    InventoryEngine.auth.logout();
    location.reload();
}

// 🔀 VIEW SWITCHER
function switchView(viewId) {
    // Hide all containers
    document.querySelectorAll('.view-container').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(v => v.classList.remove('active'));

    // Show target
    const target = document.getElementById('view-' + viewId);
    if (target) target.style.display = 'block';
    
    // Update active nav
    const activeNav = Array.from(document.querySelectorAll('.nav-item')).find(n => n.getAttribute('onclick')?.includes(viewId));
    if (activeNav) activeNav.classList.add('active');

    // Update Header
    const titles = {
        'dashboard': 'Central Gateway',
        'projects': 'Project Master',
        'inventory': 'Master Inventory',
        'purchase': 'Purchase System',
        'sales': 'Sales & Billing',
        'ledger': 'Financial Ledger',
        'site-cash': 'Site Cash Details',
        'reports': 'MIS Reports',
        'audit': 'System Audit',
        'admin': 'Admin Panel',
        'folders': 'Local Directory'
    };
    document.getElementById('active-title').textContent = titles[viewId] || 'Englabs_Accounts_Team';
    
    currentView = viewId;
    updateUI();
    lucide.createIcons();
}

// 🔄 UI UPDATE ENGINE
function updateUI() {
    if (currentView === 'dashboard') renderDashboard();
    if (currentView === 'projects') renderProjects();
    if (currentView === 'inventory') renderInventory();
    if (currentView === 'purchase') renderPurchase();
    if (currentView === 'sales') renderSales();
    if (currentView === 'ledger') renderLedger();
    if (currentView === 'site-cash') renderSiteCash();
    if (currentView === 'audit') renderAudit();
    if (currentView === 'reports') renderReports();
    if (currentView === 'folders') renderFolders();
}

function renderSiteCash() {
    const body = document.getElementById('site-cash-body');
    const balanceEl = document.getElementById('site-cash-bal');
    if (!body || !balanceEl) return;

    const tx = InventoryEngine.getCache().ledger.filter(l => l.debit === 'SITE_CASH' || l.credit === 'SITE_CASH');
    const total = InventoryEngine.finance.getBalance('SITE_CASH');
    
    balanceEl.textContent = `₹${total.toLocaleString()}`;
    
    if (tx.length === 0) {
        body.innerHTML = '<tr><td colspan="6" class="empty-state">No Site Cash transactions recorded yet.</td></tr>';
        return;
    }

    body.innerHTML = tx.map(t => `
        <tr>
            <td>${new Date(t.date).toLocaleDateString()}</td>
            <td><span class="badge badge-outline">${t.reference.split('|')[0] || 'N/A'}</span></td>
            <td>${t.description}</td>
            <td style="color: var(--success)">${t.debit === 'SITE_CASH' ? '₹' + t.amount.toLocaleString() : '-'}</td>
            <td style="color: var(--danger)">${t.credit === 'SITE_CASH' ? '₹' + t.amount.toLocaleString() : '-'}</td>
            <td><small>${t.reference.split('|')[1] || 'SYSTEM'}</small></td>
        </tr>
    `).join('');
}

window.handleSiteCashSubmit = function(e) {
    e.preventDefault();
    const proj = document.getElementById('sc_project').value;
    const type = document.getElementById('sc_type').value.toUpperCase();
    const amount = document.getElementById('sc_amount').value;
    const desc = document.getElementById('sc_desc').value;

    let entry;
    if (type === 'IN') {
        entry = InventoryEngine.finance.recordEntry('SITE_CASH', 'BANK', amount, `${proj}|LOGGED`, desc);
    } else {
        entry = InventoryEngine.finance.recordEntry('EXPENSE', 'SITE_CASH', amount, `${proj}|LOGGED`, desc);
    }

    // 🛡️ Forensic Log Injection
    if (typeof InventoryEngine.logActivity === 'function') {
        InventoryEngine.logActivity('SITE_CASH_LOG', `${type}: ₹${amount} for ${proj} - ${desc}`);
    }

    hideModals();
    updateUI();
    showToast('Site Cash transaction logged successfully');
}

window.showModal = function(id) {
    // Hide all first to prevent overlap
    document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');

    if (id === 'site-cash-modal' || id === 'issue-modal' || id === 'invoice-modal') {
        const selectId = id === 'site-cash-modal' ? 'sc_project' : (id === 'issue-modal' ? 'iss_project' : 'inv_project');
        const select = document.getElementById(selectId);
        const projs = InventoryEngine.projects.getAll();
        if (select && projs) {
            select.innerHTML = projs.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        }
    }

    if (id === 'po-modal') {
        const select = document.getElementById('po_vendor');
        // Simulate vendors from state
        const vendors = ['Tata Steel Ltd', 'UltraTech Cement', 'Asian Paints', 'HDFC Bank'];
        select.innerHTML = vendors.map(v => `<option value="${v}">${v}</option>`).join('');
    }
    
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
}

window.handlePOSubmit = function(e) {
    e.preventDefault();
    const vendor = document.getElementById('po_vendor').value;
    const amount = document.getElementById('po_amount').value;
    const remarks = document.getElementById('po_remarks').value;

    InventoryEngine.finance.recordEntry('INVENTORY_VAL', 'ACCOUNTS_PAYABLE', amount, `PO-${Date.now()}`, `Purchase from ${vendor}: ${remarks}`);
    InventoryEngine.logActivity('PO_CREATED', `Created PO for ${vendor} amount: ₹${amount}`);

    hideModals();
    updateUI();
}

window.handleInvoiceSubmit = function(e) {
    e.preventDefault();
    const project = document.getElementById('inv_project').value;
    const client = document.getElementById('inv_client').value;
    const amount = document.getElementById('inv_amount').value;

    InventoryEngine.finance.recordEntry('ACCOUNTS_RECEIVABLE', 'SALES_REVENUE', amount, `INV-${Date.now()}`, `Invoice to ${client} for Project ID: ${project}`);
    InventoryEngine.logActivity('INVOICE_GENERATED', `Generated invoice for ${client} amount: ₹${amount}`);

    hideModals();
    updateUI();
}

window.openIssueModal = function(itemId) {
    const item = InventoryEngine.inventory.getAll().find(i => i.id === itemId);
    if (!item) return;
    document.getElementById('iss_item_id').value = item.id;
    document.getElementById('iss_item_name').value = item.name;
    showModal('issue-modal');
}

window.handleIssueSubmit = function(e) {
    e.preventDefault();
    const itemId = document.getElementById('iss_item_id').value;
    const projectId = document.getElementById('iss_project').value;
    const qty = parseFloat(document.getElementById('iss_qty').value);

    const res = InventoryEngine.inventory.updateStock(itemId, qty, 0, 'OUT', { projectId });
    if (res.success) {
        showToast('Material issued to project successfully');
        hideModals();
        updateUI();
    } else {
        alert(res.msg);
    }
}

function renderFolders() {
    const list = document.getElementById('folder-health-list');
    if (!list) return;
    
    // Simulate folder metadata
    const folders = [
        { path: '📄 /01_Projects', status: 'ACTIVE', size: '2.4 GB' },
        { path: '📦 /03_Inventory', status: 'STABLE', size: '1.1 GB' },
        { path: '📊 /09_Exports', status: 'SCANNING', size: '450 MB' }
    ];

    list.innerHTML = folders.map(f => `
        <div class="stat-card" style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div class="stat-label">${f.path}</div>
                <div class="stat-value" style="font-size: 0.9rem; color: var(--text-muted)">Size: ${f.size}</div>
            </div>
            <span class="badge ${f.status === 'ACTIVE' ? 'badge-success' : f.status === 'STABLE' ? 'badge-primary' : 'badge-outline'}">${f.status}</span>
        </div>
    `).join('');
}

function renderPurchase() {
    const entries = InventoryEngine.getCache().ledger.filter(e => e.credit === 'ACCOUNTS_PAYABLE');
    const body = document.getElementById('po-body');
    if (!body) return;
    
    if (entries.length === 0) {
        body.innerHTML = '<tr><td colspan="7" class="empty-state"><i data-lucide="shopping-cart"></i><h3>No Purchase Orders Found</h3></td></tr>';
        lucide.createIcons();
        return;
    }

    body.innerHTML = entries.map(e => `
        <tr>
            <td>${new Date(e.date).toLocaleDateString()}</td>
            <td><strong>${e.reference}</strong></td>
            <td>${e.description.split('from ')[1]?.split(':')[0] || 'N/A'}</td>
            <td>General Procurement</td>
            <td style="font-weight: 700">₹${e.amount.toLocaleString()}</td>
            <td><span class="badge badge-primary">ACTIVE</span></td>
            <td><button class="btn btn-outline" style="padding:4px;"><i data-lucide="printer" style="width:14px;"></i></button></td>
        </tr>
    `).join('');
    lucide.createIcons();
}

function renderSales() {
    const entries = InventoryEngine.getCache().ledger.filter(e => e.credit === 'SALES_REVENUE');
    const body = document.getElementById('sales-body');
    if (!body) return;

    if (entries.length === 0) {
        body.innerHTML = '<tr><td colspan="7" class="empty-state"><i data-lucide="banknote"></i><h3>No Sales records Found</h3></td></tr>';
        lucide.createIcons();
        return;
    }

    body.innerHTML = entries.map(e => `
        <tr>
            <td>${new Date(e.date).toLocaleDateString()}</td>
            <td><strong>${e.reference}</strong></td>
            <td>${e.description.split('to ')[1]?.split(' for')[0] || 'N/A'}</td>
            <td>${e.description.split('ID: ')[1] || 'N/A'}</td>
            <td style="font-weight: 700">₹${e.amount.toLocaleString()}</td>
            <td><span class="badge badge-success">PAID</span></td>
            <td><button class="btn btn-outline" style="padding:4px;"><i data-lucide="download" style="width:14px;"></i></button></td>
        </tr>
    `).join('');
    lucide.createIcons();
}

function renderAudit() {
    const logs = JSON.parse(localStorage.getItem('englabs_logs') || '[]');
    const body = document.getElementById('audit-body');
    if (!body) return;
    body.innerHTML = logs.slice().reverse().map(l => `
        <tr>
            <td><small>${new Date(l.timestamp).toLocaleString()}</small></td>
            <td><span class="badge badge-outline">${l.user} (${l.role})</span></td>
            <td><strong>${l.action}</strong></td>
            <td>${l.details}</td>
        </tr>
    `).join('');
}

function renderReports() {
    const ctx = document.getElementById('reportsChart').getContext('2d');
    if (window.reportsChartObj) window.reportsChartObj.destroy();
    window.reportsChartObj = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr'],
            datasets: [{
                label: 'Project Revenue (₹ Lakhs)',
                data: [45, 52, 61, 84],
                backgroundColor: '#3b82f6',
                borderRadius: 8
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}
function renderDashboard() {
    const stats = InventoryEngine.reports.getDashboardStats();
    document.getElementById('cash-bal').textContent = `₹${stats.totalCash.toLocaleString()}`;
    document.getElementById('stock-val').textContent = `₹${stats.stockValue.toLocaleString()}`;
    document.getElementById('active-proj').textContent = stats.activeProjects;

    // Render Chart
    const ctx = document.getElementById('mainChart').getContext('2d');
    if (window.myChart) window.myChart.destroy();
    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Operational Liquidity',
                data: [1200000, 1900000, 300000, 500000, 200000, 300000],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

function renderProjects() {
    const projs = InventoryEngine.projects.getAll();
    const body = document.getElementById('projects-body');
    body.innerHTML = projs.map(p => `
        <tr>
            <td><strong>${p.id}</strong></td>
            <td>${p.name}</td>
            <td>₹${p.budget.toLocaleString()}</td>
            <td style="color: var(--danger)">₹${p.spent.toLocaleString()}</td>
            <td style="font-weight: 700">₹${(p.budget - p.spent).toLocaleString()}</td>
            <td><span class="badge badge-success">${p.status}</span></td>
            <td>
                <button class="btn btn-outline" style="padding: 4px 8px;" onclick="viewProjectDetails('${p.id}')">
                    <i data-lucide="eye" style="width:14px;"></i>
                </button>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

function renderInventory() {
    const items = InventoryEngine.inventory.getAll();
    const body = document.getElementById('items-body');
    if (!body) return;
    body.innerHTML = items.map(i => `
        <tr>
            <td>${i.id}</td>
            <td><span class="badge badge-outline" style="border: 1px solid var(--border)">${i.category}</span></td>
            <td><strong>${i.name}</strong></td>
            <td style="font-weight: 700">${i.qty}</td>
            <td>${i.unit}</td>
            <td>₹${i.avgRate.toFixed(2)}</td>
            <td>₹${(i.qty * i.avgRate).toLocaleString()}</td>
            <td>
                ${i.qty <= i.minStock ? `<span class="badge badge-danger">LOW STOCK</span>` : `<span class="badge badge-success">OK</span>`}
            </td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-outline" style="padding: 4px 8px;" onclick="openIssueModal('${i.id}')" title="Quick Issue">
                        <i data-lucide="package-minus"></i>
                    </button>
                    <button class="btn btn-outline" style="padding: 4px 8px;" onclick="viewItemHistory('${i.id}')" title="View Audit Trail">
                        <i data-lucide="history"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

window.viewItemHistory = function(itemId) {
    switchView('audit');
    // We could filter the audit body here, but for now just showing the logic
    showToast(`Filtering Audit for ${itemId}...`);
}

function renderLedger() {
    const entries = InventoryEngine.getCache().ledger;
    const body = document.getElementById('ledger-body');
    if (!body) return;
    body.innerHTML = entries.slice().reverse().map(e => `
        <tr>
            <td>${new Date(e.date).toLocaleDateString()}</td>
            <td><strong>${e.id}</strong></td>
            <td>${e.description}<br><small style="color:var(--text-muted)">${e.debit} ⟵ ${e.credit}</small></td>
            <td style="color: var(--success); font-weight: 700">₹${e.amount.toLocaleString()}</td>
            <td>-</td>
            <td>${e.reference || 'N/A'}</td>
        </tr>
    `).join('');
}

// 📝 FORM SUBMISSIONS
function handleProjectSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('p_name').value;
    const budget = document.getElementById('p_budget').value;
    const date = document.getElementById('p_date').value;
    
    InventoryEngine.projects.add(name, budget, date);
    hideModals();
    renderProjects();
    InventoryEngine.finance.recordEntry('PROJECT_EXPENSE', 'CASH', 0, 'INITIAL', `Project ${name} Initialized`);
}

function handleItemSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('i_name').value;
    const cat = document.getElementById('i_category').value;
    const min = document.getElementById('i_min').value;
    const unit = document.getElementById('i_unit').value;
    
    InventoryEngine.inventory.addItem(name, cat, min, unit);
    hideModals();
    renderInventory();
}

function handleVoucherSubmit(e) {
    e.preventDefault();
    const dr = document.getElementById('v_dr').value;
    const cr = document.getElementById('v_cr').value;
    const amt = document.getElementById('v_amount').value;
    const desc = document.getElementById('v_desc').value;
    
    InventoryEngine.finance.recordEntry(dr, cr, amt, 'VOUCHER', desc);
    hideModals();
    renderLedger();
    if (currentView === 'dashboard') renderDashboard();
}

// 🖼️ MODAL UTILS
function showModal(id) {
    document.getElementById(id).style.display = 'flex';
}

function hideModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
}

// GLOBAL EXPORTS
window.addPin = addPin;
window.clearPin = clearPin;
window.submitLogin = submitLogin;
window.logout = logout;
window.switchView = switchView;
window.handleProjectSubmit = handleProjectSubmit;
window.handleItemSubmit = handleItemSubmit;
window.handleVoucherSubmit = handleVoucherSubmit;
window.showModal = showModal;
window.hideModals = hideModals;
