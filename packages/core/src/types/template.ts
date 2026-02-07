import type { Shape } from './shape';
import type { Connector } from './connector';

/**
 * Template category for organizing templates
 */
export type TemplateCategory = 'brainstorm' | 'meeting' | 'planning' | 'retro' | 'flowchart' | 'custom';

/**
 * Template for quick canvas initialization
 */
export interface Template {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Brief description */
  description: string;
  /** Category for filtering */
  category: TemplateCategory;
  /** Thumbnail emoji or icon */
  thumbnail: string;
  /** Template data */
  data: {
    shapes: Shape[];
    connectors: Connector[];
  };
  /** Whether this is a built-in template */
  isBuiltIn?: boolean;
}
