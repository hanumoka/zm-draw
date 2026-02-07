import { create } from 'zustand';
import type {
  Shape,
  Connector,
  ToolType,
  StickyNoteColor,
  DrawingToolType,
  StampType,
  ConnectorVariant,
} from '@zm-draw/core';
import { generateId, defaultFreeDrawProps } from '@zm-draw/core';

// Re-export for backwards compatibility
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

/** Selection type */
export type SelectionType = 'shape' | 'connector' | null;

/** Table cell editing state */
export interface EditingCell {
  shapeId: string;
  row: number;
  col: number;
}

// Viewport constants
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_STEP = 1.2;

interface EditorState {
  // === Canvas Data ===
  shapes: Shape[];
  connectors: Connector[];

  // === Selection ===
  selectedIds: string[];
  selectionType: SelectionType;

  // === Tool ===
  tool: ToolType;
  connectingFrom: string | null;
  connectorVariant: ConnectorVariant;
  editingId: string | null;
  editingCell: EditingCell | null;

  // === Drawing (pen/marker/highlighter) ===
  isDrawing: boolean;
  currentStrokeWidth: number;
  currentStrokeColor: string;
  currentStrokeOpacity: number;
  currentDrawingTool: DrawingToolType;

  // === Sticky / Stamp ===
  currentStickyColor: StickyNoteColor;
  currentStampType: StampType;

  // === Viewport ===
  scale: number;
  position: { x: number; y: number };
  isPanning: boolean;

  // === Actions - Shapes ===
  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  setShapes: (shapes: Shape[]) => void;
  clearShapes: () => void;

  // === Actions - Connectors ===
  addConnector: (connector: Connector) => void;
  deleteConnector: (id: string) => void;
  deleteConnectorsByShapeId: (shapeId: string) => void;
  setConnectors: (connectors: Connector[]) => void;
  clearConnectors: () => void;

  // === Actions - Bulk ===
  clearAll: () => void;
  loadFromJson: (data: { shapes: Shape[]; connectors: Connector[] }) => void;

  // === Actions - Selection ===
  select: (id: string | null) => void;
  selectConnector: (id: string | null) => void;
  clearSelection: () => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  toggleSelection: (id: string, shiftKey?: boolean) => void;
  selectMultiple: (ids: string[]) => void;
  isSelected: (id: string) => boolean;

  // === Actions - Tool ===
  setTool: (tool: ToolType) => void;
  resetTool: () => void;
  setConnectingFrom: (id: string | null) => void;
  startConnecting: (fromId: string) => void;
  cancelConnecting: () => void;
  setEditingId: (id: string | null) => void;
  startEditing: (id: string) => void;
  stopEditing: () => void;
  setEditingCell: (cell: EditingCell | null) => void;
  startCellEditing: (shapeId: string, row: number, col: number) => void;
  stopCellEditing: () => void;

  // === Actions - Drawing ===
  setIsDrawing: (isDrawing: boolean) => void;
  setStrokeWidth: (width: number) => void;
  setStrokeColor: (color: string) => void;
  setStrokeOpacity: (opacity: number) => void;
  setDrawingTool: (tool: DrawingToolType) => void;

  // === Actions - Sticky / Stamp ===
  setStickyColor: (color: StickyNoteColor) => void;
  setStampType: (type: StampType) => void;
  setConnectorVariant: (variant: ConnectorVariant) => void;

  // === Actions - Viewport ===
  setScale: (scale: number) => void;
  setPosition: (x: number, y: number) => void;
  setIsPanning: (isPanning: boolean) => void;
  resetViewport: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // ── Initial state ────────────────────────────────────────
  shapes: [],
  connectors: [],
  selectedIds: [],
  selectionType: null,
  tool: 'select',
  connectingFrom: null,
  connectorVariant: 'arrow',
  editingId: null,
  editingCell: null,
  isDrawing: false,
  currentStrokeWidth: defaultFreeDrawProps.pen.strokeWidth,
  currentStrokeColor: defaultFreeDrawProps.pen.stroke,
  currentStrokeOpacity: defaultFreeDrawProps.pen.opacity,
  currentDrawingTool: 'pen',
  currentStickyColor: 'yellow',
  currentStampType: 'thumbsUp',
  scale: 1,
  position: { x: 0, y: 0 },
  isPanning: false,

  // ── Shape actions ────────────────────────────────────────
  addShape: (shape) =>
    set((state) => ({ shapes: [...state.shapes, shape] })),

