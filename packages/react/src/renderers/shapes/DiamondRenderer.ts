import Konva from 'konva';
import type { Shape } from '@zm-draw/core';
import type { ShapeRenderer, ShapeRendererContext } from '../ShapeRendererRegistry';

export const DiamondRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // Use Konva.Line for diamond to support non-square dimensions
    return new Konva.Line({
      points: [
        shape.width / 2, 0,              // top
        shape.width, shape.height / 2,   // right
        shape.width / 2, shape.height,   // bottom
        0, shape.height / 2,             // left
      ],
      closed: true,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
    });
  },
};
