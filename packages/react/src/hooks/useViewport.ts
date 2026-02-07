'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Konva from 'konva';
import type { Shape } from '@zm-draw/core';
import { useEditorStore } from '../stores/editorStore';

/**
 * Options for the useViewport hook.
 */
interface UseViewportOptions {
  /** Reference to the Konva Stage instance */
  stageRef: React.RefObject<Konva.Stage | null>;
  /** Reference to the container div element */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Reference to the background Konva Layer */
  bgLayerRef: React.RefObject<Konva.Layer | null>;
  /** Reference to the grid Konva Layer */
  gridLayerRef: React.RefObject<Konva.Layer | null>;
  /** Background color for the canvas */
  backgroundColor?: string;
  /** Whether to show the grid */
  showGrid?: boolean;
  /** Grid spacing in pixels */
  gridSize?: number;
  /** Callback when the viewport changes (zoom/pan) */
  onViewportChange?: (viewport: { scale: number; position: { x: number; y: number } }) => void;
}

/**
 * Hook that manages viewport operations: zoom, pan, resize, grid, and background rendering.
 *
 * Extracts viewport management logic from DrawCanvas.tsx and uses the unified
 * editorStore for scale/position/isPanning state.
 */
export function useViewport(options: UseViewportOptions) {
  const {
    stageRef,
    containerRef,
    bgLayerRef,
    gridLayerRef,
    backgroundColor = '#f5f5f5',
    showGrid = true,
    gridSize = 20,
    onViewportChange,
  } = options;

  // Viewport state from unified editor store
  const scale = useEditorStore((s) => s.scale);
  const position = useEditorStore((s) => s.position);
  const isPanning = useEditorStore((s) => s.isPanning);
  const setScale = useEditorStore((s) => s.setScale);
  const setPosition = useEditorStore((s) => s.setPosition);
  const setIsPanning = useEditorStore((s) => s.setIsPanning);
  const resetViewportStore = useEditorStore((s) => s.resetViewport);

  // Shapes for zoomToFit calculation
  const shapes = useEditorStore((s) => s.shapes);

  // Local state
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const gridShapeRef = useRef<Konva.Shape | null>(null);

  // ── Grid rendering ────────────────────────────────────────────────────────

  /**
   * Draw an infinite dotted grid (FigJam style).
   * Uses a single Konva.Shape with sceneFunc for performance
   * instead of creating thousands of individual Circle nodes.
   */
  const drawInfiniteGrid = useCallback(() => {
    const layer = gridLayerRef.current;
    const stage = stageRef.current;
    if (!layer || !stage) return;

    // FigJam style: subtle dots - 10% opacity black on light, 8% white on dark
    const isDark =
      backgroundColor.startsWith('#') &&
      parseInt(backgroundColor.slice(1, 3), 16) < 128;
    const gridColor = isDark
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.1)';

    // Remove existing grid shape if any
    if (gridShapeRef.current) {
      gridShapeRef.current.destroy();
      gridShapeRef.current = null;
    }

    // Create a single shape that draws all dots using sceneFunc
    const gridShape = new Konva.Shape({
      sceneFunc: (context, shape) => {
        const stageInstance = shape.getStage();
        if (!stageInstance) return;

        const stagePos = stageInstance.position();
        const stageScale = stageInstance.scaleX();
        const viewportWidth = stageInstance.width();
        const viewportHeight = stageInstance.height();

        const startX = -stagePos.x / stageScale;
        const startY = -stagePos.y / stageScale;
        const endX = startX + viewportWidth / stageScale;
        const endY = startY + viewportHeight / stageScale;

        // FigJam: adjust grid size based on zoom level
        let effectiveGridSize = gridSize;
        if (stageScale < 0.3) effectiveGridSize = gridSize * 4;
        else if (stageScale < 0.5) effectiveGridSize = gridSize * 2;
        else if (stageScale > 2) effectiveGridSize = gridSize / 2;

        // Calculate grid dot positions
        const firstX =
          Math.floor(startX / effectiveGridSize) * effectiveGridSize;
        const firstY =
          Math.floor(startY / effectiveGridSize) * effectiveGridSize;

        // FigJam style: small subtle dots (1px at 100% zoom)
        const dotRadius = Math.max(0.8, 1.2 / stageScale);

        // Draw all dots in a single path for performance
        context.beginPath();
        for (
          let x = firstX;
          x <= endX + effectiveGridSize;
          x += effectiveGridSize
        ) {
          for (
            let y = firstY;
            y <= endY + effectiveGridSize;
            y += effectiveGridSize
          ) {
            context.moveTo(x + dotRadius, y);
            context.arc(x, y, dotRadius, 0, Math.PI * 2);
          }
        }
        context.fillStyle = gridColor;
        context.fill();
      },
      listening: false,
    });

    gridShapeRef.current = gridShape;
    layer.add(gridShape);
    layer.batchDraw();
  }, [backgroundColor, gridSize, gridLayerRef, stageRef]);

  // ── Background rendering ──────────────────────────────────────────────────

  /**
   * Update the background layer with a large rect for the infinite canvas.
   */
  const updateBackground = useCallback(() => {
    const layer = bgLayerRef.current;
    const stage = stageRef.current;
    if (!layer || !stage) return;

    layer.destroyChildren();

    // Use a very large background rect centered at origin
    // This covers any reasonable pan/zoom range
    const largeSize = 100000;

    layer.add(
      new Konva.Rect({
        x: -largeSize / 2,
        y: -largeSize / 2,
        width: largeSize,
        height: largeSize,
        fill: backgroundColor,
        listening: false,
      })
    );

    layer.batchDraw();
  }, [backgroundColor, bgLayerRef, stageRef]);

  // ── Viewport update ───────────────────────────────────────────────────────

  /**
   * Update the full viewport: ensures stage size matches container,
   * redraws background and grid, and notifies the parent via callback.
   */
  const updateViewport = useCallback(() => {
    const stage = stageRef.current;
    const container = containerRef.current;

    // Ensure stage size matches container size using offsetWidth/offsetHeight
    if (stage && container) {
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      if (containerWidth > 0 && containerHeight > 0) {
        const needsResize =
          stage.width() !== containerWidth ||
          stage.height() !== containerHeight;
        if (needsResize) {
          stage.width(containerWidth);
          stage.height(containerHeight);
        }
      }
    }

    updateBackground();
    if (showGrid) {
      drawInfiniteGrid();
    }

    // Notify parent of viewport changes
    if (stage && onViewportChange) {
      onViewportChange({
        scale: stage.scaleX(),
        position: stage.position(),
      });
    }
  }, [
    updateBackground,
    showGrid,
    drawInfiniteGrid,
    onViewportChange,
    stageRef,
    containerRef,
  ]);

  // ── Zoom functions ────────────────────────────────────────────────────────

  /**
   * Set zoom level, centering on the stage center.
   * Scale is clamped between 0.1 and 5.
   */
  const setZoom = useCallback(
    (newScale: number) => {
      const stage = stageRef.current;
      if (!stage) return;

      // Clamp scale between 0.1 and 5
      const clampedScale = Math.min(Math.max(newScale, 0.1), 5);

      // Zoom to center of stage
      const stageWidth = stage.width();
      const stageHeight = stage.height();
      const centerX = stageWidth / 2;
      const centerY = stageHeight / 2;

      const oldScale = stage.scaleX();
      const mousePointTo = {
        x: (centerX - stage.x()) / oldScale,
        y: (centerY - stage.y()) / oldScale,
      };

      const newPos = {
        x: centerX - mousePointTo.x * clampedScale,
        y: centerY - mousePointTo.y * clampedScale,
      };

      stage.scale({ x: clampedScale, y: clampedScale });
      stage.position(newPos);
      stage.batchDraw();
      setScale(clampedScale);
      setPosition(newPos.x, newPos.y);
      updateViewport();
    },
    [setScale, setPosition, updateViewport, stageRef]
  );

  /**
   * Zoom to fit all visible shapes in the viewport.
   * Adds padding and caps scale at 2x.
   */
  const zoomToFit = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || shapes.length === 0) return;

    // Calculate bounds of all visible shapes
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    shapes.forEach((shape: Shape) => {
      if (shape.visible === false) return;
      minX = Math.min(minX, shape.x);
      minY = Math.min(minY, shape.y);
      maxX = Math.max(maxX, shape.x + shape.width);
      maxY = Math.max(maxY, shape.y + shape.height);
    });

    if (minX === Infinity) return;

    // Add padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const stageWidth = stage.width();
    const stageHeight = stage.height();

    // Calculate scale to fit
    const scaleX = stageWidth / contentWidth;
    const scaleY = stageHeight / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 2); // Max scale 2x

    // Calculate position to center
    const newPos = {
      x: (stageWidth - contentWidth * newScale) / 2 - minX * newScale,
      y: (stageHeight - contentHeight * newScale) / 2 - minY * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
    stage.batchDraw();
    setScale(newScale);
    setPosition(newPos.x, newPos.y);

    onViewportChange?.({
      scale: newScale,
      position: newPos,
    });
  }, [shapes, setScale, setPosition, onViewportChange, stageRef]);

  /**
   * Reset zoom to 100%.
   */
  const zoomTo100 = useCallback(() => {
    setZoom(1);
  }, [setZoom]);

  /**
   * Set the viewport position directly (e.g., for minimap navigation).
   */
  const setViewportPosition = useCallback(
    (newPos: { x: number; y: number }) => {
      const stage = stageRef.current;
      if (!stage) return;

      stage.position(newPos);
      stage.batchDraw();
      setPosition(newPos.x, newPos.y);

      onViewportChange?.({
        scale: stage.scaleX(),
        position: newPos,
      });
    },
    [setPosition, onViewportChange, stageRef]
  );

  /**
   * Reset zoom and position to defaults (scale 1, position 0,0).
   */
  const resetViewport = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();
    resetViewportStore();
    updateViewport();
  }, [resetViewportStore, updateViewport, stageRef]);

  // ── Container resize handling ─────────────────────────────────────────────

  /**
   * Track container size changes via ResizeObserver and update canvasSize.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCanvasSize({ width, height });
        }
      }
    });

    resizeObserver.observe(container);

    // Initial size
    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setCanvasSize({ width: rect.width, height: rect.height });
    }

    return () => resizeObserver.disconnect();
  }, [containerRef]);

  /**
   * Update stage dimensions and viewport when canvasSize changes.
   */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.width(canvasSize.width);
    stage.height(canvasSize.height);
    updateViewport();
  }, [canvasSize, updateViewport, stageRef]);

  // ── Return ────────────────────────────────────────────────────────────────

  return {
    // State
    canvasSize,
    scale,
    position,
    isPanning,

    // Store actions (pass-through)
    setScale,
    setPosition,
    setIsPanning,

    // Grid and background
    drawInfiniteGrid,
    updateBackground,
    updateViewport,

    // Zoom controls
    setZoom,
    zoomToFit,
    zoomTo100,
    setViewportPosition,
    resetViewport,
  };
}
