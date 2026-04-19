/**
 * 🛰️ EngLabs Master ERP: Application Controller
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
    document.getElementById('view-' + viewId).style.display = 'block';
    
    // Update active nav
    const activeNav = Array.from(document.querySelectorAll('.nav-item')).find(n => n.getAttribute('onclick').includes(viewId));
    if (activeNav) activeNav.classList.add('active');

    // Update Header
    const titles = {
        'dashboard': 'Central Gateway',
        'projects': 'Project Master',
        'inventory': 'Master Inventory',
        'purchase': 'Purchase System',
        'sales': 'Sales & Billing',
        'ledger': 'Financial Ledger',
        'reports': 'MIS Reports',
        'audit': 'System Audit',
        'admin': 'ERP Configuration'
    };
    document.getElementById('active-title').textContent = titles[viewId] || 'EngLabs ERP';
    
    currentView = viewId;
    updateUI();
}

// 🔄 UI UPDATE ENGINE
function updateUI() {
    if (currentView === 'dashboard') renderDashboard();
    if (currentView === 'projects') renderProjects();
    if (currentView === 'inventory') renderInventory();
    if (currentView === 'ledger') renderLedger();
    if (currentView === 'audit') renderAudit();
    if (currentView === 'reports') renderReports();
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
                label: 'Project Revenue',
                data: [450, 520, 610, 840],
                backgroundColor: '#3b82f6'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
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
                data: [12000, 19000, 3000, 5000, 2000, 3000],
                borderColor: '#3b82f6',
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
        </tr>
    `).join('');
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
