'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';

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

export default function Home() {
  const [selectedShape, setSelectedShape] = useState<SelectedShape | null>(null);

  const handleSelectionChange = useCallback((shape: SelectedShape | null) => {
    setSelectedShape(shape);
  }, []);

  return (
    <div className="zm-draw-editor">
      {/* Canvas Area */}
      <div className="zm-draw-canvas-area">
        <DrawCanvas
          width={1200}
          height={800}
          backgroundColor="#252525"
          showGrid={true}
          gridSize={20}
          onSelectionChange={handleSelectionChange}
        />
      </div>

      {/* Right Panel - Properties */}
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
    </div>
  );
}
