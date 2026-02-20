-- Add missing columns to the users table

-- Add logic columns with defaults
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false;

-- Add profile columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS real_name TEXT,
ADD COLUMN IF NOT EXISTS id_card_number TEXT,
ADD COLUMN IF NOT EXISTS id_card_scan_url TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Comment on columns
COMMENT ON COLUMN public.users.is_suspended IS 'Is the user suspended from logging in';
COMMENT ON COLUMN public.users.is_muted IS 'Is the user muted from commenting';
