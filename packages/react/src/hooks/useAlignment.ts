'use client';

import { useCallback } from 'react';
import type { Shape, AlignType, DistributeType } from '@zm-draw/core';
import { generateId } from '@zm-draw/core';
import { useEditorStore } from '../stores/editorStore';

interface UseAlignmentOptions {
  onShapesChange?: (shapes: Shape[]) => void;
}

/**
 * Hook for alignment, distribution, and grouping operations.
 */
export function useAlignment(options: UseAlignmentOptions = {}) {
  const { onShapesChange } = options;

  const shapes = useEditorStore((s) => s.shapes);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const setShapes = useEditorStore((s) => s.setShapes);

  const alignShapes = useCallback((type: AlignType) => {
    if (selectedIds.length < 2) return;

    const selectedShapes = shapes.filter((s) => selectedIds.includes(s.id));
    if (selectedShapes.length < 2) return;

    const bounds = {
      left: Math.min(...selectedShapes.map((s) => s.x)),
      right: Math.max(...selectedShapes.map((s) => s.x + s.width)),
      top: Math.min(...selectedShapes.map((s) => s.y)),
      bottom: Math.max(...selectedShapes.map((s) => s.y + s.height)),
    };

    const updates: Record<string, Partial<Shape>> = {};

    selectedShapes.forEach((shape) => {
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

    const updated = shapes.map((s) => (updates[s.id] ? { ...s, ...updates[s.id] } : s));
    setShapes(updated);
    onShapesChange?.(updated);
  }, [selectedIds, shapes, setShapes, onShapesChange]);

  const distributeShapes = useCallback((type: DistributeType) => {
    if (selectedIds.length < 3) return;

    const selectedShapes = shapes.filter((s) => selectedIds.includes(s.id));
    if (selectedShapes.length < 3) return;

    const updates: Record<string, Partial<Shape>> = {};

    if (type === 'horizontal') {
      const sorted = [...selectedShapes].sort((a, b) => a.x - b.x);
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
      const sorted = [...selectedShapes].sort((a, b) => a.y - b.y);
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

    const updated = shapes.map((s) => (updates[s.id] ? { ...s, ...updates[s.id] } : s));
    setShapes(updated);
    onShapesChange?.(updated);
  }, [selectedIds, shapes, setShapes, onShapesChange]);

  const groupSelected = useCallback(() => {
    if (selectedIds.length < 2) return;

    const groupId = generateId();
    const updated = shapes.map((s) =>
      selectedIds.includes(s.id) ? { ...s, groupId } : s
    );
    setShapes(updated);
    onShapesChange?.(updated);
  }, [selectedIds, shapes, setShapes, onShapesChange]);

  const ungroupSelected = useCallback(() => {
    if (selectedIds.length === 0) return;

    const selectedShapes = shapes.filter((s) => selectedIds.includes(s.id));
    const groupIds = new Set(selectedShapes.map((s) => s.groupId).filter(Boolean));

    if (groupIds.size === 0) return;

    const updated = shapes.map((s) =>
      s.groupId && groupIds.has(s.groupId) ? { ...s, groupId: undefined } : s
    );
    setShapes(updated);
    onShapesChange?.(updated);
  }, [selectedIds, shapes, setShapes, onShapesChange]);

  return {
    alignShapes,
    distributeShapes,
    groupSelected,
    ungroupSelected,
  };
}
