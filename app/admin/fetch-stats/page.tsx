'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/contexts/UserContext';
import { useRouter } from 'next/navigation';
import {
    BarChart,
    Activity,
    Calendar,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Clock,
    Filter,
    ArrowRight
} from 'lucide-react';

interface FetchLog {
    id: string;
    batch_id: string;
    started_at: string;
    completed_at: string;
    total_scraped: number;
    skipped_duplicate: number;
    ai_processed: number;
    ai_skipped: number;
    ai_failed: number;
    published_count: number;
    failure_reasons: Record<string, number>;
    status: string;
}

interface DailyStat {
    date: string;
    total_scraped: number;
    published: number;
    failed_or_skipped: number;
    successRate: string;
    ai_skipped: number;
    ai_failed: number;
    duplicates: number;
}

export default function FetchStatsPage() {
    const { user } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [selectedLog, setSelectedLog] = useState<FetchLog | null>(null);

    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.push('/');
            return;
        }
        loadStats();
    }, [user]);

    const loadStats = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/ai-stats');
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-8">
                    <Activity className="text-teal-600" size={32} />
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">抓取质量分析面板</h1>
                        <p className="text-text-muted text-sm font-medium">监控内容抓取流水线性能与失败原因</p>
                    </div>
                </div>

                {/* 核心指标概览 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-card p-6 rounded-2xl border border-card-border shadow-sm">
                        <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">今日发布条数</p>
                        <h3 className="text-3xl font-black text-teal-600">{stats?.summary?.today?.count || 0}</h3>
                    </div>
                    <div className="bg-card p-6 rounded-2xl border border-card-border shadow-sm">
                        <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">本月累计</p>
                        <h3 className="text-3xl font-black text-foreground">{stats?.summary?.month?.count || 0}</h3>
                    </div>
                    <div className="bg-card p-6 rounded-2xl border border-card-border shadow-sm">
                        <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">最近批次抓取数</p>
                        <h3 className="text-3xl font-black text-foreground">{stats?.recentLogs?.[0]?.total_scraped || 0}</h3>
                    </div>
                    <div className="bg-card p-6 rounded-2xl border border-card-border shadow-sm">
                        <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">最近批次成功率</p>
                        <h3 className="text-3xl font-black text-cyan-600">
                            {stats?.recentLogs?.[0] ? ((stats.recentLogs[0].published_count / stats.recentLogs[0].total_scraped) * 100).toFixed(1) + '%' : '0%'}
                        </h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 左侧：每日汇总统计 */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-card-border flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="text-text-muted" size={18} />
                                    <h2 className="font-bold text-lg">最近 7 天统计</h2>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-background/50 text-text-muted text-[10px] uppercase font-bold">
                                        <tr>
                                            <th className="px-6 py-3">日期</th>
                                            <th className="px-6 py-3">总抓取</th>
                                            <th className="px-6 py-3 text-teal-600">已发布</th>
                                            <th className="px-6 py-3">去重过滤</th>
                                            <th className="px-6 py-3">AI 过滤</th>
                                            <th className="px-6 py-3 text-red-500">失败</th>
                                            <th className="px-6 py-3">成功率</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-card-border">
                                        {stats?.dailyStats?.map((day: DailyStat) => (
                                            <tr key={day.date} className="hover:bg-background/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-sm whitespace-nowrap">{day.date}</td>
                                                <td className="px-6 py-4 text-sm">{day.total_scraped}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-teal-600">{day.published}</td>
                                                <td className="px-6 py-4 text-sm text-text-muted">{day.duplicates}</td>
                                                <td className="px-6 py-4 text-sm text-text-muted">{day.ai_skipped}</td>
                                                <td className="px-6 py-4 text-sm text-red-400">{day.ai_failed}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-600 text-[10px] font-black rounded-md">
                                                        {day.successRate}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* 每批次明细 */}
                        <section className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-card-border">
                                <div className="flex items-center gap-2 text-text-muted">
                                    <Clock size={18} />
                                    <h2 className="font-bold text-lg text-foreground">抓取历史明细 (前 30 次)</h2>
                                </div>
                            </div>
                            <div className="divide-y divide-card-border">
                                {stats?.recentLogs?.map((log: FetchLog) => (
                                    <div
                                        key={log.id}
                                        className="p-4 hover:bg-background/80 transition-all cursor-pointer group"
                                        onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-text-muted">
                                                    {new Date(log.started_at).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${log.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {log.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <span className="text-xs text-text-muted block">成功率</span>
                                                    <span className="text-sm font-black italic">
                                                        {log.total_scraped > 0 ? ((log.published_count / log.total_scraped) * 100).toFixed(0) + '%' : '0%'}
                                                    </span>
                                                </div>
                                                <ChevronRight size={16} className={`text-text-muted transition-transform ${selectedLog?.id === log.id ? 'rotate-90' : ''}`} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2">
                                            <div className="bg-background/50 p-2 rounded border border-card-border/50">
                                                <span className="text-[10px] text-text-muted block uppercase">抓取总数</span>
                                                <span className="text-sm font-bold">{log.total_scraped}</span>
                                            </div>
                                            <div className="bg-background/50 p-2 rounded border border-card-border/50">
                                                <span className="text-[10px] text-text-muted block uppercase">已发布</span>
                                                <span className="text-sm font-bold text-teal-600">{log.published_count}</span>
                                            </div>
                                            <div className="bg-background/50 p-2 rounded border border-card-border/50">
                                                <span className="text-[10px] text-text-muted block uppercase">去重/AI过滤</span>
                                                <span className="text-sm font-bold text-orange-500">{log.skipped_duplicate + log.ai_skipped}</span>
                                            </div>
                                            <div className="bg-background/50 p-2 rounded border border-card-border/50">
                                                <span className="text-[10px] text-text-muted block uppercase">系统失败</span>
                                                <span className="text-sm font-bold text-red-500">{log.ai_failed}</span>
                                            </div>
                                        </div>

                                        {/* 展开显示失败原因分析 */}
                                        {selectedLog?.id === log.id && (
                                            <div className="mt-4 pt-4 border-t border-card-border animate-in fade-in slide-in-from-top-2">
                                                <h4 className="text-xs font-black uppercase tracking-widest text-text-muted mb-2">无法在前端显示的原因分析：</h4>
                                                {Object.entries(log.failure_reasons).length > 0 ? (
                                                    <div className="space-y-1.5">
                                                        {Object.entries(log.failure_reasons).map(([reason, count]) => (
                                                            <div key={reason} className="flex items-center justify-between bg-black/5 dark:bg-white/5 px-3 py-2 rounded-lg text-xs">
                                                                <span className="font-medium text-text-secondary">{reason}</span>
                                                                <span className="px-2 py-0.5 bg-black/10 dark:bg-white/10 rounded font-bold">{count} 条</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-text-muted italic">没有记录到失败项</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* 右侧：原因知识图谱 / 说明 */}
                    <div className="space-y-6">
                        <section className="bg-card p-6 rounded-2xl border border-card-border shadow-sm">
                            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <AlertCircle className="text-orange-500" size={20} />
                                无法显示的原因分类
                            </h2>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold">Duplicate (Similarity Check)</p>
                                        <p className="text-xs text-text-muted">内容与 48 小时内已存在的新闻相似度超过 80%，被系统自动过滤。</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mt-1.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold">AI Filtered (Quality)</p>
                                        <p className="text-xs text-text-muted">Gemini 分析判定该内容为：广告促销、天气预报、路况、纯信息罗列或服务类通告。</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold">AI Process Crash / DB Error</p>
                                        <p className="text-xs text-text-muted">API 调用超时、额度不足或数据库插入失败。这通常意味着系统不稳定。</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold">Scrape Failed</p>
                                        <p className="text-xs text-text-muted">RSS 链接失效或 YouTube 频道暂无新内容。如果多次出现，请检查采集源 URL。</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-teal-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                            <Activity className="absolute -bottom-4 -right-4 opacity-10" size={120} />
                            <h3 className="text-xl font-black italic uppercase italic mb-2">流水线健康值</h3>
                            <p className="text-xs opacity-90 mb-4">基于最近 10 次抓取任务的综合成功率计算</p>
                            <div className="text-4xl font-black mb-1">
                                {stats?.recentLogs ? (
                                    (stats.recentLogs.slice(0, 5).reduce((acc: number, log: any) => acc + (log.published_count / (log.total_scraped || 1)), 0) / 5 * 100).toFixed(0)
                                ) : '0'}%
                            </div>
                            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-white h-full transition-all duration-1000"
                                    style={{ width: `${stats?.recentLogs ? (stats.recentLogs.slice(0, 5).reduce((acc: number, log: any) => acc + (log.published_count / (log.total_scraped || 1)), 0) / 5 * 100).toFixed(0) : '0'}%` }}
                                />
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
