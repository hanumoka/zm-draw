'use client';

import { useRef, useEffect, useCallback } from 'react';
import Konva from 'konva';

export interface DrawCanvasProps {
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
  /** Background color */
  backgroundColor?: string;
  /** Show grid */
  showGrid?: boolean;
  /** Grid size in pixels */
  gridSize?: number;
  /** Callback when canvas is ready */
  onReady?: (stage: Konva.Stage) => void;
}

/**
 * Main drawing canvas component
 * Uses vanilla Konva for React 19 compatibility
 */
export function DrawCanvas({
  width = 800,
  height = 600,
  backgroundColor = '#ffffff',
  showGrid = true,
  gridSize = 20,
  onReady,
}: DrawCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);

  // Draw grid lines
  const drawGrid = useCallback((layer: Konva.Layer, w: number, h: number, size: number) => {
    layer.destroyChildren();

    // Vertical lines
    for (let x = 0; x <= w; x += size) {
      layer.add(new Konva.Line({
        points: [x, 0, x, h],
        stroke: '#e5e7eb',
        strokeWidth: 1,
      }));
    }

    // Horizontal lines
    for (let y = 0; y <= h; y += size) {
      layer.add(new Konva.Line({
        points: [0, y, w, y],
        stroke: '#e5e7eb',
        strokeWidth: 1,
      }));
    }

    layer.batchDraw();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create Konva Stage
    const stage = new Konva.Stage({
      container: containerRef.current,
      width,
      height,
    });
    stageRef.current = stage;

    // Background layer
    const bgLayer = new Konva.Layer();
    bgLayer.add(new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: backgroundColor,
    }));
    stage.add(bgLayer);

    // Grid layer
    const gridLayer = new Konva.Layer({ listening: false });
    stage.add(gridLayer);
    if (showGrid) {
      drawGrid(gridLayer, width, height, gridSize);
    }

    // Shapes layer
    const shapesLayer = new Konva.Layer();
    stage.add(shapesLayer);

    // Connectors layer
    const connectorsLayer = new Konva.Layer();
    stage.add(connectorsLayer);

    // Selection layer
    const selectionLayer = new Konva.Layer();
    stage.add(selectionLayer);

    // Callback
    if (onReady) {
      onReady(stage);
    }

    // Cleanup
    return () => {
      stage.destroy();
      stageRef.current = null;
    };
  }, [width, height, backgroundColor, showGrid, gridSize, drawGrid, onReady]);

  return (
    <div
      ref={containerRef}
      className="zm-draw-canvas-container"
      style={{ width, height }}
    />
  );
}
