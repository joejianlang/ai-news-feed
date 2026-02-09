-- AI 配置表
-- 用于存储 AI 内容审查规则和提示词模板

CREATE TABLE IF NOT EXISTS ai_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(50) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_ai_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ai_config_updated_at
    BEFORE UPDATE ON ai_config
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_config_updated_at();

-- 插入默认配置
INSERT INTO ai_config (config_key, config_value, description) VALUES
('filter_rules', '日程安排/节目表（如电视播放时间、直播安排）
活动预告/观赛指南/购票指南
周期性总结（如"本周回顾"、"今日要闻"、"每日简报"等汇总帖）
纯粹的广告或促销内容
天气预报、体育比分列表等纯信息罗列', '内容过滤规则，每行一条，AI 会自动跳过符合这些规则的内容'),

('summary_requirements', '80-150字，概括核心内容、关键要素、影响，全部中文', '摘要生成要求'),

('commentary_requirements', '幽默犀利，有深度有趣味，全部使用中文简体，不要出现任何英文词汇或缩写', '评论生成要求'),

('commentary_length_article', '300-500字', '文章评论字数要求'),

('commentary_length_video', '150-250字，简洁精炼', '视频评论字数要求'),

('commentary_length_deep_dive', '800-1000字，请分为三个部分：【背景】历史与来龙去脉、【分析】核心观点与深层解读、【影响】未来趋势与建议', '深度分析评论字数要求'),

('classification_categories', '本地
热点
政治
科技
财经
文化娱乐
体育
深度', '新闻分类类别列表，每行一个'),

('classification_rules', '1. **本地 (Local)**：新闻中提到加拿大城市、省份、联邦/省级政府机构（CBSA, CRA, Health Canada）或加拿大特有事物
2. **热点**：中文圈热点（微博、微信、抖音热门）或全球主流媒体头条，或突发重大事件
3. **深度**：侧重结构性问题、宏观经济、颠覆性技术或高热度社会争议的深度分析
4. **其他分类**：财经、科技、政治（非加拿大）、文化娱乐、体育', '分类优先级规则说明'),

('canadian_cities', 'Ontario: Toronto, Mississauga, Brampton, Markham, Richmond Hill, Vaughan, Oakville, Burlington, Hamilton, Ottawa, Guelph, Waterloo, London, Kitchener, Cambridge
BC: Vancouver, Richmond, Burnaby, Surrey, Coquitlam, Victoria, Kelowna
Quebec: Montreal, Quebec City, Laval, Gatineau
Alberta: Calgary, Edmonton
Others: Winnipeg, Halifax, Saskatoon, Regina', '加拿大主要城市列表（用于本地新闻识别）')

ON CONFLICT (config_key) DO NOTHING;
