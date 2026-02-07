import Konva from 'konva';
import type { Shape, FreeDrawPoint } from '@zm-draw/core';
import type { ShapeRenderer, ShapeRendererContext } from '../ShapeRendererRegistry';

export const FreeDrawRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // Freedraw path using Line with tension
    const points = shape.points || [];
    const flatPoints: number[] = [];
    points.forEach((p: FreeDrawPoint) => {
      flatPoints.push(p.x, p.y);
    });
    return new Konva.Line({
      x: 0,
      y: 0,
      points: flatPoints,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      opacity: shape.opacity ?? 1,
      lineCap: shape.lineCap || 'round',
      lineJoin: 'round',
      tension: 0.5, // Smooth curves
      globalCompositeOperation: 'source-over',
    });
  },
};
