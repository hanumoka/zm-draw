'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect, useRef } from 'react';
import { TooltipProvider, Tooltip } from '../components/Tooltip';
import { PanelResizer } from '../components/PanelResizer';
import { ColorPicker } from '../components/ColorPicker';
import type { DrawCanvasHandle, ToolType, Connector, Shape, StickyNoteColor } from '@zm-draw/react';
import { useToolStore, useSelectionStore, STICKY_COLORS } from '@zm-draw/react';

// Konva requires window, so we need to dynamically import
const DrawCanvas = dynamic(
  () => import('@zm-draw/react').then((mod) => mod.DrawCanvas),
  { ssr: false }
);

const Minimap = dynamic(
  () => import('@zm-draw/react').then((mod) => mod.Minimap),
  { ssr: false }
);

interface SelectedShape {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  // Text properties
  text?: string;
  fontSize?: number;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
}

// Icons as components
const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const PanelRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);

const PanelRightCloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="15" y1="3" x2="15" y2="21" />
    <polyline points="10 15 13 12 10 9" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const GridSnapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ZoomInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ZoomFitIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

// Line style icons
const LineSolidIcon = () => (
  <svg width="24" height="16" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="2" y1="8" x2="22" y2="8" />
  </svg>
);

const LineDashedIcon = () => (
  <svg width="24" height="16" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2">
    <line x1="2" y1="8" x2="22" y2="8" />
  </svg>
);

const LineDottedIcon = () => (
  <svg width="24" height="16" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2">
    <line x1="2" y1="8" x2="22" y2="8" />
  </svg>
);

// Routing icons
const RoutingStraightIcon = () => (
  <svg width="24" height="16" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="2" y1="12" x2="22" y2="4" />
  </svg>
);

const RoutingOrthogonalIcon = () => (
  <svg width="24" height="16" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="2 12 12 12 12 4 22 4" />
  </svg>
);

// Arrow type icons
const ArrowNoneIcon = () => (
  <svg width="24" height="16" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="8" x2="20" y2="8" />
  </svg>
);

const ArrowEndIcon = () => (
  <svg width="24" height="16" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="8" x2="18" y2="8" />
    <polyline points="14 4 18 8 14 12" fill="currentColor" />
  </svg>
);

// Context menu icons
const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const DuplicateIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <rect x="4" y="4" width="12" height="12" rx="2" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// Layer panel icons
const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const UnlockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

const LayersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

// Text alignment icons
const AlignLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="15" y2="12" />
    <line x1="3" y1="18" x2="18" y2="18" />
  </svg>
);

const AlignCenterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="6" y1="12" x2="18" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

const AlignRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="9" y1="12" x2="21" y2="12" />
    <line x1="6" y1="18" x2="21" y2="18" />
  </svg>
);

// Shape alignment icons
const AlignShapeLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="4" x2="4" y2="20" />
    <rect x="7" y="6" width="10" height="5" rx="1" />
    <rect x="7" y="13" width="6" height="5" rx="1" />
  </svg>
);

const AlignShapeCenterHIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="4" x2="12" y2="20" />
    <rect x="6" y="6" width="12" height="5" rx="1" />
    <rect x="8" y="13" width="8" height="5" rx="1" />
  </svg>
);

const AlignShapeRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="20" y1="4" x2="20" y2="20" />
    <rect x="7" y="6" width="10" height="5" rx="1" />
    <rect x="11" y="13" width="6" height="5" rx="1" />
  </svg>
);

const AlignShapeTopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="4" x2="20" y2="4" />
    <rect x="6" y="7" width="5" height="10" rx="1" />
    <rect x="13" y="7" width="5" height="6" rx="1" />
  </svg>
);

const AlignShapeMiddleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="12" x2="20" y2="12" />
    <rect x="6" y="5" width="5" height="14" rx="1" />
    <rect x="13" y="8" width="5" height="8" rx="1" />
  </svg>
);

const AlignShapeBottomIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="20" x2="20" y2="20" />
    <rect x="6" y="7" width="5" height="10" rx="1" />
    <rect x="13" y="11" width="5" height="6" rx="1" />
  </svg>
);

const DistributeHIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="8" width="4" height="8" rx="1" />
    <rect x="10" y="8" width="4" height="8" rx="1" />
    <rect x="17" y="8" width="4" height="8" rx="1" />
  </svg>
);

const DistributeVIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="8" y="3" width="8" height="4" rx="1" />
    <rect x="8" y="10" width="8" height="4" rx="1" />
    <rect x="8" y="17" width="8" height="4" rx="1" />
  </svg>
);

const GroupIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="8" height="8" rx="1" />
    <rect x="13" y="13" width="8" height="8" rx="1" />
    <path d="M11 6h3M14 6v3M10 18h-3M7 18v-3" />
  </svg>
);

const UngroupIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="8" height="8" rx="1" />
    <rect x="13" y="13" width="8" height="8" rx="1" />
    <line x1="11" y1="6" x2="14" y2="6" strokeDasharray="2 2" />
    <line x1="10" y1="18" x2="7" y2="18" strokeDasharray="2 2" />
  </svg>
);

// FigJam icons
const StickyNoteIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="1" />
    <path d="M15 3v6h6" />
    <path d="M15 9l6-6" />
  </svg>
);

const PenIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </svg>
);

const MarkerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 2l4 4-10 10H8v-4L18 2z" />
    <path d="M8 12l-4 8 8-4" />
  </svg>
);

const HighlighterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 11l-6 6v3h9l3-3" />
    <path d="M22 12l-4.6 4.6a2 2 0 01-2.8 0l-5.2-5.2a2 2 0 010-2.8L14 4" />
  </svg>
);

const EraserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 20H7L3 16c-.6-.6-.6-1.5 0-2.1l9.9-9.9c.6-.6 1.5-.6 2.1 0l5 5c.6.6.6 1.5 0 2.1L13 18" />
    <path d="M6 11l8 8" />
    <path d="M4 20h16" />
  </svg>
);

