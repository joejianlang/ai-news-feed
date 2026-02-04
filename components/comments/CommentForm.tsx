'use client';

import { useState } from 'react';
import type { CommentWithReplies } from '@/types';

interface CommentFormProps {
  newsItemId: string;
  parentId?: string;
  onCommentAdded: (comment: CommentWithReplies) => void;
  onCancel?: () => void;
  placeholder?: string;
}

export default function CommentForm({
  newsItemId,
  parentId,
  onCommentAdded,
  onCancel,
  placeholder = '写下你的想法...',
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsItemId,
          content: content.trim(),
          parentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onCommentAdded({ ...data.comment, replies: [] });
        setContent('');
      }
    } catch (error) {
      console.error('发表评论失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={placeholder}
        className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-400"
        rows={3}
        maxLength={2000}
      />
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-gray-400">
          {content.length}/2000
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 active:text-gray-900"
            >
              取消
            </button>
          )}
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '发表中...' : '发表'}
          </button>
        </div>
      </div>
    </form>
  );
}
