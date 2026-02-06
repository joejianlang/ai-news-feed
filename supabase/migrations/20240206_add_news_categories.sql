-- Add new news categories
-- Run this migration to add the requested categories

INSERT INTO categories (name, description) VALUES
  ('本地', '本地新闻和社区资讯'),
  ('热点', '热门话题和趋势新闻'),
  ('政治', '政治新闻和时事评论'),
  ('科技', '科技创新和数码产品'),
  ('财经', '财经新闻和市场分析'),
  ('文化娱乐', '文化艺术和娱乐资讯'),
  ('体育', '体育赛事和运动新闻'),
  ('深度', '深度调查和专题报道')
ON CONFLICT DO NOTHING;
