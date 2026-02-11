
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- Pipeline Diagnosis ---');

    // 1. Check Categories
    const { data: categories, error: catError } = await supabase.from('categories').select('*');
    if (catError) {
        console.error('Error fetching categories:', catError);
    } else {
        console.log('Available Categories:', categories.map(c => c.name).join(', '));
    }

    // 2. Check News Item counts
    const { count: draftCount, error: draftErr } = await supabase
        .from('news_items')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', false);

    const { count: publishedCount, error: pubErr } = await supabase
        .from('news_items')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

    console.log(`Unpublished items: ${draftCount}`);
    console.log(`Published items: ${publishedCount}`);

    // 3. Check published items without category
    const { data: missingCat, error: missErr } = await supabase
        .from('news_items')
        .select('id, title, category_id, tags')
        .eq('is_published', true)
        .is('category_id', null)
        .limit(5);

    if (missErr) {
        console.error('Error fetching missing categories:', missErr);
    } else {
        console.log(`Published items without category: ${missingCat.length} (sample)`);
        missingCat.forEach(item => {
            console.log(`- ID: ${item.id}, Title: ${item.title}`);
        });
    }

    // 4. Check items with empty tags
    const { count: emptyTagsCount } = await supabase
        .from('news_items')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)
        .filter('tags', 'ov', '{}'); // Check if it matches empty array representation in Postgres (might vary by driver/Supabase)
    // Actually, let's just fetch a few and check manually

    const { data: tagCheck } = await supabase
        .from('news_items')
        .select('id, tags')
        .eq('is_published', true)
        .limit(10);

    const emptyTags = tagCheck?.filter(item => !item.tags || item.tags.length === 0);
    console.log(`Sample of published items with empty/null tags: ${emptyTags?.length || 0}/10`);
}

diagnose();
