import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export interface AnalysisResult {
  summary: string;
  commentary: string;
  translatedTitle?: string;
}

// 根据内容类型获取评论字数要求
function getCommentaryLength(contentType: string, isDeepDive: boolean): string {
  if (isDeepDive) {
    return '800-1000字，请分为三个部分：【背景】历史与来龙去脉、【分析】核心观点与深层解读、【影响】未来趋势与建议';
  }
  if (contentType === 'video') {
    return '150-250字，简洁精炼';
  }
  // 默认文章类型
  return '300-500字';
}

export async function analyzeContentWithGemini(
  content: string,
  title: string,
  commentaryStyle: string,
  contentType: string = 'article',
  isDeepDive: boolean = false
): Promise<AnalysisResult> {
  // 动态初始化 Gemini，确保环境变量已加载
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  // 限制内容长度
  const truncatedContent = content.length > 3000 ? content.substring(0, 3000) + '...' : content;

  // 获取字数要求
  const lengthRequirement = getCommentaryLength(contentType, isDeepDive);

  // 简洁的 Prompt
  const prompt = `分析新闻并输出三部分：

标题：${title}
内容：${truncatedContent}

输出格式：
【翻译标题】${title.match(/[a-zA-Z]/) ? '（翻译成中文）' : '（保持原样）'}
【摘要】（80-150字，概括核心内容、关键要素、影响）
【评论】（${commentaryStyle}风格，${lengthRequirement}，幽默犀利，有深度有趣味）`;

  try {
    // 使用 Gemini 2.5 Flash（最新免费模型，速度快成本低）
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 8000, // 增加限制以容纳思考链token
        temperature: 0.7,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    const startTime = Date.now();
    const result = await model.generateContent(prompt);
    const duration = Date.now() - startTime;

    const response = result.response.text();

    // 估算成本（Gemini Flash-8B 定价）
    const estimatedInputTokens = Math.ceil(prompt.length / 4);
    const estimatedOutputTokens = Math.ceil(response.length / 4);
    const cost = (estimatedInputTokens / 1_000_000) * 0.0375 +
      (estimatedOutputTokens / 1_000_000) * 0.15;

    console.log(`[Gemini] Model: gemini-2.5-flash`);
    console.log(`[Gemini] Content Type: ${contentType}, Deep Dive: ${isDeepDive}`);
    console.log(`[Gemini] Duration: ${duration}ms`);
    console.log(`[Gemini] Estimated tokens - Input: ${estimatedInputTokens}, Output: ${estimatedOutputTokens}`);
    console.log(`[Gemini] Estimated cost: $${cost.toFixed(7)}`);

    // 解析响应
    const titleMatch = response.match(/【翻译标题】\s*([\s\S]*?)\s*【摘要】/);
    const summaryMatch = response.match(/【摘要】\s*([\s\S]*?)\s*【评论】/);
    const commentaryMatch = response.match(/【评论】\s*([\s\S]*)/);

    return {
      summary: summaryMatch ? summaryMatch[1].trim() : response.slice(0, 200),
      commentary: commentaryMatch ? commentaryMatch[1].trim() : '暂无评论',
      translatedTitle: titleMatch ? titleMatch[1].trim() : undefined,
    };
  } catch (error) {
    console.error('Gemini analysis failed:', error);
    throw error;
  }
}

