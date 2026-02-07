/**
 * Comment on a shape or canvas position
 */
export interface Comment {
  /** Unique identifier */
  id: string;
  /** Shape ID this comment is attached to (null for canvas comments) */
  shapeId: string | null;
  /** X position for canvas comments */
  x?: number;
  /** Y position for canvas comments */
  y?: number;
  /** Author user ID */
  authorId: string;
  /** Author display name */
  authorName: string;
  /** Author color */
  authorColor: string;
  /** Comment text content */
  content: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt?: number;
  /** Whether this comment is resolved */
  resolved?: boolean;
  /** Parent comment ID for replies */
  parentId?: string;
}

/**
 * Comment thread containing a root comment and its replies
 */
export interface CommentThread {
  /** Thread ID (same as root comment ID) */
  id: string;
  /** Shape ID this thread is attached to */
  shapeId: string | null;
  /** Position for canvas comments */
  position?: { x: number; y: number };
  /** Root comment */
  rootComment: Comment;
  /** Reply comments */
  replies: Comment[];
  /** Whether thread is resolved */
  resolved: boolean;
  /** Number of unread replies */
  unreadCount?: number;
}
