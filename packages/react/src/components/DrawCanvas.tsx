'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import Konva from 'konva';
import type { Shape, ShapeType, ToolType, Connector } from '../types';

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
}: DrawCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const shapesLayerRef = useRef<Konva.Layer | null>(null);

  const [shapes, setShapes] = useState<Shape[]>(initialShapes);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<ToolType>('select');
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const connectorsLayerRef = useRef<Konva.Layer | null>(null);
  const selectionLayerRef = useRef<Konva.Layer | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);

  // Draw grid lines
  const drawGrid = useCallback((layer: Konva.Layer, w: number, h: number, size: number) => {
    layer.destroyChildren();

    for (let x = 0; x <= w; x += size) {
      layer.add(new Konva.Line({
        points: [x, 0, x, h],
        stroke: '#e5e7eb',
        strokeWidth: 1,
      }));
    }

    for (let y = 0; y <= h; y += size) {
      layer.add(new Konva.Line({
        points: [0, y, w, y],
        stroke: '#e5e7eb',
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

  // Create Konva shape from Shape data
  const createKonvaShape = useCallback((shape: Shape): Konva.Shape => {
    let konvaShape: Konva.Shape;

    const baseConfig = {
      id: shape.id,
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      draggable: true,
      rotation: shape.rotation || 0,
    };

    switch (shape.type) {
      case 'ellipse':
        konvaShape = new Konva.Ellipse({
          ...baseConfig,
          radiusX: shape.width / 2,
          radiusY: shape.height / 2,
          offsetX: -shape.width / 2,
          offsetY: -shape.height / 2,
        });
        break;
      case 'diamond':
        konvaShape = new Konva.RegularPolygon({
          ...baseConfig,
          sides: 4,
          radius: Math.min(shape.width, shape.height) / 2,
          offsetX: -shape.width / 2,
          offsetY: -shape.height / 2,
        });
        break;
      default:
        konvaShape = new Konva.Rect({
          ...baseConfig,
          cornerRadius: 4,
        });
    }

    return konvaShape;
  }, []);

  // Render all shapes to the layer
  const renderShapes = useCallback(() => {
    const layer = shapesLayerRef.current;
    if (!layer) return;

    layer.destroyChildren();

    shapes.forEach((shape) => {
      const konvaShape = createKonvaShape(shape);

      // Selection highlight
      if (shape.id === selectedId) {
        konvaShape.stroke('#ef4444');
        konvaShape.strokeWidth(3);
      }

      // Drag event handlers
      konvaShape.on('dragend', (e) => {
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
      konvaShape.on('click tap', () => {
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

      // Highlight when connecting from this shape
      if (connectingFrom === shape.id) {
        konvaShape.stroke('#22c55e');
        konvaShape.strokeWidth(3);
      }

      layer.add(konvaShape);
    });

    // Update transformer
    const transformer = transformerRef.current;
    if (transformer && selectedId) {
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
  }, [shapes, selectedId, createKonvaShape, onShapesChange, tool, connectingFrom, addConnector]);

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

  // Delete selected shape
  const deleteSelected = useCallback(() => {
    if (!selectedId) return;

    setShapes((prev) => {
      const updated = prev.filter((s) => s.id !== selectedId);
      onShapesChange?.(updated);
      return updated;
    });

    // Also delete connectors attached to this shape
    setConnectors((prev) =>
      prev.filter((c) => c.fromShapeId !== selectedId && c.toShapeId !== selectedId)
    );

    setSelectedId(null);
  }, [selectedId, onShapesChange]);

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

  // Render connectors
  const renderConnectors = useCallback(() => {
    const layer = connectorsLayerRef.current;
    if (!layer) return;

    layer.destroyChildren();

    connectors.forEach((connector) => {
      const fromShape = shapes.find((s) => s.id === connector.fromShapeId);
      const toShape = shapes.find((s) => s.id === connector.toShapeId);

      if (!fromShape || !toShape) return;

      const from = getShapeCenter(fromShape);
      const to = getShapeCenter(toShape);

      const arrow = new Konva.Arrow({
        id: connector.id,
        points: [from.x, from.y, to.x, to.y],
        stroke: connector.stroke,
        strokeWidth: connector.strokeWidth,
        fill: connector.stroke,
        pointerLength: 10,
        pointerWidth: 8,
      });

      layer.add(arrow);
    });

    layer.batchDraw();
  }, [connectors, shapes, getShapeCenter]);

  // Reset zoom
  const resetZoom = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();
    setScale(1);
  }, []);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (e.key === 'Backspace' && document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
        }
        deleteSelected();
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setConnectingFrom(null);
        setTool('select');
      } else if (e.code === 'Space' && !isPanning) {
        e.preventDefault();
        setIsPanning(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [deleteSelected, isPanning]);

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
      drawGrid(gridLayer, width, height, gridSize);
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

      // Reset scale and apply to width/height
      node.scaleX(1);
      node.scaleY(1);

      setShapes((prev) => {
        const updated = prev.map((s) => {
          if (s.id === id) {
            return {
              ...s,
              x: node.x(),
              y: node.y(),
              width: Math.max(20, node.width() * scaleX),
              height: Math.max(20, node.height() * scaleY),
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

  // Re-render connectors when they change
  useEffect(() => {
    renderConnectors();
  }, [renderConnectors]);

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

  return (
    <div className="zm-draw-wrapper">
      {/* Toolbar */}
      <div className="zm-draw-toolbar" style={{ marginBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => setTool('select')}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            backgroundColor: tool === 'select' ? '#3b82f6' : '#fff',
            color: tool === 'select' ? '#fff' : '#374151',
            cursor: 'pointer',
          }}
        >
          Select
        </button>
        <button
          onClick={() => setTool('rectangle')}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            backgroundColor: tool === 'rectangle' ? '#3b82f6' : '#fff',
            color: tool === 'rectangle' ? '#fff' : '#374151',
            cursor: 'pointer',
          }}
        >
          Rectangle
        </button>
        <button
          onClick={() => setTool('ellipse')}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            backgroundColor: tool === 'ellipse' ? '#3b82f6' : '#fff',
            color: tool === 'ellipse' ? '#fff' : '#374151',
            cursor: 'pointer',
          }}
        >
          Ellipse
        </button>
        <button
          onClick={() => setTool('diamond')}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            backgroundColor: tool === 'diamond' ? '#3b82f6' : '#fff',
            color: tool === 'diamond' ? '#fff' : '#374151',
            cursor: 'pointer',
          }}
        >
          Diamond
        </button>
        <button
          onClick={() => { setTool('connector'); setConnectingFrom(null); }}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            backgroundColor: tool === 'connector' ? '#22c55e' : '#fff',
            color: tool === 'connector' ? '#fff' : '#374151',
            cursor: 'pointer',
          }}
        >
          {connectingFrom ? 'Click target...' : 'Connector'}
        </button>

        <div style={{ width: 1, backgroundColor: '#d1d5db', margin: '0 4px' }} />

        <button
          onClick={deleteSelected}
          disabled={!selectedId}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            backgroundColor: selectedId ? '#ef4444' : '#f3f4f6',
            color: selectedId ? '#fff' : '#9ca3af',
            cursor: selectedId ? 'pointer' : 'not-allowed',
          }}
        >
          Delete
        </button>
        <button
          onClick={clearAll}
          disabled={shapes.length === 0}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            backgroundColor: shapes.length > 0 ? '#fff' : '#f3f4f6',
            color: shapes.length > 0 ? '#374151' : '#9ca3af',
            cursor: shapes.length > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          Clear All
        </button>

        <div style={{ width: 1, backgroundColor: '#d1d5db', margin: '0 4px' }} />

        <span style={{ padding: '8px 12px', color: '#6b7280', fontSize: 14 }}>
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={resetZoom}
          disabled={scale === 1}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            backgroundColor: scale !== 1 ? '#fff' : '#f3f4f6',
            color: scale !== 1 ? '#374151' : '#9ca3af',
            cursor: scale !== 1 ? 'pointer' : 'not-allowed',
          }}
        >
          Reset Zoom
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="zm-draw-canvas-container"
        style={{ width, height, cursor: tool === 'select' ? 'default' : 'crosshair' }}
      />
    </div>
  );
}
