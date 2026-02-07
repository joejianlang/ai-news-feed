
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

分类规则（按优先级排序）：

1. **本地**：如果新闻**事件发生地点**在加拿大境内（如多伦多、温哥华、蒙特利尔、渥太华、卡尔加里等），归类为"本地"。
   - **严格限制**：事件必须发生在加拿大。
   - **排除**：发生在中国、台湾、香港、美国或其他国家的新闻，**绝对不能**归类为"本地"，即使对华人社区很重要。
   - 判断标准是**事件发生地**，而不是报道媒体的来源或受众。

2. **热点**：满足以下任一条件归类为"热点"：
   - **中文圈热点**：微博热搜、微信刷屏、抖音热门、华人社区热议话题
   - **主流媒体头条**：BBC、CNN、纽约时报等主流媒体的重点报道
   - **突发重大事件**：自然灾害、重大事故、政治丑闻、名人逝世等
   - **关键词判断**：包含"热搜"、"刷屏"、"疯传"、"震惊"、"突发"、"爆料"、"争议"等

3. **深度**：必须满足以下四类标准之一才能归类为"深度"：
   
   **A. 结构性政治与历史遗留问题**
   - 涉及主权、边界、长期冲突或宪法级变动
   - 例如：台海、巴以、阿省独立、美国中期选举
   - 需要补充5-10年历史背景，拆解各方利益博弈
   
   **B. 宏观经济与地理套利风险**
   - 涉及利率调整、关税法案、汇率剧变、养老金改革、跨国税务
   - 能将宏观数据转化为个人财富影响（房贷、投资、套利计划）
   
   **C. 颠覆性技术与伦理拐点**
   - 涉及固态电池量产、AI法律主体、脑机接口等关键技术节点
   - 需要对比技术路线图，区分营销炒作与真正突破
   
   **D. 高热争议与社会情绪节点**
   - 24小时内热度激增，评论区严重撕裂
   - 涉及性别、种族、移民等敏感议题
   - 需要提炼正反中三方视角
   
   注意：普通长文、常规分析不算深度，必须符合以上四类标准之一

4. **其他分类**：
   - 财经：金融、股市、经济、投资、商业
   - 科技：AI、科技产品、互联网、软件、硬件
   - 政治：政府、选举、政策、国际关系
   - 文化娱乐：电影、音乐、明星、艺术
   - 体育：体育赛事、运动员、体育新闻

请分析以下新闻：
**标题**: {title}
**摘要**: {summary}
**AI评论**: {commentary}

请只返回以下 JSON 格式：
{"category": "分类名称", "tags": ["#标签1", "#标签2", "#标签3"]}

   **重要**：如果是"本地"新闻，**必须**在 tags 中包含具体的城市名称（如 "#多伦多", "#温哥华", "#列治文山"），以便后续进行基于位置的推荐。

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
