
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVideoStats() {
    const now = new Date();
    const range = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    console.log(`Checking stats since ${range}...`);

    // Get count of articles vs videos
    const { data: items, error } = await supabase
        .from('news_items')
        .select('content_type, source_id')
        .gte('created_at', range);

    if (error) {
        console.error('Error fetching news items:', error);
        return;
    }

    const stats = items.reduce((acc, item) => {
        acc[item.content_type] = (acc[item.content_type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    console.log('--- Content Type Breakdown (last 24h) ---');
    console.log(stats);

    // Check which sources produced videos
    const videoSourceIds = Array.from(new Set(items.filter(i => i.content_type === 'video').map(i => i.source_id)));

    if (videoSourceIds.length > 0) {
        const { data: sources } = await supabase
            .from('news_sources')
            .select('id, name, source_type')
            .in('id', videoSourceIds);

        console.log('\n--- Sources that produced videos ---');
        sources?.forEach(s => console.log(`- ${s.name} (${s.source_type})`));
    } else {
        console.log('\n--- No sources produced videos in the last 24h ---');
    }

    // Check all active YouTube sources and their last fetch results
    const { data: ytSources } = await supabase
        .from('news_sources')
        .select('id, name, url, source_type, last_fetched_at')
        .eq('is_active', true)
        .like('source_type', '%youtube%');

    console.log('\n--- Active YouTube Sources Status ---');
    ytSources?.forEach(s => {
        const itemCreatedCount = items.filter(i => i.source_id === s.id).length;
        console.log(`- ${s.name} (${s.source_type}): ${itemCreatedCount} items in last 24h (Last fetch: ${s.last_fetched_at})`);
    });
}

checkVideoStats();
