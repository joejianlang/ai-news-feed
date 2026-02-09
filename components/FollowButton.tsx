'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import Toast from './Toast';

interface FollowButtonProps {
  sourceId: string;
  sourceName: string;
}

export default function FollowButton({ sourceId }: { sourceId: string }) {
  const { user } = useUser();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const response = await fetch('/api/follows');
        if (response.ok) {
          const data = await response.json();
          const following = data.follows.some((f: any) => f.source_id === sourceId);
          setIsFollowing(following);
        }
      } catch (error) {
        console.error('Failed to check follow status:', error);
      }
    };

    if (user) {
      checkFollowStatus();
    }
  }, [user, sourceId]);

  const handleFollow = async () => {
    if (!user) {
      // 未登录，跳转到登录页
      router.push('/login');
      return;
    }

    setIsLoading(true);

    try {
      if (isFollowing) {
        // 取消关注
        const response = await fetch('/api/follows', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceId }),
        });

        if (response.ok) {
          setIsFollowing(false);
          setToast({ message: '已取消关注', type: 'success' });
        } else {
          const error = await response.json();
          setToast({ message: `操作失败: ${error.error || '未知错误'}`, type: 'error' });
        }
      } else {
        // 关注
        const response = await fetch('/api/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceId }),
        });

        if (response.ok) {
          setIsFollowing(true);
          setToast({ message: '关注成功！', type: 'success' });
        } else {
          const error = await response.json();
          setToast({ message: `操作失败: ${error.error || '未知错误'}`, type: 'error' });
        }
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      setToast({ message: '网络请求失败，请稍后重试', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${isFollowing
        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        : 'bg-teal-500 text-white hover:bg-teal-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isLoading ? '...' : isFollowing ? '已关注' : '+ 关注'}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </button>
  );
}
