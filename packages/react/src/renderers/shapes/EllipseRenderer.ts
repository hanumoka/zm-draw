import Konva from 'konva';
import type { Shape } from '@zm-draw/core';
import type { ShapeRenderer, ShapeRendererContext } from '../ShapeRendererRegistry';

export const EllipseRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    return new Konva.Ellipse({
      x: shape.width / 2,
      y: shape.height / 2,
      radiusX: shape.width / 2,
      radiusY: shape.height / 2,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
    });
  },
};
