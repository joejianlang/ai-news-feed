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
    MicOff,
    Mic,
    Ban,
    UserCheck,
    Loader2,
    AlertTriangle
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

    const handleUpdateStatus = async (userId: string, updates: { is_muted?: boolean; is_suspended?: boolean }) => {
        const actionType = updates.is_suspended !== undefined
            ? (updates.is_suspended ? '封禁' : '解封')
            : (updates.is_muted ? '禁言' : '取消禁言');

        if (!confirm(`确定要对该用户进行 ${actionType} 操作吗？`)) return;

        setIsUpdating(userId);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, ...updates }),
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
            } else {
                alert(data.error || '操作失败');
            }
        } catch (err) {
            console.error(err);
            alert('操作出错');
        } finally {
            setIsUpdating(null);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (userId === currentUser?.id) {
            alert('你不能删除你自己');
            return;
        }

        if (!confirm('确定要彻底删除该用户吗？此操作无法撤销，与其相关的所有数据（评论、投放等）可能会受到影响。')) return;

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
                        <p className="text-text-muted mt-1 font-medium">查看并管理全站注册用户及其权限和状态</p>
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
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">状态信息</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">权限角色</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">注册时间</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">管理操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-card-border">
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className={`hover:bg-background/30 transition-colors ${u.is_suspended ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-lg ${u.is_suspended ? 'bg-slate-400' : 'bg-teal-600'}`}>
                                                        {u.username.substring(0, 1).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-sm flex items-center gap-2">
                                                            {u.username}
                                                            {u.id === currentUser?.id && (
                                                                <span className="bg-teal-600 text-[8px] text-white px-1 rounded uppercase tracking-tighter">Me</span>
                                                            )}
                                                            {u.is_suspended && (
                                                                <span className="bg-red-500 text-white text-[8px] px-1 rounded uppercase tracking-tighter">已封禁</span>
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
                                                <div className="flex flex-wrap gap-2">
                                                    {u.is_muted && (
                                                        <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1">
                                                            <MicOff size={10} /> 禁言中
                                                        </span>
                                                    )}
                                                    {u.is_suspended && (
                                                        <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1">
                                                            <Ban size={10} /> 封禁中
                                                        </span>
                                                    )}
                                                    {!u.is_muted && !u.is_suspended && (
                                                        <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1">
                                                            <UserCheck size={10} /> 正常
                                                        </span>
                                                    )}
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
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* Toggle Mute */}
                                                    <button
                                                        onClick={() => handleUpdateStatus(u.id, { is_muted: !u.is_muted })}
                                                        disabled={isUpdating === u.id}
                                                        className={`p-2 rounded-xl transition-all ${u.is_muted ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'text-text-muted hover:text-orange-500 hover:bg-orange-50'}`}
                                                        title={u.is_muted ? "取消禁言" : "禁言用户"}
                                                    >
                                                        {u.is_muted ? <Mic size={18} /> : <MicOff size={18} />}
                                                    </button>

                                                    {/* Toggle Suspend */}
                                                    <button
                                                        onClick={() => handleUpdateStatus(u.id, { is_suspended: !u.is_suspended })}
                                                        disabled={isUpdating === u.id || u.id === currentUser?.id}
                                                        className={`p-2 rounded-xl transition-all ${u.is_suspended ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-text-muted hover:text-red-600 hover:bg-red-50'}`}
                                                        title={u.is_suspended ? "取消封禁" : "封禁用户"}
                                                    >
                                                        {u.is_suspended ? <UserCheck size={18} /> : <Ban size={18} />}
                                                    </button>

                                                    {/* Change Role */}
                                                    <button
                                                        onClick={() => handleUpdateRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                                                        disabled={isUpdating === u.id || u.id === currentUser?.id}
                                                        className={`p-2 rounded-xl transition-all ${u.role === 'admin' ? 'text-purple-600 bg-purple-50' : 'text-text-muted hover:text-purple-600 hover:bg-purple-50'}`}
                                                        title={u.role === 'admin' ? "降级为普通用户" : "升级为管理员"}
                                                    >
                                                        <Shield size={18} fill={u.role === 'admin' ? "currentColor" : "none"} />
                                                    </button>

                                                    {/* Delete */}
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

                <div className="mt-8 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-2xl flex gap-3 items-start">
                    <AlertTriangle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                    <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
                        <p className="font-black mb-1">管理说明：</p>
                        <ul className="list-disc ml-4 space-y-1">
                            <li><strong>禁言</strong>：用户将无法在评论区发表新评论。</li>
                            <li><strong>封禁</strong>：用户将无法登录系统。列表将显示为灰色。</li>
                            <li><strong>删除</strong>：彻底清除账号。请谨慎操作，建议优先使用封禁功能。</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
