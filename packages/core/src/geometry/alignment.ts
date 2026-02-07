import type { Shape, AlignType, DistributeType } from '../types';

/**
 * Calculate aligned positions for shapes.
 * Returns a map of shape ID to partial shape updates.
 */
export function alignShapes(
  shapes: Shape[],
  type: AlignType
): Record<string, Partial<Shape>> {
  if (shapes.length < 2) return {};

  const bounds = {
    left: Math.min(...shapes.map(s => s.x)),
    right: Math.max(...shapes.map(s => s.x + s.width)),
    top: Math.min(...shapes.map(s => s.y)),
    bottom: Math.max(...shapes.map(s => s.y + s.height)),
  };

  const updates: Record<string, Partial<Shape>> = {};

  shapes.forEach(shape => {
    switch (type) {
      case 'left':
        updates[shape.id] = { x: bounds.left };
        break;
      case 'center':
        updates[shape.id] = { x: (bounds.left + bounds.right) / 2 - shape.width / 2 };
        break;
      case 'right':
        updates[shape.id] = { x: bounds.right - shape.width };
        break;
      case 'top':
        updates[shape.id] = { y: bounds.top };
        break;
      case 'middle':
        updates[shape.id] = { y: (bounds.top + bounds.bottom) / 2 - shape.height / 2 };
        break;
      case 'bottom':
        updates[shape.id] = { y: bounds.bottom - shape.height };
        break;
    }
  });

  return updates;
}

/**
 * Calculate evenly distributed positions for shapes.
 * Returns a map of shape ID to partial shape updates.
 */
export function distributeShapes(
  shapes: Shape[],
  type: DistributeType
): Record<string, Partial<Shape>> {
  if (shapes.length < 3) return {};

  const updates: Record<string, Partial<Shape>> = {};

  if (type === 'horizontal') {
    const sorted = [...shapes].sort((a, b) => a.x - b.x);
    const totalWidth = sorted.reduce((sum, s) => sum + s.width, 0);
    const left = sorted[0].x;
    const right = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width;
    const space = (right - left - totalWidth) / (sorted.length - 1);

    let currentX = left;
    sorted.forEach((shape, i) => {
      if (i > 0) {
        updates[shape.id] = { x: currentX };
      }
      currentX += shape.width + space;
    });
  } else {
    const sorted = [...shapes].sort((a, b) => a.y - b.y);
    const totalHeight = sorted.reduce((sum, s) => sum + s.height, 0);
    const top = sorted[0].y;
    const bottom = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
    const space = (bottom - top - totalHeight) / (sorted.length - 1);

    let currentY = top;
    sorted.forEach((shape, i) => {
      if (i > 0) {
        updates[shape.id] = { y: currentY };
      }
      currentY += shape.height + space;
    });
  }

  return updates;
}

interface SmartGuideResult {
  guides: { horizontal: number[]; vertical: number[] };
  snap: { x: number | null; y: number | null };
}

/**
 * Calculate smart alignment guides for a dragging shape.
 */
export function calculateSmartGuides(
  draggingShape: { x: number; y: number; width: number; height: number; id: string },
  allShapes: Shape[],
  threshold: number = 5,
  snapToGuides: boolean = true
): SmartGuideResult {
  const horizontal: number[] = [];
  const vertical: number[] = [];
  let snapX: number | null = null;
  let snapY: number | null = null;

  const dragLeft = draggingShape.x;
  const dragRight = draggingShape.x + draggingShape.width;
  const dragCenterX = draggingShape.x + draggingShape.width / 2;
  const dragTop = draggingShape.y;
  const dragBottom = draggingShape.y + draggingShape.height;
  const dragCenterY = draggingShape.y + draggingShape.height / 2;

  for (const shape of allShapes) {
    if (shape.id === draggingShape.id || shape.visible === false) continue;

    const left = shape.x;
    const right = shape.x + shape.width;
    const centerX = shape.x + shape.width / 2;
    const top = shape.y;
    const bottom = shape.y + shape.height;
    const centerY = shape.y + shape.height / 2;

    // Vertical alignment (X axis)
    if (Math.abs(dragLeft - left) < threshold) {
      vertical.push(left);
      if (snapToGuides && snapX === null) snapX = left;
    }
    if (Math.abs(dragLeft - right) < threshold) {
      vertical.push(right);
      if (snapToGuides && snapX === null) snapX = right;
    }
    if (Math.abs(dragLeft - centerX) < threshold) {
      vertical.push(centerX);
      if (snapToGuides && snapX === null) snapX = centerX;
    }
    if (Math.abs(dragRight - left) < threshold) {
      vertical.push(left);
      if (snapToGuides && snapX === null) snapX = left - draggingShape.width;
    }
    if (Math.abs(dragRight - right) < threshold) {
      vertical.push(right);
      if (snapToGuides && snapX === null) snapX = right - draggingShape.width;
    }
    if (Math.abs(dragRight - centerX) < threshold) {
      vertical.push(centerX);
      if (snapToGuides && snapX === null) snapX = centerX - draggingShape.width;
    }
    if (Math.abs(dragCenterX - centerX) < threshold) {
      vertical.push(centerX);
      if (snapToGuides && snapX === null) snapX = centerX - draggingShape.width / 2;
    }
    if (Math.abs(dragCenterX - left) < threshold) {
      vertical.push(left);
      if (snapToGuides && snapX === null) snapX = left - draggingShape.width / 2;
    }
    if (Math.abs(dragCenterX - right) < threshold) {
      vertical.push(right);
      if (snapToGuides && snapX === null) snapX = right - draggingShape.width / 2;
    }

    // Horizontal alignment (Y axis)
    if (Math.abs(dragTop - top) < threshold) {
      horizontal.push(top);
      if (snapToGuides && snapY === null) snapY = top;
    }
    if (Math.abs(dragTop - bottom) < threshold) {
      horizontal.push(bottom);
      if (snapToGuides && snapY === null) snapY = bottom;
    }
    if (Math.abs(dragTop - centerY) < threshold) {
      horizontal.push(centerY);
      if (snapToGuides && snapY === null) snapY = centerY;
    }
    if (Math.abs(dragBottom - top) < threshold) {
      horizontal.push(top);
      if (snapToGuides && snapY === null) snapY = top - draggingShape.height;
    }
    if (Math.abs(dragBottom - bottom) < threshold) {
      horizontal.push(bottom);
      if (snapToGuides && snapY === null) snapY = bottom - draggingShape.height;
    }
    if (Math.abs(dragBottom - centerY) < threshold) {
      horizontal.push(centerY);
      if (snapToGuides && snapY === null) snapY = centerY - draggingShape.height;
    }
    if (Math.abs(dragCenterY - centerY) < threshold) {
      horizontal.push(centerY);
      if (snapToGuides && snapY === null) snapY = centerY - draggingShape.height / 2;
    }
    if (Math.abs(dragCenterY - top) < threshold) {
      horizontal.push(top);
      if (snapToGuides && snapY === null) snapY = top - draggingShape.height / 2;
    }
    if (Math.abs(dragCenterY - bottom) < threshold) {
      horizontal.push(bottom);
      if (snapToGuides && snapY === null) snapY = bottom - draggingShape.height / 2;
    }
  }

  return {
    guides: { horizontal: [...new Set(horizontal)], vertical: [...new Set(vertical)] },
    snap: { x: snapX, y: snapY },
  };
}
