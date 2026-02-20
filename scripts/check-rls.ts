
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkRLS() {
    console.log('🔍 Checking RLS on public.users...');

    // Check if RLS is enabled
    const { data: rlsStatus, error: rlsError } = await supabase.rpc('check_rls_enabled', { table_name: 'users' });
    // Since we don't have a convenient RPC for this usually, we might need to plain SQL or just try to select as ANON.

    // Let's try to select as ANON (simulating frontend)
    const anonClient = createClient(supabaseUrl!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    // We need a user session to test properly, but let's see if we can read ANY user without session (if public).
    // Or just check pg_policies via SQL injection if we can? No.

    // Let's use the service role to inspect system catalogs?
    // Supabase JS client doesn't support raw SQL query directly unless via RPC.

    // Alternative: Try to select a user using existing `getUserById` logic's equivalent.
    // We know the user ID from previous step: f150b841-0e95-48c7-bf64-f3aaf9be1ef2
    const userId = 'f150b841-0e95-48c7-bf64-f3aaf9be1ef2';

    const { data, error } = await anonClient
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('❌ Anon client read failed:', error.message);
        if (error.message.includes('row-level security')) {
            console.error('   -> RLS is preventing read access.');
        }
    } else {
        console.log('✅ Anon client read success:', data);
    }

}

checkRLS();
