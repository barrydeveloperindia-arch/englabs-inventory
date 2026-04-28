import('./js/seed_data.js').then(({ EXCEL_SEED }) => {
    try {
        const allRows = EXCEL_SEED.siteCashRows;
        console.log('Testing', allRows.length, 'rows');
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
        console.log('SUCCESS');
    } catch(e) {
        console.log('CRASHED!', e);
    }
});
