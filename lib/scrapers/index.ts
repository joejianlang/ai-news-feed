import Parser from 'rss-parser';
import { YoutubeTranscript } from 'youtube-transcript';
import * as cheerio from 'cheerio';
import type { ScrapedContent, SourceType } from '@/types';
import { getChannelVideos, extractChannelId, getChannelIdByUsername, getVideoDetails, getTrendingVideos } from './youtube-channel';
import { extractImageFromHTML } from '../images/extractor';

const rssParser = new Parser({
  customFields: {
    item: [
      ['media:thumbnail', 'media:thumbnail'],
      ['media:content', 'media:content'],
      ['media:group', 'media:group'],
      ['image', 'image'],
      ['enclosure', 'enclosure'],
    ]
  }
});

// 从文章URL获取og:image
async function fetchOgImage(articleUrl: string): Promise<string | undefined> {
  try {
    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
      },
      signal: AbortSignal.timeout(5000) // 5秒超时
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    // 尝试获取 og:image
    const ogImage = $('meta[property="og:image"]').attr('content') ||
      $('meta[property="og:image:secure_url"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content');

    return ogImage || undefined;
  } catch (error) {
    console.log(`Failed to fetch og:image from ${articleUrl}:`, error);
    return undefined;
  }
}

// RSS抓取
export async function scrapeRSS(url: string): Promise<ScrapedContent[]> {
  try {
    console.log(`[RSS] Parsing URL: ${url}`);
    const feed = await rssParser.parseURL(url);
    console.log(`[RSS] Feed parsed, items: ${feed.items.length}`);

    const items = feed.items.slice(0, 5).map(item => {
      // 尝试从RSS item中提取图片
      let imageUrl: string | undefined;

      // 1. RSS的enclosure标签（通常用于媒体）
      if (item.enclosure && item.enclosure.type?.startsWith('image/')) {
        imageUrl = item.enclosure.url;
      }

      // 2. 从 media:thumbnail 或 media:content 提取（BBC等媒体常用）
      if (!imageUrl && (item as any)['media:thumbnail']) {
        const mediaThumbnail = (item as any)['media:thumbnail'];
        // 处理两种可能的结构
        if (mediaThumbnail?.$?.url) {
          imageUrl = mediaThumbnail.$.url;
        } else if (typeof mediaThumbnail === 'string') {
          imageUrl = mediaThumbnail;
        } else if (Array.isArray(mediaThumbnail) && mediaThumbnail[0]?.$?.url) {
          imageUrl = mediaThumbnail[0].$.url;
        }
      }

      if (!imageUrl && (item as any)['media:content']) {
        const mediaContent = (item as any)['media:content'];
        // 处理两种可能的结构
        if (mediaContent?.$?.url) {
          imageUrl = mediaContent.$.url;
        } else if (typeof mediaContent === 'string') {
          imageUrl = mediaContent;
        } else if (Array.isArray(mediaContent) && mediaContent[0]?.$?.url) {
          imageUrl = mediaContent[0].$.url;
        }
      }

      // 2.5 从 media:group 提取（某些新闻源使用）
      if (!imageUrl && (item as any)['media:group']) {
        const mediaGroup = (item as any)['media:group'];
        if (mediaGroup?.['media:content']?.$?.url) {
          imageUrl = mediaGroup['media:content'].$.url;
        } else if (mediaGroup?.['media:thumbnail']?.$?.url) {
          imageUrl = mediaGroup['media:thumbnail'].$.url;
        }
      }

      // 2.6 从 image 标签提取
      if (!imageUrl && (item as any)['image']) {
        const image = (item as any)['image'];
        if (typeof image === 'string') {
          imageUrl = image;
        } else if (image?.url) {
          imageUrl = image.url;
        } else if (image?.$?.url) {
          imageUrl = image.$.url;
        }
      }

      // 3. 从content中提取图片
      if (!imageUrl && item.content) {
        const $ = cheerio.load(item.content);
        const img = $('img').first();
        imageUrl = img.attr('src');
      }

      // 4. 从description中提取图片
      if (!imageUrl && (item as any).description) {
        const $ = cheerio.load((item as any).description);
        const img = $('img').first();
        imageUrl = img.attr('src');
      }

      return {
        title: item.title || 'Untitled',
        content: item.contentSnippet || item.content || '',
        url: item.link || url,
        publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
        contentType: 'article' as const,
        imageUrl,
      };
    });

    // 对于没有图片的文章，尝试从文章URL获取og:image
    const results = await Promise.all(
      items.map(async (item) => {
        if (!item.imageUrl && item.url) {
          try {
            const ogImage = await fetchOgImage(item.url);
            if (ogImage) {
              return { ...item, imageUrl: ogImage };
            }
          } catch (error) {
            // 忽略错误，保持原样
          }
        }
        return item;
      })
    );

    return results;
  } catch (error) {
    console.error('RSS scraping failed:', error);
    return [];
  }
}

