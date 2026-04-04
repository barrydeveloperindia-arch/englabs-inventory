import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

// 1. Get Key
const API_KEY = process.env.VITE_GOOGLE_GENAI_API_KEY;

if (!API_KEY) {
    console.error("❌ No API Key found!");
    process.exit(1);
}

// 2. Fetch Models
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function main() {
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("---------- AVAILABLE MODELS ----------");
            data.models.forEach(m => {
                // Filter for generateContent support
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(m.name.replace("models/", ""));
                }
            });
            console.log("--------------------------------------");
        } else {
            console.log("❌ No models found or error:", JSON.stringify(data));
        }
    } catch (err) {
        console.error("❌ Fetch failed:", err);
    }
}
main();
