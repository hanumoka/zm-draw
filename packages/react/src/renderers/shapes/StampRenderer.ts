import Konva from 'konva';
import type { Shape } from '@zm-draw/core';
import { STAMP_EMOJIS } from '@zm-draw/core';
import type { ShapeRenderer, ShapeRendererContext } from '../ShapeRendererRegistry';

export const StampRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // Stamp shape using emoji text
    const emoji = STAMP_EMOJIS[shape.stampType || 'thumbsUp'];
    return new Konva.Text({
      x: 0,
      y: 0,
      width: shape.width,
      height: shape.height,
      text: emoji,
      fontSize: Math.min(shape.width, shape.height) * 0.8,
      fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
      align: 'center',
      verticalAlign: 'middle',
    });
  },
};
