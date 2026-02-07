
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const DEEP_DIVE_PROMPT = `你是一位资深的深度专栏作家，擅长将新闻事件置于更宏大的历史和未来视角中进行分析。

请对以下新闻进行深度增强：

**新闻标题**: {title}
**新闻摘要**: {summary}
**现有AI评论**: {commentary}

---

你的任务是：

1. **前因分析**（历史背景）- 这个事件是如何发展到今天的？关键转折点是什么？

2. **后果预测**（未来影响）- 短期和长期会如何影响？对普通人有什么影响？

3. **评论润色** - 重新撰写深度专栏风格的评论，像《经济学人》或《纽约客》的风格

请按以下 JSON 格式返回：
{
  "background": "历史背景分析（200-300字）",
  "prediction": "未来影响预测（200-300字）", 
  "enhanced_commentary": "润色后的深度评论（500-800字）"
}`;

interface NewsItem {
    id: string;
    title: string;
    content?: string;
    ai_summary?: string;
    ai_commentary?: string;
}

async function enhanceDeepDive(newsItem: NewsItem) {
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

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            background: parsed.background || '',
            prediction: parsed.prediction || '',
            enhanced_commentary: parsed.enhanced_commentary || ''
        };
    } catch (error) {
        console.error(`深度增强失败 [${newsItem.id}]:`, error);
        return null;
    }
}

export interface DeepDiveStats {
    processed: number;
    successCount: number;
    failed: number;
}

export async function runDeepDivePipeline(): Promise<DeepDiveStats> {
    console.log('📚 开始运行深度内容增强流水线...');

    try {
        // 获取深度分类的 category_id
        const { data: depthCategory, error: catError } = await supabase
            .from('categories')
            .select('id')
            .eq('name', '深度')
            .single();

        if (catError || !depthCategory) {
            console.error('找不到"深度"分类，无法运行深度增强');
            return { processed: 0, successCount: 0, failed: 0 };
        }

        // 获取需要增强的深度新闻（限制20条避免超时）
        // 选择那些已经是"深度"分类，但还没有深度背景分析的新闻
        const { data: deepNews, error } = await supabase
            .from('news_items')
            .select('id, title, content, ai_summary, ai_commentary')
            .eq('category_id', depthCategory.id)
            .is('deep_background', null)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        if (!deepNews || deepNews.length === 0) {
            console.log('没有需要增强的深度新闻');
            return { processed: 0, successCount: 0, failed: 0 };
        }

        let successCount = 0;
        let failCount = 0;

        for (const news of deepNews) {
            const enhancement = await enhanceDeepDive(news);

            if (!enhancement) {
                failCount++;
                continue;
            }

            const { error: updateError } = await supabase
                .from('news_items')
                .update({
                    deep_background: enhancement.background,
                    deep_prediction: enhancement.prediction,
                    ai_commentary: enhancement.enhanced_commentary
                })
                .eq('id', news.id);

            if (updateError) {
                console.error(`更新深度内容失败 [${news.id}]:`, updateError);
                failCount++;
            } else {
                successCount++;
                console.log(`[深度增强成功] ${news.title.substring(0, 20)}...`);
            }

            // 延迟避免 API 限流
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`✅ 深度增强流水线完成: 成功 ${successCount}, 失败 ${failCount}`);

        return {
            processed: deepNews.length,
            successCount,
            failed: failCount
        };

    } catch (error) {
        console.error('深度增强流水线异常:', error);
        throw error;
    }
}
