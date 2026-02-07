import type { Shape } from './shape';
import type { Connector } from './connector';
import type { ToolType } from './tool';

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

/**
 * Point coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Bounding box
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
