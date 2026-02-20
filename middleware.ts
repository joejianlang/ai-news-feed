
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // 处理跨域 (CORS)
    const origin = request.headers.get('origin')
    const isApi = request.nextUrl.pathname.startsWith('/api')

    // 对于本地开发，允许 3001 和 5173 端口 (Vue 后台)
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173']
    const isAllowedOrigin = origin && allowedOrigins.includes(origin)

    if (isApi && request.method === 'OPTIONS') {
        const preflightResponse = new NextResponse(null, { status: 200 })
        if (isAllowedOrigin) {
            preflightResponse.headers.set('Access-Control-Allow-Origin', origin)
            preflightResponse.headers.set('Access-Control-Allow-Credentials', 'true')
        }
        preflightResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        preflightResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
        preflightResponse.headers.set('Access-Control-Max-Age', '86400')
        return preflightResponse
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    if (isApi && isAllowedOrigin) {
        response.headers.set('Access-Control-Allow-Origin', origin)
        response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { user: sbUser } } = await supabase.auth.getUser()

    // 检查是否有自定义的 auth_token (兼容旧版登录)
    const authToken = request.cookies.get('auth_token')?.value
    const user = sbUser || (authToken ? { role: 'admin' } : null) // 临时简单判断，只要有 token 就视为已登录。具体的 role 校验由页面组件完成。

    // 1. 保护 `/admin` 路由
    if (request.nextUrl.pathname.startsWith('/admin')) {
        // 排除登录页本身，防止死循环
        if (request.nextUrl.pathname === '/admin/login') {
            // 如果已登录且是管理员，访问登录页自动跳走
            // 注意：这里我们简单判断已登录，更严格的 checkServerRole 可能会增加延迟，暂不强制
            if (user) {
                // 这里可以加一个 role check，但 middleware 里查数据库稍慢。
                // 暂时不仅是已登录，就认为可能想进后台。
                // 更好的体验是：如果已登录，直接 redirect 到 /admin/users
                // 但如果不是 admin，会进不去。
                // 简单起见，登录页不做自动跳转，让用户自己点。
            }
            return response
        }

        // 如果未登录，重定向到管理员登录页
        if (!user) {
            const redirectUrl = new URL('/admin/login', request.url)
            redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
            return NextResponse.redirect(redirectUrl)
        }

        // 如果已登录，但不是管理员？
        // Middleware 里拿 role 通常需要查库或 Decode JWT (如果有 custom claims)
        // 很多时候 supabase session user metadata 里不一定有最新的 role。
        // 我们先放行，让页面组件/Layout去做最终的 role check (UserContext 已有检查)。
        // 或者我们可以在 middleware 里简单查一下 public.users (如果 Supabase 允许)

        // 这里我们先只做“必须登录”的校验。
        // 更细粒度的“必须是管理员”由页面 useEffect 检查。
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
