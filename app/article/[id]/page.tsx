import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import ArticleDetail from '@/components/ArticleDetail';

interface Props {
    params: { id: string };
}

// 动态生成元数据 (SEO 核心)
export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: item } = await supabase
        .from('news_items')
        .select(`
      id, 
      title, 
      ai_summary, 
      image_url, 
      author_name,
      source:news_sources(name)
    `)
        .eq('id', id)
        .single();

    if (!item) {
        return {
            title: '文章未找到',
            description: '您查看的文章不存在或已被删除。',
        };
    }

    const title = item.title;
    const description = item.ai_summary || item.title;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-news-feed-rose.vercel.app';

    // 生成动态分享图 URL
    const ogImageUrl = new URL(`${baseUrl}/api/og`);
    ogImageUrl.searchParams.set('title', title);
    if (item.image_url) ogImageUrl.searchParams.set('image', item.image_url);

    // 处理 source 可能返回数组的情况
    const sourceName = Array.isArray(item.source)
        ? item.source[0]?.name
        : (item.source as any)?.name;
    if (sourceName) ogImageUrl.searchParams.set('source', sourceName);

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            images: [ogImageUrl.toString()],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImageUrl.toString()],
        },
    };
}

export default async function ArticlePage({ params }: Props) {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    // 获取完整文章数据
    const { data: article } = await supabase
        .from('news_items')
        .select('*, source:news_sources(id, name), categories(id, name)')
        .eq('id', id)
        .single();

    if (!article) {
        notFound();
    }

    return <ArticleDetail article={article} />;
}
