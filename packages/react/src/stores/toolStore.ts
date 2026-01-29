import { create } from 'zustand';
import type { ToolType, StickyNoteColor, DrawingToolType, StampType, ConnectorVariant } from '../types';
import { defaultFreeDrawProps } from './canvasStore';

/** Table cell editing state */
export interface EditingCell {
  shapeId: string;
  row: number;
  col: number;
}

interface ToolState {
  // Current tool
  tool: ToolType;

  // Connector mode state
  connectingFrom: string | null;
  connectorVariant: ConnectorVariant;

  // Text editing state
  editingId: string | null;

  // Table cell editing state
  editingCell: EditingCell | null;

  // Drawing state (for pen/marker/highlighter)
  isDrawing: boolean;
  currentStrokeWidth: number;
  currentStrokeColor: string;
  currentStrokeOpacity: number;
  currentDrawingTool: DrawingToolType;

  // Sticky note state
  currentStickyColor: StickyNoteColor;

  // Stamp state
  currentStampType: StampType;

  // Actions
  setTool: (tool: ToolType) => void;
  resetTool: () => void;

  // Connector actions
  setConnectingFrom: (id: string | null) => void;
  startConnecting: (fromId: string) => void;
  cancelConnecting: () => void;

  // Text editing actions
  setEditingId: (id: string | null) => void;
  startEditing: (id: string) => void;
  stopEditing: () => void;

  // Table cell editing actions
  setEditingCell: (cell: EditingCell | null) => void;
  startCellEditing: (shapeId: string, row: number, col: number) => void;
  stopCellEditing: () => void;

  // Drawing actions
  setIsDrawing: (isDrawing: boolean) => void;
  setStrokeWidth: (width: number) => void;
  setStrokeColor: (color: string) => void;
  setStrokeOpacity: (opacity: number) => void;
  setDrawingTool: (tool: DrawingToolType) => void;

  // Sticky note actions
  setStickyColor: (color: StickyNoteColor) => void;

  // Stamp actions
  setStampType: (type: StampType) => void;

  // Connector actions
  setConnectorVariant: (variant: ConnectorVariant) => void;
}

export const useToolStore = create<ToolState>((set) => ({
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

  setTool: (tool) => {
    // When setting to a drawing tool, update stroke properties
    if (tool === 'pen' || tool === 'marker' || tool === 'highlighter') {
      const props = defaultFreeDrawProps[tool];
      set({
        tool,
        connectingFrom: null,
        currentDrawingTool: tool,
        currentStrokeWidth: props.strokeWidth,
        currentStrokeOpacity: props.opacity,
      });
    } else {
      set({
        tool,
        connectingFrom: null,
        isDrawing: false, // Stop drawing when switching tools
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

  startCellEditing: (shapeId, row, col) => set({ editingCell: { shapeId, row, col } }),

  stopCellEditing: () => set({ editingCell: null }),

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

  setStickyColor: (color) => set({ currentStickyColor: color }),

  setStampType: (type) => set({ currentStampType: type }),

  setConnectorVariant: (variant) => set({ connectorVariant: variant }),
}));
