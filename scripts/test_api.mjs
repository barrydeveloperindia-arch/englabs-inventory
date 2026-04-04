import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const apiKey = process.env.VITE_GOOGLE_GENAI_API_KEY;

if (!apiKey) {
    console.error("❌ No API Key found in env vars!");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function test() {
    console.log("Testing Gemini API...");
    try {
        const result = await model.generateContent("Hello, are you active?");
        console.log("✅ API Success! Response:", result.response.text());
    } catch (error) {
        console.error("❌ API Failed:", error.message);
    }
}

test();
