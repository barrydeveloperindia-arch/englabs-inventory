const xlsx = require('xlsx');

const workbook = xlsx.readFile('G:\\Englabs Inventory 2026-27\\Purchased Invoice Details\\Material_Requirement_List.xlsx');
const sheet_name_list = workbook.SheetNames;
const xlData = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

console.log(JSON.stringify(xlData, null, 2));
