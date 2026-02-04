#!/usr/bin/env node

/**
 * 测试图片提取逻辑
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

async function testImageExtraction() {
  console.log('测试图片提取逻辑...\n');

  try {
    const feed = await rssParser.parseURL('https://feeds.bbci.co.uk/zhongwen/simp/rss.xml');

    const items = feed.items.slice(0, 5);

    items.forEach((item, index) => {
      console.log(`\n条目 ${index + 1}: ${item.title}`);

      let imageUrl;

      // 1. RSS的enclosure标签
      if (item.enclosure && item.enclosure.type?.startsWith('image/')) {
        imageUrl = item.enclosure.url;
        console.log('✓ 从enclosure提取:', imageUrl);
      }

      // 2. 从 media:thumbnail 提取
      if (!imageUrl && item['media:thumbnail']) {
        const mediaThumbnail = item['media:thumbnail'];
        if (mediaThumbnail?.$?.url) {
          imageUrl = mediaThumbnail.$.url;
          console.log('✓ 从media:thumbnail提取:', imageUrl);
        } else if (typeof mediaThumbnail === 'string') {
          imageUrl = mediaThumbnail;
          console.log('✓ 从media:thumbnail(字符串)提取:', imageUrl);
        } else if (Array.isArray(mediaThumbnail) && mediaThumbnail[0]?.$?.url) {
          imageUrl = mediaThumbnail[0].$.url;
          console.log('✓ 从media:thumbnail(数组)提取:', imageUrl);
        }
      }

      if (!imageUrl) {
        console.log('✗ 未找到图片');
      }
    });

    console.log('\n✅ 测试完成！');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testImageExtraction();
