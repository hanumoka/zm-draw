// Re-export all types from @zm-draw/core
// This file is kept for backwards compatibility - all types now live in @zm-draw/core

export type {
  ShapeType,
  ExtendedShapeType,
  StickyNoteColor,
  SectionColor,
  StampType,
  DrawingToolType,
  FreeDrawPoint,
  TableCell,
  TableData,
  MindmapNode,
  MindmapData,
  EmbedData,
  Shape,
  ConnectionPoint,
  ArrowType,
  RoutingType,
  ConnectorVariant,
  Connector,
  CanvasState,
  ViewportState,
  HistoryEntry,
  Point,
  BoundingBox,
  ToolType,
  ExtendedToolType,
  AlignType,
  DistributeType,
  Comment,
  CommentThread,
  TemplateCategory,
  Template,
} from '@zm-draw/core';

export {
  STICKY_COLORS,
  SECTION_COLORS,
  STAMP_EMOJIS,
} from '@zm-draw/core';
