import { supabase } from './client';
import type { NewsSource, NewsItem, Category, User, UserFollow, Comment, CommentWithReplies } from '@/types';

// 新闻源相关查询
export async function getNewsSources() {
  const { data, error } = await supabase
    .from('news_sources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as NewsSource[];
}

export async function getActiveNewsSources() {
  const { data, error } = await supabase
    .from('news_sources')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;
  return data as NewsSource[];
}

export async function createNewsSource(source: Omit<NewsSource, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('news_sources')
    .insert([source])
    .select()
    .single();

  if (error) throw error;
  return data as NewsSource;
}

export async function updateNewsSource(id: string, updates: Partial<NewsSource>) {
  const { data, error } = await supabase
    .from('news_sources')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as NewsSource;
}

export async function deleteNewsSource(id: string) {
  const { error } = await supabase
    .from('news_sources')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// 新闻条目相关查询（按发布时间混合排序，只返回已发布的）
export async function getNewsItems(limit = 50) {
  const { data, error } = await supabase
    .from('news_items')
    .select(`
      *,
      source:news_sources(*)
    `)
    .eq('is_published', true) // 只返回已发布的新闻
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return data as NewsItem[];
}

// 按批次分组获取新闻（用于前端按"更新时间"分组显示）
export async function getNewsItemsByBatch(limit = 300, categoryId?: string, cityTag?: string, excludeSourceIds?: string[]) {
  let query = supabase
    .from('news_items')
    .select(`
      *,
      source:news_sources(*),
      categories(*)
    `)
    .eq('is_published', true);

  // 如果指定了要排除的来源
  if (excludeSourceIds && excludeSourceIds.length > 0) {
    query = query.not('source_id', 'in', `(${excludeSourceIds.join(',')})`);
  }

  // 如果指定了分类，添加分类过滤
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  // 如果指定了城市标签，添加标签过滤
  if (cityTag) {
    // 使用 Postgres 的数组包含操作符
    query = query.contains('tags', [cityTag]);
  }

  const { data, error } = await query
    .order('is_pinned', { ascending: false })
    .order('batch_completed_at', { ascending: false, nullsFirst: false })
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return data as NewsItem[];
}

// 批量发布某个批次的新闻
export async function publishBatch(batchId: string, completedAt: string) {
  const { data, error } = await supabase
    .from('news_items')
    .update({
      is_published: true,
      batch_completed_at: completedAt
    })
    .eq('fetch_batch_id', batchId)
    .select();

  if (error) throw error;
  return data as NewsItem[];
}

// 检查新闻是否已存在（根据URL或video_id）
export async function checkNewsItemExists(url: string, videoId?: string): Promise<boolean> {
  // 如果是视频，优先用video_id检查（更准确）
  if (videoId) {
    const { data, error } = await supabase
      .from('news_items')
      .select('id')
      .eq('video_id', videoId)
      .maybeSingle();

    if (data) return true;
  }

  // 否则用URL检查
  const { data, error } = await supabase
    .from('news_items')
    .select('id')
    .eq('original_url', url)
    .maybeSingle();

  return !!data;
}

export async function createNewsItem(item: Omit<NewsItem, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('news_items')
    .insert([item])
    .select()
    .single();

  if (error) throw error;
  return data as NewsItem;
}

export async function updateLastFetchedTime(sourceId: string) {
  const { error } = await supabase
    .from('news_sources')
    .update({ last_fetched_at: new Date().toISOString() })
    .eq('id', sourceId);

  if (error) throw error;
}


export async function checkSimilarNewsItem(title: string, url: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('find_similar_news', {
    check_title: title,
    check_url: url,
    time_window_hours: 24,
    similarity_threshold: 0.6
  });

  if (error) {
    console.error('Error checking similarity:', error);
    // If RPC fails (e.g. migration not run), fall back to exact URL check
    return checkNewsItemExists(url);
  }

  return data && data.length > 0;
}

// 分类相关查询
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Category[];
}

// 用户相关查询
export async function createUser(email: string, username: string, passwordHash: string) {
  const { data, error } = await supabase
    .from('users')
    .insert([{ email, username, password_hash: passwordHash }])
    .select('id, email, username, created_at, updated_at')
    .single();

  if (error) throw error;
  return data as User;
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // 未找到
    throw error;
  }
  return data;
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, username, display_name, avatar_url, phone, bio, role, is_muted, is_suspended, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as User;
}

export async function verifyCode(email: string, code: string) {
  return verifyRegistrationCode(email, code);
}

// 关注相关查询
export async function followSource(userId: string, sourceId: string) {
  const { data, error } = await supabase
    .from('user_source_follows')
    .insert([{ user_id: userId, source_id: sourceId }])
    .select()
    .single();

  if (error) {
    console.error('followSource error:', error);
    throw error;
  }
  return data as UserFollow;
}

export async function unfollowSource(userId: string, sourceId: string) {
  const { error } = await supabase
    .from('user_source_follows')
    .delete()
    .eq('user_id', userId)
    .eq('source_id', sourceId);

  if (error) throw error;
}

