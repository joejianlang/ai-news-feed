'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import {
    MessageSquare,
    Search,
    Trash2,
    Pin,
    Flag,
    MoreVertical,
    ChevronLeft,
    Eye,
    LayoutGrid
} from 'lucide-react';

interface Post {
    id: string;
    title: string;
    content: string;
    author_name: string;
    status: 'active' | 'pinned' | 'hidden';
    comment_count: number;
    like_count: number;
    created_at: string;
}

export default function ForumModerationPage() {
    const { user, isLoading: isUserLoading } = useUser();
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isUserLoading && user?.role !== 'admin') {
            router.push('/');
        } else {
            loadPosts();
        }
    }, [user, isUserLoading, router]);

    const loadPosts = async () => {
        try {
            setLoading(true);
            const url = '/api/admin/forum?limit=100';
            const response = await fetch(url);
            const data = await response.json();

            if (data.posts) {
                setPosts(data.posts);
            }
        } catch (error) {
            console.error('Failed to load forum posts:', error);
        } finally {
            setLoading(false);
        }
    };

    if (isUserLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-6 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/admin')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <LayoutGrid className="w-7 h-7 text-violet-500" />
                            社区内容治理
                        </h1>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="搜索帖子、用户..."
                            className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-teal-500 w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-8">
                <div className="space-y-4">
                    {posts.map((post) => (
                        <div key={post.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:border-violet-500/50 transition-all group">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">POST ID: {post.id}</span>
                                        {post.status === 'pinned' && (
                                            <span className="bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-500 px-2 py-0.5 rounded text-[9px] font-black uppercase">置顶</span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-violet-600 transition-colors">{post.title}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">{post.content}</p>

                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                                                <span className="text-[8px]">{post.author_name[0]}</span>
                                            </div>
                                            {post.author_name}
                                        </div>
                                        <div className="text-xs text-slate-400 font-bold flex items-center gap-1">
                                            <MessageSquare className="w-3.5 h-3.5" /> {post.comment_count} 评论
                                        </div>
                                        <div className="text-xs text-slate-400 font-bold">
                                            {new Date(post.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-violet-500 hover:text-white rounded-2xl transition-all" title="置顶帖子">
                                        <Pin className="w-5 h-5" />
                                    </button>
                                    <button className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-rose-500 hover:text-white rounded-2xl transition-all" title="删除违规内容">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                    <button className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all" title="查看正文">
                                        <Eye className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
