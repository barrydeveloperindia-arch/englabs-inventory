import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.join(__dirname, '../docs/launch_package_feb16');
const OUTPUT_DIR = path.join(SOURCE_DIR, 'pdfs_pro');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Prepare Logo
let logoHtml = '';
const logoPng = path.join(__dirname, '../public/shop_logo.png');
const logoSvg = path.join(__dirname, '../public/icon.svg');

if (fs.existsSync(logoPng)) {
    const bitmap = fs.readFileSync(logoPng);
    const b64 = Buffer.from(bitmap).toString('base64');
    logoHtml = `<img src="data:image/png;base64,${b64}" style="height: 64px; width: auto; border: none; box-shadow: none; margin: 0;">`;
    console.log("Using shop_logo.png");
} else if (fs.existsSync(logoSvg)) {
    // raw svg
    logoHtml = fs.readFileSync(logoSvg, 'utf-8');
    // Ensure size
    logoHtml = logoHtml.replace('<svg', '<svg height="64" width="64"');
    console.log("Using icon.svg");
} else {
    // STRICT REQUIREMENT: Must have logo
    console.error("❌ CRITICAL: No ENGLABS INVENTORY Logo found (shop_logo.png or icon.svg). Cannot generate compliant documents.");
    process.exit(1);
}

