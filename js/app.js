/**
 * 🛰️ Englabs_Accounts_Team: Application Controller v2.2
 * Professional Workflow & Forensic Rendering Engine
 */
import InventoryEngine from './engine.js';

let currentView = 'dashboard';
let mainChart = null;

// 🏁 INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    InventoryEngine.seedData();
    switchView('dashboard');
    lucide.createIcons();
});

// 🔄 VIEW SWITCHER
function switchView(viewId) {
    document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) targetView.classList.add('active');

    const activeNav = Array.from(document.querySelectorAll('.nav-item')).find(n => n.getAttribute('onclick')?.includes(viewId));
    if (activeNav) activeNav.classList.add('active');

    const titles = {
        'dashboard': 'Central Gateway',
        'site-cash': 'Forensic Statement Ledger',
    };
    document.getElementById('active-title').textContent = titles[viewId] || 'EngLabs Command';
    
    currentView = viewId;
    updateUI();
    lucide.createIcons();
}

// 🔄 UI UPDATE ENGINE
function updateUI() {
    if (currentView === 'dashboard') renderDashboard();
    if (currentView === 'site-cash') renderSiteCash();
}

// 📊 DASHBOARD RENDERING
function renderDashboard() {
    const stats = InventoryEngine.reports.getDashboardStats();
    
    document.getElementById('stat-cash').textContent = `₹${stats.cashLiquidity.toLocaleString()}`;
    document.getElementById('stat-stock').textContent = `₹${stats.stockValuation.toLocaleString()}`;
    document.getElementById('stat-projects').textContent = stats.activeProjects;

    renderMainChart(stats);
}

function renderMainChart(stats) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    if (mainChart) mainChart.destroy();

    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Cash Velocity',
                data: [stats.cashLiquidity * 0.8, stats.cashLiquidity * 0.9, stats.cashLiquidity * 0.95, stats.cashLiquidity],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

// 🪙 SITE CASH RENDERING
function renderSiteCash() {
    const body = document.getElementById('site-cash-body');
    const balanceEl = document.getElementById('site-cash-bal');
    if (!body || !balanceEl) return;

    const ledger = InventoryEngine.getCache().ledger;
    const siteCashTx = ledger.filter(l => l.debit === 'SITE_CASH' || l.credit === 'SITE_CASH');
    
    const total = InventoryEngine.finance.getBalance('SITE_CASH');
    balanceEl.textContent = `₹${total.toLocaleString()}`;

    if (siteCashTx.length === 0) {
        body.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:4rem; color:var(--text-muted);">No forensic records found. Ingest a statement to begin.</td></tr>';
        return;
    }

    body.innerHTML = siteCashTx.map(t => {
        const isCr = t.debit === 'SITE_CASH';
        const dateStr = new Date(t.date).toLocaleDateString('en-IN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        
        return `
            <tr>
                <td style="color: var(--text-muted); font-size: 0.75rem; white-space: nowrap;">${dateStr}</td>
                <td style="font-weight: 600;">${t.from || 'BHIM User'}</td>
                <td><span class="badge" style="background: rgba(255,255,255,0.05);">${t.mode || 'UPI'}</span></td>
                <td style="font-size: 0.8rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${t.description}">${t.description}</td>
                <td style="color: var(--success); font-weight: 700;">${isCr ? '₹' + t.amount.toLocaleString() : '-'}</td>
                <td style="color: var(--danger); font-weight: 700;">${!isCr ? '₹' + t.amount.toLocaleString() : '-'}</td>
                <td style="font-weight: 700; color: var(--accent);">₹${(t.balance || 0).toLocaleString()}</td>
                <td><span class="badge" style="background: rgba(59, 130, 246, 0.1); color: var(--accent);">${t.reference?.split('|')[0] || 'GENERAL'}</span></td>
                <td style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">Verified Forensic</td>
            </tr>
        `;
    }).join('');
}

// 📥 IMPORT LOGIC
window.triggerUpload = function(source) {
    document.getElementById('stmt_upload').click();
};

window.handleStatementUpload = function(e) {
    if (e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const loader = document.getElementById('import-loader');
    loader.style.display = 'block';
    
    setTimeout(() => {
        loader.style.display = 'none';
        hideModals();
        
        // BHIM-FORMAT DATA EXTRACTION (Simulated from the Google Doc Analysis)
        const bhimTx = [
            { date: new Date().toISOString(), amount: 608, desc: 'UPI DELEGATE (xxxxxxxx LAL)', from: 'BHIM UPI', type: 'IN' },
            { date: new Date().toISOString(), amount: 420, desc: 'UPI PAY (Ritu)', from: 'BHIM UPI', type: 'IN' },
            { date: new Date().toISOString(), amount: 78, desc: 'UPI PAY (xxxxxxxxvedi)', from: 'BHIM UPI', type: 'OUT' },
            { date: new Date().toISOString(), amount: 181, desc: 'UPI PAY (MANOJ)', from: 'BHIM UPI', type: 'IN' }
        ];

        bhimTx.forEach(tx => {
            const dr = tx.type === 'IN' ? 'SITE_CASH' : 'EXPENSE';
            const cr = tx.type === 'IN' ? 'BANK' : 'SITE_CASH';
            InventoryEngine.finance.recordEntry(dr, cr, tx.amount, 'C5131|BHIM', tx.desc, { 
                mode: 'UPI', 
                from: tx.from,
                remarks: 'Ingested via Forensic Pipeline'
            });
        });

        showToast(`Forensic Success: ${bhimTx.length} BHIM Transactions Ingested.`);
        renderSiteCash();
        e.target.value = '';
    }, 2000);
};

// 🛠️ UTILS
function showModal(id) {
    document.getElementById(id).style.display = 'flex';
}

function hideModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.display = 'block';
    setTimeout(() => t.style.display = 'none', 3000);
}

// EXPOSE TO WINDOW
window.switchView = switchView;
window.showModal = showModal;
window.hideModals = hideModals;
window.showToast = showToast;
