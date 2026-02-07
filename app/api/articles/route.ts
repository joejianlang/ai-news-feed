import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 验证管理员权限
async function verifyAdmin(request: NextRequest): Promise<{ valid: boolean; userId?: string }> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return { valid: false };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

        // 查询用户角色
        const { data: user } = await supabase
            .from('users')
            .select('id, role')
            .eq('id', decoded.userId)
            .single();

        if (user?.role !== 'admin') {
            return { valid: false };
        }

        return { valid: true, userId: decoded.userId };
    } catch {
        return { valid: false };
    }
}

// 获取或创建"原创文章"来源
async function getOrCreateOriginalSource(): Promise<string> {
    const sourceName = '原创文章';

    // 检查是否已存在
    const { data: existingSource } = await supabase
        .from('news_sources')
        .select('id')
        .eq('name', sourceName)
        .single();

    if (existingSource) {
        return existingSource.id;
    }

    // 创建新的来源
    const { data: newSource, error } = await supabase
        .from('news_sources')
        .insert({
            name: sourceName,
            url: 'https://ai-news-feed-rose.vercel.app',
            source_type: 'web',
            fetch_interval: 0,
            commentary_style: '原创深度',
            is_active: false, // 不参与自动抓取
        })
        .select('id')
        .single();

    if (error) {
        throw new Error(`创建原创来源失败: ${error.message}`);
    }

    return newSource.id;
}

// 获取"深度"分类 ID
async function getDeepDiveCategoryId(): Promise<string | null> {
    const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('name', '深度')
        .single();

    return category?.id || null;
}

// POST: 创建文章
export async function POST(request: NextRequest) {
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
        return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, content, summary, imageUrl } = body;

        if (!title || !content) {
            return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 });
        }

        // 获取原创来源 ID
        const sourceId = await getOrCreateOriginalSource();

        // 获取深度分类 ID
        const categoryId = await getDeepDiveCategoryId();

        // 创建文章
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
                image_url: imageUrl || null,
                category_id: categoryId,
                is_published: true,
                published_at: new Date().toISOString(),
                batch_completed_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('创建文章失败:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, article });
    } catch (error) {
        console.error('创建文章异常:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '未知错误' },
            { status: 500 }
        );
    }
}

// GET: 获取原创文章列表
export async function GET(request: NextRequest) {
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
        return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    try {
        const sourceId = await getOrCreateOriginalSource();

        const { data: articles, error } = await supabase
            .from('news_items')
            .select('*')
            .eq('source_id', sourceId)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ articles });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '未知错误' },
            { status: 500 }
        );
    }
}
