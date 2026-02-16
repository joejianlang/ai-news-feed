-- Add real-name verification fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS real_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_card_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_card_scan_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Add online payment toggle to system_settings
INSERT INTO system_settings (key, value)
VALUES ('ad_payment_settings', '{"enable_online_payment": true}')
ON CONFLICT (key) DO NOTHING;
