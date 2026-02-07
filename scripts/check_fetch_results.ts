
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkResults() {
    console.log('Checking fetch results...');

    // 1. Check status
    const { data: status } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'fetch_status')
        .single();

    console.log('\n--- Fetch Status ---');
    if (status) {
        console.log(JSON.stringify(status.value, null, 2));
        console.log('Last Updated:', new Date(status.updated_at).toLocaleString());
    } else {
        console.log('No status found.');
    }

    // 2. Check recent news items
    const { data: news, count } = await supabase
        .from('news_items')
        .select('id, title, created_at, source:news_sources(name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('\n--- Recent News Items ---');
    console.log(`Total News Items: ${count}`);
    if (news && news.length > 0) {
        news.forEach((item: any) => {
            console.log(`[${new Date(item.created_at).toLocaleString()}] [${item.source?.name}] ${item.title}`);
        });
    } else {
        console.log('No news items found.');
    }
}

checkResults();
