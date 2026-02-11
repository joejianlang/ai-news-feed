import { supabase } from './lib/supabase/client.ts';

async function checkItem() {
    const id = 'fdd862f2-2277-4d2d-a4b5-e8e5d2f04361';
    const { data, error } = await supabase
        .from('news_items')
        .select('*, source:news_sources(*)')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching item:', error);
        return;
    }

    console.log('Item Details:', JSON.stringify(data, null, 2));
}

checkItem();
