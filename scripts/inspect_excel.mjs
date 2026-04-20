import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const filePath = 'Site Cash Details/Englabs Site Cash.xlsx';

if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
}

const workbook = XLSX.readFile(filePath);
console.log(`📂 Sheets found: ${workbook.SheetNames.join(', ')}`);

workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.table(data.slice(0, 5));
});
