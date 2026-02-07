import type { Shape, Connector } from '../types';

export interface SerializedCanvas {
  shapes: Shape[];
  connectors: Connector[];
  version?: string;
}

/**
 * Serialize canvas state to a JSON-compatible object
 */
export function serializeCanvas(shapes: Shape[], connectors: Connector[]): SerializedCanvas {
  return {
    shapes,
    connectors,
    version: '1.0.0',
  };
}

/**
 * Deserialize canvas state from a JSON object
 */
export function deserializeCanvas(data: SerializedCanvas): { shapes: Shape[]; connectors: Connector[] } {
  return {
    shapes: data.shapes || [],
    connectors: data.connectors || [],
  };
}
