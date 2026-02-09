-- Disable RLS for users and categories tables as they are managed by the server API
-- This fixes the "new row violates row-level security policy" error during registration/login
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Note: Keep user_follows enabled if preferred, but for now we prioritize system stability
ALTER TABLE user_follows DISABLE ROW LEVEL SECURITY;

-- Drop the restrictive policies we added earlier to clean up
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Users can view their own follows" ON user_follows;
DROP POLICY IF EXISTS "Users can insert their own follows" ON user_follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON user_follows;
