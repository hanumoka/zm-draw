'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface PanelResizerProps {
  /** Which side the panel is on */
  side: 'left' | 'right';
  /** Current panel width */
  width: number;
  /** Min width constraint */
  minWidth?: number;
  /** Max width constraint */
  maxWidth?: number;
  /** Callback when width changes */
  onWidthChange: (width: number) => void;
}

export function PanelResizer({
  side,
  width,
  minWidth = 200,
  maxWidth = 500,
  onWidthChange,
}: PanelResizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  }, [width]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = side === 'left'
        ? e.clientX - startXRef.current
        : startXRef.current - e.clientX;

      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + delta));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, side, minWidth, maxWidth, onWidthChange]);

  return (
    <div
      className={`zm-panel-resizer ${isDragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
      style={{
        width: 6,
        cursor: 'col-resize',
        backgroundColor: isDragging ? 'var(--zm-accent)' : 'transparent',
        transition: isDragging ? 'none' : 'background-color 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.backgroundColor = 'var(--zm-border-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    />
  );
}
