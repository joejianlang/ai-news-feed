'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/contexts/UserContext';
import { Plus, Edit2, Trash2, ChevronLeft, Loader2, Store, Search, ExternalLink, Settings2, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Service {
    id: string;
    title: string;
    price: string;
    price_unit: string;
    status: string;
    images?: string[];
    category_id: string;
    service_categories?: { name: string };
    created_at: string;
}

export default function MyServicesPage() {
    const { user, isLoading: isUserLoading } = useUser();
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        } else if (user) {
            loadMyServices();
        }
    }, [user, isUserLoading]);

    const loadMyServices = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/services?userId=${user?.id}`);
            const data = await response.json();
            setServices(data.services || []);
        } catch (error) {
            console.error('Failed to load my services:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要下架并删除该服务吗？')) return;
        try {
            const res = await fetch(`/api/services?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadMyServices();
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    if (isUserLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const filteredServices = services.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 transition-colors duration-300 pb-24">
            <Navbar />

            <div className="max-w-4xl mx-auto p-4 lg:p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pt-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 shadow-xl"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black italic tracking-tighter">我的服务清单.</h1>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">管理您在数位 Buffet 发布的专业服务</p>
                        </div>
                    </div>

                    <Link
                        href="/services?action=create"
                        className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 h-14 rounded-2xl font-black shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={22} />
                        发布新服务
                    </Link>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                        <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">活跃中</div>
                        <div className="text-3xl font-black">{services.length}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                        <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">本月展示</div>
                        <div className="text-3xl font-black">1.2k</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                        <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">询价次数</div>
                        <div className="text-3xl font-black">28</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                        <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">星级评分</div>
                        <div className="text-3xl font-black">4.9</div>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="relative mb-8 group">
                    <div className="absolute inset-0 bg-indigo-500/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                    <input
                        type="text"
                        placeholder="在您的服务中搜索..."
                        className="w-full h-16 pl-14 pr-6 bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-2xl text-slate-100 font-bold outline-none transition-all placeholder:text-slate-500 relative z-10 backdrop-blur-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Services Grid/List */}
                <div className="grid gap-6">
                    {filteredServices.length === 0 ? (
                        <div className="bg-white/5 rounded-[40px] p-20 text-center border border-dashed border-white/10">
                            <div className="w-24 h-24 bg-white/5 flex items-center justify-center rounded-3xl mx-auto mb-6">
                                <Store className="w-12 h-12 text-slate-700" />
                            </div>
                            <h3 className="text-2xl font-black mb-2">还未发布任何服务</h3>
                            <p className="text-slate-400 font-bold mb-10 max-w-sm mx-auto">开启您的服务商旅程，让更多本地用户发现您的专业技能。</p>
                            <Link
                                href="/services"
                                className="inline-flex items-center gap-2 bg-white text-slate-900 px-10 h-14 rounded-2xl font-black hover:bg-slate-100 transition-colors"
                            >
                                立即前往发布
                            </Link>
                        </div>
                    ) : (
                        filteredServices.map((service) => (
                            <div key={service.id} className="bg-white/5 border border-white/10 hover:border-white/20 rounded-[32px] overflow-hidden backdrop-blur-sm group transition-all">
                                <div className="flex flex-col sm:flex-row p-6 gap-6 items-center">
                                    {/* Thumbnail */}
                                    <div className="w-full sm:w-32 aspect-video sm:aspect-square bg-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/40 flex-shrink-0 relative">
                                        {service.images?.[0] ? (
                                            <img src={service.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                <Store size={32} />
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-tighter border border-white/10">
                                            {service.service_categories?.name || '通用服务'}
                                        </div>
                                    </div>

                                    {/* Main Info */}
                                    <div className="flex-1 text-center sm:text-left min-w-0">
                                        <h3 className="text-xl font-black mb-1 truncate">{service.title}</h3>
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-1 text-emerald-400">
                                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                                                活跃中
                                            </span>
                                            <span>•</span>
                                            <span>发布于: {new Date(service.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="mt-4 flex items-center justify-center sm:justify-start gap-2">
                                            <span className="text-2xl font-black text-emerald-400 tracking-tighter">${service.price}</span>
                                            <span className="text-xs text-slate-500 font-bold">{service.price_unit}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 sm:flex-col sm:items-end w-full sm:w-auto mt-4 sm:mt-0 pt-6 sm:pt-0 border-t border-white/5 sm:border-0 justify-center">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => router.push(`/services/edit/${service.id}`)}
                                                className="p-3 bg-white/5 hover:bg-indigo-600 rounded-2xl transition-all border border-white/10 group/btn"
                                            >
                                                <Edit2 className="w-5 h-5 text-slate-400 group-hover/btn:text-white" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(service.id)}
                                                className="p-3 bg-white/5 hover:bg-red-600 rounded-2xl transition-all border border-white/10 group/btn"
                                            >
                                                <Trash2 className="w-5 h-5 text-slate-400 group-hover/btn:text-white" />
                                            </button>
                                        </div>
                                        <div className="sm:mt-4 text-[9px] font-black text-slate-500 uppercase tracking-widest hidden sm:block">点击卡片查看详情</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-16 pt-10 border-t border-white/5 flex flex-col items-center gap-4 text-center">
                    <div className="p-4 bg-indigo-500/10 rounded-full">
                        <Settings2 className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h4 className="font-black italic">需要更多流量？</h4>
                    <p className="text-xs text-slate-400 font-bold max-w-xs uppercase tracking-tight">尝试在您的服务中添加更多精美图片，或者联系“数位 Buffet”开启优先置顶功能。</p>
                    <button className="px-6 h-10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors">联系平台支持</button>
                </div>
            </div>
        </div>
    );
}
