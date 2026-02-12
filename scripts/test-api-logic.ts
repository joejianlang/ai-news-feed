import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testApiLogic() {
    const sourceName = '数位 Buffet';
    const { data: existingSource } = await supabase
        .from('news_sources')
        .select('id')
        .eq('name', sourceName)
        .single();

    if (!existingSource) {
        console.log('Source not found');
        return;
    }

    const sourceId = existingSource.id;
    console.log('Source ID:', sourceId);

    const { data: articles, error } = await supabase
        .from('news_items')
        .select('*')
        .eq('source_id', sourceId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Articles found:', articles?.length);
        articles?.forEach(a => console.log(`- ${a.title}`));
    }
}

testApiLogic();
