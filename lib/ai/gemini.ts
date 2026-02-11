import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { CURRENT_AI_CONFIG, estimateCost } from './config';

// 创建 Supabase 客户端用于读取配置
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// 缓存配置，避免每次都查询数据库
let configCache: Record<string, string> | null = null;
let configCacheTime: number = 0;
const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 分钟缓存

// 从数据库获取 AI 配置
async function getAIConfigFromDB(): Promise<Record<string, string>> {
  if (configCache && Date.now() - configCacheTime < CONFIG_CACHE_TTL) {
    return configCache;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('ai_config')
      .select('config_key, config_value');

    if (error) {
      console.error('Error fetching AI config from DB:', error);
      return {};
    }

    const config: Record<string, string> = {};
    for (const item of data || []) {
      config[item.config_key] = item.config_value;
    }

    configCache = config;
    configCacheTime = Date.now();
    return config;
  } catch (error) {
    console.error('Error fetching AI config:', error);
    return {};
  }
}

export interface AnalysisResult {
  summary: string;
  commentary: string;
  translatedTitle?: string;
  shouldSkip?: boolean;
  skipReason?: string;
  category?: string;
  tags?: string[];
  location?: string | null;
}

// 根据内容类型获取评论字数要求
async function getCommentaryLength(contentType: string, isDeepDive: boolean, dbConfig: Record<string, string>): Promise<string> {
  if (isDeepDive) {
    return dbConfig['commentary_length_deep_dive'] || '800-1000字，请分为三个部分：【背景】历史与来龙去脉、【分析】核心观点与深层解读、【影响】未来趋势与建议';
  }
  if (contentType === 'video') {
    return dbConfig['commentary_length_video'] || '150-250字，简洁精炼';
  }
  return dbConfig['commentary_length_article'] || '300-500字';
}

const DEFAULT_CATEGORIES = `本地、热点、政治、科技、财经、文化娱乐、体育、深度`;
const DEFAULT_CITIES = `Ontario: Toronto, Mississauga, Brampton, Markham, Richmond Hill, Vaughan, Oakville, Burlington, Hamilton, Ottawa, Guelph, Waterloo, London, Kitchener, Cambridge
BC: Vancouver, Richmond, Burnaby, Surrey, Coquitlam, Victoria, Kelowna
Quebec: Montreal, Quebec City, Laval, Gatineau
Alberta: Calgary, Edmonton
Others: Winnipeg, Halifax, Saskatoon, Regina`;

export async function analyzeContentWithGemini(
  content: string,
  title: string,
  commentaryStyle: string,
  contentType: string = 'article',
  isDeepDive: boolean = false
): Promise<AnalysisResult> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

  const dbConfig = await getAIConfigFromDB();
  const maxLen = CURRENT_AI_CONFIG.maxContentLength;
  const truncatedContent = content.length > maxLen ? content.substring(0, maxLen) + '...' : content;

  const lengthRequirement = await getCommentaryLength(contentType, isDeepDive, dbConfig);

  const filterRules = dbConfig['filter_rules'] || `日程安排/节目表（如电视播放时间、直播安排）
活动预告/观赛指南/购票指南
周期性总结（如"本周回顾"、"今日要闻"、"每日简报"等汇总帖）
纯粹的广告或促销内容
天气预报、体育比分列表等纯信息罗列`;

  const categories = dbConfig['classification_categories'] || DEFAULT_CATEGORIES;
  const cities = dbConfig['canadian_cities'] || DEFAULT_CITIES;

  const summaryReq = dbConfig['summary_requirements'] || '80-150字，以叙述性的语言概括核心新闻内容（需包含时间、地点、人物、起因、经过、结果等要素，但禁止出现"【时间】"、"[地点]"等此类显式的标注词），全部使用中文简体。';
  const commentaryReq = dbConfig['commentary_requirements'] || '幽默犀利，有深度有趣味，全部使用中文简体，不要出现任何英文词汇或缩写';

  // 逻辑：如果 commentaryStyle 为空，则摘要和评论都不生成
  // 逻辑：如果是视频，即使有 commentaryStyle，也只生成摘要，不生成评论
  const skipAllAI = !commentaryStyle || commentaryStyle.trim() === '';
  const skipCommentaryOnly = contentType === 'video' || skipAllAI;
  const skipSummary = skipAllAI;

  const prompt = `你是一个多功能新闻专家，负责翻译、总结、评论和分类新闻。

分析以下新闻：
标题：${title}
内容：${truncatedContent}

**任务 1: 过滤判断**
判断这是否是以下类型的"服务类/概括性内容"？
${filterRules}

**任务 2: 翻译与内容生成**
如果不是过滤内容，请生成：
1. 建议的中文标题
${skipSummary ? '2. 【跳过任务】摘要（请在JSON中保持summary为空字符串）' : `2. 摘要（${summaryReq}）`}
${skipCommentaryOnly ? '3. 【跳过任务】评论（请在JSON中保持commentary为空字符串）' : `3. 评论（${commentaryStyle}风格，${lengthRequirement}，${commentaryReq}）`}

**任务 3: 分类与地理识别**
1. 分类：必须从以下列表中选择一个最合适的：${categories}
   - 特别注意：如果提到加拿大城市、省份或特有事物，分类必须为"本地"。
2. 标签：生成 2-4 个以 # 开头的标签。
   - 如果分类是"本地"，必须包含英文城市名标签（如 #Toronto）。
3. 地点：识别到的加拿大英文城市名（属于此列表：${cities}），如无则返回 null。

**强制要求**：
- 请严格按照以下 JSON 格式返回，不要包含任何说明文字：
{
  "shouldSkip": true/false,
  "skipReason": "原因",
  "translatedTitle": "中文标题",
  "summary": "${skipSummary ? '' : '摘要内容'}",
  "commentary": "${skipCommentaryOnly ? '' : '评论内容'}",
  "category": "分类名称",
  "tags": ["#标签1", "#标签2"],
  "location": "English City Name or null"
}

注意：如果 shouldSkip 为 true，则其他字段可以为空。`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        maxOutputTokens: 2500,
        temperature: 0.7,
        responseMimeType: "application/json"
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const parsed = JSON.parse(response);

    if (parsed.shouldSkip) {
      return {
        summary: '',
        commentary: '',
        shouldSkip: true,
        skipReason: parsed.skipReason || '服务类内容',
      };
    }

    return {
      summary: parsed.summary || '',
      commentary: parsed.commentary || '',
      translatedTitle: parsed.translatedTitle,
      shouldSkip: false,
      category: parsed.category,
      tags: parsed.tags,
      location: parsed.location
    };
  } catch (error) {
    console.error('Gemini analysis failed:', error);
    throw error;
  }
}
