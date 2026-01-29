import { create } from 'zustand';
import type { Shape, Connector, StickyNoteColor, StampType } from '../types';

// Generate unique ID
export const generateId = () => `shape-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Default shape properties
export const defaultShapeProps = {
  width: 100,
  height: 60,
  fill: '#3b82f6',
  stroke: '#1d4ed8',
  strokeWidth: 2,
  cornerRadius: 0,
  text: '',
  fontSize: 14,
  fontFamily: 'Arial',
  textColor: '#ffffff',
};

// Default text shape properties
export const defaultTextShapeProps = {
  width: 200,
  height: 30,
  fill: 'transparent',
  stroke: 'transparent',
  strokeWidth: 0,
  text: 'Text',
  fontSize: 16,
  fontFamily: 'Arial',
  textColor: '#000000',
  textAlign: 'left' as const,
  verticalAlign: 'top' as const,
};

// Default sticky note properties (FigJam style)
export const defaultStickyNoteProps = {
  width: 150,
  height: 150,
  fill: '#fef08a', // Yellow
  stroke: 'transparent',
  strokeWidth: 0,
  cornerRadius: 2,
  text: '',
  fontSize: 14,
  fontFamily: 'Arial',
  textColor: '#1a1a1a',
  textAlign: 'left' as const,
  verticalAlign: 'top' as const,
  stickyColor: 'yellow' as StickyNoteColor,
  opacity: 1,
};

// Default image shape properties
export const defaultImageShapeProps = {
  width: 200,
  height: 200,
  fill: 'transparent',
  stroke: 'transparent',
  strokeWidth: 0,
  preserveAspectRatio: true,
};

// Default stamp properties (FigJam style reactions)
export const defaultStampProps = {
  width: 48,
  height: 48,
  fill: 'transparent',
  stroke: 'transparent',
  strokeWidth: 0,
  stampType: 'thumbsUp' as StampType,
};

// Default freedraw properties for each tool
export const defaultFreeDrawProps = {
  pen: {
    stroke: '#1a1a1a',
    strokeWidth: 2,
    opacity: 1,
    lineCap: 'round' as const,
  },
  marker: {
    stroke: '#1a1a1a',
    strokeWidth: 8,
    opacity: 1,
    lineCap: 'round' as const,
  },
  highlighter: {
    stroke: '#facc15', // Yellow highlighter
    strokeWidth: 20,
    opacity: 0.5,
    lineCap: 'square' as const,
  },
};

interface CanvasState {
  // Data
  shapes: Shape[];
  connectors: Connector[];

  // Actions - Shapes
  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  setShapes: (shapes: Shape[]) => void;
  clearShapes: () => void;

  // Actions - Connectors
  addConnector: (connector: Connector) => void;
  deleteConnector: (id: string) => void;
  deleteConnectorsByShapeId: (shapeId: string) => void;
  setConnectors: (connectors: Connector[]) => void;
  clearConnectors: () => void;

  // Actions - Bulk
  clearAll: () => void;
  loadFromJson: (data: { shapes: Shape[]; connectors: Connector[] }) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  // Initial state
  shapes: [],
  connectors: [],

  // Shape actions
  addShape: (shape) =>
    set((state) => ({ shapes: [...state.shapes, shape] })),

  updateShape: (id, updates) =>
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),

  deleteShape: (id) =>
    set((state) => ({
      shapes: state.shapes.filter((s) => s.id !== id),
    })),

  setShapes: (shapes) => set({ shapes }),

  clearShapes: () => set({ shapes: [] }),

  // Connector actions
  addConnector: (connector) =>
    set((state) => ({ connectors: [...state.connectors, connector] })),

  deleteConnector: (id) =>
    set((state) => ({
      connectors: state.connectors.filter((c) => c.id !== id),
    })),

  deleteConnectorsByShapeId: (shapeId) =>
    set((state) => ({
      connectors: state.connectors.filter(
        (c) => c.fromShapeId !== shapeId && c.toShapeId !== shapeId
      ),
    })),

  setConnectors: (connectors) => set({ connectors }),

  clearConnectors: () => set({ connectors: [] }),

  // Bulk actions
  clearAll: () => set({ shapes: [], connectors: [] }),

  loadFromJson: (data) =>
    set({
      shapes: data.shapes || [],
      connectors: data.connectors || [],
    }),
}));
