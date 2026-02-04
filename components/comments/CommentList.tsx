'use client';

import CommentItem from './CommentItem';
import type { CommentWithReplies } from '@/types';

interface CommentListProps {
  comments: CommentWithReplies[];
  onCommentDeleted: (commentId: string) => void;
  onReplyAdded: (parentId: string, reply: CommentWithReplies) => void;
  onCommentUpdated: (commentId: string, newContent: string) => void;
}

export default function CommentList({
  comments,
  onCommentDeleted,
  onReplyAdded,
  onCommentUpdated,
}: CommentListProps) {
  return (
    <div className="divide-y divide-gray-100">
      {comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onDeleted={onCommentDeleted}
          onReplyAdded={onReplyAdded}
          onUpdated={onCommentUpdated}
        />
      ))}
    </div>
  );
}
