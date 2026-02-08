'use client';

import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import Konva from 'konva';
import type { Shape, ShapeType, Connector, FreeDrawPoint, StickyNoteColor, StampType, SectionColor, AlignType, DistributeType, TableCell, MindmapNode } from '../types';
import { STICKY_COLORS, STAMP_EMOJIS, SECTION_COLORS } from '../types';
import { useKeyboard } from '../hooks/useKeyboard';
import { useCollaboration } from '../hooks/useCollaboration';
import { useToolStore } from '../stores/toolStore';
import { useSelectionStore } from '../stores/selectionStore';
import { useViewportStore } from '../stores/viewportStore';
import { generateId, defaultShapeProps, defaultTextShapeProps, defaultStickyNoteProps, defaultFreeDrawProps, defaultImageShapeProps, defaultStampProps, defaultSectionProps, defaultTableProps, defaultMindmapProps, defaultEmbedProps } from '../stores/canvasStore';

// Module-level image cache for performance
const imageCache = new Map<string, HTMLImageElement>();

// Maximum image dimensions (auto-resize if exceeded)
const MAX_IMAGE_SIZE = 4000;
import { Toolbar } from './Toolbar';
import { TextEditor } from './TextEditor';
import { CommentPanel } from './CommentPanel';
import { useCommentStore } from '../stores/commentStore';
import { tidyUp, TidyUpLayout } from '../utils/tidyUp';

// Connector toolbar inline SVG icons (16x16)
const ConnectorStraightIcon = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="14" x2="14" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const ConnectorElbowIcon = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="2,14 2,2 14,2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ConnectorSolidIcon = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const ConnectorDashedIcon = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3"/></svg>;
const ConnectorDottedIcon = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="1.5 3"/></svg>;
const ConnectorArrowNoneIcon = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="14" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg>;
const ConnectorArrowIcon = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><polyline points="9,5 13,8 9,11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ConnectorTrashIcon = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 3V2.5C5 1.67 5.67 1 6.5 1h3C10.33 1 11 1.67 11 2.5V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M2.5 3.5h11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M4 3.5l.7 10.15c.05.74.67 1.35 1.42 1.35h3.76c.75 0 1.37-.61 1.42-1.35L12 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><line x1="6.5" y1="6" x2="6.5" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="9.5" y1="6" x2="9.5" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;

