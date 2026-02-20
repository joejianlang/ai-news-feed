
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkColumns() {
    console.log('🔍 Checking columns of news_items table...');

    // Try to select 'tags' specifically
    const { data, error } = await supabase
        .from('news_items')
        .select('id, tags')
        .limit(1);

    if (error) {
        console.error('❌ Check failed:', error.message);
        if (error.message.includes('does not exist')) {
            console.error('👉 CONFIRMED: "tags" column is missing!');
        }
    } else {
        console.log('✅ "tags" column exists.');
    }
}

checkColumns();
