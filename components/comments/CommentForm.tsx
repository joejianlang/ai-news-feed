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
        className="w-full p-3 bg-secondary/50 dark:bg-white/5 border border-card-border rounded-xl text-[14px] resize-none focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 text-text-primary placeholder:text-text-muted transition-all"
        rows={3}
        maxLength={2000}
      />
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-text-muted">
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
            className="px-5 py-2 bg-teal-600 dark:bg-teal-500 text-white text-sm font-black rounded-lg hover:bg-teal-700 dark:hover:bg-teal-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-teal-500/10"
          >
            {isSubmitting ? '发表中...' : '发表'}
          </button>
        </div>
      </div>
    </form>
  );
}
