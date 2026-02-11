-- Create Ads table
CREATE TABLE IF NOT EXISTS ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    raw_content TEXT,
    image_url TEXT,
    link_url TEXT,
    contact_info TEXT,
    scope TEXT DEFAULT 'local', -- local, city, province, national
    target_city TEXT,
    target_province TEXT,
    duration_days INTEGER DEFAULT 7,
    price_total DECIMAL(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, active, expired, rejected, unpaid
    payment_status TEXT DEFAULT 'unpaid', -- unpaid, paid
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Policies for ads
CREATE POLICY "Users can view their own ads" ON ads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ads" ON ads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending ads" ON ads
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Anyone can view active ads" ON ads
    FOR SELECT USING (status = 'active');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ads_status_dates ON ads(status, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ads_targeting ON ads(scope, target_city, target_province);
