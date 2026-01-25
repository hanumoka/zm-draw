import { create } from 'zustand';

interface ViewportState {
  // Zoom and pan
  scale: number;
  position: { x: number; y: number };

  // Panning mode
  isPanning: boolean;

  // Actions
  setScale: (scale: number) => void;
  setPosition: (x: number, y: number) => void;
  setIsPanning: (isPanning: boolean) => void;
  resetViewport: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_STEP = 1.2;

export const useViewportStore = create<ViewportState>((set, get) => ({
  scale: 1,
  position: { x: 0, y: 0 },
  isPanning: false,

  setScale: (scale) =>
    set({
      scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale)),
    }),

  setPosition: (x, y) => set({ position: { x, y } }),

  setIsPanning: (isPanning) => set({ isPanning }),

  resetViewport: () =>
    set({
      scale: 1,
      position: { x: 0, y: 0 },
    }),

  zoomIn: () => {
    const { scale } = get();
    set({ scale: Math.min(MAX_SCALE, scale * ZOOM_STEP) });
  },

  zoomOut: () => {
    const { scale } = get();
    set({ scale: Math.max(MIN_SCALE, scale / ZOOM_STEP) });
  },
}));
