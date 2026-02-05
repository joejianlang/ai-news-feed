#!/usr/bin/env node

/**
 * AI 故障转移测试脚本
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('🧪 测试 AI 故障转移系统\n');
console.log('='.repeat(70));

async function testGemini() {
  console.log('\n1️⃣ 测试 Gemini 2.5 Flash...');
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const startTime = Date.now();
    const result = await model.generateContent('请用中文回复：你好');
    const duration = Date.now() - startTime;

    const response = result.response.text();

    console.log('   ✅ Gemini 可用');
    console.log(`   响应时间: ${duration}ms`);
    console.log(`   响应内容: ${response.substring(0, 50)}`);
    return true;
  } catch (error) {
    console.log('   ❌ Gemini 失败');
    console.log(`   错误: ${error.message.substring(0, 100)}`);
    return false;
  }
}

async function testClaude() {
  console.log('\n2️⃣ 测试 Claude Haiku...');
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const startTime = Date.now();
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-20250514',
      max_tokens: 100,
      messages: [{ role: 'user', content: '请用中文回复：你好' }],
    });
    const duration = Date.now() - startTime;

    const response = message.content[0].type === 'text' ? message.content[0].text : '';

    console.log('   ✅ Claude 可用');
    console.log(`   响应时间: ${duration}ms`);
    console.log(`   响应内容: ${response.substring(0, 50)}`);
    return true;
  } catch (error) {
    console.log('   ❌ Claude 失败');
    console.log(`   错误: ${error.message.substring(0, 100)}`);
    return false;
  }
}

async function testFailover() {
  console.log('\n3️⃣ 测试故障转移逻辑...');

  const geminiOk = await testGemini();
  const claudeOk = await testClaude();

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 测试结果总结:\n');

  console.log(`Gemini 2.5 Flash: ${geminiOk ? '✅ 可用' : '❌ 不可用'}`);
  console.log(`Claude Haiku:     ${claudeOk ? '✅ 可用' : '❌ 不可用'}`);

  console.log('\n💡 故障转移策略:\n');

  if (geminiOk && claudeOk) {
    console.log('✅ 两个 AI 都正常');
    console.log('   主 AI: Gemini (免费)');
    console.log('   备用 AI: Claude (付费)');
    console.log('   状态: 完全健康 ✨');
  } else if (geminiOk && !claudeOk) {
    console.log('⚠️ Gemini 正常，Claude 异常');
    console.log('   主 AI: Gemini (免费)');
    console.log('   备用 AI: 不可用');
    console.log('   状态: 部分可用 ⚡');
  } else if (!geminiOk && claudeOk) {
    console.log('⚠️ Gemini 异常，Claude 正常');
    console.log('   当前会自动切换到 Claude');
    console.log('   状态: 故障转移中 🔄');
  } else {
    console.log('❌ 两个 AI 都异常');
    console.log('   将返回降级响应');
    console.log('   状态: 降级模式 ⬇️');
  }

  console.log('\n' + '='.repeat(70));
}

testFailover().catch(console.error);
