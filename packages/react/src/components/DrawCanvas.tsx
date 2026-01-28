'use client';

import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import Konva from 'konva';
import type { Shape, ShapeType, Connector } from '../types';
import { useKeyboard } from '../hooks/useKeyboard';
import { useToolStore } from '../stores/toolStore';
import { useSelectionStore } from '../stores/selectionStore';
import { useViewportStore } from '../stores/viewportStore';
import { generateId, defaultShapeProps, defaultTextShapeProps } from '../stores/canvasStore';
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
  /** Align selected shapes */
  alignShapes: (type: AlignType) => void;
  /** Distribute selected shapes evenly */
  distributeShapes: (type: DistributeType) => void;
  /** Group selected shapes */
  groupSelected: () => void;
  /** Ungroup selected shapes */
  ungroupSelected: () => void;
}

export interface DrawCanvasProps {
  /** Background color */
  backgroundColor?: string;
  /** Show grid */
  showGrid?: boolean;
  /** Grid size in pixels */
  gridSize?: number;
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
}

/**
 * Main drawing canvas component with infinite canvas support
 * Uses vanilla Konva for React 19 compatibility
 */
export const DrawCanvas = forwardRef<DrawCanvasHandle, DrawCanvasProps>(function DrawCanvas({
  backgroundColor = '#ffffff',
  showGrid = true,
  gridSize = 20,
  initialShapes = [],
  onShapesChange,
  onReady,
  onSelectionChange,
  onViewportChange,
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const shapesLayerRef = useRef<Konva.Layer | null>(null);
  const bgLayerRef = useRef<Konva.Layer | null>(null);
  const gridLayerRef = useRef<Konva.Layer | null>(null);

  const [shapes, setShapes] = useState<Shape[]>(initialShapes);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

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

  // History for undo/redo
  const historyRef = useRef<{ shapes: Shape[]; connectors: Connector[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);
  const historyInitializedRef = useRef(false);

  const connectorsLayerRef = useRef<Konva.Layer | null>(null);
  const selectionLayerRef = useRef<Konva.Layer | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const marqueeRectRef = useRef<Konva.Rect | null>(null);

  // Track canvas initialization to trigger re-render of shapes
  const [canvasVersion, setCanvasVersion] = useState(0);

  // Marquee selection state
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);

  // Connection points layer ref
  const connectionPointsLayerRef = useRef<Konva.Layer | null>(null);
  const [hoveredShapeId, setHoveredShapeId] = useState<string | null>(null);

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
        default:
          konvaShape = new Konva.Rect({
            ...shapeConfig,
            cornerRadius: shape.cornerRadius ?? 0,
          });
      }

      // Selection highlight (different for text shapes)
      if (selectedIds.includes(shape.id) && selectionType === 'shape') {
        if (shape.type === 'text') {
          // For text shapes, add a selection border rect behind the text
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
      if (shape.type !== 'text' && shape.text) {
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

      group.on('dragend', (e) => {
        const target = e.target;
        setShapes((prev) => {
          const updated = prev.map((s) =>
            s.id === shape.id ? { ...s, x: target.x(), y: target.y() } : s
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
        transformer.nodes(selectedNodes);
        transformer.getLayer()?.batchDraw();
      } else {
        transformer.nodes([]);
      }
    } else if (transformer) {
      transformer.nodes([]);
    }

    layer.batchDraw();
  }, [shapes, selectedIds, selectionType, onShapesChange, tool, connectingFrom, addConnector, editingId, toggleSelection]);

  // Add shape at position
  const addShape = useCallback((type: ShapeType, x: number, y: number) => {
    // Use different defaults for text shapes
    const props = type === 'text' ? defaultTextShapeProps : defaultShapeProps;
    const newShape: Shape = {
      id: generateId(),
      type,
      x: x - props.width / 2,
      y: y - props.height / 2,
      ...props,
    };

    setShapes((prev) => {
      const updated = [...prev, newShape];
      onShapesChange?.(updated);
      return updated;
    });
    setSelectedId(newShape.id);

    // For text shapes, immediately open the editor
    if (type === 'text') {
      setEditingId(newShape.id);
    }

    setTool('select');
  }, [onShapesChange]);

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
  }), [updateShape, shapes, selectedId, deleteSelected, duplicateSelected, copySelected, connectors, updateConnector, onShapesChange, alignShapes, distributeShapes, groupSelected, ungroupSelected]);

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

    stage.off('click tap');
    stage.on('click tap', (e) => {
      if (isPanning) return;

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
      stage.container().style.cursor = tool === 'select' ? 'default' : 'crosshair';
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

  return (
    <div className="zm-draw-wrapper" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'visible' }}>
      {/* Canvas */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'visible' }}>
        <div
          ref={containerRef}
          className="zm-draw-canvas-container"
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
