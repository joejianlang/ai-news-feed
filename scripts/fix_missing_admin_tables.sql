-- ============================================================================
-- 优服佳：业务表关联与字段补全脚本 (v2 - 鲁棒更新版)
-- 说明：此脚本会补全缺失表，并修正已存量表的外键指向，最后强制刷新架构缓存。
-- ============================================================================

-- 1. 确保 public.users 表有必备字段 (API 强依赖)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'name') THEN
        ALTER TABLE public.users ADD COLUMN name TEXT;
        UPDATE public.users SET name = COALESCE(display_name, username, email, 'User');
    END IF;
END $$;

-- 2. 核心模板与关联表 (使用 CREATE TABLE IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS contract_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS form_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    type VARCHAR(20) DEFAULT 'custom',
    status VARCHAR(20) DEFAULT 'draft',
    color VARCHAR(20) DEFAULT '#10b981',
    steps JSONB NOT NULL DEFAULT '[]',
    is_popular BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 强制放开模板类型限制 (解决 ERROR: 23514)
ALTER TABLE form_templates DROP CONSTRAINT IF EXISTS form_templates_type_check;

-- 3. [关键修复]：修正存量表的外键指向 (从 auth.users 切换到 public.users)
-- 这一步能让 Supabase 的 .select('*, user:users(...))' 语法生效
DO $$
BEGIN
    -- 修复 form_submissions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_submissions') THEN
        ALTER TABLE form_submissions DROP CONSTRAINT IF EXISTS form_submissions_user_id_fkey;
        ALTER TABLE form_submissions ADD CONSTRAINT form_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
        
        ALTER TABLE form_submissions DROP CONSTRAINT IF EXISTS form_submissions_assigned_provider_id_fkey;
        ALTER TABLE form_submissions ADD CONSTRAINT form_submissions_assigned_provider_id_fkey FOREIGN KEY (assigned_provider_id) REFERENCES public.users(id);
    END IF;

    -- 修复 providers
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'providers') THEN
        ALTER TABLE providers DROP CONSTRAINT IF EXISTS providers_user_id_fkey;
        ALTER TABLE providers ADD CONSTRAINT providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
    END IF;
END $$;

-- 4. 确保 form_submissions 存在
CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES form_templates(id),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_name VARCHAR(100),
    user_email VARCHAR(255),
    form_data JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending',
    assigned_provider_id UUID REFERENCES public.users(id),
    admin_feedback TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 确保 providers 存在
CREATE TABLE IF NOT EXISTS providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL UNIQUE,
    company_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    credits INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 订单表
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    submission_id UUID REFERENCES form_submissions(id),
    user_id UUID REFERENCES public.users(id),
    provider_id UUID REFERENCES providers(id),
    service_name VARCHAR(255),
    service_type VARCHAR(50) DEFAULT 'standard',
    total_amount NUMERIC(10, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 对存量 orders 表补全字段
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'service_name') THEN
        ALTER TABLE orders ADD COLUMN service_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'submission_id') THEN
        ALTER TABLE orders ADD COLUMN submission_id UUID REFERENCES form_submissions(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'service_type') THEN
        ALTER TABLE orders ADD COLUMN service_type VARCHAR(50) DEFAULT 'standard';
    END IF;

    -- 移除可能存在的旧状态约束，允许 confirmed 等新状态
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
END $$;

-- 7. 刷新 PostgREST 架构缓存 (强制生效)
NOTIFY pgrst, 'reload schema';
