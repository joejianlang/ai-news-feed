import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const title = searchParams.get('title') || '社区深度讨论';
        const itemId = searchParams.get('id');
        const origin = new URL(req.url).origin;

        // 构建二维码链接
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${origin}/forum?item=${itemId}`)}`;

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#0f172a',
                        backgroundImage: 'radial-gradient(circle at 25% 25%, #134e4a 0%, transparent 50%), radial-gradient(circle at 75% 75%, #1e1b4b 0%, transparent 50%)',
                        padding: '40px',
                    }}
                >
                    {/* 装饰性背景 */}
                    <div style={{ display: 'flex', position: 'absolute', top: 40, left: 40, color: '#2dd4bf', fontSize: 24, fontWeight: 'bold', opacity: 0.6 }}>
                        数位 Buffet | 社区论坛
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '32px',
                            padding: '60px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        }}
                    >
                        <h1
                            style={{
                                fontSize: 60,
                                fontWeight: 900,
                                color: 'white',
                                textAlign: 'center',
                                marginBottom: 40,
                                lineHeight: 1.2,
                                maxWidth: '800px',
                            }}
                        >
                            {title}
                        </h1>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                            <img
                                src={qrUrl}
                                style={{
                                    width: '180px',
                                    height: '180px',
                                    borderRadius: '20px',
                                    border: '8px solid white',
                                }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', color: 'white' }}>
                                <div style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8, color: '#2dd4bf' }}>扫码加入讨论</div>
                                <div style={{ fontSize: 20, opacity: 0.7 }}>汇聚全网深度见解</div>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (e: any) {
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
