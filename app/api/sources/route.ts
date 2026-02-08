import { NextResponse } from 'next/server';
import { getNewsSources, createNewsSource, updateNewsSource, deleteNewsSource } from '@/lib/supabase/queries';
import { extractChannelId, getChannelIdByUsername } from '@/lib/scrapers/youtube-channel';
import { verifyAdmin } from '@/lib/auth/adminAuth';

// GET - 获取所有新闻源（仅管理员）
export async function GET() {
  // 验证管理员权限
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const sources = await getNewsSources();
    return NextResponse.json(sources);
  } catch (error) {
    console.error('Error fetching sources:', error);
    return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 });
  }
}

// POST - 创建新闻源（仅管理员）
export async function POST(request: Request) {
  // 验证管理员权限
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    const body = await request.json();

    // 数据清洗：如果 category_id 为空字符串，则设置为 null，防止数据库 UUID 校验失败
    if (body.category_id === '') {
      body.category_id = null;
    }
    // 删除所有值为 undefined 的属性，确保传递给 supabase 的是干净的对象
    Object.keys(body).forEach(key => body[key] === undefined && delete body[key]);

    // 如果是YouTube频道，自动提取并保存频道ID
    if (body.source_type === 'youtube_channel') {
      console.log('Creating YouTube channel source, URL:', body.url);
      const extractedId = extractChannelId(body.url);
      console.log('Extracted ID:', extractedId);

      if (extractedId) {
        // 判断是否需要转换：URL中包含@/@, /c/, /user/等格式
        const needsConversion = body.url.includes('/@') || body.url.includes('/c/') || body.url.includes('/user/');

        if (needsConversion) {
          console.log('Converting username to channel ID...');
          const channelId = await getChannelIdByUsername(extractedId);
          console.log('Converted channel ID:', channelId);
          body.youtube_channel_id = channelId || '';
        } else {
          // 直接使用提取的频道ID（从 /channel/UCxxx 格式）
          body.youtube_channel_id = extractedId;
        }
      }
      console.log('Final youtube_channel_id:', body.youtube_channel_id);
    }

    const source = await createNewsSource(body);
    return NextResponse.json(source);
  } catch (error: any) {
    console.error('Error creating source:', error);
    return NextResponse.json({
      error: 'Failed to create source',
      detail: error.message || 'Unknown error',
      code: error.code
    }, { status: 500 });
  }
}

// PUT - 更新新闻源（仅管理员）
export async function PUT(request: Request) {
  // 验证管理员权限
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    // 数据清洗：如果 category_id 为空字符串，则设置为 null，防止数据库 UUID 校验失败
    if (updates.category_id === '') {
      updates.category_id = null;
    }
    // 删除所有值为 undefined 的属性
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    // 验证 ID 是否提供
    if (!id) {
      return NextResponse.json({ error: 'Source ID is required' }, { status: 400 });
    }

    // 如果更新的是YouTube频道，也需要提取并保存频道ID
    if (updates.source_type === 'youtube_channel' && updates.url) {
      console.log('Updating YouTube channel source, URL:', updates.url);
      const extractedId = extractChannelId(updates.url);
      console.log('Extracted ID:', extractedId);

      if (extractedId) {
        const needsConversion = updates.url.includes('/@') || updates.url.includes('/c/') || updates.url.includes('/user/');

        if (needsConversion) {
          console.log('Converting username to channel ID...');
          const channelId = await getChannelIdByUsername(extractedId);
          console.log('Converted channel ID:', channelId);
          updates.youtube_channel_id = channelId || '';
        } else {
          updates.youtube_channel_id = extractedId;
        }
      }
      console.log('Final youtube_channel_id:', updates.youtube_channel_id);
    }

    const source = await updateNewsSource(id, updates);
    return NextResponse.json(source);
  } catch (error: any) {
    console.error('Error updating source:', error);

    // 特殊处理找不到记录的错误
    if (error.code === 'PGRST116') {
      return NextResponse.json({
        error: 'Source not found. The news source may have been deleted or does not exist.'
      }, { status: 404 });
    }

    return NextResponse.json({
      error: 'Failed to update source',
      detail: error.message || 'Unknown error',
      code: error.code
    }, { status: 500 });
  }
}

// DELETE - 删除新闻源（仅管理员）
export async function DELETE(request: Request) {
  // 验证管理员权限
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Source ID is required' }, { status: 400 });
    }

    await deleteNewsSource(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting source:', error);
    return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 });
  }
}
