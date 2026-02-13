'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';

interface LikeButtonProps {
  commentId: string;
  initialCount: number;
  initialLiked: boolean;
}

export default function LikeButton({
  commentId,
  initialCount,
  initialLiked,
}: LikeButtonProps) {
  const { user } = useUser();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      if (isLiked) {
        const response = await fetch(`/api/comments/${commentId}/likes`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setIsLiked(false);
          setLikeCount(prev => Math.max(0, prev - 1));
        }
      } else {
        const response = await fetch(`/api/comments/${commentId}/likes`, {
          method: 'POST',
        });
        if (response.ok) {
          setIsLiked(true);
          setLikeCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('操作失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={`flex items-center gap-1 transition-colors ${isLiked
          ? 'text-red-500'
          : 'text-text-muted hover:text-red-500'
        } disabled:opacity-50`}
    >
      <span>{isLiked ? '❤️' : '🤍'}</span>
      <span>{likeCount > 0 ? likeCount : ''}</span>
    </button>
  );
}
