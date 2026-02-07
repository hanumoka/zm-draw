'use client';

import { useCallback, useRef } from 'react';
import type { Shape } from '@zm-draw/core';
import { generateId } from '@zm-draw/core';
import { useEditorStore } from '../stores/editorStore';

interface UseClipboardOptions {
  onShapesChange?: (shapes: Shape[]) => void;
}

/**
 * Hook for clipboard operations (copy, paste, duplicate) on shapes.
 */
export function useClipboard(options: UseClipboardOptions = {}) {
  const { onShapesChange } = options;

  const shapes = useEditorStore((s) => s.shapes);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selectedId = useEditorStore((s) => s.selectedIds[0] ?? null);
  const addShape = useEditorStore((s) => s.addShape);
  const select = useEditorStore((s) => s.select);

  const clipboardRef = useRef<Shape | null>(null);
  const pasteOffsetRef = useRef(20);

  const copySelected = useCallback(() => {
    if (!selectedId) return;
    const shape = shapes.find((s) => s.id === selectedId);
    if (shape) {
      clipboardRef.current = { ...shape };
      pasteOffsetRef.current = 20;
    }
  }, [selectedId, shapes]);

  const pasteShape = useCallback(() => {
    if (!clipboardRef.current) return;

    const newShape: Shape = {
      ...clipboardRef.current,
      id: generateId(),
      x: clipboardRef.current.x + pasteOffsetRef.current,
      y: clipboardRef.current.y + pasteOffsetRef.current,
    };

    addShape(newShape);
    select(newShape.id);
    pasteOffsetRef.current += 20;
    onShapesChange?.(useEditorStore.getState().shapes);
  }, [addShape, select, onShapesChange]);

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const shape = shapes.find((s) => s.id === selectedId);
    if (!shape) return;

    const newShape: Shape = {
      ...shape,
      id: generateId(),
      x: shape.x + 20,
      y: shape.y + 20,
    };

    addShape(newShape);
    select(newShape.id);
    onShapesChange?.(useEditorStore.getState().shapes);
  }, [selectedId, shapes, addShape, select, onShapesChange]);

  const moveSelected = useCallback((dx: number, dy: number) => {
    if (!selectedId) return;
    const updateShape = useEditorStore.getState().updateShape;
    const shape = shapes.find((s) => s.id === selectedId);
    if (!shape) return;
    updateShape(selectedId, { x: shape.x + dx, y: shape.y + dy });
    onShapesChange?.(useEditorStore.getState().shapes);
  }, [selectedId, shapes, onShapesChange]);

  return {
    copySelected,
    pasteShape,
    duplicateSelected,
    moveSelected,
  };
}
