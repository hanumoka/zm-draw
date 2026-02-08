/** Connection point position on a shape */
export type ConnectionPoint = 'top' | 'right' | 'bottom' | 'left' | 'auto';

/** Arrow head type */
export type ArrowType = 'none' | 'arrow' | 'triangle' | 'diamond' | 'circle';

/** Connector routing type */
export type RoutingType = 'straight' | 'orthogonal';

/** Connector variant for toolbar selection */
export type ConnectorVariant = 'arrow' | 'bidirectional' | 'elbow' | 'line';

/**
 * Connector object representing a line/arrow between two shapes
 */
export interface Connector {
  /** Unique identifier */
  id: string;
  /** ID of the source shape (optional for free-floating endpoints) */
  fromShapeId?: string;
  /** ID of the target shape (optional for free-floating endpoints) */
  toShapeId?: string;
  /** Free-floating start position (used when fromShapeId is absent) */
  fromPos?: { x: number; y: number };
  /** Free-floating end position (used when toShapeId is absent) */
  toPos?: { x: number; y: number };
  /** Line color (hex or rgba) */
  stroke: string;
  /** Line width in pixels */
  strokeWidth: number;
  /** Whether to show arrowhead (deprecated: use arrowEnd) */
  arrow: boolean;
  /** Line style */
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  /** Label text on the connector */
  label?: string;
  /** Connection point on source shape */
  fromPoint?: ConnectionPoint;
  /** Connection point on target shape */
  toPoint?: ConnectionPoint;
  /** Arrow type at start */
  arrowStart?: ArrowType;
  /** Arrow type at end */
  arrowEnd?: ArrowType;
  /** Routing type */
  routing?: RoutingType;
}
