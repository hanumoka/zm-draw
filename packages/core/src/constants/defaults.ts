import type { StickyNoteColor, StampType, SectionColor, TableData, MindmapData, EmbedData } from '../types';

/** Default shape properties (FigJam style) */
export const defaultShapeProps = {
  width: 100,
  height: 60,
  fill: '#ffffff',
  stroke: '#1e1e1e',
  strokeWidth: 2,
  cornerRadius: 0,
  text: '',
  fontSize: 14,
  fontFamily: 'Arial',
  textColor: '#1e1e1e',
};

/** Default text shape properties */
export const defaultTextShapeProps = {
  width: 200,
  height: 30,
  fill: 'transparent',
  stroke: 'transparent',
  strokeWidth: 0,
  text: 'Text',
  fontSize: 16,
  fontFamily: 'Arial',
  textColor: '#000000',
  textAlign: 'left' as const,
  verticalAlign: 'top' as const,
};

/** Default sticky note properties (FigJam style) */
export const defaultStickyNoteProps = {
  width: 150,
  height: 150,
  fill: '#fef08a',
  stroke: 'transparent',
  strokeWidth: 0,
  cornerRadius: 2,
  text: '',
  fontSize: 14,
  fontFamily: 'Arial',
  textColor: '#1a1a1a',
  textAlign: 'left' as const,
  verticalAlign: 'top' as const,
  stickyColor: 'yellow' as StickyNoteColor,
  opacity: 1,
};

/** Default image shape properties */
export const defaultImageShapeProps = {
  width: 200,
  height: 200,
  fill: 'transparent',
  stroke: 'transparent',
  strokeWidth: 0,
  preserveAspectRatio: true,
};

/** Default stamp properties (FigJam style reactions) */
export const defaultStampProps = {
  width: 48,
  height: 48,
  fill: 'transparent',
  stroke: 'transparent',
  strokeWidth: 0,
  stampType: 'thumbsUp' as StampType,
};

/** Default section properties (FigJam style) */
export const defaultSectionProps = {
  width: 400,
  height: 300,
  fill: '#f3f4f6',
  stroke: '#d1d5db',
  strokeWidth: 1,
  cornerRadius: 8,
  sectionColor: 'gray' as SectionColor,
  sectionTitle: 'Section',
  opacity: 1,
};

/** Create default table data */
export const createDefaultTableData = (): TableData => ({
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
});

/** Default table properties */
export const defaultTableProps = {
  width: 300,
  height: 120,
  fill: '#ffffff',
  stroke: '#1e1e1e',
  strokeWidth: 1,
  tableData: createDefaultTableData(),
};

/** Create default mindmap data */
export const createDefaultMindmapData = (): MindmapData => ({
  root: {
    id: 'root',
    text: 'Central Idea',
    children: [
      { id: 'child-1', text: 'Topic 1', children: [] },
      { id: 'child-2', text: 'Topic 2', children: [] },
      { id: 'child-3', text: 'Topic 3', children: [] },
    ],
  },
  layout: 'horizontal',
  nodeSpacing: 20,
  levelSpacing: 120,
});

/** Default mindmap properties */
export const defaultMindmapProps = {
  width: 600,
  height: 400,
  fill: 'transparent',
  stroke: 'transparent',
  strokeWidth: 0,
  mindmapData: createDefaultMindmapData(),
};

/** Create default embed data */
export const createDefaultEmbedData = (): EmbedData => ({
  url: '',
  title: 'Link Preview',
  description: 'Paste a URL to see a preview',
  embedType: 'link',
});

/** Default embed/link preview properties */
export const defaultEmbedProps = {
  width: 320,
  height: 180,
  fill: '#ffffff',
  stroke: '#e5e7eb',
  strokeWidth: 1,
  cornerRadius: 8,
  embedData: createDefaultEmbedData(),
};

/** Default freedraw properties for each tool */
export const defaultFreeDrawProps = {
  pen: {
    stroke: '#1a1a1a',
    strokeWidth: 2,
    opacity: 1,
    lineCap: 'round' as const,
  },
  marker: {
    stroke: '#1a1a1a',
    strokeWidth: 8,
    opacity: 1,
    lineCap: 'round' as const,
  },
  highlighter: {
    stroke: '#facc15',
    strokeWidth: 20,
    opacity: 0.5,
    lineCap: 'square' as const,
  },
};
