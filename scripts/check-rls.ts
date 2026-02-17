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

async function checkRLS() {
    console.log('Checking RLS policies for user_source_follows');

    const { data, error } = await supabase.rpc('get_policies', { table_name: 'user_source_follows' });

    if (error) {
        // If the RPC doesn't exist, we can try to query pg_policies directly
        console.log('RPC get_policies failed, try direct SQL query');
        const { data: sqlData, error: sqlError } = await supabase.from('pg_policies').select('*').eq('tablename', 'user_source_follows');
        if (sqlError) {
            // pg_policies is usually not accessible via API without specific setup
            console.log('Direct SQL also failed. Let\'s try to check if RLS is enabled on the table first.');

            // Check if RLS is enabled
            const { data: rlsCheck, error: rlsError } = await supabase.rpc('check_rls_enabled', { table_name: 'user_source_follows' });
            if (rlsError) {
                console.log('Could not check RLS status via RPC. Will just list table content with anon key to see if hidden.');
            }
        } else {
            console.log('Policies:', sqlData);
        }
    } else {
        console.log('Policies:', data);
    }

    // Test with anon key
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anonKey) {
        const anonSupabase = createClient(supabaseUrl!, anonKey);
        const { data: anonData, error: anonError } = await anonSupabase.from('user_source_follows').select('*').limit(1);
        if (anonError) {
            console.log('❌ Anon access failed:', anonError.message);
        } else {
            console.log('✅ Anon access worked (either RLS is off or policies are working).');
        }
    }
}

checkRLS();
