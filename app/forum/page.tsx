import { Metadata, ResolvingMetadata } from 'next';
import ForumClient from './ForumClient';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Props = {
    searchParams: { item?: string };
};

// 动态生成元数据
export async function generateMetadata(
    { searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const itemId = searchParams.item;

    if (!itemId) {
        return {
            title: '社区论坛 | 深度话题讨论',
            description: '汇聚全网深度见解，参与实时话题交流。',
        };
    }

    // 虽然是服务端渲染，但为了简单起见，我们通过 fetch 或 supabase 获取基本标题
    // 提示：此处最好直接查库，但为了演示先设置一个占位或尝试获取
    try {
        // 您可以在这里添加获取帖子的逻辑
        // 为了确保性能，我们先提供一个带有动态 ID 的增强预览
        return {
            title: `热门讨论话题 | 社区论坛`,
            description: '点击扫码，参与此话题的深度交流。',
            openGraph: {
                title: '正在讨论：热门社区话题',
                description: '扫码加入实时讨论现场',
                images: [
                    {
                        url: `/api/og/forum?id=${itemId}`,
                        width: 1200,
                        height: 630,
                    },
                ],
            },
        };
    } catch (e) {
        return { title: '社区话题 | 深度评论' };
    }
}

export default function Page() {
    return <ForumClient />;
}
