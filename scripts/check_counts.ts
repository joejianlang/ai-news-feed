
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCounts() {
    console.log('Checking row counts...');

    const { count: sourceCount, error: sourceError } = await supabase
        .from('news_sources')
        .select('*', { count: 'exact', head: true });

    if (sourceError) console.error('Error checking sources:', sourceError.message);
    else console.log(`News Sources Count: ${sourceCount}`);

    const { count: itemCount, error: itemError } = await supabase
        .from('news_items')
        .select('*', { count: 'exact', head: true });

    if (itemError) console.error('Error checking items:', itemError.message);
    else console.log(`News Items Count: ${itemCount}`);
}

checkCounts();
