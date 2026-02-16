-- Create verification_codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT,
  phone TEXT,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone_code ON verification_codes (phone, code) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_verification_codes_email_code ON verification_codes (email, code) WHERE used_at IS NULL;
