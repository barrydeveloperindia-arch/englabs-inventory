const ledger = [
    {
        id: 'FIN-123456',
        date: '2026-04-28T10:00:00Z',
        debit: 'EXPENSE',
        credit: 'SITE_CASH',
        amount: 271,
        reference: 'C5131|LOGGED',
        description: 'Blinkit Restock (Doc-Extracted)',
        type: 'OUT',
        from: 'Blinkit',
        mode: 'ONLINE'
    }
];
const mappedUiTx = ledger.map(t => ({
    date: t.date,
    from: t.from || (t.type==='IN'?'Added via UI':''),
    mode: t.mode || 'ONLINE',
    recBy: t.recBy || 'System',
    desc: t.description,
    cr: t.type === 'IN' ? t.amount : 0,
    dr: t.type === 'OUT' ? t.amount : 0,
    balance: t.balance || 0,
    maintenance: 0,
    emergency: 0,
    logi: (t.description || '').toLowerCase().includes('blinkit') || (t.description || '').toLowerCase().includes('zepto') ? t.amount : 0,
    projDr: 0,
    projectId: t.reference ? t.reference.split('|')[0] : '',
    budget: 0,
    profit: 0,
    remarks: 'Auto-Imported'
}));

const allRows = mappedUiTx;
console.log(allRows.length);
try {
    const html = allRows.map(t => {
        return `
        <tr>
            <td style="white-space: nowrap">${new Date(t.date).toLocaleDateString()}</td>
            <td><span style="font-weight: 700; color: var(--primary)">${t.from || '-'}</span></td>
            <td><span class="badge badge-outline" style="font-size: 0.6rem">${t.mode || '-'}</span></td>
            <td>${t.recBy || '-'}</td>
            <td style="min-width: 250px">${t.desc || '-'}</td>
            <td style="color: var(--success); font-weight: 600">${t.cr ? '₹' + t.cr.toLocaleString() : '-'}</td>
            <td style="color: var(--danger); font-weight: 600">${t.dr ? '₹' + t.dr.toLocaleString() : '-'}</td>
            <td style="font-weight: 700; color: var(--primary)">₹${t.balance?.toLocaleString() || '0'}</td>
            
            <td style="color: #eab308; font-weight: 600">${t.maintenance ? '₹'+t.maintenance.toLocaleString() : '-'}</td>
            <td style="color: var(--danger); font-weight: 600">${t.emergency ? '₹'+t.emergency.toLocaleString() : '-'}</td>
            <td style="color: #8b5cf6; font-weight: 600">${t.logi ? '₹'+t.logi.toLocaleString() : '-'}</td>
            
            <td style="color: var(--danger); font-weight: 600">${t.projDr ? '₹'+t.projDr.toLocaleString() : '-'}</td>
            <td><span class="badge badge-primary" style="font-size: 0.65rem">${t.projectId || '-'}</span></td>
            <td style="font-weight: 600">${t.budget ? '₹'+t.budget.toLocaleString() : '-'}</td>
            <td><span class="badge ${t.profit > 0 ? 'badge-success' : (t.profit < 0 ? 'badge-danger' : 'badge-outline')}">${t.profit ? '₹'+t.profit.toLocaleString() : '-'}</span></td>
            <td style="font-size: 0.75rem">${t.remarks || '-'}</td>
        </tr>
    `;
    }).join('');
    console.log(html.substring(0, 100));
} catch(e) { console.error('CRASH:', e); }
