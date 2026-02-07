
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

**最高优先级：识别本地新闻**

在分类前，请先仔细检查新闻内容，寻找以下加拿大地名的任意提及：

**加拿大主要城市**（如果新闻内容提到这些地点，就是本地新闻）：
- 安大略省: Toronto/多伦多, Mississauga/密西沙加, Brampton/宾顿, Markham/万锦, Richmond Hill/列治文山, Vaughan/旺市, Oakville/奥克维尔, Burlington/伯灵顿, Hamilton/汉密尔顿, Ottawa/渥太华, Guelph/贵湖, Waterloo/滑铁卢, London/伦敦, North York/北约克, Scarborough/士嘉堡, Etobicoke/怡陶碧谷
- BC省: Vancouver/温哥华, Richmond/列治文, Burnaby/本拿比, Surrey/素里, Coquitlam/高贵林, Victoria/维多利亚, Kelowna
- 魁北克: Montreal/蒙特利尔, Quebec City/魁北克城, Laval
- 阿尔伯塔: Calgary/卡尔加里, Edmonton/埃德蒙顿
- 其他: Winnipeg/温尼伯, Halifax/哈利法克斯, Saskatoon/萨斯卡通

**分类规则（按优先级排序）**：

1. **本地**：如果新闻中出现以下任一情况，归类为"本地"：
   - 新闻内容明确提到上述加拿大城市名称
   - 提及加拿大省份名称（Ontario, BC, Quebec, Alberta等）
   - 提及加拿大联邦/省级政府机构（如 CBSA/加拿大边境服务局, CRA/加拿大税务局, Service Canada）
   - 提及加拿大特有机构或事件（如 Tim Hortons, Hockey Night, CN Tower, Stanley Cup加拿大队等）
   - URL或来源包含 .ca 域名
   
   **识别技巧**：
   - "GTA" = Greater Toronto Area = 大多伦多地区 → 本地
   - "Lower Mainland" = 温哥华地区 → 本地
   - 提到加拿大移民政策（Express Entry, PNP, LMIA）但事件发生在加拿大 → 本地

2. **热点**：满足以下任一条件归类为"热点"：
   - 中文圈热点：微博热搜、微信刷屏、抖音热门
   - 主流媒体头条：BBC、CNN、纽约时报等重点报道
   - 突发重大事件：自然灾害、重大事故、政治丑闻、名人逝世
   - 关键词：包含"热搜"、"刷屏"、"疯传"、"震惊"、"突发"、"爆料"、"争议"

3. **深度**：符合以下四类标准之一：
   A. 结构性政治与历史遗留问题（台海、巴以等）
   B. 宏观经济与地缘套利风险（利率、关税、汇率）
   C. 颠覆性技术与伦理拐点（AI、脑机接口）
   D. 高热争议与社会情绪节点（性别、种族、移民争议）

4. **其他分类**：
   - 财经：金融、股市、经济、投资、商业、加密货币
   - 科技：AI、科技产品、互联网、软件、硬件
   - 政治：政府、选举、政策、国际关系（非加拿大事件）
   - 文化娱乐：电影、音乐、明星、艺术
   - 体育：体育赛事、运动员、体育新闻

请分析以下新闻：
**标题**: {title}
**摘要**: {summary}
**AI评论**: {commentary}

请只返回以下 JSON 格式：
{"category": "分类名称", "tags": ["#标签1", "#标签2", "#标签3"], "location": "识别到的地点名称或null"}

**重要规则**：
- 如果是"本地"新闻，tags **必须**包含具体城市名（如 "#多伦多", "#温哥华", "#列治文山"）
- 如果是"本地"新闻，location 字段填写识别到的加拿大城市名
- category 必须是：本地、热点、政治、科技、财经、文化娱乐、体育、深度 之一`;


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
