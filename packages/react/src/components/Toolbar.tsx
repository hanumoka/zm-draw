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

// Icons
const Icons = {
  cursor: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  ),
  rectangle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  ellipse: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="12" rx="10" ry="8" />
    </svg>
  ),
  diamond: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="1" transform="rotate(45 12 12)" />
    </svg>
  ),
  connector: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  trash: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  undo: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  ),
  redo: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
    </svg>
  ),
  zoomIn: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  download: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  upload: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
};

/**
 * Figma-style Toolbar component for DrawCanvas
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
    <div className="zm-toolbar" style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 8px',
      backgroundColor: 'var(--zm-bg-secondary, #2c2c2c)',
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--zm-border, #3c3c3c)',
    }}>
      {/* Tool Selection Group */}
      <ToolGroup>
        <ToolButton
          icon={Icons.cursor}
          label="Select"
          shortcut="V"
          active={tool === 'select'}
          onClick={() => setTool('select')}
        />
        <ToolButton
          icon={Icons.rectangle}
          label="Rectangle"
          shortcut="R"
          active={tool === 'rectangle'}
          onClick={() => setTool('rectangle')}
        />
        <ToolButton
          icon={Icons.ellipse}
          label="Ellipse"
          shortcut="O"
          active={tool === 'ellipse'}
          onClick={() => setTool('ellipse')}
        />
        <ToolButton
          icon={Icons.diamond}
          label="Diamond"
          shortcut="D"
          active={tool === 'diamond'}
          onClick={() => setTool('diamond')}
        />
        <ToolButton
          icon={Icons.connector}
          label={connectingFrom ? 'Click target...' : 'Connector'}
          shortcut="C"
          active={tool === 'connector'}
          onClick={() => { setTool('connector'); cancelConnecting(); }}
        />
      </ToolGroup>

      <Divider />

      {/* History Group */}
      <ToolGroup>
        <ToolButton
          icon={Icons.undo}
          label="Undo"
          shortcut="Ctrl+Z"
          disabled={!canUndo}
          onClick={onUndo}
        />
        <ToolButton
          icon={Icons.redo}
          label="Redo"
          shortcut="Ctrl+Y"
          disabled={!canRedo}
          onClick={onRedo}
        />
      </ToolGroup>

      <Divider />

      {/* Zoom Display */}
      <button
        onClick={onResetZoom}
        disabled={scale === 1}
        style={{
          padding: '6px 10px',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: 4,
          color: scale === 1 ? 'var(--zm-text-muted, #6b6b6b)' : 'var(--zm-text-secondary, #a0a0a0)',
          fontSize: 12,
          fontWeight: 500,
          cursor: scale === 1 ? 'default' : 'pointer',
          transition: 'all 0.15s',
          minWidth: 48,
        }}
        title="Reset zoom"
        onMouseEnter={(e) => {
          if (scale !== 1) {
            e.currentTarget.style.backgroundColor = 'var(--zm-bg-tertiary, #383838)';
            e.currentTarget.style.color = 'var(--zm-text-primary, #ffffff)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = scale === 1 ? 'var(--zm-text-muted, #6b6b6b)' : 'var(--zm-text-secondary, #a0a0a0)';
        }}
      >
        {Math.round(scale * 100)}%
      </button>

      <Divider />

      {/* Actions Group */}
      <ToolGroup>
        <ToolButton
          icon={Icons.trash}
          label="Delete"
          shortcut="Del"
          disabled={!hasSelection}
          danger
          onClick={onDelete}
        />
      </ToolGroup>

      <Divider />

      {/* File Group */}
      <ToolGroup>
        <ToolButton
          icon={Icons.download}
          label="Save"
          shortcut="Ctrl+S"
          onClick={onSave}
        />
        <ToolButton
          icon={Icons.upload}
          label="Load"
          shortcut="Ctrl+O"
          onClick={onLoad}
        />
      </ToolGroup>
    </div>
  );
}

/** Tool button group container */
function ToolGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      padding: '2px',
      backgroundColor: 'var(--zm-bg-tertiary, #383838)',
      borderRadius: 6,
    }}>
      {children}
    </div>
  );
}

/** Individual tool button */
function ToolButton({
  icon,
  label,
  shortcut,
  active,
  disabled,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  const getBackgroundColor = () => {
    if (disabled) return 'transparent';
    if (active) return 'var(--zm-accent, #0d99ff)';
    return 'transparent';
  };

  const getColor = () => {
    if (disabled) return 'var(--zm-text-muted, #6b6b6b)';
    if (active) return '#ffffff';
    if (danger) return 'var(--zm-text-secondary, #a0a0a0)';
    return 'var(--zm-text-secondary, #a0a0a0)';
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${label} (${shortcut})` : label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        padding: 0,
        backgroundColor: getBackgroundColor(),
        border: 'none',
        borderRadius: 4,
        color: getColor(),
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.12s ease',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !active) {
          e.currentTarget.style.backgroundColor = danger
            ? 'rgba(239, 68, 68, 0.15)'
            : 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.color = danger
            ? '#ef4444'
            : 'var(--zm-text-primary, #ffffff)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !active) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = getColor();
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(0.95)';
        }
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {icon}
    </button>
  );
}

/** Vertical divider between button groups */
function Divider() {
  return (
    <div style={{
      width: 1,
      height: 20,
      backgroundColor: 'var(--zm-border, #3c3c3c)',
      margin: '0 4px',
    }} />
  );
}
