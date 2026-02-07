
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Setup client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
    console.log('🔍 Checking pipeline status...');

    // 1. Check fetch_status from system_settings
    const { data: statusData, error: statusError } = await supabase
        .from('system_settings')
        .select('value, updated_at')
        .eq('key', 'fetch_status')
        .maybeSingle();

    if (statusData) {
        const status = statusData.value;
        console.log('\n📅 Pipeline Last Run Status:');
        console.log(`- Updated At: ${new Date(statusData.updated_at).toLocaleString()}`);
        console.log(`- Is Running: ${status.is_running}`);
        console.log(`- Last Completed At: ${status.last_completed_at ? new Date(status.last_completed_at).toLocaleString() : 'N/A'}`);
        if (status.error) console.log(`- Error: ${status.error}`);
    } else {
        console.log('No fetch_status found.');
    }

    // 2. Check latest news item
    const { data: latestNews, error: newsError } = await supabase
        .from('news_items')
        .select('created_at, title, source_id (name)')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (latestNews) {
        console.log('\n📰 Latest News Item Created:');
        // @ts-ignore
        console.log(`- Time: ${new Date(latestNews.created_at).toLocaleString()}`);
        console.log(`- Title: ${latestNews.title}`);
        // @ts-ignore
        console.log(`- Source: ${latestNews.source_id?.name}`);
    }

    // 3. Check sources last fetched
    const { data: sources, error: sourceError } = await supabase
        .from('news_sources')
        .select('name, last_fetched_at')
        .order('last_fetched_at', { ascending: false })
        .limit(5);

    if (sources && sources.length > 0) {
        console.log('\n📡 Recent Source Fetches:');
        sources.forEach(s => {
            console.log(`- ${s.name}: ${s.last_fetched_at ? new Date(s.last_fetched_at).toLocaleString() : 'Never'}`);
        });
    }
}

checkStatus();
