import { Suspense } from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import ForumClient from './ForumClient';

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
    { searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const params = await searchParams;
    const postId = params.item as string;

    if (!postId) {
        return {
            title: '社区论坛 - 数位 Buffet',
            description: '加入讨论，分享您的智慧与洞见。',
        };
    }

    const supabase = await createSupabaseServerClient();
    const { data: post } = await supabase
        .from('forum_posts')
        .select(`
            id, 
            title, 
            content, 
            images,
            users (email)
        `)
        .eq('id', postId)
        .single();

    if (!post) {
        return {
            title: '话题未找到 - 社区论坛',
        };
    }

    const title = post.title;
    const description = post.content.slice(0, 160);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-news-feed-rose.vercel.app';
    const authorName = (post.users as any)?.email?.split('@')[0] || '匿名用户';

    // 生成动态分享图 URL
    const ogImageUrl = new URL(`${baseUrl}/api/og`);
    ogImageUrl.searchParams.set('title', title);
    if (post.images && post.images.length > 0) {
        ogImageUrl.searchParams.set('image', post.images[0]);
    }
    ogImageUrl.searchParams.set('source', `@${authorName}`);

    return {
        title: `${title} - 社区论坛`,
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

export default function Page() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
            </div>
        }>
            <ForumClient />
        </Suspense>
    );
}
