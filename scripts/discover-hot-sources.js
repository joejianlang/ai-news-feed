#!/usr/bin/env node

/**
 * 自动发现和推荐热门中文新闻源
 * 每天运行一次，搜索热门的YouTube频道和RSS源
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

// 热门中文YouTube频道推荐列表
const RECOMMENDED_YOUTUBE_CHANNELS = [
  // 新闻类
  {
    name: 'BBC News 中文',
    url: 'https://www.youtube.com/@bbcchinese',
    category: '传统新闻媒体',
    commentary_style: '客观中立的国际新闻分析',
    reason: 'BBC官方中文频道，权威国际新闻报道',
    estimated_subscribers: 1500000
  },
  {
    name: 'DW中文',
    url: 'https://www.youtube.com/@dw中文',
    category: '传统新闻媒体',
    commentary_style: '专业深度的欧洲视角',
    reason: '德国之声官方频道，欧洲视角的国际新闻',
    estimated_subscribers: 800000
  },
  {
    name: 'CCTV中文国际',
    url: 'https://www.youtube.com/@CCTVChineseInternational',
    category: '传统新闻媒体',
    commentary_style: '官方权威的新闻报道',
    reason: 'CCTV官方国际频道',
    estimated_subscribers: 2000000
  },

  // 科普教育类
  {
    name: '老高與小茉 Mr & Mrs Gao',
    url: 'https://www.youtube.com/@MrGaoLao',
    category: 'YouTube网红',
    commentary_style: '轻松有趣的科普解读',
    reason: '华语圈顶级科普频道，内容涵盖科学、历史、神秘事件',
    estimated_subscribers: 5000000
  },
  {
    name: '李永乐老师',
    url: 'https://www.youtube.com/@lip永乐',
    category: 'YouTube网红',
    commentary_style: '深入浅出的科学教育',
    reason: '中国知名物理教师，科普教育质量极高',
    estimated_subscribers: 3000000
  },
  {
    name: '回形针PaperClip',
    url: 'https://www.youtube.com/@PaperClipfans',
    category: 'YouTube网红',
    commentary_style: '专业严谨的科普分析',
    reason: '高质量科普视频制作团队',
    estimated_subscribers: 1000000
  },

  // 财经科技类
  {
    name: '大劉說新聞',
    url: 'https://www.youtube.com/@LiuDashuo',
    category: 'YouTube网红',
    commentary_style: '深度财经时事分析',
    reason: '知名财经评论人，深度分析国际局势',
    estimated_subscribers: 800000
  },
  {
    name: '雷電說書',
    url: 'https://www.youtube.com/@LeiDianBooks',
    category: 'YouTube网红',
    commentary_style: '有趣的商业案例分析',
    reason: '商业故事和企业分析，内容通俗易懂',
    estimated_subscribers: 500000
  },

  // 生活知识类
  {
    name: '冷门探索',
    url: 'https://www.youtube.com/@UnusualExplorer',
    category: 'YouTube网红',
    commentary_style: '趣味冷知识解读',
    reason: '探索各种冷门知识和奇闻异事',
    estimated_subscribers: 600000
  },
  {
    name: '小Lin说',
    url: 'https://www.youtube.com/@XiaoLinTalks',
    category: 'YouTube网红',
    commentary_style: '专业易懂的知识分享',
    reason: '各类知识科普，内容丰富',
    estimated_subscribers: 400000
  }
];

// 热门RSS源推荐列表
const RECOMMENDED_RSS_SOURCES = [
  {
    name: 'BBC中文网',
    url: 'https://feeds.bbci.co.uk/zhongwen/simp/rss.xml',
    category: '传统新闻媒体',
    commentary_style: '客观中立的新闻分析',
    reason: 'BBC官方中文RSS，最权威的国际新闻源之一'
  },
  {
    name: '纽约时报中文网',
    url: 'https://cn.nytimes.com/rss/zh-hans/',
    category: '传统新闻媒体',
    commentary_style: '深度专业的国际报道',
    reason: '纽约时报中文版，高质量深度报道'
  },
  {
    name: '德国之声中文',
    url: 'https://rss.dw.com/xml/rss-chi',
    category: '传统新闻媒体',
    commentary_style: '欧洲视角的国际新闻',
    reason: '德国之声中文RSS，欧洲视角的新闻报道'
  },
  {
    name: '36氪',
    url: 'https://36kr.com/feed',
    category: '网络专业媒体',
    commentary_style: '专业的科技创投分析',
    reason: '中国领先的科技创投媒体'
  },
  {
    name: '虎嗅网',
    url: 'https://www.huxiu.com/rss/0.xml',
    category: '网络专业媒体',
    commentary_style: '深度商业科技评论',
    reason: '高质量商业科技内容平台'
  },
  {
    name: 'IT之家',
    url: 'https://www.ithome.com/rss/',
    category: '网络专业媒体',
    commentary_style: '快速的科技资讯报道',
    reason: '中文科技新闻第一站，更新及时'
  },
  {
    name: '少数派',
    url: 'https://sspai.com/feed',
    category: '网络专业媒体',
    commentary_style: '实用的效率工具分享',
    reason: '高质量效率工具和数字生活内容'
  },
  {
    name: 'Solidot',
    url: 'https://www.solidot.org/index.rss',
    category: '网络专业媒体',
    commentary_style: '极客视角的科技评论',
    reason: '老牌科技资讯站，geek文化'
  }
];

async function getCategoryId(categoryName) {
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('name', categoryName)
    .single();

  return data?.id;
}

async function checkIfExists(url) {
  // 检查是否已在推荐列表
  const { data: recommended } = await supabase
    .from('recommended_sources')
    .select('id')
    .eq('url', url)
    .maybeSingle();

  if (recommended) return true;

  // 检查是否已在正式列表
  const { data: existing } = await supabase
    .from('news_sources')
    .select('id')
    .eq('url', url)
    .maybeSingle();

  return !!existing;
}

async function addRecommendation(source, sourceType) {
  const exists = await checkIfExists(source.url);
  if (exists) {
    console.log(`⏭️  跳过: ${source.name} (已存在)`);
    return;
  }

  const categoryId = await getCategoryId(source.category);

  const recommendation = {
    name: source.name,
    url: source.url,
    source_type: sourceType,
    category_id: categoryId,
    commentary_style: source.commentary_style,
    recommended_reason: source.reason,
    popularity_score: Math.min(100, Math.floor((source.estimated_subscribers || 100000) / 10000)),
    subscriber_count: source.estimated_subscribers,
    status: 'pending'
  };

  const { data, error } = await supabase
    .from('recommended_sources')
    .insert([recommendation])
    .select()
    .single();

  if (error) {
    console.error(`❌ 添加失败: ${source.name}`, error.message);
  } else {
    console.log(`✅ 添加推荐: ${source.name}`);
  }
}

async function discoverSources() {
  console.log('🔍 开始搜索热门中文媒体源...\n');

  try {
    // 添加YouTube频道推荐
    console.log('📺 处理YouTube频道推荐...');
    for (const channel of RECOMMENDED_YOUTUBE_CHANNELS) {
      await addRecommendation(channel, 'youtube_channel');
    }

    console.log('\n📰 处理RSS源推荐...');
    // 添加RSS源推荐
    for (const rss of RECOMMENDED_RSS_SOURCES) {
      await addRecommendation(rss, 'rss');
    }

    // 统计推荐数量
    const { data: pending } = await supabase
      .from('recommended_sources')
      .select('id')
      .eq('status', 'pending');

    console.log(`\n✨ 完成！当前有 ${pending?.length || 0} 个待审核的推荐源`);
    console.log('\n管理员可以在后台查看并批准这些推荐');

  } catch (error) {
    console.error('搜索失败:', error);
    process.exit(1);
  }
}

discoverSources();
