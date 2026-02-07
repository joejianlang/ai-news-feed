/**
 * 统一的 AI 分析接口
 * 支持自动故障转移和告警
 */

import { CURRENT_AI_CONFIG } from './config';
import { analyzeContentWithFailover, getFailoverStatus, resetFailoverStatus } from './failover';
import type { AnalysisResult } from './claude';

export type { AnalysisResult };

// 导出故障转移管理函数
export { getFailoverStatus, resetFailoverStatus };

export async function analyzeContent(
  content: string,
  title: string,
  commentaryStyle: string,
  contentType: string = 'article',
  isDeepDive: boolean = false
): Promise<AnalysisResult> {
  // 如果 AI 被禁用
  if (!CURRENT_AI_CONFIG.enableAI) {
    return {
      summary: '（AI 分析已禁用）' + content.substring(0, 100),
      commentary: '（AI 评论已禁用）',
      translatedTitle: title,
    };
  }

  // 使用带故障转移的 AI 分析
  return analyzeContentWithFailover(content, title, commentaryStyle, contentType, isDeepDive);
}

