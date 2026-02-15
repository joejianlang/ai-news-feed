import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { createSupabaseBrowserClient } from '@/lib/supabase/client'; // Note: This might be for browser, need admin for server? Actually API can use secret keys.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function suggestForumTags(title: string, content: string): Promise<string[]> {
    if (!GEMINI_API_KEY) return [];

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
            maxOutputTokens: 100,
            temperature: 0.4,
            responseMimeType: "application/json"
        },
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
    });

    const prompt = `你是一个社区论坛内容助手。请根据以下帖子的标题和内容，生成 2-4 个最合适的分类标签。
    
    常见的标签类别参考：政治、历史、军事、科技、生活、求助、吐槽、建议、财经、文化、体育。
    如果是关于加拿大的，请加上 "加拿大" 标签。
    
    帖子标题：${title}
    帖子内容：${content.substring(0, 500)}
    
    请严格按照以下 JSON 格式返回，不要包含任何说明文字：
    {
      "tags": ["标签1", "标签2", "标签3"]
    }`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);
        return parsed.tags || [];
    } catch (error) {
        console.error('Forum AI Tagging failed:', error);
        return [];
    }
}
