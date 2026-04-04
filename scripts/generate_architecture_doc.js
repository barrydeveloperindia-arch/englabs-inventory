
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.join(__dirname, '../output');
if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
}

const doc = new PDFDocument({ margin: 50 });
doc.pipe(fs.createWriteStream(path.join(outputPath, 'Hop_In_Express_Architecture_API_Guide.pdf')));

// --- Styles ---
const colors = {
    primary: '#4F46E5', // Indigo
    secondary: '#475569', // Slate
    accent: '#10B981', // Emerald
    text: '#1E293B'
};

function addHeader(title) {
    doc.moveDown();
    doc.font('Helvetica-Bold').fontSize(20).fillColor(colors.primary).text(title);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor(colors.primary).stroke();
    doc.moveDown(0.5);
}

function addSubHeader(title) {
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(14).fillColor(colors.secondary).text(title);
    doc.moveDown(0.2);
}

function addBody(text) {
    doc.font('Helvetica').fontSize(10).fillColor(colors.text).text(text, { align: 'justify', lineGap: 2 });
}

function addEndpoint(method, url, desc) {
    doc.moveDown(0.2);
    doc.font('Courier-Bold').fontSize(10).fillColor(colors.primary).text(method, { continued: true });
    doc.font('Courier').fillColor('black').text(` ${url}`);
    doc.font('Helvetica').fontSize(9).fillColor(colors.secondary).text(`> ${desc}`, { indent: 10 });
}

// --- Content ---

// Title Page
doc.fontSize(26).fillColor(colors.primary).text('ENGLABS INVENTORY Command OS', { align: 'center' });
doc.fontSize(16).fillColor(colors.secondary).text('Technical Architecture & API Reference', { align: 'center' });
doc.moveDown(2);
doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
doc.addPage();

// 1. System Overview
addHeader('1. System Architecture Overview');
addBody(`The ENGLABS INVENTORY "Command OS" uses a Hybrid Architecture designed for high-reliability retail environments. It combines a local Node.js automation server with a cloud-based React frontend.`);
doc.moveDown();

doc.font('Helvetica-Bold').text('Core Components:');
const components = [
    { name: 'Frontend (Vite/React)', desc: 'The visual interface running in the browser. Handles user interactions, real-time data visualization, and direct Firestore subscriptions.' },
    { name: 'Local Automation Server (Express)', desc: 'Runs on port 3001. Handles hardware interactions (scanners), file system operations (image uploads), and "privileged" verification tasks.' },
    { name: 'Data Layer (Firebase)', desc: 'Firestore serves as the central source of truth for Inventory, Staff, and Sales. Firebase Auth handles identity.' }
];

components.forEach(c => {
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(10).text(`• ${c.name}:`, { continued: true });
    doc.font('Helvetica').text(` ${c.desc}`);
});

// 2. Data Flow & Workflows
addHeader('2. Key Workflows & Data Privacy');

addSubHeader('Workflow A: Inventory Ingestion (The "Gatekeeper" Pattern)');
addBody(`Data Privacy: High. Unverified items stay in a staging status. Only authorized admins can promote items to "LIVE".`);
doc.moveDown(0.5);
doc.font('Courier').fontSize(9).text(
    `[Hardware Scan] --> [Antigravity CLI]
       |
       v
[Unverified Collection (Firestore)]
       |
       v
[Admin Dashboard] --(Verify API)--> [Live Inventory]
`
);

addSubHeader('Workflow B: Staff Onboarding');
addBody(`1. User registers via Auth View (Firebase Auth).`);
addBody(`2. User enters "Pending" state in Firestore.`);
addBody(`3. Admin verifies credentials via the "Verify Staff" API.`);
addBody(`4. Staff gains access to the Terminal.`);

addSubHeader('Workflow C: Sales & Transactions');
addBody(`All sales are atomic. When a sale occurs, a "Batch Write" is sent to Firestore that simultaneously:`);
addBody(`- Creates a Transaction Record.`);
addBody(`- Decrements stock from the specific Inventory Item.`);
addBody(`- Updates the Ledger (if applicable).`);

// 3. API Reference
addHeader('3. API Reference (Local Express Server)');
addBody('Base URL: http://localhost:3001');

addSubHeader('Automation & Hardware');
addEndpoint('POST', '/shelf-scan/start', 'Triggers the Antigravity hardware shelf scanner for UK Grocery mode.');

addSubHeader('Administrative Verification');
addEndpoint('GET', '/admin/unverified-products', 'Fetches items waiting in the staging area.');
addEndpoint('POST', '/admin/verify-product/:id', 'Promotes an item to LIVE status working inventory.');
addEndpoint('POST', '/admin/verify-staff/:id', 'Activates a pending staff member account.');

addSubHeader('Asset Management');
addEndpoint('POST', '/product/upload-image/:id', 'Uploads product image to local storage and links it in DB.');

// 4. Database Schema (Firestore)
addHeader('4. Database Schema (Firestore)');

const collections = [
    { name: 'shops/{id}/inventory', desc: 'Main product catalog. Fields: sku, stock, price_gbp, vatRate.' },
    { name: 'shops/{id}/transactions', desc: 'Immutable sales history. Fields: items[], total, timestamp.' },
    { name: 'shops/{id}/staff', desc: 'Staff profiles and roles. Fields: name, pin, role, status.' },
    { name: 'shops/{id}/attendance', desc: 'Clock-in/out logs for payroll.' },
    { name: 'shops/{id}/ledger', desc: 'Double-entry bookkeeping records for expenses and sales.' }
];

collections.forEach(c => {
    doc.moveDown(0.5);
    doc.font('Courier-Bold').fontSize(10).text(c.name);
    doc.font('Helvetica').fontSize(10).text(c.desc, { indent: 10 });
});

// Footer
doc.moveDown(4);
doc.fontSize(8).fillColor('gray').text('CONFIDENTIAL - ENGLABS INVENTORY INTERNAL DOCS', { align: 'center' });

doc.end();
console.log('PDF Generated successfully.');
