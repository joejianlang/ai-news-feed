import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 获取环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * 创建浏览器端 Supabase 客户端
 * 使用 @supabase/ssr 自动处理 PKCE verifier 在 cookie 中的存储
 */
export function createSupabaseBrowserClient() {
    return createBrowserClient(
        supabaseUrl,
        supabaseAnonKey
    );
}

/**
 * 检查 Supabase 是否已配置
 */
export function isSupabaseConfigured(): boolean {
    return !!(supabaseUrl && supabaseAnonKey);
}

// ============================================================================
// 向后兼容的导出（用于现有代码）
// ============================================================================

let _legacySupabase: SupabaseClient | null = null;

/**
 * 获取传统的 Supabase 客户端（用于服务器端非 cookie 场景）
 * @deprecated 推荐使用 createSupabaseBrowserClient
 */
export function getSupabaseClient(): SupabaseClient {
    if (!_legacySupabase) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            const isBrowser = typeof window !== 'undefined';
            const errorMsg = `Supabase configuration missing. ${isBrowser ? 'Make sure NEXT_PUBLIC_ variables are set in Vercel.' : 'Check your server-side environment variables.'}`;
            console.error(errorMsg, { url: !!url, key: !!key });
            throw new Error(errorMsg);
        }

        _legacySupabase = createClient(url, key);
    }
    return _legacySupabase;
}

/**
 * 向后兼容的 supabase 导出
 * @deprecated 推荐使用 createSupabaseBrowserClient
 */
export const supabase = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        try {
            if (typeof window !== 'undefined') {
                const client = createSupabaseBrowserClient();
                return (client as any)[prop];
            }
            const client = getSupabaseClient();
            return (client as any)[prop];
        } catch (e) {
            console.warn('Accessing supabase client without valid configuration.');
            return () => { throw e; };
        }
    }
});
