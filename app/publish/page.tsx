'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import Navbar from '@/components/Navbar';

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

// Markdown 渲染（简单版本）
function renderMarkdown(content: string): string {
    let html = content;

    // YouTube 嵌入 - 检测 YouTube URL 并转换为 iframe
    html = html.replace(
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n\s]+)/g,
        (match, videoId) => `<div class="my-4"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen class="max-w-full rounded-lg"></iframe></div>`
    );

    // 图片
    html = html.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" class="max-w-full rounded-lg my-4" />'
    );

    // 链接
    html = html.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>'
    );

    // 标题
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold mt-6 mb-2">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-3">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>');

    // 粗体和斜体
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // 代码块
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-800 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto"><code>$2</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-red-600 px-1 py-0.5 rounded">$1</code>');

    // 引用
    html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600">$1</blockquote>');

    // 列表
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>');
    html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$2</li>');

    // 段落
    html = html.replace(/\n\n/g, '</p><p class="my-4">');
    html = '<p class="my-4">' + html + '</p>';

    return html;
}

export default function PublishPage() {
    const router = useRouter();
    const { user, isLoading: userLoading } = useUser();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [cursorPosition, setCursorPosition] = useState(0);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [summary, setSummary] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');

    // 权限检查
    useEffect(() => {
        if (!userLoading) {
            if (!user) {
                router.push('/login?redirect=/publish');
            } else if (user.role !== 'admin') {
                alert('此页面仅管理员可访问');
                router.push('/');
            }
        }
    }, [user, userLoading, router]);

    // 记录光标位置
    const handleTextareaSelect = () => {
        if (textareaRef.current) {
            setCursorPosition(textareaRef.current.selectionStart);
        }
    };

    // 在光标位置插入内容
    const insertAtCursor = (textToInsert: string) => {
        const before = content.substring(0, cursorPosition);
        const after = content.substring(cursorPosition);
        const newContent = before + textToInsert + after;
        setContent(newContent);
        // 更新光标位置到插入内容之后
        const newPosition = cursorPosition + textToInsert.length;
        setCursorPosition(newPosition);
        // 聚焦回 textarea 并设置光标位置
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
        // 直接插入 YouTube URL，渲染时会自动转换
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
            const response = await fetch('/api/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    content: content.trim(),
                    summary: summary.trim() || null,
                    imageUrl: null, // 图片通过内容中的 Markdown 插入
                }),
            });

            const result = await response.json();

            if (response.ok) {
                alert('✅ 文章发布成功！');
                router.push('/');
            } else {
                alert(`❌ 发布失败: ${result.error}`);
            }
        } catch (error) {
            console.error('发布失败:', error);
            alert('❌ 发布失败，请检查网络连接');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (userLoading) {
        return <div className="p-8">加载中...</div>;
    }

    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto p-4 sm:p-8">
                {/* 页面标题 */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📝 发布文章</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm"
                        >
                            {showPreview ? '编辑' : '预览'}
                        </button>
                        <button
                            onClick={() => router.push('/sources')}
                            className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 text-sm"
                        >
                            返回管理
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    {/* 标题输入 */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            文章标题 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="输入文章标题..."
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        />
                    </div>

                    {/* 摘要输入 */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            文章摘要 <span className="text-gray-400">(可选)</span>
                        </label>
                        <input
                            type="text"
                            value={summary}
                            onChange={e => setSummary(e.target.value)}
                            placeholder="简短描述文章内容..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        />
                    </div>

                    {/* 工具栏 */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex flex-wrap gap-3 items-center">
                            {/* 插入图片 */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={e => setImageUrl(e.target.value)}
                                    placeholder="图片 URL..."
                                    className="px-3 py-1.5 border border-gray-300 rounded text-sm w-48"
                                />
                                <button
                                    onClick={insertImage}
                                    disabled={!imageUrl}
                                    className="px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:bg-gray-300"
                                >
                                    🖼️ 插入图片
                                </button>
                            </div>

                            {/* 插入 YouTube */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={youtubeUrl}
                                    onChange={e => setYoutubeUrl(e.target.value)}
                                    placeholder="YouTube URL..."
                                    className="px-3 py-1.5 border border-gray-300 rounded text-sm w-48"
                                />
                                <button
                                    onClick={insertYouTube}
                                    disabled={!youtubeUrl}
                                    className="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:bg-gray-300"
                                >
                                    ▶️ 插入视频
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            💡 支持 Markdown 语法：**粗体**、*斜体*、# 标题、- 列表、{'>'} 引用、`代码`
                        </p>
                    </div>

                    {/* 内容编辑区 / 预览区 */}
                    {showPreview ? (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">预览</label>
                            <div
                                className="w-full min-h-[400px] p-4 border-2 border-gray-200 rounded-lg bg-white prose max-w-none"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                            />
                        </div>
                    ) : (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                文章内容 <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                onSelect={handleTextareaSelect}
                                onClick={handleTextareaSelect}
                                onKeyUp={handleTextareaSelect}
                                placeholder="在这里撰写您的文章内容...

支持 Markdown 语法：
# 一级标题
## 二级标题
**粗体文字**
*斜体文字*
- 列表项
> 引用
`代码`

💡 先点击编辑区确定光标位置，再插入图片或视频"
                                className="w-full min-h-[400px] px-4 py-3 border-2 border-gray-300 rounded-lg font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-y"
                            />
                        </div>
                    )}

                    {/* 发布按钮 */}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => router.push('/sources')}
                            className="px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-100"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !title.trim() || !content.trim()}
                            className="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? '发布中...' : '🚀 发布到深度'}
                        </button>
                    </div>
                </div>

                {/* 提示信息 */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2">📌 发布须知</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• 文章将自动发布到"深度"分类</li>
                        <li>• 支持 Markdown 格式，可插入图片和 YouTube 视频</li>
                        <li>• 发布后可在首页的"深度"分类中查看</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
