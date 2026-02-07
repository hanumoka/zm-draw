// Core renderer registry
export {
  registerShapeRenderer,
  getShapeRenderer,
  hasShapeRenderer,
  type ShapeRenderer,
  type ShapeRendererContext,
} from './ShapeRendererRegistry';

// Shape rendering dispatcher
export { renderShape } from './renderShape';

// Built-in renderers registration
export { registerBuiltInRenderers } from './shapes';

// Individual renderers (for advanced users who want to customize)
export { RectangleRenderer } from './shapes/RectangleRenderer';
export { EllipseRenderer } from './shapes/EllipseRenderer';
export { DiamondRenderer } from './shapes/DiamondRenderer';
export { TextRenderer } from './shapes/TextRenderer';
export { StickyNoteRenderer } from './shapes/StickyNoteRenderer';
export { FreeDrawRenderer } from './shapes/FreeDrawRenderer';
export { ImageRenderer } from './shapes/ImageRenderer';
export { StampRenderer } from './shapes/StampRenderer';
export { SectionRenderer } from './shapes/SectionRenderer';
export { TableRenderer } from './shapes/TableRenderer';
export { MindmapRenderer } from './shapes/MindmapRenderer';
export { EmbedRenderer } from './shapes/EmbedRenderer';
export {
  TriangleRenderer,
  TriangleDownRenderer,
  RoundedRectangleRenderer,
  PentagonRenderer,
  HexagonRenderer,
  StarRenderer,
  CrossRenderer,
} from './shapes/PolygonRenderers';
export {
  ParallelogramRenderer,
  DatabaseRenderer,
  DocumentRenderer,
} from './shapes/FlowchartRenderers';
