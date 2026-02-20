import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectSchema() {
    console.log('Inspecting public.users table schema...');

    // Query to get column names from information_schema
    // Note: Supabase JS client doesn't support querying information_schema directly via .from() easily usually due to permissions, 
    // but we can try rpc if available or just try to select * limit 1 and see keys.
    // Actually, selecting * limit 1 is a good proxy to see returned keys, but won't show null-valued columns if the object omits them (though JSON usually keeps them if select is explicit, but strictly `select *` might).
    // Better approach: Since we are admin, we can hopefully use a raw query if we had a sql function, but we don't.
    // Let's try to fetch one user and see what keys comes back, AND try a specific select of the 'missing' columns to see if it errors.

    try {
        // 1. Try selecting the specific columns we are worried about.
        const columnsToCheck = [
            'id', 'username', 'email',
            'is_suspended', 'is_muted',
            'bio', 'display_name', 'phone',
            'avatar_url', 'role',
            'real_name', 'id_card_number', 'id_card_scan_url', 'is_verified', 'phone_verified'
        ];

        const { data, error } = await supabase
            .from('users')
            .select(columnsToCheck.join(','))
            .limit(1);

        if (error) {
            console.error('Error selecting specific columns:', error.message);
            console.log('This confirms that some columns are MISSING.');
        } else {
            console.log('Successfully selected all specific columns! This implies they EXIST.');
            if (data && data.length > 0) {
                console.log('Sample Row Keys:', Object.keys(data[0]));
            } else {
                console.log('No users found, but query syntax was valid.');
            }
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

inspectSchema();
