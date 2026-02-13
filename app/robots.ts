import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/publish/'],
        },
        sitemap: 'https://ai-news-feed-rose.vercel.app/sitemap.xml',
    };
}
