-- ============================================================================
-- 修复：public.users 表缺失 password_hash 字段导致无法登录 (500 Error)
-- ============================================================================

-- 1. 为 public.users 表添加 password_hash 字段
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public' AND column_name = 'password_hash') THEN
        ALTER TABLE public.users ADD COLUMN password_hash TEXT;
    END IF;
END $$;
