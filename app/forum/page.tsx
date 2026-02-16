'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/contexts/UserContext';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
    MessageSquare, Plus, TrendingUp, Clock, Users,
    Heart, MessageCircle, Share2, Send, X, ChevronDown, ChevronUp,
    Upload, Image as ImageIcon, Sparkles, Tag, RefreshCw
} from 'lucide-react';
import ShareModal from '@/components/ShareModal';

interface ForumPost {
    id: string;
    title: string;
    content: string;
    images: string[];
    video_url: string | null;
    tags: string[];
    likes_count: number;
    comments_count: number;
    is_ai_generated: boolean;
    created_at: string;
    user_id: string;
    users: { id: string; email: string } | null;
}

interface Comment {
    id: string;
    content: string;
    images: string[];
    user_id: string;
    created_at: string;
    users: { id: string; email: string } | null;
}

export default function ForumPage() {
    const { user } = useUser();
    const supabase = createSupabaseBrowserClient();
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [activeTab, setActiveTab] = useState<'trending' | 'latest' | 'following'>('trending');
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
    const [expandedCommentPostId, setExpandedCommentPostId] = useState<string | null>(null);
    const [showReplyModal, setShowReplyModal] = useState<string | null>(null);
    const [comments, setComments] = useState<Record<string, Comment[]>>({});
    const [newComment, setNewComment] = useState('');
    const [isPolishingComment, setIsPolishingComment] = useState<string | null>(null);
    const [aiSuggestion, setAiSuggestion] = useState<{ [key: string]: string }>({});
    const [showShareModal, setShowShareModal] = useState(false);
    const [sharingPost, setSharingPost] = useState<ForumPost | null>(null);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);

    // 记录原始标题以便恢复
    const originalTitle = typeof document !== 'undefined' ? document.title : '社区论坛';

    // 监控分享弹窗状态，重置标题
    useEffect(() => {
        if (!showShareModal && typeof document !== 'undefined') {
            document.title = originalTitle;
        }
    }, [showShareModal, originalTitle]);

    const handleDeletePost = async (postId: string) => {
        if (!user || user.role !== 'admin') return;
        if (!confirm('确定要删除这条帖子吗？此操作不可撤销。')) return;

        try {
            const response = await fetch(`/api/forum?id=${postId}&userId=${user.id}`, {
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

    const handleDeleteComment = async (postId: string, commentId: string) => {
        if (!user) return;
        if (!confirm('确定要删除这条回复吗？')) return;

        try {
            const response = await fetch(`/api/forum/comments?id=${commentId}&userId=${user.id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setComments(prev => ({
                    ...prev,
                    [postId]: prev[postId].filter(c => c.id !== commentId)
                }));
                // 更新评论数
                setPosts(prev => prev.map(p => {
                    if (p.id === postId) return { ...p, comments_count: p.comments_count - 1 };
                    return p;
                }));
            }
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    // 表单状态
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        tags: '',
        images: [] as string[],
    });
    const [isPolishing, setIsPolishing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        loadPosts();
    }, [activeTab, user]);

    const loadPosts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('sort', activeTab === 'trending' ? 'trending' : 'latest');
            if (activeTab === 'following' && user) {
                params.append('followingUserId', user.id);
            }

            const response = await fetch(`/api/forum?${params}`);
            const data = await response.json();
            setPosts(data.posts || []);
        } catch (error) {
            console.error('Failed to load posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const newImages = [...formData.images];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // 安全规范：仅允许图片格式，最大 10MB
            if (!file.type.startsWith('image/')) {
                alert(`文件 ${file.name} 不是图片格式`);
                continue;
            }
            if (file.size > 10 * 1024 * 1024) {
                alert(`图片 ${file.name} 超过 10MB`);
                continue;
            }

            try {
                const fileExt = file.name.split('.').pop()?.toLowerCase();
                const safeName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `forum/${user?.id}/${safeName}`;

                const { data, error } = await supabase.storage
                    .from('ad-images') // 复用广告图片 Bucket，或之后独立一个 forum-images
                    .upload(filePath, file);

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('ad-images')
                    .getPublicUrl(filePath);

                newImages.push(publicUrl);
            } catch (err) {
                console.error('Upload failed:', err);
            }
        }

        setFormData(prev => ({ ...prev, images: newImages }));
        setIsUploading(false);
    };

    const loadComments = async (postId: string) => {
        try {
            const response = await fetch(`/api/forum/comments?postId=${postId}`);
            const data = await response.json();
            setComments(prev => ({ ...prev, [postId]: data.comments || [] }));
        } catch (error) {
            console.error('Failed to load comments:', error);
        }
    };

    const handleLike = async (postId: string) => {
        if (!user) {
            alert('请先登录');
            return;
        }

        try {
            const response = await fetch('/api/forum/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId, userId: user.id })
            });
            const data = await response.json();

            // 乐观更新
            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    return { ...p, likes_count: p.likes_count + (data.liked ? 1 : -1) };
                }
                return p;
            }));
        } catch (error) {
            console.error('Failed to toggle like:', error);
        }
    };

    const handleComment = async (postId: string) => {
        if (!user) {
            alert('请先登录');
            return;
        }
        if (!newComment.trim()) return;

        try {
            const response = await fetch('/api/forum/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId,
                    userId: user.id,
                    content: newComment
                })
            });
            const data = await response.json();

            if (data.comment) {
                setComments(prev => ({
                    ...prev,
                    [postId]: [...(prev[postId] || []), data.comment]
                }));
                setNewComment('');
                setShowReplyModal(null);
                setAiSuggestion(prev => {
                    const newState = { ...prev };
                    delete newState[postId];
                    return newState;
                });

                setExpandedCommentPostId(postId);
                setPosts(prev => prev.map(p => {
                    if (p.id === postId) {
                        return { ...p, comments_count: p.comments_count + 1 };
                    }
                    return p;
                }));
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
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
        setShowCreateModal(true);
    };

    const handleSubmitPost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const isEditing = !!editingPostId;
        const method = isEditing ? 'PATCH' : 'POST';

        try {
            const response = await fetch('/api/forum', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingPostId,
                    userId: user.id,
                    title: formData.title,
                    content: formData.content,
                    images: formData.images,
                    tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
                })
            });

            if (response.ok) {
                setShowCreateModal(false);
                setEditingPostId(null);
                setFormData({ title: '', content: '', tags: '', images: [] });
                loadPosts();
            }
        } catch (error) {
            console.error(`Failed to ${isEditing ? 'update' : 'create'} post:`, error);
        }
    };

    const handleAiPolish = async () => {
        if (!formData.content.trim()) return;

        setIsPolishing(true);
        try {
            const response = await fetch('/api/ai/polish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: formData.content,
                    title: formData.title
                })
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

    const handleAiPolishComment = async (postId: string) => {
        if (!newComment.trim()) return;

        setIsPolishingComment(postId);
        try {
            const response = await fetch('/api/ai/polish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newComment
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.polishedContent) {
                    setAiSuggestion(prev => ({ ...prev, [postId]: data.polishedContent }));
                }
            }
        } catch (error) {
            console.error('AI Polish comment failed:', error);
        } finally {
            setIsPolishingComment(null);
        }
    };

    const handleAdoptSuggestion = (postId: string) => {
        if (aiSuggestion[postId]) {
            setNewComment(aiSuggestion[postId]);
            setAiSuggestion(prev => {
                const newState = { ...prev };
                delete newState[postId];
                return newState;
            });
        }
    };

    const getTimeDiff = (dateStr: string) => {
        const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
        if (mins < 60) return `${mins}分钟前`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}小时前`;
        const days = Math.floor(hours / 24);
        return `${days}天前`;
    };

    const handleShare = async (post: ForumPost) => {
        const shareData = {
            title: post.title,
            text: post.content.slice(0, 100),
            url: window.location.origin + `/forum?item=${post.id}&utm_source=share&utm_medium=social&utm_campaign=forum`,
        };

        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                setSharingPost(post);
                setShowShareModal(true);
            }
        } catch (error) {
            console.error('Error sharing:', error);
            setSharingPost(post);
            setShowShareModal(true);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />

            <header className="bg-card sticky top-[56px] z-20 border-b border-card-border shadow-sm pt-0 pb-2 transition-colors">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xl font-black text-foreground tracking-tight">社区论坛</h2>
                        <button
                            onClick={() => user ? setShowCreateModal(true) : alert('请先登录')}
                            className="bg-teal-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center"
                        >
                            <Plus size={18} className="mr-1" strokeWidth={3} /> 发帖
                        </button>
                    </div>

                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
                        {[
                            { id: 'trending', label: '热门', icon: TrendingUp },
                            { id: 'latest', label: '最新', icon: Clock },
                            { id: 'following', label: '关注', icon: Users },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1 ${activeTab === tab.id
                                    ? 'bg-teal-600 text-white shadow-md'
                                    : 'bg-background text-text-secondary hover:bg-card-border'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto p-4 space-y-4">
                {loading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-4 text-gray-500">加载中...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="py-20 text-center">
                        <MessageSquare size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-400 mb-2">暂无帖子</h3>
                        <p className="text-gray-400">点击右上角按钮发布第一条帖子吧！</p>
                    </div>
                ) : (
                    posts.map(post => {
                        const showComments = expandedCommentPostId === post.id;
                        const isExpanded = expandedPostId === post.id;
                        const authorName = post.users?.email?.split('@')[0] || '匿名用户';

                        return (
                            <div key={post.id} className="bg-card rounded-3xl shadow-sm border border-card-border overflow-hidden transition-all duration-500">
                                <div className="p-6">
                                    {/* 作者与标签栏 */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                                <span className="text-sm font-black text-teal-600 dark:text-teal-400">
                                                    {authorName.substring(0, 2).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-foreground text-sm uppercase tracking-tight">@{authorName}</span>
                                                    {post.is_ai_generated && <Sparkles size={12} className="text-purple-500" />}
                                                </div>
                                                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{getTimeDiff(post.created_at)}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex flex-wrap gap-1.5 justify-end">
                                                {post.tags?.map(tag => (
                                                    <span key={tag} className="text-[10px] font-black bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-lg border border-slate-200/50 dark:border-white/5 uppercase tracking-tighter">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* 管理操作逻辑 */}
                                            <div className="flex items-center gap-2">
                                                {user?.id === post.user_id && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEditPost(post); }}
                                                        className="p-1.5 text-text-muted hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                                                        title="编辑帖子"
                                                    >
                                                        <Clock size={14} className="rotate-45" />
                                                        <span className="text-[10px] font-bold ml-1">编辑</span>
                                                    </button>
                                                )}
                                                {user?.role === 'admin' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                                                        className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="删除帖子"
                                                    >
                                                        <X size={14} />
                                                        <span className="text-[10px] font-bold ml-1">删除</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 核心内容区 - 折叠展开逻辑 */}
                                    <div
                                        className="cursor-pointer group/content mb-6"
                                        onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                                    >
                                        {isExpanded ? (
                                            /* 展开状态：完整内容展示 */
                                            <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <h3 className="text-[20px] font-black text-foreground leading-tight tracking-tight px-1">
                                                    {post.title}
                                                </h3>
                                                <div className="text-[15px] text-text-secondary leading-relaxed px-1">
                                                    <p className="whitespace-pre-wrap">{post.content}</p>
                                                </div>
                                                {post.images && post.images.length > 0 && (
                                                    <div className="grid grid-cols-2 gap-3 pb-2">
                                                        {post.images.map((img, idx) => (
                                                            <div key={idx} className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-inner border border-card-border">
                                                                <img src={img} alt="" className="w-full h-full object-cover select-none" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* 折叠状态 - 左图右文布局 */
                                            <div className="flex gap-4 sm:gap-6">
                                                {post.images && post.images.length > 0 && (
                                                    <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-2xl overflow-hidden border border-card-border shadow-sm bg-slate-50 dark:bg-white/5">
                                                        <img src={post.images[0]} alt="" className="w-full h-full object-cover group-hover/content:scale-105 transition-transform duration-500" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <h3 className="text-[17px] sm:text-[18px] font-black text-foreground leading-tight mb-2 line-clamp-1 group-hover/content:text-teal-600 transition-colors">
                                                        {post.title}
                                                    </h3>
                                                    <p className="text-[14px] text-text-muted leading-relaxed line-clamp-2">
                                                        {post.content}
                                                    </p>
                                                    <div className="mt-2 text-[9px] font-black text-teal-600/60 uppercase tracking-widest flex items-center gap-1.5">
                                                        <span className="w-4 h-[1px] bg-teal-600/30"></span>
                                                        阅读全文
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 交互条 */}
                                    <div className="flex items-center justify-between border-t border-card-border/50 pt-4 mt-2 px-1">
                                        <div className="flex items-center gap-6">
                                            <button onClick={(e) => { e.stopPropagation(); handleLike(post.id); }} className="flex items-center gap-2 text-text-muted hover:text-red-500 group transition-all">
                                                <Heart size={20} className={post.likes_count > 0 ? 'fill-red-500 text-red-500' : 'group-hover:scale-110'} />
                                                <span className="font-black text-sm">{post.likes_count}</span>
                                            </button>
                                            <button onClick={(e) => {
                                                e.stopPropagation();
                                                if (!user) { alert('请先登录'); return; }
                                                setShowReplyModal(post.id);
                                            }} className="flex items-center gap-2 text-teal-600 hover:text-blue-500 group transition-all">
                                                <MessageCircle size={20} className="group-hover:scale-110" />
                                                <span className="font-black text-sm">{post.comments_count}</span>
                                            </button>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleShare(post); }}
                                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-teal-600 dark:text-teal-400 transition-all"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                                        </button>
                                    </div>

                                    {/* 评论列表区 */}
                                    <div className="space-y-4 pt-4 border-t border-card-border/50">
                                        <button
                                            onClick={() => {
                                                if (!showComments) loadComments(post.id);
                                                setExpandedCommentPostId(showComments ? null : post.id);
                                            }}
                                            className="w-full py-2 bg-slate-50 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-teal-600 transition-colors"
                                        >
                                            {showComments ? '隐藏深度讨论' : '查看深度讨论'}
                                        </button>

                                        {showComments && comments[post.id] && comments[post.id].length > 0 && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                                <h4 className="font-black text-[12px] text-text-muted flex items-center gap-2 uppercase tracking-widest">
                                                    <MessageSquare size={14} />
                                                    全网讨论汇聚 ({comments[post.id].length})
                                                </h4>

                                                <div className="space-y-3">
                                                    {comments[post.id].map(comment => (
                                                        <div key={comment.id} className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-black text-[12px] text-teal-600 dark:text-teal-400">@{comment.users?.email?.split('@')[0]}</span>
                                                                    <span className="text-[10px] text-text-muted font-bold">{getTimeDiff(comment.created_at)}</span>
                                                                </div>
                                                                {(user?.id === comment.user_id || user?.role === 'admin') && (
                                                                    <button
                                                                        onClick={() => handleDeleteComment(post.id, comment.id)}
                                                                        className="p-1 text-text-muted hover:text-red-500 transition-colors"
                                                                        title="删除回复"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <p className="text-[13px] text-slate-800 dark:text-slate-100 leading-relaxed font-medium">{comment.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 发帖模态框 */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-lg rounded-[32px] overflow-hidden relative shadow-2xl border border-white/10 animate-in zoom-in-95">
                        <div className="p-8 pb-4">
                            <div className="flex justify-between items-center mb-6">
                                <div className="space-y-1">
                                    <h2 className="text-[26px] font-black text-foreground leading-none">发起新讨论</h2>
                                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">让观点碰撞出火花</p>
                                </div>
                                <button onClick={() => setShowCreateModal(false)} className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl text-text-muted hover:bg-red-50 transition-colors">
                                    <X size={20} strokeWidth={3} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitPost} className="space-y-5">
                                <div className="space-y-4">
                                    <input
                                        required
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-slate-100 dark:bg-white/10 p-4 rounded-2xl text-[18px] font-black border border-card-border focus:ring-2 focus:ring-teal-500/50 text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-white/30"
                                        placeholder="在这里输入话题标题..."
                                    />

                                    <div className="relative group">
                                        <textarea
                                            required
                                            value={formData.content}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                            rows={6}
                                            className="w-full bg-slate-100 dark:bg-white/10 p-5 pb-14 rounded-2xl text-[16px] border border-card-border focus:ring-2 focus:ring-teal-500/50 text-slate-900 dark:text-white resize-none outline-none leading-relaxed transition-all placeholder:text-slate-400 dark:placeholder:text-white/30"
                                            placeholder="详细阐述你的想法、证据 or 疑问..."
                                        />
                                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                            {isPolishing ? (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl font-black text-[12px] uppercase tracking-wider animate-pulse border border-purple-500/20">
                                                    <Sparkles size={14} className="animate-spin" />
                                                    正在智能润色...
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleAiPolish}
                                                    disabled={!formData.content.trim()}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-400 text-white rounded-xl font-black text-[12px] uppercase tracking-wider shadow-lg shadow-purple-500/30 active:scale-95 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
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
                                        onClick={() => document.getElementById('forum-img-upload')?.click()}
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
                                                <span className="text-[10px] font-black text-text-muted uppercase tracking-tighter">上传图片证据</span>
                                            </>
                                        )}
                                        <input id="forum-img-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-card/60 flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="bg-slate-100 dark:bg-white/10 rounded-2xl p-4 border border-card-border h-full">
                                            <div className="flex items-center gap-2 mb-2 text-teal-600">
                                                <Tag size={16} />
                                                <span className="text-[11px] font-black uppercase tracking-widest">分类标签</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.tags}
                                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                                className="w-full bg-transparent text-[14px] font-bold outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30"
                                                placeholder="军事, 历史, 科技..."
                                            />
                                            <div className="mt-2 pt-2 border-t border-card-border/50">
                                                <p className="text-[9px] text-text-muted dark:text-slate-400 leading-tight font-bold italic">已根据内容自动建议标签...</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 py-4 bg-slate-50 dark:bg-white/5 text-text-muted rounded-2xl font-black text-[15px] uppercase tracking-widest"
                                    >
                                        舍弃
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-4 bg-teal-600 text-white rounded-2xl font-black text-[16px] shadow-xl shadow-teal-500/30 uppercase tracking-widest active:scale-95 transition-all"
                                    >
                                        立即发布
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 回复模态框 */}
            {showReplyModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-lg rounded-[32px] overflow-hidden relative shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
                        <div className="p-6 sm:p-8">
                            <div className="flex justify-between items-center mb-6">
                                <div className="space-y-1">
                                    <h2 className="text-[20px] font-black text-foreground leading-none flex items-center gap-2">
                                        <MessageCircle className="text-teal-600" size={20} />
                                        参与深度讨论
                                    </h2>
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">发表你的睿见，开启共鸣</p>
                                </div>
                                <button onClick={() => { setShowReplyModal(null); setAiSuggestion({}); }} className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl text-text-muted hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                                    <X size={18} strokeWidth={3} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {aiSuggestion[showReplyModal] && (
                                    <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-900/30 p-4 rounded-2xl animate-in zoom-in-95 text-slate-900 dark:text-white">
                                        <div className="flex items-center gap-2 mb-2 text-teal-600 dark:text-teal-400">
                                            <Sparkles size={14} />
                                            <span className="text-xs font-black uppercase tracking-widest">深度讨论建议已就绪</span>
                                        </div>
                                        <p className="text-sm text-text-secondary leading-relaxed mb-4 italic px-2">"{aiSuggestion[showReplyModal]}"</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAdoptSuggestion(showReplyModal)}
                                                className="flex-1 py-3 bg-teal-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
                                            >
                                                采纳建议并微调提交
                                            </button>
                                            <button
                                                onClick={() => setAiSuggestion(prev => {
                                                    const newState = { ...prev };
                                                    delete newState[showReplyModal];
                                                    return newState;
                                                })}
                                                className="px-4 py-3 bg-slate-200 dark:bg-white/10 text-text-muted text-[10px] font-black rounded-xl uppercase tracking-widest"
                                            >
                                                不采纳
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="relative group">
                                    <textarea
                                        autoFocus
                                        placeholder="在这里畅所欲言..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white rounded-2xl px-5 py-5 text-[15px] focus:outline-none focus:ring-2 focus:ring-teal-500/50 border border-card-border min-h-[180px] sm:min-h-[220px] resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/30 leading-relaxed"
                                    />

                                    <div className="absolute right-4 bottom-4 flex items-center gap-3">
                                        <button
                                            onClick={() => handleAiPolishComment(showReplyModal)}
                                            disabled={isPolishingComment === showReplyModal || !newComment.trim()}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-card-border rounded-xl shadow-sm text-teal-600 font-black text-[11px] uppercase tracking-wider hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {isPolishingComment === showReplyModal ? (
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Sparkles size={14} />
                                                    智能润色
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => handleComment(showReplyModal)}
                                            disabled={!newComment.trim()}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xl shadow-teal-500/30 font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            <Send size={14} strokeWidth={3} />
                                            提交
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 分享模态框 - 复用新闻系统的 ShareModal */}
            {sharingPost && (
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => {
                        setShowShareModal(false);
                        setSharingPost(null);
                    }}
                    title={sharingPost.title}
                    summary={sharingPost.content}
                    articleId={sharingPost.id}
                    path="forum?item"
                    source={sharingPost.users?.email?.split('@')[0] || '社区论坛'}
                    imageUrl={sharingPost.images?.[0]}
                />
            )}
        </div>
    );
}
