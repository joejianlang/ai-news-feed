# AI推荐新闻源功能使用指南

## 功能说明

系统现在支持AI自动发现和推荐热门中文媒体源，管理员可以在后台审核并批量添加。

## 工作流程

```
1. AI搜索热门源 → 2. 生成推荐列表 → 3. 管理员审核 → 4. 批准添加
```

## 设置步骤

### 1. 创建数据表

在 Supabase Dashboard 执行SQL：

```sql
-- 创建推荐新闻源表
CREATE TABLE IF NOT EXISTS recommended_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('rss', 'youtube_channel', 'web')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  youtube_channel_id VARCHAR(255),
  fetch_interval INTEGER DEFAULT 3600,
  commentary_style TEXT DEFAULT '专业分析',
  recommended_reason TEXT,
  popularity_score INTEGER,
  subscriber_count BIGINT,
  view_count BIGINT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommended_sources_status ON recommended_sources(status);
CREATE INDEX IF NOT EXISTS idx_recommended_sources_created_at ON recommended_sources(created_at DESC);
```

### 2. 运行AI推荐脚本

手动运行（测试）：
```bash
node scripts/discover-hot-sources.js
```

设置定时任务（每天自动运行）：
```bash
# 编辑 crontab
crontab -e

# 添加：每天早上8点运行
0 8 * * * cd /path/to/project && node scripts/discover-hot-sources.js >> /tmp/discover-sources.log 2>&1
```

### 3. 访问审核页面

登录管理员账户后，访问：
- 网址：http://localhost:3002/recommendations
- 或点击导航栏的 "🔍 推荐源" 链接

### 4. 审核和添加

- ✅ **单个批准**：点击某个推荐的"✓ 批准"按钮
- ✅ **批量批准**：勾选多个推荐，点击"批量批准"
- ❌ **拒绝**：点击"✗ 拒绝"按钮

## 当前推荐的媒体源

### YouTube频道 (10个)

#### 新闻类
1. **BBC News 中文** - BBC官方中文频道，权威国际新闻报道
2. **DW中文** - 德国之声官方频道，欧洲视角的国际新闻
3. **CCTV中文国际** - CCTV官方国际频道

#### 科普教育类
4. **老高與小茉** - 华语圈顶级科普频道，500万+订阅
5. **李永乐老师** - 中国知名物理教师，300万+订阅
6. **回形针PaperClip** - 高质量科普视频制作团队

#### 财经科技类
7. **大劉說新聞** - 知名财经评论人，深度分析国际局势
8. **雷電說書** - 商业故事和企业分析

#### 生活知识类
9. **冷门探索** - 探索各种冷门知识和奇闻异事
10. **小Lin说** - 各类知识科普

### RSS源 (8个)

#### 传统新闻媒体
1. **BBC中文网** - BBC官方中文RSS
2. **纽约时报中文网** - 高质量深度报道
3. **德国之声中文** - 欧洲视角的新闻报道

#### 科技财经媒体
4. **36氪** - 中国领先的科技创投媒体
5. **虎嗅网** - 高质量商业科技内容平台
6. **IT之家** - 中文科技新闻第一站
7. **少数派** - 高质量效率工具和数字生活内容
8. **Solidot** - 老牌科技资讯站，geek文化

## 自定义推荐列表

编辑 `scripts/discover-hot-sources.js` 文件，修改：

```javascript
const RECOMMENDED_YOUTUBE_CHANNELS = [
  {
    name: '频道名称',
    url: 'https://www.youtube.com/@channelname',
    category: '传统新闻媒体', // 或 'YouTube网红' 或 '网络专业媒体'
    commentary_style: '评论风格',
    reason: '推荐理由',
    estimated_subscribers: 1000000 // 预估订阅数
  },
  // ... 更多频道
];

const RECOMMENDED_RSS_SOURCES = [
  {
    name: 'RSS源名称',
    url: 'https://example.com/rss.xml',
    category: '网络专业媒体',
    commentary_style: '专业分析',
    reason: '推荐理由'
  },
  // ... 更多RSS源
];
```

## 高级功能

### 热度评分算法

系统根据订阅数自动计算热度评分（1-100）：
```javascript
popularity_score = min(100, floor(subscriber_count / 10000))
```

### 自动去重

- 检查是否已在推荐列表中
- 检查是否已在正式新闻源列表中
- 避免重复推荐

### 审核记录

系统记录：
- 谁审核的（reviewed_by）
- 什么时候审核的（reviewed_at）
- 审核结果（status: pending/approved/rejected）

## 查看推荐历史

在 Supabase Dashboard 执行：

```sql
-- 查看所有待审核的推荐
SELECT * FROM recommended_sources WHERE status = 'pending' ORDER BY popularity_score DESC;

-- 查看已批准的推荐
SELECT * FROM recommended_sources WHERE status = 'approved' ORDER BY reviewed_at DESC;

-- 查看被拒绝的推荐
SELECT * FROM recommended_sources WHERE status = 'rejected' ORDER BY reviewed_at DESC;
```

## 最佳实践

1. **定期运行**：建议每天或每周运行一次AI推荐脚本
2. **及时审核**：及时处理待审核的推荐，保持内容新鲜
3. **记录原因**：拒绝时可以在数据库中添加备注
4. **监控质量**：定期检查已批准源的内容质量

## 故障排除

### 问题：推荐列表为空

解决方案：
1. 运行 `node scripts/discover-hot-sources.js`
2. 检查脚本输出是否有错误
3. 确认数据表已创建

### 问题：批准后没有出现在管理源列表

解决方案：
1. 检查浏览器控制台是否有错误
2. 刷新管理源页面
3. 检查 Supabase 中 news_sources 表是否有新记录

### 问题：无法访问推荐源页面

解决方案：
1. 确认已登录管理员账户
2. 检查用户的 role 是否为 'admin'
3. 查看浏览器控制台错误信息

## 未来改进

- [ ] 使用真实的YouTube API获取实时订阅数和观看数
- [ ] 使用Claude AI分析RSS内容质量
- [ ] 添加用户投票功能，让普通用户也能推荐
- [ ] 自动检测失效的RSS源
- [ ] 根据用户兴趣推荐个性化源
