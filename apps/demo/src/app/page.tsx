'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect, useRef } from 'react';
import { TooltipProvider, Tooltip } from '../components/Tooltip';
import { ColorPicker } from '../components/ColorPicker';
import type { DrawCanvasHandle, ToolType, Connector, Shape, Template, TemplateCategory } from '@zm-draw/react';
import { useToolStore, useSelectionStore, useTemplateStore, Toolbar } from '@zm-draw/react';

// Konva requires window, so we need to dynamically import
const DrawCanvas = dynamic(
  () => import('@zm-draw/react').then((mod) => mod.DrawCanvas),
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

const TemplateIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
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

// Shape icons for the Shapes panel
const ShapeIcons = {
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
  table: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  mindmap: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <circle cx="4" cy="6" r="2" />
      <circle cx="4" cy="18" r="2" />
      <circle cx="20" cy="6" r="2" />
      <circle cx="20" cy="18" r="2" />
      <line x1="9.5" y1="10.5" x2="6" y2="7" />
      <line x1="9.5" y1="13.5" x2="6" y2="17" />
      <line x1="14.5" y1="10.5" x2="18" y2="7" />
      <line x1="14.5" y1="13.5" x2="18" y2="17" />
    </svg>
  ),
  embed: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <line x1="12" y1="9" x2="18" y2="9" />
      <line x1="12" y1="12" x2="18" y2="12" />
      <line x1="12" y1="15" x2="16" y2="15" />
    </svg>
  ),
  // Additional Basic shapes
  leftRightArrow: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="2,12 6,6 6,9 18,9 18,6 22,12 18,18 18,15 6,15 6,18" />
    </svg>
  ),
  rightArrow: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="2,8 15,8 15,4 22,12 15,20 15,16 2,16" />
    </svg>
  ),
  chevronShape: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="2,4 18,4 22,12 18,20 2,20 6,12" />
    </svg>
  ),
  speechBubble: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    </svg>
  ),
  // Additional Flowchart shapes
  pill: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="10" rx="5" />
    </svg>
  ),
  folder: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 7l0-3h8l2 3h10v14H2z" />
    </svg>
  ),
  commentShape: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3h14l4 4v14H3z" />
      <path d="M17 3v4h4" />
    </svg>
  ),
  callout: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 3h20v14H8l-3 4v-4H2z" />
    </svg>
  ),
  dividedBox: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  ),
  pentagonLabel: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="2,4 18,4 22,12 18,20 2,20" />
    </svg>
  ),
  trapezoid: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="6,4 18,4 22,20 2,20" />
    </svg>
  ),
  hexagonHorizontal: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5,4 19,4 23,12 19,20 5,20 1,12" />
    </svg>
  ),
  dividedSquare: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  ),
  circleCross: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  ),
  circleX: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  ),
  // Connection icons
  connectorStraight: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="20" x2="20" y2="4" />
      <circle cx="4" cy="20" r="2" fill="currentColor" />
      <circle cx="20" cy="4" r="2" fill="currentColor" />
    </svg>
  ),
  connectorElbow: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4,20 4,4 20,4" />
      <circle cx="4" cy="20" r="2" fill="currentColor" />
      <circle cx="20" cy="4" r="2" fill="currentColor" />
    </svg>
  ),
  connectorArrow: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="20" x2="20" y2="4" />
      <polyline points="14,4 20,4 20,10" />
      <circle cx="4" cy="20" r="2" fill="currentColor" />
    </svg>
  ),
  connectorDashed: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2">
      <line x1="4" y1="20" x2="20" y2="4" />
      <circle cx="4" cy="20" r="2" fill="currentColor" strokeDasharray="none" />
      <circle cx="20" cy="4" r="2" fill="currentColor" strokeDasharray="none" />
    </svg>
  ),
  // Icon shapes
  iconHeartbeat: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,12 7,12 9,4 12,20 14,8 16,12 21,12" />
    </svg>
  ),
  iconArchive: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="5" />
      <rect x="5" y="8" width="14" height="13" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  ),
  iconKey: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="16" cy="8" r="4" />
      <line x1="12" y1="8" x2="2" y2="8" />
      <line x1="2" y1="8" x2="2" y2="13" />
      <line x1="6" y1="8" x2="6" y2="12" />
    </svg>
  ),
  iconChat: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  iconCloud: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  ),
  iconArchiveBox: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 8V21H3V8" />
      <path d="M1 3h22v5H1z" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  ),
  iconDatabase: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  iconMonitor: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  iconMail: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="2,4 12,13 22,4" />
    </svg>
  ),
  iconDocument: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="14" y2="17" />
    </svg>
  ),
  iconCode: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16,18 22,12 16,6" />
      <polyline points="8,6 2,12 8,18" />
    </svg>
  ),
  iconLightning: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
    </svg>
  ),
  iconLocation: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  iconPhone: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="9" y1="3" x2="15" y2="3" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  ),
  iconBox3d: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M12 2l10 5v10l-10 5L2 17V7z" />
      <path d="M12 12l10-5" />
      <path d="M12 12L2 7" />
      <path d="M12 12v10" />
    </svg>
  ),
  iconDollar: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  iconShield: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  iconSend: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22,2 15,22 11,13 2,9" />
    </svg>
  ),
  iconServer: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <circle cx="17" cy="6" r="1" fill="currentColor" />
      <circle cx="17" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  iconCube3d: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <polygon points="12,2 22,7 12,12 2,7" />
      <polyline points="2,7 2,17 12,22 12,12" />
      <polyline points="22,7 22,17 12,22" />
    </svg>
  ),
  iconGear: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  iconGrid: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  iconTerminal: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4,17 10,11 4,5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  ),
  iconUser: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  iconList: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  iconGlobe: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
};

