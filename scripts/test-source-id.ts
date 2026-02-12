import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSource() {
    const sourceName = '数位 Buffet';
    const { data: existingSource, error } = await supabase
        .from('news_sources')
        .select('id, name')
        .eq('name', sourceName)
        .single();

    console.log('Result:', existingSource);
    console.log('Error:', error);
}

testSource();
