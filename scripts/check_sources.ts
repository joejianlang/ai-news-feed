#!/usr/bin/env npx tsx

/**
 * 新闻源健康检查脚本
 * 用于验证所有新闻源是否有效、最近是否成功抓取
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

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

async function checkSources() {
    console.log('🔍 检查新闻源状态...\n');

    // 获取所有新闻源
    const { data: sources, error } = await supabase
        .from('news_sources')
        .select('id, name, url, source_type, is_active, last_fetched_at')
        .order('last_fetched_at', { ascending: false, nullsFirst: false });

    if (error) {
        console.error('❌ 获取新闻源失败:', error);
        return;
    }

    if (!sources || sources.length === 0) {
        console.log('没有找到任何新闻源。');
        return;
    }

    const now = new Date();
    const activeSources: NewsSource[] = [];
    const inactiveSources: NewsSource[] = [];
    const staleSources: NewsSource[] = []; // 超过 24 小时未更新
    const neverFetchedSources: NewsSource[] = [];

    for (const source of sources) {
        if (!source.is_active) {
            inactiveSources.push(source);
            continue;
        }

        activeSources.push(source);

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

    // 输出统计
    console.log('📊 统计摘要:');
    console.log(`   总计: ${sources.length} 个新闻源`);
    console.log(`   ✅ 活跃: ${activeSources.length}`);
    console.log(`   ⏸️  停用: ${inactiveSources.length}`);
    console.log(`   ⚠️  超过24小时未更新: ${staleSources.length}`);
    console.log(`   ❓ 从未抓取过: ${neverFetchedSources.length}`);

    // 详细列表 - 活跃源
    console.log('\n\n📡 活跃新闻源详情:');
    console.log('─'.repeat(80));

    for (const source of activeSources) {
        const lastFetch = source.last_fetched_at
            ? new Date(source.last_fetched_at).toLocaleString('zh-CN', { timeZone: 'America/New_York' })
            : '从未';

        let status = '✅';
        if (!source.last_fetched_at) {
            status = '❓';
        } else {
            const hoursSince = (now.getTime() - new Date(source.last_fetched_at).getTime()) / (1000 * 60 * 60);
            if (hoursSince > 24) status = '⚠️';
        }

        console.log(`${status} ${source.name}`);
        console.log(`   类型: ${source.source_type} | 最后抓取: ${lastFetch}`);
        console.log(`   URL: ${source.url}`);
        console.log('');
    }

    // 问题源
    if (staleSources.length > 0 || neverFetchedSources.length > 0) {
        console.log('\n\n⚠️  需要关注的新闻源:');
        console.log('─'.repeat(80));

        for (const source of [...staleSources, ...neverFetchedSources]) {
            console.log(`❌ ${source.name}`);
            console.log(`   问题: ${source.last_fetched_at ? '超过24小时未更新' : '从未成功抓取'}`);
            console.log(`   URL: ${source.url}`);
            console.log('');
        }
    }

    // 获取最近的新闻条目数量
    const { count: recentCount } = await supabase
        .from('news_items')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

    console.log('\n\n📰 最近 24 小时新闻统计:');
    console.log(`   新增条目: ${recentCount ?? 0} 条`);
}

checkSources().catch(console.error);
