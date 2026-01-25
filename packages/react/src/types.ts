// Shape types for zm-draw

/** Basic shape types */
export type ShapeType = 'rectangle' | 'ellipse' | 'diamond' | 'text';

/** Extended shape types for future use */
export type ExtendedShapeType = ShapeType | 'line' | 'polygon' | 'frame';

/** Tool types available in the editor */
export type ToolType = 'select' | 'connector' | ShapeType;

/** Extended tool types for future use */
export type ExtendedToolType = 'select' | 'connector' | ExtendedShapeType;

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
}

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
  /** Whether to show arrowhead */
  arrow: boolean;
  /** Line style (for future use) */
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  /** Label text on the connector (for future use) */
  label?: string;
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
