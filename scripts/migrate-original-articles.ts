import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateArticles() {
    console.log('Fetching sources...');
    const { data: sources } = await supabase.from('news_sources').select('*').in('name', ['原创文章', '数位 Buffet']);

    console.log('Sources found:', sources);

    const oldSource = sources?.find(s => s.name === '原创文章');
    const newSource = sources?.find(s => s.name === '数位 Buffet');

    if (oldSource && newSource) {
        console.log(`Migrating articles from "${oldSource.name}" (${oldSource.id}) to "${newSource.name}" (${newSource.id})...`);

        const { data, error } = await supabase
            .from('news_items')
            .update({ source_id: newSource.id })
            .eq('source_id', oldSource.id)
            .select();

        if (error) {
            console.error('Migration failed:', error);
        } else {
            console.log(`Successfully migrated ${data?.length || 0} articles.`);

            // Optionally delete the old source if empty
            const { data: remnant } = await supabase.from('news_items').select('id').eq('source_id', oldSource.id);
            if (!remnant || remnant.length === 0) {
                console.log('Old source is now empty. Deleting it...');
                await supabase.from('news_sources').delete().eq('id', oldSource.id);
            }
        }
    } else {
        console.log('Could not find both old and new sources. No migration needed or possible.');
    }
}

migrateArticles();
