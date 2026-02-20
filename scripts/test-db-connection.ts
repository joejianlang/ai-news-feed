
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

console.log(`🔌 Testing connection to: ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        // Try to fetch categories to verify connection and read access
        const { data, error } = await supabase
            .from('categories')
            .select('count')
            .limit(1)
            .single();

        if (error) {
            // If categories table is empty .single() might fail with PGRST116, which is actually a success for connection
            if (error.code === 'PGRST116') {
                console.log('✅ Connection Sucessful! (Connected, but table might be empty)');
                return;
            }
            throw error;
        }

        console.log('✅ Connection Successful! Successfully queried database.');
    } catch (err: any) {
        console.error('❌ Connection Failed:', err.message);
        if (err.cause) console.error('Cause:', err.cause);
    }
}

testConnection();
