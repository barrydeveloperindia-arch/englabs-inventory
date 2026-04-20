import XLSX from 'xlsx';
import * as fs from 'fs';

/**
 * 🛠️ ENGLABS_ACCOUNTS_TEAM: Site Cash & Item Ingestion Engine
 * Optimized for April 2026 Raw Schema (Starts at Row 4)
 */

const EXCEL_PATH = 'Site Cash Details/Englabs Site Cash.xlsx';
const OUTPUT_SEED = 'js/seed_data.js';

async function ingest() {
    console.log("🚀 Initializing Precision Ingestion Sequence...");

    if (!fs.existsSync(EXCEL_PATH)) {
        console.error("❌ Source file missing!");
        return;
    }

    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheet = workbook.Sheets['April_2026'];
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const ledgerEntries = [];
    const discoveredItems = new Set();
    const discoveredProjects = new Set();

    console.log(`📊 Processing April 2026 sheet...`);

    // Data starts at Row 4 (Index 4)
    for (let i = 4; i < raw.length; i++) {
        const row = raw[i];
        if (!row || row.length < 5) continue;

        const dateRaw = row[0];
        const desc = row[4] || '';
        const cr = parseFloat(row[5] || 0);
        const dr = parseFloat(row[6] || 0);
        const projectId = row[13] || 'C-GENERAL';

        if (!dateRaw || isNaN(dateRaw)) continue;

        const date = new Date((dateRaw - 25569) * 86400 * 1000).toISOString();

        if (cr !== 0) {
            ledgerEntries.push({
                type: 'IN',
                amount: Math.abs(cr), // Handle negative Cr. in Excel (Last balance)
                date,
                description: desc,
                project: projectId,
                ref: `EX-CR-${i}`
            });
        }

        if (dr > 0) {
            ledgerEntries.push({
                type: 'OUT',
                amount: dr,
                date,
                description: desc,
                project: projectId,
                ref: `EX-DR-${i}`
            });

            // 📦 Smart Item Extraction
            if (desc.toLowerCase().includes('purchase to')) {
                const item = desc.split(/purchase to/i)[1].trim();
                discoveredItems.add(item);
            } else if (desc.toLowerCase().includes('purchase of')) {
                const item = desc.split(/purchase of/i)[1].trim();
                discoveredItems.add(item);
            }
        }

        if (projectId && projectId !== '0') {
            discoveredProjects.add(projectId);
        }
    }

    console.log(`✅ Extracted ${ledgerEntries.length} transactions.`);
    console.log(`📦 Discovered ${discoveredItems.size} items and ${discoveredProjects.size} projects.`);

    const seedContent = `/**
 * 🛰️ Auto-Generated Seed Data from Excel
 * Date: ${new Date().toLocaleString()}
 */

export const EXCEL_SEED = {
    ledger: ${JSON.stringify(ledgerEntries, null, 2)},
    discoveredItems: ${JSON.stringify(Array.from(discoveredItems), null, 2)},
    discoveredProjects: ${JSON.stringify(Array.from(discoveredProjects), null, 2)}
};
`;

    fs.writeFileSync(OUTPUT_SEED, seedContent);
    console.log(`📦 Seed successfully written to ${OUTPUT_SEED}`);
}

ingest().catch(console.error);
