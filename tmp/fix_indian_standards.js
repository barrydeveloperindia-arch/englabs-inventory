import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'components');
function walk(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
        const fullPath = path.join(currentDir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            if (content.includes('£')) {
                content = content.replace(/£/g, '₹');
                modified = true;
            }
            
            // FinancialsView.tsx specific
            if (file === 'FinancialsView.tsx') {
               const oldText = "{rate === 0 ? 'Zero-Rated' : rate === 5 ? 'Reduced Rate' : 'Standard Rate'} ({rate}%)";
               const newText = "{rate === 0 ? 'Exempt' : rate === 18 ? 'Standard GST' : rate === 28 ? 'Luxury' : 'GST'} ({rate}%)";
               if (content.includes(oldText)) {
                   content = content.split(oldText).join(newText);
                   modified = true;
               }
            }
            
            if (file === 'SalesView.tsx') {
               const oldBreakdown = `    const vatBreakdown: Record<number, VatBandSummary> = {\n      0: { gross: 0, net: 0, vat: 0 },\n      5: { gross: 0, net: 0, vat: 0 },\n      20: { gross: 0, net: 0, vat: 0 }\n    };`;
               const newBreakdown = `    const vatBreakdown: Record<number, VatBandSummary> = {\n      0: { gross: 0, net: 0, vat: 0 },\n      5: { gross: 0, net: 0, vat: 0 },\n      12: { gross: 0, net: 0, vat: 0 },\n      18: { gross: 0, net: 0, vat: 0 },\n      28: { gross: 0, net: 0, vat: 0 }\n    };`;
               if (content.includes(oldBreakdown)) {
                   content = content.split(oldBreakdown).join(newBreakdown);
                   modified = true;
               }
            }
            
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed', file);
            }
        }
    }
}
walk(dir);
