'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import Navbar from '@/components/Navbar';
import {
    Shield,
    Save,
    RefreshCw,
    FileText,
    Eye,
    ChevronLeft,
    AlertCircle,
    Info
} from 'lucide-react';
import Toast from '@/components/Toast';
import { renderMarkdown } from '@/lib/utils/markdown';

interface Agreement {
    title: string;
    content: string;
}

export default function AdminAgreementsPage() {
    const router = useRouter();
    const { user, isLoading: isUserLoading } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeKey, setActiveKey] = useState<string>('agreement_registration');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [previewMode, setPreviewMode] = useState(false);

    const [agreements, setAgreements] = useState<Record<string, Agreement>>({
        'agreement_registration': { title: '用户注册协议', content: '' },
        'agreement_privacy': { title: '隐私政策/保密协议', content: '' },
        'agreement_ad_service': { title: '广告发布服务协议', content: '' }
    });

    useEffect(() => {
        if (!isUserLoading) {
            if (!user || user.role !== 'admin') {
                router.push('/');
            } else {
                fetchAgreements();
            }
        }
    }, [user, isUserLoading, router]);

    const fetchAgreements = async () => {
        try {
            const res = await fetch('/api/agreements');
            const data = await res.json();

            const updated: Record<string, Agreement> = { ...agreements };
            Object.keys(data).forEach(key => {
                if (updated[key]) {
                    updated[key] = data[key];
                }
            });
            setAgreements(updated);
        } catch (err) {
            console.error('Failed to fetch agreements:', err);
            setToast({ message: '加载协议失败', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: activeKey,
                    value: agreements[activeKey]
                })
            });

            if (res.ok) {
                setToast({ message: '协议已成功保存并立即生效', type: 'success' });
            } else {
                throw new Error('Save failed');
            }
        } catch (err) {
            setToast({ message: '保存协议失败，请检查网络', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const updateContent = (content: string) => {
        setAgreements({
            ...agreements,
            [activeKey]: { ...agreements[activeKey], content }
        });
    };

    const updateTitle = (title: string) => {
        setAgreements({
            ...agreements,
            [activeKey]: { ...agreements[activeKey], title }
        });
    };

    if (isUserLoading || !user || user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/admin/settings')}
                            className="p-2 hover:bg-card border border-card-border rounded-xl transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black flex items-center gap-2 italic">
                                <Shield className="text-teal-600" />
                                协议文档管理
                            </h1>
                            <p className="text-text-muted mt-1 font-bold">管理注册、隐私及广告服务的法律合规文档</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setPreviewMode(!previewMode)}
                            className={`px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all ${previewMode ? 'bg-teal-600 text-white' : 'bg-card border border-card-border text-text-muted hover:border-teal-500'}`}
                        >
                            {previewMode ? <FileText size={20} /> : <Eye size={20} />}
                            {previewMode ? '返回编辑' : '实时预览'}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || isLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
                            保 存
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1 space-y-3">
                        <div className="text-[11px] font-black text-text-muted uppercase tracking-widest px-2 mb-2">协议清单</div>
                        {Object.entries(agreements).map(([key, value]) => (
                            <button
                                key={key}
                                onClick={() => { setActiveKey(key); setPreviewMode(false); }}
                                className={`w-full text-left p-4 rounded-2xl transition-all border-2 flex items-center gap-3 ${activeKey === key ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'bg-card border-transparent hover:border-card-border text-text-muted'}`}
                            >
                                <div className={`p-2 rounded-lg ${activeKey === key ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-100 dark:bg-white/5'}`}>
                                    <FileText size={18} />
                                </div>
                                <span className="font-black text-sm">{value.title}</span>
                            </button>
                        ))}

                        <div className="mt-8 p-4 bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800/30 rounded-2xl">
                            <div className="flex items-center gap-2 text-teal-600 mb-2">
                                <Info size={16} />
                                <span className="text-[11px] font-black uppercase tracking-widest">排版说明</span>
                            </div>
                            <p className="text-[12px] text-teal-800 dark:text-teal-400 font-bold leading-relaxed">
                                支持 Markdown 语法。# 代表一级标题，** 代表加粗。修改将实时同步到用户端弹窗中。
                            </p>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        {isLoading ? (
                            <div className="h-[600px] bg-card border border-card-border rounded-3xl animate-pulse"></div>
                        ) : (
                            <div className="bg-card border border-card-border rounded-3xl shadow-xl overflow-hidden flex flex-col h-[700px]">
                                <div className="p-6 border-b border-card-border bg-black/5">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[11px] font-black text-text-muted uppercase tracking-widest ml-1">协议显示名称</label>
                                        <input
                                            type="text"
                                            value={agreements[activeKey].title}
                                            onChange={(e) => updateTitle(e.target.value)}
                                            className="bg-transparent text-xl font-black outline-none border-b border-transparent focus:border-indigo-500 transition-colors"
                                            placeholder="输入协议标题..."
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-hidden relative">
                                    {previewMode ? (
                                        <div className="h-full overflow-y-auto p-10 bg-white dark:bg-slate-900">
                                            <div
                                                className="prose dark:prose-invert max-w-none"
                                                dangerouslySetInnerHTML={{ __html: renderMarkdown(agreements[activeKey].content) }}
                                            />
                                        </div>
                                    ) : (
                                        <textarea
                                            value={agreements[activeKey].content}
                                            onChange={(e) => updateContent(e.target.value)}
                                            className="w-full h-full p-8 bg-transparent outline-none font-mono text-[13px] leading-relaxed resize-none"
                                            placeholder="在此输入协议正文内容，支持 Markdown..."
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
