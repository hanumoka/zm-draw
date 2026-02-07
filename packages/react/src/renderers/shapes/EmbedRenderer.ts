import Konva from 'konva';
import type { Shape } from '@zm-draw/core';
import type { ShapeRenderer, ShapeRendererContext } from '../ShapeRendererRegistry';

export const EmbedRenderer: ShapeRenderer = {
  render(shape: Shape, group: Konva.Group, ctx: ShapeRendererContext): Konva.Shape {
    // Embed/Link preview card
    const embedGroup = new Konva.Group();
    const data = shape.embedData;
    const cornerRadius = shape.cornerRadius ?? 8;

    // Card background with shadow
    const cardBg = new Konva.Rect({
      x: 0,
      y: 0,
      width: shape.width,
      height: shape.height,
      fill: shape.fill || '#ffffff',
      stroke: shape.stroke || '#e5e7eb',
      strokeWidth: shape.strokeWidth || 1,
      cornerRadius,
      shadowColor: 'rgba(0,0,0,0.1)',
      shadowBlur: 8,
      shadowOffsetY: 2,
    });
    embedGroup.add(cardBg);

    if (data) {
      // Thumbnail area (left side or top)
      const thumbnailWidth = 80;
      const contentX = data.thumbnail ? thumbnailWidth + 12 : 12;
      const contentWidth = shape.width - contentX - 12;

      if (data.thumbnail) {
        // Thumbnail placeholder
        const thumbBg = new Konva.Rect({
          x: 0,
          y: 0,
          width: thumbnailWidth,
          height: shape.height,
          fill: '#f3f4f6',
          cornerRadius: [cornerRadius, 0, 0, cornerRadius],
        });
        embedGroup.add(thumbBg);

        // Link icon placeholder
        const linkIcon = new Konva.Text({
          x: 0,
          y: 0,
          width: thumbnailWidth,
          height: shape.height,
          text: '🔗',
          fontSize: 24,
          align: 'center',
          verticalAlign: 'middle',
          listening: false,
        });
        embedGroup.add(linkIcon);
      }

      // Site name / domain
      if (data.siteName || data.url) {
        const hostname = data.siteName || (data.url ? new URL(data.url).hostname : 'example.com');
        const siteNameText = new Konva.Text({
          x: contentX,
          y: 12,
          width: contentWidth,
          text: hostname,
          fontSize: 11,
          fontFamily: 'Arial',
          fill: '#6b7280',
          listening: false,
        });
        embedGroup.add(siteNameText);
      }

      // Title
      if (data.title) {
        const titleText = new Konva.Text({
          x: contentX,
          y: 32,
          width: contentWidth,
          text: data.title,
          fontSize: 14,
          fontFamily: 'Arial',
          fontStyle: 'bold',
          fill: '#1f2937',
          wrap: 'word',
          ellipsis: true,
          listening: false,
        });
        embedGroup.add(titleText);
      }

      // Description
      if (data.description) {
        const descText = new Konva.Text({
          x: contentX,
          y: 52,
          width: contentWidth,
          text: data.description.substring(0, 100) + (data.description.length > 100 ? '...' : ''),
          fontSize: 12,
          fontFamily: 'Arial',
          fill: '#6b7280',
          wrap: 'word',
          listening: false,
        });
        embedGroup.add(descText);
      }

      // URL at bottom
      if (data.url) {
        const urlText = new Konva.Text({
          x: contentX,
          y: shape.height - 24,
          width: contentWidth,
          text: data.url,
          fontSize: 10,
          fontFamily: 'Arial',
          fill: '#9ca3af',
          ellipsis: true,
          listening: false,
        });
        embedGroup.add(urlText);
      }
    }
    group.add(embedGroup);
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