// YouTube视频抓取（抓取字幕）
export async function scrapeYouTube(url: string): Promise<ScrapedContent | null> {
  try {
    // 从URL中提取视频ID
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (!videoIdMatch) {
      throw new Error('Invalid YouTube URL');
    }

    const videoId = videoIdMatch[1];

    // 获取视频详情
    const videoDetails = await getVideoDetails(videoId);

    // 尝试获取字幕
    let content = '';
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      content = transcript.map(item => item.text).join(' ');
    } catch (error) {
      // 如果没有字幕，使用描述
      content = videoDetails?.description || '';
    }

    return {
      title: videoDetails?.title || `YouTube Video: ${videoId}`,
      content,
      url,
      contentType: 'video' as const,
      videoId,
    };
  } catch (error) {
    console.error('YouTube scraping failed:', error);
    return null;
  }
}

// YouTube 频道抓取
export async function scrapeYouTubeChannel(
  url: string,
  channelId?: string
): Promise<ScrapedContent[]> {
  try {
    // 如果没有提供 channelId，尝试从 URL 提取
    let finalChannelId = channelId;

    if (!finalChannelId) {
      console.log(`[YouTube Channel] No channelId provided, extracting from URL: ${url}`);
      const extractedId = extractChannelId(url);

      if (!extractedId) {
        throw new Error('Invalid YouTube channel URL');
      }

      console.log(`[YouTube Channel] Extracted ID/Handle: ${extractedId}`);

      // 改进判断逻辑：如果提取的不是以 UC 开头的频道ID，说明是用户名/别名
      const isActuallyAChannelId = extractedId.startsWith('UC') && extractedId.length >= 24;

      if (!isActuallyAChannelId) {
        console.log(`[YouTube Channel] Resolution needed for handle: ${extractedId}`);
        const resolvedId = await getChannelIdByUsername(extractedId);
        if (!resolvedId) {
          throw new Error(`Could not resolve channel ID for: ${extractedId}`);
        }
        finalChannelId = resolvedId;
        console.log(`[YouTube Channel] Resolved ${extractedId} to ${finalChannelId}`);
      } else {
        finalChannelId = extractedId;
      }
    }

    // 获取频道最新视频
    const videos = await getChannelVideos(finalChannelId, 15);

    const scrapedContents: ScrapedContent[] = [];

    for (const video of videos) {
      // 为每个视频获取字幕
      let content = video.description;

      try {
        const transcript = await YoutubeTranscript.fetchTranscript(video.id);
        content = transcript.map(item => item.text).join(' ');
      } catch (error) {
        // 如果没有字幕，使用描述
        console.log(`No transcript for video ${video.id}, using description`);
      }

      scrapedContents.push({
        title: video.title,
        content,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        publishedAt: new Date(video.publishedAt),
        contentType: 'video' as const,
        videoId: video.id,
      });
    }

    return scrapedContents;
  } catch (error) {
    console.error('YouTube channel scraping failed:', error);
    return [];
  }
}

// YouTube 趋势/热门视频抓取
export async function scrapeYouTubeTrending(regionCode: string = 'US'): Promise<ScrapedContent[]> {
  try {
    console.log(`[YouTube Trending] Starting search for region: ${regionCode}`);
    const videos = await getTrendingVideos(regionCode, 10);

    const scrapedContents: ScrapedContent[] = [];

    for (const video of videos) {
      scrapedContents.push({
        title: video.title,
        content: video.content || video.description,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        publishedAt: new Date(video.publishedAt),
        contentType: 'video' as const,
        videoId: video.id,
      });
    }

    return scrapedContents;
  } catch (error) {
    console.error('YouTube trending scraping failed:', error);
    return [];
  }
}

// 网页抓取（使用cheerio进行HTML解析）
export async function scrapeWebPage(url: string): Promise<ScrapedContent | null> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // 提取标题
    const title = $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      'Untitled';

    // 提取主图片
    const imageUrl = extractImageFromHTML(html, url);

    // 提取正文内容
    // 移除script、style、nav、header、footer等标签
    $('script, style, nav, header, footer, aside, .ads, .advertisement').remove();

    // 尝试找到主要内容区域
    const contentSelectors = ['article', 'main', '.content', '.post-content', '.entry-content', 'body'];
    let content = '';

    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length) {
        content = element.text();
        break;
      }
    }

    // 清理内容
    content = content
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000); // 限制长度

    return {
      title: title.trim(),
      content,
      url,
      contentType: 'article' as const,
      imageUrl: imageUrl || undefined,
    };
  } catch (error) {
    console.error('Web page scraping failed:', error);
    return null;
  }
}

// 根据源类型选择抓取方法
export async function scrapeContent(
  url: string,
  sourceType: SourceType,
  channelId?: string
): Promise<ScrapedContent[]> {
  // 处理 YouTube 热门趋势的特殊 URL 格式
  if (url && url.startsWith('youtube_trending://')) {
    const region = url.replace('youtube_trending://', '') || 'US';
    return await scrapeYouTubeTrending(region);
  }

  switch (sourceType) {
    case 'rss':
      return await scrapeRSS(url);
    case 'youtube': {
      const result = await scrapeYouTube(url);
      return result ? [result] : [];
    }
    case 'youtube_channel':
      return await scrapeYouTubeChannel(url, channelId);
    case 'youtube_trending':
      return await scrapeYouTubeTrending(url || 'US'); // 使用 URL 字段作为区域代码，默认 US
    case 'web': {
      const result = await scrapeWebPage(url);
      return result ? [result] : [];
    }
    default:
      return [];
  }
}
