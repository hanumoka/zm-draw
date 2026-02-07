import Konva from 'konva';
import type { Shape } from '@zm-draw/core';
import type { ShapeRenderer, ShapeRendererContext } from '../ShapeRendererRegistry';

export const ImageRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // Image shape using Konva.Image
    const cachedImg = ctx.imageCache.get(shape.src || '');
    if (cachedImg && cachedImg.complete) {
      return new Konva.Image({
        x: 0,
        y: 0,
        width: shape.width,
        height: shape.height,
        image: cachedImg,
      });
    } else {
      // Placeholder while loading
      const placeholder = new Konva.Rect({
        x: 0,
        y: 0,
        width: shape.width,
        height: shape.height,
        fill: '#f3f4f6',
        stroke: '#d1d5db',
        strokeWidth: 1,
        dash: [4, 4],
      });
      // Add loading text
      const loadingText = new Konva.Text({
        x: 0,
        y: shape.height / 2 - 8,
        width: shape.width,
        text: 'Loading...',
        fontSize: 12,
        fill: '#9ca3af',
        align: 'center',
      });
      group.add(loadingText);

      // Load image asynchronously
      if (shape.src) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.imageCache.set(shape.src!, img);
          // Re-render shapes to show loaded image
          ctx.rerenderShapes();
        };
        img.src = shape.src;
      }
      return placeholder;
    }
  },
};
