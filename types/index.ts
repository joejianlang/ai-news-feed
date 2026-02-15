export type SourceType = 'web' | 'youtube' | 'youtube_channel' | 'rss' | 'youtube_trending';
export type ContentType = 'article' | 'video';

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export type TestStatus = 'pending' | 'passed' | 'failed';

export interface TestResult {
  success: boolean;
  itemCount?: number;
  duration?: number;
  sampleTitles?: string[];
  error?: string;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  source_type: SourceType;
  fetch_interval: number;
  commentary_style: string;
  is_active: boolean;
  last_fetched_at?: string;
  youtube_channel_id?: string;
  category_id?: string;
  test_status?: TestStatus;
  test_result?: TestResult;
  tested_at?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface RecommendedSource {
  id: string;
  name: string;
  url: string;
  source_type: SourceType;
  category_id?: string;
  youtube_channel_id?: string;
  fetch_interval: number;
  commentary_style: string;
  recommended_reason?: string;
  popularity_score?: number;
  subscriber_count?: number;
  view_count?: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  role?: 'admin' | 'user';
  is_muted?: boolean;
  is_suspended?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserFollow {
  id: string;
  user_id: string;
  source_id: string;
  created_at: string;
}

export interface NewsItem {
  id: string;
  source_id: string;
  original_url: string;
  title: string;
  content?: string;
  content_type: ContentType;
  ai_summary?: string;
  ai_commentary?: string;
  published_at?: string;
  video_id?: string;
  image_url?: string;
  comment_count?: number;
  fetch_batch_id?: string; // 抓取批次ID
  is_published?: boolean; // 是否已发布（false为草稿状态）
  batch_completed_at?: string; // 批次完成时间（用于显示"更新时间"）
  location?: string | null; // 新闻涉及的城市
  tags?: string[]; // 标签列表
  is_hot?: boolean; // 是否为热点新闻
  is_pinned?: boolean; // 是否顶置
  author_name?: string | null; // 自定义署名
  created_at: string;
  updated_at: string;
  source?: NewsSource;
  categories?: Category;
}

export interface ScrapedContent {
  title: string;
  content: string;
  url: string;
  publishedAt?: Date;
  contentType: ContentType;
  videoId?: string;
  imageUrl?: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  content?: string;
  publishedAt: string;
  thumbnailUrl?: string;
}

// 评论相关类型
export interface Comment {
  id: string;
  news_item_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user?: Pick<User, 'id' | 'username'>;
  like_count?: number;
  is_liked?: boolean;
}

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
}

// 广告相关类型
export type AdScope = 'local' | 'city' | 'province' | 'national';
export type AdStatus = 'pending' | 'active' | 'expired' | 'rejected' | 'unpaid' | 'verifying_payment' | 'offline';

export interface AdItem {
  id: string;
  user_id: string;
  title: string;
  content: string;
  raw_content?: string;
  image_url?: string;
  link_url?: string;
  contact_info?: string;
  scope: AdScope;
  target_city?: string;
  target_province?: string;
  duration_days: number;
  price_total: number;
  status: AdStatus;
  payment_status: 'unpaid' | 'verifying' | 'paid';
  payment_method?: 'online' | 'manual';
  payment_voucher_url?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  start_date?: string;
  end_date?: string;
}
