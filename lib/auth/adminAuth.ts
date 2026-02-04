import { cookies } from 'next/headers';
import { verifyToken } from './jwt';
import { supabase } from '../supabase/client';

/**
 * 验证用户是否为管理员
 * 用于保护管理员专用的API路由和页面
 */
export async function verifyAdmin(): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return { isAdmin: false, error: 'No authentication token' };
    }

    // 验证JWT token
    const payload = verifyToken(token);
    if (!payload) {
      return { isAdmin: false, error: 'Invalid token' };
    }

    // 从数据库获取用户信息（包含role）
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, role')
      .eq('id', payload.userId)
      .single();

    if (error || !user) {
      return { isAdmin: false, error: 'User not found' };
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
