import fs from 'fs';
import path from 'path';
import 'dotenv/config';

import url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

const API_KEY = process.env.VITE_GOOGLE_GENAI_API_KEY;

async function list() {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await res.json();
    console.log(data.models.map(m => m.name).join("\n"));
}
list();
