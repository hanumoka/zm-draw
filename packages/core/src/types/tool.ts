import type { ShapeType, ExtendedShapeType } from './shape';

/** Tool types available in the editor */
export type ToolType = 'select' | 'connector' | 'pen' | 'marker' | 'highlighter' | 'eraser' | ShapeType;

/** Extended tool types for future use */
export type ExtendedToolType = 'select' | 'connector' | 'pen' | 'marker' | 'highlighter' | 'eraser' | ExtendedShapeType;

/** Alignment type */
export type AlignType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

/** Distribution type */
export type DistributeType = 'horizontal' | 'vertical';
