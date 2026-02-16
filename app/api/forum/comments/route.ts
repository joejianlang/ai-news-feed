import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return createClient(supabaseUrl, supabaseKey);
}

// GET: 获取帖子评论
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabase();
        const { searchParams } = new URL(request.url);
        const postId = searchParams.get('postId');

        if (!postId) {
            return NextResponse.json({ error: '缺少帖子ID' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('forum_comments')
            .select(`
        *,
        users!forum_comments_user_id_fkey(id, email)
      `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Supabase error fetching comments:', error);
            throw error;
        }

        return NextResponse.json({ comments: data || [] });
    } catch (error: any) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({
            error: 'Failed to fetch comments',
            details: error.message
        }, { status: 500 });
    }
}

// POST: 添加评论
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabase();
        const body = await request.json();
        const { postId, userId, content, images, parentId } = body;

        if (!postId || !userId || !content) {
            return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
        }

        // 检查用户状态
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('is_muted, is_suspended')
            .eq('id', userId)
            .single();

        if (user?.is_suspended) {
            return NextResponse.json({ error: '账号已被封禁' }, { status: 403 });
        }

        if (user?.is_muted) {
            return NextResponse.json({ error: '您已被禁言' }, { status: 403 });
        }

        const { data, error } = await supabase
            .from('forum_comments')
            .insert({
                post_id: postId,
                user_id: userId,
                content,
                images: images || [],
                parent_id: parentId || null
            })
            .select(`
        *,
        users!forum_comments_user_id_fkey(id, email)
      `)
            .single();

        if (error) {
            console.error('Supabase error creating comment:', error);
            throw error;
        }

        return NextResponse.json({ comment: data });
    } catch (error: any) {
        console.error('Error creating comment:', error);
        return NextResponse.json({
            error: 'Failed to create comment',
            details: error.message
        }, { status: 500 });
    }
}
