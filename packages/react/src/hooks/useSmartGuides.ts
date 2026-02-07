'use client';

import { useState, useCallback, useEffect } from 'react';
import Konva from 'konva';
import type { Shape } from '@zm-draw/core';
import { useEditorStore } from '../stores/editorStore';

/** Options for the useSmartGuides hook */
export interface UseSmartGuidesOptions {
  /** Reference to the Konva layer used for rendering guide lines */
  guidesLayerRef: React.RefObject<Konva.Layer | null>;
  /** Reference to the Konva stage (used for viewport-aware line extent) */
  stageRef?: React.RefObject<Konva.Stage | null>;
  /** Whether to display smart alignment guides (default: true) */
  showSmartGuides?: boolean;
  /** Whether to snap shapes to the detected guides (default: true) */
  snapToGuides?: boolean;
}

/** Shape position/size info needed for guide calculation */
export interface DraggingShapeInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
}

/** Active guide lines state */
export interface ActiveGuides {
  horizontal: number[];
  vertical: number[];
}

/** Snap result returned by calculateSmartGuides */
export interface SnapResult {
  x: number | null;
  y: number | null;
}

/** Smart guides threshold in pixels */
const GUIDE_THRESHOLD = 5;

/**
 * Hook that provides smart alignment guide logic for the drawing canvas.
 *
 * Extracts the guide calculation, rendering, and state management from
 * DrawCanvas.tsx. Compares a dragging shape's edges and center against
 * all other visible shapes to find alignment matches within a threshold,
 * then draws red dashed guide lines on a dedicated Konva layer.
 */
