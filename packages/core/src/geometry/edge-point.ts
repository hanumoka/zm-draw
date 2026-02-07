import type { Shape, Point } from '../types';

/**
 * Get the center point of a shape
 */
export function getShapeCenter(shape: Shape): Point {
  return {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  };
}

/**
 * Get edge intersection point for a shape toward a target point.
 * Calculates where a line from shape center to targetPoint intersects the shape boundary.
 */
export function getShapeEdgePoint(shape: Shape, targetPoint: Point): Point {
  const center = getShapeCenter(shape);

  const dx = targetPoint.x - center.x;
  const dy = targetPoint.y - center.y;

  if (dx === 0 && dy === 0) {
    return center;
  }

  switch (shape.type) {
    case 'ellipse': {
      const rx = shape.width / 2;
      const ry = shape.height / 2;
      const angle = Math.atan2(dy, dx);
      return {
        x: center.x + rx * Math.cos(angle),
        y: center.y + ry * Math.sin(angle),
      };
    }

    case 'diamond': {
      const hw = shape.width / 2;
      const hh = shape.height / 2;
      const len = Math.sqrt(dx * dx + dy * dy);
      const ndx = dx / len;
      const ndy = dy / len;
      const absDx = Math.abs(ndx);
      const absDy = Math.abs(ndy);

      let t: number;
      if (absDx * hh + absDy * hw !== 0) {
        t = (hw * hh) / (absDx * hh + absDy * hw);
      } else {
        t = 0;
      }

      return {
        x: center.x + ndx * t,
        y: center.y + ndy * t,
      };
    }

    default: {
      // Rectangle-based shapes
      const hw = shape.width / 2;
      const hh = shape.height / 2;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      let t: number;
      if (absX * hh > absY * hw) {
        t = hw / absX;
      } else {
        t = hh / absY;
      }

      return {
        x: center.x + dx * t,
        y: center.y + dy * t,
      };
    }
  }
}
