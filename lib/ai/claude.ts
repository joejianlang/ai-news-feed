import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { CURRENT_AI_CONFIG, estimateCost } from './config';

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
  // 如果 AI 被禁用，返回基础信息
  if (!CURRENT_AI_CONFIG.enableAI) {
    return {
      summary: '（AI 分析已禁用）' + content.substring(0, 100),
      commentary: '（AI 评论已禁用）',
      translatedTitle: title,
    };
  }

  // 限制内容长度以减少 token 消耗
  const maxLen = CURRENT_AI_CONFIG.maxContentLength;
  const truncatedContent = content.length > maxLen ? content.substring(0, maxLen) + '...' : content;

  // 优化后的简洁 Prompt
  const prompt = `分析新闻并输出三部分：

标题：${title}
内容：${truncatedContent}

输出格式：
【翻译标题】${title.match(/[a-zA-Z]/) ? '（翻译成中文）' : '（保持原样）'}
【摘要】（80-150字，概括核心内容、关键要素、影响）
【评论】（${commentaryStyle}风格，300-500字，幽默犀利，有深度有趣味）`;


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
    console.log(`[AI] Model: ${CURRENT_AI_CONFIG.model}`);
    console.log(`[AI] Tokens - Input: ${message.usage.input_tokens}, Output: ${message.usage.output_tokens}`);
    console.log(`[AI] Estimated cost: $${cost.toFixed(6)}`);

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
