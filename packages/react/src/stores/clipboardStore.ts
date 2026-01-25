import { create } from 'zustand';
import type { Shape } from '../types';

interface ClipboardState {
  // Copied shapes (stored without IDs, will be regenerated on paste)
  copiedShapes: Omit<Shape, 'id'>[];

  // Paste offset (to offset pasted shapes slightly)
  pasteOffset: number;

  // Actions
  copy: (shapes: Shape[]) => void;
  paste: () => Omit<Shape, 'id'>[] | null;
  clear: () => void;
  hasCopied: () => boolean;
}

const PASTE_OFFSET_INCREMENT = 20;

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  copiedShapes: [],
  pasteOffset: PASTE_OFFSET_INCREMENT,

  copy: (shapes) => {
    // Store shapes without IDs (deep clone)
    const copied = shapes.map((shape) => {
      const { id, ...rest } = shape;
      return JSON.parse(JSON.stringify(rest)) as Omit<Shape, 'id'>;
    });

    set({
      copiedShapes: copied,
      pasteOffset: PASTE_OFFSET_INCREMENT, // Reset offset on new copy
    });
  },

  paste: () => {
    const { copiedShapes, pasteOffset } = get();
    if (copiedShapes.length === 0) return null;

    // Apply offset to pasted shapes
    const pastedShapes = copiedShapes.map((shape) => ({
      ...shape,
      x: shape.x + pasteOffset,
      y: shape.y + pasteOffset,
    }));

    // Increment offset for next paste
    set({ pasteOffset: pasteOffset + PASTE_OFFSET_INCREMENT });

    return pastedShapes;
  },

  clear: () => set({ copiedShapes: [], pasteOffset: PASTE_OFFSET_INCREMENT }),

  hasCopied: () => get().copiedShapes.length > 0,
}));
