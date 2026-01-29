'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useCommentStore } from '../stores/commentStore';
import type { CommentThread, Comment } from '../types';

interface CommentPanelProps {
  /** Width of the panel */
  width?: number;
}

/** Format timestamp to relative time */
function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

/** Single comment item */
function CommentItem({
  comment,
  isRoot,
  onReply,
  onEdit,
  onDelete,
  currentUserId,
}: {
  comment: Comment;
  isRoot: boolean;
  onReply: () => void;
  onEdit: (content: string) => void;
  onDelete: () => void;
  currentUserId?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const isOwner = currentUserId === comment.authorId;

  const handleSave = () => {
    if (editContent.trim()) {
      onEdit(editContent.trim());
      setIsEditing(false);
    }
  };

  return (
    <div style={{
      padding: '12px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: isRoot ? '#ffffff' : '#f9fafb',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          backgroundColor: comment.authorColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 12,
          fontWeight: 500,
        }}>
          {comment.authorName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#1f2937' }}>
            {comment.authorName}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            {formatTime(comment.createdAt)}
            {comment.updatedAt && ' (edited)'}
          </div>
        </div>
        {isOwner && !isEditing && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '4px 8px',
                fontSize: 11,
                color: '#6b7280',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              style={{
                padding: '4px 8px',
                fontSize: 11,
                color: '#ef4444',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={{
              width: '100%',
              padding: 8,
              fontSize: 13,
              border: '1px solid #d1d5db',
              borderRadius: 4,
              resize: 'none',
              minHeight: 60,
            }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={handleSave}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditContent(comment.content);
                setIsEditing(false);
              }}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {comment.content}
          </div>
          {isRoot && (
            <button
              onClick={onReply}
              style={{
                marginTop: 8,
                padding: '4px 8px',
                fontSize: 12,
                color: '#3b82f6',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Reply
            </button>
          )}
        </>
      )}
    </div>
  );
}

/** Thread view */
function ThreadView({
  thread,
  onClose,
}: {
  thread: CommentThread;
  onClose: () => void;
}) {
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  const currentUser = useCommentStore((s) => s.currentUser);
  const addComment = useCommentStore((s) => s.addComment);
  const updateComment = useCommentStore((s) => s.updateComment);
  const deleteComment = useCommentStore((s) => s.deleteComment);
  const resolveThread = useCommentStore((s) => s.resolveThread);

  useEffect(() => {
    if (isReplying && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [isReplying]);

  const handleReply = () => {
    if (!replyContent.trim()) return;

    addComment({
      shapeId: thread.shapeId,
      content: replyContent.trim(),
      parentId: thread.id,
    });
    setReplyContent('');
    setIsReplying(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            fontSize: 13,
            color: '#6b7280',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <button
          onClick={() => resolveThread(thread.id, !thread.resolved)}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            backgroundColor: thread.resolved ? '#f3f4f6' : '#22c55e',
            color: thread.resolved ? '#374151' : 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          {thread.resolved ? 'Reopen' : 'Resolve'}
        </button>
      </div>

      {/* Comments */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <CommentItem
          comment={thread.rootComment}
          isRoot={true}
          onReply={() => setIsReplying(true)}
          onEdit={(content) => updateComment(thread.rootComment.id, content)}
          onDelete={() => deleteComment(thread.rootComment.id)}
          currentUserId={currentUser?.id}
        />
        {thread.replies.map((reply) => (
          <div key={reply.id} style={{ paddingLeft: 16 }}>
            <CommentItem
              comment={reply}
              isRoot={false}
              onReply={() => setIsReplying(true)}
              onEdit={(content) => updateComment(reply.id, content)}
              onDelete={() => deleteComment(reply.id)}
              currentUserId={currentUser?.id}
            />
          </div>
        ))}
      </div>

      {/* Reply input */}
      {isReplying && (
        <div style={{ padding: 12, borderTop: '1px solid #e5e7eb' }}>
          <textarea
            ref={replyInputRef}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            style={{
              width: '100%',
              padding: 8,
              fontSize: 13,
              border: '1px solid #d1d5db',
              borderRadius: 4,
              resize: 'none',
              minHeight: 60,
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleReply();
              }
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setReplyContent('');
                setIsReplying(false);
              }}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleReply}
              disabled={!replyContent.trim()}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                backgroundColor: replyContent.trim() ? '#3b82f6' : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: replyContent.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Thread list view */
function ThreadListView({
  threads,
  onSelectThread,
}: {
  threads: CommentThread[];
  onSelectThread: (id: string) => void;
}) {
  const unresolvedThreads = threads.filter((t) => !t.resolved);
  const resolvedThreads = threads.filter((t) => t.resolved);

  const ThreadItem = ({ thread }: { thread: CommentThread }) => (
    <div
      onClick={() => onSelectThread(thread.id)}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        cursor: 'pointer',
        backgroundColor: thread.resolved ? '#f9fafb' : '#ffffff',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f3f4f6';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = thread.resolved ? '#f9fafb' : '#ffffff';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: thread.rootComment.authorColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 11,
          fontWeight: 500,
        }}>
          {thread.rootComment.authorName.charAt(0).toUpperCase()}
        </div>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>
          {thread.rootComment.authorName}
        </span>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>
          {formatTime(thread.rootComment.createdAt)}
        </span>
        {thread.resolved && (
          <span style={{
            fontSize: 10,
            padding: '2px 6px',
            backgroundColor: '#dcfce7',
            color: '#166534',
            borderRadius: 4,
          }}>
            Resolved
          </span>
        )}
      </div>
      <div style={{
        fontSize: 13,
        color: '#6b7280',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {thread.rootComment.content}
      </div>
      {thread.replies.length > 0 && (
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
          {thread.replies.length} {thread.replies.length === 1 ? 'reply' : 'replies'}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ overflow: 'auto', flex: 1 }}>
      {unresolvedThreads.length === 0 && resolvedThreads.length === 0 ? (
        <div style={{
          padding: 24,
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: 13,
        }}>
          No comments yet.
          <br />
          <span style={{ fontSize: 12 }}>
            Click on a shape and press C to add a comment.
          </span>
        </div>
      ) : (
        <>
          {unresolvedThreads.map((thread) => (
            <ThreadItem key={thread.id} thread={thread} />
          ))}
          {resolvedThreads.length > 0 && (
            <>
              <div style={{
                padding: '8px 16px',
                fontSize: 11,
                color: '#9ca3af',
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
              }}>
                Resolved ({resolvedThreads.length})
              </div>
              {resolvedThreads.map((thread) => (
                <ThreadItem key={thread.id} thread={thread} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

export function CommentPanel({ width = 320 }: CommentPanelProps) {
  const isPanelOpen = useCommentStore((s) => s.isPanelOpen);
  const activeThreadId = useCommentStore((s) => s.activeThreadId);
  const comments = useCommentStore((s) => s.comments);
  const closePanel = useCommentStore((s) => s.closePanel);
  const openThread = useCommentStore((s) => s.openThread);

  // Compute threads from comments (memoized to avoid infinite loops)
  const threads = useMemo(() => {
    const threadList: CommentThread[] = [];
    const rootComments: Comment[] = [];

    // Find all root comments (no parentId)
    comments.forEach((comment) => {
      if (!comment.parentId) {
        rootComments.push(comment);
      }
    });

    // Build threads
    rootComments.forEach((root) => {
      const replies: Comment[] = [];
      comments.forEach((comment) => {
        if (comment.parentId === root.id) {
          replies.push(comment);
        }
      });

      // Sort replies by creation time
      replies.sort((a, b) => a.createdAt - b.createdAt);

      threadList.push({
        id: root.id,
        shapeId: root.shapeId,
        position: root.x !== undefined && root.y !== undefined
          ? { x: root.x, y: root.y }
          : undefined,
        rootComment: root,
        replies,
        resolved: root.resolved ?? false,
      });
    });

    // Sort threads by creation time (newest first)
    threadList.sort((a, b) => b.rootComment.createdAt - a.rootComment.createdAt);

    return threadList;
  }, [comments]);

  const activeThread = activeThreadId
    ? threads.find((t) => t.id === activeThreadId)
    : null;

  if (!isPanelOpen) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width,
      backgroundColor: '#ffffff',
      borderLeft: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 200,
      boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.1)',
    }}>
      {/* Panel header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
          Comments
        </span>
        <button
          onClick={closePanel}
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            color: '#6b7280',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderRadius: 4,
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      {activeThread ? (
        <ThreadView
          thread={activeThread}
          onClose={() => openThread('')}
        />
      ) : (
        <ThreadListView
          threads={threads}
          onSelectThread={openThread}
        />
      )}
    </div>
  );
}
