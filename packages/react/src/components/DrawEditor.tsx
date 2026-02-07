'use client';

import {
  forwardRef,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  useEffect,
  type ReactNode,
} from 'react';
import type { Shape, Connector } from '@zm-draw/core';
import type {
  DrawCanvasHandle,
  DrawCanvasTheme,
  DrawCanvasUIOptions,
  SelectedShapeInfo,
  ViewportInfo,
} from './DrawCanvas';
import { DrawCanvas } from './DrawCanvas';
import { Minimap } from './Minimap';

/** DrawEditor theme */
export type DrawEditorTheme = DrawCanvasTheme;

/** Panel configuration */
export interface DrawEditorPanelConfig {
  /** Whether the panel is visible (default: true) */
  visible?: boolean;
  /** Default width in pixels */
  defaultWidth?: number;
  /** Min width constraint */
  minWidth?: number;
  /** Max width constraint */
  maxWidth?: number;
}

/** DrawEditor props */
export interface DrawEditorProps {
  /** Initial shapes to load */
  initialShapes?: Shape[];
  /** Callback when shapes change */
  onShapesChange?: (shapes: Shape[]) => void;
  /** Callback when connectors change */
  onConnectorsChange?: (connectors: Connector[]) => void;
  /** Callback when selection changes */
  onSelectionChange?: (shape: SelectedShapeInfo | null) => void;
  /** Callback when viewport changes */
  onViewportChange?: (viewport: ViewportInfo) => void;
  /** Callback when canvas is ready */
  onReady?: (handle: DrawEditorHandle) => void;

  /** Background color */
  backgroundColor?: string;
  /** Show grid */
  showGrid?: boolean;
  /** Grid size */
  gridSize?: number;
  /** Snap shapes to grid */
  snapToGrid?: boolean;
  /** Show smart alignment guides */
  showSmartGuides?: boolean;
  /** Snap to smart guides */
  snapToGuides?: boolean;

  /** Theme: light, dark, or system */
  theme?: DrawEditorTheme;
  /** Additional className for the root element */
  className?: string;

  /** Whether to show the minimap (default: true) */
  showMinimap?: boolean;

  /** Canvas UI options (toolbar, comments, etc.) */
  canvasUIOptions?: DrawCanvasUIOptions;

  /** Collaboration props */
  collaborationEnabled?: boolean;
  roomId?: string;
  serverUrl?: string;
  userName?: string;

  /** Left panel configuration or render function */
  leftPanel?: DrawEditorPanelConfig & {
    /** Custom render function for left panel content */
    render?: (props: DrawEditorPanelRenderProps) => ReactNode;
  };

  /** Right panel configuration or render function */
  rightPanel?: DrawEditorPanelConfig & {
    /** Custom render function for right panel content */
    render?: (props: DrawEditorPanelRenderProps) => ReactNode;
  };

  /** Header content (rendered above the canvas area) */
  headerContent?: ReactNode | ((props: DrawEditorHeaderRenderProps) => ReactNode);

  /** Floating content rendered over the canvas (e.g., context menus) */
  overlayContent?: ReactNode | ((props: DrawEditorOverlayRenderProps) => ReactNode);
}

/** Props passed to panel render functions */
export interface DrawEditorPanelRenderProps {
  /** Current shapes */
  shapes: Shape[];
  /** Current connectors */
  connectors: Connector[];
  /** Currently selected shape info */
  selectedShape: SelectedShapeInfo | null;
  /** Canvas handle for imperative operations */
  canvasHandle: DrawCanvasHandle | null;
  /** Current viewport info */
  viewport: ViewportInfo;
  /** Current theme */
  theme: DrawEditorTheme;
}

/** Props passed to header render function */
export interface DrawEditorHeaderRenderProps {
  /** Current viewport info */
  viewport: ViewportInfo;
  /** Canvas handle for imperative operations */
  canvasHandle: DrawCanvasHandle | null;
  /** Current theme */
  theme: DrawEditorTheme;
}

/** Props passed to overlay render function */
export interface DrawEditorOverlayRenderProps {
  /** Currently selected shape info */
  selectedShape: SelectedShapeInfo | null;
  /** Current viewport info */
  viewport: ViewportInfo;
  /** Canvas handle for imperative operations */
  canvasHandle: DrawCanvasHandle | null;
}