/** Selected shape info for external consumption */
export interface SelectedShapeInfo {
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

/** Viewport state for positioning overlays */
export interface ViewportInfo {
  scale: number;
  position: { x: number; y: number };
}

// AlignType and DistributeType imported from @zm-draw/core via ../types

/** Imperative handle for DrawCanvas */
export interface DrawCanvasHandle {
  /** Update a shape's properties */
  updateShape: (id: string, updates: Partial<Shape>) => void;
  /** Get current shapes */
  getShapes: () => Shape[];
  /** Set all shapes (for reordering) */
  setShapes: (shapes: Shape[]) => void;
  /** Get selected shape ID */
  getSelectedId: () => string | null;
  /** Get current viewport info */
  getViewport: () => ViewportInfo;
  /** Delete selected shape */
  deleteSelected: () => void;
  /** Duplicate selected shape */
  duplicateSelected: () => void;
  /** Copy selected shape to clipboard */
  copySelected: () => void;
  /** Get current connectors */
  getConnectors: () => Connector[];
  /** Update a connector's properties */
  updateConnector: (id: string, updates: Partial<Connector>) => void;
  /** Export canvas to PNG */
  exportToPNG: (filename?: string) => void;
  /** Export canvas to SVG */
  exportToSVG: (filename?: string) => void;
  /** Align selected shapes */
  alignShapes: (type: AlignType) => void;
  /** Distribute selected shapes evenly */
  distributeShapes: (type: DistributeType) => void;
  /** Group selected shapes */
  groupSelected: () => void;
  /** Ungroup selected shapes */
  ungroupSelected: () => void;
  /** Set zoom level (1 = 100%) */
  setZoom: (scale: number) => void;
  /** Zoom to fit all shapes in view */
  zoomToFit: () => void;
  /** Zoom to 100% */
  zoomTo100: () => void;
  /** Set viewport position */
  setViewportPosition: (position: { x: number; y: number }) => void;
  /** Get canvas size */
  getCanvasSize: () => { width: number; height: number };
  /** Set connectors */
  setConnectors: (connectors: Connector[]) => void;
  /** Load shapes and connectors from JSON data */
  loadFromJSON: (data: { shapes: Shape[]; connectors: Connector[] }) => void;
  /** Save canvas to JSON file (download) */
  saveToJSON: () => void;
  /** Load canvas from JSON file (file dialog) */
  loadFromJSONFile: () => void;
  /** Undo last action */
  undo: () => void;
  /** Redo last undone action */
  redo: () => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
}

/** Theme options for DrawCanvas */
export type DrawCanvasTheme = 'light' | 'dark' | 'system';

/**
 * UI customization options for DrawCanvas.
 * All options default to true (shown) for backward compatibility.
 */
export interface DrawCanvasUIOptions {
  /** Show the built-in floating toolbar (default: true) */
  toolbar?: boolean;
  /** Show the comment panel (default: true) */
  commentPanel?: boolean;
  /** Show collaboration status indicator when collaborationEnabled (default: true) */
  collaborationIndicator?: boolean;
  /** Show the connector floating toolbar when a connector is selected (default: true) */
  connectorToolbar?: boolean;
}

export interface DrawCanvasProps {
  /** Background color (overrides theme default) */
  backgroundColor?: string;
  /** Show grid */
  showGrid?: boolean;
  /** Grid size in pixels */
  gridSize?: number;
  /** Snap shapes to grid */
  snapToGrid?: boolean;
  /** Show smart alignment guides when dragging shapes */
  showSmartGuides?: boolean;
  /** Snap to smart guides when enabled */
  snapToGuides?: boolean;
  /** Initial shapes */
  initialShapes?: Shape[];
  /** Callback when shapes change */
  onShapesChange?: (shapes: Shape[]) => void;
  /** Callback when canvas is ready */
  onReady?: (stage: Konva.Stage) => void;
  /** Callback when selection changes */
  onSelectionChange?: (shape: SelectedShapeInfo | null) => void;
  /** Callback when viewport changes (zoom/pan) */
  onViewportChange?: (viewport: ViewportInfo) => void;
  /** Enable real-time collaboration */
  collaborationEnabled?: boolean;
  /** Room ID for collaboration session */
  roomId?: string;
  /** WebSocket server URL for collaboration (offline-only if not provided) */
  serverUrl?: string;
  /** User name for collaboration */
  userName?: string;
  /**
   * Color theme for the canvas UI.
   * - 'light': Light theme (default)
   * - 'dark': Dark theme
   * - 'system': Follow system preference
   *
   * Requires importing '@zm-draw/react/styles.css' for theme styles.
   * If not set, no theme class is applied (backward compatible).
   */
  theme?: DrawCanvasTheme;
  /** Additional CSS class name for the canvas container */
  className?: string;
  /**
   * UI customization options.
   * Use this to show/hide built-in UI elements.
   * All options default to true (shown) for backward compatibility.
   */
  UIOptions?: DrawCanvasUIOptions;
}

/**
 * Main drawing canvas component with infinite canvas support
 * Uses vanilla Konva for React 19 compatibility
 */
export const DrawCanvas = forwardRef<DrawCanvasHandle, DrawCanvasProps>(function DrawCanvas({
  backgroundColor = '#ffffff',
  showGrid = true,
  gridSize = 20,
  snapToGrid = false,
  showSmartGuides = true,
  snapToGuides = true,
  initialShapes = [],
  onShapesChange,
  onReady,
  onSelectionChange,
  onViewportChange,
  collaborationEnabled = false,
  roomId,
  serverUrl,
  userName,
  theme,
  className,
  UIOptions,
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  // Consolidated layers (Phase G: 9→5 layers)
  const staticLayerRef = useRef<Konva.Layer | null>(null);   // bg + grid (listening: false)
  const contentLayerRef = useRef<Konva.Layer | null>(null);  // connectors + shapes + connectionPoints (listening: true)
  const overlayLayerRef = useRef<Konva.Layer | null>(null);  // guides + freedraw (listening: false)
  // selectionLayerRef declared below (listening: true)
  // cursorsLayerRef declared below (listening: false)

  // Groups within consolidated layers (keep old names for minimal code changes)
  const shapesLayerRef = useRef<Konva.Group | null>(null);
  const bgLayerRef = useRef<Konva.Group | null>(null);
  const gridLayerRef = useRef<Konva.Group | null>(null);

  const [shapes, setShapes] = useState<Shape[]>(initialShapes);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Stable ref for onShapesChange to avoid calling parent setState during render
  const onShapesChangeRef = useRef(onShapesChange);
  onShapesChangeRef.current = onShapesChange;
  const notifyShapesChange = useCallback((updated: Shape[]) => {
    queueMicrotask(() => onShapesChangeRef.current?.(updated));
  }, []);

  // Table context menu state
  const [tableContextMenu, setTableContextMenu] = useState<{
    x: number;
    y: number;
    shapeId: string;
    row: number;
    col: number;
  } | null>(null);

  // Accessibility: Screen reader announcements
  const [announcement, setAnnouncement] = useState('');

  // Viewport tick counter for updating connector toolbar position during pan
  const [viewportTick, setViewportTick] = useState(0);

  // Collaboration cursors layer
  const cursorsLayerRef = useRef<Konva.Layer | null>(null);

  // Snap to grid helper function
  const snapToGridValue = useCallback((value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

  // Selection state from Zustand store
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const selectedId = useSelectionStore((s) => s.selectedIds[0] ?? null); // First selected for backward compat
  const selectionType = useSelectionStore((s) => s.selectionType);
  const setSelectedId = useSelectionStore((s) => s.select);
  const selectConnector = useSelectionStore((s) => s.selectConnector);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const toggleSelection = useSelectionStore((s) => s.toggleSelection);
  const selectMultiple = useSelectionStore((s) => s.selectMultiple);

  // Viewport state from Zustand store
  const scale = useViewportStore((s) => s.scale);
  const setScale = useViewportStore((s) => s.setScale);
  const isPanning = useViewportStore((s) => s.isPanning);
  const setIsPanning = useViewportStore((s) => s.setIsPanning);

  // Tool state from Zustand store
  const tool = useToolStore((s) => s.tool);
  const setTool = useToolStore((s) => s.setTool);
  const connectingFrom = useToolStore((s) => s.connectingFrom);
  const setConnectingFrom = useToolStore((s) => s.setConnectingFrom);
  const editingId = useToolStore((s) => s.editingId);
  const setEditingId = useToolStore((s) => s.setEditingId);
  const editingCell = useToolStore((s) => s.editingCell);
  const setEditingCell = useToolStore((s) => s.setEditingCell);
  const resetTool = useToolStore((s) => s.resetTool);

  // Drawing tool state from Zustand store
  const isDrawing = useToolStore((s) => s.isDrawing);
  const setIsDrawing = useToolStore((s) => s.setIsDrawing);
  const currentStrokeWidth = useToolStore((s) => s.currentStrokeWidth);
  const currentStrokeColor = useToolStore((s) => s.currentStrokeColor);
  const currentStrokeOpacity = useToolStore((s) => s.currentStrokeOpacity);
  const currentDrawingTool = useToolStore((s) => s.currentDrawingTool);
  const currentStickyColor = useToolStore((s) => s.currentStickyColor);
  const currentStampType = useToolStore((s) => s.currentStampType);
  const setStampType = useToolStore((s) => s.setStampType);
  const connectorVariant = useToolStore((s) => s.connectorVariant);

  // History for undo/redo
  const historyRef = useRef<{ shapes: Shape[]; connectors: Connector[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);
  const historyInitializedRef = useRef(false);

  // Collaboration hook callbacks
  const handleRemoteShapesChange = useCallback((remoteShapes: Shape[]) => {
    setShapes(remoteShapes);
  }, []);

  const handleRemoteConnectorsChange = useCallback((remoteConnectors: Connector[]) => {
    setConnectors(remoteConnectors);
  }, []);

  // Collaboration hook
  const {
    isCollaborating,
    connectionStatus,
    remoteUsers,
    updateCursor,
    clearCursor,
    updateSelection,
    updateViewport: updateCollabViewport,
  } = useCollaboration({
    roomId,
    serverUrl,
    userName,
    enabled: collaborationEnabled,
    shapes,
    connectors,
    onShapesChange: handleRemoteShapesChange,
    onConnectorsChange: handleRemoteConnectorsChange,
  });

  // Comment store
  const isPanelOpen = useCommentStore((s) => s.isPanelOpen);
  const togglePanel = useCommentStore((s) => s.togglePanel);
  const commentsMap = useCommentStore((s) => s.comments);
  const getThreadForShape = useCommentStore((s) => s.getThreadForShape);
  const addComment = useCommentStore((s) => s.addComment);
  const openThread = useCommentStore((s) => s.openThread);
  const setCurrentUser = useCommentStore((s) => s.setCurrentUser);

  // Compute unresolved comment count (memoized)
  const unresolvedCommentCount = useMemo(() => {
    let count = 0;
    commentsMap.forEach((comment) => {
      // Count root comments (threads) that are not resolved
      if (!comment.parentId && !comment.resolved) {
        count++;
      }
    });
    return count;
  }, [commentsMap]);

  // Set current user for comments when collaboration is enabled
  useEffect(() => {
    if (collaborationEnabled && userName) {
      setCurrentUser({
        id: `user-${Date.now()}`,
        name: userName,
        color: '#3b82f6',
      });
    } else {
      // Default user for non-collaboration mode
      setCurrentUser({
        id: 'local-user',
        name: 'You',
        color: '#3b82f6',
      });
    }
  }, [collaborationEnabled, userName, setCurrentUser]);

  // Add comment to selected shape
  const addCommentToSelected = useCallback(() => {
    if (selectedId) {
      const comment = addComment({
        shapeId: selectedId,
        content: '',
      });
      if (comment) {
        openThread(comment.id);
      }
    }
  }, [selectedId, addComment, openThread]);

  const connectorsLayerRef = useRef<Konva.Group | null>(null);
  const selectionLayerRef = useRef<Konva.Layer | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const marqueeRectRef = useRef<Konva.Rect | null>(null);

  // Track canvas initialization to trigger re-render of shapes
  const [canvasVersion, setCanvasVersion] = useState(0);

  // Marquee selection state
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);

  // Freedraw state
  const drawingLayerRef = useRef<Konva.Group | null>(null);
  const currentDrawingRef = useRef<FreeDrawPoint[]>([]);
  const currentDrawingLineRef = useRef<Konva.Line | null>(null);

  // Connection points layer ref
  const connectionPointsLayerRef = useRef<Konva.Group | null>(null);
  const [hoveredShapeId, setHoveredShapeId] = useState<string | null>(null);

  // Connector drag state refs (drag-to-connect UX)
  const isDraggingConnectorRef = useRef(false);
  const connectorDragFromRef = useRef<string | null>(null);
  const connectorDragFromPointRef = useRef<{ x: number; y: number } | null>(null);
  const connectorDragEndRef = useRef<{ x: number; y: number } | null>(null);
  const connectorDragSnapTargetRef = useRef<string | null>(null);
  const connectorPreviewArrowRef = useRef<Konva.Arrow | null>(null);
  const connectorSnapIndicatorRef = useRef<Konva.Circle | null>(null);
  const shapesRef = useRef(shapes);
  shapesRef.current = shapes;
  const connectorVariantRef = useRef(connectorVariant);
  connectorVariantRef.current = connectorVariant;

  // Connector drag mode: 'create' for new connector, 'reconnect' for editing endpoint
  const connectorDragModeRef = useRef<'create' | 'reconnect' | null>(null);

  // Connector reconnect state refs
  const connectorReconnectIdRef = useRef<string | null>(null);
  const connectorReconnectEndRef = useRef<'from' | 'to' | null>(null);

  // Smart guides layer ref and state
  const guidesLayerRef = useRef<Konva.Group | null>(null);
  const [activeGuides, setActiveGuides] = useState<{ horizontal: number[]; vertical: number[] }>({ horizontal: [], vertical: [] });

  // Smart guides threshold (in pixels)
  const GUIDE_THRESHOLD = 5;

  // Calculate smart guides for a dragging shape
  const calculateSmartGuides = useCallback((
    draggingShape: { x: number; y: number; width: number; height: number; id: string }
  ) => {
    const horizontal: number[] = [];
    const vertical: number[] = [];
    let snapX: number | null = null;
    let snapY: number | null = null;

    // Dragging shape edges
    const dragLeft = draggingShape.x;
    const dragRight = draggingShape.x + draggingShape.width;
    const dragCenterX = draggingShape.x + draggingShape.width / 2;
    const dragTop = draggingShape.y;
    const dragBottom = draggingShape.y + draggingShape.height;
    const dragCenterY = draggingShape.y + draggingShape.height / 2;

    for (const shape of shapes) {
      if (shape.id === draggingShape.id || shape.visible === false) continue;

      // Other shape edges
      const left = shape.x;
      const right = shape.x + shape.width;
      const centerX = shape.x + shape.width / 2;
      const top = shape.y;
      const bottom = shape.y + shape.height;
      const centerY = shape.y + shape.height / 2;

      // Vertical alignment (X axis)
      // Left edge alignment
      if (Math.abs(dragLeft - left) < GUIDE_THRESHOLD) {
        vertical.push(left);
        if (snapToGuides && snapX === null) snapX = left;
      }
      if (Math.abs(dragLeft - right) < GUIDE_THRESHOLD) {
        vertical.push(right);
        if (snapToGuides && snapX === null) snapX = right;
      }
      if (Math.abs(dragLeft - centerX) < GUIDE_THRESHOLD) {
        vertical.push(centerX);
        if (snapToGuides && snapX === null) snapX = centerX;
      }
      // Right edge alignment
      if (Math.abs(dragRight - left) < GUIDE_THRESHOLD) {
        vertical.push(left);
        if (snapToGuides && snapX === null) snapX = left - draggingShape.width;
      }
      if (Math.abs(dragRight - right) < GUIDE_THRESHOLD) {
        vertical.push(right);
        if (snapToGuides && snapX === null) snapX = right - draggingShape.width;
      }
      if (Math.abs(dragRight - centerX) < GUIDE_THRESHOLD) {
        vertical.push(centerX);
        if (snapToGuides && snapX === null) snapX = centerX - draggingShape.width;
      }
      // Center alignment
      if (Math.abs(dragCenterX - centerX) < GUIDE_THRESHOLD) {
        vertical.push(centerX);
        if (snapToGuides && snapX === null) snapX = centerX - draggingShape.width / 2;
      }
      if (Math.abs(dragCenterX - left) < GUIDE_THRESHOLD) {
        vertical.push(left);
        if (snapToGuides && snapX === null) snapX = left - draggingShape.width / 2;
      }
      if (Math.abs(dragCenterX - right) < GUIDE_THRESHOLD) {
        vertical.push(right);
        if (snapToGuides && snapX === null) snapX = right - draggingShape.width / 2;
      }

      // Horizontal alignment (Y axis)
      // Top edge alignment
      if (Math.abs(dragTop - top) < GUIDE_THRESHOLD) {
        horizontal.push(top);
        if (snapToGuides && snapY === null) snapY = top;
      }
      if (Math.abs(dragTop - bottom) < GUIDE_THRESHOLD) {
        horizontal.push(bottom);
        if (snapToGuides && snapY === null) snapY = bottom;
      }
      if (Math.abs(dragTop - centerY) < GUIDE_THRESHOLD) {
        horizontal.push(centerY);
        if (snapToGuides && snapY === null) snapY = centerY;
      }
      // Bottom edge alignment
      if (Math.abs(dragBottom - top) < GUIDE_THRESHOLD) {
        horizontal.push(top);
        if (snapToGuides && snapY === null) snapY = top - draggingShape.height;
      }
      if (Math.abs(dragBottom - bottom) < GUIDE_THRESHOLD) {
        horizontal.push(bottom);
        if (snapToGuides && snapY === null) snapY = bottom - draggingShape.height;
      }
      if (Math.abs(dragBottom - centerY) < GUIDE_THRESHOLD) {
        horizontal.push(centerY);
        if (snapToGuides && snapY === null) snapY = centerY - draggingShape.height;
      }
      // Center alignment
      if (Math.abs(dragCenterY - centerY) < GUIDE_THRESHOLD) {
        horizontal.push(centerY);
        if (snapToGuides && snapY === null) snapY = centerY - draggingShape.height / 2;
      }
      if (Math.abs(dragCenterY - top) < GUIDE_THRESHOLD) {
        horizontal.push(top);
        if (snapToGuides && snapY === null) snapY = top - draggingShape.height / 2;
      }
      if (Math.abs(dragCenterY - bottom) < GUIDE_THRESHOLD) {
        horizontal.push(bottom);
        if (snapToGuides && snapY === null) snapY = bottom - draggingShape.height / 2;
      }
    }

    return {
      guides: { horizontal: [...new Set(horizontal)], vertical: [...new Set(vertical)] },
      snap: { x: snapX, y: snapY },
    };
  }, [shapes, snapToGuides]);

  // Render smart guide lines
  const renderGuideLines = useCallback(() => {
    const group = guidesLayerRef.current;
    if (!group) return;

    group.destroyChildren();

    if (!showSmartGuides || (activeGuides.horizontal.length === 0 && activeGuides.vertical.length === 0)) {
      group.getLayer()?.batchDraw();
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;

    // Get viewport bounds for line extent
    const viewportScale = stage.scaleX();
    const viewportX = stage.x();
    const viewportY = stage.y();
    const width = stage.width();
    const height = stage.height();

    // Calculate visible area in canvas coordinates
    const visibleLeft = -viewportX / viewportScale - 1000;
    const visibleRight = (width - viewportX) / viewportScale + 1000;
    const visibleTop = -viewportY / viewportScale - 1000;
    const visibleBottom = (height - viewportY) / viewportScale + 1000;

    // Draw horizontal guide lines
    activeGuides.horizontal.forEach((y) => {
      const line = new Konva.Line({
        points: [visibleLeft, y, visibleRight, y],
        stroke: '#f43f5e',
        strokeWidth: 1 / viewportScale,
        dash: [4 / viewportScale, 4 / viewportScale],
      });
      group.add(line);
    });

    // Draw vertical guide lines
    activeGuides.vertical.forEach((x) => {
      const line = new Konva.Line({
        points: [x, visibleTop, x, visibleBottom],
        stroke: '#f43f5e',
        strokeWidth: 1 / viewportScale,
        dash: [4 / viewportScale, 4 / viewportScale],
      });
      group.add(line);
    });

    group.getLayer()?.batchDraw();
  }, [showSmartGuides, activeGuides]);

  // Update guide lines when activeGuides change
  useEffect(() => {
    renderGuideLines();
  }, [renderGuideLines]);

  // Save state to history
  const saveHistory = useCallback((newShapes: Shape[], newConnectors: Connector[]) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    setHistoryIndex((currentIndex) => {
      historyRef.current = historyRef.current.slice(0, currentIndex + 1);
      historyRef.current.push({
        shapes: JSON.parse(JSON.stringify(newShapes)),
        connectors: JSON.parse(JSON.stringify(newConnectors)),
      });

      if (historyRef.current.length > 50) {
        historyRef.current.shift();
        return currentIndex;
      }
      return currentIndex + 1;
    });
  }, []);

  // Initialize history with initial state (only once)
  useEffect(() => {
    if (historyInitializedRef.current) return;
    historyInitializedRef.current = true;

    // Save initial state to history so undo can return to it
    historyRef.current.push({
      shapes: JSON.parse(JSON.stringify(shapes)),
      connectors: JSON.parse(JSON.stringify(connectors)),
    });
    setHistoryIndex(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Undo
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;

    isUndoRedoRef.current = true;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);

    const state = historyRef.current[newIndex];
    setShapes(JSON.parse(JSON.stringify(state.shapes)));
    setConnectors(JSON.parse(JSON.stringify(state.connectors)));
    clearSelection();
  }, [historyIndex, clearSelection]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex >= historyRef.current.length - 1) return;

    isUndoRedoRef.current = true;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);

    const state = historyRef.current[newIndex];
    setShapes(JSON.parse(JSON.stringify(state.shapes)));
    setConnectors(JSON.parse(JSON.stringify(state.connectors)));
    clearSelection();
  }, [historyIndex, clearSelection]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyRef.current.length - 1;

  // Export to JSON
  const exportToJson = useCallback(() => {
    const data = { version: '1.0', shapes, connectors };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zm-draw-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [shapes, connectors]);

  // Import from JSON
  const importFromJson = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.shapes && Array.isArray(data.shapes)) {
            setShapes(data.shapes);
          }
          if (data.connectors && Array.isArray(data.connectors)) {
            setConnectors(data.connectors);
          }
          setSelectedId(null);
        } catch (err) {
          console.error('Failed to parse JSON:', err);
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  // Grid shape ref for performance optimization
  const gridShapeRef = useRef<Konva.Shape | null>(null);

  // Draw infinite dotted grid based on viewport (FigJam style)
  // Uses a single Konva.Shape with sceneFunc for performance (instead of thousands of Circle nodes)
  const drawInfiniteGrid = useCallback(() => {
    const layer = gridLayerRef.current;
    const stage = stageRef.current;
    if (!layer || !stage) return;

    // FigJam style: subtle dots - 10% opacity black on light, 8% white on dark
    const isDark = backgroundColor.startsWith('#') &&
      parseInt(backgroundColor.slice(1, 3), 16) < 128;
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)';

    // Remove existing grid shape if any
    if (gridShapeRef.current) {
      gridShapeRef.current.destroy();
      gridShapeRef.current = null;
    }

    // Create a single shape that draws all dots using sceneFunc
    const gridShape = new Konva.Shape({
      sceneFunc: (context, shape) => {
        const stageRef = shape.getStage();
        if (!stageRef) return;

        const stagePos = stageRef.position();
        const stageScale = stageRef.scaleX();
        const viewportWidth = stageRef.width();
        const viewportHeight = stageRef.height();

        const startX = -stagePos.x / stageScale;
        const startY = -stagePos.y / stageScale;
        const endX = startX + viewportWidth / stageScale;
        const endY = startY + viewportHeight / stageScale;

        // FigJam: adjust grid size based on zoom level
        let effectiveGridSize = gridSize;
        if (stageScale < 0.3) effectiveGridSize = gridSize * 4;
        else if (stageScale < 0.5) effectiveGridSize = gridSize * 2;
        else if (stageScale > 2) effectiveGridSize = gridSize / 2;

        // Calculate grid dot positions
        const firstX = Math.floor(startX / effectiveGridSize) * effectiveGridSize;
        const firstY = Math.floor(startY / effectiveGridSize) * effectiveGridSize;

        // FigJam style: small subtle dots (1px at 100% zoom)
        const dotRadius = Math.max(0.8, 1.2 / stageScale);

        // Draw all dots in a single path for performance
        context.beginPath();
        for (let x = firstX; x <= endX + effectiveGridSize; x += effectiveGridSize) {
          for (let y = firstY; y <= endY + effectiveGridSize; y += effectiveGridSize) {
            context.moveTo(x + dotRadius, y);
            context.arc(x, y, dotRadius, 0, Math.PI * 2);
          }
        }
        context.fillStyle = gridColor;
        context.fill();
      },
      listening: false,
    });

    gridShapeRef.current = gridShape;
    layer.add(gridShape);
    layer.getLayer()?.batchDraw();
  }, [backgroundColor, gridSize]);

  // Update background for infinite canvas
  const updateBackground = useCallback(() => {
    const layer = bgLayerRef.current;
    const stage = stageRef.current;
    if (!layer || !stage) return;

    layer.destroyChildren();

    // Use a very large background rect centered at origin
    // This covers any reasonable pan/zoom range
    const largeSize = 100000;

    layer.add(new Konva.Rect({
      x: -largeSize / 2,
      y: -largeSize / 2,
      width: largeSize,
      height: largeSize,
      fill: backgroundColor,
      listening: false,
    }));

    layer.getLayer()?.batchDraw();
  }, [backgroundColor]);

  // Update viewport (background + grid)
  const updateViewport = useCallback(() => {
    const stage = stageRef.current;
    const container = containerRef.current;

    // Ensure stage size matches container size using offsetWidth/offsetHeight
    if (stage && container) {
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      if (containerWidth > 0 && containerHeight > 0) {
        const needsResize = stage.width() !== containerWidth || stage.height() !== containerHeight;
        if (needsResize) {
          stage.width(containerWidth);
          stage.height(containerHeight);
        }
      }
    }

    updateBackground();
    if (showGrid) {
      drawInfiniteGrid();
    }

    // Notify parent of viewport changes
    if (stage && onViewportChange) {
      onViewportChange({
        scale: stage.scaleX(),
        position: stage.position(),
      });
    }
  }, [updateBackground, showGrid, drawInfiniteGrid, onViewportChange]);

  // Add connector between shapes
  const addConnector = useCallback((
    fromId: string | null,
    toId: string | null,
    fromPos?: { x: number; y: number },
    toPos?: { x: number; y: number },
  ) => {
    if (fromId && toId && fromId === toId) return;

    // Duplicate check only for shape-to-shape connectors
    if (fromId && toId) {
      const exists = connectors.some(
        (c) => (c.fromShapeId === fromId && c.toShapeId === toId) ||
               (c.fromShapeId === toId && c.toShapeId === fromId)
      );
      if (exists) return;
    }

    // Must have at least one valid endpoint
    if (!fromId && !fromPos) return;
    if (!toId && !toPos) return;

    // Configure connector based on variant
    let arrowStart: 'none' | 'arrow' = 'none';
    let arrowEnd: 'none' | 'arrow' = 'arrow';
    let routing: 'straight' | 'orthogonal' = 'straight';

    switch (connectorVariant) {
      case 'arrow':
        arrowEnd = 'arrow';
        break;
      case 'bidirectional':
        arrowStart = 'arrow';
        arrowEnd = 'arrow';
        break;
      case 'elbow':
        arrowEnd = 'arrow';
        routing = 'orthogonal';
        break;
      case 'line':
        arrowStart = 'none';
        arrowEnd = 'none';
        break;
    }

    const newConnector: Connector = {
      id: `conn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      ...(fromId ? { fromShapeId: fromId } : {}),
      ...(toId ? { toShapeId: toId } : {}),
      ...(fromPos && !fromId ? { fromPos } : {}),
      ...(toPos && !toId ? { toPos } : {}),
      stroke: '#6b7280',
      strokeWidth: 2,
      arrow: arrowEnd === 'arrow',
      arrowStart,
      arrowEnd,
      routing,
    };

    setConnectors((prev) => [...prev, newConnector]);
  }, [connectors, connectorVariant]);

  // Refs for connection point click handlers (avoid stale closures in useEffect)
  const connectingFromRef = useRef(connectingFrom);
  connectingFromRef.current = connectingFrom;
  const addConnectorRef = useRef(addConnector);
  addConnectorRef.current = addConnector;

  // Check if a shape is within the visible viewport (with padding for smooth scrolling)
  const isShapeInViewport = useCallback((shape: Shape): boolean => {
    const stage = stageRef.current;
    if (!stage) return true; // Render if we can't determine visibility

    const scale = stage.scaleX();
    const stagePos = stage.position();
    const padding = 100; // Extra padding to render shapes slightly outside viewport

    // Calculate visible area in canvas coordinates
    const viewLeft = (-stagePos.x / scale) - padding;
    const viewTop = (-stagePos.y / scale) - padding;
    const viewRight = viewLeft + (canvasSize.width / scale) + (padding * 2);
    const viewBottom = viewTop + (canvasSize.height / scale) + (padding * 2);

    // Check if shape intersects with visible area
    const shapeRight = shape.x + shape.width;
    const shapeBottom = shape.y + shape.height;

    return !(shape.x > viewRight || shapeRight < viewLeft ||
             shape.y > viewBottom || shapeBottom < viewTop);
  }, [canvasSize]);

  // Render all shapes to the layer
  const renderShapes = useCallback(() => {
    const layer = shapesLayerRef.current;
    if (!layer) return;

    layer.destroyChildren();

    shapes.forEach((shape) => {
      // Skip hidden shapes
      if (shape.visible === false) return;

      // Skip shapes outside viewport for performance (viewport culling)
      if (!isShapeInViewport(shape)) return;

      const group = new Konva.Group({
        id: shape.id,
        x: shape.x,
        y: shape.y,
        draggable: !shape.locked && tool !== 'connector', // Locked shapes and connector mode can't drag
        rotation: shape.rotation || 0,
        opacity: shape.opacity ?? 1,
      });

      const shapeConfig = {
        x: 0,
        y: 0,
        width: shape.width,
        height: shape.height,
        fill: shape.fill,
        stroke: shape.stroke,
        strokeWidth: shape.strokeWidth,
      };

      let konvaShape: Konva.Shape;
      switch (shape.type) {
        case 'text':
          // Standalone text shape - no background, just text
          konvaShape = new Konva.Text({
            x: 0,
            y: 0,
            width: shape.width,
            height: shape.height,
            text: shape.text || 'Text',
            fontSize: shape.fontSize || 16,
            fontFamily: shape.fontFamily || 'Arial',
            fill: shape.textColor || shape.fill || '#000000',
            align: shape.textAlign || 'left',
            verticalAlign: shape.verticalAlign || 'top',
          });
          break;
        case 'ellipse':
          konvaShape = new Konva.Ellipse({
            ...shapeConfig,
            x: shape.width / 2,
            y: shape.height / 2,
            radiusX: shape.width / 2,
            radiusY: shape.height / 2,
          });
          break;
        case 'diamond':
          // Use Konva.Line for diamond to support non-square dimensions
          konvaShape = new Konva.Line({
            points: [
              shape.width / 2, 0,              // top
              shape.width, shape.height / 2,   // right
              shape.width / 2, shape.height,   // bottom
              0, shape.height / 2,             // left
            ],
            closed: true,
            fill: shape.fill,
            stroke: shape.stroke,
            strokeWidth: shape.strokeWidth,
          });
          break;
        case 'sticky':
          // FigJam-style sticky note with shadow
          konvaShape = new Konva.Rect({
            ...shapeConfig,
            cornerRadius: shape.cornerRadius ?? 2,
            shadowColor: '#000000',
            shadowBlur: 8,
            shadowOffset: { x: 2, y: 3 },
            shadowOpacity: 0.15,
          });
          break;
        case 'freedraw':
          // Freedraw path using Line with tension
          {
            const points = shape.points || [];
            const flatPoints: number[] = [];
            points.forEach((p: FreeDrawPoint) => {
              flatPoints.push(p.x, p.y);
            });
            konvaShape = new Konva.Line({
              x: 0,
              y: 0,
              points: flatPoints,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
              opacity: shape.opacity ?? 1,
              lineCap: shape.lineCap || 'round',
              lineJoin: 'round',
              tension: 0.5, // Smooth curves
              globalCompositeOperation: 'source-over',
            });
          }
          break;
        case 'image':
          // Image shape using Konva.Image
          {
            const cachedImg = imageCache.get(shape.src || '');
            if (cachedImg && cachedImg.complete) {
              konvaShape = new Konva.Image({
                x: 0,
                y: 0,
                width: shape.width,
                height: shape.height,
                image: cachedImg,
              });
            } else {
              // Placeholder while loading
              konvaShape = new Konva.Rect({
                x: 0,
                y: 0,
                width: shape.width,
                height: shape.height,
                fill: '#f3f4f6',
                stroke: '#d1d5db',
                strokeWidth: 1,
                dash: [4, 4],
              });
              // Add loading text
              const loadingText = new Konva.Text({
                x: 0,
                y: shape.height / 2 - 8,
                width: shape.width,
                text: 'Loading...',
                fontSize: 12,
                fill: '#9ca3af',
                align: 'center',
              });
              group.add(loadingText);

              // Load image asynchronously
              if (shape.src) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                  imageCache.set(shape.src!, img);
                  // Re-render shapes to show loaded image
                  renderShapes();
                };
                img.src = shape.src;
              }
            }
          }
          break;
        case 'stamp':
          // Stamp shape using emoji text
          {
            const emoji = STAMP_EMOJIS[shape.stampType || 'thumbsUp'];
            konvaShape = new Konva.Text({
              x: 0,
              y: 0,
              width: shape.width,
              height: shape.height,
              text: emoji,
              fontSize: Math.min(shape.width, shape.height) * 0.8,
              fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
              align: 'center',
              verticalAlign: 'middle',
            });
          }
          break;
        case 'section':
          // FigJam-style section container with title
          {
            konvaShape = new Konva.Rect({
              ...shapeConfig,
              cornerRadius: shape.cornerRadius ?? 8,
            });
            // Add section title at the top-left
            const titleText = new Konva.Text({
              x: 12,
              y: -24,
              text: shape.sectionTitle || 'Section',
              fontSize: 14,
              fontFamily: 'Arial',
              fontStyle: 'bold',
              fill: '#6b7280',
            });
            group.add(titleText);
          }
          break;
        case 'table':
          // Table shape - grid of cells with text
          {
            const tableGroup = new Konva.Group();
            const data = shape.tableData;
            if (data) {
              let yOffset = 0;
              for (let row = 0; row < data.rows; row++) {
                let xOffset = 0;
                const rowHeight = data.rowHeights[row] || 40;
                for (let col = 0; col < data.cols; col++) {
                  const colWidth = data.colWidths[col] || 100;
                  const cell = data.cells[row]?.[col] || { text: '' };
                  // Cell background
                  const isHeader = row === 0 && data.headerRow;
                  const cellRect = new Konva.Rect({
                    x: xOffset,
                    y: yOffset,
                    width: colWidth,
                    height: rowHeight,
                    fill: cell.fill || (isHeader ? '#f3f4f6' : '#ffffff'),
                    stroke: shape.stroke,
                    strokeWidth: shape.strokeWidth,
                  });
                  tableGroup.add(cellRect);
                  // Cell text
                  if (cell.text) {
                    const cellText = new Konva.Text({
                      x: xOffset + 8,
                      y: yOffset + 4,
                      width: colWidth - 16,
                      height: rowHeight - 8,
                      text: cell.text,
                      fontSize: shape.fontSize || 14,
                      fontFamily: shape.fontFamily || 'Arial',
                      fill: cell.textColor || shape.textColor || '#1e1e1e',
                      align: cell.textAlign || 'left',
                      verticalAlign: 'middle',
                      listening: false,
                    });
                    tableGroup.add(cellText);
                  }
                  xOffset += colWidth;
                }
                yOffset += rowHeight;
              }
            }
            group.add(tableGroup);
            // Transparent hit detection rect
            konvaShape = new Konva.Rect({
              x: 0,
              y: 0,
              width: shape.width,
              height: shape.height,
              fill: 'transparent',
            });
          }
          break;
        case 'mindmap':
          // Mindmap with nodes and connections
          {
            const mindmapGroup = new Konva.Group();
            const data = shape.mindmapData;

            if (data) {
              // Node dimensions
              const nodeHeight = 32;
              const nodePadding = 12;
              const nodeRadius = 8;

              // Colors for different levels
              const levelColors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

              // Calculate node positions recursively
              interface NodePosition {
                node: typeof data.root;
                x: number;
                y: number;
                level: number;
              }

              const positions: NodePosition[] = [];

              const calculatePositions = (
                node: typeof data.root,
                x: number,
                y: number,
                level: number,
                parentY: number | null
              ): { minY: number; maxY: number } => {
                const children = node.children || [];
                const childCount = children.length;

                if (childCount === 0) {
                  positions.push({ node, x, y, level });
                  return { minY: y, maxY: y };
                }

                // Calculate children positions first
                let currentY = y - ((childCount - 1) * (nodeHeight + data.nodeSpacing)) / 2;
                let minY = currentY;
                let maxY = currentY;

                children.forEach((child: MindmapNode) => {
                  const childX = x + data.levelSpacing;
                  const result = calculatePositions(child, childX, currentY, level + 1, y);
                  minY = Math.min(minY, result.minY);
                  maxY = Math.max(maxY, result.maxY);
                  currentY += nodeHeight + data.nodeSpacing;
                });

                // Center parent among children
                const centerY = (minY + maxY) / 2;
                positions.push({ node, x, y: centerY, level });

                return { minY, maxY };
              };

              // Start from center
              const startX = 20;
              const startY = shape.height / 2;
              calculatePositions(data.root, startX, startY, 0, null);

              // Draw connections first (behind nodes)
              positions.forEach((pos) => {
                const parentNode = pos.node;
                const children = parentNode.children || [];

                children.forEach((child: MindmapNode) => {
                  const childPos = positions.find((p) => p.node.id === child.id);
                  if (childPos) {
                    // Estimate node width
                    const parentWidth = Math.max(60, parentNode.text.length * 8 + nodePadding * 2);

                    const line = new Konva.Line({
                      points: [
                        pos.x + parentWidth,
                        pos.y + nodeHeight / 2,
                        childPos.x,
                        childPos.y + nodeHeight / 2,
                      ],
                      stroke: '#d1d5db',
                      strokeWidth: 2,
                      lineCap: 'round',
                      lineJoin: 'round',
                    });
                    mindmapGroup.add(line);
                  }
                });
              });

              // Draw nodes
              positions.forEach((pos) => {
                const nodeWidth = Math.max(60, pos.node.text.length * 8 + nodePadding * 2);
                const color = pos.node.color || levelColors[pos.level % levelColors.length];

                // Node background
                const nodeRect = new Konva.Rect({
                  x: pos.x,
                  y: pos.y,
                  width: nodeWidth,
                  height: nodeHeight,
                  fill: color,
                  cornerRadius: nodeRadius,
                  shadowColor: 'rgba(0,0,0,0.1)',
                  shadowBlur: 4,
                  shadowOffsetY: 2,
                });
                mindmapGroup.add(nodeRect);

                // Node text
                const nodeText = new Konva.Text({
                  x: pos.x,
                  y: pos.y,
                  width: nodeWidth,
                  height: nodeHeight,
                  text: pos.node.text,
                  fontSize: 13,
                  fontFamily: 'Arial',
                  fill: '#ffffff',
                  align: 'center',
                  verticalAlign: 'middle',
                  listening: false,
                });
                mindmapGroup.add(nodeText);
              });
            }

            group.add(mindmapGroup);

            // Transparent hit detection rect
            konvaShape = new Konva.Rect({
              x: 0,
              y: 0,
              width: shape.width,
              height: shape.height,
              fill: 'transparent',
            });
          }
          break;
        case 'embed':
          // Embed/Link preview card
          {
            const embedGroup = new Konva.Group();
            const data = shape.embedData;
            const cornerRadius = shape.cornerRadius ?? 8;

            // Card background with shadow
            const cardBg = new Konva.Rect({
              x: 0,
              y: 0,
              width: shape.width,
              height: shape.height,
              fill: shape.fill || '#ffffff',
              stroke: shape.stroke || '#e5e7eb',
              strokeWidth: shape.strokeWidth || 1,
              cornerRadius,
              shadowColor: 'rgba(0,0,0,0.1)',
              shadowBlur: 8,
              shadowOffsetY: 2,
            });
            embedGroup.add(cardBg);

            if (data) {
              // Thumbnail area (left side or top)
              const thumbnailWidth = 80;
              const contentX = data.thumbnail ? thumbnailWidth + 12 : 12;
              const contentWidth = shape.width - contentX - 12;

              if (data.thumbnail) {
                // Thumbnail placeholder
                const thumbBg = new Konva.Rect({
                  x: 0,
                  y: 0,
                  width: thumbnailWidth,
                  height: shape.height,
                  fill: '#f3f4f6',
                  cornerRadius: [cornerRadius, 0, 0, cornerRadius],
                });
                embedGroup.add(thumbBg);

                // Link icon placeholder
                const linkIcon = new Konva.Text({
                  x: 0,
                  y: 0,
                  width: thumbnailWidth,
                  height: shape.height,
                  text: '🔗',
                  fontSize: 24,
                  align: 'center',
                  verticalAlign: 'middle',
                });
                embedGroup.add(linkIcon);
              }

              // Site name / favicon area
              if (data.siteName || data.url) {
                const siteText = new Konva.Text({
                  x: contentX,
                  y: 12,
                  width: contentWidth,
                  text: data.siteName || new URL(data.url || 'https://example.com').hostname,
                  fontSize: 11,
                  fontFamily: 'Arial',
                  fill: '#6b7280',
                  ellipsis: true,
                });
                embedGroup.add(siteText);
              }

              // Title
              if (data.title) {
                const titleText = new Konva.Text({
                  x: contentX,
                  y: 28,
                  width: contentWidth,
                  text: data.title,
                  fontSize: 14,
                  fontFamily: 'Arial',
                  fontStyle: 'bold',
                  fill: '#1f2937',
                  ellipsis: true,
                  wrap: 'word',
                  height: 40,
                });
                embedGroup.add(titleText);
              }

              // Description
              if (data.description) {
                const descText = new Konva.Text({
                  x: contentX,
                  y: 72,
                  width: contentWidth,
                  height: shape.height - 84,
                  text: data.description,
                  fontSize: 12,
                  fontFamily: 'Arial',
                  fill: '#6b7280',
                  ellipsis: true,
                  wrap: 'word',
                });
                embedGroup.add(descText);
              }

              // URL at bottom
              const urlText = new Konva.Text({
                x: contentX,
                y: shape.height - 24,
                width: contentWidth,
                text: data.url || '',
                fontSize: 10,
                fontFamily: 'Arial',
                fill: '#9ca3af',
                ellipsis: true,
              });
              embedGroup.add(urlText);
            }

            group.add(embedGroup);

            // Transparent hit detection rect
            konvaShape = new Konva.Rect({
              x: 0,
              y: 0,
              width: shape.width,
              height: shape.height,
              fill: 'transparent',
            });
          }
          break;
        case 'triangle':
          // Equilateral-ish triangle pointing up
          konvaShape = new Konva.Line({
            points: [
              shape.width / 2, 0,              // top center
              shape.width, shape.height,       // bottom right
              0, shape.height,                 // bottom left
            ],
            closed: true,
            fill: shape.fill,
            stroke: shape.stroke,
            strokeWidth: shape.strokeWidth,
          });
          break;
        case 'triangleDown':
          // Triangle pointing down
          konvaShape = new Konva.Line({
            points: [
              0, 0,                            // top left
              shape.width, 0,                  // top right
              shape.width / 2, shape.height,   // bottom center
            ],
            closed: true,
            fill: shape.fill,
            stroke: shape.stroke,
            strokeWidth: shape.strokeWidth,
          });
          break;
        case 'roundedRectangle':
          // Rectangle with rounded corners
          konvaShape = new Konva.Rect({
            ...shapeConfig,
            cornerRadius: shape.cornerRadius ?? 12,
          });
          break;
        case 'pentagon':
          // Regular pentagon
          {
            const w = shape.width;
            const h = shape.height;
            const cx = w / 2;
            const cy = h / 2;
            const r = Math.min(w, h) / 2;
            const points: number[] = [];
            for (let i = 0; i < 5; i++) {
              const angle = (i * 2 * Math.PI / 5) - Math.PI / 2; // Start from top
              points.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
            }
            konvaShape = new Konva.Line({
              points,
              closed: true,
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
            });
          }
          break;
        case 'hexagon':
          // Regular hexagon
          {
            const w = shape.width;
            const h = shape.height;
            const cx = w / 2;
            const cy = h / 2;
            const r = Math.min(w, h) / 2;
            const points: number[] = [];
            for (let i = 0; i < 6; i++) {
              const angle = (i * 2 * Math.PI / 6) - Math.PI / 2; // Start from top
              points.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
            }
            konvaShape = new Konva.Line({
              points,
              closed: true,
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
            });
          }
          break;
        case 'star':
          // 5-pointed star
          {
            const w = shape.width;
            const h = shape.height;
            const cx = w / 2;
            const cy = h / 2;
            const outerR = Math.min(w, h) / 2;
            const innerR = outerR * 0.4; // Inner radius ratio
            const points: number[] = [];
            for (let i = 0; i < 10; i++) {
              const angle = (i * Math.PI / 5) - Math.PI / 2;
              const r = i % 2 === 0 ? outerR : innerR;
              points.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
            }
            konvaShape = new Konva.Line({
              points,
              closed: true,
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
            });
          }
          break;
        case 'cross':
          // Plus/cross shape
          {
            const w = shape.width;
            const h = shape.height;
            const armWidth = Math.min(w, h) * 0.33; // Width of arm
            const hOffset = (w - armWidth) / 2;
            const vOffset = (h - armWidth) / 2;
            konvaShape = new Konva.Line({
              points: [
                hOffset, 0,                      // top-left of vertical arm
                hOffset + armWidth, 0,           // top-right of vertical arm
                hOffset + armWidth, vOffset,     // inner corner
                w, vOffset,                      // outer right of horizontal arm
                w, vOffset + armWidth,           // bottom of horizontal arm right
                hOffset + armWidth, vOffset + armWidth, // inner corner
                hOffset + armWidth, h,           // bottom of vertical arm
                hOffset, h,                      // bottom-left of vertical arm
                hOffset, vOffset + armWidth,     // inner corner
                0, vOffset + armWidth,           // left of horizontal arm
                0, vOffset,                      // top of horizontal arm left
                hOffset, vOffset,                // inner corner
              ],
              closed: true,
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
            });
          }
          break;
        case 'parallelogram':
          // Flowchart parallelogram (data symbol)
          {
            const w = shape.width;
            const h = shape.height;
            const skew = w * 0.2; // 20% skew
            konvaShape = new Konva.Line({
              points: [
                skew, 0,           // top-left
                w, 0,              // top-right
                w - skew, h,       // bottom-right
                0, h,              // bottom-left
              ],
              closed: true,
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
            });
          }
          break;
        case 'database':
          // Flowchart database/cylinder shape
          {
            const w = shape.width;
            const h = shape.height;
            const ellipseHeight = h * 0.15; // Height of top/bottom ellipse
            // Create a group with cylinder parts
            const cylinderGroup = new Konva.Group();
            // Bottom ellipse (visible arc)
            const bottomArc = new Konva.Ellipse({
              x: w / 2,
              y: h - ellipseHeight / 2,
              radiusX: w / 2,
              radiusY: ellipseHeight / 2,
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
            });
            // Body rectangle (no stroke on sides that overlap)
            const body = new Konva.Rect({
              x: 0,
              y: ellipseHeight / 2,
              width: w,
              height: h - ellipseHeight,
              fill: shape.fill,
            });
            // Side lines
            const leftLine = new Konva.Line({
              points: [0, ellipseHeight / 2, 0, h - ellipseHeight / 2],
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
            });
            const rightLine = new Konva.Line({
              points: [w, ellipseHeight / 2, w, h - ellipseHeight / 2],
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
            });
            // Top ellipse
            const topEllipse = new Konva.Ellipse({
              x: w / 2,
              y: ellipseHeight / 2,
              radiusX: w / 2,
              radiusY: ellipseHeight / 2,
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
            });
            cylinderGroup.add(bottomArc);
            cylinderGroup.add(body);
            cylinderGroup.add(leftLine);
            cylinderGroup.add(rightLine);
            cylinderGroup.add(topEllipse);
            group.add(cylinderGroup);
            // Use a transparent rect for hit detection
            konvaShape = new Konva.Rect({
              x: 0,
              y: 0,
              width: w,
              height: h,
              fill: 'transparent',
            });
          }
          break;
        case 'document':
          // Flowchart document shape (rectangle with wavy bottom)
          {
            const w = shape.width;
            const h = shape.height;
            const waveHeight = h * 0.1;
            // Use path-like approach with bezier
            const docGroup = new Konva.Group();
            // Main body with custom shape
            const docShape = new Konva.Shape({
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
              sceneFunc: (ctx, shp) => {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(w, 0);
                ctx.lineTo(w, h - waveHeight);
                // Wavy bottom
                ctx.quadraticCurveTo(w * 0.75, h - waveHeight * 2, w / 2, h - waveHeight);
                ctx.quadraticCurveTo(w * 0.25, h, 0, h - waveHeight);
                ctx.closePath();
                ctx.fillStrokeShape(shp);
              },
            });
            docGroup.add(docShape);
            group.add(docGroup);
            // Use a transparent rect for hit detection
            konvaShape = new Konva.Rect({
              x: 0,
              y: 0,
              width: w,
              height: h,
              fill: 'transparent',
            });
          }
          break;
        case 'leftRightArrow':
          // Left-right arrow shape
          {
            const w = shape.width;
            const h = shape.height;
            const arrowHead = w * 0.2;
            const bodyH = h * 0.35;
            const bodyTop = (h - bodyH) / 2;
            konvaShape = new Konva.Line({
              points: [
                0, h / 2,
                arrowHead, 0,
                arrowHead, bodyTop,
                w - arrowHead, bodyTop,
                w - arrowHead, 0,
                w, h / 2,
                w - arrowHead, h,
                w - arrowHead, bodyTop + bodyH,
                arrowHead, bodyTop + bodyH,
                arrowHead, h,
              ],
              closed: true,
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
            });
          }
          break;
        case 'rightArrow':
          // Right arrow shape
          {
            const w = shape.width;
            const h = shape.height;
            const arrowHead = w * 0.3;
            const bodyH = h * 0.4;
            const bodyTop = (h - bodyH) / 2;
            konvaShape = new Konva.Line({
              points: [
                0, bodyTop,
                w - arrowHead, bodyTop,
                w - arrowHead, 0,
                w, h / 2,
                w - arrowHead, h,
                w - arrowHead, bodyTop + bodyH,
                0, bodyTop + bodyH,
              ],
              closed: true,
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
            });
          }
          break;
        case 'chevron':
          // Chevron / arrow-like shape
          {
            const w = shape.width;
            const h = shape.height;
            const notch = w * 0.2;
            konvaShape = new Konva.Line({
              points: [
                0, 0,
                w - notch, 0,
                w, h / 2,
                w - notch, h,
                0, h,
                notch, h / 2,
              ],
              closed: true,
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
            });
          }
          break;
        case 'speechBubble':
          // Speech bubble shape
          {
            const w = shape.width;
            const h = shape.height;
            const bubbleH = h * 0.75;
            const tailW = w * 0.15;
            const tailH = h * 0.25;
            const cr = Math.min(w, bubbleH) * 0.15;
            const speechGroup = new Konva.Group();
            const speechShape = new Konva.Shape({
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
              sceneFunc: (ctx, shp) => {
                ctx.beginPath();
                ctx.moveTo(cr, 0);
                ctx.lineTo(w - cr, 0);
                ctx.arcTo(w, 0, w, cr, cr);
                ctx.lineTo(w, bubbleH - cr);
                ctx.arcTo(w, bubbleH, w - cr, bubbleH, cr);
                ctx.lineTo(w * 0.35 + tailW, bubbleH);
                ctx.lineTo(w * 0.25, h);
                ctx.lineTo(w * 0.35, bubbleH);
                ctx.lineTo(cr, bubbleH);
                ctx.arcTo(0, bubbleH, 0, bubbleH - cr, cr);
                ctx.lineTo(0, cr);
                ctx.arcTo(0, 0, cr, 0, cr);
                ctx.closePath();
                ctx.fillStrokeShape(shp);
              },
            });
            speechGroup.add(speechShape);
            group.add(speechGroup);
            konvaShape = new Konva.Rect({
              x: 0, y: 0, width: w, height: h, fill: 'transparent',
            });
          }
          break;
        case 'pill':
          // Pill / stadium shape (fully rounded ends)
          {
            const w = shape.width;
            const h = shape.height;
            const r = h / 2;
            konvaShape = new Konva.Rect({
              ...shapeConfig,
              cornerRadius: r,
            });
          }
          break;
        case 'folder':
          // Folder shape
          {
            const w = shape.width;
            const h = shape.height;
            const tabW = w * 0.35;
            const tabH = h * 0.15;
            const folderGroup = new Konva.Group();
            const folderShape = new Konva.Shape({
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
              sceneFunc: (ctx, shp) => {
                ctx.beginPath();
                ctx.moveTo(0, tabH);
                ctx.lineTo(0, 0);
                ctx.lineTo(tabW, 0);
                ctx.lineTo(tabW + tabH, tabH);
                ctx.lineTo(w, tabH);
                ctx.lineTo(w, h);
                ctx.lineTo(0, h);
                ctx.closePath();
                ctx.fillStrokeShape(shp);
              },
            });
            folderGroup.add(folderShape);
            group.add(folderGroup);
            konvaShape = new Konva.Rect({
              x: 0, y: 0, width: w, height: h, fill: 'transparent',
            });
          }
          break;
        case 'comment':
          // Comment / note shape (rectangle with folded corner)
          {
            const w = shape.width;
            const h = shape.height;
            const fold = Math.min(w, h) * 0.2;
            const commentGroup = new Konva.Group();
            const commentShape = new Konva.Shape({
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
              sceneFunc: (ctx, shp) => {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(w - fold, 0);
                ctx.lineTo(w, fold);
                ctx.lineTo(w, h);
                ctx.lineTo(0, h);
                ctx.closePath();
                ctx.fillStrokeShape(shp);
                // Draw fold line
                ctx.beginPath();
                ctx.moveTo(w - fold, 0);
                ctx.lineTo(w - fold, fold);
                ctx.lineTo(w, fold);
                ctx.strokeShape(shp);
              },
            });
            commentGroup.add(commentShape);
            group.add(commentGroup);
            konvaShape = new Konva.Rect({
              x: 0, y: 0, width: w, height: h, fill: 'transparent',
            });
          }
          break;
        case 'callout':
          // Callout shape (rectangle with pointer at bottom-left)
          {
            const w = shape.width;
            const h = shape.height;
            const boxH = h * 0.75;
            const pointerW = w * 0.1;
            const pointerOffset = w * 0.15;
            const calloutGroup = new Konva.Group();
            const calloutShape = new Konva.Shape({
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
              sceneFunc: (ctx, shp) => {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(w, 0);
                ctx.lineTo(w, boxH);
                ctx.lineTo(pointerOffset + pointerW, boxH);
                ctx.lineTo(pointerOffset, h);
                ctx.lineTo(pointerOffset, boxH);
                ctx.lineTo(0, boxH);
                ctx.closePath();
                ctx.fillStrokeShape(shp);
              },
            });
            calloutGroup.add(calloutShape);
            group.add(calloutGroup);
            konvaShape = new Konva.Rect({
              x: 0, y: 0, width: w, height: h, fill: 'transparent',
            });
          }
          break;
        case 'dividedBox':
          // Divided box (rectangle with horizontal line in the middle)
          {
            const w = shape.width;
            const h = shape.height;
            const dividedGroup = new Konva.Group();
            const outerRect = new Konva.Rect({
              x: 0, y: 0, width: w, height: h,
              fill: shape.fill, stroke: shape.stroke, strokeWidth: shape.strokeWidth,
            });
            const divLine = new Konva.Line({
              points: [0, h / 2, w, h / 2],
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
            });
            dividedGroup.add(outerRect);
            dividedGroup.add(divLine);
            group.add(dividedGroup);
            konvaShape = new Konva.Rect({
              x: 0, y: 0, width: w, height: h, fill: 'transparent',
            });
          }
          break;
        case 'pentagonLabel':
          // Pentagon label / home plate shape
          {
            const w = shape.width;
            const h = shape.height;
            const pointW = w * 0.2;
            konvaShape = new Konva.Line({
              points: [
                0, 0,
                w - pointW, 0,
                w, h / 2,
                w - pointW, h,
                0, h,
              ],
              closed: true,
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
            });
          }
          break;
        case 'trapezoid':
          // Trapezoid shape
          {
            const w = shape.width;
            const h = shape.height;
            const inset = w * 0.2;
            konvaShape = new Konva.Line({
              points: [
                inset, 0,
                w - inset, 0,
                w, h,
                0, h,
              ],
              closed: true,
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
            });
          }
          break;
        case 'hexagonHorizontal':
          // Horizontal hexagon (wider than tall, flat on top/bottom)
          {
            const w = shape.width;
            const h = shape.height;
            const inset = w * 0.15;
            konvaShape = new Konva.Line({
              points: [
                inset, 0,
                w - inset, 0,
                w, h / 2,
                w - inset, h,
                inset, h,
                0, h / 2,
              ],
              closed: true,
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
            });
          }
          break;
        case 'dividedSquare':
          // Divided square (rectangle with both vertical and horizontal dividers)
          {
            const w = shape.width;
            const h = shape.height;
            const dsGroup = new Konva.Group();
            const dsRect = new Konva.Rect({
              x: 0, y: 0, width: w, height: h,
              fill: shape.fill, stroke: shape.stroke, strokeWidth: shape.strokeWidth,
            });
            const hLine = new Konva.Line({
              points: [0, h / 2, w, h / 2],
              stroke: shape.stroke, strokeWidth: shape.strokeWidth,
            });
            const vLine = new Konva.Line({
              points: [w / 2, 0, w / 2, h],
              stroke: shape.stroke, strokeWidth: shape.strokeWidth,
            });
            dsGroup.add(dsRect);
            dsGroup.add(hLine);
            dsGroup.add(vLine);
            group.add(dsGroup);
            konvaShape = new Konva.Rect({
              x: 0, y: 0, width: w, height: h, fill: 'transparent',
            });
          }
          break;
        case 'circleCross':
          // Circle with cross inside
          {
            const w = shape.width;
            const h = shape.height;
            const ccGroup = new Konva.Group();
            const ccCircle = new Konva.Ellipse({
              x: w / 2, y: h / 2,
              radiusX: w / 2, radiusY: h / 2,
              fill: shape.fill, stroke: shape.stroke, strokeWidth: shape.strokeWidth,
            });
            const ccHLine = new Konva.Line({
              points: [0, h / 2, w, h / 2],
              stroke: shape.stroke, strokeWidth: shape.strokeWidth,
            });
            const ccVLine = new Konva.Line({
              points: [w / 2, 0, w / 2, h],
              stroke: shape.stroke, strokeWidth: shape.strokeWidth,
            });
            ccGroup.add(ccCircle);
            ccGroup.add(ccHLine);
            ccGroup.add(ccVLine);
            group.add(ccGroup);
            konvaShape = new Konva.Rect({
              x: 0, y: 0, width: w, height: h, fill: 'transparent',
            });
          }
          break;
        case 'circleX':
          // Circle with X inside
          {
            const w = shape.width;
            const h = shape.height;
            const cxGroup = new Konva.Group();
            const cxCircle = new Konva.Ellipse({
              x: w / 2, y: h / 2,
              radiusX: w / 2, radiusY: h / 2,
              fill: shape.fill, stroke: shape.stroke, strokeWidth: shape.strokeWidth,
            });
            const cxLine1 = new Konva.Line({
              points: [w * 0.15, h * 0.15, w * 0.85, h * 0.85],
              stroke: shape.stroke, strokeWidth: shape.strokeWidth,
            });
            const cxLine2 = new Konva.Line({
              points: [w * 0.85, h * 0.15, w * 0.15, h * 0.85],
              stroke: shape.stroke, strokeWidth: shape.strokeWidth,
            });
            cxGroup.add(cxCircle);
            cxGroup.add(cxLine1);
            cxGroup.add(cxLine2);
            group.add(cxGroup);
            konvaShape = new Konva.Rect({
              x: 0, y: 0, width: w, height: h, fill: 'transparent',
            });
          }
          break;
        // Icon shapes - rendered using simple Konva shapes for recognizable icons
        case 'iconHeartbeat':
        case 'iconArchive':
        case 'iconKey':
        case 'iconChat':
        case 'iconCloud':
        case 'iconArchiveBox':
        case 'iconDatabase':
        case 'iconMonitor':
        case 'iconMail':
        case 'iconDocument':
        case 'iconCode':
        case 'iconLightning':
        case 'iconLocation':
        case 'iconPhone':
        case 'iconBox3d':
        case 'iconDollar':
        case 'iconShield':
        case 'iconSend':
        case 'iconServer':
        case 'iconCube3d':
        case 'iconGear':
        case 'iconGrid':
        case 'iconTerminal':
        case 'iconUser':
        case 'iconList':
        case 'iconGlobe':
          // Icon shapes are rendered as a rounded rect with a simple icon drawn inside
          {
            const w = shape.width;
            const h = shape.height;
            const iconGroup = new Konva.Group();
            // Background rounded rectangle
            const iconBg = new Konva.Rect({
              x: 0, y: 0, width: w, height: h,
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
              cornerRadius: Math.min(w, h) * 0.15,
            });
            iconGroup.add(iconBg);
            // Draw icon symbol using Konva.Shape sceneFunc
            const padding = Math.min(w, h) * 0.2;
            const iw = w - padding * 2;
            const ih = h - padding * 2;
            const iconSymbol = new Konva.Shape({
              x: padding,
              y: padding,
              stroke: shape.textColor || shape.stroke,
              strokeWidth: Math.max(1.5, Math.min(w, h) * 0.04),
              fill: 'transparent',
              sceneFunc: (ctx, shp) => {
                ctx.beginPath();
                switch (shape.type) {
                  case 'iconHeartbeat':
                    // Heartbeat / pulse line
                    ctx.moveTo(0, ih / 2);
                    ctx.lineTo(iw * 0.2, ih / 2);
                    ctx.lineTo(iw * 0.3, ih * 0.1);
                    ctx.lineTo(iw * 0.4, ih * 0.9);
                    ctx.lineTo(iw * 0.5, ih * 0.3);
                    ctx.lineTo(iw * 0.6, ih / 2);
                    ctx.lineTo(iw, ih / 2);
                    break;
                  case 'iconArchive':
                    // Archive box with lid
                    ctx.rect(0, 0, iw, ih * 0.25);
                    ctx.rect(iw * 0.1, ih * 0.25, iw * 0.8, ih * 0.75);
                    ctx.moveTo(iw * 0.35, ih * 0.5);
                    ctx.lineTo(iw * 0.65, ih * 0.5);
                    break;
                  case 'iconKey':
                    // Key shape
                    ctx.arc(iw * 0.7, ih * 0.35, ih * 0.25, 0, Math.PI * 2);
                    ctx.moveTo(iw * 0.45, ih * 0.35);
                    ctx.lineTo(0, ih * 0.35);
                    ctx.lineTo(0, ih * 0.6);
                    ctx.moveTo(iw * 0.15, ih * 0.35);
                    ctx.lineTo(iw * 0.15, ih * 0.55);
                    break;
                  case 'iconChat':
                    // Chat bubble
                    ctx.moveTo(iw * 0.15, 0);
                    ctx.lineTo(iw * 0.85, 0);
                    ctx.arcTo(iw, 0, iw, ih * 0.15, iw * 0.1);
                    ctx.lineTo(iw, ih * 0.55);
                    ctx.arcTo(iw, ih * 0.7, iw * 0.85, ih * 0.7, iw * 0.1);
                    ctx.lineTo(iw * 0.35, ih * 0.7);
                    ctx.lineTo(iw * 0.15, ih);
                    ctx.lineTo(iw * 0.25, ih * 0.7);
                    ctx.lineTo(iw * 0.15, ih * 0.7);
                    ctx.arcTo(0, ih * 0.7, 0, ih * 0.55, iw * 0.1);
                    ctx.lineTo(0, ih * 0.15);
                    ctx.arcTo(0, 0, iw * 0.15, 0, iw * 0.1);
                    break;
                  case 'iconCloud':
                    // Cloud shape
                    ctx.arc(iw * 0.3, ih * 0.55, ih * 0.3, Math.PI * 0.7, Math.PI * 1.9);
                    ctx.arc(iw * 0.5, ih * 0.35, ih * 0.35, Math.PI * 1.1, Math.PI * 1.95);
                    ctx.arc(iw * 0.7, ih * 0.5, ih * 0.3, Math.PI * 1.3, Math.PI * 0.4);
                    ctx.lineTo(iw * 0.85, ih * 0.75);
                    ctx.lineTo(iw * 0.15, ih * 0.75);
                    break;
                  case 'iconArchiveBox':
                    // Box with open top
                    ctx.rect(0, ih * 0.2, iw, ih * 0.8);
                    ctx.moveTo(0, ih * 0.2);
                    ctx.lineTo(iw * 0.1, 0);
                    ctx.lineTo(iw * 0.9, 0);
                    ctx.lineTo(iw, ih * 0.2);
                    break;
                  case 'iconDatabase':
                    // Database cylinder
                    ctx.ellipse(iw / 2, ih * 0.15, iw / 2, ih * 0.15, 0, 0, Math.PI * 2);
                    ctx.moveTo(0, ih * 0.15);
                    ctx.lineTo(0, ih * 0.85);
                    ctx.ellipse(iw / 2, ih * 0.85, iw / 2, ih * 0.15, 0, Math.PI, 0);
                    ctx.moveTo(iw, ih * 0.15);
                    ctx.lineTo(iw, ih * 0.85);
                    break;
                  case 'iconMonitor':
                    // Monitor / screen
                    ctx.rect(0, 0, iw, ih * 0.7);
                    ctx.moveTo(iw * 0.3, ih * 0.85);
                    ctx.lineTo(iw * 0.7, ih * 0.85);
                    ctx.moveTo(iw / 2, ih * 0.7);
                    ctx.lineTo(iw / 2, ih * 0.85);
                    ctx.moveTo(iw * 0.25, ih);
                    ctx.lineTo(iw * 0.75, ih);
                    break;
                  case 'iconMail':
                    // Envelope
                    ctx.rect(0, ih * 0.1, iw, ih * 0.8);
                    ctx.moveTo(0, ih * 0.1);
                    ctx.lineTo(iw / 2, ih * 0.55);
                    ctx.lineTo(iw, ih * 0.1);
                    break;
                  case 'iconDocument':
                    // Document with lines
                    ctx.moveTo(iw * 0.65, 0);
                    ctx.lineTo(iw * 0.1, 0);
                    ctx.lineTo(iw * 0.1, ih);
                    ctx.lineTo(iw * 0.9, ih);
                    ctx.lineTo(iw * 0.9, iw * 0.25);
                    ctx.lineTo(iw * 0.65, 0);
                    ctx.moveTo(iw * 0.65, 0);
                    ctx.lineTo(iw * 0.65, iw * 0.25);
                    ctx.lineTo(iw * 0.9, iw * 0.25);
                    ctx.moveTo(iw * 0.25, ih * 0.45);
                    ctx.lineTo(iw * 0.75, ih * 0.45);
                    ctx.moveTo(iw * 0.25, ih * 0.6);
                    ctx.lineTo(iw * 0.75, ih * 0.6);
                    ctx.moveTo(iw * 0.25, ih * 0.75);
                    ctx.lineTo(iw * 0.55, ih * 0.75);
                    break;
                  case 'iconCode':
                    // Code brackets < / >
                    ctx.moveTo(iw * 0.35, ih * 0.15);
                    ctx.lineTo(iw * 0.1, ih * 0.5);
                    ctx.lineTo(iw * 0.35, ih * 0.85);
                    ctx.moveTo(iw * 0.65, ih * 0.15);
                    ctx.lineTo(iw * 0.9, ih * 0.5);
                    ctx.lineTo(iw * 0.65, ih * 0.85);
                    break;
                  case 'iconLightning':
                    // Lightning bolt
                    ctx.moveTo(iw * 0.55, 0);
                    ctx.lineTo(iw * 0.2, ih * 0.5);
                    ctx.lineTo(iw * 0.45, ih * 0.5);
                    ctx.lineTo(iw * 0.4, ih);
                    ctx.lineTo(iw * 0.8, ih * 0.4);
                    ctx.lineTo(iw * 0.55, ih * 0.4);
                    ctx.lineTo(iw * 0.55, 0);
                    break;
                  case 'iconLocation':
                    // Location pin
                    ctx.arc(iw / 2, ih * 0.35, iw * 0.35, Math.PI, 0);
                    ctx.lineTo(iw / 2, ih);
                    ctx.lineTo(iw * 0.15, ih * 0.35);
                    ctx.moveTo(iw / 2, ih * 0.35);
                    ctx.arc(iw / 2, ih * 0.35, iw * 0.12, 0, Math.PI * 2);
                    break;
                  case 'iconPhone':
                    // Phone handset
                    ctx.rect(iw * 0.2, 0, iw * 0.6, ih);
                    ctx.moveTo(iw * 0.35, ih * 0.06);
                    ctx.lineTo(iw * 0.65, ih * 0.06);
                    ctx.arc(iw / 2, ih * 0.88, iw * 0.08, 0, Math.PI * 2);
                    break;
                  case 'iconBox3d':
                    // 3D box
                    ctx.moveTo(iw / 2, 0);
                    ctx.lineTo(iw, ih * 0.25);
                    ctx.lineTo(iw, ih * 0.75);
                    ctx.lineTo(iw / 2, ih);
                    ctx.lineTo(0, ih * 0.75);
                    ctx.lineTo(0, ih * 0.25);
                    ctx.closePath();
                    ctx.moveTo(iw / 2, ih * 0.5);
                    ctx.lineTo(iw, ih * 0.25);
                    ctx.moveTo(iw / 2, ih * 0.5);
                    ctx.lineTo(0, ih * 0.25);
                    ctx.moveTo(iw / 2, ih * 0.5);
                    ctx.lineTo(iw / 2, ih);
                    break;
                  case 'iconDollar':
                    // Dollar sign
                    ctx.arc(iw / 2, ih * 0.3, iw * 0.3, Math.PI * 0.2, Math.PI * 1.1);
                    ctx.arc(iw / 2, ih * 0.65, iw * 0.3, Math.PI * 1.2, Math.PI * 0.1);
                    ctx.moveTo(iw / 2, 0);
                    ctx.lineTo(iw / 2, ih);
                    break;
                  case 'iconShield':
                    // Shield shape
                    ctx.moveTo(iw / 2, 0);
                    ctx.lineTo(iw, ih * 0.15);
                    ctx.lineTo(iw, ih * 0.55);
                    ctx.quadraticCurveTo(iw / 2, ih * 1.1, iw / 2, ih);
                    ctx.quadraticCurveTo(iw / 2, ih * 1.1, 0, ih * 0.55);
                    ctx.lineTo(0, ih * 0.15);
                    ctx.closePath();
                    break;
                  case 'iconSend':
                    // Send / paper plane
                    ctx.moveTo(0, 0);
                    ctx.lineTo(iw, ih / 2);
                    ctx.lineTo(0, ih);
                    ctx.lineTo(iw * 0.2, ih / 2);
                    ctx.closePath();
                    break;
                  case 'iconServer':
                    // Server rack
                    ctx.rect(0, 0, iw, ih * 0.3);
                    ctx.rect(0, ih * 0.35, iw, ih * 0.3);
                    ctx.rect(0, ih * 0.7, iw, ih * 0.3);
                    ctx.moveTo(iw * 0.7, ih * 0.15);
                    ctx.arc(iw * 0.75, ih * 0.15, iw * 0.04, 0, Math.PI * 2);
                    ctx.moveTo(iw * 0.7, ih * 0.5);
                    ctx.arc(iw * 0.75, ih * 0.5, iw * 0.04, 0, Math.PI * 2);
                    ctx.moveTo(iw * 0.7, ih * 0.85);
                    ctx.arc(iw * 0.75, ih * 0.85, iw * 0.04, 0, Math.PI * 2);
                    break;
                  case 'iconCube3d':
                    // 3D cube (isometric)
                    ctx.moveTo(iw / 2, 0);
                    ctx.lineTo(iw, ih * 0.25);
                    ctx.lineTo(iw / 2, ih * 0.5);
                    ctx.lineTo(0, ih * 0.25);
                    ctx.closePath();
                    ctx.moveTo(0, ih * 0.25);
                    ctx.lineTo(0, ih * 0.75);
                    ctx.lineTo(iw / 2, ih);
                    ctx.lineTo(iw / 2, ih * 0.5);
                    ctx.moveTo(iw, ih * 0.25);
                    ctx.lineTo(iw, ih * 0.75);
                    ctx.lineTo(iw / 2, ih);
                    break;
                  case 'iconGear':
                    // Gear / settings
                    {
                      const gcx = iw / 2;
                      const gcy = ih / 2;
                      const outerR = Math.min(iw, ih) * 0.45;
                      const innerR = outerR * 0.65;
                      const teeth = 8;
                      for (let i = 0; i < teeth; i++) {
                        const a1 = (i / teeth) * Math.PI * 2 - Math.PI / 2;
                        const a2 = ((i + 0.3) / teeth) * Math.PI * 2 - Math.PI / 2;
                        const a3 = ((i + 0.5) / teeth) * Math.PI * 2 - Math.PI / 2;
                        const a4 = ((i + 0.8) / teeth) * Math.PI * 2 - Math.PI / 2;
                        if (i === 0) {
                          ctx.moveTo(gcx + innerR * Math.cos(a1), gcy + innerR * Math.sin(a1));
                        } else {
                          ctx.lineTo(gcx + innerR * Math.cos(a1), gcy + innerR * Math.sin(a1));
                        }
                        ctx.lineTo(gcx + outerR * Math.cos(a2), gcy + outerR * Math.sin(a2));
                        ctx.lineTo(gcx + outerR * Math.cos(a3), gcy + outerR * Math.sin(a3));
                        ctx.lineTo(gcx + innerR * Math.cos(a4), gcy + innerR * Math.sin(a4));
                      }
                      ctx.closePath();
                      // Inner circle
                      ctx.moveTo(gcx + outerR * 0.35, gcy);
                      ctx.arc(gcx, gcy, outerR * 0.35, 0, Math.PI * 2);
                    }
                    break;
                  case 'iconGrid':
                    // Grid (4x4)
                    {
                      const gs = 0.05;
                      const gw = (1 - gs * 3) / 3;
                      for (let r = 0; r < 3; r++) {
                        for (let c = 0; c < 3; c++) {
                          ctx.rect(
                            (c * (gw + gs)) * iw,
                            (r * (gw + gs)) * ih,
                            gw * iw,
                            gw * ih
                          );
                        }
                      }
                    }
                    break;
                  case 'iconTerminal':
                    // Terminal / console
                    ctx.rect(0, 0, iw, ih);
                    ctx.moveTo(iw * 0.15, ih * 0.3);
                    ctx.lineTo(iw * 0.35, ih * 0.5);
                    ctx.lineTo(iw * 0.15, ih * 0.7);
                    ctx.moveTo(iw * 0.4, ih * 0.7);
                    ctx.lineTo(iw * 0.65, ih * 0.7);
                    break;
                  case 'iconUser':
                    // User / person icon
                    ctx.arc(iw / 2, ih * 0.3, iw * 0.2, 0, Math.PI * 2);
                    ctx.moveTo(iw * 0.85, ih);
                    ctx.arc(iw / 2, ih * 1.05, iw * 0.4, Math.PI * 1.8, Math.PI * 1.2, true);
                    break;
                  case 'iconList':
                    // List / lines
                    ctx.rect(0, ih * 0.05, iw * 0.08, ih * 0.08);
                    ctx.moveTo(iw * 0.2, ih * 0.1);
                    ctx.lineTo(iw, ih * 0.1);
                    ctx.rect(0, ih * 0.28, iw * 0.08, ih * 0.08);
                    ctx.moveTo(iw * 0.2, ih * 0.33);
                    ctx.lineTo(iw, ih * 0.33);
                    ctx.rect(0, ih * 0.5, iw * 0.08, ih * 0.08);
                    ctx.moveTo(iw * 0.2, ih * 0.55);
                    ctx.lineTo(iw, ih * 0.55);
                    ctx.rect(0, ih * 0.72, iw * 0.08, ih * 0.08);
                    ctx.moveTo(iw * 0.2, ih * 0.77);
                    ctx.lineTo(iw, ih * 0.77);
                    break;
                  case 'iconGlobe':
                    // Globe / world
                    {
                      const gr = Math.min(iw, ih) / 2;
                      ctx.arc(iw / 2, ih / 2, gr, 0, Math.PI * 2);
                      // Horizontal lines
                      ctx.moveTo(0, ih / 2);
                      ctx.lineTo(iw, ih / 2);
                      // Vertical ellipse
                      ctx.ellipse(iw / 2, ih / 2, gr * 0.4, gr, 0, 0, Math.PI * 2);
                    }
                    break;
                }
                ctx.strokeShape(shp);
              },
            });
            iconGroup.add(iconSymbol);
            group.add(iconGroup);
            konvaShape = new Konva.Rect({
              x: 0, y: 0, width: w, height: h, fill: 'transparent',
            });
          }
          break;
        default:
          konvaShape = new Konva.Rect({
            ...shapeConfig,
            cornerRadius: shape.cornerRadius ?? 0,
          });
      }

      // Selection highlight (different for text, freedraw, image, and table shapes)
      if (selectedIds.includes(shape.id) && selectionType === 'shape') {
        if (shape.type === 'text' || shape.type === 'freedraw' || shape.type === 'image' || shape.type === 'table') {
          // For text/freedraw/image shapes, add a selection border rect (don't modify stroke)
          const selectionRect = new Konva.Rect({
            x: -2,
            y: -2,
            width: shape.width + 4,
            height: shape.height + 4,
            stroke: '#ef4444',
            strokeWidth: 1,
            dash: [4, 4],
            fill: 'transparent',
          });
          group.add(selectionRect);
          selectionRect.moveToBottom();
        } else {
          konvaShape.stroke('#ef4444');
          konvaShape.strokeWidth(3);
        }
      }

      // Legacy: green highlight for click-to-connect source shape (kept for external API compatibility)
      if (connectingFrom === shape.id) {
        konvaShape.stroke('#22c55e');
        konvaShape.strokeWidth(3);
      }

      // Check if any remote user has this shape selected
      const remoteUserWithSelection = remoteUsers.find(user =>
        user.selection && user.selection.includes(shape.id)
      );

      if (remoteUserWithSelection) {
        // Add remote selection highlight (colored dashed border)
        const highlightRect = new Konva.Rect({
          x: -4,
          y: -4,
          width: shape.width + 8,
          height: shape.height + 8,
          stroke: remoteUserWithSelection.color,
          strokeWidth: 2,
          dash: [6, 3],
          cornerRadius: (shape.cornerRadius ?? 0) + 2,
          listening: false,
        });
        group.add(highlightRect);
        highlightRect.moveToBottom();

        // Add user name badge
        const badgeWidth = remoteUserWithSelection.name.length * 6 + 12;
        const badge = new Konva.Group({
          x: -4,
          y: -24,
          listening: false,
        });
        badge.add(new Konva.Rect({
          width: badgeWidth,
          height: 18,
          fill: remoteUserWithSelection.color,
          cornerRadius: 3,
        }));
        badge.add(new Konva.Text({
          x: 6,
          y: 3,
          text: remoteUserWithSelection.name,
          fontSize: 11,
          fill: '#ffffff',
          fontFamily: 'sans-serif',
        }));
        group.add(badge);
      }

      // Comment indicator
      const thread = getThreadForShape(shape.id);
      if (thread && !thread.resolved) {
        const commentBadge = new Konva.Group({
          x: shape.width - 8,
          y: -8,
          listening: true,
        });
        // Badge background
        commentBadge.add(new Konva.Circle({
          radius: 12,
          fill: '#3b82f6',
          stroke: '#ffffff',
          strokeWidth: 2,
        }));
        // Comment icon (speech bubble shape simplified)
        commentBadge.add(new Konva.Text({
          x: -5,
          y: -6,
          text: thread.replies.length > 0 ? String(thread.replies.length + 1) : '1',
          fontSize: 10,
          fontStyle: 'bold',
          fill: '#ffffff',
          fontFamily: 'sans-serif',
        }));
        // Click handler to open thread
        commentBadge.on('click tap', (e) => {
          e.cancelBubble = true;
          openThread(thread.id);
        });
        group.add(commentBadge);
      }

      group.add(konvaShape);

      // Add text overlay for non-text shapes that have text content
      if (shape.type !== 'text' && shape.type !== 'freedraw' && shape.text) {
        // Sticky notes have special text styling
        if (shape.type === 'sticky') {
          const text = new Konva.Text({
            x: 12, // padding
            y: 12, // padding
            width: shape.width - 24,
            height: shape.height - 24,
            text: shape.text,
            fontSize: shape.fontSize || 14,
            fontFamily: shape.fontFamily || 'Arial',
            fill: shape.textColor || '#1a1a1a',
            align: shape.textAlign || 'left',
            verticalAlign: shape.verticalAlign || 'top',
            listening: false,
          });
          group.add(text);
        } else {
          const text = new Konva.Text({
            x: 0,
            y: 0,
            width: shape.width,
            height: shape.height,
            text: shape.text,
            fontSize: shape.fontSize || 14,
            fontFamily: shape.fontFamily || 'Arial',
            fill: shape.textColor || '#ffffff',
            align: 'center',
            verticalAlign: 'middle',
            listening: false,
          });
          group.add(text);
        }
      }

      // Smart guides during drag
      group.on('dragmove', (e) => {
        if (!showSmartGuides) return;
        const target = e.target;
        const result = calculateSmartGuides({
          id: shape.id,
          x: target.x(),
          y: target.y(),
          width: shape.width,
          height: shape.height,
        });
        setActiveGuides(result.guides);

        // Apply snap if enabled
        if (snapToGuides) {
          if (result.snap.x !== null) {
            target.x(result.snap.x);
          }
          if (result.snap.y !== null) {
            target.y(result.snap.y);
          }
        }
      });

      group.on('dragend', (e) => {
        // Clear guides on drag end
        setActiveGuides({ horizontal: [], vertical: [] });

        const target = e.target;
        const newX = snapToGridValue(target.x());
        const newY = snapToGridValue(target.y());
        // Update visual position if snapped
        if (snapToGrid) {
          target.x(newX);
          target.y(newY);
        }
        setShapes((prev) => {
          const updated = prev.map((s) =>
            s.id === shape.id ? { ...s, x: newX, y: newY } : s
          );
          notifyShapesChange(updated);
          return updated;
        });
      });

      // Connector drag: start drag on mousedown in connector mode
      group.on('mousedown touchstart', (e) => {
        if (tool !== 'connector') return;
        e.cancelBubble = true;

        const stage = e.target.getStage();
        if (!stage) return;

        // Get the center of the shape as drag start point
        const center = {
          x: shape.x + shape.width / 2,
          y: shape.y + shape.height / 2,
        };
        isDraggingConnectorRef.current = true;
        connectorDragModeRef.current = 'create';
        connectorDragFromRef.current = shape.id;
        connectorDragFromPointRef.current = center;
        connectorDragEndRef.current = center;
        connectorDragSnapTargetRef.current = null;

        // Show preview arrow
        const preview = connectorPreviewArrowRef.current;
        if (preview) {
          preview.points([center.x, center.y, center.x, center.y]);
          preview.visible(true);
          preview.getLayer()?.batchDraw();
        }

        stage.container().style.cursor = 'crosshair';
      });

      group.on('click tap', (e) => {
        // Locked shapes can't be selected (except for connectors)
        if (shape.locked && tool !== 'connector') return;

        if (tool === 'connector') {
          // Connector creation now handled by drag (mousedown→mousemove→mouseup)
          return;
        } else {
          // Support Shift+Click for multi-select
          const evt = e.evt as MouseEvent | TouchEvent;
          const shiftKey = 'shiftKey' in evt ? evt.shiftKey : false;
          toggleSelection(shape.id, shiftKey);
        }
      });

      group.on('dblclick dbltap', (e) => {
        if (shape.type === 'table' && shape.tableData) {
          // For table shapes, detect which cell was clicked
          const stage = e.target.getStage();
          if (!stage) return;
          const pointer = stage.getPointerPosition();
          if (!pointer) return;

          // Get shape position in stage coordinates
          const groupTransform = group.getAbsoluteTransform();
          const invertedTransform = groupTransform.copy().invert();
          const localPos = invertedTransform.point(pointer);

          // Find which cell was clicked
          const tableData = shape.tableData;
          let yOffset = 0;
          for (let row = 0; row < tableData.rows; row++) {
            const rowHeight = tableData.rowHeights[row] || 40;
            let xOffset = 0;
            for (let col = 0; col < tableData.cols; col++) {
              const colWidth = tableData.colWidths[col] || 100;
              if (
                localPos.x >= xOffset &&
                localPos.x < xOffset + colWidth &&
                localPos.y >= yOffset &&
                localPos.y < yOffset + rowHeight
              ) {
                // Found the clicked cell
                setEditingCell({ shapeId: shape.id, row, col });
                setSelectedId(shape.id);
                return;
              }
              xOffset += colWidth;
            }
            yOffset += rowHeight;
          }
        } else {
          // For other shapes, edit shape text
          setEditingId(shape.id);
          setSelectedId(shape.id);
        }
      });

      // Hover events for connection points in connector/select mode
      group.on('mouseenter', () => {
        if (tool === 'connector' || tool === 'select') {
          setHoveredShapeId(shape.id);
        }
      });

      group.on('mouseleave', () => {
        if (tool === 'connector' || tool === 'select') {
          // Keep hoveredShapeId while dragging a connector so snap targets work
          if (!isDraggingConnectorRef.current) {
            setHoveredShapeId(null);
          }
        }
      });

      // Right-click context menu for tables
      group.on('contextmenu', (e) => {
        if (shape.type === 'table' && shape.tableData) {
          e.evt.preventDefault();
          const stage = e.target.getStage();
          if (!stage) return;
          const pointer = stage.getPointerPosition();
          if (!pointer) return;

          // Get shape position in stage coordinates
          const groupTransform = group.getAbsoluteTransform();
          const invertedTransform = groupTransform.copy().invert();
          const localPos = invertedTransform.point(pointer);

          // Find which cell was right-clicked
          const tableData = shape.tableData;
          let yOffset = 0;
          for (let row = 0; row < tableData.rows; row++) {
            const rowHeight = tableData.rowHeights[row] || 40;
            let xOffset = 0;
            for (let col = 0; col < tableData.cols; col++) {
              const colWidth = tableData.colWidths[col] || 100;
              if (
                localPos.x >= xOffset &&
                localPos.x < xOffset + colWidth &&
                localPos.y >= yOffset &&
                localPos.y < yOffset + rowHeight
              ) {
                // Found the clicked cell - show context menu
                const containerRect = containerRef.current?.getBoundingClientRect();
                if (containerRect) {
                  setTableContextMenu({
                    x: e.evt.clientX - containerRect.left,
                    y: e.evt.clientY - containerRect.top,
                    shapeId: shape.id,
                    row,
                    col,
                  });
                }
                return;
              }
              xOffset += colWidth;
            }
            yOffset += rowHeight;
          }
        }
      });

      layer.add(group);
    });

    const transformer = transformerRef.current;
    if (transformer && selectedIds.length > 0 && selectionType === 'shape') {
      // Find all selected nodes
      const selectedNodes = selectedIds
        .map((id) => layer.findOne(`#${id}`))
        .filter((node): node is Konva.Node => node !== undefined);

      if (selectedNodes.length > 0) {
        // Check if any selected shape requires aspect ratio preservation
        const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
        const shouldKeepRatio = selectedShapes.some(s =>
          s.type === 'image' && s.preserveAspectRatio !== false
        );

        transformer.keepRatio(shouldKeepRatio);
        transformer.nodes(selectedNodes);
        transformer.getLayer()?.batchDraw();
      } else {
        transformer.nodes([]);
      }
    } else if (transformer) {
      transformer.nodes([]);
    }

    layer.getLayer()?.batchDraw();
  }, [shapes, selectedIds, selectionType, notifyShapesChange, tool, connectingFrom, addConnector, editingId, toggleSelection, snapToGridValue, snapToGrid, showSmartGuides, snapToGuides, calculateSmartGuides, remoteUsers, getThreadForShape, openThread, isShapeInViewport]);

  // Add shape at position
  const addShape = useCallback((type: ShapeType, x: number, y: number, options?: { stampType?: StampType; sectionColor?: SectionColor }) => {
    // Use different defaults based on shape type
    let props;
    if (type === 'text') {
      props = defaultTextShapeProps;
    } else if (type === 'sticky') {
      props = {
        ...defaultStickyNoteProps,
        fill: STICKY_COLORS[currentStickyColor],
        stickyColor: currentStickyColor,
      };
    } else if (type === 'stamp') {
      props = {
        ...defaultStampProps,
        stampType: options?.stampType || currentStampType,
      };
    } else if (type === 'section') {
      const color = options?.sectionColor || 'gray';
      props = {
        ...defaultSectionProps,
        fill: SECTION_COLORS[color],
        sectionColor: color,
      };
    } else if (type === 'table') {
      // Create fresh tableData to avoid shared references
      props = {
        ...defaultTableProps,
        tableData: {
          rows: 3,
          cols: 3,
          cells: [
            [{ text: '' }, { text: '' }, { text: '' }],
            [{ text: '' }, { text: '' }, { text: '' }],
            [{ text: '' }, { text: '' }, { text: '' }],
          ],
          colWidths: [100, 100, 100],
          rowHeights: [40, 40, 40],
          headerRow: false,
        },
      };
    } else if (type === 'mindmap') {
      // Create fresh mindmapData to avoid shared references
      props = {
        ...defaultMindmapProps,
        mindmapData: {
          root: {
            id: 'root',
            text: 'Central Idea',
            children: [
              { id: 'child-1', text: 'Topic 1', children: [] },
              { id: 'child-2', text: 'Topic 2', children: [] },
              { id: 'child-3', text: 'Topic 3', children: [] },
            ],
          },
          layout: 'horizontal' as const,
          nodeSpacing: 20,
          levelSpacing: 120,
        },
      };
    } else if (type === 'embed') {
      // Create fresh embedData to avoid shared references
      props = {
        ...defaultEmbedProps,
        embedData: {
          url: '',
          title: 'Link Preview',
          description: 'Paste a URL to see a preview',
          embedType: 'link' as const,
        },
      };
    } else if (type === 'roundedRectangle') {
      props = {
        ...defaultShapeProps,
        cornerRadius: 12, // Default corner radius for rounded rectangle
      };
    } else {
      props = defaultShapeProps;
    }
    // Apply grid snap if enabled
    const snappedX = snapToGridValue(x - props.width / 2);
    const snappedY = snapToGridValue(y - props.height / 2);
    const newShape: Shape = {
      id: generateId(),
      type,
      x: snappedX,
      y: snappedY,
      ...props,
    };

    setShapes((prev) => {
      const updated = [...prev, newShape];
      notifyShapesChange(updated);
      return updated;
    });
    setSelectedId(newShape.id);

    // For text and sticky shapes, immediately open the editor
    if (type === 'text' || type === 'sticky') {
      setEditingId(newShape.id);
    }

    setTool('select');

    // Announce to screen readers
    const shapeNames: Record<string, string> = {
      rectangle: 'Rectangle', ellipse: 'Ellipse', diamond: 'Diamond',
      text: 'Text', sticky: 'Sticky note', table: 'Table', mindmap: 'Mind map',
      embed: 'Link preview', section: 'Section', stamp: 'Stamp',
      triangle: 'Triangle', triangleDown: 'Triangle down', pentagon: 'Pentagon',
      hexagon: 'Hexagon', star: 'Star', cross: 'Cross', roundedRectangle: 'Rounded rectangle',
      parallelogram: 'Parallelogram', database: 'Database', document: 'Document',
    };
    setAnnouncement(`${shapeNames[type] || type} added`);
  }, [notifyShapesChange, snapToGridValue, currentStickyColor, currentStampType]);

  // Load image from src and cache it
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      // Check cache first
      const cached = imageCache.get(src);
      if (cached && cached.complete) {
        resolve(cached);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src.substring(0, 50)}...`));
      };
      img.src = src;
    });
  }, []);

  // Add image shape at position
  const addImageShape = useCallback((src: string, x: number, y: number, naturalWidth: number, naturalHeight: number) => {
    // Calculate size - fit within max dimensions while preserving aspect ratio
    let width = naturalWidth;
    let height = naturalHeight;

    if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
      const scale = Math.min(MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    // Limit initial display size for usability (max 400px)
    const maxDisplaySize = 400;
    if (width > maxDisplaySize || height > maxDisplaySize) {
      const displayScale = Math.min(maxDisplaySize / width, maxDisplaySize / height);
      width = Math.round(width * displayScale);
      height = Math.round(height * displayScale);
    }

    const snappedX = snapToGridValue(x - width / 2);
    const snappedY = snapToGridValue(y - height / 2);

    const newShape: Shape = {
      id: generateId(),
      type: 'image',
      x: snappedX,
      y: snappedY,
      ...defaultImageShapeProps,
      width,
      height,
      src,
      naturalWidth,
      naturalHeight,
    };

    setShapes((prev) => {
      const updated = [...prev, newShape];
      notifyShapesChange(updated);
      return updated;
    });
    setSelectedId(newShape.id);
    setTool('select');
  }, [notifyShapesChange, snapToGridValue]);

  // Process dropped or pasted image file
  const processImageFile = useCallback(async (file: File, x: number, y: number) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          reject(new Error('Failed to read file'));
          return;
        }

        // Load image to get dimensions
        const img = new Image();
        img.onload = () => {
          // Cache the image
          imageCache.set(dataUrl, img);
          addImageShape(dataUrl, x, y, img.naturalWidth, img.naturalHeight);
          resolve();
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, [addImageShape]);

  // Handle drag over (prevent default to allow drop)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Handle file drop on canvas
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    // Get drop position relative to canvas
    const stage = stageRef.current;
    if (!stage) return;

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const stagePos = stage.position();
    const stageScale = stage.scaleX();

    // Convert screen position to canvas position
    const dropX = (e.clientX - containerRect.left - stagePos.x) / stageScale;
    const dropY = (e.clientY - containerRect.top - stagePos.y) / stageScale;

    // Process each image file
    for (const file of imageFiles) {
      try {
        await processImageFile(file, dropX, dropY);
      } catch (error) {
        console.error('Failed to process dropped image:', error);
      }
    }
  }, [processImageFile]);

  // Handle clipboard paste (for images)
  const handlePasteImage = useCallback(async (e: ClipboardEvent) => {
    // Check for image data in clipboard
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'));
    if (imageItems.length === 0) return;

    // Prevent default paste behavior for images
    e.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    // Get center of current viewport
    const stagePos = stage.position();
    const stageScale = stage.scaleX();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const centerX = (containerRect.width / 2 - stagePos.x) / stageScale;
    const centerY = (containerRect.height / 2 - stagePos.y) / stageScale;

    for (const item of imageItems) {
      const file = item.getAsFile();
      if (file) {
        try {
          await processImageFile(file, centerX, centerY);
        } catch (error) {
          console.error('Failed to paste image:', error);
        }
      }
    }
  }, [processImageFile]);

  // Set up clipboard paste listener for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Check if there are any image items
      const items = e.clipboardData?.items;
      if (!items) return;

      const hasImage = Array.from(items).some(item => item.type.startsWith('image/'));
      if (hasImage) {
        handlePasteImage(e);
      }
      // Let normal paste (Ctrl+V for shapes) continue if no image
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePasteImage]);

  // Open file dialog to add image
  const openImageDialog = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      const stage = stageRef.current;
      if (!stage) return;

      // Get center of current viewport
      const stagePos = stage.position();
      const stageScale = stage.scaleX();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const centerX = (containerRect.width / 2 - stagePos.x) / stageScale;
      const centerY = (containerRect.height / 2 - stagePos.y) / stageScale;

      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          try {
            await processImageFile(file, centerX, centerY);
          } catch (error) {
            console.error('Failed to add image:', error);
          }
        }
      }
    };
    input.click();
  }, [processImageFile]);

  // Add stamp at center of viewport
  const addStampAtCenter = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const stagePos = stage.position();
    const stageScale = stage.scaleX();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const centerX = (containerRect.width / 2 - stagePos.x) / stageScale;
    const centerY = (containerRect.height / 2 - stagePos.y) / stageScale;

    addShape('stamp', centerX, centerY);
  }, [addShape]);

  // Handle stamp shortcut (select stamp type and add)
  const handleStampShortcut = useCallback((type: StampType) => {
    setStampType(type);
    const stage = stageRef.current;
    if (!stage) return;

    const stagePos = stage.position();
    const stageScale = stage.scaleX();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const centerX = (containerRect.width / 2 - stagePos.x) / stageScale;
    const centerY = (containerRect.height / 2 - stagePos.y) / stageScale;

    addShape('stamp', centerX, centerY, { stampType: type });
  }, [setStampType, addShape]);

  // Delete selected shapes or connector
  const deleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;

    if (selectionType === 'connector') {
      // Delete single connector
      setConnectors((prev) => prev.filter((c) => c.id !== selectedId));
      clearSelection();
      setAnnouncement('Connector deleted');
    } else {
      // Delete all selected shapes
      const count = selectedIds.length;
      setShapes((prev) => {
        const updated = prev.filter((s) => !selectedIds.includes(s.id));
        notifyShapesChange(updated);
        return updated;
      });
      // Delete connectors connected to any deleted shape
      setConnectors((prev) =>
        prev.filter((c) =>
          !selectedIds.includes(c.fromShapeId) && !selectedIds.includes(c.toShapeId)
        )
      );
      clearSelection();
      setAnnouncement(`${count} shape${count > 1 ? 's' : ''} deleted`);
    }
  }, [selectedIds, selectedId, selectionType, notifyShapesChange, clearSelection]);

  // Clear all shapes
  const clearAll = useCallback(() => {
    setShapes([]);
    setConnectors([]);
    setSelectedId(null);
    notifyShapesChange([]);
  }, [notifyShapesChange]);

  // Tidy up selected shapes
  const handleTidyUp = useCallback((layout: TidyUpLayout) => {
    if (selectedIds.length < 2) return;

    // Get selected shapes
    const selectedShapes = shapes.filter((s) => selectedIds.includes(s.id));
    if (selectedShapes.length < 2) return;

    // Apply tidy up layout
    const tidiedShapes = tidyUp(selectedShapes, { layout });

    // Update shapes with new positions
    setShapes((prev) => {
      const updated = prev.map((shape) => {
        const tidied = tidiedShapes.find((t: Shape) => t.id === shape.id);
        return tidied || shape;
      });
      notifyShapesChange(updated);
      return updated;
    });
  }, [selectedIds, shapes, notifyShapesChange]);

  // Get shape center position
  const getShapeCenter = useCallback((shape: Shape) => {
    return {
      x: shape.x + shape.width / 2,
      y: shape.y + shape.height / 2,
    };
  }, []);

  // Get edge intersection point for a shape (moved before getConnectionPoint)
  const getShapeEdgePoint = useCallback((shape: Shape, targetPoint: { x: number; y: number }) => {
    const center = {
      x: shape.x + shape.width / 2,
      y: shape.y + shape.height / 2,
    };

    const dx = targetPoint.x - center.x;
    const dy = targetPoint.y - center.y;

    if (dx === 0 && dy === 0) {
      return center;
    }

    let edgePoint = { x: center.x, y: center.y };

    switch (shape.type) {
      case 'ellipse': {
        const rx = shape.width / 2;
        const ry = shape.height / 2;
        const angle = Math.atan2(dy, dx);
        edgePoint = {
          x: center.x + rx * Math.cos(angle),
          y: center.y + ry * Math.sin(angle),
        };
        break;
      }

      case 'diamond': {
        const hw = shape.width / 2;
        const hh = shape.height / 2;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ndx = dx / len;
        const ndy = dy / len;
        const absDx = Math.abs(ndx);
        const absDy = Math.abs(ndy);

        let t: number;
        if (absDx * hh + absDy * hw !== 0) {
          t = (hw * hh) / (absDx * hh + absDy * hw);
        } else {
          t = 0;
        }

        edgePoint = {
          x: center.x + ndx * t,
          y: center.y + ndy * t,
        };
        break;
      }

      default: {
        const hw = shape.width / 2;
        const hh = shape.height / 2;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        let t: number;
        if (absX * hh > absY * hw) {
          t = hw / absX;
        } else {
          t = hh / absY;
        }

        edgePoint = {
          x: center.x + dx * t,
          y: center.y + dy * t,
        };
        break;
      }
    }

    return edgePoint;
  }, []);

  // Get connection point coordinates for a shape
  const getConnectionPoint = useCallback((shape: Shape, point: 'top' | 'right' | 'bottom' | 'left' | 'auto', targetShape?: Shape) => {
    const center = getShapeCenter(shape);

    if (point === 'auto' && targetShape) {
      // Auto: use edge point toward target
      const targetCenter = getShapeCenter(targetShape);
      return getShapeEdgePoint(shape, targetCenter);
    }

    // For specific connection points
    switch (point) {
      case 'top':
        return { x: center.x, y: shape.y };
      case 'right':
        return { x: shape.x + shape.width, y: center.y };
      case 'bottom':
        return { x: center.x, y: shape.y + shape.height };
      case 'left':
        return { x: shape.x, y: center.y };
      default:
        return center;
    }
  }, [getShapeCenter, getShapeEdgePoint]);

  // Get all 4 connection points for a shape
  const getConnectionPoints = useCallback((shape: Shape) => {
    const center = getShapeCenter(shape);
    return {
      top: { x: center.x, y: shape.y },
      right: { x: shape.x + shape.width, y: center.y },
      bottom: { x: center.x, y: shape.y + shape.height },
      left: { x: shape.x, y: center.y },
    };
  }, [getShapeCenter]);

  // Calculate orthogonal (elbow) path between two points
  const getOrthogonalPath = useCallback((
    from: { x: number; y: number },
    to: { x: number; y: number },
    fromPoint?: 'top' | 'right' | 'bottom' | 'left' | 'auto',
    toPoint?: 'top' | 'right' | 'bottom' | 'left' | 'auto'
  ): number[] => {
    // Simple orthogonal routing with one bend point
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    // Determine routing direction based on connection points
    if (fromPoint === 'left' || fromPoint === 'right' || toPoint === 'left' || toPoint === 'right') {
      // Horizontal first, then vertical
      return [from.x, from.y, midX, from.y, midX, to.y, to.x, to.y];
    } else if (fromPoint === 'top' || fromPoint === 'bottom' || toPoint === 'top' || toPoint === 'bottom') {
      // Vertical first, then horizontal
      return [from.x, from.y, from.x, midY, to.x, midY, to.x, to.y];
    } else {
      // Auto: choose based on distance
      const dx = Math.abs(to.x - from.x);
      const dy = Math.abs(to.y - from.y);

      if (dx > dy) {
        // More horizontal distance - go horizontal first
        return [from.x, from.y, midX, from.y, midX, to.y, to.x, to.y];
      } else {
        // More vertical distance - go vertical first
        return [from.x, from.y, from.x, midY, to.x, midY, to.x, to.y];
      }
    }
  }, []);

  // Get line dash pattern based on style
  const getLineDash = useCallback((style?: 'solid' | 'dashed' | 'dotted'): number[] => {
    switch (style) {
      case 'dashed':
        return [10, 5];
      case 'dotted':
        return [3, 3];
      default:
        return [];
    }
  }, []);

  // Render connectors
  const renderConnectors = useCallback(() => {
    const layer = connectorsLayerRef.current;
    if (!layer) return;

    layer.destroyChildren();

    connectors.forEach((connector) => {
      const fromShape = connector.fromShapeId ? shapes.find((s) => s.id === connector.fromShapeId) : undefined;
      const toShape = connector.toShapeId ? shapes.find((s) => s.id === connector.toShapeId) : undefined;

      // Need at least a shape or a position for each end
      if (!fromShape && !connector.fromPos) return;
      if (!toShape && !connector.toPos) return;

      // Get connection points (use specified points or auto)
      const fromPoint = connector.fromPoint || 'auto';
      const toPoint = connector.toPoint || 'auto';

      let from: { x: number; y: number };
      let to: { x: number; y: number };

      if (fromShape) {
        if (fromPoint === 'auto') {
          const toCenter = toShape ? getShapeCenter(toShape) : connector.toPos!;
          from = getShapeEdgePoint(fromShape, toCenter);
        } else {
          from = getConnectionPoint(fromShape, fromPoint);
        }
      } else {
        from = connector.fromPos!;
      }

      if (toShape) {
        if (toPoint === 'auto') {
          const fromCenter = fromShape ? getShapeCenter(fromShape) : connector.fromPos!;
          to = getShapeEdgePoint(toShape, fromCenter);
        } else {
          to = getConnectionPoint(toShape, toPoint);
        }
      } else {
        to = connector.toPos!;
      }

      const isSelected = selectedId === connector.id && selectionType === 'connector';
      const strokeColor = isSelected ? '#ef4444' : connector.stroke;
      const strokeWidth = isSelected ? connector.strokeWidth + 1 : connector.strokeWidth;

      // Calculate points based on routing type
      let points: number[];
      if (connector.routing === 'orthogonal') {
        points = getOrthogonalPath(from, to, fromPoint, toPoint);
      } else {
        points = [from.x, from.y, to.x, to.y];
      }

      // Determine if we need arrow heads
      const showEndArrow = connector.arrow || connector.arrowEnd === 'arrow' || connector.arrowEnd === 'triangle';
      const showStartArrow = connector.arrowStart === 'arrow' || connector.arrowStart === 'triangle';

      // Get line dash pattern
      const dash = getLineDash(connector.lineStyle);

      if (showEndArrow || showStartArrow) {
        // Use Arrow for connectors with arrowheads
        const arrow = new Konva.Arrow({
          id: connector.id,
          points: points,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          fill: strokeColor,
          pointerLength: showEndArrow ? 10 : 0,
          pointerWidth: showEndArrow ? 8 : 0,
          pointerAtBeginning: showStartArrow,
          pointerAtEnding: showEndArrow,
          hitStrokeWidth: 20,
          dash: dash,
        });

        arrow.on('click tap', (e) => {
          e.cancelBubble = true;
          selectConnector(connector.id);
        });

        layer.add(arrow);
      } else {
        // Use Line for connectors without arrowheads
        const line = new Konva.Line({
          id: connector.id,
          points: points,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          hitStrokeWidth: 20,
          dash: dash,
        });

        line.on('click tap', (e) => {
          e.cancelBubble = true;
          selectConnector(connector.id);
        });

        layer.add(line);
      }

      // Render endpoint handles for selected connectors (reconnect feature)
      if (isSelected) {
        const endpoints: Array<{ pos: { x: number; y: number }; end: 'from' | 'to'; anchorShapeId?: string; oppositeShapeId?: string; oppositePos?: { x: number; y: number } }> = [
          { pos: from, end: 'from', anchorShapeId: connector.fromShapeId, oppositeShapeId: connector.toShapeId, oppositePos: !connector.toShapeId ? to : undefined },
          { pos: to, end: 'to', anchorShapeId: connector.toShapeId, oppositeShapeId: connector.fromShapeId, oppositePos: !connector.fromShapeId ? from : undefined },
        ];

        endpoints.forEach(({ pos, end, oppositeShapeId, oppositePos }) => {
          const handle = new Konva.Circle({
            x: pos.x,
            y: pos.y,
            radius: 6,
            fill: '#ffffff',
            stroke: '#ef4444',
            strokeWidth: 2,
            shadowColor: '#000000',
            shadowBlur: 4,
            shadowOpacity: 0.2,
          });

          handle.on('mouseenter', () => {
            handle.fill('#ef4444');
            const st = stageRef.current;
            if (st) st.container().style.cursor = 'grab';
            layer.getLayer()?.batchDraw();
          });

          handle.on('mouseleave', () => {
            if (!isDraggingConnectorRef.current) {
              handle.fill('#ffffff');
              const st = stageRef.current;
              if (st) st.container().style.cursor = 'default';
              layer.getLayer()?.batchDraw();
            }
          });

          handle.on('mousedown touchstart', (e) => {
            e.cancelBubble = true;

            // Find the opposite (fixed) end's position for the preview arrow
            let oppositeCenter: { x: number; y: number };
            if (oppositeShapeId) {
              const oppositeShape = shapesRef.current.find((s) => s.id === oppositeShapeId);
              if (!oppositeShape) return;
              oppositeCenter = {
                x: oppositeShape.x + oppositeShape.width / 2,
                y: oppositeShape.y + oppositeShape.height / 2,
              };
            } else if (oppositePos) {
              oppositeCenter = oppositePos;
            } else {
              return;
            }

            connectorDragModeRef.current = 'reconnect';
            connectorReconnectIdRef.current = connector.id;
            connectorReconnectEndRef.current = end;
            isDraggingConnectorRef.current = true;
            // The "from" for the preview is the fixed opposite end
            connectorDragFromRef.current = oppositeShapeId || null;
            connectorDragFromPointRef.current = oppositeCenter;
            connectorDragEndRef.current = { x: pos.x, y: pos.y };
            connectorDragSnapTargetRef.current = null;

            // Show preview arrow from the fixed end
            const preview = connectorPreviewArrowRef.current;
            if (preview) {
              preview.points([oppositeCenter.x, oppositeCenter.y, pos.x, pos.y]);
              preview.visible(true);
              preview.getLayer()?.batchDraw();
            }

            const st = stageRef.current;
            if (st) st.container().style.cursor = 'grabbing';
          });

          layer.add(handle);
        });
      }
    });

    layer.getLayer()?.batchDraw();
  }, [connectors, shapes, getShapeCenter, getShapeEdgePoint, getConnectionPoint, getOrthogonalPath, getLineDash, selectedId, selectionType, selectConnector]);

  // Calculate connector toolbar screen position
  const connectorToolbarPos = useMemo(() => {
    if (selectionType !== 'connector' || !selectedId) return null;
    const connector = connectors.find((c) => c.id === selectedId);
    if (!connector) return null;
    const fromShape = connector.fromShapeId ? shapes.find((s) => s.id === connector.fromShapeId) : undefined;
    const toShape = connector.toShapeId ? shapes.find((s) => s.id === connector.toShapeId) : undefined;
    if (!fromShape && !connector.fromPos) return null;
    if (!toShape && !connector.toPos) return null;

    const fromPoint = connector.fromPoint || 'auto';
    const toPoint = connector.toPoint || 'auto';

    let from: { x: number; y: number };
    let to: { x: number; y: number };

    if (fromShape) {
      const target = toShape ? getShapeCenter(toShape) : connector.toPos!;
      from = fromPoint === 'auto' ? getShapeEdgePoint(fromShape, target) : getConnectionPoint(fromShape, fromPoint);
    } else {
      from = connector.fromPos!;
    }
    if (toShape) {
      const target = fromShape ? getShapeCenter(fromShape) : connector.fromPos!;
      to = toPoint === 'auto' ? getShapeEdgePoint(toShape, target) : getConnectionPoint(toShape, toPoint);
    } else {
      to = connector.toPos!;
    }

    // Calculate midpoint based on routing
    let mid: { x: number; y: number };
    if (connector.routing === 'orthogonal') {
      const pts = getOrthogonalPath(from, to, fromPoint, toPoint);
      // Middle segment midpoint (pts has 8 values = 4 points, middle segment is pts[2..5])
      const segIdx = Math.floor(pts.length / 4) * 2; // index 4 for 8-length
      const mx = (pts[segIdx - 2] + pts[segIdx]) / 2;
      const my = (pts[segIdx - 1] + pts[segIdx + 1]) / 2;
      mid = { x: mx, y: my };
    } else {
      mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    }

    // Canvas coords → screen coords
    const stage = stageRef.current;
    if (!stage) return null;
    const stageScale = stage.scaleX();
    const stagePos = stage.position();
    return {
      x: mid.x * stageScale + stagePos.x,
      y: mid.y * stageScale + stagePos.y - 48,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionType, selectedId, connectors, shapes, scale, viewportTick, getShapeCenter, getShapeEdgePoint, getConnectionPoint, getOrthogonalPath]);

  // Update shape text
  const updateShapeText = useCallback((id: string, text: string) => {
    setShapes((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, text } : s
      );
      notifyShapesChange(updated);
      return updated;
    });
    setEditingId(null);
  }, [notifyShapesChange]);

  // Update table cell text
  const updateCellText = useCallback((shapeId: string, row: number, col: number, text: string) => {
    setShapes((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== shapeId || !s.tableData) return s;
        const newCells = s.tableData.cells.map((r: TableCell[], ri: number) =>
          ri === row
            ? r.map((c: TableCell, ci: number) => (ci === col ? { ...c, text } : c))
            : r
        );
        return {
          ...s,
          tableData: { ...s.tableData, cells: newCells },
        };
      });
      notifyShapesChange(updated);
      return updated;
    });
    setEditingCell(null);
  }, [notifyShapesChange, setEditingCell]);

  // Add row to table
  const addTableRow = useCallback((shapeId: string, afterRow?: number) => {
    setShapes((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== shapeId || !s.tableData) return s;
        const insertIndex = afterRow !== undefined ? afterRow + 1 : s.tableData.rows;
        const newRow = Array(s.tableData.cols).fill(null).map(() => ({ text: '' }));
        const newCells = [
          ...s.tableData.cells.slice(0, insertIndex),
          newRow,
          ...s.tableData.cells.slice(insertIndex),
        ];
        const newRowHeights = [
          ...s.tableData.rowHeights.slice(0, insertIndex),
          40,
          ...s.tableData.rowHeights.slice(insertIndex),
        ];
        return {
          ...s,
          height: s.height + 40,
          tableData: {
            ...s.tableData,
            rows: s.tableData.rows + 1,
            cells: newCells,
            rowHeights: newRowHeights,
          },
        };
      });
      notifyShapesChange(updated);
      return updated;
    });
  }, [notifyShapesChange]);

  // Delete row from table
  const deleteTableRow = useCallback((shapeId: string, rowIndex: number) => {
    setShapes((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== shapeId || !s.tableData || s.tableData.rows <= 1) return s;
        const deletedRowHeight = s.tableData.rowHeights[rowIndex] || 40;
        const newCells = s.tableData.cells.filter((_: TableCell[], i: number) => i !== rowIndex);
        const newRowHeights = s.tableData.rowHeights.filter((_: number, i: number) => i !== rowIndex);
        return {
          ...s,
          height: s.height - deletedRowHeight,
          tableData: {
            ...s.tableData,
            rows: s.tableData.rows - 1,
            cells: newCells,
            rowHeights: newRowHeights,
          },
        };
      });
      notifyShapesChange(updated);
      return updated;
    });
  }, [notifyShapesChange]);

  // Add column to table
  const addTableColumn = useCallback((shapeId: string, afterCol?: number) => {
    setShapes((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== shapeId || !s.tableData) return s;
        const insertIndex = afterCol !== undefined ? afterCol + 1 : s.tableData.cols;
        const newCells = s.tableData.cells.map((row: TableCell[]) => [
          ...row.slice(0, insertIndex),
          { text: '' },
          ...row.slice(insertIndex),
        ]);
        const newColWidths = [
          ...s.tableData.colWidths.slice(0, insertIndex),
          100,
          ...s.tableData.colWidths.slice(insertIndex),
        ];
        return {
          ...s,
          width: s.width + 100,
          tableData: {
            ...s.tableData,
            cols: s.tableData.cols + 1,
            cells: newCells,
            colWidths: newColWidths,
          },
        };
      });
      notifyShapesChange(updated);
      return updated;
    });
  }, [notifyShapesChange]);

  // Delete column from table
  const deleteTableColumn = useCallback((shapeId: string, colIndex: number) => {
    setShapes((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== shapeId || !s.tableData || s.tableData.cols <= 1) return s;
        const deletedColWidth = s.tableData.colWidths[colIndex] || 100;
        const newCells = s.tableData.cells.map((row: TableCell[]) => row.filter((_: TableCell, i: number) => i !== colIndex));
        const newColWidths = s.tableData.colWidths.filter((_: number, i: number) => i !== colIndex);
        return {
          ...s,
          width: s.width - deletedColWidth,
          tableData: {
            ...s.tableData,
            cols: s.tableData.cols - 1,
            cells: newCells,
            colWidths: newColWidths,
          },
        };
      });
      notifyShapesChange(updated);
      return updated;
    });
  }, [notifyShapesChange]);

  // Toggle header row style
  const toggleTableHeaderRow = useCallback((shapeId: string) => {
    setShapes((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== shapeId || !s.tableData) return s;
        return {
          ...s,
          tableData: {
            ...s.tableData,
            headerRow: !s.tableData.headerRow,
          },
        };
      });
      notifyShapesChange(updated);
      return updated;
    });
  }, [notifyShapesChange]);

  // Set cell background color
  const setCellBackground = useCallback((shapeId: string, row: number, col: number, color: string) => {
    setShapes((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== shapeId || !s.tableData) return s;
        const newCells = s.tableData.cells.map((r: TableCell[], ri: number) =>
          ri === row
            ? r.map((c: TableCell, ci: number) => (ci === col ? { ...c, fill: color } : c))
            : r
        );
        return {
          ...s,
          tableData: { ...s.tableData, cells: newCells },
        };
      });
      notifyShapesChange(updated);
      return updated;
    });
  }, [notifyShapesChange]);

  // Get editing shape position for overlay
  const getEditingShape = useCallback(() => {
    if (!editingId) return null;
    return shapes.find((s) => s.id === editingId) || null;
  }, [editingId, shapes]);

  // Reset zoom and position
  const resetZoom = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();
    setScale(1);
    updateViewport();
  }, [updateViewport]);

  // Clipboard state for copy/paste
  const clipboardRef = useRef<Shape | null>(null);
  const pasteOffsetRef = useRef(20);

  // Copy selected shape
  const copySelected = useCallback(() => {
    if (!selectedId) return;
    const shape = shapes.find((s) => s.id === selectedId);
    if (shape) {
      clipboardRef.current = { ...shape };
      pasteOffsetRef.current = 20;
    }
  }, [selectedId, shapes]);

  // Paste copied shape
  const pasteShape = useCallback(() => {
    if (!clipboardRef.current) return;

    const newShape: Shape = {
      ...clipboardRef.current,
      id: generateId(),
      x: clipboardRef.current.x + pasteOffsetRef.current,
      y: clipboardRef.current.y + pasteOffsetRef.current,
    };

    setShapes((prev) => {
      const updated = [...prev, newShape];
      notifyShapesChange(updated);
      return updated;
    });
    setSelectedId(newShape.id);
    pasteOffsetRef.current += 20;
  }, [notifyShapesChange]);

  // Duplicate selected shape
  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const shape = shapes.find((s) => s.id === selectedId);
    if (!shape) return;

    const newShape: Shape = {
      ...shape,
      id: generateId(),
      x: shape.x + 20,
      y: shape.y + 20,
    };

    setShapes((prev) => {
      const updated = [...prev, newShape];
      notifyShapesChange(updated);
      return updated;
    });
    setSelectedId(newShape.id);
  }, [selectedId, shapes, notifyShapesChange]);

  // Move selected shape with arrow keys
  const moveSelected = useCallback((dx: number, dy: number) => {
    if (!selectedId) return;

    setShapes((prev) => {
      const updated = prev.map((s) =>
        s.id === selectedId ? { ...s, x: s.x + dx, y: s.y + dy } : s
      );
      notifyShapesChange(updated);
      return updated;
    });
  }, [selectedId, notifyShapesChange]);

  // Update shape properties (for external use via ref)
  const updateShape = useCallback((id: string, updates: Partial<Shape>) => {
    setShapes((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      );
      notifyShapesChange(updated);
      return updated;
    });
  }, [notifyShapesChange]);

  // Update connector properties (for external use via ref)
  const updateConnector = useCallback((id: string, updates: Partial<Connector>) => {
    setConnectors((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      )
    );
  }, []);

  const updateConnectorRef = useRef(updateConnector);
  updateConnectorRef.current = updateConnector;

  // Align selected shapes
  const alignShapes = useCallback((type: AlignType) => {
    if (selectedIds.length < 2) return;

    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    if (selectedShapes.length < 2) return;

    // Calculate bounds
    const bounds = {
      left: Math.min(...selectedShapes.map(s => s.x)),
      right: Math.max(...selectedShapes.map(s => s.x + s.width)),
      top: Math.min(...selectedShapes.map(s => s.y)),
      bottom: Math.max(...selectedShapes.map(s => s.y + s.height)),
    };

    const updates: Record<string, Partial<Shape>> = {};

    selectedShapes.forEach(shape => {
      switch (type) {
        case 'left':
          updates[shape.id] = { x: bounds.left };
          break;
        case 'center':
          updates[shape.id] = { x: (bounds.left + bounds.right) / 2 - shape.width / 2 };
          break;
        case 'right':
          updates[shape.id] = { x: bounds.right - shape.width };
          break;
        case 'top':
          updates[shape.id] = { y: bounds.top };
          break;
        case 'middle':
          updates[shape.id] = { y: (bounds.top + bounds.bottom) / 2 - shape.height / 2 };
          break;
        case 'bottom':
          updates[shape.id] = { y: bounds.bottom - shape.height };
          break;
      }
    });

    setShapes(prev => {
      const updated = prev.map(s => updates[s.id] ? { ...s, ...updates[s.id] } : s);
      notifyShapesChange(updated);
      return updated;
    });
  }, [selectedIds, shapes, notifyShapesChange]);

  // Distribute selected shapes evenly
  const distributeShapes = useCallback((type: DistributeType) => {
    if (selectedIds.length < 3) return;

    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    if (selectedShapes.length < 3) return;

    const updates: Record<string, Partial<Shape>> = {};

    if (type === 'horizontal') {
      // Sort by x position
      const sorted = [...selectedShapes].sort((a, b) => a.x - b.x);
      const totalWidth = sorted.reduce((sum, s) => sum + s.width, 0);
      const left = sorted[0].x;
      const right = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width;
      const space = (right - left - totalWidth) / (sorted.length - 1);

      let currentX = left;
      sorted.forEach((shape, i) => {
        if (i > 0) {
          updates[shape.id] = { x: currentX };
        }
        currentX += shape.width + space;
      });
    } else {
      // Sort by y position
      const sorted = [...selectedShapes].sort((a, b) => a.y - b.y);
      const totalHeight = sorted.reduce((sum, s) => sum + s.height, 0);
      const top = sorted[0].y;
      const bottom = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
      const space = (bottom - top - totalHeight) / (sorted.length - 1);

      let currentY = top;
      sorted.forEach((shape, i) => {
        if (i > 0) {
          updates[shape.id] = { y: currentY };
        }
        currentY += shape.height + space;
      });
    }

    setShapes(prev => {
      const updated = prev.map(s => updates[s.id] ? { ...s, ...updates[s.id] } : s);
      notifyShapesChange(updated);
      return updated;
    });
  }, [selectedIds, shapes, notifyShapesChange]);

  // Group selected shapes
  const groupSelected = useCallback(() => {
    if (selectedIds.length < 2) return;

    const groupId = generateId();
    setShapes(prev => {
      const updated = prev.map(s =>
        selectedIds.includes(s.id) ? { ...s, groupId } : s
      );
      notifyShapesChange(updated);
      return updated;
    });
  }, [selectedIds, notifyShapesChange]);

  // Ungroup selected shapes
  const ungroupSelected = useCallback(() => {
    if (selectedIds.length === 0) return;

    // Find all group IDs from selected shapes
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    const groupIds = new Set(selectedShapes.map(s => s.groupId).filter(Boolean));

    if (groupIds.size === 0) return;

    setShapes(prev => {
      const updated = prev.map(s =>
        s.groupId && groupIds.has(s.groupId) ? { ...s, groupId: undefined } : s
      );
      notifyShapesChange(updated);
      return updated;
    });
  }, [selectedIds, shapes, notifyShapesChange]);

  // Export canvas to PNG
  const exportToPNG = useCallback((filename: string = 'canvas.png') => {
    const stage = stageRef.current;
    if (!stage) return;

    // Get bounding box of all shapes
    const layer = shapesLayerRef.current;
    if (!layer) return;

    // Calculate bounds of all shapes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    shapes.forEach((shape) => {
      if (shape.visible === false) return;
      minX = Math.min(minX, shape.x);
      minY = Math.min(minY, shape.y);
      maxX = Math.max(maxX, shape.x + shape.width);
      maxY = Math.max(maxY, shape.y + shape.height);
    });

    // Add padding
    const padding = 20;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    // Create a temporary stage for export
    const exportWidth = maxX - minX;
    const exportHeight = maxY - minY;

    if (exportWidth <= 0 || exportHeight <= 0) return;

    // Save current transform
    const currentScale = stage.scaleX();
    const currentPosition = stage.position();

    // Reset transform for export
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: -minX, y: -minY });

    // Hide non-content layers for export (keep only shapes + connectors)
    const staticLayer = staticLayerRef.current;
    const overlayLayer = overlayLayerRef.current;
    const selectionLayer = selectionLayerRef.current;
    const cursorLayer = cursorsLayerRef.current;
    const connectionPointsGroup = connectionPointsLayerRef.current;

    const staticVisible = staticLayer?.visible() ?? false;
    const overlayVisible = overlayLayer?.visible() ?? false;
    const selectionVisible = selectionLayer?.visible() ?? false;
    const cursorVisible = cursorLayer?.visible() ?? false;
    const connectionPointsVisible = connectionPointsGroup?.visible() ?? false;

    staticLayer?.visible(false);
    overlayLayer?.visible(false);
    selectionLayer?.visible(false);
    cursorLayer?.visible(false);
    connectionPointsGroup?.visible(false);

    // Redraw
    stage.batchDraw();

    let dataURL: string;
    try {
      // Export to data URL
      dataURL = stage.toDataURL({
        x: 0,
        y: 0,
        width: exportWidth,
        height: exportHeight,
        pixelRatio: 2,
      });
    } finally {
      // Restore layers visibility (always runs)
      staticLayer?.visible(staticVisible);
      overlayLayer?.visible(overlayVisible);
      selectionLayer?.visible(selectionVisible);
      cursorLayer?.visible(cursorVisible);
      connectionPointsGroup?.visible(connectionPointsVisible);

      // Restore transform
      stage.scale({ x: currentScale, y: currentScale });
      stage.position(currentPosition);
      stage.batchDraw();
    }

    // Download the image
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [shapes]);

  // Helper to escape XML special characters
  const escapeXml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Export canvas to SVG
  const exportToSVG = useCallback((filename: string = 'canvas.svg') => {
    // Calculate bounds of all shapes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    shapes.forEach((shape) => {
      if (shape.visible === false) return;
      minX = Math.min(minX, shape.x);
      minY = Math.min(minY, shape.y);
      maxX = Math.max(maxX, shape.x + shape.width);
      maxY = Math.max(maxY, shape.y + shape.height);
    });

    // Add padding
    const padding = 20;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const width = maxX - minX;
    const height = maxY - minY;

    if (width <= 0 || height <= 0) return;

    // Build SVG content
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    svgContent += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">\n`;

    // Render shapes to SVG
    shapes.forEach((shape) => {
      if (shape.visible === false) return;

      const opacity = shape.opacity ?? 1;
      const transform = shape.rotation ? ` transform="rotate(${shape.rotation} ${shape.x + shape.width / 2} ${shape.y + shape.height / 2})"` : '';

      switch (shape.type) {
        case 'rectangle':
          svgContent += `  <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" rx="${shape.cornerRadius ?? 0}" opacity="${opacity}"${transform} />\n`;
          break;
        case 'ellipse':
          svgContent += `  <ellipse cx="${shape.x + shape.width / 2}" cy="${shape.y + shape.height / 2}" rx="${shape.width / 2}" ry="${shape.height / 2}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
          break;
        case 'diamond':
          const cx = shape.x + shape.width / 2;
          const cy = shape.y + shape.height / 2;
          const points = `${cx},${shape.y} ${shape.x + shape.width},${cy} ${cx},${shape.y + shape.height} ${shape.x},${cy}`;
          svgContent += `  <polygon points="${points}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
          break;
        case 'text':
          const textContent = escapeXml(shape.text || 'Text');
          const fontSize = shape.fontSize || 16;
          const textColor = shape.textColor || shape.fill || '#000000';
          svgContent += `  <text x="${shape.x}" y="${shape.y + fontSize}" font-size="${fontSize}" font-family="${shape.fontFamily || 'Arial'}" fill="${textColor}" opacity="${opacity}"${transform}>${textContent}</text>\n`;
          break;
        case 'image':
          // Embed image as base64 data URL
          if (shape.src) {
            svgContent += `  <image x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" href="${shape.src}" preserveAspectRatio="${shape.preserveAspectRatio ? 'xMidYMid meet' : 'none'}" opacity="${opacity}"${transform} />\n`;
          }
          break;
        case 'stamp':
          // Render stamp as emoji text
          {
            const emoji = STAMP_EMOJIS[shape.stampType || 'thumbsUp'];
            const fontSize = Math.min(shape.width, shape.height) * 0.8;
            const centerX = shape.x + shape.width / 2;
            const centerY = shape.y + shape.height / 2;
            svgContent += `  <text x="${centerX}" y="${centerY}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central" opacity="${opacity}"${transform}>${emoji}</text>\n`;
          }
          break;
        case 'section':
          // Render section container with title
          {
            const sectionTitle = escapeXml(shape.sectionTitle || 'Section');
            svgContent += `  <g${transform}>\n`;
            svgContent += `    <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" rx="${shape.cornerRadius ?? 8}" opacity="${opacity}" />\n`;
            svgContent += `    <text x="${shape.x + 12}" y="${shape.y - 8}" font-size="14" font-family="Arial" font-weight="bold" fill="#6b7280">${sectionTitle}</text>\n`;
            svgContent += `  </g>\n`;
          }
          break;
        case 'table':
          // Render table as group of rects and texts
          {
            const tableData = shape.tableData;
            if (tableData) {
              svgContent += `  <g opacity="${opacity}"${transform}>\n`;
              let yOffset = 0;
              for (let row = 0; row < tableData.rows; row++) {
                let xOffset = 0;
                const rowHeight = tableData.rowHeights[row] || 40;
                for (let col = 0; col < tableData.cols; col++) {
                  const colWidth = tableData.colWidths[col] || 100;
                  const cell = tableData.cells[row]?.[col] || { text: '' };
                  const isHeader = row === 0 && tableData.headerRow;
                  const cellFill = cell.fill || (isHeader ? '#f3f4f6' : '#ffffff');
                  svgContent += `    <rect x="${shape.x + xOffset}" y="${shape.y + yOffset}" width="${colWidth}" height="${rowHeight}" fill="${cellFill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" />\n`;
                  if (cell.text) {
                    const textContent = escapeXml(cell.text);
                    const textX = shape.x + xOffset + 8;
                    const textY = shape.y + yOffset + rowHeight / 2 + 5;
                    svgContent += `    <text x="${textX}" y="${textY}" font-size="${shape.fontSize || 14}" font-family="${shape.fontFamily || 'Arial'}" fill="${cell.textColor || shape.textColor || '#1e1e1e'}">${textContent}</text>\n`;
                  }
                  xOffset += colWidth;
                }
                yOffset += rowHeight;
              }
              svgContent += `  </g>\n`;
            }
          }
          break;
        case 'mindmap':
          // Render mindmap as nodes and connections
          {
            const data = shape.mindmapData;
            if (data) {
              svgContent += `  <g opacity="${opacity}"${transform}>\n`;

              const nodeHeight = 32;
              const nodePadding = 12;
              const nodeRadius = 8;
              const levelColors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

              interface NodePos { node: typeof data.root; x: number; y: number; level: number; }
              const positions: NodePos[] = [];

              const calculatePositions = (
                node: typeof data.root, x: number, y: number, level: number
              ): { minY: number; maxY: number } => {
                const children = node.children || [];
                if (children.length === 0) {
                  positions.push({ node, x, y, level });
                  return { minY: y, maxY: y };
                }
                let currentY = y - ((children.length - 1) * (nodeHeight + data.nodeSpacing)) / 2;
                let minY = currentY, maxY = currentY;
                children.forEach((child: MindmapNode) => {
                  const result = calculatePositions(child, x + data.levelSpacing, currentY, level + 1);
                  minY = Math.min(minY, result.minY);
                  maxY = Math.max(maxY, result.maxY);
                  currentY += nodeHeight + data.nodeSpacing;
                });
                positions.push({ node, x, y: (minY + maxY) / 2, level });
                return { minY, maxY };
              };

              calculatePositions(data.root, shape.x + 20, shape.y + shape.height / 2, 0);

              // Draw connections
              positions.forEach((pos) => {
                (pos.node.children || []).forEach((child: MindmapNode) => {
                  const childPos = positions.find((p) => p.node.id === child.id);
                  if (childPos) {
                    const parentWidth = Math.max(60, pos.node.text.length * 8 + nodePadding * 2);
                    svgContent += `    <line x1="${pos.x + parentWidth}" y1="${pos.y + nodeHeight / 2}" x2="${childPos.x}" y2="${childPos.y + nodeHeight / 2}" stroke="#d1d5db" stroke-width="2" />\n`;
                  }
                });
              });

              // Draw nodes
              positions.forEach((pos) => {
                const nodeWidth = Math.max(60, pos.node.text.length * 8 + nodePadding * 2);
                const color = pos.node.color || levelColors[pos.level % levelColors.length];
                svgContent += `    <rect x="${pos.x}" y="${pos.y}" width="${nodeWidth}" height="${nodeHeight}" fill="${color}" rx="${nodeRadius}" />\n`;
                svgContent += `    <text x="${pos.x + nodeWidth / 2}" y="${pos.y + nodeHeight / 2 + 4}" font-size="13" font-family="Arial" fill="#ffffff" text-anchor="middle">${escapeXml(pos.node.text)}</text>\n`;
              });

              svgContent += `  </g>\n`;
            }
          }
          break;
        case 'embed':
          // Render embed/link preview card
          {
            const data = shape.embedData;
            const cornerRadius = shape.cornerRadius ?? 8;
            svgContent += `  <g opacity="${opacity}"${transform}>\n`;
            // Card background
            svgContent += `    <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.fill || '#ffffff'}" stroke="${shape.stroke || '#e5e7eb'}" stroke-width="${shape.strokeWidth || 1}" rx="${cornerRadius}" />\n`;
            if (data) {
              const contentX = shape.x + 12;
              // Site name
              if (data.siteName || data.url) {
                const hostname = data.siteName || (data.url ? new URL(data.url).hostname : 'example.com');
                svgContent += `    <text x="${contentX}" y="${shape.y + 20}" font-size="11" font-family="Arial" fill="#6b7280">${escapeXml(hostname)}</text>\n`;
              }
              // Title
              if (data.title) {
                svgContent += `    <text x="${contentX}" y="${shape.y + 40}" font-size="14" font-family="Arial" font-weight="bold" fill="#1f2937">${escapeXml(data.title)}</text>\n`;
              }
              // Description
              if (data.description) {
                svgContent += `    <text x="${contentX}" y="${shape.y + 60}" font-size="12" font-family="Arial" fill="#6b7280">${escapeXml(data.description.substring(0, 50))}...</text>\n`;
              }
              // URL
              if (data.url) {
                svgContent += `    <text x="${contentX}" y="${shape.y + shape.height - 12}" font-size="10" font-family="Arial" fill="#9ca3af">${escapeXml(data.url)}</text>\n`;
              }
            }
            svgContent += `  </g>\n`;
          }
          break;
        case 'triangle':
          {
            const pts = `${shape.x + shape.width / 2},${shape.y} ${shape.x + shape.width},${shape.y + shape.height} ${shape.x},${shape.y + shape.height}`;
            svgContent += `  <polygon points="${pts}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
          }
          break;
        case 'triangleDown':
          {
            const pts = `${shape.x},${shape.y} ${shape.x + shape.width},${shape.y} ${shape.x + shape.width / 2},${shape.y + shape.height}`;
            svgContent += `  <polygon points="${pts}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
          }
          break;
        case 'roundedRectangle':
          svgContent += `  <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" rx="${shape.cornerRadius ?? 12}" opacity="${opacity}"${transform} />\n`;
          break;
        case 'pentagon':
          {
            const cx = shape.x + shape.width / 2;
            const cy = shape.y + shape.height / 2;
            const r = Math.min(shape.width, shape.height) / 2;
            const pts: string[] = [];
            for (let i = 0; i < 5; i++) {
              const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
              pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
            }
            svgContent += `  <polygon points="${pts.join(' ')}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
          }
          break;
        case 'hexagon':
          {
            const cx = shape.x + shape.width / 2;
            const cy = shape.y + shape.height / 2;
            const r = Math.min(shape.width, shape.height) / 2;
            const pts: string[] = [];
            for (let i = 0; i < 6; i++) {
              const angle = (i * 2 * Math.PI / 6) - Math.PI / 2;
              pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
            }
            svgContent += `  <polygon points="${pts.join(' ')}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
          }
          break;
        case 'star':
          {
            const cx = shape.x + shape.width / 2;
            const cy = shape.y + shape.height / 2;
            const outerR = Math.min(shape.width, shape.height) / 2;
            const innerR = outerR * 0.4;
            const pts: string[] = [];
            for (let i = 0; i < 10; i++) {
              const angle = (i * Math.PI / 5) - Math.PI / 2;
              const r = i % 2 === 0 ? outerR : innerR;
              pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
            }
            svgContent += `  <polygon points="${pts.join(' ')}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
          }
          break;
        case 'cross':
          {
            const w = shape.width;
            const h = shape.height;
            const armWidth = Math.min(w, h) * 0.33;
            const hOffset = (w - armWidth) / 2;
            const vOffset = (h - armWidth) / 2;
            const pts = [
              `${shape.x + hOffset},${shape.y}`,
              `${shape.x + hOffset + armWidth},${shape.y}`,
              `${shape.x + hOffset + armWidth},${shape.y + vOffset}`,
              `${shape.x + w},${shape.y + vOffset}`,
              `${shape.x + w},${shape.y + vOffset + armWidth}`,
              `${shape.x + hOffset + armWidth},${shape.y + vOffset + armWidth}`,
              `${shape.x + hOffset + armWidth},${shape.y + h}`,
              `${shape.x + hOffset},${shape.y + h}`,
              `${shape.x + hOffset},${shape.y + vOffset + armWidth}`,
              `${shape.x},${shape.y + vOffset + armWidth}`,
              `${shape.x},${shape.y + vOffset}`,
              `${shape.x + hOffset},${shape.y + vOffset}`,
            ];
            svgContent += `  <polygon points="${pts.join(' ')}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
          }
          break;
        case 'parallelogram':
          {
            const w = shape.width;
            const h = shape.height;
            const skew = w * 0.2;
            const pts = `${shape.x + skew},${shape.y} ${shape.x + w},${shape.y} ${shape.x + w - skew},${shape.y + h} ${shape.x},${shape.y + h}`;
            svgContent += `  <polygon points="${pts}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
          }
          break;
        case 'database':
          {
            const w = shape.width;
            const h = shape.height;
            const ellipseHeight = h * 0.15;
            svgContent += `  <g${transform}>\n`;
            // Body
            svgContent += `    <rect x="${shape.x}" y="${shape.y + ellipseHeight / 2}" width="${w}" height="${h - ellipseHeight}" fill="${shape.fill}" />\n`;
            // Left/right lines
            svgContent += `    <line x1="${shape.x}" y1="${shape.y + ellipseHeight / 2}" x2="${shape.x}" y2="${shape.y + h - ellipseHeight / 2}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" />\n`;
            svgContent += `    <line x1="${shape.x + w}" y1="${shape.y + ellipseHeight / 2}" x2="${shape.x + w}" y2="${shape.y + h - ellipseHeight / 2}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" />\n`;
            // Bottom ellipse
            svgContent += `    <ellipse cx="${shape.x + w / 2}" cy="${shape.y + h - ellipseHeight / 2}" rx="${w / 2}" ry="${ellipseHeight / 2}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}" />\n`;
            // Top ellipse
            svgContent += `    <ellipse cx="${shape.x + w / 2}" cy="${shape.y + ellipseHeight / 2}" rx="${w / 2}" ry="${ellipseHeight / 2}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}" />\n`;
            svgContent += `  </g>\n`;
          }
          break;
        case 'document':
          {
            const w = shape.width;
            const h = shape.height;
            const waveHeight = h * 0.1;
            const d = `M ${shape.x},${shape.y} L ${shape.x + w},${shape.y} L ${shape.x + w},${shape.y + h - waveHeight} Q ${shape.x + w * 0.75},${shape.y + h - waveHeight * 2} ${shape.x + w / 2},${shape.y + h - waveHeight} Q ${shape.x + w * 0.25},${shape.y + h} ${shape.x},${shape.y + h - waveHeight} Z`;
            svgContent += `  <path d="${d}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
          }
          break;
        case 'leftRightArrow':
          {
            const w = shape.width;
            const h = shape.height;
            const ah = w * 0.2;
            const bh = h * 0.35;
            const bt = (h - bh) / 2;
            const pts = `${shape.x},${shape.y + h / 2} ${shape.x + ah},${shape.y} ${shape.x + ah},${shape.y + bt} ${shape.x + w - ah},${shape.y + bt} ${shape.x + w - ah},${shape.y} ${shape.x + w},${shape.y + h / 2} ${shape.x + w - ah},${shape.y + h} ${shape.x + w - ah},${shape.y + bt + bh} ${shape.x + ah},${shape.y + bt + bh} ${shape.x + ah},${shape.y + h}`;
            svgContent += `  <polygon points="${pts}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
          }
          break;
        case 'rightArrow':
          {
            const w = shape.width;
            const h = shape.height;
            const ah = w * 0.3;
            const bh = h * 0.4;
            const bt = (h - bh) / 2;
            const pts = `${shape.x},${shape.y + bt} ${shape.x + w - ah},${shape.y + bt} ${shape.x + w - ah},${shape.y} ${shape.x + w},${shape.y + h / 2} ${shape.x + w - ah},${shape.y + h} ${shape.x + w - ah},${shape.y + bt + bh} ${shape.x},${shape.y + bt + bh}`;
            svgContent += `  <polygon points="${pts}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
          }
          break;
        case 'chevron':
          {
            const w = shape.width;
            const h = shape.height;
            const notch = w * 0.2;
            const pts = `${shape.x},${shape.y} ${shape.x + w - notch},${shape.y} ${shape.x + w},${shape.y + h / 2} ${shape.x + w - notch},${shape.y + h} ${shape.x},${shape.y + h} ${shape.x + notch},${shape.y + h / 2}`;
            svgContent += `  <polygon points="${pts}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
          }
          break;
        case 'speechBubble':
        case 'folder':
        case 'comment':
        case 'callout':
        case 'pill':
        case 'dividedBox':
        case 'pentagonLabel':
        case 'trapezoid':
        case 'hexagonHorizontal':
        case 'dividedSquare':
        case 'circleCross':
        case 'circleX':
        case 'iconHeartbeat':
        case 'iconArchive':
        case 'iconKey':
        case 'iconChat':
        case 'iconCloud':
        case 'iconArchiveBox':
        case 'iconDatabase':
        case 'iconMonitor':
        case 'iconMail':
        case 'iconDocument':
        case 'iconCode':
        case 'iconLightning':
        case 'iconLocation':
        case 'iconPhone':
        case 'iconBox3d':
        case 'iconDollar':
        case 'iconShield':
        case 'iconSend':
        case 'iconServer':
        case 'iconCube3d':
        case 'iconGear':
        case 'iconGrid':
        case 'iconTerminal':
        case 'iconUser':
        case 'iconList':
        case 'iconGlobe':
          // Fallback SVG rendering for complex shapes - render as rounded rect
          svgContent += `  <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" rx="4" opacity="${opacity}"${transform} />\n`;
          break;
      }

      // Add text overlay for non-text shapes
      if (shape.type !== 'text' && shape.text) {
        const textY = shape.y + shape.height / 2;
        const textX = shape.x + shape.width / 2;
        const escapedText = escapeXml(shape.text);
        svgContent += `  <text x="${textX}" y="${textY}" font-size="${shape.fontSize || 14}" font-family="${shape.fontFamily || 'Arial'}" fill="${shape.textColor || '#ffffff'}" text-anchor="middle" dominant-baseline="middle" opacity="${opacity}">${escapedText}</text>\n`;
      }
    });

    // Render connectors to SVG
    connectors.forEach((connector) => {
      const fromShape = shapes.find(s => s.id === connector.fromShapeId);
      const toShape = shapes.find(s => s.id === connector.toShapeId);
      if (!fromShape || !toShape) return;

      const fromX = fromShape.x + fromShape.width / 2;
      const fromY = fromShape.y + fromShape.height / 2;
      const toX = toShape.x + toShape.width / 2;
      const toY = toShape.y + toShape.height / 2;

      let strokeDash = '';
      if (connector.lineStyle === 'dashed') strokeDash = ' stroke-dasharray="8,4"';
      if (connector.lineStyle === 'dotted') strokeDash = ' stroke-dasharray="2,2"';

      svgContent += `  <line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}" stroke="${connector.stroke}" stroke-width="${connector.strokeWidth}"${strokeDash} />\n`;

      // Add arrow if enabled
      if (connector.arrow || connector.arrowEnd === 'arrow' || connector.arrowEnd === 'triangle') {
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const arrowSize = 10;
        const arrowPoints = [
          toX, toY,
          toX - arrowSize * Math.cos(angle - Math.PI / 6), toY - arrowSize * Math.sin(angle - Math.PI / 6),
          toX - arrowSize * Math.cos(angle + Math.PI / 6), toY - arrowSize * Math.sin(angle + Math.PI / 6),
        ];
        svgContent += `  <polygon points="${arrowPoints.join(',')}" fill="${connector.stroke}" />\n`;
      }
    });

    svgContent += `</svg>`;

    // Download the SVG
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [shapes, connectors]);

  // Set zoom level
  const setZoom = useCallback((newScale: number) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Clamp scale between 0.1 and 5
    const clampedScale = Math.min(Math.max(newScale, 0.1), 5);

    // Zoom to center of stage
    const stageWidth = stage.width();
    const stageHeight = stage.height();
    const centerX = stageWidth / 2;
    const centerY = stageHeight / 2;

    const oldScale = stage.scaleX();
    const mousePointTo = {
      x: (centerX - stage.x()) / oldScale,
      y: (centerY - stage.y()) / oldScale,
    };

    const newPos = {
      x: centerX - mousePointTo.x * clampedScale,
      y: centerY - mousePointTo.y * clampedScale,
    };

    stage.scale({ x: clampedScale, y: clampedScale });
    stage.position(newPos);
    stage.batchDraw();
    setScale(clampedScale);
    onViewportChange?.({
      scale: clampedScale,
      position: newPos,
    });
  }, [setScale, onViewportChange]);

  // Zoom to fit all shapes
  const zoomToFit = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || shapes.length === 0) return;

