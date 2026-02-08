
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize clients (will use environment variables)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Classification Map
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

**最高优先级：识别本地新闻（Local News）**

在分类前，请先仔细检查新闻内容，寻找以下加拿大地名的任意提及。**注意：无论内容是中文还是英文，识别到的地点必须统一使用标准的英文名称。**

**加拿大主要城市 (Major Cities)**:
- Ontario: Toronto, Mississauga, Brampton, Markham, Richmond Hill, Vaughan, Oakville, Burlington, Hamilton, Ottawa, Guelph, Waterloo, London, Kitchener, Cambridge
- BC: Vancouver, Richmond, Burnaby, Surrey, Coquitlam, Victoria, Kelowna
- Quebec: Montreal, Quebec City, Laval, Gatineau
- Alberta: Calgary, Edmonton
- Others: Winnipeg, Halifax, Saskatoon, Regina, St. John's

**分类规则（按优先级排序）**：

1. **本地 (Local)**：如果新闻中出现以下任一情况，归类为"本地"：
   - 新闻内容明确提到上述加拿大城市（使用其英文名进行内部逻辑匹配）
   - 提及加拿大省份名称（Ontario, BC, Quebec, Alberta等）
   - 提及加拿大联邦/省级政府机构（如 CBSA, CRA, Health Canada）
   - 提及加拿大特有机构或事件（如 Tim Hortons, CN Tower, Rogers Centre等）
   - URL或来源包含 .ca 域名
   
   **识别技巧**：
   - "GTA" = Greater Toronto Area → #Toronto
   - "大多伦多" → #Toronto
   - "贵湖" / "圭尔夫" → #Guelph
   - "大温" / "温哥华地区" → #Vancouver
   - 提到加拿大移民政策且发生在加拿大境内 → 本地

2. **热点**：满足以下任一条件归类为"热点"：
   - 中文圈热点（微博、微信、抖音热门）或全球主流媒体头条
   - 突发重大事件（自然灾害、重大政治事件、名人新闻）

3. **深度**：侧重结构性问题、宏观经济、颠覆性技术或高热度社会争议的深度分析。

4. **其他分类**：财经、科技、政治（非加拿大）、文化娱乐、体育。

请分析以下新闻：
**标题**: {title}
**摘要**: {summary}
**AI评论**: {commentary}

请只返回以下 JSON 格式：
{"category": "分类名称", "tags": ["#Tag1", "#Tag2"], "location": "English City Name or null"}

**强制性技术要求**：
- 如果分类是"本地"，tags **必须**包含具体的 **英文城市名标签** (例如: "#Toronto", "#Vancouver", "#Guelph", "#Markham")。
- 如果分类是"本地"，location 字段 **必须**填写识别到的 **英文城市名**。
- **严禁**在 tags 或 location 中使用中文城市名。
- category 必须是：本地、热点、政治、科技、财经、文化娱乐、体育、深度 之一。`;


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

        // 如果识别到本地新闻但没有城市标签，尝试从 location 添加
        let tags = parsed.tags || [];
        if (categoryName === '本地' && parsed.location && !tags.some((t: string) => t.includes(parsed.location))) {
            tags = [`#${parsed.location}`, ...tags];
        }

        console.log(`[分类] ${newsItem.title.substring(0, 30)}... -> ${categoryName} (location: ${parsed.location || 'N/A'})`);

        return {
            category: categoryName,
            tags: tags,
            location: parsed.location || null
        };
    } catch (error) {
        console.error(`分类失败 [${newsItem.id}]:`, error);
        return null;
    }
}

export interface ClassificationStats {
    processed: number;
    successCount: number;
    failed: number;
}

export async function runClassificationPipeline(): Promise<ClassificationStats> {
    console.log('🏷️ 开始运行分类流水线...');

    try {
        // 获取未分类的新闻（限制50条避免超时）
        // 这里的限制可以根据调用频率调整
        const { data: uncategorizedNews, error } = await supabase
            .from('news_items')
            .select('id, title, content, ai_summary, ai_commentary')
            .is('category_id', null)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!uncategorizedNews || uncategorizedNews.length === 0) {
            console.log('没有需要分类的新闻');
            return { processed: 0, successCount: 0, failed: 0 };
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
                console.warn(`未找到分类ID: ${classification.category}`);
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
                console.error(`更新数据库失败 [${news.id}]:`, updateError);
                failCount++;
            } else {
                successCount++;
                console.log(`[分类成功] ${news.title.substring(0, 20)}... -> ${classification.category}`);
            }

            // 延迟避免 API 限流
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        console.log(`✅ 分类流水线完成: 成功 ${successCount}, 失败 ${failCount}`);
        return {
            processed: uncategorizedNews.length,
            successCount,
            failed: failCount
        };

    } catch (error) {
        console.error('分类流水线异常:', error);
        throw error;
    }
}
