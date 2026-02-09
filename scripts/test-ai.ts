
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local manually
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const env = fs.readFileSync(envPath, 'utf8');
        env.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                process.env[key] = value;
            }
        });
    }
}
loadEnv();

import { analyzeContentWithGemini } from '../lib/ai/gemini';

async function testAI() {
    console.log('--- Testing Gemini 2.0 Restoration ---');
    const content = "Vancouver city council has approved a new development plan for the Broadway corridor, which will include thousands of new housing units and enhanced transit access.";
    const title = "Vancouver Broadway Plan approved by council";
    const style = "专业、深度";

    try {
        const result = await analyzeContentWithGemini(content, title, style);
        console.log('SUCCESS:', JSON.stringify(result, null, 2));
    } catch (error: any) {
        console.error('FAILED:', error.message || error);
    }
}

testAI();
