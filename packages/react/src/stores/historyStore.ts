import { create } from 'zustand';
import type { Shape, Connector } from '../types';

interface HistoryEntry {
  shapes: Shape[];
  connectors: Connector[];
}

interface HistoryState {
  // History stack
  history: HistoryEntry[];
  currentIndex: number;

  // Flags
  isUndoRedo: boolean;

  // Computed
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Actions
  pushState: (shapes: Shape[], connectors: Connector[]) => void;
  undo: () => HistoryEntry | null;
  redo: () => HistoryEntry | null;
  clear: () => void;
  setIsUndoRedo: (value: boolean) => void;
}

const MAX_HISTORY_SIZE = 50;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  history: [],
  currentIndex: -1,
  isUndoRedo: false,

  canUndo: () => get().currentIndex > 0,

  canRedo: () => get().currentIndex < get().history.length - 1,

  pushState: (shapes, connectors) => {
    const { isUndoRedo, currentIndex, history } = get();

    // Skip if this is an undo/redo operation
    if (isUndoRedo) {
      set({ isUndoRedo: false });
      return;
    }

    // Remove future states if we're not at the end
    const newHistory = history.slice(0, currentIndex + 1);

    // Add new state (deep clone)
    newHistory.push({
      shapes: JSON.parse(JSON.stringify(shapes)),
      connectors: JSON.parse(JSON.stringify(connectors)),
    });

    // Limit history size
    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory.shift();
      set({
        history: newHistory,
        currentIndex: newHistory.length - 1,
      });
    } else {
      set({
        history: newHistory,
        currentIndex: newHistory.length - 1,
      });
    }
  },

  undo: () => {
    const { currentIndex, history } = get();
    if (currentIndex <= 0) return null;

    const newIndex = currentIndex - 1;
    set({
      currentIndex: newIndex,
      isUndoRedo: true,
    });

    // Return deep clone of state
    const state = history[newIndex];
    return {
      shapes: JSON.parse(JSON.stringify(state.shapes)),
      connectors: JSON.parse(JSON.stringify(state.connectors)),
    };
  },

  redo: () => {
    const { currentIndex, history } = get();
    if (currentIndex >= history.length - 1) return null;

    const newIndex = currentIndex + 1;
    set({
      currentIndex: newIndex,
      isUndoRedo: true,
    });

    // Return deep clone of state
    const state = history[newIndex];
    return {
      shapes: JSON.parse(JSON.stringify(state.shapes)),
      connectors: JSON.parse(JSON.stringify(state.connectors)),
    };
  },

  clear: () =>
    set({
      history: [],
      currentIndex: -1,
      isUndoRedo: false,
    }),

  setIsUndoRedo: (value) => set({ isUndoRedo: value }),
}));
