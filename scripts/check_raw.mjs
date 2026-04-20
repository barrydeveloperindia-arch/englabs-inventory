import XLSX from 'xlsx';
import * as fs from 'fs';

const workbook = XLSX.readFile('Site Cash Details/Englabs Site Cash.xlsx');
const sheet = workbook.Sheets['April_2026'];
const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log("Raw Row 0:", raw[0]);
console.log("Raw Row 1:", raw[1]);
console.log("Raw Row 2:", raw[2]);
console.log("Raw Row 3:", raw[3]);
console.log("Raw Row 4:", raw[4]);
console.log("Raw Row 5:", raw[5]);
