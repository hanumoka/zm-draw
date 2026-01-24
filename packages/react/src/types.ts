// Shape types for zm-draw

export type ShapeType = 'rectangle' | 'ellipse' | 'diamond' | 'text';

export type ToolType = 'select' | ShapeType;

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

export interface CanvasState {
  shapes: Shape[];
  selectedId: string | null;
  tool: ToolType;
}
