import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// 台湾主要媒体的RSS源
const taiwanRssSources = [
  // 自由時報
  {
    name: '自由時報 - 焦點新聞',
    url: 'https://news.ltn.com.tw/rss/focus.xml',
    source_type: 'rss',
    fetch_interval: 30,
    commentary_style: '專業分析風格',
    is_active: true,
  },
  {
    name: '自由時報 - 政治',
    url: 'https://news.ltn.com.tw/rss/politics.xml',
    source_type: 'rss',
    fetch_interval: 30,
    commentary_style: '專業分析風格',
    is_active: true,
  },
  {
    name: '自由時報 - 財經',
    url: 'https://news.ltn.com.tw/rss/business.xml',
    source_type: 'rss',
    fetch_interval: 30,
    commentary_style: '專業分析風格',
    is_active: true,
  },
  // 中央通訊社
  {
    name: '中央社 - 即時新聞',
    url: 'https://www.cna.com.tw/rss/aall.xml',
    source_type: 'rss',
    fetch_interval: 30,
    commentary_style: '專業分析風格',
    is_active: true,
  },
  {
    name: '中央社 - 政治',
    url: 'https://www.cna.com.tw/rss/aipl.xml',
    source_type: 'rss',
    fetch_interval: 30,
    commentary_style: '專業分析風格',
    is_active: true,
  },
  {
    name: '中央社 - 兩岸',
    url: 'https://www.cna.com.tw/rss/acn.xml',
    source_type: 'rss',
    fetch_interval: 30,
    commentary_style: '專業分析風格',
    is_active: true,
  },
  {
    name: '中央社 - 國際',
    url: 'https://www.cna.com.tw/rss/aopl.xml',
    source_type: 'rss',
    fetch_interval: 30,
    commentary_style: '專業分析風格',
    is_active: true,
  },
  // 聯合報
  {
    name: '聯合報 - 即時新聞',
    url: 'https://udn.com/rssfeed/news/1/0?ch=news',
    source_type: 'rss',
    fetch_interval: 30,
    commentary_style: '專業分析風格',
    is_active: true,
  },
  // 公視新聞
  {
    name: '公視新聞',
    url: 'https://news.pts.org.tw/rss',
    source_type: 'rss',
    fetch_interval: 30,
    commentary_style: '專業分析風格',
    is_active: true,
  },
  // 報導者
  {
    name: '報導者 The Reporter',
    url: 'https://www.twreporter.org/a/rss2.xml',
    source_type: 'rss',
    fetch_interval: 60,
    commentary_style: '深度調查風格',
    is_active: true,
  },
  // 風傳媒
  {
    name: '風傳媒',
    url: 'https://www.storm.mg/feeds/all',
    source_type: 'rss',
    fetch_interval: 30,
    commentary_style: '專業分析風格',
    is_active: true,
  },
];

// 台灣主要新聞 YouTube 頻道
const taiwanYouTubeChannels = [
  {
    name: '中天新聞',
    url: 'https://www.youtube.com/@中天新聞CH52',
    source_type: 'youtube_channel',
    youtube_channel_id: 'UC5l1Yto5oOIgRXlI4p4VKbw',
    fetch_interval: 60,
    commentary_style: '專業分析風格',
    is_active: true,
  },
  {
    name: 'TVBS新聞',
    url: 'https://www.youtube.com/@TVBSNEWS01',
    source_type: 'youtube_channel',
    youtube_channel_id: 'UC5nwNW4KdC0gzwKLz7dPIWw',
    fetch_interval: 60,
    commentary_style: '專業分析風格',
    is_active: true,
  },
  {
    name: '東森新聞',
    url: 'https://www.youtube.com/@newsebc',
    source_type: 'youtube_channel',
    youtube_channel_id: 'UCR3asjvr_WAaRJbkmZ5wpLg',
    fetch_interval: 60,
    commentary_style: '專業分析風格',
    is_active: true,
  },
  {
    name: '三立新聞',
    url: 'https://www.youtube.com/@saboranews',
    source_type: 'youtube_channel',
    youtube_channel_id: 'UCgGfGXy8tLdMbBPQoLAYTgg',
    fetch_interval: 60,
    commentary_style: '專業分析風格',
    is_active: true,
  },
  {
    name: '民視新聞',
    url: 'https://www.youtube.com/@FTVnews53',
    source_type: 'youtube_channel',
    youtube_channel_id: 'UCMF2AGxKTFYX2-5WI4hO1sA',
    fetch_interval: 60,
    commentary_style: '專業分析風格',
    is_active: true,
  },
  {
    name: '公視新聞網',
    url: 'https://www.youtube.com/@ptsnews',
    source_type: 'youtube_channel',
    youtube_channel_id: 'UCMXhcmSxVhcSZhJgvfBBMcw',
    fetch_interval: 60,
    commentary_style: '專業分析風格',
    is_active: true,
  },
  {
    name: '華視新聞',
    url: 'https://www.youtube.com/@CtsTw',
    source_type: 'youtube_channel',
    youtube_channel_id: 'UCoNeKIkLyFeAKFdiZ7vXaxw',
    fetch_interval: 60,
    commentary_style: '專業分析風格',
    is_active: true,
  },
];

async function addSources() {
  console.log('開始添加台灣媒體源...\n');

  // 添加 RSS 源
  console.log('=== 添加 RSS 新聞源 ===');
  for (const source of taiwanRssSources) {
    try {
      // 檢查是否已存在
      const { data: existing } = await supabase
        .from('news_sources')
        .select('id')
        .eq('url', source.url)
        .single();

      if (existing) {
        console.log(`⏭️  跳過（已存在）: ${source.name}`);
        continue;
      }

      const { error } = await supabase
        .from('news_sources')
        .insert(source);

      if (error) {
        console.error(`❌ 添加失敗: ${source.name}`, error.message);
      } else {
        console.log(`✅ 已添加: ${source.name}`);
      }
    } catch (err) {
      console.error(`❌ 錯誤: ${source.name}`, err);
    }
  }

  // 添加 YouTube 頻道
  console.log('\n=== 添加 YouTube 頻道 ===');
  for (const channel of taiwanYouTubeChannels) {
    try {
      // 檢查是否已存在
      const { data: existing } = await supabase
        .from('news_sources')
        .select('id')
        .eq('youtube_channel_id', channel.youtube_channel_id)
        .single();

      if (existing) {
        console.log(`⏭️  跳過（已存在）: ${channel.name}`);
        continue;
      }

      const { error } = await supabase
        .from('news_sources')
        .insert(channel);

      if (error) {
        console.error(`❌ 添加失敗: ${channel.name}`, error.message);
      } else {
        console.log(`✅ 已添加: ${channel.name}`);
      }
    } catch (err) {
      console.error(`❌ 錯誤: ${channel.name}`, err);
    }
  }

  console.log('\n✨ 台灣媒體源添加完成！');
  console.log(`RSS 源: ${taiwanRssSources.length} 個`);
  console.log(`YouTube 頻道: ${taiwanYouTubeChannels.length} 個`);
}

addSources().catch(console.error);
