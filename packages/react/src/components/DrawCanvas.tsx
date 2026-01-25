'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import Konva from 'konva';
import type { Shape, ShapeType, ToolType, Connector } from '../types';
import { useKeyboard } from '../hooks/useKeyboard';
import { useToolStore } from '../stores/toolStore';
import { useSelectionStore } from '../stores/selectionStore';
import { useViewportStore } from '../stores/viewportStore';
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

export interface DrawCanvasProps {
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
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
}

// Generate unique ID
const generateId = () => `shape-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Default shape properties
const defaultShapeProps = {
  width: 100,
  height: 60,
  fill: '#3b82f6',
  stroke: '#1d4ed8',
  strokeWidth: 2,
  text: '',
  fontSize: 14,
  fontFamily: 'Arial',
  textColor: '#ffffff',
};

/**
 * Main drawing canvas component
 * Uses vanilla Konva for React 19 compatibility
 */
export function DrawCanvas({
  width = 800,
  height = 600,
  backgroundColor = '#ffffff',
  showGrid = true,
  gridSize = 20,
  initialShapes = [],
  onShapesChange,
  onReady,
  onSelectionChange,
}: DrawCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const shapesLayerRef = useRef<Konva.Layer | null>(null);

  const [shapes, setShapes] = useState<Shape[]>(initialShapes);
  const [connectors, setConnectors] = useState<Connector[]>([]);

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

  const connectorsLayerRef = useRef<Konva.Layer | null>(null);
  const selectionLayerRef = useRef<Konva.Layer | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);

  // Save state to history
  const saveHistory = useCallback((newShapes: Shape[], newConnectors: Connector[]) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    setHistoryIndex((currentIndex) => {
      // Remove future states if we're not at the end
      historyRef.current = historyRef.current.slice(0, currentIndex + 1);

      // Add new state
      historyRef.current.push({
        shapes: JSON.parse(JSON.stringify(newShapes)),
        connectors: JSON.parse(JSON.stringify(newConnectors)),
      });

      // Limit history size
      if (historyRef.current.length > 50) {
        historyRef.current.shift();
        return currentIndex;
      }
      return currentIndex + 1;
    });
  }, []);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;

    isUndoRedoRef.current = true;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);

    const state = historyRef.current[newIndex];
    setShapes(JSON.parse(JSON.stringify(state.shapes)));
    setConnectors(JSON.parse(JSON.stringify(state.connectors)));
    setSelectedId(null);
  }, [historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex >= historyRef.current.length - 1) return;

    isUndoRedoRef.current = true;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);

    const state = historyRef.current[newIndex];
    setShapes(JSON.parse(JSON.stringify(state.shapes)));
    setConnectors(JSON.parse(JSON.stringify(state.connectors)));
    setSelectedId(null);
  }, [historyIndex]);

  // Check if undo/redo is available
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyRef.current.length - 1;

  // Export to JSON
  const exportToJson = useCallback(() => {
    const data = {
      version: '1.0',
      shapes,
      connectors,
    };
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

  // Draw grid lines
  const drawGrid = useCallback((layer: Konva.Layer, w: number, h: number, size: number, bgColor: string) => {
    layer.destroyChildren();

    // Determine grid color based on background brightness
    const isDark = bgColor.startsWith('#') &&
      parseInt(bgColor.slice(1, 3), 16) < 128;
    const gridColor = isDark ? '#3a3a3a' : '#e5e7eb';

    for (let x = 0; x <= w; x += size) {
      layer.add(new Konva.Line({
        points: [x, 0, x, h],
        stroke: gridColor,
        strokeWidth: 1,
      }));
    }

    for (let y = 0; y <= h; y += size) {
      layer.add(new Konva.Line({
        points: [0, y, w, y],
        stroke: gridColor,
        strokeWidth: 1,
      }));
    }

    layer.batchDraw();
  }, []);

  // Add connector between shapes
  const addConnector = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;

    // Check if connector already exists
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
      // Create group for shape + text
      const group = new Konva.Group({
        id: shape.id,
        x: shape.x,
        y: shape.y,
        draggable: true,
        rotation: shape.rotation || 0,
      });

      // Create shape at origin (relative to group)
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
          konvaShape = new Konva.RegularPolygon({
            ...shapeConfig,
            x: shape.width / 2,
            y: shape.height / 2,
            sides: 4,
            radius: Math.min(shape.width, shape.height) / 2,
          });
          break;
        default:
          konvaShape = new Konva.Rect({
            ...shapeConfig,
            cornerRadius: 4,
          });
      }

      // Selection highlight (only when shape is selected, not connector)
      if (shape.id === selectedId && selectionType === 'shape') {
        konvaShape.stroke('#ef4444');
        konvaShape.strokeWidth(3);
      }

      // Highlight when connecting from this shape
      if (connectingFrom === shape.id) {
        konvaShape.stroke('#22c55e');
        konvaShape.strokeWidth(3);
      }

      group.add(konvaShape);

      // Add text label
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

      // Drag event handlers
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

      // Click to select or connect
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

      // Double click to edit text
      group.on('dblclick dbltap', () => {
        setEditingId(shape.id);
        setSelectedId(shape.id);
      });

      layer.add(group);
    });

    // Update transformer (only for shapes, not connectors)
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
      // Delete selected connector
      setConnectors((prev) => prev.filter((c) => c.id !== selectedId));
      clearSelection();
    } else {
      // Delete selected shape
      setShapes((prev) => {
        const updated = prev.filter((s) => s.id !== selectedId);
        onShapesChange?.(updated);
        return updated;
      });

      // Also delete connectors attached to this shape
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

  // Get edge intersection point for a shape (where line from center to target intersects the shape edge)
  const getShapeEdgePoint = useCallback((shape: Shape, targetPoint: { x: number; y: number }) => {
    const center = {
      x: shape.x + shape.width / 2,
      y: shape.y + shape.height / 2,
    };

    // Direction vector from center to target
    const dx = targetPoint.x - center.x;
    const dy = targetPoint.y - center.y;

    // Avoid division by zero
    if (dx === 0 && dy === 0) {
      return center;
    }

    let edgePoint = { x: center.x, y: center.y };

    switch (shape.type) {
      case 'ellipse': {
        // Ellipse intersection: parametric solution
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
        // Diamond (rotated square) intersection
        // Diamond vertices: top, right, bottom, left
        const hw = shape.width / 2;
        const hh = shape.height / 2;

        // Normalize direction
        const len = Math.sqrt(dx * dx + dy * dy);
        const ndx = dx / len;
        const ndy = dy / len;

        // Find intersection with diamond edges
        // Diamond has 4 edges, each at 45-degree angles
        // Using parametric line-segment intersection
        const absDx = Math.abs(ndx);
        const absDy = Math.abs(ndy);

        // Scale factor to reach diamond edge
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
        // Rectangle intersection
        const hw = shape.width / 2;
        const hh = shape.height / 2;

        // Calculate intersection with each edge and find the closest one
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        let t: number;
        if (absX * hh > absY * hw) {
          // Intersects left or right edge
          t = hw / absX;
        } else {
          // Intersects top or bottom edge
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

      // Get center points first
      const fromCenter = getShapeCenter(fromShape);
      const toCenter = getShapeCenter(toShape);

      // Calculate edge intersection points (arrow starts/ends at shape edges)
      const from = getShapeEdgePoint(fromShape, toCenter);
      const to = getShapeEdgePoint(toShape, fromCenter);

      // Check if this connector is selected
      const isSelected = selectedId === connector.id && selectionType === 'connector';

      const arrow = new Konva.Arrow({
        id: connector.id,
        points: [from.x, from.y, to.x, to.y],
        stroke: isSelected ? '#ef4444' : connector.stroke,
        strokeWidth: isSelected ? connector.strokeWidth + 1 : connector.strokeWidth,
        fill: isSelected ? '#ef4444' : connector.stroke,
        pointerLength: 10,
        pointerWidth: 8,
        hitStrokeWidth: 20, // Larger hit area for easier clicking
      });

      // Click to select connector
      arrow.on('click tap', (e) => {
        e.cancelBubble = true; // Prevent stage click
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

  // Reset zoom
  const resetZoom = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();
    setScale(1);
  }, []);

  // Clipboard state for copy/paste
  const clipboardRef = useRef<Shape | null>(null);
  const pasteOffsetRef = useRef(20);

  // Copy selected shape
  const copySelected = useCallback(() => {
    if (!selectedId) return;
    const shape = shapes.find((s) => s.id === selectedId);
    if (shape) {
      clipboardRef.current = { ...shape };
      pasteOffsetRef.current = 20; // Reset paste offset
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
    pasteOffsetRef.current += 20; // Increment for next paste
  }, [onShapesChange]);

  // Duplicate selected shape (Ctrl+D)
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

  // Handle escape key
  const handleEscape = useCallback(() => {
    setSelectedId(null);
    resetTool(); // Resets tool to 'select', clears connectingFrom and editingId
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
  });

  // Initialize canvas
  useEffect(() => {
    if (!containerRef.current) return;

    const stage = new Konva.Stage({
      container: containerRef.current,
      width,
      height,
    });
    stageRef.current = stage;

    // Background layer
    const bgLayer = new Konva.Layer();
    bgLayer.add(new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: backgroundColor,
    }));
    stage.add(bgLayer);

    // Grid layer
    const gridLayer = new Konva.Layer({ listening: false });
    stage.add(gridLayer);
    if (showGrid) {
      drawGrid(gridLayer, width, height, gridSize, backgroundColor);
    }

    // Connectors layer (below shapes)
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

      // Reset scale
      node.scaleX(1);
      node.scaleY(1);

      setShapes((prev) => {
        const updated = prev.map((s) => {
          if (s.id === id) {
            // Use original shape dimensions and apply scale
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

    // Stage click handler for adding shapes
    stage.on('click tap', (e) => {
      // Only on background click
      if (e.target === stage || e.target.getLayer() === bgLayer || e.target.getLayer() === gridLayer) {
        if (tool !== 'select') {
          const pos = stage.getPointerPosition();
          if (pos) {
            addShape(tool as ShapeType, pos.x, pos.y);
          }
        } else {
          setSelectedId(null);
        }
      }
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

      // Limit zoom range
      const clampedScale = Math.max(0.1, Math.min(5, newScale));

      stage.scale({ x: clampedScale, y: clampedScale });

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };

      stage.position(newPos);
      stage.batchDraw();
      setScale(clampedScale);
    });

    if (onReady) {
      onReady(stage);
    }

    return () => {
      stage.destroy();
      stageRef.current = null;
      shapesLayerRef.current = null;
      connectorsLayerRef.current = null;
      selectionLayerRef.current = null;
      transformerRef.current = null;
    };
  }, [width, height, backgroundColor, showGrid, gridSize, drawGrid, onReady]);

  // Re-render shapes when they change
  useEffect(() => {
    renderShapes();
  }, [renderShapes]);

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

  // Re-render connectors when they change
  useEffect(() => {
    renderConnectors();
  }, [renderConnectors]);

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

      const bgLayer = stage.getLayers()[0];
      const gridLayer = stage.getLayers()[1];

      if (e.target === stage || e.target.getLayer() === bgLayer || e.target.getLayer() === gridLayer) {
        if (tool === 'connector') {
          // Cancel connecting on empty click
          setConnectingFrom(null);
        } else if (tool !== 'select') {
          const pos = stage.getPointerPosition();
          if (pos) {
            // Adjust position for scale and pan
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

  // Pan with space + drag
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

    const handleDragEnd = () => {
      if (isPanning) {
        stage.container().style.cursor = 'grab';
      }
    };

    stage.on('dragstart', handleDragStart);
    stage.on('dragend', handleDragEnd);

    return () => {
      stage.off('dragstart', handleDragStart);
      stage.off('dragend', handleDragEnd);
    };
  }, [isPanning, tool]);

  // Cancel connecting - use store action directly
  const cancelConnecting = useToolStore((s) => s.cancelConnecting);

  return (
    <div className="zm-draw-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
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

      {/* Canvas */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <div
          ref={containerRef}
          className="zm-draw-canvas-container"
          style={{
            width: '100%',
            height: '100%',
            cursor: tool === 'select' ? 'default' : 'crosshair',
            borderRadius: 0,
            border: 'none',
          }}
        />

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
}
