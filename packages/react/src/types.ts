// Shape types for zm-draw

export type ShapeType = 'rectangle' | 'ellipse' | 'diamond' | 'text';

export type ToolType = 'select' | 'connector' | ShapeType;

export interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation?: number;
  text?: string;
}

export interface Connector {
  id: string;
  fromShapeId: string;
  toShapeId: string;
  stroke: string;
  strokeWidth: number;
  arrow: boolean;
}

export interface CanvasState {
  shapes: Shape[];
  connectors: Connector[];
  selectedId: string | null;
  tool: ToolType;
}
