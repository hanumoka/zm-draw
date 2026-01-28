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
 * Supports rotation to match rotated shapes
 */
export function TextEditor({
  shape,
  stageScale,
  stagePosition,
  onSubmit,
  onCancel,
}: TextEditorProps) {
  const rotation = shape.rotation || 0;
  const scaledWidth = shape.width * stageScale;
  const scaledHeight = shape.height * stageScale;

  // Calculate the center position of the shape
  const centerX = shape.x * stageScale + stagePosition.x + scaledWidth / 2;
  const centerY = shape.y * stageScale + stagePosition.y + scaledHeight / 2;

  return (
    <input
      type="text"
      autoFocus
      defaultValue={shape.text || ''}
      style={{
        position: 'absolute',
        // Position from center, then offset by half width/height
        left: centerX - scaledWidth / 2,
        top: centerY - scaledHeight / 2,
        width: scaledWidth,
        height: scaledHeight,
        fontSize: (shape.fontSize || 14) * stageScale,
        fontFamily: shape.fontFamily || 'Arial',
        textAlign: 'center',
        border: '2px solid #3b82f6',
        borderRadius: 4,
        outline: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        color: '#000000',
        padding: 0,
        // Apply rotation around the center
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
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
