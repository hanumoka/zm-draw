import { create } from 'zustand';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import type { Shape, Connector } from '../types';

/** User presence information for cursor sharing */
export interface UserPresence {
  odUserId: string;
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
  selection: string[];
  viewport: { x: number; y: number; scale: number };
  /** Whether this user is presenting in spotlight mode */
  isPresenting?: boolean;
}

/** Connection status */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

/** Collaboration store state */
interface CollaborationState {
  // Yjs document and providers
  ydoc: Y.Doc | null;
  wsProvider: WebsocketProvider | null;
  indexeddbProvider: IndexeddbPersistence | null;

  // Shared data maps
  yShapes: Y.Map<Shape> | null;
  yConnectors: Y.Map<Connector> | null;

  // Connection state
  isCollaborating: boolean;
  connectionStatus: ConnectionStatus;
  roomId: string | null;

  // User presence
  localUser: UserPresence | null;
  remoteUsers: Map<number, UserPresence>;

  // Actions
  initCollaboration: (roomId: string, serverUrl: string, userName?: string) => void;
  initOfflineOnly: (roomId: string) => void;
  disconnect: () => void;

  // Presence actions
  updateLocalCursor: (cursor: { x: number; y: number } | null) => void;
  updateLocalSelection: (selection: string[]) => void;
  updateLocalViewport: (viewport: { x: number; y: number; scale: number }) => void;
  startPresenting: () => void;
  stopPresenting: () => void;

  // Data sync actions
  setShape: (id: string, shape: Shape) => void;
  deleteShape: (id: string) => void;
  setConnector: (id: string, connector: Connector) => void;
  deleteConnector: (id: string) => void;

  // Sync helpers
  syncFromYjs: () => { shapes: Shape[]; connectors: Connector[] };
  syncToYjs: (shapes: Shape[], connectors: Connector[]) => void;
}

