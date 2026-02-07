'use client';

import { useEffect, useRef } from 'react';
import Konva from 'konva';
import type { Shape, FreeDrawPoint } from '@zm-draw/core';
import { defaultFreeDrawProps, generateId } from '@zm-draw/core';
import { useEditorStore } from '../stores/editorStore';

interface UseFreeDrawOptions {
  stageRef: React.RefObject<Konva.Stage | null>;
  drawingLayerRef: React.RefObject<Konva.Layer | null>;
  bgLayerRef: React.RefObject<Konva.Layer | null>;
  gridLayerRef: React.RefObject<Konva.Layer | null>;
  shapesLayerRef: React.RefObject<Konva.Layer | null>;
  onShapesChange?: (shapes: Shape[]) => void;
}

/**
 * Hook that extracts free drawing logic (pen/marker/highlighter/eraser)
 * from DrawCanvas.tsx. Attaches mousedown/mousemove/mouseup and touch
 * event handlers on the Konva stage for drawing tools.
 *
 * - On mousedown/touchstart: starts a new drawing path, creates a Konva.Line
 *   for visual feedback.
 * - On mousemove/touchmove: adds points to the current path, updates the
 *   visual line.
 * - On mouseup/touchend: finalizes the drawing, simplifies points, creates
 *   a Shape of type 'freedraw', adds it to the store.
 * - For eraser tool: on mousedown, finds the clicked freedraw shape and
 *   deletes it.
 *
 * Returns nothing (effect-only hook that attaches event listeners).
 */
