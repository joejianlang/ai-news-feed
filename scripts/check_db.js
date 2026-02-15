const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAds() {
    console.log('--- Checking Ads Table ---');
    const { data: ads, error } = await supabase
        .from('ads')
        .select('id, title, status, payment_status, payment_method, payment_voucher_url, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching ads:', error);
        return;
    }

    if (ads.length === 0) {
        console.log('No ads found in the table.');
    } else {
        ads.forEach(ad => {
            console.log(`ID: ${ad.id} | Title: ${ad.title} | Status: ${ad.status} | PayMethod: ${ad.payment_method} | Voucher: ${ad.payment_voucher_url}`);
        });
    }

    console.log('\n--- Checking Users Table (Latest 5) ---');
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email, username')
        .limit(5);

    if (userError) {
        console.error('Error fetching users:', userError);
    } else {
        users.forEach(u => {
            console.log(`User ID: ${u.id} | Email: ${u.email} | Name: ${u.username}`);
        });
    }
}

checkAds();
