import type { ConnectionPoint } from '../types';

/**
 * Calculate orthogonal (elbow) path between two points.
 * Returns flat array of [x1, y1, x2, y2, ...] coordinates.
 */
export function getOrthogonalPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  fromPoint?: ConnectionPoint,
  toPoint?: ConnectionPoint
): number[] {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  // Determine routing direction based on connection points
  if (fromPoint === 'left' || fromPoint === 'right' || toPoint === 'left' || toPoint === 'right') {
    // Horizontal first, then vertical
    return [from.x, from.y, midX, from.y, midX, to.y, to.x, to.y];
  } else if (fromPoint === 'top' || fromPoint === 'bottom' || toPoint === 'top' || toPoint === 'bottom') {
    // Vertical first, then horizontal
    return [from.x, from.y, from.x, midY, to.x, midY, to.x, to.y];
  } else {
    // Auto: choose based on distance
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);

    if (dx > dy) {
      return [from.x, from.y, midX, from.y, midX, to.y, to.x, to.y];
    } else {
      return [from.x, from.y, from.x, midY, to.x, midY, to.x, to.y];
    }
  }
}
