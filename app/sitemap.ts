import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // 需要使用 Service Role Key 以绕过 RLS 抓取所有内容
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://ai-news-feed-rose.vercel.app';

    // 1. 静态路由
    const staticRoutes = [
        '',
        '/recommendations',
        '/forum',
        '/sources',
        '/profile',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // 2. 动态文章路由
    let articleRoutes: any[] = [];
    try {
        const { data: articles } = await supabase
            .from('news_items')
            .select('id, updated_at, created_at')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(500); // 搜索引擎通常抓取前 500-1000 条

        if (articles) {
            articleRoutes = articles.map((item) => ({
                url: `${baseUrl}/article/${item.id}`,
                lastModified: new Date(item.updated_at || item.created_at),
                changeFrequency: 'weekly' as const,
                priority: 0.6,
            }));
        }
    } catch (error) {
        console.error('Sitemap generation error:', error);
    }

    return [...staticRoutes, ...articleRoutes];
}
