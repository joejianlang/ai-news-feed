-- 安全加固迁移脚本 (2026-02-18)
-- 解决 Supabase Security Advisor 报告的所有 RLS 隐患

-- 1. 开启所有漏掉的 RLS
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_source_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recommended_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fetch_logs ENABLE ROW LEVEL SECURITY;

-- 2. 清除可能冲突的旧策略 (采用幂等性处理)
DO $$ 
BEGIN
    -- users
    DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    -- verification_codes
    DROP POLICY IF EXISTS "System can manage verification codes" ON public.verification_codes;
    -- ai_config
    DROP POLICY IF EXISTS "Anyone can view AI config" ON public.ai_config;
    DROP POLICY IF EXISTS "Admins can manage AI config" ON public.ai_config;
    -- user_follows
    DROP POLICY IF EXISTS "Users can view own follows" ON public.user_follows;
    DROP POLICY IF EXISTS "Users can create own follows" ON public.user_follows;
    DROP POLICY IF EXISTS "Users can delete own follows" ON public.user_follows;
    DROP POLICY IF EXISTS "Users can manage own follows" ON public.user_follows;
    -- user_source_follows
    DROP POLICY IF EXISTS "Users can view own source follows" ON public.user_source_follows;
    DROP POLICY IF EXISTS "Users can create own source follows" ON public.user_source_follows;
    DROP POLICY IF EXISTS "Users can delete own source follows" ON public.user_source_follows;
    DROP POLICY IF EXISTS "Users can manage own source follows" ON public.user_source_follows;
    -- recommended_sources
    DROP POLICY IF EXISTS "Anyone can view recommended sources" ON public.recommended_sources;
    DROP POLICY IF EXISTS "Admins can manage recommended sources" ON public.recommended_sources;
    -- fetch_logs
    DROP POLICY IF EXISTS "Logs are restricted" ON public.fetch_logs;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. 实施核心安全策略

-- [USERS 表]
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- [VERIFICATION_CODES 表] 
-- 极其敏感：前端不需要直接访问，代码中应通过服务端 API 操作
-- 这里不设任何公网策略，默认拒绝所有 API 请求，仅 Service Role 可用

-- [AI_CONFIG 表]
CREATE POLICY "Anyone can view AI config" ON public.ai_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage AI config" ON public.ai_config 
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- [FOLLOWS 相关表]
CREATE POLICY "Users can view own follows" ON public.user_follows FOR SELECT USING (auth.uid() = follower_id);
CREATE POLICY "Users can create own follows" ON public.user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete own follows" ON public.user_follows FOR DELETE USING (auth.uid() = follower_id);

CREATE POLICY "Users can view own source follows" ON public.user_source_follows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own source follows" ON public.user_source_follows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own source follows" ON public.user_source_follows FOR DELETE USING (auth.uid() = user_id);

-- [RECOMMENDED_SOURCES 表]
CREATE POLICY "Anyone can view recommended sources" ON public.recommended_sources FOR SELECT USING (true);
CREATE POLICY "Admins can manage recommended sources" ON public.recommended_sources 
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- [FETCH_LOGS 表]
-- 纯运维数据，不设公网策略，仅管理员通过 Dashboard 或后台查看

-- 4. 解决 Security Definer View 警告 (针对 search_analytics)
-- 彻底修复：重建视图并显式指定使用查询者的权限 (SECURITY INVOKER)
DROP VIEW IF EXISTS public.search_analytics;
CREATE VIEW public.search_analytics WITH (security_invoker = true) AS
SELECT
  keyword,
  COUNT(*) as total_searches,
  SUM(CASE WHEN has_results THEN 1 ELSE 0 END) as searches_with_results,
  SUM(CASE WHEN NOT has_results THEN 1 ELSE 0 END) as searches_without_results,
  AVG(results_count) as avg_results_count,
  MAX(created_at) as last_searched_at
FROM public.search_logs
GROUP BY keyword
ORDER BY total_searches DESC;

GRANT SELECT ON public.search_analytics TO authenticated;
GRANT SELECT ON public.search_analytics TO anon;
