import { analyzeContent } from './index';

/**
 * 使用 AI 润色广告内容
 */
export async function polishAdContent(productName: string, rawDescription: string) {
    const prompt = `
你是一个专业的营销文案专家。请根据以下产品名称和原始描述，生成一个简短有力、吸引人的广告标题和内容。

产品名称：\${productName}
原始描述：\${rawDescription}

要求：
1. 标题必须极具吸引力，不超过 20 个字。
2. 内容描述要直击痛点，优美大方，不超过 80 个字。
3. 语言风格要符合现代都市生活气息，亲切自然。
4. 返回格式必须为 JSON: {"title": "...", "content": "..."}
5. 必须只返回 JSON，不要包含任何解释性文字。
`;

    try {
        // 借用现有的 analyzeContent 逻辑或直接调用 Gemini
        const result = await analyzeContent(prompt, "广告润色请求", "营销风格", "polishing");

        // 由于 analyzeContent 是为了新闻设计的，我们需要解析它返回的 summary 或 commentary
        // 或者我们实现一个更基础的 callAI 函数。
        // 但为了不破坏现有架构，我们可以假设 analyzeContent 的 summary 包含了 JSON
        const content = result.summary || result.commentary;

        // 尝试解析 JSON
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error("Failed to parse AI ad response:", e);
        }

        return {
            title: productName,
            content: rawDescription
        };
    } catch (err) {
        console.error("Ad AI polishing error:", err);
        return {
            title: productName,
            content: rawDescription
        };
    }
}
