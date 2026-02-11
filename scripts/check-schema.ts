import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
    const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching news_items:', error);
    } else {
        console.log('Columns in news_items:', Object.keys(data[0] || {}));
    }

    // Try to explicitly check for location column info
    const { data: columnInfo, error: colError } = await supabase.rpc('get_column_info', { table_name: 'news_items' }).catch(() => ({ data: null, error: 'RPC not found' }));
    console.log('Column info:', columnInfo || colError);
}

checkSchema();
