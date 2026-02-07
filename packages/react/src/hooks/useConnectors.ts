'use client';

import { useCallback } from 'react';
import type { Connector } from '@zm-draw/core';
import {
  getShapeCenter,
  getShapeEdgePoint,
  getConnectionPoint,
  getConnectionPoints,
  getOrthogonalPath,
} from '@zm-draw/core';
import { useEditorStore } from '../stores/editorStore';

/**
 * Hook that provides connector operations for the drawing canvas.
 *
 * Extracts connector logic from DrawCanvas.tsx and uses the unified editorStore.
 * Re-exports geometry utilities from @zm-draw/core for convenience.
 */
export function useConnectors() {
  const connectors = useEditorStore((s) => s.connectors);
  const connectorVariant = useEditorStore((s) => s.connectorVariant);
  const addConnectorToStore = useEditorStore((s) => s.addConnector);
  const setConnectors = useEditorStore((s) => s.setConnectors);

  /**
   * Create and add a new connector between two shapes.
   * Determines arrow heads and routing based on the current connectorVariant.
   * Skips creation if fromId === toId or if the connector already exists.
   */
  const addConnector = useCallback(
    (fromId: string, toId: string) => {
      if (fromId === toId) return;

      const exists = connectors.some(
        (c) =>
          (c.fromShapeId === fromId && c.toShapeId === toId) ||
          (c.fromShapeId === toId && c.toShapeId === fromId)
      );
      if (exists) return;

      let arrowStart: 'none' | 'arrow' = 'none';
      let arrowEnd: 'none' | 'arrow' = 'arrow';
      let routing: 'straight' | 'orthogonal' = 'straight';

      switch (connectorVariant) {
        case 'arrow':
          arrowEnd = 'arrow';
          break;
        case 'bidirectional':
          arrowStart = 'arrow';
          arrowEnd = 'arrow';
          break;
        case 'elbow':
          arrowEnd = 'arrow';
          routing = 'orthogonal';
          break;
        case 'line':
          arrowStart = 'none';
          arrowEnd = 'none';
          break;
      }

      const newConnector: Connector = {
        id: `conn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        fromShapeId: fromId,
        toShapeId: toId,
        stroke: '#6b7280',
        strokeWidth: 2,
        arrow: arrowEnd === 'arrow',
        arrowStart,
        arrowEnd,
        routing,
      };

      addConnectorToStore(newConnector);
    },
    [connectors, connectorVariant, addConnectorToStore]
  );

  /**
   * Update an existing connector by ID with partial updates.
   */
  const updateConnector = useCallback(
    (id: string, updates: Partial<Connector>) => {
      setConnectors(
        connectors.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    },
    [connectors, setConnectors]
  );

  /**
   * Get the dash pattern array for a given line style.
   */
  const getLineDash = useCallback(
    (style?: 'solid' | 'dashed' | 'dotted'): number[] => {
      switch (style) {
        case 'dashed':
          return [10, 5];
        case 'dotted':
          return [3, 3];
        default:
          return [];
      }
    },
    []
  );

  return {
    connectors,
    addConnector,
    updateConnector,
    setConnectors,
    getLineDash,
    // Re-exported geometry utilities from @zm-draw/core
    getShapeCenter,
    getShapeEdgePoint,
    getConnectionPoint,
    getConnectionPoints,
    getOrthogonalPath,
  };
}