export function useFreeDraw(options: UseFreeDrawOptions): void {
  const {
    stageRef,
    drawingLayerRef,
    bgLayerRef,
    gridLayerRef,
    shapesLayerRef,
    onShapesChange,
  } = options;

  // Read state from editorStore
  const tool = useEditorStore((s) => s.tool);
  const isPanning = useEditorStore((s) => s.isPanning);
  const isDrawing = useEditorStore((s) => s.isDrawing);
  const setIsDrawing = useEditorStore((s) => s.setIsDrawing);
  const currentStrokeColor = useEditorStore((s) => s.currentStrokeColor);
  const shapes = useEditorStore((s) => s.shapes);

  // Internal refs for the current drawing state
  const currentDrawingRef = useRef<FreeDrawPoint[]>([]);
  const currentDrawingLineRef = useRef<Konva.Line | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const drawingLayer = drawingLayerRef.current;
    if (!stage || !drawingLayer) return;

    // Only handle drawing tools
    const isDrawingTool = tool === 'pen' || tool === 'marker' || tool === 'highlighter';
    const isEraserTool = tool === 'eraser';

    if (!isDrawingTool && !isEraserTool) return;

    const getDrawingProps = () => {
      if (tool === 'pen') return defaultFreeDrawProps.pen;
      if (tool === 'marker') return defaultFreeDrawProps.marker;
      if (tool === 'highlighter') return defaultFreeDrawProps.highlighter;
      return defaultFreeDrawProps.pen;
    };

    const handleDrawStart = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      // Don't draw when panning
      if (isPanning) return;

      // Don't start on shapes
      const target = e.target;
      if (
        target !== stage &&
        target.getLayer() !== bgLayerRef.current &&
        target.getLayer() !== gridLayerRef.current
      ) {
        // Check if eraser is clicking on a freedraw shape
        if (isEraserTool) {
          const clickedShape = shapes.find((s) => {
            const node = shapesLayerRef.current?.findOne(`#${s.id}`);
            if (!node) return false;
            // Check if target is inside this node's group
            let parent: Konva.Node | null = target;
            while (parent) {
              if (parent === node) return true;
              parent = parent.getParent();
            }
            return false;
          });
          if (clickedShape && clickedShape.type === 'freedraw') {
            // Delete the freedraw shape
            const updated = shapes.filter((s) => s.id !== clickedShape.id);
            useEditorStore.getState().setShapes(updated);
            onShapesChange?.(updated);
          }
        }
        return;
      }

      if (isEraserTool) return; // Eraser only works on existing shapes

      setIsDrawing(true);

      const pos = stage.getPointerPosition();
      if (!pos) return;

      // Convert to canvas coordinates
      const transform = stage.getAbsoluteTransform().copy().invert();
      const canvasPos = transform.point(pos);

      // Start new drawing
      currentDrawingRef.current = [{ x: canvasPos.x, y: canvasPos.y }];

      // Create visual line
      const props = getDrawingProps();
      const line = new Konva.Line({
        points: [canvasPos.x, canvasPos.y],
        stroke: currentStrokeColor,
        strokeWidth: props.strokeWidth,
        opacity: props.opacity,
        lineCap: props.lineCap,
        lineJoin: 'round',
        tension: 0.5,
      });

      currentDrawingLineRef.current = line;
      drawingLayer.add(line);
      drawingLayer.batchDraw();
    };

    const handleDrawMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!isDrawing || !currentDrawingLineRef.current) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      // Convert to canvas coordinates
      const transform = stage.getAbsoluteTransform().copy().invert();
      const canvasPos = transform.point(pos);

      // Add point
      currentDrawingRef.current.push({ x: canvasPos.x, y: canvasPos.y });

      // Update visual line
      const flatPoints: number[] = [];
      currentDrawingRef.current.forEach((p) => {
        flatPoints.push(p.x, p.y);
      });
      currentDrawingLineRef.current.points(flatPoints);
      drawingLayer.batchDraw();
    };

    const handleDrawEnd = () => {
      if (!isDrawing || currentDrawingRef.current.length < 2) {
        // Clear incomplete drawing
        if (currentDrawingLineRef.current) {
          currentDrawingLineRef.current.destroy();
          currentDrawingLineRef.current = null;
        }
        currentDrawingRef.current = [];
        setIsDrawing(false);
        return;
      }

      // Simplify points if there are too many (performance optimization)
      let finalPoints = currentDrawingRef.current;
      if (finalPoints.length > 100) {
        // Keep every nth point
        const step = Math.ceil(finalPoints.length / 100);
        finalPoints = finalPoints.filter(
          (_, i) => i % step === 0 || i === finalPoints.length - 1
        );
      }

      // Calculate bounding box
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      finalPoints.forEach((p) => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });

      // Normalize points relative to shape position
      const normalizedPoints = finalPoints.map((p) => ({
        x: p.x - minX,
        y: p.y - minY,
      }));

      const props = getDrawingProps();

      // Create shape
      const newShape: Shape = {
        id: generateId(),
        type: 'freedraw',
        x: minX,
        y: minY,
        width: maxX - minX || 1,
        height: maxY - minY || 1,
        fill: 'transparent',
        stroke: currentStrokeColor,
        strokeWidth: props.strokeWidth,
        opacity: props.opacity,
        lineCap: props.lineCap,
        points: normalizedPoints,
      };

      // Remove visual line
      if (currentDrawingLineRef.current) {
        currentDrawingLineRef.current.destroy();
        currentDrawingLineRef.current = null;
      }
      currentDrawingRef.current = [];
      drawingLayer.batchDraw();

      // Add shape to store
      useEditorStore.getState().addShape(newShape);
      onShapesChange?.(useEditorStore.getState().shapes);

      setIsDrawing(false);
    };

    stage.on('mousedown touchstart', handleDrawStart);
    stage.on('mousemove touchmove', handleDrawMove);
    stage.on('mouseup touchend', handleDrawEnd);

    return () => {
      stage.off('mousedown touchstart', handleDrawStart);
      stage.off('mousemove touchmove', handleDrawMove);
      stage.off('mouseup touchend', handleDrawEnd);
    };
  }, [
    stageRef,
    drawingLayerRef,
    bgLayerRef,
    gridLayerRef,
    shapesLayerRef,
    tool,
    isPanning,
    isDrawing,
    setIsDrawing,
    currentStrokeColor,
    shapes,
    onShapesChange,
  ]);
}
