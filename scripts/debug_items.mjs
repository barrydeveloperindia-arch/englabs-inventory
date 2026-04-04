
import fs from 'fs';
const data = JSON.parse(fs.readFileSync('invoice_ingestion_report.json'));
console.log("Total Invoices in Report:", data.length);

const successful = data.filter(d => d.status === 'Success');
console.log("Successful Invoices:", successful.length);

if (successful.length > 0) {
    console.log("\n--- Debugging First 5 Successful ---");
    successful.slice(0, 5).forEach((d, i) => {
        console.log(`\n[${i}] File: ${d.fileName}`);
        console.log(`    Items Type: ${typeof d.extracted.items}`);
        console.log(`    Is Array?: ${Array.isArray(d.extracted.items)}`);
        console.log(`    Raw Preview: ${JSON.stringify(d.extracted.items).slice(0, 100)}...`);
    });
}
