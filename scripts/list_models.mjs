import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });

// Explicitly use the key provided by the user if dotenv fails
const API_KEY = process.env.VITE_GOOGLE_GENAI_API_KEY;

if (!API_KEY) {
    console.error("❌ No API Key found!");
    process.exit(1);
}

console.log(`🔑 Using API Key: ${API_KEY.substring(0, 10)}...`);

async function listModels() {
    const genAI = new GoogleGenerativeAI(API_KEY);

    // Note: The Node.js SDK doesn't have a direct 'listModels' method on the client instance in some versions.
    // It is usually available via the API directly or through a model manager if exposed.
    // However, let's try to just hit a model and see errors, OR use a raw fetch.

    // The google-generative-ai package simplifies this, but 'listModels' is not always exposed on the top level class directly.
    // Let's use a raw fetch to the REST API to be absolutely sure what "list models" returns.

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        console.log("🌐 Fetching models list from Google API...");
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("❌ API Error:", JSON.stringify(data.error, null, 2));
        } else {
            console.log("✅ Available Models:");
            if (data.models) {
                data.models.forEach(m => {
                    console.log(`   - ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
                });
            } else {
                console.log("   (No models returned)");
            }
        }
    } catch (err) {
        console.error("❌ Network Error:", err);
    }
}

listModels();
