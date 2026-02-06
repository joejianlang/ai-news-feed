#!/usr/bin/env node

/**
 * 深度内容增强脚本
 * 对 category='深度' 的新闻进行背景扩充和评论润色
 * 
 * 运行方式: node scripts/deep_dive_enhancer.js
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

// 深度增强 Prompt
const DEEP_DIVE_PROMPT = `你是一位资深的深度专栏作家，擅长将新闻事件置于更宏大的历史和未来视角中进行分析。

请对以下新闻进行深度增强：

**新闻标题**: {title}

**新闻摘要**: {summary}

**现有AI评论**: {commentary}

---

你的任务是：

1. **前因分析**（历史背景）
   - 这个事件是如何发展到今天的？
   - 有哪些关键的历史节点和转折？
   - 涉及哪些关键人物或组织的历史作用？

2. **后果预测**（未来影响）
   - 这个事件可能带来什么短期影响？
   - 长期来看会如何改变现状？
   - 对普通人/读者有什么潜在影响？

3. **评论润色**
   - 基于以上分析，重新撰写一段深度专栏风格的评论
   - 要求：视角独到、见解深刻、文笔优美
   - 风格：像《经济学人》或《纽约客》的专栏文章
   - 长度：500-800字

请按以下 JSON 格式返回，不要有任何其他内容：
{
  "background": "历史背景分析（200-300字）",
  "prediction": "未来影响预测（200-300字）", 
  "enhanced_commentary": "润色后的深度评论（500-800字）"
}`;

async function enhanceDeepDive(newsItem) {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                maxOutputTokens: 4000,
                temperature: 0.8,
            }
        });

        const prompt = DEEP_DIVE_PROMPT
            .replace('{title}', newsItem.title || '')
            .replace('{summary}', newsItem.ai_summary || newsItem.content?.substring(0, 500) || '')
            .replace('{commentary}', newsItem.ai_commentary || '');

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        // 提取 JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error(`无法解析响应`);
            return null;
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            background: parsed.background || '',
            prediction: parsed.prediction || '',
            enhanced_commentary: parsed.enhanced_commentary || ''
        };
    } catch (error) {
        console.error(`深度增强失败 [${newsItem.id}]:`, error.message);
        return null;
    }
}

async function main() {
    console.log('📚 深度内容增强脚本启动\n');
    console.log('='.repeat(60));

    // 1. 获取深度分类的 category_id
    const { data: depthCategory, error: catError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', '深度')
        .single();

    if (catError || !depthCategory) {
        console.error('找不到"深度"分类');
        process.exit(1);
    }

    // 2. 获取需要增强的深度新闻（没有 background 字段的）
    console.log('\n📥 正在获取待增强的深度新闻...');

    const { data: deepNews, error } = await supabase
        .from('news_items')
        .select('id, title, content, ai_summary, ai_commentary, deep_background')
        .eq('category_id', depthCategory.id)
        .is('deep_background', null)  // 只处理还没增强过的
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('获取新闻失败:', error);
        process.exit(1);
    }

    if (!deepNews || deepNews.length === 0) {
        console.log('✅ 没有需要增强的深度新闻');
        return;
    }

    console.log(`📊 找到 ${deepNews.length} 条待增强深度新闻\n`);
    console.log('='.repeat(60) + '\n');

    // 3. 逐条增强
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < deepNews.length; i++) {
        const news = deepNews[i];
        const progress = `[${i + 1}/${deepNews.length}]`;

        console.log(`${progress} 增强: ${news.title?.substring(0, 40)}...`);

        // 调用 Gemini 增强
        const enhancement = await enhanceDeepDive(news);

        if (!enhancement) {
            console.log(`   ❌ 增强失败`);
            failCount++;
            continue;
        }

        // 更新数据库
        const { error: updateError } = await supabase
            .from('news_items')
            .update({
                deep_background: enhancement.background,
                deep_prediction: enhancement.prediction,
                ai_commentary: enhancement.enhanced_commentary  // 用润色后的评论替换原评论
            })
            .eq('id', news.id);

        if (updateError) {
            console.log(`   ❌ 更新失败: ${updateError.message}`);
            failCount++;
        } else {
            console.log(`   ✅ 增强完成`);
            console.log(`      📜 背景: ${enhancement.background.substring(0, 50)}...`);
            console.log(`      🔮 预测: ${enhancement.prediction.substring(0, 50)}...`);
            successCount++;
        }

        // 添加延迟避免 API 限流
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 4. 输出统计
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 增强完成统计:');
    console.log(`   ✅ 成功: ${successCount}`);
    console.log(`   ❌ 失败: ${failCount}`);
    console.log(`   📈 成功率: ${((successCount / deepNews.length) * 100).toFixed(1)}%`);
}

main().catch(console.error);
