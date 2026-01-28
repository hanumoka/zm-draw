'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import type { Shape, Connector } from '../types';

export interface MinimapProps {
  /** Shapes to display */
  shapes: Shape[];
  /** Connectors to display */
  connectors?: Connector[];
  /** Current viewport scale */
  scale: number;
  /** Current viewport position */
  position: { x: number; y: number };
  /** Canvas size */
  canvasSize: { width: number; height: number };
  /** Callback when viewport position changes */
  onViewportChange?: (position: { x: number; y: number }) => void;
  /** Minimap width */
  width?: number;
  /** Minimap height */
  height?: number;
  /** Background color */
  backgroundColor?: string;
  /** Shape fill color */
  shapeFillColor?: string;
  /** Viewport indicator color */
  viewportColor?: string;
}

/**
 * Minimap component showing a bird's eye view of the canvas
 */
export function Minimap({
  shapes,
  connectors = [],
  scale,
  position,
  canvasSize,
  onViewportChange,
  width = 150,
  height = 100,
  backgroundColor = '#1a1a1a',
  shapeFillColor = '#4a5568',
  viewportColor = 'rgba(59, 130, 246, 0.5)',
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate bounds of all shapes
  const getBounds = useCallback(() => {
    if (shapes.length === 0) {
      return { minX: 0, minY: 0, maxX: canvasSize.width, maxY: canvasSize.height };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    shapes.forEach((shape) => {
      if (shape.visible === false) return;
      minX = Math.min(minX, shape.x);
      minY = Math.min(minY, shape.y);
      maxX = Math.max(maxX, shape.x + shape.width);
      maxY = Math.max(maxY, shape.y + shape.height);
    });

    if (minX === Infinity) {
      return { minX: 0, minY: 0, maxX: canvasSize.width, maxY: canvasSize.height };
    }

    // Add padding
    const padding = 100;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    // Include viewport in bounds
    const viewportLeft = -position.x / scale;
    const viewportTop = -position.y / scale;
    const viewportRight = viewportLeft + canvasSize.width / scale;
    const viewportBottom = viewportTop + canvasSize.height / scale;

    minX = Math.min(minX, viewportLeft);
    minY = Math.min(minY, viewportTop);
    maxX = Math.max(maxX, viewportRight);
    maxY = Math.max(maxY, viewportBottom);

    return { minX, minY, maxX, maxY };
  }, [shapes, scale, position, canvasSize]);

  // Render minimap
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bounds = getBounds();
    const boundsWidth = bounds.maxX - bounds.minX;
    const boundsHeight = bounds.maxY - bounds.minY;

    // Calculate scale to fit bounds in minimap
    const scaleX = width / boundsWidth;
    const scaleY = height / boundsHeight;
    const minimapScale = Math.min(scaleX, scaleY) * 0.9;

    // Center offset
    const offsetX = (width - boundsWidth * minimapScale) / 2 - bounds.minX * minimapScale;
    const offsetY = (height - boundsHeight * minimapScale) / 2 - bounds.minY * minimapScale;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw shapes
    ctx.fillStyle = shapeFillColor;
    shapes.forEach((shape) => {
      if (shape.visible === false) return;

      const x = shape.x * minimapScale + offsetX;
      const y = shape.y * minimapScale + offsetY;
      const w = shape.width * minimapScale;
      const h = shape.height * minimapScale;

      ctx.beginPath();
      switch (shape.type) {
        case 'ellipse':
          ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          break;
        case 'diamond':
          ctx.moveTo(x + w / 2, y);
          ctx.lineTo(x + w, y + h / 2);
          ctx.lineTo(x + w / 2, y + h);
          ctx.lineTo(x, y + h / 2);
          ctx.closePath();
          break;
        default:
          ctx.rect(x, y, w, h);
      }
      ctx.fill();
    });

    // Draw connectors
    ctx.strokeStyle = shapeFillColor;
    ctx.lineWidth = 1;
    connectors.forEach((connector) => {
      const fromShape = shapes.find(s => s.id === connector.fromShapeId);
      const toShape = shapes.find(s => s.id === connector.toShapeId);
      if (!fromShape || !toShape) return;

      const fromX = (fromShape.x + fromShape.width / 2) * minimapScale + offsetX;
      const fromY = (fromShape.y + fromShape.height / 2) * minimapScale + offsetY;
      const toX = (toShape.x + toShape.width / 2) * minimapScale + offsetX;
      const toY = (toShape.y + toShape.height / 2) * minimapScale + offsetY;

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
    });

    // Draw viewport indicator
    const viewportLeft = -position.x / scale;
    const viewportTop = -position.y / scale;
    const viewportWidth = canvasSize.width / scale;
    const viewportHeight = canvasSize.height / scale;

    const vpX = viewportLeft * minimapScale + offsetX;
    const vpY = viewportTop * minimapScale + offsetY;
    const vpW = viewportWidth * minimapScale;
    const vpH = viewportHeight * minimapScale;

    ctx.fillStyle = viewportColor;
    ctx.fillRect(vpX, vpY, vpW, vpH);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(vpX, vpY, vpW, vpH);

    // Store transform info for click handling
    (canvas as any)._minimapTransform = {
      scale: minimapScale,
      offsetX,
      offsetY,
      bounds,
    };
  }, [shapes, connectors, scale, position, canvasSize, width, height, backgroundColor, shapeFillColor, viewportColor, getBounds]);

  // Handle click/drag on minimap
  const handleMouseEvent = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onViewportChange) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const transform = (canvas as any)._minimapTransform;
    if (!transform) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert minimap coordinates to canvas coordinates
    const canvasX = (x - transform.offsetX) / transform.scale;
    const canvasY = (y - transform.offsetY) / transform.scale;

    // Calculate new position (center viewport on click)
    const newX = -(canvasX - canvasSize.width / scale / 2) * scale;
    const newY = -(canvasY - canvasSize.height / scale / 2) * scale;

    onViewportChange({ x: newX, y: newY });
  }, [onViewportChange, scale, canvasSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    handleMouseEvent(e);
  }, [handleMouseEvent]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      handleMouseEvent(e);
    }
  }, [isDragging, handleMouseEvent]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Re-render when dependencies change
  useEffect(() => {
    render();
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        borderRadius: '4px',
        cursor: 'crosshair',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
}
