'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/contexts/UserContext';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import type { CommentWithReplies } from '@/types';

interface CommentSectionProps {
  newsItemId: string;
  initialCommentCount?: number;
}

export default function CommentSection({
  newsItemId,
  initialCommentCount = 0,
}: CommentSectionProps) {
  const { user } = useUser();
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  useEffect(() => {
    const loadComments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/comments?newsItemId=${newsItemId}`);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments);
          setCommentCount(countComments(data.comments));
        }
      } catch (error) {
        console.error('Failed to load comments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isExpanded) {
      loadComments();
    }
  }, [isExpanded, newsItemId]);

  const handleCommentAdded = (newComment: CommentWithReplies) => {
    setComments(prev => [...prev, newComment]);
    setCommentCount(prev => prev + 1);
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments(prev => removeCommentFromTree(prev, commentId));
    setCommentCount(prev => Math.max(0, prev - 1));
  };

  const handleReplyAdded = (parentId: string, reply: CommentWithReplies) => {
    setComments(prev => addReplyToTree(prev, parentId, reply));
    setCommentCount(prev => prev + 1);
  };

  const handleCommentUpdated = (commentId: string, newContent: string) => {
    setComments(prev => updateCommentInTree(prev, commentId, newContent));
  };

  return (
    <div className="w-full">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-text-muted hover:text-teal-600 font-bold transition-all py-2"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z" />
        </svg>
        <span className="text-sm">评论 ({commentCount})</span>
        <span className={`text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="mt-4">
          {user ? (
            <CommentForm
              newsItemId={newsItemId}
              onCommentAdded={handleCommentAdded}
            />
          ) : (
            <p className="text-sm text-gray-500 mb-4">
              <a href="/login" className="text-blue-500 hover:underline">
                登录
              </a>
              后参与评论
            </p>
          )}

          {isLoading ? (
            <div className="text-center py-4 text-gray-500">加载中...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4 text-gray-500">暂无评论</div>
          ) : (
            <CommentList
              comments={comments}
              onCommentDeleted={handleCommentDeleted}
              onReplyAdded={handleReplyAdded}
              onCommentUpdated={handleCommentUpdated}
            />
          )}
        </div>
      )}
    </div>
  );
}

function countComments(comments: CommentWithReplies[]): number {
  let count = 0;
  for (const comment of comments) {
    count += 1;
    if (comment.replies) {
      count += countComments(comment.replies);
    }
  }
  return count;
}

function removeCommentFromTree(
  comments: CommentWithReplies[],
  commentId: string
): CommentWithReplies[] {
  return comments
    .filter(c => c.id !== commentId)
    .map(c => ({
      ...c,
      replies: removeCommentFromTree(c.replies || [], commentId),
    }));
}

function addReplyToTree(
  comments: CommentWithReplies[],
  parentId: string,
  reply: CommentWithReplies
): CommentWithReplies[] {
  return comments.map(c => {
    if (c.id === parentId) {
      return { ...c, replies: [...(c.replies || []), reply] };
    }
    if (c.replies && c.replies.length > 0) {
      return { ...c, replies: addReplyToTree(c.replies, parentId, reply) };
    }
    return c;
  });
}

function updateCommentInTree(
  comments: CommentWithReplies[],
  commentId: string,
  newContent: string
): CommentWithReplies[] {
  return comments.map(c => {
    if (c.id === commentId) {
      return { ...c, content: newContent, updated_at: new Date().toISOString() };
    }
    if (c.replies && c.replies.length > 0) {
      return { ...c, replies: updateCommentInTree(c.replies, commentId, newContent) };
    }
    return c;
  });
}
