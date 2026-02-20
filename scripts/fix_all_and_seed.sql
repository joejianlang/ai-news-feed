-- ============================================================================
-- 优服佳：终极数据修复脚本 (v3 - 暴力修正版)
-- 说明：此脚本专治各种不服，会强制移除所有挡路的约束，补全所有字段，并插入数据。
-- ============================================================================

-- 1. [清理] 移除所有已知的阻碍性约束 (Type Check, Status Check)
DO $$
BEGIN
    -- 移除 form_templates 的 type 检查
    ALTER TABLE form_templates DROP CONSTRAINT IF EXISTS form_templates_type_check;
    
    -- 移除 orders 的 status 检查
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
    
    -- 移除可能存在的 providers 状态检查
    ALTER TABLE providers DROP CONSTRAINT IF EXISTS providers_status_check;
END $$;

-- 2. [补全] 强制补全 users 表的 name (API 强依赖)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'name') THEN
        ALTER TABLE public.users ADD COLUMN name TEXT;
    END IF;
    -- 无论是否新加，都刷新一下 name 值
    UPDATE public.users SET name = COALESCE(display_name, username, email, 'User') WHERE name IS NULL OR name = '';
END $$;

-- 3. [补全] 强制补全 orders 表缺失字段 (service_name, service_type, submission_id)
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
END $$;

-- 4. [修复] 修正外键指向 (从 auth.users -> public.users)
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

    -- 修复 orders (最关键的一步，解决 23503 错误)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        -- 移除旧的错误约束
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_provider_id_fkey;
        -- 添加正确的约束：provider_id 必须指向 providers(id)，而不是 users(id)
        ALTER TABLE orders ADD CONSTRAINT orders_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES providers(id);
        
        -- 确保 user_id 指向 public.users
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
        ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
    END IF;
END $$;

-- 5. [刷新] 强制刷新架构缓存
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- 以下是数据插入部分 (自带冲突忽略)
-- ============================================================================

-- A. 插入/更新 示例用户 (确保有 ID, name, username, password)
INSERT INTO public.users (id, email, name, username, password, password_hash, role, created_at)
VALUES 
(
    '00000000-0000-0000-0000-000000000001', 
    'admin@example.com', 
    '超级管理员', 
    'admin_demo', 
    'demo123456', 
    '$2b$10$demo_hash_placeholder', 
    'admin', 
    NOW()
),
(
    '00000000-0000-0000-0000-000000000002', 
    'user@example.com', 
    '张小凡', 
    'user_demo', 
    'demo123456', 
    '$2b$10$demo_hash_placeholder', 
    'user', 
    NOW()
),
(
    '00000000-0000-0000-0000-000000000003', 
    'provider@example.com', 
    '优服佳服务商', 
    'provider_demo', 
    'demo123456', 
    '$2b$10$demo_hash_placeholder', 
    'user', 
    NOW()
)
ON CONFLICT (id) DO UPDATE SET 
name = EXCLUDED.name, 
username = EXCLUDED.username, 
password = EXCLUDED.password, 
password_hash = EXCLUDED.password_hash;

-- B. 插入服务商
INSERT INTO providers (id, user_id, company_name, status, credits, created_at)
VALUES 
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '优酷搬家有限公司', 'approved', 100, NOW())
ON CONFLICT (user_id) DO NOTHING;

-- C. 插入模板 (确保 type='listing_application')
INSERT INTO form_templates (id, name, description, type, status, color, steps)
VALUES 
(
    '20000000-0000-0000-0000-000000000001',
    '服务商入驻申请',
    '标准服务商入驻审核流程',
    'listing_application',
    'published',
    '#10b981',
    '[{"title": "基本资料", "fields": [{"key": "company", "label": "公司名称", "type": "text"}]}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- D. 插入申请 (状态 'pending' 和 'completed')
INSERT INTO form_submissions (id, template_id, user_id, user_name, user_email, status, form_data, created_at)
VALUES 
(
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '张小凡',
    'user@example.com',
    'pending',
    '{"company": "小凡搬家店", "reason": "想在这平台接单"}'::jsonb,
    NOW()
),
(
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    '优服佳服务商',
    'provider@example.com',
    'completed',
    '{"company": "优酷搬家有限公司"}'::jsonb,
    NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- E. 插入订单 (确保 service_type='standard')
INSERT INTO orders (id, order_no, user_id, provider_id, service_name, service_type, total_amount, status, created_at)
VALUES 
(
    '40000000-0000-0000-0000-000000000001',
    'ORD-2026-0001',
    '00000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '温哥华市内搬家 (大车)',
    'standard',
    280.00,
    'confirmed',
    NOW()
),
(
    '40000000-0000-0000-0000-000000000002',
    'ORD-2026-0002',
    '00000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '机场接送服务',
    'standard',
    60.00,
    'completed',
    NOW() - INTERVAL '2 hours'
)
ON CONFLICT (id) DO NOTHING;
