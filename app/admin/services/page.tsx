'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import {
    ShieldCheck,
    Search,
    Filter,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Eye,
    Trash2,
    ChevronLeft,
    Star
} from 'lucide-react';
import Image from 'next/image';

interface Service {
    id: string;
    title: string;
    price: string;
    price_unit: string;
    status: 'active' | 'pending' | 'closed';
    contact_name: string;
    contact_phone: string;
    created_at: string;
    images: string[];
}

export default function ServiceAuditPage() {
    const { user, isLoading: isUserLoading } = useUser();
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (!isUserLoading && user?.role !== 'admin') {
            router.push('/');
        } else {
            loadServices();
        }
    }, [user, isUserLoading, router]);

    const loadServices = async () => {
        try {
            setLoading(true);
            const url = `/api/admin/services?limit=100${filter !== 'all' ? `&status=${filter}` : ''}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.services) {
                setServices(data.services);
            }
        } catch (error) {
            console.error('Failed to load services:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const response = await fetch('/api/admin/services', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });

            if (response.ok) {
                setServices(prev => prev.map(s => s.id === id ? { ...s, status: newStatus as any } : s));
            }
        } catch (error) {
            console.error('Failed to update service status:', error);
        }
    };

    if (isUserLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-6 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/admin')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <ShieldCheck className="w-7 h-7 text-emerald-500" />
                            师父审核管理
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="搜索标题、师父姓名..."
                                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-teal-500 w-64 transition-all"
                            />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-bold px-4 py-2 focus:ring-2 focus:ring-teal-500 transition-all"
                        >
                            <option value="all">所有状态</option>
                            <option value="pending">待审核</option>
                            <option value="active">已通过</option>
                            <option value="closed">已驳回</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-8">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">服务项目</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">师父信息</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">价格</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">状态</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {services.map((service) => (
                                <tr key={service.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-12 relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                                                {service.images?.[0] && (
                                                    <Image src={service.images[0]} alt="" fill className="object-cover" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{service.title}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{new Date(service.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{service.contact_name}</div>
                                        <div className="text-xs text-slate-500">{service.contact_phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-black text-emerald-600">¥{service.price} <span className="text-xs font-medium text-slate-400">/{service.price_unit}</span></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${service.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500' :
                                            service.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500' :
                                                'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-500'
                                            }`}>
                                            {service.status === 'active' ? '已上线' : service.status === 'pending' ? '待审核' : '已驳回'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {service.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(service.id, 'active')}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-all"
                                                        title="通过审核"
                                                    >
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(service.id, 'closed')}
                                                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                                                        title="驳回申请"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                            <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-rose-400">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {services.length === 0 && (
                        <div className="py-20 text-center">
                            <ShieldCheck className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold italic">暂无待处理的服务申请</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
