-- ============================================================================
-- 优服佳：管理后台演示 Mock 数据脚本 (修复版 - 补全用户必填项)
-- 说明：此脚本会插入示例用户、模板、需求申请和订单，用于验证后台界面。
-- ============================================================================

-- 1. 插入示例用户 (public.users)
-- 注意：补全了 password, password_hash 和 username 以绕过非空约束。
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
ON CONFLICT (id) DO NOTHING;

-- 2. 插入服务商资料 (providers)
INSERT INTO providers (id, user_id, company_name, status, credits, created_at)
VALUES 
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '优酷搬家有限公司', 'approved', 100, NOW())
ON CONFLICT (user_id) DO NOTHING;

-- 3. 插入表单模板 (form_templates)
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

-- 4. 插入表单提交/需求申请 (form_submissions)
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

-- 5. 插入订单 (orders)
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
