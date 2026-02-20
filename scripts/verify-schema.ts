
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

console.log('--- 全面验证数据库 Schema (Comprehensive Schema Verification) ---');
console.log(`📡 URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
    try {
        // 1. 验证 ads 表字段
        console.log('\n🔍 正在检查 ads 表...');
        // 尝试插入并立即删除一条带 start_date 的数据，或者查询
        // 由于 PostgREST 不直接暴露 schema info，我们尝试 select 一个不存在的字段会报错，select 存在的字段则正常
        const { error: adError } = await supabase
            .from('ads')
            .select('id, start_date, duration_days')
            .limit(1);

        if (adError) {
            console.error(`❌ ads 表检查失败: ${adError.message}`);
            console.error('   (说明 SQL 脚本可能未成功执行，缺少字段)');
        } else {
            console.log('✅ ads 表结构正常 (包含 start_date, duration_days)');
        }

        // 2. 验证 public.users 表字段
        console.log('\n🔍 正在检查 public.users 表...');
        const { error: userError } = await supabase
            .from('users')
            .select('id, username, avatar_url, role')
            .limit(1);

        if (userError) {
            console.error(`❌ public.users 表检查失败: ${userError.message}`);
            console.error('   (说明 SQL 脚本可能未成功执行，缺少 username 等字段)');
        } else {
            console.log('✅ public.users 表结构正常 (包含 username, role)');
        }

        // 3. 验证 categories 表
        console.log('\n🔍 正在检查 categories 表...');
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('name');

        if (catError) {
            console.error(`❌ categories 表读取失败: ${catError.message}`);
        } else {
            console.log(`✅ categories 表正常，包含 ${categories?.length} 个分类`);
        }

    } catch (err: any) {
        console.error('❌ 验证过程发生未知错误:', err.message);
    }
}

verifySchema();
