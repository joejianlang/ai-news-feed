'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/contexts/UserContext';
import { useRouter } from 'next/navigation';
import {
    Trash2,
    Settings,
    Clock,
    AlertTriangle,
    Database,
    RefreshCw,
    Info
} from 'lucide-react';
import Toast from '@/components/Toast';

export default function MaintenancePage() {
    const { user } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalNews: 0 });
    const [settings, setSettings] = useState({ auto_enabled: false, retention_hours: 168 });
    const [manualRange, setManualRange] = useState({ start: '', end: '' });
    const [isCleaning, setIsCleaning] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.push('/');
            return;
        }
        loadData();
    }, [user]);

    const loadData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await fetch('/api/admin/maintenance');
            const data = await res.json();
            if (data.settings) setSettings(data.settings);
            if (data.stats) setStats(data.stats);
        } catch (error) {
            console.error('Failed to load maintenance data:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleUpdateSettings = async () => {
        try {
            const res = await fetch('/api/admin/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_settings', settings })
            });
            if (res.ok) {
                setToast({ message: '自动清理配置已保存', type: 'success' });
            }
        } catch (error) {
            setToast({ message: '保存失败', type: 'error' });
        }
    };

    const handleManualCleanup = async () => {
        if (!manualRange.start || !manualRange.end) {
            setToast({ message: '请选择起始和结束时间', type: 'error' });
            return;
        }

        if (!confirm(`确定要彻底删除 ${manualRange.start} 到 ${manualRange.end} 期间的所有新闻吗？此操作不可逆！`)) {
            return;
        }

        try {
            setIsCleaning(true);
            const res = await fetch('/api/admin/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'manual_cleanup',
                    start_date: new Date(manualRange.start).toISOString(),
                    end_date: new Date(manualRange.end).toISOString()
                })
            });
            const data = await res.json();
            if (res.ok) {
                setToast({ message: data.message, type: 'success' });
                loadData(true);
            } else {
                setToast({ message: data.error, type: 'error' });
            }
        } catch (error) {
            setToast({ message: '操作失败', type: 'error' });
        } finally {
            setIsCleaning(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <div className="flex justify-center items-center h-64">
                    <RefreshCw className="animate-spin text-teal-600" size={32} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-8">
                    <Database className="text-teal-600" size={32} />
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">系统维护与数据清理</h1>
                        <p className="text-text-muted text-sm font-medium">管理新闻数据库容量与内容保质期</p>
                    </div>
                </div>

                {/* 数据库统计 */}
                <div className="bg-card p-6 rounded-2xl border border-card-border shadow-sm mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center text-teal-600">
                            <Database size={24} />
                        </div>
                        <div>
                            <p className="text-text-muted text-xs font-bold uppercase tracking-wider">当前新闻总数</p>
                            <h3 className="text-2xl font-black">{stats.totalNews.toLocaleString()} 条</h3>
                        </div>
                    </div>
                    <button
                        onClick={() => loadData(true)}
                        className="p-2 hover:bg-background rounded-full transition-colors text-text-muted"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 自动清理配置 */}
                    <section className="bg-card p-6 rounded-2xl border border-card-border shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Clock className="text-teal-600" size={20} />
                            <h2 className="font-bold text-lg">定时自动清理</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-sm">启用自动清理</p>
                                    <p className="text-xs text-text-muted">启用后，系统将定期删除过期旧闻</p>
                                </div>
                                <button
                                    onClick={() => setSettings({ ...settings, auto_enabled: !settings.auto_enabled })}
                                    className={`w-12 h-6 rounded-full transition-all relative ${settings.auto_enabled ? 'bg-teal-600' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.auto_enabled ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>

                            <div>
                                <label className="block font-bold text-sm mb-2">内容保留时间 (小时)</label>
                                <div className="flex gap-2">
                                    <select
                                        value={settings.retention_hours}
                                        onChange={(e) => setSettings({ ...settings, retention_hours: parseInt(e.target.value) })}
                                        className="flex-1 bg-background border border-card-border rounded-lg px-3 py-2 text-sm"
                                    >
                                        <option value={24}>24 小时 (1 天)</option>
                                        <option value={48}>48 小时 (2 天)</option>
                                        <option value={72}>72 小时 (3 天)</option>
                                        <option value={168}>168 小时 (1 周)</option>
                                        <option value={336}>336 小时 (2 周)</option>
                                        <option value={720}>720 小时 (30 天)</option>
                                    </select>
                                </div>
                                <p className="text-[10px] text-text-muted mt-2">提示: 设置为 168 小时表示系统会自动删除发布时间超过 7 天的新闻。</p>
                            </div>

                            <button
                                onClick={handleUpdateSettings}
                                className="w-full bg-foreground text-background py-2 rounded-xl font-bold hover:opacity-90 transition-all text-sm flex items-center justify-center gap-2"
                            >
                                <Settings size={16} />
                                保存自动清理配置
                            </button>
                        </div>
                    </section>

                    {/* 手动区间清理 */}
                    <section className="bg-card p-6 rounded-2xl border border-card-border shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Trash2 className="text-red-500" size={20} />
                            <h2 className="font-bold text-lg">手动按区间清除</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-text-muted uppercase">起始日期时间</label>
                                <input
                                    type="datetime-local"
                                    className="bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-teal-600 outline-none"
                                    value={manualRange.start}
                                    onChange={(e) => setManualRange({ ...manualRange, start: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-text-muted uppercase">结束日期时间</label>
                                <input
                                    type="datetime-local"
                                    className="bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-teal-600 outline-none"
                                    value={manualRange.end}
                                    onChange={(e) => setManualRange({ ...manualRange, end: e.target.value })}
                                />
                            </div>

                            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl border border-orange-200 dark:border-orange-800 flex items-start gap-2">
                                <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={16} />
                                <p className="text-[11px] text-orange-800 dark:text-orange-200">
                                    <b>高危操作</b>: 执行后所选时间段内的所有新闻及其 AI 摘要、评论都将被持久性删除。
                                </p>
                            </div>

                            <button
                                onClick={handleManualCleanup}
                                disabled={isCleaning}
                                className={`w-full py-2.5 rounded-xl font-black italic uppercase italic transition-all flex items-center justify-center gap-2 border-2 ${isCleaning
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white'
                                    }`}
                            >
                                {isCleaning ? <RefreshCw className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                {isCleaning ? '正在清理中...' : '立即执行区间清空'}
                            </button>
                        </div>
                    </section>
                </div>

                {/* 底部备注 */}
                <div className="mt-8 flex items-center gap-2 text-text-muted bg-background border border-card-border p-4 rounded-2xl">
                    <Info size={16} className="text-teal-600" />
                    <p className="text-xs">
                        <b>运行机制</b>: 自动清理接口路径为 <code>/api/cron/cleanup</code>。请在您的服务器或 Supabase 控制台中配置每日定时访问该 URL 即可生效。
                    </p>
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
