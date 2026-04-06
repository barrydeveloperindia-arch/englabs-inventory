import fs from 'fs';
let content = fs.readFileSync('components/SuppliersView.tsx', 'utf8');
content = content.replace(/logAction\('([^']+)',\s*'suppliers'/g, "logAction('$1', 'vendors'");
fs.writeFileSync('components/SuppliersView.tsx', content);
