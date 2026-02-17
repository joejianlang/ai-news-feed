import { getAuthUser } from './server';
import { supabase } from '../supabase/client';

/**
 * 验证用户是否为管理员
 * 用于保护管理员专用的API路由和页面
 */
export async function verifyAdmin(): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return { isAdmin: false, error: 'No authentication user found' };
    }

    // 从数据库获取用户信息（包含role）
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, role')
      .eq('id', authUser.id)
      .single();

    if (error || !user) {
      return { isAdmin: false, error: 'User profile not found in database' };
    }

    // 检查是否为管理员
    if (user.role !== 'admin') {
      return { isAdmin: false, userId: user.id, error: 'Not an admin' };
    }

    return { isAdmin: true, userId: user.id };
  } catch (error) {
    console.error('Admin verification failed:', error);
    return { isAdmin: false, error: 'Verification failed' };
  }
}
