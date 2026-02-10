
import { createClient } from '@supabase/supabase-js';
import { getActiveNewsSources } from '@/lib/supabase/queries';
import { scrapeContent } from '@/lib/scrapers';
import { analyzeContent } from '@/lib/ai';

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

export async function runFetchPipeline(specificSourceId?: string) {
    try {
        const sources = await getActiveNewsSources();
        const targetSources = specificSourceId
            ? sources.filter(s => s.id === specificSourceId)
            : sources;

        // Initialize status
        await updateFetchStatus({
            is_running: true,
            current_source: '准备开始...',
            progress: 0,
            total: targetSources.length,
            started_at: new Date().toISOString()
        });

        const results: any[] = [];
        let newItemsCount = 0;
        let skippedItemsCount = 0;
        let errorCount = 0;

        for (let i = 0; i < targetSources.length; i++) {
            const source = targetSources[i];

            // Update status
            await updateFetchStatus({
                is_running: true,
                current_source: source.name,
                progress: i,
                total: targetSources.length,
                started_at: new Date().toISOString()
            });

            try {
                console.log(`Fetching from ${source.name}...`);

                // Timeout wrapper: 60s
                const fetchWithTimeout = async () => {
                    return Promise.race([
                        scrapeContent(
                            source.url,
                            source.source_type,
                            source.youtube_channel_id
                        ),
                        new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error(`抓取 ${source.name} 超时（60秒）`)), 60000)
                        )
                    ]);
                };

                const scrapedItems = await fetchWithTimeout();

                let consecutiveSkips = 0;
                const MAX_CONSECUTIVE_SKIPS = 3;

                for (let j = 0; j < scrapedItems.length; j++) {
                    const item = scrapedItems[j];

                    // Update item status
                    await updateFetchStatus({
                        is_running: true,
                        current_source: `${source.name} (处理 ${j + 1}/${scrapedItems.length})`,
                        progress: i,
                        total: targetSources.length,
                        started_at: new Date().toISOString()
                    });

                    try {
                        console.log(`[${source.name}] Processing item ${j + 1}/${scrapedItems.length}: ${item.title}`);

                        // 30s timeout per item
                        await Promise.race([
                            (async () => {
                                let exists = false;

                                // 1. RPC Similarity Check
                                const { data: similarData, error: rpcError } = await supabaseAdmin.rpc('find_similar_news', {
                                    check_title: item.title,
                                    check_url: item.url,
                                    time_window_hours: 24,
                                    similarity_threshold: 0.6
                                });

                                if (!rpcError && similarData && similarData.length > 0) {
                                    exists = true;
                                } else {
                                    // 2. Exact URL fallback
                                    const query = supabaseAdmin
                                        .from('news_items')
                                        .select('id')
                                        .eq('original_url', item.url);

                                    if (item.videoId) {
                                        const { data: videoMatch } = await supabaseAdmin
                                            .from('news_items')
                                            .select('id')
                                            .eq('video_id', item.videoId)
                                            .maybeSingle();
                                        if (videoMatch) exists = true;
                                    }

                                    if (!exists) {
                                        const { data: urlMatch } = await query.maybeSingle();
                                        if (urlMatch) exists = true;
                                    }
                                }

                                if (exists) {
                                    skippedItemsCount++;
                                    consecutiveSkips++;
                                    console.log(`[${source.name}] Skipping existing/similar item: ${item.title} (${item.contentType})`);

                                    if (consecutiveSkips >= MAX_CONSECUTIVE_SKIPS && source.source_type !== 'youtube_channel') {
                                        console.log(`[${source.name}] Hit ${MAX_CONSECUTIVE_SKIPS} consecutive existing items, stopping fetch.`);
                                        return 'BREAK';
                                    }
                                    return 'CONTINUE';
                                }

                                consecutiveSkips = 0;

                                console.log(`[${source.name}] analyzing content...`);
                                const analysis = await analyzeContent(
                                    item.content,
                                    item.title,
                                    source.commentary_style,
                                    item.contentType,
                                    false
                                );

                                // 检查 AI 是否标记为应跳过的服务类内容
                                if (analysis.shouldSkip) {
                                    skippedItemsCount++;
                                    console.log(`[${source.name}] AI filtered out content (${item.contentType}): ${item.title} - Reason: ${analysis.skipReason || 'unknown'}`);
                                    return 'CONTINUE';
                                }

                                const finalTitle = analysis.translatedTitle || item.title;

                                const { data: newsItem, error: insertError } = await supabaseAdmin
                                    .from('news_items')
                                    .insert([{
                                        source_id: source.id,
                                        original_url: item.url,
                                        title: finalTitle,
                                        content: item.content,
                                        content_type: item.contentType,
                                        ai_summary: analysis.summary,
                                        ai_commentary: analysis.commentary,
                                        published_at: item.publishedAt?.toISOString(),
                                        video_id: item.videoId,
                                        image_url: item.imageUrl,
                                        is_published: true,
                                        batch_completed_at: new Date().toISOString()
                                    }])
                                    .select()
                                    .single();

                                if (insertError) {
                                    console.error(`DB Insert failed for ${item.title}:`, insertError);
                                    throw new Error(`DB Insert failed: ${insertError.message}`);
                                }

                                results.push(newsItem);
                                newItemsCount++;
                                console.log(`[${source.name}] Item saved: ${finalTitle}`);
                            })(),
                            new Promise<never>((_, reject) =>
                                setTimeout(() => reject(new Error(`处理新闻超时: ${item.title.substring(0, 50)}...`)), 30000)
                            )
                        ]).then((result) => {
                            if (result === 'BREAK') throw new Error('BREAK_LOOP');
                            if (result === 'CONTINUE') return;
                        });

                    } catch (itemError: any) {
                        if (itemError?.message === 'BREAK_LOOP') {
                            break;
                        }
                        console.error(`Error processing item from ${source.name}:`, itemError);
                        errorCount++;
                        continue;
                    }
                }

                console.log(`Fetched ${newItemsCount} new items, skipped ${skippedItemsCount} existing items from ${source.name}`);

                await supabaseAdmin
                    .from('news_sources')
                    .update({ last_fetched_at: new Date().toISOString() })
                    .eq('id', source.id);

            } catch (error) {
                console.error(`Error fetching from ${source.name}:`, error);
                errorCount++;
            }

            await updateFetchStatus({
                is_running: true,
                current_source: `完成 ${source.name}`,
                progress: i + 1,
                total: targetSources.length,
                started_at: new Date().toISOString()
            });
        }

        // Final Status
        await updateFetchStatus({
            is_running: false,
            current_source: '已完成',
            progress: targetSources.length,
            total: targetSources.length,
            last_completed_at: new Date().toISOString()
        });

        return {
            success: true,
            processed: targetSources.length,
            newItems: newItemsCount,
            skippedItems: skippedItemsCount,
            errors: errorCount
        };

    } catch (error) {
        console.error('Error in fetch pipeline:', error);

        await updateFetchStatus({
            is_running: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            last_completed_at: new Date().toISOString()
        });

        throw error;
    }
}
