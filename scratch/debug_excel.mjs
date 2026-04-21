import XLSX from 'xlsx';

const workbook = XLSX.readFile('Site Cash Details/Englabs Site Cash.xlsx');
const sheet = workbook.Sheets['April_2026'];
const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log(`Total rows: ${raw.length}`);

raw.forEach((row, i) => {
    if (i < 10) {
        console.log(`Row ${i}:`, row);
    }
});