  updateShape: (id, updates) =>
    set((state) => ({
      shapes: state.shapes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),

  deleteShape: (id) =>
    set((state) => ({
      shapes: state.shapes.filter((s) => s.id !== id),
      connectors: state.connectors.filter(
        (c) => c.fromShapeId !== id && c.toShapeId !== id
      ),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
      selectionType:
        state.selectedIds.length === 1 && state.selectedIds[0] === id
          ? null
          : state.selectionType,
    })),

  setShapes: (shapes) => set({ shapes }),
  clearShapes: () => set({ shapes: [] }),

  // ── Connector actions ────────────────────────────────────
  addConnector: (connector) =>
    set((state) => ({ connectors: [...state.connectors, connector] })),

  deleteConnector: (id) =>
    set((state) => ({
      connectors: state.connectors.filter((c) => c.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
      selectionType:
        state.selectedIds.length === 1 && state.selectedIds[0] === id
          ? null
          : state.selectionType,
    })),

  deleteConnectorsByShapeId: (shapeId) =>
    set((state) => ({
      connectors: state.connectors.filter(
        (c) => c.fromShapeId !== shapeId && c.toShapeId !== shapeId
      ),
    })),

  setConnectors: (connectors) => set({ connectors }),
  clearConnectors: () => set({ connectors: [] }),

  // ── Bulk actions ─────────────────────────────────────────
  clearAll: () =>
    set({
      shapes: [],
      connectors: [],
      selectedIds: [],
      selectionType: null,
    }),

  loadFromJson: (data) =>
    set({
      shapes: data.shapes || [],
      connectors: data.connectors || [],
      selectedIds: [],
      selectionType: null,
    }),

  // ── Selection actions ────────────────────────────────────
  select: (id) =>
    set({
      selectedIds: id ? [id] : [],
      selectionType: id ? 'shape' : null,
    }),

  selectConnector: (id) =>
    set({
      selectedIds: id ? [id] : [],
      selectionType: id ? 'connector' : null,
    }),

  clearSelection: () =>
    set({ selectedIds: [], selectionType: null }),

  addToSelection: (id) =>
    set((state) => {
      if (state.selectedIds.includes(id)) return state;
      return {
        selectedIds: [...state.selectedIds, id],
        selectionType: 'shape',
      };
    }),

  removeFromSelection: (id) =>
    set((state) => {
      const newIds = state.selectedIds.filter((sid) => sid !== id);
      return {
        selectedIds: newIds,
        selectionType: newIds.length > 0 ? state.selectionType : null,
      };
    }),

  toggleSelection: (id, shiftKey = false) =>
    set((state) => {
      if (shiftKey) {
        const isCurrentlySelected = state.selectedIds.includes(id);
        if (isCurrentlySelected) {
          const newIds = state.selectedIds.filter((sid) => sid !== id);
          return {
            selectedIds: newIds,
            selectionType: newIds.length > 0 ? 'shape' : null,
          };
        } else {
          return {
            selectedIds: [...state.selectedIds, id],
            selectionType: 'shape',
          };
        }
      } else {
        return {
          selectedIds: [id],
          selectionType: 'shape',
        };
      }
    }),

  selectMultiple: (ids) =>
    set({
      selectedIds: ids,
      selectionType: ids.length > 0 ? 'shape' : null,
    }),

  isSelected: (id) => get().selectedIds.includes(id),

  // ── Tool actions ─────────────────────────────────────────
  setTool: (tool) => {
    if (tool === 'pen' || tool === 'marker' || tool === 'highlighter') {
      const props = defaultFreeDrawProps[tool];
      set({
        tool,
        connectingFrom: null,
        currentDrawingTool: tool as DrawingToolType,
        currentStrokeWidth: props.strokeWidth,
        currentStrokeOpacity: props.opacity,
      });
    } else {
      set({
        tool,
        connectingFrom: null,
        isDrawing: false,
      });
    }
  },

  resetTool: () =>
    set({
      tool: 'select',
      connectingFrom: null,
      editingId: null,
      editingCell: null,
      isDrawing: false,
    }),

  setConnectingFrom: (id) => set({ connectingFrom: id }),
  startConnecting: (fromId) => set({ connectingFrom: fromId }),
  cancelConnecting: () => set({ connectingFrom: null }),

  setEditingId: (id) => set({ editingId: id }),
  startEditing: (id) => set({ editingId: id }),
  stopEditing: () => set({ editingId: null }),

  setEditingCell: (cell) => set({ editingCell: cell }),
  startCellEditing: (shapeId, row, col) =>
    set({ editingCell: { shapeId, row, col } }),
  stopCellEditing: () => set({ editingCell: null }),

  // ── Drawing actions ──────────────────────────────────────
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  setStrokeWidth: (width) => set({ currentStrokeWidth: width }),
  setStrokeColor: (color) => set({ currentStrokeColor: color }),
  setStrokeOpacity: (opacity) => set({ currentStrokeOpacity: opacity }),
  setDrawingTool: (tool) => {
    const props = defaultFreeDrawProps[tool];
    set({
      currentDrawingTool: tool,
      currentStrokeWidth: props.strokeWidth,
      currentStrokeOpacity: props.opacity,
    });
  },

  // ── Sticky / Stamp / Connector variant ──────────────────
  setStickyColor: (color) => set({ currentStickyColor: color }),
  setStampType: (type) => set({ currentStampType: type }),
  setConnectorVariant: (variant) => set({ connectorVariant: variant }),

  // ── Viewport actions ─────────────────────────────────────
  setScale: (scale) =>
    set({ scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale)) }),

  setPosition: (x, y) => set({ position: { x, y } }),
  setIsPanning: (isPanning) => set({ isPanning }),

  resetViewport: () => set({ scale: 1, position: { x: 0, y: 0 } }),

  zoomIn: () => {
    const { scale } = get();
    set({ scale: Math.min(MAX_SCALE, scale * ZOOM_STEP) });
  },

  zoomOut: () => {
    const { scale } = get();
    set({ scale: Math.max(MIN_SCALE, scale / ZOOM_STEP) });
  },
}));
