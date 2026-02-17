'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/contexts/UserContext';
import { ChevronLeft, Save, Loader2, MapPin, Phone, User as UserIcon } from 'lucide-react';

export default function AddAddressPage() {
    const { user, isLoading: isUserLoading } = useUser();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        is_default: false
    });

    if (isUserLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/user/addresses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                router.push('/profile/addresses');
            } else {
                alert('添加失败，请稍后重试');
            }
        } catch (error) {
            console.error('Failed to save address:', error);
            alert('网络错误');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground transition-colors duration-300">
            <Navbar />

            <div className="max-w-2xl mx-auto p-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8 pt-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-full transition-colors shadow-sm border border-slate-200 dark:border-slate-800"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-black italic">新增地址.</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                        <h2 className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest px-1">联系人信息</h2>

                        <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                required
                                placeholder="收货人姓名"
                                className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-teal-500 font-bold transition-all"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="tel"
                                required
                                placeholder="手机号码"
                                className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-teal-500 font-bold transition-all"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Address Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                        <h2 className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest px-1">收货地址</h2>

                        <div className="relative">
                            <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                            <textarea
                                required
                                placeholder="详细地址（如：某某路某某号）"
                                className="w-full min-h-[100px] pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-teal-500 font-bold transition-all resize-none"
                                value={formData.address_line1}
                                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                            />
                        </div>

                        <input
                            type="text"
                            placeholder="门牌号/楼层等（选填）"
                            className="w-full h-14 px-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-teal-500 font-bold transition-all"
                            value={formData.address_line2}
                            onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                required
                                placeholder="城市"
                                className="w-full h-14 px-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-teal-500 font-bold transition-all"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                            <input
                                type="text"
                                required
                                placeholder="省份/地区"
                                className="w-full h-14 px-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-teal-500 font-bold transition-all"
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            />
                        </div>

                        <input
                            type="text"
                            required
                            placeholder="邮政编码"
                            className="w-full h-14 px-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-teal-500 font-bold transition-all"
                            value={formData.postal_code}
                            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        />
                    </div>

                    {/* Settings Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <div>
                                <h3 className="font-bold text-slate-700 dark:text-slate-200">设为默认地址</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">每次下单默认使用的地址</p>
                            </div>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.is_default}
                                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                />
                                <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-teal-600 shadow-sm shadow-black/5"></div>
                            </div>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-16 bg-teal-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-teal-500/30 hover:bg-teal-700 transition-all flex items-center justify-center gap-3 disabled:opacity-70 active:scale-[0.98]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                正在保存...
                            </>
                        ) : (
                            <>
                                <Save className="w-6 h-6" />
                                保存地址
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-slate-300 dark:text-slate-700 text-[10px] font-black pt-8 uppercase tracking-[0.2em]">数位 Buffet 加密传输协议</p>
            </div>
        </div>
    );
}
