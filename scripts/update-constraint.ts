import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateConstraint() {
    const { error } = await supabase.rpc('exec_sql', {
        sql_query: `
      ALTER TABLE news_sources DROP CONSTRAINT IF EXISTS news_sources_source_type_check;
      ALTER TABLE news_sources ADD CONSTRAINT news_sources_source_type_check 
      CHECK (source_type IN ('web', 'youtube', 'youtube_channel', 'rss', 'youtube_trending'));
    `
    });

    if (error) {
        console.error('Error updating constraint:', error);
        console.log('Falling back to direct SQL execution might be needed if exec_sql is not available.');
    } else {
        console.log('Successfully updated source_type constraint.');
    }
}

updateConstraint();
