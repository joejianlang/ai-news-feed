-- Add status columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;

-- Update RLS if necessary (usually admins have all access, but just in case)
COMMENT ON COLUMN public.users.is_muted IS 'Whether the user is muted from commenting';
COMMENT ON COLUMN public.users.is_suspended IS 'Whether the user account is suspended from logging in';
