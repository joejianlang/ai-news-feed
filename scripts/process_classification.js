#!/usr/bin/env node

/**
 * 新闻分类脚本
 * 使用 Gemini AI 自动分类未归类的新闻
 * 
 * 运行方式: node scripts/process_classification.js
 */

require('dotenv').config({ path: '.env.local' });

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

// 初始化 Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 初始化 Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 分类映射（数据库中的分类名称）
const CATEGORY_MAP = {
    '本地': '本地',
    '热点': '热点',
    '政治': '政治',
    '科技': '科技',
    '财经': '财经',
    '文化娱乐': '文化娱乐',
    '体育': '体育',
    '深度': '深度',
    // 英文映射
    'local': '本地',
    'trending': '热点',
    'politics': '政治',
    'tech': '科技',
    'technology': '科技',
    'finance': '财经',
    'entertainment': '文化娱乐',
    'sports': '体育',
    'indepth': '深度',
    'in-depth': '深度',
};

// 分类 Prompt
const CLASSIFICATION_PROMPT = `你是一个新闻分类专家，专门服务于加拿大华人社区。请根据以下新闻内容进行分类。

分类规则（按优先级排序）：

1. **本地**：如果新闻**事件发生地点**在加拿大（如多伦多、滑铁卢、温哥华、渥太华、卡尔加里、蒙特利尔等），归类为"本地"。
   - 判断标准是事件发生地，而不是报道媒体的来源
   - 例如：加拿大媒体报道美国大选不算本地，但发生在多伦多的事件算本地

2. **热点**：请仔细判断是否为热门新闻，满足以下任一条件归类为"热点"：
   - **中文圈热点**：微博热搜、微信刷屏、抖音热门、小红书爆款、华人社区热议话题
   - **主流媒体头条**：BBC、CNN、纽约时报、华尔街日报等主流媒体的重点报道
   - **突发重大事件**：自然灾害、重大事故、政治丑闻、名人逝世等
   - **社会热议话题**：引发广泛讨论、争议的话题，明星八卦、社会事件
   - **关键词判断**：标题或内容包含"热搜"、"刷屏"、"疯传"、"震惊"、"突发"、"爆料"、"争议"、"引发热议"、"全网关注"等
   - 注意：普通新闻报道不算热点，必须是真正引发广泛关注或讨论的内容

3. **深度**：如果涉及深度分析、长篇报道（超过1200字）、宏观趋势分析、专题调查，归类为"深度"

4. **其他分类**：
   - 财经：金融、股市、经济、投资、商业、房地产、加密货币相关
   - 科技：AI、科技产品、互联网、软件、硬件、科学发现相关
   - 政治：政府、选举、政策、国际关系、外交、军事相关
   - 文化娱乐：电影、音乐、明星、艺术、文化活动、综艺节目相关
   - 体育：体育赛事、运动员、体育新闻、奥运会、世界杯相关

请分析以下新闻：

**标题**: {title}

**摘要**: {summary}

**AI评论**: {commentary}

**正文长度**: {contentLength} 字

请只返回以下 JSON 格式，不要有任何其他内容：
{"category": "分类名称", "tags": ["#标签1", "#标签2", "#标签3"], "trending_reason": "如果是热点，说明原因"}

注意：
- category 必须是以下之一：本地、热点、政治、科技、财经、文化娱乐、体育、深度
- tags 最多3个，使用中文，以#开头
- trending_reason 仅当category为热点时填写，其他情况留空
- 只返回 JSON，不要有任何解释`;

async function classifyNews(newsItem) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = CLASSIFICATION_PROMPT
            .replace('{title}', newsItem.title || '')
            .replace('{summary}', newsItem.ai_summary || newsItem.content?.substring(0, 500) || '')
            .replace('{commentary}', newsItem.ai_commentary || '')
            .replace('{contentLength}', (newsItem.content?.length || 0).toString());

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        // 提取 JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error(`无法解析响应: ${responseText}`);
            return null;
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // 映射分类名称
        const categoryName = CATEGORY_MAP[parsed.category] || parsed.category;

        return {
            category: categoryName,
            tags: parsed.tags || []
        };
    } catch (error) {
        console.error(`分类失败 [${newsItem.id}]:`, error.message);
        return null;
    }
}

async function getCategoryId(categoryName) {
    const { data, error } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .single();

    if (error || !data) {
        console.error(`找不到分类: ${categoryName}`);
        return null;
    }

    return data.id;
}

async function main() {
    console.log('🏷️ 新闻分类脚本启动\n');
    console.log('='.repeat(60));

    // 1. 获取所有未分类的新闻
    console.log('\n📥 正在获取未分类的新闻...');

    const { data: uncategorizedNews, error } = await supabase
        .from('news_items')
        .select('id, title, content, ai_summary, ai_commentary')
        .is('category_id', null)
        .order('created_at', { ascending: false })
        .limit(500); // 每次处理500条

    if (error) {
        console.error('获取新闻失败:', error);
        process.exit(1);
    }

    if (!uncategorizedNews || uncategorizedNews.length === 0) {
        console.log('✅ 没有需要分类的新闻');
        return;
    }

    console.log(`📊 找到 ${uncategorizedNews.length} 条未分类新闻\n`);

    // 2. 预加载所有分类
    const { data: categories } = await supabase
        .from('categories')
        .select('id, name');

    const categoryIdMap = {};
    categories?.forEach(cat => {
        categoryIdMap[cat.name] = cat.id;
    });

    console.log('📁 可用分类:', Object.keys(categoryIdMap).join(', '));
    console.log('\n' + '='.repeat(60) + '\n');

    // 3. 逐条分类
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < uncategorizedNews.length; i++) {
        const news = uncategorizedNews[i];
        const progress = `[${i + 1}/${uncategorizedNews.length}]`;

        console.log(`${progress} 处理: ${news.title?.substring(0, 40)}...`);

        // 调用 Gemini 分类
        const classification = await classifyNews(news);

        if (!classification) {
            console.log(`   ❌ 分类失败`);
            failCount++;
            continue;
        }

        // 获取分类 ID
        const categoryId = categoryIdMap[classification.category];

        if (!categoryId) {
            console.log(`   ⚠️ 未知分类: ${classification.category}`);
            failCount++;
            continue;
        }

        // 更新数据库
        const { error: updateError } = await supabase
            .from('news_items')
            .update({
                category_id: categoryId,
                tags: classification.tags
            })
            .eq('id', news.id);

        if (updateError) {
            console.log(`   ❌ 更新失败: ${updateError.message}`);
            failCount++;
        } else {
            console.log(`   ✅ ${classification.category} | ${classification.tags.join(' ')}`);
            successCount++;
        }

        // 添加延迟避免 API 限流
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 4. 输出统计
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 分类完成统计:');
    console.log(`   ✅ 成功: ${successCount}`);
    console.log(`   ❌ 失败: ${failCount}`);
    console.log(`   📈 成功率: ${((successCount / uncategorizedNews.length) * 100).toFixed(1)}%`);
}

main().catch(console.error);
