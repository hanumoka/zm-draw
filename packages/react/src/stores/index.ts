// Zustand stores for zm-draw

export { useCanvasStore, generateId, defaultShapeProps, defaultTextShapeProps, defaultStickyNoteProps, defaultFreeDrawProps, defaultSectionProps, defaultTableProps, defaultMindmapProps, defaultEmbedProps } from './canvasStore';
export { useSelectionStore } from './selectionStore';
export { useToolStore } from './toolStore';
export type { EditingCell } from './toolStore';
export { useHistoryStore } from './historyStore';
export { useViewportStore } from './viewportStore';
export { useClipboardStore } from './clipboardStore';
export { useCollaborationStore } from './collaborationStore';
export type { UserPresence, ConnectionStatus } from './collaborationStore';
export { useCommentStore } from './commentStore';
export { useSpotlightStore } from './spotlightStore';
export type { SpotlightState } from './spotlightStore';
export { useTemplateStore, builtInTemplates } from './templateStore';
