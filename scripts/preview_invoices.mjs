import fs from 'fs';
import path from 'path';

const reportPath = path.join(process.cwd(), 'invoice_ingestion_report.json');

if (!fs.existsSync(reportPath)) {
    console.log("❌ No report found yet.");
    process.exit(0);
}

const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// Filter only successful ones
const successful = data.filter(d => d.status === 'Success');
const failed = data.filter(d => d.status === 'Failed');

console.log(`\n📊 SUMMARY:`);
console.log(`✅ Successful: ${successful.length}`);
console.log(`❌ Failed: ${failed.length}`);
console.log(`-----------------------------------`);

if (successful.length > 0) {
    console.log(`\n📋 PREVIEW OF DATA TO BE COMMITTED:\n`);
    successful.forEach((inv, i) => {
        const items = inv.extracted.items;
        const itemCount = Array.isArray(items) ? items.length : 'N/A';
        console.log(`${i + 1}. [${inv.vendorFolder}] Invoice #${inv.extracted.inv_num}`);
        console.log(`   📅 Date: ${inv.extracted.date}`);
        console.log(`   💰 Total: £${inv.extracted.total}`);
        if (Array.isArray(items) && items.length > 0) {
            console.log(`   🛒 Items (${itemCount}):`);
            items.slice(0, 3).forEach(item => console.log(`      - ${item.qty}x ${item.name} (£${item.price || '?'})`));
            if (items.length > 3) console.log(`      ... and ${items.length - 3} more`);
        } else {
            console.log(`   🛒 Items summary: ${inv.extracted.items}`);
        }
        console.log(`-----------------------------------`);
    });
} else {
    console.log("No successful extractions to show yet.");
}
