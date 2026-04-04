
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const API_KEY = process.env.VITE_GOOGLE_GENAI_API_KEY;

async function listModels() {
    if (!API_KEY) {
        console.error("No API Key found.");
        return;
    }
    const genAI = new GoogleGenerativeAI(API_KEY);
    try {
        // There isn't a direct listModels method on the client instance in some versions, 
        // but let's try a direct fetch if the SDK doesn't expose it easily, 
        // or just try a simple generation with 'gemini-pro' (1.0) again which is usually standard.
        // Actually, recent SDK versions do not expose listModels directly.
        // Let's rely on a basic probe.

        console.log("Probing gemini-1.5-flash...");
        const modelFlash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        await modelFlash.generateContent("Test");
        console.log("✅ gemini-1.5-flash is AVAILABLE.");
        process.exit(0);
    } catch (e) {
        console.error("❌ gemini-1.5-flash failed:", e.message);
    }

    try {
        console.log("Probing gemini-pro...");
        const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
        await modelPro.generateContent("Test");
        console.log("✅ gemini-pro is AVAILABLE.");
    } catch (e) {
        console.error("❌ gemini-pro failed:", e.message);
    }
}

listModels();
