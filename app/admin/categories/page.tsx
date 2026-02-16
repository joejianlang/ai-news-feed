'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import Navbar from '@/components/Navbar';
import {
    LayoutGrid,
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    RefreshCw,
    FolderPlus,
    Info,
    ArrowLeft
} from 'lucide-react';
import Toast from '@/components/Toast';
import type { Category } from '@/types';

export default function AdminCategoriesPage() {
    const router = useRouter();
    const { user, isLoading: isUserLoading } = useUser();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        if (!isUserLoading) {
            if (!user || user.role !== 'admin') {
                router.push('/');
            } else {
                fetchCategories();
            }
        }
    }, [user, isUserLoading, router]);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/categories');
            const data = await res.json();
            if (data.categories) {
                setCategories(data.categories);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            setToast({ message: '加载分类失败', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setToast({ message: '分类名称不能为空', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId ? { id: editingId, ...formData } : formData;

            const res = await fetch('/api/admin/categories', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setToast({ message: editingId ? '分类已更新' : '分类已创建', type: 'success' });
                setShowForm(false);
                setEditingId(null);
                setFormData({ name: '', description: '' });
                fetchCategories();
            } else {
                throw new Error('Action failed');
            }
        } catch (error) {
            setToast({ message: '保存失败，请检查网络', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingId(category.id);
        setFormData({
            name: category.name,
            description: category.description || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这个分类吗？这可能会影响到归属于该分类的新闻源。')) return;

        try {
            const res = await fetch(`/api/admin/categories?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setToast({ message: '分类已删除', type: 'success' });
                fetchCategories();
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            setToast({ message: '删除失败', type: 'error' });
        }
    };

    if (isUserLoading || !user || user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <button
                            onClick={() => router.push('/admin/settings')}
                            className="flex items-center gap-1 text-text-muted hover:text-foreground mb-4 transition-colors font-bold text-sm"
                        >
                            <ArrowLeft size={16} />
                            返回系统设置
                        </button>
                        <div className="flex items-center gap-3">
                            <LayoutGrid className="text-teal-600" size={32} />
                            <div>
                                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">分类管理</h1>
                                <p className="text-text-muted text-sm font-medium">配置新闻及新闻源的类别划分</p>
                            </div>
                        </div>
                    </div>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-teal-500/20 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Plus size={20} />
                            添加新分类
                        </button>
                    )}
                </div>

                {/* Form Section */}
                {showForm && (
                    <div className="bg-card border-2 border-teal-500/20 rounded-[32px] p-8 mb-8 shadow-2xl animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-2">
                                <FolderPlus className="text-teal-600" size={24} />
                                {editingId ? '编辑分类' : '创建新分类'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingId(null);
                                    setFormData({ name: '', description: '' });
                                }}
                                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2 px-1">分类名称</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="例如：科技创新"
                                    className="w-full bg-background border border-card-border rounded-2xl p-4 font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2 px-1">描述 (可选)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="简要描述该分类的用途..."
                                    rows={3}
                                    className="w-full bg-background border border-card-border rounded-2xl p-4 font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingId(null);
                                        setFormData({ name: '', description: '' });
                                    }}
                                    className="px-6 py-3 rounded-2xl font-black text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-teal-500/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                                >
                                    {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                                    {editingId ? '更新分类' : '确定创建'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Categories List */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2 px-1 text-text-muted">
                        <Info size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">所有已定义分类 ({categories.length})</span>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-[40px] border border-card-border border-dashed">
                            <RefreshCw className="text-teal-600 animate-spin mb-4" size={32} />
                            <p className="text-text-muted font-bold text-sm">正在加载分类列表...</p>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-20 bg-card rounded-[40px] border border-card-border border-dashed">
                            <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <LayoutGrid className="text-text-muted" size={32} />
                            </div>
                            <p className="text-text-muted font-bold">暂无分类数据</p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="mt-4 text-teal-600 font-black hover:underline text-sm"
                            >
                                点击添加第一个分类
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="bg-card border border-card-border p-6 rounded-[32px] hover:shadow-xl transition-all group overflow-hidden relative shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-600">
                                                <LayoutGrid size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg uppercase tracking-tight">{category.name}</h3>
                                                <p className="text-[10px] text-text-muted font-mono">{category.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="p-2 hover:bg-teal-500/10 text-teal-600 rounded-xl transition-colors"
                                                title="编辑"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                className="p-2 hover:bg-red-500/10 text-red-600 rounded-xl transition-colors"
                                                title="删除"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-text-muted font-bold leading-relaxed">
                                        {category.description || '暂无描述内容'}
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-card-border flex items-center justify-between">
                                        <span className="text-[10px] text-text-muted font-bold italic">
                                            创建于: {new Date(category.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
