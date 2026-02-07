'use client';

import { useCallback } from 'react';
import type {
  Shape,
  ShapeType,
  StampType,
  SectionColor,
} from '@zm-draw/core';
import {
  generateId,
  defaultShapeProps,
  defaultTextShapeProps,
  defaultStickyNoteProps,
  defaultStampProps,
  defaultSectionProps,
  defaultTableProps,
  defaultMindmapProps,
  defaultEmbedProps,
  STICKY_COLORS,
  SECTION_COLORS,
  tidyUp,
} from '@zm-draw/core';
import type { TidyUpLayout } from '@zm-draw/core';
import { useEditorStore } from '../stores/editorStore';

export interface UseShapesOptions {
  snapToGridValue?: (value: number) => number;
  onShapesChange?: (shapes: Shape[]) => void;
  setAnnouncement?: (text: string) => void;
}

/** Shape name mapping for screen reader announcements */
const SHAPE_NAMES: Record<string, string> = {
  rectangle: 'Rectangle',
  ellipse: 'Ellipse',
  diamond: 'Diamond',
  text: 'Text',
  sticky: 'Sticky note',
  table: 'Table',
  mindmap: 'Mind map',
  embed: 'Link preview',
  section: 'Section',
  stamp: 'Stamp',
  triangle: 'Triangle',
  triangleDown: 'Triangle down',
  pentagon: 'Pentagon',
  hexagon: 'Hexagon',
  star: 'Star',
  cross: 'Cross',
  roundedRectangle: 'Rounded rectangle',
  parallelogram: 'Parallelogram',
  database: 'Database',
  document: 'Document',
};

export function useShapes(options: UseShapesOptions = {}) {
  const {
    snapToGridValue = (v: number) => v,
    onShapesChange,
    setAnnouncement,
  } = options;

  const store = useEditorStore();

  const shapes = store.shapes;

  const addShape = useCallback(
    (
      type: ShapeType,
      x: number,
      y: number,
      shapeOptions?: { stampType?: StampType; sectionColor?: SectionColor }
    ) => {
      const storeState = useEditorStore.getState();
      const { currentStickyColor, currentStampType } = storeState;

      // Determine type-specific default properties
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
          stampType: shapeOptions?.stampType || currentStampType,
        };
      } else if (type === 'section') {
        const color = shapeOptions?.sectionColor || 'gray';
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
          cornerRadius: 12,
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

      // Add shape to store
      storeState.addShape(newShape);

      // Select the new shape
      storeState.select(newShape.id);

      // For text and sticky shapes, immediately open the editor
      if (type === 'text' || type === 'sticky') {
        storeState.setEditingId(newShape.id);
      }

      // Switch back to select tool
      storeState.setTool('select');

      // Notify external callback
      const updatedShapes = useEditorStore.getState().shapes;
      onShapesChange?.(updatedShapes);

      // Announce to screen readers
      setAnnouncement?.(`${SHAPE_NAMES[type] || type} added`);
    },
    [snapToGridValue, onShapesChange, setAnnouncement]
  );

  const deleteSelected = useCallback(() => {
    const storeState = useEditorStore.getState();
    const { selectedIds, selectionType } = storeState;

    if (selectedIds.length === 0) return;

    if (selectionType === 'connector') {
      // Delete single connector
      storeState.deleteConnector(selectedIds[0]);
      storeState.clearSelection();
      setAnnouncement?.('Connector deleted');
    } else {
      // Delete all selected shapes
      const count = selectedIds.length;

      // Delete each selected shape (this also removes associated connectors)
      for (const id of selectedIds) {
        storeState.deleteShape(id);
      }

      storeState.clearSelection();

      // Notify external callback
      const updatedShapes = useEditorStore.getState().shapes;
      onShapesChange?.(updatedShapes);

      setAnnouncement?.(`${count} shape${count > 1 ? 's' : ''} deleted`);
    }
  }, [onShapesChange, setAnnouncement]);

  const clearAll = useCallback(() => {
    const storeState = useEditorStore.getState();
    storeState.clearAll();
    onShapesChange?.([]);
  }, [onShapesChange]);

  const handleTidyUp = useCallback(
    (layout: TidyUpLayout) => {
      const storeState = useEditorStore.getState();
      const { selectedIds, shapes: currentShapes } = storeState;

      if (selectedIds.length < 2) return;

      // Get selected shapes
      const selectedShapes = currentShapes.filter((s) =>
        selectedIds.includes(s.id)
      );
      if (selectedShapes.length < 2) return;

      // Apply tidy up layout
      const tidiedShapes = tidyUp(selectedShapes, { layout });

      // Update shapes with new positions
      const updatedShapes = currentShapes.map((shape) => {
        const tidied = tidiedShapes.find((t) => t.id === shape.id);
        return tidied || shape;
      });

      storeState.setShapes(updatedShapes);
      onShapesChange?.(updatedShapes);
    },
    [onShapesChange]
  );

  const updateShape = useCallback(
    (id: string, updates: Partial<Shape>) => {
      const storeState = useEditorStore.getState();
      storeState.updateShape(id, updates);

      const updatedShapes = useEditorStore.getState().shapes;
      onShapesChange?.(updatedShapes);
    },
    [onShapesChange]
  );

  const updateShapeText = useCallback(
    (id: string, text: string) => {
      const storeState = useEditorStore.getState();
      storeState.updateShape(id, { text });

      onShapesChange?.(
        storeState.shapes.map((s) => (s.id === id ? { ...s, text } : s))
      );
    },
    [onShapesChange]
  );

  const setShapes = useCallback(
    (newShapes: Shape[]) => {
      const storeState = useEditorStore.getState();
      storeState.setShapes(newShapes);
      onShapesChange?.(newShapes);
    },
    [onShapesChange]
  );

  return {
    shapes,
    addShape,
    deleteSelected,
    clearAll,
    handleTidyUp,
    updateShape,
    updateShapeText,
    setShapes,
  };
}
