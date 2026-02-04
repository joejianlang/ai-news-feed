import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// 从文章URL获取og:image
async function fetchOgImage(articleUrl: string): Promise<string | null> {
  try {
    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
      },
      signal: AbortSignal.timeout(10000) // 10秒超时
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const ogImage = $('meta[property="og:image"]').attr('content') ||
                    $('meta[property="og:image:secure_url"]').attr('content') ||
                    $('meta[name="twitter:image"]').attr('content');

    return ogImage || null;
  } catch (error) {
    console.log(`Failed to fetch og:image from ${articleUrl}`);
    return null;
  }
}

async function updateImages() {
  console.log('开始更新新闻图片...\n');

  // 获取所有没有图片的文章类新闻
  const { data: newsItems, error } = await supabase
    .from('news_items')
    .select('id, title, original_url, content_type, image_url')
    .eq('content_type', 'article')
    .is('image_url', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('获取新闻列表失败:', error);
    return;
  }

  console.log(`找到 ${newsItems?.length || 0} 条没有图片的文章\n`);

  let updatedCount = 0;
  let failedCount = 0;

  for (const item of newsItems || []) {
    console.log(`处理: ${item.title.substring(0, 50)}...`);

    const imageUrl = await fetchOgImage(item.original_url);

    if (imageUrl) {
      const { error: updateError } = await supabase
        .from('news_items')
        .update({ image_url: imageUrl })
        .eq('id', item.id);

      if (updateError) {
        console.log(`  ❌ 更新失败: ${updateError.message}`);
        failedCount++;
      } else {
        console.log(`  ✅ 已更新图片`);
        updatedCount++;
      }
    } else {
      console.log(`  ⏭️  未找到图片`);
      failedCount++;
    }

    // 添加延迟以避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✨ 完成！更新了 ${updatedCount} 条新闻的图片，${failedCount} 条未能更新`);
}

updateImages().catch(console.error);
