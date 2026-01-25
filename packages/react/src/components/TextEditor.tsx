'use client';

import type { Shape } from '../types';

export interface TextEditorProps {
  /** The shape being edited */
  shape: Shape;
  /** Stage scale for positioning */
  stageScale: number;
  /** Stage position for offset */
  stagePosition: { x: number; y: number };
  /** Callback when text is submitted */
  onSubmit: (text: string) => void;
  /** Callback when editing is cancelled */
  onCancel: () => void;
}

/**
 * Text editing overlay for shapes
 * Positioned over the shape to allow inline text editing
 */
export function TextEditor({
  shape,
  stageScale,
  stagePosition,
  onSubmit,
  onCancel,
}: TextEditorProps) {
  return (
    <input
      type="text"
      autoFocus
      defaultValue={shape.text || ''}
      style={{
        position: 'absolute',
        left: shape.x * stageScale + stagePosition.x,
        top: shape.y * stageScale + stagePosition.y,
        width: shape.width * stageScale,
        height: shape.height * stageScale,
        fontSize: (shape.fontSize || 14) * stageScale,
        fontFamily: shape.fontFamily || 'Arial',
        textAlign: 'center',
        border: '2px solid #3b82f6',
        borderRadius: 4,
        outline: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        color: '#000000',
        padding: 0,
      }}
      onBlur={(e) => onSubmit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onSubmit((e.target as HTMLInputElement).value);
        } else if (e.key === 'Escape') {
          onCancel();
        }
      }}
    />
  );
}
