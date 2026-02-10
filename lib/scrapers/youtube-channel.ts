import { google } from 'googleapis';
import { YoutubeTranscript } from 'youtube-transcript';
import type { YouTubeVideo } from '@/types';

// 加载环境变量
// loadEnvFile() - 移除手动加载，由 Next.js 自动处理

console.log('--- YouTube Scraper Initialization ---');
console.log('YouTube API Key exists:', !!process.env.YOUTUBE_API_KEY);
if (process.env.YOUTUBE_API_KEY) {
  console.log('YouTube API Key length:', process.env.YOUTUBE_API_KEY.length);
  console.log('YouTube API Key prefix:', process.env.YOUTUBE_API_KEY.substring(0, 5) + '...');
}
console.log('------------------------------------');

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

/**
 * 从 YouTube URL 提取频道 ID
 */
export function extractChannelId(url: string): string | null {
  // 支持多种格式：
  // https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw
  // https://www.youtube.com/@username
  // https://www.youtube.com/c/channelname

  const patterns = [
    /youtube\.com\/channel\/([^/?&]+)/,
    /youtube\.com\/@([^/?&]+)/,
    /youtube\.com\/c\/([^/?&]+)/,
    /youtube\.com\/user\/([^/?&]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * 通过用户名或自定义 URL 获取频道 ID
 */
export async function getChannelIdByUsername(username: string): Promise<string | null> {
  try {
    // 移除 @ 符号
    const cleanUsername = username.replace('@', '');
    console.log('Looking up channel ID for username:', cleanUsername);

    const response = await youtube.channels.list({
      part: ['id'],
      forHandle: cleanUsername,
    });

    console.log('forHandle response:', response.data.items?.length || 0, 'items');

    if (response.data.items && response.data.items.length > 0) {
      const channelId = response.data.items[0].id || null;
      console.log('Found channel ID via forHandle:', channelId);
      return channelId;
    }

    // 如果用 forHandle 找不到，尝试用 forUsername
    const response2 = await youtube.channels.list({
      part: ['id'],
      forUsername: cleanUsername,
    });

    console.log('forUsername response:', response2.data.items?.length || 0, 'items');

    if (response2.data.items && response2.data.items.length > 0) {
      const channelId = response2.data.items[0].id || null;
      console.log('Found channel ID via forUsername:', channelId);
      return channelId;
    }

    console.log('Could not find channel ID for:', username);
    return null;
  } catch (error) {
    console.error('Failed to get channel ID:', error);
    return null;
  }
}

/**
 * 获取频道的最新视频
 */
export async function getChannelVideos(
  channelId: string,
  maxResults: number = 10
): Promise<YouTubeVideo[]> {
  try {
    // 获取频道的上传播放列表 ID
    const channelResponse = await youtube.channels.list({
      part: ['contentDetails'],
      id: [channelId],
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      throw new Error('Channel not found');
    }

    const uploadsPlaylistId =
      channelResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      throw new Error('No uploads playlist found');
    }

    // 获取播放列表中的视频
    const playlistResponse = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId: uploadsPlaylistId,
      maxResults,
    });

    const videos: YouTubeVideo[] = [];

    for (const item of playlistResponse.data.items || []) {
      const videoId = item.contentDetails?.videoId || '';
      if (videoId) {
        // 尝试获取视频字幕
        let transcriptContent = '';
        try {
          const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'zh' });
          transcriptContent = transcript.map(t => t.text).join(' ');
        } catch (zhError) {
          try {
            const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
            transcriptContent = transcript.map(t => t.text).join(' ');
          } catch (enError) {
            console.warn(`No transcript found for ${videoId}, using description.`);
          }
        }

        videos.push({
          id: videoId,
          title: item.snippet?.title || 'Untitled',
          description: item.snippet?.description || '',
          content: transcriptContent || item.snippet?.description || '', // 将字幕或描述存入 content
          publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
          thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || undefined,
        });
      }
    }

    return videos;
  } catch (error) {
    console.error('Failed to fetch channel videos:', error);
    throw error;
  }
}

/**
 * 获取视频详情（包括字幕）
 */
export async function getVideoDetails(videoId: string) {
  try {
    const response = await youtube.videos.list({
      part: ['snippet', 'contentDetails'],
      id: [videoId],
    });

    if (!response.data.items || response.data.items.length === 0) {
      return null;
    }

    const video = response.data.items[0];

    return {
      id: videoId,
      title: video.snippet?.title || 'Untitled',
      description: video.snippet?.description || '',
      publishedAt: video.snippet?.publishedAt || new Date().toISOString(),
      thumbnailUrl: video.snippet?.thumbnails?.high?.url,
    };
  } catch (error) {
    console.error('Failed to fetch video details:', error);
    return null;
  }
}
