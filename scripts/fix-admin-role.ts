
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const TARGET_EMAIL = 'joelyan00@gmail.com';

async function checkAndFixAdminRole() {
    console.log(`🔍 Checking role for user: ${TARGET_EMAIL}`);

    try {
        // 1. Get User ID from auth.users (optional, but good for verification) or directly query public.users
        // Since we are using service_role key, we can query public.users directly filtering by email if we synced it, 
        // or we might need to find the user in auth.users first if public.users doesn't verify email uniqueness/linkage strictly in code.
        // However, our verify script showed public.users has 'username'. Let's check public.users first.

        // Note: older scripts inserted into public.users. 
        // Let's first search in public.users
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', TARGET_EMAIL)
            .single();

        if (error) {
            console.error(`❌ Error finding user in public.users: ${error.message}`);
            // If not found in public.users, maybe they are in auth.users but trigger didn't run or email mismatches?
            return;
        }

        if (!user) {
            console.log('❌ User not found in public.users table.');
            return;
        }

        console.log(`👤 User Found: ID=${user.id}`);
        console.log(`   Current Role: ${user.role}`);
        console.log(`   Username: ${user.username}`);

        if (user.role !== 'admin') {
            console.log('⚠️ Role is not admin. Updating to admin...');
            const { error: updateError } = await supabase
                .from('users')
                .update({ role: 'admin' })
                .eq('id', user.id);

            if (updateError) {
                console.error(`❌ Failed to update role: ${updateError.message}`);
            } else {
                console.log('✅ Successfully updated role to ADMIN. Please refresh the page.');
            }
        } else {
            console.log('✅ User is already an ADMIN.');
        }

    } catch (err: any) {
        console.error('❌ Unexpected error:', err.message);
    }
}

checkAndFixAdminRole();
