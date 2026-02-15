'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/contexts/UserContext';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { QRCodeCanvas } from 'qrcode.react';
import {
    MessageSquare, Plus, TrendingUp, Clock, Users,
    Heart, MessageCircle, Share2, Send, X, ChevronDown, ChevronUp,
    Upload, QrCode, Image as ImageIcon, Sparkles, Tag
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
    const supabase = createSupabaseBrowserClient();
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [activeTab, setActiveTab] = useState<'trending' | 'latest' | 'following'>('trending');
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
    const [expandedCommentPostId, setExpandedCommentPostId] = useState<string | null>(null);
    const [comments, setComments] = useState<Record<string, Comment[]>>({});
    const [newComment, setNewComment] = useState('');
    const [showShareId, setShowShareId] = useState<string | null>(null);

    // 表单状态
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        tags: '',
        images: [] as string[],
    });
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
                    images: formData.images,
                    tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
                })
            });

            if (response.ok) {
                setShowCreateModal(false);
                setFormData({ title: '', content: '', tags: '', images: [] });
                loadPosts();
            }
        } catch (error) {
            console.error('Failed to create post:', error);
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

            <header className="bg-card sticky top-[60px] z-20 border-b border-card-border shadow-sm pt-4 pb-2 transition-colors">
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
                        const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/forum?item=${post.id}`;

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

                                        <div className="flex flex-wrap gap-1.5 justify-end">
                                            {post.tags?.map(tag => (
                                                <span key={tag} className="text-[10px] font-black bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-lg border border-slate-200/50 dark:border-white/5 uppercase tracking-tighter">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 核心内容区 */}
                                    <div className="space-y-3">
                                        <h3 className="text-[18px] sm:text-[20px] font-black text-foreground leading-tight tracking-tight">
                                            {post.title}
                                        </h3>
                                        <div className={`text-[15px] text-text-secondary leading-relaxed transition-all duration-500 ${isExpanded ? '' : 'line-clamp-2 opacity-80'}`}>
                                            <p className="whitespace-pre-wrap">{post.content}</p>
                                        </div>

                                        {/* 展开控制 */}
                                        <button
                                            onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                                            className="w-full mt-2 py-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-teal-600 dark:text-teal-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-colors"
                                        >
                                            {isExpanded ? (
                                                <>收起详细讨论 <ChevronUp size={14} strokeWidth={3} /></>
                                            ) : (
                                                <>展开完整话题 <ChevronDown size={14} strokeWidth={3} /></>
                                            )}
                                        </button>
                                    </div>

                                    {/* 扩展详情：图片、分享、二维码 */}
                                    {isExpanded && (
                                        <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                            {/* 图片显示 */}
                                            {post.images && post.images.length > 0 && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    {post.images.map((img, idx) => (
                                                        <div key={idx} className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-inner border border-card-border">
                                                            <img src={img} alt="" className="w-full h-full object-cover select-none" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* 分享与互动面板 */}
                                            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-card-border">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Users size={16} className="text-teal-600" />
                                                        <span className="text-[12px] font-black text-foreground uppercase tracking-wider">邀请他人加入讨论</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setShowShareId(showShareId === post.id ? null : post.id)}
                                                        className="text-teal-600 font-black text-[10px] uppercase underline underline-offset-4"
                                                    >
                                                        {showShareId === post.id ? '隐藏分享码' : '生成分享卡片'}
                                                    </button>
                                                </div>

                                                {showShareId === post.id && (
                                                    <div className="flex flex-col items-center gap-4 py-4 animate-in zoom-in-95">
                                                        <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-100">
                                                            <QRCodeCanvas value={postUrl} size={160} />
                                                        </div>
                                                        <p className="text-[11px] text-text-muted font-bold text-center max-w-[200px]">
                                                            使用微信或浏览器扫码，<br />立即直达本话题深度讨论
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-4 text-text-muted justify-around border-t border-card-border/50 pt-4">
                                                    <button onClick={() => handleLike(post.id)} className="flex items-center gap-2 hover:text-red-500 group transition-all">
                                                        <Heart size={20} className={post.likes_count > 0 ? 'fill-red-500 text-red-500' : 'group-hover:scale-110'} />
                                                        <span className="font-black text-sm">{post.likes_count}</span>
                                                    </button>
                                                    <button onClick={() => setExpandedCommentPostId(showComments ? null : post.id)} className="flex items-center gap-2 hover:text-blue-500 group transition-all">
                                                        <MessageCircle size={20} className="group-hover:scale-110" />
                                                        <span className="font-black text-sm">{post.comments_count}</span>
                                                    </button>
                                                    <button className="flex items-center gap-2 hover:text-teal-500 group transition-all">
                                                        <Share2 size={20} className="group-hover:scale-110" />
                                                        <span className="font-black text-sm uppercase tracking-tighter">转发话题</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* 评论展开逻辑 */}
                                            {showComments && (
                                                <div className="space-y-4 pt-4 border-t border-card-border/50">
                                                    <h4 className="font-black text-[14px] text-foreground flex items-center gap-2 uppercase">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                                        全网评论汇聚
                                                    </h4>

                                                    <div className="space-y-3">
                                                        {comments[post.id]?.map(comment => (
                                                            <div key={comment.id} className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="font-black text-[12px] text-teal-600 dark:text-teal-400">@{comment.users?.email?.split('@')[0]}</span>
                                                                    <span className="text-[10px] text-text-muted font-bold">{getTimeDiff(comment.created_at)}</span>
                                                                </div>
                                                                <p className="text-[13px] text-text-secondary leading-relaxed">{comment.content}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="发表你的睿见..."
                                                            value={newComment}
                                                            onChange={(e) => setNewComment(e.target.value)}
                                                            className="flex-1 bg-slate-50 dark:bg-white/5 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 border border-card-border"
                                                            onKeyPress={e => e.key === 'Enter' && handleComment(post.id)}
                                                        />
                                                        <button
                                                            onClick={() => handleComment(post.id)}
                                                            className="bg-teal-600 text-white p-3 rounded-2xl active:scale-95 shadow-lg shadow-teal-500/20"
                                                        >
                                                            <Send size={18} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 发帖模态框 - 全彩重塑 */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-lg rounded-[32px] overflow-hidden relative shadow-2xl border border-white/10">
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
                                        className="w-full bg-slate-50 dark:bg-white/5 p-4 rounded-2xl text-[18px] font-black border border-card-border focus:ring-2 focus:ring-teal-500/50 text-foreground outline-none"
                                        placeholder="在这里输入话题标题..."
                                    />

                                    <textarea
                                        required
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        rows={6}
                                        className="w-full bg-slate-50 dark:bg-white/5 p-5 rounded-2xl text-[16px] border border-card-border focus:ring-2 focus:ring-teal-500/50 text-foreground resize-none outline-none leading-relaxed"
                                        placeholder="详细阐述你的想法、证据或疑问..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* 图片上传区域 */}
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
                                        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-card-border h-full">
                                            <div className="flex items-center gap-2 mb-2 text-teal-600">
                                                <Tag size={16} />
                                                <span className="text-[11px] font-black uppercase tracking-widest">分类标签</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.tags}
                                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                                className="w-full bg-transparent text-[14px] font-bold outline-none text-foreground placeholder-slate-400"
                                                placeholder="军事, 历史, 科技..."
                                            />
                                            <div className="mt-2 pt-2 border-t border-card-border/50">
                                                <p className="text-[9px] text-text-muted leading-tight font-bold italic">AI 正在根据内容自动建议标签...</p>
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
        </div>
    );
}
