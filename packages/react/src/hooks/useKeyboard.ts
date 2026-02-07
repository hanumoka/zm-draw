import { useEffect, useCallback } from 'react';
import type { Shape, StampType } from '@zm-draw/core';
import { generateId } from '@zm-draw/core';
import { useEditorStore } from '../stores/editorStore';
import { useClipboardStore } from '../stores/clipboardStore';

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
  /** External group function */
  onGroup?: () => void;
  /** External ungroup function */
  onUngroup?: () => void;
  /** External add image function */
  onAddImage?: () => void;
  /** External stamp select function (receives stamp type) */
  onStampSelect?: (type: StampType) => void;
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
    onGroup,
    onUngroup,
    onAddImage,
    onStampSelect,
    enabled = true,
  } = options;

  // Unified editor store (replaces 4 separate stores)
  const storeSelectedId = useEditorStore((s) => s.selectedIds[0] ?? null);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const selectMultiple = useEditorStore((s) => s.selectMultiple);
  const shapes = useEditorStore((s) => s.shapes);
  const updateShape = useEditorStore((s) => s.updateShape);
  const addShape = useEditorStore((s) => s.addShape);
  const deleteShape = useEditorStore((s) => s.deleteShape);
  const deleteConnectorsByShapeId = useEditorStore((s) => s.deleteConnectorsByShapeId);
  const setTool = useEditorStore((s) => s.setTool);
  const resetTool = useEditorStore((s) => s.resetTool);
  const cancelConnecting = useEditorStore((s) => s.cancelConnecting);
  const stopEditing = useEditorStore((s) => s.stopEditing);
  const storeSetIsPanning = useEditorStore((s) => s.setIsPanning);
  const storeIsPanning = useEditorStore((s) => s.isPanning);

  // Clipboard store stays separate
  const copy = useClipboardStore((s) => s.copy);
  const paste = useClipboardStore((s) => s.paste);

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

    pastedShapes.forEach((shapeWithoutId) => {
      const newShape: Shape = {
        ...shapeWithoutId,
        id: generateId(),
      } as Shape;

      if (setShapes && getShapes) {
        setShapes([...getShapes(), newShape]);
      } else {
        addShape(newShape);
      }
    });
  }, [paste, addShape, setShapes, getShapes, onPaste]);

  // Duplicate selected shape
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
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
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
            const allShapes = getShapes?.() ?? shapes;
            if (allShapes.length > 0) {
              const allIds = allShapes.map(s => s.id);
              selectMultiple(allIds);
            }
          }
          break;

        case 'g':
        case 'G':
          if (modKey) {
            e.preventDefault();
            if (e.shiftKey) {
              onUngroup?.();
            } else {
              onGroup?.();
            }
          }
          break;

        case 's':
        case 'S':
          if (modKey) {
            e.preventDefault();
            onSave?.();
          } else if (e.shiftKey) {
            e.preventDefault();
            setTool('section');
          } else {
            e.preventDefault();
            setTool('sticky');
          }
          break;

        case 'p':
        case 'P':
          if (!modKey) {
            e.preventDefault();
            setTool('pen');
          }
          break;

        case 'm':
        case 'M':
          if (!modKey) {
            e.preventDefault();
            setTool('marker');
          }
          break;

        case 'h':
        case 'H':
          if (!modKey) {
            e.preventDefault();
            setTool('highlighter');
          }
          break;

        case 'e':
        case 'E':
          if (!modKey) {
            e.preventDefault();
            setTool('eraser');
          }
          break;

        case 'i':
        case 'I':
          if (!modKey) {
            e.preventDefault();
            onAddImage?.();
          }
          break;

        case '1':
          if (!modKey) { e.preventDefault(); onStampSelect?.('thumbsUp'); }
          break;
        case '2':
          if (!modKey) { e.preventDefault(); onStampSelect?.('thumbsDown'); }
          break;
        case '3':
          if (!modKey) { e.preventDefault(); onStampSelect?.('heart'); }
          break;
        case '4':
          if (!modKey) { e.preventDefault(); onStampSelect?.('star'); }
          break;
        case '5':
          if (!modKey) { e.preventDefault(); onStampSelect?.('check'); }
          break;
        case '6':
          if (!modKey) { e.preventDefault(); onStampSelect?.('question'); }
          break;
        case '7':
          if (!modKey) { e.preventDefault(); onStampSelect?.('exclamation'); }
          break;
        case '8':
          if (!modKey) { e.preventDefault(); onStampSelect?.('celebration'); }
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
    onGroup,
    onUngroup,
    onAddImage,
    onStampSelect,
  ]);

  return {
    copy: handleCopy,
    paste: handlePaste,
    duplicate: handleDuplicate,
    deleteSelected: handleDelete,
    moveSelected: handleMove,
  };
}
