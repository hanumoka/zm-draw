// Shape types for zm-draw

/** Basic shape types */
export type ShapeType = 'rectangle' | 'ellipse' | 'diamond' | 'text' | 'sticky' | 'freedraw' | 'image' | 'stamp';

/** Extended shape types for future use */
export type ExtendedShapeType = ShapeType | 'line' | 'polygon' | 'frame';

/** Tool types available in the editor */
export type ToolType = 'select' | 'connector' | 'pen' | 'marker' | 'highlighter' | 'eraser' | ShapeType;

/** Extended tool types for future use */
export type ExtendedToolType = 'select' | 'connector' | 'pen' | 'marker' | 'highlighter' | 'eraser' | ExtendedShapeType;

/** Sticky note color presets (FigJam style) */
export type StickyNoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange';

/** Sticky note color hex values */
export const STICKY_COLORS: Record<StickyNoteColor, string> = {
  yellow: '#fef08a',
  pink: '#fda4af',
  blue: '#93c5fd',
  green: '#86efac',
  purple: '#c4b5fd',
  orange: '#fed7aa',
};

/** Point in a free-draw path */
export interface FreeDrawPoint {
  x: number;
  y: number;
}

/** Drawing tool type */
export type DrawingToolType = 'pen' | 'marker' | 'highlighter';

/** Stamp types (FigJam style reactions) */
export type StampType = 'thumbsUp' | 'thumbsDown' | 'heart' | 'star' | 'check' | 'question' | 'exclamation' | 'celebration';

/** Stamp emoji mapping */
export const STAMP_EMOJIS: Record<StampType, string> = {
  thumbsUp: '👍',
  thumbsDown: '👎',
  heart: '❤️',
  star: '⭐',
  check: '✅',
  question: '❓',
  exclamation: '❗',
  celebration: '🎉',
};

/**
 * Shape object representing a drawable element on the canvas
 */
export interface Shape {
  /** Unique identifier */
  id: string;
  /** Shape type */
  type: ShapeType;
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Fill color (hex or rgba) */
  fill: string;
  /** Stroke color (hex or rgba) */
  stroke: string;
  /** Stroke width in pixels */
  strokeWidth: number;
  /** Rotation in degrees */
  rotation?: number;
  /** Text content (for shapes with text) */
  text?: string;
  /** Font size in pixels */
  fontSize?: number;
  /** Font family name */
  fontFamily?: string;
  /** Text color (hex or rgba) */
  textColor?: string;
  /** Text horizontal alignment */
  textAlign?: 'left' | 'center' | 'right';
  /** Text vertical alignment */
  verticalAlign?: 'top' | 'middle' | 'bottom';
  /** Whether the shape is locked (cannot be selected/moved) */
  locked?: boolean;
  /** Whether the shape is visible */
  visible?: boolean;
  /** Custom name for the shape (displayed in layers panel) */
  name?: string;
  /** Opacity (0-1) */
  opacity?: number;
  /** Corner radius for rectangles */
  cornerRadius?: number;
  /** Group ID if shape belongs to a group */
  groupId?: string;
  /** Points for freedraw shapes */
  points?: FreeDrawPoint[];
  /** Sticky note specific color name */
  stickyColor?: StickyNoteColor;
  /** Line cap style for freedraw */
  lineCap?: 'round' | 'square' | 'butt';
  /** Author name (for sticky notes) */
  author?: string;
  /** Image source - base64 data URL or external URL (for image shapes) */
  src?: string;
  /** Original image width in pixels (for image shapes) */
  naturalWidth?: number;
  /** Original image height in pixels (for image shapes) */
  naturalHeight?: number;
  /** Whether to preserve aspect ratio when resizing (for image shapes) */
  preserveAspectRatio?: boolean;
  /** Stamp type for stamp shapes */
  stampType?: StampType;
}

/** Connection point position on a shape */
export type ConnectionPoint = 'top' | 'right' | 'bottom' | 'left' | 'auto';

/** Arrow head type */
export type ArrowType = 'none' | 'arrow' | 'triangle' | 'diamond' | 'circle';

/** Connector routing type */
export type RoutingType = 'straight' | 'orthogonal';

/**
 * Connector object representing a line/arrow between two shapes
 */
export interface Connector {
  /** Unique identifier */
  id: string;
  /** ID of the source shape */
  fromShapeId: string;
  /** ID of the target shape */
  toShapeId: string;
  /** Line color (hex or rgba) */
  stroke: string;
  /** Line width in pixels */
  strokeWidth: number;
  /** Whether to show arrowhead (deprecated: use arrowEnd) */
  arrow: boolean;
  /** Line style */
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  /** Label text on the connector */
  label?: string;
  /** Connection point on source shape */
  fromPoint?: ConnectionPoint;
  /** Connection point on target shape */
  toPoint?: ConnectionPoint;
  /** Arrow type at start */
  arrowStart?: ArrowType;
  /** Arrow type at end */
  arrowEnd?: ArrowType;
  /** Routing type */
  routing?: RoutingType;
}

/**
 * Canvas state for serialization/deserialization
 */
export interface CanvasState {
  /** All shapes on the canvas */
  shapes: Shape[];
  /** All connectors on the canvas */
  connectors: Connector[];
  /** Currently selected shape ID (deprecated: use selectedIds) */
  selectedId: string | null;
  /** Currently selected shape IDs (for multi-select) */
  selectedIds?: string[];
  /** Current active tool */
  tool: ToolType;
}

/**
 * Viewport state for pan/zoom
 */
export interface ViewportState {
  /** Current zoom scale (1 = 100%) */
  scale: number;
  /** X offset for panning */
  offsetX: number;
  /** Y offset for panning */
  offsetY: number;
}

/**
 * History entry for undo/redo
 */
export interface HistoryEntry {
  /** Shapes at this point in history */
  shapes: Shape[];
  /** Connectors at this point in history */
  connectors: Connector[];
  /** Timestamp of this entry */
  timestamp?: number;
}
