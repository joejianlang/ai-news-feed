import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanup() {
    console.log('Checking for stuck batches...');
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // Find them first to log
    const { data: stuckBatches } = await supabase
        .from('fetch_logs')
        .select('id, started_at')
        .eq('status', 'running')
        .lt('started_at', thirtyMinutesAgo);

    if (stuckBatches && stuckBatches.length > 0) {
        console.log(`Found ${stuckBatches.length} stuck batches. Fixing...`);
        const { error } = await supabase
            .from('fetch_logs')
            .update({
                status: 'failed',
                failure_reasons: { error: 'Process timed out or was interrupted (Automated Cleanup)' },
                completed_at: new Date().toISOString()
            })
            .in('id', stuckBatches.map(b => b.id));

        if (error) {
            console.error('Error during update:', error.message);
        } else {
            console.log('Successfully marked stuck batches as failed.');
        }
    } else {
        console.log('No stuck batches found.');
    }

    // Also reset system_settings fetch_status if needed
    const { data: systemStatus } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'fetch_status')
        .single();

    if (systemStatus?.value?.is_running) {
        console.log('System fetch status is still marked as running. Resetting...');
        await supabase
            .from('system_settings')
            .update({
                value: { ...systemStatus.value, is_running: false, error: 'Reset due to timeout' }
            })
            .eq('key', 'fetch_status');
    }
}

cleanup().catch(console.error);
