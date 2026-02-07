import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 使用懒加载模式，确保在实际使用时才初始化，而不是在模块加载时
let _supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
    if (!_supabase) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error(`Supabase configuration missing. URL: ${supabaseUrl ? 'set' : 'missing'}, Key: ${supabaseKey ? 'set' : 'missing'}`);
        }

        _supabase = createClient(supabaseUrl, supabaseKey);
    }
    return _supabase;
}

// 为了保持向后兼容，导出一个 getter
export const supabase = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        return (getSupabaseClient() as any)[prop];
    }
});

