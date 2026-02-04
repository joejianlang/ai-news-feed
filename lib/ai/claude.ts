import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

// 手动读取 .env.local 文件
function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  console.log('Loading env from:', envPath);

  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      // 跳过注释和空行
      if (!trimmed || trimmed.startsWith('#')) continue;

      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  } catch (error) {
    console.error('Failed to load .env.local:', error);
  }
}

// 加载环境变量
loadEnvFile();

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
}

export async function analyzeContent(
  content: string,
  title: string,
  commentaryStyle: string
): Promise<AnalysisResult> {
  const prompt = `请分析以下新闻内容，并提供三部分输出：

标题：${title}

内容：
${content}

请按以下格式输出：

【翻译标题】
（如果标题是英文，请翻译成中文；如果标题已经是中文，请保持原样输出原标题）

【摘要】
（用2-3句话概括文章的核心内容）

【评论】
（用"${commentaryStyle}"风格对这篇文章进行评论，评论应该有见地、有态度）

注意：
- 标题翻译要准确、自然
- 摘要要客观、简洁
- 评论要符合指定的风格特点
- 评论长度控制在100-200字`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const response = message.content[0].type === 'text' ? message.content[0].text : '';

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
    console.error('AI analysis failed:', error);
    throw error;
  }
}
