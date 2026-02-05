/**
 * 并发控制工具
 * 用于限制并发数量，避免 API 限流
 */

export interface ConcurrencyConfig {
  maxConcurrent: number;  // 最大并发数
  delayBetweenBatches?: number; // 批次之间的延迟（ms）
}

/**
 * 并发执行任务，带并发数量控制
 */
export async function executeConcurrently<T, R>(
  items: T[],
  executor: (item: T, index: number) => Promise<R>,
  config: ConcurrencyConfig
): Promise<R[]> {
  const results: R[] = [];
  const { maxConcurrent, delayBetweenBatches = 0 } = config;

  // 分批处理
  for (let i = 0; i < items.length; i += maxConcurrent) {
    const batch = items.slice(i, i + maxConcurrent);

    console.log(`[Concurrency] Processing batch ${Math.floor(i / maxConcurrent) + 1}, items ${i + 1}-${Math.min(i + maxConcurrent, items.length)} of ${items.length}`);

    // 并发执行当前批次
    const batchResults = await Promise.all(
      batch.map((item, batchIndex) => executor(item, i + batchIndex))
    );

    results.push(...batchResults);

    // 批次之间的延迟
    if (delayBetweenBatches > 0 && i + maxConcurrent < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}

/**
 * 带重试的并发执行
 */
export async function executeConcurrentlyWithRetry<T, R>(
  items: T[],
  executor: (item: T, index: number) => Promise<R>,
  config: ConcurrencyConfig & { maxRetries?: number; retryDelay?: number }
): Promise<Array<{ success: boolean; result?: R; error?: Error; item: T }>> {
  const { maxRetries = 2, retryDelay = 1000, ...concurrencyConfig } = config;

  const executorWithRetry = async (item: T, index: number) => {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await executor(item, index);
        return { success: true, result, item };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    return { success: false, error: lastError, item };
  };

  return executeConcurrently(items, executorWithRetry, concurrencyConfig);
}

/**
 * 计算推荐的并发数
 */
export function calculateOptimalConcurrency(provider: 'claude' | 'gemini'): number {
  // Gemini 的 RPM (Requests Per Minute) 限制
  // 免费版: 15 RPM
  // 付费版: 1000 RPM

  // Claude 的 RPM 限制
  // Tier 1: 50 RPM
  // Tier 2: 1000 RPM

  if (provider === 'gemini') {
    // 保守估计，使用免费版限制的 80%
    return 10; // 15 RPM * 0.8 / 60 * 60 ≈ 12，取 10
  } else {
    // Claude Tier 1
    return 5; // 50 RPM / 60 * 60 ≈ 50/分钟，为保险起见取 5 并发
  }
}
