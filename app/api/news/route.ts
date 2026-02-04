import { NextResponse } from 'next/server';
import { getNewsItems } from '@/lib/supabase/queries';

// GET - 获取新闻列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const news = await getNewsItems(limit);
    return NextResponse.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
