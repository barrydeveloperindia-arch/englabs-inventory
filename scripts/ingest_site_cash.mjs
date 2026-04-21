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
    const discoveredItems = [];
    const discoveredProjects = new Set();


    console.log(`📊 Processing April 2026 sheet...`);

    // Data starts at Row 4 (Index 4)
    let lastDate = null;

    for (let i = 4; i < raw.length; i++) {
        const row = raw[i];
        if (!row || row.length < 5) continue;

        let dateRaw = row[0];
        if (!dateRaw || isNaN(dateRaw)) {
            if (lastDate) dateRaw = lastDate;
            else continue; // Still empty and no previous date
        } else {
            lastDate = dateRaw;
        }

        const from = row[1] || '';
        const mode = row[2] || '';
        const recBy = row[3] || '';
        const desc = row[4] || '';
        if (!desc) continue; // Skip truly empty lines

        const cr = parseFloat(row[5] || 0);
        const dr = parseFloat(row[6] || 0);
        const balance = parseFloat(row[7] || 0);
        
        const maintenance = parseFloat(row[9] || 0);
        const emergency = parseFloat(row[10] || 0);
        const logi = parseFloat(row[11] || 0);
        const projectId = row[13] || 'C-GENERAL';
        const date = new Date((dateRaw - 25569) * 86400 * 1000).toISOString();
        
        let category = 'GENERAL';
        if (maintenance > 0) category = 'MAINTENANCE';
        else if (emergency > 0) category = 'EMERGENCY';
        else if (logi > 0) category = 'LOGISTICS';

        const addEntry = (type, amount) => {
            ledgerEntries.push({
                type,
                amount,
                date,
                description: desc,
                project: projectId,
                category,
                from,
                mode,
                recBy,
                balance,
                ref: `EX-ROW-${i}`
            });
        };

        if (cr !== 0) addEntry(cr > 0 ? 'IN' : 'OUT', Math.abs(cr));
        if (dr !== 0) addEntry('OUT', dr);
        if (cr === 0 && dr === 0 && balance !== 0) {
             // Handle balance-only rows? No, usually skipping.
        }



        // 📦 Smarter Forensic Item Extraction (Physical Items Only)
        const dLower = desc.toLowerCase();
        let foundItems = [];
        let qty = 1;

        const isService = dLower.includes('porter') || dLower.includes('repair') || dLower.includes('upi') || dLower.includes('charge');

        if (!isService) {
            if (dLower.includes('purchase to')) {
                const part = desc.split(/purchase to/i)[1].trim();
                foundItems = part.includes(' and ') ? part.split(' and ') : [part];
            }
            else if (dLower.includes('purchased to')) foundItems = [desc.split(/purchased to/i)[1]];
            else if (dLower.includes('purchase of')) foundItems = [desc.split(/purchase of/i)[1]];
            else if (dLower.includes('milk')) {
                foundItems = ['Dairy/Office Supplies'];
                const match = desc.match(/([0-9]+)\s*nos/i);
                if (match) qty = parseInt(match[1]);
            }
            else if (dLower.includes('blinkit') || dLower.includes('zepto')) foundItems = ['Office Essentials'];
            else if (dLower.includes('mdf')) foundItems = ['MDF Sheets (6mm/10mm)'];
        }

        foundItems.forEach(itemStr => {
            if (itemStr) {
                let cleanItem = itemStr.split(/ For/i)[0].split(' for')[0].split(/ C[0-9]{4}/)[0].split('(')[0].trim();
                
                // 🏛️ Canonical Normalization Map
                if (cleanItem.toLowerCase().includes('milk')) cleanItem = 'Dairy/Office Supplies';
                if (cleanItem.toLowerCase().includes('mdf')) cleanItem = 'MDF Sheets (6mm/10mm)';
                if (cleanItem.toLowerCase().includes('favikwik') || cleanItem.toLowerCase().includes('faviquick')) cleanItem = 'Favikwik Adhesive';
                if (cleanItem.toLowerCase().includes('bondtite')) cleanItem = 'Bondtite Adhesive';
                if (cleanItem.toLowerCase().includes('blinkit') || cleanItem.toLowerCase().includes('zepto')) cleanItem = 'Office Essentials';

                if (cleanItem.length > 2) {
                    const existing = discoveredItems.find(i => i.name === cleanItem);
                    if (existing) {
                        existing.qty += qty;
                        existing.rate = ((existing.rate * (existing.qty - qty)) + (dr / foundItems.length)) / existing.qty;
                    } else {
                        discoveredItems.push({ name: cleanItem, qty, rate: dr / foundItems.length });
                    }
                }
            }
        });






        if (projectId && projectId !== '0') {
            discoveredProjects.add(projectId);
        }
    }

    console.log(`✅ Extracted ${ledgerEntries.length} transactions.`);
    console.log(`📦 Discovered ${discoveredItems.length} items and ${discoveredProjects.size} projects.`);

    const seedContent = `/**
 * 🛰️ Auto-Generated Seed Data from Excel
 * Date: ${new Date().toLocaleString()}
 */

export const EXCEL_SEED = {
    ledger: ${JSON.stringify(ledgerEntries, null, 4)},
    discoveredItems: ${JSON.stringify(discoveredItems, null, 4)},
    discoveredProjects: ${JSON.stringify(Array.from(discoveredProjects), null, 4)}
};
`;

    fs.writeFileSync(OUTPUT_SEED, seedContent);
    console.log(`📦 Seed successfully written to ${OUTPUT_SEED}`);
}

ingest().catch(console.error);
