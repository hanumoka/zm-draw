'use client';

import { useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import { useEditorStore } from '../stores/editorStore';

export interface UseMarqueeSelectOptions {
  stageRef: React.RefObject<Konva.Stage | null>;
  selectionLayerRef: React.RefObject<Konva.Layer | null>;
  bgLayerRef: React.RefObject<Konva.Layer | null>;
  gridLayerRef: React.RefObject<Konva.Layer | null>;
}

export function useMarqueeSelect(options: UseMarqueeSelectOptions) {
  const { stageRef, selectionLayerRef, bgLayerRef, gridLayerRef } = options;

  const { tool, isPanning, shapes, selectedIds, selectMultiple, clearSelection } =
    useEditorStore();

  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);
  const marqueeRectRef = useRef<Konva.Rect | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const selectionLayer = selectionLayerRef.current;
    if (!stage || !selectionLayer) return;

    // Remove existing marquee rect if any
    if (marqueeRectRef.current) {
      marqueeRectRef.current.destroy();
      marqueeRectRef.current = null;
    }

    // Create marquee rect (initially invisible)
    const marqueeRect = new Konva.Rect({
      fill: 'rgba(59, 130, 246, 0.1)',
      stroke: '#3b82f6',
      strokeWidth: 1,
      dash: [4, 4],
      visible: false,
      listening: false,
    });
    selectionLayer.add(marqueeRect);
    marqueeRectRef.current = marqueeRect;

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only start marquee on left mouse button in select mode
      if (e.evt.button !== 0) return;
      if (tool !== 'select') return;
      if (isPanning) return;

      // Check if clicking on background (not on a shape)
      const bgLayer = bgLayerRef.current;
      const gridLayer = gridLayerRef.current;
      const target = e.target;

      const isBackground =
        target === stage ||
        target.getLayer() === bgLayer ||
        target.getLayer() === gridLayer;

      if (!isBackground) return;

      // Get canvas coordinates (accounting for pan/zoom)
      const pos = stage.getPointerPosition();
      if (!pos) return;

      const transform = stage.getAbsoluteTransform().copy().invert();
      const canvasPos = transform.point(pos);

      // Check if shift is held to add to selection
      if (!e.evt.shiftKey) {
        // Clear selection only if not shift-clicking
        // Selection will be set after marquee completes
      }

      // Start marquee
      marqueeStartRef.current = canvasPos;
      setIsMarqueeSelecting(true);

      // Initialize marquee rect position
      marqueeRect.setAttrs({
        x: canvasPos.x,
        y: canvasPos.y,
        width: 0,
        height: 0,
        visible: true,
      });
      selectionLayer.batchDraw();
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isMarqueeSelecting || !marqueeStartRef.current) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      const transform = stage.getAbsoluteTransform().copy().invert();
      const canvasPos = transform.point(pos);

      const start = marqueeStartRef.current;
      const x = Math.min(start.x, canvasPos.x);
      const y = Math.min(start.y, canvasPos.y);
      const width = Math.abs(canvasPos.x - start.x);
      const height = Math.abs(canvasPos.y - start.y);

      marqueeRect.setAttrs({ x, y, width, height });
      selectionLayer.batchDraw();
    };

    const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isMarqueeSelecting || !marqueeStartRef.current) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      const transform = stage.getAbsoluteTransform().copy().invert();
      const canvasPos = transform.point(pos);

      const start = marqueeStartRef.current;
      const marqueeX = Math.min(start.x, canvasPos.x);
      const marqueeY = Math.min(start.y, canvasPos.y);
      const marqueeWidth = Math.abs(canvasPos.x - start.x);
      const marqueeHeight = Math.abs(canvasPos.y - start.y);

      // Find shapes inside the marquee
      const selectedShapeIds: string[] = [];

      // Only select if marquee has some area (not just a click)
      if (marqueeWidth > 5 || marqueeHeight > 5) {
        shapes.forEach((shape) => {
          // Check if shape intersects with marquee
          const shapeRight = shape.x + shape.width;
          const shapeBottom = shape.y + shape.height;
          const marqueeRight = marqueeX + marqueeWidth;
          const marqueeBottom = marqueeY + marqueeHeight;

          // Check for intersection (shape fully or partially inside marquee)
          const intersects =
            shape.x < marqueeRight &&
            shapeRight > marqueeX &&
            shape.y < marqueeBottom &&
            shapeBottom > marqueeY;

          if (intersects) {
            selectedShapeIds.push(shape.id);
          }
        });

        // Update selection
        if (e.evt.shiftKey && selectedIds.length > 0) {
          // Add to existing selection
          const newIds = [...new Set([...selectedIds, ...selectedShapeIds])];
          selectMultiple(newIds);
        } else {
          selectMultiple(selectedShapeIds);
        }
      } else {
        // It was just a click, clear selection
        if (!e.evt.shiftKey) {
          clearSelection();
        }
      }

      // Hide marquee rect
      marqueeRect.visible(false);
      selectionLayer.batchDraw();

      // Reset marquee state
      marqueeStartRef.current = null;
      setIsMarqueeSelecting(false);
    };

    stage.on('mousedown', handleMouseDown);
    stage.on('mousemove', handleMouseMove);
    stage.on('mouseup', handleMouseUp);

    return () => {
      stage.off('mousedown', handleMouseDown);
      stage.off('mousemove', handleMouseMove);
      stage.off('mouseup', handleMouseUp);
      if (marqueeRectRef.current) {
        marqueeRectRef.current.destroy();
        marqueeRectRef.current = null;
      }
    };
  }, [tool, isPanning, shapes, selectedIds, selectMultiple, clearSelection, isMarqueeSelecting]);

  return { isMarqueeSelecting };
}
