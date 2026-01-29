import { useEffect, useCallback, useRef, useMemo } from 'react';
import type { Shape, Connector } from '../types';
import { useCollaborationStore } from '../stores/collaborationStore';
import { useSpotlightStore } from '../stores/spotlightStore';

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
  /** Callback when viewport should change (for following presenter) */
  onViewportChange?: (viewport: { x: number; y: number; scale: number }) => void;
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
    onViewportChange,
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
  const startPresenting = useCollaborationStore((s) => s.startPresenting);
  const stopPresenting = useCollaborationStore((s) => s.stopPresenting);
  const setShape = useCollaborationStore((s) => s.setShape);
  const deleteShape = useCollaborationStore((s) => s.deleteShape);
  const setConnector = useCollaborationStore((s) => s.setConnector);
  const deleteConnector = useCollaborationStore((s) => s.deleteConnector);
  const syncToYjs = useCollaborationStore((s) => s.syncToYjs);

  // Spotlight store - select specific functions to avoid unnecessary re-renders
  const isFollowing = useSpotlightStore((s) => s.isFollowing);
  const presenterId = useSpotlightStore((s) => s.presenterId);
  const onRemoteSpotlightStart = useSpotlightStore((s) => s.onRemoteSpotlightStart);
  const onRemoteSpotlightStop = useSpotlightStore((s) => s.onRemoteSpotlightStop);
  const spotlightStartSpotlight = useSpotlightStore((s) => s.startSpotlight);
  const spotlightStopSpotlight = useSpotlightStore((s) => s.stopSpotlight);

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

  // Track if initial sync has been done
  const initialSyncDoneRef = useRef(false);

  // Listen for Yjs changes and sync to local state
  useEffect(() => {
    if (!yShapes || !yConnectors || !isCollaborating) return;

    const handleShapesChange = () => {
      isSyncingFromYjsRef.current = true;

      const yjsShapes: Shape[] = [];
      yShapes.forEach((shape) => {
        yjsShapes.push(shape);
      });

      onShapesChange?.(yjsShapes);

      // Small delay to prevent sync loop
      setTimeout(() => {
        isSyncingFromYjsRef.current = false;
      }, 50);
    };

    const handleConnectorsChange = () => {
      isSyncingFromYjsRef.current = true;

      const yjsConnectors: Connector[] = [];
      yConnectors.forEach((connector) => {
        yjsConnectors.push(connector);
      });

      onConnectorsChange?.(yjsConnectors);

      setTimeout(() => {
        isSyncingFromYjsRef.current = false;
      }, 50);
    };

    yShapes.observe(handleShapesChange);
    yConnectors.observe(handleConnectorsChange);

    // Initial sync: prefer Yjs data if it exists, otherwise sync local to Yjs
    if (!initialSyncDoneRef.current) {
      initialSyncDoneRef.current = true;
      const yjsHasData = yShapes.size > 0 || yConnectors.size > 0;

      if (yjsHasData) {
        // Yjs has data, sync to local
        handleShapesChange();
        handleConnectorsChange();
      }
      // If Yjs is empty, local→Yjs sync will happen via the other useEffect
    }

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

  // Cursor update (throttled to ~30fps)
  const lastCursorUpdateRef = useRef(0);
  const updateCursor = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - lastCursorUpdateRef.current < 33) return; // ~30fps
    lastCursorUpdateRef.current = now;
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

  // Track previous presenter to detect changes
  const prevPresenterRef = useRef<string | null>(null);

  // Memoize remote users array to prevent unnecessary re-renders
  const remoteUsersArray = useMemo(() => Array.from(remoteUsers.values()), [remoteUsers]);

  // Detect remote presenter and show follow request
  useEffect(() => {
    if (!isCollaborating) return;

    // Find a remote user who is presenting
    const presenter = remoteUsersArray.find((user) => user.isPresenting);
    const currentPresenterId = presenter?.odUserId || null;

    // Presenter changed
    if (currentPresenterId !== prevPresenterRef.current) {
      prevPresenterRef.current = currentPresenterId;

      if (presenter) {
        // Remote user started presenting
        onRemoteSpotlightStart(
          presenter.odUserId,
          presenter.name,
          presenter.color
        );
      } else {
        // Presenter stopped
        onRemoteSpotlightStop();
      }
    }
  }, [isCollaborating, remoteUsersArray, onRemoteSpotlightStart, onRemoteSpotlightStop]);

  // Follow presenter's viewport if following
  useEffect(() => {
    if (!isFollowing || !presenterId || !onViewportChange) return;

    // Find the presenter
    const presenter = remoteUsersArray.find((user) => user.odUserId === presenterId);

    if (presenter?.viewport) {
      onViewportChange(presenter.viewport);
    }
  }, [isFollowing, presenterId, remoteUsersArray, onViewportChange]);

  // Spotlight actions
  const handleStartSpotlight = useCallback(() => {
    if (!localUser) return;
    spotlightStartSpotlight(localUser.odUserId, localUser.name, localUser.color);
    startPresenting();
  }, [localUser, spotlightStartSpotlight, startPresenting]);

  const handleStopSpotlight = useCallback(() => {
    spotlightStopSpotlight();
    stopPresenting();
  }, [spotlightStopSpotlight, stopPresenting]);

  return {
    // State
    isCollaborating,
    connectionStatus,
    localUser,
    remoteUsers: remoteUsersArray,

    // Cursor actions
    updateCursor,
    clearCursor,

    // Selection actions
    updateSelection,

    // Viewport actions
    updateViewport,

    // Sync actions
    bulkSync,

    // Spotlight actions
    startSpotlight: handleStartSpotlight,
    stopSpotlight: handleStopSpotlight,
  };
}
