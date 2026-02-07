import Konva from 'konva';
import type { Shape } from '@zm-draw/core';
import type { ShapeRenderer, ShapeRendererContext } from '../ShapeRendererRegistry';

export const StickyNoteRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // FigJam-style sticky note with shadow
    return new Konva.Rect({
      x: 0,
      y: 0,
      width: shape.width,
      height: shape.height,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      cornerRadius: shape.cornerRadius ?? 2,
      shadowColor: '#000000',
      shadowBlur: 8,
      shadowOffset: { x: 2, y: 3 },
      shadowOpacity: 0.15,
    });
  },
};
