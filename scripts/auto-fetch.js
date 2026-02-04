#!/usr/bin/env node

/**
 * 自动定时抓取脚本
 *
 * 使用方法：
 * 1. 直接运行：node scripts/auto-fetch.js
 * 2. 使用 cron 定时运行，例如每小时执行一次：
 *    0 * * * * cd /path/to/project && node scripts/auto-fetch.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const CRON_SECRET = process.env.CRON_SECRET || 'your-cron-secret';

async function fetchAllSources() {
  console.log(`[${new Date().toISOString()}] Starting auto-fetch...`);

  try {
    const response = await fetch(`${BASE_URL}/api/fetch`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[${new Date().toISOString()}] Auto-fetch completed successfully`);
    console.log(`Total new items: ${data.count}`);

    return data;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Auto-fetch failed:`, error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fetchAllSources()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { fetchAllSources };
