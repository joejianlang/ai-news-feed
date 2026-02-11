'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import Navbar from '@/components/Navbar';
import {
    Settings,
    DollarSign,
    Save,
    Plus,
    Trash2,
    Info,
    RefreshCw,
    MapPin,
    Clock
} from 'lucide-react';
import Toast from '@/components/Toast';

interface PricingConfig {
    scope: Record<string, number>;
    duration: Record<string, number>;
}

export default function AdminSettingsPage() {
    const router = useRouter();
    const { user, isLoading: isUserLoading } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const [pricing, setPricing] = useState<PricingConfig>({
        scope: { local: 50, city: 100, province: 200, national: 500 },
        duration: { '1': 10, '3': 25, '7': 50, '14': 80, '30': 150 }
    });

    useEffect(() => {
        if (!isUserLoading) {
            if (!user || user.role !== 'admin') {
                router.push('/');
            } else {
                fetchSettings();
            }
        }
    }, [user, isUserLoading, router]);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (data.ad_pricing) {
                setPricing(data.ad_pricing);
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSavePricing = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: 'ad_pricing',
                    value: pricing
                })
            });

            if (res.ok) {
                setToast({ message: '配置已成功保存并即时生效', type: 'success' });
            } else {
                throw new Error('Save failed');
            }
        } catch (err) {
            setToast({ message: '保存配置失败，请检查网络', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const updateScopePrice = (key: string, value: string) => {
        const num = parseInt(value) || 0;
        setPricing({
            ...pricing,
            scope: { ...pricing.scope, [key]: num }
        });
    };

    const updateDurationPrice = (key: string, value: string) => {
        const num = parseInt(value) || 0;
        setPricing({
            ...pricing,
            duration: { ...pricing.duration, [key]: num }
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

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Settings className="text-teal-600" size={32} />
                        <div>
                            <h1 className="text-3xl font-black italic uppercase tracking-tighter">全局系统设置</h1>
                            <p className="text-text-muted text-sm font-medium">配置广告定价、展示逻辑及系统全局开关</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSavePricing}
                        disabled={isSaving}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-teal-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
                        保存所有修改
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 投放范围定价 */}
                    <section className="bg-card border border-card-border rounded-3xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-card-border bg-black/5 flex items-center gap-2">
                            <MapPin size={18} className="text-teal-600" />
                            <h2 className="font-black uppercase tracking-wider text-sm">投放范围基础定价 ($)</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {Object.entries(pricing.scope).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between group">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm capitalize">{
                                            key === 'local' ? '周边 (Local)' :
                                                key === 'city' ? '市级 (City)' :
                                                    key === 'province' ? '省级 (Province)' :
                                                        key === 'national' ? '全国 (National)' : key
                                        }</span>
                                        <span className="text-[10px] text-text-muted font-mono">{key}</span>
                                    </div>
                                    <div className="relative">
                                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                        <input
                                            type="number"
                                            value={value}
                                            onChange={(e) => updateScopePrice(key, e.target.value)}
                                            className="bg-background border border-card-border rounded-xl pl-8 pr-4 py-2 w-32 font-black text-right focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 投放时长定价 */}
                    <section className="bg-card border border-card-border rounded-3xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-card-border bg-black/5 flex items-center gap-2">
                            <Clock size={18} className="text-teal-600" />
                            <h2 className="font-black uppercase tracking-wider text-sm">时长附加费用 ($)</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {Object.entries(pricing.duration).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between group">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm">{key} 天展示</span>
                                        <span className="text-[10px] text-text-muted font-mono">{key} days</span>
                                    </div>
                                    <div className="relative">
                                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                        <input
                                            type="number"
                                            value={value}
                                            onChange={(e) => updateDurationPrice(key, e.target.value)}
                                            className="bg-background border border-card-border rounded-xl pl-8 pr-4 py-2 w-32 font-black text-right focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            ))}
                            <div className="mt-4 p-4 bg-background/50 rounded-2xl border border-dashed border-card-border flex items-center gap-2 text-text-muted">
                                <Info size={14} />
                                <p className="text-[10px]">
                                    提示：总费用 = 范围基础价 + 时长附加费。
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="mt-12 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 p-6 rounded-3xl flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center text-orange-600 shrink-0">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <h4 className="font-black text-orange-800 dark:text-orange-400">计费说明</h4>
                        <p className="text-sm text-orange-700 dark:text-orange-300/80 leading-relaxed mt-1">
                            修改此处的定价后，所有**新创建**的广告订单将按新价格计算。已经在审核中或已上线的订单费用保持不变（以创建时的快照为准）。
                        </p>
                    </div>
                </div>
            </main>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
