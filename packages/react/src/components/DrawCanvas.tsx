'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import Konva from 'konva';
import type { Shape, ShapeType, ToolType } from '../types';

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<ToolType>('select');

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

      // Click to select
      konvaShape.on('click tap', () => {
        setSelectedId(shape.id);
      });

      layer.add(konvaShape);
    });

    layer.batchDraw();
  }, [shapes, selectedId, createKonvaShape, onShapesChange]);

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

    // Shapes layer
    const shapesLayer = new Konva.Layer();
    stage.add(shapesLayer);
    shapesLayerRef.current = shapesLayer;

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

    if (onReady) {
      onReady(stage);
    }

    return () => {
      stage.destroy();
      stageRef.current = null;
      shapesLayerRef.current = null;
    };
  }, [width, height, backgroundColor, showGrid, gridSize, drawGrid, onReady]);

  // Re-render shapes when they change
  useEffect(() => {
    renderShapes();
  }, [renderShapes]);

  // Update click handler when tool changes
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.off('click tap');
    stage.on('click tap', (e) => {
      const bgLayer = stage.getLayers()[0];
      const gridLayer = stage.getLayers()[1];

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
  }, [tool, addShape]);

  return (
    <div className="zm-draw-wrapper">
      {/* Toolbar */}
      <div className="zm-draw-toolbar" style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
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
