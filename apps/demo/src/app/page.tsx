'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect } from 'react';
import { TooltipProvider, Tooltip } from '../components/Tooltip';
import { PanelResizer } from '../components/PanelResizer';

// Konva requires window, so we need to dynamically import
const DrawCanvas = dynamic(
  () => import('@zm-draw/react').then((mod) => mod.DrawCanvas),
  { ssr: false }
);

interface SelectedShape {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
}

// Icons as components
const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const PanelRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);

const PanelRightCloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="15" y1="3" x2="15" y2="21" />
    <polyline points="10 15 13 12 10 9" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// Shape icons for the Shapes panel
const ShapeIcons = {
  // Connectors
  arrowRight: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  arrowBidirectional: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
      <polyline points="12 5 5 12 12 19" />
    </svg>
  ),
  arrowElbow: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="5 5 5 12 19 12" />
      <polyline points="14 7 19 12 14 17" />
    </svg>
  ),
  line: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  ),
  // Basic shapes
  rectangle: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  roundedRect: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="6" />
    </svg>
  ),
  circle: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  ellipse: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="12" rx="10" ry="6" />
    </svg>
  ),
  triangle: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 3 22 21 2 21" />
    </svg>
  ),
  triangleDown: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 21 2 3 22 3" />
    </svg>
  ),
  diamond: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 22 12 12 22 2 12" />
    </svg>
  ),
  pentagon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 22 9 18 21 6 21 2 9" />
    </svg>
  ),
  hexagon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 21 7 21 17 12 22 3 17 3 7" />
    </svg>
  ),
  star: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  cross: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="9 2 15 2 15 9 22 9 22 15 15 15 15 22 9 22 9 15 2 15 2 9 9 9" />
    </svg>
  ),
  // Flowchart
  process: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" />
    </svg>
  ),
  decision: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 22 12 12 22 2 12" />
    </svg>
  ),
  terminal: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" rx="6" />
    </svg>
  ),
  document: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4 L20 4 L20 18 Q12 22 4 18 Z" />
    </svg>
  ),
  database: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 5v14c0 1.66-4.03 3-9 3s-9-1.34-9-3V5" />
    </svg>
  ),
  parallelogram: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="6 4 22 4 18 20 2 20" />
    </svg>
  ),
};

