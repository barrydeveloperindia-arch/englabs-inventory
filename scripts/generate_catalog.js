import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, '..', 'output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const filePath = path.join(outputDir, 'Hop-in_Express_Poster_and_Catalog.pdf');
const doc = new PDFDocument({ size: 'A4', margin: 36 });

doc.pipe(fs.createWriteStream(filePath));

// --- Poster / Cover Page ---

// Title style
doc.fontSize(26).fillColor('black').font('Helvetica-Bold').text("Hop-in Express", { align: 'left' });
doc.moveDown(0.2);

// Subtitle style
doc.fontSize(14).fillColor('grey').font('Helvetica').text("Your Everyday Convenience Store", { align: 'left' });
doc.moveDown(1);

// Address Block
doc.fontSize(12).fillColor('black');
doc.font('Helvetica-Bold').text("Address: ", { continued: true }).font('Helvetica').text("37 High St, Eastleigh SO50 5LG, United Kingdom");
doc.font('Helvetica-Bold').text("Contact: ", { continued: true }).font('Helvetica').text("+44 7453 313017");
doc.font('Helvetica-Bold').text("Owner: ", { continued: true }).font('Helvetica').text("Mr. Salil Anand");
doc.font('Helvetica-Bold').text("Website: ", { continued: true }).font('Helvetica').text("www.englabs.com");

doc.moveDown(1.5);

// Italic list
doc.font('Helvetica-Oblique').text("Spirits • Tobacco • Vapes • Grocery • Fresh Items • International Products");

doc.addPage();

// --- Catalog Section ---

doc.font('Helvetica-Bold').fontSize(18).fillColor('black').text("Product Catalog");
doc.moveDown(1);

const catalogData = [
    ["Category", "Available Items"],
    ["Spirits & Alcohol", "Whisky, Vodka, Rum, Wine, Beer"],
    ["Tobacco Products", "Cigarettes, Rolling Tobacco"],
    ["Vapes", "Disposable Vapes, E-Liquids"],
    ["Grocery", "Snacks, Biscuits, Drinks"],
    ["Fresh Items", "Bread, Milk, Fruits"],
    ["International Items", "Imported Snacks & Beverages"],
];

const colWidths = [150, 300];
const rowHeight = 30;
let y = doc.y;

// Reset font for table
doc.fontSize(12);

catalogData.forEach((row, i) => {
    const isHeader = i === 0;

    // Background for header
    if (isHeader) {
        doc.save();
        doc.fillColor('lightgrey');
        doc.rect(36, y, colWidths[0] + colWidths[1], rowHeight).fill();
        doc.restore();
    }

    // Set Text Color and Font
    doc.fillColor('black');
    if (isHeader) {
        doc.font('Helvetica-Bold');
    } else {
        doc.font('Helvetica');
    }

    // Draw Text with padding
    const textY = y + 8; // vertical padding
    doc.text(row[0], 36 + 8, textY, { width: colWidths[0] - 16, lineBreak: false });
    doc.text(row[1], 36 + colWidths[0] + 8, textY, { width: colWidths[1] - 16, lineBreak: false });

    // Draw Borders (last so they are on top)
    doc.lineWidth(0.5).strokeColor('grey');
    doc.rect(36, y, colWidths[0], rowHeight).stroke();
    doc.rect(36 + colWidths[0], y, colWidths[1], rowHeight).stroke();

    y += rowHeight;
});

doc.moveDown(2);
// Move y below the table
doc.y = y + 20;

doc.fontSize(12).font('Helvetica').text("Scan in-store or visit our website to view live prices and updated inventory.", { align: 'left' });

doc.end();

console.log(`PDF generated successfully at: ${filePath}`);
