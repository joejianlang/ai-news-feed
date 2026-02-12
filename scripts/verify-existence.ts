import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listAll() {
    const { data, count } = await supabase.from('news_items').select('id, title, source_id', { count: 'exact' });
    console.log('Total items:', count);
    data?.slice(0, 10).forEach(item => console.log(`- ${item.title} (Source: ${item.source_id})`));

    const target = data?.find(item => item.title.includes('历史的镜像'));
    console.log('Target item:', target);
}

listAll();
