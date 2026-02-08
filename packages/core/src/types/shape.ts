/** Basic shape types */
export type ShapeType =
  | 'rectangle'
  | 'roundedRectangle'
  | 'ellipse'
  | 'diamond'
  | 'text'
  | 'sticky'
  | 'freedraw'
  | 'image'
  | 'stamp'
  | 'section'
  | 'table'
  | 'mindmap'
  | 'embed'
  // Polygon shapes
  | 'triangle'
  | 'triangleDown'
  | 'pentagon'
  | 'hexagon'
  | 'star'
  | 'cross'
  // Additional Basic shapes
  | 'leftRightArrow'
  | 'rightArrow'
  | 'chevron'
  | 'speechBubble'
  // Flowchart shapes
  | 'parallelogram'
  | 'database'
  | 'document'
  | 'pill'
  | 'folder'
  | 'comment'
  | 'callout'
  | 'dividedBox'
  | 'pentagonLabel'
  | 'trapezoid'
  | 'hexagonHorizontal'
  | 'dividedSquare'
  | 'circleCross'
  | 'circleX'
  // Icon shapes
  | 'iconHeartbeat'
  | 'iconArchive'
  | 'iconKey'
  | 'iconChat'
  | 'iconCloud'
  | 'iconArchiveBox'
  | 'iconDatabase'
  | 'iconMonitor'
  | 'iconMail'
  | 'iconDocument'
  | 'iconCode'
  | 'iconLightning'
  | 'iconLocation'
  | 'iconPhone'
  | 'iconBox3d'
  | 'iconDollar'
  | 'iconShield'
  | 'iconSend'
  | 'iconServer'
  | 'iconCube3d'
  | 'iconGear'
  | 'iconGrid'
  | 'iconTerminal'
  | 'iconUser'
  | 'iconList'
  | 'iconGlobe';

/** Extended shape types for future use */
export type ExtendedShapeType = ShapeType | 'line' | 'polygon' | 'frame';

/** Sticky note color presets (FigJam official 10-color palette) */
export type StickyNoteColor = 'yellow' | 'orange' | 'red' | 'pink' | 'violet' | 'blue' | 'teal' | 'green' | 'gray' | 'white';

/** Section color presets */
export type SectionColor = 'gray' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

/** Stamp types (FigJam style reactions) */
export type StampType = 'thumbsUp' | 'thumbsDown' | 'heart' | 'star' | 'check' | 'question' | 'exclamation' | 'celebration';

/** Drawing tool type */
export type DrawingToolType = 'pen' | 'marker' | 'highlighter';

/** Point in a free-draw path */
export interface FreeDrawPoint {
  x: number;
  y: number;
}

/** Table cell data */
export interface TableCell {
  text: string;
  fill?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
}

/** Table data structure */
export interface TableData {
  rows: number;
  cols: number;
  cells: TableCell[][];  // 2D array [row][col]
  colWidths: number[];   // Width of each column
  rowHeights: number[];  // Height of each row
  headerRow?: boolean;   // Apply header style to first row
}

/** Mindmap node data */
export interface MindmapNode {
  id: string;
  text: string;
  children: MindmapNode[];
  collapsed?: boolean;
  color?: string;
}

/** Mindmap data structure */
export interface MindmapData {
  root: MindmapNode;
  layout: 'horizontal' | 'vertical' | 'radial';
  nodeSpacing: number;
  levelSpacing: number;
}

/** Embed/Link preview data structure */
export interface EmbedData {
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  siteName?: string;
  favicon?: string;
  embedType?: 'link' | 'video' | 'rich';
}

/**
 * Shape object representing a drawable element on the canvas
 */
export interface Shape {
  /** Unique identifier */
  id: string;
  /** Shape type */
  type: ShapeType;
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Fill color (hex or rgba) */
  fill: string;
  /** Stroke color (hex or rgba) */
  stroke: string;
  /** Stroke width in pixels */
  strokeWidth: number;
  /** Rotation in degrees */
  rotation?: number;
  /** Text content (for shapes with text) */
  text?: string;
  /** Font size in pixels */
  fontSize?: number;
  /** Font family name */
  fontFamily?: string;
  /** Text color (hex or rgba) */
  textColor?: string;
  /** Text horizontal alignment */
  textAlign?: 'left' | 'center' | 'right';
  /** Text vertical alignment */
  verticalAlign?: 'top' | 'middle' | 'bottom';
  /** Whether the shape is locked (cannot be selected/moved) */
  locked?: boolean;
  /** Whether the shape is visible */
  visible?: boolean;
  /** Custom name for the shape (displayed in layers panel) */
  name?: string;
  /** Opacity (0-1) */
  opacity?: number;
  /** Corner radius for rectangles */
  cornerRadius?: number;
  /** Group ID if shape belongs to a group */
  groupId?: string;
  /** Points for freedraw shapes */
  points?: FreeDrawPoint[];
  /** Sticky note specific color name */
  stickyColor?: StickyNoteColor;
  /** Line cap style for freedraw */
  lineCap?: 'round' | 'square' | 'butt';
  /** Author name (for sticky notes) */
  author?: string;
  /** Image source - base64 data URL or external URL (for image shapes) */
  src?: string;
  /** Original image width in pixels (for image shapes) */
  naturalWidth?: number;
  /** Original image height in pixels (for image shapes) */
  naturalHeight?: number;
  /** Whether to preserve aspect ratio when resizing (for image shapes) */
  preserveAspectRatio?: boolean;
  /** Stamp type for stamp shapes */
  stampType?: StampType;
  /** Section color name (for section shapes) */
  sectionColor?: SectionColor;
  /** Section title (for section shapes) */
  sectionTitle?: string;
  /** Child shape IDs contained in section (computed, not stored) */
  childIds?: string[];
  /** Table data (for table shapes) */
  tableData?: TableData;
  /** Mindmap data (for mindmap shapes) */
  mindmapData?: MindmapData;
  /** Embed/link preview data (for embed shapes) */
  embedData?: EmbedData;
}
