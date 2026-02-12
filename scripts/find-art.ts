import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findArt() {
    const { data: sources } = await supabase.from('news_sources').select('*').eq('name', '数位 Buffet');
    console.log('Sources found with name "数位 Buffet":', sources?.length);
    sources?.forEach(s => console.log(`- ID: ${s.id}`));

    const { data: articles } = await supabase.from('news_items').select('id, title, source_id');
    const target = articles?.filter(a => a.title.includes('历史的镜像'));
    console.log('Target article found:', target);
}

findArt();
