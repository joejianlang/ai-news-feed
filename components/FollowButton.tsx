'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';

interface FollowButtonProps {
  sourceId: string;
  sourceName: string;
}

export default function FollowButton({ sourceId, sourceName }: FollowButtonProps) {
  const { user } = useUser();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkFollowStatus();
    }
  }, [user, sourceId]);

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
        }
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
        isFollowing
          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          : 'bg-blue-500 text-white hover:bg-blue-600'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isLoading ? '...' : isFollowing ? '已关注' : '+ 关注'}
    </button>
  );
}
