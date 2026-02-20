import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/server';
import { getUserById } from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
  console.log('[API] /api/auth/me called');
  try {
    const authUser = await getAuthUser(request);
    console.log('[API] authUser:', authUser);

    if (!authUser) {
      console.log('[API] No auth user found');
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    let supabase;
    if ((authUser as any).source === 'legacy') {
      console.log('[API] Using Admin Client (legacy source)');
      supabase = await createSupabaseAdminClient();
    } else {
      console.log('[API] Using Server Client (supabase source)');
      supabase = await createSupabaseServerClient();
    }

    // 获取详细用户信息
    console.log('[API] Querying user profile for id:', authUser.id);
    const { data: userProfile, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (dbError) {
      console.error('[API] DB Error querying profile:', dbError);
    } else {
      console.log('[API] User profile found:', userProfile ? 'yes' : 'no');
    }

    let user = userProfile;

    if (dbError || !user) {
      console.warn('Could not find profile in public.users for auth user:', authUser.id, dbError);
      // 如果数据库里还没同步到用户信息，返回一个基础信息
      user = {
        id: authUser.id,
        email: authUser.email || '',
        username: (authUser as any).username || (authUser.email ? authUser.email.split('@')[0] : 'User'),
        role: 'user', // 默认角色
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('获取用户信息整体失败:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: '获取用户信息失败', detail: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
