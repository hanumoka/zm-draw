import { useEffect, useCallback } from 'react';
import type { Shape } from '../types';
import {
  useCanvasStore,
  useSelectionStore,
  useToolStore,
  useHistoryStore,
  useViewportStore,
  useClipboardStore,
  generateId,
} from '../stores';

interface UseKeyboardOptions {
  /** Callback to get shapes (for components not using store directly) */
  getShapes?: () => Shape[];
  /** Callback to set shapes (for components not using store directly) */
  setShapes?: (shapes: Shape[]) => void;
  /** External selected ID (overrides store) */
  selectedId?: string | null;
  /** External isPanning state (overrides store) */
  isPanning?: boolean;
  /** External setIsPanning function (overrides store) */
  setIsPanning?: (isPanning: boolean) => void;
  /** Callback when escape is pressed (overrides default behavior) */
  onEscape?: () => void;
  /** Callback when selection is cleared */
  onSelectionClear?: () => void;
  /** Callback when shape is deleted */
  onDelete?: () => void;
  /** External undo function */
  onUndo?: () => void;
  /** External redo function */
  onRedo?: () => void;
  /** External copy function */
  onCopy?: () => void;
  /** External paste function */
  onPaste?: () => void;
  /** External duplicate function */
  onDuplicate?: () => void;
  /** External move function */
  onMove?: (dx: number, dy: number) => void;
  /** External save function */
  onSave?: () => void;
  /** External load function */
  onLoad?: () => void;
  /** Whether keyboard handling is enabled */
  enabled?: boolean;
}

// Movement amounts
const MOVE_STEP = 1;
const MOVE_STEP_SHIFT = 10;

/**
 * Hook for handling keyboard shortcuts
 * Supports: Delete, Escape, Space (pan), Ctrl+Z (undo), Ctrl+Y/Shift+Z (redo),
 * Ctrl+C (copy), Ctrl+V (paste), Ctrl+D (duplicate), Ctrl+S (save), Ctrl+O (load),
 * V (select), R (rectangle), O (ellipse), Arrow keys (move)
 */
