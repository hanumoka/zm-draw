/**
 * Base shape configuration
 */
export interface ShapeConfig {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  draggable?: boolean;
  data?: Record<string, unknown>;
}

/**
 * Connector configuration
 */
export interface ConnectorConfig {
  id: string;
  type: 'line' | 'arrow' | 'curve';
  fromShapeId: string;
  toShapeId: string;
  fromAnchor?: AnchorPosition;
  toAnchor?: AnchorPosition;
  stroke?: string;
  strokeWidth?: number;
  label?: string;
}

/**
 * Anchor position on a shape
 */
export type AnchorPosition = 'top' | 'right' | 'bottom' | 'left' | 'center';

/**
 * Canvas configuration
 */
export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor?: string;
  gridSize?: number;
  showGrid?: boolean;
  snapToGrid?: boolean;
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
