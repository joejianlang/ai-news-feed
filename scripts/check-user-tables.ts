import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    const tables = ['services', 'user_addresses', 'user_payment_methods'];
    console.log('Checking tables:', tables.join(', '));

    for (const table of tables) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

        if (error) {
            console.log(`❌ Table '${table}' check failed or doesn't exist:`, error.message);
        } else {
            console.log(`✅ Table '${table}' exists. Columns:`, data.length > 0 ? Object.keys(data[0]) : 'no data to check columns');
        }
    }
}

checkTables();
