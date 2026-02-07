
// This script is designed to be run by GitHub Actions or cron jobs
// It executes the full news pipeline: Fetch -> Classify -> Deep Dive

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local if present (for local testing)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Explicitly check for required env vars
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY'];
const missingVars = requiredEnvVars.filter(key => !process.env[key] && !process.env[`NEXT_PUBLIC_${key}`]);

if (missingVars.length > 0) {
    console.error(`❌ ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
    // Check if we are in CI, if so, maybe secrets are not mapped correctly
    if (process.env.CI) {
        console.error('Make sure these secrets are set in your GitHub Repository Secrets.');
    }
    process.exit(1);
}

// Dynamic import services AFTER env vars are loaded to prevent early initialization issues
async function main() {
    console.log('🚀 Starting Automated News Pipeline...');
    const startTime = Date.now();

    try {
        // Import services dynamically
        // @ts-ignore
        const { runFetchPipeline } = await import('../lib/services/fetch_service');
        // @ts-ignore
        const { runClassificationPipeline } = await import('../lib/services/classify');
        // @ts-ignore
        const { runDeepDivePipeline } = await import('../lib/services/deep_dive');

        // 1. Fetch
        console.log('\n📡 STEP 1: Fetching News Sources...');
        const fetchResult = await runFetchPipeline();
        console.log('✅ Fetch Complete:', fetchResult);

        // 2. Classify
        console.log('\n🏷️ STEP 2: Classifying News...');
        const classifyResult = await runClassificationPipeline();
        console.log('✅ Classification Complete:', classifyResult);

        // 3. Deep Dive
        console.log('\n🧠 STEP 3: Deep Dive Analysis...');
        await runDeepDivePipeline(); // Deep dive returns void currently, logs internally
        console.log('✅ Deep Dive Complete');

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n✨ Pipeline Completed Successfully in ${duration}s`);
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Pipeline Failed:', error);
        process.exit(1);
    }
}

main();
