import { useEffect, useCallback, useRef } from 'react';
import type { Shape, Connector } from '../types';
import { useCollaborationStore } from '../stores/collaborationStore';

interface UseCollaborationOptions {
  /** Room ID for collaboration */
  roomId?: string;
  /** WebSocket server URL (optional, offline mode if not provided) */
  serverUrl?: string;
  /** User name */
  userName?: string;
  /** Callback when shapes change from remote */
  onShapesChange?: (shapes: Shape[]) => void;
  /** Callback when connectors change from remote */
  onConnectorsChange?: (connectors: Connector[]) => void;
  /** Current shapes (for syncing to Yjs) */
  shapes?: Shape[];
  /** Current connectors (for syncing to Yjs) */
  connectors?: Connector[];
  /** Whether collaboration is enabled */
  enabled?: boolean;
}

/**
 * Hook for managing real-time collaboration with Yjs
 */
export function useCollaboration(options: UseCollaborationOptions = {}) {
  const {
    roomId,
    serverUrl,
    userName,
    onShapesChange,
    onConnectorsChange,
    shapes = [],
    connectors = [],
    enabled = false,
  } = options;

  // Store
  const initCollaboration = useCollaborationStore((s) => s.initCollaboration);
  const initOfflineOnly = useCollaborationStore((s) => s.initOfflineOnly);
  const disconnect = useCollaborationStore((s) => s.disconnect);
  const isCollaborating = useCollaborationStore((s) => s.isCollaborating);
  const connectionStatus = useCollaborationStore((s) => s.connectionStatus);
  const yShapes = useCollaborationStore((s) => s.yShapes);
  const yConnectors = useCollaborationStore((s) => s.yConnectors);
  const remoteUsers = useCollaborationStore((s) => s.remoteUsers);
  const localUser = useCollaborationStore((s) => s.localUser);
  const updateLocalCursor = useCollaborationStore((s) => s.updateLocalCursor);
  const updateLocalSelection = useCollaborationStore((s) => s.updateLocalSelection);
  const updateLocalViewport = useCollaborationStore((s) => s.updateLocalViewport);
  const setShape = useCollaborationStore((s) => s.setShape);
  const deleteShape = useCollaborationStore((s) => s.deleteShape);
  const setConnector = useCollaborationStore((s) => s.setConnector);
  const deleteConnector = useCollaborationStore((s) => s.deleteConnector);
  const syncToYjs = useCollaborationStore((s) => s.syncToYjs);

  // Track if we're syncing from Yjs to avoid infinite loops
  const isSyncingFromYjsRef = useRef(false);
  const prevShapesRef = useRef<Shape[]>([]);
  const prevConnectorsRef = useRef<Connector[]>([]);

  // Initialize collaboration when enabled
  useEffect(() => {
    if (!enabled || !roomId) {
      disconnect();
      return;
    }

    if (serverUrl) {
      initCollaboration(roomId, serverUrl, userName);
    } else {
      initOfflineOnly(roomId);
    }

    return () => {
      disconnect();
    };
  }, [enabled, roomId, serverUrl, userName, initCollaboration, initOfflineOnly, disconnect]);

  // Listen for Yjs changes and sync to local state
  useEffect(() => {
    if (!yShapes || !yConnectors || !isCollaborating) return;

    const handleShapesChange = () => {
      isSyncingFromYjsRef.current = true;

      const shapes: Shape[] = [];
      yShapes.forEach((shape) => {
        shapes.push(shape);
      });

      onShapesChange?.(shapes);

      // Small delay to prevent sync loop
      setTimeout(() => {
        isSyncingFromYjsRef.current = false;
      }, 50);
    };

    const handleConnectorsChange = () => {
      isSyncingFromYjsRef.current = true;

      const connectors: Connector[] = [];
      yConnectors.forEach((connector) => {
        connectors.push(connector);
      });

      onConnectorsChange?.(connectors);

      setTimeout(() => {
        isSyncingFromYjsRef.current = false;
      }, 50);
    };

    yShapes.observe(handleShapesChange);
    yConnectors.observe(handleConnectorsChange);

    // Initial sync from Yjs
    handleShapesChange();
    handleConnectorsChange();

    return () => {
      yShapes.unobserve(handleShapesChange);
      yConnectors.unobserve(handleConnectorsChange);
    };
  }, [yShapes, yConnectors, isCollaborating, onShapesChange, onConnectorsChange]);

  // Sync local changes to Yjs
  useEffect(() => {
    if (!isCollaborating || isSyncingFromYjsRef.current) return;
    if (!yShapes || !yConnectors) return;

    // Detect shape changes
    const prevShapeIds = new Set(prevShapesRef.current.map((s) => s.id));
    const currentShapeIds = new Set(shapes.map((s) => s.id));

    // Added or updated shapes
    shapes.forEach((shape) => {
      const prevShape = prevShapesRef.current.find((s) => s.id === shape.id);
      if (!prevShape || JSON.stringify(prevShape) !== JSON.stringify(shape)) {
        setShape(shape.id, shape);
      }
    });

    // Deleted shapes
    prevShapesRef.current.forEach((shape) => {
      if (!currentShapeIds.has(shape.id)) {
        deleteShape(shape.id);
      }
    });

    // Detect connector changes
    const prevConnectorIds = new Set(prevConnectorsRef.current.map((c) => c.id));
    const currentConnectorIds = new Set(connectors.map((c) => c.id));

    // Added or updated connectors
    connectors.forEach((connector) => {
      const prevConnector = prevConnectorsRef.current.find((c) => c.id === connector.id);
      if (!prevConnector || JSON.stringify(prevConnector) !== JSON.stringify(connector)) {
        setConnector(connector.id, connector);
      }
    });

    // Deleted connectors
    prevConnectorsRef.current.forEach((connector) => {
      if (!currentConnectorIds.has(connector.id)) {
        deleteConnector(connector.id);
      }
    });

    prevShapesRef.current = shapes;
    prevConnectorsRef.current = connectors;
  }, [shapes, connectors, isCollaborating, yShapes, yConnectors, setShape, deleteShape, setConnector, deleteConnector]);

  // Cursor update (throttled)
  const updateCursor = useCallback((x: number, y: number) => {
    updateLocalCursor({ x, y });
  }, [updateLocalCursor]);

  const clearCursor = useCallback(() => {
    updateLocalCursor(null);
  }, [updateLocalCursor]);

  // Selection update
  const updateSelection = useCallback((ids: string[]) => {
    updateLocalSelection(ids);
  }, [updateLocalSelection]);

  // Viewport update
  const updateViewport = useCallback((x: number, y: number, scale: number) => {
    updateLocalViewport({ x, y, scale });
  }, [updateLocalViewport]);

  // Bulk sync (for initial load or paste)
  const bulkSync = useCallback((newShapes: Shape[], newConnectors: Connector[]) => {
    if (!isCollaborating) return;
    syncToYjs(newShapes, newConnectors);
  }, [isCollaborating, syncToYjs]);

  return {
    // State
    isCollaborating,
    connectionStatus,
    localUser,
    remoteUsers: Array.from(remoteUsers.values()),

    // Cursor actions
    updateCursor,
    clearCursor,

    // Selection actions
    updateSelection,

    // Viewport actions
    updateViewport,

    // Sync actions
    bulkSync,
  };
}
