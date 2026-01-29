# @zm-draw/react

React components for zm-draw diagram editor - a FigJam-style collaborative whiteboard library.

## Installation

```bash
npm install @zm-draw/react
# or
pnpm add @zm-draw/react
```

## Quick Start

```tsx
import { DrawCanvas } from '@zm-draw/react';
import '@zm-draw/react/styles.css'; // Required for theming

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <DrawCanvas />
    </div>
  );
}
```

## Theming

### CSS Variables

Import the styles and set a theme:

```tsx
import '@zm-draw/react/styles.css';
import { DrawCanvas } from '@zm-draw/react';

// Light theme (default)
<DrawCanvas theme="light" />

// Dark theme
<DrawCanvas theme="dark" />

// Follow system preference
<DrawCanvas theme="system" />
```

### Custom Theme

Override CSS variables in your stylesheet:

```css
:root {
  /* Accent color */
  --zm-accent: #3b82f6;
  --zm-accent-hover: #2563eb;

  /* Backgrounds */
  --zm-bg-primary: #ffffff;
  --zm-bg-secondary: #f5f5f5;
  --zm-bg-canvas: #fafafa;

  /* Text */
  --zm-text-primary: #1e1e1e;
  --zm-text-secondary: #6b6b6b;

  /* Borders */
  --zm-border: #e5e5e5;

  /* See variables.css for full list */
}
```

### Available CSS Variables

| Variable | Description | Light Default |
|----------|-------------|---------------|
| `--zm-accent` | Primary accent color | `#9747ff` |
| `--zm-bg-primary` | Primary background | `#ffffff` |
| `--zm-bg-secondary` | Secondary background | `#f5f5f5` |
| `--zm-bg-canvas` | Canvas background | `#fafafa` |
| `--zm-text-primary` | Primary text color | `#1e1e1e` |
| `--zm-text-secondary` | Secondary text color | `#6b6b6b` |
| `--zm-border` | Border color | `#e5e5e5` |
| `--zm-radius-sm/md/lg` | Border radius | `4px/8px/12px` |
| `--zm-shadow-sm/md/lg` | Box shadows | Various |

## UI Customization

Control built-in UI visibility:

```tsx
<DrawCanvas
  UIOptions={{
    toolbar: true,           // Show/hide floating toolbar
    commentPanel: true,      // Show/hide comment panel
    collaborationIndicator: true, // Show/hide collaboration status
  }}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `'light' \| 'dark' \| 'system'` | - | Color theme |
| `className` | `string` | - | Additional CSS class |
| `UIOptions` | `DrawCanvasUIOptions` | - | UI visibility options |
| `backgroundColor` | `string` | `'#ffffff'` | Canvas background color |
| `showGrid` | `boolean` | `true` | Show grid |
| `gridSize` | `number` | `20` | Grid size in pixels |
| `snapToGrid` | `boolean` | `false` | Snap shapes to grid |
| `initialShapes` | `Shape[]` | `[]` | Initial shapes |
| `onShapesChange` | `(shapes: Shape[]) => void` | - | Shapes change callback |

## Exports

```tsx
// Components
export { DrawCanvas, Toolbar, TextEditor, Minimap, CommentPanel, SpotlightUI } from '@zm-draw/react';

// Types
export type {
  DrawCanvasProps,
  DrawCanvasTheme,
  DrawCanvasUIOptions,
  Shape,
  Connector,
  TableData,
  TableCell,
} from '@zm-draw/react';

// Stores (Zustand)
export {
  useCanvasStore,
  useSelectionStore,
  useToolStore,
  defaultShapeProps,
  defaultTableProps,
} from '@zm-draw/react';
```

## License

MIT
