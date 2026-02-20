'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    CheckCircle,
    Clock,
    Archive,
    Grid,
    Layout
} from 'lucide-react';
import Toast from '@/components/Toast';

interface FormTemplate {
    id: string;
    name: string;
    description: string;
    type: 'standard' | 'custom' | 'complex' | 'provider_reg';
    status: 'draft' | 'published' | 'archived';
    color: string;
    is_popular: boolean;
    created_at: string;
}

export default function AdminFormsPage() {
    const [templates, setTemplates] = useState<FormTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/forms');
            const data = await res.json();
            if (data.templates) {
                setTemplates(data.templates);
            }
        } catch (err) {
            console.error('Failed to fetch templates:', err);
            setToast({ message: '获取表单模板失败', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || t.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'draft': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'archived': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'standard': return '标准表单';
            case 'custom': return '定制表单';
            case 'complex': return '复杂需求';
            case 'provider_reg': return '入驻申请';
            default: return type;
        }
    };

    return (
        <div className="p-8">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">
                <span>业务管理</span>
                <span className="opacity-30">/</span>
                <span>定制服务中心</span>
                <span className="opacity-30">/</span>
                <span className="text-teal-500">定制服务表单</span>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-4">
                        <div className="p-2 bg-teal-500 rounded-2xl shadow-lg shadow-teal-500/20">
                            <Layout className="w-8 h-8 text-white" />
                        </div>
                        定制服务表单
                    </h1>
                    <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">
                        设计并管理面向不同业务场景的个性化服务需求收集表单。
                    </p>
                </div>
                <button className="flex items-center gap-3 bg-teal-600 hover:bg-teal-500 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-teal-600/20 active:scale-95">
                    <Plus className="w-5 h-5" />
                    新建服务表单
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="搜索表单名称或描述..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-teal-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    className="bg-slate-50 dark:bg-slate-950 border-none rounded-2xl py-3.5 px-6 text-sm font-bold focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                >
                    <option value="all">所有类型</option>
                    <option value="standard">标准表单</option>
                    <option value="custom">定制表单</option>
                    <option value="complex">复杂需求</option>
                    <option value="provider_reg">入驻申请</option>
                </select>

                <select
                    className="bg-slate-50 dark:bg-slate-950 border-none rounded-2xl py-3.5 px-6 text-sm font-bold focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">所有状态</option>
                    <option value="published">已发布</option>
                    <option value="draft">草稿</option>
                    <option value="archived">已归档</option>
                </select>

                <button className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl text-slate-500 hover:text-teal-500 transition-colors">
                    <Filter className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-3xl border border-slate-200 dark:border-slate-800"></div>
                    ))}
                </div>
            ) : filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredTemplates.map((template) => (
                        <div
                            key={template.id}
                            className="group bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-teal-500/30 transition-all duration-500 flex flex-col relative overflow-hidden"
                        >
                            {/* Accent line */}
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-right" style={{ backgroundColor: template.color }}></div>

                            <div className="flex items-start justify-between mb-8">
                                <div
                                    className="w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-110 duration-500"
                                    style={{ backgroundColor: template.color }}
                                >
                                    <Grid className="w-8 h-8" />
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(template.status)}`}>
                                        {template.status === 'published' ? '已上线' : template.status}
                                    </div>
                                    <button className="p-2.5 text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-teal-500 transition-colors line-clamp-1">
                                        {template.name}
                                    </h3>
                                    {template.is_popular && (
                                        <span className="px-2.5 py-1 bg-rose-500 text-white text-[9px] font-black rounded-lg uppercase shadow-lg shadow-rose-500/20 animate-pulse">
                                            热门
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">
                                    {template.description}
                                </p>
                            </div>

                            <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">属性</span>
                                    <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                                        {getTypeLabel(template.type)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-teal-500 transition-colors px-4 py-2 hover:bg-teal-500/5 rounded-xl">
                                        <Edit className="w-4 h-4" />
                                        设计
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 shadow-inner">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                        <Archive className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">暂无匹配表单</h3>
                    <p className="text-slate-500 font-medium">尝试更换搜索关键词或筛选条件，或创建一个新的表单。</p>
                </div>
            )}

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
