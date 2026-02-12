import Anthropic from '@anthropic-ai/sdk';
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
  // 检查缓存
  if (configCache && Date.now() - configCacheTime < CONFIG_CACHE_TTL) {
    return configCache;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('ai_config')
      .select('config_key, config_value');

    if (error) {
      console.error('Error fetching AI config from DB:', error);
      return {}; // 返回空对象，使用硬编码默认值
    }

    const config: Record<string, string> = {};
    for (const item of data || []) {
      config[item.config_key] = item.config_value;
    }

    // 更新缓存
    configCache = config;
    configCacheTime = Date.now();
    console.log('[AI] Loaded config from database');

    return config;
  } catch (error) {
    console.error('Error fetching AI config:', error);
    return {};
  }
}

// 调试：检查 API Key
console.log('Anthropic API Key exists:', !!process.env.ANTHROPIC_API_KEY);
console.log('API Key length:', process.env.ANTHROPIC_API_KEY?.length);
console.log('API Key preview:', process.env.ANTHROPIC_API_KEY?.substring(0, 20) + '...');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AnalysisResult {
  summary: string;
  commentary: string;
  translatedTitle?: string;
  shouldSkip?: boolean;
  skipReason?: string;
  category?: string;
  tags?: string[];
  location?: string | null;
  isError?: boolean;
}

// 根据内容类型获取评论字数要求（使用数据库配置）
async function getCommentaryLength(contentType: string, isDeepDive: boolean, dbConfig: Record<string, string>): Promise<string> {
  if (isDeepDive) {
    return dbConfig['commentary_length_deep_dive'] || '800-1000字，请分为三个部分：【背景】历史与来龙去脉、【分析】核心观点与深层解读、【影响】未来趋势与建议';
  }
  if (contentType === 'video') {
    return dbConfig['commentary_length_video'] || '150-250字，简洁精炼';
  }
  // 默认文章类型
  return dbConfig['commentary_length_article'] || '300-500字';
}

