// AI 配置文件 - 用于成本控制和性能优化

export type AIProvider = 'claude' | 'gemini';
export type ClaudeModel = 'claude-haiku-4-20250514' | 'claude-sonnet-4-5-20250929' | 'claude-3-5-sonnet-20241022';
export type GeminiModel = 'gemini-1.5-flash-8b' | 'gemini-1.5-flash' | 'gemini-1.5-pro';

export interface AIConfig {
  // 提供商和模型
  provider: AIProvider;
  model: ClaudeModel | GeminiModel;

  // Token 限制
  maxInputTokens: number;  // 输入内容最大长度
  maxOutputTokens: number; // 输出结果最大长度

  // 内容截断
  maxContentLength: number; // 新闻内容最大字符数

  // 成本控制
  enableAI: boolean;        // 是否启用 AI 分析（可关闭以完全节省成本）
  skipExistingAnalysis: boolean; // 跳过已分析的内容
}

// 预设配置
export const AI_CONFIGS = {
  // Gemini 超省钱模式 - 最便宜！（约 $0.000079/条）⭐️ 新增
  'gemini-ultra-cheap': {
    provider: 'gemini' as const,
    model: 'gemini-1.5-flash-8b' as const,
    maxInputTokens: 2000,
    maxOutputTokens: 1500,
    maxContentLength: 3000,
    enableAI: true,
    skipExistingAnalysis: true,
  },

  // Gemini 标准模式 - 超值（约 $0.000158/条）
  'gemini-standard': {
    provider: 'gemini' as const,
    model: 'gemini-1.5-flash' as const,
    maxInputTokens: 2000,
    maxOutputTokens: 1500,
    maxContentLength: 3000,
    enableAI: true,
    skipExistingAnalysis: true,
  },

  // Gemini 高质量模式（约 $0.00263/条）
  'gemini-premium': {
    provider: 'gemini' as const,
    model: 'gemini-1.5-pro' as const,
    maxInputTokens: 4000,
    maxOutputTokens: 2048,
    maxContentLength: 5000,
    enableAI: true,
    skipExistingAnalysis: true,
  },

  // Claude 高质量模式 - 最贵（约 $0.011/条）
  premium: {
    provider: 'claude' as const,
    model: 'claude-sonnet-4-5-20250929' as const,
    maxInputTokens: 4000,
    maxOutputTokens: 2048,
    maxContentLength: 5000,
    enableAI: true,
    skipExistingAnalysis: true,
  },

  // Claude 标准模式 - 推荐（约 $0.001/条，节省 90%）
  standard: {
    provider: 'claude' as const,
    model: 'claude-haiku-4-20250514' as const,
    maxInputTokens: 2000,
    maxOutputTokens: 1500,
    maxContentLength: 3000,
    enableAI: true,
    skipExistingAnalysis: true,
  },

  // Claude 经济模式 - 最省（约 $0.0005/条，节省 95%）
  economy: {
    provider: 'claude' as const,
    model: 'claude-haiku-4-20250514' as const,
    maxInputTokens: 1000,
    maxOutputTokens: 800,
    maxContentLength: 1500,
    enableAI: true,
    skipExistingAnalysis: true,
  },

  // 无 AI 模式 - 免费（节省 100%）
  disabled: {
    provider: 'claude' as const,
    model: 'claude-haiku-4-20250514' as const,
    maxInputTokens: 0,
    maxOutputTokens: 0,
    maxContentLength: 0,
    enableAI: false,
    skipExistingAnalysis: true,
  },
};

// 当前使用的配置（可通过环境变量切换）
export const CURRENT_AI_CONFIG: AIConfig =
  AI_CONFIGS[process.env.AI_MODE as keyof typeof AI_CONFIGS] || AI_CONFIGS.standard;

// 成本计算（基于 Claude API 定价）
export const MODEL_PRICING = {
  'claude-haiku-4-20250514': {
    input: 0.25,   // $ per 1M tokens
    output: 1.25,  // $ per 1M tokens
  },
  'claude-sonnet-4-5-20250929': {
    input: 3.0,
    output: 15.0,
  },
  'claude-3-5-sonnet-20241022': {
    input: 3.0,
    output: 15.0,
  },
};

// 估算单条新闻的成本
export function estimateCost(config: AIConfig, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[config.model];
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}
