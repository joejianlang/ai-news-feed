
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Key');
    process.exit(1);
}

// simulate anon client (like the browser/API route causing error)
const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function debugNewsFetch() {
    console.log('🔍 Debugging News Fetch (Anon Client)...');
    console.log(`📡 URL: ${supabaseUrl}`);

    try {
        // 1. Try simple fetch without joins
        console.log('\n--- 1. Simple Fetch (news_items only) ---');
        const { data: simpleData, error: simpleError } = await supabase
            .from('news_items')
            .select('id, title')
            .limit(1);

        if (simpleError) {
            console.error('❌ Simple Fetch failed:', simpleError);
        } else {
            console.log(`✅ Simple Fetch success. Got ${simpleData?.length} items.`);
        }

        // 2. Try fetch with joins (like actual API)
        console.log('\n--- 2. Fetch with Joins (news_items + source + categories) ---');
        const { data: joinData, error: joinError } = await supabase
            .from('news_items')
            .select(`
        *,
        source:news_sources(*),
        categories(*)
      `)
            .limit(1);

        if (joinError) {
            console.error('❌ Join Fetch failed (THIS IS LIKELY THE BUG):');
            console.error(JSON.stringify(joinError, null, 2));
        } else {
            console.log(`✅ Join Fetch success. Got ${joinData?.length} items.`);
            if (joinData && joinData.length > 0) {
                console.log('Sample item source:', joinData[0].source);
                console.log('Sample item category:', joinData[0].categories);
            }
        }

    } catch (err: any) {
        console.error('❌ Unexpected error:', err.message);
    }
}

debugNewsFetch();