// Shape icons for the Shapes panel
const ShapeIcons = {
  // Connectors
  arrowRight: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  arrowBidirectional: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
      <polyline points="12 5 5 12 12 19" />
    </svg>
  ),
  arrowElbow: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="5 5 5 12 19 12" />
      <polyline points="14 7 19 12 14 17" />
    </svg>
  ),
  line: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  ),
  // Basic shapes
  rectangle: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  roundedRect: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="6" />
    </svg>
  ),
  circle: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  ellipse: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="12" rx="10" ry="6" />
    </svg>
  ),
  triangle: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 3 22 21 2 21" />
    </svg>
  ),
  triangleDown: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 21 2 3 22 3" />
    </svg>
  ),
  diamond: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 22 12 12 22 2 12" />
    </svg>
  ),
  pentagon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 22 9 18 21 6 21 2 9" />
    </svg>
  ),
  hexagon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 21 7 21 17 12 22 3 17 3 7" />
    </svg>
  ),
  star: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  cross: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="9 2 15 2 15 9 22 9 22 15 15 15 15 22 9 22 9 15 2 15 2 9 9 9" />
    </svg>
  ),
  // Flowchart
  process: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" />
    </svg>
  ),
  decision: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 22 12 12 22 2 12" />
    </svg>
  ),
  terminal: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" rx="6" />
    </svg>
  ),
  document: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4 L20 4 L20 18 Q12 22 4 18 Z" />
    </svg>
  ),
  database: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 5v14c0 1.66-4.03 3-9 3s-9-1.34-9-3V5" />
    </svg>
  ),
  parallelogram: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="6 4 22 4 18 20 2 20" />
    </svg>
  ),
  // FigJam shapes
  stickyNote: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M15 3v6h6" />
      <path d="M15 9l6-6" />
    </svg>
  ),
};

// Sticky Note Color Button Component
function StickyColorButton({
  color,
  hexColor,
  isActive,
  onClick,
}: {
  color: StickyNoteColor;
  hexColor: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip content={color.charAt(0).toUpperCase() + color.slice(1)}>
      <button
        className={`zm-sticky-color-btn ${isActive ? 'active' : ''}`}
        style={{ backgroundColor: hexColor }}
        onClick={onClick}
      />
    </Tooltip>
  );
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  children,
  defaultOpen = true
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="zm-shapes-section">
      <button
        className="zm-shapes-section-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="zm-shapes-section-chevron">
          {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </span>
        <span className="zm-shapes-section-title">{title}</span>
      </button>
      {isOpen && (
        <div className="zm-shapes-section-content">
          {children}
        </div>
      )}
    </div>
  );
}

// Shape Button Component
function ShapeButton({
  icon,
  label,
  onClick,
  active = false
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <Tooltip content={label}>
      <button
        className={`zm-shape-button ${active ? 'active' : ''}`}
        onClick={onClick}
      >
        {icon}
      </button>
    </Tooltip>
  );
}

// Selection Context Menu Component
function SelectionContextMenu({
  shape,
  viewport,
  canvasOffset,
  onCopy,
  onDuplicate,
  onDelete,
}: {
  shape: SelectedShape;
  viewport: { scale: number; position: { x: number; y: number } };
  canvasOffset: { left: number; top: number };
  onCopy: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  // Calculate screen position of the shape
  const screenX = shape.x * viewport.scale + viewport.position.x + canvasOffset.left;
  const screenY = shape.y * viewport.scale + viewport.position.y + canvasOffset.top;
  const screenWidth = shape.width * viewport.scale;

  // Position menu above the shape, centered
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: screenX + screenWidth / 2,
    top: screenY - 48,
    transform: 'translateX(-50%)',
    zIndex: 1000,
  };

  return (
    <div className="zm-context-menu" style={menuStyle}>
      <Tooltip content="Copy (Ctrl+C)">
        <button className="zm-context-menu-button" onClick={onCopy}>
          <CopyIcon />
        </button>
      </Tooltip>
      <Tooltip content="Duplicate (Ctrl+D)">
        <button className="zm-context-menu-button" onClick={onDuplicate}>
          <DuplicateIcon />
        </button>
      </Tooltip>
      <div className="zm-context-menu-divider" />
      <Tooltip content="Delete (Del)">
        <button className="zm-context-menu-button zm-context-menu-button-danger" onClick={onDelete}>
          <TrashIcon />
        </button>
      </Tooltip>
    </div>
  );
}

