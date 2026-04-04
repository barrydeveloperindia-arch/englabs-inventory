
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.resolve(__dirname, '../assets/Sales_20250930-20260101.csv');

// Category Mapping to DailySalesRecord schema
const CATEGORY_MAP = {
    'Alcohol': 'alcohol',
    'Tobacco': 'tobacco',
    'Tobacco Sundr': 'tobacco',
    'Alternative Smoking': 'tobacco', // Vapes etc
    'Drinks': 'drinks',
    'Chiller': 'drinks', // Often drinks or dairy, let's assume drinks/food? actually Chiller often includes Snacks/Groceries.
    // Let's keep it 'groceries' if unsure, but user might want specific.
    // Actually, let's map 'Chiller' to 'groceries' to be safe, or 'drinks' if they are soft drinks.
    // Let's log it separately first.
    'Groceries': 'groceries',
    'Frozen': 'groceries',
    'Pet': 'household',
    'Household': 'household',
    'Stationery': 'news', // Closest match? Or Other.
    'Paypoint': 'paypoint',
    'Snacks': 'snacks',
    'Confectionery': 'snacks',
    'Electronic Goods': 'other',
    'Miscellaneous': 'other',
    'Unclassified': 'other'
};

function parseLine(line) {
    const parts = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuote = !inQuote;
        else if (char === ',' && !inQuote) {
            parts.push(current.trim());
            current = '';
        } else current += char;
    }
    parts.push(current.trim());
    return parts;
}

function analyzeRevenue() {
    const content = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = content.split('\n');

    let currentCategory = 'Uncategorized';

    // Accumulators
    const totals = {
        alcohol: 0,
        tobacco: 0,
        lottery: 0,
        drinks: 0,
        groceries: 0,
        household: 0,
        snacks: 0,
        paypoint: 0,
        news: 0,
        other: 0
    };

    let totalRevenue = 0;
    let totalItems = 0;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        const cols = parseLine(line);

        // Header/Category detection logic (same as before)
        if (line.startsWith('Sales Report') || line.startsWith('Report for') || line.startsWith('All Wholesalers')) continue;
        if (cols[0] === 'Barcode') continue;

        if (!line.includes('="') && cols.length < 5 && line.includes('Products Sold')) {
            // "Alcohol, 196 Products Sold in Category"
            // Ignore Subcategory lines
            if (!line.includes('Sub Category')) {
                currentCategory = cols[0].replace(' Products Sold in Category', '').trim();
            }
            continue;
        }

        // Data Line: Barcode="...", Desc, ..., Price, Qty, ..., Total?
        // Let's re-verify column indices from previous script logic
        // Previous script: cols[4] = Price, cols[5] = QtySold
        // Total Value = Price * QtySold? Or is there a Total column?
        // Line 7: ... 20.00%, 3.49, 22, ...
        // 3.49 * 22 = 76.78. 
        // The last col in previous sample was 39.14 (maybe cost?)
        // Let's calculate Revenue = Price * QtySold

        if (cols[0] && cols[0].includes('=')) {
            const price = parseFloat(cols[4]) || 0;
            const qty = parseFloat(cols[5]) || 0;
            const revenue = price * qty;

            const targetCat = CATEGORY_MAP[currentCategory] || 'other';

            if (targetCat === 'drinks' && currentCategory === 'Chiller') {
                // specific override if needed
            }

            // Special handling for Chiller? 
            // Let's map Chiller to Groceries for now
            if (currentCategory === 'Chiller') {
                totals.groceries += revenue;
            } else {
                if (totals[targetCat] !== undefined) {
                    totals[targetCat] += revenue;
                } else {
                    totals.other += revenue;
                }
            }

            totalRevenue += revenue;
            totalItems++;
        }
    }

    console.log("Revenue Breakdown (Estimated from Price * Qty):");
    console.log(JSON.stringify(totals, null, 2));
    console.log(`Total Revenue: ${totalRevenue.toFixed(2)}`);
    console.log(`Total Items: ${totalItems}`);

    // Recommendation
    console.log("\nRECOMMENDATION:");
    console.log("Since specific dates are missing, we can import this as a single 'Historical Sales' entry.");
    console.log("Proposed Date: 2026-01-01 (or user choice)");
}

analyzeRevenue();
