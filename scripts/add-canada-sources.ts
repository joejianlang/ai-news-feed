import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const canadaSources = [
  {
    name: 'CBC News',
    url: 'https://rss.cbc.ca/lineup/topstories.xml',
    source_type: 'rss',
    fetch_interval: 1800,
    commentary_style: '专业分析',
    is_active: true,
  },
  {
    name: 'CBC Canada',
    url: 'https://rss.cbc.ca/lineup/canada.xml',
    source_type: 'rss',
    fetch_interval: 1800,
    commentary_style: '专业分析',
    is_active: true,
  },
  {
    name: 'CBC World',
    url: 'https://rss.cbc.ca/lineup/world.xml',
    source_type: 'rss',
    fetch_interval: 3600,
    commentary_style: '专业分析',
    is_active: true,
  },
  {
    name: 'CBC Politics',
    url: 'https://rss.cbc.ca/lineup/politics.xml',
    source_type: 'rss',
    fetch_interval: 1800,
    commentary_style: '专业分析',
    is_active: true,
  },
  {
    name: 'CBC Business',
    url: 'https://rss.cbc.ca/lineup/business.xml',
    source_type: 'rss',
    fetch_interval: 1800,
    commentary_style: '专业分析',
    is_active: true,
  },
  {
    name: 'CBC Technology',
    url: 'https://rss.cbc.ca/lineup/technology.xml',
    source_type: 'rss',
    fetch_interval: 3600,
    commentary_style: '专业分析',
    is_active: true,
  },
  {
    name: 'CTV News',
    url: 'https://www.ctvnews.ca/rss/ctvnews-ca-top-stories-public-rss-1.822009',
    source_type: 'rss',
    fetch_interval: 1800,
    commentary_style: '专业分析',
    is_active: true,
  },
  {
    name: 'Global News',
    url: 'https://globalnews.ca/feed/',
    source_type: 'rss',
    fetch_interval: 1800,
    commentary_style: '专业分析',
    is_active: true,
  },
  {
    name: 'Global News Canada',
    url: 'https://globalnews.ca/canada/feed/',
    source_type: 'rss',
    fetch_interval: 1800,
    commentary_style: '专业分析',
    is_active: true,
  },
  {
    name: 'Global News Politics',
    url: 'https://globalnews.ca/politics/feed/',
    source_type: 'rss',
    fetch_interval: 1800,
    commentary_style: '专业分析',
    is_active: true,
  },
  {
    name: 'Globe and Mail',
    url: 'https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/canada/',
    source_type: 'rss',
    fetch_interval: 3600,
    commentary_style: '深度评论',
    is_active: true,
  },
  {
    name: 'Globe and Mail Business',
    url: 'https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/business/',
    source_type: 'rss',
    fetch_interval: 3600,
    commentary_style: '深度评论',
    is_active: true,
  },
  {
    name: 'National Post',
    url: 'https://nationalpost.com/feed',
    source_type: 'rss',
    fetch_interval: 3600,
    commentary_style: '专业分析',
    is_active: true,
  },
  {
    name: 'Toronto Star',
    url: 'https://www.thestar.com/content/thestar/feed.RSSManagerServlet.articles.news.rss',
    source_type: 'rss',
    fetch_interval: 3600,
    commentary_style: '专业分析',
    is_active: true,
  },
];

async function addCanadaSources() {
  console.log('开始添加加拿大新闻源...\n');

  for (const source of canadaSources) {
    try {
      // 检查是否已存在
      const { data: existing } = await supabase
        .from('news_sources')
        .select('id, name')
        .eq('url', source.url)
        .single();

      if (existing) {
        console.log(`⏭️  跳过: ${source.name} (已存在)`);
        continue;
      }

      const { data, error } = await supabase
        .from('news_sources')
        .insert([source])
        .select()
        .single();

      if (error) {
        console.error(`❌ 失败: ${source.name} - ${error.message}`);
      } else {
        console.log(`✅ 添加: ${source.name}`);
      }
    } catch (err) {
      console.error(`❌ 错误: ${source.name}`, err);
    }
  }

  console.log('\n完成！');
}

addCanadaSources();
