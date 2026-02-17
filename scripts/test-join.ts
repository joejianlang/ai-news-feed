import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJoin() {
    console.log('Testing join: user_source_follows -> news_sources');

    const { data, error } = await supabase
        .from('user_source_follows')
        .select(`
            *,
            source:news_sources(*)
        `)
        .limit(1);

    if (error) {
        console.error('❌ Join failed:', error.message);
    } else {
        console.log('✅ Join worked:', data);
    }
}

checkJoin();
