import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

// Explicit key for debug
const API_KEY = "AIzaSyC74uEjoa6j1-tgdOZhCKN1DZeUjBe9eXk";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

async function scan() {
    console.log("Testing with gemini-1.5-pro...");
    const path = "G:\\Englabs Inventory 2026-27\\Purchased Invoice Details\\FIXPRO ENGINEERING\\APRIL_2026\\04-04-2026.pdf";
    console.log("Reading: " + path);
    const data = fs.readFileSync(path);
    const result = await model.generateContent([
        "Extract total and supplier as JSON: { supplier: '', total: 0 }",
        { inlineData: { data: data.toString('base64'), mimeType: 'application/pdf' } }
    ]);
    console.log(result.response.text());
}
scan().catch(e => console.error(e.message));
