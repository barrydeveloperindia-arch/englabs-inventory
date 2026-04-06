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
    
    const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData
    });
    
    const json = await response.json();
    return json;
}

async function test() {
    const file = "G:\\Englabs Inventory 2026-27\\Purchased Invoice Details\\FIXPRO ENGINEERING\\APRIL_2026\\04-04-2026.pdf";
    try {
        const res = await ocrSpace(file);
        if(res.ParsedResults && res.ParsedResults[0]) {
            console.log(res.ParsedResults[0].ParsedText);
        } else {
            console.log(JSON.stringify(res, null, 2));
        }
    } catch(e) { console.error(e); }
}
test();
