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
    ? 'ml-4 sm:ml-8 pl-3 sm:pl-4 border-l-2 border-gray-100'
    : '';

  return (
    <div className={indentClass}>
      <div className="py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
            {comment.user?.username?.charAt(0) || 'U'}
          </div>
          <span className="font-medium text-gray-900 text-sm">
            {comment.user?.username || '匿名用户'}
          </span>
          <span className="text-gray-400 text-xs">
            {formatTime(comment.created_at)}
          </span>
          {comment.updated_at !== comment.created_at && (
            <span className="text-gray-400 text-xs">(已编辑)</span>
          )}
        </div>

        {isEditing ? (
          <div className="mb-2">
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:border-blue-400"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleEdit}
                disabled={isSaving || !editContent.trim()}
                className="px-3 py-1.5 bg-blue-500 text-white text-xs sm:text-sm rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs sm:text-sm rounded hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 text-sm leading-relaxed mb-2 break-words">
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
              className="text-gray-500 hover:text-blue-500 active:text-blue-600 py-1"
            >
              回复
            </button>
          )}

          {isOwner && !isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-500 hover:text-blue-500 active:text-blue-600 py-1"
              >
                编辑
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-gray-500 hover:text-red-500 active:text-red-600 py-1"
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
