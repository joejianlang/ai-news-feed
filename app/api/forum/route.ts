import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { suggestForumTags } from '@/lib/ai/forum';

function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return createClient(supabaseUrl, supabaseKey);
}

// GET: 获取帖子列表
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabase();
        const { searchParams } = new URL(request.url);
        const sort = searchParams.get('sort') || 'latest'; // 'latest' | 'trending'
        const userId = searchParams.get('userId');
        const followingUserId = searchParams.get('followingUserId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let query = supabase
            .from('forum_posts')
            .select(`
        *,
        users:user_id(id, email)
      `, { count: 'exact' })
            .eq('status', 'active');

        // 如果是查看关注的人的帖子
        if (followingUserId) {
            const { data: follows } = await supabase
                .from('user_follows')
                .select('following_id')
                .eq('follower_id', followingUserId);

            const followingIds = follows?.map(f => f.following_id) || [];
            if (followingIds.length > 0) {
                query = query.in('user_id', followingIds);
            } else {
                return NextResponse.json({ posts: [], total: 0, page, limit });
            }
        }

        // 如果是查看某用户的帖子
        if (userId) {
            query = query.eq('user_id', userId);
        }

        // 排序
        if (sort === 'trending') {
            query = query.order('likes_count', { ascending: false });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            posts: data || [],
            total: count || 0,
            page,
            limit
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

// POST: 创建新帖子
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabase();
        const body = await request.json();

        const { userId, title, content, images, videoUrl, tags: manualTags } = body;

        if (!title || !content) {
            return NextResponse.json({ error: '标题和内容必填' }, { status: 400 });
        }

        // AI 自动打标签
        let finalTags = manualTags || [];
        try {
            const aiTags = await suggestForumTags(title, content);
            // 合并标签并去重
            finalTags = Array.from(new Set([...finalTags, ...aiTags]));
        } catch (err) {
            console.error('AI tagging failed, using manual tags only:', err);
        }

        const { data, error } = await supabase
            .from('forum_posts')
            .insert({
                user_id: userId,
                title,
                content,
                images: images || [],
                video_url: videoUrl,
                tags: finalTags,
                is_ai_generated: false // 标记为用户发布
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ post: data });
    } catch (error) {
        console.error('Error creating post:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}
