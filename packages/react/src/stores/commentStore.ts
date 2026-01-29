import { create } from 'zustand';
import type { Comment, CommentThread } from '../types';

/** Generate unique ID */
const generateId = () => `comment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/** Comment store state */
interface CommentState {
  /** All comments indexed by ID */
  comments: Map<string, Comment>;

  /** Currently active thread (open in panel) */
  activeThreadId: string | null;

  /** Whether comment panel is open */
  isPanelOpen: boolean;

  /** Current user info for authoring */
  currentUser: {
    id: string;
    name: string;
    color: string;
  } | null;

  // Actions
  setCurrentUser: (user: { id: string; name: string; color: string }) => void;

  /** Add a new comment */
  addComment: (params: {
    shapeId?: string | null;
    x?: number;
    y?: number;
    content: string;
    parentId?: string;
  }) => Comment | null;

  /** Update a comment */
  updateComment: (id: string, content: string) => void;

  /** Delete a comment */
  deleteComment: (id: string) => void;

  /** Resolve/unresolve a thread */
  resolveThread: (threadId: string, resolved: boolean) => void;

  /** Get all threads */
  getThreads: () => CommentThread[];

  /** Get thread for a shape */
  getThreadForShape: (shapeId: string) => CommentThread | null;

  /** Get threads at canvas position */
  getCanvasThreads: () => CommentThread[];

  /** Open thread in panel */
  openThread: (threadId: string) => void;

  /** Close panel */
  closePanel: () => void;

  /** Toggle panel */
  togglePanel: () => void;

  /** Set all comments (for sync) */
  setComments: (comments: Comment[]) => void;

  /** Get all comments as array */
  getAllComments: () => Comment[];
}

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: new Map(),
  activeThreadId: null,
  isPanelOpen: false,
  currentUser: null,

  setCurrentUser: (user) => {
    set({ currentUser: user });
  },

  addComment: ({ shapeId, x, y, content, parentId }) => {
    const { currentUser, comments } = get();
    if (!currentUser) return null;

    const now = Date.now();
    const comment: Comment = {
      id: generateId(),
      shapeId: shapeId ?? null,
      x,
      y,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorColor: currentUser.color,
      content,
      createdAt: now,
      parentId,
    };

    const newComments = new Map(comments);
    newComments.set(comment.id, comment);
    set({ comments: newComments });

    return comment;
  },

  updateComment: (id, content) => {
    const { comments } = get();
    const comment = comments.get(id);
    if (!comment) return;

    const newComments = new Map(comments);
    newComments.set(id, {
      ...comment,
      content,
      updatedAt: Date.now(),
    });
    set({ comments: newComments });
  },

  deleteComment: (id) => {
    const { comments } = get();
    const newComments = new Map(comments);

    // Delete comment and all its replies
    const toDelete = [id];
    comments.forEach((comment) => {
      if (comment.parentId === id) {
        toDelete.push(comment.id);
      }
    });

    toDelete.forEach((cid) => newComments.delete(cid));
    set({ comments: newComments });
  },

  resolveThread: (threadId, resolved) => {
    const { comments } = get();
    const comment = comments.get(threadId);
    if (!comment) return;

    const newComments = new Map(comments);
    newComments.set(threadId, {
      ...comment,
      resolved,
    });
    set({ comments: newComments });
  },

  getThreads: () => {
    const { comments } = get();
    const threads: CommentThread[] = [];
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

      threads.push({
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
    threads.sort((a, b) => b.rootComment.createdAt - a.rootComment.createdAt);

    return threads;
  },

  getThreadForShape: (shapeId) => {
    const threads = get().getThreads();
    return threads.find((t) => t.shapeId === shapeId) ?? null;
  },

  getCanvasThreads: () => {
    const threads = get().getThreads();
    return threads.filter((t) => t.shapeId === null && t.position);
  },

  openThread: (threadId) => {
    set({ activeThreadId: threadId, isPanelOpen: true });
  },

  closePanel: () => {
    set({ isPanelOpen: false, activeThreadId: null });
  },

  togglePanel: () => {
    const { isPanelOpen } = get();
    set({ isPanelOpen: !isPanelOpen });
  },

  setComments: (commentArray) => {
    const newComments = new Map<string, Comment>();
    commentArray.forEach((comment) => {
      newComments.set(comment.id, comment);
    });
    set({ comments: newComments });
  },

  getAllComments: () => {
    const { comments } = get();
    return Array.from(comments.values());
  },
}));
