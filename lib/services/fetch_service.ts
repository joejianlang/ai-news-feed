
import { createClient } from '@supabase/supabase-js';
import { getActiveNewsSources, updateLastFetchedTime } from '@/lib/supabase/queries';
import { scrapeContent } from '@/lib/scrapers';
import { analyzeContent, AnalysisResult } from '@/lib/ai';

// Initialize Service Role Client for admin operations
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) {
    console.error('❌ CRITICAL ERROR: Missing SUPABASE_SERVICE_ROLE_KEY');
}

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
    serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function updateFetchStatus(status: any) {
    try {
        await supabaseAdmin
            .from('system_settings')
            .upsert({
                key: 'fetch_status',
                value: status,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
    } catch (error) {
        console.error('Failed to update fetch status:', error);
    }
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

export async function runFetchPipeline(specificSourceId?: string) {
    try {
        const sources = await getActiveNewsSources();
        const targetSources = specificSourceId
            ? sources.filter(s => s.id === specificSourceId)
            : sources;

        // 0. Pre-fetch categories for mapping
        const { data: categoriesData } = await supabaseAdmin.from('categories').select('id, name');
        const categoryMap: Record<string, string> = {};
        categoriesData?.forEach(c => categoryMap[c.name] = c.id);

        const batchId = crypto.randomUUID();
        const batchTime = new Date().toISOString();

        // Initialize status
        await updateFetchStatus({
            is_running: true,
            current_source: '阶段 1: 正在从各源抓取原始数据...',
            progress: 0,
            total: targetSources.length,
            started_at: batchTime
        });

        console.log(`🚀 开始抓取阶段: 共 ${targetSources.length} 个源`);

        // --- STAGE 1: 快速抓取并存为草稿 ---
        let totalScraped = 0;
        for (let i = 0; i < targetSources.length; i++) {
            const source = targetSources[i];
            await updateFetchStatus({ is_running: true, current_source: `抓取中: ${source.name}`, progress: i, total: targetSources.length });

            try {
                const scrapedItems = await scrapeContent(source.url, source.source_type, source.youtube_channel_id);

                for (const item of scrapedItems) {
                    // 检查去重
                    const { data: exists } = await supabaseAdmin.rpc('find_similar_news', {
                        check_title: item.title,
                        check_url: item.url,
                        time_window_hours: 48,
                        similarity_threshold: 0.8
                    });

                    if (exists && exists.length > 0) continue;

                    // 存为草稿
                    await supabaseAdmin.from('news_items').insert([{
                        source_id: source.id,
                        original_url: item.url,
                        title: item.title,
                        content: item.content,
                        content_type: item.contentType,
                        published_at: item.publishedAt?.toISOString(),
                        video_id: item.videoId,
                        image_url: item.imageUrl,
                        fetch_batch_id: batchId,
                        is_published: false, // 初始为草稿
                    }]);
                    totalScraped++;
                }

                await updateLastFetchedTime(source.id);
            } catch (err) {
                console.error(`Failed to scrape ${source.name}:`, err);
            }
        }

        console.log(`✅ 阶段 1 完成: 抓取到 ${totalScraped} 条新内容。准备进入阶段 2 混合处理...`);

        // --- STAGE 2: 优先处理积压的旧草稿 ---
        // 获取所有未发布的条目，按时间顺序排列（最老的优先），以清理积压
        const { data: drafts } = await supabaseAdmin
            .from('news_items')
            .select('*, source:news_sources(commentary_style)')
            .eq('is_published', false)
            .order('created_at', { ascending: true })
            .limit(200); // 增加批次大小

        if (!drafts || drafts.length === 0) {
            await updateFetchStatus({ is_running: false, current_source: '无新内容需处理', progress: targetSources.length, total: targetSources.length });
            return { success: true, newItems: 0 };
        }

        console.log(`🧠 开始 AI 处理阶段: 待处理 ${drafts.length} 条新闻 (优先处理最早入库的内容)`);

        let successCount = 0;
        for (let i = 0; i < drafts.length; i++) {
            const news = drafts[i];

            await updateFetchStatus({
                is_running: true,
                current_source: `AI 分析中 (${i + 1}/${drafts.length}): ${news.title.substring(0, 20)}...`,
                progress: i,
                total: drafts.length
            });

            try {
                // 调用合并后的 AI 接口（包含翻译、摘要、评论、分类、标签、地点）
                const analysis = await analyzeContent(
                    news.content,
                    news.title,
                    news.source?.commentary_style || '',
                    news.content_type || 'article'
                );

                if (analysis.shouldSkip) {
                    await supabaseAdmin.from('news_items').delete().eq('id', news.id);
                    continue;
                }

                // 鲁棒的分类映射
                let categoryName = analysis.category || '热点';
                // 常见的 AI 变体处理
                if (categoryName.includes('本地')) categoryName = '本地';
                else if (categoryName.includes('热点')) categoryName = '热点';
                else if (categoryName.includes('科技')) categoryName = '科技';
                else if (categoryName.includes('财经')) categoryName = '财经';
                else if (categoryName.includes('深度')) categoryName = '深度';

                const catId = categoryMap[categoryName] || categoryMap['热点'] || Object.values(categoryMap)[0];

                console.log(`[AI结果] 标题: ${analysis.translatedTitle?.substring(0, 20)}..., 分类: ${categoryName}, 标签: ${JSON.stringify(analysis.tags)}`);

                // 立即更新并发布
                const { error: updateError } = await supabaseAdmin.from('news_items').update({
                    title: analysis.translatedTitle || news.title,
                    ai_summary: analysis.summary,
                    ai_commentary: analysis.commentary,
                    category_id: catId,
                    tags: Array.isArray(analysis.tags) ? analysis.tags : [],
                    location: analysis.location,
                    is_published: true,
                    batch_completed_at: batchTime,
                    updated_at: new Date().toISOString()
                }).eq('id', news.id);

                if (updateError) {
                    throw new Error(`更新数据库失败: ${updateError.message}`);
                }

                successCount++;
                console.log(`[OK] 已发布 (${i + 1}/${drafts.length}): ${analysis.translatedTitle || news.title}`);

                // 稍微延迟，保护 API
                await new Promise(r => setTimeout(r, 500));
            } catch (err) {
                console.error(`AI 阶段处理失败 [${news.id}]:`, err);
            }
        }

        // Final Status
        await updateFetchStatus({
            is_running: false,
            current_source: `处理完成: 新发布 ${successCount} 条`,
            progress: drafts.length,
            total: drafts.length,
            last_completed_at: new Date().toISOString()
        });

        return { success: true, newItems: successCount };

    } catch (error) {
        console.error('Error in fetch pipeline:', error);
        await updateFetchStatus({ is_running: false, error: String(error) });
        throw error;
    }
}
