/**
 * 定时抓取脚本
 * 每小时自动抓取所有活跃的新闻源
 *
 * 运行方式：
 * npx ts-node scripts/cron-fetcher.ts
 *
 * 或者使用 PM2 保持后台运行：
 * pm2 start scripts/cron-fetcher.ts --interpreter npx --interpreter-args="ts-node"
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FETCH_INTERVAL = 60 * 60 * 1000; // 1小时（毫秒）

async function runFetch() {
  const startTime = new Date();
  console.log(`\n${'='.repeat(50)}`);
  console.log(`[${startTime.toLocaleString('zh-CN')}] 开始定时抓取...`);
  console.log(`${'='.repeat(50)}`);

  try {
    const response = await fetch(`${BASE_URL}/api/cron/fetch`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`,
      },
    });

    const result = await response.json();

    if (result.success) {
      console.log(`\n✅ 抓取完成！`);
      console.log(`   - 成功源: ${result.successSources}/${result.totalSources}`);
      console.log(`   - 新内容: ${result.newItems} 条`);
      console.log(`   - 跳过: ${result.skippedItems} 条（已存在）`);

      if (result.errors && result.errors.length > 0) {
        console.log(`\n⚠️ 部分错误:`);
        result.errors.forEach((err: string) => console.log(`   - ${err}`));
      }
    } else {
      console.error(`\n❌ 抓取失败: ${result.error}`);
    }

    const duration = (Date.now() - startTime.getTime()) / 1000;
    console.log(`\n⏱️ 耗时: ${duration.toFixed(1)} 秒`);

  } catch (error) {
    console.error(`\n❌ 请求失败:`, error);
  }

  const nextRun = new Date(Date.now() + FETCH_INTERVAL);
  console.log(`\n⏰ 下次抓取: ${nextRun.toLocaleString('zh-CN')}`);
  console.log(`${'='.repeat(50)}\n`);
}

// 立即运行一次
runFetch();

// 设置定时器
setInterval(runFetch, FETCH_INTERVAL);

console.log(`
🚀 定时抓取服务已启动
   - 抓取间隔: 1 小时
   - API 地址: ${BASE_URL}/api/cron/fetch

按 Ctrl+C 停止服务
`);