// Generate random color for user
const generateUserColor = () => {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Generate random user ID
const generateUserId = () => `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  // Initial state
  ydoc: null,
  wsProvider: null,
  indexeddbProvider: null,
  yShapes: null,
  yConnectors: null,
  isCollaborating: false,
  connectionStatus: 'disconnected',
  roomId: null,
  localUser: null,
  remoteUsers: new Map(),

  // Initialize collaboration with WebSocket server
  initCollaboration: (roomId, serverUrl, userName) => {
    const { disconnect } = get();

    // Disconnect existing connection
    disconnect();

    // Create new Yjs document
    const ydoc = new Y.Doc();
    const yShapes = ydoc.getMap<Shape>('shapes');
    const yConnectors = ydoc.getMap<Connector>('connectors');

    // Create WebSocket provider
    const wsProvider = new WebsocketProvider(serverUrl, roomId, ydoc);

    // Create IndexedDB persistence for offline support
    const indexeddbProvider = new IndexeddbPersistence(roomId, ydoc);

    // Set up local user
    const localUser: UserPresence = {
      odUserId: generateUserId(),
      name: userName || `User ${Math.floor(Math.random() * 1000)}`,
      color: generateUserColor(),
      cursor: null,
      selection: [],
      viewport: { x: 0, y: 0, scale: 1 },
    };

    // Set awareness state
    wsProvider.awareness.setLocalState(localUser);

    // Listen for awareness changes
    wsProvider.awareness.on('change', () => {
      const states = wsProvider.awareness.getStates();
      const remoteUsers = new Map<number, UserPresence>();

      states.forEach((state, clientId) => {
        if (clientId !== wsProvider.awareness.clientID && state) {
          remoteUsers.set(clientId, state as UserPresence);
        }
      });

      set({ remoteUsers });
    });

    // Listen for connection status
    wsProvider.on('status', (event: { status: string }) => {
      set({
        connectionStatus: event.status === 'connected' ? 'connected' :
                         event.status === 'connecting' ? 'connecting' : 'disconnected'
      });
    });

    set({
      ydoc,
      wsProvider,
      indexeddbProvider,
      yShapes,
      yConnectors,
      isCollaborating: true,
      connectionStatus: 'connecting',
      roomId,
      localUser,
    });
  },

  // Initialize offline-only mode (no WebSocket)
  initOfflineOnly: (roomId) => {
    const { disconnect } = get();

    // Disconnect existing connection
    disconnect();

    // Create new Yjs document
    const ydoc = new Y.Doc();
    const yShapes = ydoc.getMap<Shape>('shapes');
    const yConnectors = ydoc.getMap<Connector>('connectors');

    // Create IndexedDB persistence only
    const indexeddbProvider = new IndexeddbPersistence(roomId, ydoc);

    // Set up local user
    const localUser: UserPresence = {
      odUserId: generateUserId(),
      name: `User ${Math.floor(Math.random() * 1000)}`,
      color: generateUserColor(),
      cursor: null,
      selection: [],
      viewport: { x: 0, y: 0, scale: 1 },
    };

    set({
      ydoc,
      wsProvider: null,
      indexeddbProvider,
      yShapes,
      yConnectors,
      isCollaborating: true,
      connectionStatus: 'disconnected',
      roomId,
      localUser,
    });
  },

  // Disconnect from collaboration
  disconnect: () => {
    const { wsProvider, indexeddbProvider, ydoc } = get();

    if (wsProvider) {
      wsProvider.destroy();
    }

    if (indexeddbProvider) {
      indexeddbProvider.destroy();
    }

    if (ydoc) {
      ydoc.destroy();
    }

    set({
      ydoc: null,
      wsProvider: null,
      indexeddbProvider: null,
      yShapes: null,
      yConnectors: null,
      isCollaborating: false,
      connectionStatus: 'disconnected',
      roomId: null,
      localUser: null,
      remoteUsers: new Map(),
    });
  },

  // Update local cursor position
  updateLocalCursor: (cursor) => {
    const { wsProvider, localUser } = get();
    if (!wsProvider || !localUser) return;

    const updatedUser = { ...localUser, cursor };
    wsProvider.awareness.setLocalState(updatedUser);
    set({ localUser: updatedUser });
  },

  // Update local selection
  updateLocalSelection: (selection) => {
    const { wsProvider, localUser } = get();
    if (!wsProvider || !localUser) return;

    const updatedUser = { ...localUser, selection };
    wsProvider.awareness.setLocalState(updatedUser);
    set({ localUser: updatedUser });
  },

  // Update local viewport
  updateLocalViewport: (viewport) => {
    const { wsProvider, localUser } = get();
    if (!wsProvider || !localUser) return;

    const updatedUser = { ...localUser, viewport };
    wsProvider.awareness.setLocalState(updatedUser);
    set({ localUser: updatedUser });
  },

  // Start presenting in spotlight mode
  startPresenting: () => {
    const { wsProvider, localUser } = get();
    if (!wsProvider || !localUser) return;

    const updatedUser = { ...localUser, isPresenting: true };
    wsProvider.awareness.setLocalState(updatedUser);
    set({ localUser: updatedUser });
  },

  // Stop presenting in spotlight mode
  stopPresenting: () => {
    const { wsProvider, localUser } = get();
    if (!wsProvider || !localUser) return;

    const updatedUser = { ...localUser, isPresenting: false };
    wsProvider.awareness.setLocalState(updatedUser);
    set({ localUser: updatedUser });
  },

  // Set a shape in Yjs
  setShape: (id, shape) => {
    const { yShapes } = get();
    if (!yShapes) return;
    yShapes.set(id, shape);
  },

  // Delete a shape from Yjs
  deleteShape: (id) => {
    const { yShapes } = get();
    if (!yShapes) return;
    yShapes.delete(id);
  },

  // Set a connector in Yjs
  setConnector: (id, connector) => {
    const { yConnectors } = get();
    if (!yConnectors) return;
    yConnectors.set(id, connector);
  },

  // Delete a connector from Yjs
  deleteConnector: (id) => {
    const { yConnectors } = get();
    if (!yConnectors) return;
    yConnectors.delete(id);
  },

  // Sync data from Yjs to local arrays
  syncFromYjs: () => {
    const { yShapes, yConnectors } = get();

    const shapes: Shape[] = [];
    const connectors: Connector[] = [];

    if (yShapes) {
      yShapes.forEach((shape) => {
        shapes.push(shape);
      });
    }

    if (yConnectors) {
      yConnectors.forEach((connector) => {
        connectors.push(connector);
      });
    }

    return { shapes, connectors };
  },

  // Sync local arrays to Yjs
  syncToYjs: (shapes, connectors) => {
    const { yShapes, yConnectors, ydoc } = get();
    if (!yShapes || !yConnectors || !ydoc) return;

    // Use transaction for batch updates
    ydoc.transact(() => {
      // Clear existing data
      yShapes.clear();
      yConnectors.clear();

      // Add all shapes
      shapes.forEach((shape) => {
        yShapes.set(shape.id, shape);
      });

      // Add all connectors
      connectors.forEach((connector) => {
        yConnectors.set(connector.id, connector);
      });
    });
  },
}));