    // Calculate bounds of all shapes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    shapes.forEach((shape) => {
      if (shape.visible === false) return;
      minX = Math.min(minX, shape.x);
      minY = Math.min(minY, shape.y);
      maxX = Math.max(maxX, shape.x + shape.width);
      maxY = Math.max(maxY, shape.y + shape.height);
    });

    if (minX === Infinity) return;

    // Add padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const stageWidth = stage.width();
    const stageHeight = stage.height();

    // Calculate scale to fit
    const scaleX = stageWidth / contentWidth;
    const scaleY = stageHeight / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 2); // Max scale 2x

    // Calculate position to center
    const newPos = {
      x: (stageWidth - contentWidth * newScale) / 2 - minX * newScale,
      y: (stageHeight - contentHeight * newScale) / 2 - minY * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
    stage.batchDraw();
    setScale(newScale);
    onViewportChange?.({
      scale: newScale,
      position: newPos,
    });
  }, [shapes, setScale, onViewportChange]);

  // Zoom to 100%
  const zoomTo100 = useCallback(() => {
    setZoom(1);
  }, [setZoom]);

  // Set viewport position (for minimap navigation)
  const setViewportPosition = useCallback((newPos: { x: number; y: number }) => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.position(newPos);
    stage.batchDraw();
    onViewportChange?.({
      scale: stage.scaleX(),
      position: newPos,
    });
  }, [onViewportChange]);

  // Expose imperative methods via ref
  useImperativeHandle(ref, () => ({
    updateShape,
    getShapes: () => shapes,
    setShapes: (newShapes: Shape[]) => {
      setShapes(newShapes);
      notifyShapesChange(newShapes);
    },
    getSelectedId: () => selectedId,
    getViewport: () => ({
      scale: stageRef.current?.scaleX() || 1,
      position: stageRef.current?.position() || { x: 0, y: 0 },
    }),
    deleteSelected,
    duplicateSelected,
    copySelected,
    getConnectors: () => connectors,
    updateConnector,
    alignShapes,
    distributeShapes,
    groupSelected,
    ungroupSelected,
    exportToPNG,
    exportToSVG,
    setZoom,
    zoomToFit,
    zoomTo100,
    setViewportPosition,
    getCanvasSize: () => canvasSize,
    setConnectors: (newConnectors: Connector[]) => {
      setConnectors(newConnectors);
    },
    loadFromJSON: (data: { shapes: Shape[]; connectors: Connector[] }) => {
      setShapes(data.shapes || []);
      setConnectors(data.connectors || []);
      notifyShapesChange(data.shapes || []);
    },
    saveToJSON: exportToJson,
    loadFromJSONFile: importFromJson,
    undo,
    redo,
    canUndo,
    canRedo,
  }), [updateShape, shapes, selectedId, deleteSelected, duplicateSelected, copySelected, connectors, updateConnector, notifyShapesChange, alignShapes, distributeShapes, groupSelected, ungroupSelected, exportToPNG, exportToSVG, setZoom, zoomToFit, zoomTo100, setViewportPosition, canvasSize, exportToJson, importFromJson, undo, redo, canUndo, canRedo]);

  // Handle escape key
  const handleEscape = useCallback(() => {
    // Cancel active connector drag if in progress
    if (isDraggingConnectorRef.current) {
      isDraggingConnectorRef.current = false;
      connectorDragModeRef.current = null;
      connectorDragFromRef.current = null;
      connectorDragFromPointRef.current = null;
      connectorDragEndRef.current = null;
      connectorDragSnapTargetRef.current = null;
      connectorReconnectIdRef.current = null;
      connectorReconnectEndRef.current = null;

      const preview = connectorPreviewArrowRef.current;
      if (preview) {
        preview.visible(false);
        preview.getLayer()?.batchDraw();
      }
      const indicator = connectorSnapIndicatorRef.current;
      if (indicator) {
        indicator.visible(false);
        indicator.getLayer()?.batchDraw();
      }
      return;
    }

    setSelectedId(null);
    resetTool();
  }, [resetTool]);

  // Use keyboard hook for shortcuts
  useKeyboard({
    selectedId,
    isPanning,
    setIsPanning,
    onEscape: handleEscape,
    onDelete: deleteSelected,
    onUndo: undo,
    onRedo: redo,
    onCopy: copySelected,
    onPaste: pasteShape,
    onDuplicate: duplicateSelected,
    onMove: moveSelected,
    onSave: exportToJson,
    onLoad: importFromJson,
    onGroup: groupSelected,
    onUngroup: ungroupSelected,
    onAddImage: openImageDialog,
    onStampSelect: handleStampShortcut,
  });

  // Handle container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCanvasSize({ width, height });
        }
      }
    });

    resizeObserver.observe(container);

    // Initial size
    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setCanvasSize({ width: rect.width, height: rect.height });
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Update stage size when canvas size changes
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.width(canvasSize.width);
    stage.height(canvasSize.height);
    updateViewport();
  }, [canvasSize, updateViewport]);

  // Initialize canvas
  useEffect(() => {
    if (!containerRef.current) return;

    const stage = new Konva.Stage({
      container: containerRef.current,
      width: canvasSize.width,
      height: canvasSize.height,
    });
    stageRef.current = stage;

    // === Consolidated Layers (Phase G: 9→5) ===

    // Layer 1: Static layer (background + grid, non-interactive)
    const staticLayer = new Konva.Layer({ listening: false });
    stage.add(staticLayer);
    staticLayerRef.current = staticLayer;
    const bgGroup = new Konva.Group();
    const gridGroup = new Konva.Group();
    staticLayer.add(bgGroup);
    staticLayer.add(gridGroup);
    bgLayerRef.current = bgGroup;
    gridLayerRef.current = gridGroup;

    // Layer 2: Content layer (connectors + shapes + connection points, interactive)
    const contentLayer = new Konva.Layer();
    stage.add(contentLayer);
    contentLayerRef.current = contentLayer;
    const connectorsGroup = new Konva.Group();
    const shapesGroup = new Konva.Group();
    const connectionPointsGroup = new Konva.Group();
    contentLayer.add(connectorsGroup);
    contentLayer.add(shapesGroup);
    contentLayer.add(connectionPointsGroup);
    connectorsLayerRef.current = connectorsGroup;
    shapesLayerRef.current = shapesGroup;
    connectionPointsLayerRef.current = connectionPointsGroup;

    // Layer 3: Selection layer (transformer + marquee, interactive)
    const selectionLayer = new Konva.Layer();
    stage.add(selectionLayer);
    selectionLayerRef.current = selectionLayer;

    // Layer 4: Overlay layer (guides + freedraw preview, non-interactive)
    const overlayLayer = new Konva.Layer({ listening: false });
    stage.add(overlayLayer);
    overlayLayerRef.current = overlayLayer;
    const guidesGroup = new Konva.Group();
    const drawingGroup = new Konva.Group();
    overlayLayer.add(guidesGroup);
    overlayLayer.add(drawingGroup);
    guidesLayerRef.current = guidesGroup;
    drawingLayerRef.current = drawingGroup;

    // Connector drag preview elements (on overlay layer so they don't block events)
    const previewArrow = new Konva.Arrow({
      points: [0, 0, 0, 0],
      stroke: '#3b82f6',
      strokeWidth: 2,
      dash: [6, 4],
      opacity: 0.7,
      pointerLength: 10,
      pointerWidth: 8,
      visible: false,
      listening: false,
    });
    overlayLayer.add(previewArrow);
    connectorPreviewArrowRef.current = previewArrow;

    const snapIndicator = new Konva.Circle({
      x: 0,
      y: 0,
      radius: 12,
      stroke: '#3b82f6',
      strokeWidth: 2,
      fill: 'rgba(59, 130, 246, 0.15)',
      visible: false,
      listening: false,
    });
    overlayLayer.add(snapIndicator);
    connectorSnapIndicatorRef.current = snapIndicator;

    // Layer 5: Cursor layer (remote collaboration cursors, non-interactive)
    const cursorsLayer = new Konva.Layer({ listening: false });
    stage.add(cursorsLayer);
    cursorsLayerRef.current = cursorsLayer;

    // Transformer for resize handles
    const transformer = new Konva.Transformer({
      rotateEnabled: true,
      borderStroke: '#3b82f6',
      borderStrokeWidth: 1,
      anchorStroke: '#3b82f6',
      anchorFill: '#ffffff',
      anchorSize: 8,
      anchorCornerRadius: 2,
      padding: 2,
    });
    selectionLayer.add(transformer);
    transformerRef.current = transformer;

    // Handle transform end - supports multiple selected nodes
    transformer.on('transformend', () => {
      const nodes = transformer.nodes();
      if (nodes.length === 0) return;

      // Collect updates for all transformed nodes
      const nodeUpdates = new Map<string, { x: number; y: number; width: number; height: number; rotation: number }>();

      nodes.forEach((node) => {
        const id = node.id();
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Reset scale on node (Konva accumulates scale)
        node.scaleX(1);
        node.scaleY(1);

        nodeUpdates.set(id, {
          x: node.x(),
          y: node.y(),
          width: Math.max(20, (node.width?.() || 100) * scaleX),
          height: Math.max(20, (node.height?.() || 60) * scaleY),
          rotation: node.rotation(),
        });
      });

      setShapes((prev) => {
        const updated = prev.map((s) => {
          const update = nodeUpdates.get(s.id);
          if (update) {
            return {
              ...s,
              x: update.x,
              y: update.y,
              width: update.width,
              height: update.height,
              rotation: update.rotation,
            };
          }
          return s;
        });
        notifyShapesChange(updated);
        return updated;
      });
    });

    // Zoom with mouse wheel
    stage.on('wheel', (e) => {
      e.evt.preventDefault();

      const scaleBy = 1.1;
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();

      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

      const clampedScale = Math.max(0.1, Math.min(5, newScale));

      stage.scale({ x: clampedScale, y: clampedScale });

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };

      stage.position(newPos);
      stage.batchDraw();
      setScale(clampedScale);

      // Update infinite grid and background
      updateViewport();
    });

    if (onReady) {
      onReady(stage);
    }

    // Initial viewport render
    updateViewport();

    setCanvasVersion((v) => v + 1);

    return () => {
      // Remove all event listeners from stage
      stage.off();

      // Destroy transformer first (before layer cleanup)
      if (transformerRef.current) {
        transformerRef.current.destroy();
        transformerRef.current = null;
      }

      // Destroy all children in consolidated layers to prevent memory leaks
      if (marqueeRectRef.current) {
        marqueeRectRef.current.destroy();
        marqueeRectRef.current = null;
      }
      if (gridShapeRef.current) {
        gridShapeRef.current.destroy();
        gridShapeRef.current = null;
      }
      if (currentDrawingLineRef.current) {
        currentDrawingLineRef.current.destroy();
        currentDrawingLineRef.current = null;
      }

      // Null out group refs (groups are destroyed with their parent layers)
      shapesLayerRef.current = null;
      connectorsLayerRef.current = null;
      connectionPointsLayerRef.current = null;
      connectorPreviewArrowRef.current = null;
      connectorSnapIndicatorRef.current = null;
      bgLayerRef.current = null;
      gridLayerRef.current = null;
      guidesLayerRef.current = null;
      drawingLayerRef.current = null;

      // Destroy the 5 consolidated layers (destroy removes from parent + children)
      staticLayerRef.current?.destroy();
      staticLayerRef.current = null;
      contentLayerRef.current?.destroy();
      contentLayerRef.current = null;
      selectionLayerRef.current?.destroy();
      selectionLayerRef.current = null;
      overlayLayerRef.current?.destroy();
      overlayLayerRef.current = null;
      cursorsLayerRef.current?.destroy();
      cursorsLayerRef.current = null;

      // Finally destroy the stage
      stage.destroy();
      stageRef.current = null;
    };
  }, [backgroundColor, showGrid, gridSize, onReady]);

  // Re-render shapes when they change or canvas is re-initialized
  useEffect(() => {
    renderShapes();
  }, [renderShapes, canvasVersion]);

  // Render connection points when hovering in connector mode
  useEffect(() => {
    const group = connectionPointsLayerRef.current;
    if (!group) return;

    group.destroyChildren();

    // Only show connection points in connector/select mode when hovering
    if ((tool !== 'connector' && tool !== 'select') || !hoveredShapeId) {
      group.getLayer()?.batchDraw();
      return;
    }

    const shape = shapes.find((s) => s.id === hoveredShapeId);
    if (!shape) {
      group.getLayer()?.batchDraw();
      return;
    }

    // Get connection points for the hovered shape
    const points = getConnectionPoints(shape);
    // Select mode: smaller/subtler; Connector mode: full size
    const pointSize = tool === 'select' ? 6 : 8;
    const pointOpacity = tool === 'select' ? 0.7 : 1.0;

    // Draw connection point circles
    Object.entries(points).forEach(([position, point]) => {
      const circle = new Konva.Circle({
        x: point.x,
        y: point.y,
        radius: pointSize,
        fill: '#ffffff',
        stroke: '#3b82f6',
        strokeWidth: 2,
        shadowColor: '#000000',
        shadowBlur: 4,
        shadowOpacity: 0.2,
        opacity: pointOpacity,
      });

      // Add hover effect
      circle.on('mouseenter', () => {
        circle.fill('#3b82f6');
        circle.stroke('#1d4ed8');
        group.getLayer()?.batchDraw();
      });

      circle.on('mouseleave', () => {
        circle.fill('#ffffff');
        circle.stroke('#3b82f6');
        group.getLayer()?.batchDraw();
      });

      // Handle mousedown on connection point to start connector drag from specific point
      circle.on('mousedown touchstart', (e) => {
        e.cancelBubble = true;

        // In select mode, stop any in-progress shape drag to prevent conflicts
        if (tool === 'select') {
          const hoveredGroup = shapesLayerRef.current?.findOne(`#${shape.id}`);
          if (hoveredGroup) (hoveredGroup as Konva.Group).stopDrag();
        }

        isDraggingConnectorRef.current = true;
        connectorDragModeRef.current = 'create';
        connectorDragFromRef.current = shape.id;
        connectorDragFromPointRef.current = { x: point.x, y: point.y };
        connectorDragEndRef.current = { x: point.x, y: point.y };
        connectorDragSnapTargetRef.current = null;

        // Show preview arrow starting from this connection point
        const preview = connectorPreviewArrowRef.current;
        if (preview) {
          preview.points([point.x, point.y, point.x, point.y]);
          preview.visible(true);
          preview.getLayer()?.batchDraw();
        }

        const stage = stageRef.current;
        if (stage) {
          stage.container().style.cursor = 'crosshair';
        }
      });

      group.add(circle);
    });

    group.getLayer()?.batchDraw();
  }, [tool, hoveredShapeId, shapes, getConnectionPoints]);

  // Clear hovered shape and cancel any active connector drag when tool changes
  useEffect(() => {
    if (tool !== 'connector' && tool !== 'select') {
      setHoveredShapeId(null);

      // Cancel any active connector drag
      if (isDraggingConnectorRef.current) {
        isDraggingConnectorRef.current = false;
        connectorDragModeRef.current = null;
        connectorDragFromRef.current = null;
        connectorDragFromPointRef.current = null;
        connectorDragEndRef.current = null;
        connectorDragSnapTargetRef.current = null;
        connectorReconnectIdRef.current = null;
        connectorReconnectEndRef.current = null;

        const preview = connectorPreviewArrowRef.current;
        if (preview) {
          preview.visible(false);
          preview.getLayer()?.batchDraw();
        }
        const indicator = connectorSnapIndicatorRef.current;
        if (indicator) {
          indicator.visible(false);
          indicator.getLayer()?.batchDraw();
        }
      }
    }
  }, [tool]);

  // Notify parent of selection changes
  useEffect(() => {
    if (!onSelectionChange) return;

    if (!selectedId) {
      onSelectionChange(null);
      return;
    }

    const shape = shapes.find((s) => s.id === selectedId);
    if (shape) {
      onSelectionChange({
        id: shape.id,
        type: shape.type,
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        rotation: shape.rotation || 0,
        fill: shape.fill,
        stroke: shape.stroke,
        strokeWidth: shape.strokeWidth,
        cornerRadius: shape.cornerRadius ?? 0,
        // Text properties
        text: shape.text,
        fontSize: shape.fontSize,
        textColor: shape.textColor,
        textAlign: shape.textAlign,
      });
    }
  }, [selectedId, shapes, onSelectionChange]);

  // Re-render connectors when they change or canvas is re-initialized
  useEffect(() => {
    renderConnectors();
  }, [renderConnectors, canvasVersion]);

  // Save to history when shapes or connectors change
  useEffect(() => {
    saveHistory(shapes, connectors);
  }, [shapes, connectors, saveHistory]);

  // Update click handler when tool changes
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Skip click handler for drawing tools (they use mousedown/mousemove/mouseup)
    const isDrawingTool = tool === 'pen' || tool === 'marker' || tool === 'highlighter' || tool === 'eraser';

    stage.off('click tap');
    stage.on('click tap', (e) => {
      // Close table context menu on any canvas click
      setTableContextMenu(null);

      if (isPanning) return;
      if (isDrawingTool) return; // Drawing tools handle their own events
      // Ignore clicks that are the tail end of a connector drag
      if (isDraggingConnectorRef.current) return;

      const staticLayer = staticLayerRef.current;

      // Click on stage background or static layer (bg + grid)
      if (e.target === stage || e.target.getLayer() === staticLayer) {
        if (tool === 'connector') {
          // No-op: connector creation now uses drag, not click
        } else if (tool !== 'select') {
          const pos = stage.getPointerPosition();
          if (pos) {
            const transform = stage.getAbsoluteTransform().copy().invert();
            const adjustedPos = transform.point(pos);
            addShape(tool as ShapeType, adjustedPos.x, adjustedPos.y);
          }
        } else {
          clearSelection();
        }
      }
    });
  }, [tool, addShape, isPanning, clearSelection]);

  // Free connector: start drag from empty canvas
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (tool !== 'connector') return;

    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (isPanning) return;
      // Only trigger on empty canvas (stage itself or static layer)
      const staticLayer = staticLayerRef.current;
      if (e.target !== stage && e.target.getLayer() !== staticLayer) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;
      const transform = stage.getAbsoluteTransform().copy().invert();
      const canvasPos = transform.point(pos);

      isDraggingConnectorRef.current = true;
      connectorDragModeRef.current = 'create';
      connectorDragFromRef.current = null; // No shape — free-floating start
      connectorDragFromPointRef.current = canvasPos;
      connectorDragEndRef.current = canvasPos;
      connectorDragSnapTargetRef.current = null;

      const preview = connectorPreviewArrowRef.current;
      if (preview) {
        preview.points([canvasPos.x, canvasPos.y, canvasPos.x, canvasPos.y]);
        preview.visible(true);
        preview.getLayer()?.batchDraw();
      }
      stage.container().style.cursor = 'crosshair';
    };

    stage.on('mousedown touchstart', handleStageMouseDown);
    return () => {
      stage.off('mousedown touchstart', handleStageMouseDown);
    };
  }, [tool, isPanning]);

  // Connector drag: mousemove + mouseup on stage (core drag-to-connect logic)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (tool !== 'connector' && tool !== 'select') return;

    const SNAP_DISTANCE = 30;

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!isDraggingConnectorRef.current) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;
      const transform = stage.getAbsoluteTransform().copy().invert();
      const canvasPos = transform.point(pos);

      connectorDragEndRef.current = canvasPos;

      // Find closest snap target
      let bestDist = SNAP_DISTANCE;
      let snapTarget: string | null = null;
      let snapPoint: { x: number; y: number } | null = null;

      for (const s of shapesRef.current) {
        if (s.id === connectorDragFromRef.current) continue;
        if (s.visible === false) continue;

        const center = {
          x: s.x + s.width / 2,
          y: s.y + s.height / 2,
        };
        const connectionPoints = {
          top: { x: center.x, y: s.y },
          right: { x: s.x + s.width, y: center.y },
          bottom: { x: center.x, y: s.y + s.height },
          left: { x: s.x, y: center.y },
        };

        for (const cp of Object.values(connectionPoints)) {
          const dist = Math.sqrt(
            (canvasPos.x - cp.x) ** 2 + (canvasPos.y - cp.y) ** 2
          );
          if (dist < bestDist) {
            bestDist = dist;
            snapTarget = s.id;
            snapPoint = cp;
          }
        }
      }

      connectorDragSnapTargetRef.current = snapTarget;

      // Update preview arrow
      const preview = connectorPreviewArrowRef.current;
      const fromPt = connectorDragFromPointRef.current;
      if (preview && fromPt) {
        const endPt = snapPoint || canvasPos;
        preview.points([fromPt.x, fromPt.y, endPt.x, endPt.y]);

        // Reflect connector variant in preview
        const variant = connectorVariantRef.current;
        if (variant === 'line') {
          preview.pointerLength(0);
          preview.pointerWidth(0);
          preview.pointerAtBeginning(false);
        } else if (variant === 'bidirectional') {
          preview.pointerLength(10);
          preview.pointerWidth(8);
          preview.pointerAtBeginning(true);
        } else {
          preview.pointerLength(10);
          preview.pointerWidth(8);
          preview.pointerAtBeginning(false);
        }

        preview.getLayer()?.batchDraw();
      }

      // Update snap indicator
      const indicator = connectorSnapIndicatorRef.current;
      if (indicator) {
        if (snapPoint) {
          indicator.x(snapPoint.x);
          indicator.y(snapPoint.y);
          indicator.visible(true);
        } else {
          indicator.visible(false);
        }
        indicator.getLayer()?.batchDraw();
      }
    };

    const handleMouseUp = () => {
      if (!isDraggingConnectorRef.current) return;

      const mode = connectorDragModeRef.current;
      const fromId = connectorDragFromRef.current;
      const toId = connectorDragSnapTargetRef.current;

      if (mode === 'create') {
        const dragEnd = connectorDragEndRef.current;
        if (fromId && toId && fromId !== toId) {
          // Shape-to-shape
          addConnectorRef.current(fromId, toId);
        } else if (fromId && !toId && dragEnd) {
          // Shape-to-free (end on empty canvas)
          addConnectorRef.current(fromId, null, undefined, dragEnd);
        } else if (!fromId && toId) {
          // Free-to-shape (started from empty canvas, ended on shape)
          const fromPt = connectorDragFromPointRef.current;
          if (fromPt) addConnectorRef.current(null, toId, fromPt, undefined);
        } else if (!fromId && !toId && dragEnd) {
          // Free-to-free (both on empty canvas)
          const fromPt = connectorDragFromPointRef.current;
          if (fromPt) addConnectorRef.current(null, null, fromPt, dragEnd);
        }
      } else if (mode === 'reconnect') {
        const reconnectId = connectorReconnectIdRef.current;
        const reconnectEnd = connectorReconnectEndRef.current;
        const dragEnd = connectorDragEndRef.current;
        if (reconnectId && reconnectEnd) {
          if (toId) {
            // Reconnect to a shape
            if (reconnectEnd === 'from') {
              updateConnectorRef.current(reconnectId, { fromShapeId: toId, fromPos: undefined, fromPoint: undefined });
            } else {
              updateConnectorRef.current(reconnectId, { toShapeId: toId, toPos: undefined, toPoint: undefined });
            }
          } else if (dragEnd) {
            // Reconnect to free position (empty canvas)
            if (reconnectEnd === 'from') {
              updateConnectorRef.current(reconnectId, { fromShapeId: undefined, fromPos: dragEnd, fromPoint: undefined });
            } else {
              updateConnectorRef.current(reconnectId, { toShapeId: undefined, toPos: dragEnd, toPoint: undefined });
            }
          }
        }
      }

      // Reset drag state
      isDraggingConnectorRef.current = false;
      connectorDragModeRef.current = null;
      connectorDragFromRef.current = null;
      connectorDragFromPointRef.current = null;
      connectorDragEndRef.current = null;
      connectorDragSnapTargetRef.current = null;
      connectorReconnectIdRef.current = null;
      connectorReconnectEndRef.current = null;

      // Hide preview elements
      const preview = connectorPreviewArrowRef.current;
      if (preview) {
        preview.visible(false);
        preview.getLayer()?.batchDraw();
      }
      const indicator = connectorSnapIndicatorRef.current;
      if (indicator) {
        indicator.visible(false);
        indicator.getLayer()?.batchDraw();
      }

      // Reset cursor based on current tool
      stage.container().style.cursor = tool === 'connector' ? 'crosshair' : 'default';
    };

    stage.on('mousemove touchmove', handleMouseMove);
    stage.on('mouseup touchend', handleMouseUp);

    return () => {
      stage.off('mousemove touchmove', handleMouseMove);
      stage.off('mouseup touchend', handleMouseUp);

      // Clean up drag state when effect re-runs (e.g. tool change)
      if (isDraggingConnectorRef.current) {
        isDraggingConnectorRef.current = false;
        connectorDragModeRef.current = null;
        connectorDragFromRef.current = null;
        connectorDragFromPointRef.current = null;
        connectorDragEndRef.current = null;
        connectorDragSnapTargetRef.current = null;
        connectorReconnectIdRef.current = null;
        connectorReconnectEndRef.current = null;
      }
      const preview = connectorPreviewArrowRef.current;
      if (preview) {
        preview.visible(false);
        preview.getLayer()?.batchDraw();
      }
      const indicator = connectorSnapIndicatorRef.current;
      if (indicator) {
        indicator.visible(false);
        indicator.getLayer()?.batchDraw();
      }
    };
  }, [tool]);

  // Pan with space + drag (infinite canvas)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    if (isPanning) {
      stage.draggable(true);
      stage.container().style.cursor = 'grab';
    } else {
      stage.draggable(false);
      // Set appropriate cursor based on tool
      const isDrawingTool = tool === 'pen' || tool === 'marker' || tool === 'highlighter';
      const isEraser = tool === 'eraser';
      if (tool === 'select') {
        stage.container().style.cursor = 'default';
      } else if (isDrawingTool) {
        stage.container().style.cursor = 'crosshair';
      } else if (isEraser) {
        stage.container().style.cursor = 'not-allowed';
      } else {
        stage.container().style.cursor = 'crosshair';
      }
    }

    const handleDragStart = () => {
      if (isPanning) {
        stage.container().style.cursor = 'grabbing';
      }
    };

    const handleDragMove = () => {
      if (isPanning) {
        updateViewport();
        if (selectionType === 'connector') {
          setViewportTick((v) => v + 1);
        }
      }
    };

    const handleDragEnd = () => {
      if (isPanning) {
        stage.container().style.cursor = 'grab';
        updateViewport();
      }
    };

    stage.on('dragstart', handleDragStart);
    stage.on('dragmove', handleDragMove);
    stage.on('dragend', handleDragEnd);

    return () => {
      stage.off('dragstart', handleDragStart);
      stage.off('dragmove', handleDragMove);
      stage.off('dragend', handleDragEnd);
    };
  }, [isPanning, tool, updateViewport, selectionType]);

  // Cancel connecting - use store action directly
  const cancelConnecting = useToolStore((s) => s.cancelConnecting);

  // Freedraw handlers
  useEffect(() => {
    const stage = stageRef.current;
    const drawingLayer = drawingLayerRef.current;
    if (!stage || !drawingLayer) return;

    // Only handle drawing tools
    const isDrawingTool = tool === 'pen' || tool === 'marker' || tool === 'highlighter';
    const isEraserTool = tool === 'eraser';

    if (!isDrawingTool && !isEraserTool) return;

    const getDrawingProps = () => {
      if (tool === 'pen') return defaultFreeDrawProps.pen;
      if (tool === 'marker') return defaultFreeDrawProps.marker;
      if (tool === 'highlighter') return defaultFreeDrawProps.highlighter;
      return defaultFreeDrawProps.pen;
    };

    const handleDrawStart = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      // Don't draw when panning
      if (isPanning) return;

      // Don't start on shapes
      const target = e.target;
      if (target !== stage && target.getLayer() !== staticLayerRef.current) {
        // Check if eraser is clicking on a freedraw shape
        if (isEraserTool) {
          const clickedShape = shapes.find(s => {
            const node = shapesLayerRef.current?.findOne(`#${s.id}`);
            if (!node) return false;
            // Check if target is inside this node's group
            let parent: Konva.Node | null = target;
            while (parent) {
              if (parent === node) return true;
              parent = parent.getParent();
            }
            return false;
          });
          if (clickedShape && clickedShape.type === 'freedraw') {
            // Delete the freedraw shape
            setShapes(prev => {
              const updated = prev.filter(s => s.id !== clickedShape.id);
              notifyShapesChange(updated);
              return updated;
            });
          }
        }
        return;
      }

      if (isEraserTool) return; // Eraser only works on existing shapes

      setIsDrawing(true);

      const pos = stage.getPointerPosition();
      if (!pos) return;

      // Convert to canvas coordinates
      const transform = stage.getAbsoluteTransform().copy().invert();
      const canvasPos = transform.point(pos);

      // Start new drawing
      currentDrawingRef.current = [{ x: canvasPos.x, y: canvasPos.y }];

      // Create visual line
      const props = getDrawingProps();
      const line = new Konva.Line({
        points: [canvasPos.x, canvasPos.y],
        stroke: currentStrokeColor,
        strokeWidth: props.strokeWidth,
        opacity: props.opacity,
        lineCap: props.lineCap,
        lineJoin: 'round',
        tension: 0.5,
      });

      currentDrawingLineRef.current = line;
      drawingLayer.add(line);
      drawingLayer.getLayer()?.batchDraw();
    };

    const handleDrawMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!isDrawing || !currentDrawingLineRef.current) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      // Convert to canvas coordinates
      const transform = stage.getAbsoluteTransform().copy().invert();
      const canvasPos = transform.point(pos);

      // Add point
      currentDrawingRef.current.push({ x: canvasPos.x, y: canvasPos.y });

      // Update visual line
      const flatPoints: number[] = [];
      currentDrawingRef.current.forEach(p => {
        flatPoints.push(p.x, p.y);
      });
      currentDrawingLineRef.current.points(flatPoints);
      drawingLayer.getLayer()?.batchDraw();
    };

    const handleDrawEnd = () => {
      if (!isDrawing || currentDrawingRef.current.length < 2) {
        // Clear incomplete drawing
        if (currentDrawingLineRef.current) {
          currentDrawingLineRef.current.destroy();
          currentDrawingLineRef.current = null;
        }
        currentDrawingRef.current = [];
        setIsDrawing(false);
        return;
      }

      // Simplify points if there are too many (performance optimization)
      let finalPoints = currentDrawingRef.current;
      if (finalPoints.length > 100) {
        // Keep every nth point
        const step = Math.ceil(finalPoints.length / 100);
        finalPoints = finalPoints.filter((_, i) => i % step === 0 || i === finalPoints.length - 1);
      }

      // Calculate bounding box
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      finalPoints.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });

      // Normalize points relative to shape position
      const normalizedPoints = finalPoints.map(p => ({
        x: p.x - minX,
        y: p.y - minY,
      }));

      const props = getDrawingProps();

      // Create shape
      const newShape: Shape = {
        id: generateId(),
        type: 'freedraw',
        x: minX,
        y: minY,
        width: maxX - minX || 1,
        height: maxY - minY || 1,
        fill: 'transparent',
        stroke: currentStrokeColor,
        strokeWidth: props.strokeWidth,
        opacity: props.opacity,
        lineCap: props.lineCap,
        points: normalizedPoints,
      };

      // Remove visual line
      if (currentDrawingLineRef.current) {
        currentDrawingLineRef.current.destroy();
        currentDrawingLineRef.current = null;
      }
      currentDrawingRef.current = [];
      drawingLayer.getLayer()?.batchDraw();

      // Add shape
      setShapes(prev => {
        const updated = [...prev, newShape];
        notifyShapesChange(updated);
        return updated;
      });

      setIsDrawing(false);
    };

    stage.on('mousedown touchstart', handleDrawStart);
    stage.on('mousemove touchmove', handleDrawMove);
    stage.on('mouseup touchend', handleDrawEnd);

    return () => {
      stage.off('mousedown touchstart', handleDrawStart);
      stage.off('mousemove touchmove', handleDrawMove);
      stage.off('mouseup touchend', handleDrawEnd);
    };
  }, [tool, isPanning, isDrawing, setIsDrawing, currentStrokeColor, shapes, notifyShapesChange]);

  // Marquee selection handlers
  useEffect(() => {
    const stage = stageRef.current;
    const selectionLayer = selectionLayerRef.current;
    if (!stage || !selectionLayer) return;

    // Remove existing marquee rect if any
    if (marqueeRectRef.current) {
      marqueeRectRef.current.destroy();
      marqueeRectRef.current = null;
    }

    // Create marquee rect (initially invisible)
    const marqueeRect = new Konva.Rect({
      fill: 'rgba(59, 130, 246, 0.1)',
      stroke: '#3b82f6',
      strokeWidth: 1,
      dash: [4, 4],
      visible: false,
      listening: false,
    });
    selectionLayer.add(marqueeRect);
    marqueeRectRef.current = marqueeRect;

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only start marquee on left mouse button in select mode
      if (e.evt.button !== 0) return;
      if (tool !== 'select') return;
      if (isPanning) return;

      // Check if clicking on background (not on a shape)
      const target = e.target;

      const isBackground = target === stage ||
        target.getLayer() === staticLayerRef.current;

      if (!isBackground) return;

      // Get canvas coordinates (accounting for pan/zoom)
      const pos = stage.getPointerPosition();
      if (!pos) return;

      const transform = stage.getAbsoluteTransform().copy().invert();
      const canvasPos = transform.point(pos);

      // Check if shift is held to add to selection
      if (!e.evt.shiftKey) {
        // Clear selection only if not shift-clicking
        // Selection will be set after marquee completes
      }

      // Start marquee
      marqueeStartRef.current = canvasPos;
      setIsMarqueeSelecting(true);

      // Initialize marquee rect position
      marqueeRect.setAttrs({
        x: canvasPos.x,
        y: canvasPos.y,
        width: 0,
        height: 0,
        visible: true,
      });
      selectionLayer.batchDraw();
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isMarqueeSelecting || !marqueeStartRef.current) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      const transform = stage.getAbsoluteTransform().copy().invert();
      const canvasPos = transform.point(pos);

      const start = marqueeStartRef.current;
      const x = Math.min(start.x, canvasPos.x);
      const y = Math.min(start.y, canvasPos.y);
      const width = Math.abs(canvasPos.x - start.x);
      const height = Math.abs(canvasPos.y - start.y);

      marqueeRect.setAttrs({ x, y, width, height });
      selectionLayer.batchDraw();
    };

    const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isMarqueeSelecting || !marqueeStartRef.current) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      const transform = stage.getAbsoluteTransform().copy().invert();
      const canvasPos = transform.point(pos);

      const start = marqueeStartRef.current;
      const marqueeX = Math.min(start.x, canvasPos.x);
      const marqueeY = Math.min(start.y, canvasPos.y);
      const marqueeWidth = Math.abs(canvasPos.x - start.x);
      const marqueeHeight = Math.abs(canvasPos.y - start.y);

      // Find shapes inside the marquee
      const selectedShapeIds: string[] = [];

      // Only select if marquee has some area (not just a click)
      if (marqueeWidth > 5 || marqueeHeight > 5) {
        shapes.forEach((shape) => {
          // Check if shape intersects with marquee
          const shapeRight = shape.x + shape.width;
          const shapeBottom = shape.y + shape.height;
          const marqueeRight = marqueeX + marqueeWidth;
          const marqueeBottom = marqueeY + marqueeHeight;

          // Check for intersection (shape fully or partially inside marquee)
          const intersects =
            shape.x < marqueeRight &&
            shapeRight > marqueeX &&
            shape.y < marqueeBottom &&
            shapeBottom > marqueeY;

          if (intersects) {
            selectedShapeIds.push(shape.id);
          }
        });

        // Update selection
        if (e.evt.shiftKey && selectedIds.length > 0) {
          // Add to existing selection
          const newIds = [...new Set([...selectedIds, ...selectedShapeIds])];
          selectMultiple(newIds);
        } else {
          selectMultiple(selectedShapeIds);
        }
      } else {
        // It was just a click, clear selection
        if (!e.evt.shiftKey) {
          clearSelection();
        }
      }

      // Hide marquee rect
      marqueeRect.visible(false);
      selectionLayer.batchDraw();

      // Reset marquee state
      marqueeStartRef.current = null;
      setIsMarqueeSelecting(false);
    };

    stage.on('mousedown', handleMouseDown);
    stage.on('mousemove', handleMouseMove);
    stage.on('mouseup', handleMouseUp);

    return () => {
      stage.off('mousedown', handleMouseDown);
      stage.off('mousemove', handleMouseMove);
      stage.off('mouseup', handleMouseUp);
      if (marqueeRectRef.current) {
        marqueeRectRef.current.destroy();
        marqueeRectRef.current = null;
      }
    };
  }, [tool, isPanning, shapes, selectedIds, selectMultiple, clearSelection, isMarqueeSelecting]);

  // Sync selection to collaboration
  useEffect(() => {
    if (!isCollaborating) return;
    updateSelection(selectedIds);
  }, [isCollaborating, selectedIds, updateSelection]);

  // Track cursor movement for collaboration
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !isCollaborating) return;

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = stage.getPointerPosition();
      if (!pos) return;

      // Convert to canvas coordinates
      const transform = stage.getAbsoluteTransform().copy().invert();
      const canvasPos = transform.point(pos);
      updateCursor(canvasPos.x, canvasPos.y);
    };

    const handleMouseLeave = () => {
      clearCursor();
    };

    stage.on('mousemove', handleMouseMove);
    stage.container().addEventListener('mouseleave', handleMouseLeave);

    return () => {
      stage.off('mousemove', handleMouseMove);
      stage.container().removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isCollaborating, updateCursor, clearCursor]);

  // Sync viewport to collaboration
  useEffect(() => {
    if (!isCollaborating) return;
    const stage = stageRef.current;
    if (!stage) return;

    const stageScale = stage.scaleX();
    const stagePos = stage.position();
    updateCollabViewport(-stagePos.x / stageScale, -stagePos.y / stageScale, stageScale);
  }, [isCollaborating, scale, updateCollabViewport]);

  // Render remote user cursors
  useEffect(() => {
    const layer = cursorsLayerRef.current;
    if (!layer) return;

    layer.destroyChildren();

    if (!isCollaborating || remoteUsers.length === 0) {
      layer.batchDraw();
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;

    remoteUsers.forEach((user) => {
      if (!user.cursor) return;

      // Create cursor group
      const group = new Konva.Group({
        x: user.cursor.x,
        y: user.cursor.y,
      });

      // Cursor arrow shape
      const arrow = new Konva.Line({
        points: [0, 0, 0, 16, 4, 12, 8, 20, 12, 18, 8, 10, 14, 10],
        fill: user.color,
        closed: true,
        strokeWidth: 1,
        stroke: '#ffffff',
      });
      group.add(arrow);

      // User name label
      const labelBg = new Konva.Rect({
        x: 16,
        y: 8,
        fill: user.color,
        cornerRadius: 4,
        height: 18,
        width: user.name.length * 7 + 8,
      });
      group.add(labelBg);

      const label = new Konva.Text({
        x: 20,
        y: 10,
        text: user.name,
        fontSize: 12,
        fill: '#ffffff',
        fontFamily: 'sans-serif',
      });
      group.add(label);

      layer.add(group);
    });

    layer.batchDraw();
  }, [isCollaborating, remoteUsers]);

  // Build theme class name
  const themeClass = theme ? `zm-${theme}` : '';
  const wrapperClassName = ['zm-draw-wrapper', themeClass, className].filter(Boolean).join(' ');

  return (
    <div className={wrapperClassName} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Canvas */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div
          ref={containerRef}
          className="zm-draw-canvas-container"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          role="application"
          aria-label={`Drawing canvas with ${shapes.length} shapes. Use arrow keys to move selected shapes, Delete to remove, Ctrl+Z to undo.`}
          aria-describedby="zm-canvas-instructions"
          tabIndex={0}
          style={{
            width: '100%',
            height: '100%',
            cursor: tool === 'select' ? 'default' : 'crosshair',
            borderRadius: 0,
            border: 'none',
            overflow: 'hidden',
            backgroundColor: backgroundColor,
          }}
        />
        {/* Screen reader instructions (visually hidden) */}
        <div
          id="zm-canvas-instructions"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          Interactive drawing canvas. Press S for sticky note, R for rectangle, O for ellipse.
          Use Tab to navigate between shapes. Press Enter to edit text. Press Escape to deselect.
        </div>

        {/* Collaboration Status Indicator */}
        {collaborationEnabled && UIOptions?.collaborationIndicator !== false && (
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 20,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            fontSize: 12,
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: connectionStatus === 'connected' ? '#22c55e' :
                             connectionStatus === 'connecting' ? '#f59e0b' : '#9ca3af',
            }} />
            <span style={{ color: '#374151' }}>
              {connectionStatus === 'connected' ? `${remoteUsers.length + 1} online` :
               connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </span>
            {/* Remote user avatars */}
            {remoteUsers.length > 0 && (
              <div style={{ display: 'flex', marginLeft: 4 }}>
                {remoteUsers.slice(0, 3).map((user, i) => (
                  <div
                    key={user.odUserId}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: user.color,
                      border: '2px solid white',
                      marginLeft: i > 0 ? -8 : 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      color: 'white',
                      fontWeight: 500,
                    }}
                    title={user.name}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {remoteUsers.length > 3 && (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: '#6b7280',
                      border: '2px solid white',
                      marginLeft: -8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      color: 'white',
                      fontWeight: 500,
                    }}
                  >
                    +{remoteUsers.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom Floating Toolbar */}
        {UIOptions?.toolbar !== false && (
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
          }}>
            <Toolbar
              tool={tool}
              setTool={setTool}
              connectingFrom={connectingFrom}
              cancelConnecting={cancelConnecting}
              hasSelection={!!selectedId}
              onDelete={deleteSelected}
              shapeCount={shapes.length}
              onClearAll={clearAll}
              canUndo={canUndo}
              onUndo={undo}
              canRedo={canRedo}
              onRedo={redo}
              scale={scale}
              onResetZoom={resetZoom}
              onSave={exportToJson}
              onLoad={importFromJson}
              onAddImage={openImageDialog}
              currentStampType={currentStampType}
              onStampTypeChange={setStampType}
              onAddStamp={addStampAtCenter}
              onToggleComments={togglePanel}
              isCommentPanelOpen={isPanelOpen}
              commentCount={unresolvedCommentCount}
              onTidyUp={handleTidyUp}
              selectedCount={selectedIds.length}
            />
          </div>
        )}

        {/* Connector Floating Toolbar */}
        {UIOptions?.connectorToolbar !== false && connectorToolbarPos && selectionType === 'connector' && selectedId && (() => {
          const conn = connectors.find((c) => c.id === selectedId);
          if (!conn) return null;
          const isArrow = conn.arrow || conn.arrowEnd === 'arrow' || conn.arrowEnd === 'triangle';
          return (
            <div
              className="zm-connector-toolbar"
              style={{
                position: 'absolute',
                left: connectorToolbarPos.x,
                top: connectorToolbarPos.y,
                transform: 'translateX(-50%)',
                zIndex: 200,
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Routing */}
              <button
                className={`zm-connector-toolbar-btn${(!conn.routing || conn.routing === 'straight') ? ' active' : ''}`}
                title="Straight"
                onClick={() => updateConnector(selectedId, { routing: 'straight' })}
              >{ConnectorStraightIcon}</button>
              <button
                className={`zm-connector-toolbar-btn${conn.routing === 'orthogonal' ? ' active' : ''}`}
                title="Elbow"
                onClick={() => updateConnector(selectedId, { routing: 'orthogonal' })}
              >{ConnectorElbowIcon}</button>

              <div className="zm-connector-toolbar-divider" />

              {/* Line Style */}
              <button
                className={`zm-connector-toolbar-btn${(!conn.lineStyle || conn.lineStyle === 'solid') ? ' active' : ''}`}
                title="Solid"
                onClick={() => updateConnector(selectedId, { lineStyle: 'solid' })}
              >{ConnectorSolidIcon}</button>
              <button
                className={`zm-connector-toolbar-btn${conn.lineStyle === 'dashed' ? ' active' : ''}`}
                title="Dashed"
                onClick={() => updateConnector(selectedId, { lineStyle: 'dashed' })}
              >{ConnectorDashedIcon}</button>
              <button
                className={`zm-connector-toolbar-btn${conn.lineStyle === 'dotted' ? ' active' : ''}`}
                title="Dotted"
                onClick={() => updateConnector(selectedId, { lineStyle: 'dotted' })}
              >{ConnectorDottedIcon}</button>

              <div className="zm-connector-toolbar-divider" />

              {/* Arrow */}
              <button
                className={`zm-connector-toolbar-btn${!isArrow ? ' active' : ''}`}
                title="No arrow"
                onClick={() => updateConnector(selectedId, { arrow: false, arrowEnd: 'none' })}
              >{ConnectorArrowNoneIcon}</button>
              <button
                className={`zm-connector-toolbar-btn${isArrow ? ' active' : ''}`}
                title="Arrow"
                onClick={() => updateConnector(selectedId, { arrow: true, arrowEnd: 'arrow' })}
              >{ConnectorArrowIcon}</button>

              <div className="zm-connector-toolbar-divider" />

              {/* Delete */}
              <button
                className="zm-connector-toolbar-btn zm-connector-toolbar-btn-danger"
                title="Delete connector"
                onClick={deleteSelected}
              >{ConnectorTrashIcon}</button>
            </div>
          );
        })()}

        {/* Comment Panel */}
        {UIOptions?.commentPanel !== false && <CommentPanel />}

        {/* Text editing overlay */}
        {editingId && (() => {
          const editingShape = getEditingShape();
          if (!editingShape) return null;

          const stage = stageRef.current;
          const stageScale = stage?.scaleX() || 1;
          const stagePos = stage?.position() || { x: 0, y: 0 };

          return (
            <TextEditor
              shape={editingShape}
              stageScale={stageScale}
              stagePosition={stagePos}
              onSubmit={(text) => updateShapeText(editingId, text)}
              onCancel={() => setEditingId(null)}
            />
          );
        })()}

        {/* Table cell editing overlay */}
        {editingCell && (() => {
          const tableShape = shapes.find((s) => s.id === editingCell.shapeId);
          if (!tableShape || !tableShape.tableData) return null;

          const stage = stageRef.current;
          const stageScale = stage?.scaleX() || 1;
          const stagePos = stage?.position() || { x: 0, y: 0 };

          const tableData = tableShape.tableData;
          const { row, col } = editingCell;

          // Calculate cell position
          let cellX = tableShape.x;
          let cellY = tableShape.y;
          for (let c = 0; c < col; c++) {
            cellX += tableData.colWidths[c] || 100;
          }
          for (let r = 0; r < row; r++) {
            cellY += tableData.rowHeights[r] || 40;
          }
          const cellWidth = tableData.colWidths[col] || 100;
          const cellHeight = tableData.rowHeights[row] || 40;
          const currentText = tableData.cells[row]?.[col]?.text || '';

          return (
            <input
              type="text"
              autoFocus
              defaultValue={currentText}
              style={{
                position: 'absolute',
                left: cellX * stageScale + stagePos.x,
                top: cellY * stageScale + stagePos.y,
                width: cellWidth * stageScale,
                height: cellHeight * stageScale,
                fontSize: (tableShape.fontSize || 14) * stageScale,
                fontFamily: tableShape.fontFamily || 'Arial',
                textAlign: 'left',
                border: '2px solid #3b82f6',
                outline: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                color: '#1e1e1e',
                padding: `0 ${8 * stageScale}px`,
                boxSizing: 'border-box',
              }}
              onBlur={(e) => updateCellText(editingCell.shapeId, row, col, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateCellText(editingCell.shapeId, row, col, (e.target as HTMLInputElement).value);
                } else if (e.key === 'Escape') {
                  setEditingCell(null);
                } else if (e.key === 'Tab') {
                  e.preventDefault();
                  // Move to next cell
                  const nextCol = col + 1;
                  if (nextCol < tableData.cols) {
                    updateCellText(editingCell.shapeId, row, col, (e.target as HTMLInputElement).value);
                    setTimeout(() => setEditingCell({ shapeId: editingCell.shapeId, row, col: nextCol }), 0);
                  } else if (row + 1 < tableData.rows) {
                    updateCellText(editingCell.shapeId, row, col, (e.target as HTMLInputElement).value);
                    setTimeout(() => setEditingCell({ shapeId: editingCell.shapeId, row: row + 1, col: 0 }), 0);
                  } else {
                    updateCellText(editingCell.shapeId, row, col, (e.target as HTMLInputElement).value);
                  }
                }
              }}
            />
          );
        })()}

        {/* Table context menu */}
        {tableContextMenu && (
          <div
            style={{
              position: 'absolute',
              left: tableContextMenu.x,
              top: tableContextMenu.y,
              backgroundColor: 'white',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e5e5e5',
              padding: 4,
              zIndex: 1000,
              minWidth: 160,
            }}
            onMouseLeave={() => setTableContextMenu(null)}
          >
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 13,
                color: '#1e1e1e',
                borderRadius: 4,
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => {
                addTableRow(tableContextMenu.shapeId, tableContextMenu.row);
                setTableContextMenu(null);
              }}
            >
              + Insert row below
            </button>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 13,
                color: '#1e1e1e',
                borderRadius: 4,
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => {
                addTableColumn(tableContextMenu.shapeId, tableContextMenu.col);
                setTableContextMenu(null);
              }}
            >
              + Insert column right
            </button>
            <div style={{ height: 1, backgroundColor: '#e5e5e5', margin: '4px 0' }} />
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 13,
                color: '#ef4444',
                borderRadius: 4,
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => {
                deleteTableRow(tableContextMenu.shapeId, tableContextMenu.row);
                setTableContextMenu(null);
              }}
            >
              − Delete row
            </button>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 13,
                color: '#ef4444',
                borderRadius: 4,
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => {
                deleteTableColumn(tableContextMenu.shapeId, tableContextMenu.col);
                setTableContextMenu(null);
              }}
            >
              − Delete column
            </button>
            <div style={{ height: 1, backgroundColor: '#e5e5e5', margin: '4px 0' }} />
            {/* Header row toggle */}
            {(() => {
              const tableShape = shapes.find((s) => s.id === tableContextMenu.shapeId);
              const hasHeader = tableShape?.tableData?.headerRow || false;
              return (
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    color: '#1e1e1e',
                    borderRadius: 4,
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onClick={() => {
                    toggleTableHeaderRow(tableContextMenu.shapeId);
                    setTableContextMenu(null);
                  }}
                >
                  {hasHeader ? '☑' : '☐'} Header row
                </button>
              );
            })()}
            {/* Cell background colors */}
            <div style={{ padding: '8px 12px' }}>
              <div style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 6 }}>Cell color</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['#ffffff', '#f3f4f6', '#fef9c3', '#dcfce7', '#dbeafe', '#f3e8ff', '#fee2e2'].map((color) => (
                  <button
                    key={color}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      backgroundColor: color,
                      border: '1px solid #d1d5db',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    onClick={() => {
                      setCellBackground(tableContextMenu.shapeId, tableContextMenu.row, tableContextMenu.col, color);
                      setTableContextMenu(null);
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ARIA live region for screen reader announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          {announcement}
        </div>
      </div>
    </div>
  );
});
