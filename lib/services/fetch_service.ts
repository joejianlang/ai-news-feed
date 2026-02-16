
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
    const batchId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    let logId: string | null = null;

    // Initialize stats
    const statsDetail = {
        total_scraped: 0,
        skipped_duplicate: 0,
        ai_processed: 0,
        ai_skipped: 0,
        ai_failed: 0,
        published_count: 0,
        reasons: {} as Record<string, number>
    };

    const addReason = (reason: string) => {
        statsDetail.reasons[reason] = (statsDetail.reasons[reason] || 0) + 1;
    };

    try {
        // Create initial log entry
        const { data: logData, error: logError } = await supabaseAdmin
            .from('fetch_logs')
            .insert([{
                batch_id: batchId,
                started_at: startedAt,
                status: 'running'
            }])
            .select()
            .single();

        if (logData) logId = logData.id;

        const sources = await getActiveNewsSources();
        const targetSources = specificSourceId
            ? sources.filter(s => s.id === specificSourceId)
            : sources;

        // 0. Pre-fetch categories for mapping
        const { data: categoriesData } = await supabaseAdmin.from('categories').select('id, name');
        const categoryMap: Record<string, string> = {};
        categoriesData?.forEach(c => categoryMap[c.name] = c.id);

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
        for (let i = 0; i < targetSources.length; i++) {
            const source = targetSources[i];
            await updateFetchStatus({ is_running: true, current_source: `抓取中: ${source.name}`, progress: i, total: targetSources.length });

            try {
                const scrapedItems = await scrapeContent(source.url, source.source_type, source.youtube_channel_id);
                statsDetail.total_scraped += scrapedItems.length;

                for (const item of scrapedItems) {
                    // 1. 严格检查 URL 是否完全重复（全局）
                    const { data: exactUrlMatch } = await supabaseAdmin
                        .from('news_items')
                        .select('id')
                        .eq('original_url', item.url)
                        .maybeSingle();

                    if (exactUrlMatch) {
                        statsDetail.skipped_duplicate++;
                        addReason('Duplicate (Global URL Match)');
                        continue;
                    }

                    // 2. 检查标题/内容的相似度（48小时窗口）
                    const { data: exists } = await supabaseAdmin.rpc('find_similar_news', {
                        check_title: item.title,
                        check_url: item.url,
                        time_window_hours: 48,
                        similarity_threshold: 0.8
                    });

                    if (exists && exists.length > 0) {
                        statsDetail.skipped_duplicate++;
                        addReason('Duplicate (Similarity Check)');
                        continue;
                    }

                    // 存为草稿
                    const { error: insertError } = await supabaseAdmin.from('news_items').insert([{
                        source_id: source.id,
                        original_url: item.url,
                        title: item.title,
                        content: item.content,
                        content_type: item.contentType,
                        published_at: item.publishedAt?.toISOString(),
                        video_id: item.videoId,
                        image_url: item.imageUrl,
                        fetch_batch_id: batchId,
                        is_published: false,
                    }]);

                    if (insertError) {
                        // 如果依然报唯一性冲突错误，按重复处理
                        if (insertError.code === '23505') {
                            statsDetail.skipped_duplicate++;
                            addReason('Duplicate (Insert Race Condition)');
                        } else {
                            statsDetail.ai_failed++;
                            addReason(`Insert Error: ${insertError.message}`);
                        }
                    }
                }

                await updateLastFetchedTime(source.id);
            } catch (err) {
                console.error(`Failed to scrape ${source.name}:`, err);
                addReason(`Scrape Failed (${source.name})`);
            }
        }

        console.log(`✅ 阶段 1 完成: 抓取到 ${statsDetail.total_scraped} 条内容。准备进入流程处理...`);

        // --- STAGE 2: 优先处理积压的旧草稿 ---
        const { data: drafts } = await supabaseAdmin
            .from('news_items')
            .select('*, source:news_sources(commentary_style, category_id)')
            .eq('is_published', false)
            .order('created_at', { ascending: true })
            .limit(200);

        if (!drafts || drafts.length === 0) {
            await updateFetchStatus({ is_running: false, current_source: '无新内容需处理', progress: targetSources.length, total: targetSources.length });

            if (logId) {
                await supabaseAdmin.from('fetch_logs').update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    total_scraped: statsDetail.total_scraped,
                    skipped_duplicate: statsDetail.skipped_duplicate,
                    published_count: 0
                }).eq('id', logId);
            }

            return { success: true, newItems: 0 };
        }

        console.log(`🧠 开始 AI 处理阶段: 待处理 ${drafts.length} 条新闻`);
        statsDetail.ai_processed = drafts.length;

        for (let i = 0; i < drafts.length; i++) {
            const news = drafts[i];

            // 🛑 每处理 5 条新闻检查一次是否有人手动点击了“重置”
            if (i % 5 === 0) {
                const { data: currentStatus } = await supabaseAdmin
                    .from('system_settings')
                    .select('value')
                    .eq('key', 'fetch_status')
                    .single();

                if (currentStatus?.value?.is_running === false) {
                    console.log('🛑 用户已请求重置，正在中止抓取流水线...');
                    return { success: false, message: '流水线被用户中止' };
                }
            }

            await updateFetchStatus({
                is_running: true,
                current_source: `AI 分析中 (${i + 1}/${drafts.length}): ${news.title.substring(0, 20)}...`,
                progress: i,
                total: drafts.length
            });

            try {
                const analysis = await analyzeContent(
                    news.content,
                    news.title,
                    news.source?.commentary_style || '',
                    news.content_type || 'article',
                    false, // isDeepDive
                    news.published_at // Pass the actual news date
                );

                if (analysis.isError) {
                    console.error(`[AI Error] Skipping publication due to AI failure for: ${news.title}`);
                    statsDetail.ai_failed++;
                    addReason('AI Service Error');
                    // 删除草稿，避免堆积
                    await supabaseAdmin.from('news_items').delete().eq('id', news.id);
                    continue;
                }

                if (analysis.shouldSkip) {
                    statsDetail.ai_skipped++;
                    addReason(`AI Filtered: ${analysis.skipReason || 'Quality'}`);
                    await supabaseAdmin.from('news_items').delete().eq('id', news.id);
                    continue;
                }

                // 确定分类：优先使用源指定的分类，如果没有则使用 AI 建议的分类
                let catId = (news.source as any)?.category_id;

                if (!catId) {
                    let categoryName = analysis.category || '热点';
                    if (categoryName.includes('本地')) categoryName = '本地';
                    else if (categoryName.includes('热点')) categoryName = '热点';
                    else if (categoryName.includes('科技')) categoryName = '科技';
                    else if (categoryName.includes('财经')) categoryName = '财经';
                    else if (categoryName.includes('深度')) categoryName = '深度';

                    catId = categoryMap[categoryName] || categoryMap['热点'] || Object.values(categoryMap)[0];
                }

                const updatePayload: any = {
                    title: analysis.translatedTitle || news.title,
                    ai_summary: analysis.summary,
                    ai_commentary: analysis.commentary,
                    category_id: catId,
                    tags: Array.isArray(analysis.tags) ? analysis.tags : [],
                    location: analysis.location, // 尝试包含位置信息
                    is_published: true,
                    batch_completed_at: batchTime,
                    updated_at: new Date().toISOString()
                };

                let { error: updateError } = await supabaseAdmin.from('news_items').update(updatePayload).eq('id', news.id);

                // 🛑 如果报错“找不到 location 列”，则剔除该列重新尝试
                if (updateError && (updateError.message.includes('column "location" of relation "news_items" does not exist') || updateError.message.includes('Could not find the \'location\' column'))) {
                    console.warn('⚠️ 数据库缺少 location 列，正在剔除该列重试...');
                    delete updatePayload.location;
                    const { error: retryError } = await supabaseAdmin.from('news_items').update(updatePayload).eq('id', news.id);
                    updateError = retryError;
                }

                if (updateError) {
                    statsDetail.ai_failed++;
                    addReason(`DB Update Error: ${updateError.message}`);
                } else {
                    statsDetail.published_count++;
                }

                await new Promise(r => setTimeout(r, 500));
            } catch (err) {
                console.error(`AI 阶段处理失败 [${news.id}]:`, err);
                statsDetail.ai_failed++;
                addReason(`AI Process Crash: ${String(err)}`);
            }
        }

        // --- FINAL LOG UPDATE ---
        if (logId) {
            await supabaseAdmin.from('fetch_logs').update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                total_scraped: statsDetail.total_scraped,
                skipped_duplicate: statsDetail.skipped_duplicate,
                ai_processed: statsDetail.ai_processed,
                ai_skipped: statsDetail.ai_skipped,
                ai_failed: statsDetail.ai_failed,
                published_count: statsDetail.published_count,
                failure_reasons: statsDetail.reasons
            }).eq('id', logId);
        }

        await updateFetchStatus({
            is_running: false,
            current_source: `处理完成: 新发布 ${statsDetail.published_count} 条`,
            progress: drafts.length,
            total: drafts.length,
            last_completed_at: new Date().toISOString()
        });

        return { success: true, newItems: statsDetail.published_count, stats: statsDetail };

    } catch (error) {
        console.error('Error in fetch pipeline:', error);
        await updateFetchStatus({ is_running: false, error: String(error) });

        if (logId) {
            await supabaseAdmin.from('fetch_logs').update({
                status: 'failed',
                completed_at: new Date().toISOString(),
                failure_reasons: { ...statsDetail.reasons, critical_error: String(error) }
            }).eq('id', logId);
        }

        throw error;
    }
}
