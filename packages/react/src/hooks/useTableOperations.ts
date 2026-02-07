'use client';

import { useCallback } from 'react';
import { useEditorStore } from '../stores/editorStore';

interface UseTableOperationsOptions {
  onShapesChange?: (shapes: import('@zm-draw/core').Shape[]) => void;
}

/**
 * Hook for table shape operations (add/delete rows/columns, cell editing, etc.)
 */
export function useTableOperations(options: UseTableOperationsOptions = {}) {
  const { onShapesChange } = options;

  const shapes = useEditorStore((s) => s.shapes);
  const setShapes = useEditorStore((s) => s.setShapes);
  const setEditingId = useEditorStore((s) => s.setEditingId);
  const setEditingCell = useEditorStore((s) => s.setEditingCell);

  const updateShapeText = useCallback((id: string, text: string) => {
    const updated = shapes.map((s) => (s.id === id ? { ...s, text } : s));
    setShapes(updated);
    setEditingId(null);
    onShapesChange?.(updated);
  }, [shapes, setShapes, setEditingId, onShapesChange]);

  const updateCellText = useCallback((shapeId: string, row: number, col: number, text: string) => {
    const updated = shapes.map((s) => {
      if (s.id !== shapeId || !s.tableData) return s;
      const newCells = s.tableData.cells.map((r, ri) =>
        ri === row ? r.map((c, ci) => (ci === col ? { ...c, text } : c)) : r
      );
      return { ...s, tableData: { ...s.tableData, cells: newCells } };
    });
    setShapes(updated);
    setEditingCell(null);
    onShapesChange?.(updated);
  }, [shapes, setShapes, setEditingCell, onShapesChange]);

  const addTableRow = useCallback((shapeId: string, afterRow?: number) => {
    const updated = shapes.map((s) => {
      if (s.id !== shapeId || !s.tableData) return s;
      const insertIndex = afterRow !== undefined ? afterRow + 1 : s.tableData.rows;
      const newRow = Array(s.tableData.cols).fill(null).map(() => ({ text: '' }));
      const newCells = [
        ...s.tableData.cells.slice(0, insertIndex),
        newRow,
        ...s.tableData.cells.slice(insertIndex),
      ];
      const newRowHeights = [
        ...s.tableData.rowHeights.slice(0, insertIndex),
        40,
        ...s.tableData.rowHeights.slice(insertIndex),
      ];
      return {
        ...s,
        height: s.height + 40,
        tableData: { ...s.tableData, rows: s.tableData.rows + 1, cells: newCells, rowHeights: newRowHeights },
      };
    });
    setShapes(updated);
    onShapesChange?.(updated);
  }, [shapes, setShapes, onShapesChange]);

  const deleteTableRow = useCallback((shapeId: string, rowIndex: number) => {
    const updated = shapes.map((s) => {
      if (s.id !== shapeId || !s.tableData || s.tableData.rows <= 1) return s;
      const deletedRowHeight = s.tableData.rowHeights[rowIndex] || 40;
      const newCells = s.tableData.cells.filter((_, i) => i !== rowIndex);
      const newRowHeights = s.tableData.rowHeights.filter((_, i) => i !== rowIndex);
      return {
        ...s,
        height: s.height - deletedRowHeight,
        tableData: { ...s.tableData, rows: s.tableData.rows - 1, cells: newCells, rowHeights: newRowHeights },
      };
    });
    setShapes(updated);
    onShapesChange?.(updated);
  }, [shapes, setShapes, onShapesChange]);

  const addTableColumn = useCallback((shapeId: string, afterCol?: number) => {
    const updated = shapes.map((s) => {
      if (s.id !== shapeId || !s.tableData) return s;
      const insertIndex = afterCol !== undefined ? afterCol + 1 : s.tableData.cols;
      const newCells = s.tableData.cells.map((row) => [
        ...row.slice(0, insertIndex),
        { text: '' },
        ...row.slice(insertIndex),
      ]);
      const newColWidths = [
        ...s.tableData.colWidths.slice(0, insertIndex),
        100,
        ...s.tableData.colWidths.slice(insertIndex),
      ];
      return {
        ...s,
        width: s.width + 100,
        tableData: { ...s.tableData, cols: s.tableData.cols + 1, cells: newCells, colWidths: newColWidths },
      };
    });
    setShapes(updated);
    onShapesChange?.(updated);
  }, [shapes, setShapes, onShapesChange]);

  const deleteTableColumn = useCallback((shapeId: string, colIndex: number) => {
    const updated = shapes.map((s) => {
      if (s.id !== shapeId || !s.tableData || s.tableData.cols <= 1) return s;
      const deletedColWidth = s.tableData.colWidths[colIndex] || 100;
      const newCells = s.tableData.cells.map((row) => row.filter((_, i) => i !== colIndex));
      const newColWidths = s.tableData.colWidths.filter((_, i) => i !== colIndex);
      return {
        ...s,
        width: s.width - deletedColWidth,
        tableData: { ...s.tableData, cols: s.tableData.cols - 1, cells: newCells, colWidths: newColWidths },
      };
    });
    setShapes(updated);
    onShapesChange?.(updated);
  }, [shapes, setShapes, onShapesChange]);

  const toggleTableHeaderRow = useCallback((shapeId: string) => {
    const updated = shapes.map((s) => {
      if (s.id !== shapeId || !s.tableData) return s;
      return { ...s, tableData: { ...s.tableData, headerRow: !s.tableData.headerRow } };
    });
    setShapes(updated);
    onShapesChange?.(updated);
  }, [shapes, setShapes, onShapesChange]);

  const setCellBackground = useCallback((shapeId: string, row: number, col: number, color: string) => {
    const updated = shapes.map((s) => {
      if (s.id !== shapeId || !s.tableData) return s;
      const newCells = s.tableData.cells.map((r, ri) =>
        ri === row ? r.map((c, ci) => (ci === col ? { ...c, fill: color } : c)) : r
      );
      return { ...s, tableData: { ...s.tableData, cells: newCells } };
    });
    setShapes(updated);
    onShapesChange?.(updated);
  }, [shapes, setShapes, onShapesChange]);

  return {
    updateShapeText,
    updateCellText,
    addTableRow,
    deleteTableRow,
    addTableColumn,
    deleteTableColumn,
    toggleTableHeaderRow,
    setCellBackground,
  };
}
