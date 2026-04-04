
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.resolve(__dirname, '../assets/Sales_20250930-20260101.csv');

function parseLine(line) {
    // Simple CSV parser that handles quoted strings containing commas
    const parts = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            parts.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    parts.push(current.trim());
    return parts;
}

function analyze() {
    if (!fs.existsSync(CSV_PATH)) {
        console.error(`File not found: ${CSV_PATH}`);
        return;
    }

    const content = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = content.split('\n');

    let currentCategory = 'Uncategorized';
    let currentSubCategory = 'General';

    const items = [];
    const categories = new Set();

    console.log("Analyze Report...");

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = parseLine(line);

        // Header Detection / Metadata skipping
        if (line.startsWith('Sales Report') || line.startsWith('Report for') || line.startsWith('All Wholesalers')) continue;
        if (cols[0] === 'Barcode') continue; // Header line

        // Category Detection (Heuristic: Line doesn't start with =" and has text)
        if (!line.includes('="') && cols.length < 5 && line.includes('Products Sold')) {
            // Likely a category header
            // "Alcohol, 196 Products Sold in Category"
            if (line.includes('Sub Category')) {
                // "Alcohol Beer,38 Products Sold in Sub Category"
                currentSubCategory = cols[0].replace(' Products Sold in Sub Category', '').trim();
            } else {
                // "Alcohol, 196 Products Sold in Category"
                currentCategory = cols[0].replace(' Products Sold in Category', '').trim();
                categories.add(currentCategory);
            }
            continue;
        }

        // Debugging first few lines
        if (i < 20) {
            console.log(`Line ${i} [${line.length} chars]: ${line.substring(0, 50)}...`);
            console.log(`   Parsed Cols [0]: ${cols[0]}`);
        }

        // Data Line Detection
        if (cols[0] && cols[0].includes('=')) {
            // Relaxed check from startsWith('="') in case of whitespace or encoding

            const rawBarcode = cols[0]; // ="8008440246066"
            const barcode = rawBarcode.replace(/[^0-9]/g, ''); // Just extract numbers

            // Col detection might vary if "Issue Number" is present or not
            // The file header says: Barcode,Issue Number,Description,Tax,Price,...
            // So Description is Col 2.

            const description = cols[2] ? cols[2].replace(/^"|"$/g, '') : 'Unknown';

            // Col 4: Price
            // Col 5: Qty
            // Col 8: Cost

            const price = parseFloat(cols[4]);
            const qtySold = parseFloat(cols[5]);
            const totalCost = parseFloat(cols[8]);

            if (barcode && description !== 'Unknown') {
                // Calculate Unit Cost
                let unitCost = 0;
                if (qtySold > 0) {
                    unitCost = totalCost / qtySold;
                }

                items.push({
                    barcode,
                    name: description,
                    category: currentCategory,
                    subCategory: currentSubCategory,
                    price: price || 0,
                    costPrice: parseFloat(unitCost.toFixed(2)),
                    totalSold: qtySold
                });
            }
        }
    }

    console.log(`\nAnalysis Complete.`);
    console.log(`Total Items Detected: ${items.length}`);
    console.log(`Categories Detected: ${Array.from(categories).join(', ')}`);
    console.log(`\nSample Data (First 3):`);
    console.log(JSON.stringify(items.slice(0, 3), null, 2));

    // Save processed JSON for potential import
    const outPath = path.resolve(__dirname, '../assets/processed_sales_import.json');
    fs.writeFileSync(outPath, JSON.stringify(items, null, 2));
    console.log(`\nProcessed data saved to: ${outPath}`);
}

analyze();
