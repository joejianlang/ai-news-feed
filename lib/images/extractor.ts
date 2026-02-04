import * as cheerio from 'cheerio';

/**
 * 从HTML中提取主图片
 */
export function extractImageFromHTML(html: string, baseUrl: string): string | null {
  const $ = cheerio.load(html);

  // 优先级列表：尝试多种方式提取图片
  const selectors = [
    // Open Graph图片
    'meta[property="og:image"]',
    'meta[property="og:image:secure_url"]',
    // Twitter Card图片
    'meta[name="twitter:image"]',
    'meta[name="twitter:image:src"]',
    // 文章主图
    'article img:first',
    '.article-image img',
    '.featured-image img',
    '.post-thumbnail img',
    // 通用主图
    'img[itemprop="image"]',
    // 第一张大图片（宽度>300px）
    'img',
  ];

  for (const selector of selectors) {
    const element = $(selector).first();

    if (selector.startsWith('meta')) {
      const content = element.attr('content');
      if (content && isValidImageUrl(content)) {
        return makeAbsoluteUrl(content, baseUrl);
      }
    } else {
      const src = element.attr('src') || element.attr('data-src');
      if (src && isValidImageUrl(src)) {
        return makeAbsoluteUrl(src, baseUrl);
      }
    }
  }

  return null;
}

/**
 * 验证是否为有效的图片URL
 */
function isValidImageUrl(url: string): boolean {
  if (!url) return false;

  // 排除无效的URL
  const invalidPatterns = [
    /^data:image/, // base64图片
    /\.svg$/i, // SVG图片（不适合作为预览图）
    /placeholder/i, // 占位图
    /dummy/i,
    /avatar/i, // 头像
    /logo/i, // Logo
  ];

  if (invalidPatterns.some(pattern => pattern.test(url))) {
    return false;
  }

  // 确保是图片格式
  const imageExtensions = /\.(jpg|jpeg|png|webp|gif)($|\?)/i;
  return imageExtensions.test(url) || url.includes('image');
}

/**
 * 将相对URL转换为绝对URL
 */
function makeAbsoluteUrl(url: string, baseUrl: string): string {
  try {
    // 如果已经是绝对URL，直接返回
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // 处理协议相对URL
    if (url.startsWith('//')) {
      return `https:${url}`;
    }

    // 处理相对URL
    const base = new URL(baseUrl);
    return new URL(url, base.origin).href;
  } catch (error) {
    console.error('Failed to make absolute URL:', error);
    return url;
  }
}

/**
 * 使用AI生成图片描述（用于后续图片生成）
 */
export async function generateImagePrompt(title: string, content: string): Promise<string> {
  // 提取关键信息生成图片描述
  const summary = content.substring(0, 500);

  // 简单的图片描述模板
  // 实际使用时，可以调用Claude API生成更好的描述
  return `A professional news article illustration about: ${title}. Clean, modern, journalistic style.`;
}