export function useSmartGuides(options: UseSmartGuidesOptions) {
  const {
    guidesLayerRef,
    stageRef,
    showSmartGuides = true,
    snapToGuides = true,
  } = options;

  const shapes = useEditorStore((s) => s.shapes);

  const [activeGuides, setActiveGuides] = useState<ActiveGuides>({
    horizontal: [],
    vertical: [],
  });

  /**
   * Calculate smart guides for a dragging shape.
   *
   * Compares the dragging shape's left/right/center (X) and top/bottom/center (Y)
   * edges against the same edges of every other visible shape. When an edge pair
   * is within GUIDE_THRESHOLD pixels, a guide line coordinate is recorded and
   * an optional snap position is returned.
   *
   * @returns An object containing:
   *   - `guides` - the horizontal and vertical guide line positions (deduplicated)
   *   - `snap`   - the snap position ({ x, y }), where null means no snap on that axis
   */
  const calculateSmartGuides = useCallback(
    (draggingShape: DraggingShapeInfo): { guides: ActiveGuides; snap: SnapResult } => {
      const horizontal: number[] = [];
      const vertical: number[] = [];
      let snapX: number | null = null;
      let snapY: number | null = null;

      // Dragging shape edges
      const dragLeft = draggingShape.x;
      const dragRight = draggingShape.x + draggingShape.width;
      const dragCenterX = draggingShape.x + draggingShape.width / 2;
      const dragTop = draggingShape.y;
      const dragBottom = draggingShape.y + draggingShape.height;
      const dragCenterY = draggingShape.y + draggingShape.height / 2;

      for (const shape of shapes) {
        if (shape.id === draggingShape.id || shape.visible === false) continue;

        // Other shape edges
        const left = shape.x;
        const right = shape.x + shape.width;
        const centerX = shape.x + shape.width / 2;
        const top = shape.y;
        const bottom = shape.y + shape.height;
        const centerY = shape.y + shape.height / 2;

        // --- Vertical alignment (X axis) ---

        // Left edge alignment
        if (Math.abs(dragLeft - left) < GUIDE_THRESHOLD) {
          vertical.push(left);
          if (snapToGuides && snapX === null) snapX = left;
        }
        if (Math.abs(dragLeft - right) < GUIDE_THRESHOLD) {
          vertical.push(right);
          if (snapToGuides && snapX === null) snapX = right;
        }
        if (Math.abs(dragLeft - centerX) < GUIDE_THRESHOLD) {
          vertical.push(centerX);
          if (snapToGuides && snapX === null) snapX = centerX;
        }

        // Right edge alignment
        if (Math.abs(dragRight - left) < GUIDE_THRESHOLD) {
          vertical.push(left);
          if (snapToGuides && snapX === null) snapX = left - draggingShape.width;
        }
        if (Math.abs(dragRight - right) < GUIDE_THRESHOLD) {
          vertical.push(right);
          if (snapToGuides && snapX === null) snapX = right - draggingShape.width;
        }
        if (Math.abs(dragRight - centerX) < GUIDE_THRESHOLD) {
          vertical.push(centerX);
          if (snapToGuides && snapX === null) snapX = centerX - draggingShape.width;
        }

        // Center X alignment
        if (Math.abs(dragCenterX - centerX) < GUIDE_THRESHOLD) {
          vertical.push(centerX);
          if (snapToGuides && snapX === null) snapX = centerX - draggingShape.width / 2;
        }
        if (Math.abs(dragCenterX - left) < GUIDE_THRESHOLD) {
          vertical.push(left);
          if (snapToGuides && snapX === null) snapX = left - draggingShape.width / 2;
        }
        if (Math.abs(dragCenterX - right) < GUIDE_THRESHOLD) {
          vertical.push(right);
          if (snapToGuides && snapX === null) snapX = right - draggingShape.width / 2;
        }

        // --- Horizontal alignment (Y axis) ---

        // Top edge alignment
        if (Math.abs(dragTop - top) < GUIDE_THRESHOLD) {
          horizontal.push(top);
          if (snapToGuides && snapY === null) snapY = top;
        }
        if (Math.abs(dragTop - bottom) < GUIDE_THRESHOLD) {
          horizontal.push(bottom);
          if (snapToGuides && snapY === null) snapY = bottom;
        }
        if (Math.abs(dragTop - centerY) < GUIDE_THRESHOLD) {
          horizontal.push(centerY);
          if (snapToGuides && snapY === null) snapY = centerY;
        }

        // Bottom edge alignment
        if (Math.abs(dragBottom - top) < GUIDE_THRESHOLD) {
          horizontal.push(top);
          if (snapToGuides && snapY === null) snapY = top - draggingShape.height;
        }
        if (Math.abs(dragBottom - bottom) < GUIDE_THRESHOLD) {
          horizontal.push(bottom);
          if (snapToGuides && snapY === null) snapY = bottom - draggingShape.height;
        }
        if (Math.abs(dragBottom - centerY) < GUIDE_THRESHOLD) {
          horizontal.push(centerY);
          if (snapToGuides && snapY === null) snapY = centerY - draggingShape.height;
        }

        // Center Y alignment
        if (Math.abs(dragCenterY - centerY) < GUIDE_THRESHOLD) {
          horizontal.push(centerY);
          if (snapToGuides && snapY === null) snapY = centerY - draggingShape.height / 2;
        }
        if (Math.abs(dragCenterY - top) < GUIDE_THRESHOLD) {
          horizontal.push(top);
          if (snapToGuides && snapY === null) snapY = top - draggingShape.height / 2;
        }
        if (Math.abs(dragCenterY - bottom) < GUIDE_THRESHOLD) {
          horizontal.push(bottom);
          if (snapToGuides && snapY === null) snapY = bottom - draggingShape.height / 2;
        }
      }

      const guides: ActiveGuides = {
        horizontal: [...new Set(horizontal)],
        vertical: [...new Set(vertical)],
      };

      setActiveGuides(guides);

      return {
        guides,
        snap: { x: snapX, y: snapY },
      };
    },
    [shapes, snapToGuides],
  );

  /**
   * Render smart guide lines on the dedicated guides layer.
   *
   * Draws red dashed lines (#f43f5e) for each active horizontal and vertical
   * guide. When a stageRef is provided, lines are scoped to the visible
   * viewport (plus a 1000px margin); otherwise a fixed GUIDE_LENGTH is used.
   * Line width and dash pattern are scaled inversely to the viewport zoom so
   * they appear consistent at any zoom level.
   */
  const renderGuideLines = useCallback(() => {
    const layer = guidesLayerRef.current;
    if (!layer) return;

    layer.destroyChildren();

    if (
      !showSmartGuides ||
      (activeGuides.horizontal.length === 0 && activeGuides.vertical.length === 0)
    ) {
      layer.batchDraw();
      return;
    }

    const stage = stageRef?.current;

    // If we have a stage reference, compute viewport-aware line extents
    if (stage) {
      const viewportScale = stage.scaleX();
      const viewportX = stage.x();
      const viewportY = stage.y();
      const width = stage.width();
      const height = stage.height();

      // Calculate visible area in canvas coordinates (with margin)
      const visibleLeft = -viewportX / viewportScale - 1000;
      const visibleRight = (width - viewportX) / viewportScale + 1000;
      const visibleTop = -viewportY / viewportScale - 1000;
      const visibleBottom = (height - viewportY) / viewportScale + 1000;

      // Draw horizontal guide lines
      activeGuides.horizontal.forEach((y) => {
        const line = new Konva.Line({
          points: [visibleLeft, y, visibleRight, y],
          stroke: '#f43f5e',
          strokeWidth: 1 / viewportScale,
          dash: [4 / viewportScale, 4 / viewportScale],
          listening: false,
        });
        layer.add(line);
      });

      // Draw vertical guide lines
      activeGuides.vertical.forEach((x) => {
        const line = new Konva.Line({
          points: [x, visibleTop, x, visibleBottom],
          stroke: '#f43f5e',
          strokeWidth: 1 / viewportScale,
          dash: [4 / viewportScale, 4 / viewportScale],
          listening: false,
        });
        layer.add(line);
      });
    } else {
      // Fallback: use a large fixed length when no stage ref is available
      const GUIDE_LENGTH = 100000;

      activeGuides.horizontal.forEach((y) => {
        const line = new Konva.Line({
          points: [-GUIDE_LENGTH, y, GUIDE_LENGTH, y],
          stroke: '#f43f5e',
          strokeWidth: 1,
          dash: [4, 4],
          listening: false,
        });
        layer.add(line);
      });

      activeGuides.vertical.forEach((x) => {
        const line = new Konva.Line({
          points: [x, -GUIDE_LENGTH, x, GUIDE_LENGTH],
          stroke: '#f43f5e',
          strokeWidth: 1,
          dash: [4, 4],
          listening: false,
        });
        layer.add(line);
      });
    }

    layer.batchDraw();
  }, [showSmartGuides, activeGuides, guidesLayerRef, stageRef]);

  // Re-render guide lines whenever activeGuides change
  useEffect(() => {
    renderGuideLines();
  }, [renderGuideLines]);

  /** Clear all active guides */
  const clearGuides = useCallback(() => {
    setActiveGuides({ horizontal: [], vertical: [] });
  }, []);

  return {
    /** Calculate guides for a shape being dragged; updates activeGuides state */
    calculateSmartGuides,
    /** Currently active guide line positions */
    activeGuides,
    /** Manually set active guides */
    setActiveGuides,
    /** Clear all guide lines */
    clearGuides,
    /** Force re-render guide lines (e.g. after viewport change) */
    renderGuideLines,
  };
}
