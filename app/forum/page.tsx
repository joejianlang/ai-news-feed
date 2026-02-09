'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/contexts/UserContext';
import {
    MessageSquare, Plus, TrendingUp, Clock, Users,
    Heart, MessageCircle, Share2, Send, X, ChevronDown, ChevronUp
} from 'lucide-react';

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
    created_at: string;
    users: { id: string; email: string } | null;
}

export default function ForumPage() {
    const { user } = useUser();
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [activeTab, setActiveTab] = useState<'trending' | 'latest' | 'following'>('trending');
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
    const [expandedCommentPostId, setExpandedCommentPostId] = useState<string | null>(null);
    const [comments, setComments] = useState<Record<string, Comment[]>>({});
    const [newComment, setNewComment] = useState('');

    // 表单状态
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        tags: '',
    });

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

                // 更新评论数
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

    const handleSubmitPost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const response = await fetch('/api/forum', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    title: formData.title,
                    content: formData.content,
                    tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
                })
            });

            if (response.ok) {
                setShowCreateModal(false);
                setFormData({ title: '', content: '', tags: '' });
                loadPosts();
            }
        } catch (error) {
            console.error('Failed to create post:', error);
        }
    };

    const toggleComments = (postId: string) => {
        if (expandedCommentPostId === postId) {
            setExpandedCommentPostId(null);
        } else {
            setExpandedCommentPostId(postId);
            if (!comments[postId]) {
                loadComments(postId);
            }
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

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />

            <header className="bg-card sticky top-[60px] z-20 shadow-sm pt-4 pb-2 transition-colors">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-black text-foreground tracking-tight">社区论坛</h2>
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
                        const isExpanded = expandedPostId === post.id;
                        const showComments = expandedCommentPostId === post.id;
                        const authorName = post.users?.email?.split('@')[0] || '匿名用户';

                        return (
                            <div key={post.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                {/* 作者信息 */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                                            <span className="text-sm font-bold text-teal-600">
                                                {authorName.substring(0, 2).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-bold text-foreground">@{authorName}</span>
                                            <span className="text-xs text-text-muted ml-2">{getTimeDiff(post.created_at)}</span>
                                        </div>
                                    </div>

                                    {/* 标签 */}
                                    <div className="flex flex-wrap gap-1">
                                        {post.is_ai_generated && (
                                            <span className="text-xs font-bold bg-purple-50 text-purple-600 px-2 py-1 rounded-md">AI话题</span>
                                        )}
                                        {post.tags?.slice(0, 2).map(tag => (
                                            <span key={tag} className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md">#{tag}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* 标题和内容 */}
                                <h3 className="text-lg font-extrabold text-foreground mb-2">{post.title}</h3>
                                <p className={`text-text-secondary leading-relaxed whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-3'}`}>
                                    {post.content}
                                </p>

                                {post.content && post.content.length > 150 && (
                                    <button
                                        onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                                        className="text-teal-600 font-bold text-sm mt-2 flex items-center"
                                    >
                                        {isExpanded ? (
                                            <>收起 <ChevronUp size={16} className="ml-1" /></>
                                        ) : (
                                            <>展开 <ChevronDown size={16} className="ml-1" /></>
                                        )}
                                    </button>
                                )}

                                {/* 图片 */}
                                {post.images && post.images.length > 0 && (
                                    <div className="mt-4 grid grid-cols-3 gap-2">
                                        {post.images.slice(0, 3).map((img, idx) => (
                                            <img key={idx} src={img} alt="" className="rounded-lg object-cover w-full h-24" />
                                        ))}
                                    </div>
                                )}

                                {/* 操作栏 */}
                                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-card-border text-text-muted">
                                    <button
                                        onClick={() => handleLike(post.id)}
                                        className="flex items-center gap-2 hover:text-red-500 transition-colors"
                                    >
                                        <Heart size={20} className={post.likes_count > 0 ? 'fill-red-500 text-red-500' : ''} />
                                        <span className="font-bold">{post.likes_count}</span>
                                    </button>
                                    <button
                                        onClick={() => toggleComments(post.id)}
                                        className="flex items-center gap-2 hover:text-blue-500 transition-colors"
                                    >
                                        <MessageCircle size={20} />
                                        <span className="font-bold">{post.comments_count}</span>
                                    </button>
                                    <button className="flex items-center gap-2 hover:text-teal-500 transition-colors">
                                        <Share2 size={20} />
                                        <span className="font-bold">分享</span>
                                    </button>
                                </div>

                                {/* 评论区 */}
                                {showComments && (
                                    <div className="mt-4 pt-4 border-t border-card-border">
                                        <h4 className="font-bold text-foreground mb-3">评论 ({post.comments_count})</h4>

                                        {/* 评论列表 */}
                                        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                                            {comments[post.id]?.map(comment => (
                                                <div key={comment.id} className="bg-background p-3 rounded-xl">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="font-bold text-sm text-foreground">
                                                            @{comment.users?.email?.split('@')[0] || '匿名'}
                                                        </span>
                                                        <span className="text-xs text-text-muted">{getTimeDiff(comment.created_at)}</span>
                                                    </div>
                                                    <p className="text-text-secondary text-sm">{comment.content}</p>
                                                </div>
                                            ))}
                                            {(!comments[post.id] || comments[post.id].length === 0) && (
                                                <p className="text-gray-400 text-sm text-center py-2">暂无评论，快来抢沙发！</p>
                                            )}
                                        </div>

                                        {/* 发表评论 */}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="写下你的评论..."
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                className="flex-1 bg-background rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-foreground"
                                            />
                                            <button
                                                onClick={() => handleComment(post.id)}
                                                disabled={!newComment.trim()}
                                                className="bg-teal-600 text-white p-2 rounded-xl disabled:opacity-50"
                                            >
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* 发帖模态框 */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5">
                    <div className="bg-card w-full max-w-md rounded-3xl p-7 relative shadow-2xl max-h-[90vh] overflow-y-auto transition-colors">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-2xl font-black text-foreground">发帖</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 bg-background rounded-xl text-text-muted">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitPost} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-2">标题 *</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-background p-4 rounded-xl text-base font-medium border-none focus:ring-2 focus:ring-teal-500 text-foreground"
                                    placeholder="说点什么..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-2">内容 *</label>
                                <textarea
                                    required
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    rows={5}
                                    className="w-full bg-background p-4 rounded-xl text-base font-medium border-none focus:ring-2 focus:ring-teal-500 text-foreground resize-none"
                                    placeholder="分享你的想法..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-2">标签（逗号分隔）</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="w-full bg-background p-4 rounded-xl text-base font-medium border-none focus:ring-2 focus:ring-teal-500 text-foreground"
                                    placeholder="例如：讨论, 求助, 分享"
                                />
                            </div>

                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-base"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3.5 bg-teal-600 text-white rounded-xl font-bold text-base shadow-lg"
                                >
                                    发布
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
