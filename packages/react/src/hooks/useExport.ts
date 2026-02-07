'use client';

import { useCallback } from 'react';
import Konva from 'konva';
import type { Shape, Connector } from '@zm-draw/core';
import { generateSVG } from '@zm-draw/core';
import { useEditorStore } from '../stores/editorStore';

export interface UseExportOptions {
  stageRef: React.RefObject<Konva.Stage | null>;
  shapesLayerRef: React.RefObject<Konva.Layer | null>;
  bgLayerRef: React.RefObject<Konva.Layer | null>;
  gridLayerRef: React.RefObject<Konva.Layer | null>;
  guidesLayerRef: React.RefObject<Konva.Layer | null>;
  selectionLayerRef: React.RefObject<Konva.Layer | null>;
  connectionPointsLayerRef: React.RefObject<Konva.Layer | null>;
  onShapesChange?: (shapes: Shape[]) => void;
}

export function useExport(options: UseExportOptions) {
  const {
    stageRef,
    shapesLayerRef,
    bgLayerRef,
    gridLayerRef,
    guidesLayerRef,
    selectionLayerRef,
    connectionPointsLayerRef,
    onShapesChange,
  } = options;

  const shapes = useEditorStore((s) => s.shapes);
  const connectors = useEditorStore((s) => s.connectors);

  /**
   * Export canvas content to PNG.
   * Temporarily adjusts stage transform and hides non-content layers
   * to capture only the shapes at 2x pixel ratio.
   */
  const exportToPNG = useCallback(
    (filename: string = 'canvas.png') => {
      const stage = stageRef.current;
      const layer = shapesLayerRef.current;
      if (!stage || !layer) return;

      // Calculate bounds of all visible shapes
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

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

      const exportWidth = maxX - minX;
      const exportHeight = maxY - minY;

      if (exportWidth <= 0 || exportHeight <= 0) return;

      // Save current transform
      const currentScale = stage.scaleX();
      const currentPosition = stage.position();

      // Reset transform for export (1:1 scale, offset to content origin)
      stage.scale({ x: 1, y: 1 });
      stage.position({ x: -minX, y: -minY });

      // Hide non-content layers for clean export
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

      // Redraw with hidden layers
      stage.batchDraw();

      let dataURL: string;
      try {
        // Export to data URL at 2x pixel ratio for retina quality
        dataURL = stage.toDataURL({
          x: 0,
          y: 0,
          width: exportWidth,
          height: exportHeight,
          pixelRatio: 2,
        });
      } finally {
        // Restore layers visibility (always runs even if toDataURL throws)
        gridLayer?.visible(gridVisible);
        bgLayer?.visible(bgVisible);
        guidesLayer?.visible(guidesVisible);
        selectionLayer?.visible(selectionVisible);
        connectionPointsLayer?.visible(connectionPointsVisible);

        // Restore original transform
        stage.scale({ x: currentScale, y: currentScale });
        stage.position(currentPosition);
        stage.batchDraw();
      }

      // Download the image via temporary anchor element
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [shapes, stageRef, shapesLayerRef, bgLayerRef, gridLayerRef, guidesLayerRef, selectionLayerRef, connectionPointsLayerRef]
  );

  /**
   * Export canvas content to SVG using the core generateSVG utility.
   */
  const exportToSVG = useCallback(
    (filename: string = 'canvas.svg') => {
      const svgString = generateSVG(shapes, connectors);
      if (!svgString) return;

      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    [shapes, connectors]
  );

  /**
   * Export current shapes and connectors to a JSON file.
   */
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

  /**
   * Open a file dialog to import shapes and connectors from a JSON file.
   * Replaces the current canvas content with the imported data.
   */
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
          const storeState = useEditorStore.getState();

          if (data.shapes && Array.isArray(data.shapes)) {
            storeState.setShapes(data.shapes);
            onShapesChange?.(data.shapes);
          }
          if (data.connectors && Array.isArray(data.connectors)) {
            storeState.setConnectors(data.connectors);
          }

          // Clear selection after import
          storeState.clearSelection();
        } catch (err) {
          console.error('Failed to parse JSON:', err);
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [onShapesChange]);

  return { exportToPNG, exportToSVG, exportToJson, importFromJson };
}
