import { config } from 'dotenv';
import path from 'path';
config({ path: '.env.local' });

async function runMigration() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('❌ Missing environment variables');
        return;
    }

    const sql = `ALTER TABLE public.news_items ADD COLUMN IF NOT EXISTS author_name TEXT;`;

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ query: sql }),
        });

        if (response.ok) {
            console.log('✅ Migration successful: author_name column added.');
        } else {
            const error = await response.text();
            console.error('❌ Migration failed:', response.status, error);
            console.log('Please run the following SQL manually in Supabase Dashboard:');
            console.log(sql);
        }
    } catch (error) {
        console.error('❌ Error running migration:', error);
    }
}

runMigration();
