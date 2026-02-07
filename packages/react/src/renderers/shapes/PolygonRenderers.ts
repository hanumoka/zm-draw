import Konva from 'konva';
import type { Shape } from '@zm-draw/core';
import type { ShapeRenderer, ShapeRendererContext } from '../ShapeRendererRegistry';

export const TriangleRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // Equilateral-ish triangle pointing up
    return new Konva.Line({
      points: [
        shape.width / 2, 0,              // top center
        shape.width, shape.height,       // bottom right
        0, shape.height,                 // bottom left
      ],
      closed: true,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
    });
  },
};

export const TriangleDownRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // Triangle pointing down
    return new Konva.Line({
      points: [
        0, 0,                            // top left
        shape.width, 0,                  // top right
        shape.width / 2, shape.height,   // bottom center
      ],
      closed: true,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
    });
  },
};

export const RoundedRectangleRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // Rectangle with rounded corners
    return new Konva.Rect({
      x: 0,
      y: 0,
      width: shape.width,
      height: shape.height,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      cornerRadius: shape.cornerRadius ?? 12,
    });
  },
};

export const PentagonRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // Regular pentagon
    const w = shape.width;
    const h = shape.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2;
    const points: number[] = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI / 5) - Math.PI / 2; // Start from top
      points.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    }
    return new Konva.Line({
      points,
      closed: true,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
    });
  },
};

export const HexagonRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // Regular hexagon
    const w = shape.width;
    const h = shape.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2;
    const points: number[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 2 * Math.PI / 6) - Math.PI / 2; // Start from top
      points.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    }
    return new Konva.Line({
      points,
      closed: true,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
    });
  },
};

export const StarRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // 5-pointed star
    const w = shape.width;
    const h = shape.height;
    const cx = w / 2;
    const cy = h / 2;
    const outerR = Math.min(w, h) / 2;
    const innerR = outerR * 0.4; // Inner radius ratio
    const points: number[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI / 5) - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      points.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    }
    return new Konva.Line({
      points,
      closed: true,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
    });
  },
};

export const CrossRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // Plus/cross shape
    const w = shape.width;
    const h = shape.height;
    const armWidth = Math.min(w, h) * 0.33; // Width of arm
    const hOffset = (w - armWidth) / 2;
    const vOffset = (h - armWidth) / 2;
    return new Konva.Line({
      points: [
        hOffset, 0,                      // top-left of vertical arm
        hOffset + armWidth, 0,           // top-right of vertical arm
        hOffset + armWidth, vOffset,     // inner corner
        w, vOffset,                      // outer right of horizontal arm
        w, vOffset + armWidth,           // bottom of horizontal arm right
        hOffset + armWidth, vOffset + armWidth, // inner corner
        hOffset + armWidth, h,           // bottom of vertical arm
        hOffset, h,                      // bottom-left of vertical arm
        hOffset, vOffset + armWidth,     // inner corner
        0, vOffset + armWidth,           // left of horizontal arm
        0, vOffset,                      // top of horizontal arm left
        hOffset, vOffset,                // inner corner
      ],
      closed: true,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
    });
  },
};
