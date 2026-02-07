import Konva from 'konva';
import type { Shape } from '@zm-draw/core';
import type { ShapeRenderer, ShapeRendererContext } from '../ShapeRendererRegistry';

export const SectionRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // FigJam-style section container with title
    const rect = new Konva.Rect({
      x: 0,
      y: 0,
      width: shape.width,
      height: shape.height,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      cornerRadius: shape.cornerRadius ?? 8,
    });
    // Add section title at the top-left
    const titleText = new Konva.Text({
      x: 12,
      y: -24,
      text: shape.sectionTitle || 'Section',
      fontSize: 14,
      fontFamily: 'Arial',
      fontStyle: 'bold',
      fill: '#6b7280',
    });
    group.add(titleText);
    return rect;
  },
};
