import type { Shape } from '../types';

/**
 * Layout types for Tidy Up feature
 */
export type TidyUpLayout = 'grid' | 'horizontal' | 'vertical' | 'circle';

interface TidyUpOptions {
  /** Layout type */
  layout: TidyUpLayout;
  /** Gap between shapes */
  gap?: number;
  /** Whether to center the result */
  center?: boolean;
  /** Starting X position (if not centering) */
  startX?: number;
  /** Starting Y position (if not centering) */
  startY?: number;
  /** Number of columns for grid layout */
  columns?: number;
}

/**
 * Calculate bounding box of shapes
 */
function getBoundingBox(shapes: Shape[]) {
  if (shapes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  shapes.forEach((shape) => {
    minX = Math.min(minX, shape.x);
    minY = Math.min(minY, shape.y);
    maxX = Math.max(maxX, shape.x + shape.width);
    maxY = Math.max(maxY, shape.y + shape.height);
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

/**
 * Tidy up shapes in a grid layout
 */
function tidyUpGrid(shapes: Shape[], options: TidyUpOptions): Shape[] {
  const { gap = 20, center = true, columns = Math.ceil(Math.sqrt(shapes.length)) } = options;
  const bbox = getBoundingBox(shapes);

  // Sort shapes by their current position (top-left to bottom-right)
  const sortedShapes = [...shapes].sort((a, b) => {
    const rowDiff = Math.floor(a.y / 100) - Math.floor(b.y / 100);
    if (rowDiff !== 0) return rowDiff;
    return a.x - b.x;
  });

  // Calculate max width and height per cell
  const maxWidth = Math.max(...shapes.map((s) => s.width));
  const maxHeight = Math.max(...shapes.map((s) => s.height));

  // Calculate grid dimensions
  const rows = Math.ceil(shapes.length / columns);
  const totalWidth = columns * maxWidth + (columns - 1) * gap;
  const totalHeight = rows * maxHeight + (rows - 1) * gap;

  // Calculate start position
  let startX = options.startX ?? 0;
  let startY = options.startY ?? 0;

  if (center) {
    startX = bbox.centerX - totalWidth / 2;
    startY = bbox.centerY - totalHeight / 2;
  }

  // Position each shape
  return sortedShapes.map((shape, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);

    // Center each shape within its cell
    const cellX = startX + col * (maxWidth + gap);
    const cellY = startY + row * (maxHeight + gap);
    const offsetX = (maxWidth - shape.width) / 2;
    const offsetY = (maxHeight - shape.height) / 2;

    return {
      ...shape,
      x: Math.round(cellX + offsetX),
      y: Math.round(cellY + offsetY),
    };
  });
}

/**
 * Tidy up shapes in a horizontal row
 */
function tidyUpHorizontal(shapes: Shape[], options: TidyUpOptions): Shape[] {
  const { gap = 20, center = true } = options;
  const bbox = getBoundingBox(shapes);

  // Sort shapes by their current X position
  const sortedShapes = [...shapes].sort((a, b) => a.x - b.x);

  // Calculate total width
  const totalWidth = shapes.reduce((sum, s) => sum + s.width, 0) + (shapes.length - 1) * gap;
  const maxHeight = Math.max(...shapes.map((s) => s.height));

  // Calculate start position
  let startX = options.startX ?? 0;
  let startY = options.startY ?? 0;

  if (center) {
    startX = bbox.centerX - totalWidth / 2;
    startY = bbox.centerY - maxHeight / 2;
  }

  // Position each shape
  let currentX = startX;
  return sortedShapes.map((shape) => {
    const newShape = {
      ...shape,
      x: Math.round(currentX),
      y: Math.round(startY + (maxHeight - shape.height) / 2),
    };
    currentX += shape.width + gap;
    return newShape;
  });
}

/**
 * Tidy up shapes in a vertical column
 */
function tidyUpVertical(shapes: Shape[], options: TidyUpOptions): Shape[] {
  const { gap = 20, center = true } = options;
  const bbox = getBoundingBox(shapes);

  // Sort shapes by their current Y position
  const sortedShapes = [...shapes].sort((a, b) => a.y - b.y);

  // Calculate total height
  const totalHeight = shapes.reduce((sum, s) => sum + s.height, 0) + (shapes.length - 1) * gap;
  const maxWidth = Math.max(...shapes.map((s) => s.width));

  // Calculate start position
  let startX = options.startX ?? 0;
  let startY = options.startY ?? 0;

  if (center) {
    startX = bbox.centerX - maxWidth / 2;
    startY = bbox.centerY - totalHeight / 2;
  }

  // Position each shape
  let currentY = startY;
  return sortedShapes.map((shape) => {
    const newShape = {
      ...shape,
      x: Math.round(startX + (maxWidth - shape.width) / 2),
      y: Math.round(currentY),
    };
    currentY += shape.height + gap;
    return newShape;
  });
}

/**
 * Tidy up shapes in a circle
 */
function tidyUpCircle(shapes: Shape[], options: TidyUpOptions): Shape[] {
  const { gap = 20, center = true } = options;
  const bbox = getBoundingBox(shapes);

  if (shapes.length === 0) return shapes;
  if (shapes.length === 1) return shapes;

  // Calculate average shape size for radius
  const avgWidth = shapes.reduce((sum, s) => sum + s.width, 0) / shapes.length;
  const avgHeight = shapes.reduce((sum, s) => sum + s.height, 0) / shapes.length;
  const avgSize = (avgWidth + avgHeight) / 2;

  // Calculate radius based on number of shapes
  const circumference = shapes.length * (avgSize + gap);
  const radius = circumference / (2 * Math.PI);

  // Calculate center
  const centerX = center ? bbox.centerX : (options.startX ?? 0) + radius;
  const centerY = center ? bbox.centerY : (options.startY ?? 0) + radius;

  // Position each shape around the circle
  const angleStep = (2 * Math.PI) / shapes.length;
  return shapes.map((shape, index) => {
    const angle = index * angleStep - Math.PI / 2; // Start from top
    const x = centerX + radius * Math.cos(angle) - shape.width / 2;
    const y = centerY + radius * Math.sin(angle) - shape.height / 2;

    return {
      ...shape,
      x: Math.round(x),
      y: Math.round(y),
    };
  });
}

/**
 * Tidy up shapes according to the specified layout
 *
 * @param shapes - Array of shapes to arrange
 * @param options - Layout options
 * @returns Array of shapes with updated positions
 */
export function tidyUp(shapes: Shape[], options: TidyUpOptions): Shape[] {
  if (shapes.length <= 1) return shapes;

  switch (options.layout) {
    case 'grid':
      return tidyUpGrid(shapes, options);
    case 'horizontal':
      return tidyUpHorizontal(shapes, options);
    case 'vertical':
      return tidyUpVertical(shapes, options);
    case 'circle':
      return tidyUpCircle(shapes, options);
    default:
      return shapes;
  }
}

/**
 * Auto-detect the best layout based on current shape arrangement
 */
export function detectBestLayout(shapes: Shape[]): TidyUpLayout {
  if (shapes.length <= 2) return 'horizontal';

  const bbox = getBoundingBox(shapes);
  const aspectRatio = bbox.width / bbox.height;

  if (aspectRatio > 2) return 'horizontal';
  if (aspectRatio < 0.5) return 'vertical';
  return 'grid';
}
