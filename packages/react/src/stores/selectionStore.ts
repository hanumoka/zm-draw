import { create } from 'zustand';

type SelectionType = 'shape' | 'connector' | null;

interface SelectionState {
  // Multi-select support
  selectedIds: string[];
  selectionType: SelectionType;

  // Backward compatibility getter (returns first selected or null)
  selectedId: string | null;

  // Actions - Single selection
  select: (id: string | null) => void;
  selectConnector: (id: string | null) => void;
  clearSelection: () => void;

  // Actions - Multi-select
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  toggleSelection: (id: string, shiftKey?: boolean) => void;
  selectMultiple: (ids: string[]) => void;
  isSelected: (id: string) => boolean;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedIds: [],
  selectionType: null,

  // Backward compatibility: returns first selected ID or null
  get selectedId() {
    const state = get();
    return state.selectedIds.length > 0 ? state.selectedIds[0] : null;
  },

  // Single select - replaces current selection
  select: (id) => set({
    selectedIds: id ? [id] : [],
    selectionType: id ? 'shape' : null,
  }),

  // Select connector (single only for now)
  selectConnector: (id) => set({
    selectedIds: id ? [id] : [],
    selectionType: id ? 'connector' : null,
  }),

  // Clear all selection
  clearSelection: () => set({
    selectedIds: [],
    selectionType: null,
  }),

  // Add to existing selection
  addToSelection: (id) => set((state) => {
    if (state.selectedIds.includes(id)) return state;
    return {
      selectedIds: [...state.selectedIds, id],
      selectionType: 'shape',
    };
  }),

  // Remove from selection
  removeFromSelection: (id) => set((state) => {
    const newIds = state.selectedIds.filter((sid) => sid !== id);
    return {
      selectedIds: newIds,
      selectionType: newIds.length > 0 ? state.selectionType : null,
    };
  }),

  // Toggle selection (with optional shift key for multi-select)
  toggleSelection: (id, shiftKey = false) => set((state) => {
    const isCurrentlySelected = state.selectedIds.includes(id);

    if (shiftKey) {
      // Shift+Click: add or remove from selection
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
      // Normal click: replace selection
      return {
        selectedIds: isCurrentlySelected ? [] : [id],
        selectionType: isCurrentlySelected ? null : 'shape',
      };
    }
  }),

  // Select multiple IDs (replaces current selection)
  selectMultiple: (ids) => set({
    selectedIds: ids,
    selectionType: ids.length > 0 ? 'shape' : null,
  }),

  // Check if an ID is selected
  isSelected: (id) => get().selectedIds.includes(id),
}));