// Sticky Note Color Button Component
// Collapsible Section Component
function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  hidden = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  hidden?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (hidden) return null;

  return (
    <div className="zm-shapes-section">
      <button
        className="zm-shapes-section-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="zm-shapes-section-title">{title}</span>
        <span className="zm-shapes-section-chevron">
          {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </span>
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
  active = false,
  disabled = false
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Tooltip content={disabled ? `${label} (Coming soon)` : label}>
      <button
        className={`zm-shape-button ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
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
  const [isDarkMode, setIsDarkMode] = useState(false); // FigJam style: light mode default
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const leftPanelWidth = 280;
  const rightPanelWidth = 280;
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
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [connectors, setConnectors] = useState<Connector[]>([]);
  // Track which button was clicked to avoid duplicate active states
  const [selectedButtonLabel, setSelectedButtonLabel] = useState<string | null>(null);
  // Template picker
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory | 'all'>('all');
  const templatePickerRef = useRef<HTMLDivElement>(null);
  const { getTemplatesByCategory } = useTemplateStore();

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

  // Close template picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templatePickerRef.current && !templatePickerRef.current.contains(event.target as Node)) {
        setShowTemplatePicker(false);
      }
    };

    if (showTemplatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTemplatePicker]);

  // Load template
  const loadTemplate = useCallback((template: Template) => {
    if (canvasRef.current) {
      // Generate new IDs for shapes and connectors to avoid conflicts
      const idMap = new Map<string, string>();
      const newShapes = template.data.shapes.map((shape) => {
        const newId = `shape-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        idMap.set(shape.id, newId);
        return { ...shape, id: newId };
      });
      const newConnectors = template.data.connectors.map((conn) => {
        const newId = `conn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        return {
          ...conn,
          id: newId,
          fromShapeId: idMap.get(conn.fromShapeId) || conn.fromShapeId,
          toShapeId: idMap.get(conn.toShapeId) || conn.toShapeId,
        };
      });

      canvasRef.current.loadFromJSON({ shapes: newShapes, connectors: newConnectors });
      setShowTemplatePicker(false);
    }
  }, []);

  // Tool store for shape panel buttons
  const setTool = useToolStore((s) => s.setTool);
  const currentTool = useToolStore((s) => s.tool);
  const currentStampType = useToolStore((s) => s.currentStampType);
  const setStampType = useToolStore((s) => s.setStampType);

  // Reset selected button label when tool changes to 'select'
  useEffect(() => {
    if (currentTool === 'select') {
      setSelectedButtonLabel(null);
    }
  }, [currentTool]);

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
      case 'table':
        return '▦';
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
  const handleShapeClick = useCallback((toolType: ToolType, buttonLabel: string) => {
    setTool(toolType);
    setSelectedButtonLabel(buttonLabel);
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
  }, [isLeftPanelOpen, isRightPanelOpen]);

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

  // Auto show/hide right panel based on selection
  useEffect(() => {
    if (selectedShape || selectedConnector) {
      setIsRightPanelOpen(true);
    } else {
      setIsRightPanelOpen(false);
    }
  }, [selectedShape, selectedConnector]);

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
        {/* Canvas: full-screen background */}
        <div ref={canvasAreaRef} className="zm-draw-canvas-area">
          <DrawCanvas
            ref={canvasRef}
            backgroundColor={canvasBgColor}
            showGrid={true}
            gridSize={20}
            snapToGrid={snapToGrid}
            onSelectionChange={handleSelectionChange}
            onViewportChange={handleViewportChange}
            onShapesChange={handleShapesChange}
            UIOptions={{ toolbar: false }}
          />
        </div>

        {/* Floating Header */}
        <div className="zm-draw-header zm-draw-header-figjam">
          <div className="zm-draw-header-left">
            <div className="zm-draw-header-title">
              <span className="zm-draw-logo">zm-draw</span>
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
            <div className="zm-draw-export-dropdown" ref={templatePickerRef}>
              <Tooltip content="Templates">
                <button
                  className="zm-draw-icon-button"
                  onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                >
                  <TemplateIcon />
                </button>
              </Tooltip>
              {showTemplatePicker && (
                <div className="zm-draw-dropdown-menu zm-template-picker">
                  <div className="zm-template-picker-header">
                    <span className="zm-template-picker-title">Templates</span>
                    <div className="zm-template-picker-categories">
                      {(['all', 'brainstorm', 'meeting', 'planning', 'retro', 'flowchart'] as const).map((cat) => (
                        <button
                          key={cat}
                          className={`zm-template-category-btn ${templateCategory === cat ? 'active' : ''}`}
                          onClick={() => setTemplateCategory(cat)}
                        >
                          {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="zm-template-picker-grid">
                    {getTemplatesByCategory(templateCategory).map((template) => (
                      <button
                        key={template.id}
                        className="zm-template-card"
                        onClick={() => loadTemplate(template)}
                      >
                        <span className="zm-template-thumbnail">{template.thumbnail}</span>
                        <span className="zm-template-name">{template.name}</span>
                        <span className="zm-template-desc">{template.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="zm-draw-export-dropdown" ref={exportDropdownRef}>
              <Tooltip content="Export">
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

        {/* Left Panel - Shapes (floating) */}
        {isLeftPanelOpen && (
          <aside className="zm-draw-left-panel" style={{ width: leftPanelWidth }}>
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

            {/* Shapes Content — shape library with search filtering */}
            <div className="zm-draw-panel-content zm-shapes-content">
              {/* Connections Section */}
              {(() => {
                const q = searchQuery.toLowerCase();
                const connectionItems = [
                  { icon: ShapeIcons.connectorStraight, label: 'Straight Connector', tool: 'connector' as ToolType },
                  { icon: ShapeIcons.connectorElbow, label: 'Elbow Connector', tool: 'connector' as ToolType },
                  { icon: ShapeIcons.connectorArrow, label: 'Arrow Connector', tool: 'connector' as ToolType },
                  { icon: ShapeIcons.connectorDashed, label: 'Dashed Connector', tool: 'connector' as ToolType },
                ];
                const filtered = q ? connectionItems.filter(item => item.label.toLowerCase().includes(q)) : connectionItems;
                return (
                  <CollapsibleSection title="Connections" hidden={filtered.length === 0}>
                    <div className="zm-shapes-grid">
                      {filtered.map(item => (
                        <ShapeButton key={item.label} icon={item.icon} label={item.label} onClick={() => handleShapeClick(item.tool, item.label)} active={selectedButtonLabel === item.label} />
                      ))}
                    </div>
                  </CollapsibleSection>
                );
              })()}

              {/* Basic Shapes Section */}
              {(() => {
                const q = searchQuery.toLowerCase();
                const basicItems = [
                  { icon: ShapeIcons.rectangle, label: 'Rectangle (R)', tool: 'rectangle' as ToolType },
                  { icon: ShapeIcons.roundedRect, label: 'Rounded Rectangle', tool: 'roundedRectangle' as ToolType },
                  { icon: ShapeIcons.circle, label: 'Circle', tool: 'ellipse' as ToolType },
                  { icon: ShapeIcons.ellipse, label: 'Ellipse (O)', tool: 'ellipse' as ToolType },
                  { icon: ShapeIcons.triangle, label: 'Triangle', tool: 'triangle' as ToolType },
                  { icon: ShapeIcons.triangleDown, label: 'Triangle Down', tool: 'triangleDown' as ToolType },
                  { icon: ShapeIcons.diamond, label: 'Diamond', tool: 'diamond' as ToolType },
                  { icon: ShapeIcons.pentagon, label: 'Pentagon', tool: 'pentagon' as ToolType },
                  { icon: ShapeIcons.hexagon, label: 'Hexagon', tool: 'hexagon' as ToolType },
                  { icon: ShapeIcons.star, label: 'Star', tool: 'star' as ToolType },
                  { icon: ShapeIcons.cross, label: 'Cross', tool: 'cross' as ToolType },
                  { icon: ShapeIcons.leftRightArrow, label: 'Left Right Arrow', tool: 'leftRightArrow' as ToolType },
                  { icon: ShapeIcons.rightArrow, label: 'Right Arrow', tool: 'rightArrow' as ToolType },
                  { icon: ShapeIcons.chevronShape, label: 'Chevron', tool: 'chevron' as ToolType },
                  { icon: ShapeIcons.speechBubble, label: 'Speech Bubble', tool: 'speechBubble' as ToolType },
                  { icon: ShapeIcons.table, label: 'Table', tool: 'table' as ToolType },
                  { icon: ShapeIcons.mindmap, label: 'Mindmap', tool: 'mindmap' as ToolType },
                  { icon: ShapeIcons.embed, label: 'Link Preview', tool: 'embed' as ToolType },
                ];
                const filtered = q ? basicItems.filter(item => item.label.toLowerCase().includes(q)) : basicItems;
                return (
                  <CollapsibleSection title="Basic" hidden={filtered.length === 0}>
                    <div className="zm-shapes-grid">
                      {filtered.map(item => (
                        <ShapeButton key={item.label} icon={item.icon} label={item.label} onClick={() => handleShapeClick(item.tool, item.label)} active={selectedButtonLabel === item.label} />
                      ))}
                    </div>
                  </CollapsibleSection>
                );
              })()}

              {/* Flowchart Section */}
              {(() => {
                const q = searchQuery.toLowerCase();
                const flowchartItems = [
                  { icon: ShapeIcons.process, label: 'Process', tool: 'rectangle' as ToolType },
                  { icon: ShapeIcons.decision, label: 'Decision', tool: 'diamond' as ToolType },
                  { icon: ShapeIcons.terminal, label: 'Terminal', tool: 'ellipse' as ToolType },
                  { icon: ShapeIcons.document, label: 'Document', tool: 'document' as ToolType },
                  { icon: ShapeIcons.database, label: 'Database', tool: 'database' as ToolType },
                  { icon: ShapeIcons.parallelogram, label: 'Data', tool: 'parallelogram' as ToolType },
                  { icon: ShapeIcons.pill, label: 'Pill', tool: 'pill' as ToolType },
                  { icon: ShapeIcons.folder, label: 'Folder', tool: 'folder' as ToolType },
                  { icon: ShapeIcons.commentShape, label: 'Comment', tool: 'comment' as ToolType },
                  { icon: ShapeIcons.callout, label: 'Callout', tool: 'callout' as ToolType },
                  { icon: ShapeIcons.dividedBox, label: 'Divided Box', tool: 'dividedBox' as ToolType },
                  { icon: ShapeIcons.pentagonLabel, label: 'Pentagon Label', tool: 'pentagonLabel' as ToolType },
                  { icon: ShapeIcons.trapezoid, label: 'Trapezoid', tool: 'trapezoid' as ToolType },
                  { icon: ShapeIcons.hexagonHorizontal, label: 'Hexagon Horizontal', tool: 'hexagonHorizontal' as ToolType },
                  { icon: ShapeIcons.dividedSquare, label: 'Divided Square', tool: 'dividedSquare' as ToolType },
                  { icon: ShapeIcons.circleCross, label: 'Circle Cross', tool: 'circleCross' as ToolType },
                  { icon: ShapeIcons.circleX, label: 'Circle X', tool: 'circleX' as ToolType },
                ];
                const filtered = q ? flowchartItems.filter(item => item.label.toLowerCase().includes(q)) : flowchartItems;
                return (
                  <CollapsibleSection title="Flowchart" hidden={filtered.length === 0}>
                    <div className="zm-shapes-grid">
                      {filtered.map(item => (
                        <ShapeButton key={item.label} icon={item.icon} label={item.label} onClick={() => handleShapeClick(item.tool, item.label)} active={selectedButtonLabel === item.label} />
                      ))}
                    </div>
                  </CollapsibleSection>
                );
              })()}

              {/* Icons Section */}
              {(() => {
                const q = searchQuery.toLowerCase();
                const iconItems = [
                  { icon: ShapeIcons.iconHeartbeat, label: 'Heartbeat', tool: 'iconHeartbeat' as ToolType },
                  { icon: ShapeIcons.iconArchive, label: 'Archive', tool: 'iconArchive' as ToolType },
                  { icon: ShapeIcons.iconKey, label: 'Key', tool: 'iconKey' as ToolType },
                  { icon: ShapeIcons.iconChat, label: 'Chat', tool: 'iconChat' as ToolType },
                  { icon: ShapeIcons.iconCloud, label: 'Cloud', tool: 'iconCloud' as ToolType },
                  { icon: ShapeIcons.iconArchiveBox, label: 'Archive Box', tool: 'iconArchiveBox' as ToolType },
                  { icon: ShapeIcons.iconDatabase, label: 'Database Icon', tool: 'iconDatabase' as ToolType },
                  { icon: ShapeIcons.iconMonitor, label: 'Monitor', tool: 'iconMonitor' as ToolType },
                  { icon: ShapeIcons.iconMail, label: 'Mail', tool: 'iconMail' as ToolType },
                  { icon: ShapeIcons.iconDocument, label: 'Document Icon', tool: 'iconDocument' as ToolType },
                  { icon: ShapeIcons.iconCode, label: 'Code', tool: 'iconCode' as ToolType },
                  { icon: ShapeIcons.iconLightning, label: 'Lightning', tool: 'iconLightning' as ToolType },
                  { icon: ShapeIcons.iconLocation, label: 'Location', tool: 'iconLocation' as ToolType },
                  { icon: ShapeIcons.iconPhone, label: 'Phone', tool: 'iconPhone' as ToolType },
                  { icon: ShapeIcons.iconBox3d, label: '3D Box', tool: 'iconBox3d' as ToolType },
                  { icon: ShapeIcons.iconDollar, label: 'Dollar', tool: 'iconDollar' as ToolType },
                  { icon: ShapeIcons.iconShield, label: 'Shield', tool: 'iconShield' as ToolType },
                  { icon: ShapeIcons.iconSend, label: 'Send', tool: 'iconSend' as ToolType },
                  { icon: ShapeIcons.iconServer, label: 'Server', tool: 'iconServer' as ToolType },
                  { icon: ShapeIcons.iconCube3d, label: '3D Cube', tool: 'iconCube3d' as ToolType },
                  { icon: ShapeIcons.iconGear, label: 'Gear', tool: 'iconGear' as ToolType },
                  { icon: ShapeIcons.iconGrid, label: 'Grid', tool: 'iconGrid' as ToolType },
                  { icon: ShapeIcons.iconTerminal, label: 'Terminal', tool: 'iconTerminal' as ToolType },
                  { icon: ShapeIcons.iconUser, label: 'User', tool: 'iconUser' as ToolType },
                  { icon: ShapeIcons.iconList, label: 'List', tool: 'iconList' as ToolType },
                  { icon: ShapeIcons.iconGlobe, label: 'Globe', tool: 'iconGlobe' as ToolType },
                ];
                const filtered = q ? iconItems.filter(item => item.label.toLowerCase().includes(q)) : iconItems;
                return (
                  <CollapsibleSection title="Icons" defaultOpen={false} hidden={filtered.length === 0}>
                    <div className="zm-shapes-grid">
                      {filtered.map(item => (
                        <ShapeButton key={item.label} icon={item.icon} label={item.label} onClick={() => handleShapeClick(item.tool, item.label)} active={selectedButtonLabel === item.label} />
                      ))}
                    </div>
                  </CollapsibleSection>
                );
              })()}

              {/* Other Libraries Section */}
              {!searchQuery && (
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
              )}
            </div>
          </aside>
        )}

        {/* Right Panel - Properties (floating, auto show/hide) */}
        {isRightPanelOpen && (
          <aside className="zm-draw-right-panel" style={{ width: rightPanelWidth }}>
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
        )}

        {/* Bottom Toolbar — FigJam variant */}
        <div className="zm-draw-bottom-toolbar">
          <Toolbar
            variant="figjam"
            tool={currentTool}
            setTool={setTool}
            connectingFrom={null}
            cancelConnecting={() => {}}
            hasSelection={!!selectedShape || selectedIds.length > 0}
            onDelete={handleDelete}
            shapeCount={shapes.length}
            onClearAll={() => {}}
            canUndo={canvasRef.current?.canUndo ?? false}
            onUndo={() => canvasRef.current?.undo()}
            canRedo={canvasRef.current?.canRedo ?? false}
            onRedo={() => canvasRef.current?.redo()}
            scale={viewport.scale}
            onResetZoom={() => canvasRef.current?.zoomTo100()}
            onSave={() => canvasRef.current?.saveToJSON()}
            onLoad={() => canvasRef.current?.loadFromJSONFile()}
            onShapesToggle={toggleLeftPanel}
            isShapesPanelOpen={isLeftPanelOpen}
            currentStampType={currentStampType}
            onStampTypeChange={setStampType}
            onAddStamp={() => {}}
          />
        </div>

        {/* Zoom Controls — floating bottom-right */}
        <div className="zm-draw-zoom-floating">
          <button onClick={() => canvasRef.current?.setZoom(viewport.scale / 1.2)} title="Zoom Out">
            <ZoomOutIcon />
          </button>
          <button
            className="zm-zoom-level"
            onClick={() => canvasRef.current?.zoomTo100()}
            title="Reset Zoom"
          >
            {Math.round(viewport.scale * 100)}%
          </button>
          <button onClick={() => canvasRef.current?.setZoom(viewport.scale * 1.2)} title="Zoom In">
            <ZoomInIcon />
          </button>
          <button onClick={() => canvasRef.current?.zoomToFit()} title="Zoom to Fit">
            <ZoomFitIcon />
          </button>
        </div>

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

      </div>
    </TooltipProvider>
  );
}
