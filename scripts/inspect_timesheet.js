
import XLSX from 'xlsx';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, '../output/2026_Time Sheet .xlsx');

console.log(`Reading file: ${filePath}`);
const workbook = XLSX.readFile(filePath, { cellDates: true });

console.log("Sheet Names:", workbook.SheetNames);

// Inspect 'Nisha' sheet
const sheetName = 'Nisha';
const sheet = workbook.Sheets[sheetName];
if (sheet) {
    console.log(`\n--- Inspecting Sheet: ${sheetName} ---`);
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false });
    // Log rows 0 to 30 with column indices
    rows.slice(0, 30).forEach((row, idx) => {
        console.log(`Row ${idx}:`, JSON.stringify(row));
    });
} else {
    console.log(`Sheet '${sheetName}' not found.`);
}
