'use client';

import type { ToolType } from '../types';

export interface ToolbarProps {
  /** Current selected tool */
  tool: ToolType;
  /** Set current tool */
  setTool: (tool: ToolType) => void;
  /** ID of connecting shape (null when not connecting) */
  connectingFrom: string | null;
  /** Cancel connecting mode */
  cancelConnecting: () => void;
  /** Whether a shape is selected */
  hasSelection: boolean;
  /** Delete selected shape */
  onDelete: () => void;
  /** Number of shapes on canvas */
  shapeCount: number;
  /** Clear all shapes */
  onClearAll: () => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Undo action */
  onUndo: () => void;
  /** Whether redo is available */
  canRedo: boolean;
  /** Redo action */
  onRedo: () => void;
  /** Current zoom scale (1 = 100%) */
  scale: number;
  /** Reset zoom to 100% */
  onResetZoom: () => void;
  /** Export to JSON */
  onSave: () => void;
  /** Import from JSON */
  onLoad: () => void;
}

// Button style helper
const getButtonStyle = (active: boolean, disabled?: boolean, variant?: 'danger' | 'success') => ({
  padding: '8px 16px',
  border: '1px solid var(--zm-border, #3c3c3c)',
  borderRadius: 6,
  backgroundColor: disabled
    ? 'var(--zm-bg-tertiary, #383838)'
    : active
      ? variant === 'success' ? '#22c55e' : variant === 'danger' ? '#ef4444' : 'var(--zm-accent, #0d99ff)'
      : 'var(--zm-bg-tertiary, #383838)',
  color: disabled
    ? 'var(--zm-text-muted, #6b6b6b)'
    : active ? '#fff' : 'var(--zm-text-secondary, #a0a0a0)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: 12,
  transition: 'all 0.15s',
});

/**
 * Toolbar component for DrawCanvas
 * Contains tool buttons, editing actions, undo/redo, zoom, and save/load
 */
export function Toolbar({
  tool,
  setTool,
  connectingFrom,
  cancelConnecting,
  hasSelection,
  onDelete,
  shapeCount,
  onClearAll,
  canUndo,
  onUndo,
  canRedo,
  onRedo,
  scale,
  onResetZoom,
  onSave,
  onLoad,
}: ToolbarProps) {
  return (
    <div className="zm-draw-toolbar" style={{
      padding: '8px 12px',
      display: 'flex',
      gap: 4,
      flexWrap: 'nowrap',
      backgroundColor: 'var(--zm-bg-secondary, #2c2c2c)',
      border: '1px solid var(--zm-border, #3c3c3c)',
      borderRadius: 12,
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
    }}>
      {/* Tool Selection */}
      <button onClick={() => setTool('select')} style={getButtonStyle(tool === 'select')}>
        Select
      </button>
      <button onClick={() => setTool('rectangle')} style={getButtonStyle(tool === 'rectangle')}>
        Rectangle
      </button>
      <button onClick={() => setTool('ellipse')} style={getButtonStyle(tool === 'ellipse')}>
        Ellipse
      </button>
      <button onClick={() => setTool('diamond')} style={getButtonStyle(tool === 'diamond')}>
        Diamond
      </button>
      <button
        onClick={() => { setTool('connector'); cancelConnecting(); }}
        style={getButtonStyle(tool === 'connector', false, 'success')}
      >
        {connectingFrom ? 'Click target...' : 'Connector'}
      </button>

      <Divider />

      {/* Edit Actions */}
      <button
        onClick={onDelete}
        disabled={!hasSelection}
        style={getButtonStyle(hasSelection, !hasSelection, 'danger')}
      >
        Delete
      </button>
      <button
        onClick={onClearAll}
        disabled={shapeCount === 0}
        style={getButtonStyle(false, shapeCount === 0)}
      >
        Clear All
      </button>

      <Divider />

      {/* Undo/Redo */}
      <button onClick={onUndo} disabled={!canUndo} style={getButtonStyle(false, !canUndo)}>
        Undo
      </button>
      <button onClick={onRedo} disabled={!canRedo} style={getButtonStyle(false, !canRedo)}>
        Redo
      </button>

      <Divider />

      {/* Zoom */}
      <span style={{
        padding: '8px 12px',
        color: 'var(--zm-text-secondary, #a0a0a0)',
        fontSize: 12,
      }}>
        {Math.round(scale * 100)}%
      </span>
      <button onClick={onResetZoom} disabled={scale === 1} style={getButtonStyle(false, scale === 1)}>
        Reset
      </button>

      <Divider />

      {/* Save/Load */}
      <button onClick={onSave} style={getButtonStyle(false)}>
        Save
      </button>
      <button onClick={onLoad} style={getButtonStyle(false)}>
        Load
      </button>
    </div>
  );
}

/** Vertical divider between button groups */
function Divider() {
  return (
    <div style={{ width: 1, backgroundColor: 'var(--zm-border, #3c3c3c)', margin: '0 8px' }} />
  );
}
