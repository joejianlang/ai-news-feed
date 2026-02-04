-- ============================================
-- 评论系统数据库表设计
-- ============================================

-- 1. 创建评论表 (comments)
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_item_id UUID NOT NULL REFERENCES news_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建评论点赞表 (comment_likes)
CREATE TABLE comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 3. 创建索引
CREATE INDEX idx_comments_news_item_id ON comments(news_item_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);

-- 4. 添加更新时间触发器
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. 启用 RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- 6. 评论表 RLS 策略
CREATE POLICY "comments_select_policy" ON comments
  FOR SELECT USING (true);

CREATE POLICY "comments_insert_policy" ON comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "comments_update_policy" ON comments
  FOR UPDATE USING (true);

CREATE POLICY "comments_delete_policy" ON comments
  FOR DELETE USING (true);

-- 7. 点赞表 RLS 策略
CREATE POLICY "comment_likes_select_policy" ON comment_likes
  FOR SELECT USING (true);

CREATE POLICY "comment_likes_insert_policy" ON comment_likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "comment_likes_delete_policy" ON comment_likes
  FOR DELETE USING (true);

-- 8. 为 news_items 添加评论计数字段
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- 9. 创建评论计数更新函数
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE news_items
    SET comment_count = comment_count + 1
    WHERE id = NEW.news_item_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE news_items
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.news_item_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_deleted != NEW.is_deleted THEN
    IF NEW.is_deleted THEN
      UPDATE news_items
      SET comment_count = GREATEST(0, comment_count - 1)
      WHERE id = NEW.news_item_id;
    ELSE
      UPDATE news_items
      SET comment_count = comment_count + 1
      WHERE id = NEW.news_item_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 10. 创建触发器
CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE OR UPDATE OF is_deleted ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- 添加注释
COMMENT ON TABLE comments IS '用户评论表';
COMMENT ON TABLE comment_likes IS '评论点赞表';
COMMENT ON COLUMN comments.parent_id IS '父评论ID，NULL表示顶级评论';
COMMENT ON COLUMN comments.is_deleted IS '软删除标记';
