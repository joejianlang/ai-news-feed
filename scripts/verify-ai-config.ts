import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAiConfig() {
    console.log('Verifying ai_config table contents...');

    const keysToCheck = [
        'filter_rules',
        'summary_requirements',
        'commentary_requirements',
        'commentary_length_article',
        'commentary_length_video',
        'commentary_length_deep_dive',
        'classification_categories',
        'classification_rules',
        'canadian_cities'
    ];

    for (const key of keysToCheck) {
        const { data, error } = await supabase
            .from('ai_config')
            .select('config_key, config_value')
            .eq('config_key', key)
            .single();

        if (error) {
            console.error(`[MISSING] Config '${key}': ${error.message}`);
        } else if (data) {
            console.log(`[OK] Config '${key}' found.`);
        } else {
            console.error(`[MISSING] Config '${key}' not found (no error, but no data).`);
        }
    }
}

verifyAiConfig();