export async function getUserFollows(userId: string) {
  const { data, error } = await supabase
    .from('user_source_follows')
    .select(`
      *,
      source:news_sources(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function isFollowing(userId: string, sourceId: string) {
  const { data, error } = await supabase
    .from('user_source_follows')
    .select('id')
    .eq('user_id', userId)
    .eq('source_id', sourceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return false; // 未找到
    throw error;
  }
  return !!data;
}

export async function getFollowingNewsItems(userId: string, limit = 300) {
  // 先获取用户关注的source_id列表
  const { data: follows, error: followError } = await supabase
    .from('user_source_follows')
    .select('source_id')
    .eq('user_id', userId);

  if (followError) throw followError;

  // 如果没有关注任何源，返回空数组
  if (!follows || follows.length === 0) {
    return [];
  }

  const sourceIds = follows.map(f => f.source_id);

  // 查询这些源的新闻（按发布时间混合排序）
  const { data, error } = await supabase
    .from('news_items')
    .select(`
      *,
      source:news_sources(*)
    `)
    .in('source_id', sourceIds)
    .eq('is_published', true)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return data as NewsItem[];
}

// ============================================
// 评论相关查询
// ============================================

function buildCommentTree(comments: Comment[]): CommentWithReplies[] {
  const commentMap = new Map<string, CommentWithReplies>();
  const rootComments: CommentWithReplies[] = [];

  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  comments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.id)!;
    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      commentMap.get(comment.parent_id)!.replies.push(commentWithReplies);
    } else {
      rootComments.push(commentWithReplies);
    }
  });

  return rootComments;
}

export async function getCommentsByNewsItem(
  newsItemId: string,
  currentUserId?: string
): Promise<CommentWithReplies[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      user:users(id, username)
    `)
    .eq('news_item_id', newsItemId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // 获取每条评论的点赞数
  const commentIds = data?.map(c => c.id) || [];
  let likeCounts: Record<string, number> = {};
  let userLikes = new Set<string>();

  if (commentIds.length > 0) {
    // 批量获取点赞数
    const { data: likesData } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .in('comment_id', commentIds);

    if (likesData) {
      likesData.forEach(like => {
        likeCounts[like.comment_id] = (likeCounts[like.comment_id] || 0) + 1;
      });
    }

    // 获取当前用户的点赞状态
    if (currentUserId) {
      const { data: userLikesData } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', currentUserId)
        .in('comment_id', commentIds);

      if (userLikesData) {
        userLikes = new Set(userLikesData.map(l => l.comment_id));
      }
    }
  }

  const commentsWithLikes = data?.map(comment => ({
    ...comment,
    like_count: likeCounts[comment.id] || 0,
    is_liked: userLikes.has(comment.id),
  })) || [];

  return buildCommentTree(commentsWithLikes as Comment[]);
}

export async function createComment(comment: {
  news_item_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
}): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert([comment])
    .select(`
      *,
      user:users(id, username)
    `)
    .single();

  if (error) throw error;
  return { ...data, like_count: 0, is_liked: false } as Comment;
}

export async function getCommentById(id: string): Promise<Comment | null> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Comment;
}

export async function updateComment(
  id: string,
  updates: { content: string }
): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      user:users(id, username)
    `)
    .single();

  if (error) throw error;
  return data as Comment;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .update({ is_deleted: true, content: '[该评论已被删除]' })
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// 评论点赞相关查询
// ============================================

export async function likeComment(commentId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('comment_likes')
    .insert([{ comment_id: commentId, user_id: userId }]);

  if (error && error.code !== '23505') throw error;
}

export async function unlikeComment(commentId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('comment_likes')
    .delete()
    .eq('comment_id', commentId)
    .eq('user_id', userId);

  if (error) throw error;
}
// ============================================
// 验证码相关查询
// ============================================

export async function saveVerificationCode(email: string, code: string) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10分钟有效期

  const { data, error } = await supabase
    .from('verification_codes')
    .insert([{ email, code, expires_at: expiresAt.toISOString() }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function verifyRegistrationCode(email: string, code: string) {
  const { data, error } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return false;

  // 标记为已使用
  await supabase
    .from('verification_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', data.id);

  return true;
}

// ============================================
// 广告相关查询
// ============================================

import type { AdItem } from '@/types';

export async function getActiveAds() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .eq('status', 'active')
    .lte('start_date', now)
    .gte('end_date', now)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as AdItem[];
}

export async function getUserAds(userId: string) {
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as AdItem[];
}

export async function getPendingAds() {
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .in('status', ['pending', 'unpaid'])
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as AdItem[];
}

export async function createAd(ad: Omit<AdItem, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('ads')
    .insert([ad])
    .select()
    .single();

  if (error) throw error;
  return data as AdItem;
}

export async function updateAdStatus(id: string, status: AdItem['status'], reason?: string) {
  const updates: any = { status };
  if (reason) updates.rejection_reason = reason;

  // 当移动到支付成功(active)状态时，设置开始和结束日期
  if (status === 'active') {
    const now = new Date();
    updates.start_date = now.toISOString();
    updates.payment_status = 'paid';

    // 自动计算结束日期
    const { data: adData } = await supabase
      .from('ads')
      .select('duration_days')
      .eq('id', id)
      .single();

    if (adData?.duration_days) {
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + adData.duration_days);
      updates.end_date = endDate.toISOString();
    }
  }

  const { data, error } = await supabase
    .from('ads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as AdItem;
}

export async function getSystemSetting(key: string) {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) throw error;
  return data?.value;
}

export async function getNewsItemById(id: string) {
  const { data, error } = await supabase
    .from('news_items')
    .select(`
      *,
      source:news_sources(*),
      categories(*)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as NewsItem | null;
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as User[];
}

export async function updateUserRole(userId: string, role: 'admin' | 'user') {
  const { data, error } = await supabase
    .from('users')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

export async function deleteUser(userId: string) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) throw error;
  return true;
}

export async function updateUserStatus(userId: string, updates: { is_muted?: boolean; is_suspended?: boolean }) {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}
