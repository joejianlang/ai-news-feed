-- Add payment details to ads table
ALTER TABLE ads ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('online', 'manual'));
ALTER TABLE ads ADD COLUMN IF NOT EXISTS payment_voucher_url TEXT;

-- Update constraints for status and payment_status
ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_status_check;
ALTER TABLE ads ADD CONSTRAINT ads_status_check CHECK (status IN ('pending', 'active', 'expired', 'rejected', 'unpaid', 'verifying_payment'));

ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_payment_status_check;
ALTER TABLE ads ADD CONSTRAINT ads_payment_status_check CHECK (payment_status IN ('unpaid', 'verifying', 'paid'));
