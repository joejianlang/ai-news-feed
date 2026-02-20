import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/server';

async function checkAdmin(authUser: any) {
    const supabase = authUser.source === 'legacy'
        ? await createSupabaseAdminClient()
        : await createSupabaseServerClient();
    const { data } = await supabase.from('users').select('role').eq('id', authUser.id).single();
    return data?.role === 'admin';
}

async function getOrCreateOriginalSource(): Promise<string> {
    const supabase = await createSupabaseAdminClient();
    const sourceName = '数位 Buffet';

    const { data: existingSource } = await supabase
        .from('news_sources')
        .select('id')
        .eq('name', sourceName)
        .single();

    if (existingSource) return existingSource.id;

    const { data: newSource, error } = await supabase
        .from('news_sources')
        .insert({
            name: sourceName,
            url: 'https://ai-news-feed-rose.vercel.app',
            source_type: 'web',
            fetch_interval: 0,
            commentary_style: '原创深度',
            is_active: false,
        })
        .select('id')
        .single();

    if (error) throw new Error(`创建原创来源失败: ${error.message}`);
    return newSource.id;
}

async function getDeepDiveCategoryId(): Promise<string | null> {
    const supabase = await createSupabaseAdminClient();
    const { data } = await supabase.from('categories').select('id').eq('name', '深度').single();
    return data?.id || null;
}

function extractFirstImage(content: string): string | null {
    const mdMatch = content.match(/!\[.*?\]\((.*?)\)/);
    if (mdMatch) return mdMatch[1];
    const htmlMatch = content.match(/<img.*?src=["'](.*?)["'].*?>/i);
    if (htmlMatch) return htmlMatch[1];
    return null;
}

// GET: 获取原创文章列表
export async function GET(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    try {
        const supabase = await createSupabaseAdminClient();
        const sourceId = await getOrCreateOriginalSource();
        const { data: articles, error } = await supabase
            .from('news_items')
            .select('*')
            .eq('source_id', sourceId)
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ articles });
    } catch (error) {
        return NextResponse.json({ error: '获取文章列表失败' }, { status: 500 });
    }
}

// POST: 创建文章
export async function POST(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    try {
        const body = await request.json();
        const { title, content, summary, imageUrl, authorName } = body;
        if (!title || !content) {
            return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 });
        }
        const supabase = await createSupabaseAdminClient();
        const sourceId = await getOrCreateOriginalSource();
        const categoryId = await getDeepDiveCategoryId();
        const { data: article, error } = await supabase
            .from('news_items')
            .insert({
                source_id: sourceId,
                original_url: `https://ai-news-feed-rose.vercel.app/article/${Date.now()}`,
                title,
                content,
                content_type: 'article',
                ai_summary: summary || null,
                ai_commentary: null,
                image_url: imageUrl || extractFirstImage(content) || null,
                category_id: categoryId,
                author_name: authorName || null,
                is_published: true,
                published_at: new Date().toISOString(),
                batch_completed_at: new Date().toISOString(),
            })
            .select()
            .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, article });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
    }
}

// PUT: 更新文章
export async function PUT(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    try {
        const body = await request.json();
        const { id, title, content, summary, imageUrl, authorName, isPublished, isPinned } = body;
        if (!id) return NextResponse.json({ error: '缺少文章 ID' }, { status: 400 });

        const updates: any = { updated_at: new Date().toISOString() };
        if (title !== undefined) updates.title = title;
        if (content !== undefined) updates.content = content;
        if (summary !== undefined) updates.ai_summary = summary;
        if (imageUrl !== undefined) updates.image_url = imageUrl || extractFirstImage(content || '');
        if (authorName !== undefined) updates.author_name = authorName;
        if (isPublished !== undefined) updates.is_published = isPublished;
        if (isPinned !== undefined) updates.is_pinned = isPinned;

        const supabase = await createSupabaseAdminClient();
        const { data: article, error } = await supabase
            .from('news_items').update(updates).eq('id', id).select().single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, article });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
    }
}

// DELETE: 删除文章
export async function DELETE(request: NextRequest) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: '缺少文章 ID' }, { status: 400 });
        const supabase = await createSupabaseAdminClient();
        const { error } = await supabase.from('news_items').delete().eq('id', id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
    }
}
