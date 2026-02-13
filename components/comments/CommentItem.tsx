'use client';

import { useState } from 'react';
import { useUser } from '@/lib/contexts/UserContext';
import CommentForm from './CommentForm';
import LikeButton from './LikeButton';
import type { CommentWithReplies } from '@/types';

interface CommentItemProps {
  comment: CommentWithReplies;
  depth?: number;
  onDeleted: (commentId: string) => void;
  onReplyAdded: (parentId: string, reply: CommentWithReplies) => void;
  onUpdated: (commentId: string, newContent: string) => void;
}

const MAX_DEPTH = 3;

export default function CommentItem({
  comment,
  depth = 0,
  onDeleted,
  onReplyAdded,
  onUpdated,
}: CommentItemProps) {
  const { user } = useUser();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isOwner = user?.id === comment.user_id;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这条评论吗？')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        onDeleted(comment.id);
      }
    } catch (error) {
      console.error('删除失败:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      });
      if (response.ok) {
        onUpdated(comment.id, editContent.trim());
        setIsEditing(false);
      }
    } catch (error) {
      console.error('编辑失败:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReplyAdded = (reply: CommentWithReplies) => {
    onReplyAdded(comment.id, reply);
    setIsReplying(false);
  };

  // 移动端减少嵌套缩进
  const indentClass = depth > 0
    ? 'ml-4 sm:ml-10 pl-4 sm:pl-6 border-l border-card-border'
    : '';

  return (
    <div className={indentClass}>
      <div className="py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-black flex-shrink-0 shadow-sm shadow-teal-500/20">
            {comment.user?.username?.charAt(0) || 'U'}
          </div>
          <span className="font-black text-text-primary text-[14px]">
            {comment.user?.username || '匿名用户'}
          </span>
          <span className="text-text-muted text-[11px] font-bold uppercase tracking-wider">
            {formatTime(comment.created_at)}
          </span>
          {comment.updated_at !== comment.created_at && (
            <span className="text-text-muted text-[11px] font-bold">(已编辑)</span>
          )}
        </div>

        {isEditing ? (
          <div className="mb-2">
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="w-full p-2.5 bg-secondary/50 dark:bg-white/5 border border-card-border rounded-lg text-sm focus:outline-none focus:border-teal-500 text-text-primary resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleEdit}
                disabled={isSaving || !editContent.trim()}
                className="px-4 py-1.5 bg-teal-600 text-white text-xs sm:text-sm font-bold rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="px-4 py-1.5 bg-secondary text-text-primary text-xs sm:text-sm font-bold rounded-lg hover:bg-card-border transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <p className="text-text-secondary text-[14px] leading-relaxed mb-3 break-words font-medium">
            {comment.content}
          </p>
        )}

        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
          <LikeButton
            commentId={comment.id}
            initialCount={comment.like_count || 0}
            initialLiked={comment.is_liked || false}
          />

          {user && depth < MAX_DEPTH && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-text-muted hover:text-teal-600 dark:hover:text-teal-400 font-bold py-1 transition-colors"
            >
              回复
            </button>
          )}

          {isOwner && !isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="text-text-muted hover:text-teal-600 dark:hover:text-teal-400 font-bold py-1 transition-colors"
              >
                编辑
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-text-muted hover:text-red-500 font-bold py-1 transition-colors"
              >
                {isDeleting ? '删除中...' : '删除'}
              </button>
            </>
          )}
        </div>

        {isReplying && (
          <div className="mt-3">
            <CommentForm
              newsItemId={comment.news_item_id}
              parentId={comment.id}
              onCommentAdded={handleReplyAdded}
              onCancel={() => setIsReplying(false)}
              placeholder={`回复 ${comment.user?.username || '用户'}...`}
            />
          </div>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="replies">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onDeleted={onDeleted}
              onReplyAdded={onReplyAdded}
              onUpdated={onUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
