import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch, initializeFirestore } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const args = process.argv.slice(2);
const envFile = args[0] === 'production' ? '.env.production' : '.env.development';
console.log(`🌍 Environment: ${envFile}`);
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// --- CONFIGURATION ---
const INVOICE_ROOT = "E:/Foundation Of Anand Sir/Wilmer Groups/PROJECTS/HOP-IN-EXPRESS/Inventory ID/Purchase Invoice";
const SHOP_ID = process.env.VITE_USER_ID || "hop-in-express-";

// Firebase Setup
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    databaseId: process.env.VITE_FIREBASE_DATABASE_ID || "(default)"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
}, firebaseConfig.databaseId);

const genAI = new GoogleGenerativeAI(process.env.VITE_GOOGLE_GENAI_API_KEY);

async function main() {
    console.log("🚀 Starting Invoice Ingestion...");

    // 1. Fetch Existing Suppliers to Match
    const suppliersRef = collection(db, 'shops', SHOP_ID, 'suppliers');
    const supSnap = await getDocs(suppliersRef);
    const suppliers = supSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`📋 Loaded ${suppliers.length} existing suppliers.`);

    // 2. Scan Directories
    if (!fs.existsSync(INVOICE_ROOT)) {
        console.error(`❌ Invoice directory not found: ${INVOICE_ROOT}`);
        process.exit(1);
    }

    const vendorDirs = fs.readdirSync(INVOICE_ROOT, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    console.log(`📁 Found ${vendorDirs.length} vendor folders:`, vendorDirs);

    const invoicesToProcess = [];

    for (const vendor of vendorDirs) {
        const vendorPath = path.join(INVOICE_ROOT, vendor);
        const files = fs.readdirSync(vendorPath)
            .filter(f => f.match(/\.(jpg|jpeg|png|pdf)$/i));

        console.log(`   -> ${vendor}: ${files.length} potential invoices.`);

        // Find matching supplier ID
        const matchedSup = suppliers.find(s =>
            s.name.toLowerCase().includes(vendor.toLowerCase()) ||
            vendor.toLowerCase().includes(s.name.toLowerCase())
        );

        for (const file of files) {
            invoicesToProcess.push({
                filePath: path.join(vendorPath, file),
                fileName: file,
                vendorFolder: vendor,
                supplierId: matchedSup ? matchedSup.id : null,
                supplierName: matchedSup ? matchedSup.name : vendor // fallback
            });
        }
    }

    console.log(`\n============== PROCESSING ${invoicesToProcess.length} INVOICES ==============`);


    // Load existing progress if available
    const reportPath = path.join(process.cwd(), 'invoice_ingestion_report.json');
    let existingResults = [];
    if (fs.existsSync(reportPath)) {
        try {
            existingResults = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            console.log(`📋 Loaded ${existingResults.length} previously processed results.`);
        } catch (e) {
            console.warn("Could not read existing report, starting fresh.");
        }
    }


    const results = [];
    // Switching to gemini-pro-latest
    const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });

    let processedCount = 0;
    for (const inv of invoicesToProcess) {
        processedCount++;

        // Skip if already successfully processed (UNLESS we want to re-run for better data)
        // With new prompt, we WANT to re-process everything to get the richness.
        // So I'm commenting out the skip logic for now.
        /*
        const alreadyDone = existingResults.find(r => r.filePath === inv.filePath && r.status === 'Success');
        if (alreadyDone) {
            console.log(`[${processedCount}/${invoicesToProcess.length}] Skipping (Already Done): ${inv.vendorFolder} / ${inv.fileName}`);
            results.push(alreadyDone);
            continue;
        }
        */

        console.log(`[${processedCount}/${invoicesToProcess.length}] Analyzing (Detailed): ${inv.vendorFolder} / ${inv.fileName}...`);

        try {
            const fileBuffer = fs.readFileSync(inv.filePath);
            const base64Data = fileBuffer.toString('base64');
            const mimeType = inv.fileName.toLowerCase().endsWith('pdf') ? 'application/pdf' : 'image/jpeg';

            const prompt = `Analyze this wholesale purchase invoice line-by-line. 
            Extract structured data for every line item. Be precise.

            Fields to Extract:
            - product_code (e.g. 126583)
            - description (e.g. M&M PEANUT BAG PM £1.50)
            - pack_size (e.g. if column says "16 x 1" or "24 x 330ml", extract 16 or 24. If just "1", then 1).
            - quantity_cases (Number of cases purchased).
            - unit_rrp (Extract Price Mark if in text, e.g. "PM £1.50" -> 1.50).
            - line_total (Total price for this line excluding VAT).
            - vat_code (e.g. A, Z, 1, 0).

            Return JSON matching this schema exactly:
            {
              "date": "YYYY-MM-DD",
              "total": 0.00,
              "inv_num": "string",
              "items": [
                {
                  "code": "string",
                  "desc": "string",
                  "pack_size": 1,
                  "qty_cases": 1,
                  "rrp": 0.0,
                  "vat": "A",
                  "line_total": 0.0
                }
              ]
            }`;

            const result = await model.generateContent([
                prompt,
                { inlineData: { data: base64Data, mimeType } }
            ]);

            const text = result.response.text();
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanText);

            const resultEntry = {
                ...inv,
                extracted: data,
                status: 'Success'
            };
            results.push(resultEntry);
            existingResults = existingResults.filter(r => r.filePath !== inv.filePath); // Remove old entry
            existingResults.push(resultEntry); // Update local cache

            const itemCount = data.items ? data.items.length : 0;
            console.log(`   ✅ Extracted: £${data.total} | ${data.date} | ${itemCount} items (Detailed)`);

            // Save PROGRESS immediately
            fs.writeFileSync(reportPath, JSON.stringify(existingResults, null, 2));

        } catch (err) {
            console.error(`   ❌ Failed: ${err.message}`);
            // If quota error, we should probably wait longer, but for now just log it
            if (err.message.includes('429') || err.message.includes('Quota')) {
                const waitTime = 30000 + (Math.random() * 5000); // 30-35s
                console.log(`   ⏳ Quota hit! Waiting extra ${Math.round(waitTime / 1000)}s...`);
                await new Promise(r => setTimeout(r, waitTime));
                // Retry logic could occur here, but for now we just skip/fail this one.
                // Ideally we should decrement processedCount or retry the loop index.
                // But let's keep it simple: just wait and continue.
            }
            results.push({ ...inv, error: err.message, status: 'Failed' });
        }

        // Rate Limit Delay: 3s delay to respect 20 RPM limit (safe margin)
        console.log("   zzz Sleeping 3s...");
        await new Promise(r => setTimeout(r, 3000));
    }

    console.log(`\n✅ Analysis Complete. Report saved to: ${reportPath}`);
    console.log("Review this file. If correct, I will commit to Firestore.");
}

main().catch(err => console.error(err));
