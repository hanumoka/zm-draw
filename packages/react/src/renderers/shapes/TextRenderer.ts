import Konva from 'konva';
import type { Shape } from '@zm-draw/core';
import type { ShapeRenderer, ShapeRendererContext } from '../ShapeRendererRegistry';

export const TextRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // Standalone text shape - no background, just text
    return new Konva.Text({
      x: 0,
      y: 0,
      width: shape.width,
      height: shape.height,
      text: shape.text || 'Text',
      fontSize: shape.fontSize || 16,
      fontFamily: shape.fontFamily || 'Arial',
      fill: shape.textColor || shape.fill || '#000000',
      align: shape.textAlign || 'left',
      verticalAlign: shape.verticalAlign || 'top',
    });
  },
};
