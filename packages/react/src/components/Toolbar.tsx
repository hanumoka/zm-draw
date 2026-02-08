'use client';

import { useState } from 'react';
import type { ToolType, StampType } from '../types';
import { STAMP_EMOJIS } from '../types';
import type { TidyUpLayout } from '../utils/tidyUp';

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
  /** Add image from file */
  onAddImage?: () => void;
  /** Current stamp type */
  currentStampType?: StampType;
  /** Callback when stamp type changes */
  onStampTypeChange?: (type: StampType) => void;
  /** Add stamp at center of viewport */
  onAddStamp?: () => void;
  /** Toggle comment panel */
  onToggleComments?: () => void;
  /** Whether comment panel is open */
  isCommentPanelOpen?: boolean;
  /** Number of unresolved comments */
  commentCount?: number;
  /** Tidy up selected shapes */
  onTidyUp?: (layout: TidyUpLayout) => void;
  /** Number of selected shapes (for tidy up button state) */
  selectedCount?: number;
  /** Toolbar variant: 'full' shows all buttons, 'figjam' shows minimal 9-button bar */
  variant?: 'full' | 'figjam';
  /** Toggle shapes panel (figjam variant) */
  onShapesToggle?: () => void;
  /** Whether shapes panel is open (figjam variant) */
  isShapesPanelOpen?: boolean;
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
  text: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
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
  image: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  comment: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  section: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" />
      <line x1="3" y1="9" x2="7" y2="9" />
    </svg>
  ),
  tidyUp: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
};

