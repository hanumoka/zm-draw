import type { Shape, Point, ConnectionPoint } from '../types';
import { getShapeCenter, getShapeEdgePoint } from './edge-point';

/**
 * Get all 4 connection points for a shape
 */
export function getConnectionPoints(shape: Shape): Record<'top' | 'right' | 'bottom' | 'left', Point> {
  const center = getShapeCenter(shape);
  return {
    top: { x: center.x, y: shape.y },
    right: { x: shape.x + shape.width, y: center.y },
    bottom: { x: center.x, y: shape.y + shape.height },
    left: { x: shape.x, y: center.y },
  };
}

/**
 * Get a specific connection point on a shape.
 * If point is 'auto', calculates the edge point toward the targetShape.
 */
export function getConnectionPoint(
  shape: Shape,
  point: ConnectionPoint,
  targetShape?: Shape
): Point {
  const center = getShapeCenter(shape);

  if (point === 'auto' && targetShape) {
    const targetCenter = getShapeCenter(targetShape);
    return getShapeEdgePoint(shape, targetCenter);
  }

  switch (point) {
    case 'top':
      return { x: center.x, y: shape.y };
    case 'right':
      return { x: shape.x + shape.width, y: center.y };
    case 'bottom':
      return { x: center.x, y: shape.y + shape.height };
    case 'left':
      return { x: shape.x, y: center.y };
    default:
      return center;
  }
}
