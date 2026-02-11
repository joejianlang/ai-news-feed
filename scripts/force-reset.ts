import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function forceReset() {
    console.log('Force resetting fetch status...');
    const { data, error } = await supabase
        .from('system_settings')
        .upsert({
            key: 'fetch_status',
            value: { is_running: false, progress: 0, total: 0, message: '已手动重置' },
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

    if (error) {
        console.error('Reset failed:', error);
    } else {
        console.log('Reset success!');
    }
}

forceReset();
