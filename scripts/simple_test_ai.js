
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

if (!API_KEY) { console.error("No API Key"); process.exit(1); }

const genAI = new GoogleGenerativeAI(API_KEY);

const models = ["gemini-pro"];

async function test() {
    for (const m of models) {
        console.log(`Testing ${m}...`);
        try {
            const model = genAI.getGenerativeModel({ model: m });
            await model.generateContent("Test");
            console.log(`SUCCESS: ${m}`);
        } catch (e) {
            console.log(`FAIL: ${m}`);
            console.log(e.message);
            if (e.response) {
                console.log("Status:", e.response.status);
            }
        }
    }
}
test();