// FigJam variant icons
const FigJamIcons = {
  hand: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-4 0v1" />
      <path d="M14 7V4a2 2 0 0 0-4 0v6" />
      <path d="M10 10V5a2 2 0 0 0-4 0v9" />
      <path d="M18 11a2 2 0 0 1 4 0v3a8 8 0 0 1-8 8h-2c-2.5 0-4.3-1-5.7-2.8L3.8 16a2 2 0 0 1 3-2.5L8 15" />
    </svg>
  ),
  shapesStacked: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="14" height="12" rx="2" />
      <circle cx="14" cy="18" r="4" />
    </svg>
  ),
  connectorCurved: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="19" r="2.5" />
      <path d="M7.5 17L18 6" />
      <polyline points="13 5 19 5 19 11" />
    </svg>
  ),
  sticky: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" />
      <polyline points="14 3 14 9 21 9" />
    </svg>
  ),
  pen: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  ),
  table: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  widgets: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="2" width="6" height="6" rx="1" transform="rotate(45 9 5)" />
      <rect x="12" y="2" width="6" height="6" rx="1" transform="rotate(45 15 5)" />
      <rect x="6" y="10" width="6" height="6" rx="1" transform="rotate(45 9 13)" />
      <rect x="12" y="10" width="6" height="6" rx="1" transform="rotate(45 15 13)" />
    </svg>
  ),
  more: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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
  onAddImage,
  currentStampType = 'thumbsUp',
  onStampTypeChange,
  onAddStamp,
  onToggleComments,
  isCommentPanelOpen,
  commentCount = 0,
  onTidyUp,
  selectedCount = 0,
  variant = 'full',
  onShapesToggle,
  isShapesPanelOpen,
}: ToolbarProps) {
  const [showStampPicker, setShowStampPicker] = useState(false);
  const [showTidyUpMenu, setShowTidyUpMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleStampSelect = (type: StampType) => {
    onStampTypeChange?.(type);
    setShowStampPicker(false);
    onAddStamp?.();
  };

  // FigJam variant: Figma-style pill toolbar
  if (variant === 'figjam') {
    // FigJam button style: 36x36 with 8px active radius
    const fjBtnSize = 36;
    const fjActiveRadius = 8;
    const fjAccent = 'var(--zm-accent, #9747ff)';

    const fjBtnStyle = (isActive?: boolean): React.CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: fjBtnSize,
      height: fjBtnSize,
      padding: 0,
      backgroundColor: isActive ? fjAccent : 'transparent',
      border: 'none',
      borderRadius: fjActiveRadius,
      color: isActive ? '#ffffff' : 'var(--zm-text-secondary, #6b6b6b)',
      cursor: 'pointer',
      transition: 'all 0.12s ease',
    });

    const fjHover = (e: React.MouseEvent<HTMLButtonElement>, isActive?: boolean) => {
      if (!isActive) {
        e.currentTarget.style.backgroundColor = 'var(--zm-bg-hover, #f0f0f0)';
        e.currentTarget.style.color = 'var(--zm-text-primary, #1e1e1e)';
      }
    };

    const fjLeave = (e: React.MouseEvent<HTMLButtonElement>, isActive?: boolean) => {
      if (!isActive) {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'var(--zm-text-secondary, #6b6b6b)';
      }
    };

    const fjPress = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = 'scale(0.95)';
    };

    const fjRelease = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = 'scale(1)';
    };

    return (
      <div className="zm-toolbar" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '8px 10px',
        backgroundColor: 'var(--zm-bg-primary, #ffffff)',
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 0 0 1px var(--zm-border, #e5e5e5)',
      }}>
        {/* Group 1: Navigation — Cursor + Hand */}
        <button
          onClick={() => setTool('select')}
          title="Select (V)"
          style={fjBtnStyle(tool === 'select')}
          onMouseEnter={(e) => fjHover(e, tool === 'select')}
          onMouseLeave={(e) => fjLeave(e, tool === 'select')}
          onMouseDown={fjPress}
          onMouseUp={fjRelease}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={tool === 'select' ? '#ffffff' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            <path d="M13 13l6 6" />
          </svg>
        </button>

        <button
          onClick={() => { /* Hand/pan — visual only, will be wired later */ }}
          title="Hand (H) — Pan with Space+drag"
          style={fjBtnStyle(false)}
          onMouseEnter={(e) => fjHover(e, false)}
          onMouseLeave={(e) => fjLeave(e, false)}
          onMouseDown={fjPress}
          onMouseUp={fjRelease}
        >
          {FigJamIcons.hand}
        </button>

        <Divider />

        {/* Group 2: Drawing — Marker/Pen */}
        <button
          onClick={() => setTool('pen')}
          title="Pen (P)"
          style={fjBtnStyle(tool === 'pen')}
          onMouseEnter={(e) => fjHover(e, tool === 'pen')}
          onMouseLeave={(e) => fjLeave(e, tool === 'pen')}
          onMouseDown={fjPress}
          onMouseUp={fjRelease}
        >
          {FigJamIcons.pen}
        </button>

        <Divider />

        {/* Group 3: Creation — Shapes + Connector */}
        <button
          onClick={() => onShapesToggle?.()}
          title="Shapes"
          style={fjBtnStyle(isShapesPanelOpen)}
          onMouseEnter={(e) => fjHover(e, isShapesPanelOpen)}
          onMouseLeave={(e) => fjLeave(e, isShapesPanelOpen)}
          onMouseDown={fjPress}
          onMouseUp={fjRelease}
        >
          {FigJamIcons.shapesStacked}
        </button>

        <button
          onClick={() => { setTool('connector'); cancelConnecting(); }}
          title="Connector (C)"
          style={fjBtnStyle(tool === 'connector')}
          onMouseEnter={(e) => fjHover(e, tool === 'connector')}
          onMouseLeave={(e) => fjLeave(e, tool === 'connector')}
          onMouseDown={fjPress}
          onMouseUp={fjRelease}
        >
          {FigJamIcons.connectorCurved}
        </button>

        <Divider />

        {/* Group 4: Objects — Text, Sticky, Table, Stamp, Comment, Widgets */}
        <button
          onClick={() => setTool('text')}
          title="Text (T)"
          style={fjBtnStyle(tool === 'text')}
          onMouseEnter={(e) => fjHover(e, tool === 'text')}
          onMouseLeave={(e) => fjLeave(e, tool === 'text')}
          onMouseDown={fjPress}
          onMouseUp={fjRelease}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 7 4 4 20 4 20 7" />
            <line x1="9" y1="20" x2="15" y2="20" />
            <line x1="12" y1="4" x2="12" y2="20" />
          </svg>
        </button>

        <button
          onClick={() => setTool('sticky')}
          title="Sticky Note (S)"
          style={fjBtnStyle(tool === 'sticky')}
          onMouseEnter={(e) => fjHover(e, tool === 'sticky')}
          onMouseLeave={(e) => fjLeave(e, tool === 'sticky')}
          onMouseDown={fjPress}
          onMouseUp={fjRelease}
        >
          {FigJamIcons.sticky}
        </button>

        <button
          onClick={() => setTool('table')}
          title="Table"
          style={fjBtnStyle(tool === 'table')}
          onMouseEnter={(e) => fjHover(e, tool === 'table')}
          onMouseLeave={(e) => fjLeave(e, tool === 'table')}
          onMouseDown={fjPress}
          onMouseUp={fjRelease}
        >
          {FigJamIcons.table}
        </button>

        {/* Stamp with picker */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowStampPicker(!showStampPicker)}
            title="Stamp (1-8)"
            style={{
              ...fjBtnStyle(tool === 'stamp'),
              fontSize: 18,
            }}
            onMouseEnter={(e) => fjHover(e, tool === 'stamp')}
            onMouseLeave={(e) => fjLeave(e, tool === 'stamp')}
            onMouseDown={fjPress}
            onMouseUp={fjRelease}
          >
            {STAMP_EMOJIS[currentStampType]}
          </button>
          {showStampPicker && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: 8,
              padding: 8,
              backgroundColor: 'var(--zm-bg-primary, #ffffff)',
              borderRadius: 12,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--zm-border, #e5e5e5)',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 4,
              zIndex: 1000,
            }}>
              {(Object.keys(STAMP_EMOJIS) as StampType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleStampSelect(type)}
                  style={{
                    width: 36,
                    height: 36,
                    padding: 0,
                    backgroundColor: currentStampType === type ? fjAccent : 'transparent',
                    border: 'none',
                    borderRadius: fjActiveRadius,
                    fontSize: 20,
                    cursor: 'pointer',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (currentStampType !== type) {
                      e.currentTarget.style.backgroundColor = 'var(--zm-bg-hover, #f0f0f0)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentStampType !== type) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  title={type}
                >
                  {STAMP_EMOJIS[type]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comment */}
        <button
          onClick={() => onToggleComments?.()}
          title="Comments"
          style={fjBtnStyle(isCommentPanelOpen)}
          onMouseEnter={(e) => fjHover(e, isCommentPanelOpen)}
          onMouseLeave={(e) => fjLeave(e, isCommentPanelOpen)}
          onMouseDown={fjPress}
          onMouseUp={fjRelease}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        {/* Widgets */}
        <button
          onClick={() => { /* Widgets — visual only for now */ }}
          title="Widgets"
          style={fjBtnStyle(false)}
          onMouseEnter={(e) => fjHover(e, false)}
          onMouseLeave={(e) => fjLeave(e, false)}
          onMouseDown={fjPress}
          onMouseUp={fjRelease}
        >
          {FigJamIcons.widgets}
        </button>

        <Divider />

        {/* Group 5: Add (+) — dark filled circular button with overflow menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            title="More actions"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              padding: 0,
              backgroundColor: showMoreMenu ? fjAccent : '#333333',
              border: 'none',
              borderRadius: '50%',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.12s ease',
            }}
            onMouseEnter={(e) => {
              if (!showMoreMenu) {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
              }
            }}
            onMouseLeave={(e) => {
              if (!showMoreMenu) {
                e.currentTarget.style.backgroundColor = '#333333';
              }
            }}
            onMouseDown={fjPress}
            onMouseUp={fjRelease}
          >
            {FigJamIcons.more}
          </button>
          {showMoreMenu && (
            <div className="zm-toolbar-overflow-menu" style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              marginBottom: 8,
              padding: 4,
              backgroundColor: 'var(--zm-bg-primary, #ffffff)',
              borderRadius: 12,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--zm-border, #e5e5e5)',
              zIndex: 1000,
              minWidth: 180,
            }}>
              <OverflowMenuItem
                icon={Icons.undo}
                label="Undo"
                shortcut="Ctrl+Z"
                disabled={!canUndo}
                onClick={() => { onUndo(); setShowMoreMenu(false); }}
              />
              <OverflowMenuItem
                icon={Icons.redo}
                label="Redo"
                shortcut="Ctrl+Shift+Z"
                disabled={!canRedo}
                onClick={() => { onRedo(); setShowMoreMenu(false); }}
              />
              <div style={{ height: 1, backgroundColor: 'var(--zm-border, #e5e5e5)', margin: '4px 8px' }} />
              <OverflowMenuItem
                icon={Icons.trash}
                label="Delete"
                shortcut="Del"
                disabled={!hasSelection}
                onClick={() => { onDelete(); setShowMoreMenu(false); }}
              />
              <div style={{ height: 1, backgroundColor: 'var(--zm-border, #e5e5e5)', margin: '4px 8px' }} />
              <OverflowMenuItem
                icon={Icons.download}
                label="Save"
                shortcut="Ctrl+S"
                onClick={() => { onSave(); setShowMoreMenu(false); }}
              />
              <OverflowMenuItem
                icon={Icons.upload}
                label="Load"
                shortcut="Ctrl+O"
                onClick={() => { onLoad(); setShowMoreMenu(false); }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full variant (default) — existing toolbar
  return (
    <div className="zm-toolbar" style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      backgroundColor: 'var(--zm-bg-primary, #ffffff)',
      borderRadius: 12,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 0 0 1px var(--zm-border, #e5e5e5)',
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
          icon={Icons.text}
          label="Text"
          shortcut="T"
          active={tool === 'text'}
          onClick={() => setTool('text')}
        />
        <ToolButton
          icon={Icons.image}
          label="Image"
          shortcut="I"
          active={tool === 'image'}
          onClick={() => onAddImage?.()}
        />
        <ToolButton
          icon={Icons.connector}
          label="Connector"
          shortcut="C"
          active={tool === 'connector'}
          onClick={() => { setTool('connector'); cancelConnecting(); }}
        />
        <ToolButton
          icon={Icons.section}
          label="Section"
          shortcut="Shift+S"
          active={tool === 'section'}
          onClick={() => setTool('section')}
        />
        {/* Stamp button with picker */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowStampPicker(!showStampPicker)}
            title="Stamp (1-8)"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              padding: 0,
              backgroundColor: tool === 'stamp' ? 'var(--zm-accent, #9747ff)' : 'transparent',
              border: 'none',
              borderRadius: 4,
              fontSize: 18,
              cursor: 'pointer',
              transition: 'all 0.12s ease',
            }}
            onMouseEnter={(e) => {
              if (tool !== 'stamp') {
                e.currentTarget.style.backgroundColor = 'var(--zm-bg-hover, #f0f0f0)';
              }
            }}
            onMouseLeave={(e) => {
              if (tool !== 'stamp') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {STAMP_EMOJIS[currentStampType]}
          </button>
          {showStampPicker && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: 8,
              padding: 8,
              backgroundColor: 'var(--zm-bg-primary, #ffffff)',
              borderRadius: 12,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--zm-border, #e5e5e5)',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 4,
              zIndex: 1000,
            }}>
              {(Object.keys(STAMP_EMOJIS) as StampType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleStampSelect(type)}
                  style={{
                    width: 36,
                    height: 36,
                    padding: 0,
                    backgroundColor: currentStampType === type ? 'var(--zm-accent, #9747ff)' : 'transparent',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 20,
                    cursor: 'pointer',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (currentStampType !== type) {
                      e.currentTarget.style.backgroundColor = 'var(--zm-bg-hover, #f0f0f0)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentStampType !== type) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  title={type}
                >
                  {STAMP_EMOJIS[type]}
                </button>
              ))}
            </div>
          )}
        </div>
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
          borderRadius: 6,
          color: scale === 1 ? 'var(--zm-text-muted, #999999)' : 'var(--zm-text-secondary, #6b6b6b)',
          fontSize: 12,
          fontWeight: 500,
          cursor: scale === 1 ? 'default' : 'pointer',
          transition: 'all 0.15s',
          minWidth: 48,
        }}
        title="Reset zoom"
        onMouseEnter={(e) => {
          if (scale !== 1) {
            e.currentTarget.style.backgroundColor = 'var(--zm-bg-hover, #f0f0f0)';
            e.currentTarget.style.color = 'var(--zm-text-primary, #1e1e1e)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = scale === 1 ? 'var(--zm-text-muted, #999999)' : 'var(--zm-text-secondary, #6b6b6b)';
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

      {/* Tidy Up */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowTidyUpMenu(!showTidyUpMenu)}
          disabled={selectedCount < 2}
          title="Tidy Up"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            padding: 0,
            backgroundColor: showTidyUpMenu ? 'var(--zm-accent, #9747ff)' : 'transparent',
            border: 'none',
            borderRadius: 6,
            color: selectedCount < 2 ? 'var(--zm-text-muted, #999999)' : showTidyUpMenu ? '#ffffff' : 'var(--zm-text-secondary, #6b6b6b)',
            cursor: selectedCount < 2 ? 'not-allowed' : 'pointer',
            transition: 'all 0.12s ease',
          }}
          onMouseEnter={(e) => {
            if (selectedCount >= 2 && !showTidyUpMenu) {
              e.currentTarget.style.backgroundColor = 'var(--zm-bg-hover, #f0f0f0)';
              e.currentTarget.style.color = 'var(--zm-text-primary, #1e1e1e)';
            }
          }}
          onMouseLeave={(e) => {
            if (!showTidyUpMenu) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = selectedCount < 2 ? 'var(--zm-text-muted, #999999)' : 'var(--zm-text-secondary, #6b6b6b)';
            }
          }}
        >
          {Icons.tidyUp}
        </button>
        {showTidyUpMenu && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            padding: 4,
            backgroundColor: 'var(--zm-bg-primary, #ffffff)',
            borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--zm-border, #e5e5e5)',
            zIndex: 1000,
            minWidth: 120,
          }}>
            {(['grid', 'horizontal', 'vertical', 'circle'] as const).map((layout) => (
              <button
                key={layout}
                onClick={() => {
                  onTidyUp?.(layout);
                  setShowTidyUpMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: 4,
                  color: 'var(--zm-text-secondary, #6b6b6b)',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                  textTransform: 'capitalize',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--zm-bg-hover, #f0f0f0)';
                  e.currentTarget.style.color = 'var(--zm-text-primary, #1e1e1e)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--zm-text-secondary, #6b6b6b)';
                }}
              >
                {layout === 'grid' && <GridIcon />}
                {layout === 'horizontal' && <HorizontalIcon />}
                {layout === 'vertical' && <VerticalIcon />}
                {layout === 'circle' && <CircleIcon />}
                {layout}
              </button>
            ))}
          </div>
        )}
      </div>

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

      <Divider />

      {/* Comments */}
      <div style={{ position: 'relative' }}>
        <ToolButton
          icon={Icons.comment}
          label="Comments"
          active={isCommentPanelOpen}
          onClick={() => onToggleComments?.()}
        />
        {commentCount > 0 && (
          <div style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 16,
            height: 16,
            backgroundColor: '#ef4444',
            borderRadius: '50%',
            fontSize: 10,
            fontWeight: 600,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            {commentCount > 9 ? '9+' : commentCount}
          </div>
        )}
      </div>
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
      backgroundColor: 'var(--zm-bg-secondary, #f5f5f5)',
      borderRadius: 8,
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
    if (active) return 'var(--zm-accent, #9747ff)';
    return 'transparent';
  };

  const getColor = () => {
    if (disabled) return 'var(--zm-text-muted, #999999)';
    if (active) return '#ffffff';
    if (danger) return 'var(--zm-text-secondary, #6b6b6b)';
    return 'var(--zm-text-secondary, #6b6b6b)';
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
            ? 'rgba(239, 68, 68, 0.1)'
            : 'var(--zm-bg-hover, #f0f0f0)';
          e.currentTarget.style.color = danger
            ? '#ef4444'
            : 'var(--zm-text-primary, #1e1e1e)';
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
      backgroundColor: 'var(--zm-border, #e5e5e5)',
      margin: '0 6px',
    }} />
  );
}

