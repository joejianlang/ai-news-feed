import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 初始化 Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 初始化 Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 分类映射
const CATEGORY_MAP: Record<string, string> = {
    '本地': '本地',
    '热点': '热点',
    '政治': '政治',
    '科技': '科技',
    '财经': '财经',
    '文化娱乐': '文化娱乐',
    '体育': '体育',
    '深度': '深度',
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

const CLASSIFICATION_PROMPT = `你是一个新闻分类专家，专门服务于加拿大华人社区。请根据以下新闻内容进行分类。

分类规则（按优先级排序）：

1. **本地**：如果新闻**事件发生地点**在加拿大（如多伦多、滑铁卢、温哥华、渥太华等），归类为"本地"。
   - 判断标准是事件发生地，而不是报道媒体的来源

2. **热点**：满足以下任一条件归类为"热点"：
   - **中文圈热点**：微博热搜、微信刷屏、抖音热门、华人社区热议话题
   - **主流媒体头条**：BBC、CNN、纽约时报等主流媒体的重点报道
   - **突发重大事件**：自然灾害、重大事故、政治丑闻、名人逝世等
   - **关键词判断**：包含"热搜"、"刷屏"、"疯传"、"震惊"、"突发"、"爆料"、"争议"等

3. **深度**：深度分析、长篇报道、宏观趋势分析归类为"深度"

4. **其他**：按财经、科技、政治、文化娱乐、体育等标准分类

请分析以下新闻：
**标题**: {title}
**摘要**: {summary}
**AI评论**: {commentary}

请只返回以下 JSON 格式：
{"category": "分类名称", "tags": ["#标签1", "#标签2", "#标签3"]}

category 必须是：本地、热点、政治、科技、财经、文化娱乐、体育、深度 之一。`;

interface NewsItem {
    id: string;
    title: string;
    content?: string;
    ai_summary?: string;
    ai_commentary?: string;
}

async function classifyNews(newsItem: NewsItem) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = CLASSIFICATION_PROMPT
            .replace('{title}', newsItem.title || '')
            .replace('{summary}', newsItem.ai_summary || newsItem.content?.substring(0, 500) || '')
            .replace('{commentary}', newsItem.ai_commentary || '');

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const parsed = JSON.parse(jsonMatch[0]);
        const categoryName = CATEGORY_MAP[parsed.category] || parsed.category;

        return {
            category: categoryName,
            tags: parsed.tags || []
        };
    } catch (error) {
        console.error(`分类失败 [${newsItem.id}]:`, error);
        return null;
    }
}

export async function GET() {
    console.log('🏷️ 开始批量分类新闻...');

    try {
        // 获取未分类的新闻（限制50条避免超时）
        const { data: uncategorizedNews, error } = await supabase
            .from('news_items')
            .select('id, title, content, ai_summary, ai_commentary')
            .is('category_id', null)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!uncategorizedNews || uncategorizedNews.length === 0) {
            return NextResponse.json({
                success: true,
                message: '没有需要分类的新闻',
                processed: 0
            });
        }

        // 预加载分类
        const { data: categories } = await supabase
            .from('categories')
            .select('id, name');

        const categoryIdMap: Record<string, string> = {};
        categories?.forEach(cat => {
            categoryIdMap[cat.name] = cat.id;
        });

        let successCount = 0;
        let failCount = 0;

        // 逐条分类
        for (const news of uncategorizedNews) {
            const classification = await classifyNews(news);

            if (!classification) {
                failCount++;
                continue;
            }

            const categoryId = categoryIdMap[classification.category];
            if (!categoryId) {
                failCount++;
                continue;
            }

            const { error: updateError } = await supabase
                .from('news_items')
                .update({
                    category_id: categoryId,
                    tags: classification.tags
                })
                .eq('id', news.id);

            if (updateError) {
                failCount++;
            } else {
                successCount++;
            }

            // 延迟避免 API 限流
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        console.log(`✅ 分类完成: 成功 ${successCount}, 失败 ${failCount}`);

        return NextResponse.json({
            success: true,
            message: `分类完成`,
            processed: uncategorizedNews.length,
            successCount: successCount,
            failed: failCount
        });

    } catch (error) {
        console.error('分类失败:', error);
        return NextResponse.json(
            { success: false, error: '分类失败' },
            { status: 500 }
        );
    }
}
