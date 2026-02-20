-- ============================================================================
-- 修复：public.users 表 RLS 策略缺失导致无法读取用户角色
-- 执行说明：请在 Supabase SQL Editor 中执行此脚本。
-- ============================================================================

-- 1. 确保 RLS 已开启 (通常是开启的，为了安全显式确认)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. 添加允许所有人读取用户公开信息的策略
-- 注意：这里假设 user 表只包含非敏感公开信息（如 username, display_name, avatar_url, role 等）
-- 如果包含敏感信息（如 phone, email 等），前端 select 时应显式指定字段，
-- 或者 RLS 策略可以更细粒度，但通常 SELECT USING (true) 是标准的公开个人资料做法。

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Read Users" ON public.users;
    CREATE POLICY "Public Read Users" ON public.users FOR SELECT USING (true);
    
    -- 另外，确保用户可以更新自己的信息
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
    
    -- 确保用户可以插入自己的信息 (虽然通常由 trigger 处理，但也加上)
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
    CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
END $$;
