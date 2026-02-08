'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ConfigItem {
    value: string;
    description: string;
    updated_at: string;
}

interface AIConfig {
    filter_rules?: ConfigItem;
    summary_requirements?: ConfigItem;
    commentary_requirements?: ConfigItem;
    commentary_length_article?: ConfigItem;
    commentary_length_video?: ConfigItem;
    commentary_length_deep_dive?: ConfigItem;
}

export default function AIConfigPage() {
    const router = useRouter();
    const [config, setConfig] = useState<AIConfig>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // 表单状态
    const [filterRules, setFilterRules] = useState('');
    const [summaryReq, setSummaryReq] = useState('');
    const [commentaryReq, setCommentaryReq] = useState('');
    const [articleLength, setArticleLength] = useState('');
    const [videoLength, setVideoLength] = useState('');
    const [deepDiveLength, setDeepDiveLength] = useState('');

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const response = await fetch('/api/admin/ai-config');
            if (response.status === 403) {
                router.push('/login');
                return;
            }
            if (!response.ok) throw new Error('Failed to load config');

            const data = await response.json();
            setConfig(data);

            // 填充表单
            setFilterRules(data.filter_rules?.value || '');
            setSummaryReq(data.summary_requirements?.value || '');
            setCommentaryReq(data.commentary_requirements?.value || '');
            setArticleLength(data.commentary_length_article?.value || '');
            setVideoLength(data.commentary_length_video?.value || '');
            setDeepDiveLength(data.commentary_length_deep_dive?.value || '');
        } catch (error) {
            console.error('Error loading config:', error);
            setMessage({ type: 'error', text: '加载配置失败' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);

        try {
            const response = await fetch('/api/admin/ai-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filter_rules: filterRules,
                    summary_requirements: summaryReq,
                    commentary_requirements: commentaryReq,
                    commentary_length_article: articleLength,
                    commentary_length_video: videoLength,
                    commentary_length_deep_dive: deepDiveLength,
                }),
            });

            if (!response.ok) throw new Error('Failed to save config');

            setMessage({ type: 'success', text: '配置已保存，下次抓取时生效' });
            loadConfig(); // 刷新数据
        } catch (error) {
            console.error('Error saving config:', error);
            setMessage({ type: 'error', text: '保存失败，请重试' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-4 sm:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">加载中...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                {/* 头部 */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">AI 配置管理</h1>
                        <p className="text-gray-600 text-sm mt-1">配置 AI 内容审查规则和提示词模板</p>
                    </div>
                    <Link
                        href="/admin"
                        className="text-teal-600 hover:text-teal-700 font-medium"
                    >
                        ← 返回管理后台
                    </Link>
                </div>

                {/* 消息提示 */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                {/* 配置表单 */}
                <div className="space-y-6">
                    {/* 内容过滤规则 */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">🚫 内容过滤规则</h2>
                        <p className="text-gray-500 text-sm mb-4">
                            AI 会自动跳过符合以下规则的内容，每行一条规则
                        </p>
                        <textarea
                            value={filterRules}
                            onChange={(e) => setFilterRules(e.target.value)}
                            rows={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-800"
                            placeholder="每行一条过滤规则..."
                        />
                    </div>

                    {/* 摘要要求 */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">📝 摘要生成要求</h2>
                        <p className="text-gray-500 text-sm mb-4">
                            {config.summary_requirements?.description || '定义 AI 如何生成内容摘要'}
                        </p>
                        <input
                            type="text"
                            value={summaryReq}
                            onChange={(e) => setSummaryReq(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-800"
                            placeholder="例如：80-150字，概括核心内容..."
                        />
                    </div>

                    {/* 评论要求 */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">💬 评论生成要求</h2>
                        <p className="text-gray-500 text-sm mb-4">
                            定义 AI 评论的风格和语言要求
                        </p>
                        <textarea
                            value={commentaryReq}
                            onChange={(e) => setCommentaryReq(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-800"
                            placeholder="例如：幽默犀利，有深度有趣味..."
                        />
                    </div>

                    {/* 评论字数要求 */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">📏 评论字数要求</h2>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    文章评论
                                </label>
                                <input
                                    type="text"
                                    value={articleLength}
                                    onChange={(e) => setArticleLength(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-800"
                                    placeholder="300-500字"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    视频评论
                                </label>
                                <input
                                    type="text"
                                    value={videoLength}
                                    onChange={(e) => setVideoLength(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-800"
                                    placeholder="150-250字"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    深度分析
                                </label>
                                <input
                                    type="text"
                                    value={deepDiveLength}
                                    onChange={(e) => setDeepDiveLength(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-800"
                                    placeholder="800-1000字"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 保存按钮 */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-teal-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md transition-colors"
                        >
                            {isSaving ? '保存中...' : '💾 保存配置'}
                        </button>
                    </div>
                </div>

                {/* 最后更新时间 */}
                {config.filter_rules?.updated_at && (
                    <div className="mt-8 text-center text-sm text-gray-500">
                        最后更新：{new Date(config.filter_rules.updated_at).toLocaleString('zh-CN')}
                    </div>
                )}
            </div>
        </div>
    );
}
