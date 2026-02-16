-- Add offline status to ads table status check constraint
ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_status_check;
ALTER TABLE ads ADD CONSTRAINT ads_status_check CHECK (status IN ('pending', 'active', 'expired', 'rejected', 'unpaid', 'verifying_payment', 'offline'));
