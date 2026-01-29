// Zustand stores for zm-draw

export { useCanvasStore, generateId, defaultShapeProps, defaultTextShapeProps, defaultStickyNoteProps, defaultFreeDrawProps } from './canvasStore';
export { useSelectionStore } from './selectionStore';
export { useToolStore } from './toolStore';
export { useHistoryStore } from './historyStore';
export { useViewportStore } from './viewportStore';
export { useClipboardStore } from './clipboardStore';
export { useCollaborationStore } from './collaborationStore';
export type { UserPresence, ConnectionStatus } from './collaborationStore';
export { useCommentStore } from './commentStore';
