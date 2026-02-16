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
        const postId = searchParams.get('id');
        const sort = searchParams.get('sort') || 'latest'; // 'latest' | 'trending'
        const userId = searchParams.get('userId');
        const followingUserId = searchParams.get('followingUserId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        if (postId) {
            const { data: post, error } = await supabase
                .from('forum_posts')
                .select(`
                    *,
                    users!forum_posts_user_id_fkey(id, email)
                `)
                .eq('id', postId)
                .single();

            if (error) throw error;
            return NextResponse.json({ posts: post ? [post] : [], total: post ? 1 : 0 });
        }

        let query = supabase
            .from('forum_posts')
            .select(`
        *,
        users!forum_posts_user_id_fkey(id, email)
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

        if (error) {
            console.error('Supabase error fetching posts:', error);
            throw error;
        }

        return NextResponse.json({
            posts: data || [],
            total: count || 0,
            page,
            limit
        });
    } catch (error: any) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({
            error: 'Failed to fetch posts',
            details: error.message
        }, { status: 500 });
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
            finalTags = Array.from(new Set([...finalTags, ...aiTags]));
        } catch (err) {
            console.error('AI tagging failed:', err);
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
                is_ai_generated: false
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error creating post:', error);
            throw error;
        }

        return NextResponse.json({ post: data });
    } catch (error: any) {
        console.error('Error creating post:', error);
        return NextResponse.json({
            error: 'Failed to create post',
            details: error.message
        }, { status: 500 });
    }
}

// DELETE: 删除帖子 (仅限管理员 admin)
export async function DELETE(request: NextRequest) {
    try {
        const supabase = getSupabase();
        const { searchParams } = new URL(request.url);
        const postId = searchParams.get('id');
        const userId = searchParams.get('userId'); // 这里的 userId 应该从服务端 session/token 获取更安全，目前保持一致

        if (!postId || !userId) {
            return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
        }

        // 验证用户角色
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (user?.role !== 'admin') {
            return NextResponse.json({ error: '权限不足，仅管理员可删帖' }, { status: 403 });
        }

        const { error } = await supabase
            .from('forum_posts')
            .delete()
            .eq('id', postId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting post:', error);
        return NextResponse.json({ error: '删除失败', details: error.message }, { status: 500 });
    }
}

// PATCH: 编辑帖子 (仅限发帖人本人)
export async function PATCH(request: NextRequest) {
    try {
        const supabase = getSupabase();
        const body = await request.json();
        const { id, userId, title, content, images, tags } = body;

        if (!id || !userId) {
            return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
        }

        // 验证所有权
        const { data: post } = await supabase
            .from('forum_posts')
            .select('user_id')
            .eq('id', id)
            .single();

        if (post?.user_id !== userId) {
            return NextResponse.json({ error: '权限不足，仅发帖人可编辑' }, { status: 403 });
        }

        const { data, error } = await supabase
            .from('forum_posts')
            .update({
                title,
                content,
                images,
                tags,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ post: data });
    } catch (error: any) {
        console.error('Error updating post:', error);
        return NextResponse.json({ error: '更新失败', details: error.message }, { status: 500 });
    }
}
