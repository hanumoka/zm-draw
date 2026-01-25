import { create } from 'zustand';

type SelectionType = 'shape' | 'connector' | null;

interface SelectionState {
  // Current selection (single for now, will extend to multi-select)
  selectedId: string | null;
  selectionType: SelectionType;

  // Future: multi-select support
  // selectedIds: string[];

  // Actions
  select: (id: string | null) => void;
  selectConnector: (id: string | null) => void;
  clearSelection: () => void;

  // Future: multi-select actions
  // addToSelection: (id: string) => void;
  // removeFromSelection: (id: string) => void;
  // toggleSelection: (id: string) => void;
  // selectAll: (ids: string[]) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedId: null,
  selectionType: null,

  select: (id) => set({ selectedId: id, selectionType: id ? 'shape' : null }),

  selectConnector: (id) => set({ selectedId: id, selectionType: id ? 'connector' : null }),

  clearSelection: () => set({ selectedId: null, selectionType: null }),
}));
