
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple env loader
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
    console.error("No API Key found");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

const candidates = [
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash-8b",
    "gemini-flash-latest",
    "gemini-pro",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "gemini-1.5-pro-002"
];

async function testModels() {
    console.log("Testing Model Availability...");
    for (const modelName of candidates) {
        process.stdout.write(`Testing ${modelName.padEnd(25)} ... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            const response = await result.response;
            const text = response.text();
            console.log(`✅ SUCCESS`);
        } catch (error) {
            let msg = error.message;
            if (msg.includes("404")) msg = "404 Not Found";
            else if (msg.includes("429")) msg = "429 Quota Exceeded";
            console.log(`❌ FAILED (${msg.substring(0, 50)})`);
        }
    }
}

testModels();
