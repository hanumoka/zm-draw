'use client';

import { useRef, useEffect } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import type { CanvasConfig } from '@zm-draw/core';

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
  /** Callback when canvas is ready */
  onReady?: (stage: Konva.Stage) => void;
}

/**
 * Main drawing canvas component
 */
export function DrawCanvas({
  width = 800,
  height = 600,
  backgroundColor = '#ffffff',
  showGrid = true,
  gridSize = 20,
  onReady,
}: DrawCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    if (stageRef.current && onReady) {
      onReady(stageRef.current);
    }
  }, [onReady]);

  return (
    <div className="zm-draw-canvas-container">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        style={{ backgroundColor }}
      >
        {/* Background layer */}
        <Layer>
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill={backgroundColor}
          />
        </Layer>

        {/* Grid layer (TODO: implement grid) */}
        {showGrid && (
          <Layer listening={false}>
            {/* Grid lines will be rendered here */}
          </Layer>
        )}

        {/* Shapes layer */}
        <Layer>
          {/* Shapes will be rendered here */}
        </Layer>

        {/* Connectors layer */}
        <Layer>
          {/* Connectors will be rendered here */}
        </Layer>

        {/* Selection layer */}
        <Layer>
          {/* Selection handles will be rendered here */}
        </Layer>
      </Stage>
    </div>
  );
}
