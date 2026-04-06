import fs from 'fs';
import path from 'path';
import url from 'url';

const API_KEY = process.env.VITE_GOOGLE_GENAI_API_KEY;

const BASE_DIR = "G:\\Englabs Inventory 2026-27\\Purchased Invoice Details";

async function generateContent(base64Data, mimeType, prompt) {
    // We try gemini-1.5-flash on v1beta
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    const body = {
        contents: [{
            parts: [
                { text: prompt },
                { inlineData: { mimeType, data: base64Data } }
            ]
        }],
        generationConfig: {
            // responseMimeType: "application/json" // Sometimes breaking in basic fetch, let's just ask for JSON format in text
        }
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    
    const json = await response.json();
    if(json.error) {
        throw new Error(json.error.message);
    }
    
    const text = json.candidates[0].content.parts[0].text;
    const cleanJSON = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJSON);
}

async function scanVendor(dirName) {
    const dirPath = path.join(BASE_DIR, dirName);
    if (!fs.statSync(dirPath).isDirectory()) return null;

    let targetFile = null;
    function findFile(dir) {
        const items = fs.readdirSync(dir);
        for(const item of items) {
           const fullPath = path.join(dir, item);
           if(fs.statSync(fullPath).isDirectory()) {
               const res = findFile(fullPath);
               if(res) return res;
           } else {
               if(fullPath.match(/\.(pdf|jpe?g|png)$/i)) return fullPath;
           }
        }
        return null;
    }
    
    targetFile = findFile(dirPath);

    if (!targetFile) {
        return null;
    }

    console.log(`Analyzing: ${targetFile}...`);
    
    const fileBuffer = fs.readFileSync(targetFile);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = targetFile.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 
                     targetFile.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    
    const prompt = `Analyze this purchase invoice and extract BOTH the vendor details and the purchase record details.
Return PURE JSON adhering to this schema:
{
  "vendor": {
      "name": "string (The official company name of the supplier)",
      "contactName": "string",
      "phone": "string",
      "email": "string",
      "category": "string (Guess category e.g. Raw Materials, Operations, etc)",
      "address": "string",
      "gstin": "string"
  },
  "purchase": {
      "invoiceNumber": "string",
      "date": "YYYY-MM-DD",
      "amount": 0.00,
      "items": "string (Summary of items purchased)",
      "qty": 0
  }
}`;

    try {
        const data = await generateContent(base64Data, mimeType, prompt);
        if(!data.vendor.name) data.vendor.name = dirName;
        return data;
    } catch (e) {
        console.error(`Error scanning ${targetFile}:`, e.message);
        return null; // Don't return empty object, it breaks things downstream
    }
}

async function main() {
    const dirs = fs.readdirSync(BASE_DIR);
    const results = [];
    
    for (const dir of dirs) {
        if (dir.endsWith('.xlsx')) continue;
        const data = await scanVendor(dir);
        if (data && data.vendor) {
            results.push(data);
            await new Promise(r => setTimeout(r, 4000));
        }
    }
    
    console.log("\n--- Extraction Results ---");
    fs.writeFileSync('./tmp/scanned_full_data.json', JSON.stringify(results, null, 2));
    console.log("Saved to tmp/scanned_full_data.json");
}

main().catch(console.error);
