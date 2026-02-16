'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/contexts/UserContext';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
    FileText, Heart, MessageCircle, Share2, Edit2, Trash2,
    X, Plus, Upload, Tag, Sparkles, ChevronLeft, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface ForumPost {
    id: string;
    title: string;
    content: string;
    images: string[];
    video_url: string | null;
    tags: string[];
    likes_count: number;
    comments_count: number;
    created_at: string;
    user_id: string;
}

export default function MyPostsPage() {
    const { user } = useUser();
    const supabase = createSupabaseBrowserClient();
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        tags: '',
        images: [] as string[],
    });
    const [isPolishing, setIsPolishing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (user) {
            loadMyPosts();
        }
    }, [user]);

    const loadMyPosts = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/forum?userId=${user?.id}`);
            const data = await response.json();
            setPosts(data.posts || []);
        } catch (error) {
            console.error('Failed to load my posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditPost = (post: ForumPost) => {
        setFormData({
            title: post.title,
            content: post.content,
            tags: post.tags?.join(', ') || '',
            images: post.images || [],
        });
        setEditingPostId(post.id);
        setShowEditModal(true);
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm('确定要删除这条帖子吗？此操作不可撤销。')) return;

        try {
            const response = await fetch(`/api/forum?id=${postId}&userId=${user?.id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setPosts(prev => prev.filter(p => p.id !== postId));
            } else {
                const data = await response.json();
                alert(data.error || '删除失败');
            }
        } catch (error) {
            console.error('Failed to delete post:', error);
        }
    };

    const handleSubmitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/forum', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingPostId,
                    userId: user?.id,
                    title: formData.title,
                    content: formData.content,
                    images: formData.images,
                    tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
                })
            });

            if (response.ok) {
                setShowEditModal(false);
                setEditingPostId(null);
                loadMyPosts();
            }
        } catch (error) {
            console.error('Failed to update post:', error);
        }
    };

    const handleAiPolish = async () => {
        if (!formData.content.trim()) return;
        setIsPolishing(true);
        try {
            const response = await fetch('/api/ai/polish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: formData.content })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.polishedContent) {
                    setFormData(prev => ({ ...prev, content: data.polishedContent }));
                }
            }
        } catch (error) {
            console.error('AI Polish failed:', error);
        } finally {
            setIsPolishing(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setIsUploading(true);
        const newImages = [...formData.images];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExt = file.name.split('.').pop()?.toLowerCase();
            const safeName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `forum/${user?.id}/${safeName}`;
            const { data, error } = await supabase.storage
                .from('ad-images')
                .upload(filePath, file);
            if (!error) {
                const { data: { publicUrl } } = supabase.storage
                    .from('ad-images')
                    .getPublicUrl(filePath);
                newImages.push(publicUrl);
            }
        }
        setFormData(prev => ({ ...prev, images: newImages }));
        setIsUploading(false);
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <div className="max-w-2xl mx-auto p-20 text-center">
                    <p className="text-text-muted">请先登录</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />

            {/* Header */}
            <header className="bg-card sticky top-[44px] sm:top-[64px] z-20 border-b border-card-border shadow-sm pt-0 pb-2 transition-colors">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="flex items-center h-14">
                        <Link href="/profile" className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
                            <ArrowLeft size={24} className="text-text-secondary" />
                        </Link>
                        <h2 className="ml-2 text-xl font-black text-foreground tracking-tight">我的发帖</h2>
                        <span className="ml-3 px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded-lg text-xs font-black text-text-muted">
                            {posts.length}
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-4 space-y-4 pb-20">
                {loading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-4 text-gray-500">正在获取你的智慧产出...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="py-20 text-center bg-card rounded-3xl border border-card-border border-dashed">
                        <FileText size={48} className="mx-auto text-text-muted mb-4 opacity-20" />
                        <h3 className="text-lg font-bold text-text-secondary mb-2">空空如也</h3>
                        <p className="text-text-muted text-sm mb-6">你还没有在社区留下过足迹</p>
                        <Link href="/forum" className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-teal-500/30">
                            去社区逛逛
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map(post => (
                            <div key={post.id} className="bg-card rounded-3xl shadow-sm border border-card-border overflow-hidden">
                                <div className="p-5">
                                    <div className="flex gap-4">
                                        {post.images && post.images.length > 0 && (
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden border border-card-border">
                                                <img src={post.images[0]} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-[16px] font-black text-foreground leading-tight mb-2 line-clamp-1">
                                                {post.title}
                                            </h3>
                                            <p className="text-[13px] text-text-muted leading-relaxed line-clamp-2 mb-3">
                                                {post.content}
                                            </p>
                                            <div className="flex items-center gap-4 text-[11px] font-bold text-text-muted">
                                                <div className="flex items-center gap-1">
                                                    <Heart size={14} className={post.likes_count > 0 ? 'fill-red-500 text-red-500' : ''} />
                                                    {post.likes_count}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <MessageCircle size={14} />
                                                    {post.comments_count}
                                                </div>
                                                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-card-border/50">
                                        <button
                                            onClick={() => handleEditPost(post)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 dark:bg-white/5 text-teal-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-colors"
                                        >
                                            <Edit2 size={14} />
                                            再次编辑
                                        </button>
                                        <button
                                            onClick={() => handleDeletePost(post.id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 dark:bg-white/5 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                            彻底删除
                                        </button>
                                        <Link
                                            href={`/forum?item=${post.id}`}
                                            className="px-4 flex items-center justify-center py-2.5 bg-slate-50 dark:bg-white/5 text-text-muted rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                        >
                                            查看
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* 编辑模态框 (复用论坛风格) */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-xl rounded-[32px] overflow-hidden relative shadow-2xl border border-card-border animate-in zoom-in-95 duration-200">
                        <div className="p-6 sm:p-8">
                            <div className="flex justify-between items-center mb-6">
                                <div className="space-y-1">
                                    <h2 className="text-[22px] font-black text-foreground leading-none">编辑你的话题</h2>
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">修正你的智慧，追求极致共鸣</p>
                                </div>
                                <button onClick={() => setShowEditModal(false)} className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl text-text-muted transition-colors">
                                    <X size={18} strokeWidth={3} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitEdit} className="space-y-5">
                                <div className="space-y-4">
                                    <input
                                        required
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-slate-100 dark:bg-white/10 p-4 rounded-2xl text-[18px] font-black border border-card-border outline-none text-foreground placeholder:text-slate-400"
                                        placeholder="话题标题"
                                    />

                                    <div className="relative group">
                                        <textarea
                                            required
                                            value={formData.content}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                            rows={6}
                                            className="w-full bg-slate-100 dark:bg-white/10 p-5 pb-14 rounded-2xl text-[16px] border border-card-border text-foreground resize-none outline-none leading-relaxed transition-all placeholder:text-slate-400"
                                            placeholder="话题内容"
                                        />
                                        <div className="absolute bottom-3 right-3">
                                            {isPolishing ? (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl font-black text-[12px] uppercase tracking-wider animate-pulse border border-purple-500/20">
                                                    <Sparkles size={14} className="animate-spin" />
                                                    润色中...
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleAiPolish}
                                                    disabled={!formData.content.trim()}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-black text-[12px] uppercase tracking-wider shadow-lg shadow-purple-500/30 active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    <Sparkles size={14} />
                                                    智能润色
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => document.getElementById('my-posts-img-upload')?.click()}
                                        className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-card-border bg-slate-50 dark:bg-white/5 cursor-pointer hover:border-teal-500/50 transition-all group overflow-hidden relative"
                                    >
                                        {formData.images.length > 0 ? (
                                            <>
                                                <img src={formData.images[0]} className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="px-3 py-1 bg-black/60 text-white rounded-lg text-[10px] font-black">+{formData.images.length} 张图片</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="text-text-muted mb-2 group-hover:text-teal-500 transition-colors" size={28} />
                                                <span className="text-[10px] font-black text-text-muted uppercase tracking-tighter">更换图片证据</span>
                                            </>
                                        )}
                                        <input id="my-posts-img-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-card/60 flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-slate-100 dark:bg-white/10 rounded-2xl p-4 border border-card-border">
                                        <div className="flex items-center gap-2 mb-2 text-teal-600">
                                            <Tag size={16} />
                                            <span className="text-[11px] font-black uppercase tracking-widest">标签</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.tags}
                                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                            className="w-full bg-transparent text-[14px] font-bold outline-none text-foreground placeholder:text-slate-400"
                                            placeholder="军事, 历史..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 py-4 bg-slate-50 dark:bg-white/5 text-text-muted rounded-2xl font-black text-[15px] uppercase tracking-widest"
                                    >
                                        放弃更改
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-4 bg-teal-600 text-white rounded-2xl font-black text-[16px] shadow-xl shadow-teal-500/30 uppercase tracking-widest active:scale-95 transition-all"
                                    >
                                        保存更新
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
