import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/adminAuth';
import { supabase } from '@/lib/supabase/client';

// GET - 获取待审核的推荐源（仅管理员）
export async function GET() {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { data, error } = await supabase
      .from('recommended_sources')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('status', 'pending')
      .order('popularity_score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}

// POST - 批准推荐源并添加到正式列表（仅管理员）
export async function POST(request: Request) {
  const { isAdmin, userId } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id } = await request.json();

    // 获取推荐源信息
    const { data: recommendation, error: fetchError } = await supabase
      .from('recommended_sources')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    // 添加到正式新闻源列表
    const { data: newSource, error: createError } = await supabase
      .from('news_sources')
      .insert([{
        name: recommendation.name,
        url: recommendation.url,
        source_type: recommendation.source_type,
        category_id: recommendation.category_id,
        youtube_channel_id: recommendation.youtube_channel_id,
        fetch_interval: recommendation.fetch_interval,
        commentary_style: recommendation.commentary_style,
        is_active: true
      }])
      .select()
      .single();

    if (createError) throw createError;

    // 更新推荐状态为已批准
    const { error: updateError } = await supabase
      .from('recommended_sources')
      .update({
        status: 'approved',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, source: newSource });
  } catch (error) {
    console.error('Error approving recommendation:', error);
    return NextResponse.json({ error: 'Failed to approve recommendation' }, { status: 500 });
  }
}

// DELETE - 拒绝推荐源（仅管理员）
export async function DELETE(request: Request) {
  const { isAdmin, userId } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // 更新状态为已拒绝
    const { error } = await supabase
      .from('recommended_sources')
      .update({
        status: 'rejected',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rejecting recommendation:', error);
    return NextResponse.json({ error: 'Failed to reject recommendation' }, { status: 500 });
  }
}
