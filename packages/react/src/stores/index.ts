// Zustand stores for zm-draw

// === Primary store (new unified store) ===
export { useEditorStore } from './editorStore';
export type { SelectionType, EditingCell } from './editorStore';
export {
  generateId,
  defaultShapeProps,
  defaultTextShapeProps,
  defaultStickyNoteProps,
  defaultFreeDrawProps,
  defaultImageShapeProps,
  defaultStampProps,
  defaultSectionProps,
  defaultTableProps,
  defaultMindmapProps,
  defaultEmbedProps,
} from './editorStore';

// === Legacy store re-exports (backwards compatibility) ===
// These delegate to the old individual stores which will be deprecated.
// New code should use useEditorStore directly.
export { useCanvasStore } from './canvasStore';
export { useSelectionStore } from './selectionStore';
export { useToolStore } from './toolStore';
export { useHistoryStore } from './historyStore';
export { useViewportStore } from './viewportStore';
export { useClipboardStore } from './clipboardStore';

// === Independent stores (not merged) ===
export { useCollaborationStore } from './collaborationStore';
export type { UserPresence, ConnectionStatus } from './collaborationStore';
export { useCommentStore } from './commentStore';
export { useSpotlightStore } from './spotlightStore';
export type { SpotlightState } from './spotlightStore';
export { useTemplateStore, builtInTemplates } from './templateStore';
