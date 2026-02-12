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

async function checkSchema() {
    console.log('Checking columns for news_items...');

    // We can use a RPC call or just try to select one item
    const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching data:', error);
    } else if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
        if ('is_pinned' in data[0]) {
            console.log('✅ is_pinned column exists');
        } else {
            console.log('❌ is_pinned column is MISSING');
        }
    } else {
        console.log('No data in news_items to check schema.');
        // Try to get column info from information_schema if possible
        const { data: cols, error: colError } = await supabase
            .rpc('get_column_names', { table_name: 'news_items' }); // This might not exist

        if (colError) {
            console.log('Trying alternative schema check...');
            const { data: testData, error: testError } = await supabase
                .from('news_items')
                .select('is_pinned')
                .limit(1);

            if (testError) {
                console.error('❌ is_pinned column check failed:', testError.message);
            } else {
                console.log('✅ is_pinned column exists (test select passed)');
            }
        }
    }
}

checkSchema();