/** Grid layout icon for tidy up */
function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

/** Horizontal layout icon for tidy up */
function HorizontalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="8" width="5" height="8" rx="1" />
      <rect x="10" y="8" width="5" height="8" rx="1" />
      <rect x="17" y="8" width="5" height="8" rx="1" />
    </svg>
  );
}

/** Vertical layout icon for tidy up */
function VerticalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="8" y="3" width="8" height="5" rx="1" />
      <rect x="8" y="10" width="8" height="5" rx="1" />
      <rect x="8" y="17" width="8" height="5" rx="1" />
    </svg>
  );
}

/** Circle layout icon for tidy up */
function CircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="5" r="2" fill="currentColor" />
      <circle cx="18" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="19" r="2" fill="currentColor" />
      <circle cx="6" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

/** Overflow menu item for FigJam More(+) button */
function OverflowMenuItem({
  icon,
  label,
  shortcut,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '8px 12px',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: 6,
        color: disabled ? 'var(--zm-text-muted, #999999)' : 'var(--zm-text-secondary, #6b6b6b)',
        fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.1s',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = 'var(--zm-bg-hover, #f0f0f0)';
          e.currentTarget.style.color = 'var(--zm-text-primary, #1e1e1e)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = disabled ? 'var(--zm-text-muted, #999999)' : 'var(--zm-text-secondary, #6b6b6b)';
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', width: 16 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {shortcut && (
        <span style={{ fontSize: 11, color: 'var(--zm-text-muted, #999999)' }}>{shortcut}</span>
      )}
    </button>
  );
}
