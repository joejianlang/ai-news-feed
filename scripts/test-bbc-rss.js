#!/usr/bin/env node

/**
 * 测试BBC中文RSS图片提取
 */

const Parser = require('rss-parser');
const rssParser = new Parser({
  customFields: {
    item: [
      ['media:thumbnail', 'media:thumbnail'],
      ['media:content', 'media:content'],
    ]
  }
});

async function testBBCRSS() {
  console.log('正在测试 BBC中文 RSS...\n');

  try {
    const feed = await rssParser.parseURL('https://feeds.bbci.co.uk/zhongwen/simp/rss.xml');

    console.log(`Feed标题: ${feed.title}`);
    console.log(`总条目数: ${feed.items.length}\n`);

    // 只看前3条
    const items = feed.items.slice(0, 3);

    items.forEach((item, index) => {
      console.log(`\n========== 条目 ${index + 1} ==========`);
      console.log(`标题: ${item.title}`);
      console.log(`链接: ${item.link}`);

      // 检查所有可能的图片字段
      console.log('\n图片字段检查:');
      console.log('- enclosure:', item.enclosure);
      console.log('- media:thumbnail:', item['media:thumbnail']);
      console.log('- media:content:', item['media:content']);

      // 检查content和description
      if (item.content) {
        const hasImg = item.content.includes('<img');
        console.log(`- content中有图片: ${hasImg}`);
        if (hasImg) {
          const imgMatch = item.content.match(/<img[^>]+src="([^"]+)"/);
          if (imgMatch) {
            console.log(`  图片URL: ${imgMatch[1]}`);
          }
        }
      }

      if (item.description) {
        const hasImg = item.description.includes('<img');
        console.log(`- description中有图片: ${hasImg}`);
        if (hasImg) {
          const imgMatch = item.description.match(/<img[^>]+src="([^"]+)"/);
          if (imgMatch) {
            console.log(`  图片URL: ${imgMatch[1]}`);
          }
        }
      }

      // 打印所有字段名
      console.log('\n所有字段:');
      console.log(Object.keys(item).filter(k => !['content', 'contentSnippet', 'description'].includes(k)));
    });

  } catch (error) {
    console.error('测试失败:', error);
  }
}

testBBCRSS();
