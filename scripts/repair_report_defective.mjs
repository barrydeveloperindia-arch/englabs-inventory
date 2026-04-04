
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

// --- CONFIGURATION ---
const API_KEY = process.env.VITE_GOOGLE_GENAI_API_KEY || "AIzaSyAyzMBc68JbPs7CaysjR1n7ItyYsCPSJmQ";

const genAI = new GoogleGenerativeAI(API_KEY);

async function repairReport() {
    console.log("🚀 Starting Invoice Report Repair...");

    const reportPath = path.join(process.cwd(), 'invoice_ingestion_report.json');
    if (!fs.existsSync(reportPath)) {
        console.error("❌ Report file not found.");
        process.exit(1);
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    console.log(`📋 Loaded ${report.length} entries.`);

    // Find defective entries: Total is 0 OR Missing Items
    const defective = report.filter(r => {
        // Condition 1: Total is 0 (and filtered items don't sum up?).
        if ((r.extracted?.total || 0) === 0) return true;

        // Condition 2: Items exist but have 0 cost
        if (r.extracted?.items && Array.isArray(r.extracted.items)) {
            const hasZeroCost = r.extracted.items.some(i => (i.line_total || 0) === 0 && (i.caseCost || 0) === 0 && (i.unitCost || 0) === 0);
            if (hasZeroCost) return true;
        }
        return false;
    });

    console.log(`🔍 Found ${defective.length} defective entries to re-analyze.`);

    if (defective.length === 0) {
        console.log("✅ No defective entries found.");
        process.exit(0);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let processedCount = 0;
    for (const entry of defective) {
        processedCount++;
        console.log(`\n[${processedCount}/${defective.length}] repairing: ${entry.fileName}...`);

        try {
            if (!fs.existsSync(entry.filePath)) {
                console.warn(`   ⚠️ File missing: ${entry.filePath}`);
                continue;
            }

            const fileBuffer = fs.readFileSync(entry.filePath);
            const base64Data = fileBuffer.toString('base64');
            const mimeType = entry.fileName.toLowerCase().endsWith('pdf') ? 'application/pdf' : 'image/jpeg';

            const prompt = `Analyze this wholesale invoice. The previous analysis failed to extract costs (result was 0).
            The image likely contains 'Case Cost', 'Unit Cost', 'Net Value', or 'Amount'.
            
            CRITICAL INSTRUCTIONS:
            1. Look for 'Value', 'Net', 'Amount', 'Total'. This is 'line_total'.
            2. If 'line_total' is missing, look for 'Unit Price' or 'Case Cost'. Calculate line_total = Qty * Price.
            3. IGNORE 'RRP' or 'PM' (Price Mark). E.g. "PM £2.99" is NOT the cost.
            4. If column says "Free", cost is 0.
            5. Extract 'code' (SKU/Barcode) and 'desc' (Description).
            
            Return JSON:
            {
              "date": "YYYY-MM-DD",
              "total": 0.00,
              "items": [
                {
                  "code": "string",
                  "desc": "string",
                  "qty_cases": 1,
                  "pack_size": 1,
                  "line_total": 0.00,
                  "caseCost": 0.00,
                  "unitCost": 0.00
                }
              ]
            }
            `;

            const result = await model.generateContent([
                prompt,
                { inlineData: { data: base64Data, mimeType } }
            ]);

            const text = result.response.text();
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanText);

            console.log(`   ✅ Extracted: £${data.total} | ${data.items?.length} items.`);

            // Update Entry in Memory
            entry.extracted = data;
            entry.status = 'Repaired';
            entry.repairedAt = new Date().toISOString();

            // Save Progress Every Time (in case of crash)
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

            // Rate Limit
            await new Promise(r => setTimeout(r, 5000));

        } catch (err) {
            console.error(`   ❌ Failed: ${err.message}`);
        }
    }

    console.log("\n✅ Repair Complete.");
}

repairReport().catch(console.error);
