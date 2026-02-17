import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFollowsTable() {
    console.log('Checking table: user_source_follows');

    const { data, error } = await supabase
        .from('user_source_follows')
        .select('*')
        .limit(1);

    if (error) {
        console.log(`❌ Table 'user_source_follows' check failed:`, error.message);
    } else {
        console.log(`✅ Table 'user_source_follows' exists. Columns:`, data.length > 0 ? Object.keys(data[0]) : 'no data');
    }

    // Check news_sources table as well
    const { data: sources, error: sourceError } = await supabase
        .from('news_sources')
        .select('*')
        .limit(1);

    if (sourceError) {
        console.log(`❌ Table 'news_sources' check failed:`, sourceError.message);
    } else {
        console.log(`✅ Table 'news_sources' exists. Columns:`, sources.length > 0 ? Object.keys(sources[0]) : 'no data');
    }
}

checkFollowsTable();
