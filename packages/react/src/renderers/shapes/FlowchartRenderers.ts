import Konva from 'konva';
import type { Shape } from '@zm-draw/core';
import type { ShapeRenderer, ShapeRendererContext } from '../ShapeRendererRegistry';

export const ParallelogramRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // Flowchart parallelogram (data symbol)
    const w = shape.width;
    const h = shape.height;
    const skew = w * 0.2; // 20% skew
    return new Konva.Line({
      points: [
        skew, 0,           // top-left
        w, 0,              // top-right
        w - skew, h,       // bottom-right
        0, h,              // bottom-left
      ],
      closed: true,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
    });
  },
};

export const DatabaseRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // Flowchart database/cylinder shape
    const w = shape.width;
    const h = shape.height;
    const ellipseHeight = h * 0.15; // Height of top/bottom ellipse
    // Create a group with cylinder parts
    const cylinderGroup = new Konva.Group();
    // Bottom ellipse (visible arc)
    const bottomArc = new Konva.Ellipse({
      x: w / 2,
      y: h - ellipseHeight / 2,
      radiusX: w / 2,
      radiusY: ellipseHeight / 2,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
    });
    // Body rectangle (no stroke on sides that overlap)
    const body = new Konva.Rect({
      x: 0,
      y: ellipseHeight / 2,
      width: w,
      height: h - ellipseHeight,
      fill: shape.fill,
    });
    // Side lines
    const leftLine = new Konva.Line({
      points: [0, ellipseHeight / 2, 0, h - ellipseHeight / 2],
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
    });
    const rightLine = new Konva.Line({
      points: [w, ellipseHeight / 2, w, h - ellipseHeight / 2],
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
    });
    // Top ellipse
    const topEllipse = new Konva.Ellipse({
      x: w / 2,
      y: ellipseHeight / 2,
      radiusX: w / 2,
      radiusY: ellipseHeight / 2,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
    });
    cylinderGroup.add(bottomArc);
    cylinderGroup.add(body);
    cylinderGroup.add(leftLine);
    cylinderGroup.add(rightLine);
    cylinderGroup.add(topEllipse);
    group.add(cylinderGroup);
    // Use a transparent rect for hit detection
    return new Konva.Rect({
      x: 0,
      y: 0,
      width: w,
      height: h,
      fill: 'transparent',
    });
  },
};

export const DocumentRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // Flowchart document shape (rectangle with wavy bottom)
    const w = shape.width;
    const h = shape.height;
    const waveHeight = h * 0.1;
    // Use path-like approach with bezier
    const docGroup = new Konva.Group();
    // Main body with custom shape
    const docShape = new Konva.Shape({
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      sceneFunc: (ctx, shp) => {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w, 0);
        ctx.lineTo(w, h - waveHeight);
        // Wavy bottom
        ctx.quadraticCurveTo(w * 0.75, h - waveHeight * 2, w / 2, h - waveHeight);
        ctx.quadraticCurveTo(w * 0.25, h, 0, h - waveHeight);
        ctx.closePath();
        ctx.fillStrokeShape(shp);
      },
    });
    docGroup.add(docShape);
    group.add(docGroup);
    // Use a transparent rect for hit detection
    return new Konva.Rect({
      x: 0,
      y: 0,
      width: w,
      height: h,
      fill: 'transparent',
    });
  },
};
