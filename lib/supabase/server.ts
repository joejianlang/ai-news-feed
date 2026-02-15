import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 获取环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * 创建服务器端 Supabase 客户端（用于 API Routes 和 Server Components）
 * 自动从 cookies 读取 PKCE verifier
 * 
 * 注意：此函数只能在服务器端代码中使用（API Routes, Server Components）
 */
export async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    } catch (error) {
                        // 在 Server Components 中设置 cookie 可能会失败，这是预期行为
                        // 因为 Server Components 在渲染后无法修改 headers
                    }
                },
            },
        }
    );
}
/**
 * 创建具有管理员权限的 Supabase 客户端（使用 Service Role Key）
 * 警告：由于该客户端绕过 RLS 策略，请务必只在后端且经过身份验证的操作中使用！
 */
export async function createSupabaseAdminClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!serviceRoleKey) {
        console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to anon key.');
    }

    return createServerClient(
        supabaseUrl,
        serviceRoleKey || supabaseAnonKey,
        {
            cookies: {
                getAll() { return []; },
                setAll() { },
            },
        }
    );
}
