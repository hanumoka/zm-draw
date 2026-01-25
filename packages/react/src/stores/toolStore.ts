import { create } from 'zustand';
import type { ToolType } from '../types';

interface ToolState {
  // Current tool
  tool: ToolType;

  // Connector mode state
  connectingFrom: string | null;

  // Text editing state
  editingId: string | null;

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
}

export const useToolStore = create<ToolState>((set) => ({
  tool: 'select',
  connectingFrom: null,
  editingId: null,

  setTool: (tool) =>
    set({
      tool,
      connectingFrom: null, // Reset connecting when changing tools
    }),

  resetTool: () =>
    set({
      tool: 'select',
      connectingFrom: null,
      editingId: null,
    }),

  setConnectingFrom: (id) => set({ connectingFrom: id }),

  startConnecting: (fromId) => set({ connectingFrom: fromId }),

  cancelConnecting: () => set({ connectingFrom: null }),

  setEditingId: (id) => set({ editingId: id }),

  startEditing: (id) => set({ editingId: id }),

  stopEditing: () => set({ editingId: null }),
}));
