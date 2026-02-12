import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function searchArticle() {
    const title = '历史的镜像：谁是现代中国版图的真正“定义者”？';
    console.log(`Searching for article: ${title}`);

    const { data, error } = await supabase
        .from('news_items')
        .select('*, source:news_sources(*)')
        .ilike('title', `%${title}%`);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No article found with that title.');

        // Search for any original articles
        console.log('Searching for any articles from "数位 Buffet"...');
        const { data: sources } = await supabase.from('news_sources').select('*').eq('name', '数位 Buffet');
        if (sources && sources.length > 0) {
            const sourceId = sources[0].id;
            const { data: items } = await supabase.from('news_items').select('*').eq('source_id', sourceId);
            console.log(`Found ${items?.length || 0} items for source "数位 Buffet" (ID: ${sourceId})`);
            if (items) {
                items.forEach(item => console.log(`- ${item.title} (ID: ${item.id})`));
            }
        } else {
            console.log('Source "数位 Buffet" not found.');
        }
    } else {
        data.forEach(item => {
            console.log(`Found item: ${item.title}`);
            console.log(`- ID: ${item.id}`);
            console.log(`- Source: ${item.source?.name} (ID: ${item.source_id})`);
            console.log(`- Content Type: ${item.content_type}`);
            console.log(`- Is Published: ${item.is_published}`);
        });
    }
}

searchArticle();
