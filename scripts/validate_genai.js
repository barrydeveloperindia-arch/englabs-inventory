
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Env Loader
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const env = {};
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2 && !line.startsWith('#')) {
                env[parts[0].trim()] = parts.slice(1).join('=').trim();
            }
        });
        return env;
    }
    return {};
}

const env = loadEnv();
const API_KEY = env.VITE_GOOGLE_GENAI_API_KEY;

if (!API_KEY) {
    console.error("❌ No API Key found in .env.local");
    process.exit(1);
}

console.log(`🔑 Testing with API Key: ${API_KEY.substring(0, 10)}...`);

const genAI = new GoogleGenerativeAI(API_KEY);

async function test() {
    console.log("\n🔍 1. Listing Available Models...");
    try {
        // There isn't a direct listModels on the main class in the generic SDK usually, 
        // but let's try a simple generation to probe availability if listModels isn't exposed conveniently in this version
        // Actually, for the node SDK, usually it's a separate manager or we just try models.

        // Let's brute-force check common patterns if we can't list.
        // Wait, current SDK usually has generic access.

        const modelsToTest = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-001",
            "gemini-1.5-pro",
            "gemini-pro"
        ];

        for (const modelName of modelsToTest) {
            console.log(`\nTesting Model: ${modelName}`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello, are you working?");
                const response = await result.response;
                console.log(`✅ SUCCESS: ${modelName} responded: ${response.text().substring(0, 20)}...`);
            } catch (e) {
                console.log(`❌ FAILED: ${modelName} - ${e.message}`);
                if (e.message.includes("404")) {
                    console.log("   (Model not found or not supported with this key/region)");
                }
            }
        }

    } catch (error) {
        console.error("Fatal Error during test:", error);
    }
}

test();
