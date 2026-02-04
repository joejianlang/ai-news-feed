#!/usr/bin/env node

/**
 * 清理重复的新闻记录
 * - 对于视频：基于 video_id 去重
 * - 对于文章：基于 original_url 去重
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('错误: 缺少 Supabase 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeDuplicates() {
  console.log('开始清理重复记录...\n');

  try {
    // 1. 处理视频重复（基于video_id）
    console.log('检查视频重复...');
    const { data: videos, error: videoError } = await supabase
      .from('news_items')
      .select('id, video_id, title, created_at')
      .eq('content_type', 'video')
      .not('video_id', 'is', null)
      .order('created_at', { ascending: true });

    if (videoError) {
      console.error('查询视频失败:', videoError);
    } else if (videos) {
      const seenVideoIds = new Map();
      const duplicateIds = [];

      videos.forEach(item => {
        if (seenVideoIds.has(item.video_id)) {
          // 这是重复的，保留最早的那个
          duplicateIds.push(item.id);
          console.log(`发现重复视频: ${item.title} (video_id: ${item.video_id})`);
        } else {
          seenVideoIds.set(item.video_id, item.id);
        }
      });

      if (duplicateIds.length > 0) {
        console.log(`\n删除 ${duplicateIds.length} 条重复视频...`);
        const { error: deleteError } = await supabase
          .from('news_items')
          .delete()
          .in('id', duplicateIds);

        if (deleteError) {
          console.error('删除失败:', deleteError);
        } else {
          console.log(`✅ 成功删除 ${duplicateIds.length} 条重复视频`);
        }
      } else {
        console.log('✅ 没有发现重复视频');
      }
    }

    // 2. 处理文章重复（基于original_url）
    console.log('\n检查文章重复...');
    const { data: articles, error: articleError } = await supabase
      .from('news_items')
      .select('id, original_url, title, created_at')
      .eq('content_type', 'article')
      .order('created_at', { ascending: true });

    if (articleError) {
      console.error('查询文章失败:', articleError);
    } else if (articles) {
      const seenUrls = new Map();
      const duplicateIds = [];

      articles.forEach(item => {
        if (seenUrls.has(item.original_url)) {
          duplicateIds.push(item.id);
          console.log(`发现重复文章: ${item.title}`);
        } else {
          seenUrls.set(item.original_url, item.id);
        }
      });

      if (duplicateIds.length > 0) {
        console.log(`\n删除 ${duplicateIds.length} 条重复文章...`);
        const { error: deleteError } = await supabase
          .from('news_items')
          .delete()
          .in('id', duplicateIds);

        if (deleteError) {
          console.error('删除失败:', deleteError);
        } else {
          console.log(`✅ 成功删除 ${duplicateIds.length} 条重复文章`);
        }
      } else {
        console.log('✅ 没有发现重复文章');
      }
    }

    console.log('\n清理完成！');
    console.log('\n请在 Supabase Dashboard 执行以下SQL添加唯一约束：');
    console.log('-------------------------------------------');
    console.log(`
-- 为视频添加唯一约束（video_id）
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_items_unique_video
ON news_items(video_id)
WHERE video_id IS NOT NULL;

-- 为文章添加唯一约束（original_url）
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_items_unique_url
ON news_items(original_url)
WHERE content_type = 'article';
    `);
    console.log('-------------------------------------------');

  } catch (error) {
    console.error('清理失败:', error);
    process.exit(1);
  }
}

removeDuplicates();
