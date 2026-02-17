import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listFollows() {
    console.log('Listing all follows in user_source_follows');

    const { data, error } = await supabase
        .from('user_source_follows')
        .select(`
            *,
            user:users(username, email),
            source:news_sources(name)
        `);

    if (error) {
        console.error('Error fetching follows:', error.message);
    } else {
        console.log('Follows count:', data.length);
        console.log('Sample follows:', data.slice(0, 5));
    }
}

listFollows();
