'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import Navbar from '@/components/Navbar';
import { renderMarkdown } from '@/lib/utils/markdown';
import { Loader2, ArrowLeft, Image as ImageIcon, Youtube, Send, Eye, Edit, Upload } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

// YouTube URL 解析
function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function EditorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const articleId = searchParams.get('id');
    const { user, isLoading: userLoading } = useUser();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const summaryRef = useRef<HTMLTextAreaElement>(null);
    const [cursorPosition, setCursorPosition] = useState(0);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [summary, setSummary] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createSupabaseBrowserClient();

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 限制文件类型
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }

        // 限制文件大小 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('图片大小不能超过 5MB');
            return;
        }

        try {
            setIsUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `articles/${fileName}`;

            // 上传到 ad-images bucket (暂时共用，或你可以新建 article-images)
            const { error: uploadError } = await supabase.storage
                .from('ad-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 获取公共 URL
            const { data: { publicUrl } } = supabase.storage
                .from('ad-images')
                .getPublicUrl(filePath);

            setImageUrl(publicUrl);
            const markdown = `\n![图片](${publicUrl})\n`;
            insertAtCursor(markdown);
            setImageUrl('');

            // 清除 input
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (error) {
            console.error('上传失败:', error);
            alert('上传失败，请检查数据库权限或存储桶配置');
        } finally {
            setIsUploading(false);
        }
    };

    // 权限检查
    useEffect(() => {
        if (!userLoading) {
            if (!user) {
                router.push('/login?redirect=/publish/editor');
            } else if (user.role !== 'admin') {
                router.push('/');
            }
        }
    }, [user, userLoading, router]);

    // 如果有关联 ID，加载文章内容
    useEffect(() => {
        if (articleId && user?.role === 'admin') {
            loadArticle(articleId);
        }
    }, [articleId, user]);

    // 自动调整摘要框高度
    useEffect(() => {
        if (summaryRef.current) {
            summaryRef.current.style.height = 'auto';
            summaryRef.current.style.height = summaryRef.current.scrollHeight + 'px';
        }
    }, [summary]);

    const loadArticle = async (id: string) => {
        try {
            setIsFetching(true);
            const res = await fetch('/api/articles');
            const data = await res.json();
            const article = data.articles?.find((a: any) => a.id === id);

            if (article) {
                setTitle(article.title);
                setContent(article.content);
                setSummary(article.ai_summary || '');
                setAuthorName(article.author_name || '');
            } else {
                alert('未找到文章');
                router.push('/publish');
            }
        } catch (error) {
            console.error('Failed to load article:', error);
            alert('加载文章失败');
        } finally {
            setIsFetching(false);
        }
    };

    // 记录光标位置
    const handleTextareaSelect = () => {
        if (textareaRef.current) {
            setCursorPosition(textareaRef.current.selectionStart);
        }
    };

    const insertAtCursor = (textToInsert: string) => {
        const before = content.substring(0, cursorPosition);
        const after = content.substring(cursorPosition);
        const newContent = before + textToInsert + after;
        setContent(newContent);
        const newPosition = cursorPosition + textToInsert.length;
        setCursorPosition(newPosition);
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newPosition, newPosition);
            }
        }, 0);
    };

    const insertImage = () => {
        if (!imageUrl) return;
        const markdown = `\n![图片](${imageUrl})\n`;
        insertAtCursor(markdown);
        setImageUrl('');
    };

    const insertYouTube = () => {
        if (!youtubeUrl) return;
        const videoId = extractYouTubeId(youtubeUrl);
        if (!videoId) {
            alert('无法解析 YouTube 链接');
            return;
        }
        const markdown = `\n${youtubeUrl}\n`;
        insertAtCursor(markdown);
        setYoutubeUrl('');
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            alert('请输入标题');
            return;
        }
        if (!content.trim()) {
            alert('请输入内容');
            return;
        }

        setIsSubmitting(true);
        try {
            const method = articleId ? 'PUT' : 'POST';
            const response = await fetch('/api/articles', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: articleId,
                    title: title.trim(),
                    content: content.trim(),
                    summary: summary.trim() || null,
                    authorName: authorName.trim() || null,
                    imageUrl: null,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                alert(articleId ? '✅ 文章更新成功！' : '✅ 文章发布成功！');
                router.push('/publish');
            } else {
                alert(`❌ 操作失败: ${result.error}`);
            }
        } catch (error) {
            console.error('操作失败:', error);
            alert('❌ 操作失败，请检查网络连接');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (userLoading || isFetching) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin text-teal-600" size={32} />
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/publish')}
                            className="p-2 hover:bg-card-border/20 rounded-full transition-all text-text-muted"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black italic uppercase italic tracking-tighter">
                                {articleId ? '编辑文章' : '发布新文章'}
                            </h1>
                            <p className="text-text-muted text-xs font-medium">
                                {articleId ? '修改已发布的内容' : '撰写并发布深度内容到“深度”频道'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="px-4 py-2 rounded-xl border border-card-border hover:bg-card-border/10 font-bold text-xs flex items-center gap-2 transition-all"
                        >
                            {showPreview ? <Edit size={14} /> : <Eye size={14} />}
                            {showPreview ? '返回编辑' : '实时预览'}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !title.trim() || !content.trim()}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                            {isSubmitting ? '正在提交...' : (articleId ? '保存修改' : '立即发布')}
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* 标题 */}
                    <div className="bg-card rounded-2xl border border-card-border p-6 shadow-sm">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">文章标题</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="输入吸引人的标题..."
                            className="w-full bg-transparent border-none p-0 text-xl font-black focus:ring-0 placeholder:opacity-30"
                        />
                    </div>

                    {/* 署名 */}
                    <div className="bg-card rounded-2xl border border-card-border p-6 shadow-sm">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">署名 (可选)</label>
                        <input
                            type="text"
                            value={authorName}
                            onChange={e => setAuthorName(e.target.value)}
                            placeholder="输入作者署名，若不填写则默认显示来源名称..."
                            className="w-full bg-transparent border-none p-0 text-sm font-medium focus:ring-0 placeholder:opacity-30"
                        />
                    </div>

                    {/* 摘要 */}
                    <div className="bg-card rounded-2xl border border-card-border p-6 shadow-sm">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">内容摘要 (可选)</label>
                        <textarea
                            ref={summaryRef}
                            value={summary}
                            onChange={e => setSummary(e.target.value)}
                            placeholder="简短概括文章核心内容，支持自动换行..."
                            className="w-full bg-transparent border-none p-0 text-sm font-medium focus:ring-0 placeholder:opacity-30 resize-none overflow-hidden min-h-[24px]"
                            rows={1}
                        />
                    </div>

                    {/* 编辑/预览区域 */}
                    <div className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                        <div className="px-4 py-2 border-b border-card-border flex items-center gap-4 bg-background/50">
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="p-1.5 bg-teal-600/10 text-teal-600 rounded-lg hover:bg-teal-600/20 disabled:opacity-30 transition-all flex items-center gap-1 text-[10px] font-bold"
                                    title="上传并插入图片"
                                >
                                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                    {isUploading ? '上传中...' : '上传图片'}
                                </button>
                                <div className="w-[1px] h-4 bg-card-border mx-1" />
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={e => setImageUrl(e.target.value)}
                                    placeholder="或输入图片 URL..."
                                    className="px-3 py-1 bg-background border border-card-border rounded-lg text-xs w-32 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                                />
                                <button
                                    onClick={insertImage}
                                    disabled={!imageUrl}
                                    className="p-1.5 bg-teal-600/10 text-teal-600 rounded-lg hover:bg-teal-600/20 disabled:opacity-30 transition-all"
                                    title="插入 URL 图片"
                                >
                                    <ImageIcon size={16} />
                                </button>
                            </div>
                            <div className="w-[1px] h-4 bg-card-border" />
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={youtubeUrl}
                                    onChange={e => setYoutubeUrl(e.target.value)}
                                    placeholder="YouTube URL..."
                                    className="px-3 py-1 bg-background border border-card-border rounded-lg text-xs w-48 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                                />
                                <button
                                    onClick={insertYouTube}
                                    disabled={!youtubeUrl}
                                    className="p-1.5 bg-red-600/10 text-red-600 rounded-lg hover:bg-red-600/20 disabled:opacity-30 transition-all"
                                    title="插入视频"
                                >
                                    <Youtube size={16} />
                                </button>
                            </div>
                        </div>

                        {showPreview ? (
                            <div className="flex-1 p-8 prose prose-sm sm:prose-base dark:prose-invert max-w-none bg-background/30">
                                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
                            </div>
                        ) : (
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                onSelect={handleTextareaSelect}
                                onClick={handleTextareaSelect}
                                onKeyUp={handleTextareaSelect}
                                placeholder="使用 Markdown 撰写您的深度见解..."
                                className="flex-1 w-full p-8 bg-transparent border-none focus:ring-0 text-base font-medium leading-relaxed resize-none min-h-[400px]"
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function PublishEditorWrapper() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditorContent />
        </Suspense>
    );
}
