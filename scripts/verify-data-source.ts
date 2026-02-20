
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

console.log('--- 验证数据源 (Verifying Data Source) ---');
console.log(`📡 当前连接的 Supabase URL: ${supabaseUrl}`);
console.log('(请核对上述 URL 是否为“优服佳”项目的 URL)');

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDataSource() {
    try {
        // 1. 验证分类 (Categories) - 应该包含我们 SQL 脚本插入的 7 个分类
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('name');

        if (catError) throw catError;

        console.log(`\n✅ 成功连接到数据库！`);
        console.log(`📊 现有分类数量: ${categories?.length}`);
        console.log(`   分类列表: ${categories?.map(c => c.name).join(', ')}`);

        if (categories?.length === 7) {
            console.log('   ✨ 验证通过：分类数据与迁移脚本一致 (Local/Hot/Tech...)');
        }

        // 2. 验证新闻 (News Items)
        const { count: newsCount, error: newsError } = await supabase
            .from('news_items')
            .select('*', { count: 'exact', head: true });

        if (newsError) throw newsError;

        console.log(`📰 现有新闻数量: ${newsCount}`);
        if (newsCount === 0) {
            console.log('   ℹ️ (这是正常的，因为新数据库尚未抓取任何新闻)');
        } else {
            console.log('   ℹ️ (已有一些新闻数据)');
        }

        // 3. 验证城市 (Cities)
        const { count: cityCount, error: cityError } = await supabase
            .from('cities')
            .select('*', { count: 'exact', head: true });

        if (cityError) console.log('⚠️ 无法读取 Cities 表 (可能尚未创建):', cityError.message);
        else console.log(`🏙️ 现有城市数量: ${cityCount}`);


    } catch (err: any) {
        console.error('❌ 验证失败:', err.message);
    }
}

verifyDataSource();
