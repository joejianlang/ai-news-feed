
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetStatus() {
    console.log('Resetting fetch status...');

    const status = {
        is_running: false,
        started_at: null,
        current_source: 'Waiting to start...',
        progress: 0,
        total: 0
    };

    const { error } = await supabase
        .from('system_settings')
        .upsert({
            key: 'fetch_status',
            value: status,
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

    if (error) {
        console.error('Failed to reset status:', error);
    } else {
        console.log('Status reset successfully!');
    }
}

resetStatus();