export async function analyzeContent(
  content: string,
  title: string,
  commentaryStyle: string,
  contentType: string = 'article',
  isDeepDive: boolean = false
): Promise<AnalysisResult> {
  // 如果 AI 被禁用，返回基础信息
  if (!CURRENT_AI_CONFIG.enableAI) {
    return {
      summary: '（AI 分析已禁用）' + content.substring(0, 100),
      commentary: '（AI 评论已禁用）',
      translatedTitle: title,
    };
  }

  // 从数据库获取配置
  const dbConfig = await getAIConfigFromDB();

  // 限制内容长度以减少 token 消耗
  const maxLen = CURRENT_AI_CONFIG.maxContentLength;
  const truncatedContent = content.length > maxLen ? content.substring(0, maxLen) + '...' : content;

  // 获取字数要求
  const lengthRequirement = await getCommentaryLength(contentType, isDeepDive, dbConfig);

  // 获取过滤规则（从数据库或使用默认值）
  const filterRules = dbConfig['filter_rules'] || `日程安排/节目表（如电视播放时间、直播安排）
活动预告/观赛指南/购票指南
周期性总结（如"本周回顾"、"今日要闻"、"每日简报"等汇总帖）
纯粹的广告或促销内容
天气预报、体育比分列表等纯信息罗列
频道介绍/平台介绍（如“关于我们”、“联系我们”、“官网介绍”等）
社交媒体二维码引导/关注引导/点赞订阅提醒
标题与内容均为宽泛的媒体品牌口号或介绍声明，无具体新闻事实的内容`;

  // 获取摘要要求
  const summaryReq = dbConfig['summary_requirements'] || '80-150字，概括核心内容、关键要素、影响，全部中文';

  // 获取评论要求
  const commentaryReq = dbConfig['commentary_requirements'] || '幽默犀利，有深度有趣味，全部使用中文简体，不要出现任何英文词汇或缩写';

  // 将过滤规则格式化为列表
  const filterRulesList = filterRules.split('\n').filter(r => r.trim()).map(r => `- ${r.trim()}`).join('\n');

  // 逻辑：如果 commentaryStyle 为空，则摘要和评论都不生成
  // 逻辑：如果是视频，即使有 commentaryStyle，也只生成摘要，不生成评论
  const skipAllAI = !commentaryStyle || commentaryStyle.trim() === '';
  const skipCommentaryOnly = contentType === 'video' || skipAllAI;
  const skipSummary = skipAllAI;

  // 获取分类和地点参考
  const categoriesList = dbConfig['classification_categories'] || '本地、热点、政治、科技、财经、文化娱乐、体育、深度';
  const citiesList = dbConfig['canadian_cities'] || 'Toronto, Vancouver, Montreal, Calgary, Edmonton, Ottawa, Winnipeg, Quebec City, Hamilton, Kitchener';

  // 动态生成 Prompt
  const prompt = `分析新闻并输出以下部分（全部使用中文简体，禁止出现任何英文）：
  
  **核心语言要求（强制执行）**：
  - 除了指定的"地名和人名需保持原文"外，所有生成的内容（摘要、评论、总结、分类名称）必须全部使用【中文简体】。
  - 严禁在摘要或评论中使用任何英文单词（除非是专有名词原文）、英文缩写或英文标点符号。
  - 内容摘要、专业评论 绝不能用英语，必须用中文简体。
  - 确保句子结构符合中文表达习惯，不要出现英文式的生硬翻译。

标题：${title}
内容：${truncatedContent}

**首先判断**：这是否是以下类型的"服务类/概括性内容"？
${filterRulesList}

**如果是上述类型**，只需输出：
【跳过】是

**如果是真正的新闻报道**，输出：
【跳过】否
【翻译标题】${title.match(/[a-zA-Z]/) ? '（翻译成中文简体）' : '（保持原样）'}
${skipSummary ? '【摘要】（跳过此项，请返回空字符串）' : `【摘要】（${summaryReq}）`}
${skipCommentaryOnly ? '【评论】（跳过此项，请返回空字符串）' : `【评论】（${commentaryStyle}风格，${lengthRequirement}，${commentaryReq}）`}
【分类】（必须从以下列表中选择一个：${categoriesList}。如果是加拿大本地新闻，必须选"本地"）
【标签】（生成 2-4 个以 # 开头的标签）
【地点】（识别到的加拿大英文城市名，属于此列表：${citiesList}。如无则返回 null）`;


  try {
    // 使用配置中的模型和参数
    const message = await anthropic.messages.create({
      model: CURRENT_AI_CONFIG.model,
      max_tokens: CURRENT_AI_CONFIG.maxOutputTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const response = message.content[0].type === 'text' ? message.content[0].text : '';

    // 计算并记录成本
    const cost = estimateCost(
      CURRENT_AI_CONFIG,
      message.usage.input_tokens,
      message.usage.output_tokens
    );
    console.log(`[AI] Model: ${CURRENT_AI_CONFIG.model} `);
    console.log(`[AI] Content Type: ${contentType}, Deep Dive: ${isDeepDive} `);
    console.log(`[AI] Tokens - Input: ${message.usage.input_tokens}, Output: ${message.usage.output_tokens} `);
    console.log(`[AI] Estimated cost: $${cost.toFixed(6)} `);

    // 解析响应 - 首先检查是否应该跳过
    const skipMatch = response.match(/【跳过】\s*(是|否)/);
    if (skipMatch && skipMatch[1] === '是') {
      console.log(`[AI] Content marked as service-type, skipping: ${title}`);
      return {
        summary: '',
        commentary: '',
        shouldSkip: true,
      };
    }

    const titleMatch = response.match(/【翻译标题】\s*([\s\S]*?)\s*【摘要】/);
    const summaryMatch = response.match(/【摘要】\s*([\s\S]*?)\s*【评论】/);
    const commentaryMatch = response.match(/【评论】\s*([\s\S]*?)\s*【分类】/);
    const categoryMatch = response.match(/【分类】\s*([\s\S]*?)\s*【标签】/);
    const tagsMatch = response.match(/【标签】\s*([\s\S]*?)\s*【地点】/);
    const locationMatch = response.match(/【地点】\s*([\s\S]*)/);

    const summary = summaryMatch ? summaryMatch[1].trim() : '';
    const commentary = commentaryMatch ? commentaryMatch[1].trim() : '';
    const category = categoryMatch ? categoryMatch[1].trim() : '热点';
    const tagsStr = tagsMatch ? tagsMatch[1].trim() : '';
    const tags = tagsStr.split(/[,\s，、]+/).filter(t => t.startsWith('#')).slice(0, 4);
    const locationRaw = locationMatch ? locationMatch[1].trim() : 'null';
    const location = (locationRaw.toLowerCase() === 'null' || locationRaw === '无') ? null : locationRaw;

    return {
      summary: (skipSummary || summary.includes('跳过')) ? '' : summary,
      commentary: (skipCommentaryOnly || commentary.includes('跳过')) ? '' : commentary,
      translatedTitle: titleMatch ? titleMatch[1].trim() : undefined,
      shouldSkip: false,
      category,
      tags,
      location
    };

  } catch (error) {
    console.error('AI analysis failed:', error);
    throw error;
  }
}

