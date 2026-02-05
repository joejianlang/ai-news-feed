#!/usr/bin/env node

/**
 * AI 成本分析脚本
 * 用于估算不同配置下的 AI 成本
 */

const PRICING = {
  'claude-haiku-4': {
    input: 0.25,   // $ per 1M tokens
    output: 1.25,
    name: 'Haiku 4.0 (最快最便宜)'
  },
  'claude-sonnet-4.5': {
    input: 3.0,
    output: 15.0,
    name: 'Sonnet 4.5 (最强最贵)'
  },
};

// 假设平均每条新闻
const AVERAGE_TOKENS = {
  premium: { input: 800, output: 600 },
  standard: { input: 500, output: 400 },
  economy: { input: 300, output: 300 },
};

function calculateCost(model, tokens) {
  const pricing = PRICING[model];
  const inputCost = (tokens.input / 1_000_000) * pricing.input;
  const outputCost = (tokens.output / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

console.log('📊 AI 成本分析\n');
console.log('=' .repeat(70));

const scenarios = [
  { news: 50, period: '每天' },
  { news: 100, period: '每天' },
  { news: 200, period: '每天' },
];

const models = [
  { key: 'claude-haiku-4', mode: 'standard' },
  { key: 'claude-sonnet-4.5', mode: 'premium' },
];

models.forEach(({ key, mode }) => {
  console.log(`\n${PRICING[key].name}`);
  console.log('-'.repeat(70));

  const tokens = AVERAGE_TOKENS[mode];
  const perNewsCost = calculateCost(key, tokens);

  scenarios.forEach(({ news, period }) => {
    const dailyCost = perNewsCost * news;
    const monthlyCost = dailyCost * 30;
    const yearlyCost = dailyCost * 365;

    console.log(`${period}抓取 ${news.toString().padStart(3)} 条新闻:`);
    console.log(`  单条成本: $${perNewsCost.toFixed(6)}`);
    console.log(`  每天: $${dailyCost.toFixed(2)}`);
    console.log(`  每月: $${monthlyCost.toFixed(2)}`);
    console.log(`  每年: $${yearlyCost.toFixed(2)}`);
    console.log('');
  });
});

console.log('=' .repeat(70));
console.log('\n💡 建议:');
console.log('1. 使用 Haiku 4.0 可节省 90% 成本');
console.log('2. 设置 AI_MODE=economy 可再节省 50%');
console.log('3. 对不重要的源可以禁用 AI 分析');
console.log('4. 定期清理重复内容，避免重复分析\n');
