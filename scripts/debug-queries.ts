
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testGetNewsItemsByBatch() {
    console.log('Testing getNewsItemsByBatch...');
    try {
        // 模拟 queries.ts 中的查询逻辑，但不依赖 queries.ts 文件本身（避免依赖复杂的 client 配置）
        // 或者我们可以直接 import，但这需要 client.ts 能在 node 环境下工作（它依赖 process.env，应该可以）
        // 为了隔离，我直接复制查询逻辑并使用 admin client

        const { data, error } = await supabase
            .from('news_items')
            .select(`
          *,
          source:news_sources(*),
          categories(*)
        `)
            .eq('is_published', true)
            .limit(10);

        if (error) {
            console.error('getNewsItemsByBatch Query Error:', error);
        } else {
            console.log('getNewsItemsByBatch Success. Count:', data?.length);
            if (data && data.length > 0) {
                console.log('Sample item:', JSON.stringify(data[0], null, 2));
            }
        }
    } catch (err) {
        console.error('getNewsItemsByBatch Exception:', err);
    }
}

async function testGetUserProfile() {
    console.log('Testing getUserProfile (admin login simulation)...');
    try {
        const email = 'fongbeead@gmail.com';
        // First get ID
        const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
        if (!user) {
            console.error('User not found for ' + email);
            return;
        }

        console.log('User ID:', user.id);

        // Now test the exact query from /api/auth/me
        const { data: profile, error } = await supabase
            .from('users')
            .select('id, email, username, role, created_at, updated_at')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('getUserProfile Query Error:', error);
        } else {
            console.log('getUserProfile Success:', profile);
        }

    } catch (err) {
        console.error('getUserProfile Exception:', err);
    }
}

async function run() {
    await testGetUserProfile();
    await testGetNewsItemsByBatch();
}

run();