// Collapsible Section Component
function CollapsibleSection({
  title,
  children,
  defaultOpen = true
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="zm-shapes-section">
      <button
        className="zm-shapes-section-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="zm-shapes-section-chevron">
          {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </span>
        <span className="zm-shapes-section-title">{title}</span>
      </button>
      {isOpen && (
        <div className="zm-shapes-section-content">
          {children}
        </div>
      )}
    </div>
  );
}

// Shape Button Component
function ShapeButton({
  icon,
  label,
  onClick,
  active = false
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <Tooltip content={label}>
      <button
        className={`zm-shape-button ${active ? 'active' : ''}`}
        onClick={onClick}
      >
        {icon}
      </button>
    </Tooltip>
  );
}

export default function Home() {
  const [selectedShape, setSelectedShape] = useState<SelectedShape | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(240);
  const [rightPanelWidth, setRightPanelWidth] = useState(280);
  const [searchQuery, setSearchQuery] = useState('');

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSelectionChange = useCallback((shape: SelectedShape | null) => {
    setSelectedShape(shape);
  }, []);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleLeftPanel = () => setIsLeftPanelOpen(!isLeftPanelOpen);
  const toggleRightPanel = () => setIsRightPanelOpen(!isRightPanelOpen);

  // Dynamic background color based on theme
  const canvasBgColor = isDarkMode ? '#252525' : '#fafafa';

  return (
    <TooltipProvider>
      <div className="zm-draw-editor">
        {/* Left Panel - Shapes */}
        {isLeftPanelOpen && (
          <>
            <aside className="zm-draw-left-panel" style={{ width: leftPanelWidth, minWidth: leftPanelWidth }}>
              {/* Panel Header with Close Button */}
              <div className="zm-draw-panel-header zm-shapes-header">
                <span>Shapes</span>
                <button className="zm-panel-close-button" onClick={toggleLeftPanel}>
                  <CloseIcon />
                </button>
              </div>

              {/* Search Bar */}
              <div className="zm-shapes-search">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search Shapes"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Shapes Content */}
              <div className="zm-draw-panel-content zm-shapes-content">
                {/* Connectors Section */}
                <CollapsibleSection title="Connectors">
                  <div className="zm-shapes-grid">
                    <ShapeButton icon={ShapeIcons.arrowRight} label="Arrow" />
                    <ShapeButton icon={ShapeIcons.arrowBidirectional} label="Bidirectional Arrow" />
                    <ShapeButton icon={ShapeIcons.arrowElbow} label="Elbow Arrow" />
                    <ShapeButton icon={ShapeIcons.line} label="Line" />
                  </div>
                </CollapsibleSection>

                {/* Basic Shapes Section */}
                <CollapsibleSection title="Basic">
                  <div className="zm-shapes-grid">
                    <ShapeButton icon={ShapeIcons.rectangle} label="Rectangle" />
                    <ShapeButton icon={ShapeIcons.roundedRect} label="Rounded Rectangle" />
                    <ShapeButton icon={ShapeIcons.circle} label="Circle" />
                    <ShapeButton icon={ShapeIcons.ellipse} label="Ellipse" />
                    <ShapeButton icon={ShapeIcons.triangle} label="Triangle" />
                    <ShapeButton icon={ShapeIcons.triangleDown} label="Triangle Down" />
                    <ShapeButton icon={ShapeIcons.diamond} label="Diamond" />
                    <ShapeButton icon={ShapeIcons.pentagon} label="Pentagon" />
                    <ShapeButton icon={ShapeIcons.hexagon} label="Hexagon" />
                    <ShapeButton icon={ShapeIcons.star} label="Star" />
                    <ShapeButton icon={ShapeIcons.cross} label="Cross" />
                  </div>
                </CollapsibleSection>

                {/* Flowchart Section */}
                <CollapsibleSection title="Flowchart">
                  <div className="zm-shapes-grid">
                    <ShapeButton icon={ShapeIcons.process} label="Process" />
                    <ShapeButton icon={ShapeIcons.decision} label="Decision" />
                    <ShapeButton icon={ShapeIcons.terminal} label="Terminal" />
                    <ShapeButton icon={ShapeIcons.document} label="Document" />
                    <ShapeButton icon={ShapeIcons.database} label="Database" />
                    <ShapeButton icon={ShapeIcons.parallelogram} label="Data" />
                  </div>
                </CollapsibleSection>

                {/* Other Libraries Section */}
                <CollapsibleSection title="Other libraries" defaultOpen={false}>
                  <div className="zm-library-list">
                    <div className="zm-library-item">
                      <span className="zm-library-icon">AWS</span>
                      <span className="zm-library-name">AWS</span>
                      <span className="zm-library-count">600 shapes</span>
                    </div>
                    <div className="zm-library-item">
                      <span className="zm-library-icon">Azure</span>
                      <span className="zm-library-name">Azure</span>
                      <span className="zm-library-count">411 shapes</span>
                    </div>
                    <div className="zm-library-item">
                      <span className="zm-library-icon">Cisco</span>
                      <span className="zm-library-name">Cisco</span>
                      <span className="zm-library-count">341 shapes</span>
                    </div>
                  </div>
                </CollapsibleSection>
              </div>
            </aside>
            <PanelResizer
              side="left"
              width={leftPanelWidth}
              minWidth={180}
              maxWidth={400}
              onWidthChange={setLeftPanelWidth}
            />
          </>
        )}

        {/* Canvas Area */}
        <div className="zm-draw-canvas-area">
          {/* Top Header Bar */}
          <div className="zm-draw-header">
            <div className="zm-draw-header-left">
              {!isLeftPanelOpen && (
                <Tooltip content="Show Shapes">
                  <button
                    className="zm-draw-icon-button"
                    onClick={toggleLeftPanel}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                    </svg>
                  </button>
                </Tooltip>
              )}
              <div className="zm-draw-header-title">
                <span className="zm-draw-logo">zm-draw</span>
                <span className="zm-draw-version">v0.1.0</span>
              </div>
            </div>
            <div className="zm-draw-header-actions">
              <Tooltip content={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
                <button
                  className="zm-draw-icon-button"
                  onClick={toggleDarkMode}
                >
                  {isDarkMode ? <SunIcon /> : <MoonIcon />}
                </button>
              </Tooltip>
              <Tooltip content={isRightPanelOpen ? 'Hide Design' : 'Show Design'}>
                <button
                  className={`zm-draw-icon-button ${isRightPanelOpen ? 'active' : ''}`}
                  onClick={toggleRightPanel}
                >
                  {isRightPanelOpen ? <PanelRightCloseIcon /> : <PanelRightIcon />}
                </button>
              </Tooltip>
            </div>
          </div>

        {/* Canvas - Infinite canvas fills available space */}
        <DrawCanvas
          backgroundColor={canvasBgColor}
          showGrid={true}
          gridSize={20}
          onSelectionChange={handleSelectionChange}
        />
      </div>

      {/* Right Panel - Properties */}
      {isRightPanelOpen && (
        <>
          <PanelResizer
            side="right"
            width={rightPanelWidth}
            minWidth={220}
            maxWidth={450}
            onWidthChange={setRightPanelWidth}
          />
          <aside className="zm-draw-right-panel" style={{ width: rightPanelWidth, minWidth: rightPanelWidth }}>
            <div className="zm-draw-panel-header">
              Design
            </div>
          <div className="zm-draw-panel-content">
            {selectedShape ? (
              <>
                {/* Position Section */}
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">Position</div>
                  <div className="zm-draw-panel-row">
                    <span className="zm-draw-panel-label">X</span>
                    <input
                      type="number"
                      className="zm-draw-panel-input"
                      value={Math.round(selectedShape.x)}
                      readOnly
                    />
                    <span className="zm-draw-panel-label">Y</span>
                    <input
                      type="number"
                      className="zm-draw-panel-input"
                      value={Math.round(selectedShape.y)}
                      readOnly
                    />
                  </div>
                </div>

                {/* Size Section */}
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">Size</div>
                  <div className="zm-draw-panel-row">
                    <span className="zm-draw-panel-label">W</span>
                    <input
                      type="number"
                      className="zm-draw-panel-input"
                      value={Math.round(selectedShape.width)}
                      readOnly
                    />
                    <span className="zm-draw-panel-label">H</span>
                    <input
                      type="number"
                      className="zm-draw-panel-input"
                      value={Math.round(selectedShape.height)}
                      readOnly
                    />
                  </div>
                </div>

                {/* Rotation Section */}
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">Rotation</div>
                  <div className="zm-draw-panel-row">
                    <span className="zm-draw-panel-label">R</span>
                    <input
                      type="number"
                      className="zm-draw-panel-input"
                      value={Math.round(selectedShape.rotation)}
                      readOnly
                    />
                    <span className="zm-draw-panel-label" style={{ minWidth: 'auto' }}>deg</span>
                  </div>
                </div>

                {/* Fill Section */}
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">Fill</div>
                  <div className="zm-draw-panel-row">
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        backgroundColor: selectedShape.fill,
                        border: '1px solid var(--zm-border)',
                      }}
                    />
                    <input
                      type="text"
                      className="zm-draw-panel-input"
                      value={selectedShape.fill}
                      readOnly
                    />
                  </div>
                </div>

                {/* Stroke Section */}
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">Stroke</div>
                  <div className="zm-draw-panel-row">
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        backgroundColor: selectedShape.stroke,
                        border: '1px solid var(--zm-border)',
                      }}
                    />
                    <input
                      type="text"
                      className="zm-draw-panel-input"
                      value={selectedShape.stroke}
                      readOnly
                    />
                  </div>
                </div>

                {/* Type Info */}
                <div className="zm-draw-panel-section">
                  <div className="zm-draw-panel-section-title">Info</div>
                  <div className="zm-draw-panel-row">
                    <span className="zm-draw-panel-label" style={{ minWidth: 'auto' }}>Type:</span>
                    <span style={{ fontSize: 12, color: 'var(--zm-text-secondary)' }}>
                      {selectedShape.type}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="zm-draw-empty-state">
                <div className="zm-draw-empty-state-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                  </svg>
                </div>
                <p>Select a shape to view<br />its properties</p>
              </div>
            )}
          </div>
        </aside>
        </>
      )}
      </div>
    </TooltipProvider>
  );
}
