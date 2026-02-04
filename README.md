# AI 新闻源聚合器

一个基于 Next.js 的智能新闻聚合应用，使用 Claude AI 自动分析和评论各类新闻内容。

## 功能特点

- 📰 支持多种新闻源类型（RSS、YouTube 视频、YouTube 频道、网页）
- 🎥 YouTube 视频直接嵌入时间线播放
- 📺 订阅 YouTube 频道，自动获取最新视频
- 🤖 AI 自动生成内容摘要和风格化评论
- 🎨 推特风格的时间线界面
- ⚡ 实时自动刷新
- 🎯 为每个新闻源定制不同的评论风格
- 📱 响应式设计

## 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude API
- **内容抓取**: RSS Parser, YouTube Transcript

## 快速开始

### 1. 克隆项目

\`\`\`bash
cd ai-news-feed
npm install
\`\`\`

### 2. 配置环境变量

复制 \`.env.local.example\` 为 \`.env.local\` 并填入你的配置：

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Anthropic Claude API
ANTHROPIC_API_KEY=your-anthropic-api-key

# YouTube Data API v3 (for channel subscriptions)
YOUTUBE_API_KEY=your-youtube-api-key

# Optional: For scheduled tasks
CRON_SECRET=your-cron-secret
\`\`\`

### 3. 设置 Supabase 数据库

1. 在 [Supabase](https://supabase.com) 创建一个新项目
2. 在 SQL Editor 中运行 \`supabase/migrations/20240101_initial_schema.sql\` 文件
3. 复制项目的 URL 和 anon key 到 \`.env.local\`

### 4. 获取 Anthropic API Key

1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 创建 API Key
3. 将 Key 添加到 \`.env.local\`

### 5. 获取 YouTube API Key（可选）

**仅在需要订阅 YouTube 频道时必需**

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 YouTube Data API v3
4. 创建凭据 > API 密钥
5. 将密钥添加到 \`.env.local\`

**注意**: 如果你只使用 RSS 和单个 YouTube 视频链接，可以跳过此步骤。

### 6. 运行开发服务器

\`\`\`bash
npm run dev
\`\`\`

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 使用指南

### 添加新闻源

1. 访问 `/sources` 页面
2. 点击"添加新闻源"
3. 填写以下信息：
   - **名称**: 新闻源显示名称
   - **URL**: 根据类型填写不同的 URL
   - **类型**:
     - **RSS**: RSS 订阅源
     - **YouTube 单个视频**: 单个 YouTube 视频链接
     - **YouTube 频道**: YouTube 频道链接（需要 API Key）
     - **网页**: 普通网页 URL
   - **抓取间隔**: 以秒为单位（默认 3600 = 1小时）
   - **评论风格**: 例如"专业分析"、"幽默讽刺"、"简洁犀利"等

**YouTube 频道 URL 格式**:
- `https://www.youtube.com/@channelname`
- `https://www.youtube.com/channel/UCxxxxxxxxx`
- `https://www.youtube.com/c/customname`

### 抓取新闻

**手动抓取**:
- 在新闻源管理页面点击"立即抓取"按钮

**自动抓取**:
- 使用定时任务调用 `/api/fetch` 端点

### 查看新闻

- 主页会自动显示最新的新闻
- 每条新闻包含：
  - 📝 AI 生成的摘要
  - 💬 风格化的 AI 评论
  - 🔗 原文链接

## 项目结构

\`\`\`
ai-news-feed/
├── app/
│   ├── api/              # API 路由
│   │   ├── sources/      # 新闻源管理
│   │   ├── news/         # 新闻列表
│   │   └── fetch/        # 抓取服务
│   ├── sources/          # 新闻源管理页面
│   └── page.tsx          # 主页（时间线）
├── lib/
│   ├── supabase/         # Supabase 客户端和查询
│   ├── ai/               # AI 分析（Claude）
│   └── scrapers/         # 内容抓取器
├── types/                # TypeScript 类型定义
└── supabase/
    └── migrations/       # 数据库迁移文件
\`\`\`

## 定时任务设置

### 使用 Vercel Cron Jobs

在 \`vercel.json\` 中添加：

\`\`\`json
{
  "crons": [
    {
      "path": "/api/fetch",
      "schedule": "0 */1 * * *"
    }
  ]
}
\`\`\`

### 或使用外部 Cron 服务

使用 [cron-job.org](https://cron-job.org) 等服务，定期调用：

\`\`\`
POST https://your-domain.com/api/fetch
Headers:
  Authorization: Bearer YOUR_CRON_SECRET
\`\`\`

## 部署

### Vercel 部署（推荐）

\`\`\`bash
npm run build
vercel --prod
\`\`\`

记得在 Vercel 项目设置中添加环境变量。

## 数据库表结构

### news_sources
- 新闻源配置表
- 字段：name, url, source_type, fetch_interval, commentary_style, is_active

### news_items
- 新闻条目表
- 字段：title, content, ai_summary, ai_commentary, original_url

## 自定义 AI 评论风格

在添加新闻源时，可以设置不同的评论风格，例如：

- **专业分析**: 客观、深度的专业评论
- **幽默讽刺**: 轻松幽默、带有讽刺意味
- **简洁犀利**: 短小精悍、一针见血
- **技术解读**: 从技术角度分析
- **历史视角**: 结合历史背景评论

AI 会根据你设定的风格生成相应的评论。

## 注意事项

- YouTube 抓取依赖字幕，没有字幕的视频无法抓取
- 网页抓取是简化版，建议使用 RSS 源获得更好的效果
- Claude API 调用有费用，请注意控制抓取频率
- Supabase 免费版有存储和请求限制

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
