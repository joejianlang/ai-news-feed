# YouTube 频道订阅功能指南

## 🎉 新功能

现在应用支持两个强大的 YouTube 相关功能：

### 1. ✅ YouTube 视频嵌入播放
- 所有 YouTube 视频会直接在时间线中显示播放器
- 无需跳转到 YouTube，直接在应用内观看
- 16:9 响应式播放器

### 2. ✅ YouTube 频道订阅
- 订阅你喜欢的 YouTube 频道
- 自动抓取频道的最新视频（默认抓取最新 5 个）
- 每个视频都会进行 AI 分析和评论

## 🔧 配置要求

### YouTube API Key

订阅 YouTube 频道功能需要 YouTube Data API v3 密钥。

#### 获取步骤：

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)

2. 创建项目：
   - 点击顶部项目下拉菜单
   - 选择"新建项目"
   - 输入项目名称（例如：AI News Feed）
   - 点击"创建"

3. 启用 YouTube Data API v3：
   - 在左侧菜单选择"API 和服务" > "库"
   - 搜索 "YouTube Data API v3"
   - 点击进入，然后点击"启用"

4. 创建 API 密钥：
   - 在左侧菜单选择"API 和服务" > "凭据"
   - 点击"创建凭据" > "API 密钥"
   - 复制生成的密钥
   - （可选）点击密钥名称进行限制设置，提高安全性

5. 添加到环境变量：
   ```env
   YOUTUBE_API_KEY=你的API密钥
   ```

#### API 配额说明

YouTube Data API v3 有每日配额限制：
- **免费配额**: 每天 10,000 单位
- **抓取频道视频**: 约消耗 100 单位/次
- **建议**: 每天可以抓取约 100 次

## 📝 使用方法

### 订阅 YouTube 频道

1. 访问 `/sources` 页面

2. 点击"添加新闻源"

3. 填写信息：
   ```
   名称: TED Talks
   类型: YouTube 频道
   URL: https://www.youtube.com/@TED
   评论风格: 启发思考
   抓取间隔: 21600（6小时）
   ```

4. 点击"创建"

5. 点击"立即抓取"按钮

### 支持的频道 URL 格式

- **新版 @ 格式**: `https://www.youtube.com/@channelname`
- **频道 ID**: `https://www.youtube.com/channel/UCxxxxxxxx`
- **自定义 URL**: `https://www.youtube.com/c/customname`

## 🎯 推荐频道示例

### 科技类
- **Linus Tech Tips**: `https://www.youtube.com/@LinusTechTips`
- **Marques Brownlee**: `https://www.youtube.com/@mkbhd`

### 教育类
- **TED**: `https://www.youtube.com/@TED`
- **CrashCourse**: `https://www.youtube.com/@crashcourse`

### 新闻类
- **Bloomberg**: `https://www.youtube.com/@Bloomberg`
- **CNBC**: `https://www.youtube.com/@CNBC`

### 中文频道
- **老高與小茉**: `https://www.youtube.com/@user-og6yu`

## 💡 工作原理

### 抓取流程

1. **获取频道信息**
   - 通过 YouTube API 获取频道的上传播放列表 ID

2. **获取视频列表**
   - 从播放列表中获取最新的 5 个视频

3. **提取视频内容**
   - 尝试获取视频字幕作为内容
   - 如果没有字幕，使用视频描述

4. **AI 分析**
   - Claude 分析视频内容生成摘要
   - 根据设定的风格生成评论

5. **保存到数据库**
   - 存储视频信息、摘要和评论

6. **前端显示**
   - 在时间线中显示嵌入式播放器
   - 显示 AI 生成的摘要和评论

### 视频内容来源优先级

1. **视频字幕** - 最详细（如果有）
2. **视频描述** - 备选方案

## 📊 数据库变化

新增字段：

### news_sources 表
- `youtube_channel_id`: 存储解析后的频道 ID
- `source_type`: 新增 `youtube_channel` 类型

### news_items 表
- `video_id`: 存储 YouTube 视频 ID

## ⚠️ 注意事项

### 字幕限制
- 不是所有视频都有字幕
- 没有字幕的视频会使用描述作为内容
- 描述通常较短，AI 分析可能不够详细

### API 限制
- 注意 YouTube API 每日配额
- 建议设置较长的抓取间隔（6 小时以上）
- 监控 Google Cloud Console 的配额使用情况

### 成本考虑
- YouTube API 免费配额通常足够个人使用
- 超出配额后会产生费用
- Claude API 调用会产生费用（按 token 计费）

## 🔍 故障排查

### 问题：抓取失败

**可能原因**:
1. YouTube API Key 未配置或无效
2. API 配额已用完
3. 频道 URL 格式不正确

**解决方法**:
- 检查 `.env.local` 中的 `YOUTUBE_API_KEY`
- 访问 Google Cloud Console 查看配额使用情况
- 确认频道 URL 格式正确

### 问题：视频没有显示播放器

**可能原因**:
- 数据库中缺少 `video_id` 字段

**解决方法**:
- 运行迁移文件 `supabase/migrations/20240102_add_youtube_channel_support.sql`

### 问题：AI 分析内容不详细

**可能原因**:
- 视频没有字幕，只使用了描述

**解决方法**:
- 选择有字幕的频道
- 检查频道视频是否开启了自动字幕

## 🚀 最佳实践

1. **选择高质量频道**
   - 优先选择有详细字幕的频道
   - 定期发布的频道

2. **合理设置抓取间隔**
   - 高频更新频道: 6-12 小时
   - 低频更新频道: 24 小时

3. **定制评论风格**
   - 科技频道: "技术解读"
   - 教育频道: "启发思考"
   - 新闻频道: "客观分析"

4. **监控资源使用**
   - 定期检查 YouTube API 配额
   - 监控 Claude API 使用量
   - 查看 Supabase 存储使用情况

祝使用愉快！🎉
