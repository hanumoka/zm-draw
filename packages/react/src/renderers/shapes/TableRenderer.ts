import Konva from 'konva';
import type { Shape } from '@zm-draw/core';
import type { ShapeRenderer, ShapeRendererContext } from '../ShapeRendererRegistry';

export const TableRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // Table shape - grid of cells with text
    const tableGroup = new Konva.Group();
    const data = shape.tableData;
    if (data) {
      let yOffset = 0;
      for (let row = 0; row < data.rows; row++) {
        let xOffset = 0;
        const rowHeight = data.rowHeights[row] || 40;
        for (let col = 0; col < data.cols; col++) {
          const colWidth = data.colWidths[col] || 100;
          const cell = data.cells[row]?.[col] || { text: '' };
          // Cell background
          const isHeader = row === 0 && data.headerRow;
          const cellRect = new Konva.Rect({
            x: xOffset,
            y: yOffset,
            width: colWidth,
            height: rowHeight,
            fill: cell.fill || (isHeader ? '#f3f4f6' : '#ffffff'),
            stroke: shape.stroke,
            strokeWidth: shape.strokeWidth,
          });
          tableGroup.add(cellRect);
          // Cell text
          if (cell.text) {
            const cellText = new Konva.Text({
              x: xOffset + 8,
              y: yOffset + 4,
              width: colWidth - 16,
              height: rowHeight - 8,
              text: cell.text,
              fontSize: shape.fontSize || 14,
              fontFamily: shape.fontFamily || 'Arial',
              fill: cell.textColor || shape.textColor || '#1e1e1e',
              align: cell.textAlign || 'left',
              verticalAlign: 'middle',
              listening: false,
            });
            tableGroup.add(cellText);
          }
          xOffset += colWidth;
        }
        yOffset += rowHeight;
      }
    }
    group.add(tableGroup);
    // Transparent hit detection rect
    return new Konva.Rect({
      x: 0,
      y: 0,
      width: shape.width,
      height: shape.height,
      fill: 'transparent',
    });
  },
};
