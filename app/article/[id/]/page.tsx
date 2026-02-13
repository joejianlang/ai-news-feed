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
    const imageUrl = item.image_url || '/og-image.jpg';

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            images: [imageUrl],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
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
