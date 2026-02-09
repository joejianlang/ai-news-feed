
import { getChannelVideos, getVideoDetails } from './lib/scrapers/youtube-channel';

async function testYouTubeFetch() {
    const testChannels = [
        { name: 'ABC News', id: 'UCBi2mrWuNuyYy4gbM6fU18Q' },
        { name: 'BBC News', id: 'UC16niRr50-MSBwiO3YDb3RA' }, // BBC News (World)
        { name: 'CTV News', id: 'UCArR_o_SPh_K10btoVpQHeQ' }  // This one worked in stats
    ];

    for (const channel of testChannels) {
        try {
            console.log(`\nTesting fetch for ${channel.name} (${channel.id})...`);
            const videos = await getChannelVideos(channel.id, 5);
            console.log(`Found ${videos.length} videos.`);
            videos.forEach(v => {
                console.log(`- ${v.title} (${v.publishedAt})`);
            });
        } catch (error) {
            console.error(`Error fetching for ${channel.name}:`, error);
        }
    }
}

testYouTubeFetch();
