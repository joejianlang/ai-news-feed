import { google } from 'googleapis';
import type { YouTubeVideo } from '@/types';
import * as fs from 'fs';
import * as path from 'path';

// 手动读取 .env.local 文件
function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env.local');

  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  } catch (error) {
    console.error('Failed to load .env.local in youtube-channel:', error);
  }
}

// 加载环境变量
loadEnvFile();

console.log('YouTube API Key exists:', !!process.env.YOUTUBE_API_KEY);
console.log('YouTube API Key length:', process.env.YOUTUBE_API_KEY?.length);

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
      if (item.snippet && item.contentDetails) {
        videos.push({
          id: item.contentDetails.videoId || '',
          title: item.snippet.title || 'Untitled',
          description: item.snippet.description || '',
          publishedAt: item.snippet.publishedAt || new Date().toISOString(),
          thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || undefined,
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
