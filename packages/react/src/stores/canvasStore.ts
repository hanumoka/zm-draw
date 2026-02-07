import { create } from 'zustand';
import type { Shape, Connector } from '@zm-draw/core';
import { generateId } from '@zm-draw/core';

// Re-export defaults and generateId from core for backwards compatibility
export { generateId } from '@zm-draw/core';
export {
  defaultShapeProps,
  defaultTextShapeProps,
  defaultStickyNoteProps,
  defaultFreeDrawProps,
  defaultImageShapeProps,
  defaultStampProps,
  defaultSectionProps,
  defaultTableProps,
  defaultMindmapProps,
  defaultEmbedProps,
} from '@zm-draw/core';

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
