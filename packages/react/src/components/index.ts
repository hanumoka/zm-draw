// Main editor component (composition of canvas + panels)
export { DrawEditor } from './DrawEditor';
export type {
  DrawEditorProps,
  DrawEditorHandle,
  DrawEditorTheme,
  DrawEditorPanelConfig,
  DrawEditorPanelRenderProps,
  DrawEditorHeaderRenderProps,
  DrawEditorOverlayRenderProps,
} from './DrawEditor';

// Core canvas component
export { DrawCanvas } from './DrawCanvas';
export type { DrawCanvasProps, DrawCanvasTheme, DrawCanvasUIOptions, SelectedShapeInfo, DrawCanvasHandle, ViewportInfo } from './DrawCanvas';

// Toolbar
export { Toolbar } from './Toolbar';
export type { ToolbarProps } from './Toolbar';

// TextEditor
export { TextEditor } from './TextEditor';
export type { TextEditorProps } from './TextEditor';

// Minimap
export { Minimap } from './Minimap';
export type { MinimapProps } from './Minimap';

// CommentPanel
export { CommentPanel } from './CommentPanel';

// SpotlightUI
export { SpotlightUI } from './SpotlightUI';

// Common UI components (moved from demo)
export { ColorPicker } from './common/ColorPicker';
export { Tooltip, TooltipProvider } from './common/Tooltip';
export { PanelResizer } from './common/PanelResizer';
