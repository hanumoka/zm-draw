import type { Shape, Connector } from '../types';
import { STAMP_EMOJIS } from '../constants/colors';
import { getShapeCenter } from '../geometry/edge-point';

/**
 * Escape XML special characters in text
 */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Calculate bounding box of visible shapes (with padding)
 */
function calculateBounds(shapes: Shape[], padding: number = 20): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  shapes.forEach((shape) => {
    if (shape.visible === false) return;
    minX = Math.min(minX, shape.x);
    minY = Math.min(minY, shape.y);
    maxX = Math.max(maxX, shape.x + shape.width);
    maxY = Math.max(maxY, shape.y + shape.height);
  });

  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const width = maxX - minX;
  const height = maxY - minY;

  if (width <= 0 || height <= 0) return null;

  return { minX, minY, maxX, maxY, width, height };
}

/**
 * Render a single shape to SVG string
 */
function renderShapeToSVG(shape: Shape): string {
  if (shape.visible === false) return '';

  const opacity = shape.opacity ?? 1;
  const transform = shape.rotation ? ` transform="rotate(${shape.rotation} ${shape.x + shape.width / 2} ${shape.y + shape.height / 2})"` : '';
  let svg = '';

  switch (shape.type) {
    case 'rectangle':
      svg += `  <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" rx="${shape.cornerRadius ?? 0}" opacity="${opacity}"${transform} />\n`;
      break;
    case 'ellipse':
      svg += `  <ellipse cx="${shape.x + shape.width / 2}" cy="${shape.y + shape.height / 2}" rx="${shape.width / 2}" ry="${shape.height / 2}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
      break;
    case 'diamond': {
      const cx = shape.x + shape.width / 2;
      const cy = shape.y + shape.height / 2;
      const points = `${cx},${shape.y} ${shape.x + shape.width},${cy} ${cx},${shape.y + shape.height} ${shape.x},${cy}`;
      svg += `  <polygon points="${points}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
      break;
    }
    case 'text': {
      const textContent = escapeXml(shape.text || 'Text');
      const fontSize = shape.fontSize || 16;
      const textColor = shape.textColor || shape.fill || '#000000';
      svg += `  <text x="${shape.x}" y="${shape.y + fontSize}" font-size="${fontSize}" font-family="${shape.fontFamily || 'Arial'}" fill="${textColor}" opacity="${opacity}"${transform}>${textContent}</text>\n`;
      break;
    }
    case 'image':
      if (shape.src) {
        svg += `  <image x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" href="${shape.src}" preserveAspectRatio="${shape.preserveAspectRatio ? 'xMidYMid meet' : 'none'}" opacity="${opacity}"${transform} />\n`;
      }
      break;
    case 'stamp': {
      const emoji = STAMP_EMOJIS[shape.stampType || 'thumbsUp'];
      const fontSize = Math.min(shape.width, shape.height) * 0.8;
      const centerX = shape.x + shape.width / 2;
      const centerY = shape.y + shape.height / 2;
      svg += `  <text x="${centerX}" y="${centerY}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central" opacity="${opacity}"${transform}>${emoji}</text>\n`;
      break;
    }
    case 'section': {
      const sectionTitle = escapeXml(shape.sectionTitle || 'Section');
      svg += `  <g${transform}>\n`;
      svg += `    <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" rx="${shape.cornerRadius ?? 8}" opacity="${opacity}" />\n`;
      svg += `    <text x="${shape.x + 12}" y="${shape.y - 8}" font-size="14" font-family="Arial" font-weight="bold" fill="#6b7280">${sectionTitle}</text>\n`;
      svg += `  </g>\n`;
      break;
    }
    case 'table': {
      const tableData = shape.tableData;
      if (tableData) {
        svg += `  <g opacity="${opacity}"${transform}>\n`;
        let yOffset = 0;
        for (let row = 0; row < tableData.rows; row++) {
          let xOffset = 0;
          const rowHeight = tableData.rowHeights[row] || 40;
          for (let col = 0; col < tableData.cols; col++) {
            const colWidth = tableData.colWidths[col] || 100;
            const cell = tableData.cells[row]?.[col] || { text: '' };
            const isHeader = row === 0 && tableData.headerRow;
            const cellFill = cell.fill || (isHeader ? '#f3f4f6' : '#ffffff');
            svg += `    <rect x="${shape.x + xOffset}" y="${shape.y + yOffset}" width="${colWidth}" height="${rowHeight}" fill="${cellFill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" />\n`;
            if (cell.text) {
              const textContent = escapeXml(cell.text);
              const textX = shape.x + xOffset + 8;
              const textY = shape.y + yOffset + rowHeight / 2 + 5;
              svg += `    <text x="${textX}" y="${textY}" font-size="${shape.fontSize || 14}" font-family="${shape.fontFamily || 'Arial'}" fill="${cell.textColor || shape.textColor || '#1e1e1e'}">${textContent}</text>\n`;
            }
            xOffset += colWidth;
          }
          yOffset += rowHeight;
        }
        svg += `  </g>\n`;
      }
      break;
    }
    case 'mindmap': {
      const data = shape.mindmapData;
      if (data) {
        svg += `  <g opacity="${opacity}"${transform}>\n`;

        const nodeHeight = 32;
        const nodePadding = 12;
        const nodeRadius = 8;
        const levelColors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

        interface NodePos { node: typeof data.root; x: number; y: number; level: number; }
        const positions: NodePos[] = [];

        const calculatePositions = (
          node: typeof data.root, x: number, y: number, level: number
        ): { minY: number; maxY: number } => {
          const children = node.children || [];
          if (children.length === 0) {
            positions.push({ node, x, y, level });
            return { minY: y, maxY: y };
          }
          let currentY = y - ((children.length - 1) * (nodeHeight + data.nodeSpacing)) / 2;
          let minY = currentY, maxY = currentY;
          children.forEach((child) => {
            const result = calculatePositions(child, x + data.levelSpacing, currentY, level + 1);
            minY = Math.min(minY, result.minY);
            maxY = Math.max(maxY, result.maxY);
            currentY += nodeHeight + data.nodeSpacing;
          });
          positions.push({ node, x, y: (minY + maxY) / 2, level });
          return { minY, maxY };
        };

        calculatePositions(data.root, shape.x + 20, shape.y + shape.height / 2, 0);

        // Draw connections
        positions.forEach((pos) => {
          (pos.node.children || []).forEach((child) => {
            const childPos = positions.find((p) => p.node.id === child.id);
            if (childPos) {
              const parentWidth = Math.max(60, pos.node.text.length * 8 + nodePadding * 2);
              svg += `    <line x1="${pos.x + parentWidth}" y1="${pos.y + nodeHeight / 2}" x2="${childPos.x}" y2="${childPos.y + nodeHeight / 2}" stroke="#d1d5db" stroke-width="2" />\n`;
            }
          });
        });

        // Draw nodes
        positions.forEach((pos) => {
          const nodeWidth = Math.max(60, pos.node.text.length * 8 + nodePadding * 2);
          const color = pos.node.color || levelColors[pos.level % levelColors.length];
          svg += `    <rect x="${pos.x}" y="${pos.y}" width="${nodeWidth}" height="${nodeHeight}" fill="${color}" rx="${nodeRadius}" />\n`;
          svg += `    <text x="${pos.x + nodeWidth / 2}" y="${pos.y + nodeHeight / 2 + 4}" font-size="13" font-family="Arial" fill="#ffffff" text-anchor="middle">${escapeXml(pos.node.text)}</text>\n`;
        });

        svg += `  </g>\n`;
      }
      break;
    }
    case 'embed': {
      const data = shape.embedData;
      const cornerRadius = shape.cornerRadius ?? 8;
      svg += `  <g opacity="${opacity}"${transform}>\n`;
      svg += `    <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.fill || '#ffffff'}" stroke="${shape.stroke || '#e5e7eb'}" stroke-width="${shape.strokeWidth || 1}" rx="${cornerRadius}" />\n`;
      if (data) {
        const contentX = shape.x + 12;
        if (data.siteName || data.url) {
          const hostname = data.siteName || (data.url ? new URL(data.url).hostname : 'example.com');
          svg += `    <text x="${contentX}" y="${shape.y + 20}" font-size="11" font-family="Arial" fill="#6b7280">${escapeXml(hostname)}</text>\n`;
        }
        if (data.title) {
          svg += `    <text x="${contentX}" y="${shape.y + 40}" font-size="14" font-family="Arial" font-weight="bold" fill="#1f2937">${escapeXml(data.title)}</text>\n`;
        }
        if (data.description) {
          svg += `    <text x="${contentX}" y="${shape.y + 60}" font-size="12" font-family="Arial" fill="#6b7280">${escapeXml(data.description.substring(0, 50))}...</text>\n`;
        }
        if (data.url) {
          svg += `    <text x="${contentX}" y="${shape.y + shape.height - 12}" font-size="10" font-family="Arial" fill="#9ca3af">${escapeXml(data.url)}</text>\n`;
        }
      }
      svg += `  </g>\n`;
      break;
    }
    case 'triangle': {
      const pts = `${shape.x + shape.width / 2},${shape.y} ${shape.x + shape.width},${shape.y + shape.height} ${shape.x},${shape.y + shape.height}`;
      svg += `  <polygon points="${pts}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
      break;
    }
    case 'triangleDown': {
      const pts = `${shape.x},${shape.y} ${shape.x + shape.width},${shape.y} ${shape.x + shape.width / 2},${shape.y + shape.height}`;
      svg += `  <polygon points="${pts}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
      break;
    }
    case 'roundedRectangle':
      svg += `  <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" rx="${shape.cornerRadius ?? 12}" opacity="${opacity}"${transform} />\n`;
      break;
    case 'pentagon': {
      const cx = shape.x + shape.width / 2;
      const cy = shape.y + shape.height / 2;
      const r = Math.min(shape.width, shape.height) / 2;
      const pts: string[] = [];
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      svg += `  <polygon points="${pts.join(' ')}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
      break;
    }
    case 'hexagon': {
      const cx = shape.x + shape.width / 2;
      const cy = shape.y + shape.height / 2;
      const r = Math.min(shape.width, shape.height) / 2;
      const pts: string[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * 2 * Math.PI / 6) - Math.PI / 2;
        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      svg += `  <polygon points="${pts.join(' ')}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
      break;
    }
    case 'star': {
      const cx = shape.x + shape.width / 2;
      const cy = shape.y + shape.height / 2;
      const outerR = Math.min(shape.width, shape.height) / 2;
      const innerR = outerR * 0.4;
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI / 5) - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      svg += `  <polygon points="${pts.join(' ')}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
      break;
    }
    case 'cross': {
      const w = shape.width;
      const h = shape.height;
      const armWidth = Math.min(w, h) * 0.33;
      const hOffset = (w - armWidth) / 2;
      const vOffset = (h - armWidth) / 2;
      const pts = [
        `${shape.x + hOffset},${shape.y}`,
        `${shape.x + hOffset + armWidth},${shape.y}`,
        `${shape.x + hOffset + armWidth},${shape.y + vOffset}`,
        `${shape.x + w},${shape.y + vOffset}`,
        `${shape.x + w},${shape.y + vOffset + armWidth}`,
        `${shape.x + hOffset + armWidth},${shape.y + vOffset + armWidth}`,
        `${shape.x + hOffset + armWidth},${shape.y + h}`,
        `${shape.x + hOffset},${shape.y + h}`,
        `${shape.x + hOffset},${shape.y + vOffset + armWidth}`,
        `${shape.x},${shape.y + vOffset + armWidth}`,
        `${shape.x},${shape.y + vOffset}`,
        `${shape.x + hOffset},${shape.y + vOffset}`,
      ];
      svg += `  <polygon points="${pts.join(' ')}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
      break;
    }
    case 'parallelogram': {
      const w = shape.width;
      const h = shape.height;
      const skew = w * 0.2;
      const pts = `${shape.x + skew},${shape.y} ${shape.x + w},${shape.y} ${shape.x + w - skew},${shape.y + h} ${shape.x},${shape.y + h}`;
      svg += `  <polygon points="${pts}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
      break;
    }
    case 'database': {
      const w = shape.width;
      const h = shape.height;
      const ellipseHeight = h * 0.15;
      svg += `  <g${transform}>\n`;
      svg += `    <rect x="${shape.x}" y="${shape.y + ellipseHeight / 2}" width="${w}" height="${h - ellipseHeight}" fill="${shape.fill}" />\n`;
      svg += `    <line x1="${shape.x}" y1="${shape.y + ellipseHeight / 2}" x2="${shape.x}" y2="${shape.y + h - ellipseHeight / 2}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" />\n`;
      svg += `    <line x1="${shape.x + w}" y1="${shape.y + ellipseHeight / 2}" x2="${shape.x + w}" y2="${shape.y + h - ellipseHeight / 2}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" />\n`;
      svg += `    <ellipse cx="${shape.x + w / 2}" cy="${shape.y + h - ellipseHeight / 2}" rx="${w / 2}" ry="${ellipseHeight / 2}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}" />\n`;
      svg += `    <ellipse cx="${shape.x + w / 2}" cy="${shape.y + ellipseHeight / 2}" rx="${w / 2}" ry="${ellipseHeight / 2}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}" />\n`;
      svg += `  </g>\n`;
      break;
    }
    case 'document': {
      const w = shape.width;
      const h = shape.height;
      const waveHeight = h * 0.1;
      const d = `M ${shape.x},${shape.y} L ${shape.x + w},${shape.y} L ${shape.x + w},${shape.y + h - waveHeight} Q ${shape.x + w * 0.75},${shape.y + h - waveHeight * 2} ${shape.x + w / 2},${shape.y + h - waveHeight} Q ${shape.x + w * 0.25},${shape.y + h} ${shape.x},${shape.y + h - waveHeight} Z`;
      svg += `  <path d="${d}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" opacity="${opacity}"${transform} />\n`;
      break;
    }
    default:
      // Sticky notes, freedraw, and other shapes rendered as rectangles
      svg += `  <rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" rx="${shape.cornerRadius ?? 0}" opacity="${opacity}"${transform} />\n`;
      break;
  }

  // Add text overlay for non-text shapes
  if (shape.type !== 'text' && shape.text) {
    const textY = shape.y + shape.height / 2;
    const textX = shape.x + shape.width / 2;
    const escapedText = escapeXml(shape.text);
    svg += `  <text x="${textX}" y="${textY}" font-size="${shape.fontSize || 14}" font-family="${shape.fontFamily || 'Arial'}" fill="${shape.textColor || '#ffffff'}" text-anchor="middle" dominant-baseline="middle" opacity="${shape.opacity ?? 1}">${escapedText}</text>\n`;
  }

  return svg;
}