const TEMPLATE = (title, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
        
        body { 
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #1f2937;
            line-height: 1.6;
            -webkit-print-color-adjust: exact;
        }

        /* Print Settings */
        @page {
            size: A4;
            margin: 20mm; /* Standard Safe Margin */
            @top-right {
                content: "CONFIDENTIAL";
                font-family: 'Inter', sans-serif;
                font-size: 9pt;
                color: #dc2626; /* red-600 */
            }
            @bottom-center {
                content: "Page " counter(page);
                font-family: 'Inter', sans-serif;
                font-size: 9pt;
                color: #9ca3af;
            }
        }

        /* Typography Override */
        h1, h2, h3 { font-weight: 700; letter-spacing: -0.025em; color: #111827; }
        h1 { font-size: 2.25rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 3px solid #4f46e5; }
        h2 { font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; color: #3730a3; }
        h3 { font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #4338ca; }
        p { margin-bottom: 1rem; text-align: justify; }
        
        /* Lists */
        ul { list-style-type: none; padding-left: 0; }
        li { 
            position: relative; 
            padding-left: 1.5rem; 
            margin-bottom: 0.5rem; 
        }
        li::before {
            content: "•";
            position: absolute;
            left: 0;
            color: #4f46e5;
            font-weight: bold;
        }

        /* Images */
        img { 
            display: block; 
            max-width: 100%; 
            height: auto; 
            margin: 1.5rem auto; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); 
            border-radius: 0.5rem; 
            border: 1px solid #e5e7eb;
        }

        /* Code/Mono */
        code {
            font-family: 'JetBrains Mono', monospace;
            background-color: #f3f4f6;
            padding: 0.2em 0.4em;
            border-radius: 0.25rem;
            font-size: 0.875em;
            color: #ef4444;
        }
    </style>
</head>
<body class="bg-white">
    
    <!-- Logo Header -->
    <div class="flex items-center justify-between mb-12 pb-6 border-b border-gray-200">
        <div class="flex items-center gap-4">
            <!-- Brand Logo -->
            ${logoHtml}
            <div>
                <div class="text-2xl font-bold tracking-tight text-gray-900">ENGLABS INVENTORY</div>
                <div class="text-xs font-semibold text-indigo-600 uppercase tracking-widest">Command OS</div>
            </div>
        </div>
        <div class="text-right">
            <div class="text-sm font-medium text-gray-500">Launch Package</div>
            <div class="text-xs text-gray-400">February 16, 2026</div>
        </div>
    </div>

    <!-- Main Content -->
    <main>
        ${content}
    </main>

    <!-- Footer Seal -->
    <div class="mt-16 pt-8 border-t border-gray-100 text-center text-xs text-gray-400">
        <p>Generated by Antigravity | Internal Document | Do Not Distribute</p>
    </div>
</body>
</html>
`;

function parseMarkdown(md) {
    let html = md;

    // Headers
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');

    // Bold & Italics
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

    // Code
    html = html.replace(/`(.*?)`/gim, '<code>$1</code>');

    // Images: ![alt](src)
    html = html.replace(/!\[(.*?)\]\((.*?)\)/gim, (match, alt, src) => {
        let imgPath = path.join(SOURCE_DIR, src);

        if (fs.existsSync(imgPath)) {
            const stats = fs.statSync(imgPath);
            // Heuristic for bad screenshot
            if (stats.size < 5000) {
                console.log(`Skipping bad screenshot: ${src} (${stats.size} bytes)`);
                const placeholderPath = path.join(SOURCE_DIR, 'images/placeholder.svg');
                if (fs.existsSync(placeholderPath)) {
                    const svg = fs.readFileSync(placeholderPath, 'base64');
                    return `<div class="break-inside-avoid my-6 bg-gray-50 border border-gray-200 rounded p-4 text-center">
                        <img src="data:image/svg+xml;base64,${svg}" alt="${alt} (Preview)" class="mx-auto w-full opacity-75">
                        <p class="text-xs text-gray-400 mt-2 italic">System Interface Preview: Live capture unavailable</p>
                     </div>`;
                }
            }

            const bitmap = fs.readFileSync(imgPath);
            const base64 = Buffer.from(bitmap).toString('base64');
            const mime = src.endsWith('.png') ? 'image/png' : 'image/jpeg';
            return `<div class="break-inside-avoid my-6">
                <img src="data:${mime};base64,${base64}" alt="${alt}">
                <div class="text-center text-xs text-gray-500 mt-2 italic">${alt}</div>
            </div>`;
        } else {
            // Fallback
            const fallbackPath = path.join(SOURCE_DIR, 'images/01_login_screen.png');
            if (fs.existsSync(fallbackPath)) {
                const bitmap = fs.readFileSync(fallbackPath);
                const base64 = Buffer.from(bitmap).toString('base64');
                return `<div class="break-inside-avoid my-6 border-l-4 border-yellow-400 pl-4 bg-yellow-50 py-2">
                    <img src="data:image/png;base64,${base64}" alt="${alt} (Example)" class="opacity-75 grayscale blur-[1px]">
                    <div class="text-center text-xs text-gray-500 mt-2 italic">Figure: System Interface (Placeholder for ${alt})</div>
                 </div>`;
            }
            return `<div class="p-4 bg-red-50 text-red-600 text-sm border border-red-200 rounded">Image Missing: ${src}</div>`;
        }
    });

    // Lists
    html = html.replace(/^[\*\-] (.*$)/gim, '<li>$1</li>');

    // Paragraph handling
    const sections = html.split(/\n\n+/);
    html = sections.map(section => {
        section = section.trim();
        if (!section) return '';
        if (section.startsWith('<h') || section.startsWith('<li') || section.startsWith('<div')) {
            if (section.includes('<li>')) {
                return `<ul>${section}</ul>`;
            }
            return section;
        }
        return `<p>${section.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    return html;
}

(async () => {
    console.log("Starting Professional PDF Generation...");
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.md'));

    for (const file of files) {
        console.log(`Processing ${file}...`);
        const content = fs.readFileSync(path.join(SOURCE_DIR, file), 'utf-8');
        const htmlContent = parseMarkdown(content);
        // Clean filename for title
        const cleanTitle = file.replace('.md', '').replace(/_/g, ' ');
        const finalHtml = TEMPLATE(cleanTitle, htmlContent);

        await page.setContent(finalHtml, { waitUntil: 'networkidle' });

        const pdfPath = path.join(OUTPUT_DIR, file.replace('.md', '.pdf'));

        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                bottom: '20mm',
                left: '20mm',
                right: '20mm'
            }
        });
        console.log(`Saved: ${pdfPath}`);
    }

    await browser.close();
    console.log("All Professional PDFs generated in docs/launch_package_feb16/pdfs_pro/");
})();
