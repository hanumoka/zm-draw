'use client';

import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import Konva from 'konva';
import type { Shape, ShapeType, Connector, FreeDrawPoint, StickyNoteColor, StampType } from '../types';
import { STICKY_COLORS, STAMP_EMOJIS } from '../types';
import { useKeyboard } from '../hooks/useKeyboard';
import { useCollaboration } from '../hooks/useCollaboration';
import { useToolStore } from '../stores/toolStore';
import { useSelectionStore } from '../stores/selectionStore';
import { useViewportStore } from '../stores/viewportStore';
import { generateId, defaultShapeProps, defaultTextShapeProps, defaultStickyNoteProps, defaultFreeDrawProps, defaultImageShapeProps, defaultStampProps } from '../stores/canvasStore';

// Module-level image cache for performance
const imageCache = new Map<string, HTMLImageElement>();

// Maximum image dimensions (auto-resize if exceeded)
const MAX_IMAGE_SIZE = 4000;
import { Toolbar } from './Toolbar';
import { TextEditor } from './TextEditor';

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

/** Alignment type */
export type AlignType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

/** Distribution type */
export type DistributeType = 'horizontal' | 'vertical';

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
}

export interface DrawCanvasProps {
  /** Background color */
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
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const shapesLayerRef = useRef<Konva.Layer | null>(null);
  const bgLayerRef = useRef<Konva.Layer | null>(null);
  const gridLayerRef = useRef<Konva.Layer | null>(null);

  const [shapes, setShapes] = useState<Shape[]>(initialShapes);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

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

  const connectorsLayerRef = useRef<Konva.Layer | null>(null);
  const selectionLayerRef = useRef<Konva.Layer | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const marqueeRectRef = useRef<Konva.Rect | null>(null);

  // Track canvas initialization to trigger re-render of shapes
  const [canvasVersion, setCanvasVersion] = useState(0);