/**
 * Render a connector to SVG string
 */
function renderConnectorToSVG(connector: Connector, shapes: Shape[]): string {
  const fromShape = shapes.find(s => s.id === connector.fromShapeId);
  const toShape = shapes.find(s => s.id === connector.toShapeId);
  if (!fromShape || !toShape) return '';

  const fromCenter = getShapeCenter(fromShape);
  const toCenter = getShapeCenter(toShape);

  let strokeDash = '';
  if (connector.lineStyle === 'dashed') strokeDash = ' stroke-dasharray="8,4"';
  if (connector.lineStyle === 'dotted') strokeDash = ' stroke-dasharray="2,2"';

  let svg = `  <line x1="${fromCenter.x}" y1="${fromCenter.y}" x2="${toCenter.x}" y2="${toCenter.y}" stroke="${connector.stroke}" stroke-width="${connector.strokeWidth}"${strokeDash} />\n`;

  // Add arrow if enabled
  if (connector.arrow || connector.arrowEnd === 'arrow' || connector.arrowEnd === 'triangle') {
    const angle = Math.atan2(toCenter.y - fromCenter.y, toCenter.x - fromCenter.x);
    const arrowSize = 10;
    const arrowPoints = [
      toCenter.x, toCenter.y,
      toCenter.x - arrowSize * Math.cos(angle - Math.PI / 6), toCenter.y - arrowSize * Math.sin(angle - Math.PI / 6),
      toCenter.x - arrowSize * Math.cos(angle + Math.PI / 6), toCenter.y - arrowSize * Math.sin(angle + Math.PI / 6),
    ];
    svg += `  <polygon points="${arrowPoints.join(',')}" fill="${connector.stroke}" />\n`;
  }

  return svg;
}

/**
 * Generate SVG content string from shapes and connectors.
 * Returns the complete SVG string, or null if there are no visible shapes.
 */
export function generateSVG(shapes: Shape[], connectors: Connector[]): string | null {
  const bounds = calculateBounds(shapes);
  if (!bounds) return null;

  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svgContent += `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}">\n`;

  shapes.forEach((shape) => {
    svgContent += renderShapeToSVG(shape);
  });

  connectors.forEach((connector) => {
    svgContent += renderConnectorToSVG(connector, shapes);
  });

  svgContent += `</svg>`;

  return svgContent;
}