/** DrawEditor imperative handle (extends DrawCanvasHandle) */
export interface DrawEditorHandle extends DrawCanvasHandle {
  /** Toggle left panel visibility */
  toggleLeftPanel: () => void;
  /** Toggle right panel visibility */
  toggleRightPanel: () => void;
  /** Toggle minimap visibility */
  toggleMinimap: () => void;
}

/**
 * DrawEditor - Complete editor composition component
 *
 * Wraps DrawCanvas with layout management, optional panels, and minimap.
 * Provides a configurable, ready-to-use editor experience.
 *
 * Usage:
 * ```tsx
 * <DrawEditor
 *   theme="light"
 *   showMinimap={true}
 *   onShapesChange={(shapes) => save(shapes)}
 *   leftPanel={{ render: (props) => <ShapesLibrary {...props} /> }}
 *   rightPanel={{ render: (props) => <PropertyPanel {...props} /> }}
 * />
 * ```
 */
export const DrawEditor = forwardRef<DrawEditorHandle, DrawEditorProps>(
  function DrawEditor(props, ref) {
    const {
      initialShapes,
      onShapesChange,
      onConnectorsChange,
      onSelectionChange,
      onViewportChange,
      onReady,
      backgroundColor,
      showGrid = true,
      gridSize,
      snapToGrid = false,
      showSmartGuides = true,
      snapToGuides = true,
      theme = 'light',
      className,
      showMinimap: showMinimapProp = true,
      canvasUIOptions,
      collaborationEnabled,
      roomId,
      serverUrl,
      userName,
      leftPanel,
      rightPanel,
      headerContent,
      overlayContent,
    } = props;

    // Canvas ref
    const canvasRef = useRef<DrawCanvasHandle>(null);

    // Panel state
    const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(leftPanel?.visible !== false);
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(rightPanel?.visible !== false);
    const [leftPanelWidth, setLeftPanelWidth] = useState(leftPanel?.defaultWidth ?? 240);
    const [rightPanelWidth, setRightPanelWidth] = useState(rightPanel?.defaultWidth ?? 280);
    const [showMinimap, setShowMinimap] = useState(showMinimapProp);

    // Canvas state (for panel render props)
    const [shapes, setShapes] = useState<Shape[]>(initialShapes ?? []);
    const [connectors, setConnectors] = useState<Connector[]>([]);
    const [selectedShape, setSelectedShape] = useState<SelectedShapeInfo | null>(null);
    const [viewport, setViewport] = useState<ViewportInfo>({
      scale: 1,
      position: { x: 0, y: 0 },
    });
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

    // Handle shapes change
    const handleShapesChange = useCallback(
      (newShapes: Shape[]) => {
        setShapes(newShapes);
        onShapesChange?.(newShapes);
        if (canvasRef.current) {
          setConnectors(canvasRef.current.getConnectors());
          setCanvasSize(canvasRef.current.getCanvasSize());
        }
      },
      [onShapesChange]
    );

    // Handle selection change
    const handleSelectionChange = useCallback(
      (shape: SelectedShapeInfo | null) => {
        setSelectedShape(shape);
        onSelectionChange?.(shape);
      },
      [onSelectionChange]
    );

    // Handle viewport change
    const handleViewportChange = useCallback(
      (vp: ViewportInfo) => {
        setViewport(vp);
        onViewportChange?.(vp);
      },
      [onViewportChange]
    );

    // Toggle functions
    const toggleLeftPanel = useCallback(() => setIsLeftPanelOpen((v) => !v), []);
    const toggleRightPanel = useCallback(() => setIsRightPanelOpen((v) => !v), []);
    const toggleMinimap = useCallback(() => setShowMinimap((v) => !v), []);

    // Imperative handle
    useImperativeHandle(
      ref,
      () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          // Return a stub handle before canvas is ready
          return {
            updateShape: () => {},
            getShapes: () => [],
            setShapes: () => {},
            deleteSelected: () => {},
            duplicateSelected: () => {},
            copySelected: () => {},
            getConnectors: () => [],
            updateConnector: () => {},
            setConnectors: () => {},
            exportToPNG: () => {},
            exportToSVG: () => {},
            alignShapes: () => {},
            distributeShapes: () => {},
            groupSelected: () => {},
            ungroupSelected: () => {},
            setZoom: () => {},
            zoomToFit: () => {},
            zoomTo100: () => {},
            setViewportPosition: () => {},
            getViewport: () => ({ scale: 1, position: { x: 0, y: 0 } }),
            getSelectedId: () => null,
            getCanvasSize: () => ({ width: 800, height: 600 }),
            loadFromJSON: () => {},
            toggleLeftPanel,
            toggleRightPanel,
            toggleMinimap,
          } as DrawEditorHandle;
        }
        return {
          ...canvas,
          toggleLeftPanel,
          toggleRightPanel,
          toggleMinimap,
        };
      },
      [toggleLeftPanel, toggleRightPanel, toggleMinimap]
    );

    // Notify parent when ready
    useEffect(() => {
      if (canvasRef.current && onReady) {
        const handle: DrawEditorHandle = {
          ...canvasRef.current,
          toggleLeftPanel,
          toggleRightPanel,
          toggleMinimap,
        };
        onReady(handle);
      }
    }, [onReady, toggleLeftPanel, toggleRightPanel, toggleMinimap]);

    // Render props for panels
    const panelRenderProps: DrawEditorPanelRenderProps = {
      shapes,
      connectors,
      selectedShape,
      canvasHandle: canvasRef.current,
      viewport,
      theme,
    };

    // Dark mode class
    const isDark = theme === 'dark';
    const rootClassName = [
      'zm-draw-editor',
      isDark ? 'zm-draw-dark' : 'zm-draw-light',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={rootClassName} style={{ display: 'flex', width: '100%', height: '100%' }}>
        {/* Left Panel */}
        {leftPanel?.render && isLeftPanelOpen && (
          <aside
            className="zm-draw-editor-left-panel"
            style={{
              width: leftPanelWidth,
              minWidth: leftPanel.minWidth ?? 200,
              maxWidth: leftPanel.maxWidth ?? 400,
              flexShrink: 0,
              overflow: 'auto',
            }}
          >
            {leftPanel.render(panelRenderProps)}
          </aside>
        )}

        {/* Center: Header + Canvas */}
        <div
          className="zm-draw-editor-center"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
        >
          {/* Header */}
          {headerContent && (
            <div className="zm-draw-editor-header">
              {typeof headerContent === 'function'
                ? headerContent({
                    viewport,
                    canvasHandle: canvasRef.current,
                    theme,
                  })
                : headerContent}
            </div>
          )}

          {/* Canvas area */}
          <div className="zm-draw-editor-canvas-area" style={{ flex: 1, position: 'relative' }}>
            <DrawCanvas
              ref={canvasRef}
              initialShapes={initialShapes}
              backgroundColor={backgroundColor}
              showGrid={showGrid}
              gridSize={gridSize}
              snapToGrid={snapToGrid}
              showSmartGuides={showSmartGuides}
              snapToGuides={snapToGuides}
              theme={theme}
              UIOptions={canvasUIOptions}
              collaborationEnabled={collaborationEnabled}
              roomId={roomId}
              serverUrl={serverUrl}
              userName={userName}
              onShapesChange={handleShapesChange}
              onSelectionChange={handleSelectionChange}
              onViewportChange={handleViewportChange}
            />

            {/* Minimap */}
            {showMinimap && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 60,
                  right: 12,
                  zIndex: 10,
                }}
              >
                <Minimap
                  shapes={shapes}
                  connectors={connectors}
                  scale={viewport.scale}
                  position={viewport.position}
                  canvasSize={canvasSize}
                  onViewportChange={(pos) => canvasRef.current?.setViewportPosition(pos)}
                />
              </div>
            )}

            {/* Overlay content (context menus, floating UI) */}
            {overlayContent &&
              (typeof overlayContent === 'function'
                ? overlayContent({
                    selectedShape,
                    viewport,
                    canvasHandle: canvasRef.current,
                  })
                : overlayContent)}
          </div>
        </div>

        {/* Right Panel */}
        {rightPanel?.render && isRightPanelOpen && (
          <aside
            className="zm-draw-editor-right-panel"
            style={{
              width: rightPanelWidth,
              minWidth: rightPanel.minWidth ?? 240,
              maxWidth: rightPanel.maxWidth ?? 450,
              flexShrink: 0,
              overflow: 'auto',
            }}
          >
            {rightPanel.render(panelRenderProps)}
          </aside>
        )}
      </div>
    );
  }
);
