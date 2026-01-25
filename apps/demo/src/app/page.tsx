'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect } from 'react';
import { TooltipProvider, Tooltip } from '../components/Tooltip';

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

const PanelLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

const PanelLeftCloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <polyline points="14 9 11 12 14 15" />
  </svg>
);

const LayersIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

export default function Home() {
  const [selectedShape, setSelectedShape] = useState<SelectedShape | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

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
        {/* Left Panel - Layers */}
        {isLeftPanelOpen && (
          <aside className="zm-draw-left-panel">
            <div className="zm-draw-panel-header">
              Layers
            </div>
            <div className="zm-draw-panel-content">
              <div className="zm-draw-empty-state">
                <div className="zm-draw-empty-state-icon">
                  <LayersIcon />
                </div>
                <p>No layers yet.<br />Create shapes to see them here.</p>
              </div>
            </div>
          </aside>
        )}

        {/* Canvas Area */}
        <div className="zm-draw-canvas-area">
          {/* Top Header Bar */}
          <div className="zm-draw-header">
            <div className="zm-draw-header-left">
              <Tooltip content={isLeftPanelOpen ? 'Hide Layers' : 'Show Layers'}>
                <button
                  className={`zm-draw-icon-button ${isLeftPanelOpen ? 'active' : ''}`}
                  onClick={toggleLeftPanel}
                >
                  {isLeftPanelOpen ? <PanelLeftCloseIcon /> : <PanelLeftIcon />}
                </button>
              </Tooltip>
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
              <Tooltip content={isRightPanelOpen ? 'Hide Properties' : 'Show Properties'}>
                <button
                  className={`zm-draw-icon-button ${isRightPanelOpen ? 'active' : ''}`}
                  onClick={toggleRightPanel}
                >
                  {isRightPanelOpen ? <PanelRightCloseIcon /> : <PanelRightIcon />}
                </button>
              </Tooltip>
            </div>
          </div>

        {/* Canvas */}
        <DrawCanvas
          width={1200}
          height={800}
          backgroundColor={canvasBgColor}
          showGrid={true}
          gridSize={20}
          onSelectionChange={handleSelectionChange}
        />
      </div>

      {/* Right Panel - Properties */}
      {isRightPanelOpen && (
        <aside className="zm-draw-right-panel">
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
      )}
      </div>
    </TooltipProvider>
  );
}
