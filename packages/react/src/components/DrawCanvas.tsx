'use client';

import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import Konva from 'konva';
import type { Shape, ShapeType, Connector } from '../types';
import { useKeyboard } from '../hooks/useKeyboard';
import { useToolStore } from '../stores/toolStore';
import { useSelectionStore } from '../stores/selectionStore';
import { useViewportStore } from '../stores/viewportStore';
import { generateId, defaultShapeProps } from '../stores/canvasStore';
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
}

/** Viewport state for positioning overlays */
export interface ViewportInfo {
  scale: number;
  position: { x: number; y: number };
}

/** Imperative handle for DrawCanvas */
export interface DrawCanvasHandle {
  /** Update a shape's properties */
  updateShape: (id: string, updates: Partial<Shape>) => void;
  /** Get current shapes */
  getShapes: () => Shape[];
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
  const selectedId = useSelectionStore((s) => s.selectedId);
  const selectionType = useSelectionStore((s) => s.selectionType);
  const setSelectedId = useSelectionStore((s) => s.select);
  const selectConnector = useSelectionStore((s) => s.selectConnector);
  const clearSelection = useSelectionStore((s) => s.clearSelection);

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

  // Track canvas initialization to trigger re-render of shapes
  const [canvasVersion, setCanvasVersion] = useState(0);

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
      const group = new Konva.Group({
        id: shape.id,
        x: shape.x,
        y: shape.y,
        draggable: true,
        rotation: shape.rotation || 0,
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
            cornerRadius: 4,
          });
      }

      if (shape.id === selectedId && selectionType === 'shape') {
        konvaShape.stroke('#ef4444');
        konvaShape.strokeWidth(3);
      }

      if (connectingFrom === shape.id) {
        konvaShape.stroke('#22c55e');
        konvaShape.strokeWidth(3);
      }

      group.add(konvaShape);

      if (shape.text) {
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

      group.on('click tap', () => {
        if (tool === 'connector') {
          if (!connectingFrom) {
            setConnectingFrom(shape.id);
          } else {
            addConnector(connectingFrom, shape.id);
            setConnectingFrom(null);
          }
        } else {
          setSelectedId(shape.id);
        }
      });

      group.on('dblclick dbltap', () => {
        setEditingId(shape.id);
        setSelectedId(shape.id);
      });

      layer.add(group);
    });

    const transformer = transformerRef.current;
    if (transformer && selectedId && selectionType === 'shape') {
      const selectedNode = layer.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformer.nodes([selectedNode]);
        transformer.getLayer()?.batchDraw();
      } else {
        transformer.nodes([]);
      }
    } else if (transformer) {
      transformer.nodes([]);
    }

    layer.batchDraw();
  }, [shapes, selectedId, selectionType, onShapesChange, tool, connectingFrom, addConnector, editingId]);

  // Add shape at position
  const addShape = useCallback((type: ShapeType, x: number, y: number) => {
    const newShape: Shape = {
      id: generateId(),
      type,
      x: x - defaultShapeProps.width / 2,
      y: y - defaultShapeProps.height / 2,
      ...defaultShapeProps,
    };

    setShapes((prev) => {
      const updated = [...prev, newShape];
      onShapesChange?.(updated);
      return updated;
    });
    setSelectedId(newShape.id);
    setTool('select');
  }, [onShapesChange]);

  // Delete selected shape or connector
  const deleteSelected = useCallback(() => {
    if (!selectedId) return;

    if (selectionType === 'connector') {
      setConnectors((prev) => prev.filter((c) => c.id !== selectedId));
      clearSelection();
    } else {
      setShapes((prev) => {
        const updated = prev.filter((s) => s.id !== selectedId);
        onShapesChange?.(updated);
        return updated;
      });
      setConnectors((prev) =>
        prev.filter((c) => c.fromShapeId !== selectedId && c.toShapeId !== selectedId)
      );
      clearSelection();
    }
  }, [selectedId, selectionType, onShapesChange, clearSelection]);

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

  // Get edge intersection point for a shape
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

  // Render connectors
  const renderConnectors = useCallback(() => {
    const layer = connectorsLayerRef.current;
    if (!layer) return;

    layer.destroyChildren();

    connectors.forEach((connector) => {
      const fromShape = shapes.find((s) => s.id === connector.fromShapeId);
      const toShape = shapes.find((s) => s.id === connector.toShapeId);

      if (!fromShape || !toShape) return;

      const fromCenter = getShapeCenter(fromShape);
      const toCenter = getShapeCenter(toShape);
      const from = getShapeEdgePoint(fromShape, toCenter);
      const to = getShapeEdgePoint(toShape, fromCenter);

      const isSelected = selectedId === connector.id && selectionType === 'connector';

      const arrow = new Konva.Arrow({
        id: connector.id,
        points: [from.x, from.y, to.x, to.y],
        stroke: isSelected ? '#ef4444' : connector.stroke,
        strokeWidth: isSelected ? connector.strokeWidth + 1 : connector.strokeWidth,
        fill: isSelected ? '#ef4444' : connector.stroke,
        pointerLength: 10,
        pointerWidth: 8,
        hitStrokeWidth: 20,
      });

      arrow.on('click tap', (e) => {
        e.cancelBubble = true;
        selectConnector(connector.id);
      });

      layer.add(arrow);
    });

    layer.batchDraw();
  }, [connectors, shapes, getShapeCenter, getShapeEdgePoint, selectedId, selectionType, selectConnector]);

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

  // Expose imperative methods via ref
  useImperativeHandle(ref, () => ({
    updateShape,
    getShapes: () => shapes,
    getSelectedId: () => selectedId,
    getViewport: () => ({
      scale: stageRef.current?.scaleX() || 1,
      position: stageRef.current?.position() || { x: 0, y: 0 },
    }),
    deleteSelected,
    duplicateSelected,
    copySelected,
  }), [updateShape, shapes, selectedId, deleteSelected, duplicateSelected, copySelected]);

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

    // Handle transform end
    transformer.on('transformend', () => {
      const node = transformer.nodes()[0];
      if (!node) return;

      const id = node.id();
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      node.scaleX(1);
      node.scaleY(1);

      setShapes((prev) => {
        const updated = prev.map((s) => {
          if (s.id === id) {
            return {
              ...s,
              x: node.x(),
              y: node.y(),
              width: Math.max(20, s.width * scaleX),
              height: Math.max(20, s.height * scaleY),
              rotation: node.rotation(),
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
      if (selectionLayerRef.current) {
        selectionLayerRef.current.destroyChildren();
        selectionLayerRef.current = null;
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
          setSelectedId(null);
        }
      }
    });
  }, [tool, addShape, isPanning]);

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
