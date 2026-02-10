
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 延迟初始化 Supabase 客户端，避免构建时错误
function getSupabase(): SupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return createClient(supabaseUrl, supabaseKey);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 缓存配置，避免每次都查询数据库
let configCache: Record<string, string> | null = null;
let configCacheTime: number = 0;
const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 分钟缓存

// 从数据库获取分类配置
async function getClassificationConfig(): Promise<Record<string, string>> {
    // 检查缓存
    if (configCache && Date.now() - configCacheTime < CONFIG_CACHE_TTL) {
        return configCache;
    }

    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('ai_config')
            .select('config_key, config_value')
            .in('config_key', ['classification_categories', 'classification_rules', 'canadian_cities']);

        if (error) {
            console.error('Error fetching classification config from DB:', error);
            return {}; // 返回空对象，使用硬编码默认值
        }

        const config: Record<string, string> = {};
        for (const item of data || []) {
            config[item.config_key] = item.config_value;
        }

        // 更新缓存
        configCache = config;
        configCacheTime = Date.now();
        console.log('[分类] 从数据库加载了配置');

        return config;
    } catch (error) {
        console.error('Error fetching classification config:', error);
        return {};
    }
}

// 动态生成分类映射
function getCategoryMap(categories: string): Record<string, string> {
    const map: Record<string, string> = {};
    const categoryList = categories.split('\n').filter(c => c.trim());

    for (const cat of categoryList) {
        const trimmed = cat.trim();
        map[trimmed] = trimmed;
    }

    // 添加更多逻辑映射和别名
    map['local'] = '本地';
    map['trending'] = '热点';
    map['politics'] = '政治';
    map['tech'] = '科技';
    map['technology'] = '科技';
    map['finance'] = '财经';
    map['entertainment'] = '文化娱乐';
    map['娱乐'] = '文化娱乐';
    map['sports'] = '体育';
    map['indepth'] = '深度';
    map['in-depth'] = '深度';
    map['其他'] = '热点'; // 回退到热点
    map['未知'] = '热点'; // 回退到热点

    return map;
}

// 默认值
const DEFAULT_CATEGORIES = `本地
热点
政治
科技
财经
文化娱乐
体育
深度`;

const DEFAULT_RULES = `1. **本地 (Local)**：新闻中提到加拿大城市、省份、联邦/省级政府机构（CBSA, CRA, Health Canada）或加拿大特有事物
2. **热点**：中文圈热点（微博、微信、抖音热门）或全球主流媒体头条，或突发重大事件
3. **深度**：侧重结构性问题、宏观经济、颠覆性技术或高热度社会争议的深度分析
4. **其他分类**：财经、科技、政治（非加拿大）、文化娱乐、体育`;

const DEFAULT_CITIES = `Ontario: Toronto, Mississauga, Brampton, Markham, Richmond Hill, Vaughan, Oakville, Burlington, Hamilton, Ottawa, Guelph, Waterloo, London, Kitchener, Cambridge
BC: Vancouver, Richmond, Burnaby, Surrey, Coquitlam, Victoria, Kelowna
Quebec: Montreal, Quebec City, Laval, Gatineau
Alberta: Calgary, Edmonton
Others: Winnipeg, Halifax, Saskatoon, Regina`;

// 动态生成分类提示词
function buildClassificationPrompt(config: Record<string, string>): string {
    const categories = config['classification_categories'] || DEFAULT_CATEGORIES;
    const rules = config['classification_rules'] || DEFAULT_RULES;
    const cities = config['canadian_cities'] || DEFAULT_CITIES;

    const categoryList = categories.split('\n').filter(c => c.trim()).join('、');

    return `你是一个新闻分类专家，专门服务于加拿大华人社区。请根据以下新闻内容进行分类。

**最高优先级：识别本地新闻（Local News）**

在分类前，请先仔细检查新闻内容，寻找以下加拿大地名的任意提及。**注意：无论内容是中文还是英文，识别到的地点必须统一使用标准的英文名称。**

**加拿大主要城市 (Major Cities)**:
${cities}

**分类规则（按优先级排序）**：

${rules}

**识别技巧**：
- "GTA" = Greater Toronto Area → #Toronto
- "大多伦多" → #Toronto
- "贵湖" / "圭尔夫" → #Guelph
- "大温" / "温哥华地区" → #Vancouver
- 提到加拿大移民政策且发生在加拿大境内 → 本地

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
- category 必须是：${categoryList} 之一。`;
}


interface NewsItem {
    id: string;
    title: string;
    content?: string;
    ai_summary?: string;
    ai_commentary?: string;
}

async function classifyNews(newsItem: NewsItem, config: Record<string, string>) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // 使用数据库配置动态生成提示词
        const classificationPrompt = buildClassificationPrompt(config);
        const prompt = classificationPrompt
            .replace('{title}', newsItem.title || '')
            .replace('{summary}', newsItem.ai_summary || newsItem.content?.substring(0, 500) || '')
            .replace('{commentary}', newsItem.ai_commentary || '');

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const parsed = JSON.parse(jsonMatch[0]);
        const categoryMap = getCategoryMap(config['classification_categories'] || DEFAULT_CATEGORIES);
        const categoryName = categoryMap[parsed.category] || parsed.category;

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
        // 获取分类配置
        const config = await getClassificationConfig();
        const supabase = getSupabase();

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
        categories?.forEach((cat: { id: string; name: string }) => {
            categoryIdMap[cat.name] = cat.id;
        });

        let successCount = 0;
        let failCount = 0;

        // 逐条分类
        for (const news of uncategorizedNews) {
            const classification = await classifyNews(news, config);

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
