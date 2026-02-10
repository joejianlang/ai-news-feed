
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function countAll() {
    const { count, error } = await supabase
        .from('news_items')
        .select('*', { count: 'exact', head: true });

    console.log(`Total news items in DB: ${count}`);
}

countAll();
