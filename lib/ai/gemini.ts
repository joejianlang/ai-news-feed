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

  const summaryReq = dbConfig['summary_requirements'] || '80-150字，以叙述性的语言概括核心新闻内容（需包含时间、地点、人物、起因、经过、结果等要素，但禁止出现"【时间】"、"[地点]"等此类显式的标注词），全部使用中文简体。';
  const commentaryReq = dbConfig['commentary_requirements'] || '幽默犀利，有深度有趣味，全部使用中文简体，不要出现任何英文词汇或缩写';

  const prompt = `分析新闻并输出以下部分（全部使用中文简体，禁止出现任何英文）：

标题：${title}
内容：${truncatedContent}

**首先判断**：这是否是以下类型的"服务类/概括性内容"？
${filterRules}

**如果是上述类型**，只需输出：
【跳过】是
【原因】（简短说明原因，如：直播安排、广告等）

**如果是真正的新闻报道**，输出：
【跳过】否
【翻译标题】${title.match(/[a-zA-Z]/) ? '（翻译成中文简体）' : '（保持原样）'}
【摘要】（${summaryReq}）
【评论】（${commentaryStyle}风格，${lengthRequirement}，${commentaryReq}）`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
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

    const skipMatch = response.match(/【跳过】\s*(是|否)/);
    const reasonMatch = response.match(/【原因】\s*([\s\S]*?)(?=\n|【|$)/);

    if (skipMatch && skipMatch[1] === '是') {
      return {
        summary: '',
        commentary: '',
        shouldSkip: true,
        skipReason: reasonMatch ? reasonMatch[1].trim() : '服务类内容',
      };
    }

    const titleMatch = response.match(/【翻译标题】\s*([\s\S]*?)\s*【摘要】/);
    const summaryMatch = response.match(/【摘要】\s*([\s\S]*?)\s*【评论】/);
    const commentaryMatch = response.match(/【评论】\s*([\s\S]*)/);

    return {
      summary: summaryMatch ? summaryMatch[1].trim() : response.slice(0, 200),
      commentary: commentaryMatch ? commentaryMatch[1].trim() : '暂无评论',
      translatedTitle: titleMatch ? titleMatch[1].trim() : undefined,
      shouldSkip: false,
    };
  } catch (error) {
    console.error('Gemini analysis failed:', error);
    throw error;
  }
}
