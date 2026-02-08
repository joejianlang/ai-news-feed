import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 使用懒加载模式，确保在实际使用时才初始化，而不是在模块加载时
let _supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
    if (!_supabase) {
        // 在 Next.js 中，浏览器只能访问 NEXT_PUBLIC_ 开头的变量
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            const isBrowser = typeof window !== 'undefined';
            const errorMsg = `Supabase configuration missing. ${isBrowser ? 'Make sure NEXT_PUBLIC_ variables are set in Vercel.' : 'Check your server-side environment variables.'}`;
            console.error(errorMsg, { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
            throw new Error(errorMsg);
        }

        _supabase = createClient(supabaseUrl, supabaseKey);
    }
    return _supabase;
}

// 导出一个函数用于检查配置是否完整（不抛出错误）
export function isSupabaseConfigured(): boolean {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    return !!(supabaseUrl && supabaseKey);
}

// 为了保持向后兼容，导出一个 getter
export const supabase = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        try {
            const client = getSupabaseClient();
            return (client as any)[prop];
        } catch (e) {
            // 如果报错（比如配置缺失），返回一个 dummy 函数或对象以防崩溃
            console.warn('Accessing supabase client without valid configuration.');
            return () => { throw e; };
        }
    }
});