  // Marquee selection state
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);

  // Freedraw state
  const drawingLayerRef = useRef<Konva.Layer | null>(null);
  const currentDrawingRef = useRef<FreeDrawPoint[]>([]);
  const currentDrawingLineRef = useRef<Konva.Line | null>(null);

  // Connection points layer ref
  const connectionPointsLayerRef = useRef<Konva.Layer | null>(null);
  const [hoveredShapeId, setHoveredShapeId] = useState<string | null>(null);

  // Smart guides layer ref and state
  const guidesLayerRef = useRef<Konva.Layer | null>(null);
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
    const layer = guidesLayerRef.current;
    if (!layer) return;

    layer.destroyChildren();

    if (!showSmartGuides || (activeGuides.horizontal.length === 0 && activeGuides.vertical.length === 0)) {
      layer.batchDraw();
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
      layer.add(line);
    });

    // Draw vertical guide lines
    activeGuides.vertical.forEach((x) => {
      const line = new Konva.Line({
        points: [x, visibleTop, x, visibleBottom],
        stroke: '#f43f5e',
        strokeWidth: 1 / viewportScale,
        dash: [4 / viewportScale, 4 / viewportScale],
      });
      layer.add(line);
    });

    layer.batchDraw();
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

  // Draw infinite dotted grid based on viewport (Figma style)
  // Uses a single Konva.Shape with sceneFunc for performance (instead of thousands of Circle nodes)
  const drawInfiniteGrid = useCallback(() => {
    const layer = gridLayerRef.current;
    const stage = stageRef.current;
    if (!layer || !stage) return;

    // Determine grid color based on background brightness
    const isDark = backgroundColor.startsWith('#') &&
      parseInt(backgroundColor.slice(1, 3), 16) < 128;
    const gridColor = isDark ? '#4a4a4a' : '#d1d5db';

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

        // Adjust grid size based on zoom level for better visibility
        let effectiveGridSize = gridSize;
        if (stageScale < 0.5) effectiveGridSize = gridSize * 2;
        if (stageScale < 0.25) effectiveGridSize = gridSize * 4;
        if (stageScale > 2) effectiveGridSize = gridSize / 2;

        // Calculate grid dot positions
        const firstX = Math.floor(startX / effectiveGridSize) * effectiveGridSize;
        const firstY = Math.floor(startY / effectiveGridSize) * effectiveGridSize;

        // Dot size scales inversely with zoom for consistent appearance
        const dotRadius = Math.max(1, 1.5 / stageScale);

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
    layer.batchDraw();
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

    layer.batchDraw();
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
  const addConnector = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;

    const exists = connectors.some(
      (c) => (c.fromShapeId === fromId && c.toShapeId === toId) ||
             (c.fromShapeId === toId && c.toShapeId === fromId)
    );
    if (exists) return;

    const newConnector: Connector = {
      id: `conn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      fromShapeId: fromId,
      toShapeId: toId,
      stroke: '#6b7280',
      strokeWidth: 2,
      arrow: true,
    };

    setConnectors((prev) => [...prev, newConnector]);
  }, [connectors]);

  // Render all shapes to the layer
  const renderShapes = useCallback(() => {
    const layer = shapesLayerRef.current;
    if (!layer) return;

    layer.destroyChildren();

    shapes.forEach((shape) => {
      // Skip hidden shapes
      if (shape.visible === false) return;

      const group = new Konva.Group({
        id: shape.id,
        x: shape.x,
        y: shape.y,
        draggable: !shape.locked, // Locked shapes can't be dragged
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
            points.forEach((p) => {
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
        default:
          konvaShape = new Konva.Rect({
            ...shapeConfig,
            cornerRadius: shape.cornerRadius ?? 0,
          });
      }

      // Selection highlight (different for text, freedraw, and image shapes)
      if (selectedIds.includes(shape.id) && selectionType === 'shape') {
        if (shape.type === 'text' || shape.type === 'freedraw' || shape.type === 'image') {
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

      if (connectingFrom === shape.id) {
        konvaShape.stroke('#22c55e');
        konvaShape.strokeWidth(3);
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
          onShapesChange?.(updated);
          return updated;
        });
      });

      group.on('click tap', (e) => {
        // Locked shapes can't be selected (except for connectors)
        if (shape.locked && tool !== 'connector') return;

        if (tool === 'connector') {
          if (!connectingFrom) {
            setConnectingFrom(shape.id);
          } else {
            addConnector(connectingFrom, shape.id);
            setConnectingFrom(null);
          }
        } else {
          // Support Shift+Click for multi-select
          const evt = e.evt as MouseEvent | TouchEvent;
          const shiftKey = 'shiftKey' in evt ? evt.shiftKey : false;
          toggleSelection(shape.id, shiftKey);
        }
      });

      group.on('dblclick dbltap', () => {
        setEditingId(shape.id);
        setSelectedId(shape.id);
      });

      // Hover events for connection points in connector mode
      group.on('mouseenter', () => {
        if (tool === 'connector') {
          setHoveredShapeId(shape.id);
        }
      });

      group.on('mouseleave', () => {
        if (tool === 'connector') {
          setHoveredShapeId(null);
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

    layer.batchDraw();
  }, [shapes, selectedIds, selectionType, onShapesChange, tool, connectingFrom, addConnector, editingId, toggleSelection, snapToGridValue, snapToGrid, showSmartGuides, snapToGuides, calculateSmartGuides]);

  // Add shape at position
  const addShape = useCallback((type: ShapeType, x: number, y: number, options?: { stampType?: StampType }) => {
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
      onShapesChange?.(updated);
      return updated;
    });
    setSelectedId(newShape.id);

    // For text and sticky shapes, immediately open the editor
    if (type === 'text' || type === 'sticky') {
      setEditingId(newShape.id);
    }

    setTool('select');
  }, [onShapesChange, snapToGridValue, currentStickyColor, currentStampType]);

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
      onShapesChange?.(updated);
      return updated;
    });
    setSelectedId(newShape.id);
    setTool('select');
  }, [onShapesChange, snapToGridValue]);

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
    } else {
      // Delete all selected shapes
      setShapes((prev) => {
        const updated = prev.filter((s) => !selectedIds.includes(s.id));
        onShapesChange?.(updated);
        return updated;
      });
      // Delete connectors connected to any deleted shape
      setConnectors((prev) =>
        prev.filter((c) =>
          !selectedIds.includes(c.fromShapeId) && !selectedIds.includes(c.toShapeId)
        )
      );
      clearSelection();
    }
  }, [selectedIds, selectedId, selectionType, onShapesChange, clearSelection]);

  // Clear all shapes
  const clearAll = useCallback(() => {
    setShapes([]);
    setConnectors([]);
    setSelectedId(null);
    onShapesChange?.([]);
  }, [onShapesChange]);

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
      const fromShape = shapes.find((s) => s.id === connector.fromShapeId);
      const toShape = shapes.find((s) => s.id === connector.toShapeId);

      if (!fromShape || !toShape) return;

      // Get connection points (use specified points or auto)
      const fromPoint = connector.fromPoint || 'auto';
      const toPoint = connector.toPoint || 'auto';

      let from: { x: number; y: number };
      let to: { x: number; y: number };

      if (fromPoint === 'auto') {
        const toCenter = getShapeCenter(toShape);
        from = getShapeEdgePoint(fromShape, toCenter);
      } else {
        from = getConnectionPoint(fromShape, fromPoint);
      }

      if (toPoint === 'auto') {
        const fromCenter = getShapeCenter(fromShape);
        to = getShapeEdgePoint(toShape, fromCenter);
      } else {
        to = getConnectionPoint(toShape, toPoint);
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
    });

    layer.batchDraw();
  }, [connectors, shapes, getShapeCenter, getShapeEdgePoint, getConnectionPoint, getOrthogonalPath, getLineDash, selectedId, selectionType, selectConnector]);

  // Update shape text
  const updateShapeText = useCallback((id: string, text: string) => {
    setShapes((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, text } : s
      );
      onShapesChange?.(updated);
      return updated;
    });
    setEditingId(null);
  }, [onShapesChange]);

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
      onShapesChange?.(updated);
      return updated;
    });
    setSelectedId(newShape.id);
    pasteOffsetRef.current += 20;
  }, [onShapesChange]);

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
      onShapesChange?.(updated);
      return updated;
    });
    setSelectedId(newShape.id);
  }, [selectedId, shapes, onShapesChange]);

  // Move selected shape with arrow keys
  const moveSelected = useCallback((dx: number, dy: number) => {
    if (!selectedId) return;

    setShapes((prev) => {
      const updated = prev.map((s) =>
        s.id === selectedId ? { ...s, x: s.x + dx, y: s.y + dy } : s
      );
      onShapesChange?.(updated);
      return updated;
    });
  }, [selectedId, onShapesChange]);

  // Update shape properties (for external use via ref)
  const updateShape = useCallback((id: string, updates: Partial<Shape>) => {
    setShapes((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      );
      onShapesChange?.(updated);
      return updated;
    });
  }, [onShapesChange]);

  // Update connector properties (for external use via ref)
  const updateConnector = useCallback((id: string, updates: Partial<Connector>) => {
    setConnectors((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      )
    );
  }, []);

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
      onShapesChange?.(updated);
      return updated;
    });
  }, [selectedIds, shapes, onShapesChange]);

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
      onShapesChange?.(updated);
      return updated;
    });
  }, [selectedIds, shapes, onShapesChange]);

  // Group selected shapes
  const groupSelected = useCallback(() => {
    if (selectedIds.length < 2) return;

    const groupId = generateId();
    setShapes(prev => {
      const updated = prev.map(s =>
        selectedIds.includes(s.id) ? { ...s, groupId } : s
      );
      onShapesChange?.(updated);
      return updated;
    });
  }, [selectedIds, onShapesChange]);

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
      onShapesChange?.(updated);
      return updated;
    });
  }, [selectedIds, shapes, onShapesChange]);

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

    // Hide grid and background layers for export
    const gridLayer = gridLayerRef.current;
    const bgLayer = bgLayerRef.current;
    const guidesLayer = guidesLayerRef.current;
    const selectionLayer = selectionLayerRef.current;
    const connectionPointsLayer = connectionPointsLayerRef.current;

    const gridVisible = gridLayer?.visible() ?? false;
    const bgVisible = bgLayer?.visible() ?? false;
    const guidesVisible = guidesLayer?.visible() ?? false;
    const selectionVisible = selectionLayer?.visible() ?? false;
    const connectionPointsVisible = connectionPointsLayer?.visible() ?? false;

    gridLayer?.visible(false);
    bgLayer?.visible(false);
    guidesLayer?.visible(false);
    selectionLayer?.visible(false);
    connectionPointsLayer?.visible(false);

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
      gridLayer?.visible(gridVisible);
      bgLayer?.visible(bgVisible);
      guidesLayer?.visible(guidesVisible);
      selectionLayer?.visible(selectionVisible);
      connectionPointsLayer?.visible(connectionPointsVisible);

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
      onShapesChange?.(newShapes);
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
  }), [updateShape, shapes, selectedId, deleteSelected, duplicateSelected, copySelected, connectors, updateConnector, onShapesChange, alignShapes, distributeShapes, groupSelected, ungroupSelected, exportToPNG, exportToSVG, setZoom, zoomToFit, zoomTo100, setViewportPosition, canvasSize]);

  // Handle escape key
  const handleEscape = useCallback(() => {
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

    // Background layer (large rect for infinite canvas)
    const bgLayer = new Konva.Layer({ listening: false });
    stage.add(bgLayer);
    bgLayerRef.current = bgLayer;

    // Grid layer (infinite)
    const gridLayer = new Konva.Layer({ listening: false });
    stage.add(gridLayer);
    gridLayerRef.current = gridLayer;

    // Connectors layer
    const connectorsLayer = new Konva.Layer();
    stage.add(connectorsLayer);
    connectorsLayerRef.current = connectorsLayer;

    // Shapes layer
    const shapesLayer = new Konva.Layer();
    stage.add(shapesLayer);
    shapesLayerRef.current = shapesLayer;

    // Selection layer (for transformer)
    const selectionLayer = new Konva.Layer();
    stage.add(selectionLayer);
    selectionLayerRef.current = selectionLayer;

    // Connection points layer (for connector mode)
    const connectionPointsLayer = new Konva.Layer();
    stage.add(connectionPointsLayer);
    connectionPointsLayerRef.current = connectionPointsLayer;

    // Smart guides layer (for alignment guides during drag)
    const guidesLayer = new Konva.Layer({ listening: false });
    stage.add(guidesLayer);
    guidesLayerRef.current = guidesLayer;

    // Drawing layer (for active freedraw lines)
    const drawingLayer = new Konva.Layer();
    stage.add(drawingLayer);
    drawingLayerRef.current = drawingLayer;

    // Cursors layer (for remote collaboration cursors)
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
        onShapesChange?.(updated);
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

      // Destroy all children in each layer to prevent memory leaks
      if (shapesLayerRef.current) {
        shapesLayerRef.current.destroyChildren();
        shapesLayerRef.current = null;
      }
      if (connectorsLayerRef.current) {
        connectorsLayerRef.current.destroyChildren();
        connectorsLayerRef.current = null;
      }
      if (marqueeRectRef.current) {
        marqueeRectRef.current.destroy();
        marqueeRectRef.current = null;
      }
      if (selectionLayerRef.current) {
        selectionLayerRef.current.destroyChildren();
        selectionLayerRef.current = null;
      }
      if (connectionPointsLayerRef.current) {
        connectionPointsLayerRef.current.destroyChildren();
        connectionPointsLayerRef.current = null;
      }
      if (gridShapeRef.current) {
        gridShapeRef.current.destroy();
        gridShapeRef.current = null;
      }
      if (gridLayerRef.current) {
        gridLayerRef.current.destroyChildren();
        gridLayerRef.current = null;
      }
      if (bgLayerRef.current) {
        bgLayerRef.current.destroyChildren();
        bgLayerRef.current = null;
      }
      if (drawingLayerRef.current) {
        drawingLayerRef.current.destroyChildren();
        drawingLayerRef.current = null;
      }
      if (currentDrawingLineRef.current) {
        currentDrawingLineRef.current.destroy();
        currentDrawingLineRef.current = null;
      }

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
    const layer = connectionPointsLayerRef.current;
    if (!layer) return;

    layer.destroyChildren();

    // Only show connection points in connector mode when hovering
    if (tool !== 'connector' || !hoveredShapeId) {
      layer.batchDraw();
      return;
    }

    const shape = shapes.find((s) => s.id === hoveredShapeId);
    if (!shape) {
      layer.batchDraw();
      return;
    }

    // Get connection points for the hovered shape
    const points = getConnectionPoints(shape);
    const pointSize = 8;

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
      });

      // Add hover effect
      circle.on('mouseenter', () => {
        circle.fill('#3b82f6');
        circle.stroke('#1d4ed8');
        layer.batchDraw();
      });

      circle.on('mouseleave', () => {
        circle.fill('#ffffff');
        circle.stroke('#3b82f6');
        layer.batchDraw();
      });

      layer.add(circle);
    });

    layer.batchDraw();
  }, [tool, hoveredShapeId, shapes, getConnectionPoints]);

  // Clear hovered shape when tool changes
  useEffect(() => {
    if (tool !== 'connector') {
      setHoveredShapeId(null);
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
      if (isPanning) return;
      if (isDrawingTool) return; // Drawing tools handle their own events

      const bgLayer = bgLayerRef.current;
      const gridLayer = gridLayerRef.current;

      // Click on stage background, bg layer, or grid layer
      if (e.target === stage || e.target.getLayer() === bgLayer || e.target.getLayer() === gridLayer) {
        if (tool === 'connector') {
          setConnectingFrom(null);
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
  }, [isPanning, tool, updateViewport]);

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
      if (target !== stage && target.getLayer() !== bgLayerRef.current && target.getLayer() !== gridLayerRef.current) {
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
              onShapesChange?.(updated);
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
      drawingLayer.batchDraw();
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
      drawingLayer.batchDraw();
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
      drawingLayer.batchDraw();

      // Add shape
      setShapes(prev => {
        const updated = [...prev, newShape];
        onShapesChange?.(updated);
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
  }, [tool, isPanning, isDrawing, setIsDrawing, currentStrokeColor, shapes, onShapesChange]);

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
      const bgLayer = bgLayerRef.current;
      const gridLayer = gridLayerRef.current;
      const target = e.target;

      const isBackground = target === stage ||
        target.getLayer() === bgLayer ||
        target.getLayer() === gridLayer;

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

  return (
    <div className="zm-draw-wrapper" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'visible' }}>
      {/* Canvas */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'visible' }}>
        <div
          ref={containerRef}
          className="zm-draw-canvas-container"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
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

        {/* Collaboration Status Indicator */}
        {collaborationEnabled && (
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
          />
        </div>

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
      </div>
    </div>
  );
});
