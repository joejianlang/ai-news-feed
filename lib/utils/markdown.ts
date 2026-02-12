/**
 * 极简 Markdown 渲染器
 * 核心逻辑提取自 app/publish/page.tsx
 */
export function renderMarkdown(content: string): string {
    if (!content) return '';

    let html = content;

    // YouTube 嵌入 - 检测 YouTube URL 并转换为 iframe
    html = html.replace(
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n\s]+)/g,
        (match, videoId) => `<div class="my-4 aspect-video"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen class="w-full h-full rounded-lg shadow-sm"></iframe></div>`
    );

    // 图片
    html = html.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" class="max-w-full rounded-lg my-4 shadow-sm" />'
    );

    // 链接
    html = html.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-teal-600 hover:underline font-bold">$1</a>'
    );

    // 标题
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-xl font-black mt-6 mb-2 tracking-tight">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-black mt-8 mb-3 tracking-tight">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-3xl font-black mt-8 mb-4 tracking-tight">$1</h1>');

    // 粗体和斜体
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // 代码块
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-800 dark:bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto text-xs font-mono"><code>$2</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code class="bg-card-border/50 text-red-500 px-1 py-0.5 rounded font-mono text-xs">$1</code>');

    // 引用
    html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-teal-500/30 pl-4 my-4 italic text-text-muted bg-teal-500/5 py-2 pr-2 rounded-r">$1</blockquote>');

    // 列表
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>');

    // 段落
    // 避免对已经是 HTML 标签的行进行段落包装
    const lines = html.split('\n');
    const processedLines = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('<')) return line; // 已经是 HTML
        return `<p class="my-3 leading-relaxed">${line}</p>`;
    });

    return processedLines.join('\n');
}
