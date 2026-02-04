# 自动抓取功能使用指南

## 功能说明

系统现在支持自动定时抓取所有活跃新闻源的最新内容，并自动过滤已存在的内容，避免重复。

## 特性

1. ✅ **智能去重**：自动检测并跳过已存在的新闻
2. ✅ **按顺序执行**：从上到下依次抓取各个新闻源
3. ✅ **只抓新内容**：如果没有新内容，自动跳过
4. ✅ **自动翻译标题**：英文标题自动翻译为中文
5. ✅ **图片提取**：自动提取文章配图

## 使用方式

### 方式1：手动触发（推荐用于测试）

访问管理源页面（http://localhost:3002/sources），点击右上角的 **"🔄 全部抓取"** 按钮。

系统会：
- 抓取所有活跃（is_active = true）的新闻源
- 自动跳过已存在的内容
- 显示抓取结果（新增了多少条新闻）

### 方式2：使用Node脚本

```bash
# 在项目根目录执行
node scripts/auto-fetch.js
```

这个脚本会调用 `/api/fetch` API，自动抓取所有活跃源。

### 方式3：设置定时任务（推荐用于生产环境）

#### macOS/Linux - 使用 cron

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每小时执行一次）
0 * * * * cd /Users/joelyan/Documents/AI\ news/ai-news-feed && node scripts/auto-fetch.js >> /tmp/auto-fetch.log 2>&1

# 或者每30分钟执行一次
*/30 * * * * cd /Users/joelyan/Documents/AI\ news/ai-news-feed && node scripts/auto-fetch.js >> /tmp/auto-fetch.log 2>&1

# 或者每6小时执行一次（早6点、中午12点、下午6点、晚上12点）
0 6,12,18,0 * * * cd /Users/joelyan/Documents/AI\ news/ai-news-feed && node scripts/auto-fetch.js >> /tmp/auto-fetch.log 2>&1
```

查看执行日志：
```bash
tail -f /tmp/auto-fetch.log
```

#### Windows - 使用任务计划程序

1. 打开"任务计划程序"
2. 创建基本任务
3. 设置触发器（例如：每小时）
4. 操作选择"启动程序"
5. 程序/脚本：`node`
6. 参数：`scripts/auto-fetch.js`
7. 起始于：你的项目路径

### 方式4：使用 PM2（推荐用于服务器）

PM2 可以让脚本持续运行并自动重启：

```bash
# 安装 PM2
npm install -g pm2

# 创建一个定时执行的配置
pm2 start scripts/auto-fetch.js --cron "0 * * * *" --no-autorestart
```

PM2 cron 格式说明：
- `0 * * * *` - 每小时执行
- `*/30 * * * *` - 每30分钟执行
- `0 */6 * * *` - 每6小时执行

查看 PM2 日志：
```bash
pm2 logs auto-fetch
```

## 环境变量配置

确保 `.env.local` 中配置了以下变量：

```env
# 用于定时任务认证
CRON_SECRET=your-cron-secret

# 如果脚本在远程服务器运行，需要设置BASE_URL
BASE_URL=https://your-domain.com
```

## 抓取逻辑

1. **获取所有活跃源**：只抓取 `is_active = true` 的新闻源
2. **按创建时间顺序**：从最早添加的源开始抓取
3. **检查重复**：通过 URL 检查是否已存在
4. **提取内容**：
   - RSS：提取最新5篇文章
   - YouTube频道：提取最新5个视频
   - 网页：提取当前页面内容
5. **AI分析**：
   - 翻译英文标题为中文
   - 生成内容摘要
   - 生成专业解读
6. **保存到数据库**：只保存新内容

## 监控和日志

### 查看抓取历史

在管理源页面，每个源会显示"最后抓取时间"，方便查看哪些源已经更新。

### API 端点

```bash
# 手动触发全部抓取
curl -X POST http://localhost:3002/api/fetch \
  -H "Content-Type: application/json" \
  -d '{}'

# 抓取单个源
curl -X POST http://localhost:3002/api/fetch \
  -H "Content-Type: application/json" \
  -d '{"sourceId": "your-source-id"}'

# 使用 cron 认证（用于定时任务）
curl -X GET http://localhost:3002/api/fetch \
  -H "Authorization: Bearer your-cron-secret"
```

## 最佳实践

1. **初次使用**：先手动点击"全部抓取"测试功能
2. **设置频率**：根据新闻源更新频率设置，建议：
   - 快讯类媒体：每30分钟
   - 传统媒体：每小时
   - 博客/专栏：每6小时
3. **监控日志**：定期查看日志确保正常运行
4. **清理旧数据**：定期清理过期新闻（可以后续添加功能）

## 常见问题

**Q: 为什么有些内容没有抓取到？**

A: 可能原因：
- 新闻源 `is_active` 设置为 false
- 内容已存在（系统会自动跳过）
- RSS/网页解析失败
- YouTube API 配额用完

**Q: 如何查看哪些内容被跳过了？**

A: 查看服务器日志，会显示 "Skipping existing item: xxx"

**Q: 可以设置不同源的不同抓取频率吗？**

A: 目前所有源使用统一频率。如果需要不同频率，可以创建多个 cron 任务，每个任务抓取特定的源。

**Q: 抓取会影响网站性能吗？**

A: 每次抓取会消耗一定的 CPU 和 API 配额（Claude AI、YouTube API）。建议：
- 不要设置过高频率（建议至少30分钟）
- 监控 API 使用量
- 必要时可以只抓取重要的源

## 技术实现

- **去重机制**：通过 `original_url` 字段检查
- **顺序执行**：使用 `for...of` 循环，非并行
- **错误处理**：单个源失败不影响其他源
- **事务安全**：每条新闻独立保存，失败不回滚