export default function Home() {
  const canvasRef = useRef<DrawCanvasHandle>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [selectedShape, setSelectedShape] = useState<SelectedShape | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(240);
  const [rightPanelWidth, setRightPanelWidth] = useState(280);
  const [searchQuery, setSearchQuery] = useState('');
  const [canvasOffset, setCanvasOffset] = useState({ left: 0, top: 0 });
  const [viewport, setViewport] = useState({ scale: 1, position: { x: 0, y: 0 } });
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'design' | 'layers'>('design');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [editingLayerName, setEditingLayerName] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const [showMinimap, setShowMinimap] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [connectors, setConnectors] = useState<Connector[]>([]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    if (showExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  // Tool store for shape panel buttons
  const setTool = useToolStore((s) => s.setTool);
  const currentTool = useToolStore((s) => s.tool);
  const currentStickyColor = useToolStore((s) => s.currentStickyColor);
  const setStickyColor = useToolStore((s) => s.setStickyColor);

  // Selection store for multi-select count and type
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const selectionType = useSelectionStore((s) => s.selectionType);
  const selectShape = useSelectionStore((s) => s.select);

  // Handle shapes change from canvas
  const handleShapesChange = useCallback((newShapes: Shape[]) => {
    setShapes(newShapes);
    // Also update connectors for minimap
    if (canvasRef.current) {
      setConnectors(canvasRef.current.getConnectors());
      const size = canvasRef.current.getCanvasSize();
      setCanvasSize(size);
    }
  }, []);

  // Handle layer click - select shape
  const handleLayerClick = useCallback((shapeId: string) => {
    selectShape(shapeId);
  }, [selectShape]);

  // Get shape type icon
  const getShapeTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'rectangle':
        return '▢';
      case 'ellipse':
        return '◯';
      case 'diamond':
        return '◇';
      case 'text':
        return 'T';
      case 'sticky':
        return '□';
      case 'freedraw':
        return '~';
      default:
        return '▢';
    }
  }, []);

  // Get shape display name
  const getShapeDisplayName = useCallback((shape: Shape, index: number) => {
    if (shape.name) return shape.name;
    const typeName = shape.type.charAt(0).toUpperCase() + shape.type.slice(1);
    return `${typeName} ${index + 1}`;
  }, []);

  // Toggle shape visibility
  const handleToggleVisibility = useCallback((shapeId: string, currentVisible?: boolean) => {
    canvasRef.current?.updateShape(shapeId, { visible: currentVisible === false ? true : false });
    // Update local shapes state for immediate UI feedback
    setShapes(prev => prev.map(s =>
      s.id === shapeId ? { ...s, visible: s.visible === false ? true : false } : s
    ));
  }, []);

  // Toggle shape lock
  const handleToggleLock = useCallback((shapeId: string, currentLocked?: boolean) => {
    canvasRef.current?.updateShape(shapeId, { locked: !currentLocked });
    // Update local shapes state for immediate UI feedback
    setShapes(prev => prev.map(s =>
      s.id === shapeId ? { ...s, locked: !s.locked } : s
    ));
  }, []);

  // Start editing layer name
  const handleStartEditName = useCallback((shapeId: string, currentName: string) => {
    setEditingLayerName(shapeId);
    setEditingNameValue(currentName);
  }, []);

  // Save layer name
  const handleSaveLayerName = useCallback(() => {
    if (editingLayerName && editingNameValue.trim()) {
      canvasRef.current?.updateShape(editingLayerName, { name: editingNameValue.trim() });
      setShapes(prev => prev.map(s =>
        s.id === editingLayerName ? { ...s, name: editingNameValue.trim() } : s
      ));
    }
    setEditingLayerName(null);
    setEditingNameValue('');
  }, [editingLayerName, editingNameValue]);

  // Cancel layer name editing
  const handleCancelEditName = useCallback(() => {
    setEditingLayerName(null);
    setEditingNameValue('');
  }, []);

  // Layer drag and drop handlers
  const handleLayerDragStart = useCallback((e: React.DragEvent, shapeId: string) => {
    setDraggingLayerId(shapeId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', shapeId);
  }, []);

  const handleLayerDragOver = useCallback((e: React.DragEvent, shapeId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (shapeId !== draggingLayerId) {
      setDropTargetId(shapeId);
    }
  }, [draggingLayerId]);

  const handleLayerDragLeave = useCallback(() => {
    setDropTargetId(null);
  }, []);

  const handleLayerDrop = useCallback((e: React.DragEvent, targetShapeId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetShapeId) {
      setDraggingLayerId(null);
      setDropTargetId(null);
      return;
    }

    // Calculate new shapes order
    const newShapes = [...shapes];
    const draggedIndex = newShapes.findIndex(s => s.id === draggedId);
    const targetIndex = newShapes.findIndex(s => s.id === targetShapeId);
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggingLayerId(null);
      setDropTargetId(null);
      return;
    }

    // Remove dragged item
    const [draggedShape] = newShapes.splice(draggedIndex, 1);
    // Insert at target position (layers panel is reversed, so adjust)
    const insertIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    newShapes.splice(insertIndex, 0, draggedShape);

    // Update both local state and canvas
    setShapes(newShapes);
    canvasRef.current?.setShapes(newShapes);

    setDraggingLayerId(null);
    setDropTargetId(null);
  }, [shapes]);

  const handleLayerDragEnd = useCallback(() => {
    setDraggingLayerId(null);
    setDropTargetId(null);
  }, []);

  // Handle shape button click - set tool for drawing
  const handleShapeClick = useCallback((toolType: ToolType) => {
    setTool(toolType);
  }, [setTool]);

  // Update canvas offset when panels change or window resizes
  useEffect(() => {
    const updateOffset = () => {
      if (canvasAreaRef.current) {
        const rect = canvasAreaRef.current.getBoundingClientRect();
        setCanvasOffset({ left: rect.left, top: rect.top });
      }
    };
    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, [isLeftPanelOpen, leftPanelWidth, isRightPanelOpen, rightPanelWidth]);

  // Handle viewport changes from canvas (zoom/pan)
  const handleViewportChange = useCallback((newViewport: { scale: number; position: { x: number; y: number } }) => {
    setViewport(newViewport);
  }, []);

  // Update shape property via canvas ref
  const updateShapeProperty = useCallback((property: string, value: number | string) => {
    if (!selectedShape || !canvasRef.current) return;
    canvasRef.current.updateShape(selectedShape.id, { [property]: value });
    // Update local state for immediate feedback
    setSelectedShape(prev => prev ? { ...prev, [property]: value } : null);
  }, [selectedShape]);

  // Context menu actions
  const handleCopy = useCallback(() => {
    canvasRef.current?.copySelected();
  }, []);

  const handleDuplicate = useCallback(() => {
    canvasRef.current?.duplicateSelected();
  }, []);

  const handleDelete = useCallback(() => {
    canvasRef.current?.deleteSelected();
    setSelectedShape(null);
  }, []);

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSelectionChange = useCallback((shape: SelectedShape | null) => {
    setSelectedShape(shape);
    // Clear connector selection when shape is selected
    if (shape) {
      setSelectedConnector(null);
    }
  }, []);

  // Track connector selection
  useEffect(() => {
    if (selectionType === 'connector' && selectedIds.length > 0 && canvasRef.current) {
      const connectors = canvasRef.current.getConnectors();
      const connector = connectors.find(c => c.id === selectedIds[0]);
      setSelectedConnector(connector || null);
    } else if (selectionType !== 'connector') {
      setSelectedConnector(null);
    }
  }, [selectionType, selectedIds]);

  // Update connector property via canvas ref
  const updateConnectorProperty = useCallback((property: string, value: string | number | boolean) => {
    if (!selectedConnector || !canvasRef.current) return;
    canvasRef.current.updateConnector(selectedConnector.id, { [property]: value });
    // Update local state for immediate feedback
    setSelectedConnector(prev => prev ? { ...prev, [property]: value } : null);
  }, [selectedConnector]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleLeftPanel = () => setIsLeftPanelOpen(!isLeftPanelOpen);
  const toggleRightPanel = () => setIsRightPanelOpen(!isRightPanelOpen);

  // Dynamic background color based on theme
  const canvasBgColor = isDarkMode ? '#252525' : '#fafafa';

  return (
    <TooltipProvider>
      <div className="zm-draw-editor">
        {/* Left Panel - Shapes */}
        {isLeftPanelOpen && (
          <>
            <aside className="zm-draw-left-panel" style={{ width: leftPanelWidth, minWidth: leftPanelWidth }}>
              {/* Panel Header with Close Button */}
              <div className="zm-draw-panel-header zm-shapes-header">
                <span>Shapes</span>
                <button className="zm-panel-close-button" onClick={toggleLeftPanel}>
                  <CloseIcon />
                </button>
              </div>

              {/* Search Bar */}
              <div className="zm-shapes-search">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search Shapes"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Shapes Content */}
              <div className="zm-draw-panel-content zm-shapes-content">
                {/* FigJam Section */}
                <CollapsibleSection title="FigJam">
                  {/* Sticky Notes */}
                  <div className="zm-figjam-subsection">
                    <div className="zm-figjam-label">Sticky Notes (S)</div>
                    <div className="zm-shapes-grid">
                      <ShapeButton icon={ShapeIcons.stickyNote} label="Sticky Note (S)" onClick={() => handleShapeClick('sticky')} active={currentTool === 'sticky'} />
                    </div>
                    <div className="zm-sticky-colors">
                      {(Object.keys(STICKY_COLORS) as StickyNoteColor[]).map((color) => (
                        <StickyColorButton
                          key={color}
                          color={color}
                          hexColor={STICKY_COLORS[color]}
                          isActive={currentStickyColor === color}
                          onClick={() => setStickyColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Drawing Tools */}
                  <div className="zm-figjam-subsection">
                    <div className="zm-figjam-label">Drawing</div>
                    <div className="zm-shapes-grid">
                      <ShapeButton icon={<PenIcon />} label="Pen (P)" onClick={() => handleShapeClick('pen')} active={currentTool === 'pen'} />
                      <ShapeButton icon={<MarkerIcon />} label="Marker (M)" onClick={() => handleShapeClick('marker')} active={currentTool === 'marker'} />
                      <ShapeButton icon={<HighlighterIcon />} label="Highlighter (H)" onClick={() => handleShapeClick('highlighter')} active={currentTool === 'highlighter'} />
                      <ShapeButton icon={<EraserIcon />} label="Eraser (E)" onClick={() => handleShapeClick('eraser')} active={currentTool === 'eraser'} />
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Connectors Section */}
                <CollapsibleSection title="Connectors">
                  <div className="zm-shapes-grid">
                    <ShapeButton icon={ShapeIcons.arrowRight} label="Arrow (Connector)" onClick={() => handleShapeClick('connector')} active={currentTool === 'connector'} />
                    <ShapeButton icon={ShapeIcons.arrowBidirectional} label="Bidirectional Arrow" />
                    <ShapeButton icon={ShapeIcons.arrowElbow} label="Elbow Arrow" />
                    <ShapeButton icon={ShapeIcons.line} label="Line" />
                  </div>
                </CollapsibleSection>

                {/* Basic Shapes Section */}
                <CollapsibleSection title="Basic">
                  <div className="zm-shapes-grid">
                    <ShapeButton icon={ShapeIcons.rectangle} label="Rectangle (R)" onClick={() => handleShapeClick('rectangle')} active={currentTool === 'rectangle'} />
                    <ShapeButton icon={ShapeIcons.roundedRect} label="Rounded Rectangle" />
                    <ShapeButton icon={ShapeIcons.circle} label="Circle" onClick={() => handleShapeClick('ellipse')} active={currentTool === 'ellipse'} />
                    <ShapeButton icon={ShapeIcons.ellipse} label="Ellipse (O)" onClick={() => handleShapeClick('ellipse')} active={currentTool === 'ellipse'} />
                    <ShapeButton icon={ShapeIcons.triangle} label="Triangle" />
                    <ShapeButton icon={ShapeIcons.triangleDown} label="Triangle Down" />
                    <ShapeButton icon={ShapeIcons.diamond} label="Diamond" onClick={() => handleShapeClick('diamond')} active={currentTool === 'diamond'} />
                    <ShapeButton icon={ShapeIcons.pentagon} label="Pentagon" />
                    <ShapeButton icon={ShapeIcons.hexagon} label="Hexagon" />
                    <ShapeButton icon={ShapeIcons.star} label="Star" />
                    <ShapeButton icon={ShapeIcons.cross} label="Cross" />
                  </div>
                </CollapsibleSection>

                {/* Flowchart Section */}
                <CollapsibleSection title="Flowchart">
                  <div className="zm-shapes-grid">
                    <ShapeButton icon={ShapeIcons.process} label="Process" onClick={() => handleShapeClick('rectangle')} active={currentTool === 'rectangle'} />
                    <ShapeButton icon={ShapeIcons.decision} label="Decision" onClick={() => handleShapeClick('diamond')} active={currentTool === 'diamond'} />
                    <ShapeButton icon={ShapeIcons.terminal} label="Terminal" onClick={() => handleShapeClick('ellipse')} active={currentTool === 'ellipse'} />
                    <ShapeButton icon={ShapeIcons.document} label="Document" />
                    <ShapeButton icon={ShapeIcons.database} label="Database" />
                    <ShapeButton icon={ShapeIcons.parallelogram} label="Data" />
                  </div>
                </CollapsibleSection>

                {/* Other Libraries Section */}
                <CollapsibleSection title="Other libraries" defaultOpen={false}>
                  <div className="zm-library-list">
                    <div className="zm-library-item">
                      <span className="zm-library-icon">AWS</span>
                      <span className="zm-library-name">AWS</span>
                      <span className="zm-library-count">600 shapes</span>
                    </div>
                    <div className="zm-library-item">
                      <span className="zm-library-icon">Azure</span>
                      <span className="zm-library-name">Azure</span>
                      <span className="zm-library-count">411 shapes</span>
                    </div>
                    <div className="zm-library-item">
                      <span className="zm-library-icon">Cisco</span>
                      <span className="zm-library-name">Cisco</span>
                      <span className="zm-library-count">341 shapes</span>
                    </div>
                  </div>
                </CollapsibleSection>
              </div>
            </aside>
            <PanelResizer
              side="left"
              width={leftPanelWidth}
              minWidth={180}
              maxWidth={400}
              onWidthChange={setLeftPanelWidth}
            />
          </>
        )}

        {/* Canvas Area */}
        <div ref={canvasAreaRef} className="zm-draw-canvas-area">
          {/* Top Header Bar */}
          <div className="zm-draw-header">
            <div className="zm-draw-header-left">
              {!isLeftPanelOpen && (
                <Tooltip content="Show Shapes">
                  <button
                    className="zm-draw-icon-button"
                    onClick={toggleLeftPanel}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                    </svg>
                  </button>
                </Tooltip>
              )}
              <div className="zm-draw-header-title">
                <span className="zm-draw-logo">zm-draw</span>
                <span className="zm-draw-version">v0.1.0</span>
              </div>
            </div>
            <div className="zm-draw-header-actions">
              <Tooltip content={snapToGrid ? 'Disable Grid Snap' : 'Enable Grid Snap'}>
                <button
                  className={`zm-draw-icon-button ${snapToGrid ? 'active' : ''}`}
                  onClick={() => setSnapToGrid(!snapToGrid)}
                >
                  <GridSnapIcon />
                </button>
              </Tooltip>
              <div className="zm-draw-export-dropdown" ref={exportDropdownRef}>
                <Tooltip content="Export Canvas">
                  <button
                    className="zm-draw-icon-button"
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                  >
                    <DownloadIcon />
                  </button>
                </Tooltip>
                {showExportDropdown && (
                  <div className="zm-draw-dropdown-menu">
                    <button onClick={() => {
                      canvasRef.current?.exportToPNG();
                      setShowExportDropdown(false);
                    }}>
                      Export as PNG
                    </button>
                    <button onClick={() => {
                      canvasRef.current?.exportToSVG();
                      setShowExportDropdown(false);
                    }}>
                      Export as SVG
                    </button>
                  </div>
                )}
              </div>
              <div className="zm-draw-zoom-controls">
                <Tooltip content="Zoom Out">
                  <button
                    className="zm-draw-icon-button"
                    onClick={() => {
                      const currentScale = viewport.scale;
                      canvasRef.current?.setZoom(Math.max(0.1, currentScale - 0.25));
                    }}
                  >
                    <ZoomOutIcon />
                  </button>
                </Tooltip>
                <span className="zm-draw-zoom-level" onClick={() => canvasRef.current?.zoomTo100()}>
                  {Math.round(viewport.scale * 100)}%
                </span>
                <Tooltip content="Zoom In">
                  <button
                    className="zm-draw-icon-button"
                    onClick={() => {
                      const currentScale = viewport.scale;
                      canvasRef.current?.setZoom(Math.min(5, currentScale + 0.25));
                    }}
                  >
                    <ZoomInIcon />
                  </button>
                </Tooltip>
                <Tooltip content="Zoom to Fit">
                  <button
                    className="zm-draw-icon-button"
                    onClick={() => canvasRef.current?.zoomToFit()}
                  >
                    <ZoomFitIcon />
                  </button>
                </Tooltip>
              </div>
              <Tooltip content={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
                <button
                  className="zm-draw-icon-button"
                  onClick={toggleDarkMode}
                >
                  {isDarkMode ? <SunIcon /> : <MoonIcon />}
                </button>
              </Tooltip>
              <Tooltip content={isRightPanelOpen ? 'Hide Design' : 'Show Design'}>
                <button
                  className={`zm-draw-icon-button ${isRightPanelOpen ? 'active' : ''}`}
                  onClick={toggleRightPanel}
                >
                  {isRightPanelOpen ? <PanelRightCloseIcon /> : <PanelRightIcon />}
                </button>
              </Tooltip>
            </div>
          </div>

        {/* Canvas - Infinite canvas fills available space */}
        <DrawCanvas
          ref={canvasRef}
          backgroundColor={canvasBgColor}
          showGrid={true}
          gridSize={20}
          snapToGrid={snapToGrid}
          onSelectionChange={handleSelectionChange}
          onViewportChange={handleViewportChange}
          onShapesChange={handleShapesChange}
        />

        {/* Selection Context Menu */}
        {selectedShape && (
          <SelectionContextMenu
            shape={selectedShape}
            viewport={viewport}
            canvasOffset={canvasOffset}
            onCopy={handleCopy}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
        )}

        {/* Minimap */}
        {showMinimap && (
          <div className="zm-draw-minimap">
            <Minimap
              shapes={shapes}
              connectors={connectors}
              scale={viewport.scale}
              position={viewport.position}
              canvasSize={canvasSize}
              onViewportChange={(pos) => {
                canvasRef.current?.setViewportPosition(pos);
              }}
              width={180}
              height={120}
            />
          </div>
        )}
      </div>

      {/* Right Panel - Properties */}
      {isRightPanelOpen && (
        <>
          <PanelResizer
            side="right"
            width={rightPanelWidth}
            minWidth={220}
            maxWidth={450}
            onWidthChange={setRightPanelWidth}
          />
          <aside className="zm-draw-right-panel" style={{ width: rightPanelWidth, minWidth: rightPanelWidth }}>
            {/* Tab Header */}
            <div className="zm-draw-panel-tabs">
              <button
                className={`zm-draw-panel-tab ${rightPanelTab === 'design' ? 'active' : ''}`}
                onClick={() => setRightPanelTab('design')}
              >
                Design
              </button>
              <button
                className={`zm-draw-panel-tab ${rightPanelTab === 'layers' ? 'active' : ''}`}
                onClick={() => setRightPanelTab('layers')}
              >
                <LayersIcon /> Layers
              </button>
            </div>
          <div className="zm-draw-panel-content">
            {/* Layers Panel */}
            {rightPanelTab === 'layers' ? (
              <div className="zm-layers-panel">
                {shapes.length === 0 ? (
                  <div className="zm-draw-empty-state">
                    <div className="zm-draw-empty-state-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                      </svg>
                    </div>
                    <p>No layers yet</p>
                    <p style={{ fontSize: 11, marginTop: 4 }}>
                      Add shapes to see them here
                    </p>
                  </div>
                ) : (
                  <div className="zm-layers-list">
                    {[...shapes].reverse().map((shape, index) => {
                      const isSelected = selectedIds.includes(shape.id);
                      const realIndex = shapes.length - 1 - index;
                      return (
                        <div
                          key={shape.id}
                          className={`zm-layer-item ${isSelected ? 'selected' : ''} ${shape.visible === false ? 'hidden-layer' : ''} ${shape.locked ? 'locked-layer' : ''} ${draggingLayerId === shape.id ? 'dragging' : ''} ${dropTargetId === shape.id ? 'drop-target' : ''}`}
                          onClick={() => handleLayerClick(shape.id)}
                          draggable
                          onDragStart={(e) => handleLayerDragStart(e, shape.id)}
                          onDragOver={(e) => handleLayerDragOver(e, shape.id)}
                          onDragLeave={handleLayerDragLeave}
                          onDrop={(e) => handleLayerDrop(e, shape.id)}
                          onDragEnd={handleLayerDragEnd}
                        >
                          <button
                            className={`zm-layer-visibility ${shape.visible === false ? 'off' : ''}`}
                            title={shape.visible === false ? "Show layer" : "Hide layer"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleVisibility(shape.id, shape.visible);
                            }}
                          >
                            {shape.visible === false ? <EyeOffIcon /> : <EyeIcon />}
                          </button>
                          <button
                            className={`zm-layer-lock ${shape.locked ? 'on' : ''}`}
                            title={shape.locked ? "Unlock layer" : "Lock layer"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLock(shape.id, shape.locked);
                            }}
                          >
                            {shape.locked ? <LockIcon /> : <UnlockIcon />}
                          </button>
                          <span className="zm-layer-icon">{getShapeTypeIcon(shape.type)}</span>
                          {editingLayerName === shape.id ? (
                            <input
                              type="text"
                              className="zm-layer-name-input"
                              value={editingNameValue}
                              onChange={(e) => setEditingNameValue(e.target.value)}
                              onBlur={handleSaveLayerName}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveLayerName();
                                if (e.key === 'Escape') handleCancelEditName();
                              }}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          ) : (
                            <span
                              className="zm-layer-name"
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                handleStartEditName(shape.id, getShapeDisplayName(shape, realIndex));
                              }}
                            >
                              {getShapeDisplayName(shape, realIndex)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
            selectedIds.length > 1 ? (
              // Multi-selection: show alignment options
              <>
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">
                    <strong>{selectedIds.length}</strong> items selected
                  </div>
                </div>

                {/* Alignment Section */}
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">Align</div>
                  <div className="zm-draw-panel-row" style={{ gap: 4 }}>
                    <Tooltip content="Align Left">
                      <button className="zm-style-button" onClick={() => canvasRef.current?.alignShapes('left')}>
                        <AlignShapeLeftIcon />
                      </button>
                    </Tooltip>
                    <Tooltip content="Align Center">
                      <button className="zm-style-button" onClick={() => canvasRef.current?.alignShapes('center')}>
                        <AlignShapeCenterHIcon />
                      </button>
                    </Tooltip>
                    <Tooltip content="Align Right">
                      <button className="zm-style-button" onClick={() => canvasRef.current?.alignShapes('right')}>
                        <AlignShapeRightIcon />
                      </button>
                    </Tooltip>
                  </div>
                  <div className="zm-draw-panel-row" style={{ gap: 4, marginTop: 4 }}>
                    <Tooltip content="Align Top">
                      <button className="zm-style-button" onClick={() => canvasRef.current?.alignShapes('top')}>
                        <AlignShapeTopIcon />
                      </button>
                    </Tooltip>
                    <Tooltip content="Align Middle">
                      <button className="zm-style-button" onClick={() => canvasRef.current?.alignShapes('middle')}>
                        <AlignShapeMiddleIcon />
                      </button>
                    </Tooltip>
                    <Tooltip content="Align Bottom">
                      <button className="zm-style-button" onClick={() => canvasRef.current?.alignShapes('bottom')}>
                        <AlignShapeBottomIcon />
                      </button>
                    </Tooltip>
                  </div>
                </div>

                {/* Distribution Section - only show for 3+ shapes */}
                {selectedIds.length >= 3 && (
                  <div className="zm-draw-panel-section">
                    <div className="zm-draw-panel-section-title">Distribute</div>
                    <div className="zm-draw-panel-row" style={{ gap: 4 }}>
                      <Tooltip content="Distribute Horizontally">
                        <button className="zm-style-button" onClick={() => canvasRef.current?.distributeShapes('horizontal')}>
                          <DistributeHIcon />
                        </button>
                      </Tooltip>
                      <Tooltip content="Distribute Vertically">
                        <button className="zm-style-button" onClick={() => canvasRef.current?.distributeShapes('vertical')}>
                          <DistributeVIcon />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                )}

                {/* Group Section */}
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">Group</div>
                  <div className="zm-draw-panel-row" style={{ gap: 4 }}>
                    <Tooltip content="Group (Ctrl+G)">
                      <button className="zm-style-button" onClick={() => canvasRef.current?.groupSelected()}>
                        <GroupIcon />
                      </button>
                    </Tooltip>
                    <Tooltip content="Ungroup (Ctrl+Shift+G)">
                      <button className="zm-style-button" onClick={() => canvasRef.current?.ungroupSelected()}>
                        <UngroupIcon />
                      </button>
                    </Tooltip>
                  </div>
                </div>

                <div className="zm-draw-panel-section">
                  <p style={{ fontSize: 11, color: 'var(--zm-text-muted)' }}>
                    Shift+Click to add/remove<br />
                    Ctrl+A to select all
                  </p>
                </div>
              </>
            ) : selectedShape ? (
              <>
                {/* Position Section */}
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">Position</div>
                  <div className="zm-draw-panel-row">
                    <span className="zm-draw-panel-label">X</span>
                    <input
                      type="number"
                      className="zm-draw-panel-input"
                      value={Math.round(selectedShape.x)}
                      onChange={(e) => updateShapeProperty('x', parseFloat(e.target.value) || 0)}
                    />
                    <span className="zm-draw-panel-label">Y</span>
                    <input
                      type="number"
                      className="zm-draw-panel-input"
                      value={Math.round(selectedShape.y)}
                      onChange={(e) => updateShapeProperty('y', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Size Section */}
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">Size</div>
                  <div className="zm-draw-panel-row">
                    <span className="zm-draw-panel-label">W</span>
                    <input
                      type="number"
                      className="zm-draw-panel-input"
                      value={Math.round(selectedShape.width)}
                      onChange={(e) => updateShapeProperty('width', Math.max(1, parseFloat(e.target.value) || 1))}
                      min={1}
                    />
                    <span className="zm-draw-panel-label">H</span>
                    <input
                      type="number"
                      className="zm-draw-panel-input"
                      value={Math.round(selectedShape.height)}
                      onChange={(e) => updateShapeProperty('height', Math.max(1, parseFloat(e.target.value) || 1))}
                      min={1}
                    />
                  </div>
                </div>

                {/* Rotation Section */}
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">Rotation</div>
                  <div className="zm-draw-panel-row">
                    <span className="zm-draw-panel-label">R</span>
                    <input
                      type="number"
                      className="zm-draw-panel-input"
                      value={Math.round(selectedShape.rotation)}
                      onChange={(e) => updateShapeProperty('rotation', parseFloat(e.target.value) || 0)}
                    />
                    <span className="zm-draw-panel-label" style={{ minWidth: 'auto' }}>deg</span>
                  </div>
                </div>

                {/* Fill Section */}
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">Fill</div>
                  <div className="zm-draw-panel-row">
                    <ColorPicker
                      color={selectedShape.fill}
                      onChange={(color) => updateShapeProperty('fill', color)}
                      label="Fill color"
                    />
                    <input
                      type="text"
                      className="zm-draw-panel-input"
                      value={selectedShape.fill}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                          updateShapeProperty('fill', value || '#000000');
                        }
                      }}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                {/* Stroke Section */}
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">Stroke</div>
                  <div className="zm-draw-panel-row">
                    <ColorPicker
                      color={selectedShape.stroke}
                      onChange={(color) => updateShapeProperty('stroke', color)}
                      label="Stroke color"
                    />
                    <input
                      type="text"
                      className="zm-draw-panel-input"
                      value={selectedShape.stroke}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                          updateShapeProperty('stroke', value || '#000000');
                        }
                      }}
                      placeholder="#1d4ed8"
                    />
                  </div>
                  <div className="zm-draw-panel-row">
                    <span className="zm-draw-panel-label">Width</span>
                    <input
                      type="number"
                      className="zm-draw-panel-input"
                      value={selectedShape.strokeWidth}
                      onChange={(e) => updateShapeProperty('strokeWidth', Math.max(0, parseFloat(e.target.value) || 0))}
                      min={0}
                      step={1}
                    />
                  </div>
                </div>

                {/* Corner Radius Section - Only for rectangles */}
                {selectedShape.type === 'rectangle' && (
                  <div className="zm-draw-panel-section">
                    <div className="zm-draw-panel-section-title">Corner Radius</div>
                    <div className="zm-draw-panel-row">
                      <span className="zm-draw-panel-label">R</span>
                      <input
                        type="number"
                        className="zm-draw-panel-input"
                        value={selectedShape.cornerRadius}
                        onChange={(e) => updateShapeProperty('cornerRadius', Math.max(0, parseFloat(e.target.value) || 0))}
                        min={0}
                        step={1}
                      />
                    </div>
                  </div>
                )}

                {/* Text Section - Only for text shapes */}
                {selectedShape.type === 'text' && (
                  <>
                    <div className="zm-draw-panel-section">
                      <div className="zm-draw-panel-section-title">Text</div>
                      <div className="zm-draw-panel-row">
                        <span className="zm-draw-panel-label">Size</span>
                        <input
                          type="number"
                          className="zm-draw-panel-input"
                          value={selectedShape.fontSize || 16}
                          onChange={(e) => updateShapeProperty('fontSize', Math.max(8, parseFloat(e.target.value) || 16))}
                          min={8}
                          step={1}
                        />
                      </div>
                      <div className="zm-draw-panel-row">
                        <ColorPicker
                          color={selectedShape.textColor || '#000000'}
                          onChange={(color) => updateShapeProperty('textColor', color)}
                          label="Text color"
                        />
                        <input
                          type="text"
                          className="zm-draw-panel-input"
                          value={selectedShape.textColor || '#000000'}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                              updateShapeProperty('textColor', value || '#000000');
                            }
                          }}
                          placeholder="#000000"
                        />
                      </div>
                      <div className="zm-draw-panel-row" style={{ gap: 4 }}>
                        <Tooltip content="Align Left">
                          <button
                            className={`zm-style-button ${(!selectedShape.textAlign || selectedShape.textAlign === 'left') ? 'active' : ''}`}
                            onClick={() => updateShapeProperty('textAlign', 'left')}
                          >
                            <AlignLeftIcon />
                          </button>
                        </Tooltip>
                        <Tooltip content="Align Center">
                          <button
                            className={`zm-style-button ${selectedShape.textAlign === 'center' ? 'active' : ''}`}
                            onClick={() => updateShapeProperty('textAlign', 'center')}
                          >
                            <AlignCenterIcon />
                          </button>
                        </Tooltip>
                        <Tooltip content="Align Right">
                          <button
                            className={`zm-style-button ${selectedShape.textAlign === 'right' ? 'active' : ''}`}
                            onClick={() => updateShapeProperty('textAlign', 'right')}
                          >
                            <AlignRightIcon />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </>
                )}

                {/* Type Info */}
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">Info</div>
                  <div className="zm-draw-panel-row">
                    <span className="zm-draw-panel-label" style={{ minWidth: 'auto' }}>Type:</span>
                    <span style={{ fontSize: 12, color: 'var(--zm-text-secondary)' }}>
                      {selectedShape.type}
                    </span>
                  </div>
                </div>
              </>
            ) : selectedConnector ? (
              <>
                {/* Connector Properties */}
                {/* Line Style Section */}
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">Line Style</div>
                  <div className="zm-draw-panel-row" style={{ gap: 4 }}>
                    <Tooltip content="Solid">
                      <button
                        className={`zm-style-button ${(!selectedConnector.lineStyle || selectedConnector.lineStyle === 'solid') ? 'active' : ''}`}
                        onClick={() => updateConnectorProperty('lineStyle', 'solid')}
                      >
                        <LineSolidIcon />
                      </button>
                    </Tooltip>
                    <Tooltip content="Dashed">
                      <button
                        className={`zm-style-button ${selectedConnector.lineStyle === 'dashed' ? 'active' : ''}`}
                        onClick={() => updateConnectorProperty('lineStyle', 'dashed')}
                      >
                        <LineDashedIcon />
                      </button>
                    </Tooltip>
                    <Tooltip content="Dotted">
                      <button
                        className={`zm-style-button ${selectedConnector.lineStyle === 'dotted' ? 'active' : ''}`}
                        onClick={() => updateConnectorProperty('lineStyle', 'dotted')}
                      >
                        <LineDottedIcon />
                      </button>
                    </Tooltip>
                  </div>
                </div>

                {/* Routing Section */}
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">Routing</div>
                  <div className="zm-draw-panel-row" style={{ gap: 4 }}>
                    <Tooltip content="Straight">
                      <button
                        className={`zm-style-button ${(!selectedConnector.routing || selectedConnector.routing === 'straight') ? 'active' : ''}`}
                        onClick={() => updateConnectorProperty('routing', 'straight')}
                      >
                        <RoutingStraightIcon />
                      </button>
                    </Tooltip>
                    <Tooltip content="Orthogonal (Elbow)">
                      <button
                        className={`zm-style-button ${selectedConnector.routing === 'orthogonal' ? 'active' : ''}`}
                        onClick={() => updateConnectorProperty('routing', 'orthogonal')}
                      >
                        <RoutingOrthogonalIcon />
                      </button>
                    </Tooltip>
                  </div>
                </div>

                {/* Arrow Section */}
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">Arrows</div>
                  <div className="zm-draw-panel-row">
                    <span className="zm-draw-panel-label">End</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Tooltip content="No Arrow">
                        <button
                          className={`zm-style-button ${!selectedConnector.arrow && selectedConnector.arrowEnd !== 'arrow' ? 'active' : ''}`}
                          onClick={() => {
                            updateConnectorProperty('arrow', false);
                            updateConnectorProperty('arrowEnd', 'none');
                          }}
                        >
                          <ArrowNoneIcon />
                        </button>
                      </Tooltip>
                      <Tooltip content="Arrow">
                        <button
                          className={`zm-style-button ${selectedConnector.arrow || selectedConnector.arrowEnd === 'arrow' ? 'active' : ''}`}
                          onClick={() => {
                            updateConnectorProperty('arrow', true);
                            updateConnectorProperty('arrowEnd', 'arrow');
                          }}
                        >
                          <ArrowEndIcon />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Stroke Section */}
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">Stroke</div>
                  <div className="zm-draw-panel-row">
                    <ColorPicker
                      color={selectedConnector.stroke}
                      onChange={(color) => updateConnectorProperty('stroke', color)}
                      label="Stroke color"
                    />
                    <input
                      type="text"
                      className="zm-draw-panel-input"
                      value={selectedConnector.stroke}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                          updateConnectorProperty('stroke', value || '#000000');
                        }
                      }}
                      placeholder="#6b7280"
                    />
                  </div>
                  <div className="zm-draw-panel-row">
                    <span className="zm-draw-panel-label">Width</span>
                    <input
                      type="number"
                      className="zm-draw-panel-input"
                      value={selectedConnector.strokeWidth}
                      onChange={(e) => updateConnectorProperty('strokeWidth', Math.max(1, parseFloat(e.target.value) || 1))}
                      min={1}
                      step={1}
                    />
                  </div>
                </div>

                {/* Info Section */}
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">Info</div>
                  <div className="zm-draw-panel-row">
                    <span className="zm-draw-panel-label" style={{ minWidth: 'auto' }}>Type:</span>
                    <span style={{ fontSize: 12, color: 'var(--zm-text-secondary)' }}>
                      Connector
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="zm-draw-empty-state">
                <div className="zm-draw-empty-state-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                  </svg>
                </div>
                <p>Select a shape to view<br />its properties</p>
              </div>
            ))}
          </div>
        </aside>
        </>
      )}
      </div>
    </TooltipProvider>
  );
}
