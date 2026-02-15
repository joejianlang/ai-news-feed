-- Create ads table
CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    raw_content TEXT,
    image_url TEXT,
    link_url TEXT,
    contact_info TEXT,
    scope TEXT NOT NULL CHECK (scope IN ('local', 'city', 'province', 'national')),
    target_city TEXT,
    target_province TEXT,
    duration_days INT NOT NULL,
    price_total DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'rejected', 'unpaid')),
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
    rejection_reason TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_ads_user ON ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_scope ON ads(scope);

-- RLS
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Ads are viewable by everyone when active" 
ON ads FOR SELECT 
USING (status = 'active');

CREATE POLICY "Users can view their own ads" 
ON ads FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ads" 
ON ads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ads" 
ON ads FOR UPDATE 
USING (auth.uid() = user_id);

-- Initialize pricing setting if not exists
INSERT INTO system_settings (key, value)
VALUES ('ad_pricing', '{
    "scope": { "local": 50, "city": 100, "province": 200, "national": 500 },
    "duration": { "1": 10, "3": 25, "7": 50, "14": 80, "30": 150 }
}')
ON CONFLICT (key) DO NOTHING;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
