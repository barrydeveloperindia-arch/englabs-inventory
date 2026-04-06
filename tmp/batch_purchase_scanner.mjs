import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// Load API Key
const API_KEY = process.env.VITE_GOOGLE_GENAI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp",
    generationConfig: { responseMimeType: "application/json" }
});

const INVOICES = [
    { supplier: "FIXPRO ENGINEERING", path: "G:\\Englabs Inventory 2026-27\\Purchased Invoice Details\\FIXPRO ENGINEERING\\APRIL_2026\\04-04-2026.pdf" },
    { supplier: "Bala JI Enterprises", path: "G:\\Englabs Inventory 2026-27\\Purchased Invoice Details\\Bala JI Enterprises\\22-01-2025.jpeg" },
    { supplier: "Liberty Hardware Store", path: "G:\\Englabs Inventory 2026-27\\Purchased Invoice Details\\Liberty Hardware Store\\23-02-2026.pdf" }
];

async function scan(filePath) {
    console.log(`Analyzing: ${filePath}...`);
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = filePath.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
    
    const prompt = `
    Analyze this purchase invoice. Extract structured data including items, quantities, and totals.
    Return pure JSON:
    {
      "supplier": "string",
      "date": "YYYY-MM-DD",
      "invoiceNumber": "string",
      "totalAmount": 0.00,
      "items": [
        { "name": "string", "brand": "string", "qty": 0, "price": 0.00, "total": 0.00 }
      ]
    }`;

    try {
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType } }
        ]);
        return JSON.parse(result.response.text());
    } catch (e) {
        console.error(`Error scanning ${filePath}:`, e.message);
        return null;
    }
}

async function main() {
    const results = [];
    for (const inv of INVOICES) {
        const data = await scan(inv.path);
        if (data) results.push({ ...data, actualSupplier: inv.supplier });
    }
    console.log("\n--- Extraction Results ---");
    console.log(JSON.stringify(results, null, 2));
    fs.writeFileSync('./tmp/batch_purchase_scan.json', JSON.stringify(results, null, 2));
}

main().catch(console.error);
