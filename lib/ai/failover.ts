/**
 * AI 故障转移系统
 * 当主 AI 失败时自动切换到备用 AI，并发送告警
 */

import { analyzeContent as analyzeWithClaude } from './claude';
import { analyzeContentWithGemini } from './gemini';
import { CURRENT_AI_CONFIG } from './config';
import type { AnalysisResult } from './claude';

// 故障计数器
const failureCount: Record<string, number> = {
  gemini: 0,
  claude: 0,
};

// 最大失败次数（超过后发送告警）
const MAX_FAILURES = 3;

// 告警历史（防止重复告警）
const alertHistory: Record<string, number> = {};
const ALERT_COOLDOWN = 30 * 60 * 1000; // 30分钟冷却时间

/**
 * 发送告警
 */
async function sendAlert(provider: string, error: Error) {
  const now = Date.now();
  const lastAlert = alertHistory[provider] || 0;

  // 冷却时间内不重复告警
  if (now - lastAlert < ALERT_COOLDOWN) {
    return;
  }

  alertHistory[provider] = now;

  // 记录到控制台（生产环境可以发送到钉钉/邮件/Slack等）
  console.error('⚠️⚠️⚠️ AI 服务告警 ⚠️⚠️⚠️');
  console.error(`提供商: ${provider.toUpperCase()}`);
  console.error(`错误信息: ${error.message}`);
  console.error(`失败次数: ${failureCount[provider]}/${MAX_FAILURES}`);
  console.error(`时间: ${new Date().toISOString()}`);
  console.error('建议: 请检查 API 密钥和配额限制');
  console.error('='.repeat(60));

  // TODO: 生产环境添加实际的告警渠道
  // 例如：
  // - 发送邮件
  // - 发送钉钉/企业微信通知
  // - 发送 Slack 消息
  // - 写入告警日志文件
  // await sendDingTalkAlert({ provider, error, failureCount: failureCount[provider] });
}

/**
 * 带故障转移的 AI 分析
 */
export async function analyzeContentWithFailover(
  content: string,
  title: string,
  commentaryStyle: string,
  contentType: string = 'article',
  isDeepDive: boolean = false,
  publishedAt?: string
): Promise<AnalysisResult> {
  const primaryProvider = CURRENT_AI_CONFIG.provider;
  const backupProvider = primaryProvider === 'gemini' ? 'claude' : 'gemini';

  // 转换日期以便 AI 更好理解
  const newsDate = publishedAt ? new Date(publishedAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

  // 尝试主 AI
  try {
    console.log(`[Failover] 使用主 AI: ${primaryProvider}`);

    let result: AnalysisResult;
    if (primaryProvider === 'gemini') {
      result = await analyzeContentWithGemini(content, title, commentaryStyle, contentType, isDeepDive, newsDate);
    } else {
      result = await analyzeWithClaude(content, title, commentaryStyle, contentType, isDeepDive, newsDate);
    }

    // 成功，重置失败计数
    if (failureCount[primaryProvider] > 0) {
      console.log(`[Failover] ${primaryProvider} 恢复正常，重置失败计数`);
      failureCount[primaryProvider] = 0;
    }

    return result;

  } catch (primaryError) {
    // 主 AI 失败
    failureCount[primaryProvider]++;
    console.error(`[Failover] ❌ ${primaryProvider} 失败 (${failureCount[primaryProvider]}/${MAX_FAILURES})`);
    console.error(`[Failover] 错误: ${primaryError instanceof Error ? primaryError.message : String(primaryError)}`);

    // 超过阈值，发送告警
    if (failureCount[primaryProvider] >= MAX_FAILURES) {
      await sendAlert(primaryProvider, primaryError instanceof Error ? primaryError : new Error(String(primaryError)));
    }

    // 尝试备用 AI
    try {
      console.log(`[Failover] 🔄 切换到备用 AI: ${backupProvider}`);

      let result: AnalysisResult;
      if (backupProvider === 'gemini') {
        result = await analyzeContentWithGemini(content, title, commentaryStyle, contentType, isDeepDive, newsDate);
      } else {
        result = await analyzeWithClaude(content, title, commentaryStyle, contentType, isDeepDive, newsDate);
      }

      console.log(`[Failover] ✅ ${backupProvider} 成功`);

      // 备用 AI 成功，重置其失败计数
      if (failureCount[backupProvider] > 0) {
        failureCount[backupProvider] = 0;
      }

      return result;

    } catch (backupError) {
      // 备用 AI 也失败
      failureCount[backupProvider]++;
      console.error(`[Failover] ❌ ${backupProvider} 也失败了 (${failureCount[backupProvider]}/${MAX_FAILURES})`);
      console.error(`[Failover] 错误: ${backupError instanceof Error ? backupError.message : String(backupError)}`);

      // 超过阈值，发送告警
      if (failureCount[backupProvider] >= MAX_FAILURES) {
        await sendAlert(backupProvider, backupError instanceof Error ? backupError : new Error(String(backupError)));
      }

      // 两个 AI 都失败，返回降级响应
      console.error('[Failover] ⚠️ 所有 AI 服务都失败，返回降级响应');
      return {
        summary: `（AI 服务暂时不可用）${content.substring(0, 150)}...`,
        commentary: '（AI 评论服务暂时不可用，请稍后重试）',
        translatedTitle: title,
        category: '热点',
        tags: ['#无服务'],
        location: null,
        isError: true
      };
    }
  }
}

/**
 * 获取当前故障状态
 */
export function getFailoverStatus() {
  return {
    gemini: {
      failures: failureCount.gemini,
      status: failureCount.gemini >= MAX_FAILURES ? 'unhealthy' : 'healthy',
    },
    claude: {
      failures: failureCount.claude,
      status: failureCount.claude >= MAX_FAILURES ? 'unhealthy' : 'healthy',
    },
  };
}

/**
 * 手动重置故障计数
 */
export function resetFailoverStatus(provider?: 'gemini' | 'claude') {
  if (provider) {
    failureCount[provider] = 0;
    console.log(`[Failover] 已重置 ${provider} 的故障计数`);
  } else {
    failureCount.gemini = 0;
    failureCount.claude = 0;
    console.log('[Failover] 已重置所有 AI 的故障计数');
  }
}
