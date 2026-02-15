import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // 获取参数
        const title = searchParams.get('title') || '数位 Buffet - 智能资讯';
        const image = searchParams.get('image');
        const source = searchParams.get('source');
        const type = searchParams.get('type') || 'og'; // og or poster
        const qrcode = searchParams.get('url'); // Optional URL to generate QR code for

        const isPoster = type === 'poster';
        const width = isPoster ? 800 : 1200;
        const height = isPoster ? 1200 : 630;

        const qrCodeUrl = qrcode
            ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrcode)}`
            : null;

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
                        backgroundColor: '#fff',
                        position: 'relative',
                        fontFamily: 'sans-serif',
                    }}
                >
                    {/* 背景底色/渐变 */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(135deg, #0d9488 0%, #0f172a 100%)',
                            opacity: 0.1,
                        }}
                    />

                    {/* 内容容器 */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: isPoster ? 'column' : 'column',
                            width: '90%',
                            height: '90%',
                            backgroundColor: 'white',
                            borderRadius: '40px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            overflow: 'hidden',
                            border: '1px solid rgba(0, 0, 0, 0.05)',
                        }}
                    >
                        {/* 上部：配图 */}
                        <div
                            style={{
                                display: 'flex',
                                width: '100%',
                                height: isPoster ? '45%' : '60%',
                                position: 'relative',
                                backgroundColor: '#f1f5f9',
                            }}
                        >
                            {image ? (
                                <img
                                    src={image}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        display: 'flex',
                                        width: '100%',
                                        height: '100%',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'linear-gradient(to bottom right, #0d9488, #0f172a)',
                                    }}
                                >
                                    <span style={{ fontSize: isPoster ? '60px' : '80px', color: 'white', fontWeight: 'bold' }}>Buffet.</span>
                                </div>
                            )}
                        </div>

                        {/* 下部：文字 */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '40px',
                                flexGrow: 1,
                                justifyContent: 'space-between',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: isPoster ? '42px' : '48px',
                                    fontWeight: '900',
                                    color: '#0f172a',
                                    lineHeight: 1.2,
                                    display: 'flex',
                                    maxHeight: isPoster ? '180px' : '120px',
                                    overflow: 'hidden',
                                }}
                            >
                                {title}
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                                        <div
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                backgroundColor: '#0d9488',
                                                borderRadius: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: '12px',
                                            }}
                                        >
                                            <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>B</span>
                                        </div>
                                        <span style={{ fontSize: '24px', color: '#0f172a', fontWeight: 'bold' }}>数位 Buffet</span>
                                    </div>
                                    <span style={{ fontSize: '20px', color: '#64748b' }}>
                                        {source ? `来自: ${source}` : '智能资讯推送'}
                                    </span>
                                </div>

                                {qrCodeUrl ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <img src={qrCodeUrl} style={{ width: '120px', height: '120px', borderRadius: '10px' }} />
                                        <span style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>扫码阅读</span>
                                    </div>
                                ) : (
                                    <span style={{ fontSize: '20px', color: '#94a3b8' }}>扫描二维码查看全文</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ),
            {
                width,
                height,
            }
        );
    } catch (e: any) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
