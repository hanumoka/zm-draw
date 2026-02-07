import Konva from 'konva';
import type { Shape } from '@zm-draw/core';
import { getShapeRenderer, type ShapeRendererContext } from './ShapeRendererRegistry';

export function renderShape(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
  const renderer = getShapeRenderer(shape.type);
  if (renderer) {
    return renderer.render(shape, group, ctx);
  }
  // Default: rectangle
  return new Konva.Rect({
    x: 0,
    y: 0,
    width: shape.width,
    height: shape.height,
    fill: shape.fill,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    cornerRadius: shape.cornerRadius ?? 0,
  });
}
