'use client';

import { useState, useCallback } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { HexColorPicker, HexColorInput } from 'react-colorful';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorChange = useCallback((newColor: string) => {
    onChange(newColor);
  }, [onChange]);

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          className="zm-color-picker-trigger"
          style={{ backgroundColor: color }}
          aria-label={label || 'Pick a color'}
        >
          <span className="zm-color-picker-checkerboard" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="zm-color-picker-popover"
          side="left"
          sideOffset={8}
          align="start"
        >
          <HexColorPicker color={color} onChange={handleColorChange} />
          <div className="zm-color-picker-input-row">
            <span className="zm-color-picker-hash">#</span>
            <HexColorInput
              className="zm-color-picker-input"
              color={color}
              onChange={handleColorChange}
              prefixed={false}
            />
          </div>
          <Popover.Arrow className="zm-color-picker-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
