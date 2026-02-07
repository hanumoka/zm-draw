'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { Shape, Connector } from '@zm-draw/core';
import { useEditorStore } from '../stores/editorStore';

/** Maximum number of history entries to keep */
const MAX_HISTORY_SIZE = 50;

interface UseHistoryOptions {
  /** Initial shapes to initialize history with */
  initialShapes?: Shape[];
  /** Initial connectors to initialize history with */
  initialConnectors?: Connector[];
}

/**
 * Hook for managing undo/redo history.
 *
 * Maintains an internal history stack using refs and synchronizes
 * with the editor store for reading/writing shapes and connectors.
 */
export function useHistory(options: UseHistoryOptions = {}) {
  const { initialShapes, initialConnectors } = options;

  // Internal refs for history stack
  const historyRef = useRef<{ shapes: Shape[]; connectors: Connector[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);
  const historyInitializedRef = useRef(false);

  // Read from editorStore
  const shapes = useEditorStore((s) => s.shapes);
  const connectors = useEditorStore((s) => s.connectors);
  const setShapes = useEditorStore((s) => s.setShapes);
  const setConnectors = useEditorStore((s) => s.setConnectors);
  const clearSelection = useEditorStore((s) => s.clearSelection);

  // Save state to history
  const saveHistory = useCallback(
    (newShapes: Shape[], newConnectors: Connector[]) => {
      if (isUndoRedoRef.current) {
        isUndoRedoRef.current = false;
        return;
      }

      setHistoryIndex((currentIndex) => {
        // Discard any future entries beyond current index
        historyRef.current = historyRef.current.slice(0, currentIndex + 1);

        // Push a deep clone of the new state
        historyRef.current.push({
          shapes: JSON.parse(JSON.stringify(newShapes)),
          connectors: JSON.parse(JSON.stringify(newConnectors)),
        });

        // Trim history if it exceeds the maximum size
        if (historyRef.current.length > MAX_HISTORY_SIZE) {
          historyRef.current.shift();
          return currentIndex;
        }

        return currentIndex + 1;
      });
    },
    [],
  );

  // Initialize history with initial state (only once)
  useEffect(() => {
    if (historyInitializedRef.current) return;
    historyInitializedRef.current = true;

    const initShapes = initialShapes ?? shapes;
    const initConnectors = initialConnectors ?? connectors;

    historyRef.current.push({
      shapes: JSON.parse(JSON.stringify(initShapes)),
      connectors: JSON.parse(JSON.stringify(initConnectors)),
    });
    setHistoryIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;

    isUndoRedoRef.current = true;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);

    const state = historyRef.current[newIndex];
    setShapes(JSON.parse(JSON.stringify(state.shapes)));
    setConnectors(JSON.parse(JSON.stringify(state.connectors)));
    clearSelection();
  }, [historyIndex, setShapes, setConnectors, clearSelection]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex >= historyRef.current.length - 1) return;

    isUndoRedoRef.current = true;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);

    const state = historyRef.current[newIndex];
    setShapes(JSON.parse(JSON.stringify(state.shapes)));
    setConnectors(JSON.parse(JSON.stringify(state.connectors)));
    clearSelection();
  }, [historyIndex, setShapes, setConnectors, clearSelection]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyRef.current.length - 1;

  return { saveHistory, undo, redo, canUndo, canRedo, historyIndex };
}
