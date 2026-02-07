#!/usr/bin/env npx tsx

/**
 * 每日健康检查报告脚本
 * 检查所有新闻源状态，输出 Markdown 格式报告
 * 如果有问题源，以非零退出码结束，触发 GitHub Actions 创建 Issue
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface NewsSource {
    id: string;
    name: string;
    url: string;
    source_type: string;
    is_active: boolean;
    last_fetched_at: string | null;
}

interface HealthReport {
    totalSources: number;
    activeSources: number;
    healthySources: number;
    staleSources: NewsSource[];      // 超过 24 小时未更新
    neverFetchedSources: NewsSource[]; // 从未抓取
    recentNewsCount: number;
    hasProblems: boolean;
}

async function generateReport(): Promise<HealthReport> {
    const now = new Date();

    // 获取所有新闻源
    const { data: sources, error } = await supabase
        .from('news_sources')
        .select('id, name, url, source_type, is_active, last_fetched_at')
        .eq('is_active', true)
        .order('last_fetched_at', { ascending: true, nullsFirst: true });

    if (error) {
        throw new Error(`获取新闻源失败: ${error.message}`);
    }

    const staleSources: NewsSource[] = [];
    const neverFetchedSources: NewsSource[] = [];

    for (const source of sources || []) {
        if (!source.last_fetched_at) {
            neverFetchedSources.push(source);
        } else {
            const lastFetch = new Date(source.last_fetched_at);
            const hoursSinceUpdate = (now.getTime() - lastFetch.getTime()) / (1000 * 60 * 60);
            if (hoursSinceUpdate > 24) {
                staleSources.push(source);
            }
        }
    }

    // 获取最近的新闻条目数量
    const { count: recentCount } = await supabase
        .from('news_items')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

    const totalActive = sources?.length || 0;
    const problemCount = staleSources.length + neverFetchedSources.length;

    return {
        totalSources: totalActive,
        activeSources: totalActive,
        healthySources: totalActive - problemCount,
        staleSources,
        neverFetchedSources,
        recentNewsCount: recentCount || 0,
        hasProblems: problemCount > 0
    };
}

function formatReportAsMarkdown(report: HealthReport): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    let md = `# 📊 新闻源健康报告 - ${dateStr}\n\n`;

    // 摘要
    md += `## 概览\n\n`;
    md += `| 指标 | 数值 |\n`;
    md += `|------|------|\n`;
    md += `| 活跃新闻源 | ${report.activeSources} 个 |\n`;
    md += `| ✅ 健康 | ${report.healthySources} 个 |\n`;
    md += `| ⚠️ 超过24小时未更新 | ${report.staleSources.length} 个 |\n`;
    md += `| ❌ 从未成功抓取 | ${report.neverFetchedSources.length} 个 |\n`;
    md += `| 📰 最近24小时新增 | ${report.recentNewsCount} 条 |\n\n`;

    // 问题源详情
    if (report.hasProblems) {
        md += `## ⚠️ 需要关注的新闻源\n\n`;

        if (report.neverFetchedSources.length > 0) {
            md += `### ❌ 从未成功抓取\n\n`;
            for (const source of report.neverFetchedSources) {
                md += `- **${source.name}** (${source.source_type})\n`;
                md += `  - URL: ${source.url}\n`;
            }
            md += `\n`;
        }

        if (report.staleSources.length > 0) {
            md += `### ⏰ 超过24小时未更新\n\n`;
            for (const source of report.staleSources) {
                const lastFetch = new Date(source.last_fetched_at!).toLocaleString('zh-CN', {
                    timeZone: 'America/New_York'
                });
                md += `- **${source.name}** (${source.source_type})\n`;
                md += `  - 最后抓取: ${lastFetch}\n`;
                md += `  - URL: ${source.url}\n`;
            }
            md += `\n`;
        }

        md += `## 建议操作\n\n`;
        md += `1. 检查问题源的 URL 是否仍然有效\n`;
        md += `2. 查看 GitHub Actions 日志中的具体错误信息\n`;
        md += `3. 如果源已失效，考虑在 Supabase 中将其 \`is_active\` 设为 \`false\`\n`;
    } else {
        md += `## ✅ 所有新闻源运行正常！\n\n`;
        md += `无需任何操作。\n`;
    }

    return md;
}

async function main() {
    console.log('🔍 生成每日健康报告...\n');

    try {
        const report = await generateReport();
        const markdown = formatReportAsMarkdown(report);

        // 输出报告（GitHub Actions 会捕获这个输出）
        console.log(markdown);

        // 将报告内容写入环境文件供 GitHub Actions 使用
        if (process.env.GITHUB_OUTPUT) {
            const fs = await import('fs');
            const escapedMarkdown = markdown.replace(/%/g, '%25').replace(/\n/g, '%0A').replace(/\r/g, '%0D');
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `report=${escapedMarkdown}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_problems=${report.hasProblems}\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `problem_count=${report.staleSources.length + report.neverFetchedSources.length}\n`);
        }

        // 如果有问题，以非零退出码结束（但不阻止 workflow）
        if (report.hasProblems) {
            console.log('\n⚠️ 发现问题源，将创建 GitHub Issue 通知您。');
        } else {
            console.log('\n✅ 所有源运行正常，无需创建 Issue。');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ 生成报告失败:', error);
        process.exit(1);
    }
}

main();
