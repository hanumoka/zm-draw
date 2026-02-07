import type { Shape } from '../types';

/**
 * Check if a shape intersects with a rectangular viewport area.
 * Used for viewport culling optimization.
 */
export function isShapeInViewport(
  shape: Shape,
  viewLeft: number,
  viewTop: number,
  viewRight: number,
  viewBottom: number
): boolean {
  const shapeRight = shape.x + shape.width;
  const shapeBottom = shape.y + shape.height;

  return !(shape.x > viewRight || shapeRight < viewLeft ||
           shape.y > viewBottom || shapeBottom < viewTop);
}
