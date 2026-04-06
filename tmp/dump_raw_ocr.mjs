import fs from 'fs';
import path from 'path';

async function ocrSpace(filePath) {
    const file = fs.readFileSync(filePath);
    const base64Data = file.toString('base64');
    let ext = path.extname(filePath).toLowerCase().replace('.', '');
    let mime = 'image/jpeg';
    if(ext === 'pdf') mime = 'application/pdf';
    else if(ext === 'png') mime = 'image/png';
    const dataUri = `data:${mime};base64,${base64Data}`;
    const formData = new URLSearchParams();
    formData.append('apikey', 'helloworld');
    formData.append('base64Image', dataUri);
    formData.append('isTable', 'true');
    const response = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: formData });
    const json = await response.json();
    return json?.ParsedResults?.[0]?.ParsedText || '';
}

const BASE_DIR = "G:\\Englabs Inventory 2026-27\\Purchased Invoice Details";

async function run() {
    const dirs = fs.readdirSync(BASE_DIR);
    let output = {};
    for(const d of dirs) {
        const full = path.join(BASE_DIR, d);
        if(!fs.statSync(full).isDirectory()) continue;
        const files = fs.readdirSync(full);
        for(const f of files) {
            if(f.match(/\.(pdf|jpe?g|png)$/i)) {
                console.log("OCRing", d, f);
                const txt = await ocrSpace(path.join(full, f));
                output[d] = txt;
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    }
    fs.writeFileSync('tmp/raw_ocr_dump.json', JSON.stringify(output, null, 2));
    console.log("Done");
}
run();
