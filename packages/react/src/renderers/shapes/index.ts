import { registerShapeRenderer } from '../ShapeRendererRegistry';
import { RectangleRenderer } from './RectangleRenderer';
import { EllipseRenderer } from './EllipseRenderer';
import { DiamondRenderer } from './DiamondRenderer';
import { TextRenderer } from './TextRenderer';
import { StickyNoteRenderer } from './StickyNoteRenderer';
import { FreeDrawRenderer } from './FreeDrawRenderer';
import { ImageRenderer } from './ImageRenderer';
import { StampRenderer } from './StampRenderer';
import { SectionRenderer } from './SectionRenderer';
import { TableRenderer } from './TableRenderer';
import { MindmapRenderer } from './MindmapRenderer';
import { EmbedRenderer } from './EmbedRenderer';
import {
  TriangleRenderer,
  TriangleDownRenderer,
  RoundedRectangleRenderer,
  PentagonRenderer,
  HexagonRenderer,
  StarRenderer,
  CrossRenderer,
} from './PolygonRenderers';
import {
  ParallelogramRenderer,
  DatabaseRenderer,
  DocumentRenderer,
} from './FlowchartRenderers';

/**
 * Register all built-in shape renderers
 */
export function registerBuiltInRenderers(): void {
  // Basic shapes
  registerShapeRenderer('rectangle', RectangleRenderer);
  registerShapeRenderer('ellipse', EllipseRenderer);
  registerShapeRenderer('diamond', DiamondRenderer);
  registerShapeRenderer('text', TextRenderer);

  // Special shapes
  registerShapeRenderer('sticky', StickyNoteRenderer);
  registerShapeRenderer('freedraw', FreeDrawRenderer);
  registerShapeRenderer('image', ImageRenderer);
  registerShapeRenderer('stamp', StampRenderer);
  registerShapeRenderer('section', SectionRenderer);
  registerShapeRenderer('table', TableRenderer);
  registerShapeRenderer('mindmap', MindmapRenderer);
  registerShapeRenderer('embed', EmbedRenderer);

  // Polygon shapes
  registerShapeRenderer('triangle', TriangleRenderer);
  registerShapeRenderer('triangleDown', TriangleDownRenderer);
  registerShapeRenderer('roundedRectangle', RoundedRectangleRenderer);
  registerShapeRenderer('pentagon', PentagonRenderer);
  registerShapeRenderer('hexagon', HexagonRenderer);
  registerShapeRenderer('star', StarRenderer);
  registerShapeRenderer('cross', CrossRenderer);

  // Flowchart shapes
  registerShapeRenderer('parallelogram', ParallelogramRenderer);
  registerShapeRenderer('database', DatabaseRenderer);
  registerShapeRenderer('document', DocumentRenderer);
}
