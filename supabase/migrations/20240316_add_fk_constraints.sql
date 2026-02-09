-- Add foreign key constraints to user_follows table
-- This fixes the "Could not find a relationship" error

-- Add FK from user_follows.source_id to news_sources.id
ALTER TABLE user_follows
ADD CONSTRAINT fk_user_follows_source
FOREIGN KEY (source_id) REFERENCES news_sources(id) ON DELETE CASCADE;

-- Add FK from user_follows.user_id to users.id
ALTER TABLE user_follows
ADD CONSTRAINT fk_user_follows_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
