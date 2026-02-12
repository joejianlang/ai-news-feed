import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSources() {
    const { data: sources } = await supabase.from('news_sources').select('id, name');

    if (sources) {
        for (const source of sources) {
            const { count } = await supabase
                .from('news_items')
                .select('*', { count: 'exact', head: true })
                .eq('source_id', source.id);

            if (count && count > 0) {
                console.log(`Source: ${source.name} (ID: ${source.id}) - Items: ${count}`);
            }
        }
    }
}

inspectSources();
