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

async function listTables() {
    console.log('Listing all tables in public schema...');

    // We can't easily query information_schema with the JS client usually due to permissions,
    // but we can try rpc if available. If not, we can try to select from known tables to see if they exist.
    // Actually, let's try to query a non-existent table to see if we get a specific error, 
    // or better, just try to select 1 from all potential tables we suspect might be missing.

    const potentialTables = [
        'users',
        'categories',
        'news_sources',
        'news_items',
        'user_source_follows',
        'services',
        'service_categories',
        'ads',
        'comments',
        'comment_likes',
        'verification_codes',
        'user_addresses',
        'user_payment_methods',
        'system_settings',
        'ai_config',
        'forum_posts',
        'forum_comments',
        'post_likes',
        'forum_comment_likes',
        'user_follows',
        'recommended_sources',
        'search_logs',
        'fetch_logs'
    ];

    // Check tables existence
    for (const table of potentialTables) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error) {
            console.log(`[MISSING or Error] Table '${table}': ${error.message}`);
        } else {
            console.log(`[EXISTS] Table '${table}'`);
        }
    }

    // Verify critical columns in news_items
    console.log('\nVerifying critical columns in news_items...');
    const criticalColumns = ['video_id', 'image_url', 'fetch_batch_id', 'tags', 'location', 'ai_summary'];
    const { data: newsItem, error: newsError } = await supabase.from('news_items').select('*').limit(1);

    if (newsError) {
        console.error('Error fetching news_items:', newsError.message);
    } else {
        // Even if no rows, we can't easily check columns without rows or admin API in JS client.
        // But if rows exist, we can check keys. If no rows, we rely on the migration script execution.
        // Actually, we can just try to select the specific columns!
        const { error: colError } = await supabase.from('news_items').select(criticalColumns.join(',')).limit(1);
        if (colError) {
            console.error(`[MISSING COLUMNS] news_items structure might be incomplete: ${colError.message}`);
        } else {
            console.log(`[OK] news_items contains all critical new columns (${criticalColumns.join(', ')})`);
        }
    }

    // Verify critical columns in ads
    console.log('\nVerifying critical columns in ads...');
    const adsColumns = ['raw_content', 'contact_info', 'target_city', 'target_province', 'price_total', 'payment_method', 'payment_voucher_url', 'rejection_reason'];
    const { error: adsColError } = await supabase.from('ads').select(adsColumns.join(',')).limit(1);
    if (adsColError) {
        console.error(`[MISSING COLUMNS] ads structure might be incomplete: ${adsColError.message}`);
    } else {
        console.log(`[OK] ads contains all critical new columns (${adsColumns.join(', ')})`);
    }

    // Verify critical columns in news_sources
    console.log('\nVerifying critical columns in news_sources...');
    const sourcesColumns = ['test_status', 'test_result', 'tested_at', 'commentary_style', 'description', 'language', 'country', 'logo_url'];
    const { error: sourcesColError } = await supabase.from('news_sources').select(sourcesColumns.join(',')).limit(1);
    if (sourcesColError) {
        console.error(`[MISSING COLUMNS] news_sources structure might be incomplete: ${sourcesColError.message}`);
    } else {
        console.log(`[OK] news_sources contains all critical new columns (${sourcesColumns.join(', ')})`);
    }

    // Verify critical columns in users
    console.log('\nVerifying critical columns in users...');
    const usersColumns = ['real_name', 'id_card_number', 'id_card_scan_url', 'is_verified', 'phone_verified'];
    const { error: usersColError } = await supabase.from('users').select(usersColumns.join(',')).limit(1);
    if (usersColError) {
        console.error(`[MISSING COLUMNS] users structure might be incomplete: ${usersColError.message}`);
    } else {
        console.log(`[OK] users contains all critical new columns (${usersColumns.join(', ')})`);
    }
}

listTables();
