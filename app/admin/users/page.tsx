'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import type { User } from '@/types';
import Navbar from '@/components/Navbar';
import {
    Users,
    Shield,
    Trash2,
    Search,
    RefreshCw,
    UserCircle,
    Mail,
    Calendar,
    MoreVertical,
    CheckCircle,
    XCircle,
    UserPlus,
    Loader2
} from 'lucide-react';
import { formatTime } from '@/lib/utils/format';

export default function AdminUsersPage() {
    const router = useRouter();
    const { user: currentUser, isLoading: isUserLoading } = useUser();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    useEffect(() => {
        if (!isUserLoading) {
            if (!currentUser || currentUser.role !== 'admin') {
                router.push('/');
            } else {
                fetchUsers();
            }
        }
    }, [currentUser, isUserLoading, router]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (data.users) {
                setUsers(data.users);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: 'admin' | 'user') => {
        if (!confirm(`确定要将该用户的权限修改为 ${newRole === 'admin' ? '管理员' : '普通用户'} 吗？`)) return;

        setIsUpdating(userId);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole }),
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
                alert('用户权限已更新');
            } else {
                alert(data.error || '更新失败');
            }
        } catch (err) {
            console.error(err);
            alert('操作失败');
        } finally {
            setIsUpdating(null);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (userId === currentUser?.id) {
            alert('你不能删除你自己');
            return;
        }

        if (!confirm('确定要 permanent 彻底删除该用户吗？此操作无法撤销，与其相关的所有数据（评论、投放等）可能会受到影响。')) return;

        setIsUpdating(userId);
        try {
            const res = await fetch(`/api/admin/users?id=${userId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(users.filter(u => u.id !== userId));
                alert('用户已删除');
            } else {
                alert(data.error || '删除失败');
            }
        } catch (err) {
            console.error(err);
            alert('操作失败');
        } finally {
            setIsUpdating(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isUserLoading || !currentUser || currentUser.role !== 'admin') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin text-teal-600" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background transition-colors">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-2 italic uppercase tracking-tighter">
                            <Users className="text-teal-600" />
                            用户管理控制台
                        </h1>
                        <p className="text-text-muted mt-1 font-medium">查看并管理全站注册用户及其权限</p>
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="p-2.5 bg-card border border-card-border hover:bg-card-border/10 rounded-xl transition-all shadow-sm"
                        title="刷新列表"
                    >
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-card rounded-2xl border border-card-border p-4 mb-6 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="搜索用户名或邮箱..."
                            className="w-full pl-10 pr-4 py-2.5 bg-background border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-20 bg-card border border-card-border rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-20 bg-card border border-dashed border-card-border rounded-3xl">
                        <UserCircle className="mx-auto text-text-muted mb-4 opacity-20" size={64} />
                        <p className="text-text-muted font-black text-xl">未找到匹配的用户</p>
                    </div>
                ) : (
                    <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-background/50 border-b border-card-border">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">用户信息</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">权限角色</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">注册时间</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-card-border">
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-background/30 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-teal-600/10 flex items-center justify-center text-teal-600 font-black text-lg">
                                                        {u.username.substring(0, 1).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-sm flex items-center gap-2">
                                                            {u.username}
                                                            {u.id === currentUser?.id && (
                                                                <span className="bg-teal-600 text-[8px] text-white px-1 rounded uppercase tracking-tighter">Me</span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-text-muted flex items-center gap-1">
                                                            <Mail size={10} />
                                                            {u.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center">
                                                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${u.role === 'admin'
                                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                        }`}>
                                                        {u.role === 'admin' ? <Shield size={12} /> : <UserCircle size={12} />}
                                                        {u.role === 'admin' ? '管理员' : '普通用户'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                                                    <Calendar size={12} />
                                                    {formatTime(u.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-end gap-2">
                                                    {u.role === 'admin' ? (
                                                        <button
                                                            onClick={() => handleUpdateRole(u.id, 'user')}
                                                            disabled={isUpdating === u.id || u.id === currentUser?.id}
                                                            className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all disabled:opacity-30"
                                                            title="降级为普通用户"
                                                        >
                                                            <Shield size={18} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleUpdateRole(u.id, 'admin')}
                                                            disabled={isUpdating === u.id}
                                                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all"
                                                            title="升级为管理员"
                                                        >
                                                            <Shield size={18} fill="none" />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleDeleteUser(u.id)}
                                                        disabled={isUpdating === u.id || u.id === currentUser?.id}
                                                        className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all disabled:opacity-30"
                                                        title="删除用户"
                                                    >
                                                        {isUpdating === u.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
