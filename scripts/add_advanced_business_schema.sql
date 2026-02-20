-- ============================================================================
-- 优服佳：高级业务模块数据库架构 (定制表单、合同、服务模板)
-- ============================================================================

-- 1. 合同模板表
CREATE TABLE IF NOT EXISTS contract_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content TEXT, -- HTML 格式内容
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 表单模板表
CREATE TABLE IF NOT EXISTS form_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'custom' CHECK (type IN ('standard', 'custom', 'complex', 'provider_reg')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    color VARCHAR(20) DEFAULT '#10b981',
    steps JSONB NOT NULL DEFAULT '[]',
    is_popular BOOLEAN DEFAULT false,
    quote_credit_cost INTEGER DEFAULT 0,
    contract_template_id UUID REFERENCES contract_templates(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 表单提交记录表 (改为 form_submissions 以防冲突)
CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES form_templates(id),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name VARCHAR(100),
    user_email VARCHAR(255),
    form_data JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'processing', 'completed', 'cancelled')),
    assigned_provider_id UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 服务商详细配置表 (Provider Profiles)
CREATE TABLE IF NOT EXISTS provider_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    company_name VARCHAR(255),
    description TEXT,
    company_address TEXT,
    business_scope TEXT,
    license_url TEXT,
    website VARCHAR(255),
    service_categories JSONB DEFAULT '[]',
    service_city TEXT,
    languages TEXT,
    id_front_url TEXT,
    id_back_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    extra_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 开启 RLS 并设置策略
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;

-- 简单的管理员/公共读取策略
DO $policy$
BEGIN
    DROP POLICY IF EXISTS "Public Read Admin" ON contract_templates;
    CREATE POLICY "Public Read Admin" ON contract_templates FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public Read Admin" ON form_templates;
    CREATE POLICY "Public Read Admin" ON form_templates FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "User View Own Submissions" ON form_submissions;
    CREATE POLICY "User View Own Submissions" ON form_submissions FOR SELECT USING (auth.uid() = user_id);
END $policy$ LANGUAGE plpgsql;

-- 6. 插入示例数据 (定制表单模板)
INSERT INTO form_templates (name, description, type, status, color, steps, is_popular)
VALUES 
(
    '搬家服务',
    '适用于：普通用户需求。标准搬家服务表单，包含出发地、目的地、物品描述等信息收集',
    'custom',
    'published',
    '#10b981',
    '[
        {
            "title": "基本信息",
            "description": "确定搬家的时间和地点",
            "fields": [
                {"key": "move_date", "label": "搬家日期", "type": "date", "required": true, "placeholder": "请选择预计搬家日期"},
                {"key": "from_address", "label": "出发地地址", "type": "address", "required": true, "placeholder": "请输入详细地址"},
                {"key": "to_address", "label": "目的地地址", "type": "address", "required": true, "placeholder": "请输入详细地址"}
            ]
        },
        {
            "title": "详细需求",
            "description": "补充楼层和物品信息",
            "fields": [
                {"key": "from_floor", "label": "出发地楼层", "type": "select", "required": true, "options": [{"label": "House/Townhouse (地面)", "value": "0"}, {"label": "Condo/Apartment (有电梯)", "value": "lift"}]},
                {"key": "items_desc", "label": "物品描述", "type": "textarea", "required": false, "placeholder": "例如：一张King Size床，两个床头柜，20个纸箱..."}
            ]
        }
    ]'::jsonb,
    true
),
(
    '接机服务',
    '机场接送服务，适用于：普通用户需求。',
    'custom',
    'published',
    '#3b82f6',
    '[
        {
            "title": "航班信息",
            "fields": [
                {"key": "flight_no", "label": "航班号", "type": "text", "required": true},
                {"key": "arrival_time", "label": "到达时间", "type": "date", "required": true}
            ]
        }
    ]'::jsonb,
    false
),
(
    '水管维修',
    '用于家庭水管的维修，包括管道疏通，更换等。适用于：普通用户需求。',
    'custom',
    'published',
    '#f59e0b',
    '[
        {
            "title": "故障描述",
            "fields": [
                {"key": "problem", "label": "故障描述", "type": "textarea", "required": true},
                {"key": "urgent", "label": "紧急程度", "type": "select", "options": [{"label": "一般", "value": "normal"}, {"label": "紧急", "value": "urgent"}]}
            ]
        }
    ]'::jsonb,
    true
)
ON CONFLICT DO NOTHING;
