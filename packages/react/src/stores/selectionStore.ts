import { create } from 'zustand';

interface SelectionState {
  // Current selection (single for now, will extend to multi-select)
  selectedId: string | null;

  // Future: multi-select support
  // selectedIds: string[];

  // Actions
  select: (id: string | null) => void;
  clearSelection: () => void;

  // Future: multi-select actions
  // addToSelection: (id: string) => void;
  // removeFromSelection: (id: string) => void;
  // toggleSelection: (id: string) => void;
  // selectAll: (ids: string[]) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedId: null,

  select: (id) => set({ selectedId: id }),

  clearSelection: () => set({ selectedId: null }),
}));
