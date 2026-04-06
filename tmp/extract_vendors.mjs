import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// The Vite environment variables are already in .env
import url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
if(fs.existsSync(envPath)){
  import('dotenv').then(dotenv => dotenv.config({path: envPath}));
}

const API_KEY = process.env.VITE_GOOGLE_GENAI_API_KEY;
if (!API_KEY) {
    console.error("Missing API key!");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp", generationConfig: { responseMimeType: "application/json" } });

const BASE_DIR = "G:\\Englabs Inventory 2026-27\\Purchased Invoice Details";

async function scanVendor(dirName) {
    const dirPath = path.join(BASE_DIR, dirName);
    if (!fs.statSync(dirPath).isDirectory()) return null;

    const files = fs.readdirSync(dirPath).filter(f => f.match(/\.(pdf|jpe?g|png)$/i));
    if (files.length === 0) {
        return { name: dirName, category: "General Wholesale" };
    }

    const filePath = path.join(dirPath, files[0]);
    console.log(`Analyzing: ${filePath}...`);
    
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = filePath.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 
                     filePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    
    const prompt = `
    Analyze this purchase invoice. Extract the supplier/vendor contact and business details to populate a vendor registry.
    Return pure JSON with the exact spelling as seen on the document. If a field is not found, leave it blank ("").
    {
      "name": "string",
      "contactName": "string",
      "phone": "string",
      "email": "string",
      "category": "string (guess based on items: e.g. Raw Materials, Operations, Stationery, Hardware, Services, etc)",
      "address": "string",
      "gstin": "string"
    }`;

    try {
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType } }
        ]);
        const text = result.response.text();
        const data = JSON.parse(text);
        if(!data.name) data.name = dirName;
        return data;
    } catch (e) {
        console.error(`Error scanning ${filePath}:`, e.message);
        return { name: dirName, category: "General Wholesale" };
    }
}

async function main() {
    const dirs = fs.readdirSync(BASE_DIR);
    const results = [];
    
    for (const dir of dirs) {
        if (dir.endsWith('.xlsx')) continue;
        const data = await scanVendor(dir);
        if (data) {
            results.push(data);
            // Throttle to avoid rate limits
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    
    console.log("\n--- Extraction Results ---");
    console.log(JSON.stringify(results, null, 2));
    fs.writeFileSync('./tmp/scanned_vendors.json', JSON.stringify(results, null, 2));
    console.log("Saved to tmp/scanned_vendors.json");
}

main().catch(console.error);
