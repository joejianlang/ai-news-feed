'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';

function SSOHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { checkAuth } = useUser();

    useEffect(() => {
        const handleSSO = async () => {
            const token = searchParams.get('token');
            const redirect = searchParams.get('redirect') || '/admin';

            if (!token) {
                console.warn('No token provided in SSO request');
                router.push('/admin/login?error=缺少登录令牌');
                return;
            }

            try {
                // 将 Token 写入 Cookie (兼容 legacy auth 模式)
                // 在实际生产中，这里的安全级别应进一步提升
                document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 3600}; samesite=lax`;

                // 强制刷新 Context 中的用户信息
                await checkAuth();

                // 跳转到目标页面
                window.location.href = redirect;
            } catch (error) {
                console.error('SSO jump failed:', error);
                router.push('/admin/login?error=身份转换失败');
            }
        };

        handleSSO();
    }, [searchParams, router, checkAuth]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-teal-500 rounded-lg animate-pulse opacity-50"></div>
                </div>
            </div>
            <p className="mt-8 text-slate-400 font-black italic tracking-widest uppercase animate-pulse">
                SSO.正在转换身份...
            </p>
        </div>
    );
}

export default function SSOPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-800 border-t-teal-500 rounded-full animate-spin"></div>
            </div>
        }>
            <SSOHandler />
        </Suspense>
    );
}