export function useKeyboard(options: UseKeyboardOptions = {}) {
  const {
    getShapes,
    setShapes,
    selectedId: externalSelectedId,
    isPanning: externalIsPanning,
    setIsPanning: externalSetIsPanning,
    onEscape,
    onSelectionClear,
    onDelete,
    onUndo,
    onRedo,
    onCopy,
    onPaste,
    onDuplicate,
    onMove,
    onSave,
    onLoad,
    enabled = true,
  } = options;

  // Store hooks (used as fallbacks when external values not provided)
  const storeSelectedId = useSelectionStore((s) => s.selectedIds[0] ?? null);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const selectMultiple = useSelectionStore((s) => s.selectMultiple);
  const shapes = useCanvasStore((s) => s.shapes);
  const updateShape = useCanvasStore((s) => s.updateShape);
  const addShape = useCanvasStore((s) => s.addShape);
  const deleteShape = useCanvasStore((s) => s.deleteShape);
  const deleteConnectorsByShapeId = useCanvasStore((s) => s.deleteConnectorsByShapeId);
  const setTool = useToolStore((s) => s.setTool);
  const resetTool = useToolStore((s) => s.resetTool);
  const cancelConnecting = useToolStore((s) => s.cancelConnecting);
  const stopEditing = useToolStore((s) => s.stopEditing);
  const storeSetIsPanning = useViewportStore((s) => s.setIsPanning);
  const storeIsPanning = useViewportStore((s) => s.isPanning);
  const copy = useClipboardStore((s) => s.copy);
  const paste = useClipboardStore((s) => s.paste);

  // Unused but available for future use
  // const hasCopied = useClipboardStore((s) => s.hasCopied);

  // Use external values if provided, otherwise fall back to store values
  const selectedId = externalSelectedId !== undefined ? externalSelectedId : storeSelectedId;
  const isPanning = externalIsPanning !== undefined ? externalIsPanning : storeIsPanning;
  const setIsPanning = externalSetIsPanning ?? storeSetIsPanning;

  // Get the selected shape
  const getSelectedShape = useCallback(() => {
    if (!selectedId) return null;
    const allShapes = getShapes?.() ?? shapes;
    return allShapes.find((s) => s.id === selectedId) ?? null;
  }, [selectedId, shapes, getShapes]);

  // Copy selected shape
  const handleCopy = useCallback(() => {
    if (onCopy) {
      onCopy();
      return;
    }
    const shape = getSelectedShape();
    if (shape) {
      copy([shape]);
    }
  }, [getSelectedShape, copy, onCopy]);

  // Paste copied shapes
  const handlePaste = useCallback(() => {
    if (onPaste) {
      onPaste();
      return;
    }
    const pastedShapes = paste();
    if (!pastedShapes || pastedShapes.length === 0) return;

    // Add each pasted shape with a new ID
    pastedShapes.forEach((shapeWithoutId) => {
      const newShape: Shape = {
        ...shapeWithoutId,
        id: generateId(),
      } as Shape;

      if (setShapes && getShapes) {
        // Use external setShapes if provided
        setShapes([...getShapes(), newShape]);
      } else {
        // Use store
        addShape(newShape);
      }
    });
  }, [paste, addShape, setShapes, getShapes, onPaste]);

  // Duplicate selected shape (copy + paste in one action)
  const handleDuplicate = useCallback(() => {
    if (onDuplicate) {
      onDuplicate();
      return;
    }
    const shape = getSelectedShape();
    if (!shape) return;

    const newShape: Shape = {
      ...shape,
      id: generateId(),
      x: shape.x + 20,
      y: shape.y + 20,
    };

    if (setShapes && getShapes) {
      setShapes([...getShapes(), newShape]);
    } else {
      addShape(newShape);
    }
  }, [getSelectedShape, addShape, setShapes, getShapes, onDuplicate]);

  // Move selected shape with arrow keys
  const handleMove = useCallback((dx: number, dy: number) => {
    if (onMove) {
      onMove(dx, dy);
      return;
    }
    const shape = getSelectedShape();
    if (!shape) return;

    const newX = shape.x + dx;
    const newY = shape.y + dy;

    if (setShapes && getShapes) {
      const allShapes = getShapes();
      setShapes(
        allShapes.map((s) =>
          s.id === shape.id ? { ...s, x: newX, y: newY } : s
        )
      );
    } else {
      updateShape(shape.id, { x: newX, y: newY });
    }
  }, [getSelectedShape, updateShape, setShapes, getShapes, onMove]);

  // Delete selected shape
  const handleDelete = useCallback(() => {
    if (!selectedId) return;

    if (onDelete) {
      onDelete();
    } else {
      deleteShape(selectedId);
      deleteConnectorsByShapeId(selectedId);
      clearSelection();
    }
  }, [selectedId, onDelete, deleteShape, deleteConnectorsByShapeId, clearSelection]);

  // Handle escape key
  const handleEscape = useCallback(() => {
    if (onEscape) {
      onEscape();
      return;
    }
    clearSelection();
    cancelConnecting();
    stopEditing();
    resetTool();
    onSelectionClear?.();
  }, [clearSelection, cancelConnecting, stopEditing, resetTool, onSelectionClear, onEscape]);

  // Main keyboard handler
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Escape in input fields
        if (e.key !== 'Escape') return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          handleDelete();
          break;

        case 'Escape':
          handleEscape();
          break;

        case ' ':
          if (!isPanning) {
            e.preventDefault();
            setIsPanning(true);
          }
          break;

        case 'c':
        case 'C':
          if (modKey) {
            e.preventDefault();
            handleCopy();
          }
          break;

        case 'v':
        case 'V':
          if (modKey) {
            e.preventDefault();
            handlePaste();
          } else {
            // V without modifier: select tool
            e.preventDefault();
            setTool('select');
          }
          break;

        case 'd':
        case 'D':
          if (modKey) {
            e.preventDefault();
            handleDuplicate();
          }
          break;

        case 'z':
        case 'Z':
          if (modKey) {
            e.preventDefault();
            if (e.shiftKey) {
              onRedo?.();
            } else {
              onUndo?.();
            }
          }
          break;

        case 'y':
        case 'Y':
          if (modKey) {
            e.preventDefault();
            onRedo?.();
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          handleMove(0, e.shiftKey ? -MOVE_STEP_SHIFT : -MOVE_STEP);
          break;

        case 'ArrowDown':
          e.preventDefault();
          handleMove(0, e.shiftKey ? MOVE_STEP_SHIFT : MOVE_STEP);
          break;

        case 'ArrowLeft':
          e.preventDefault();
          handleMove(e.shiftKey ? -MOVE_STEP_SHIFT : -MOVE_STEP, 0);
          break;

        case 'ArrowRight':
          e.preventDefault();
          handleMove(e.shiftKey ? MOVE_STEP_SHIFT : MOVE_STEP, 0);
          break;

        // Tool shortcuts (only without modifier keys)
        case 'r':
        case 'R':
          if (!modKey) {
            e.preventDefault();
            setTool('rectangle');
          }
          break;

        case 'o':
        case 'O':
          if (modKey) {
            e.preventDefault();
            onLoad?.();
          } else {
            e.preventDefault();
            setTool('ellipse');
          }
          break;

        case 't':
        case 'T':
          if (!modKey) {
            e.preventDefault();
            setTool('text');
          }
          break;

        case 'a':
        case 'A':
          if (modKey) {
            e.preventDefault();
            // Select all shapes
            const allShapes = getShapes?.() ?? shapes;
            if (allShapes.length > 0) {
              const allIds = allShapes.map(s => s.id);
              selectMultiple(allIds);
            }
          }
          break;

        // File shortcuts
        case 's':
        case 'S':
          if (modKey) {
            e.preventDefault();
            onSave?.();
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    enabled,
    isPanning,
    handleDelete,
    handleEscape,
    handleCopy,
    handlePaste,
    handleDuplicate,
    handleMove,
    onUndo,
    onRedo,
    onSave,
    onLoad,
    setTool,
    setIsPanning,
    getShapes,
    shapes,
    selectMultiple,
  ]);

  return {
    copy: handleCopy,
    paste: handlePaste,
    duplicate: handleDuplicate,
    deleteSelected: handleDelete,
    moveSelected: handleMove,
  };
}
