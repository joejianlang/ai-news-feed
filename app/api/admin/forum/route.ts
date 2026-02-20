import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, checkAdmin } from '@/lib/auth/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

// GET: 获取全平台帖子 (Admin)
export async function GET(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser.id))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = await createSupabaseAdminClient();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        // 不使用外键 join（forum_posts 没有正式外键到 users）
        let query = supabase
            .from('forum_posts')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        // 批量查询帖子作者信息
        const posts = data || [];
        const userIds = [...new Set(posts.map((p: any) => p.user_id).filter(Boolean))];
        let userMap: Record<string, any> = {};
        if (userIds.length > 0) {
            const { data: usersData } = await supabase
                .from('users')
                .select('id, email, name')
                .in('id', userIds);
            (usersData || []).forEach((u: any) => { userMap[u.id] = u; });
        }

        const enrichedPosts = posts.map((p: any) => ({
            ...p,
            author_name: p.author_name || userMap[p.user_id]?.name || userMap[p.user_id]?.email || '匿名',
        }));

        return NextResponse.json({ posts: enrichedPosts, total: count || 0, page, limit });
    } catch (error: any) {
        console.error('Admin forum fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: 管理员删帖
export async function DELETE(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser.id))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = await createSupabaseAdminClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });

        const { error } = await supabase.from('forum_posts').delete().eq('id', id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Admin forum delete error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: 更新帖子属性（置顶 / 隐藏）
export async function PATCH(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser.id))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = await createSupabaseAdminClient();
        const body = await request.json();
        const { id, is_pinned, status } = body;

        if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });

        const updates: any = {};
        if (is_pinned !== undefined) updates.is_pinned = is_pinned;
        if (status !== undefined) updates.status = status;

        const { data, error } = await supabase
            .from('forum_posts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ post: data });
    } catch (error: any) {
        console.error('Admin forum update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
