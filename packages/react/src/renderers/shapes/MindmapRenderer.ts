import Konva from 'konva';
import type { Shape, MindmapNode } from '@zm-draw/core';
import type { ShapeRenderer, ShapeRendererContext } from '../ShapeRendererRegistry';

export const MindmapRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // Mindmap with nodes and connections
    const mindmapGroup = new Konva.Group();
    const data = shape.mindmapData;

    if (data) {
      // Node dimensions
      const nodeHeight = 32;
      const nodePadding = 12;
      const nodeRadius = 8;

      // Colors for different levels
      const levelColors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

      // Calculate node positions recursively
      interface NodePosition {
        node: typeof data.root;
        x: number;
        y: number;
        level: number;
      }

      const positions: NodePosition[] = [];

      const calculatePositions = (
        node: typeof data.root,
        x: number,
        y: number,
        level: number,
        parentY: number | null
      ): { minY: number; maxY: number } => {
        const children = node.children || [];
        const childCount = children.length;

        if (childCount === 0) {
          positions.push({ node, x, y, level });
          return { minY: y, maxY: y };
        }

        // Calculate children positions first
        let currentY = y - ((childCount - 1) * (nodeHeight + data.nodeSpacing)) / 2;
        let minY = currentY;
        let maxY = currentY;

        children.forEach((child: MindmapNode) => {
          const childX = x + data.levelSpacing;
          const result = calculatePositions(child, childX, currentY, level + 1, y);
          minY = Math.min(minY, result.minY);
          maxY = Math.max(maxY, result.maxY);
          currentY += nodeHeight + data.nodeSpacing;
        });

        // Center parent vertically with children
        const centerY = (minY + maxY) / 2;
        positions.push({ node, x, y: centerY, level });

        return { minY, maxY };
      };

      calculatePositions(data.root, 20, shape.height / 2, 0, null);

      // Draw connections first (behind nodes)
      positions.forEach((pos) => {
        const children = pos.node.children || [];
        children.forEach((child: MindmapNode) => {
          const childPos = positions.find((p) => p.node.id === child.id);
          if (childPos) {
            const parentWidth = Math.max(60, pos.node.text.length * 8 + nodePadding * 2);
            const connectionLine = new Konva.Line({
              points: [
                pos.x + parentWidth,
                pos.y + nodeHeight / 2,
                childPos.x,
                childPos.y + nodeHeight / 2,
              ],
              stroke: '#d1d5db',
              strokeWidth: 2,
              listening: false,
            });
            mindmapGroup.add(connectionLine);
          }
        });
      });

      // Draw nodes
      positions.forEach((pos) => {
        const nodeWidth = Math.max(60, pos.node.text.length * 8 + nodePadding * 2);
        const nodeColor = pos.node.color || levelColors[pos.level % levelColors.length];

        // Node background
        const nodeRect = new Konva.Rect({
          x: pos.x,
          y: pos.y,
          width: nodeWidth,
          height: nodeHeight,
          fill: nodeColor,
          cornerRadius: nodeRadius,
          listening: false,
        });
        mindmapGroup.add(nodeRect);

        // Node text
        const nodeText = new Konva.Text({
          x: pos.x + nodePadding,
          y: pos.y + 4,
          width: nodeWidth - nodePadding * 2,
          height: nodeHeight - 8,
          text: pos.node.text,
          fontSize: 14,
          fontFamily: 'Arial',
          fill: '#ffffff',
          align: 'center',
          verticalAlign: 'middle',
          listening: false,
        });
        mindmapGroup.add(nodeText);
      });
    }
    group.add(mindmapGroup);
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
