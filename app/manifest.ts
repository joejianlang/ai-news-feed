import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: '数位 Buffet',
        short_name: '数位 Buffet',
        description: '智能资讯，随心而阅。AI 智能总结，专家深度点评。',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#14b8a6',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
            {
                src: '/logo.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/logo.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
