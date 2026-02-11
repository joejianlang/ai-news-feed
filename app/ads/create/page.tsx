'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { createAd } from '@/lib/supabase/queries';
import { polishAdContent } from '@/lib/ai/ad';
import AdCard from '@/components/AdCard';
import Navbar from '@/components/Navbar';
import {
    ArrowLeft,
    Sparkles,
    Upload,
    CheckCircle,
    CreditCard,
    Layout,
    ExternalLink,
    Smartphone,
    Check
} from 'lucide-react';

export default function AdCreatePage() {
    const router = useRouter();
    const { user, isLoading: isUserLoading } = useUser();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [productName, setProductName] = useState('');
    const [rawContent, setRawContent] = useState('');
    const [adTitle, setAdTitle] = useState('');
    const [finalContent, setFinalContent] = useState('');
    const [scope, setScope] = useState<'local' | 'city' | 'province' | 'national'>('local');
    const [duration, setDuration] = useState('7');
    const [imageUrl, setImageUrl] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [price, setPrice] = useState(0);

    // Pricing (Static for now, can be moved to config)
    const PRICING = {
        scope: { local: 50, city: 100, province: 200, national: 500 },
        duration: { '1': 10, '3': 25, '7': 50, '14': 80, '30': 150 }
    };

    useEffect(() => {
        const sPrice = PRICING.scope[scope as keyof typeof PRICING.scope] || 0;
        const dPrice = PRICING.duration[duration as keyof typeof PRICING.duration] || 0;
        setPrice(sPrice + dPrice);
    }, [scope, duration]);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login?redirect=/ads/create');
        }
    }, [user, isUserLoading, router]);

    const handleAIOptimize = async () => {
        if (!productName || !rawContent) {
            alert('请填写产品名称和原始描述');
            return;
        }
        setIsLoading(true);
        try {
            const polished = await polishAdContent(productName, rawContent);
            setAdTitle(polished.title);
            setFinalContent(polished.content);
            setStep(2);
        } catch (err) {
            console.error(err);
            alert('AI 润色失败，请尝试手动编辑');
            setAdTitle(productName);
            setFinalContent(rawContent);
            setStep(2);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            await createAd({
                user_id: user.id,
                title: adTitle,
                content: finalContent,
                raw_content: rawContent,
                image_url: imageUrl,
                link_url: linkUrl,
                contact_info: contactInfo,
                scope: scope,
                duration_days: parseInt(duration),
                price_total: price,
                status: 'pending',
                payment_status: 'paid', // Simulate payment as successful
            });
            setStep(4);
        } catch (err) {
            console.error(err);
            alert('提交失败，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    if (isUserLoading || !user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors">
            <Navbar />

            <main className="max-w-xl mx-auto px-4 py-8">
                {/* Step Indicator */}
                <div className="flex justify-between mb-10 px-4">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full mx-1 transition-all duration-500 \${
                i <= step ? 'bg-teal-600' : 'bg-card-border'
              }`}
                        />
                    ))}
                </div>

                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : router.back()}
                        className="flex items-center gap-1 text-text-muted hover:text-foreground mb-4 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        <span className="text-sm font-medium">返回</span>
                    </button>
                    <h1 className="text-3xl font-black tracking-tight">发布赞助广告</h1>
                    <p className="text-text-muted mt-2">让更多人看到您的产品或服务</p>
                </div>

                {/* Step 1: Input */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-black mb-2 uppercase tracking-wider text-text-muted">产品/服务名称</label>
                                <input
                                    type="text"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    placeholder="例如：高端智能家居清洁"
                                    className="w-full bg-card border border-card-border rounded-2xl p-4 focus:ring-2 focus:ring-teal-500/50 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-black mb-2 uppercase tracking-wider text-text-muted">原始描述 (草稿)</label>
                                <textarea
                                    value={rawContent}
                                    onChange={(e) => setRawContent(e.target.value)}
                                    placeholder="简单描述一下您的业务特点，剩下的交给 AI..."
                                    rows={4}
                                    className="w-full bg-card border border-card-border rounded-2xl p-4 focus:ring-2 focus:ring-teal-500/50 outline-none transition-all resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-black mb-2 uppercase tracking-wider text-text-muted">广告图片链接 (URL)</label>
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full bg-card border border-card-border rounded-2xl p-4 focus:ring-2 focus:ring-teal-500/50 outline-none transition-all"
                                />
                                <p className="text-[10px] text-text-muted mt-1 px-1">目前仅支持输入图片 URL 地址</p>
                            </div>
                        </div>

                        <button
                            onClick={handleAIOptimize}
                            disabled={isLoading || !productName || !rawContent}
                            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    使用 AI 智能润色
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Step 2: Content & Preview */}
                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-text-muted">
                                <Smartphone size={16} />
                                <span className="text-xs font-bold uppercase tracking-widest">效果预览 (模拟手机端)</span>
                            </div>
                            <div className="border border-card-border rounded-3xl p-4 bg-background dark:bg-black/40">
                                <AdCard ad={{ title: adTitle, content: finalContent, image_url: imageUrl }} isPreview />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-black mb-1 text-text-muted uppercase">微调标题</label>
                                <input
                                    type="text"
                                    value={adTitle}
                                    onChange={(e) => setAdTitle(e.target.value)}
                                    className="w-full bg-card border border-card-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-black mb-1 text-text-muted uppercase">微调描述</label>
                                <textarea
                                    value={finalContent}
                                    onChange={(e) => setFinalContent(e.target.value)}
                                    rows={3}
                                    className="w-full bg-card border border-card-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500/50 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-4 bg-card hover:bg-card-border border border-card-border text-foreground font-bold rounded-2xl transition-all"
                            >
                                返回修改
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                className="flex-2 py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl shadow-lg shadow-teal-500/20 transition-all"
                            >
                                选取投放范围
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Settings & Payment */}
                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <section className="space-y-4">
                            <label className="block text-sm font-black uppercase tracking-wider text-text-muted">投放范围</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['local', 'city', 'province', 'national'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setScope(s as any)}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 \${
                      scope === s 
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-400' 
                        : 'border-card-border bg-card text-text-muted'
                    }`}
                                    >
                                        <span className="font-black text-sm uppercase">
                                            {s === 'local' ? '本地周边' : s === 'city' ? '全市投放' : s === 'province' ? '全省范围' : '全国范围'}
                                        </span>
                                        <span className="text-xs opacity-60">
                                            ${PRICING.scope[s as keyof typeof PRICING.scope]} 起
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <label className="block text-sm font-black uppercase tracking-wider text-text-muted">投放时长</label>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {['1', '3', '7', '14', '30'].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setDuration(d)}
                                        className={`min-w-[70px] p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 flex-shrink-0 \${
                      duration === d 
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-400' 
                        : 'border-card-border bg-card text-text-muted'
                    }`}
                                    >
                                        <span className="font-black text-sm">{d}天</span>
                                        <span className="text-[10px] opacity-60">${PRICING.duration[d as keyof typeof PRICING.duration]}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <div className="space-y-4 border-t border-card-border pt-6">
                            <div>
                                <label className="block text-sm font-black mb-2 uppercase tracking-wider text-text-muted">联系方式 (对外展示)</label>
                                <input
                                    type="text"
                                    value={contactInfo}
                                    onChange={(e) => setContactInfo(e.target.value)}
                                    placeholder="电话、微信或网址"
                                    className="w-full bg-card border border-card-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-black mb-2 uppercase tracking-wider text-text-muted">跳转链接 (可选)</label>
                                <input
                                    type="text"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-card border border-card-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500/50"
                                />
                            </div>
                        </div>

                        <div className="bg-foreground text-background dark:bg-foreground dark:text-background p-6 rounded-3xl shadow-xl flex items-center justify-between">
                            <div>
                                <p className="opacity-60 text-xs font-bold uppercase tracking-widest">预估总费用</p>
                                <p className="text-4xl font-black">$\${price}</p>
                            </div>
                            <button
                                onClick={handlePublish}
                                disabled={isLoading}
                                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-lg transition-all active:scale-95"
                            >
                                {isLoading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                                ) : (
                                    <>
                                        <CreditCard size={20} />
                                        确认支付并发布
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Success */}
                {step === 4 && (
                    <div className="text-center py-12 animate-in zoom-in-95 fade-in">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner ring-4 ring-green-50 dark:ring-green-900/10">
                            <Check size={48} strokeWidth={3} />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight mb-3">提交成功！</h2>
                        <p className="text-text-muted font-medium mb-10 max-w-sm mx-auto">
                            您的赞助内容已提交审核，通常在 24 小时内完成。您可以在用户中心查看进度。
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="px-10 py-4 bg-card hover:bg-card-border border border-card-border text-foreground font-black rounded-2xl shadow-sm transition-all"
                        >
                            回首页
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
