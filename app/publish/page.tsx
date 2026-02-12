'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/contexts/UserContext';
import { useRouter } from 'next/navigation';
import {
    FileText,
    Plus,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Pin,
    ExternalLink,
    Search,
    Filter,
    MoreVertical,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { formatTime } from '@/app/page';

interface Article {
    id: string;
    title: string;
    created_at: string;
    is_published: boolean;
    is_pinned: boolean;
    ai_summary: string | null;
}

export default function ArticleManagementPage() {
    const { user } = useUser();
    const router = useRouter();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.push('/');
            return;
        }
        loadArticles();
    }, [user]);

    const loadArticles = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/articles');
            const data = await res.json();
            if (data.articles) {
                setArticles(data.articles);
            }
        } catch (error) {
            console.error('Failed to load articles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePublish = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/articles', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isPublished: !currentStatus }),
            });
            if (res.ok) {
                setArticles(articles.map(a => a.id === id ? { ...a, is_published: !currentStatus } : a));
            }
        } catch (error) {
            console.error('Failed to toggle publish status:', error);
        }
    };

    const handleTogglePin = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/articles', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isPinned: !currentStatus }),
            });
            if (res.ok) {
                setArticles(articles.map(a => a.id === id ? { ...a, is_pinned: !currentStatus } : a));
            }
        } catch (error) {
            console.error('Failed to toggle pin status:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这篇文章吗？此操作不可撤销。')) return;

        try {
            const res = await fetch(`/api/articles?id=${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setArticles(articles.filter(a => a.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete article:', error);
        }
    };

    const filteredArticles = articles.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin text-teal-600" size={32} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <FileText className="text-teal-600" size={32} />
                            <h1 className="text-3xl font-black italic uppercase tracking-tighter">文章管理</h1>
                        </div>
                        <p className="text-text-muted text-sm font-medium">管理站内发布的深度原创文章</p>
                    </div>

                    <button
                        onClick={() => router.push('/publish/editor')}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-full font-black text-sm flex items-center gap-2 transition-all shadow-lg active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={18} />
                        发布新文章
                    </button>
                </div>

                {/* 搜索和过滤栏 */}
                <div className="bg-card rounded-2xl border border-card-border p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="搜索文章标题..."
                            className="w-full pl-10 pr-4 py-2 bg-background border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase">
                        <Filter size={14} />
                        共 {filteredArticles.length} 篇文章
                    </div>
                </div>

                {/* 文章列表 */}
                <div className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-background/50 text-text-muted text-[10px] uppercase font-bold">
                                <tr>
                                    <th className="px-6 py-4">文章信息</th>
                                    <th className="px-6 py-4 text-center">状态</th>
                                    <th className="px-6 py-4 text-center">顶置</th>
                                    <th className="px-6 py-4">发布时间</th>
                                    <th className="px-6 py-4 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-card-border">
                                {filteredArticles.length > 0 ? (
                                    filteredArticles.map((article) => (
                                        <tr key={article.id} className="hover:bg-background/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="max-w-md">
                                                    <h3 className="font-bold text-sm mb-1 line-clamp-1">{article.title}</h3>
                                                    <p className="text-xs text-text-muted line-clamp-1">
                                                        {article.ai_summary || '暂无摘要'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => handleTogglePublish(article.id, article.is_published)}
                                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black transition-all ${article.is_published
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                            }`}
                                                    >
                                                        {article.is_published ? (
                                                            <><Eye size={12} /> 已发布</>
                                                        ) : (
                                                            <><EyeOff size={12} /> 已下架</>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => handleTogglePin(article.id, article.is_pinned)}
                                                        className={`p-2 rounded-lg transition-all ${article.is_pinned
                                                                ? 'text-orange-500 bg-orange-100 dark:bg-orange-900/30'
                                                                : 'text-text-muted hover:bg-background'
                                                            }`}
                                                        title={article.is_pinned ? "取消顶置" : "标记顶置"}
                                                    >
                                                        <Pin size={16} fill={article.is_pinned ? "currentColor" : "none"} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-text-muted font-medium">
                                                {formatTime(article.created_at)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => router.push(`/publish/editor?id=${article.id}`)}
                                                        className="p-2 text-text-muted hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-all"
                                                        title="编辑"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(article.id)}
                                                        className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                        title="删除"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <a
                                                        href={`/article/${article.id}`}
                                                        target="_blank"
                                                        className="p-2 text-text-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                        title="查看预览"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 text-text-muted">
                                                <FileText size={48} className="opacity-20" />
                                                <p className="text-sm font-medium">暂无文章</p>
                                                <button
                                                    onClick={() => router.push('/publish/editor')}
                                                    className="text-teal-600 font-bold text-xs hover:underline"
                                                >
                                                    立即去发布第一篇新文章
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
